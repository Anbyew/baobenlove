import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';

const API = import.meta.env.VITE_API_BASE ?? '/api';
const PRIMARY = '#78B7D0';
const GOLD = '#FFDC7F';
const MUTED = '#cbd5e1';
const RED = '#f87171';
const AMBER = '#f59e0b';
const GREEN = '#4ade80';

interface Stats { households: number; totalGuests: number; sessions: number; unmatched: number; rsvpYes: number; rsvpNo: number; }
interface Event { event_type: string; page: string; metadata: Record<string, unknown>; created_at: string; }
interface UnmatchedGuest { email: string; name: string; language: string; created_at: string; }
interface GardenItem { plantType: string; color: string; position: { x: number; y: number } | null; }
interface HouseholdSession { email: string; name: string; language: string; created_at: string; last_seen_at: string; }
interface Household {
  id: number;
  party_name: string;
  informal_name: string;
  affiliation: string;
  max_guests: number;
  attendance: string;
  guest_count: number;
  dietary_restrictions: string;
  song_request: string;
  submitted_at: string;
  emails: string[];
  sessions: HouseholdSession[];
  garden: { items: GardenItem[]; value: number; updatedAt: string | null };
  recentEvents: Event[];
  lastSeen: string | null;
  hasLoggedIn: boolean;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function daysAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  return `${d}d ago`;
}

const PLANT_EMOJI: Record<string, string> = {
  sunflower: '🌻', rose: '🌹', tulip: '🌷', daisy: '🌼', lavender: '💜', fern: '🌿', orchid: '🌸',
};
const PLANT_COLORS: Record<string, string> = {
  sunflower: '#FFDC7F', rose: '#f87171', tulip: '#f472b6', daisy: '#fde68a',
  lavender: '#c084fc', fern: '#86efac', orchid: '#f0abfc',
};

function gardenSummary(items: GardenItem[]) {
  if (!items.length) return null;
  const counts: Record<string, number> = {};
  for (const it of items) counts[it.plantType] = (counts[it.plantType] || 0) + 1;
  return Object.entries(counts).map(([type, n]) => `${PLANT_EMOJI[type] || '🌱'} ${n}`).join('  ');
}

function StatCard({ label, value, sub, color }: { label: string; value: number | string | undefined; sub?: string; color?: string }) {
  return (
    <div className="border border-foreground/10 rounded-sm p-5">
      <div className="text-3xl font-light" style={{ color: color || 'var(--color-foreground)' }}>{value ?? '—'}</div>
      <div className="text-xs text-foreground/50 mt-1 tracking-wide">{label}</div>
      {sub && <div className="text-xs mt-0.5 text-foreground/30">{sub}</div>}
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xs tracking-[0.2em] uppercase text-foreground/40 mb-4">{title}</h2>
      {children}
    </div>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left text-xs tracking-wider uppercase text-foreground/30 font-normal border-b border-foreground/10 whitespace-nowrap">{children}</th>;
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 text-sm font-light border-b border-foreground/5 align-top ${className}`}>{children}</td>;
}
function Badge({ label, color }: { label: string; color: string }) {
  return <span className="text-xs px-2 py-0.5 rounded-full font-normal" style={{ background: color + '22', color }}>{label}</span>;
}

function HouseholdRow({ h, isExpanded, onToggle }: { h: Household; isExpanded: boolean; onToggle: () => void }) {
  const rsvpColor = h.attendance === 'yes' ? PRIMARY : h.attendance === 'no' ? RED : MUTED;
  const rsvpLabel = h.attendance === 'yes' ? 'Attending' : h.attendance === 'no' ? 'Declined' : 'Pending';

  const uniqueLoggedIn = Array.from(new Map(h.sessions.map(s => [s.email, s])).values());
  const garden = h.garden;
  const topClicks: Record<string, number> = {};
  for (const e of h.recentEvents) {
    if (e.event_type === 'click' && e.metadata?.label) {
      const l = String(e.metadata.label).replace(/_/g, ' ');
      topClicks[l] = (topClicks[l] || 0) + 1;
    }
  }

  return (
    <>
      <tr
        className="hover:bg-foreground/[0.02] cursor-pointer select-none"
        onClick={onToggle}
      >
        {/* Expand indicator */}
        <Td className="w-6 text-foreground/20">{isExpanded ? '▾' : '▸'}</Td>

        {/* Household */}
        <Td>
          <div className="font-normal text-foreground">{h.party_name}</div>
          {h.informal_name && <div className="text-xs text-foreground/40 mt-0.5">{h.informal_name}</div>}
          {h.affiliation && <div className="text-xs text-foreground/30">{h.affiliation}</div>}
        </Td>

        {/* RSVP */}
        <Td>
          <Badge label={rsvpLabel} color={rsvpColor} />
          {h.attendance === 'yes' && h.guest_count && (
            <span className="ml-2 text-xs text-foreground/40">{h.guest_count} guests</span>
          )}
        </Td>

        {/* Logged in */}
        <Td>
          {h.hasLoggedIn ? (
            <div>
              <div className="flex flex-wrap gap-1 mb-1">
                {uniqueLoggedIn.map((s, i) => (
                  <span key={i} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{s.name || s.email}</span>
                ))}
              </div>
              <div className="text-xs text-foreground/30">{h.lastSeen ? `Last seen ${daysAgo(h.lastSeen)}` : ''}</div>
            </div>
          ) : (
            <span className="text-xs text-foreground/30">Not yet</span>
          )}
        </Td>

        {/* Garden */}
        <Td>
          {garden.items.length > 0 ? (
            <div>
              <div className="text-sm">{gardenSummary(garden.items)}</div>
              <div className="text-xs text-foreground/40 mt-0.5">${garden.value} pledged</div>
            </div>
          ) : (
            <span className="text-xs text-foreground/30">—</span>
          )}
        </Td>

        {/* Dietary */}
        <Td className="text-foreground/50 text-xs">{h.dietary_restrictions || '—'}</Td>

        {/* Song */}
        <Td className="text-foreground/50 italic text-xs">{h.song_request || '—'}</Td>
      </tr>

      {/* Expanded detail row */}
      {isExpanded && (
        <tr>
          <td colSpan={7} className="bg-foreground/[0.015] border-b border-foreground/10 px-6 py-4">
            <div className="grid md:grid-cols-3 gap-6">

              {/* Login history */}
              <div>
                <p className="text-xs tracking-widest uppercase text-foreground/30 mb-2">Login history</p>
                {h.sessions.length === 0
                  ? <p className="text-xs text-foreground/30">No logins yet</p>
                  : <div className="space-y-1">
                      {h.sessions.map((s, i) => (
                        <div key={i} className="text-xs">
                          <span className="text-foreground/70">{s.name || s.email}</span>
                          <span className="text-foreground/30 ml-2">{fmt(s.created_at)}</span>
                          <span className="text-foreground/20 ml-1">· {s.language === 'zh' ? '中文' : 'EN'}</span>
                        </div>
                      ))}
                    </div>
                }
              </div>

              {/* Activity */}
              <div>
                <p className="text-xs tracking-widest uppercase text-foreground/30 mb-2">What they did</p>
                {Object.keys(topClicks).length === 0
                  ? <p className="text-xs text-foreground/30">No interactions yet</p>
                  : <div className="space-y-1">
                      {Object.entries(topClicks).sort((a, b) => b[1] - a[1]).map(([label, count], i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-foreground/60">{label}</span>
                          <span className="text-foreground/30">{count}×</span>
                        </div>
                      ))}
                    </div>
                }
              </div>

              {/* Garden detail */}
              <div>
                <p className="text-xs tracking-widest uppercase text-foreground/30 mb-2">Garden</p>
                {garden.items.length === 0
                  ? <p className="text-xs text-foreground/30">Nothing planted yet</p>
                  : <div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {garden.items.map((it, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: (PLANT_COLORS[it.plantType] || '#ddd') + '33', color: PLANT_COLORS[it.plantType] || '#888' }}>
                            {PLANT_EMOJI[it.plantType] || '🌱'} {it.plantType}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-foreground/40">Total: ${garden.value} · {garden.items.length} plants</p>
                      {garden.updatedAt && <p className="text-xs text-foreground/30">Updated {fmt(garden.updatedAt)}</p>}
                    </div>
                }
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function AdminDashboard() {
  const [secret, setSecret] = useState(() => sessionStorage.getItem('admin_secret') || '');
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [unmatched, setUnmatched] = useState<UnmatchedGuest[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [filter, setFilter] = useState<'all' | 'yes' | 'no' | 'pending' | 'visited'>('all');

  const load = useCallback(async (s: string) => {
    setLoading(true);
    setError('');
    try {
      const h = { 'x-admin-secret': s };
      const [sr, er, ur, hr] = await Promise.all([
        fetch(`${API}/admin/stats`, { headers: h }),
        fetch(`${API}/admin/events?limit=500`, { headers: h }),
        fetch(`${API}/admin/unmatched-guests`, { headers: h }),
        fetch(`${API}/admin/households`, { headers: h }),
      ]);
      if (sr.status === 401) { setError('Wrong password.'); setLoading(false); return; }
      setStats(await sr.json());
      setEvents((await er.json()).events || []);
      setUnmatched((await ur.json()).guests || []);
      setHouseholds((await hr.json()).households || []);
      setAuthed(true);
      setLastRefresh(new Date());
      sessionStorage.setItem('admin_secret', s);
    } catch { setError('Could not connect. Try again.'); }
    setLoading(false);
  }, []);

  useEffect(() => { if (secret) load(secret); }, []);

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center px-4 w-full max-w-xs">
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-10" />
          <p className="text-xs tracking-[0.25em] uppercase text-foreground/40 mb-6">Admin · baoben.love</p>
          <input
            type="password" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(input)}
            placeholder="Password" autoFocus
            className="w-full border-b border-foreground/20 focus:border-primary bg-transparent py-3 text-center font-light text-foreground placeholder:text-foreground/30 outline-none transition-colors mb-4"
          />
          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
          <button onClick={() => load(input)} disabled={loading}
            className="w-full bg-primary text-white py-3 text-xs tracking-widest uppercase font-light disabled:opacity-50">
            {loading ? 'Loading…' : 'Enter'}
          </button>
        </div>
      </div>
    );
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const pending = (stats?.households ?? 0) - (stats?.rsvpYes ?? 0) - (stats?.rsvpNo ?? 0);
  const rsvpDonut = [
    { name: 'Attending', value: stats?.rsvpYes ?? 0, color: PRIMARY },
    { name: 'Declined', value: stats?.rsvpNo ?? 0, color: RED },
    { name: 'Pending', value: pending, color: MUTED },
  ].filter(d => d.value > 0);

  const byDay: Record<string, { date: string; logins: number; pageViews: number; clicks: number }> = {};
  for (const e of events) {
    const day = e.created_at.slice(0, 10);
    if (!byDay[day]) byDay[day] = { date: day, logins: 0, pageViews: 0, clicks: 0 };
    if (e.event_type === 'login' || e.event_type === 'login_unmatched') byDay[day].logins++;
    else if (e.event_type === 'page_view') byDay[day].pageViews++;
    else if (e.event_type === 'click') byDay[day].clicks++;
  }
  const activityChart = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({ ...d, date: fmtDay(d.date + 'T12:00:00') }));

  const pageViews: Record<string, number> = {};
  for (const e of events) {
    if (e.event_type === 'page_view' && e.page) pageViews[e.page] = (pageViews[e.page] || 0) + 1;
  }
  const pageChart = Object.entries(pageViews).sort((a, b) => b[1] - a[1])
    .map(([page, views]) => ({ page: page || '/', views }));

  const filteredHouseholds = households.filter(h => {
    if (filter === 'yes') return h.attendance === 'yes';
    if (filter === 'no') return h.attendance === 'no';
    if (filter === 'pending') return !h.attendance;
    if (filter === 'visited') return h.hasLoggedIn;
    return true;
  });

  const visitedCount = households.filter(h => h.hasLoggedIn).length;
  const gardenCount = households.filter(h => h.garden.items.length > 0).length;
  const totalGardenValue = households.reduce((sum, h) => sum + h.garden.value, 0);
  const dietaryList = households.filter(h => h.attendance === 'yes' && h.dietary_restrictions).map(h => h.dietary_restrictions);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-foreground/10 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-sm font-light tracking-wide">baoben.love</span>
          <span className="mx-2 text-foreground/20">·</span>
          <span className="text-sm font-light text-foreground/50">Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          {lastRefresh && <span className="text-xs text-foreground/30">Updated {fmt(lastRefresh.toISOString())}</span>}
          <button onClick={() => load(secret)} disabled={loading}
            className="text-xs tracking-widest uppercase text-foreground/40 hover:text-primary transition-colors disabled:opacity-40">
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto">

        {/* Stat cards */}
        <Section title="Overview">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Households" value={stats?.households} />
            <StatCard label="Total guests" value={stats?.totalGuests} />
            <StatCard label="Visited site" value={visitedCount} sub={`of ${stats?.households ?? '?'} households`} color={PRIMARY} />
            <StatCard label="RSVP Yes" value={stats?.rsvpYes} color={GREEN} />
            <StatCard label="RSVP No" value={stats?.rsvpNo} color={RED} />
            <StatCard label="Unmatched" value={unmatched.length} color={unmatched.length > 0 ? AMBER : undefined} sub={unmatched.length > 0 ? 'needs review' : 'all clear'} />
          </div>
        </Section>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          <div className="border border-foreground/10 rounded-sm p-5">
            <h3 className="text-xs tracking-[0.2em] uppercase text-foreground/40 mb-1">RSVP Breakdown</h3>
            <p className="text-xs text-foreground/30 mb-3">{stats?.rsvpYes ?? 0} yes · {stats?.rsvpNo ?? 0} no · {pending} pending</p>
            {rsvpDonut.length === 0
              ? <p className="text-xs text-foreground/30 py-10 text-center">No RSVPs yet</p>
              : <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={rsvpDonut} dataKey="value" innerRadius={45} outerRadius={68} paddingAngle={2}>
                      {rsvpDonut.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
            }
          </div>

          <div className="border border-foreground/10 rounded-sm p-5">
            <h3 className="text-xs tracking-[0.2em] uppercase text-foreground/40 mb-1">Most visited pages</h3>
            <p className="text-xs text-foreground/30 mb-3">{Object.values(pageViews).reduce((a, b) => a + b, 0)} total views</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={pageChart.slice(0, 7)} layout="vertical" barSize={11}>
                <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="page" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={65} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="views" fill={PRIMARY} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="border border-foreground/10 rounded-sm p-5">
            <h3 className="text-xs tracking-[0.2em] uppercase text-foreground/40 mb-1">Garden pledges</h3>
            <p className="text-xs text-foreground/30 mb-3">{gardenCount} households · ${totalGardenValue} total</p>
            <div className="space-y-2 mt-4">
              {households.filter(h => h.garden.items.length > 0).map((h, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-xs text-foreground/60 truncate max-w-[160px]">{h.informal_name || h.party_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{gardenSummary(h.garden.items)}</span>
                    <span className="text-xs text-foreground/40">${h.garden.value}</span>
                  </div>
                </div>
              ))}
              {gardenCount === 0 && <p className="text-xs text-foreground/30 text-center py-6">No gardens yet</p>}
            </div>
          </div>
        </div>

        {/* Activity over time */}
        {activityChart.length > 1 && (
          <Section title="Activity over time">
            <div className="border border-foreground/10 rounded-sm p-5">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={activityChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="pageViews" stroke={MUTED} strokeWidth={2} dot={false} name="Page views" />
                  <Line type="monotone" dataKey="clicks" stroke={GOLD} strokeWidth={2} dot={false} name="Clicks" />
                  <Line type="monotone" dataKey="logins" stroke={PRIMARY} strokeWidth={2} dot={{ r: 3 }} name="Logins" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>
        )}

        {/* Dietary summary */}
        {dietaryList.length > 0 && (
          <Section title={`Dietary restrictions (${dietaryList.length} attending households)`}>
            <div className="border border-foreground/10 rounded-sm p-4 flex flex-wrap gap-2">
              {dietaryList.map((d, i) => <span key={i} className="text-xs bg-foreground/5 text-foreground/60 px-2 py-1 rounded">{d}</span>)}
            </div>
          </Section>
        )}

        {/* Unmatched */}
        {unmatched.length > 0 && (
          <Section title={`Action needed — unmatched guests (${unmatched.length})`}>
            <div className="border border-amber-200 bg-amber-50/40 rounded-sm overflow-x-auto">
              <div className="px-4 py-3 border-b border-amber-200 text-xs text-amber-700">
                These guests verified their email but aren't on the invite list. Add their emails to guests.tsv and reload the DB.
              </div>
              <table className="w-full">
                <thead><tr>
                  <Th>Name they entered</Th><Th>Email</Th><Th>Language</Th><Th>Logged in</Th>
                </tr></thead>
                <tbody>
                  {unmatched.map((g, i) => (
                    <tr key={i} className="hover:bg-amber-50">
                      <Td className="font-normal">{g.name || '—'}</Td>
                      <Td>{g.email}</Td>
                      <Td>{g.language === 'zh' ? '中文' : 'EN'}</Td>
                      <Td className="text-foreground/50">{daysAgo(g.created_at)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Households table */}
        <Section title={`All households (${households.length})`}>
          {/* Filter tabs */}
          <div className="flex gap-2 mb-3">
            {([
              ['all', 'All', undefined],
              ['visited', `Visited (${visitedCount})`, PRIMARY],
              ['yes', `Yes (${stats?.rsvpYes ?? 0})`, GREEN],
              ['no', `No (${stats?.rsvpNo ?? 0})`, RED],
              ['pending', `Pending (${pending})`, MUTED],
            ] as [string, string, string | undefined][]).map(([val, label, color]) => (
              <button key={val} onClick={() => setFilter(val as typeof filter)}
                className="text-xs px-3 py-1 rounded-full border transition-all"
                style={filter === val
                  ? { background: color || '#374151', color: '#fff', borderColor: color || '#374151' }
                  : { borderColor: '#e5e7eb', color: '#9ca3af' }}>
                {label}
              </button>
            ))}
            <button onClick={() => setExpanded(expanded.size ? new Set() : new Set(filteredHouseholds.map(h => h.id)))}
              className="ml-auto text-xs text-foreground/30 hover:text-foreground/60 transition-colors">
              {expanded.size ? 'Collapse all' : 'Expand all'}
            </button>
          </div>

          <div className="border border-foreground/10 rounded-sm overflow-x-auto">
            <table className="w-full">
              <thead className="bg-foreground/[0.02]">
                <tr>
                  <Th></Th>
                  <Th>Household</Th>
                  <Th>RSVP</Th>
                  <Th>Who's logged in</Th>
                  <Th>Garden</Th>
                  <Th>Dietary</Th>
                  <Th>Song request</Th>
                </tr>
              </thead>
              <tbody>
                {filteredHouseholds.map(h => (
                  <HouseholdRow
                    key={h.id}
                    h={h}
                    isExpanded={expanded.has(h.id)}
                    onToggle={() => setExpanded(prev => {
                      const next = new Set(prev);
                      next.has(h.id) ? next.delete(h.id) : next.add(h.id);
                      return next;
                    })}
                  />
                ))}
                {filteredHouseholds.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-xs text-foreground/30 py-8">No households match this filter</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

      </div>
    </div>
  );
}
