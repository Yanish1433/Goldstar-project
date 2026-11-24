import { describe, expect, it } from 'vitest';
import { formatEnvError, parseEnv } from '../src/config/env.js';
import { generateOrderNumber } from '../src/lib/orderNumber.js';
import { ORDER_STATUSES, allowedNext, canTransition } from '../src/lib/orderStatus.js';
import { groupWooProducts, normaliseModelName, sentenceCase, shortSpecsFrom } from '../src/lib/woo.js';
import { phone } from '../src/schemas/common.js';
import { slugify } from '../src/lib/slug.js';

describe('canTransition (SPEC §2.4)', () => {
  const allowed = {
    placed: ['confirmed', 'cancelled'],
    confirmed: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
  };
  for (const from of ORDER_STATUSES) {
    for (const to of ORDER_STATUSES) {
      it(`${from} -> ${to} is ${allowed[from].includes(to) ? 'allowed' : 'refused'}`, () => {
        expect(canTransition(from, to)).toBe(allowed[from].includes(to));
      });
    }
  }
  it('lists next statuses', () => {
    expect(allowedNext('placed')).toEqual(['confirmed', 'cancelled']);
    expect(allowedNext('nonsense')).toEqual([]);
  });
});

describe('order numbers', () => {
  it('match GS-YYMMDD-XXXX using Nepal time', () => {
    expect(generateOrderNumber(new Date('2026-11-04T10:00:00Z'))).toMatch(/^GS-261104-[A-HJ-NP-Z2-9]{4}$/);
    // 19:00 UTC is already the next day in Nepal (UTC+5:45)
    expect(generateOrderNumber(new Date('2026-11-04T19:00:00Z'))).toMatch(/^GS-261105-/);
  });
});

describe('env validation', () => {
  const base = { MONGODB_URI: 'mongodb://127.0.0.1:27017/x', JWT_SECRET: 'x'.repeat(32) };
  it('accepts a good config and applies defaults', () => {
    const env = parseEnv(base);
    expect(env.PORT).toBe(5050);
    expect(env.COOKIE_SECURE).toBe(false);
    expect(env.COOKIE_MAX_AGE_MS).toBe(7 * 86_400_000);
  });
  it('rejects a short JWT_SECRET, a bad URI and a bad PORT with readable messages', () => {
    for (const bad of [{ ...base, JWT_SECRET: 'short' }, { ...base, JWT_SECRET: undefined }, { ...base, MONGODB_URI: 'http://x' }, { ...base, PORT: 'abc' }]) {
      expect(() => parseEnv(bad)).toThrow();
    }
    try {
      parseEnv({ ...base, JWT_SECRET: 'short' });
    } catch (err) {
      expect(formatEnvError(err)).toMatch(/JWT_SECRET.*at least 32/);
    }
  });
});

describe('seed helpers', () => {
  it('normalises names and slugs', () => {
    expect(normaliseModelName(' AX -3 ')).toBe('AX-3');
    expect(normaliseModelName('G10  L2102')).toBe('G10 L2102');
    expect(slugify('AX-1/A')).toBe('ax-1-a');
    expect(slugify('G10 L2102')).toBe('g10-l2102');
  });
  it('sentence-cases spec lines and keeps acronyms', () => {
    expect(sentenceCase('EVA MIDSOLE FOR BOUNCE')).toBe('EVA midsole for bounce');
    expect(sentenceCase('PU SYNTHETIC LEATHER')).toBe('PU synthetic leather');
    expect(sentenceCase('RUBBER OUTSOLE FOR DURABILITY & SLIP RESISTANCE')).toBe('Rubber outsole for durability & slip resistance');
    expect(shortSpecsFrom('<ul>\n<li>CANVAS MESH</li>\n<li>ARCH SUPPORT &amp; CUSHIONED FOOTBED</li>\n</ul>')).toEqual([
      'Canvas mesh',
      'Arch support & cushioned footbed',
    ]);
  });
  it('fails loudly when a listing has no colour and no override', () => {
    const listing = { id: 1, name: 'Z', permalink: 'https://goldstarshoes.com/product/z/', attributes: [], prices: { price: '1', regular_price: '1' }, images: [], categories: [] };
    expect(() => groupWooProducts([listing])).toThrow(/no colour/);
  });
});

describe('error handler', () => {
  it('never leaks stack traces or driver text on unexpected errors', async () => {
    const { errorHandler } = await import('../src/middleware/error.js');
    let status;
    let payload;
    const res = {
      headersSent: false,
      status(s) {
        status = s;
        return this;
      },
      json(b) {
        payload = b;
      },
    };
    errorHandler(new Error('E11000 duplicate key at mongodb://secret-host'), { method: 'GET', originalUrl: '/x' }, res, () => {});
    expect(status).toBe(500);
    expect(payload).toEqual({ error: { code: 'INTERNAL', message: 'Something went wrong.' } });
  });
});

describe('phone schema', () => {
  it('stores the 10-digit form', () => {
    for (const v of ['+977 9812345678', '+977-98123-45678', '98 1234 5678', '9812345678']) {
      expect(phone.parse(v)).toBe('9812345678');
    }
    expect(phone.safeParse('+977 1234567890').success).toBe(false);
    expect(phone.safeParse('9512345678').success).toBe(false);
  });
});

describe('TRUST_PROXY', () => {
  it('parses hops, true, loopback and "off" values', async () => {
    const { parseTrustProxy } = await import('../src/config/env.js');
    expect(parseTrustProxy(undefined)).toBeUndefined();
    expect(parseTrustProxy('')).toBeUndefined();
    expect(parseTrustProxy('false')).toBeUndefined();
    expect(parseTrustProxy('true')).toBe(1);
    expect(parseTrustProxy('2')).toBe(2);
    expect(parseTrustProxy('loopback')).toBe('loopback');
  });
});
