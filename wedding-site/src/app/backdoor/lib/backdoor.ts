// Shared constants for the owner-only pages under /backdoor.

export const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

// The /backdoor entry password (first of its two gates — see BackdoorGate.tsx).
export const BACKDOOR_PASSWORD = 'BellaBenBao2026Backdoor';

// Set once the backdoor password has been entered on this browser.
export const BACKDOOR_AUTH_KEY = 'baoben-backdoor-auth';

// A second, narrower password guarding the "Admin" group on the backdoor hub
// (RSVP Dashboard, Seating Chart, To-Do Tracker, Packing Checklist) — the
// pages that touch real guest data — one more confirmation beyond the
// /backdoor entry gate.
export const ADMIN_SECTION_PASSWORD = 'BaoDashBen';
export const ADMIN_SECTION_AUTH_KEY = 'baoben-backdoor-admin-auth';

// The seating chart's own vendor-password gate; the backdoor hub pre-unlocks
// it so owners aren't asked twice.
export const SEATING_VENDOR_AUTH_KEY = 'baoben-seating-vendor-auth';

// The seating chart's vendor password. The server's requireSeatingSecret()
// (SEATING_SECRET) checks it for /seating, /packing and /setup alike, sent as
// the x-seating-secret header.
export const SEATING_SECRET = 'BKVendor2026';
