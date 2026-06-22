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

  CREATE TABLE IF NOT EXISTS garden_sessions (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    invite_id      INTEGER NOT NULL REFERENCES invites(id),
    session_number INTEGER NOT NULL,
    items          TEXT NOT NULL DEFAULT '[]',
    started_at     TEXT NOT NULL,
    archived_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS escape_sessions (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    session_number INTEGER NOT NULL,
    obstacles      TEXT NOT NULL DEFAULT '[]',
    started_at     TEXT NOT NULL,
    archived_at    TEXT NOT NULL,
    total_raised   INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS dance_rounds (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    invite_id      INTEGER NOT NULL REFERENCES invites(id),
    player_name    TEXT NOT NULL,
    total_score    INTEGER NOT NULL,
    total_restarts INTEGER NOT NULL,
    games          TEXT NOT NULL DEFAULT '[]',
    completed_at   TEXT NOT NULL
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

  CREATE TABLE IF NOT EXISTS unmatched_guests (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    token        TEXT UNIQUE NOT NULL,
    email        TEXT NOT NULL,
    name         TEXT,
    language     TEXT DEFAULT 'en',
    created_at   TEXT NOT NULL,
    expires_at   TEXT NOT NULL,
    last_seen_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_invites_token      ON invites(token);
  CREATE INDEX IF NOT EXISTS idx_sessions_token     ON sessions(token);
  CREATE INDEX IF NOT EXISTS idx_sessions_invite    ON sessions(invite_id);
  CREATE INDEX IF NOT EXISTS idx_unmatched_token    ON unmatched_guests(token);
  CREATE INDEX IF NOT EXISTS idx_events_invite      ON events(invite_id);
  CREATE INDEX IF NOT EXISTS idx_events_session     ON events(session_token);
  CREATE INDEX IF NOT EXISTS idx_events_type        ON events(event_type);
  CREATE INDEX IF NOT EXISTS idx_events_created     ON events(created_at);
  CREATE INDEX IF NOT EXISTS idx_dance_rounds_invite ON dance_rounds(invite_id);
  CREATE INDEX IF NOT EXISTS idx_dance_rounds_score  ON dance_rounds(total_score);
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

export function lookupInviteByName(name) {
  const normName = normalizeCompare(name);
  if (!normName) return null;
  const rows = db.prepare('SELECT * FROM invites').all();
  const match = rows.find(row => {
    const candidates = [row.party_name, row.informal_name, ...parseJson(row.guest_names, [])].filter(Boolean);
    return candidates.some(c => {
      const n = normalizeCompare(c);
      return n === normName || n.includes(normName) || normName.includes(n);
    });
  });
  return match ? toInviteSession(match) : null;
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

export function createUnmatchedSession(email, name, language = 'en') {
  const token = randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  db.prepare(`
    INSERT INTO unmatched_guests (token, email, name, language, created_at, expires_at, last_seen_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(token, normalizeEmail(email), name, language, now.toISOString(), expiresAt.toISOString(), now.toISOString());
  return token;
}

export function getUnmatchedGuests() {
  // Exclude emails that have since been added to the invite list
  return db.prepare(`
    SELECT ug.* FROM unmatched_guests ug
    WHERE NOT EXISTS (
      SELECT 1 FROM invites i, json_each(i.emails) je
      WHERE LOWER(je.value) = LOWER(ug.email)
    )
    ORDER BY ug.created_at DESC
  `).all();
}

export function validateSession(token) {
  if (!token) return null;

  const row = db.prepare('SELECT * FROM sessions WHERE token = ? LIMIT 1').get(token);
  if (row) {
    if (new Date() > new Date(row.expires_at)) return null;
    db.prepare('UPDATE sessions SET last_seen_at = ? WHERE token = ?').run(new Date().toISOString(), token);
    const inviteRow = db.prepare('SELECT * FROM invites WHERE id = ? LIMIT 1').get(row.invite_id);
    return {
      sessionToken: token,
      email: row.email,
      name: row.name,
      language: row.language,
      invite: inviteRow ? toInviteSession(inviteRow) : null,
    };
  }

  const umRow = db.prepare('SELECT * FROM unmatched_guests WHERE token = ? LIMIT 1').get(token);
  if (!umRow) return null;
  if (new Date() > new Date(umRow.expires_at)) return null;
  db.prepare('UPDATE unmatched_guests SET last_seen_at = ? WHERE token = ?').run(new Date().toISOString(), token);
  return {
    sessionToken: token,
    email: umRow.email,
    name: umRow.name,
    language: umRow.language,
    invite: null,
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

// --- Garden sessions ---

export function archiveGarden(inviteId) {
  const now = new Date().toISOString();
  const current = db.prepare('SELECT items, updated_at FROM garden_state WHERE invite_id = ?').get(inviteId);
  if (!current) return null;
  const items = parseJson(current.items, []);
  if (!items.length) return null;
  const sessionNumber = (db.prepare('SELECT COUNT(*) as n FROM garden_sessions WHERE invite_id = ?').get(inviteId).n) + 1;
  db.prepare(`
    INSERT INTO garden_sessions (invite_id, session_number, items, started_at, archived_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(inviteId, sessionNumber, current.items, current.updated_at, now);
  db.prepare('DELETE FROM garden_state WHERE invite_id = ?').run(inviteId);
  return sessionNumber;
}

export function getGardenSessions(inviteId) {
  return db.prepare('SELECT id, session_number, items, started_at, archived_at FROM garden_sessions WHERE invite_id = ? ORDER BY session_number DESC').all(inviteId)
    .map(r => ({ ...r, items: parseJson(r.items, []) }));
}

export function updateGardenSession(inviteId, sessionId, items) {
  const result = db.prepare(`
    UPDATE garden_sessions
    SET items = ?, archived_at = ?
    WHERE id = ? AND invite_id = ?
  `).run(JSON.stringify(items), new Date().toISOString(), sessionId, inviteId);
  return result.changes > 0;
}

export function clearGardenForInvite(inviteId) {
  const deleteState = db.prepare('DELETE FROM garden_state WHERE invite_id = ?').run(inviteId);
  const deleteSessions = db.prepare('DELETE FROM garden_sessions WHERE invite_id = ?').run(inviteId);
  return {
    state: deleteState.changes,
    sessions: deleteSessions.changes,
  };
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

// --- Escape sessions ---

const ESCAPE_PRICES = { tutorial: 20, toes: 25, warmup: 30, crowd: 25, dip: 40, mom: 30, spin: 35, encore: 50 };

export function archiveEscape() {
  const now = new Date().toISOString();
  const rows = db.prepare('SELECT obstacle_id, note, cleared_at FROM escape_state ORDER BY cleared_at ASC').all();
  if (!rows.length) return null;
  const obstacles = rows.map(r => ({
    id: r.obstacle_id,
    note: r.note || '',
    clearedAt: r.cleared_at,
    amount: ESCAPE_PRICES[r.obstacle_id] || 0,
  }));
  const totalRaised = obstacles.reduce((sum, o) => sum + o.amount, 0);
  const startedAt = rows[0].cleared_at;
  const sessionNumber = (db.prepare('SELECT COUNT(*) as n FROM escape_sessions').get().n) + 1;
  db.prepare(`
    INSERT INTO escape_sessions (session_number, obstacles, started_at, archived_at, total_raised)
    VALUES (?, ?, ?, ?, ?)
  `).run(sessionNumber, JSON.stringify(obstacles), startedAt, now, totalRaised);
  db.prepare('DELETE FROM escape_state').run();
  return sessionNumber;
}

export function getEscapeSessions() {
  return db.prepare('SELECT id, session_number, obstacles, started_at, archived_at, total_raised FROM escape_sessions ORDER BY session_number DESC').all()
    .map(r => ({ ...r, obstacles: parseJson(r.obstacles, []) }));
}

// --- Dance scoring ---

export function saveDanceRound(inviteId, playerName, round) {
  db.prepare(`
    INSERT INTO dance_rounds (invite_id, player_name, total_score, total_restarts, games, completed_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    inviteId,
    playerName,
    round.totalScore,
    round.totalRestarts,
    JSON.stringify(round.games),
    round.completedAt || new Date().toISOString(),
  );
}

export function getDanceLeaderboard() {
  const rows = db.prepare(`
    SELECT invite_id, player_name, total_score, total_restarts, games, completed_at
    FROM dance_rounds
    ORDER BY total_score DESC, total_restarts ASC, completed_at ASC
  `).all();

  const bestByInvite = new Map();
  for (const row of rows) {
    if (bestByInvite.has(row.invite_id)) continue;
    bestByInvite.set(row.invite_id, {
      inviteId: row.invite_id,
      playerName: row.player_name,
      totalScore: row.total_score,
      totalRestarts: row.total_restarts,
      completedAt: row.completed_at,
      games: parseJson(row.games, []),
    });
  }

  return [...bestByInvite.values()]
    .sort((a, b) =>
      b.totalScore - a.totalScore ||
      a.totalRestarts - b.totalRestarts ||
      new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    )
    .slice(0, 20);
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

// --- Admin queries ---

export function getAdminStats() {
  return {
    households: db.prepare('SELECT COUNT(*) as n FROM invites').get().n,
    totalGuests: db.prepare('SELECT COALESCE(SUM(max_guests),0) as n FROM invites').get().n,
    sessions: db.prepare('SELECT COUNT(*) as n FROM sessions').get().n,
    unmatched: db.prepare(`SELECT COUNT(*) as n FROM unmatched_guests ug WHERE NOT EXISTS (SELECT 1 FROM invites i, json_each(i.emails) je WHERE LOWER(je.value) = LOWER(ug.email))`).get().n,
    rsvpYes: db.prepare("SELECT COUNT(*) as n FROM invites WHERE attendance='yes'").get().n,
    rsvpNo: db.prepare("SELECT COUNT(*) as n FROM invites WHERE attendance='no'").get().n,
  };
}

export function getAdminSessions() {
  return db.prepare('SELECT email, name, language, created_at, last_seen_at FROM sessions ORDER BY created_at DESC').all();
}

export function getAdminEvents(limit = 100) {
  return db.prepare(`
    SELECT e.invite_id, e.session_token, e.event_type, e.page, e.metadata, e.created_at,
           s.name as session_name, s.email as session_email,
           i.party_name, i.informal_name
    FROM events e
    LEFT JOIN sessions s ON s.session_token = e.session_token
    LEFT JOIN invites i ON i.id = e.invite_id
    ORDER BY e.created_at DESC LIMIT ?
  `).all(limit)
    .map(r => ({ ...r, metadata: parseJson(r.metadata, {}) }));
}

export function getAdminRsvps() {
  return db.prepare("SELECT party_name, attendance, guest_count, dietary_restrictions, song_request, submitted_at FROM invites WHERE attendance != '' ORDER BY submitted_at DESC").all();
}

export function getAdminHouseholds() {
  const invites = db.prepare('SELECT * FROM invites ORDER BY party_name ASC').all();
  const sessions = db.prepare('SELECT invite_id, email, name, language, created_at, last_seen_at FROM sessions ORDER BY created_at DESC').all();
  const gardens = db.prepare('SELECT invite_id, items, updated_at FROM garden_state').all();
  const events = db.prepare(
    "SELECT invite_id, event_type, page, metadata, created_at FROM events WHERE event_type IN ('click','login','login_unmatched') ORDER BY created_at DESC"
  ).all().map(r => ({ ...r, metadata: parseJson(r.metadata, {}) }));

  const GARDEN_PRICES = { grass: 2, bush: 8, sunflower: 16, cherryTree: 32 };

  return invites.map(inv => {
    const invSessions = sessions.filter(s => s.invite_id === inv.id);
    const garden = gardens.find(g => g.invite_id === inv.id);
    const invEvents = events.filter(e => e.invite_id === inv.id);
    const gardenItems = parseJson(garden?.items, []);
    const gardenValue = gardenItems.reduce((sum, it) => sum + (GARDEN_PRICES[it.plantType] || 0), 0);

    // Estimate donation amounts from click events
    const venmoClicks = invEvents.filter(e => e.event_type === 'click' && String(e.metadata?.label || '').includes('pay_venmo'));
    const zelleViews = invEvents.filter(e => e.event_type === 'click' && e.metadata?.label === 'zelle_view');
    const moonboardHolds = invEvents.filter(e => e.event_type === 'click' && e.metadata?.label === 'moonboard_hold_submitted');
    const moonboardAmount = moonboardHolds.reduce((sum, e) => sum + (Number(e.metadata?.amount) || 0), 0);
    const pageViews = invEvents.filter(e => e.event_type === 'page_view').length;

    return {
      id: inv.id,
      party_name: inv.party_name,
      informal_name: inv.informal_name,
      affiliation: inv.affiliation,
      max_guests: inv.max_guests,
      attendance: inv.attendance,
      guest_count: inv.guest_count,
      dietary_restrictions: inv.dietary_restrictions,
      song_request: inv.song_request,
      submitted_at: inv.submitted_at,
      emails: parseJson(inv.emails, []),
      sessions: invSessions,
      garden: { items: gardenItems, value: gardenValue, updatedAt: garden?.updated_at || null },
      recentEvents: invEvents.slice(0, 30),
      lastSeen: invSessions[0]?.last_seen_at || invSessions[0]?.created_at || null,
      hasLoggedIn: invSessions.length > 0,
      stats: { venmoClicks: venmoClicks.length, zelleViews: zelleViews.length, moonboardAmount, pageViews },
    };
  });
}

export function getAdminGames() {
  const escape = db.prepare('SELECT obstacle_id, note, cleared_at FROM escape_state').all();
  const climb = db.prepare('SELECT boost_id, note, cleared_at FROM climb_state').all();
  const moonboard = db.prepare('SELECT id, row, col, guest_name, message, shape, color, placed_at FROM moonboard_holds ORDER BY placed_at ASC').all();
  const dance = getDanceLeaderboard();
  const allDanceRounds = db.prepare('SELECT invite_id, player_name, total_score, total_restarts, completed_at FROM dance_rounds ORDER BY completed_at DESC').all();
  return { escape, climb, moonboard, dance, allDanceRounds };
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
