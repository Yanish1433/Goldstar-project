import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import bcrypt from 'bcryptjs';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { fetchWooProducts, groupWooProducts } from '../lib/woo.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SNAPSHOT_PATH = path.join(HERE, 'data', 'woo-products.json');

/** Stable JSON with sorted keys, so two equal documents compare equal. */
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.keys(value)
        .filter((k) => value[k] !== undefined)
        .sort()
        .map((k) => [k, canonical(value[k])]),
    );
  }
  return value instanceof Date ? value.toISOString() : value;
}

/** The part of a product the seed owns, minus fetch metadata (which changes every run). */
function fingerprint(doc) {
  const { slug, name, series, categories, description, shortSpecs, featured, active, sortOrder, colourways, specCallouts } = doc;
  return JSON.stringify(
    canonical({ slug, name, series, categories, description, shortSpecs, featured, active, sortOrder, colourways, specCallouts, wooIds: doc.source?.wooIds }),
  );
}

async function loadListings({ offline, wooUrl, log }) {
  if (!offline) {
    try {
      const listings = await fetchWooProducts(wooUrl);
      return { listings, origin: 'live' };
    } catch (err) {
      log(`Live Store API fetch failed (${err.message}); falling back to the committed snapshot.`);
    }
  }
  const raw = await fs.readFile(SNAPSHOT_PATH, 'utf8');
  return { listings: JSON.parse(raw), origin: 'snapshot' };
}

/**
 * Idempotent: upserts products by slug (unchanged ones are left untouched) and the admin user.
 * `admin` = { email, password, name, reset }. Never logs the password.
 */
export async function runSeed({ offline = false, reset = false, admin, wooUrl, log = console.log } = {}) {
  const { listings, origin } = await loadListings({ offline, wooUrl, log });
  const docs = groupWooProducts(listings, { origin, fetchedAt: new Date() });

  if (reset) await Product.deleteMany({});

  const counts = { created: 0, updated: 0, unchanged: 0 };
  for (const doc of docs) {
    const existing = await Product.findOne({ slug: doc.slug }).lean();
    if (!existing) {
      await Product.create(doc);
      counts.created++;
    } else if (fingerprint(existing) !== fingerprint(doc)) {
      const product = await Product.findById(existing._id);
      product.set(doc);
      await product.save();
      counts.updated++;
    } else {
      counts.unchanged++;
    }
  }

  let adminState = 'none';
  if (admin) {
    const email = admin.email.trim().toLowerCase();
    const existing = await User.findOne({ email }).select('+passwordHash');
    if (!existing) {
      await User.create({
        name: admin.name || 'Demo Admin',
        email,
        passwordHash: await bcrypt.hash(admin.password, 12),
        role: 'admin',
      });
      adminState = 'created';
    } else {
      adminState = 'kept';
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        adminState = 'promoted';
      }
      if (admin.reset) {
        existing.passwordHash = await bcrypt.hash(admin.password, 12);
        adminState = 'reset';
      }
      if (adminState !== 'kept') await existing.save();
    }
  }

  const colourways = docs.reduce((n, p) => n + p.colourways.length, 0);
  const summary = {
    source: origin,
    products: docs.length,
    colourways,
    admin: admin ? admin.email.trim().toLowerCase() : null,
    adminState,
    ...counts,
  };
  log(
    `source=${origin} products=${docs.length} colourways=${colourways}` +
      (admin ? ` admin=${summary.admin} (${adminState})` : ''),
  );
  log(`catalogue: created=${counts.created} updated=${counts.updated} unchanged=${counts.unchanged}`);
  return summary;
}

// ---- CLI --------------------------------------------------------------------

async function main() {
  const { env, requireSeedEnv } = await import('../config/env.js');
  const { connectDb, disconnectDb } = await import('../db.js');
  try {
    requireSeedEnv(env);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
  const argv = new Set(process.argv.slice(2));
  try {
    await connectDb(env.MONGODB_URI);
  } catch (err) {
    console.error(`Could not connect to MongoDB: ${err.message}`);
    process.exit(1);
  }
  try {
    await runSeed({
      offline: argv.has('--offline'),
      reset: argv.has('--reset'),
      wooUrl: env.WOO_API_URL,
      admin: {
        email: env.SEED_ADMIN_EMAIL,
        password: env.SEED_ADMIN_PASSWORD,
        name: env.SEED_ADMIN_NAME,
        reset: env.SEED_ADMIN_RESET,
      },
    });
  } finally {
    await disconnectDb();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((err) => {
    console.error(`Seed failed: ${err.message}`);
    process.exit(1);
  });
}
