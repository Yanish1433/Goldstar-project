import { Router } from 'express';
import { Order } from '../models/Order.js';
import { ApiError, notFound } from '../lib/errors.js';
import { allowedNext, canTransition } from '../lib/orderStatus.js';
import { orderToJSON, page as pageOf } from '../lib/serialize.js';
import { objectIdParam, validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { adminOrderListQuery, statusSchema } from '../schemas/orders.js';

export const adminOrdersRouter = Router();
adminOrdersRouter.param('id', objectIdParam);
adminOrdersRouter.use(requireAdmin);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const withCustomer = (query) => query.populate('user', 'name email');

adminOrdersRouter.get('/', validate(adminOrderListQuery, 'query'), async (req, res) => {
  const { status, q, page, limit } = req.valid.query;
  const filter = {};
  if (status !== 'all') filter.status = status;
  if (q) {
    const rx = new RegExp(escapeRegex(q.replace(/\s+/g, '')), 'i');
    filter.$or = [{ orderNumber: rx }, { 'shipping.phone': rx }];
  }
  const [docs, total] = await Promise.all([
    withCustomer(
      Order.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ),
    Order.countDocuments(filter),
  ]);
  res.json(pageOf(docs.map((o) => orderToJSON(o, { admin: true })), page, limit, total));
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
