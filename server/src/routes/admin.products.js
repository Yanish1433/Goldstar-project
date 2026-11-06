import { Router } from 'express';
import { Product } from '../models/Product.js';
import { ApiError, notFound } from '../lib/errors.js';
import { page as pageOf } from '../lib/serialize.js';
import { objectIdParam, validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { adminProductListQuery, productCreateSchema, productPatchSchema } from '../schemas/products.js';

export const adminProductsRouter = Router();
adminProductsRouter.param('id', objectIdParam);
adminProductsRouter.use(requireAdmin);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const slugTaken = () =>
  new ApiError(409, 'SLUG_TAKEN', 'A product with this slug already exists.', [
    { path: 'slug', message: 'A product with this slug already exists.' },
  ]);

adminProductsRouter.get('/', validate(adminProductListQuery, 'query'), async (req, res) => {
  const { q, active, page, limit } = req.valid.query;
  const filter = {};
  if (active !== 'all') filter.active = active === 'true';
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { series: rx }, { slug: rx }];
  }
  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);
  res.json(pageOf(items, page, limit, total));
});

adminProductsRouter.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw notFound('Product not found.');
  res.json({ product });
});

adminProductsRouter.post('/', validate(productCreateSchema), async (req, res) => {
  const data = req.valid.body;
  if (await Product.exists({ slug: data.slug })) throw slugTaken();
  let product;
  try {
    product = await Product.create(data);
  } catch (err) {
    if (err?.code === 11000) throw slugTaken();
    throw err;
  }
  res.status(201).json({ product });
});

adminProductsRouter.patch('/:id', validate(productPatchSchema), async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw notFound('Product not found.');
  // Arrays are replaced whole; save() runs the model validators.
  product.set(req.valid.body);
  await product.save();
  res.json({ product });
});
