// One-off script: generates a new Gmail OAuth refresh token.
// Usage: node get-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET>
// Opens a browser for consent, then prints the refresh token to paste into EC2 .env.

import http from 'node:http';
import { exec } from 'node:child_process';

const [CLIENT_ID, CLIENT_SECRET] = process.argv.slice(2);
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Usage: node get-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET>');
  process.exit(1);
}

const PORT = 53682;
const REDIRECT_URI = `http://127.0.0.1:${PORT}`;
const SCOPE = 'https://www.googleapis.com/auth/gmail.send';

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  response_type: 'code',
  scope: SCOPE,
  access_type: 'offline',
  prompt: 'consent',
})}`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get('code');
  if (!code) {
    res.end('No code received. Check the terminal.');
    return;
  }

  res.end('Success! You can close this tab and return to the terminal.');

  try {
    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      console.error('Token exchange failed:', data);
    } else {
      console.log('\n=== REFRESH TOKEN ===');
      console.log(data.refresh_token);
      console.log('=====================\n');
    }
  } catch (err) {
    console.error('Error exchanging code:', err);
  } finally {
    server.close();
  }
});

server.listen(PORT, () => {
  console.log(`Listening on ${REDIRECT_URI}`);
  console.log(`Opening browser for consent...\n${authUrl}\n`);
  exec(`open "${authUrl}"`);
});
