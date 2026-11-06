import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Product } from '../src/models/Product.js';
import { User } from '../src/models/User.js';
import {
  ADMIN,
  adminAgent,
  agentFor,
  g10Line,
  makeApp,
  newUser,
  registeredAgent,
  seedOffline,
  SHIPPING,
  startDb,
  stopDb,
} from './helpers.js';

let app;

beforeAll(async () => {
  await startDb();
  await seedOffline();
  app = makeApp();
});

afterAll(stopDb);

const hasKey = (obj, key) => JSON.stringify(obj).includes(`"${key}"`);

describe('1. health', () => {
  it('returns ok and db up', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, db: 'up' });
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff'); // helmet
  });
});

describe('2. register + me', () => {
  it('sets an httpOnly cookie, me works, passwordHash is never exposed', async () => {
    const agent = agentFor(app);
    const body = newUser({ phone: '98 1234-5678' });
    const reg = await agent.post('/api/auth/register').send(body);
    expect(reg.status).toBe(201);
    const cookie = reg.headers['set-cookie'].find((c) => c.startsWith('gs_token='));
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\//);
    expect(cookie).toMatch(/Max-Age=604800/);
    expect(cookie).not.toMatch(/Secure/i);
    expect(reg.body.user).toMatchObject({ name: body.name, email: body.email, phone: '9812345678', role: 'user' });
    expect(reg.body.user.id).toMatch(/^[0-9a-f]{24}$/);
    expect(JSON.stringify(reg.body)).not.toMatch(/passwordHash|_id|__v|token/);
    expect(JSON.stringify(reg.body)).not.toContain(body.password);

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(body.email);
    expect(hasKey(me.body, 'passwordHash')).toBe(false);

    const guest = await request(app).get('/api/auth/me');
    expect(guest.status).toBe(401);
    expect(guest.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('enforces password rules and strict bodies', async () => {
    const weak = await request(app).post('/api/auth/register').send(newUser({ password: 'short1' }));
    expect(weak.status).toBe(400);
    expect(weak.body.error.code).toBe('VALIDATION_ERROR');
    expect(weak.body.error.details[0].path).toBe('password');
    const noDigit = await request(app).post('/api/auth/register').send(newUser({ password: 'onlyletters' }));
    expect(noDigit.status).toBe(400);
    const long = await request(app).post('/api/auth/register').send(newUser({ password: 'a1'.repeat(37) }));
    expect(long.status).toBe(400);
    const extra = await request(app).post('/api/auth/register').send({ ...newUser(), role: 'admin' });
    expect(extra.status).toBe(400);
    expect(extra.body.error.details[0].path).toBe('role');
  });

  it('logout clears the cookie', async () => {
    const { agent } = await registeredAgent(app);
    const out = await agent.post('/api/auth/logout');
    expect(out.status).toBe(204);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
});

describe('3. duplicate register and bad login', () => {
  it('duplicate email gives 409 EMAIL_TAKEN', async () => {
    const { body } = await registeredAgent(app);
    const again = await request(app).post('/api/auth/register').send({ ...newUser(), email: body.email.toUpperCase() });
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('wrong password and unknown email give the same 401', async () => {
    const { body } = await registeredAgent(app);
    const wrong = await request(app).post('/api/auth/login').send({ email: body.email, password: 'Wrong-pass-1' });
    const unknown = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'Wrong-pass-1' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
    expect(wrong.body.error.code).toBe('INVALID_CREDENTIALS');
    const ok = await request(app).post('/api/auth/login').send({ email: body.email, password: body.password });
    expect(ok.status).toBe(200);
  });

  it('rejects operator injection in login with 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('4. auth rate limiter', () => {
  it('returns 429 with Retry-After after 10 attempts (real production limit)', async () => {
    const limited = makeApp({ limits: { global: 300, auth: 10 } });
    const attempt = () => request(limited).post('/api/auth/login').send({ email: 'x@example.com', password: 'Wrong-pass-1' });
    for (let i = 0; i < 10; i++) expect((await attempt()).status).toBe(401);
    const res = await attempt();
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
  });
});

describe('5. products', () => {
  it('lists, paginates, filters by category, sorts by price', async () => {
    const all = await request(app).get('/api/products?limit=48');
    expect(all.status).toBe(200);
    expect(all.body).toMatchObject({ page: 1, limit: 48, total: 5 });
    expect(all.body.items[0].slug).toBe('g10-401'); // featured first
    const g = all.body.items[0];
    expect(g).toMatchObject({ priceFrom: 2775, priceTo: 3400, featured: true });
    expect(Object.keys(g).sort()).toEqual(
      ['categories', 'colourways', 'featured', 'id', 'name', 'priceFrom', 'priceTo', 'series', 'slug'].sort(),
    );
    expect(g.colourways[0].secondImage).toMatchObject({ src: expect.stringMatching(/^https:/), thumb: expect.any(String), alt: expect.any(String) });
    expect(g.colourways[0].secondImage.src).not.toBe(g.colourways[0].image.src);
    expect(g.colourways[0].image).toMatchObject({ src: expect.stringMatching(/^https:/), thumb: expect.any(String), alt: expect.any(String) });

    const p1 = await request(app).get('/api/products?limit=2&page=1');
    const p3 = await request(app).get('/api/products?limit=2&page=3');
    expect(p1.body.items).toHaveLength(2);
    expect(p3.body.items).toHaveLength(1);
    expect(p3.body.total).toBe(5);

    const men = await request(app).get('/api/products?category=men');
    expect(men.body.items.map((i) => i.slug).sort()).toEqual(['ax', 'ax-1-a', 'ax-3']);

    const asc = await request(app).get('/api/products?sort=price_asc&limit=48');
    const prices = asc.body.items.map((i) => i.priceFrom);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    const desc = await request(app).get('/api/products?sort=price_desc&limit=48');
    expect(desc.body.items[0].priceTo).toBe(3700);

    const search = await request(app).get('/api/products?q=l2102');
    expect(search.body.items.map((i) => i.slug)).toEqual(['g10-l2102']);

    expect((await request(app).get('/api/products?limit=49')).status).toBe(400);
    expect((await request(app).get('/api/products?sort=bogus')).status).toBe(400);
    // Express 5 parses queries flat, so an operator-style key is just an unknown (ignored) param, not a filter
    const inject = await request(app).get('/api/products?category[$ne]=men');
    expect(inject.status).toBe(200);
    expect(inject.body.total).toBe(5);
    expect((await request(app).get('/api/products?category=men&category=women')).status).toBe(400);
  });

  it('serves detail by slug, 404 for unknown, hides archived products', async () => {
    const detail = await request(app).get('/api/products/g10-401');
    expect(detail.status).toBe(200);
    const p = detail.body.product;
    expect(p).toMatchObject({ slug: 'g10-401', name: 'G10-401', featured: true, active: true, priceFrom: 2775, priceTo: 3400 });
    expect(p.colourways.map((c) => [c.key, c.price])).toEqual([['black', 3400], ['olive', 2775]]);
    expect(p.specCallouts).toHaveLength(7);
    expect(hasKey(p, '_id') || hasKey(p, '__v')).toBe(false);

    const missing = await request(app).get('/api/products/nope');
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');

    await Product.updateOne({ slug: 'ax' }, { active: false });
    expect((await request(app).get('/api/products/ax')).status).toBe(404);
    const list = await request(app).get('/api/products?limit=48');
    expect(list.body.items.map((i) => i.slug)).not.toContain('ax');
    await Product.updateOne({ slug: 'ax' }, { active: true });
  });

  it('lists categories with sentence-case names and counts', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    const trek = res.body.items.find((c) => c.slug === 'trek-collection');
    expect(trek).toEqual({ slug: 'trek-collection', name: 'Trek collection', count: 4 });
  });
});

describe('6. quote', () => {
  it('re-prices from the database and reports bad lines in problems', async () => {
    const line = await g10Line(app, { colourwayKey: 'olive', size: '8', qty: 2 });
    const res = await request(app)
      .post('/api/cart/quote')
      .send({
        items: [
          line,
          { ...line, colourwayKey: 'black', size: '10', qty: 1 },
          { ...line, size: '13' },
          { ...line, colourwayKey: 'purple' },
          { productId: 'not-an-id', colourwayKey: 'black', size: '8', qty: 1 },
          { productId: '0123456789abcdef01234567', colourwayKey: 'black', size: '8', qty: 1 },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.lines).toHaveLength(2);
    expect(res.body.lines[0]).toMatchObject({ slug: 'g10-401', name: 'G10-401', colourwayKey: 'olive', colourwayName: 'Olive', size: '8', qty: 2, unitPrice: 2775, lineTotal: 5550 });
    expect(res.body.lines[1]).toMatchObject({ colourwayKey: 'black', unitPrice: 3400, lineTotal: 3400 });
    expect(res.body.subtotal).toBe(8950);
    expect(res.body.deliveryFee).toBe(0);
    expect(res.body.total).toBe(8950);
    expect(res.body.problems.map((p) => [p.index, p.code])).toEqual([
      [2, 'SIZE_UNAVAILABLE'],
      [3, 'NOT_FOUND'],
      [4, 'NOT_FOUND'],
      [5, 'NOT_FOUND'],
    ]);
  });

  it('reports out-of-stock and archived products as problems', async () => {
    const line = await g10Line(app, { colourwayKey: 'olive' });
    await Product.updateOne({ slug: 'g10-401' }, { $set: { 'colourways.1.inStock': false } });
    const res = await request(app).post('/api/cart/quote').send({ items: [line] });
    expect(res.status).toBe(200);
    expect(res.body.lines).toEqual([]);
    expect(res.body.problems[0].code).toBe('OUT_OF_STOCK');
    await Product.updateOne({ slug: 'g10-401' }, { $set: { 'colourways.1.inStock': true } });
  });

  it('rejects malformed quote bodies', async () => {
    expect((await request(app).post('/api/cart/quote').send({ items: [] })).status).toBe(400);
    const line = await g10Line(app);
    const priced = await request(app).post('/api/cart/quote').send({ items: [{ ...line, unitPrice: 1 }] });
    expect(priced.status).toBe(400);
    const dup = await request(app).post('/api/cart/quote').send({ items: [line, line] });
    expect(dup.status).toBe(400);
    const badQty = await request(app).post('/api/cart/quote').send({ items: [{ ...line, qty: 6 }] });
    expect(badQty.status).toBe(400);
  });
});

describe('7. orders', () => {
  it('requires auth', async () => {
    const line = await g10Line(app);
    const res = await request(app).post('/api/orders').send({ items: [line], shipping: SHIPPING, paymentMethod: 'cod' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects tampered prices (strict schema) and non-cod payment', async () => {
    const { agent } = await registeredAgent(app);
    const line = await g10Line(app);
    const tampered = await agent.post('/api/orders').send({ items: [{ ...line, unitPrice: 1 }], shipping: SHIPPING, paymentMethod: 'cod' });
    expect(tampered.status).toBe(400);
    expect(tampered.body.error.details[0].path).toBe('items.0.unitPrice');
    const total = await agent.post('/api/orders').send({ items: [line], shipping: SHIPPING, paymentMethod: 'cod', total: 1 });
    expect(total.status).toBe(400);
    const card = await agent.post('/api/orders').send({ items: [line], shipping: SHIPPING, paymentMethod: 'card' });
    expect(card.status).toBe(400);
    const badPhone = await agent.post('/api/orders').send({ items: [line], shipping: { ...SHIPPING, phone: '12345' }, paymentMethod: 'cod' });
    expect(badPhone.status).toBe(400);
    expect(badPhone.body.error.details).toEqual([
      { path: 'shipping.phone', message: 'Enter a Nepali mobile number, e.g. 98XXXXXXXX.' },
    ]);
  });

  it('places an order with server prices, a GS- number and a placed history entry', async () => {
    const { agent, user } = await registeredAgent(app);
    const line = await g10Line(app, { colourwayKey: 'olive', size: '9', qty: 3 });
    const res = await agent
      .post('/api/orders')
      .send({ items: [line], shipping: { ...SHIPPING, phone: '+977 9812345678', landmark: 'Near the bakery' }, paymentMethod: 'cod' });
    expect(res.status).toBe(201);
    const o = res.body.order;
    expect(o.orderNumber).toMatch(/^GS-\d{6}-[A-HJ-NP-Z2-9]{4}$/);
    expect(o).toMatchObject({ status: 'placed', paymentMethod: 'cod', paymentStatus: 'unpaid', subtotal: 8325, deliveryFee: 0, total: 8325, currency: 'NPR' });
    expect(o.items[0]).toMatchObject({ slug: 'g10-401', colourwayKey: 'olive', size: '9', qty: 3, unitPrice: 2775, lineTotal: 8325 });
    expect(o.shipping).toMatchObject({ phone: '9812345678', city: 'Kathmandu', landmark: 'Near the bakery' });
    expect(o.statusHistory).toHaveLength(1);
    expect(o.statusHistory[0]).toMatchObject({ status: 'placed', note: null });
    expect(o.customer).toBeUndefined();
    expect(hasKey(o, '_id') || hasKey(o, '__v') || hasKey(o, 'user')).toBe(false);

    const mine = await agent.get('/api/orders/mine');
    expect(mine.status).toBe(200);
    expect(mine.body).toMatchObject({ page: 1, total: 1 });
    expect(mine.body.items[0]).toMatchObject({ id: o.id, orderNumber: o.orderNumber, total: 8325, itemCount: 3, status: 'placed' });
    expect(mine.body.items[0].firstImage).toMatch(/^https:/);
    const one = await agent.get(`/api/orders/${o.id}`);
    expect(one.status).toBe(200);
    expect(one.body.order.id).toBe(o.id);
    expect(user.id).toBeTruthy();
  });

  it('answers 409 CART_PROBLEM for lines it cannot fulfil', async () => {
    const { agent } = await registeredAgent(app);
    const line = await g10Line(app);
    const res = await agent
      .post('/api/orders')
      .send({ items: [line, { ...line, size: '13' }], shipping: SHIPPING, paymentMethod: 'cod' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CART_PROBLEM');
    expect(res.body.error.details).toHaveLength(1);
    expect(res.body.error.details[0].path).toBe('items.1');
  });
});

describe('8. ownership', () => {
  it('user B gets 404 for user A order (get and cancel); admin can read it', async () => {
    const a = await registeredAgent(app);
    const b = await registeredAgent(app);
    const line = await g10Line(app);
    const placed = await a.agent.post('/api/orders').send({ items: [line], shipping: SHIPPING, paymentMethod: 'cod' });
    const id = placed.body.order.id;
    const get = await b.agent.get(`/api/orders/${id}`);
    expect(get.status).toBe(404);
    expect(get.body.error.code).toBe('NOT_FOUND');
    expect((await b.agent.post(`/api/orders/${id}/cancel`).send({})).status).toBe(404);
    expect((await b.agent.get('/api/orders/mine')).body.total).toBe(0);
    expect((await a.agent.get(`/api/orders/${id}`)).status).toBe(200);
    const admin = await adminAgent(app);
    expect((await admin.get(`/api/orders/${id}`)).status).toBe(200);
  });
});

describe('9. cancel', () => {
  it('cancels from placed (no body needed) and refuses from shipped', async () => {
    const { agent } = await registeredAgent(app);
    const line = await g10Line(app);
    const mk = async () =>
      (await agent.post('/api/orders').send({ items: [line], shipping: SHIPPING, paymentMethod: 'cod' })).body.order;

    const first = await mk();
    const cancelled = await agent.post(`/api/orders/${first.id}/cancel`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.order.status).toBe('cancelled');
    expect(cancelled.body.order.statusHistory.map((h) => h.status)).toEqual(['placed', 'cancelled']);
    const again = await agent.post(`/api/orders/${first.id}/cancel`).send({});
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('INVALID_TRANSITION');

    const second = await mk();
    const admin = await adminAgent(app);
    await admin.patch(`/api/admin/orders/${second.id}/status`).send({ status: 'confirmed' });
    await admin.patch(`/api/admin/orders/${second.id}/status`).send({ status: 'shipped' });
    const late = await agent.post(`/api/orders/${second.id}/cancel`).send({ note: 'too late' });
    expect(late.status).toBe(409);
    expect(late.body.error.code).toBe('INVALID_TRANSITION');
  });
});

describe('10. admin', () => {
  it('guest 401, user 403, admin 200 on every admin route', async () => {
    const { agent: user } = await registeredAgent(app);
    const admin = await adminAgent(app);
    const id = '0123456789abcdef01234567';
    const routes = [
      ['get', '/api/admin/products'],
      ['get', `/api/admin/products/${id}`],
      ['post', '/api/admin/products'],
      ['patch', `/api/admin/products/${id}`],
      ['get', '/api/admin/orders'],
      ['get', `/api/admin/orders/${id}`],
      ['patch', `/api/admin/orders/${id}/status`],
    ];
    for (const [method, url] of routes) {
      expect((await request(app)[method](url).send({})).status, `guest ${method} ${url}`).toBe(401);
      const asUser = await user[method](url).send({});
      expect(asUser.status, `user ${method} ${url}`).toBe(403);
      expect(asUser.body.error.code).toBe('FORBIDDEN');
    }
    expect((await admin.get('/api/admin/products')).status).toBe(200);
    expect((await admin.get('/api/admin/orders')).status).toBe(200);
  });

  it('a forged role in the token does not grant admin (role comes from the database)', async () => {
    const { user } = await registeredAgent(app);
    const forged = jwt.sign({ sub: user.id, role: 'admin' }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
    const res = await request(app).get('/api/admin/products').set('Cookie', `gs_token=${forged}`);
    expect(res.status).toBe(403);
    // a token for a deleted user is rejected
    await User.deleteOne({ _id: user.id });
    const gone = await request(app).get('/api/auth/me').set('Cookie', `gs_token=${forged}`);
    expect(gone.status).toBe(401);
    // wrong algorithm / secret
    const bad = jwt.sign({ sub: user.id, role: 'admin' }, 'another-secret-another-secret-another');
    expect((await request(app).get('/api/auth/me').set('Cookie', `gs_token=${bad}`)).status).toBe(401);
  });

  it('lists, reads, creates and patches products; slug is immutable', async () => {
    const admin = await adminAgent(app);
    const list = await admin.get('/api/admin/products?limit=100');
    expect(list.body.total).toBe(5);
    const g10 = list.body.items.find((p) => p.slug === 'g10-401');
    expect((await admin.get(`/api/admin/products/${g10.id}`)).body.product.slug).toBe('g10-401');

    // archived products appear in the admin list but not publicly
    const archive = await admin.patch(`/api/admin/products/${g10.id}`).send({ active: false });
    expect(archive.status).toBe(200);
    expect((await request(app).get('/api/products/g10-401')).status).toBe(404);
    expect((await admin.get('/api/admin/products?active=false')).body.items.map((p) => p.slug)).toEqual(['g10-401']);
    await admin.patch(`/api/admin/products/${g10.id}`).send({ active: true });

    // price + callout edit
    const colourways = g10.colourways.map((c) => (c.key === 'olive' ? { ...c, price: 2999, regularPrice: 2999 } : c));
    const specCallouts = g10.specCallouts.map((c) => (c.key === 'canvas-mesh' ? { ...c, title: 'Canvas mesh body' } : c));
    const patched = await admin.patch(`/api/admin/products/${g10.id}`).send({ colourways, specCallouts });
    expect(patched.status).toBe(200);
    expect(patched.body.product.priceFrom).toBe(2999);
    expect(patched.body.product.specCallouts[0].title).toBe('Canvas mesh body');
    const publicView = await request(app).get('/api/products/g10-401');
    expect(publicView.body.product.colourways[1].price).toBe(2999);

    const withSlug = await admin.patch(`/api/admin/products/${g10.id}`).send({ slug: 'renamed' });
    expect(withSlug.status).toBe(400);
    expect(withSlug.body.error.details[0].path).toBe('slug');
    const badPrice = await admin.patch(`/api/admin/products/${g10.id}`).send({ colourways: [{ ...colourways[0], regularPrice: 1 }] });
    expect(badPrice.status).toBe(400);
    expect((await admin.patch(`/api/admin/products/${g10.id}`).send({})).status).toBe(400);

    const created = await admin.post('/api/admin/products').send({
      slug: 'test-shoe',
      name: 'Test shoe',
      colourways: [
        {
          key: 'black',
          name: 'Black',
          hex: '#1E1E1E',
          price: 1500,
          sizes: ['9', '7', '8'],
          productUrl: 'https://goldstarshoes.com/product/test/',
        },
      ],
    });
    expect(created.status).toBe(201);
    expect(created.body.product.colourways[0]).toMatchObject({ regularPrice: 1500, sizes: ['7', '8', '9'], inStock: true });
    const dupe = await admin.post('/api/admin/products').send({
      slug: 'test-shoe',
      name: 'Again',
      colourways: [{ key: 'black', name: 'Black', hex: '#1E1E1E', price: 1, sizes: ['8'], productUrl: 'https://goldstarshoes.com/x/' }],
    });
    expect(dupe.status).toBe(409);
    expect(dupe.body.error.code).toBe('SLUG_TAKEN');
    const offsite = await admin.post('/api/admin/products').send({
      slug: 'evil',
      name: 'Evil',
      colourways: [{ key: 'black', name: 'Black', hex: '#1E1E1E', price: 1, sizes: ['8'], productUrl: 'https://evil.test/x/' }],
    });
    expect(offsite.status).toBe(400);
  });

  it('moves orders through the status flow; delivered marks paid; history grows', async () => {
    const { agent } = await registeredAgent(app);
    const admin = await adminAgent(app);
    const line = await g10Line(app);
    const placed = (await agent.post('/api/orders').send({ items: [line], shipping: SHIPPING, paymentMethod: 'cod' })).body.order;

    const set = (status, extra = {}) => admin.patch(`/api/admin/orders/${placed.id}/status`).send({ status, ...extra });
    expect((await set('shipped')).status).toBe(409); // skipping confirmed
    expect((await set('placed')).status).toBe(409);
    const conf = await set('confirmed', { note: 'Called customer' });
    expect(conf.status).toBe(200);
    expect(conf.body.order.customer).toMatchObject({ email: expect.any(String), name: expect.any(String) });
    expect(conf.body.order.paymentStatus).toBe('unpaid');
    expect((await set('delivered')).status).toBe(409);
    expect((await set('shipped')).status).toBe(200);
    const delivered = await set('delivered');
    expect(delivered.status).toBe(200);
    expect(delivered.body.order.paymentStatus).toBe('paid');
    expect(delivered.body.order.statusHistory.map((h) => h.status)).toEqual(['placed', 'confirmed', 'shipped', 'delivered']);
    expect(delivered.body.order.statusHistory[1].note).toBe('Called customer');
    const terminal = await set('cancelled');
    expect(terminal.status).toBe(409);
    expect(terminal.body.error.code).toBe('INVALID_TRANSITION');

    const byStatus = await admin.get('/api/admin/orders?status=delivered');
    expect(byStatus.body.items.map((o) => o.id)).toContain(placed.id);
    expect(byStatus.body.items[0].customer.email).toBeTruthy();
    const byNumber = await admin.get(`/api/admin/orders?q=${placed.orderNumber}`);
    expect(byNumber.body.total).toBe(1);
    const byPhone = await admin.get('/api/admin/orders?q=9812345678');
    expect(byPhone.body.total).toBeGreaterThan(0);
    expect((await admin.get('/api/admin/orders?status=bogus')).status).toBe(400);
    expect((await admin.get('/api/admin/orders?limit=101')).status).toBe(400);
    expect((await admin.get(`/api/admin/orders/${placed.id}`)).body.order.customer.id).toBeTruthy();
    expect(ADMIN.email).toBeTruthy();
  });
});

describe('11. transport rules', () => {
  it('rejects non-JSON writes with 415', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'text/plain').send('email=a&password=b');
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    const form = await request(app).post('/api/auth/login').type('form').send({ email: 'a@b.co', password: 'x' });
    expect(form.status).toBe(415);
  });

  it('returns 400 BAD_JSON, 413 PAYLOAD_TOO_LARGE', async () => {
    const bad = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":');
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('BAD_JSON');
    const big = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'a@b.co', password: 'x'.repeat(120_000) }));
    expect(big.status).toBe(413);
    expect(big.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('returns 404 for invalid ObjectIds and unknown routes (JSON)', async () => {
    const { agent } = await registeredAgent(app);
    const admin = await adminAgent(app);
    for (const url of ['/api/orders/not-an-id', '/api/orders/123']) {
      const res = await agent.get(url);
      expect(res.status, url).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    }
    expect((await agent.post('/api/orders/zzz/cancel').send({})).status).toBe(404);
    expect((await admin.get('/api/admin/products/xyz')).status).toBe(404);
    expect((await admin.patch('/api/admin/orders/xyz/status').send({ status: 'confirmed' })).status).toBe(404);
    const unknown = await request(app).get('/api/nope');
    expect(unknown.status).toBe(404);
    expect(unknown.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Not found.' } });
  });

  it('CORS allows only the configured origin, with credentials', async () => {
    const ok = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(ok.headers['access-control-allow-credentials']).toBe('true');
    const evil = await request(app).get('/api/health').set('Origin', 'http://evil.test');
    expect(evil.headers['access-control-allow-origin']).not.toBe('*');
    expect(evil.headers['access-control-allow-origin']).not.toBe('http://evil.test');
  });
});
