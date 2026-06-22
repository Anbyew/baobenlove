const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export interface ClimbClearedEntry {
  note: string;
  clearedAt: string;
}

export type ClimbClearedState = Record<string, ClimbClearedEntry>;

export async function fetchClimbCleared(): Promise<ClimbClearedState> {
  const response = await fetch(`${API_BASE}/climb`);
  if (!response.ok) throw new Error('Could not load the mountain.');
  const body = await response.json();
  return body.cleared as ClimbClearedState;
}

export async function clearClimbBoost(boostId: string, note: string, sessionToken?: string): Promise<ClimbClearedState> {
  const response = await fetch(`${API_BASE}/climb`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ boostId, note, sessionToken }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    // 409 means someone else already sent that boost -- treat as success and sync state.
    if (response.status === 409 && body?.cleared) return body.cleared as ClimbClearedState;
    throw new Error(body?.error ?? 'Could not send that boost.');
  }
  return body.cleared as ClimbClearedState;
}
