import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import nodemailer from 'nodemailer';
import {
  lookupInviteByEmail,
  lookupInviteByName,
  getInviteByToken,
  lookupInviteByEmailAndName,
  updateInviteRsvp,
  createSession,
  createUnmatchedSession,
  getUnmatchedGuests,
  getAdminStats,
  getAdminSessions,
  getAdminEvents,
  getAdminRsvps,
  getAdminHouseholds,
  validateSession,
  updateSession,
  logEvent,
  getMoonboardHolds,
  placeMoonboardHold,
  getGardenItems,
  setGardenItems,
  archiveGarden,
  getGardenSessions,
  updateGardenSession,
  clearGardenForInvite,
  getEscapeCleared,
  clearEscapeObstacle,
  archiveEscape,
  getEscapeSessions,
  saveDanceRound,
  getDanceLeaderboard,
  upsertDanceScore,
  getClimbCleared,
  clearClimbBoost,
  getAdminGames,
} from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const OTP_TTL_MS = 10 * 60 * 1000;
const VERIFY_TICKET_TTL_MS = 10 * 60 * 1000;
const PORT = process.env.PORT || 3000;

// --- Email helpers ---

function getMailTransport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || 'bellabenbao@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

async function sendGmail(to, subject, html) {
  const transporter = getMailTransport();
  await transporter.sendMail({
    from: `"Yuwei & Ben" <${process.env.GMAIL_USER || 'bellabenbao@gmail.com'}>`,
    to,
    subject,
    html,
  });
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

const ALLOWED_EMAILS = new Set([
  '13276753627@139.com','13857520003@139.com','1524758446@qq.com',
  '15868141610@163.com','164092802@qq.com','18ssyy@163.com',
  'aj3@princeton.edu','alicequ16@gmail.com','andrei.alexan@gmail.com',
  'angela.wang0068@gmail.com','atticuschristensen@gmail.com','austinpowellb@gmail.com',
  'awf7@columbia.edu','awk1994@gmail.com','axelkalbach@gmail.com',
  'baobaoyuwei@gmail.com','baohk@126.com','barroytman@gmail.com',
  'bellabenbao@gmail.com','bkrakoff@gmail.com','c071132@gmail.com',
  'chaijy@umich.edu','chris.rhodes45@gmail.com','coa05lu@yahoo.com',
  'coulter.lheureux@gmail.com','cpbara@umich.edu','cranberrylobster@gmail.com',
  'ctrenton@umich.edu','daiyp@umich.edu','danielfletcher314@outlook.com',
  'danjcollins@gmail.com','davidtouger@hotmail.com','dleffler0603@gmail.com',
  'dmitriykts4@gmail.com','dorothee_newbern@hotmail.com','dtouger@hotmail.com',
  'dyenkin@yahoo.com','eikorn@optonline.net','elisawtsai@gmail.com',
  'emmakrakoff@gmail.com','essbeard@gmail.com','faithclayton@gmail.com',
  'fduplessis21@gmail.com','florian.dahlhausen@gmail.com','gtilde@yahoo.com',
  'hampledavid@gmail.com','hari.anbarasu95@gmail.com','harryahill@gmail.com',
  'hwang@jd21.law.harvard.edu','hzzheng@umich.edu','info@kellyaltierweddings.com',
  'jakrakoff@gmail.com','jane.e.stein66@gmail.com','jed970610@gmail.com',
  'jessicaleffler@gmail.com','jkornhau13@gmail.com','jminlee@umich.edu',
  'joshuaaleffler@gmail.com','joymendenhall@gmail.com','jplshnj@gmail.com',
  'juliet4816@gmail.com','jyenkin@aol.com','kimpapples@gmail.com',
  'klupiloff@gmail.com','laurabrooksbrown@gmail.com','lefflers@aol.com',
  'lingluanwh@gmail.com','liubovs@umich.edu','ltouger@cox.net',
  'lucyjaneck@gmail.com','luoxi.meng98@gmail.com','marciamcham@aol.com',
  'marctlaurab@gmail.com','mark.luzi@gmail.com','markgreenfield93@gmail.com',
  'matthew.v.ellison@gmail.com','meera@krishnamoorthy.com','megabyteification@gmail.com',
  'melissa.touger@gmail.com','michael.kornhauser@gmail.com','michaelito03@gmail.com',
  'monet-xu@ti.com','murphyluzi@gmail.com','nickbao743@gmail.com',
  'noahkrakoff@gmail.com','obrnmrk@gmail.com','rachel3shepherd@gmail.com',
  'rebecca.janssen@outlook.de','rkrakoff@gmail.com','robertmarkberman@gmail.com',
  'samcookie9@gmail.com','sarahkrakoff@gmail.com','sbshoup@gmail.com',
  'shanestorks@gmail.com','sharonleerhodes@gmail.com','tougerrs@msn.com',
  'vivwylai@gmail.com','xinywa@umich.edu','xuan.e.wu@gmail.com',
  'ye.yaxin3@gmail.com','yenkina@yahoo.com','yiwenzhg@umich.edu',
  'yukw777@gmail.com','yutian_sun@163.com','yuweibao@umich.edu',
  'zhang.nuda@gmail.com',
]);

app.post('/send-otp', async (req, res) => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Please enter a valid email address.' });

    if (!ALLOWED_EMAILS.has(email))
      return res.status(403).json({ error: 'This site is currently in private preview. Please contact bellabenbao@gmail.com if you need access.' });

    const { GMAIL_APP_PASSWORD, OTP_SECRET } = process.env;
    if (!GMAIL_APP_PASSWORD || !OTP_SECRET)
      return res.status(500).json({ error: 'Email service is not configured.' });

    const code = String(randomInt(100000, 1000000));
    const expiresAt = Date.now() + OTP_TTL_MS;
    const token = createHmac('sha256', OTP_SECRET)
      .update(`${email}:${code}:${expiresAt}`)
      .digest('hex');

    await sendGmail(email, 'Your verification code — baoben.love', buildEmailHtml(code));

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

    const ticketExpiresAt = Date.now() + VERIFY_TICKET_TTL_MS;
    const ticket = createHmac('sha256', OTP_SECRET)
      .update(`verified:${e}:${ticketExpiresAt}`)
      .digest('hex');

    res.json({ verified: true, ticket, ticketExpiresAt });
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
    const ticket = String(req.body?.ticket ?? '').trim();
    const ticketExpiresAt = Number(req.body?.ticketExpiresAt);

    if (!email) return res.status(400).json({ error: 'Email required.' });
    if (!ticket || !ticketExpiresAt) return res.status(401).json({ error: 'Verification required.' });

    const { OTP_SECRET } = process.env;
    if (!OTP_SECRET) return res.status(500).json({ error: 'Verification service not configured.' });

    if (Date.now() > ticketExpiresAt)
      return res.status(401).json({ error: 'Verification expired. Please request a new code.' });

    const expected = createHmac('sha256', OTP_SECRET).update(`verified:${email}:${ticketExpiresAt}`).digest('hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    let actualBuf;
    try { actualBuf = Buffer.from(ticket, 'hex'); }
    catch { return res.status(401).json({ error: 'Verification required.' }); }

    if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf))
      return res.status(401).json({ error: 'Verification required.' });

    let invite = lookupInviteByEmail(email);
    if (!invite && name) invite = lookupInviteByName(name);

    let token;
    let eventType;
    if (invite) {
      token = createSession(parseInt(invite.id), email, name, language);
      eventType = 'login';
    } else {
      token = createUnmatchedSession(email, name, language);
      eventType = 'login_unmatched';
    }

    logEvent({
      sessionToken: token,
      inviteId: invite ? parseInt(invite.id) : null,
      eventType,
      userAgent: req.headers['user-agent'] || null,
      metadata: { email, name, language, matched: !!invite },
    });

    res.json({ sessionToken: token, email, name, language, invite: invite ?? null });
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

// POST /report-issue — guest sends a help request; notifies Yuwei & Ben via email
app.post('/report-issue', async (req, res) => {
  try {
    const email = String(req.body?.email ?? '').trim();
    const name = String(req.body?.name ?? '').trim();
    const issue = String(req.body?.issue ?? '').trim().slice(0, 500);
    const { GMAIL_APP_PASSWORD } = process.env;
    if (GMAIL_APP_PASSWORD) {
      const html = `
<html><body style="font-family: Georgia, serif; font-size: 15px; color: #2a2a2a; max-width: 480px; margin: auto; padding: 32px 24px;">
  <h2 style="font-weight: 400; font-size: 18px;">Login help request — baoben.love</h2>
  <table style="border-collapse: collapse; width: 100%; margin-top: 16px;">
    <tr><td style="padding: 8px 0; color: #888; width: 100px;">Email</td><td style="padding: 8px 0;">${email || '(not provided)'}</td></tr>
    <tr><td style="padding: 8px 0; color: #888;">Name</td><td style="padding: 8px 0;">${name || '(not provided)'}</td></tr>
    <tr><td style="padding: 8px 0; color: #888;">Issue</td><td style="padding: 8px 0;">${issue || '(not specified)'}</td></tr>
    <tr><td style="padding: 8px 0; color: #888;">Time</td><td style="padding: 8px 0;">${new Date().toISOString()}</td></tr>
  </table>
</body></html>`;
      await sendGmail('bellabenbao@gmail.com', `Login help — ${name || email || 'guest'}`, html);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('report-issue error:', err);
    res.json({ ok: true }); // always succeed from guest's perspective
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

// --- Admin endpoints (all require x-admin-secret header) ---

function requireAdmin(req, res) {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: 'Unauthorized.' });
    return false;
  }
  return true;
}

app.get('/admin/stats', (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    res.json(getAdminStats());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/admin/sessions', (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    res.json({ sessions: getAdminSessions() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/admin/unmatched-guests', (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    res.json({ guests: getUnmatchedGuests() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/admin/events', (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const limit = Math.min(parseInt(req.query.limit || '100'), 500);
    res.json({ events: getAdminEvents(limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/admin/rsvps', (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    res.json({ rsvps: getAdminRsvps() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/admin/households', (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    res.json({ households: getAdminHouseholds() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/admin/games', (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    res.json(getAdminGames());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

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
    const { row, col, guestName, message, shape, color, sessionToken } = req.body ?? {};
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

    const session = sessionToken ? validateSession(String(sessionToken)) : null;
    logEvent({ sessionToken: session?.sessionToken || null, inviteId: session?.invite?.id || null, eventType: 'moonboard_hold_placed', page: '/moonboard', metadata: { guestName: name, row: r, col: c, shape, amount: 25 } });
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

app.get('/garden/sessions', (req, res) => {
  try {
    const token = String(req.query.token ?? '').trim();
    const session = validateSession(token);
    if (!session?.invite) return res.status(401).json({ error: 'Session expired or not found.' });
    res.json({ sessions: getGardenSessions(parseInt(session.invite.id)) });
  } catch (err) {
    res.status(500).json({ error: 'Could not load garden sessions.' });
  }
});

app.patch('/garden/sessions/:id', (req, res) => {
  try {
    const token = String(req.body?.token ?? '').trim();
    const session = validateSession(token);
    if (!session?.invite) return res.status(401).json({ error: 'Session expired or not found.' });

    const sessionId = parseInt(req.params.id, 10);
    const items = req.body?.items;
    if (!Number.isInteger(sessionId) || !Array.isArray(items) || items.length > GARDEN_MAX_ITEMS || !items.every(isValidGardenItem))
      return res.status(400).json({ error: 'Invalid garden data.' });

    const updated = updateGardenSession(parseInt(session.invite.id), sessionId, items);
    if (!updated) return res.status(404).json({ error: 'Garden not found.' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not update garden.' });
  }
});

app.post('/garden/reset', (req, res) => {
  try {
    const token = String(req.body?.token ?? '').trim();
    const session = validateSession(token);
    if (!session?.invite) return res.status(401).json({ error: 'Session expired or not found.' });
    const sessionNumber = archiveGarden(parseInt(session.invite.id));
    res.json({ ok: true, archivedSession: sessionNumber });
  } catch (err) {
    res.status(500).json({ error: 'Could not reset garden.' });
  }
});

app.post('/garden/clear-mine', (req, res) => {
  try {
    const token = String(req.body?.token ?? '').trim();
    const session = validateSession(token);
    if (!session?.invite) return res.status(401).json({ error: 'Session expired or not found.' });
    const cleared = clearGardenForInvite(parseInt(session.invite.id));
    res.json({ ok: true, cleared });
  } catch (err) {
    res.status(500).json({ error: 'Could not clear your garden history.' });
  }
});

// --- Escape the Reception ---

const ESCAPE_OBSTACLE_IDS = ['tutorial', 'toes', 'warmup', 'crowd', 'dip', 'mom', 'spin', 'encore'];
const DANCE_MAX_GAME_SCORE = 100;
const DANCE_MIN_GAME_SCORE = 40;

function isValidDanceGame(game) {
  return game && typeof game === 'object'
    && ESCAPE_OBSTACLE_IDS.includes(game.obstacleId)
    && typeof game.label === 'string' && game.label.length <= 120
    && Number.isInteger(game.score) && game.score >= DANCE_MIN_GAME_SCORE && game.score <= DANCE_MAX_GAME_SCORE
    && Number.isInteger(game.restarts) && game.restarts >= 0 && game.restarts <= 100
    && typeof game.completedAt === 'string';
}

app.get('/escape/sessions', (req, res) => {
  try {
    res.json({ sessions: getEscapeSessions() });
  } catch (err) {
    res.status(500).json({ error: 'Could not load escape sessions.' });
  }
});

app.post('/escape/reset', (req, res) => {
  try {
    const token = String(req.body?.token ?? '').trim();
    const session = validateSession(token);
    if (!session) return res.status(401).json({ error: 'Please log in first.' });
    const sessionNumber = archiveEscape();
    logEvent({ sessionToken: token, inviteId: session.invite?.id || null, eventType: 'escape_new_round', page: '/escape', metadata: { newSession: (sessionNumber || 0) + 1 } });
    res.json({ ok: true, archivedSession: sessionNumber });
  } catch (err) {
    res.status(500).json({ error: 'Could not reset escape.' });
  }
});

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
    const { obstacleId, note, sessionToken } = req.body ?? {};
    if (!ESCAPE_OBSTACLE_IDS.includes(obstacleId))
      return res.status(400).json({ error: 'Invalid obstacle.' });

    const n = String(note ?? '').trim().slice(0, 120);
    const result = clearEscapeObstacle({ obstacleId, note: n });
    if (!result) return res.status(409).json({ error: 'Someone already cleared that one.', cleared: getEscapeCleared() });

    const session = sessionToken ? validateSession(String(sessionToken)) : null;
    logEvent({ sessionToken: session?.sessionToken || null, inviteId: session?.invite?.id || null, eventType: 'escape_obstacle_cleared', page: '/escape', metadata: { obstacleId } });
    res.json({ ok: true, cleared: getEscapeCleared() });
  } catch (err) {
    console.error('escape POST error:', err);
    res.status(500).json({ error: 'Could not clear that obstacle.' });
  }
});

app.post('/dance/score', (req, res) => {
  try {
    const { sessionToken, playerName, totalScore, totalRestarts, gamesCompleted } = req.body ?? {};
    const token = String(sessionToken ?? '').trim();
    const name = String(playerName ?? '').trim().slice(0, 60);
    if (!name || typeof totalScore !== 'number' || totalScore < 0)
      return res.status(400).json({ error: 'Invalid score.' });

    const session = token ? validateSession(token) : null;
    if (token && !session) return res.status(401).json({ error: 'Session expired.' });

    upsertDanceScore({
      sessionToken: token || null,
      inviteId: session?.invite?.id || null,
      playerName: name,
      totalScore,
      gamesCompleted: Number(gamesCompleted) || 0,
      totalRestarts: Number(totalRestarts) || 0,
    });

    logEvent({ sessionToken: token || null, inviteId: session?.invite?.id || null, eventType: 'dance_score_update', page: '/escape', metadata: { playerName: name, totalScore, gamesCompleted, totalRestarts } });
    res.json({ ok: true, leaderboard: getDanceLeaderboard() });
  } catch (err) {
    console.error('dance/score error:', err);
    res.status(500).json({ error: 'Could not save score.' });
  }
});

app.post('/dance/rounds', (req, res) => {
  try {
    const token = String(req.body?.token ?? '').trim();
    const session = validateSession(token);
    if (!session?.invite) return res.status(401).json({ error: 'Session expired or not found.' });

    const games = req.body?.games;
    const uniqueIds = new Set(Array.isArray(games) ? games.map(g => g?.obstacleId) : []);
    if (!Array.isArray(games) || games.length !== ESCAPE_OBSTACLE_IDS.length || uniqueIds.size !== ESCAPE_OBSTACLE_IDS.length || !games.every(isValidDanceGame))
      return res.status(400).json({ error: 'Invalid dance round.' });

    const totalScore = games.reduce((sum, game) => sum + game.score, 0);
    const totalRestarts = games.reduce((sum, game) => sum + game.restarts, 0);
    if (req.body?.totalScore !== totalScore || req.body?.totalRestarts !== totalRestarts)
      return res.status(400).json({ error: 'Invalid dance score.' });

    const playerName = session.name || session.email || 'Guest';
    saveDanceRound(parseInt(session.invite.id), playerName, {
      games,
      totalScore,
      totalRestarts,
      completedAt: String(req.body?.completedAt || new Date().toISOString()),
    });
    logEvent({ sessionToken: token, inviteId: parseInt(session.invite.id), eventType: 'dance_round_complete', page: '/escape', metadata: { playerName, totalScore, totalRestarts } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not save dance score.' });
  }
});

app.get('/dance/leaderboard', (req, res) => {
  try {
    res.json({ leaderboard: getDanceLeaderboard() });
  } catch (err) {
    res.status(500).json({ error: 'Could not load dance leaderboard.' });
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
    const { boostId, note, sessionToken } = req.body ?? {};
    if (!CLIMB_BOOST_IDS.includes(boostId))
      return res.status(400).json({ error: 'Invalid boost.' });

    const n = String(note ?? '').trim().slice(0, 120);
    const result = clearClimbBoost({ boostId, note: n });
    if (!result) return res.status(409).json({ error: 'Someone already sent that boost.', cleared: getClimbCleared() });

    const session = sessionToken ? validateSession(String(sessionToken)) : null;
    logEvent({ sessionToken: session?.sessionToken || null, inviteId: session?.invite?.id || null, eventType: 'climb_boost_cleared', page: '/climb', metadata: { boostId } });
    res.json({ ok: true, cleared: getClimbCleared() });
  } catch (err) {
    console.error('climb POST error:', err);
    res.status(500).json({ error: 'Could not send that boost.' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
