// Mirror of client/src/lib/adminStats.js (keep the two identical; a server test checks they match).
// Dashboard and customer aggregations (pure). The mock API runs these in the browser; server/src/lib/adminStats.js is
// the same module for the live API, so both return one shape. Days are calendar days in Nepal (Asia/Kathmandu).
// Revenue is gross order value placed in the period, excluding cancelled orders (cash on delivery: nothing is charged
// for a cancelled order).

export const STORE_TZ = 'Asia/Kathmandu';
export const LOW_STOCK = 3; // a size with this many pairs or fewer is "low"
const STATUSES = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const DAY = 86_400_000;

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: STORE_TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
/** 'YYYY-MM-DD' for the Nepal calendar day containing the instant. */
export const dayKey = (d) => dayFmt.format(new Date(d));

const counts = (o) => o.status !== 'cancelled';
const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);

/** Every size of every colourway, with its stock (null when the product does not track stock). */
export function stockRows(products) {
  const rows = [];
  products.forEach((p) => {
    p.colourways.forEach((c) => {
      const stock = c.stock || null;
      c.sizes.forEach((size) => {
        const qty = stock ? Number(stock[size] ?? 0) : null;
        rows.push({ productId: p.id, slug: p.slug, name: p.name, active: p.active, colourwayKey: c.key, colourwayName: c.name, size, qty: c.inStock === false ? 0 : qty });
      });
    });
  });
  return rows;
}

export const isLow = (r) => r.qty != null && r.qty <= LOW_STOCK;

/**
 * @param orders  [{ status, total, createdAt, items: [{ productId, slug, name, image, qty, lineTotal }], ... }]
 * @param products full products (with colourways[].sizes/stock/inStock)
 * @param opts    { now?: Date, days?: number, recent?: [] }  `recent` = latest orders already shaped for output
 */
export function computeStats(orders, products, { now = new Date(), days = 30, recent = [] } = {}) {
  const end = new Date(now).getTime();
  const start = end - days * DAY;
  const prevStart = start - days * DAY;
  const t = (o) => new Date(o.createdAt).getTime();
  const cur = orders.filter((o) => t(o) > start && t(o) <= end);
  const prev = orders.filter((o) => t(o) > prevStart && t(o) <= start);

  const kpi = (list) => {
    const live = list.filter(counts);
    const revenue = sum(live, (o) => o.total);
    return { revenue, orders: live.length, aov: live.length ? Math.round(revenue / live.length) : 0, units: sum(live, (o) => sum(o.items, (i) => i.qty)) };
  };
  const a = kpi(cur);
  const b = kpi(prev);

  // One bucket per Nepal day, oldest first, zero-filled.
  const series = [];
  const index = new Map();
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = dayKey(end - i * DAY);
    if (index.has(date)) continue;
    index.set(date, series.length);
    series.push({ date, revenue: 0, orders: 0 });
  }
  cur.filter(counts).forEach((o) => {
    const i = index.get(dayKey(o.createdAt));
    if (i == null) return;
    series[i].revenue += o.total;
    series[i].orders += 1;
  });

  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  cur.forEach((o) => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });
  const statusBreakdown = STATUSES.map((status) => ({ status, count: byStatus[status] }));

  const top = new Map();
  cur.filter(counts).forEach((o) => o.items.forEach((i) => {
    const k = i.slug;
    const row = top.get(k) || { productId: i.productId ?? null, slug: i.slug, name: i.name, image: i.image || null, units: 0, revenue: 0 };
    row.units += i.qty;
    row.revenue += i.lineTotal;
    top.set(k, row);
  }));
  const topProducts = [...top.values()].sort((x, y) => y.revenue - x.revenue || y.units - x.units).slice(0, 5);

  const rows = stockRows(products.filter((p) => p.active));
  const low = rows.filter(isLow).sort((x, y) => x.qty - y.qty || x.name.localeCompare(y.name));

  return {
    range: { days, from: new Date(start).toISOString(), to: new Date(end).toISOString() },
    kpis: {
      revenue: { value: a.revenue, prev: b.revenue },
      orders: { value: a.orders, prev: b.orders },
      aov: { value: a.aov, prev: b.aov },
      units: { value: a.units, prev: b.units },
      products: { active: products.filter((p) => p.active).length, total: products.length, lowStock: low.length, outOfStock: low.filter((r) => r.qty === 0).length },
    },
    series,
    statusBreakdown,
    openOrders: byStatus.placed + byStatus.confirmed + byStatus.shipped,
    topProducts,
    lowStock: low.slice(0, 6),
    recentOrders: recent,
  };
}

/** Per-customer totals. `orders` carry `userId`; spent excludes cancelled orders. */
export function customerRollup(users, orders) {
  const by = new Map();
  orders.forEach((o) => {
    const k = String(o.userId);
    const r = by.get(k) || { orderCount: 0, totalSpent: 0, lastOrderAt: null, city: null };
    r.orderCount += 1;
    if (counts(o)) r.totalSpent += o.total;
    if (!r.lastOrderAt || new Date(o.createdAt) > new Date(r.lastOrderAt)) {
      r.lastOrderAt = new Date(o.createdAt).toISOString();
      r.city = o.shipping?.city || r.city;
    }
    by.set(k, r);
  });
  return users.map((u) => ({
    id: String(u.id), name: u.name, email: u.email, phone: u.phone ?? null, createdAt: u.createdAt,
    ...(by.get(String(u.id)) || { orderCount: 0, totalSpent: 0, lastOrderAt: null, city: null }),
  }));
}

const CUSTOMER_SORTS = {
  spent: (x, y) => y.totalSpent - x.totalSpent,
  orders: (x, y) => y.orderCount - x.orderCount || y.totalSpent - x.totalSpent,
  recent: (x, y) => String(y.lastOrderAt || '').localeCompare(String(x.lastOrderAt || '')),
  name: (x, y) => x.name.localeCompare(y.name),
  joined: (x, y) => String(y.createdAt || '').localeCompare(String(x.createdAt || '')),
};
export const sortCustomers = (rows, sort = 'spent', dir) => {
  const cmp = CUSTOMER_SORTS[sort] || CUSTOMER_SORTS.spent;
  const out = [...rows].sort((x, y) => cmp(x, y) || x.name.localeCompare(y.name));
  return dir === 'asc' && sort !== 'name' ? out.reverse() : dir === 'desc' && sort === 'name' ? out.reverse() : out;
};
export const matchCustomer = (row, q) => {
  if (!q) return true;
  const s = String(q).toLowerCase().replace(/\s+/g, ' ').trim();
  return `${row.name} ${row.email} ${row.phone || ''} ${row.city || ''}`.toLowerCase().includes(s);
};

/** Order list filters shared by both APIs: date range is inclusive Nepal days. */
export function orderMatches(o, { q, from, to, customer } = {}) {
  if (customer && String(o.userId) !== String(customer)) return false;
  if (from && dayKey(o.createdAt) < from) return false;
  if (to && dayKey(o.createdAt) > to) return false;
  if (q) {
    const s = String(q).trim().toLowerCase();
    const digits = s.replace(/[\s-]/g, '');
    const hay = `${o.orderNumber} ${o.shipping?.fullName || ''} ${o.customerName || ''}`.toLowerCase();
    if (!hay.includes(s) && !(digits.length >= 3 && /^\+?\d+$/.test(digits) && (o.shipping?.phone || '').includes(digits))) return false;
  }
  return true;
}

export const ORDER_SORTS = ['newest', 'oldest', 'total_desc', 'total_asc'];
export const sortOrders = (list, sort = 'newest') => {
  const t = (o) => new Date(o.createdAt).getTime();
  const cmp = {
    newest: (x, y) => t(y) - t(x),
    oldest: (x, y) => t(x) - t(y),
    total_desc: (x, y) => y.total - x.total || t(y) - t(x),
    total_asc: (x, y) => x.total - y.total || t(y) - t(x),
  }[sort] || ((x, y) => t(y) - t(x));
  return [...list].sort(cmp);
};

export const statusCounts = (list) => {
  const c = { all: list.length };
  STATUSES.forEach((s) => { c[s] = 0; });
  list.forEach((o) => { c[o.status] = (c[o.status] || 0) + 1; });
  return c;
};
