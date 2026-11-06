import mongoose from 'mongoose';
import { baseOptions, subOptions, HEX, KEBAB, transform } from './_shared.js';

const int = (extra = {}) => ({
  type: Number,
  validate: { validator: Number.isInteger, message: '{PATH} must be a whole number' },
  ...extra,
});

const imageSchema = new mongoose.Schema(
  {
    src: { type: String, required: true, match: /^https:\/\// },
    thumb: { type: String, required: true, match: /^https:\/\// },
    alt: { type: String, default: '', maxlength: 200 },
  },
  subOptions,
);

const colourwaySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, match: KEBAB },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    nameNe: { type: String, default: null, maxlength: 60 },
    hex: { type: String, required: true, match: HEX },
    price: int({ required: true, min: 0, max: 1_000_000 }),
    regularPrice: {
      type: Number,
      required: true,
      min: 0,
      max: 1_000_000,
      validate: {
        validator(v) {
          return Number.isInteger(v) && v >= this.price;
        },
        message: 'regularPrice must be a whole number >= price',
      },
    },
    sizes: {
      type: [String],
      validate: { validator: (v) => v.length >= 1, message: 'at least one size is required' },
    },
    inStock: { type: Boolean, default: true },
    images: { type: [imageSchema], default: [] },
    productUrl: { type: String, required: true, match: /^https:\/\/goldstarshoes\.com\// },
    wooIds: { type: [Number], default: [] },
  },
  subOptions,
);

const calloutSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, match: KEBAB },
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    body: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
    anchor: {
      type: String,
      required: true,
      enum: ['upper', 'overlay', 'eyelets', 'collar', 'footbed', 'midsole', 'outsole'],
    },
    position: {
      type: [Number],
      default: null,
      validate: {
        validator: (v) => v == null || (v.length === 3 && v.every((n) => Number.isFinite(n) && n >= -5 && n <= 5)),
        message: 'position must be null or three numbers between -5 and 5',
      },
    },
    stage: { type: String, required: true, enum: ['callout', 'layer'] },
    badge: { type: String, enum: ['support', 'cushion', 'grip', null], default: null },
    order: int({ required: true }),
  },
  subOptions,
);

const unique = (field) => ({
  validator: (arr) => new Set(arr.map((x) => x[field])).size === arr.length,
  message: `${field} must be unique within the product`,
});

function productTransform(doc, ret) {
  transform(doc, ret);
  delete ret.source;
  delete ret.createdAt;
  return ret;
}

const productOptions = { virtuals: true, versionKey: false, transform: productTransform };

const productSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, match: /^[a-z0-9-]+$/ },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    series: { type: String, default: null, trim: true, maxlength: 60 },
    categories: { type: [{ type: String, match: KEBAB }], default: [] },
    description: { type: String, default: '', maxlength: 4000 },
    shortSpecs: {
      type: [{ type: String, maxlength: 200 }],
      default: [],
      validate: { validator: (v) => v.length <= 12, message: 'at most 12 short specs' },
    },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 100 },
    colourways: {
      type: [colourwaySchema],
      validate: [
        { validator: (v) => v.length >= 1, message: 'at least one colourway is required' },
        unique('key'),
      ],
    },
    specCallouts: { type: [calloutSchema], default: [], validate: unique('key') },
    source: {
      wooIds: { type: [Number], default: [] },
      fetchedAt: { type: Date },
      origin: { type: String, enum: ['live', 'snapshot'] },
    },
  },
  { ...baseOptions, toJSON: productOptions, toObject: productOptions },
);

productSchema.virtual('priceFrom').get(function () {
  return this.colourways.length ? Math.min(...this.colourways.map((c) => c.price)) : 0;
});
productSchema.virtual('priceTo').get(function () {
  return this.colourways.length ? Math.max(...this.colourways.map((c) => c.price)) : 0;
});

productSchema.index({ active: 1, featured: -1, sortOrder: 1 });
productSchema.index({ categories: 1 });
productSchema.index({ 'colourways.wooIds': 1 });
productSchema.index({ name: 'text', description: 'text', series: 'text' });

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
