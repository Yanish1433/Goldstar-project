// Cloudflare Pages Function: same-origin /api/* proxy to the API host (Render).
// The browser only ever talks to the Pages origin, so the httpOnly SameSite=lax session cookie stays first-party.
// Config: Pages variable/secret API_ORIGIN, e.g. https://goldstar-api.onrender.com (no trailing path).

// Render's free tier cold-starts in ~30-50 s; wait longer than that before giving up.
export const UPSTREAM_TIMEOUT_MS = 65_000;

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'proxy-connection',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
]);

// Never forwarded from the browser: we set the forwarding headers ourselves from what Cloudflare saw.
const REPLACED = new Set(['x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-host', 'x-real-ip', 'forwarded']);

function badGateway() {
  // Deliberately no JSON envelope: the client maps a 5xx without one to its "Can't reach the server" state.
  return new Response('Bad Gateway', {
    status: 502,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function upstreamBase(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    return u.origin;
  } catch {
    return null;
  }
}

export function buildUpstreamHeaders(request) {
  const url = new URL(request.url);
  const out = new Headers();
  for (const [k, v] of request.headers) {
    const name = k.toLowerCase();
    if (HOP_BY_HOP.has(name) || REPLACED.has(name) || name.startsWith('cf-')) continue;
    out.append(k, v);
  }
  const ip = request.headers.get('cf-connecting-ip');
  if (ip) out.set('X-Forwarded-For', ip);
  out.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
  out.set('X-Forwarded-Host', url.host);
  return out;
}

export function buildClientHeaders(upstream) {
  const out = new Headers();
  for (const [k, v] of upstream.headers) {
    const name = k.toLowerCase();
    if (HOP_BY_HOP.has(name) || name === 'set-cookie') continue;
    out.append(k, v);
  }
  // Headers iteration can merge cookies into one comma-joined value; append each one separately.
  const cookies = typeof upstream.headers.getSetCookie === 'function' ? upstream.headers.getSetCookie() : [];
  for (const c of cookies) out.append('Set-Cookie', c);
  return out;
}

// 1 s, 2 s, then every 3 s while Render boots a sleeping instance (~20-50 s).
export const wakeDelay = (attempt) => Math.min(3000, 1000 * (attempt + 1));

export async function onRequest({ request, env }) {
  const base = upstreamBase(env?.API_ORIGIN);
  if (!base) return badGateway();

  const url = new URL(request.url);
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  try {
    // Buffered (API bodies are small JSON) so the request can be re-sent while Render wakes the instance.
    const body = hasBody ? await request.arrayBuffer() : undefined;
    const headers = buildUpstreamHeaders(request);
    const deadline = Date.now() + UPSTREAM_TIMEOUT_MS;
    let upstream;
    for (let attempt = 0; ; attempt++) {
      upstream = await fetch(`${base}${url.pathname}${url.search}`, {
        method: request.method,
        headers,
        body,
        redirect: 'manual',
        signal: AbortSignal.timeout(Math.max(1000, deadline - Date.now())),
      });
      // Render's free tier answers with its own HTML 502/503/504 page while a sleeping instance boots: the request
      // never reached the API, so it is safe to re-send. Our API always answers in JSON, so a JSON 5xx passes through.
      const waking = upstream.status >= 502 && upstream.status <= 504 && !(upstream.headers.get('content-type') || '').includes('json');
      if (!waking || Date.now() + wakeDelay(attempt) >= deadline - 1000) break;
      await upstream.body?.cancel();
      await new Promise((r) => setTimeout(r, wakeDelay(attempt)));
    }
    const noBody = upstream.status === 204 || upstream.status === 205 || upstream.status === 304;
    return new Response(noBody ? null : upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: buildClientHeaders(upstream),
    });
  } catch {
    return badGateway();
  }
}
