import { describe, it, expect } from 'vitest';
import { forgetStaleLoadScroll, SCROLL_KEY } from '../src/lib/freshLoadScroll.js';

const store = (v) => { const m = new Map(v ? [[SCROLL_KEY, JSON.stringify(v)]] : []); return { getItem: (k) => m.get(k) ?? null, setItem: (k, x) => m.set(k, x), read: () => JSON.parse(m.get(SCROLL_KEY)) }; };

describe('forgetStaleLoadScroll', () => {
  it('drops the "default" position on a fresh load, keeps the rest', () => {
    const s = store({ default: 1500, abc123: 400 });
    expect(forgetStaleLoadScroll(s, 'navigate')).toBe(true);
    expect(s.read()).toEqual({ abc123: 400 });
  });
  it('keeps it on reload and back/forward', () => {
    for (const t of ['reload', 'back_forward']) {
      const s = store({ default: 1500 });
      expect(forgetStaleLoadScroll(s, t)).toBe(false);
      expect(s.read()).toEqual({ default: 1500 });
    }
  });
  it('copes with nothing saved or junk', () => {
    expect(forgetStaleLoadScroll(store(null), 'navigate')).toBe(false);
    const bad = { getItem: () => '{not json', setItem: () => {} };
    expect(forgetStaleLoadScroll(bad, 'navigate')).toBe(false);
  });
});
