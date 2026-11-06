import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { jsonOnly } from './middleware/jsonOnly.js';
import { createLimiters } from './middleware/rateLimit.js';
import { adminOrdersRouter } from './routes/admin.orders.js';
import { adminProductsRouter } from './routes/admin.products.js';
import { authRouter } from './routes/auth.js';
import { cartRouter } from './routes/cart.js';
import { healthRouter } from './routes/health.js';
import { ordersRouter } from './routes/orders.js';
import { categoriesRouter, productsRouter } from './routes/products.js';

const CLIENT_DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');

// SPEC §3.6
const CSP = {
  useDefaults: false,
  directives: {
    'default-src': ["'self'"],
    'img-src': ["'self'", 'data:', 'blob:', 'https://goldstarshoes.com'],
    'script-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'"],
    'worker-src': ["'self'", 'blob:'],
    'object-src': ["'none'"],
    'frame-ancestors': ["'none'"],
  },
};

/**
 * Builds the Express app without listening, so tests can import it.
 * `limits` overrides the rate limits (tests raise them; production uses SPEC values).
 */
export function createApp({ limits, serveClient = env.isProd } = {}) {
  const app = express();
  app.disable('x-powered-by');

  const limiters = createLimiters(
    limits ?? (env.isTest ? { global: 100_000, auth: 100_000 } : { global: 300, auth: 10 }),
  );

  app.use(helmet({ contentSecurityPolicy: CSP }));
  app.use(cors({ origin: env.CLIENT_ORIGINS, credentials: true }));
  if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'));

  app.use('/api', limiters.global);
  app.use('/api', jsonOnly);
  app.use('/api', express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter({ limiters }));
  app.use('/api/products', productsRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/cart', cartRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/admin/products', adminProductsRouter);
  app.use('/api/admin/orders', adminOrdersRouter);
  app.use('/api', notFoundHandler);

  // Optional: serve the built client (never builds it). SPA fallback for non-API GETs.
  if (serveClient && fs.existsSync(path.join(CLIENT_DIST, 'index.html'))) {
    app.use(express.static(CLIENT_DIST, { index: false, maxAge: '1h' }));
    app.get(/^(?!\/api(\/|$)).*/, (_req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
