import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { ApiError } from '../lib/errors.js';
import { validate } from '../middleware/validate.js';
import { clearAuthCookie, requireAuth, setAuthCookie } from '../middleware/auth.js';
import { loginSchema, registerSchema } from '../schemas/auth.js';

export const BCRYPT_COST = 12;

// Pre-computed cost-12 hash of a throwaway string. Compared against when the email
// is unknown so unknown-email and wrong-password take about the same time.
const DUMMY_HASH = '$2b$12$yB6bVnb6Jz8tD89CewxQae303ZEYxOggCMMnkHaRaHwqMDsgMrPuG';

export function authRouter({ limiters }) {
  const r = Router();

  r.post('/register', limiters.register, validate(registerSchema), async (req, res) => {
    const { name, email, password, phone } = req.valid.body;
    if (await User.exists({ email })) throw emailTaken();
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    let user;
    try {
      user = await User.create({ name, email, passwordHash, ...(phone ? { phone } : {}) });
    } catch (err) {
      if (err?.code === 11000) throw emailTaken();
      throw err;
    }
    setAuthCookie(res, user);
    res.status(201).json({ user });
  });

  r.post('/login', limiters.login, validate(loginSchema), async (req, res) => {
    const { email, password } = req.valid.body;
    const user = await User.findOne({ email }).select('+passwordHash');
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
    }
    setAuthCookie(res, user);
    res.json({ user });
  });

  r.post('/logout', (_req, res) => {
    clearAuthCookie(res);
    res.status(204).end();
  });

  r.get('/me', requireAuth, (req, res) => {
    res.json({ user: req.user });
  });

  return r;
}

function emailTaken() {
  return new ApiError(409, 'EMAIL_TAKEN', 'An account with this email already exists.', [
    { path: 'email', message: 'An account with this email already exists.' },
  ]);
}
