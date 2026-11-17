import { describe, it, expect, vi } from 'vitest';
import { byPageOrder, assertPinsInOrder } from '../src/landing-v2/motion.js';

// Regression for the shelf/gallery overlap: triggers must refresh in page order whatever order they were built in.
function page() {
  document.body.innerHTML = '<div id="landing-v2"><section id="a"><div id="pa"></div></section><section id="b"><div id="pb"></div></section><section id="c"><div id="pc"></div></section></div>';
  return ['pa', 'pb', 'pc'].map((id) => document.getElementById(id));
}

describe('landing ScrollTrigger order', () => {
  it('sorts triggers by DOM position, not creation order', () => {
    const [a, b, c] = page();
    const sts = [{ n: 'c', trigger: c }, { n: 'none', trigger: null }, { n: 'a', trigger: a }, { n: 'b', trigger: b }, { n: 'a2', trigger: a }];
    expect(sts.sort(byPageOrder).map((s) => s.n)).toEqual(['a', 'a2', 'b', 'c', 'none']);
  });

  it('flags pins that overlap in scroll space, and a doubled pin', () => {
    const [a, b, c] = page();
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const ok = { getAll: () => [{ pin: a, trigger: a, start: 0, end: 800 }, { pin: b, trigger: b, start: 900, end: 1800 }] };
    expect(assertPinsInOrder(ok)).toEqual([]);
    const bad = { getAll: () => [{ pin: a, trigger: a, start: 0, end: 800 }, { pin: c, trigger: c, start: 5786, end: 6742 }, { pin: b, trigger: b, start: 5722, end: 6708 }, { pin: b, trigger: b, start: 7000, end: 7100 }] };
    const errs = assertPinsInOrder(bad);
    expect(errs.some((e) => /^c starts at 5786 before b releases/.test(e))).toBe(true);
    expect(errs.some((e) => /pinned twice: b/.test(e))).toBe(true);
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});

import { startLenis, LENIS_OPTS } from '../src/landing-v2/smooth.js';

describe('landing Lenis owner', () => {
  const fakes = () => {
    const ticker = { fns: new Set(), add: vi.fn((f) => ticker.fns.add(f)), remove: vi.fn((f) => ticker.fns.delete(f)), lagSmoothing: vi.fn() };
    const made = [];
    class Lenis { constructor(o) { this.o = o; this.destroyed = false; made.push(this); } on(e, f) { this.ev = [e, f]; } raf() {} destroy() { this.destroyed = true; } }
    return { gsap: { ticker }, ST: { update: () => {} }, Lenis, made, ticker };
  };

  it('creates one instance on the GSAP ticker and tears it down fully', () => {
    window.__lenis = null;
    const f = fakes();
    const stop = startLenis(f.gsap, f.ST, f.Lenis);
    expect(f.made).toHaveLength(1);
    expect(f.made[0].o).toMatchObject({ autoRaf: false, syncTouch: false, lerp: LENIS_OPTS.lerp });
    expect(f.made[0].ev[0]).toBe('scroll');
    expect(window.__lenis).toBe(f.made[0]);
    expect(f.ticker.fns.size).toBe(1);
    expect(f.ticker.lagSmoothing).toHaveBeenLastCalledWith(0);
    stop();
    expect(f.made[0].destroyed).toBe(true);
    expect(f.ticker.fns.size).toBe(0);
    expect(window.__lenis).toBe(null);
    expect(f.ticker.lagSmoothing).toHaveBeenLastCalledWith(500, 33);
  });

  it('never makes a second instance when another owner (the /g10 story) holds the scroll', () => {
    const other = {};
    window.__lenis = other;
    const f = fakes();
    const stop = startLenis(f.gsap, f.ST, f.Lenis);
    expect(f.made).toHaveLength(0);
    stop();
    expect(window.__lenis).toBe(other);
    window.__lenis = null;
  });
});
