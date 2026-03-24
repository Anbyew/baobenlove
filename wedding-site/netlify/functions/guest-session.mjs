import { getInviteByToken, lookupInviteByEmailAndName } from './_invite-store.mjs';

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

export async function handler(event) {
  try {
    if (event.httpMethod === 'GET') {
      const token = event.queryStringParameters?.token?.trim();

      if (!token) {
        return json(400, { error: 'Missing invitation token.' });
      }

      const invite = await getInviteByToken(token);

      if (!invite) {
        return json(404, { error: 'We could not find that invitation.' });
      }

      return json(200, { invite });
    }

    if (event.httpMethod === 'POST') {
      const payload = JSON.parse(event.body || '{}');
      const email = String(payload.email ?? '').trim().toLowerCase();
      const name = String(payload.name ?? '').trim();

      if (!email || !name) {
        return json(400, { error: 'Please enter the name and email from your invitation.' });
      }

      const invite = await lookupInviteByEmailAndName(email, name);

      if (!invite) {
        return json(404, {
          error: 'We could not find a matching invitation. Please try the email from your invitation.',
        });
      }

      return json(200, { invite });
    }

    return json(405, { error: 'Method not allowed.' });
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : 'Unexpected server error.',
    });
  }
}
