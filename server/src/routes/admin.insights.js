import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { notFound } from '../lib/errors.js';
import { computeStats, customerRollup, matchCustomer, sortCustomers } from '../lib/adminStats.js';
import { orderToJSON, page as pageOf } from '../lib/serialize.js';
import { objectIdParam, validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { limit, page } from '../schemas/common.js';

const DAY = 86_400_000;
const withCustomer = (query) => query.populate('user', 'name email');

/** GET /api/admin/stats?days=7|30|90 — dashboard KPIs, daily series, breakdowns (same shape as the mock). */
export const adminStatsRouter = Router();
adminStatsRouter.use(requireAdmin);

const statsQuery = z.object({ days: z.enum(['7', '30', '90']).default('30').transform(Number) });

adminStatsRouter.get('/', validate(statsQuery, 'query'), async (req, res) => {
  const { days } = req.valid.query;
  const now = new Date();
  const since = new Date(now.getTime() - 2 * days * DAY);
  const [orders, products, recent] = await Promise.all([
    Order.find({ createdAt: mongoose.trusted({ $gt: since }) }, { status: 1, total: 1, createdAt: 1, items: 1 }).lean(),
    Product.find({}, { slug: 1, name: 1, active: 1, colourways: 1 }).lean(),
    withCustomer(Order.find().sort({ createdAt: -1, _id: -1 }).limit(6)),
  ]);
  const plainOrders = orders.map((o) => ({
    ...o,
    items: o.items.map((i) => ({ productId: i.product ? String(i.product) : null, slug: i.slug, name: i.name, image: i.image ?? null, qty: i.qty, lineTotal: i.lineTotal })),
  }));
  const plainProducts = products.map((p) => ({ ...p, id: String(p._id) }));
  res.json(computeStats(plainOrders, plainProducts, { now, days, recent: recent.map((o) => orderToJSON(o, { admin: true })) }));
});

/** GET /api/admin/customers, GET /api/admin/customers/:id — shoppers with order count and total spent. */
export const adminCustomersRouter = Router();
adminCustomersRouter.param('id', objectIdParam);
adminCustomersRouter.use(requireAdmin);

const customerListQuery = z.object({
  q: z.string().trim().max(60).optional(),
  sort: z.enum(['spent', 'orders', 'recent', 'name', 'joined']).default('spent'),
  dir: z.enum(['asc', 'desc']).optional(),
  page,
  limit: limit(100, 20),
});

const rollupFor = async (userFilter) => {
  const users = await User.find({ role: 'user', ...userFilter });
  const orders = await Order.find({ user: mongoose.trusted({ $in: users.map((u) => u._id) }) }, { user: 1, total: 1, status: 1, createdAt: 1, 'shipping.city': 1 }).lean();
  return customerRollup(
    users.map((u) => u.toJSON()),
    orders.map((o) => ({ ...o, userId: String(o.user) })),
  );
};

adminCustomersRouter.get('/', validate(customerListQuery, 'query'), async (req, res) => {
  const { q, sort, dir, page: pg, limit: lim } = req.valid.query;
  const rows = sortCustomers((await rollupFor({})).filter((r) => matchCustomer(r, q)), sort, dir);
  res.json(pageOf(rows.slice((pg - 1) * lim, pg * lim), pg, lim, rows.length));
});

adminCustomersRouter.get('/:id', async (req, res) => {
  const [row] = await rollupFor({ _id: req.params.id });
  if (!row) throw notFound('Customer not found.');
  const orders = await withCustomer(Order.find({ user: req.params.id }).sort({ createdAt: -1, _id: -1 }).limit(100));
  const out = orders.map((o) => orderToJSON(o, { admin: true }));
  res.json({ customer: { ...row, address: out[0]?.shipping ?? null }, orders: out });
});
