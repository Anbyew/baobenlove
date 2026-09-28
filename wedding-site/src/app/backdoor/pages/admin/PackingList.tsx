import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ChevronDown, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { DEFAULT_PACKING_ITEMS, PACKING_SECTIONS } from '../../data/packingList';
import { useGuestIdentity } from '../../../context/GuestIdentityContext';
import { BackdoorGate } from '../../components/BackdoorGate';
import { AdminGate } from '../../components/AdminGate';
import { API_BASE, SEATING_SECRET } from '../../lib/backdoor';

// ── Persistence ───────────────────────────────────────────────────────────
// One server row per item (see server/db.js packing_items), so Ben and Emily
// can tick things off at the same time without overwriting each other. Every
// edit is sent as its own small PUT/DELETE; the page re-pulls the whole list
// every few seconds to pick up the other person's changes. The first browser
// to open an empty list seeds it from data/packingList.ts.

const CACHE_KEY = 'baoben-packing-cache-v1';
const COLLAPSE_KEY = 'baoben-packing-collapsed-v1';
const POLL_MS = 8000;

interface PackingItem {
  id: string;
  section: string;
  group: string;
  label: string;
  note: string;
  checked: boolean;
  checkedBy: string | null;
  position: number;
}

const headers = { 'Content-Type': 'application/json', 'x-seating-secret': SEATING_SECRET };

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function newId() {
  return `i-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function shortName(email: string | null) {
  if (!email) return '';
  if (email.startsWith('bkrakoff')) return 'Ben';
  return 'Emily';
}

export function PackingList() {
  return (
    <BackdoorGate>
      <AdminGate>
        <PackingListInner />
      </AdminGate>
    </BackdoorGate>
  );
}

function PackingListInner() {
  const { identity } = useGuestIdentity();
  const [items, setItems] = useState<PackingItem[]>(() => readJson<PackingItem[]>(CACHE_KEY, []));
  const [status, setStatus] = useState<'loading' | 'synced' | 'offline'>('loading');
  const [query, setQuery] = useState('');
  const [hidePacked, setHidePacked] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => readJson(COLLAPSE_KEY, {}));
  // Edits made since the last pull, keyed by id — a poll that was already in
  // flight when you clicked mustn't snap the checkbox back to its old value.
  const pending = useRef(new Map<string, number>());

  const pull = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/packing`, { headers });
      if (!r.ok) throw new Error(String(r.status));
      let { items: server } = (await r.json()) as { items: PackingItem[] };
      if (server.length === 0) {
        const seeded = await fetch(`${API_BASE}/packing/seed`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ items: DEFAULT_PACKING_ITEMS }),
        });
        if (seeded.ok) server = ((await seeded.json()) as { items: PackingItem[] }).items;
      }
      const now = Date.now();
      setItems((local) => {
        const localById = new Map(local.map((i) => [i.id, i]));
        const merged = server.map((s) => {
          const t = pending.current.get(s.id);
          return t && now - t < POLL_MS * 2 ? localById.get(s.id) ?? s : s;
        });
        // Keep brand-new local items the server hasn't acknowledged yet.
        for (const [id, t] of pending.current) {
          if (now - t < POLL_MS * 2 && !merged.some((m) => m.id === id) && localById.has(id)) merged.push(localById.get(id)!);
        }
        return merged.sort((a, b) => a.position - b.position);
      });
      setStatus('synced');
    } catch {
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    pull();
    const t = setInterval(() => { if (document.visibilityState === 'visible') pull(); }, POLL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') pull(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVisible); };
  }, [pull]);

  useEffect(() => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(items)); } catch { /* cache only */ }
  }, [items]);

  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify(collapsed)); } catch { /* cosmetic */ }
  }, [collapsed]);

  const save = useCallback((item: PackingItem) => {
    pending.current.set(item.id, Date.now());
    setItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      const next = exists ? prev.map((i) => (i.id === item.id ? item : i)) : [...prev, item];
      return next.sort((a, b) => a.position - b.position);
    });
    fetch(`${API_BASE}/packing/items/${encodeURIComponent(item.id)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(item),
    }).then((r) => setStatus(r.ok ? 'synced' : 'offline')).catch(() => setStatus('offline'));
  }, []);

  const remove = useCallback((id: string) => {
    pending.current.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    fetch(`${API_BASE}/packing/items/${encodeURIComponent(id)}`, { method: 'DELETE', headers })
      .then((r) => setStatus(r.ok ? 'synced' : 'offline'))
      .catch(() => setStatus('offline'));
  }, []);

  const toggle = (item: PackingItem) =>
    save({ ...item, checked: !item.checked, checkedBy: item.checked ? null : identity?.email ?? null });

  const addItem = (section: string, group: string, label: string) => {
    const inGroup = items.filter((i) => i.section === section && i.group === group);
    const after = inGroup.length ? Math.max(...inGroup.map((i) => i.position)) : Math.max(0, ...items.filter((i) => i.section === section).map((i) => i.position));
    const next = items.filter((i) => i.position > after).reduce((m, i) => Math.min(m, i.position), after + 2);
    save({ id: newId(), section, group, label, note: '', checked: false, checkedBy: null, position: (after + next) / 2 });
  };

  const renameGroup = (section: string, from: string, to: string) => {
    items.filter((i) => i.section === section && i.group === from).forEach((i) => save({ ...i, group: to }));
  };

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () => items.filter((i) => (!hidePacked || !i.checked) && (!q || `${i.label} ${i.note} ${i.group}`.toLowerCase().includes(q))),
    [items, hidePacked, q],
  );

  const sections = useMemo(() => {
    const known = PACKING_SECTIONS.map((s) => s.title);
    const extra = [...new Set(items.map((i) => i.section))].filter((s) => !known.includes(s));
    return [...PACKING_SECTIONS, ...extra.map((title) => ({ title, blurb: '' }))];
  }, [items]);

  const total = items.length;
  const done = items.filter((i) => i.checked).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-foreground/10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <Link to="/backdoor" className="text-xs tracking-[0.25em] uppercase text-foreground/40 hover:text-foreground/70">
                ← Backdoor
              </Link>
              <h1 className="text-2xl" style={{ fontFamily: 'var(--font-heading)' }}>Packing Checklist</h1>
            </div>
            <div className="text-right">
              <p className="text-2xl font-light tabular-nums">{done}<span className="text-foreground/40">/{total}</span></p>
              <p className="text-[11px] text-foreground/50">
                {status === 'loading' ? 'Loading…' : status === 'synced' ? 'Saved · syncs live' : 'Offline — changes kept here'}
              </p>
            </div>
          </div>
          <div className="h-1.5 bg-foreground/10 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex-1 flex items-center gap-2 border border-foreground/15 rounded px-3 py-2 focus-within:border-primary">
              <Search className="w-4 h-4 text-foreground/40 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search items"
                className="w-full bg-transparent outline-none text-sm font-light"
              />
              {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X className="w-4 h-4 text-foreground/40" /></button>}
            </label>
            <button
              type="button"
              onClick={() => setHidePacked((v) => !v)}
              className={`text-xs px-3 py-2 border rounded whitespace-nowrap transition-colors ${hidePacked ? 'bg-primary text-primary-foreground border-primary' : 'border-foreground/15 text-foreground/70'}`}
            >
              {hidePacked ? 'Showing unpacked' : 'Hide packed'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {sections.map((section) => {
          const all = items.filter((i) => i.section === section.title);
          const shown = visible.filter((i) => i.section === section.title);
          if (q && shown.length === 0) return null;
          const sDone = all.filter((i) => i.checked).length;
          const isCollapsed = !q && collapsed[section.title];
          const groups = [...new Set(all.map((i) => i.group))];
          return (
            <section key={section.title} className="border border-foreground/10 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [section.title]: !c[section.title] }))}
                className="w-full flex items-center gap-3 px-4 py-3 bg-foreground/[0.03] text-left"
              >
                <ChevronDown className={`w-4 h-4 text-foreground/40 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-normal">{section.title}</h2>
                  {section.blurb && <p className="text-xs text-foreground/50 font-light">{section.blurb}</p>}
                </div>
                <span className={`text-xs tabular-nums ${sDone === all.length && all.length ? 'text-primary' : 'text-foreground/50'}`}>
                  {sDone}/{all.length}
                </span>
              </button>
              {!isCollapsed && (
                <div className="px-4 pb-4">
                  {groups.map((group) => {
                    const groupItems = shown.filter((i) => i.group === group);
                    if (groupItems.length === 0 && (q || hidePacked)) return null;
                    return (
                      <Group
                        key={group}
                        title={group}
                        items={groupItems}
                        onToggle={toggle}
                        onSave={save}
                        onRemove={remove}
                        onAdd={(label) => addItem(section.title, group, label)}
                        onRename={(to) => renameGroup(section.title, group, to)}
                      />
                    );
                  })}
                  {!q && <AddGroup onAdd={(group, label) => addItem(section.title, group, label)} />}
                </div>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}

function Group({
  title, items, onToggle, onSave, onRemove, onAdd, onRename,
}: {
  title: string;
  items: PackingItem[];
  onToggle: (i: PackingItem) => void;
  onSave: (i: PackingItem) => void;
  onRemove: (id: string) => void;
  onAdd: (label: string) => void;
  onRename: (to: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(title);

  const commitRename = () => {
    setRenaming(false);
    const to = name.trim();
    if (to && to !== title) onRename(to);
    else setName(title);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-1 group/title">
        {renaming ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setName(title); setRenaming(false); } }}
            className="text-xs tracking-[0.15em] uppercase bg-transparent border-b border-primary outline-none"
          />
        ) : (
          <h3 className="text-xs tracking-[0.15em] uppercase text-foreground/50">{title}</h3>
        )}
        {!renaming && (
          <button type="button" onClick={() => setRenaming(true)} aria-label="Rename group" className="opacity-0 group-hover/title:opacity-100 focus:opacity-100">
            <Pencil className="w-3 h-3 text-foreground/40" />
          </button>
        )}
      </div>
      <ul>
        {items.map((item) => (
          <Row key={item.id} item={item} onToggle={onToggle} onSave={onSave} onRemove={onRemove} />
        ))}
      </ul>
      <form
        onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { onAdd(draft.trim()); setDraft(''); } }}
        className="flex items-center gap-2 pl-1 mt-1"
      >
        <Plus className="w-3.5 h-3.5 text-foreground/30 shrink-0" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add item"
          className="flex-1 bg-transparent outline-none text-sm font-light placeholder:text-foreground/30 py-1"
        />
      </form>
    </div>
  );
}

function Row({
  item, onToggle, onSave, onRemove,
}: {
  item: PackingItem;
  onToggle: (i: PackingItem) => void;
  onSave: (i: PackingItem) => void;
  onRemove: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(item.label);
  const [note, setNote] = useState(item.note);

  useEffect(() => {
    if (!editing) { setLabel(item.label); setNote(item.note); }
  }, [item.label, item.note, editing]);

  const commit = () => {
    setEditing(false);
    const l = label.trim();
    if (!l) { setLabel(item.label); return; }
    if (l !== item.label || note.trim() !== item.note) onSave({ ...item, label: l, note: note.trim() });
  };

  if (editing) {
    return (
      <li className="py-2 pl-8 space-y-1.5">
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          className="w-full bg-transparent border-b border-primary outline-none text-sm py-1"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          placeholder="Note (optional)"
          className="w-full bg-transparent border-b border-foreground/15 outline-none text-xs font-light py-1 placeholder:text-foreground/30"
        />
        <div className="flex gap-3 text-xs pt-1">
          <button type="button" onClick={commit} className="text-primary">Save</button>
          <button type="button" onClick={() => setEditing(false)} className="text-foreground/50">Cancel</button>
          <button type="button" onClick={() => onRemove(item.id)} className="ml-auto flex items-center gap-1 text-destructive">
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="group/row flex items-start gap-3 py-1.5">
      <input
        type="checkbox"
        checked={item.checked}
        onChange={() => onToggle(item)}
        className="mt-1 w-4 h-4 shrink-0 accent-[var(--primary)] cursor-pointer"
        aria-label={item.label}
      />
      <button type="button" onClick={() => onToggle(item)} className="flex-1 min-w-0 text-left">
        <span className={`text-sm font-light ${item.checked ? 'line-through text-foreground/40' : ''}`}>{item.label}</span>
        {item.note && <span className="block text-xs text-foreground/50 font-light">{item.note}</span>}
      </button>
      {item.checked && item.checkedBy && (
        <span className="text-[10px] text-foreground/40 mt-1 shrink-0">{shortName(item.checkedBy)}</span>
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Edit ${item.label}`}
        className="mt-0.5 p-1 opacity-40 sm:opacity-0 sm:group-hover/row:opacity-100 focus:opacity-100"
      >
        <Pencil className="w-3.5 h-3.5 text-foreground/60" />
      </button>
    </li>
  );
}

function AddGroup({ onAdd }: { onAdd: (group: string, label: string) => void }) {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState('');
  const [label, setLabel] = useState('');

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-4 text-xs text-foreground/40 hover:text-foreground/70 flex items-center gap-1">
        <Plus className="w-3 h-3" /> New group
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!group.trim() || !label.trim()) return;
        onAdd(group.trim(), label.trim());
        setGroup(''); setLabel(''); setOpen(false);
      }}
      className="mt-4 space-y-2 border border-dashed border-foreground/15 rounded p-3"
    >
      <input autoFocus value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Group name" className="w-full bg-transparent border-b border-foreground/15 outline-none text-sm py-1" />
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="First item" className="w-full bg-transparent border-b border-foreground/15 outline-none text-sm font-light py-1" />
      <div className="flex gap-3 text-xs">
        <button type="submit" className="text-primary">Add</button>
        <button type="button" onClick={() => setOpen(false)} className="text-foreground/50">Cancel</button>
      </div>
    </form>
  );
}
