import { onRequest } from '../functions/api/[[path]].js';

const ORIGIN = 'https://api.example.com';
const call = (path, init = {}, env = { API_ORIGIN: ORIGIN }) =>
  onRequest({ request: new Request(`https://shop.pages.dev${path}`, init), env });
const json = { headers: { 'Content-Type': 'application/json' } };

afterEach(() => vi.unstubAllGlobals());

describe('Pages /api proxy', () => {
  it('forwards method, path, query, body and cookie, and sets forwarding headers', async () => {
    const fetchMock = vi.fn(async () => new Response('{"ok":true}', { status: 201, ...json }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await call('/api/auth/login?x=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'gs_token=abc',
        'X-Forwarded-For': '6.6.6.6',
        'CF-Connecting-IP': '203.0.113.9',
        Connection: 'keep-alive',
      },
      body: JSON.stringify({ email: 'a@b.co' }),
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
    const [target, init] = fetchMock.mock.calls[0];
    expect(target).toBe(`${ORIGIN}/api/auth/login?x=1`);
    expect(init.method).toBe('POST');
    expect(init.headers.get('cookie')).toBe('gs_token=abc');
    expect(init.headers.get('content-type')).toBe('application/json');
    expect(init.headers.get('x-forwarded-for')).toBe('203.0.113.9');
    expect(init.headers.get('x-forwarded-proto')).toBe('https');
    expect(init.headers.get('x-forwarded-host')).toBe('shop.pages.dev');
    expect(init.headers.get('connection')).toBeNull();
    expect(init.headers.get('cf-connecting-ip')).toBeNull();
    expect(await new Response(init.body).text()).toBe('{"email":"a@b.co"}');
  });

  it('sends no body for GET', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', json));
    vi.stubGlobal('fetch', fetchMock);
    await call('/api/products');
    expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
  });

  it('keeps every Set-Cookie header, status and Retry-After', async () => {
    const h = new Headers({ 'Retry-After': '42', 'Content-Type': 'application/json' });
    h.append('Set-Cookie', 'a=1; Path=/; HttpOnly');
    h.append('Set-Cookie', 'b=2; Expires=Wed, 21 Oct 2026 07:28:00 GMT; Path=/');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":{"code":"RATE_LIMITED"}}', { status: 429, headers: h })));
    const res = await call('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('42');
    expect(res.headers.getSetCookie()).toEqual(['a=1; Path=/; HttpOnly', 'b=2; Expires=Wed, 21 Oct 2026 07:28:00 GMT; Path=/']);
  });

  it('returns a bare 502 (no JSON) when the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('fetch failed'); }));
    const res = await call('/api/products');
    expect(res.status).toBe(502);
    expect(res.headers.get('content-type')).not.toContain('json');
  });

  it('returns 502 when API_ORIGIN is missing or invalid, without calling fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect((await call('/api/products', {}, {})).status).toBe(502);
    expect((await call('/api/products', {}, { API_ORIGIN: 'not a url' })).status).toBe(502);
    expect((await call('/api/products', {}, { API_ORIGIN: 'ftp://x.y' })).status).toBe(502);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('tolerates a trailing slash on API_ORIGIN', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', json));
    vi.stubGlobal('fetch', fetchMock);
    await call('/api/health', {}, { API_ORIGIN: `${ORIGIN}/` });
    expect(fetchMock.mock.calls[0][0]).toBe(`${ORIGIN}/api/health`);
  });

  it('retries while Render wakes a sleeping instance (HTML 502), resending the same body', async () => {
    vi.useFakeTimers();
    const wake = () => new Response('<html>502</html>', { status: 502, headers: { 'Content-Type': 'text/html' } });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(wake())
      .mockResolvedValueOnce(wake())
      .mockResolvedValueOnce(new Response('{"items":[]}', { status: 200, ...json }));
    vi.stubGlobal('fetch', fetchMock);
    const p = call('/api/cart/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"items":[1]}' });
    await vi.runAllTimersAsync();
    const res = await p;
    vi.useRealTimers();
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const [, init] of fetchMock.mock.calls) expect(await new Response(init.body).text()).toBe('{"items":[1]}');
  });

  it('passes a JSON 5xx from the API straight through (no retry)', async () => {
    const fetchMock = vi.fn(async () => new Response('{"error":{"code":"INTERNAL"}}', { status: 502, ...json }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await call('/api/products');
    expect(res.status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
