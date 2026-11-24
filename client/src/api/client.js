// Thin fetch wrapper for the REST contract (SPEC 3). Relative URLs only, cookie auth.
// Every request has a timeout, can be cancelled (React Query passes `signal` and aborts on unmount / route change),
// and fails with an ApiError whose `code` tells the UI what went wrong:
//   NETWORK  the server could not be reached (down, restarting, proxy error)
//   OFFLINE  the browser is offline
//   TIMEOUT  no answer within the time limit
//   anything else comes from the server's JSON error envelope (VALIDATION_ERROR, UNAUTHENTICATED, ...).
export class ApiError extends Error {
  constructor(status, code, message, details, retryAfter) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details || [];
    this.retryAfter = retryAfter || null;
  }
}

/** True when the request never got a real answer from the API (so retrying, or a "server offline" state, makes sense). */
export const isUnreachable = (e) => e instanceof ApiError && (e.code === 'NETWORK' || e.code === 'OFFLINE' || e.code === 'TIMEOUT');

// The live API is the default for every build. VITE_USE_MOCK=true is an explicit opt-in for a static showcase build
// (no server): it serves the bundled catalogue from an in-browser mock that starts with no orders and no customers.
const MOCK_BUILD = import.meta.env.VITE_USE_MOCK === 'true';
export const apiState = { mock: MOCK_BUILD };

// 60 s: the API on Render's free tier cold-starts in ~30-50 s after idling. A dead API still fails fast (the proxy answers 502).
export const TIMEOUT_MS = 60_000;

// Public catalogue requests. In dev only, when the API is down (e.g. while `node --watch` restarts it), these fall back
// to the bundled catalogue so the storefront still shows products. Auth, orders and every /admin request never do:
// the admin only ever shows real data.
const isCatalogue = (method, path) =>
  (method === 'GET' && (path === '/categories' || /^\/products(\/|$)/.test(path))) || (method === 'POST' && path === '/cart/quote');

const buildQuery = (query) => {
  if (!query) return '';
  const p = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : '';
};

async function viaMock(method, path, body, query) {
  const { mockRequest } = await import('./mock/index.js');
  return mockRequest(method, path, body, query);
}

const offline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

const unreachable = (timedOut) => {
  if (timedOut) return new ApiError(0, 'TIMEOUT', 'The server is taking too long to answer. Try again.');
  if (offline()) return new ApiError(0, 'OFFLINE', 'You are offline. Check your internet connection and try again.');
  return new ApiError(0, 'NETWORK', 'Can’t reach the server right now. Try again in a moment.');
};

function statusMessage(status, data, retryAfter) {
  if (status === 429) {
    if (!retryAfter) return data?.error?.message || 'Too many attempts. Wait a moment and try again.';
    if (retryAfter < 60) return `Too many attempts. Try again in ${retryAfter} ${retryAfter === 1 ? 'second' : 'seconds'}.`;
    const m = Math.ceil(retryAfter / 60);
    return `Too many attempts. Try again in ${m} ${m === 1 ? 'minute' : 'minutes'}.`;
  }
  if (data?.error?.message) return data.error.message;
  if (status >= 500) return 'The server ran into a problem. Try again in a moment.';
  return 'Something went wrong.';
}

async function request(method, path, body, query, signal, timeout) {
  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctrl.abort();
  }, timeout);
  const forward = () => ctrl.abort(signal.reason);
  if (signal) {
    if (signal.aborted) forward();
    else signal.addEventListener('abort', forward, { once: true });
  }
  try {
    let res;
    try {
      res = await fetch(`/api${path}${buildQuery(query)}`, {
        method,
        credentials: 'include',
        headers: body !== undefined ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });
    } catch (err) {
      if (signal?.aborted) throw err; // cancelled by the caller: React Query ignores it
      throw unreachable(timedOut);
    }
    if (res.status === 204) return null;
    let data = null;
    const isJson = (res.headers.get('Content-Type') || '').includes('application/json');
    try {
      data = isJson ? await res.json() : null;
    } catch (err) {
      if (signal?.aborted) throw err;
      if (timedOut) throw unreachable(true);
      data = null;
    }
    if (!res.ok) {
      // A 5xx without our JSON envelope came from a proxy (Vite dev proxy, a host's load balancer): the API itself is down.
      // A 404 without it is the same story: the host has no /api behind it (a static host answering for the API).
      if ((res.status >= 500 || res.status === 404) && !data?.error) throw unreachable(false);
      const e = data?.error || {};
      const ra = Number(res.headers.get('Retry-After')) || null;
      throw new ApiError(res.status, e.code || (res.status >= 500 ? 'INTERNAL' : 'ERROR'), statusMessage(res.status, data, ra), e.details, ra);
    }
    // A 2xx that is not JSON is not our API either (a static host's index.html answering /api/*): treat it as unreachable
    // instead of handing `null` to hooks that read `.items` / `.product` off it.
    if (!isJson) throw unreachable(false);
    return data;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forward);
  }
}

/**
 * apiFetch(path, { method, body, query, signal, timeout }).
 * `signal` (from React Query or an AbortController) cancels the request; `timeout` defaults to 15 s.
 */
export async function apiFetch(path, { method = 'GET', body, query, signal, timeout = TIMEOUT_MS } = {}) {
  // Production builds without VITE_USE_MOCK=true drop the mock entirely (this branch and the chunk are dead code).
  if ((MOCK_BUILD || import.meta.env.DEV) && apiState.mock) return viaMock(method, path, body, query);
  try {
    return await request(method, path, body, query, signal, timeout);
  } catch (err) {
    if (import.meta.env.DEV && isUnreachable(err) && isCatalogue(method, path)) {
      if (!apiState.warned) {
        apiState.warned = true;
        console.warn('[api] The API is not reachable: showing the bundled product catalogue. Start the server (npm run dev) for live data.');
      }
      return viaMock(method, path, body, query);
    }
    throw err;
  }
}
