import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { BackdoorGate } from '../components/BackdoorGate';

const IS_LOCAL = typeof window !== 'undefined' && window.location.hostname === 'localhost';

const TODO_TRACKER_URL = IS_LOCAL ? 'http://localhost:4242/' : '/todos/';

// The real timeline is the standalone app in <repo>/backdoor/master-timeline/
// (port 4343 locally, proxied at /timeline/ in production — see nginx config).
const MASTER_TIMELINE_URL = IS_LOCAL ? 'http://localhost:4343/' : '/timeline/';

// Matches BACKDOOR_AUTH_KEY in master-timeline/public/app.js. baoben.love and
// /timeline/ are the same origin (nginx path-routes both), so setting this
// here lets the standalone app skip its own password prompt once someone's
// already past this hub — same trick as the seating chart's vendor gate.
const MASTER_TIMELINE_AUTH_KEY = 'baoben-timeline-auth';

interface LinkItem {
  label: string;
  zh: string;
  href: string;
  external?: boolean;
}

// Top-level list — reachable once past the /backdoor gate, no further
// password needed.
const TOP_LINKS: LinkItem[] = [
  { label: 'Master Timeline', zh: '总时间表', href: MASTER_TIMELINE_URL, external: true },
  { label: 'Setup Checklist', zh: '布置清单', href: '/backdoor/setup' },
  { label: 'Key Info — Places & People', zh: '关键信息 — 地点与人员', href: '/backdoor/info' },
];

// Admin group — everything that touches real guest data. Each of these pages
// enforces its own Admin password directly (see AdminGate.tsx), so this is
// just a disclosure grouping them on the hub — the actual gate lives on the
// destination page, not here, so a direct URL is gated the same way.
const ADMIN_LINKS: LinkItem[] = [
  { label: 'RSVP Dashboard', zh: '回复统计', href: '/backdoor/admin/dashboard' },
  { label: 'Seating Chart', zh: '座位表', href: '/backdoor/admin/seating' },
  { label: 'To-Do Tracker', zh: '待办事项', href: TODO_TRACKER_URL, external: true },
  { label: 'Packing Checklist', zh: '打包清单', href: '/backdoor/admin/packing' },
];

function LinkLabel({ label, zh }: { label: string; zh: string }) {
  return (
    <span>
      {label}
      <span className="block text-xs text-foreground/50 mt-0.5">{zh}</span>
    </span>
  );
}

function LinkRow({ link }: { link: LinkItem }) {
  const className =
    'flex items-center justify-between border border-foreground/10 hover:border-primary/50 hover:bg-primary/5 px-5 py-4 font-light text-foreground transition-colors';
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
        <LinkLabel label={link.label} zh={link.zh} /> <span className="text-foreground/30">↗</span>
      </a>
    );
  }
  return (
    <Link to={link.href} className={className}>
      <LinkLabel label={link.label} zh={link.zh} />
    </Link>
  );
}

function AdminGroup() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-foreground/10">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 font-light text-foreground hover:bg-primary/5 transition-colors"
      >
        <LinkLabel label="Admin" zh="管理" />
        <span className="text-foreground/30">{expanded ? '−' : '+'}</span>
      </button>
      {expanded && (
        <div className="border-t border-foreground/10 p-3 space-y-3 bg-foreground/[0.02]">
          {ADMIN_LINKS.map((link) => (
            <LinkRow key={link.label} link={link} />
          ))}
        </div>
      )}
    </div>
  );
}

function Hub() {
  useEffect(() => {
    try { localStorage.setItem(MASTER_TIMELINE_AUTH_KEY, 'true'); } catch {}
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4 w-full max-w-sm">
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-10" />
        <p className="text-xs tracking-[0.25em] uppercase text-foreground/40 mb-2">baoben.love</p>
        <h1 className="text-2xl mb-10" style={{ fontFamily: 'var(--font-heading)' }}>Backdoor</h1>
        <div className="space-y-3 text-left">
          <AdminGroup />
          {TOP_LINKS.map((link) => (
            <LinkRow key={link.label} link={link} />
          ))}
        </div>
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-secondary to-transparent mx-auto mt-10" />
      </div>
    </div>
  );
}

export function Backdoor() {
  return (
    <BackdoorGate>
      <Hub />
    </BackdoorGate>
  );
}
