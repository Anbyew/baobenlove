import { lookupInviteByEmail } from './_invite-store.mjs';

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
    const { email } = JSON.parse(event.body || '{}');
    const normalizedEmail = String(email ?? '').trim().toLowerCase();

    if (!normalizedEmail) return json(400, { error: 'Email is required.' });

    const invite = await lookupInviteByEmail(normalizedEmail);

    if (!invite) return json(200, { found: false });

    return json(200, {
      found: true,
      partyName: invite.partyName,
      guestNames: invite.guestNames,
    });
  } catch (err) {
    console.error('lookup-by-email error:', err);
    return json(500, { error: 'Lookup failed. Please try again.' });
  }
}
