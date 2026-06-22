const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export interface EscapeClearedEntry {
  note: string;
  clearedAt: string;
}

export type EscapeClearedState = Record<string, EscapeClearedEntry>;

export async function fetchEscapeCleared(): Promise<EscapeClearedState> {
  const response = await fetch(`${API_BASE}/escape`);
  if (!response.ok) throw new Error('Could not load the road.');
  const body = await response.json();
  return body.cleared as EscapeClearedState;
}

export async function clearEscapeObstacle(obstacleId: string, note: string, sessionToken?: string): Promise<EscapeClearedState> {
  const response = await fetch(`${API_BASE}/escape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ obstacleId, note, sessionToken }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    // 409 means someone else already cleared it -- treat as success and sync state.
    if (response.status === 409 && body?.cleared) return body.cleared as EscapeClearedState;
    throw new Error(body?.error ?? 'Could not clear that obstacle.');
  }
  return body.cleared as EscapeClearedState;
}
