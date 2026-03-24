const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const INVITES_TABLE = process.env.SUPABASE_INVITES_TABLE || 'invites';
const USE_MOCK_INVITES = process.env.USE_MOCK_INVITES === 'true';
function getMockManifestPath() {
  return new URL('../../generated/invites/invite_manifest.json', import.meta.url);
}

function ensureConfig() {
  if (USE_MOCK_INVITES) {
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables are not configured.');
  }
}

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function normalizeCompare(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, '');
}

function normalizeEmail(value) {
  return normalizeText(value);
}

function toGuestNames(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry ?? '').trim())
      .filter(Boolean);
  }

  return [];
}

function toInviteSession(row) {
  return {
    id: String(row.id),
    token: String(row.token),
    partyName: String(row.party_name ?? 'Our guests'),
    primaryEmail: row.primary_email ? String(row.primary_email) : null,
    secondaryEmail: row.secondary_email ? String(row.secondary_email) : null,
    guestNames: toGuestNames(row.guest_names),
    maxGuests: Number(row.max_guests ?? 1) || 1,
    rsvp: {
      attendance: row.attendance === 'yes' || row.attendance === 'no' ? row.attendance : '',
      guestCount: row.guest_count == null ? null : Number(row.guest_count),
      dietaryRestrictions: String(row.dietary_restrictions ?? ''),
      songRequest: String(row.song_request ?? ''),
      submittedAt: row.submitted_at ? String(row.submitted_at) : null,
    },
  };
}

let mockInviteCachePromise = null;

async function loadMockInvites() {
  if (!mockInviteCachePromise) {
    mockInviteCachePromise = (async () => {
      const manifest = JSON.parse(await readLocalFile(getMockManifestPath()));
      return Array.isArray(manifest.invites)
        ? manifest.invites.map((invite) =>
            toInviteSession({
              id: invite.slug || invite.token,
              token: invite.token,
              party_name: invite.party_name,
              primary_email: invite.primary_email,
              secondary_email: invite.secondary_email,
              guest_names: invite.guest_names,
              max_guests: invite.max_guests,
              attendance: invite.attendance || '',
              guest_count: invite.guest_count ?? null,
              dietary_restrictions: invite.dietary_restrictions || '',
              song_request: invite.song_request || '',
              submitted_at: invite.submitted_at || null,
            }),
          )
        : [];
    })();
  }

  return mockInviteCachePromise;
}

async function readLocalFile(fileUrl) {
  const { readFile } = await import('node:fs/promises');
  return readFile(fileUrl, 'utf8');
}

async function requestSupabase(path, init = {}) {
  ensureConfig();

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Supabase request failed.');
  }

  return response.json();
}

function tokenSelect(token) {
  return `${INVITES_TABLE}?select=*&token=eq.${encodeURIComponent(token)}&limit=1`;
}

function emailSelect(email) {
  const normalizedEmail = encodeURIComponent(normalizeEmail(email));
  return `${INVITES_TABLE}?select=*&or=(primary_email.eq.${normalizedEmail},secondary_email.eq.${normalizedEmail})&limit=5`;
}

export async function getInviteByToken(token) {
  if (USE_MOCK_INVITES) {
    const invites = await loadMockInvites();
    return invites.find((invite) => invite.token === token) ?? null;
  }

  const rows = await requestSupabase(tokenSelect(token), {
    method: 'GET',
    headers: {
      Prefer: 'return=minimal',
    },
  });

  return rows[0] ? toInviteSession(rows[0]) : null;
}

export async function lookupInviteByEmailAndName(email, name) {
  if (USE_MOCK_INVITES) {
    const invites = await loadMockInvites();
    const normalizedName = normalizeCompare(name);
    const normalizedEmail = normalizeEmail(email);

    return (
      invites.find((invite) => {
        const emailMatches =
          normalizeEmail(invite.primaryEmail) === normalizedEmail ||
          normalizeEmail(invite.secondaryEmail) === normalizedEmail;
        if (!emailMatches) return false;

        const candidateNames = [invite.partyName, ...invite.guestNames];
        return candidateNames.some((entry) => {
          const normalizedEntry = normalizeCompare(entry);
          return (
            normalizedEntry === normalizedName ||
            normalizedEntry.includes(normalizedName) ||
            normalizedName.includes(normalizedEntry)
          );
        });
      }) ?? null
    );
  }

  const rows = await requestSupabase(emailSelect(email), {
    method: 'GET',
    headers: {
      Prefer: 'return=minimal',
    },
  });

  const normalizedName = normalizeCompare(name);

  const match = rows.find((row) => {
    const candidateNames = [row.party_name, ...(Array.isArray(row.guest_names) ? row.guest_names : [])];
    return candidateNames.some((entry) => {
      const normalizedEntry = normalizeCompare(entry);
      return (
        normalizedEntry === normalizedName ||
        normalizedEntry.includes(normalizedName) ||
        normalizedName.includes(normalizedEntry)
      );
    });
  });

  return match ? toInviteSession(match) : null;
}

export async function updateInviteRsvp(token, payload) {
  if (USE_MOCK_INVITES) {
    const invites = await loadMockInvites();
    const invite = invites.find((entry) => entry.token === token) ?? null;
    if (!invite) return null;

    invite.rsvp = {
      attendance: payload.attendance === 'yes' || payload.attendance === 'no' ? payload.attendance : '',
      guestCount: payload.guest_count ?? null,
      dietaryRestrictions: String(payload.dietary_restrictions ?? ''),
      songRequest: String(payload.song_request ?? ''),
      submittedAt: payload.submitted_at ? String(payload.submitted_at) : null,
    };
    return invite;
  }

  const rows = await requestSupabase(
    `${INVITES_TABLE}?token=eq.${encodeURIComponent(token)}&select=*`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );

  return rows[0] ? toInviteSession(rows[0]) : null;
}
