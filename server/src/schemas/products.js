import { z } from 'zod';
import { kebab, limit, page, text } from './common.js';

export const productListQuery = z.object({
  category: kebab('Category').optional(),
  q: z.string().trim().max(60).optional(),
  sort: z.enum(['featured', 'price_asc', 'price_desc', 'newest']).default('featured'),
  page,
  limit: limit(48, 12),
});

const httpsUrl = (label) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .max(600)
    .refine((v) => {
      try {
        return new URL(v).protocol === 'https:';
      } catch {
        return false;
      }
    }, `${label} must be an https:// URL.`);

const image = z.strictObject({
  src: httpsUrl('Image URL'),
  thumb: httpsUrl('Thumbnail URL'),
  alt: z.string().trim().max(200).default(''),
});

const money = (label) =>
  z
    .number({ error: `${label} must be a whole number of rupees.` })
    .int(`${label} must be a whole number of rupees.`)
    .min(0)
    .max(1_000_000);

const colourway = z
  .strictObject({
    key: kebab('Colour key'),
    name: text(1, 60, { label: 'Colour name' }),
    nameNe: text(1, 60, { label: 'Nepali name' }).nullable().default(null),
    hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use a hex colour like #1E1E1E.'),
    price: money('Price'),
    regularPrice: money('Regular price').optional(),
    sizes: z
      .array(text(1, 8, { label: 'Size' }), { error: 'Add at least one size.' })
      .min(1, 'Add at least one size.')
      .max(30)
      .transform((arr) =>
        [...new Set(arr)].sort((a, b) => parseFloat(a) - parseFloat(b) || a.localeCompare(b)),
      ),
    inStock: z.boolean().default(true),
    stock: z
      .record(z.string().max(8), z.number({ error: 'Stock must be a whole number.' }).int('Stock must be a whole number.').min(0, 'Stock cannot be negative.').max(99_999))
      .optional(),
    images: z.array(image).max(30).default([]),
    productUrl: httpsUrl('Product URL').refine(
      (v) => v.startsWith('https://goldstarshoes.com/'),
      'Product URL must start with https://goldstarshoes.com/',
    ),
    wooIds: z.array(z.number().int().min(0)).max(20).default([]),
  })
  .transform((c) => ({
    ...c,
    regularPrice: c.regularPrice ?? c.price,
    // Keep stock only for sizes this colourway has.
    ...(c.stock ? { stock: Object.fromEntries(Object.entries(c.stock).filter(([size]) => c.sizes.includes(size))) } : {}),
  }))
  .refine((c) => c.regularPrice >= c.price, {
    path: ['regularPrice'],
    message: 'Regular price must be equal to or higher than the price.',
  });

const callout = z.strictObject({
  key: kebab('Callout key'),
  title: text(2, 60, { label: 'Title' }),
  body: text(2, 200, { label: 'Body' }),
  anchor: z.enum(['upper', 'overlay', 'eyelets', 'collar', 'footbed', 'midsole', 'outsole']),
  position: z
    .tuple([z.number().min(-5).max(5), z.number().min(-5).max(5), z.number().min(-5).max(5)], {
      error: 'Position must be three numbers between -5 and 5, or empty.',
    })
    .nullable()
    .default(null),
  stage: z.enum(['callout', 'layer']),
  badge: z.enum(['support', 'cushion', 'grip']).nullable().default(null),
  order: z.number().int(),
});

const uniqueBy = (field, label) => (arr, ctx) => {
  const seen = new Set();
  arr.forEach((item, i) => {
    if (seen.has(item[field])) {
      ctx.addIssue({ code: 'custom', path: [i, field], message: `${label} must be unique within the product.` });
    }
    seen.add(item[field]);
  });
};

const fields = {
  name: text(1, 120, { label: 'Name' }),
  series: text(1, 60, { label: 'Series' }).nullable(),
  categories: z.array(kebab('Category')).max(12),
  description: text(0, 4000, { multiline: true, label: 'Description' }),
  shortSpecs: z.array(text(1, 200, { label: 'Spec' })).max(12),
  featured: z.boolean(),
  active: z.boolean(),
  sortOrder: z.number().min(-100000).max(100000),
  colourways: z.array(colourway).min(1, 'Add at least one colourway.').max(12).superRefine(uniqueBy('key', 'Colour key')),
  specCallouts: z.array(callout).max(20).superRefine(uniqueBy('key', 'Callout key')),
};

export const productCreateSchema = z.strictObject({
  slug: z
    .string({ error: 'Slug is required.' })
    .trim()
    .toLowerCase()
    .min(1, 'Slug is required.')
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Slug can only have lowercase letters, numbers and hyphens.'),
  name: fields.name,
  series: fields.series.default(null),
  categories: fields.categories.default([]),
  description: fields.description.default(''),
  shortSpecs: fields.shortSpecs.default([]),
  featured: fields.featured.default(false),
  active: fields.active.default(true),
  sortOrder: fields.sortOrder.default(100),
  colourways: fields.colourways,
  specCallouts: fields.specCallouts.default([]),
});

export const productPatchSchema = z
  .strictObject({
    name: fields.name,
    series: fields.series,
    categories: fields.categories,
    description: fields.description,
    shortSpecs: fields.shortSpecs,
    featured: fields.featured,
    active: fields.active,
    sortOrder: fields.sortOrder,
    colourways: fields.colourways,
    specCallouts: fields.specCallouts,
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Send at least one field to change.');

export const adminProductListQuery = z.object({
  q: z.string().trim().max(60).optional(),
  active: z.enum(['true', 'false', 'all']).default('all'),
  page,
  limit: limit(100, 20),
});
