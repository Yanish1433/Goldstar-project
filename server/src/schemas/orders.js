import { z } from 'zod';
import { limit, page, phone, qty, text } from './common.js';

const line = z.strictObject({
  productId: z.string({ error: 'Product is required.' }).trim().min(1).max(64),
  colourwayKey: z.string({ error: 'Choose a colour.' }).trim().min(1).max(60),
  size: z.string({ error: 'Choose a size.' }).trim().min(1).max(8),
  qty,
});

const noDuplicates = (arr, ctx) => {
  const seen = new Set();
  arr.forEach((l, i) => {
    const id = `${l.productId}|${l.colourwayKey}|${l.size}`;
    if (seen.has(id)) {
      ctx.addIssue({ code: 'custom', path: [i], message: 'This item appears twice. Merge the quantities.' });
    }
    seen.add(id);
  });
};

const items = z
  .array(line, { error: 'Add at least one item.' })
  .min(1, 'Add at least one item.')
  .max(10, 'You can order at most 10 different items at once.')
  .superRefine(noDuplicates);

export const quoteSchema = z.strictObject({ items });

export const shippingSchema = z.strictObject({
  fullName: text(2, 80, { label: 'Full name' }),
  phone,
  addressLine: text(3, 160, { label: 'Address' }),
  area: text(2, 80, { label: 'Area' }),
  city: text(2, 80, { label: 'City' }),
  landmark: text(0, 120, { label: 'Landmark' }).optional(),
  notes: text(0, 300, { multiline: true, label: 'Notes' }).optional(),
});

export const orderCreateSchema = z.strictObject({
  items,
  shipping: shippingSchema,
  paymentMethod: z.literal('cod', { error: 'Only cash on delivery is available.' }).default('cod'),
});

export const cancelSchema = z.strictObject({
  note: text(0, 300, { multiline: true, label: 'Note' }).optional(),
});

export const statusSchema = z.strictObject({
  status: z.enum(['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'], { error: 'Choose a valid status.' }),
  note: text(0, 300, { multiline: true, label: 'Note' }).optional(),
});

export const mineQuery = z.object({ page, limit: limit(50, 10) });

export const adminOrderListQuery = z.object({
  status: z.enum(['all', 'placed', 'confirmed', 'shipped', 'delivered', 'cancelled']).default('all'),
  q: z.string().trim().max(60).optional(),
  page,
  limit: limit(100, 20),
});
