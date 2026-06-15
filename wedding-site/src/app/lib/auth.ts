const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export interface SessionPayload {
  sessionToken: string;
  email: string;
  name: string;
  language: string;
  invite: unknown;
}

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

export async function createSession(
  email: string,
  name: string,
  language: 'en' | 'zh',
): Promise<SessionPayload> {
  const response = await fetch(`${API_BASE}/session/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, language }),
  });
  return parseJson(response);
}

export async function validateSession(token: string): Promise<SessionPayload | null> {
  try {
    const response = await fetch(`${API_BASE}/session/validate?token=${encodeURIComponent(token)}`);
    if (response.status === 401) return null;
    return parseJson<SessionPayload>(response);
  } catch {
    return null;
  }
}

export async function updateSession(
  token: string,
  fields: { name?: string; language?: 'en' | 'zh' },
): Promise<void> {
  const response = await fetch(`${API_BASE}/session`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, ...fields }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? 'Could not update profile.');
  }
}

export async function logEvent(payload: {
  sessionToken?: string;
  eventType: string;
  page?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // best-effort, never throw
  }
}

export async function trackClick(payload: {
  sessionToken?: string;
  label: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  return logEvent({
    sessionToken: payload.sessionToken,
    eventType: 'click',
    page: `${window.location.pathname}${window.location.search}`,
    metadata: { label: payload.label, ...payload.metadata },
  });
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

export interface GardenItem {
  id: string;
  plantType: 'grass' | 'bush' | 'sunflower' | 'cherryTree';
  stage: number;
  color: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export async function getGarden(token: string): Promise<{ items: GardenItem[] }> {
  const response = await fetch(`${API_BASE}/garden?token=${encodeURIComponent(token)}`);
  return parseJson(response);
}

export async function saveGarden(token: string, items: GardenItem[]): Promise<void> {
  const response = await fetch(`${API_BASE}/garden`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, items }),
  });
  await parseJson(response);
}
