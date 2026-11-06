import { Router } from 'express';
import { Order } from '../models/Order.js';
import { ApiError, notFound } from '../lib/errors.js';
import { generateOrderNumber } from '../lib/orderNumber.js';
import { canTransition } from '../lib/orderStatus.js';
import { priceItems } from '../lib/pricing.js';
import { orderSummary, orderToJSON, page as pageOf } from '../lib/serialize.js';
import { objectIdParam, validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { cancelSchema, mineQuery, orderCreateSchema } from '../schemas/orders.js';

export const ordersRouter = Router();
ordersRouter.param('id', objectIdParam);
ordersRouter.use(requireAuth);

ordersRouter.post('/', validate(orderCreateSchema), async (req, res) => {
  const { items, shipping } = req.valid.body;
  const priced = await priceItems(items);
  if (priced.problems.length) {
    throw new ApiError(
      409,
      'CART_PROBLEM',
      'Some items in your cart need attention.',
      priced.problems.map((p) => ({ path: `items.${p.index}`, message: p.message })),
    );
  }

  const base = {
    user: req.user._id,
    items: priced.lines.map((l) => ({
      product: l.productId,
      slug: l.slug,
      name: l.name,
      colourwayKey: l.colourwayKey,
      colourwayName: l.colourwayName,
      size: l.size,
      qty: l.qty,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
      image: l.image,
    })),
    subtotal: priced.subtotal,
    deliveryFee: priced.deliveryFee,
    total: priced.total,
    currency: 'NPR',
    paymentMethod: 'cod',
    paymentStatus: 'unpaid',
    shipping,
    status: 'placed',
    statusHistory: [{ status: 'placed', at: new Date(), by: req.user._id }],
  };

  let order;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      order = await Order.create({ ...base, orderNumber: generateOrderNumber() });
      break;
    } catch (err) {
      const dupNumber = err?.code === 11000 && err?.keyPattern?.orderNumber;
      if (!dupNumber || attempt === 5) throw err;
    }
  }
  res.status(201).json({ order: orderToJSON(order) });
});

// Must be registered before "/:id".
ordersRouter.get('/mine', validate(mineQuery, 'query'), async (req, res) => {
  const { page, limit } = req.valid.query;
  const filter = { user: req.user._id };
  const [docs, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);
  res.json(pageOf(docs.map(orderSummary), page, limit, total));
});

/** Owner or admin. Anyone else gets 404 so existence is not revealed. */
async function loadOwned(req) {
  const order = await Order.findById(req.params.id);
  const isOwner = order && String(order.user) === String(req.user._id);
  if (!order || !(isOwner || req.user.role === 'admin')) throw notFound('Order not found.');
  return order;
}

ordersRouter.get('/:id', async (req, res) => {
  const order = await loadOwned(req);
  res.json({ order: orderToJSON(order) });
});

ordersRouter.post('/:id/cancel', validate(cancelSchema), async (req, res) => {
  const order = await loadOwned(req);
  // SPEC §3.3 #13: cancelling here is only possible while the order is still `placed`.
  if (order.status !== 'placed' || !canTransition(order.status, 'cancelled')) {
    throw new ApiError(409, 'INVALID_TRANSITION', `An order that is ${order.status} cannot be cancelled.`);
  }
  const { note } = req.valid.body;
  const entry = { status: 'cancelled', at: new Date(), by: req.user._id, ...(note ? { note } : {}) };
  // Atomic: only cancels if the order is still `placed` (guards against a concurrent admin move).
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: 'placed' },
    { $set: { status: 'cancelled' }, $push: { statusHistory: entry } },
    { new: true },
  );
  if (!updated) {
    throw new ApiError(409, 'INVALID_TRANSITION', 'This order can no longer be cancelled.');
  }
  res.json({ order: orderToJSON(updated) });
});
