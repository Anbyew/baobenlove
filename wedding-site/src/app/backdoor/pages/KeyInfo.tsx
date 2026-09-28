import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Languages, Mail, MapPin, Pencil, Phone, Plus, Search, Trash2, Utensils, X } from 'lucide-react';
import { BackdoorGate } from '../components/BackdoorGate';
import { API_BASE, SEATING_SECRET } from '../lib/backdoor';
import {
  buildKeyInfoSeed, LOCATION_SECTION_BLURBS, LOCATION_SECTIONS, PEOPLE_GROUPS,
  type KeyInfoDoc, type KeyLocation, type KeyPerson,
} from '../data/keyInfo';
import { GROUP_ZH, NAME_ZH, UI } from '../data/keyInfoZh';
import { bi, lines, sortWhen, zhLine, type Pair } from '../lib/keyInfoText';

// ── Persistence ───────────────────────────────────────────────────────────
// One JSON document on the server (admin_docs key "keyinfo"), saved with
// optimistic concurrency like the Setup Checklist: each save sends the
// version it was based on. If someone else saved in between, the server
// answers 409 with the newer copy, and the edits made here since the last
// successful save are replayed on top of it — nobody's change is dropped.

type Mutation = (doc: KeyInfoDoc) => KeyInfoDoc;

const CACHE_KEY = 'baoben-keyinfo-cache-v1';
const TAB_KEY = 'baoben-keyinfo-tab';
const POLL_MS = 15000;
const headers = { 'Content-Type': 'application/json', 'x-seating-secret': SEATING_SECRET };

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const mapsUrl = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;


// ── Language ──────────────────────────────────────────────────────────────
// English, Chinese, or both at once (English with Chinese beneath). Content
// is stored in English; Chinese comes from an item's own override field if
// set, else the phrase tables in keyInfoZh.ts, else falls back to English.
// Kept per page (not the site-wide language) so it doesn't flip the site.
type Lang = 'en' | 'zh' | 'both';
const LANG_KEY = 'baoben-keyinfo-lang';
const LangCtx = createContext<Lang>('en');
const useLang = () => useContext(LangCtx);


// Short labels (tabs, headings, buttons): one language, or "English · 中文".
function useLabel() {
  const lang = useLang();
  return (en: string, zh?: string) => {
    const z = zh ?? zhLine(en);
    if (lang === 'en' || !z || z === en) return lang === 'zh' ? (z || en) : en;
    return lang === 'zh' ? z : `${en} · ${z}`;
  };
}

// One line of content in the current language; in "both" the Chinese sits
// underneath in a lighter tone.
function Say({ pair, className = '' }: { pair: Pair; className?: string }) {
  const lang = useLang();
  const zh = pair.zh && pair.zh !== pair.en ? pair.zh : '';
  if (lang === 'en' || !zh) return <span className={className}>{pair.en || pair.zh}</span>;
  if (lang === 'zh') return <span className={className}>{zh}</span>;
  return (
    <span className={className}>
      {pair.en}
      <span className="block text-[0.92em] opacity-75">{zh}</span>
    </span>
  );
}

// Short multi-line fields (when, notes, dietary, group blurbs) read best as
// tight bullet points — one per line of the stored text.
function Bullets({ pairs, className = '' }: { pairs: Pair[]; className?: string }) {
  if (!pairs.length) return null;
  return (
    <ul className={`space-y-0.5 ${className}`}>
      {pairs.map((p, i) => (
        <li key={i} className="flex gap-1.5">
          <span aria-hidden className="text-foreground/30 select-none">•</span>
          <Say pair={p} />
        </li>
      ))}
    </ul>
  );
}

function readCache(): { doc: KeyInfoDoc; updatedAt: string | null } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function KeyInfo() {
  return (
    <BackdoorGate>
      <KeyInfoInner />
    </BackdoorGate>
  );
}

function KeyInfoInner() {
  const cached = useRef(readCache());
  const [doc, setDoc] = useState<KeyInfoDoc | null>(cached.current?.doc ?? null);
  const [status, setStatus] = useState<'loading' | 'saving' | 'saved' | 'offline'>('loading');
  const [tab, setTab] = useState<'people' | 'locations'>(() => {
    try { return localStorage.getItem(TAB_KEY) === 'locations' ? 'locations' : 'people'; } catch { return 'people'; }
  });
  const [query, setQuery] = useState('');
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const v = localStorage.getItem(LANG_KEY);
      return v === 'zh' || v === 'both' ? v : 'en';
    } catch { return 'en'; }
  });

  const base = useRef<string | null>(cached.current?.updatedAt ?? null);
  const serverDoc = useRef<KeyInfoDoc | null>(null);
  const pending = useRef<Mutation[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef(false);

  const cache = (d: KeyInfoDoc) => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ doc: d, updatedAt: base.current })); } catch { /* cache only */ }
  };

  const flush = useCallback(async () => {
    if (saving.current || pending.current.length === 0 || !serverDoc.current) return;
    saving.current = true;
    setStatus('saving');
    const batch = pending.current;
    const next = batch.reduce((d, m) => m(d), serverDoc.current);
    let retry = false;
    let ok = false;
    try {
      const r = await fetch(`${API_BASE}/keyinfo`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ data: next, baseUpdatedAt: base.current }),
      });
      if (r.status === 409) {
        // Someone else saved first — rebase our edits onto their copy.
        const latest = await r.json();
        serverDoc.current = latest.data;
        base.current = latest.updatedAt;
        setDoc(pending.current.reduce((d, m) => m(d), latest.data as KeyInfoDoc));
        retry = true;
        return;
      }
      if (!r.ok) throw new Error(String(r.status));
      const { updatedAt } = await r.json();
      serverDoc.current = next;
      base.current = updatedAt;
      pending.current = pending.current.slice(batch.length);
      cache(pending.current.reduce((d, m) => m(d), next));
      setStatus(pending.current.length ? 'saving' : 'saved');
      ok = true;
    } catch {
      setStatus('offline');
    } finally {
      saving.current = false;
      // Rebased after a 409, or more edits arrived while this save was in flight.
      if (retry || (ok && pending.current.length)) queueMicrotask(flush);
    }
  }, []);

  const load = useCallback(async () => {
    if (pending.current.length || saving.current) return;
    try {
      const r = await fetch(`${API_BASE}/keyinfo`, { headers });
      if (!r.ok) throw new Error(String(r.status));
      const { data, updatedAt } = await r.json();
      if (!data) {
        // First open anywhere: create the document from the seed.
        serverDoc.current = buildKeyInfoSeed();
        base.current = null;
        setDoc(serverDoc.current);
        pending.current = [(d) => d];
        return flush();
      }
      if (updatedAt === base.current && serverDoc.current) { setStatus('saved'); return; }
      serverDoc.current = data;
      base.current = updatedAt;
      setDoc(data);
      cache(data);
      setStatus('saved');
    } catch {
      setStatus('offline');
      if (!doc) setDoc(cached.current?.doc ?? null);
    }
  }, [flush, doc]);

  useEffect(() => {
    load();
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(); }, POLL_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try { localStorage.setItem(TAB_KEY, tab); } catch { /* cosmetic */ }
  }, [tab]);

  useEffect(() => {
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* cosmetic */ }
  }, [lang]);

  const mutate = useCallback((m: Mutation) => {
    pending.current.push(m);
    setDoc((d) => (d ? m(d) : d));
    setStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flush, 500);
  }, [flush]);

  const savePerson = (p: KeyPerson) =>
    mutate((d) => ({ ...d, people: d.people.some((x) => x.id === p.id) ? d.people.map((x) => (x.id === p.id ? p : x)) : [...d.people, p] }));
  const deletePerson = (id: string) => mutate((d) => ({ ...d, people: d.people.filter((x) => x.id !== id) }));
  const saveLocation = (l: KeyLocation) =>
    mutate((d) => ({ ...d, locations: d.locations.some((x) => x.id === l.id) ? d.locations.map((x) => (x.id === l.id ? l : x)) : [...d.locations, l] }));
  const deleteLocation = (id: string) => mutate((d) => ({ ...d, locations: d.locations.filter((x) => x.id !== id) }));

  const q = query.trim().toLowerCase();
  const matches = (o: object) => {
    if (!q) return true;
    const values = Object.values(o).map((v) => String(v ?? ''));
    return [...values, ...values.flatMap((v) => lines(v).map(zhLine))].join(' ').toLowerCase().includes(q);
  };
  const u = UI[lang === 'zh' ? 'zh' : 'en'];
  const L = (en: string, zh: string) => (lang === 'en' ? en : lang === 'zh' ? zh : `${en} · ${zh}`);
  const statusText = { loading: 'loading', saving: 'saving', saved: 'saved', offline: 'offline' } as const;

  const groups = useMemo(() => {
    if (!doc) return [];
    const extra = [...new Set(doc.people.map((p) => p.group))].filter((g) => !(PEOPLE_GROUPS as readonly string[]).includes(g));
    return [...PEOPLE_GROUPS, ...extra];
  }, [doc]);

  const locationSections = useMemo(() => {
    if (!doc) return [...LOCATION_SECTIONS] as string[];
    const extra = [...new Set(doc.locations.map((l) => l.section).filter(Boolean))].filter((x) => !(LOCATION_SECTIONS as readonly string[]).includes(x));
    return [...LOCATION_SECTIONS, ...extra];
  }, [doc]);

  return (
    <LangCtx.Provider value={lang}>
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-foreground/10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-end justify-between gap-3 mb-3">
            <div>
              <Link to="/backdoor" className="text-xs tracking-[0.25em] uppercase text-foreground/40 hover:text-foreground/70">{u.back}</Link>
              <h1 className="text-2xl" style={{ fontFamily: 'var(--font-heading)' }}>{L(UI.en.title, UI.zh.title)}</h1>
            </div>
            <div className="flex flex-col items-end gap-1.5 pb-1">
              <div className="flex border border-foreground/15 rounded overflow-hidden text-xs" role="group" aria-label="Language">
                {([['en', 'EN'], ['zh', '中文'], ['both', 'EN + 中文']] as const).map(([v, text]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setLang(v)}
                    aria-pressed={lang === v}
                    className={`px-2.5 py-1 transition-colors ${lang === v ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-foreground/5'}`}
                  >
                    {text}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-foreground/50">{u[statusText[status]]}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex border border-foreground/15 rounded overflow-hidden text-sm">
              {(['people', 'locations'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-foreground/5'}`}
                >
                  {L(UI.en[t], UI.zh[t])} {doc && <span className="opacity-60">({t === 'people' ? doc.people.length : doc.locations.length})</span>}
                </button>
              ))}
            </div>
            <label className="flex-1 min-w-[180px] flex items-center gap-2 border border-foreground/15 rounded px-3 py-2 focus-within:border-primary">
              <Search className="w-4 h-4 text-foreground/40 shrink-0" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={u.search(u[tab])} className="w-full bg-transparent outline-none text-sm font-light" />
              {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X className="w-4 h-4 text-foreground/40" /></button>}
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {!doc ? (
          <p className="text-sm text-foreground/50 font-light">{status === 'offline' ? u.unreachable : u.loading}</p>
        ) : tab === 'people' ? (
          <div className="space-y-8">
            <Bullets
              pairs={lines(UI.en.legend).map((en, i) => ({ en, zh: lines(UI.zh.legend)[i] ?? '' }))}
              className="text-[13px] text-foreground/60"
            />
            {groups.map((group) => {
              const rows = doc.people.filter((p) => p.group === group && matches(p));
              if (q && rows.length === 0) return null;
              return (
                <section key={group}>
                  <h2 className="text-xs tracking-[0.2em] uppercase text-foreground/50 mb-2">{L(group, GROUP_ZH[group] ?? group)}</h2>
                  <div className="border border-foreground/10 rounded-lg divide-y divide-foreground/10">
                    {rows.map((p) => <PersonRow key={p.id} person={p} groups={groups} onSave={savePerson} onDelete={deletePerson} />)}
                    {!q && <AddPerson group={group} groups={groups} onAdd={savePerson} />}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="space-y-8">
            {locationSections.map((section) => {
              const rows = doc.locations
                .filter((l) => (l.section || LOCATION_SECTIONS[0]) === section && matches(l))
                .map((l, i) => ({ l, i, first: sortWhen(l.when).first }))
                .sort((a, b) => a.first - b.first || a.i - b.i)
                .map((x) => x.l);
              if (q && rows.length === 0) return null;
              return (
                <section key={section}>
                  <h2 className="text-xs tracking-[0.2em] uppercase text-foreground/50">{L(section, GROUP_ZH[section] ?? section)}</h2>
                  <Bullets pairs={bi(LOCATION_SECTION_BLURBS[section])} className="text-[13px] text-foreground/65 mt-1.5" />
                  <div className="grid gap-3 sm:grid-cols-2 mt-3">
                    {rows.map((l) => (
                      <LocationCard key={l.id} loc={l} sections={locationSections} onSave={saveLocation} onDelete={deleteLocation} />
                    ))}
                    {!q && <AddLocation section={section} sections={locationSections} onAdd={saveLocation} />}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
    </LangCtx.Provider>
  );
}

// ── People ────────────────────────────────────────────────────────────────

const inputCls = 'w-full bg-transparent border-b border-foreground/20 focus:border-primary outline-none text-sm py-1 placeholder:text-foreground/30';

function PersonForm({ initial, groups, onDone, onCancel, onDelete }: {
  initial: KeyPerson;
  groups: string[];
  onDone: (p: KeyPerson) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const lang = useLang();
  const [p, setP] = useState(initial);
  const set = (k: keyof KeyPerson) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setP({ ...p, [k]: e.target.value });
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (p.name.trim()) onDone({ ...p, name: p.name.trim() }); };
  return (
    <form onSubmit={submit} className="p-3 grid gap-2 sm:grid-cols-2 bg-primary/5">
      <input autoFocus value={p.name} onChange={set('name')} placeholder="Name" className={inputCls} />
      <input value={p.pronunciation} onChange={set('pronunciation')} placeholder="Pronunciation" className={inputCls} />
      <input value={p.role} onChange={set('role')} placeholder="Role" className={inputCls} />
      <select value={p.group} onChange={set('group')} className={inputCls}>
        {groups.map((g) => <option key={g} value={g}>{g}</option>)}
      </select>
      <input value={p.phone} onChange={set('phone')} placeholder="Phone" inputMode="tel" className={inputCls} />
      <input value={p.email} onChange={set('email')} placeholder="Email" inputMode="email" className={inputCls} />
      <input value={p.language ?? ''} onChange={set('language')} placeholder="Language — e.g. English: basic / Speaks Chinese: fluent" className={`${inputCls} sm:col-span-2`} />
      <textarea value={p.dietary ?? ''} onChange={(e) => setP({ ...p, dietary: e.target.value })} placeholder="Dietary restrictions (leave blank if none)" rows={1} className={`${inputCls} sm:col-span-2 resize-y`} />
      <textarea value={p.notes} onChange={(e) => setP({ ...p, notes: e.target.value })} placeholder="Notes — one short point per line" rows={2} className={`${inputCls} sm:col-span-2 resize-y`} />
      {lang !== 'en' && (
        <>
          <p className="sm:col-span-2 text-[11px] tracking-[0.15em] uppercase text-foreground/40 pt-2">中文（可选 · 留空则自动翻译）</p>
          <input value={p.nameZh ?? ''} onChange={set('nameZh')} placeholder={`中文名 / 音译${NAME_ZH[p.name] ? `（自动：${NAME_ZH[p.name]}）` : ''}`} className={inputCls} />
          <input value={p.roleZh ?? ''} onChange={set('roleZh')} placeholder={`身份（自动：${zhLine(p.role)}）`} className={inputCls} />
          <textarea value={p.dietaryZh ?? ''} onChange={(e) => setP({ ...p, dietaryZh: e.target.value })} placeholder={`饮食（自动：${lines(p.dietary).map(zhLine).join(' / ')}）`} rows={1} className={`${inputCls} sm:col-span-2 resize-y`} />
          <textarea value={p.notesZh ?? ''} onChange={(e) => setP({ ...p, notesZh: e.target.value })} placeholder={`备注，每行一条（自动：${lines(p.notes).map(zhLine).join(' / ')}）`} rows={2} className={`${inputCls} sm:col-span-2 resize-y`} />
        </>
      )}
      <div className="flex gap-4 text-xs pt-1 sm:col-span-2">
        <button type="submit" className="text-primary">Save</button>
        <button type="button" onClick={onCancel} className="text-foreground/50">Cancel</button>
        {onDelete && (
          <button type="button" onClick={() => { if (confirm(`Delete ${initial.name}?`)) onDelete(); }} className="ml-auto flex items-center gap-1 text-destructive">
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        )}
      </div>
    </form>
  );
}

function PersonRow({ person, groups, onSave, onDelete }: {
  person: KeyPerson;
  groups: string[];
  onSave: (p: KeyPerson) => void;
  onDelete: (id: string) => void;
}) {
  const lang = useLang();
  const [editing, setEditing] = useState(false);
  const nameZh = person.nameZh || NAME_ZH[person.name] || '';
  if (editing) {
    return (
      <PersonForm
        initial={person}
        groups={groups}
        onDone={(p) => { onSave(p); setEditing(false); }}
        onCancel={() => setEditing(false)}
        onDelete={() => onDelete(person.id)}
      />
    );
  }
  return (
    <div className="group/row px-3 py-2.5 grid gap-x-4 gap-y-0.5 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.3fr)_auto] items-start">
      <div className="min-w-0">
        <p className="text-sm">{person.name}</p>
        {lang !== 'zh' && person.pronunciation && <p className="text-xs italic text-primary/90">{person.pronunciation}</p>}
        {lang !== 'en' && nameZh && <p className="text-xs text-primary/90">{nameZh}</p>}
      </div>
      <p className="text-[13px] text-foreground/65 sm:pt-0.5">{bi(person.role, person.roleZh).map((pr, i) => <Say key={i} pair={pr} className="block" />)}</p>
      <div className="text-[13px] space-y-0.5 min-w-0">
        {person.phone && (
          <a href={telHref(person.phone)} className="flex items-center gap-1.5 hover:text-primary"><Phone className="w-3 h-3 shrink-0 text-foreground/40" />{person.phone}</a>
        )}
        {person.email && (
          <a href={`mailto:${person.email}`} className="flex items-center gap-1.5 hover:text-primary break-all"><Mail className="w-3 h-3 shrink-0 text-foreground/40" />{person.email}</a>
        )}
        {person.language && (
          <div className="flex items-start gap-1.5 text-foreground/70">
            <Languages className="w-3 h-3 mt-0.5 shrink-0 text-foreground/40" />
            <div>{bi(person.language).map((pr, i) => <Say key={i} pair={pr} className="block" />)}</div>
          </div>
        )}
        {person.dietary && (
          <div className="flex items-start gap-1.5 text-foreground/70">
            <Utensils className="w-3 h-3 mt-0.5 shrink-0 text-foreground/40" />
            <div>{bi(person.dietary, person.dietaryZh).map((pr, i) => <Say key={i} pair={pr} className="block" />)}</div>
          </div>
        )}
        <Bullets pairs={bi(person.notes, person.notesZh)} className="text-foreground/60" />
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Edit ${person.name}`}
        className="justify-self-end -mt-6 sm:mt-0 p-1 opacity-50 sm:opacity-0 sm:group-hover/row:opacity-100 focus:opacity-100"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function AddPerson({ group, groups, onAdd }: { group: string; groups: string[]; onAdd: (p: KeyPerson) => void }) {
  const label = useLabel();
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="w-full text-left px-3 py-2 text-xs text-foreground/40 hover:text-foreground/70 flex items-center gap-1">
        <Plus className="w-3 h-3" /> {label(UI.en.addPerson, UI.zh.addPerson)}
      </button>
    );
  }
  const blank: KeyPerson = { id: newId('p'), group, name: '', role: '', pronunciation: '', phone: '', email: '', dietary: '', language: '', notes: '' };
  return <PersonForm initial={blank} groups={groups} onDone={(p) => { onAdd(p); setOpen(false); }} onCancel={() => setOpen(false)} />;
}

// ── Locations ─────────────────────────────────────────────────────────────

function LocationForm({ initial, sections, onDone, onCancel, onDelete }: {
  initial: KeyLocation;
  sections: string[];
  onDone: (l: KeyLocation) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const lang = useLang();
  const [l, setL] = useState(initial);
  const set = (k: keyof KeyLocation) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setL({ ...l, [k]: e.target.value });
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (l.name.trim()) onDone({ ...l, name: l.name.trim() }); }}
      className="border border-primary/40 rounded-lg p-4 space-y-2 bg-primary/5"
    >
      <input autoFocus value={l.name} onChange={set('name')} placeholder="Name" className={inputCls} />
      <input value={l.role} onChange={set('role')} placeholder="What it's for" className={inputCls} />
      <select value={l.section || sections[0]} onChange={set('section')} className={inputCls}>
        {sections.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
      <input value={l.address} onChange={set('address')} placeholder="Main address" className={inputCls} />
      <textarea
        value={l.moreAddresses ?? ''}
        onChange={(e) => setL({ ...l, moreAddresses: e.target.value })}
        placeholder={'Other addresses, one per line — e.g.\nShuttle pickup: 419 Conservatory Rd'}
        rows={2}
        className={`${inputCls} resize-y`}
      />
      <textarea value={l.when} onChange={(e) => setL({ ...l, when: e.target.value })} placeholder="When — one time per line" rows={2} className={`${inputCls} resize-y`} />
      <input value={l.contact} onChange={set('contact')} placeholder="Contact" className={inputCls} />
      <textarea value={l.notes} onChange={(e) => setL({ ...l, notes: e.target.value })} placeholder="Notes — one short point per line" rows={2} className={`${inputCls} resize-y`} />
      {lang !== 'en' && (
        <>
          <p className="text-[11px] tracking-[0.15em] uppercase text-foreground/40 pt-2">中文（可选 · 留空则自动翻译）</p>
          <input value={l.nameZh ?? ''} onChange={set('nameZh')} placeholder={`中文名${NAME_ZH[l.name] ? `（自动：${NAME_ZH[l.name]}）` : ''}`} className={inputCls} />
          <input value={l.roleZh ?? ''} onChange={set('roleZh')} placeholder={`用途（自动：${zhLine(l.role)}）`} className={inputCls} />
          <textarea value={l.whenZh ?? ''} onChange={(e) => setL({ ...l, whenZh: e.target.value })} placeholder={`时间，每行一条（自动：${lines(l.when).map(zhLine).join(' / ')}）`} rows={2} className={`${inputCls} resize-y`} />
          <textarea value={l.notesZh ?? ''} onChange={(e) => setL({ ...l, notesZh: e.target.value })} placeholder={`备注，每行一条（自动：${lines(l.notes).map(zhLine).join(' / ')}）`} rows={2} className={`${inputCls} resize-y`} />
        </>
      )}
      <div className="flex gap-4 text-xs pt-1">
        <button type="submit" className="text-primary">Save</button>
        <button type="button" onClick={onCancel} className="text-foreground/50">Cancel</button>
        {onDelete && (
          <button type="button" onClick={() => { if (confirm(`Delete ${initial.name}?`)) onDelete(); }} className="ml-auto flex items-center gap-1 text-destructive">
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        )}
      </div>
    </form>
  );
}

function LocationCard({ loc, sections, onSave, onDelete }: {
  loc: KeyLocation;
  sections: string[];
  onSave: (l: KeyLocation) => void;
  onDelete: (id: string) => void;
}) {
  const lang = useLang();
  const label = useLabel();
  const [editing, setEditing] = useState(false);
  const nameZh = loc.nameZh || NAME_ZH[loc.name] || '';
  if (editing) {
    return <LocationForm initial={loc} sections={sections} onDone={(l) => { onSave(l); setEditing(false); }} onCancel={() => setEditing(false)} onDelete={() => onDelete(loc.id)} />;
  }
  return (
    <div className="group/card border border-foreground/10 rounded-lg p-4 relative h-full">
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Edit ${loc.name}`}
        className="absolute top-3 right-3 p-1 opacity-50 sm:opacity-0 sm:group-hover/card:opacity-100 focus:opacity-100"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      {loc.role && <p className="text-[10px] tracking-[0.15em] uppercase text-primary mb-1 pr-6">{label(loc.role, loc.roleZh || zhLine(loc.role))}</p>}
      <h3 className="text-base pr-6">{lang === 'zh' && nameZh ? nameZh : loc.name}</h3>
      {lang !== 'en' && nameZh && <p className="text-xs text-foreground/55 pr-6">{lang === 'zh' ? loc.name : nameZh}</p>}
      <div className="mb-2" />
      {loc.address ? (
        <a href={mapsUrl(loc.address)} target="_blank" rel="noopener noreferrer" className="flex items-start gap-1.5 text-sm font-light hover:text-primary mb-1.5">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-foreground/40" />
          <span className="underline decoration-foreground/20 underline-offset-2">{loc.address}</span>
        </a>
      ) : (
        <p className="text-xs text-foreground/40 italic mb-1.5">{label(UI.en.noAddress, UI.zh.noAddress)}</p>
      )}
      {(loc.moreAddresses ?? '').split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
        const i = line.indexOf(': ');
        const [addrLabel, address] = i > 0 ? [line.slice(0, i), line.slice(i + 2)] : ['', line];
        return (
          <a key={line} href={mapsUrl(address)} target="_blank" rel="noopener noreferrer" className="flex items-start gap-1.5 text-xs font-light hover:text-primary mb-1.5">
            <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-foreground/30" />
            <span>
              {addrLabel && <span className="text-foreground/50">{label(addrLabel)} — </span>}
              <span className="underline decoration-foreground/20 underline-offset-2">{address}</span>
            </span>
          </a>
        );
      })}
      <Bullets pairs={bi(sortWhen(loc.when).lines.join('\n'), loc.whenZh)} className="text-[13px] text-foreground/80 mt-2" />
      <Bullets pairs={bi(loc.notes, loc.notesZh)} className="text-[13px] text-foreground/60 mt-1" />
      {loc.contact && <p className="text-[13px] text-foreground/60 mt-2"><span className="text-foreground/40">{label(UI.en.contact, UI.zh.contact)}</span> {loc.contact}</p>}
    </div>
  );
}

function AddLocation({ section, sections, onAdd }: { section: string; sections: string[]; onAdd: (l: KeyLocation) => void }) {
  const label = useLabel();
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="w-full h-full border border-dashed border-foreground/15 rounded-lg p-4 text-sm text-foreground/40 hover:text-foreground/70 flex items-center justify-center gap-1 min-h-[80px]">
        <Plus className="w-4 h-4" /> {label(UI.en.addLocation, UI.zh.addLocation)}
      </button>
    );
  }
  const blank: KeyLocation = { id: newId('loc'), section, name: '', role: '', address: '', moreAddresses: '', when: '', contact: '', notes: '' };
  return <LocationForm initial={blank} sections={sections} onDone={(l) => { onAdd(l); setOpen(false); }} onCancel={() => setOpen(false)} />;
}
