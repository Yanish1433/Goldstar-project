import { describe, expect, it, beforeAll } from 'vitest';
import { SHOPPERS, seedMockShop } from './mockShop.js';
import { computeStats, customerRollup, dayKey, orderMatches, sortCustomers, sortOrders, statusCounts, stockRows } from '../src/lib/adminStats.js';

const NOW = new Date('2026-11-08T06:00:00.000Z'); // 11:45 in Kathmandu
const ago = (d, h = 0) => new Date(NOW.getTime() - d * 86_400_000 - h * 3_600_000).toISOString();
const item = (slug, qty, price) => ({ productId: `p-${slug}`, slug, name: slug.toUpperCase(), image: null, qty, lineTotal: qty * price });
const order = (over) => ({ status: 'delivered', total: 1000, items: [item('ax', 1, 1000)], createdAt: ago(1), userId: 'u1', orderNumber: 'GS-261107-ABCD', shipping: { fullName: 'Sita Gurung', phone: '9841111111', city: 'Pokhara' }, ...over });

const products = [
  { id: 'p1', slug: 'ax', name: 'AX', active: true, colourways: [{ key: 'black', name: 'Black', sizes: ['7', '8', '9'], inStock: true, stock: { 7: 0, 8: 2, 9: 20 } }] },
  { id: 'p2', slug: 'g10', name: 'G10', active: true, colourways: [{ key: 'olive', name: 'Olive', sizes: ['8'], inStock: false, stock: { 8: 9 } }] },
  { id: 'p3', slug: 'old', name: 'Old', active: false, colourways: [{ key: 'red', name: 'Red', sizes: ['8'], inStock: true, stock: { 8: 0 } }] },
  { id: 'p4', slug: 'untracked', name: 'Untracked', active: true, colourways: [{ key: 'grey', name: 'Grey', sizes: ['8'], inStock: true }] },
];

describe('computeStats', () => {
  const orders = [
    order({ total: 3000, items: [item('ax', 1, 3000)], createdAt: ago(0, 1) }),
    order({ total: 5000, items: [item('g10', 2, 2500)], createdAt: ago(3), status: 'shipped' }),
    order({ total: 9999, items: [item('ax', 3, 3333)], createdAt: ago(4), status: 'cancelled' }),
    order({ total: 2000, items: [item('ax', 1, 2000)], createdAt: ago(40) }), // previous period
    order({ total: 7000, createdAt: ago(75) }), // outside both periods
  ];
  const s = computeStats(orders, products, { now: NOW, days: 30 });

  it('KPIs exclude cancelled orders and compare to the previous period', () => {
    expect(s.kpis.revenue).toEqual({ value: 8000, prev: 2000 });
    expect(s.kpis.orders).toEqual({ value: 2, prev: 1 });
    expect(s.kpis.aov).toEqual({ value: 4000, prev: 2000 });
    expect(s.kpis.units).toEqual({ value: 3, prev: 1 });
  });

  it('builds one zero-filled bucket per Nepal day, oldest first, ending today', () => {
    expect(s.series).toHaveLength(30);
    expect(s.series.at(-1).date).toBe(dayKey(NOW));
    expect(s.series.at(-1)).toMatchObject({ revenue: 3000, orders: 1 });
    expect(s.series.reduce((a, d) => a + d.revenue, 0)).toBe(8000);
    expect(s.series[0].date < s.series[29].date).toBe(true);
  });

  it('counts every status in the period (cancelled included) and open orders', () => {
    expect(Object.fromEntries(s.statusBreakdown.map((r) => [r.status, r.count]))).toEqual({ placed: 0, confirmed: 0, shipped: 1, delivered: 1, cancelled: 1 });
    expect(s.openOrders).toBe(1);
  });

  it('ranks top products by revenue, ignoring cancelled lines', () => {
    expect(s.topProducts.map((p) => [p.slug, p.units, p.revenue])).toEqual([['g10', 2, 5000], ['ax', 1, 3000]]);
  });

  it('low stock covers active products only; an out-of-stock colourway counts as 0; untracked stock is ignored', () => {
    expect(s.kpis.products).toEqual({ active: 3, total: 4, lowStock: 3, outOfStock: 2 });
    expect(s.lowStock.map((r) => `${r.slug}/${r.size}=${r.qty}`)).toEqual(['ax/7=0', 'g10/8=0', 'ax/8=2']);
    expect(stockRows([products[3]])[0].qty).toBeNull();
  });

  it('handles an empty store', () => {
    const e = computeStats([], [], { now: NOW, days: 7 });
    expect(e.kpis.aov.value).toBe(0);
    expect(e.series).toHaveLength(7);
    expect(e.topProducts).toEqual([]);
  });
});

describe('customers and order filters', () => {
  const orders = [
    order({ userId: 'u1', total: 1000, createdAt: ago(1) }),
    order({ userId: 'u1', total: 500, status: 'cancelled', createdAt: ago(2) }),
    order({ userId: 'u2', total: 4000, createdAt: ago(9), shipping: { fullName: 'Bikash Tamang', phone: '9802222222', city: 'Kathmandu' }, orderNumber: 'GS-261030-WXYZ' }),
  ];
  const users = [{ id: 'u1', name: 'Sita Gurung', email: 'sita@example.com' }, { id: 'u2', name: 'Bikash Tamang', email: 'b@example.com' }, { id: 'u3', name: 'Nobody Yet', email: 'n@example.com' }];

  it('rolls up order count, spend (minus cancelled), last order and city', () => {
    const rows = customerRollup(users, orders);
    expect(rows.find((r) => r.id === 'u1')).toMatchObject({ orderCount: 2, totalSpent: 1000, city: 'Pokhara' });
    expect(rows.find((r) => r.id === 'u3')).toMatchObject({ orderCount: 0, totalSpent: 0, lastOrderAt: null });
    expect(sortCustomers(rows, 'spent').map((r) => r.id)).toEqual(['u2', 'u1', 'u3']);
    expect(sortCustomers(rows, 'name').map((r) => r.id)).toEqual(['u2', 'u3', 'u1']);
    expect(sortCustomers(rows, 'spent', 'asc').map((r) => r.id)).toEqual(['u3', 'u1', 'u2']);
  });

  it('matches number, name and phone digits; date range is inclusive Nepal days', () => {
    expect(orders.filter((o) => orderMatches(o, { q: 'wxyz' }))).toHaveLength(1);
    expect(orders.filter((o) => orderMatches(o, { q: 'bikash' }))).toHaveLength(1);
    expect(orders.filter((o) => orderMatches(o, { q: '98022' }))).toHaveLength(1);
    expect(orders.filter((o) => orderMatches(o, { from: dayKey(ago(2)), to: dayKey(ago(1)) }))).toHaveLength(2);
    expect(orders.filter((o) => orderMatches(o, { customer: 'u2' }))).toHaveLength(1);
    expect(sortOrders(orders, 'total_desc').map((o) => o.total)).toEqual([4000, 1000, 500]);
    expect(statusCounts(orders)).toMatchObject({ all: 3, delivered: 2, cancelled: 1, placed: 0 });
  });
});

describe('mock admin endpoints', () => {
  let mockRequest;
  beforeAll(async () => {
    ({ mockRequest } = await import('../src/api/mock/index.js'));
  });

  it('starts empty: no orders, no customers, only the bundled catalogue', async () => {
    await mockRequest('POST', '/auth/login', { email: 'admin@goldstar.test', password: 'x' });
    const all = await mockRequest('GET', '/admin/orders', undefined, { limit: 100 });
    expect(all.total).toBe(0);
    expect(all.counts.all).toBe(0);
    const s = await mockRequest('GET', '/admin/stats', undefined, { days: 30 });
    expect(s.kpis.revenue).toEqual({ value: 0, prev: 0 });
    expect(s.kpis.orders).toEqual({ value: 0, prev: 0 });
    expect(Number.isNaN(s.kpis.aov.value)).toBe(false);
    expect(s.recentOrders).toEqual([]);
    expect(s.series).toHaveLength(30);
    expect(s.series.every((d) => d.orders === 0 && d.revenue === 0)).toBe(true);
    expect((await mockRequest('GET', '/admin/products', undefined, { limit: 100 })).total).toBeGreaterThan(0);
  });

  it('/admin/stats counts the orders customers place', async () => {
    const { orders } = await seedMockShop(mockRequest);
    const s = await mockRequest('GET', '/admin/stats', undefined, { days: 30 });
    const kept = orders.filter((o) => o.to !== 'cancelled');
    expect(s.kpis.orders.value).toBe(kept.length);
    expect(s.kpis.revenue.value).toBe(kept.reduce((a, o) => a + o.total, 0));
    expect(s.recentOrders).toHaveLength(orders.length);
    expect(s.recentOrders[0].customer.name).toBeTruthy();
    expect(s.topProducts[0].slug).toBe('g10-401');
    expect((await mockRequest('GET', '/admin/stats', undefined, { days: 7 })).series).toHaveLength(7);
  });

  it('orders: status counts ignore the status tab, filters and sort apply', async () => {
    const placed = await mockRequest('GET', '/admin/orders', undefined, { status: 'placed', limit: 100 });
    const all = await mockRequest('GET', '/admin/orders', undefined, { limit: 100 });
    expect(all.total).toBe(4);
    expect(placed.counts).toEqual(all.counts);
    expect(all.counts).toMatchObject({ all: 4, placed: 1, shipped: 1, delivered: 1, cancelled: 1 });
    expect(placed.items.every((o) => o.status === 'placed')).toBe(true);
    const asc = await mockRequest('GET', '/admin/orders', undefined, { sort: 'total_asc', limit: 100 });
    expect(asc.items.map((o) => o.total)).toEqual([...asc.items.map((o) => o.total)].sort((a, b) => a - b));
    const byName = await mockRequest('GET', '/admin/orders', undefined, { q: 'Sita' });
    expect(byName.items).toHaveLength(2);
    expect(byName.items.every((o) => o.customer.name === 'Sita Gurung')).toBe(true);
  });

  it('customers list and detail', async () => {
    const list = await mockRequest('GET', '/admin/customers', undefined, { limit: 100 });
    expect(list.total).toBe(SHOPPERS.length + 1); // + the mock's own sign-in shopper, who has no orders
    expect(list.items.every((c) => c.email !== 'admin@goldstar.test')).toBe(true);
    expect(list.items[0].totalSpent).toBeGreaterThanOrEqual(list.items[1].totalSpent);
    const top = list.items[0];
    const d = await mockRequest('GET', `/admin/customers/${top.id}`);
    expect(d.customer.orderCount).toBe(d.orders.length);
    expect(d.customer.address.city).toBeTruthy();
    await expect(mockRequest('GET', '/admin/customers/nope')).rejects.toMatchObject({ status: 404 });
  });

  it('non-admins are refused', async () => {
    await mockRequest('POST', '/auth/login', { email: 'shopper@goldstar.test', password: 'x' });
    await expect(mockRequest('GET', '/admin/stats')).rejects.toMatchObject({ status: 403 });
    await mockRequest('POST', '/auth/login', { email: 'admin@goldstar.test', password: 'x' });
  });
});
