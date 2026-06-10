const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export interface MoonboardHold {
  id: string;
  row: number;
  col: number;
  guestName: string;
  message: string;
  shape: string;
  color: string;
  placedAt: string;
}

export interface PlaceHoldPayload {
  row: number;
  col: number;
  guestName: string;
  message: string;
  shape: string;
  color: string;
}

export async function fetchMoonboardHolds(): Promise<MoonboardHold[]> {
  const response = await fetch(`${API_BASE}/moonboard`);
  if (!response.ok) throw new Error('Could not load the moonboard.');
  const body = await response.json();
  return body.holds as MoonboardHold[];
}

export async function placeMoonboardHold(payload: PlaceHoldPayload): Promise<MoonboardHold> {
  const response = await fetch(`${API_BASE}/moonboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error ?? 'Could not place your hold.');
  }
  return body.hold as MoonboardHold;
}
