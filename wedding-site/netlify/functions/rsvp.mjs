import { getInviteByToken, updateInviteRsvp } from './_invite-store.mjs';

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

function sanitizeText(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength);
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return json(405, { error: 'Method not allowed.' });
    }

    const payload = JSON.parse(event.body || '{}');
    const token = String(payload.token ?? '').trim();
    const attendance = payload.attendance === 'yes' || payload.attendance === 'no' ? payload.attendance : null;
    const dietaryRestrictions = sanitizeText(payload.dietaryRestrictions, 1000);
    const songRequest = sanitizeText(payload.songRequest, 250);

    if (!token) {
      return json(400, { error: 'Missing invitation token.' });
    }

    if (!attendance) {
      return json(400, { error: 'Please let us know whether you will be attending.' });
    }

    const invite = await getInviteByToken(token);

    if (!invite) {
      return json(404, { error: 'We could not find that invitation.' });
    }

    const parsedGuestCount = Number.parseInt(String(payload.guestCount ?? ''), 10);
    const guestCount = attendance === 'yes' ? parsedGuestCount : 0;

    if (attendance === 'yes' && (!Number.isInteger(guestCount) || guestCount < 1)) {
      return json(400, { error: 'Please enter how many guests from your household will attend.' });
    }

    if (attendance === 'yes' && guestCount > invite.maxGuests) {
      return json(400, {
        error: `Your invitation is reserved for ${invite.maxGuests} guest${invite.maxGuests === 1 ? '' : 's'}.`,
      });
    }

    const updatedInvite = await updateInviteRsvp(token, {
      attendance,
      guest_count: guestCount,
      dietary_restrictions: attendance === 'yes' ? dietaryRestrictions : '',
      song_request: attendance === 'yes' ? songRequest : '',
      submitted_at: new Date().toISOString(),
    });

    if (!updatedInvite) {
      return json(500, { error: 'We could not save your RSVP.' });
    }

    return json(200, { invite: updatedInvite });
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : 'Unexpected server error.',
    });
  }
}
