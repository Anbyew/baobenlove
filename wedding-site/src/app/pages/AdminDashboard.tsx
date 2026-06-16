import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';

const API = import.meta.env.VITE_API_BASE ?? '/api';
const PRIMARY = '#78B7D0';
const SECONDARY = '#FFDC7F';
const MUTED = '#cbd5e1';

interface Stats {
  households: number; totalGuests: number; sessions: number;
  unmatched: number; rsvpYes: number; rsvpNo: number;
}
interface Session { email: string; name: string; language: string; created_at: string; last_seen_at: string; }
interface Event { session_token: string; event_type: string; page: string; metadata: Record<string, unknown>; created_at: string; }
interface UnmatchedGuest { email: string; name: string; language: string; created_at: string; }
interface Rsvp { party_name: string; attendance: string; guest_count: number; dietary_restrictions: string; song_request: string; submitted_at: string; }

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function StatCard({ label, value, sub }: { label: string; value: number | undefined; sub?: string }) {
  return (
    <div className="border border-foreground/10 rounded-sm p-5">
      <div className="text-3xl font-light text-foreground">{value ?? '—'}</div>
      <div className="text-xs text-foreground/50 mt-1 tracking-wide">{label}</div>
      {sub && <div className="text-xs text-foreground/30 mt-0.5">{sub}</div>}
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs tracking-[0.2em] uppercase text-foreground/40">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left text-xs tracking-wider uppercase text-foreground/30 font-normal border-b border-foreground/10 whitespace-nowrap">{children}</th>;
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 text-sm font-light border-b border-foreground/5 ${className}`}>{children}</td>;
}

const EVENT_COLORS: Record<string, string> = {
  login: PRIMARY, login_unmatched: '#f59e0b', click: SECONDARY, page_view: MUTED,
};

export function AdminDashboard() {
  const [secret, setSecret] = useState(() => sessionStorage.getItem('admin_secret') || '');
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [unmatched, setUnmatched] = useState<UnmatchedGuest[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async (s: string) => {
    setLoading(true);
    setError('');
    try {
      const h = { 'x-admin-secret': s };
      const [sr, sesr, er, ur, rr] = await Promise.all([
        fetch(`${API}/admin/stats`, { headers: h }),
        fetch(`${API}/admin/sessions`, { headers: h }),
        fetch(`${API}/admin/events?limit=200`, { headers: h }),
        fetch(`${API}/admin/unmatched-guests`, { headers: h }),
        fetch(`${API}/admin/rsvps`, { headers: h }),
      ]);
      if (sr.status === 401) { setError('Wrong password.'); setLoading(false); return; }
      setStats(await sr.json());
      setSessions((await sesr.json()).sessions || []);
      setEvents((await er.json()).events || []);
      setUnmatched((await ur.json()).guests || []);
      setRsvps((await rr.json()).rsvps || []);
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
            className="w-full bg-primary text-white py-3 text-xs tracking-widest uppercase font-light disabled:opacity-50 transition-opacity">
            {loading ? 'Loading…' : 'Enter'}
          </button>
        </div>
      </div>
    );
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  // Activity over time — group events by day
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

  // Page views
  const pageViews: Record<string, number> = {};
  for (const e of events) {
    if (e.event_type === 'page_view' && e.page) pageViews[e.page] = (pageViews[e.page] || 0) + 1;
  }
  const pageChart = Object.entries(pageViews).sort((a, b) => b[1] - a[1])
    .map(([page, count]) => ({ page: page || '/', count }));

  // RSVP donut
  const pending = (stats?.households ?? 0) - (stats?.rsvpYes ?? 0) - (stats?.rsvpNo ?? 0);
  const rsvpDonut = [
    { name: 'Attending', value: stats?.rsvpYes ?? 0, color: PRIMARY },
    { name: 'Declined', value: stats?.rsvpNo ?? 0, color: '#f87171' },
    { name: 'Pending', value: pending, color: MUTED },
  ].filter(d => d.value > 0);

  // Event type breakdown
  const typeCount: Record<string, number> = {};
  for (const e of events) typeCount[e.event_type] = (typeCount[e.event_type] || 0) + 1;
  const typeChart = Object.entries(typeCount).sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count, fill: EVENT_COLORS[type] || MUTED }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-foreground/10 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-sm font-light tracking-wide">baoben.love</span>
          <span className="mx-2 text-foreground/20">·</span>
          <span className="text-sm font-light text-foreground/50">Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          {lastRefresh && (
            <span className="text-xs text-foreground/30">Updated {fmt(lastRefresh.toISOString())}</span>
          )}
          <button onClick={() => load(secret)} disabled={loading}
            className="text-xs tracking-widest uppercase text-foreground/40 hover:text-primary transition-colors disabled:opacity-40">
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="px-6 py-8 max-w-6xl mx-auto">

        {/* Stat cards */}
        <Section title="Overview">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Households" value={stats?.households} />
            <StatCard label="Total guests" value={stats?.totalGuests} />
            <StatCard label="Logins" value={stats?.sessions} />
            <StatCard label="RSVP Yes" value={stats?.rsvpYes} />
            <StatCard label="RSVP No" value={stats?.rsvpNo} />
            <StatCard label="Unmatched" value={stats?.unmatched} sub={unmatched.length > 0 ? 'needs review' : undefined} />
          </div>
        </Section>

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-6 mb-10">

          {/* RSVP donut */}
          <div className="border border-foreground/10 rounded-sm p-5">
            <h3 className="text-xs tracking-[0.2em] uppercase text-foreground/40 mb-4">RSVP Status</h3>
            {rsvpDonut.length === 0 ? (
              <p className="text-xs text-foreground/30 py-8 text-center">No RSVPs yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={rsvpDonut} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={2}>
                    {rsvpDonut.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ fontSize: 12, background: '#fff', border: '1px solid #eee' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Event type breakdown */}
          <div className="border border-foreground/10 rounded-sm p-5">
            <h3 className="text-xs tracking-[0.2em] uppercase text-foreground/40 mb-4">Event Types</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={typeChart} layout="vertical" barSize={14}>
                <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                  {typeChart.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top pages */}
          <div className="border border-foreground/10 rounded-sm p-5">
            <h3 className="text-xs tracking-[0.2em] uppercase text-foreground/40 mb-4">Top Pages</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={pageChart.slice(0, 8)} layout="vertical" barSize={14}>
                <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="page" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" fill={PRIMARY} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity over time */}
        {activityChart.length > 1 && (
          <Section title="Activity over time">
            <div className="border border-foreground/10 rounded-sm p-5">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={activityChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="pageViews" stroke={MUTED} strokeWidth={2} dot={false} name="Page views" />
                  <Line type="monotone" dataKey="clicks" stroke={SECONDARY} strokeWidth={2} dot={false} name="Clicks" />
                  <Line type="monotone" dataKey="logins" stroke={PRIMARY} strokeWidth={2} dot={{ r: 3 }} name="Logins" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>
        )}

        {/* Unmatched — call to action if any */}
        {unmatched.length > 0 && (
          <Section title={`⚠ Unmatched guests — needs review (${unmatched.length})`}>
            <div className="border border-amber-200 bg-amber-50/50 rounded-sm overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr><Th>Email</Th><Th>Name they entered</Th><Th>Language</Th><Th>Time</Th></tr>
                </thead>
                <tbody>
                  {unmatched.map((g, i) => (
                    <tr key={i} className="hover:bg-amber-50">
                      <Td>{g.email}</Td>
                      <Td>{g.name || '—'}</Td>
                      <Td>{g.language}</Td>
                      <Td className="text-foreground/50">{fmt(g.created_at)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* RSVPs */}
        <Section title={`RSVPs (${rsvps.length})`}>
          {rsvps.length === 0 ? (
            <p className="text-sm text-foreground/30 border border-foreground/10 rounded-sm p-6 text-center">No RSVPs yet</p>
          ) : (
            <div className="border border-foreground/10 rounded-sm overflow-x-auto">
              <table className="w-full">
                <thead className="bg-foreground/[0.02]">
                  <tr><Th>Household</Th><Th>Attending</Th><Th>Guests</Th><Th>Dietary</Th><Th>Song request</Th><Th>Submitted</Th></tr>
                </thead>
                <tbody>
                  {rsvps.map((r, i) => (
                    <tr key={i} className="hover:bg-foreground/[0.02]">
                      <Td className="font-normal">{r.party_name}</Td>
                      <Td>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-normal ${r.attendance === 'yes' ? 'bg-primary/10 text-primary' : 'bg-red-50 text-red-400'}`}>
                          {r.attendance}
                        </span>
                      </Td>
                      <Td>{r.guest_count || '—'}</Td>
                      <Td className="text-foreground/60">{r.dietary_restrictions || '—'}</Td>
                      <Td className="text-foreground/60 italic">{r.song_request || '—'}</Td>
                      <Td className="text-foreground/40">{r.submitted_at ? fmt(r.submitted_at) : '—'}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Logins */}
        <Section title={`Logins (${sessions.length})`}>
          <div className="border border-foreground/10 rounded-sm overflow-x-auto">
            <table className="w-full">
              <thead className="bg-foreground/[0.02]">
                <tr><Th>Name</Th><Th>Email</Th><Th>Language</Th><Th>First login</Th><Th>Last seen</Th></tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr key={i} className="hover:bg-foreground/[0.02]">
                    <Td className="font-normal">{s.name || '—'}</Td>
                    <Td className="text-foreground/60">{s.email}</Td>
                    <Td>{s.language === 'zh' ? '中文' : 'English'}</Td>
                    <Td className="text-foreground/50">{fmt(s.created_at)}</Td>
                    <Td className="text-foreground/50">{s.last_seen_at ? fmt(s.last_seen_at) : '—'}</Td>
                  </tr>
                ))}
                {sessions.length === 0 && <tr><Td className="text-foreground/30">No logins yet</Td></tr>}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Activity feed */}
        <Section title="Recent activity">
          <div className="border border-foreground/10 rounded-sm overflow-x-auto">
            <table className="w-full">
              <thead className="bg-foreground/[0.02]">
                <tr><Th>Type</Th><Th>Page</Th><Th>Detail</Th><Th>Time</Th></tr>
              </thead>
              <tbody>
                {events.slice(0, 50).map((e, i) => (
                  <tr key={i} className="hover:bg-foreground/[0.02]">
                    <Td>
                      <span className="text-xs px-2 py-0.5 rounded-full font-normal"
                        style={{ background: (EVENT_COLORS[e.event_type] || MUTED) + '22', color: EVENT_COLORS[e.event_type] || '#94a3b8' }}>
                        {e.event_type}
                      </span>
                    </Td>
                    <Td className="text-foreground/60">{e.page || '—'}</Td>
                    <Td className="text-foreground/50 max-w-xs truncate text-xs">
                      {e.metadata && Object.keys(e.metadata).length > 0
                        ? Object.entries(e.metadata).map(([k, v]) => `${k}: ${v}`).join(' · ')
                        : '—'}
                    </Td>
                    <Td className="text-foreground/40 whitespace-nowrap text-xs">{fmt(e.created_at)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

      </div>
    </div>
  );
}
