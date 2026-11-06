// In-memory implementation of the REST contract (SPEC 3.3) for VITE_USE_MOCK=true and the dev fallback.
import seed from './products.json';
import { ApiError } from '../client.js';
import { canTransition } from '../../lib/orders.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
const now = () => new Date().toISOString();
const fail = (status, code, message, details) => {
  throw new ApiError(status, code, message, details);
};
const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

let seq = 1;
const products = clone(seed).map((p) => ({ ...p, id: `mock-p${seq++}`, updatedAt: now() }));
const users = [
  { id: 'mock-u1', name: 'Demo Shopper', email: 'demo@goldstar.test', phone: '9841234567', role: 'user', createdAt: now() },
  { id: 'mock-u2', name: 'Demo Admin', email: 'admin@goldstar.test', phone: null, role: 'admin', createdAt: now() },
];
const orders = [];
let session = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('gs-mock-user')) || null;
// Mock-only convenience for the design inspector: ?as=admin signs in the mock admin.
if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('as') === 'admin') session = 'mock-u2';

const setSession = (id) => {
  session = id;
  if (typeof sessionStorage !== 'undefined') id ? sessionStorage.setItem('gs-mock-user', id) : sessionStorage.removeItem('gs-mock-user');
};
const me = () => users.find((u) => u.id === session) || null;
const requireUser = () => me() || fail(401, 'UNAUTHENTICATED', 'Please log in.');
const requireAdmin = () => {
  const u = requireUser();
  if (u.role !== 'admin') fail(403, 'FORBIDDEN', 'You do not have access to this.');
  return u;
};

const priceFrom = (p) => Math.min(...p.colourways.map((c) => c.price));
const priceTo = (p) => Math.max(...p.colourways.map((c) => c.price));
const full = (p) => ({ ...clone(p), priceFrom: priceFrom(p), priceTo: priceTo(p) });
const summary = (p) => ({
  id: p.id, slug: p.slug, name: p.name, series: p.series, categories: p.categories, featured: p.featured,
  priceFrom: priceFrom(p), priceTo: priceTo(p),
  colourways: p.colourways.map((c) => ({ key: c.key, name: c.name, hex: c.hex, price: c.price, regularPrice: c.regularPrice, inStock: c.inStock, image: c.images[0] || null, secondImage: c.images[1] || null })),
});

const catName = (slug) => {
  const s = slug.replace(/-/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const paginate = (arr, query, max = 48, def = 12) => {
  const page = Math.max(1, Number(query?.page) || 1);
  const limit = Math.min(max, Math.max(1, Number(query?.limit) || def));
  return { items: arr.slice((page - 1) * limit, page * limit), page, limit, total: arr.length };
};

function quote(items) {
  const lines = [];
  const problems = [];
  (items || []).forEach((it, index) => {
    const p = products.find((x) => x.id === it.productId && x.active);
    const c = p?.colourways.find((x) => x.key === it.colourwayKey);
    if (!p || !c) return problems.push({ index, code: 'NOT_FOUND', message: 'This item is no longer available.' });
    if (!c.sizes.includes(String(it.size))) return problems.push({ index, code: 'SIZE_UNAVAILABLE', message: `UK ${it.size} is not available.` });
    if (!c.inStock) return problems.push({ index, code: 'OUT_OF_STOCK', message: 'This colour is out of stock.' });
    lines.push({
      productId: p.id, slug: p.slug, name: p.name, colourwayKey: c.key, colourwayName: c.name, size: String(it.size),
      qty: it.qty, unitPrice: c.price, lineTotal: c.price * it.qty, image: c.images[0]?.thumb || null,
    });
  });
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  return { lines, subtotal, deliveryFee: 0, total: subtotal, problems };
}

const orderSummary = (o) => ({ id: o.id, orderNumber: o.orderNumber, status: o.status, total: o.total, itemCount: o.items.reduce((s, i) => s + i.qty, 0), createdAt: o.createdAt, firstImage: o.items[0]?.image || null });
const orderOut = (o, admin) => {
  const out = clone(o);
  delete out.userId;
  if (admin) {
    const u = users.find((x) => x.id === o.userId);
    out.customer = u ? { id: u.id, name: u.name, email: u.email } : undefined;
  }
  return out;
};

const code4 = () => Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
const orderNumber = () => {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  return `GS-${yy}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${code4()}`;
};

function makeOrder(userId, items, shipping, status = 'placed', createdAt = now()) {
  const q = quote(items);
  const o = {
    id: `mock-o${seq++}`, userId, orderNumber: orderNumber(), status, paymentMethod: 'cod', paymentStatus: status === 'delivered' ? 'paid' : 'unpaid',
    items: q.lines, subtotal: q.subtotal, deliveryFee: 0, total: q.total, currency: 'NPR', shipping,
    statusHistory: [{ status: 'placed', at: createdAt, note: '' }], createdAt, updatedAt: createdAt,
  };
  if (status !== 'placed') o.statusHistory.push({ status, at: createdAt, note: '' });
  orders.unshift(o);
  return o;
}

const g10 = products.find((p) => p.slug === 'g10-401');
const demoShip = { fullName: 'Demo Shopper', phone: '9841234567', addressLine: 'House 12, Tole Marg', area: 'Maharajgunj', city: 'Kathmandu', landmark: '', notes: '' };
makeOrder('mock-u1', [{ productId: g10.id, colourwayKey: 'olive', size: '8', qty: 1 }], demoShip, 'delivered', '2026-10-21T09:00:00.000Z');
makeOrder('mock-u1', [{ productId: g10.id, colourwayKey: 'black', size: '9', qty: 2 }], demoShip, 'placed', now());

const PHONE = /^(\+977)?9[678]\d{8}$/;

function validateShipping(s) {
  const details = [];
  const need = (k, min, max, msg) => {
    const v = (s?.[k] || '').trim();
    if (v.length < min || v.length > max) details.push({ path: `shipping.${k}`, message: msg });
  };
  need('fullName', 2, 80, 'Enter your full name.');
  const phone = (s?.phone || '').replace(/[\s-]/g, '');
  if (!PHONE.test(phone)) details.push({ path: 'shipping.phone', message: 'Enter a Nepali mobile number, e.g. 98XXXXXXXX.' });
  need('addressLine', 3, 160, 'Enter the street, tole or house.');
  need('area', 2, 80, 'Enter your area, e.g. Maharajgunj.');
  need('city', 2, 80, 'Enter your city, e.g. Kathmandu.');
  return details;
}

export async function mockRequest(method, path, body, query = {}) {
  await delay();
  const seg = path.split('/').filter(Boolean);
  const [a, b, c, d] = seg;
  const key = `${method} /${a}`;

  if (path === '/health') return { ok: true, db: 'up' };

  // auth
  if (a === 'auth') {
    if (b === 'register' && method === 'POST') {
      const details = [];
      if (!body?.name || body.name.trim().length < 2) details.push({ path: 'name', message: 'Enter your name.' });
      if (!/^\S+@\S+\.\S+$/.test(body?.email || '')) details.push({ path: 'email', message: 'Enter a valid email address.' });
      if (!/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(body?.password || '')) details.push({ path: 'password', message: '8 or more characters, with a letter and a number.' });
      if (details.length) fail(400, 'VALIDATION_ERROR', 'Check the highlighted fields.', details);
      const email = body.email.trim().toLowerCase();
      if (users.some((u) => u.email === email)) fail(409, 'EMAIL_TAKEN', 'An account with this email already exists.', [{ path: 'email', message: 'An account with this email already exists.' }]);
      const u = { id: `mock-u${seq++}`, name: body.name.trim(), email, phone: body.phone || null, role: 'user', createdAt: now() };
      users.push(u);
      setSession(u.id);
      return { user: clone(u) };
    }
    if (b === 'login' && method === 'POST') {
      const u = users.find((x) => x.email === (body?.email || '').trim().toLowerCase());
      if (!u || !body?.password) fail(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
      setSession(u.id);
      return { user: clone(u) };
    }
    if (b === 'logout') {
      setSession(null);
      return null;
    }
    if (b === 'me') return { user: clone(requireUser()) };
  }

  if (key === 'GET /products' && !b) {
    let list = products.filter((p) => p.active);
    if (query.category) list = list.filter((p) => p.categories.includes(query.category));
    if (query.q) list = list.filter((p) => `${p.name} ${p.series} ${p.description}`.toLowerCase().includes(String(query.q).toLowerCase()));
    const sort = query.sort || 'featured';
    list = [...list].sort((x, y) => {
      if (sort === 'price_asc') return priceFrom(x) - priceFrom(y);
      if (sort === 'price_desc') return priceFrom(y) - priceFrom(x);
      if (sort === 'newest') return y.updatedAt.localeCompare(x.updatedAt);
      return Number(y.featured) - Number(x.featured) || x.sortOrder - y.sortOrder;
    });
    const pg = paginate(list, query);
    return { ...pg, items: pg.items.map(summary) };
  }
  if (key === 'GET /products' && b) {
    const p = products.find((x) => x.slug === b && x.active);
    if (!p) fail(404, 'NOT_FOUND', 'Product not found.');
    return { product: full(p) };
  }
  if (path === '/categories') {
    const counts = {};
    products.filter((p) => p.active).forEach((p) => p.categories.forEach((s) => { counts[s] = (counts[s] || 0) + 1; }));
    return { items: Object.entries(counts).map(([slug, count]) => ({ slug, name: catName(slug), count })) };
  }
  if (path === '/cart/quote' && method === 'POST') return quote(body?.items);

  if (a === 'orders') {
    const u = requireUser();
    if (b === 'mine') {
      const mine = orders.filter((o) => o.userId === u.id);
      const pg = paginate(mine, query, 50, 20);
      return { ...pg, items: pg.items.map(orderSummary) };
    }
    if (!b && method === 'POST') {
      if (body?.paymentMethod !== 'cod') fail(400, 'VALIDATION_ERROR', 'Check the highlighted fields.', [{ path: 'paymentMethod', message: 'Only cash on delivery is available.' }]);
      const details = validateShipping(body.shipping);
      if (details.length) fail(400, 'VALIDATION_ERROR', 'Check the highlighted fields.', details);
      const q = quote(body.items);
      if (q.problems.length) fail(409, 'CART_PROBLEM', 'Some items in your cart need attention.', q.problems.map((p) => ({ path: `items.${p.index}`, message: p.message })));
      const sh = { ...body.shipping, phone: body.shipping.phone.replace(/[\s-]/g, '') };
      return { order: orderOut(makeOrder(u.id, body.items, sh), false) };
    }
    const o = orders.find((x) => x.id === b && (x.userId === u.id || u.role === 'admin'));
    if (!o) fail(404, 'NOT_FOUND', 'Order not found.');
    if (!c && method === 'GET') return { order: orderOut(o) };
    if (c === 'cancel' && method === 'POST') {
      if (!canTransition(o.status, 'cancelled') || o.status !== 'placed') fail(409, 'INVALID_TRANSITION', 'Only placed orders can be cancelled.');
      o.status = 'cancelled';
      o.statusHistory.push({ status: 'cancelled', at: now(), note: body?.note || '' });
      return { order: orderOut(o) };
    }
  }

  if (a === 'admin') {
    requireAdmin();
    if (b === 'products') {
      if (!c && method === 'GET') {
        let list = [...products];
        if (query.q) list = list.filter((p) => `${p.name} ${p.series}`.toLowerCase().includes(String(query.q).toLowerCase()));
        if (query.active === 'true') list = list.filter((p) => p.active);
        if (query.active === 'false') list = list.filter((p) => !p.active);
        const pg = paginate(list, query, 100, 20);
        return { ...pg, items: pg.items.map(full) };
      }
      if (!c && method === 'POST') {
        if (products.some((p) => p.slug === body.slug)) fail(409, 'SLUG_TAKEN', 'A product with this slug already exists.', [{ path: 'slug', message: 'This slug is taken.' }]);
        const p = { ...clone(body), id: `mock-p${seq++}`, updatedAt: now() };
        products.push(p);
        return { product: full(p) };
      }
      const p = products.find((x) => x.id === c);
      if (!p) fail(404, 'NOT_FOUND', 'Product not found.');
      if (method === 'GET') return { product: full(p) };
      if (method === 'PATCH') {
        if ('slug' in body) fail(400, 'VALIDATION_ERROR', 'Check the highlighted fields.', [{ path: 'slug', message: 'Slug cannot be changed.' }]);
        Object.assign(p, clone(body), { updatedAt: now() });
        return { product: full(p) };
      }
    }
    if (b === 'orders') {
      if (!c) {
        let list = [...orders];
        if (query.status && query.status !== 'all') list = list.filter((o) => o.status === query.status);
        if (query.q) list = list.filter((o) => o.orderNumber.includes(String(query.q).toUpperCase()) || o.shipping.phone.includes(String(query.q)));
        const pg = paginate(list, query, 100, 20);
        return { ...pg, items: pg.items.map((o) => orderOut(o, true)) };
      }
      const o = orders.find((x) => x.id === c);
      if (!o) fail(404, 'NOT_FOUND', 'Order not found.');
      if (!d && method === 'GET') return { order: orderOut(o, true) };
      if (d === 'status' && method === 'PATCH') {
        if (!canTransition(o.status, body.status)) fail(409, 'INVALID_TRANSITION', `Cannot move an order from ${o.status} to ${body.status}.`);
        o.status = body.status;
        if (body.status === 'delivered') o.paymentStatus = 'paid';
        o.statusHistory.push({ status: body.status, at: now(), note: body.note || '' });
        o.updatedAt = now();
        return { order: orderOut(o, true) };
      }
    }
  }
  fail(404, 'NOT_FOUND', 'Not found.');
}
