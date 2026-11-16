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
