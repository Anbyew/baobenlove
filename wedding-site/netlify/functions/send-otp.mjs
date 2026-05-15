import { createHmac, randomInt } from 'node:crypto';

const OTP_TTL_MS = 10 * 60 * 1000;
const SENDER = 'Yuwei & Ben <bellabenbao@gmail.com>';

function json(status, body) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

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
  const lines = [
    `To: ${to}`,
    `From: ${SENDER}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
  ];
  const raw = Buffer.from(lines.join('\r\n')).toString('base64url');
  const resp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
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

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });

  try {
    const { email } = JSON.parse(event.body || '{}');
    const normalizedEmail = String(email ?? '').trim().toLowerCase();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return json(400, { error: 'Please enter a valid email address.' });
    }

    const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, OTP_SECRET } = process.env;
    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN || !OTP_SECRET) {
      return json(500, { error: 'Email service is not configured.' });
    }

    const code = String(randomInt(100000, 1000000));
    const expiresAt = Date.now() + OTP_TTL_MS;
    const payload = `${normalizedEmail}:${code}:${expiresAt}`;
    const token = createHmac('sha256', OTP_SECRET).update(payload).digest('hex');

    const accessToken = await getGmailAccessToken();
    await sendGmail(
      accessToken,
      normalizedEmail,
      'Your verification code — baoben.love',
      buildEmailHtml(code),
    );

    return json(200, { token, expiresAt });
  } catch (err) {
    console.error('send-otp error:', err);
    return json(500, {
      error: err instanceof Error ? err.message : 'Failed to send verification code.',
    });
  }
}
