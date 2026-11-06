import mongoose from 'mongoose';
import { baseOptions, NEPAL_PHONE } from './_shared.js';

const userToJSON = {
  ...baseOptions.toJSON,
  transform(_doc, ret) {
    return {
      id: String(ret._id),
      name: ret.name,
      email: ret.email,
      phone: ret.phone ?? null,
      role: ret.role,
      createdAt: ret.createdAt,
    };
  },
};

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      unique: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, match: NEPAL_PHONE },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { ...baseOptions, toJSON: userToJSON, toObject: userToJSON },
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);
