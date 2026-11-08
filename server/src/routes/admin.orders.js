import { Router } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { ApiError, notFound } from '../lib/errors.js';
import { allowedNext, canTransition, ORDER_STATUSES } from '../lib/orderStatus.js';
import { User } from '../models/User.js';
import { orderToJSON, page as pageOf } from '../lib/serialize.js';
import { objectIdParam, validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { adminOrderListQuery, statusSchema } from '../schemas/orders.js';

export const adminOrdersRouter = Router();
adminOrdersRouter.param('id', objectIdParam);
adminOrdersRouter.use(requireAdmin);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const withCustomer = (query) => query.populate('user', 'name email');

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  total_desc: { total: -1, createdAt: -1 },
  total_asc: { total: 1, createdAt: -1 },
};

adminOrdersRouter.get('/', validate(adminOrderListQuery, 'query'), async (req, res) => {
  const { status, q, from, to, sort, customer, page, limit } = req.valid.query;
  const base = {};
  if (q) {
    const compact = new RegExp(escapeRegex(q.replace(/\s+/g, '')), 'i');
    const loose = new RegExp(escapeRegex(q), 'i');
    const users = await User.find({ name: loose }, { _id: 1 }).limit(200);
    base.$or = [{ orderNumber: compact }, { 'shipping.phone': compact }, { 'shipping.fullName': loose }, { user: mongoose.trusted({ $in: users.map((u) => u._id) }) }];
  }
  if (from || to) {
    // Inclusive calendar days in Nepal (UTC+05:45).
    const range = {};
    if (from) range.$gte = new Date(`${from}T00:00:00.000+05:45`);
    if (to) range.$lte = new Date(`${to}T23:59:59.999+05:45`);
    base.createdAt = mongoose.trusted(range);
  }
  if (customer) base.user = customer;
  const filter = status !== 'all' ? { ...base, status } : base;
  const [docs, total, grouped] = await Promise.all([
    withCustomer(
      Order.find(filter)
        .sort(SORTS[sort])
        .skip((page - 1) * limit)
        .limit(limit),
    ),
    Order.countDocuments(filter),
    Order.aggregate([{ $match: base }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  const counts = { all: 0, ...Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) };
  grouped.forEach((g) => {
    counts[g._id] = g.n;
    counts.all += g.n;
  });
  res.json({ ...pageOf(docs.map((o) => orderToJSON(o, { admin: true })), page, limit, total), counts });
});

adminOrdersRouter.get('/:id', async (req, res) => {
  const order = await withCustomer(Order.findById(req.params.id));
  if (!order) throw notFound('Order not found.');
  res.json({ order: orderToJSON(order, { admin: true }) });
});

adminOrdersRouter.patch('/:id/status', validate(statusSchema), async (req, res) => {
  const { status, note } = req.valid.body;
  const current = await Order.findById(req.params.id);
  if (!current) throw notFound('Order not found.');
  if (!canTransition(current.status, status)) {
    const next = allowedNext(current.status);
    throw new ApiError(
      409,
      'INVALID_TRANSITION',
      next.length
        ? `An order that is ${current.status} can only become: ${next.join(', ')}.`
        : `An order that is ${current.status} cannot change status.`,
    );
  }
  const entry = { status, at: new Date(), by: req.user._id, ...(note ? { note } : {}) };
  const set = { status };
  if (status === 'delivered') set.paymentStatus = 'paid'; // cash collected on delivery
  // Atomic compare-and-set on the status we validated against.
  const updated = await withCustomer(
    Order.findOneAndUpdate(
      { _id: current._id, status: current.status },
      { $set: set, $push: { statusHistory: entry } },
      { new: true },
    ),
  );
  if (!updated) {
    throw new ApiError(409, 'INVALID_TRANSITION', 'The order changed while you were editing it. Reload and try again.');
  }
  res.json({ order: orderToJSON(updated, { admin: true }) });
});
