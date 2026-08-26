import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import type { GuestEntry } from '../lib/invite';

const API = import.meta.env.VITE_API_BASE ?? '/api';

const ADMIN_EMAILS = new Set([
  'baobaoyuwei@gmail.com',
  'bellabenbao@gmail.com',
  'yuweibao@umich.edu',
  'bkrakoff@gmail.com',
]);

const PRIMARY = '#78B7D0';
const GOLD = '#FFDC7F';
const MUTED = '#cbd5e1';
const RED = '#f87171';
const AMBER = '#f59e0b';
const GREEN = '#4ade80';
const PURPLE = '#a78bfa';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Stats { households: number; totalGuests: number; sessions: number; unmatched: number; rsvpYes: number; rsvpNo: number; }
interface RawEvent { event_type: string; page: string; metadata: Record<string, unknown>; created_at: string; invite_id?: number; session_token?: string; session_name?: string; session_email?: string; session_ua?: string; session_city?: string; session_country?: string; party_name?: string; informal_name?: string; }
interface UnmatchedGuest { email: string; name: string; language: string; created_at: string; }
interface HouseholdSession { email: string; name: string; language: string; created_at: string; last_seen_at: string; user_agent?: string; city?: string; country?: string; }
interface HouseholdStats { venmoClicks: number; zelleViews: number; pageViews: number; }
interface GardenItem { plantType: string; color: string; }
interface Household {
  id: number; party_name: string; informal_name: string; affiliation: string;
  max_guests: number; attendance: string; guest_count: number;
  guests: GuestEntry[]; transportation: string; additional_notes: string;
  welcome_dinner_attendance: string; rehearsal_dinner: string;
  song_request: string; submitted_at: string;
  emails: string[]; sessions: HouseholdSession[];
  garden: { items: GardenItem[]; value: number; updatedAt: string | null };
  recentEvents: RawEvent[]; lastSeen: string | null; hasLoggedIn: boolean;
  stats: HouseholdStats;
}
interface EscapeCleared { obstacle_id: string; note: string; cleared_at: string; }
interface EscapeSessionObstacle { id: string; note: string; clearedAt: string; amount: number; }
interface EscapeSession { id: number; session_number: number; obstacles: EscapeSessionObstacle[]; started_at: string; archived_at: string; total_raised: number; }
interface DanceEntry { playerName: string; totalScore: number; totalRestarts: number; completedAt: string; }
interface AllDanceRound { player_name: string; total_score: number; total_restarts: number; completed_at: string; }
interface Games { escape: EscapeCleared[]; escapeSessions: EscapeSession[]; dance: DanceEntry[]; allDanceRounds: AllDanceRound[]; }

// ── Helpers ───────────────────────────────────────────────────────────────────

const ESCAPE_LABELS: Record<string, { label: string; price: number }> = {
  tutorial: { label: '47 YouTube Tutorials Later', price: 20 },
  toes:     { label: "Yuwei's Toes", price: 25 },
  warmup:   { label: 'The Pre-Dance Pep Talk', price: 30 },
  crowd:    { label: '200 People Are Watching', price: 25 },
  dip:      { label: 'The Dip', price: 40 },
  mom:      { label: 'Mom Is Already on the Dance Floor', price: 30 },
  spin:     { label: "Someone Yelled 'Do the Thing!'", price: 35 },
  encore:   { label: 'Yuwei Wants an Encore', price: 50 },
};
const GARDEN_PRICES: Record<string, number> = { grass: 2, bush: 8, sunflower: 16, cherryTree: 32 };
const GARDEN_LABELS: Record<string, string> = { grass: 'Grass', bush: 'Bush', sunflower: 'Sunflower', cherryTree: 'Cherry Tree' };
const MAIN_COURSE_LABELS: Record<string, string> = {
  cod: 'Sesame Roasted Black Cod',
  duck: 'Pan Seared PA Duck Breast',
  wellington: 'Heirloom Carrot & Leek Wellington (veg)',
  childrens: "Children's Meal",
  other: 'Other',
};
const AGE_GROUP_LABELS: Record<string, string> = { under21: 'Under 21', over21: '21 or over' };
const LANGUAGE_LEVEL_LABELS = ['Not at all', 'Some', 'Good', 'Native'];

function isRehearsalInvited(h: Household) {
  return String(h.rehearsal_dinner || '').trim().toLowerCase() === 'yes';
}
function welcomeDinnerLabel(v: string) {
  return v === 'yes' ? 'Attending' : v === 'no' ? 'Not attending' : 'Pending';
}
function attendanceLabel(v: string) {
  return v === 'yes' ? 'Attending' : v === 'no' ? 'Declined' : 'Pending';
}

function parseDevice(ua?: string | null): string {
  if (!ua) return '';
  const isMobile = /iPhone|iPad|Android/i.test(ua);
  const device = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Macintosh/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : 'Device';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  return `${device} · ${browser}`;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Who fired this event — a matched guest's session name, their party name, an
// unmatched guest's self-reported name, or a best-effort fallback to their email.
function resolveWho(e: RawEvent): string | null {
  const metaEmail = e.metadata?.email ? String(e.metadata.email) : null;
  const metaName = e.metadata?.name ? String(e.metadata.name) : null;
  return e.session_name
    || e.informal_name
    || e.party_name
    || metaName
    || (e.session_email ? e.session_email.split('@')[0] : null)
    || (metaEmail ? metaEmail.split('@')[0] : null);
}

// Pages and click labels that count as "playing a game" or "engaging with a donation ask" —
// used to build the Games tab's live activity feed from the raw events log, so browsing/
// clicking shows up even before anything is actually completed or paid.
const GAME_DONATION_PAGES = new Set(['/dance', '/escape', '/garden']);
const GAME_DONATION_LABELS = new Set(['registry_wwf_donate', 'registry_visit_garden', 'registry_visit_dance']);

function isGameOrDonationEvent(e: RawEvent): boolean {
  const label = typeof e.metadata?.label === 'string' ? e.metadata.label : '';
  return GAME_DONATION_PAGES.has(e.page) || GAME_DONATION_LABELS.has(label);
}

function describeGameEvent(e: RawEvent): { action: string; detail: string } {
  const label = typeof e.metadata?.label === 'string' ? e.metadata.label : '';
  const m = e.metadata || {};
  const obstacle = (id: unknown) => ESCAPE_LABELS[String(id)];

  switch (label) {
    case 'escape_view_obstacle': {
      const ob = obstacle(m.obstacle);
      return { action: 'Viewed obstacle', detail: ob ? `"${ob.label}" · $${ob.price}` : String(m.obstacle ?? '—') };
    }
    case 'escape_clear_obstacle': {
      const ob = obstacle(m.obstacle);
      return { action: 'Cleared obstacle 🎉', detail: ob ? `"${ob.label}" · $${ob.price} pledged` : String(m.obstacle ?? '—') };
    }
    case 'escape_pay_venmo': {
      const ob = obstacle(m.obstacle);
      return { action: 'Opened Venmo to pay', detail: `$${m.amount ?? '—'}${ob ? ` for "${ob.label}"` : ''}` };
    }
    case 'escape_play_game':
      return { action: 'Played the dance mini-game', detail: '' };
    case 'garden_plant':
      return { action: 'Planted', detail: `${m.plants ?? '—'} · $${m.value ?? 0} (garden now $${m.total_value ?? 0})` };
    case 'garden_pay_venmo':
      return { action: 'Opened Venmo to pay', detail: `$${m.amount ?? '—'} · ${m.qty ?? '—'}× ${GARDEN_LABELS[String(m.plantType)] || m.plantType || ''}` };
    case 'garden_reset':
      return { action: 'Reset their garden', detail: `${m.plants_archived ?? 0} plants · $${m.value_archived ?? 0} archived` };
    case 'garden_download':
      return { action: 'Downloaded garden image', detail: '' };
    case 'zelle_view':
      return { action: 'Viewed Zelle details', detail: m.amount ? `$${m.amount}` : '' };
    case 'zelle_copy':
      return { action: `Copied Zelle ${m.type ?? ''}`.trim(), detail: m.amount ? `$${m.amount}` : '' };
    case 'registry_wwf_donate':
      return { action: 'Clicked the WWF donate link', detail: '' };
    case 'registry_visit_garden':
      return { action: 'Clicked through to the Garden Fund', detail: '' };
    case 'registry_visit_dance':
      return { action: "Clicked through to SOS: Ben Can't Dance", detail: '' };
    default:
      if (e.event_type === 'page_view') {
        const pageLabel = e.page === '/dance' || e.page === '/escape' ? "SOS: Ben Can't Dance" : e.page === '/garden' ? 'Garden Fund' : e.page;
        return { action: 'Viewed page', detail: pageLabel };
      }
      return { action: e.event_type, detail: label || e.page || '—' };
  }
}
function daysAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  return `${d}d ago`;
}
function gardenValue(items: GardenItem[]) {
  return items.reduce((sum, it) => sum + (GARDEN_PRICES[it.plantType] || 0), 0);
}
function gardenSummary(items: GardenItem[]) {
  const counts: Record<string, number> = {};
  for (const it of items) counts[it.plantType] = (counts[it.plantType] || 0) + 1;
  return Object.entries(counts).map(([t, n]) => `${GARDEN_LABELS[t] || t} ×${n}`).join(', ');
}
function householdDietarySummary(guests: GuestEntry[]) {
  return guests
    .filter((g) => g.dietaryRestrictions.trim())
    .map((g) => `${g.firstName || 'Guest'}: ${g.dietaryRestrictions}`)
    .join('; ');
}

// ── UI primitives ─────────────────────────────────────────────────────────────

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
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`border border-foreground/10 rounded-sm p-5 ${className}`}>{children}</div>;
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
function ChartTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <>
      <h3 className="text-xs tracking-[0.2em] uppercase text-foreground/40 mb-1">{title}</h3>
      {sub && <p className="text-xs text-foreground/30 mb-3">{sub}</p>}
    </>
  );
}

// ── Household row ─────────────────────────────────────────────────────────────

function HouseholdRow({ h, isExpanded, onToggle }: { h: Household; isExpanded: boolean; onToggle: () => void }) {
  const rsvpColor = h.attendance === 'yes' ? PRIMARY : h.attendance === 'no' ? RED : MUTED;
  const rsvpLabel = h.attendance === 'yes' ? 'Attending' : h.attendance === 'no' ? 'Declined' : 'Pending';
  const uniqueLoggedIn = Array.from(new Map(h.sessions.map(s => [s.email, s])).values());
  const stats = h.stats ?? { venmoClicks: 0, zelleViews: 0, pageViews: 0 };

  const clickBreakdown: Record<string, number> = {};
  for (const e of h.recentEvents) {
    if (e.event_type === 'click' && e.metadata?.label) {
      const l = String(e.metadata.label).replace(/_/g, ' ');
      clickBreakdown[l] = (clickBreakdown[l] || 0) + 1;
    }
  }
  const pagesVisited = [...new Set(h.recentEvents.filter(e => e.event_type === 'page_view').map(e => e.page))];
  const totalDonation = h.garden.value;

  return (
    <>
      <tr className="hover:bg-foreground/[0.02] cursor-pointer select-none" onClick={onToggle}>
        <Td className="w-6 text-foreground/20">{isExpanded ? '▾' : '▸'}</Td>
        <Td>
          <div className="font-normal text-foreground">{h.party_name}</div>
          {h.informal_name && <div className="text-xs text-foreground/40">{h.informal_name}</div>}
          {h.affiliation && <div className="text-xs text-foreground/30">{h.affiliation}</div>}
          <div className="flex flex-wrap gap-1 mt-1">
            {h.emails.map((e, i) => <span key={i} className="text-[10px] text-foreground/40 bg-foreground/5 px-1.5 py-0.5 rounded">{e}</span>)}
          </div>
        </Td>
        <Td>
          <Badge label={rsvpLabel} color={rsvpColor} />
          {h.attendance === 'yes' && h.guest_count > 0 && (
            <span className="ml-2 text-xs text-foreground/40">{h.guest_count} guests</span>
          )}
        </Td>
        <Td>
          {h.hasLoggedIn ? (
            <div className="space-y-0.5">
              {uniqueLoggedIn.map((s, i) => {
                const device = parseDevice(s.user_agent);
                const loc = [s.city, s.country].filter(Boolean).join(', ');
                return (
                  <div key={i}>
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{s.name || s.email}</span>
                    {device && <span className="ml-1.5 text-[10px] text-foreground/35">{device}</span>}
                    {loc && <span className="ml-1 text-[10px] text-foreground/30">· {loc}</span>}
                  </div>
                );
              })}
              <div className="text-xs text-foreground/30">{h.lastSeen ? `Last seen ${daysAgo(h.lastSeen)}` : ''}</div>
            </div>
          ) : <span className="text-xs text-foreground/30">Not yet</span>}
        </Td>
        <Td>
          {totalDonation > 0
            ? <span className="text-sm font-normal" style={{ color: GOLD }}>${totalDonation}</span>
            : <span className="text-xs text-foreground/30">—</span>}
        </Td>
        <Td>
          {h.garden.items.length > 0 ? (
            <div>
              <div className="text-xs text-foreground/60">{gardenSummary(h.garden.items)}</div>
              <div className="text-xs text-foreground/40">${h.garden.value}</div>
            </div>
          ) : <span className="text-xs text-foreground/30">—</span>}
        </Td>
        <Td className="text-xs text-foreground/50">{householdDietarySummary(h.guests) || '—'}</Td>
        <Td className="text-xs text-foreground/50 italic">{h.song_request || '—'}</Td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={8} className="bg-foreground/[0.015] border-b border-foreground/10 px-6 py-4">
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs tracking-widest uppercase text-foreground/30 mb-2">Emails on file</p>
                {h.emails.length === 0
                  ? <p className="text-xs text-foreground/30">None</p>
                  : <div className="space-y-1">{h.emails.map((e, i) => <div key={i} className="text-xs text-foreground/60">{e}</div>)}</div>}
                <p className="text-xs tracking-widest uppercase text-foreground/30 mt-4 mb-2">Login history</p>
                {h.sessions.length === 0
                  ? <p className="text-xs text-foreground/30">No logins</p>
                  : <div className="space-y-1">
                      {h.sessions.map((s, i) => (
                        <div key={i} className="text-xs">
                          <span className="text-foreground/70">{s.name || s.email}</span>
                          <span className="text-foreground/30 ml-2">{fmt(s.created_at)}</span>
                          <span className="text-foreground/20 ml-1">· {s.language === 'zh' ? '中文' : 'EN'}</span>
                        </div>
                      ))}
                    </div>}
              </div>

              <div>
                <p className="text-xs tracking-widest uppercase text-foreground/30 mb-2">Pages visited</p>
                {pagesVisited.length === 0
                  ? <p className="text-xs text-foreground/30">None</p>
                  : <div className="flex flex-wrap gap-1">
                      {pagesVisited.map((p, i) => <span key={i} className="text-xs bg-foreground/5 text-foreground/50 px-1.5 py-0.5 rounded">{p || '/'}</span>)}
                    </div>}
                <p className="text-xs tracking-widest uppercase text-foreground/30 mt-4 mb-2">Actions taken</p>
                {Object.keys(clickBreakdown).length === 0
                  ? <p className="text-xs text-foreground/30">None</p>
                  : <div className="space-y-1">
                      {Object.entries(clickBreakdown).sort((a, b) => b[1] - a[1]).map(([label, count], i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-foreground/60">{label}</span>
                          <span className="text-foreground/30">{count}×</span>
                        </div>
                      ))}
                    </div>}
              </div>

              <div>
                <p className="text-xs tracking-widest uppercase text-foreground/30 mb-2">Garden</p>
                {h.garden.items.length === 0
                  ? <p className="text-xs text-foreground/30">Nothing planted</p>
                  : <div>
                      <p className="text-xs text-foreground/60 mb-1">{gardenSummary(h.garden.items)}</p>
                      <p className="text-xs text-foreground/40">${h.garden.value} pledged · {h.garden.items.length} plants</p>
                      {h.garden.updatedAt && <p className="text-xs text-foreground/30 mt-1">Updated {fmt(h.garden.updatedAt)}</p>}
                    </div>}
              </div>

              <div>
                <p className="text-xs tracking-widest uppercase text-foreground/30 mb-2">Engagement</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs"><span className="text-foreground/50">Page views</span><span className="text-foreground/40">{stats.pageViews}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-foreground/50">Venmo clicks</span><span className="text-foreground/40">{stats.venmoClicks}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-foreground/50">Zelle views</span><span className="text-foreground/40">{stats.zelleViews}</span></div>
                </div>
                {h.submitted_at && (
                  <>
                    <p className="text-xs tracking-widest uppercase text-foreground/30 mt-4 mb-2">RSVP</p>
                    <p className="text-xs text-foreground/50">{householdDietarySummary(h.guests) || 'No dietary restrictions'}</p>
                    {h.transportation && <p className="text-xs text-foreground/40 mt-1">Transportation: {h.transportation}</p>}
                    {h.song_request && <p className="text-xs text-foreground/40 italic mt-1">🎵 {h.song_request}</p>}
                    {h.additional_notes && <p className="text-xs text-foreground/40 mt-1">Notes: {h.additional_notes}</p>}
                    <p className="text-xs text-foreground/30 mt-1">Submitted {fmt(h.submitted_at)}</p>
                  </>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── RSVP row ──────────────────────────────────────────────────────────────────

function RSVPRow({ h, isExpanded, onToggle }: { h: Household; isExpanded: boolean; onToggle: () => void }) {
  const rsvpColor = h.attendance === 'yes' ? PRIMARY : h.attendance === 'no' ? RED : MUTED;
  return (
    <>
      <tr className="hover:bg-foreground/[0.02] cursor-pointer select-none" onClick={onToggle}>
        <Td className="w-6 text-foreground/20">{isExpanded ? '▾' : '▸'}</Td>
        <Td>
          <div className="font-normal text-foreground">{h.informal_name || h.party_name}</div>
          {h.affiliation && <div className="text-xs text-foreground/30">{h.affiliation}</div>}
        </Td>
        <Td><Badge label={attendanceLabel(h.attendance)} color={rsvpColor} /></Td>
        <Td className="text-foreground/60">{h.attendance === 'yes' ? `${h.guest_count} of ${h.max_guests}` : '—'}</Td>
        <Td className="text-foreground/40 whitespace-nowrap">{h.submitted_at ? fmt(h.submitted_at) : '—'}</Td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={5} className="bg-foreground/[0.015] border-b border-foreground/10 px-6 py-5">
            {h.attendance === '' ? (
              <div className="text-xs">
                <p className="text-foreground/30 tracking-widest uppercase mb-2">Awaiting response</p>
                <p><span className="text-foreground/40">Emails:</span> <span className="text-foreground/60">{h.emails.join(', ') || '—'}</span></p>
              </div>
            ) : h.attendance === 'no' ? (
              <div className="text-xs space-y-1.5">
                <p className="text-foreground/30 tracking-widest uppercase mb-1">Declined</p>
                {h.additional_notes && <p><span className="text-foreground/40">Notes:</span> <span className="text-foreground/60">{h.additional_notes}</span></p>}
                <p><span className="text-foreground/40">Emails:</span> <span className="text-foreground/60">{h.emails.join(', ') || '—'}</span></p>
                <p><span className="text-foreground/40">Submitted:</span> <span className="text-foreground/60">{h.submitted_at ? fmt(h.submitted_at) : '—'}</span></p>
              </div>
            ) : (
              <>
                <p className="text-xs tracking-widest uppercase text-foreground/30 mb-3">Guests ({h.guests.length})</p>
                {h.guests.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
                    {h.guests.map((g, i) => {
                      const fullName = `${g.firstName} ${g.lastName}`.trim() || `Guest ${i + 1}`;
                      return (
                        <div key={i} className="border border-foreground/10 rounded-sm p-3 bg-foreground/[0.01]">
                          <div className="font-normal text-foreground text-sm mb-2">{fullName}</div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between gap-2"><span className="text-foreground/40 flex-shrink-0">Age</span><span className="text-foreground/70 text-right">{AGE_GROUP_LABELS[g.ageGroup] || '—'}</span></div>
                            <div className="flex justify-between gap-2"><span className="text-foreground/40 flex-shrink-0">Main course</span><span className="text-foreground/70 text-right">{g.mainCourse === 'other' ? (g.mainCourseOther || 'Other') : MAIN_COURSE_LABELS[g.mainCourse] || '—'}</span></div>
                            <div className="flex justify-between gap-2"><span className="text-foreground/40 flex-shrink-0">Dietary</span><span className="text-foreground/70 text-right">{g.dietaryRestrictions || '—'}</span></div>
                            <div className="flex justify-between gap-2"><span className="text-foreground/40 flex-shrink-0">English</span><span className="text-foreground/70 text-right">{LANGUAGE_LEVEL_LABELS[g.languageEnglish] || '—'}</span></div>
                            <div className="flex justify-between gap-2"><span className="text-foreground/40 flex-shrink-0">Chinese</span><span className="text-foreground/70 text-right">{LANGUAGE_LEVEL_LABELS[g.languageChinese] || '—'}</span></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-foreground/30 mb-5">No guest details on file</p>
                )}
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  {isRehearsalInvited(h) && <p><span className="text-foreground/40">Welcome Dinner:</span> <span className="text-foreground/70">{welcomeDinnerLabel(h.welcome_dinner_attendance)}</span></p>}
                  <p><span className="text-foreground/40">Transportation:</span> <span className="text-foreground/70 capitalize">{h.transportation || 'Not specified'}</span></p>
                  {h.song_request && <p><span className="text-foreground/40">Song request:</span> <span className="italic text-foreground/70">{h.song_request}</span></p>}
                  {h.additional_notes && <p><span className="text-foreground/40">Notes:</span> <span className="text-foreground/70">{h.additional_notes}</span></p>}
                  <p><span className="text-foreground/40">Emails:</span> <span className="text-foreground/70">{h.emails.join(', ') || '—'}</span></p>
                  <p><span className="text-foreground/40">Submitted:</span> <span className="text-foreground/70">{h.submitted_at ? fmt(h.submitted_at) : '—'}</span></p>
                </div>
              </>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ── RSVP tab ──────────────────────────────────────────────────────────────────

function RSVPTab({ households }: { households: Household[] }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<'all' | 'yes' | 'no' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const responded = households.filter(h => h.attendance === 'yes' || h.attendance === 'no');
  const attending = households.filter(h => h.attendance === 'yes');
  const declined = households.filter(h => h.attendance === 'no');
  const pending = households.filter(h => !h.attendance);

  const attendingGuests = attending.flatMap(h => h.guests);
  const totalGuestsAttending = attendingGuests.length;

  const ageCounts: Record<string, number> = {};
  const courseCounts: Record<string, number> = {};
  const otherCourses: { name: string; detail: string }[] = [];
  const englishLevels = [0, 0, 0, 0];
  const chineseLevels = [0, 0, 0, 0];
  let dietaryCount = 0;
  for (const g of attendingGuests) {
    if (g.ageGroup) ageCounts[g.ageGroup] = (ageCounts[g.ageGroup] || 0) + 1;
    const course = g.mainCourse || 'unspecified';
    courseCounts[course] = (courseCounts[course] || 0) + 1;
    if (course === 'other' && g.mainCourseOther) otherCourses.push({ name: `${g.firstName} ${g.lastName}`.trim(), detail: g.mainCourseOther });
    if (g.languageEnglish != null) englishLevels[g.languageEnglish]++;
    if (g.languageChinese != null) chineseLevels[g.languageChinese]++;
    if (g.dietaryRestrictions.trim()) dietaryCount++;
  }

  const transportCounts: Record<string, number> = { yes: 0, no: 0, tbd: 0 };
  for (const h of attending) if (h.transportation) transportCounts[h.transportation] = (transportCounts[h.transportation] || 0) + 1;

  const rehearsalInvited = households.filter(isRehearsalInvited);
  const welcomeYes = rehearsalInvited.filter(h => h.welcome_dinner_attendance === 'yes');
  const welcomeNo = rehearsalInvited.filter(h => h.welcome_dinner_attendance === 'no');
  const welcomePending = rehearsalInvited.filter(h => h.welcome_dinner_attendance !== 'yes' && h.welcome_dinner_attendance !== 'no');

  const songCount = attending.filter(h => h.song_request?.trim()).length;

  const filtered = households.filter(h => {
    const matchesFilter = filter === 'yes' ? h.attendance === 'yes'
      : filter === 'no' ? h.attendance === 'no'
      : filter === 'pending' ? !h.attendance
      : true;
    const matchesSearch = !searchQuery || [h.party_name, h.informal_name, h.affiliation, ...h.emails].join(' ').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const toggle = (id: number) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <div className="space-y-10">
      {/* ── Aggregated overview ── */}
      <Section title="RSVP overview">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
          <StatCard label="Responded" value={responded.length} sub={`of ${households.length} households`} />
          <StatCard label="Attending" value={attending.length} color={GREEN} />
          <StatCard label="Declined" value={declined.length} color={RED} />
          <StatCard label="Pending" value={pending.length} color={MUTED} />
          <StatCard label="Guests attending" value={totalGuestsAttending} color={PRIMARY} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Under 21" value={ageCounts.under21 ?? 0} color={PURPLE} />
          <StatCard label="21 or over" value={ageCounts.over21 ?? 0} />
          <StatCard label="Dietary needs" value={dietaryCount} color={AMBER} />
          <StatCard label="Song requests" value={songCount} color={GOLD} />
        </div>
      </Section>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <ChartTitle title="Menu selections" sub={`${totalGuestsAttending} attending guests`} />
          {totalGuestsAttending === 0 ? <p className="text-xs text-foreground/30 text-center py-8">No selections yet</p> : (
            <div className="space-y-2 mt-2">
              {Object.entries(MAIN_COURSE_LABELS).map(([id, label]) => {
                const count = courseCounts[id] || 0;
                const pct = Math.round((count / totalGuestsAttending) * 100);
                return (
                  <div key={id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground/60">{label}</span>
                      <span className="text-foreground/40">{count}</span>
                    </div>
                    <div className="h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PRIMARY }} />
                    </div>
                  </div>
                );
              })}
              {otherCourses.length > 0 && (
                <div className="pt-2 mt-2 border-t border-foreground/10 space-y-1">
                  {otherCourses.map((o, i) => (
                    <div key={i} className="text-xs"><span className="text-foreground/60">{o.name}:</span> <span className="text-foreground/40 italic">{o.detail}</span></div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        <Card>
          <ChartTitle title="Language proficiency" sub="Self-reported, among attending guests" />
          {totalGuestsAttending === 0 ? <p className="text-xs text-foreground/30 text-center py-8">No data yet</p> : (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-xs text-foreground/40 mb-2">English</p>
                {LANGUAGE_LEVEL_LABELS.map((label, i) => (
                  <div key={i} className="flex justify-between text-xs mb-1">
                    <span className="text-foreground/60">{label}</span><span className="text-foreground/40">{englishLevels[i]}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs text-foreground/40 mb-2">Chinese</p>
                {LANGUAGE_LEVEL_LABELS.map((label, i) => (
                  <div key={i} className="flex justify-between text-xs mb-1">
                    <span className="text-foreground/60">{label}</span><span className="text-foreground/40">{chineseLevels[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {rehearsalInvited.length > 0 && (
          <Card>
            <ChartTitle title="Welcome Dinner" sub={`Fri, Oct 2 · ${rehearsalInvited.length} households invited`} />
            <div className="grid grid-cols-3 gap-3 mt-2">
              <StatCard label="Attending" value={welcomeYes.length} color={GREEN} />
              <StatCard label="Not attending" value={welcomeNo.length} color={RED} />
              <StatCard label="Pending" value={welcomePending.length} color={MUTED} />
            </div>
          </Card>
        )}
        <Card className={rehearsalInvited.length === 0 ? 'lg:col-span-2' : ''}>
          <ChartTitle title="Transportation" sub={`${attending.length} attending households`} />
          <div className="grid grid-cols-3 gap-3 mt-2">
            <StatCard label="Needs it" value={transportCounts.yes} color={AMBER} />
            <StatCard label="Doesn't need it" value={transportCounts.no} color={GREEN} />
            <StatCard label="TBD" value={transportCounts.tbd} color={MUTED} />
          </div>
        </Card>
      </div>

      {/* ── Individual breakdown ── */}
      <Section title={`Household breakdown — ${filtered.length} of ${households.length}`}>
        <div className="flex flex-wrap gap-2 mb-3 items-center">
          {(['all', 'yes', 'no', 'pending'] as const).map(val => {
            const label = val === 'all' ? 'All' : val === 'yes' ? `Attending (${attending.length})` : val === 'no' ? `Declined (${declined.length})` : `Pending (${pending.length})`;
            const color = val === 'yes' ? GREEN : val === 'no' ? RED : val === 'pending' ? MUTED : PRIMARY;
            return (
              <button key={val} type="button" onClick={() => setFilter(val)}
                className="text-xs px-3 py-1 rounded-full border transition-all"
                style={filter === val ? { background: color, color: '#fff', borderColor: color } : { borderColor: '#e5e7eb', color: '#9ca3af' }}>
                {label}
              </button>
            );
          })}
          <input
            type="text" placeholder="Search name, email, affiliation…" value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="ml-auto text-xs border border-foreground/15 rounded px-3 py-1.5 bg-transparent outline-none focus:border-primary/50 w-56"
          />
          <button type="button" onClick={() => setExpanded(expanded.size ? new Set() : new Set(filtered.map(h => h.id)))}
            className="text-xs text-foreground/30 hover:text-foreground/60 transition-colors">
            {expanded.size ? 'Collapse all' : 'Expand all'}
          </button>
        </div>

        <div className="border border-foreground/10 rounded-sm overflow-x-auto">
          <table className="w-full">
            <thead className="bg-foreground/[0.02]">
              <tr><Th></Th><Th>Household</Th><Th>Status</Th><Th>Guests</Th><Th>Submitted</Th></tr>
            </thead>
            <tbody>
              {filtered.map(h => (
                <RSVPRow key={h.id} h={h} isExpanded={expanded.has(h.id)} onToggle={() => toggle(h.id)} />
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="text-center text-xs text-foreground/30 py-8">No households match</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

// ── Games tab ─────────────────────────────────────────────────────────────────

function GamesTab({ games, households, events, inviteMap }: { games: Games | null; households: Household[]; events: RawEvent[]; inviteMap: Map<number, Household> }) {
  if (!games) return <p className="text-sm text-foreground/40 py-10 text-center">Loading game data…</p>;

  const engagementEvents = events.filter(isGameOrDonationEvent).slice(0, 60);

  const escape = games.escape ?? [];
  const escapeSessions = games.escapeSessions ?? [];
  const dance = games.dance ?? [];

  // Current (unreset) round only.
  const escapeTotal = escape.reduce((sum, e) => sum + (ESCAPE_LABELS[e.obstacle_id]?.price || 0), 0);
  const escapeMax = Object.values(ESCAPE_LABELS).reduce((sum, v) => sum + v.price, 0);
  // Every completed round gets archived (and its obstacles reset) so a new round can be played —
  // the current-round total above misses everything raised before the last reset. Fold it back in.
  const escapeArchivedTotal = escapeSessions.reduce((sum, s) => sum + s.total_raised, 0);
  const escapeLifetimeTotal = escapeTotal + escapeArchivedTotal;
  const escapeCompletedRounds = escapeSessions.filter(s => s.obstacles.length >= Object.keys(ESCAPE_LABELS).length).length;
  const gardenTotal = households.reduce((sum, h) => sum + h.garden.value, 0);
  const grandTotal = escapeLifetimeTotal + gardenTotal;

  // Dance: everyone who has played — sourced from actual "Play to Clear" clicks, not just
  // dance_rounds (which only ever gets a row when someone finishes all 8 obstacles in one
  // sitting — a bar almost nobody clears). This way, anyone who's played at all shows up,
  // whether or not they ever landed a win.
  interface PlayerActivity { name: string; inviteId?: number; plays: number; lastPlayedAt: string }
  const playsByPlayer = new Map<string, PlayerActivity>();
  for (const e of events) {
    const label = typeof e.metadata?.label === 'string' ? e.metadata.label : '';
    if (label !== 'escape_play_game') continue;
    const name = resolveWho(e);
    if (!name) continue;
    const existing = playsByPlayer.get(name);
    if (existing) {
      existing.plays += 1;
      if (e.invite_id) existing.inviteId = e.invite_id;
      if (e.created_at > existing.lastPlayedAt) existing.lastPlayedAt = e.created_at;
    } else {
      playsByPlayer.set(name, { name, inviteId: e.invite_id, plays: 1, lastPlayedAt: e.created_at });
    }
  }

  // Merge in real scores where they exist. Most players who've clicked "Play to
  // Clear" never land in `dance` at all — that only gets a row once someone
  // actually wins an obstacle's mini-game — so they show up here with no score yet
  // rather than not showing up at all.
  interface LeaderboardRow { name: string; householdLabel: string | null; totalScore: number | null; totalRestarts: number | null; plays: number; lastPlayedAt: string }
  const leaderboardRows = new Map<string, LeaderboardRow>();
  for (const [name, info] of playsByPlayer) {
    const household = info.inviteId ? inviteMap.get(info.inviteId) : undefined;
    leaderboardRows.set(name, {
      name,
      householdLabel: household ? (household.informal_name || household.party_name) : null,
      totalScore: null,
      totalRestarts: null,
      plays: info.plays,
      lastPlayedAt: info.lastPlayedAt,
    });
  }
  for (const d of dance) {
    const existing = leaderboardRows.get(d.playerName);
    if (existing) {
      existing.totalScore = d.totalScore;
      existing.totalRestarts = d.totalRestarts;
    } else {
      // Has a saved score but no matching click on record (predates this tracking) —
      // still belongs on the leaderboard.
      leaderboardRows.set(d.playerName, {
        name: d.playerName, householdLabel: null, totalScore: d.totalScore,
        totalRestarts: d.totalRestarts, plays: 1, lastPlayedAt: d.completedAt,
      });
    }
  }
  const leaderboard = [...leaderboardRows.values()].sort((a, b) => {
    if (a.totalScore != null && b.totalScore != null) return b.totalScore - a.totalScore || (a.totalRestarts ?? 0) - (b.totalRestarts ?? 0);
    if (a.totalScore != null) return -1;
    if (b.totalScore != null) return 1;
    return b.plays - a.plays || a.name.localeCompare(b.name);
  });
  const totalPlays = [...playsByPlayer.values()].reduce((s, p) => s + p.plays, 0);

  return (
    <div className="space-y-10">
      {/* Live engagement — everyone browsing/clicking, whether or not they've completed or paid */}
      <Section title={`Live Engagement — ${engagementEvents.length} recent action${engagementEvents.length === 1 ? '' : 's'}`}>
        <p className="text-xs text-foreground/40 mb-3">
          Every game and donation click, including guests who are only browsing, haven't finished, or aren't matched to an invite yet.
        </p>
        <div className="border border-foreground/10 rounded-sm overflow-x-auto">
          <table className="w-full">
            <thead><tr><Th>Time</Th><Th>Who</Th><Th>Action</Th><Th>Detail</Th></tr></thead>
            <tbody>
              {engagementEvents.length === 0
                ? <tr><td colSpan={4} className="text-center text-xs text-foreground/30 py-8">No game or donation activity yet</td></tr>
                : engagementEvents.map((e, i) => {
                    const who = resolveWho(e);
                    const inviteHousehold = e.invite_id ? inviteMap.get(e.invite_id) : undefined;
                    const householdLabel = inviteHousehold ? (inviteHousehold.informal_name || inviteHousehold.party_name) : null;
                    const unmatched = !!e.session_token && !e.invite_id;
                    const { action, detail } = describeGameEvent(e);
                    return (
                      <tr key={i} className="hover:bg-foreground/[0.02]">
                        <Td className="text-foreground/40 whitespace-nowrap">{fmt(e.created_at)}</Td>
                        <Td>
                          {who
                            ? <div>
                                <span className="text-xs font-normal text-foreground/80">{who}</span>
                                {householdLabel && householdLabel !== who && (
                                  <div className="text-[10px] text-foreground/35 mt-0.5">{householdLabel}</div>
                                )}
                                {unmatched && <div className="mt-1"><Badge label="Not on guest list" color={AMBER} /></div>}
                              </div>
                            : <span className="text-xs text-foreground/25">—</span>}
                        </Td>
                        <Td className="font-normal">{action}</Td>
                        <Td className="text-foreground/50">{detail || '—'}</Td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Donation summary */}
      <Section title="Donation overview">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="Dance raised" value={`$${escapeLifetimeTotal}`} sub={`${escapeCompletedRounds} round${escapeCompletedRounds === 1 ? '' : 's'} completed all-time`} color={PRIMARY} />
          <StatCard label="Garden pledged" value={`$${gardenTotal}`} sub={`${households.filter(h => h.garden.items.length > 0).length} households`} color={GREEN} />
        </div>
        <Card>
          <p className="text-xs tracking-[0.2em] uppercase text-foreground/40 mb-1">Grand total pledged</p>
          <p className="text-4xl font-light" style={{ color: GOLD }}>${grandTotal}</p>
        </Card>
      </Section>

      {/* Escape — SOS: Ben Can't Dance */}
      <Section title={`SOS: Ben Can't Dance — ${escape.length}/8 cleared this round · $${escapeLifetimeTotal} raised all-time`}>
        <p className="text-xs text-foreground/40 mb-3">Current round: ${escapeTotal} of ${escapeMax} possible.</p>
        <div className="border border-foreground/10 rounded-sm overflow-x-auto">
          <table className="w-full">
            <thead><tr><Th>Obstacle</Th><Th>Amount</Th><Th>Status</Th><Th>Note</Th><Th>Cleared</Th></tr></thead>
            <tbody>
              {Object.entries(ESCAPE_LABELS).map(([id, meta]) => {
                const cleared = escape.find(e => e.obstacle_id === id);
                return (
                  <tr key={id} className={cleared ? 'bg-green-50/30' : ''}>
                    <Td className="font-normal">{meta.label}</Td>
                    <Td>${meta.price}</Td>
                    <Td>{cleared ? <Badge label="Cleared" color={GREEN} /> : <Badge label="Open" color={MUTED} />}</Td>
                    <Td className="text-foreground/50 italic">{cleared?.note || '—'}</Td>
                    <Td className="text-foreground/40">{cleared ? daysAgo(cleared.cleared_at) : '—'}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {escapeSessions.length > 0 && (
          <div className="mt-4 border border-foreground/10 rounded-sm overflow-x-auto">
            <div className="px-4 pt-4 pb-2">
              <p className="text-xs tracking-widest uppercase text-foreground/30">Past rounds (reset & archived)</p>
            </div>
            <table className="w-full">
              <thead><tr><Th>Round</Th><Th>Obstacles cleared</Th><Th>Raised</Th><Th>Started</Th><Th>Archived</Th></tr></thead>
              <tbody>
                {[...escapeSessions].reverse().map(s => (
                  <tr key={s.id}>
                    <Td className="font-normal">#{s.session_number}</Td>
                    <Td>{s.obstacles.length}/{Object.keys(ESCAPE_LABELS).length}</Td>
                    <Td><span className="font-normal" style={{ color: PRIMARY }}>${s.total_raised}</span></Td>
                    <Td className="text-foreground/40">{daysAgo(s.started_at)}</Td>
                    <Td className="text-foreground/40">{daysAgo(s.archived_at)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Garden */}
      {(() => {
        const gardenHouseholds = households.filter(h => h.garden.items.length > 0);
        return (
          <Section title={`Garden Fund — ${gardenHouseholds.length} households · $${gardenTotal} pledged`}>
            {gardenHouseholds.length === 0
              ? <Card><p className="text-xs text-foreground/30 text-center py-4">No gardens yet</p></Card>
              : <div className="border border-foreground/10 rounded-sm overflow-x-auto">
                  <table className="w-full">
                    <thead><tr><Th>Household</Th><Th>Plants</Th><Th>Colors</Th><Th>Value</Th><Th>Last updated</Th></tr></thead>
                    <tbody>
                      {gardenHouseholds.map(h => {
                        const counts: Record<string, number> = {};
                        const colorSet = new Set<string>();
                        for (const it of h.garden.items) {
                          counts[it.plantType] = (counts[it.plantType] || 0) + 1;
                          if (it.color) colorSet.add(it.color);
                        }
                        const plantSummary = Object.entries(counts)
                          .map(([t, n]) => `${GARDEN_LABELS[t] || t} ×${n}`)
                          .join(', ');
                        return (
                          <tr key={h.id}>
                            <Td className="font-normal">{h.informal_name || h.party_name}</Td>
                            <Td className="text-foreground/70">{plantSummary}</Td>
                            <Td>
                              <div className="flex gap-1 flex-wrap">
                                {[...colorSet].map(c => (
                                  <span key={c} title={c} className="inline-block w-4 h-4 rounded-full border border-white/50 shadow-sm" style={{ background: c }} />
                                ))}
                              </div>
                            </Td>
                            <Td><span className="font-normal" style={{ color: GREEN }}>${h.garden.value}</span></Td>
                            <Td className="text-foreground/40">{h.garden.updatedAt ? daysAgo(h.garden.updatedAt) : '—'}</Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>}
          </Section>
        );
      })()}

      {/* Dance leaderboard */}
      <Section title={`Dance Leaderboard — ${totalPlays} play${totalPlays === 1 ? '' : 's'} across ${leaderboard.length} guest${leaderboard.length === 1 ? '' : 's'}`}>
        <p className="text-xs text-foreground/40 mb-3">
          Everyone who's clicked "Play to Clear" shows up here — a score appears once they've actually won an obstacle's mini-game; "Played, no win yet" just means they're still trying (or gave the obstacle to someone else).
        </p>
        <div className="border border-foreground/10 rounded-sm overflow-x-auto">
          <table className="w-full">
            <thead><tr><Th>Rank</Th><Th>Player</Th><Th>Score</Th><Th>Restarts</Th><Th>Plays</Th><Th>Last played</Th></tr></thead>
            <tbody>
              {leaderboard.length === 0
                ? <tr><td colSpan={6} className="text-center text-xs text-foreground/30 py-8">No one has played yet</td></tr>
                : leaderboard.map((row, i) => (
                    <tr key={row.name} className={i < 3 && row.totalScore != null ? 'bg-amber-50/20' : ''}>
                      <Td><span className="text-foreground/40">{row.totalScore != null && i === 0 ? '🥇' : row.totalScore != null && i === 1 ? '🥈' : row.totalScore != null && i === 2 ? '🥉' : `#${i + 1}`}</span></Td>
                      <Td>
                        <span className="font-normal">{row.name}</span>
                        {row.householdLabel && row.householdLabel !== row.name && (
                          <div className="text-[10px] text-foreground/35 mt-0.5">{row.householdLabel}</div>
                        )}
                      </Td>
                      <Td>
                        {row.totalScore != null
                          ? <span className="font-normal" style={{ color: i < 3 ? GOLD : undefined }}>{row.totalScore.toLocaleString()}</span>
                          : <span className="text-foreground/30 italic">Played, no win yet</span>}
                      </Td>
                      <Td className="text-foreground/40">{row.totalRestarts ?? '—'}</Td>
                      <Td><span style={{ color: row.plays >= 3 ? PRIMARY : undefined }}>{row.plays}</span></Td>
                      <Td className="text-foreground/40">{daysAgo(row.lastPlayedAt)}</Td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────────

type Tab = 'overview' | 'rsvp' | 'households' | 'games' | 'activity';

export function AdminDashboard() {
  const [secret, setSecret] = useState(() => sessionStorage.getItem('admin_secret') || '');
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<RawEvent[]>([]);
  const [unmatched, setUnmatched] = useState<UnmatchedGuest[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [games, setGames] = useState<Games | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [filter, setFilter] = useState<'all' | 'yes' | 'no' | 'pending' | 'visited'>('all');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async (s: string) => {
    setLoading(true);
    setError('');
    try {
      const h = { 'x-admin-secret': s };
      const [sr, er, ur, hr] = await Promise.all([
        fetch(`${API}/admin/stats`, { headers: h }),
        fetch(`${API}/admin/events?limit=1000`, { headers: h }),
        fetch(`${API}/admin/unmatched-guests`, { headers: h }),
        fetch(`${API}/admin/households`, { headers: h }),
      ]);
      if (sr.status === 401) { setError('Wrong password.'); setLoading(false); return; }
      setStats(await sr.json());
      const allEvents: RawEvent[] = (await er.json()).events || [];
      setEvents(allEvents.filter(e => {
        const meta = e.metadata || {};
        return !ADMIN_EMAILS.has(String(meta.email || ''));
      }));
      setUnmatched((await ur.json()).guests || []);
      const allHouseholds: Household[] = (await hr.json()).households || [];
      setHouseholds(allHouseholds.map(h => ({
        ...h,
        sessions: h.sessions.filter(s => !ADMIN_EMAILS.has(s.email) || h.emails?.includes(s.email)),
        recentEvents: (h.recentEvents || []).filter(e => {
          const meta = e.metadata || {};
          return !ADMIN_EMAILS.has(String(meta.email || ''));
        }),
        hasLoggedIn: h.sessions.filter(s => !ADMIN_EMAILS.has(s.email) || h.emails?.includes(s.email)).length > 0,
        lastSeen: h.sessions.filter(s => !ADMIN_EMAILS.has(s.email) || h.emails?.includes(s.email))[0]?.last_seen_at
          || h.sessions.filter(s => !ADMIN_EMAILS.has(s.email) || h.emails?.includes(s.email))[0]?.created_at
          || null,
      })));
      // games endpoint may not be deployed yet — load independently
      fetch(`${API}/admin/games`, { headers: h })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data && !data.error) setGames(data); })
        .catch(() => {});
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
          <button type="button" onClick={() => load(input)} disabled={loading}
            className="w-full bg-primary text-white py-3 text-xs tracking-widest uppercase font-light disabled:opacity-50">
            {loading ? 'Loading…' : 'Enter'}
          </button>
        </div>
      </div>
    );
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const pending = (stats?.households ?? 0) - (stats?.rsvpYes ?? 0) - (stats?.rsvpNo ?? 0);
  const visitedCount = households.filter(h => h.hasLoggedIn).length;
  const gardenCount = households.filter(h => h.garden.items.length > 0).length;
  const totalGardenValue = households.reduce((sum, h) => sum + h.garden.value, 0);
  const dance = games?.dance ?? [];
  // "Rounds played" (dance_rounds) only ever gets a row when someone finishes all 8
  // obstacles in one sitting — nearly nobody does. Count actual "Play to Clear" clicks
  // instead so this caption reflects real engagement, matching the Games tab.
  const totalDancePlays = events.filter(e => typeof e.metadata?.label === 'string' && e.metadata.label === 'escape_play_game').length;

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
    const matchesFilter = filter === 'yes' ? h.attendance === 'yes'
      : filter === 'no' ? h.attendance === 'no'
      : filter === 'pending' ? !h.attendance
      : filter === 'visited' ? h.hasLoggedIn
      : true;
    const matchesSearch = !searchQuery || [h.party_name, h.informal_name, h.affiliation, ...h.emails].join(' ').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const inviteMap = new Map<number, Household>(households.map(h => [h.id, h]));

  const eventTypes = [...new Set(events.map(e => e.event_type))].sort();
  const filteredEvents = events.filter(e => activityFilter === 'all' || e.event_type === activityFilter).slice(0, 200);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'rsvp', label: `RSVP (${(stats?.rsvpYes ?? 0) + (stats?.rsvpNo ?? 0)})` },
    { id: 'households', label: `Households (${households.length})` },
    { id: 'games', label: 'Games & Donations' },
    { id: 'activity', label: 'Activity Log' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-foreground/10 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-sm font-light tracking-wide">baoben.love</span>
          <span className="mx-2 text-foreground/20">·</span>
          <span className="text-sm font-light text-foreground/50">Admin Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          {lastRefresh && <span className="text-xs text-foreground/30">Updated {fmt(lastRefresh.toISOString())}</span>}
          <button type="button" onClick={() => load(secret)} disabled={loading}
            className="text-xs tracking-widest uppercase text-foreground/40 hover:text-primary transition-colors disabled:opacity-40">
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-foreground/10 px-6">
        <div className="flex gap-0">
          {TABS.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-xs tracking-wide transition-colors border-b-2 -mb-px ${tab === t.id ? 'border-primary text-foreground' : 'border-transparent text-foreground/40 hover:text-foreground/70'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto">

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <>
            <Section title="At a glance">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                <StatCard label="Households" value={stats?.households} />
                <StatCard label="Total guests" value={stats?.totalGuests} />
                <StatCard label="Site visited" value={visitedCount} sub={`of ${stats?.households ?? '?'}`} color={PRIMARY} />
                <StatCard label="RSVP Yes" value={stats?.rsvpYes} color={GREEN} />
                <StatCard label="RSVP No" value={stats?.rsvpNo} color={RED} />
                <StatCard label="Guests RSVPed" value={stats?.rsvpYes !== undefined ? (stats.rsvpYes > 0 ? households.filter(h => h.attendance === 'yes').reduce((s, h) => s + (h.guest_count || 0), 0) : 0) : '—'} sub="RSVP coming soon" color={MUTED} />
                <StatCard label="Unmatched" value={unmatched.length} color={unmatched.length > 0 ? RED : undefined} sub={unmatched.length > 0 ? 'needs review' : 'all clear'} />
              </div>
            </Section>

            <div className="grid lg:grid-cols-4 gap-6 mb-10">
              <Card>
                <ChartTitle title="RSVP breakdown" sub={`${stats?.rsvpYes ?? 0} yes · ${stats?.rsvpNo ?? 0} no · ${pending} pending`} />
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
                    </ResponsiveContainer>}
              </Card>

              <Card>
                <ChartTitle title="Most visited pages" sub={`${Object.values(pageViews).reduce((a, b) => a + b, 0)} total views`} />
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={pageChart.slice(0, 7)} layout="vertical" barSize={11}>
                    <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="page" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="views" fill={PRIMARY} radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {(() => {
                const gardenHouseholds = households.filter(h => h.garden.items.length > 0);
                const plantCounts: Record<string, number> = {};
                for (const h of gardenHouseholds) for (const it of h.garden.items) plantCounts[it.plantType] = (plantCounts[it.plantType] || 0) + 1;
                return (
                  <Card>
                    <ChartTitle title="Garden" sub={`${gardenHouseholds.length} households · $${totalGardenValue} total`} />
                    {gardenHouseholds.length === 0
                      ? <p className="text-xs text-foreground/30 text-center py-10">No gardens yet</p>
                      : <div className="mt-2 space-y-2">
                          {Object.entries(plantCounts).map(([type, count]) => (
                            <div key={type} className="flex justify-between items-center text-xs">
                              <span className="text-foreground/60">{GARDEN_LABELS[type] || type}</span>
                              <span className="text-foreground/40">×{count} · ${(GARDEN_PRICES[type] || 0) * count}</span>
                            </div>
                          ))}
                          <div className="flex justify-between items-center text-xs pt-2 border-t border-foreground/8 font-normal">
                            <span className="text-foreground/50">Total plants</span>
                            <span className="text-foreground/60">{Object.values(plantCounts).reduce((a, b) => a + b, 0)}</span>
                          </div>
                        </div>}
                  </Card>
                );
              })()}

              <Card>
                <ChartTitle title="Dance leaderboard" sub={`${totalDancePlays} play${totalDancePlays === 1 ? '' : 's'}`} />
                {dance.length === 0
                  ? <p className="text-xs text-foreground/30 text-center py-10">No rounds yet</p>
                  : <div className="mt-2 space-y-2">
                      {dance.slice(0, 5).map((d, i) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <span className="text-foreground/60 truncate max-w-[120px]">
                            <span className="text-foreground/30 mr-1.5">#{i + 1}</span>{d.playerName}
                          </span>
                          <span className="text-foreground/50 tabular-nums">{d.totalScore.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>}
              </Card>
            </div>

            {activityChart.length > 1 && (
              <Section title="Activity over time">
                <Card>
                  <ResponsiveContainer width="100%" height={200}>
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
                </Card>
              </Section>
            )}

            {unmatched.length > 0 && (
              <Section title={`Action needed — ${unmatched.length} unmatched guests`}>
                <div className="border border-amber-200 bg-amber-50/40 rounded-sm overflow-x-auto">
                  <div className="px-4 py-3 border-b border-amber-200 text-xs text-amber-700">
                    These guests verified their email but aren't on the invite list. Add their emails to guests.tsv and reload the DB.
                  </div>
                  <table className="w-full">
                    <thead><tr><Th>Name</Th><Th>Email</Th><Th>Language</Th><Th>Logged in</Th></tr></thead>
                    <tbody>
                      {unmatched.map((g, i) => (
                        <tr key={i}><Td className="font-normal">{g.name || '—'}</Td><Td>{g.email}</Td><Td>{g.language === 'zh' ? '中文' : 'EN'}</Td><Td className="text-foreground/40">{daysAgo(g.created_at)}</Td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}
          </>
        )}

        {/* ── RSVP TAB ── */}
        {tab === 'rsvp' && <RSVPTab households={households} />}

        {/* ── HOUSEHOLDS TAB ── */}
        {tab === 'households' && (
          <Section title={`All households (${households.length})`}>
            <div className="flex flex-wrap gap-2 mb-3 items-center">
              {(['all', 'visited', 'yes', 'no', 'pending'] as const).map(val => {
                const label = val === 'all' ? 'All' : val === 'visited' ? `Visited (${visitedCount})` : val === 'yes' ? `Yes (${stats?.rsvpYes ?? 0})` : val === 'no' ? `No (${stats?.rsvpNo ?? 0})` : `Pending (${pending})`;
                const color = val === 'visited' ? PRIMARY : val === 'yes' ? GREEN : val === 'no' ? RED : MUTED;
                return (
                  <button key={val} type="button" onClick={() => setFilter(val)}
                    className="text-xs px-3 py-1 rounded-full border transition-all"
                    style={filter === val ? { background: color, color: '#fff', borderColor: color } : { borderColor: '#e5e7eb', color: '#9ca3af' }}>
                    {label}
                  </button>
                );
              })}
              <input
                type="text" placeholder="Search name, email, affiliation…" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="ml-auto text-xs border border-foreground/15 rounded px-3 py-1.5 bg-transparent outline-none focus:border-primary/50 w-56"
              />
              <button type="button" onClick={() => setExpanded(expanded.size ? new Set() : new Set(filteredHouseholds.map(h => h.id)))}
                className="text-xs text-foreground/30 hover:text-foreground/60 transition-colors">
                {expanded.size ? 'Collapse all' : 'Expand all'}
              </button>
            </div>

            <div className="border border-foreground/10 rounded-sm overflow-x-auto">
              <table className="w-full">
                <thead className="bg-foreground/[0.02]">
                  <tr>
                    <Th></Th><Th>Household</Th><Th>RSVP</Th><Th>Who's logged in</Th>
                    <Th>Donations</Th><Th>Garden</Th><Th>Dietary</Th><Th>Song</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHouseholds.map(h => (
                    <HouseholdRow key={h.id} h={h} isExpanded={expanded.has(h.id)}
                      onToggle={() => setExpanded(prev => {
                        const next = new Set(prev);
                        next.has(h.id) ? next.delete(h.id) : next.add(h.id);
                        return next;
                      })} />
                  ))}
                  {filteredHouseholds.length === 0 && (
                    <tr><td colSpan={8} className="text-center text-xs text-foreground/30 py-8">No households match</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* ── GAMES TAB ── */}
        {tab === 'games' && <GamesTab games={games} households={households} events={events} inviteMap={inviteMap} />}

        {/* ── ACTIVITY TAB ── */}
        {tab === 'activity' && (
          <Section title={`Activity log — ${events.length} events`}>
            <div className="flex gap-2 mb-4 flex-wrap items-center">
              <span className="text-xs text-foreground/40">Filter:</span>
              {['all', ...eventTypes].map(type => (
                <button key={type} type="button" onClick={() => setActivityFilter(type)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${activityFilter === type ? 'bg-foreground/10 text-foreground border-foreground/20' : 'border-foreground/10 text-foreground/40 hover:text-foreground/60'}`}>
                  {type}
                </button>
              ))}
            </div>
            <div className="border border-foreground/10 rounded-sm overflow-x-auto">
              <table className="w-full">
                <thead><tr><Th>Time</Th><Th>Who</Th><Th>Device</Th><Th>Event</Th><Th>Page</Th><Th>Details</Th></tr></thead>
                <tbody>
                  {filteredEvents.map((e, i) => {
                    const inviteHousehold = e.invite_id ? inviteMap.get(e.invite_id) : undefined;
                    const who = resolveWho(e);
                    const householdLabel = inviteHousehold
                      ? (inviteHousehold.informal_name || inviteHousehold.party_name)
                      : null;
                    const device = parseDevice(e.session_ua);
                    const loc = [e.session_city, e.session_country].filter(Boolean).join(', ');
                    return (
                      <tr key={i} className="hover:bg-foreground/[0.02]">
                        <Td className="text-foreground/40 whitespace-nowrap">{fmt(e.created_at)}</Td>
                        <Td>
                          {who
                            ? <div>
                                <span className="text-xs font-normal text-foreground/80">{who}</span>
                                {householdLabel && householdLabel !== who && (
                                  <div className="text-[10px] text-foreground/35 mt-0.5">{householdLabel}</div>
                                )}
                              </div>
                            : <span className="text-xs text-foreground/25">—</span>}
                        </Td>
                        <Td>
                          {device
                            ? <div>
                                <div className="text-xs text-foreground/60">{device}</div>
                                {loc && <div className="text-[10px] text-foreground/35 mt-0.5">{loc}</div>}
                              </div>
                            : <span className="text-xs text-foreground/25">—</span>}
                        </Td>
                        <Td><span className="text-xs bg-foreground/5 px-1.5 py-0.5 rounded font-mono">{e.event_type}</span></Td>
                        <Td className="text-foreground/50">{e.page || '—'}</Td>
                        <Td className="text-foreground/40 text-xs">
                          {e.metadata && Object.keys(e.metadata).length > 0
                            ? Object.entries(e.metadata).filter(([k]) => !['email', 'name'].includes(k)).map(([k, v]) => `${k}: ${v}`).join(' · ') || '—'
                            : '—'}
                        </Td>
                      </tr>
                    );
                  })}
                  {filteredEvents.length === 0 && (
                    <tr><td colSpan={6} className="text-center text-xs text-foreground/30 py-8">No events</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {events.length > 200 && <p className="text-xs text-foreground/30 mt-2 text-center">Showing 200 of {events.length} events</p>}
          </Section>
        )}

      </div>
    </div>
  );
}
