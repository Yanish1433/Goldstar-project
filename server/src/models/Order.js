import mongoose from 'mongoose';
import { baseOptions, subOptions, NEPAL_PHONE } from './_shared.js';
import { ORDER_STATUSES } from '../lib/orderStatus.js';

const int = (extra = {}) => ({
  type: Number,
  validate: { validator: Number.isInteger, message: '{PATH} must be a whole number' },
  ...extra,
});

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    colourwayKey: { type: String, required: true },
    colourwayName: { type: String, required: true },
    size: { type: String, required: true },
    qty: int({ required: true, min: 1, max: 5 }),
    unitPrice: int({ required: true, min: 0 }),
    lineTotal: int({ required: true, min: 0 }),
    image: { type: String, default: null },
  },
  subOptions,
);

const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, maxlength: 300 },
  },
  subOptions,
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, match: /^GS-\d{6}-[A-HJ-NP-Z2-9]{4}$/ },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: {
      type: [itemSchema],
      validate: { validator: (v) => v.length >= 1 && v.length <= 10, message: 'an order has 1 to 10 lines' },
    },
    subtotal: int({ required: true, min: 0 }),
    deliveryFee: int({ default: 0, min: 0 }),
    total: int({ required: true, min: 0 }),
    currency: { type: String, default: 'NPR' },
    paymentMethod: { type: String, enum: ['cod'], default: 'cod' },
    paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
    shipping: {
      fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
      phone: { type: String, required: true, match: NEPAL_PHONE },
      addressLine: { type: String, required: true, trim: true, minlength: 3, maxlength: 160 },
      area: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
      city: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
      landmark: { type: String, trim: true, maxlength: 120 },
      notes: { type: String, trim: true, maxlength: 300 },
    },
    status: { type: String, enum: ORDER_STATUSES, default: 'placed' },
    statusHistory: { type: [historySchema], default: [] },
  },
  baseOptions,
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'shipping.phone': 1 });

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
