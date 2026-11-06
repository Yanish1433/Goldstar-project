import { ApiError } from '../lib/errors.js';

const WRITES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Writes that carry a body must be application/json (else 415).
 * Body-less writes (logout, cancel without a note) are let through.
 */
export function jsonOnly(req, _res, next) {
  if (!WRITES.has(req.method)) return next();
  const hasBody = Number(req.headers['content-length'] ?? 0) > 0 || req.headers['transfer-encoding'] !== undefined;
  if (hasBody && !req.is('application/json')) {
    return next(new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send the request body as application/json.'));
  }
  next();
}
