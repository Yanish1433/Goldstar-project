import { mongoose } from '../db.js';
import { Product } from '../models/Product.js';
import { DELIVERY_FEE, sum } from './money.js';
import { isObjectId } from '../middleware/validate.js';

/**
 * Re-prices cart lines from the database. Never throws on bad lines:
 * they are reported in `problems` and left out of `lines`.
 * The client never supplies a price; this is the only price authority.
 */
export async function priceItems(items) {
  const ids = [...new Set(items.map((i) => i.productId).filter(isObjectId))];
  const products = ids.length
    ? await Product.find({ _id: mongoose.trusted({ $in: ids }), active: true })
    : [];
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const lines = [];
  const problems = [];

  items.forEach((item, index) => {
    const product = byId.get(item.productId);
    const colour = product?.colourways.find((c) => c.key === item.colourwayKey);
    if (!product || !colour) {
      problems.push({ index, code: 'NOT_FOUND', message: 'This item is no longer available.' });
      return;
    }
    if (!colour.sizes.includes(item.size)) {
      problems.push({
        index,
        code: 'SIZE_UNAVAILABLE',
        message: `${product.name} ${colour.name} is not available in UK ${item.size}.`,
      });
      return;
    }
    if (!colour.inStock) {
      problems.push({ index, code: 'OUT_OF_STOCK', message: `${product.name} ${colour.name} is out of stock.` });
      return;
    }
    // Stock is only tracked for some products; a tracked size at 0 pairs cannot be ordered.
    if (colour.stock?.get(item.size) === 0) {
      problems.push({ index, code: 'OUT_OF_STOCK', message: `${product.name} ${colour.name} is out of stock in UK ${item.size}.` });
      return;
    }
    const img = colour.images?.[0];
    lines.push({
      productId: String(product._id),
      slug: product.slug,
      name: product.name,
      colourwayKey: colour.key,
      colourwayName: colour.name,
      size: item.size,
      qty: item.qty,
      unitPrice: colour.price,
      lineTotal: colour.price * item.qty,
      image: img ? img.thumb || img.src : null,
      _index: index,
    });
  });

  const subtotal = sum(lines.map((l) => l.lineTotal));
  return { lines, problems, subtotal, deliveryFee: DELIVERY_FEE, total: subtotal + DELIVERY_FEE };
}

export function publicLines(lines) {
  return lines.map(({ _index, ...rest }) => rest);
}
