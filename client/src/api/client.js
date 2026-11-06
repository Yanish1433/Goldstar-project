// Thin fetch wrapper for the REST contract (SPEC 3). Relative URLs only, cookie auth.
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

export const apiState = { mock: import.meta.env.VITE_USE_MOCK === 'true', mockFallback: false };

const buildQuery = (query) => {
  if (!query) return '';
  const p = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : '';
};

export async function apiFetch(path, { method = 'GET', body, query } = {}) {
  const url = `/api${path}${buildQuery(query)}`;
  if (apiState.mock) {
    // Dead-code eliminated in production builds unless VITE_USE_MOCK=true.
    if (import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.DEV) {
      const { mockRequest } = await import('./mock/index.js');
      return mockRequest(method, path, body, query);
    }
  }
  let res;
  try {
    res = await fetch(url, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Could not reach the server. Check your connection and try again.');
  }
  if (res.status === 204) return null;
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const e = data?.error || {};
    const ra = Number(res.headers.get('Retry-After')) || null;
    const msg = res.status === 429 && ra ? `Too many attempts. Try again in ${Math.max(1, Math.ceil(ra / 60))} ${Math.ceil(ra / 60) <= 1 ? 'minute' : 'minutes'}.` : e.message || 'Something went wrong.';
    throw new ApiError(res.status, e.code || 'INTERNAL', msg, e.details, ra);
  }
  return data;
}

// Dev-only boot check: when the API is unreachable fall back to mock data.
export async function initApi() {
  if (import.meta.env.DEV && !apiState.mock) {
    try {
      const r = await fetch('/api/health', { credentials: 'include' });
      if (!r.ok) throw new Error('down');
    } catch {
      apiState.mock = true;
      apiState.mockFallback = true;
    }
  }
}
