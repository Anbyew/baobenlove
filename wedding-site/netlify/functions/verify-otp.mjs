import { createHmac, timingSafeEqual } from 'node:crypto';

function json(status, body) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });

  try {
    const { email, code, token, expiresAt } = JSON.parse(event.body || '{}');
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    const normalizedCode = String(code ?? '').trim();
    const normalizedToken = String(token ?? '').trim();
    const expiry = Number(expiresAt);

    if (!normalizedEmail || !normalizedCode || !normalizedToken || !expiry) {
      return json(400, { error: 'Missing required fields.' });
    }

    if (Date.now() > expiry) {
      return json(400, { error: 'This code has expired. Please request a new one.' });
    }

    const { OTP_SECRET } = process.env;
    if (!OTP_SECRET) return json(500, { error: 'Verification service not configured.' });

    const payload = `${normalizedEmail}:${normalizedCode}:${expiry}`;
    const expected = createHmac('sha256', OTP_SECRET).update(payload).digest('hex');

    const expectedBuf = Buffer.from(expected, 'hex');
    let actualBuf;
    try {
      actualBuf = Buffer.from(normalizedToken, 'hex');
    } catch {
      return json(400, { error: 'Incorrect code. Please try again.' });
    }

    if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
      return json(400, { error: 'Incorrect code. Please try again.' });
    }

    return json(200, { verified: true });
  } catch (err) {
    return json(500, { error: 'Verification failed. Please try again.' });
  }
}
