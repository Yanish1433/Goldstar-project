import { z } from 'zod';
import { email, phone, text } from './common.js';

const bytes72 = (v) => Buffer.byteLength(v, 'utf8') <= 72;

export const registerSchema = z.strictObject({
  name: text(2, 80, { label: 'Name' }),
  email,
  password: z
    .string({ error: 'Choose a password.' })
    .min(8, 'Password must be at least 8 characters.')
    .max(72, 'Password must be at most 72 characters.')
    .refine(bytes72, 'Password must be at most 72 bytes.')
    .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Password needs at least one letter and one number.'),
  phone: phone.optional(),
});

export const loginSchema = z.strictObject({
  email,
  password: z
    .string({ error: 'Enter your password.' })
    .min(1, 'Enter your password.')
    .max(72, 'Password must be at most 72 characters.')
    .refine(bytes72, 'Password must be at most 72 bytes.'),
});
