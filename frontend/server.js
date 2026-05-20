// Minimal static file server with SPA fallback for production.
// Used on Railway — the `serve` package's behaviour with $PORT was
// flaky on the Nixpacks runtime, so we run our own tiny HTTP server.
//
// - Serves files from ./dist
// - Any path that doesn't match a file falls back to dist/index.html
//   (React Router handles client-side routing).
// - Binds to 0.0.0.0:$PORT so Railway can proxy traffic in.

import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const DIST_DIR = join(__dirname, 'dist');
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.map':  'application/json; charset=utf-8',
};

async function tryFile(p) {
  try {
    const s = await stat(p);
    if (s.isFile()) return p;
  } catch {}
  return null;
}

const indexHtmlPath = join(DIST_DIR, 'index.html');

createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    // Prevent directory traversal.
    const safePath = join(DIST_DIR, urlPath).startsWith(DIST_DIR)
      ? join(DIST_DIR, urlPath)
      : DIST_DIR;

    // Try exact file, then path/index.html, then SPA fallback to index.html.
    let target = await tryFile(safePath);
    if (!target) target = await tryFile(join(safePath, 'index.html'));
    if (!target) target = indexHtmlPath; // SPA fallback

    const contents = await readFile(target);
    const ext = extname(target).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      // Cache hashed assets aggressively; index.html no-cache so users
      // pick up new deploys without a hard reload.
      'Cache-Control': target === indexHtmlPath
        ? 'no-cache, no-store, must-revalidate'
        : 'public, max-age=31536000, immutable',
    });
    res.end(contents);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
    console.error('[server]', err);
  }
}).listen(PORT, HOST, () => {
  console.log(`Frontend serving on http://${HOST}:${PORT}`);
});
