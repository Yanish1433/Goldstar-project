import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { forbidden, unauthenticated } from '../lib/errors.js';

export const COOKIE_NAME = 'gs_token';

export function cookieOptions({ withMaxAge = true } = {}) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    path: '/',
    ...(withMaxAge ? { maxAge: env.COOKIE_MAX_AGE_MS } : {}),
  };
}

export function signToken(user) {
  return jwt.sign({ sub: String(user._id ?? user.id), role: user.role }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export function setAuthCookie(res, user) {
  res.cookie(COOKIE_NAME, signToken(user), cookieOptions());
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, cookieOptions({ withMaxAge: false }));
}

/** Verifies the cookie token AND reloads the user from the database. */
export async function requireAuth(req, _res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token || typeof token !== 'string') throw unauthenticated();
  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    throw unauthenticated();
  }
  if (typeof payload.sub !== 'string' || !/^[0-9a-f]{24}$/i.test(payload.sub)) throw unauthenticated();
  const user = await User.findById(payload.sub);
  if (!user) throw unauthenticated();
  req.user = user;
  next();
}

/** Role comes from the database record (requireAuth), never from the token. */
export async function requireAdmin(req, res, next) {
  await requireAuth(req, res, () => {});
  if (!req.user) return; // requireAuth threw
  if (req.user.role !== 'admin') throw forbidden('Admin access only.');
  next();
}
