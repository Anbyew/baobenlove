export type AttendanceStatus = 'yes' | 'no' | '';

export interface InviteSession {
  id: string;
  token: string;
  partyName: string;
  primaryEmail: string | null;
  secondaryEmail: string | null;
  guestNames: string[];
  maxGuests: number;
  rehearsalDinner: boolean;
  rsvp: {
    attendance: AttendanceStatus;
    guestCount: number | null;
    dietaryRestrictions: string;
    songRequest: string;
    submittedAt: string | null;
  };
}

export interface InviteLookupInput {
  email: string;
  name: string;
}

export interface SaveRsvpInput {
  attendance: Exclude<AttendanceStatus, ''>;
  guestCount: number;
  dietaryRestrictions: string;
  songRequest: string;
}

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

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

export async function fetchInviteSession(token: string) {
  const response = await fetch(`${API_BASE}/guest-session?token=${encodeURIComponent(token)}`);
  return parseJson<{ invite: InviteSession }>(response);
}

export async function lookupInviteSession(payload: InviteLookupInput) {
  const response = await fetch(`${API_BASE}/guest-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseJson<{ invite: InviteSession }>(response);
}

export async function saveInviteRsvp(token: string, payload: SaveRsvpInput) {
  const response = await fetch(`${API_BASE}/rsvp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      ...payload,
    }),
  });

  return parseJson<{ invite: InviteSession }>(response);
}
