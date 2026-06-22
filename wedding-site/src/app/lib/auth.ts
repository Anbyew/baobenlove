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
}): Promise<{ verified: boolean; ticket: string; ticketExpiresAt: number }> {
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
  ticket: string,
  ticketExpiresAt: number,
): Promise<SessionPayload> {
  const response = await fetch(`${API_BASE}/session/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, language, ticket, ticketExpiresAt }),
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

export async function reportIssue(payload: {
  email?: string;
  name?: string;
  issue?: string;
}): Promise<void> {
  try {
    await fetch(`${API_BASE}/report-issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // best-effort
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

export interface GardenSession {
  id: number;
  session_number: number;
  items: GardenItem[];
  started_at: string;
  archived_at: string;
}

export async function getGardenSessions(token: string): Promise<GardenSession[]> {
  const response = await fetch(`${API_BASE}/garden/sessions?token=${encodeURIComponent(token)}`);
  const data = await parseJson(response);
  return data.sessions ?? [];
}

export async function saveGardenSession(token: string, sessionId: number, items: GardenItem[]): Promise<void> {
  const response = await fetch(`${API_BASE}/garden/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, items }),
  });
  await parseJson(response);
}

export async function resetGarden(token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/garden/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  await parseJson(response);
}

export async function clearMyGardenHistory(token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/garden/clear-mine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  await parseJson(response);
}

export interface EscapeObstacleRecord { id: string; note: string; clearedAt: string; amount: number; }
export interface EscapeSession {
  id: number;
  session_number: number;
  obstacles: EscapeObstacleRecord[];
  started_at: string;
  archived_at: string;
  total_raised: number;
}

export async function getEscapeSessions(): Promise<EscapeSession[]> {
  const response = await fetch(`${API_BASE}/escape/sessions`);
  const data = await parseJson(response);
  return data.sessions ?? [];
}

export async function resetEscape(token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/escape/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  await parseJson(response);
}

export interface DanceGameScore {
  obstacleId: string;
  label: string;
  score: number;
  restarts: number;
  completedAt: string;
}

export interface DanceRoundSubmission {
  games: DanceGameScore[];
  totalScore: number;
  totalRestarts: number;
  completedAt: string;
}

export interface DanceLeaderboardEntry {
  inviteId?: number;
  playerName: string;
  totalScore: number;
  totalRestarts: number;
  completedAt: string;
  games: DanceGameScore[];
}

export async function submitDanceRound(token: string, round: DanceRoundSubmission): Promise<void> {
  const response = await fetch(`${API_BASE}/dance/rounds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, ...round }),
  });
  await parseJson(response);
}

export async function getDanceLeaderboard(): Promise<DanceLeaderboardEntry[]> {
  const response = await fetch(`${API_BASE}/dance/leaderboard`);
  const data = await parseJson<{ leaderboard?: DanceLeaderboardEntry[] }>(response);
  return data.leaderboard ?? [];
}
