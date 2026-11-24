import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, apiState, ApiError, isUnreachable } from '../src/api/client.js';
import { makeQueryClient } from '../src/api/queryClient.js';

const json = (status, body, headers = {}) => new Response(body == null ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  apiState.mock = false;
});

describe('apiFetch', () => {
  it('uses the live API by default (no mock unless VITE_USE_MOCK=true)', async () => {
    expect(apiState.mock).toBe(false);
    const fetch = vi.fn(async () => json(200, { ok: true }));
    vi.stubGlobal('fetch', fetch);
    expect(await apiFetch('/health')).toEqual({ ok: true });
    expect(fetch.mock.calls[0][0]).toBe('/api/health');
    expect(fetch.mock.calls[0][1]).toMatchObject({ credentials: 'include' });
  });

  it('a dropped connection is a NETWORK error, never mock data, for admin requests', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    const err = await apiFetch('/admin/stats').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('NETWORK');
    expect(isUnreachable(err)).toBe(true);
    await expect(apiFetch('/orders/mine')).rejects.toMatchObject({ code: 'NETWORK' });
  });

  it('a proxy 5xx without our JSON envelope means the API is down', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 502 })));
    await expect(apiFetch('/admin/orders')).rejects.toMatchObject({ code: 'NETWORK', status: 0 });
  });

  it('a 200 that is not JSON (a static host answering /api with index.html) is "unreachable", not null data', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<!doctype html><html></html>', { status: 200, headers: { 'Content-Type': 'text/html' } })));
    await expect(apiFetch('/admin/products')).rejects.toMatchObject({ code: 'NETWORK', status: 0 });
  });

  it('a 404 without our JSON envelope means the API is not there; a real API 404 keeps its code', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } })));
    await expect(apiFetch('/orders/abc')).rejects.toMatchObject({ code: 'NETWORK' });
    vi.stubGlobal('fetch', vi.fn(async () => json(404, { error: { code: 'NOT_FOUND', message: 'Product not found.' } })));
    await expect(apiFetch('/orders/abc')).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });

  it('server errors keep their JSON code and message; 429 names the wait', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(400, { error: { code: 'VALIDATION_ERROR', message: 'Check the highlighted fields.', details: [{ path: 'email', message: 'x' }] } })));
    await expect(apiFetch('/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR', details: [{ path: 'email', message: 'x' }] });
    vi.stubGlobal('fetch', vi.fn(async () => json(429, { error: { code: 'RATE_LIMITED', message: 'Too many.' } }, { 'Retry-After': '120' })));
    await expect(apiFetch('/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 429, message: 'Too many attempts. Try again in 2 minutes.' });
    vi.stubGlobal('fetch', vi.fn(async () => json(500, { error: { code: 'INTERNAL', message: 'Something went wrong.' } })));
    await expect(apiFetch('/products')).rejects.toMatchObject({ status: 500, code: 'INTERNAL' });
  });

  it('times out with a TIMEOUT error', async () => {
    vi.stubGlobal('fetch', vi.fn((_u, { signal }) => new Promise((_r, rej) => signal.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError'))))));
    await expect(apiFetch('/admin/stats', { timeout: 30 })).rejects.toMatchObject({ code: 'TIMEOUT' });
  });

  it('a caller abort (unmount) rejects with the abort, not an ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn((_u, { signal }) => new Promise((_r, rej) => signal.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError'))))));
    const ctrl = new AbortController();
    const p = apiFetch('/products', { signal: ctrl.signal });
    ctrl.abort();
    const err = await p.catch((e) => e);
    expect(err).not.toBeInstanceOf(ApiError);
  });

  it('dev only: public catalogue requests fall back to the bundled products when the API is down', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const list = await apiFetch('/products', { query: { limit: 4 } });
    expect(list.items.length).toBeGreaterThan(0);
    const cats = await apiFetch('/categories');
    expect(cats.items.length).toBeGreaterThan(0);
    await expect(apiFetch('/auth/me')).rejects.toMatchObject({ code: 'NETWORK' });
  });
});

describe('query client', () => {
  it('retries only unreachable / 5xx failures, and a 401 signs the user out', () => {
    const onAuthLost = vi.fn();
    const qc = makeQueryClient({ onAuthLost });
    const retry = qc.getDefaultOptions().queries.retry;
    expect(retry(0, new ApiError(0, 'NETWORK', 'x'))).toBe(true);
    expect(retry(3, new ApiError(0, 'NETWORK', 'x'))).toBe(true); // rides out a free-tier API waking up
    expect(retry(4, new ApiError(0, 'NETWORK', 'x'))).toBe(false);
    expect(retry(0, new ApiError(503, 'INTERNAL', 'x'))).toBe(true);
    expect(retry(0, new ApiError(404, 'NOT_FOUND', 'x'))).toBe(false);
    expect(retry(0, new ApiError(429, 'RATE_LIMITED', 'x'))).toBe(false);

    qc.setQueryData(['me'], { id: 'u1', role: 'admin' });
    qc.getQueryCache().config.onError(new ApiError(401, 'UNAUTHENTICATED', 'x'), { queryKey: ['admin', 'stats'] });
    expect(onAuthLost).toHaveBeenCalledTimes(1);
    expect(qc.getQueryData(['me'])).toBeNull();
    qc.getQueryCache().config.onError(new ApiError(401, 'UNAUTHENTICATED', 'x'), { queryKey: ['admin', 'stats'] });
    expect(onAuthLost).toHaveBeenCalledTimes(1); // already signed out
  });
});
