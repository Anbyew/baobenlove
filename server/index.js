import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import {
  lookupInviteByEmail,
  getInviteByToken,
  lookupInviteByEmailAndName,
  updateInviteRsvp,
  createSession,
  validateSession,
  updateSession,
  logEvent,
  getMoonboardHolds,
  placeMoonboardHold,
  getGardenItems,
  setGardenItems,
  getEscapeCleared,
  clearEscapeObstacle,
  getClimbCleared,
  clearClimbBoost,
} from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const OTP_TTL_MS = 10 * 60 * 1000;
const PORT = process.env.PORT || 3000;

// --- Gmail helpers ---

async function getGmailAccessToken() {
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID,
      client_secret: process.env.GMAIL_CLIENT_SECRET,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error_description || 'Token refresh failed');
  return data.access_token;
}

async function sendGmail(accessToken, to, subject, html) {
  const raw = Buffer.from(
    [`To: ${to}`, `From: Yuwei & Ben <bellabenbao@gmail.com>`, `Subject: ${subject}`,
     'MIME-Version: 1.0', 'Content-Type: text/html; charset=UTF-8', '', html].join('\r\n')
  ).toString('base64url');
  const resp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
  });
  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.error?.message || 'Failed to send email');
  }
}

function buildEmailHtml(code) {
  return `
<html><body style="font-family: Georgia, serif; font-size: 16px; line-height: 1.7; color: #2a2a2a; max-width: 480px; margin: auto; padding: 40px 24px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="height: 1px; background: linear-gradient(to right, transparent, #78B7D0, transparent); margin-bottom: 24px;"></div>
    <h2 style="font-weight: 300; letter-spacing: 2px; font-size: 20px; margin: 0;">Yuwei &amp; Benjamin</h2>
    <p style="font-size: 12px; letter-spacing: 3px; color: #78B7D0; margin: 8px 0 0;">OCTOBER 3 · 2026</p>
  </div>
  <p style="margin-bottom: 8px;">Your verification code for <strong>baoben.love</strong> is:</p>
  <div style="text-align: center; margin: 32px 0;">
    <span style="font-size: 40px; letter-spacing: 16px; font-weight: 300; color: #2a2a2a; font-family: 'Courier New', monospace;">${code}</span>
  </div>
  <p style="font-size: 13px; color: #888; margin-top: 32px;">This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>
  <div style="height: 1px; background: linear-gradient(to right, transparent, #FFDC7F, transparent); margin-top: 32px;"></div>
</body></html>`;
}

// --- Routes ---

app.post('/send-otp', async (req, res) => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Please enter a valid email address.' });

    const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, OTP_SECRET } = process.env;
    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN || !OTP_SECRET)
      return res.status(500).json({ error: 'Email service is not configured.' });

    const code = String(randomInt(100000, 1000000));
    const expiresAt = Date.now() + OTP_TTL_MS;
    const token = createHmac('sha256', OTP_SECRET)
      .update(`${email}:${code}:${expiresAt}`)
      .digest('hex');

    const accessToken = await getGmailAccessToken();
    await sendGmail(accessToken, email, 'Your verification code — baoben.love', buildEmailHtml(code));

    res.json({ token, expiresAt });
  } catch (err) {
    console.error('send-otp error:', err);
    res.status(500).json({ error: err.message || 'Failed to send verification code.' });
  }
});

app.post('/verify-otp', (req, res) => {
  try {
    const { email, code, token, expiresAt } = req.body ?? {};
    const e = String(email ?? '').trim().toLowerCase();
    const c = String(code ?? '').trim();
    const t = String(token ?? '').trim();
    const exp = Number(expiresAt);

    if (!e || !c || !t || !exp)
      return res.status(400).json({ error: 'Missing required fields.' });
    if (Date.now() > exp)
      return res.status(400).json({ error: 'This code has expired. Please request a new one.' });

    const { OTP_SECRET } = process.env;
    if (!OTP_SECRET) return res.status(500).json({ error: 'Verification service not configured.' });

    const expected = createHmac('sha256', OTP_SECRET).update(`${e}:${c}:${exp}`).digest('hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    let actualBuf;
    try { actualBuf = Buffer.from(t, 'hex'); }
    catch { return res.status(400).json({ error: 'Incorrect code. Please try again.' }); }

    if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf))
      return res.status(400).json({ error: 'Incorrect code. Please try again.' });

    res.json({ verified: true });
  } catch {
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

app.post('/lookup-by-email', (req, res) => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const invite = lookupInviteByEmail(email);
    if (!invite) return res.json({ found: false });

    res.json({ found: true, partyName: invite.partyName, guestNames: invite.guestNames });
  } catch (err) {
    console.error('lookup-by-email error:', err);
    res.status(500).json({ error: 'Lookup failed. Please try again.' });
  }
});

app.get('/guest-session', (req, res) => {
  try {
    const token = String(req.query.token ?? '').trim();
    if (!token) return res.status(400).json({ error: 'Missing invitation token.' });

    const invite = getInviteByToken(token);
    if (!invite) return res.status(404).json({ error: 'We could not find that invitation.' });

    res.json({ invite });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unexpected server error.' });
  }
});

app.post('/guest-session', (req, res) => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const name = String(req.body?.name ?? '').trim();
    if (!email || !name)
      return res.status(400).json({ error: 'Please enter the name and email from your invitation.' });

    const invite = lookupInviteByEmailAndName(email, name);
    if (!invite)
      return res.status(404).json({ error: 'We could not find a matching invitation. Please try the email from your invitation.' });

    res.json({ invite });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unexpected server error.' });
  }
});

app.post('/rsvp', (req, res) => {
  try {
    const payload = req.body ?? {};
    const token = String(payload.token ?? '').trim();
    const attendance = payload.attendance === 'yes' || payload.attendance === 'no' ? payload.attendance : null;
    const dietaryRestrictions = String(payload.dietaryRestrictions ?? '').trim().slice(0, 1000);
    const songRequest = String(payload.songRequest ?? '').trim().slice(0, 250);

    if (!token) return res.status(400).json({ error: 'Missing invitation token.' });
    if (!attendance) return res.status(400).json({ error: 'Please let us know whether you will be attending.' });

    const invite = getInviteByToken(token);
    if (!invite) return res.status(404).json({ error: 'We could not find that invitation.' });

    const guestCount = attendance === 'yes' ? Number.parseInt(String(payload.guestCount ?? ''), 10) : 0;
    if (attendance === 'yes' && (!Number.isInteger(guestCount) || guestCount < 1))
      return res.status(400).json({ error: 'Please enter how many guests from your household will attend.' });
    if (attendance === 'yes' && guestCount > invite.maxGuests)
      return res.status(400).json({ error: `Your invitation is reserved for ${invite.maxGuests} guest${invite.maxGuests === 1 ? '' : 's'}.` });

    const updated = updateInviteRsvp(token, {
      attendance,
      guest_count: guestCount,
      dietary_restrictions: attendance === 'yes' ? dietaryRestrictions : '',
      song_request: attendance === 'yes' ? songRequest : '',
      submitted_at: new Date().toISOString(),
    });

    if (!updated) return res.status(500).json({ error: 'We could not save your RSVP.' });

    res.json({ invite: updated });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unexpected server error.' });
  }
});

// PATCH /session — update name on an existing session
app.patch('/session', (req, res) => {
  try {
    const token = String(req.body?.token ?? '').trim();
    const name = String(req.body?.name ?? '').trim();
    if (!token) return res.status(400).json({ error: 'Token required.' });
    if (!name) return res.status(400).json({ error: 'Name required.' });

    const language = req.body?.language === 'zh' ? 'zh' : req.body?.language === 'en' ? 'en' : undefined;

    const session = validateSession(token);
    if (!session) return res.status(401).json({ error: 'Session expired or not found.' });

    updateSession(token, { name: name || undefined, language });
    res.json({ ok: true, name, language });
  } catch (err) {
    console.error('session PATCH error:', err);
    res.status(500).json({ error: 'Could not update session.' });
  }
});

// POST /session/create — called after OTP verified; finds household, creates 30-day session
app.post('/session/create', (req, res) => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const name = String(req.body?.name ?? '').trim();
    const language = req.body?.language === 'zh' ? 'zh' : 'en';

    if (!email) return res.status(400).json({ error: 'Email required.' });

    const invite = lookupInviteByEmail(email);
    if (!invite) return res.status(404).json({ error: 'No household found for this email.' });

    const token = createSession(parseInt(invite.id), email, name, language);

    logEvent({
      sessionToken: token,
      inviteId: parseInt(invite.id),
      eventType: 'login',
      userAgent: req.headers['user-agent'] || null,
      metadata: { email, name, language },
    });

    res.json({ token, invite });
  } catch (err) {
    console.error('session/create error:', err);
    res.status(500).json({ error: 'Could not create session.' });
  }
});

// GET /session/validate — validates an existing session token
app.get('/session/validate', (req, res) => {
  try {
    const token = String(req.query.token ?? '').trim();
    if (!token) return res.status(400).json({ error: 'Token required.' });

    const session = validateSession(token);
    if (!session) return res.status(401).json({ error: 'Session expired or not found.' });

    res.json(session);
  } catch (err) {
    console.error('session/validate error:', err);
    res.status(500).json({ error: 'Could not validate session.' });
  }
});

// POST /events — log an analytics event
app.post('/events', (req, res) => {
  try {
    const { sessionToken, eventType, page, referrer, metadata } = req.body ?? {};
    if (!eventType) return res.status(400).json({ error: 'eventType required.' });

    let inviteId = null;
    if (sessionToken) {
      const session = validateSession(sessionToken);
      if (session?.invite) inviteId = parseInt(session.invite.id);
    }

    logEvent({
      sessionToken: sessionToken || null,
      inviteId,
      eventType,
      page: page || null,
      referrer: referrer || null,
      userAgent: req.headers['user-agent'] || null,
      metadata: metadata || {},
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('events error:', err);
    res.status(500).json({ error: 'Could not log event.' });
  }
});

// --- Moonboard ---

const MOONBOARD_COLS = 11;
const MOONBOARD_ROWS = 18;
const MOONBOARD_SHAPES = ['jug', 'crimp', 'sloper', 'pinch', 'pocket'];

app.get('/moonboard', (req, res) => {
  try {
    res.json({ holds: getMoonboardHolds() });
  } catch (err) {
    console.error('moonboard GET error:', err);
    res.status(500).json({ error: 'Could not load the moonboard.' });
  }
});

app.post('/moonboard', (req, res) => {
  try {
    const { row, col, guestName, message, shape, color } = req.body ?? {};
    const r = Number(row);
    const c = Number(col);

    if (!Number.isInteger(r) || r < 0 || r >= MOONBOARD_ROWS || !Number.isInteger(c) || c < 0 || c >= MOONBOARD_COLS)
      return res.status(400).json({ error: 'Invalid board position.' });

    const name = String(guestName ?? '').trim().slice(0, 60);
    if (!name) return res.status(400).json({ error: 'Please enter your name.' });

    if (!MOONBOARD_SHAPES.includes(shape))
      return res.status(400).json({ error: 'Invalid hold shape.' });

    if (!/^#[0-9A-Fa-f]{6}$/.test(String(color ?? '')))
      return res.status(400).json({ error: 'Invalid hold color.' });

    const msg = String(message ?? '').trim().slice(0, 80);

    const hold = placeMoonboardHold({ row: r, col: c, guestName: name, message: msg, shape, color });
    if (!hold) return res.status(409).json({ error: 'That spot was just taken — please pick another.' });

    res.json({ hold });
  } catch (err) {
    console.error('moonboard POST error:', err);
    res.status(500).json({ error: 'Could not place your hold. Please try again.' });
  }
});

// --- Garden ---

const GARDEN_PLANT_TYPES = ['grass', 'bush', 'sunflower', 'cherryTree'];
const GARDEN_MAX_ITEMS = 500;

function isValidGardenItem(item) {
  return item && typeof item === 'object'
    && typeof item.id === 'string' && item.id.length <= 60
    && GARDEN_PLANT_TYPES.includes(item.plantType)
    && Number.isInteger(item.stage) && item.stage >= 0 && item.stage <= 3
    && /^#[0-9A-Fa-f]{6}$/.test(String(item.color ?? ''))
    && Number.isFinite(item.x) && Number.isFinite(item.y)
    && Number.isFinite(item.rotation) && Number.isFinite(item.scale);
}

app.get('/garden', (req, res) => {
  try {
    const token = String(req.query.token ?? '').trim();
    const session = validateSession(token);
    if (!session?.invite) return res.status(401).json({ error: 'Session expired or not found.' });

    res.json({ items: getGardenItems(parseInt(session.invite.id)) });
  } catch (err) {
    console.error('garden GET error:', err);
    res.status(500).json({ error: 'Could not load your garden.' });
  }
});

app.post('/garden', (req, res) => {
  try {
    const token = String(req.body?.token ?? '').trim();
    const session = validateSession(token);
    if (!session?.invite) return res.status(401).json({ error: 'Session expired or not found.' });

    const items = req.body?.items;
    if (!Array.isArray(items) || items.length > GARDEN_MAX_ITEMS || !items.every(isValidGardenItem))
      return res.status(400).json({ error: 'Invalid garden data.' });

    setGardenItems(parseInt(session.invite.id), items);
    res.json({ ok: true });
  } catch (err) {
    console.error('garden POST error:', err);
    res.status(500).json({ error: 'Could not save your garden.' });
  }
});

// --- Escape the Reception ---

const ESCAPE_OBSTACLE_IDS = ['uber', 'inlaws', 'passport', 'dj', 'tire', 'photographer', 'toast', 'bouquet'];

app.get('/escape', (req, res) => {
  try {
    res.json({ cleared: getEscapeCleared() });
  } catch (err) {
    console.error('escape GET error:', err);
    res.status(500).json({ error: 'Could not load the road.' });
  }
});

app.post('/escape', (req, res) => {
  try {
    const { obstacleId, note } = req.body ?? {};
    if (!ESCAPE_OBSTACLE_IDS.includes(obstacleId))
      return res.status(400).json({ error: 'Invalid obstacle.' });

    const n = String(note ?? '').trim().slice(0, 120);
    const result = clearEscapeObstacle({ obstacleId, note: n });
    if (!result) return res.status(409).json({ error: 'Someone already cleared that one.', cleared: getEscapeCleared() });

    res.json({ ok: true, cleared: getEscapeCleared() });
  } catch (err) {
    console.error('escape POST error:', err);
    res.status(500).json({ error: 'Could not clear that obstacle.' });
  }
});

// --- Drag Ben Up the Mountain ---

const CLIMB_BOOST_IDS = ['energybar', 'poles', 'coffee', 'boots', 'yell', 'donut', 'sherpa', 'selfiestick'];

app.get('/climb', (req, res) => {
  try {
    res.json({ cleared: getClimbCleared() });
  } catch (err) {
    console.error('climb GET error:', err);
    res.status(500).json({ error: 'Could not load the mountain.' });
  }
});

app.post('/climb', (req, res) => {
  try {
    const { boostId, note } = req.body ?? {};
    if (!CLIMB_BOOST_IDS.includes(boostId))
      return res.status(400).json({ error: 'Invalid boost.' });

    const n = String(note ?? '').trim().slice(0, 120);
    const result = clearClimbBoost({ boostId, note: n });
    if (!result) return res.status(409).json({ error: 'Someone already sent that boost.', cleared: getClimbCleared() });

    res.json({ ok: true, cleared: getClimbCleared() });
  } catch (err) {
    console.error('climb POST error:', err);
    res.status(500).json({ error: 'Could not send that boost.' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
