import { Router } from 'express';
import { priceItems, publicLines } from '../lib/pricing.js';
import { validate } from '../middleware/validate.js';
import { quoteSchema } from '../schemas/orders.js';

export const cartRouter = Router();

cartRouter.post('/quote', validate(quoteSchema), async (req, res) => {
  const { lines, problems, subtotal, deliveryFee, total } = await priceItems(req.valid.body.items);
  res.json({ lines: publicLines(lines), subtotal, deliveryFee, total, problems });
});
