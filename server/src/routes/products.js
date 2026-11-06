import { Router } from 'express';
import { Product } from '../models/Product.js';
import { notFound } from '../lib/errors.js';
import { page as pageOf, productSummary } from '../lib/serialize.js';
import { slugToSentence } from '../lib/slug.js';
import { validate } from '../middleware/validate.js';
import { productListQuery } from '../schemas/products.js';

export const productsRouter = Router();
export const categoriesRouter = Router();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SORTERS = {
  featured: (a, b) =>
    Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  price_asc: (a, b) => a.priceFrom - b.priceFrom || a.priceTo - b.priceTo || a.name.localeCompare(b.name),
  price_desc: (a, b) => b.priceTo - a.priceTo || b.priceFrom - a.priceFrom || a.name.localeCompare(b.name),
  newest: (a, b) => b.createdAt - a.createdAt || a.sortOrder - b.sortOrder,
};

productsRouter.get('/', validate(productListQuery, 'query'), async (req, res) => {
  const { category, q, sort, page, limit } = req.valid.query;
  const filter = { active: true };
  if (category) filter.categories = category;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { series: rx }, { slug: rx }];
  }
  // The catalogue is tiny and price range is a virtual, so filter in Mongo and
  // sort/paginate in memory. Revisit with stored priceFrom/priceTo if it ever grows.
  const docs = await Product.find(filter);
  docs.sort(SORTERS[sort]);
  const start = (page - 1) * limit;
  const items = docs.slice(start, start + limit).map(productSummary);
  res.json(pageOf(items, page, limit, docs.length));
});

productsRouter.get('/:slug', async (req, res) => {
  const slug = String(req.params.slug).toLowerCase();
  const product = /^[a-z0-9-]+$/.test(slug) ? await Product.findOne({ slug, active: true }) : null;
  if (!product) throw notFound('Product not found.');
  res.json({ product });
});

categoriesRouter.get('/', async (_req, res) => {
  const rows = await Product.aggregate([
    { $match: { active: true } },
    { $unwind: '$categories' },
    { $group: { _id: '$categories', count: { $sum: 1 } } },
  ]);
  const items = rows
    .map((r) => ({ slug: r._id, name: slugToSentence(r._id), count: r.count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  res.json({ items });
});
