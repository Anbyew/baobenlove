// Zero-dependency local server for the wedding to-do tracker.
// Serves the static frontend and reads/writes data/todos.json.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4242;
const DATA_FILE = path.join(__dirname, 'data', 'todos.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function serveStatic(req, res) {
  const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  if (req.url === '/api/data' && req.method === 'GET') {
    fs.readFile(DATA_FILE, 'utf8', (err, raw) => {
      if (err) return sendJSON(res, 500, { error: 'Could not read data file' });
      try {
        sendJSON(res, 200, JSON.parse(raw));
      } catch {
        sendJSON(res, 500, { error: 'Data file is corrupted' });
      }
    });
    return;
  }

  if (req.url === '/api/data' && req.method === 'PUT') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      let incoming;
      try {
        incoming = JSON.parse(body);
        if (!incoming || !Array.isArray(incoming.todos) || !Array.isArray(incoming.categories)) {
          throw new Error('Malformed payload');
        }
      } catch {
        sendJSON(res, 400, { error: 'Invalid data' });
        return;
      }

      // Optimistic concurrency: with multiple tabs/sessions editing the same
      // file, a write based on stale data would silently clobber whatever
      // was saved in between. Require the version this client last loaded
      // to still be current before accepting the write.
      fs.readFile(DATA_FILE, 'utf8', (err, raw) => {
        if (err) return sendJSON(res, 500, { error: 'Could not read data file' });
        let current;
        try {
          current = JSON.parse(raw);
        } catch {
          return sendJSON(res, 500, { error: 'Data file is corrupted' });
        }

        const currentVersion = current.version || 1;
        const baseVersion = incoming.version || 1;
        if (baseVersion !== currentVersion) {
          sendJSON(res, 409, {
            error: 'This was changed in another tab or session since you loaded it. Reload to get the latest before saving.',
            current,
          });
          return;
        }

        incoming.version = currentVersion + 1;
        fs.writeFile(DATA_FILE, JSON.stringify(incoming, null, 2), (err) => {
          if (err) return sendJSON(res, 500, { error: 'Could not save' });
          sendJSON(res, 200, { ok: true, version: incoming.version });
        });
      });
    });
    return;
  }

  serveStatic(req, res);
});

const HOST = process.env.HOST || '127.0.0.1';
server.listen(PORT, HOST, () => {
  console.log(`Wedding to-do tracker running at http://${HOST}:${PORT}`);
});
