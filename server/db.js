import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { randomBytes } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || join(__dirname, 'data', 'wedding.db');

mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS invites (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    token                TEXT UNIQUE NOT NULL,
    party_name           TEXT NOT NULL,
    informal_name        TEXT,
    affiliation          TEXT,
    relation             TEXT,
    emails               TEXT DEFAULT '[]',
    guest_names          TEXT DEFAULT '[]',
    max_guests           INTEGER DEFAULT 1,
    attendance           TEXT DEFAULT '',
    guest_count          INTEGER,
    dietary_restrictions TEXT DEFAULT '',
    song_request         TEXT DEFAULT '',
    submitted_at         TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    token        TEXT UNIQUE NOT NULL,
    invite_id    INTEGER NOT NULL REFERENCES invites(id),
    email        TEXT NOT NULL,
    name         TEXT,
    language     TEXT DEFAULT 'en',
    created_at   TEXT NOT NULL,
    expires_at   TEXT NOT NULL,
    last_seen_at TEXT
  );

  CREATE TABLE IF NOT EXISTS events (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    session_token TEXT,
    invite_id     INTEGER,
    event_type    TEXT NOT NULL,
    page          TEXT,
    referrer      TEXT,
    user_agent    TEXT,
    metadata      TEXT DEFAULT '{}',
    created_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS garden_state (
    invite_id  INTEGER PRIMARY KEY REFERENCES invites(id),
    items      TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS escape_state (
    obstacle_id TEXT PRIMARY KEY,
    note        TEXT DEFAULT '',
    cleared_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS climb_state (
    boost_id   TEXT PRIMARY KEY,
    note       TEXT DEFAULT '',
    cleared_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS moonboard_holds (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    row        INTEGER NOT NULL,
    col        INTEGER NOT NULL,
    guest_name TEXT NOT NULL,
    message    TEXT DEFAULT '',
    shape      TEXT NOT NULL,
    color      TEXT NOT NULL,
    placed_at  TEXT NOT NULL,
    UNIQUE(row, col)
  );

  CREATE INDEX IF NOT EXISTS idx_invites_token   ON invites(token);
  CREATE INDEX IF NOT EXISTS idx_sessions_token  ON sessions(token);
  CREATE INDEX IF NOT EXISTS idx_sessions_invite ON sessions(invite_id);
  CREATE INDEX IF NOT EXISTS idx_events_invite   ON events(invite_id);
  CREATE INDEX IF NOT EXISTS idx_events_session  ON events(session_token);
  CREATE INDEX IF NOT EXISTS idx_events_type     ON events(event_type);
  CREATE INDEX IF NOT EXISTS idx_events_created  ON events(created_at);
`);

// --- Seeding ---

function seedFromTsv(tsvPath) {
  const content = readFileSync(tsvPath, 'utf8');
  const lines = content.split('\n').map(l => l.trimEnd()).filter(Boolean);
  const headers = lines[0].split('\t');

  const col = (name) => headers.findIndex(h => h.trim() === name);
  const iAffiliation = col('Affiliation');
  const iRelation = col('Relation');
  const iName = col('Name');
  const iEnvelope = col('Name on Envelope');
  const iEmail = col('Email');
  const iCount = col('Count');

  const insert = db.prepare(`
    INSERT OR IGNORE INTO invites (token, party_name, informal_name, affiliation, relation, emails, guest_names, max_guests)
    VALUES (@token, @party_name, @informal_name, @affiliation, @relation, @emails, @guest_names, @max_guests)
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
      token: randomBytes(18).toString('base64url'),
      party_name: cols[iEnvelope]?.trim() || name || 'Guest',
      informal_name: name || null,
      affiliation: cols[iAffiliation]?.trim() || null,
      relation: cols[iRelation]?.trim() || null,
      emails: JSON.stringify(emails),
      guest_names: JSON.stringify(guestNames),
      max_guests: Math.max(1, parseInt(cols[iCount] || '1', 10) || 1),
    }];
  });

  db.transaction((rows) => { for (const r of rows) insert.run(r); })(rows);
  console.log(`Seeded ${rows.length} households from TSV: ${tsvPath}`);
}

function seedFromManifest(manifestPath) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const insert = db.prepare(`
    INSERT OR IGNORE INTO invites (token, party_name, emails, guest_names, max_guests)
    VALUES (@token, @party_name, @emails, @guest_names, @max_guests)
  `);
  const rows = (manifest.invites || []).map(inv => ({
    token: inv.token,
    party_name: inv.party_name,
    emails: JSON.stringify([inv.primary_email, inv.secondary_email].filter(Boolean).map(e => e.toLowerCase())),
    guest_names: JSON.stringify(inv.guest_names || []),
    max_guests: inv.max_guests || 1,
  }));
  db.transaction((rows) => { for (const r of rows) insert.run(r); })(rows);
  console.log(`Seeded ${rows.length} invites from manifest`);
}

const { count } = db.prepare('SELECT COUNT(*) as count FROM invites').get();
if (count === 0) {
  const candidates = [
    process.env.GUESTS_TSV,
    join(__dirname, '../guests.tsv'),
    join(__dirname, '../../emails/testList.tsv'),
  ].filter(Boolean);

  let seeded = false;
  for (const path of candidates) {
    try { seedFromTsv(path); seeded = true; break; } catch {}
  }

  if (!seeded) {
    try {
      seedFromManifest(join(__dirname, '../wedding-site/generated/invites/invite_manifest.json'));
    } catch (err) {
      console.warn('Could not seed invites:', err.message);
    }
  }
}

// --- Helpers ---

function parseJson(v, fallback = []) {
  try { return JSON.parse(v); } catch { return fallback; }
}

function normalizeEmail(v) {
  return String(v ?? '').trim().toLowerCase();
}

function normalizeCompare(v) {
  return normalizeEmail(v).replace(/[^a-z0-9]+/g, '');
}

function toInviteSession(row) {
  return {
    id: String(row.id),
    token: String(row.token),
    partyName: String(row.party_name ?? 'Our guests'),
    informalName: row.informal_name || null,
    affiliation: row.affiliation || null,
    relation: row.relation || null,
    emails: parseJson(row.emails, []),
    guestNames: parseJson(row.guest_names, []),
    maxGuests: Number(row.max_guests ?? 1) || 1,
    rsvp: {
      attendance: row.attendance === 'yes' || row.attendance === 'no' ? row.attendance : '',
      guestCount: row.guest_count == null ? null : Number(row.guest_count),
      dietaryRestrictions: String(row.dietary_restrictions ?? ''),
      songRequest: String(row.song_request ?? ''),
      submittedAt: row.submitted_at || null,
    },
  };
}

// --- Invite queries ---

export function lookupInviteByEmail(email) {
  const e = normalizeEmail(email);
  const row = db.prepare(`
    SELECT * FROM invites
    WHERE EXISTS (SELECT 1 FROM json_each(emails) WHERE value = ?)
    LIMIT 1
  `).get(e);
  return row ? toInviteSession(row) : null;
}

export function getInviteByToken(token) {
  const row = db.prepare('SELECT * FROM invites WHERE token = ? LIMIT 1').get(token);
  return row ? toInviteSession(row) : null;
}

export function lookupInviteByEmailAndName(email, name) {
  const e = normalizeEmail(email);
  const rows = db.prepare(`
    SELECT * FROM invites
    WHERE EXISTS (SELECT 1 FROM json_each(emails) WHERE value = ?)
    LIMIT 10
  `).all(e);

  const normName = normalizeCompare(name);
  const match = rows.find(row => {
    const candidates = [row.party_name, row.informal_name, ...parseJson(row.guest_names, [])].filter(Boolean);
    return candidates.some(c => {
      const n = normalizeCompare(c);
      return n === normName || n.includes(normName) || normName.includes(n);
    });
  });
  return match ? toInviteSession(match) : null;
}

export function updateInviteRsvp(token, payload) {
  const result = db.prepare(`
    UPDATE invites
    SET attendance = @attendance, guest_count = @guest_count,
        dietary_restrictions = @dietary_restrictions,
        song_request = @song_request, submitted_at = @submitted_at
    WHERE token = @token
  `).run({ token, ...payload });
  return result.changes > 0 ? getInviteByToken(token) : null;
}

// --- Sessions ---

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function createSession(inviteId, email, name, language = 'en') {
  const token = randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  db.prepare(`
    INSERT INTO sessions (token, invite_id, email, name, language, created_at, expires_at, last_seen_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(token, inviteId, normalizeEmail(email), name, language, now.toISOString(), expiresAt.toISOString(), now.toISOString());
  return token;
}

export function validateSession(token) {
  if (!token) return null;
  const row = db.prepare('SELECT * FROM sessions WHERE token = ? LIMIT 1').get(token);
  if (!row) return null;
  if (new Date() > new Date(row.expires_at)) return null;

  db.prepare('UPDATE sessions SET last_seen_at = ? WHERE token = ?')
    .run(new Date().toISOString(), token);

  const inviteRow = db.prepare('SELECT * FROM invites WHERE id = ? LIMIT 1').get(row.invite_id);
  return {
    sessionToken: token,
    email: row.email,
    name: row.name,
    language: row.language,
    invite: inviteRow ? toInviteSession(inviteRow) : null,
  };
}

// --- Events ---

export function updateSession(token, { name, language } = {}) {
  const fields = [];
  const params = [];
  if (name !== undefined) { fields.push('name = ?'); params.push(name); }
  if (language !== undefined) { fields.push('language = ?'); params.push(language); }
  if (!fields.length) return false;
  params.push(token);
  const result = db.prepare(`UPDATE sessions SET ${fields.join(', ')} WHERE token = ?`).run(...params);
  return result.changes > 0;
}

// --- Moonboard ---

function toMoonboardHold(row) {
  return {
    id: String(row.id),
    row: row.row,
    col: row.col,
    guestName: row.guest_name,
    message: row.message || '',
    shape: row.shape,
    color: row.color,
    placedAt: row.placed_at,
  };
}

export function getMoonboardHolds() {
  return db.prepare('SELECT * FROM moonboard_holds ORDER BY id ASC').all().map(toMoonboardHold);
}

// Returns the new hold, or null if the cell is already taken.
// The UNIQUE(row, col) constraint makes this an atomic "first write wins" lock.
export function placeMoonboardHold({ row, col, guestName, message, shape, color }) {
  const placedAt = new Date().toISOString();
  try {
    const result = db.prepare(`
      INSERT INTO moonboard_holds (row, col, guest_name, message, shape, color, placed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(row, col, guestName, message, shape, color, placedAt);
    return toMoonboardHold({
      id: result.lastInsertRowid, row, col,
      guest_name: guestName, message, shape, color, placed_at: placedAt,
    });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') return null;
    throw err;
  }
}

// --- Garden ---

export function getGardenItems(inviteId) {
  const row = db.prepare('SELECT items FROM garden_state WHERE invite_id = ?').get(inviteId);
  return row ? parseJson(row.items, []) : [];
}

export function setGardenItems(inviteId, items) {
  db.prepare(`
    INSERT INTO garden_state (invite_id, items, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(invite_id) DO UPDATE SET items = excluded.items, updated_at = excluded.updated_at
  `).run(inviteId, JSON.stringify(items), new Date().toISOString());
}

// --- Escape the Reception ---

export function getEscapeCleared() {
  const rows = db.prepare('SELECT obstacle_id, note, cleared_at FROM escape_state').all();
  const cleared = {};
  for (const row of rows) {
    cleared[row.obstacle_id] = { note: row.note || '', clearedAt: row.cleared_at };
  }
  return cleared;
}

// Returns the cleared entry, or null if this obstacle was already cleared (first clear wins).
export function clearEscapeObstacle({ obstacleId, note }) {
  const clearedAt = new Date().toISOString();
  try {
    db.prepare(`
      INSERT INTO escape_state (obstacle_id, note, cleared_at) VALUES (?, ?, ?)
    `).run(obstacleId, note, clearedAt);
    return { note, clearedAt };
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') return null;
    throw err;
  }
}

// --- Drag Ben Up the Mountain ---

export function getClimbCleared() {
  const rows = db.prepare('SELECT boost_id, note, cleared_at FROM climb_state').all();
  const cleared = {};
  for (const row of rows) {
    cleared[row.boost_id] = { note: row.note || '', clearedAt: row.cleared_at };
  }
  return cleared;
}

// Returns the cleared entry, or null if this boost was already cleared (first clear wins).
export function clearClimbBoost({ boostId, note }) {
  const clearedAt = new Date().toISOString();
  try {
    db.prepare(`
      INSERT INTO climb_state (boost_id, note, cleared_at) VALUES (?, ?, ?)
    `).run(boostId, note, clearedAt);
    return { note, clearedAt };
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') return null;
    throw err;
  }
}

export function logEvent({ sessionToken, inviteId, eventType, page, referrer, userAgent, metadata }) {
  db.prepare(`
    INSERT INTO events (session_token, invite_id, event_type, page, referrer, user_agent, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sessionToken || null,
    inviteId || null,
    eventType,
    page || null,
    referrer || null,
    userAgent || null,
    JSON.stringify(metadata || {}),
    new Date().toISOString(),
  );
}
