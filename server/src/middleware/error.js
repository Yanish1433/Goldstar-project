import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ApiError } from '../lib/errors.js';

export function body(code, message, details) {
  return { error: { code, message, ...(details ? { details } : {}) } };
}

export function notFoundHandler(_req, _res, next) {
  next(new ApiError(404, 'NOT_FOUND', 'Not found.'));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (res.headersSent) return;

  if (err instanceof ApiError) {
    return res.status(err.status).json(body(err.code, err.message, err.details));
  }

  // body-parser errors
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json(body('BAD_JSON', 'The request body is not valid JSON.'));
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json(body('PAYLOAD_TOO_LARGE', 'The request body is too large (100 kb max).'));
  }
  if (err?.type === 'charset.unsupported' || err?.type === 'encoding.unsupported') {
    return res.status(415).json(body('UNSUPPORTED_MEDIA_TYPE', 'Send the request body as UTF-8 JSON.'));
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    return res.status(400).json(body('VALIDATION_ERROR', 'Check the highlighted fields.', details));
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(404).json(body('NOT_FOUND', 'Not found.'));
  }

  // Unexpected: log the message server-side only, never leak it to the client.
  if (!env.isTest) {
    console.error(`[error] ${req.method} ${req.originalUrl}:`, env.isDev ? err : err?.message);
  }
  res.status(500).json(body('INTERNAL', 'Something went wrong.'));
}
