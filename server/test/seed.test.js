import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Product } from '../src/models/Product.js';
import { User } from '../src/models/User.js';
import { runSeed } from '../src/seed/seed.js';
import { ADMIN, startDb, stopDb } from './helpers.js';

beforeAll(startDb);
afterAll(stopDb);

const run = (extra = {}) => runSeed({ offline: true, admin: { ...ADMIN, reset: false }, log: () => {}, ...extra });

describe('12. seed (offline, from the committed snapshot)', () => {
  it('yields 5 products, 1 featured, G10-401 with 2 colourways and 7 callouts', async () => {
    const summary = await run();
    expect(summary).toMatchObject({ source: 'snapshot', products: 5, colourways: 11, created: 5, adminState: 'created' });

    expect(await Product.countDocuments()).toBe(5);
    expect(await Product.countDocuments({ featured: true })).toBe(1);
    const g10 = await Product.findOne({ slug: 'g10-401' });
    expect(g10.featured).toBe(true);
    expect(g10.colourways).toHaveLength(2);
    expect(g10.specCallouts).toHaveLength(7);
    expect(g10.specCallouts.map((c) => c.stage)).toEqual(['callout', 'callout', 'callout', 'callout', 'layer', 'layer', 'layer']);
    expect(g10.specCallouts.filter((c) => c.stage === 'layer').map((c) => c.badge)).toEqual(['support', 'cushion', 'grip']);
    const [black, olive] = g10.colourways;
    expect([black.key, black.price, black.productUrl, [...black.wooIds]]).toEqual(['black', 3400, 'https://goldstarshoes.com/product/g10-401-2/', [27292, 22960]]);
    expect([olive.key, olive.price, olive.productUrl, [...olive.wooIds]]).toEqual(['olive', 2775, 'https://goldstarshoes.com/product/g10-401/', [27285, 22961]]);
    expect([black.nameNe, olive.nameNe]).toEqual(['कालो', 'जैतुनी']);

    const prices = Object.fromEntries(
      (await Product.find()).map((p) => [p.slug, p.colourways.map((c) => `${c.key}:${c.price}/${c.regularPrice}`)]),
    );
    expect(prices).toMatchObject({
      'g10-l2102': ['pink:3500/3500', 'grey-pink:3700/3700'],
      'ax-1-a': ['olive:3000/3000'],
      'ax-3': ['black:2000/2700', 'coffee:2000/2700', 'grey:2000/2700'],
      ax: ['black:2000/2700', 'coffee:2000/2700', 'grey:2000/2700'],
    });
  });

  it('is idempotent: a second run changes nothing, and the admin password is kept', async () => {
    const before = await Product.find().lean();
    const admin = await User.findOne({ email: ADMIN.email }).select('+passwordHash').lean();
    const summary = await run();
    expect(summary).toMatchObject({ created: 0, updated: 0, unchanged: 5, adminState: 'kept' });
    const after = await Product.find().lean();
    expect(after.map((p) => String(p.updatedAt))).toEqual(before.map((p) => String(p.updatedAt)));
    const adminAfter = await User.findOne({ email: ADMIN.email }).select('+passwordHash').lean();
    expect(adminAfter.passwordHash).toBe(admin.passwordHash);
    expect(adminAfter.role).toBe('admin');
    expect(await User.countDocuments({ email: ADMIN.email })).toBe(1);
  });

  it('restores a hand-edited price on re-seed, resets the admin only on request', async () => {
    await Product.updateOne({ slug: 'g10-401' }, { $set: { 'colourways.1.price': 1 } });
    const summary = await run();
    expect(summary).toMatchObject({ updated: 1, unchanged: 4 });
    expect((await Product.findOne({ slug: 'g10-401' })).colourways[1].price).toBe(2775);

    const before = (await User.findOne({ email: ADMIN.email }).select('+passwordHash').lean()).passwordHash;
    const reset = await run({ admin: { ...ADMIN, reset: true } });
    expect(reset.adminState).toBe('reset');
    expect((await User.findOne({ email: ADMIN.email }).select('+passwordHash').lean()).passwordHash).not.toBe(before);
  });

  it('--reset removes products first but never users', async () => {
    await Product.updateOne({ slug: 'ax' }, { active: false });
    const summary = await run({ reset: true });
    expect(summary.created).toBe(5);
    expect((await Product.findOne({ slug: 'ax' })).active).toBe(true);
    expect(await User.countDocuments({ email: ADMIN.email })).toBe(1);
  });
});
