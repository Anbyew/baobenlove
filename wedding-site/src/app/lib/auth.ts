const API_BASE = '/.netlify/functions';

async function parseJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : 'Something went wrong. Please try again.';
    throw new Error(message);
  }
  return body as T;
}

export async function sendOtp(email: string): Promise<{ token: string; expiresAt: number }> {
  const response = await fetch(`${API_BASE}/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return parseJson(response);
}

export async function verifyOtp(payload: {
  email: string;
  code: string;
  token: string;
  expiresAt: number;
}): Promise<{ verified: boolean }> {
  const response = await fetch(`${API_BASE}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson(response);
}

export async function lookupByEmail(email: string): Promise<{
  found: boolean;
  partyName?: string;
  guestNames?: string[];
}> {
  const response = await fetch(`${API_BASE}/lookup-by-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return parseJson(response);
}
