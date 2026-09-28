// Shared text helpers for Key Info — used by the page (backdoor/pages/KeyInfo.tsx)
// and the PDF export (<repo>/backdoor/key-info/export-pdf.ts) so both read the same way.
import { GROUP_ZH, NAME_ZH, PHRASE_ZH } from '../data/keyInfoZh';

export const lines = (text?: string) => (text ?? '').split('\n').map((l) => l.trim()).filter(Boolean);

// Chinese for one line of English: phrase table, then names, then group
// names; anything unknown stays in English.
export const zhLine = (l: string) => PHRASE_ZH[l] ?? NAME_ZH[l] ?? GROUP_ZH[l] ?? l;

export interface Pair { en: string; zh: string }

// English lines paired with their Chinese. An override replaces the Chinese
// wholesale (paired line by line as far as the counts allow).
export function bi(text?: string, override?: string): Pair[] {
  const en = lines(text);
  const ov = lines(override);
  if (!ov.length) return en.map((l) => ({ en: l, zh: zhLine(l) }));
  return Array.from({ length: Math.max(en.length, ov.length) }, (_, i) => ({ en: en[i] ?? '', zh: ov[i] ?? '' }));
}

// ── Chronological ordering ────────────────────────────────────────────────
// "When" lines are free text ("Fri 3:00 pm rehearsal", "7:10 pm reception",
// "Thu–Sun our base"), so they're ordered by a light parse: the first
// weekday named (a line without one inherits the previous line's day;
// Saturday — the wedding — if none at all) plus the first clock time.
// Lines that can't be read keep their place after the ones that can.
const WEEKDAYS: Record<string, number> = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };
const WEDDING_DAY = WEEKDAYS.sat;

function lineMinutes(line: string, day: number): { day: number; minutes: number | null } {
  const d = line.toLowerCase().match(/\b(mon|tue|wed|thu|fri|sat|sun)/);
  const dayIdx = d ? WEEKDAYS[d[1]] : day;
  const t = line.toLowerCase().match(/(\d{1,2})(?::(\d{2}))?\s*(?:[–-]\s*\d{1,2}(?::\d{2})?\s*)?(am|pm)/);
  let minutes: number | null = null;
  if (t) {
    const h = (Number(t[1]) % 12) + (t[3] === 'pm' ? 12 : 0);
    minutes = h * 60 + Number(t[2] ?? 0);
  } else if (/\bnight\b/i.test(line)) minutes = 21 * 60;
  else if (d) minutes = 0; // a day with no time sorts to the start of that day
  return { day: dayIdx, minutes };
}

export function sortWhen(text?: string): { lines: string[]; first: number } {
  let day = WEDDING_DAY;
  const parsed = lines(text).map((line, i) => {
    const r = lineMinutes(line, day);
    day = r.day;
    return { line, i, key: r.minutes === null ? null : r.day * 1440 + r.minutes };
  });
  const known = parsed.filter((x) => x.key !== null).sort((a, b) => a.key! - b.key! || a.i - b.i);
  const unknown = parsed.filter((x) => x.key === null);
  return { lines: [...known, ...unknown].map((x) => x.line), first: known[0]?.key ?? Number.MAX_SAFE_INTEGER };
}
