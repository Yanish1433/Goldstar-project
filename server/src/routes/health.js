import { Router } from 'express';
import { dbIsUp } from '../db.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({ ok: true, db: dbIsUp() ? 'up' : 'down' });
});
