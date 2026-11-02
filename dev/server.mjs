/* Server lokal për zhvillim/prova: skedarët statikë + /api/cert me ruajtje në memorie (si Netlify, pa Netlify).
   Përdorim:  CERT_ADMIN_TOKEN=test node dev/server.mjs   →  http://localhost:8124 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handle } from '../netlify/functions/cert-core.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const mem = new Map();
const store = {
  async get(k) { return mem.has(k) ? JSON.parse(mem.get(k)) : null; },
  async set(k, o, opt) { if (opt && opt.onlyIfNew && mem.has(k)) return false; mem.set(k, JSON.stringify(o)); return true; },
  async list(p) { return [...mem.keys()].filter(k => k.startsWith(p)); }
};
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
const env = { CERT_ADMIN_TOKEN: process.env.CERT_ADMIN_TOKEN || 'test' };

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost');
  if (u.pathname === '/api/cert') {
    let body = ''; for await (const c of req) body += c;
    const r = await handle({ method: req.method, url: req.url, headers: { get: h => req.headers[h.toLowerCase()] }, json: async () => JSON.parse(body) }, store, env);
    res.writeHead(r.status, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(r.body)); return;
  }
  let p = u.pathname;
  if (p.startsWith('/v/')) { res.writeHead(200, { 'content-type': types['.html'] }); res.end(fs.readFileSync(path.join(root, 'verifiko.html'))); return; }
  if (p === '/') p = '/index.html';
  const f = path.join(root, path.normalize(p));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
}).listen(8124, () => console.log('http://localhost:8124  (çelësi i administratorit: ' + env.CERT_ADMIN_TOKEN + ')'));
