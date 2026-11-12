#!/usr/bin/env node
/**
 * Local preview server (zero dependencies):
 *   node tools/serve.mjs            # http://127.0.0.1:8787
 *   PORT=9000 node tools/serve.mjs
 *
 * Does three things: correct MIME types, index.html for directories, no caching.
 * It does not emulate GitHub Pages 404 handling - 404.html handles that in production.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT || 8787);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2',
};

/** Resolve a URL path to a real file inside ROOT; return null on traversal attempts. */
function resolveSafe(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  const target = normalize(join(ROOT, clean));
  if (!target.startsWith(ROOT.endsWith(sep) ? ROOT : ROOT + sep) && target !== ROOT.replace(/[\\/]$/, '')) {
    return null;
  }
  return target;
}

const server = createServer(async (req, res) => {
  const started = Date.now();
  let target = resolveSafe(req.url || '/');
  try {
    if (!target) throw Object.assign(new Error('forbidden'), { code: 'FORBIDDEN' });
    let info = await stat(target);
    if (info.isDirectory()) {
      target = join(target, 'index.html');
      info = await stat(target);
    }
    const body = await readFile(target);
    const ext = extname(target).toLowerCase();
    res.writeHead(200, {
      'content-type': MIME[ext] || 'application/octet-stream',
      'content-length': body.length,
      'cache-control': 'no-store',
    });
    res.end(body);
  } catch {
    // Serve the site's 404.html for missing paths, matching production behaviour
    try {
      const body = await readFile(join(ROOT, '404.html'));
      res.writeHead(404, { 'content-type': MIME['.html'], 'cache-control': 'no-store' });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': MIME['.txt'] });
      res.end('404');
    }
  } finally {
    const ms = Date.now() - started;
    process.stdout.write(`${res.statusCode} ${req.method} ${req.url} ${ms}ms\n`);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  process.stdout.write(`serving ${ROOT} on http://127.0.0.1:${PORT}\n`);
});
