import { describe, expect, it } from 'vitest';
import { SHORT_QUERY, SHORT } from '../src/landing-v2/tokensV2.js';
import { MQ } from '../src/landing-v2/motion.js';
import { HL_SIZE_SHORT } from '../src/landing-v2/KineticHero.jsx';
import { WA_AVOID_QUERY } from '../src/components/Footer.jsx';

// A tiny evaluator for the media features these queries use (width / height / orientation), so the guards can be
// checked against real viewport sizes without a browser.
function matches(query, w, h) {
  return query.split(',').some((part) => {
    const feats = [...part.matchAll(/\(([^)]+)\)/g)].map((m) => m[1].replace(/\s/g, ''));
    return feats.every((f) => {
      const [k, v] = f.split(':');
      const n = parseFloat(v);
      if (k === 'orientation') return v === (w > h ? 'landscape' : 'portrait');
      if (k === 'max-width') return w <= n;
      if (k === 'min-width') return w >= n;
      if (k === 'max-height') return h <= n;
      if (k === 'min-height') return h >= n;
      throw new Error(`unknown feature ${k}`);
    });
  });
}

const DESKTOP = [[1920, 1080], [1536, 730], [1440, 900], [1366, 657], [1280, 600], [1280, 720], [1024, 768]];
const LANDSCAPE_PHONES = [[568, 320], [667, 375], [844, 390], [932, 430]];
const PORTRAIT = [[320, 568], [375, 667], [390, 844], [430, 932], [768, 1024]];

describe('phone: landscape (SHORT) guard', () => {
  it('SHORT is the landscape query', () => {
    expect(SHORT).toBe(`@media ${SHORT_QUERY}`);
    expect(MQ.short).toBe(SHORT_QUERY.replace(/:/g, ': '));
  });
  it('never matches a desktop window, always matches a landscape phone', () => {
    DESKTOP.forEach(([w, h]) => expect(matches(SHORT_QUERY, w, h), `${w}x${h}`).toBe(false));
    LANDSCAPE_PHONES.forEach(([w, h]) => expect(matches(SHORT_QUERY, w, h), `${w}x${h}`).toBe(true));
    PORTRAIT.forEach(([w, h]) => expect(matches(SHORT_QUERY, w, h), `${w}x${h}`).toBe(false));
  });
  it('motion tiers: desktop keeps the desk scenes; every phone (932x430 included) takes the phone branch; exclusive', () => {
    DESKTOP.forEach(([w, h]) => {
      expect(matches(MQ.desk, w, h), `${w}x${h}`).toBe(true);
      expect(matches(MQ.phone, w, h), `${w}x${h}`).toBe(false);
    });
    [...LANDSCAPE_PHONES, ...PORTRAIT.filter(([w]) => w < 900)].forEach(([w, h]) => {
      expect(matches(MQ.phone, w, h), `${w}x${h}`).toBe(true);
      expect(matches(MQ.desk, w, h), `${w}x${h}`).toBe(false);
    });
  });
  it('the WhatsApp step-aside runs on phones only', () => {
    DESKTOP.forEach(([w, h]) => expect(matches(WA_AVOID_QUERY, w, h), `${w}x${h}`).toBe(false));
    LANDSCAPE_PHONES.forEach(([w, h]) => expect(matches(WA_AVOID_QUERY, w, h), `${w}x${h}`).toBe(true));
  });
  it('the landscape hero headline is capped by the height', () => {
    expect(HL_SIZE_SHORT).toMatch(/svh/);
  });
});
