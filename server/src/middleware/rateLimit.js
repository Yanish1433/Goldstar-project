import rateLimit from 'express-rate-limit';
import { body } from './error.js';

const WINDOW_MS = 15 * 60 * 1000;

function make(max) {
  return rateLimit({
    windowMs: WINDOW_MS,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler(_req, res) {
      // express-rate-limit has already set Retry-After by now.
      res.status(429).json(body('RATE_LIMITED', 'Too many requests. Please try again later.'));
    },
  });
}

/** SPEC §3.6: auth 10 / 15 min / IP, whole API 300 / 15 min / IP. */
export function createLimiters({ global = 300, auth = 10 } = {}) {
  return {
    global: make(global),
    // separate counters so login attempts do not eat the register budget
    login: make(auth),
    register: make(auth),
  };
}
