import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Order } from '../src/models/Order.js';
import { adminAgent, g10Line, makeApp, registeredAgent, seedOffline, SHIPPING, startDb, stopDb } from './helpers.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let app;
let admin;
let shopperA;
let shopperB;
const ids = {};

beforeAll(async () => {
  await startDb();
  await seedOffline();
  app = makeApp();
  admin = await adminAgent(app);
  shopperA = await registeredAgent(app, { name: 'Sita Gurung' });
  shopperB = await registeredAgent(app, { name: 'Bikash Tamang' });
  const line = await g10Line(app, { qty: 1 });
  const place = (who, shipping = SHIPPING) => who.agent.post('/api/orders').send({ items: [line], shipping, paymentMethod: 'cod' });
  ids.a1 = (await place(shopperA)).body.order;
  ids.a2 = (await place(shopperA)).body.order;
  ids.b1 = (await place(shopperB, { ...SHIPPING, fullName: 'Bikash Tamang', phone: '9801111222', city: 'Pokhara' })).body.order;
  await admin.patch(`/api/admin/orders/${ids.a2.id}/status`).send({ status: 'cancelled' });
  // One old order in the previous 30-day period.
  await Order.collection.updateOne({ _id: new mongoose.Types.ObjectId(ids.b1.id) }, { $set: { createdAt: new Date(Date.now() - 40 * 86_400_000) } });
});

afterAll(stopDb);

describe('admin stats + customers', () => {
  it('the stats module is identical on client and server', () => {
    const client = fs.readFileSync(path.join(HERE, '../../client/src/lib/adminStats.js'), 'utf8').replace(/\r\n/g, '\n');
    const server = fs.readFileSync(path.join(HERE, '../src/lib/adminStats.js'), 'utf8').replace(/\r\n/g, '\n');
    expect(server.split('\n').slice(1).join('\n')).toBe(client);
  });

  it('guests 401, shoppers 403', async () => {
    for (const url of ['/api/admin/stats', '/api/admin/customers', `/api/admin/customers/${shopperA.user.id}`]) {
      expect((await request(app).get(url)).status).toBe(401);
      expect((await shopperA.agent.get(url)).status).toBe(403);
    }
  });

  it('GET /admin/stats aggregates the last 30 days vs the 30 before', async () => {
    const res = await admin.get('/api/admin/stats?days=30');
    expect(res.status).toBe(200);
    const s = res.body;
    const price = ids.a1.total;
    expect(s.kpis.revenue).toEqual({ value: price, prev: ids.b1.total });
    expect(s.kpis.orders).toEqual({ value: 1, prev: 1 });
    expect(s.series).toHaveLength(30);
    expect(s.series.reduce((n, d) => n + d.orders, 0)).toBe(1);
    expect(s.statusBreakdown.find((r) => r.status === 'cancelled').count).toBe(1);
    expect(s.topProducts[0]).toMatchObject({ slug: 'g10-401', units: 1 });
    expect(s.recentOrders[0].customer.name).toBeTruthy();
    expect(s.kpis.products.active).toBeGreaterThan(0);
    expect((await admin.get('/api/admin/stats?days=12')).status).toBe(400);
  });

  it('GET /admin/customers lists shoppers with order count and spend', async () => {
    const res = await admin.get('/api/admin/customers?limit=100');
    expect(res.status).toBe(200);
    const a = res.body.items.find((c) => c.id === shopperA.user.id);
    expect(a).toMatchObject({ name: 'Sita Gurung', orderCount: 2, totalSpent: ids.a1.total, city: 'Kathmandu' });
    expect(res.body.items.some((c) => c.email === 'admin@goldstar.test')).toBe(false);
    const q = await admin.get('/api/admin/customers?q=bikash');
    expect(q.body.items.map((c) => c.id)).toEqual([shopperB.user.id]);
    const detail = await admin.get(`/api/admin/customers/${shopperA.user.id}`);
    expect(detail.body.customer.orderCount).toBe(2);
    expect(detail.body.orders).toHaveLength(2);
    expect(detail.body.customer.address.city).toBe('Kathmandu');
    expect((await admin.get('/api/admin/customers/0123456789abcdef01234567')).status).toBe(404);
  });

  it('GET /admin/orders adds status counts, name search, date range and sort', async () => {
    const res = await admin.get('/api/admin/orders?status=placed');
    expect(res.body.counts).toMatchObject({ all: 3, placed: 2, cancelled: 1 });
    expect(res.body.items.every((o) => o.status === 'placed')).toBe(true);
    const byName = await admin.get('/api/admin/orders?q=Bikash');
    expect(byName.body.items.map((o) => o.id)).toEqual([ids.b1.id]);
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' }).format(new Date());
    const recent = await admin.get(`/api/admin/orders?from=${today}&to=${today}`);
    expect(recent.body.total).toBe(2);
    const oldest = await admin.get('/api/admin/orders?sort=oldest');
    expect(oldest.body.items[0].id).toBe(ids.b1.id);
    const mine = await admin.get(`/api/admin/orders?customer=${shopperA.user.id}`);
    expect(mine.body.total).toBe(2);
    expect((await admin.get('/api/admin/orders?from=08-11-2026')).status).toBe(400);
  });

  it('products keep optional stock per size (only for sizes they have)', async () => {
    const list = await admin.get('/api/admin/products?limit=100');
    const g10 = list.body.items.find((p) => p.slug === 'g10-401');
    const colourways = g10.colourways.map((c, i) => ({ ...c, stock: i === 0 ? { ...Object.fromEntries(c.sizes.map((s) => [s, 5])), 99: 4 } : undefined }));
    const res = await admin.patch(`/api/admin/products/${g10.id}`).send({ colourways: colourways.map(({ stock, ...c }) => (stock ? { ...c, stock } : c)) });
    expect(res.status).toBe(200);
    const stock = res.body.product.colourways[0].stock;
    expect(Object.keys(stock).sort()).toEqual([...g10.colourways[0].sizes].sort());
    expect(stock[g10.colourways[0].sizes[0]]).toBe(5);
    const bad = await admin.patch(`/api/admin/products/${g10.id}`).send({ colourways: [{ ...colourways[0], stock: { 8: -1 } }] });
    expect(bad.status).toBe(400);
    const stats = await admin.get('/api/admin/stats');
    expect(stats.body.kpis.products.lowStock).toBe(0);
  });
});
