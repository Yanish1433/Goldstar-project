import { z } from 'zod';

const CONTROL = /[\u0000-\u001F\u007F]/;
const CONTROL_EXCEPT_NEWLINES = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

/** Trimmed string with length limits and no control characters. */
export function text(min, max, { multiline = false, label } = {}) {
  const what = label ?? 'This field';
  return z
    .string({ error: `${what} is required.` })
    .trim()
    .min(min, min === 1 ? `${what} is required.` : `${what} must be at least ${min} characters.`)
    .max(max, `${what} must be at most ${max} characters.`)
    .refine((v) => !(multiline ? CONTROL_EXCEPT_NEWLINES : CONTROL).test(v), `${what} contains invalid characters.`);
}

export const email = z
  .string({ error: 'Enter your email address.' })
  .trim()
  .toLowerCase()
  .max(254, 'Email is too long.')
  .pipe(z.email('Enter a valid email address.'));

const PHONE_RE = /^(\+977)?9[678]\d{8}$/;
export const PHONE_MESSAGE = 'Enter a Nepali mobile number, e.g. 98XXXXXXXX.';

export const phone = z
  .string({ error: PHONE_MESSAGE })
  .transform((v) => v.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(PHONE_RE, PHONE_MESSAGE))
  .transform((v) => v.replace(/^\+977/, ''));

export const kebab = (label = 'Key') =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .max(60, `${label} is too long.`)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${label} must be lowercase letters, numbers and hyphens.`);

export const qty = z
  .number({ error: 'Quantity must be a number from 1 to 5.' })
  .int('Quantity must be a whole number.')
  .min(1, 'Quantity must be at least 1.')
  .max(5, 'You can order at most 5 of one item.');

export const page = z.coerce.number().int().min(1).default(1);
export const limit = (max, def) => z.coerce.number().int().min(1).max(max).default(def);

/** zod issues -> SPEC §3.1 `details`. Unknown keys become one entry per key. */
export function issuesToDetails(issues) {
  const out = [];
  for (const issue of issues) {
    const base = issue.path.map(String);
    if (issue.code === 'unrecognized_keys') {
      for (const key of issue.keys) {
        out.push({
          path: [...base, key].join('.'),
          message: key === 'slug' ? 'The slug cannot be changed.' : `Unknown field "${key}".`,
        });
      }
    } else {
      out.push({ path: base.join('.'), message: issue.message });
    }
  }
  // A whole-object refine (path "") adds nothing when field-level problems exist.
  return out.length > 1 ? out.filter((d) => d.path !== "") : out;
}
