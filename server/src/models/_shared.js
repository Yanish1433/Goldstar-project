/** Shared schema options: `_id` -> `id`, drop `__v` and `passwordHash`. */
export function transform(_doc, ret) {
  if (ret._id !== undefined) {
    ret.id = String(ret._id);
    delete ret._id;
  }
  delete ret.__v;
  delete ret.passwordHash;
  return ret;
}

export const baseOptions = {
  timestamps: true,
  id: false,
  toJSON: { virtuals: false, versionKey: false, transform },
  toObject: { virtuals: false, versionKey: false, transform },
};

export const subOptions = {
  _id: false,
  id: false,
  toJSON: { virtuals: false, versionKey: false, transform },
  toObject: { virtuals: false, versionKey: false, transform },
};

export const NEPAL_PHONE = /^(\+977)?9[678]\d{8}$/;
export const HEX = /^#[0-9A-Fa-f]{6}$/;
export const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
