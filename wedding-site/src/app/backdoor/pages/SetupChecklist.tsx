import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowDown, ArrowLeft, ArrowUp, Check, ChevronDown, Clock, Eye, EyeOff,
  IndentDecrease, IndentIncrease, MapPin, Pencil, Plus, RotateCcw, Trash2, Users, X,
} from 'lucide-react';
import { BackdoorGate } from '../components/BackdoorGate';
import { API_BASE, SEATING_SECRET } from '../lib/backdoor';
import { SETUP_SEED } from '../data/setupChecklist';

// ── Model ─────────────────────────────────────────────────────────────────
// The whole checklist is one JSON document (days → sections → item trees).
// A parent item's checkbox is derived from its leaves; ticking it ticks them all.

interface Item { id: string; text: string; done: boolean; children: Item[] }
interface Section {
  id: string;
  title: string;
  when: string;
  where: string;
  who: string[];
  notes: string;
  link?: { label: string; href: string };
  items: Item[];
}
interface Day { id: string; date: string; title: string; sections: Section[] }
interface Doc { version: 1; days: Day[] }

const newId = () => Math.random().toString(36).slice(2, 10);

function parseOutline(text: string): Item[] {
  const root: Item[] = [];
  const stack: { depth: number; children: Item[] }[] = [{ depth: -1, children: root }];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const depth = Math.floor((line.length - line.trimStart().length) / 2);
    const item: Item = { id: newId(), text: line.trim(), done: false, children: [] };
    while (stack[stack.length - 1].depth >= depth) stack.pop();
    stack[stack.length - 1].children.push(item);
    stack.push({ depth, children: item.children });
  }
  return root;
}

function buildSeed(): Doc {
  return {
    version: 1,
    days: SETUP_SEED.map((d) => ({
      id: d.key,
      date: d.date,
      title: d.title,
      sections: d.sections.map((s) => ({
        id: newId(),
        title: s.title,
        when: s.when ?? '',
        where: s.where,
        who: s.who,
        notes: s.notes ?? '',
        link: s.link,
        items: parseOutline(s.items),
      })),
    })),
  };
}

function tally(items: Item[]): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const it of items) {
    if (it.children.length) {
      const t = tally(it.children);
      done += t.done;
      total += t.total;
    } else {
      total += 1;
      if (it.done) done += 1;
    }
  }
  return { done, total };
}

const isComplete = (it: Item) => (it.children.length ? it.children.every(isComplete) : it.done);

function setAll(it: Item, done: boolean) {
  it.done = done;
  it.children.forEach((c) => setAll(c, done));
}

interface Loc { list: Item[]; index: number; parent: Item | null }
function locate(items: Item[], id: string, parent: Item | null = null): Loc | null {
  for (let i = 0; i < items.length; i++) {
    if (items[i].id === id) return { list: items, index: i, parent };
    const found = locate(items[i].children, id, items[i]);
    if (found) return found;
  }
  return null;
}

// May be missing when an edit is replayed onto a copy where someone else
// deleted the section, so callers guard it.
const findSection = (doc: Doc, id: string): Section | undefined =>
  doc.days.flatMap((d) => d.sections).find((s) => s.id === id);

// ── Persistence ───────────────────────────────────────────────────────────
// Saved to this browser immediately, then (debounced) to the server as one
// document. The server refuses a write based on a stale version (409); every
// edit is an id-based mutation, so the unsent ones are replayed on top of the
// newer copy and saved again rather than lost. When the API isn't
// reachable (e.g. local dev before the /setup endpoint is deployed) the page
// keeps working off this browser's copy alone.

const LOCAL_KEY = 'baoben-setup-doc-v1';
const UI_KEY = 'baoben-setup-ui-v1';
const POLL_MS = 15000;

type SyncStatus = 'loading' | 'local' | 'saving' | 'synced' | 'offline';

interface LocalCopy { doc: Doc; baseUpdatedAt: string | null; pending: boolean }

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full/blocked */ }
}

async function fetchServer(): Promise<{ data: Doc | null; updatedAt: string | null } | null> {
  try {
    const res = await fetch(`${API_BASE}/setup`, { headers: { 'x-seating-secret': SEATING_SECRET } });
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function useSetupDoc() {
  const initial = useMemo(() => readJson<LocalCopy>(LOCAL_KEY), []);
  const [doc, setDoc] = useState<Doc>(() => initial?.doc ?? buildSeed());
  const [status, setStatus] = useState<SyncStatus>('loading');
  const docRef = useRef(doc);
  const serverMode = useRef(false);
  const baseUpdatedAt = useRef<string | null>(initial?.baseUpdatedAt ?? null);
  const pending = useRef(initial?.pending ?? false);
  const inflight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  // Edits not yet confirmed by the server, kept for replay after a 409.
  const unsent = useRef<((d: Doc) => void)[]>([]);

  const persistLocal = () =>
    writeJson(LOCAL_KEY, { doc: docRef.current, baseUpdatedAt: baseUpdatedAt.current, pending: pending.current });

  const apply = (next: Doc) => {
    docRef.current = next;
    setDoc(next);
  };

  const save = useCallback(async () => {
    if (!serverMode.current) { setStatus('local'); return; }
    if (inflight.current) return;
    inflight.current = true;
    pending.current = false;
    setStatus('saving');
    let failed = false;
    const sending = unsent.current.length;
    try {
      const res = await fetch(`${API_BASE}/setup`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-seating-secret': SEATING_SECRET },
        body: JSON.stringify({ data: docRef.current, baseUpdatedAt: baseUpdatedAt.current }),
      });
      if (res.status === 409) {
        const latest = await res.json();
        const rebased = structuredClone(latest.data as Doc);
        unsent.current.forEach((fn) => fn(rebased));
        baseUpdatedAt.current = latest.updatedAt;
        apply(rebased);
        pending.current = unsent.current.length > 0;
      } else if (res.ok) {
        baseUpdatedAt.current = (await res.json()).updatedAt;
        unsent.current = unsent.current.slice(sending);
        setStatus(pending.current ? 'saving' : 'synced');
      } else {
        throw new Error(String(res.status));
      }
    } catch {
      failed = true;
      pending.current = true;
      setStatus('offline');
    } finally {
      inflight.current = false;
      persistLocal();
      // Edits made while the request was in flight still need sending.
      if (pending.current && !failed) {
        clearTimeout(timer.current);
        timer.current = setTimeout(save, 400);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial load: the server copy wins unless this browser has unsent edits
  // made on top of the server's current version.
  useEffect(() => {
    let cancelled = false;
    fetchServer().then((server) => {
      if (cancelled) return;
      if (!server) { setStatus('local'); return; }
      serverMode.current = true;
      if (!server.data) {
        baseUpdatedAt.current = null;
        save();
      } else if (pending.current && baseUpdatedAt.current === server.updatedAt) {
        save();
      } else {
        baseUpdatedAt.current = server.updatedAt;
        pending.current = false;
        apply(server.data);
        persistLocal();
        setStatus('synced');
      }
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pick up edits from other devices while idle.
  useEffect(() => {
    const id = setInterval(async () => {
      if (!serverMode.current || inflight.current || document.visibilityState !== 'visible') return;
      if (pending.current) { save(); return; }
      const server = await fetchServer();
      if (server?.data && server.updatedAt !== baseUpdatedAt.current && !pending.current && !inflight.current) {
        baseUpdatedAt.current = server.updatedAt;
        apply(server.data);
        persistLocal();
        setStatus('synced');
      }
    }, POLL_MS);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = useCallback((fn: (d: Doc) => void) => {
    const next = structuredClone(docRef.current);
    fn(next);
    apply(next);
    unsent.current.push(fn);
    pending.current = true;
    persistLocal();
    if (serverMode.current) {
      setStatus('saving');
      clearTimeout(timer.current);
      timer.current = setTimeout(save, 900);
    } else {
      setStatus('local');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [save]);

  return { doc, status, update };
}

// ── UI ────────────────────────────────────────────────────────────────────

const STATUS_TEXT: Record<SyncStatus, string> = {
  loading: 'Loading…',
  local: 'Saved on this device',
  saving: 'Saving…',
  synced: 'Synced',
  offline: 'Offline — saved here, will retry',
};

interface UiState { dayId: string; hideDone: boolean; collapsed: string[] }

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total ? (done / total) * 100 : 0;
  return (
    <div className="h-1 w-full bg-foreground/[0.07] overflow-hidden">
      <div
        className={`h-full transition-all duration-500 ${done === total && total > 0 ? 'bg-secondary' : 'bg-primary'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Checkbox({ state, onClick, label }: { state: 'on' | 'off' | 'partial'; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={state === 'on' ? true : state === 'partial' ? 'mixed' : false}
      aria-label={label}
      onClick={onClick}
      className={`mt-[3px] shrink-0 w-[18px] h-[18px] border flex items-center justify-center transition-colors ${
        state === 'on'
          ? 'bg-primary border-primary text-primary-foreground'
          : state === 'partial'
            ? 'bg-primary/15 border-primary'
            : 'border-foreground/30 hover:border-primary bg-white'
      }`}
    >
      {state === 'on' && <Check className="w-3 h-3" strokeWidth={3} />}
      {state === 'partial' && <span className="block w-2 h-[2px] bg-primary" />}
    </button>
  );
}

interface ItemOps {
  toggle: (id: string) => void;
  rename: (id: string, text: string) => void;
  addAfter: (id: string) => void;
  addChild: (id: string) => void;
  remove: (id: string) => void;
  indent: (id: string) => void;
  outdent: (id: string) => void;
}

function ItemRow({
  item, depth, editing, hideDone, ops, focusId, clearFocus,
}: {
  item: Item; depth: number; editing: boolean; hideDone: boolean; ops: ItemOps;
  focusId: string | null; clearFocus: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const complete = isComplete(item);
  const isGroup = item.children.length > 0;

  useEffect(() => {
    if (editing && focusId === item.id) {
      inputRef.current?.focus();
      clearFocus();
    }
  }, [editing, focusId, item.id, clearFocus]);

  if (hideDone && complete && !editing) return null;

  const state: 'on' | 'off' | 'partial' = complete
    ? 'on'
    : isGroup && tally(item.children).done > 0 ? 'partial' : 'off';

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); ops.addAfter(item.id); }
    else if (e.key === 'Tab') { e.preventDefault(); (e.shiftKey ? ops.outdent : ops.indent)(item.id); }
    else if (e.key === 'Backspace' && item.text === '' && !isGroup) { e.preventDefault(); ops.remove(item.id); }
  };

  const iconBtn = 'p-1 text-foreground/35 hover:text-foreground/80 transition-colors';

  return (
    <li>
      <div className={`group flex items-start gap-2.5 py-[5px] ${isGroup && !editing ? 'pt-2' : ''}`}>
        <Checkbox state={state} onClick={() => ops.toggle(item.id)} label={item.text || 'item'} />
        {editing ? (
          <>
            <input
              ref={inputRef}
              value={item.text}
              onChange={(e) => ops.rename(item.id, e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="New item"
              className="flex-1 min-w-0 bg-transparent border-b border-foreground/10 focus:border-primary outline-none text-[15px] font-light py-0.5"
            />
            <div className="flex shrink-0 opacity-60 group-hover:opacity-100 group-focus-within:opacity-100">
              <button type="button" className={`${iconBtn} hidden sm:block`} title="Outdent (Shift+Tab)" onClick={() => ops.outdent(item.id)}><IndentDecrease className="w-3.5 h-3.5" /></button>
              <button type="button" className={`${iconBtn} hidden sm:block`} title="Indent (Tab)" onClick={() => ops.indent(item.id)}><IndentIncrease className="w-3.5 h-3.5" /></button>
              <button type="button" className={iconBtn} title="Add sub-item" onClick={() => ops.addChild(item.id)}><Plus className="w-3.5 h-3.5" /></button>
              <button type="button" className={`${iconBtn} hover:!text-destructive`} title="Delete" onClick={() => ops.remove(item.id)}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </>
        ) : (
          <span
            onClick={() => ops.toggle(item.id)}
            className={`flex-1 cursor-pointer select-none leading-snug ${
              isGroup
                ? `text-[13px] tracking-wide uppercase ${complete ? 'text-foreground/35' : 'text-foreground/70'}`
                : `text-[15px] font-light ${complete ? 'line-through text-foreground/35' : 'text-foreground'}`
            }`}
          >
            {item.text}
            {isGroup && (
              <span className="ml-2 normal-case tracking-normal text-foreground/35 text-xs">
                {tally(item.children).done}/{tally(item.children).total}
              </span>
            )}
          </span>
        )}
      </div>
      {isGroup && (
        <ul className="ml-[8px] pl-[17px] border-l border-foreground/10">
          {item.children.map((c) => (
            <ItemRow key={c.id} item={c} depth={depth + 1} editing={editing} hideDone={hideDone} ops={ops} focusId={focusId} clearFocus={clearFocus} />
          ))}
        </ul>
      )}
    </li>
  );
}

function SectionCard({
  section, editing, hideDone, collapsed, onToggleCollapse, update, focusId, setFocusId, isFirst, isLast,
}: {
  section: Section; editing: boolean; hideDone: boolean; collapsed: boolean; onToggleCollapse: () => void;
  update: (fn: (d: Doc) => void) => void; focusId: string | null; setFocusId: (id: string | null) => void;
  isFirst: boolean; isLast: boolean;
}) {
  const { done, total } = tally(section.items);
  const complete = total > 0 && done === total;
  const sid = section.id;
  const edit = (fn: (s: Section) => void) => update((d) => { const s = findSection(d, sid); if (s) fn(s); });
  const clearFocus = useCallback(() => setFocusId(null), [setFocusId]);

  const ops: ItemOps = useMemo(() => ({
    toggle: (id) => edit((s) => { const l = locate(s.items, id); if (l) { const it = l.list[l.index]; setAll(it, !isComplete(it)); } }),
    rename: (id, text) => edit((s) => { const l = locate(s.items, id); if (l) l.list[l.index].text = text; }),
    addAfter: (id) => {
      const nid = newId();
      edit((s) => { const l = locate(s.items, id); if (l) l.list.splice(l.index + 1, 0, { id: nid, text: '', done: false, children: [] }); });
      setFocusId(nid);
    },
    addChild: (id) => {
      const nid = newId();
      edit((s) => { const l = locate(s.items, id); if (l) l.list[l.index].children.push({ id: nid, text: '', done: false, children: [] }); });
      setFocusId(nid);
    },
    remove: (id) => edit((s) => { const l = locate(s.items, id); if (l) l.list.splice(l.index, 1); }),
    indent: (id) => {
      edit((s) => {
        const l = locate(s.items, id);
        if (!l || l.index === 0) return;
        const [it] = l.list.splice(l.index, 1);
        l.list[l.index - 1].children.push(it);
      });
      setFocusId(id);
    },
    outdent: (id) => {
      edit((s) => {
        const l = locate(s.items, id);
        if (!l || !l.parent) return;
        const pl = locate(s.items, l.parent.id)!;
        const [it] = l.list.splice(l.index, 1);
        pl.list.splice(pl.index + 1, 0, it);
      });
      setFocusId(id);
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [sid, update, setFocusId]);

  const moveSection = (delta: number) => update((d) => {
    const day = d.days.find((x) => x.sections.some((s) => s.id === sid));
    if (!day) return;
    const i = day.sections.findIndex((s) => s.id === sid);
    const [s] = day.sections.splice(i, 1);
    day.sections.splice(i + delta, 0, s);
  });
  const deleteSection = () => {
    if (!confirm(`Delete “${section.title || 'this section'}” and all its items?`)) return;
    update((d) => d.days.forEach((day) => { day.sections = day.sections.filter((s) => s.id !== sid); }));
  };
  const addItem = () => {
    const nid = newId();
    edit((s) => s.items.push({ id: nid, text: '', done: false, children: [] }));
    setFocusId(nid);
  };

  const field = 'w-full bg-transparent border-b border-foreground/15 focus:border-primary outline-none py-1 font-light';
  const visibleItems = hideDone && !editing ? section.items.filter((it) => !isComplete(it)) : section.items;

  return (
    <section className={`bg-white border transition-colors ${complete ? 'border-secondary/40' : 'border-foreground/10'}`}>
      {editing ? (
        <div className="p-4 sm:p-5 space-y-3 border-b border-foreground/10 bg-primary/[0.03]">
          <div className="flex items-center gap-2">
            <input value={section.title} onChange={(e) => edit((s) => { s.title = e.target.value; })} placeholder="Section title"
              className={`${field} text-xl`} style={{ fontFamily: 'var(--font-heading)' }} />
            <button type="button" disabled={isFirst} onClick={() => moveSection(-1)} className="p-1.5 text-foreground/40 hover:text-foreground disabled:opacity-20" title="Move up"><ArrowUp className="w-4 h-4" /></button>
            <button type="button" disabled={isLast} onClick={() => moveSection(1)} className="p-1.5 text-foreground/40 hover:text-foreground disabled:opacity-20" title="Move down"><ArrowDown className="w-4 h-4" /></button>
            <button type="button" onClick={deleteSection} className="p-1.5 text-foreground/40 hover:text-destructive" title="Delete section"><Trash2 className="w-4 h-4" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-3 text-sm">
            <label className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-foreground/40 shrink-0" />
              <input value={section.when} onChange={(e) => edit((s) => { s.when = e.target.value; })} placeholder="When" className={field} /></label>
            <label className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-foreground/40 shrink-0" />
              <input value={section.where} onChange={(e) => edit((s) => { s.where = e.target.value; })} placeholder="Where" className={field} /></label>
            <label className="flex items-center gap-2 sm:col-span-2"><Users className="w-3.5 h-3.5 text-foreground/40 shrink-0" />
              <input
                defaultValue={section.who.join(', ')}
                onBlur={(e) => edit((s) => { s.who = e.target.value.split(',').map((x) => x.trim()).filter(Boolean); })}
                placeholder="Who — comma separated"
                className={field}
              /></label>
            <textarea value={section.notes} onChange={(e) => edit((s) => { s.notes = e.target.value; })} placeholder="Notes"
              rows={2} className={`${field} sm:col-span-2 resize-none`} />
          </div>
        </div>
      ) : (
        <button type="button" onClick={onToggleCollapse} className="w-full text-left p-4 sm:p-5 pb-3 sm:pb-4">
          <div className="flex items-start gap-3">
            <h3 className="flex-1 text-[22px] leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              {section.title}
              {complete && <Check className="inline w-4 h-4 ml-2 -mt-1 text-secondary" strokeWidth={3} />}
            </h3>
            <span className="text-xs text-foreground/45 tabular-nums pt-1.5">{done}/{total}</span>
            <ChevronDown className={`w-4 h-4 mt-1.5 text-foreground/35 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] font-light text-foreground/60">
            {section.when && <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" />{section.when}</span>}
            {section.where && <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" />{section.where}</span>}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {section.who.length ? section.who.map((p) => (
              <span key={p} className="text-[12px] px-2 py-0.5 bg-primary/10 text-primary">{p}</span>
            )) : (
              <span className="text-[12px] px-2 py-0.5 border border-dashed border-secondary/60 text-secondary">Who: TBD</span>
            )}
          </div>
        </button>
      )}

      <div className="px-4 sm:px-5"><ProgressBar done={done} total={total} /></div>

      {(!collapsed || editing) && (
        <div className="px-4 sm:px-5 pt-3 pb-4">
          {!editing && (section.notes || section.link) && (
            <p className="text-[13px] font-light italic text-foreground/55 mb-2 leading-relaxed">
              {section.notes}
              {section.link && (
                <> <Link to={section.link.href} className="not-italic text-primary underline underline-offset-2">{section.link.label} →</Link></>
              )}
            </p>
          )}
          <ul>
            {visibleItems.map((it) => (
              <ItemRow key={it.id} item={it} depth={0} editing={editing} hideDone={hideDone} ops={ops} focusId={focusId} clearFocus={clearFocus} />
            ))}
          </ul>
          {!editing && hideDone && visibleItems.length === 0 && total > 0 && (
            <p className="text-sm font-light text-foreground/40 py-1">All done.</p>
          )}
          {editing && (
            <button type="button" onClick={addItem} className="mt-2 inline-flex items-center gap-1.5 text-xs tracking-wider uppercase text-primary hover:text-primary/70">
              <Plus className="w-3.5 h-3.5" /> Add item
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function ChecklistPage() {
  const { doc, status, update } = useSetupDoc();
  const [ui, setUi] = useState<UiState>(() => ({
    dayId: 'oct1', hideDone: false, collapsed: [],
    ...(readJson<UiState>(UI_KEY) ?? {}),
  }));
  const [editing, setEditing] = useState(false);
  const [person, setPerson] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => { writeJson(UI_KEY, ui); }, [ui]);

  const day = doc.days.find((d) => d.id === ui.dayId) ?? doc.days[0];
  const overall = tally(doc.days.flatMap((d) => d.sections.flatMap((s) => s.items)));

  const people = useMemo(() => {
    const seen = new Map<string, string>();
    day?.sections.forEach((s) => s.who.forEach((p) => { if (!seen.has(p.toLowerCase())) seen.set(p.toLowerCase(), p); }));
    return [...seen.values()];
  }, [day]);
  // Distinct places for the day: routes ("A → B") split into both ends,
  // street addresses ("Place · 1 Main St") dropped.
  const places = useMemo(() => [...new Set(
    (day?.sections ?? []).flatMap((s) => s.where.split('→').map((p) => p.split('·')[0].trim())).filter(Boolean),
  )], [day]);

  const sections = (day?.sections ?? []).filter((s) =>
    !person || editing || s.who.some((p) => p.toLowerCase() === person.toLowerCase()));

  const toggleCollapse = (id: string) => setUi((u) => ({
    ...u, collapsed: u.collapsed.includes(id) ? u.collapsed.filter((x) => x !== id) : [...u.collapsed, id],
  }));

  const addSection = () => update((d) => {
    d.days.find((x) => x.id === day.id)!.sections.push({
      id: newId(), title: 'New section', when: '', where: '', who: [], notes: '', items: [],
    });
  });

  const reset = () => {
    if (!confirm('Reset the whole checklist to the original organizer? This clears every checkmark and edit, for everyone.')) return;
    const seed = buildSeed();
    update((d) => { d.days = seed.days; });
  };

  if (!day) return null;
  const dayTally = (d: Day) => tally(d.sections.flatMap((s) => s.items));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="max-w-3xl mx-auto px-4 pt-8 pb-5">
        <div className="flex items-center justify-between text-xs">
          <Link to="/backdoor" className="inline-flex items-center gap-1.5 text-foreground/45 hover:text-foreground/80 tracking-wider uppercase">
            <ArrowLeft className="w-3.5 h-3.5" /> Backdoor
          </Link>
          <span className={`font-light ${status === 'offline' ? 'text-secondary' : 'text-foreground/40'}`}>
            {STATUS_TEXT[status]}
          </span>
        </div>
        <div className="text-center mt-8">
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6" />
          <p className="text-xs tracking-[0.25em] uppercase text-foreground/40 mb-2">baoben.love</p>
          <h1 className="text-3xl sm:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>Setup Checklist</h1>
          <p className="mt-2 text-sm font-light text-foreground/55">
            {overall.done} of {overall.total} done
          </p>
          <div className="max-w-[220px] mx-auto mt-3"><ProgressBar {...overall} /></div>
        </div>
      </header>

      <nav className="sticky top-0 z-10 bg-background/90 backdrop-blur border-y border-foreground/10">
        <div className="max-w-3xl mx-auto px-4 flex gap-1 overflow-x-auto no-scrollbar">
          {doc.days.map((d) => {
            const t = dayTally(d);
            const active = d.id === day.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => { setUi((u) => ({ ...u, dayId: d.id })); setPerson(null); }}
                className={`shrink-0 px-3.5 py-3 text-left border-b-2 transition-colors ${
                  active ? 'border-primary' : 'border-transparent hover:border-foreground/15'
                }`}
              >
                <span className={`block text-sm ${active ? 'text-foreground' : 'text-foreground/55'}`}>{d.date}</span>
                <span className={`block text-[11px] tabular-nums ${t.done === t.total && t.total ? 'text-secondary' : 'text-foreground/35'}`}>
                  {t.done}/{t.total}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-5">
          {editing ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <input value={day.date} onChange={(e) => update((d) => { d.days.find((x) => x.id === day.id)!.date = e.target.value; })}
                className="sm:w-40 bg-transparent border-b border-foreground/15 focus:border-primary outline-none py-1 font-light" />
              <input value={day.title} onChange={(e) => update((d) => { d.days.find((x) => x.id === day.id)!.title = e.target.value; })}
                className="flex-1 bg-transparent border-b border-foreground/15 focus:border-primary outline-none py-1 text-2xl"
                style={{ fontFamily: 'var(--font-heading)' }} />
            </div>
          ) : (
            <h2 className="text-2xl sm:text-[28px]" style={{ fontFamily: 'var(--font-heading)' }}>{day.title}</h2>
          )}
          {places.length > 0 && !editing && (
            <p className="mt-1.5 flex items-start gap-1.5 text-[13px] font-light text-foreground/55">
              <MapPin className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" /> {places.join(' · ')}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mb-5">
          {!editing && people.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPerson(person === p ? null : p)}
              className={`text-[12px] px-2.5 py-1 border transition-colors ${
                person === p ? 'bg-primary text-primary-foreground border-primary' : 'border-foreground/15 text-foreground/65 hover:border-primary/60'
              }`}
            >
              {p}
            </button>
          ))}
          {person && !editing && (
            <button type="button" onClick={() => setPerson(null)} className="inline-flex items-center gap-1 text-[12px] px-2 py-1 text-foreground/45 hover:text-foreground">
              <X className="w-3 h-3" /> Everyone
            </button>
          )}
          <div className="ml-auto flex items-center gap-1">
            {!editing && (
              <button type="button" onClick={() => setUi((u) => ({ ...u, hideDone: !u.hideDone }))}
                className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 text-foreground/55 hover:text-foreground">
                {ui.hideDone ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {ui.hideDone ? 'Done hidden' : 'Hide done'}
              </button>
            )}
            <button type="button" onClick={() => setEditing((e) => !e)}
              className={`inline-flex items-center gap-1.5 text-[12px] px-3 py-1 border transition-colors ${
                editing ? 'bg-primary text-primary-foreground border-primary' : 'border-foreground/15 text-foreground/70 hover:border-primary/60'
              }`}>
              {editing ? <><Check className="w-3.5 h-3.5" /> Done editing</> : <><Pencil className="w-3.5 h-3.5" /> Edit</>}
            </button>
          </div>
        </div>

        {editing && (
          <p className="text-[12px] font-light text-foreground/50 mb-4">
            Enter adds an item below · Tab / Shift+Tab to nest · Backspace on an empty item deletes it
          </p>
        )}

        <div className="space-y-4">
          {sections.map((s, i) => (
            <SectionCard
              key={s.id}
              section={s}
              editing={editing}
              hideDone={ui.hideDone}
              collapsed={ui.collapsed.includes(s.id)}
              onToggleCollapse={() => toggleCollapse(s.id)}
              update={update}
              focusId={focusId}
              setFocusId={setFocusId}
              isFirst={i === 0}
              isLast={i === sections.length - 1}
            />
          ))}
          {sections.length === 0 && (
            <p className="text-center text-sm font-light text-foreground/45 py-10">Nothing for {person} on this day.</p>
          )}
        </div>

        {editing && (
          <div className="mt-5 flex items-center justify-between">
            <button type="button" onClick={addSection}
              className="inline-flex items-center gap-1.5 text-xs tracking-wider uppercase border border-dashed border-primary/50 text-primary px-4 py-2.5 hover:bg-primary/5">
              <Plus className="w-3.5 h-3.5" /> Add section
            </button>
            <button type="button" onClick={reset}
              className="inline-flex items-center gap-1.5 text-xs text-foreground/40 hover:text-destructive">
              <RotateCcw className="w-3.5 h-3.5" /> Reset to organizer
            </button>
          </div>
        )}

        <div className="h-px w-16 bg-gradient-to-r from-transparent via-secondary to-transparent mx-auto mt-12 mb-6" />
      </main>
    </div>
  );
}

export function SetupChecklist() {
  return (
    <BackdoorGate>
      <ChecklistPage />
    </BackdoorGate>
  );
}
