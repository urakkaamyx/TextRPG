import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStory, publicState, applyTurn, updatePlugin, GENRES } from './src/domain.js';
import { StoryStore } from './src/storage.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const publicRoot = resolve(root, 'public');
const store = new StoryStore(resolve(root, 'data', 'stories'));
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '0.0.0.0';
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };

function send(response, status, body, contentType = 'application/json; charset=utf-8') {
  response.writeHead(status, { 'content-type': contentType, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'content-security-policy': "default-src 'self'; base-uri 'none'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'", 'permissions-policy': 'camera=(), microphone=(), geolocation=()' });
  response.end(contentType.startsWith('application/json') ? JSON.stringify(body) : body);
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 32_000) throw Object.assign(new Error('Request body is too large.'), { statusCode: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); }
  catch { throw Object.assign(new Error('Request body must be valid JSON.'), { statusCode: 400 }); }
}

async function serveStatic(pathname, response) {
  let requested = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  const file = resolve(publicRoot, `.${requested}`);
  if (file !== publicRoot && !file.startsWith(`${publicRoot}${sep}`)) return send(response, 403, { error: 'Forbidden.' });
  try {
    const info = await stat(file);
    if (!info.isFile()) return send(response, 404, { error: 'Not found.' });
    send(response, 200, await readFile(file), mime[extname(file)] || 'application/octet-stream');
  } catch { send(response, 404, { error: 'Not found.' }); }
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    if (request.method === 'GET' && url.pathname === '/api/health') return send(response, 200, { ok: true, app: 'TextBasedRPG', version: '0.1.0' });
    if (request.method === 'GET' && url.pathname === '/api/genres') return send(response, 200, { genres: Object.entries(GENRES).map(([id, profile]) => ({ id, ...profile })) });
    if (request.method === 'GET' && url.pathname === '/api/stories') return send(response, 200, { stories: await store.list() });
    if (request.method === 'POST' && url.pathname === '/api/stories') {
      const body = await readJson(request);
      const story = createStory(body);
      await store.save(story);
      return send(response, 201, { story: publicState(story) });
    }
    const match = url.pathname.match(/^\/api\/stories\/([a-z0-9-]+)(?:\/(turn|plugins\/([a-z0-9-]+)))?$/i);
    if (match) {
      const [, storyId, route, pluginId] = match;
      if (request.method === 'GET' && !route) return send(response, 200, { story: publicState(await store.get(storyId)) });
      if (request.method === 'POST' && route === 'turn') {
        const body = await readJson(request);
        const result = await store.transact(storyId, async () => {
          const state = await store.get(storyId);
          const applied = applyTurn(state, body);
          if (!applied.replayed) await store.save(applied.state);
          return applied;
        });
        return send(response, 200, { story: publicState(result.state), turn: result.turn, replayed: result.replayed });
      }
      if (request.method === 'PATCH' && pluginId) {
        const body = await readJson(request);
        const next = await store.transact(storyId, async () => {
          const state = await store.get(storyId);
          const updated = updatePlugin(state, pluginId, body.enabled, body.expectedRevision);
          await store.save(updated);
          return updated;
        });
        return send(response, 200, { story: publicState(next) });
      }
    }
    if (url.pathname.startsWith('/api/')) return send(response, 404, { error: 'API route not found.' });
    if (request.method !== 'GET' && request.method !== 'HEAD') return send(response, 405, { error: 'Method not allowed.' });
    return serveStatic(url.pathname, response);
  } catch (error) {
    const status = Number(error.statusCode) || (error.code === 'ENOENT' ? 404 : 400);
    return send(response, status, { error: error.message || 'Request failed.' });
  }
});

server.listen(port, host, () => console.log(`TextBasedRPG ready at http://${host}:${port}`));
