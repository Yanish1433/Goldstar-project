import mongoose from 'mongoose';
import { ApiError, notFound } from '../lib/errors.js';
import { issuesToDetails } from '../schemas/common.js';

/**
 * validate(schema, 'body' | 'query') -> parsed data on req.valid.body / req.valid.query.
 * (Express 5 makes req.query read-only, so parsed data lives on req.valid.)
 */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const input = source === 'body' ? (req.body ?? {}) : req.query;
    const result = schema.safeParse(input);
    if (!result.success) {
      return next(
        new ApiError(400, 'VALIDATION_ERROR', 'Check the highlighted fields.', issuesToDetails(result.error.issues)),
      );
    }
    req.valid = { ...(req.valid ?? {}), [source]: result.data };
    next();
  };
}

/** router.param('id', objectIdParam): a malformed id is a 404, never a 500. */
export function objectIdParam(_req, _res, next, value) {
  if (!mongoose.isValidObjectId(value) || String(value).length !== 24) return next(notFound());
  next();
}

export const isObjectId = (v) => typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v);
