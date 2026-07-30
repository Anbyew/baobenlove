/**
 * Wipes all guest data and re-seeds the invites table from guests.tsv.
 *
 * Usage (run from repo root or server/):
 *   node server/scripts/reseed.mjs
 *   DB_PATH=/path/to/wedding.db node server/scripts/reseed.mjs
 */

import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { randomBytes } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || join(__dirname, '../data/wedding.db');
const TSV_PATH = process.env.GUESTS_TSV || join(__dirname, '../../guests.tsv');

mkdirSync(dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF');

console.log(`DB:  ${DB_PATH}`);
console.log(`TSV: ${TSV_PATH}`);
console.log('');

// Wipe all guest-dependent data
db.transaction(() => {
  const tables = [
    'dance_scores',
    'dance_rounds',
    'garden_sessions',
    'garden_state',
    'events',
    'sessions',
    'unmatched_guests',
    'invites',
  ];
  for (const t of tables) {
    const { changes } = db.prepare(`DELETE FROM ${t}`).run();
    console.log(`  Cleared ${t}: ${changes} rows`);
  }
})();

// Re-seed from TSV
const content = readFileSync(TSV_PATH, 'utf8');
const lines = content.split('\n').map(l => l.trimEnd()).filter(Boolean);
const headers = lines[0].split('\t');

const col = (name) => headers.findIndex(h => h.trim() === name);
const iAffiliation = col('Affiliation');
const iRelation    = col('Relation');
const iName        = col('Name');
const iEnvelope    = col('Name on Envelope');
const iEmail       = col('Email');
const iCount       = col('Count');
const iNickname    = col('Nickname');
const iRehearsal   = col('Rehearsal Dinner');

const insert = db.prepare(`
  INSERT INTO invites (token, party_name, informal_name, affiliation, relation, emails, guest_names, max_guests, nickname, rehearsal_dinner)
  VALUES (@token, @party_name, @informal_name, @affiliation, @relation, @emails, @guest_names, @max_guests, @nickname, @rehearsal_dinner)
`);

const rows = lines.slice(1).flatMap(line => {
  const cols = line.split('\t');
  const emailsRaw = cols[iEmail] || '';
  const emails = emailsRaw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  if (!emails.length) return [];

  const name = cols[iName]?.trim() || '';
  const guestNames = name
    ? name.split(/[,&]/).map(n => n.trim()).filter(Boolean)
    : [];

  return [{
    token:        randomBytes(18).toString('base64url'),
    party_name:   cols[iEnvelope]?.trim() || name || 'Guest',
    informal_name: name || null,
    affiliation:  cols[iAffiliation]?.trim() || null,
    relation:     cols[iRelation]?.trim() || null,
    emails:       JSON.stringify(emails),
    guest_names:  JSON.stringify(guestNames),
    max_guests:   Math.max(1, parseInt(cols[iCount] || '1', 10) || 1),
    nickname:     iNickname >= 0 ? (cols[iNickname]?.trim() || null) : null,
    rehearsal_dinner: iRehearsal >= 0 ? (cols[iRehearsal]?.trim() || '') : '',
  }];
});

db.transaction((rows) => { for (const r of rows) insert.run(r); })(rows);

db.pragma('foreign_keys = ON');

console.log('');
console.log(`Seeded ${rows.length} households from guests.tsv`);
console.log('Done.');
