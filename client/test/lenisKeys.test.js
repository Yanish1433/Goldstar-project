import { describe, it, expect, vi } from 'vitest';
import { shouldReleaseGlide, bindGlideRelease, keyTarget } from '../src/lib/lenisKeys.js';

const ev = (key, o = {}) => ({ key, target: document.body, ...o });

describe('shouldReleaseGlide', () => {
  it('accepts scroll keys', () => {
    for (const k of ['Home', 'End', 'PageUp', 'PageDown', ' ', 'ArrowUp', 'ArrowDown']) expect(shouldReleaseGlide(ev(k))).toBe(true);
  });
  it('ignores other keys, modifiers, prevented', () => {
    expect(shouldReleaseGlide(ev('a'))).toBe(false);
    expect(shouldReleaseGlide(ev('Home', { altKey: true }))).toBe(false);
    expect(shouldReleaseGlide(ev('PageDown', { ctrlKey: true }))).toBe(false);
    expect(shouldReleaseGlide(ev('Home', { ctrlKey: true }))).toBe(true);
    expect(shouldReleaseGlide(ev('Home', { defaultPrevented: true }))).toBe(false);
  });
  it('ignores typing targets; soft keys ignore buttons/radios', () => {
    const input = document.createElement('input');
    const btn = document.createElement('button');
    const radio = document.createElement('div'); radio.setAttribute('role', 'radio');
    expect(shouldReleaseGlide(ev('Home', { target: input }))).toBe(false);
    expect(shouldReleaseGlide(ev(' ', { target: btn }))).toBe(false);
    expect(shouldReleaseGlide(ev('ArrowDown', { target: radio }))).toBe(false);
    expect(shouldReleaseGlide(ev('Home', { target: btn }))).toBe(true);
  });
});

describe('keyTarget', () => {
  it('maps keys to a clamped target', () => {
    expect(keyTarget({ key: 'Home' }, 5000, 9000, 800)).toBe(0);
    expect(keyTarget({ key: 'End' }, 5000, 9000, 800)).toBe(9000);
    expect(keyTarget({ key: 'PageUp' }, 5000, 9000, 800)).toBe(4300);
    expect(keyTarget({ key: 'PageDown' }, 5000, 9000, 800)).toBe(5700);
    expect(keyTarget({ key: ' ' }, 5000, 9000, 800)).toBe(5700);
    expect(keyTarget({ key: ' ', shiftKey: true }, 5000, 9000, 800)).toBe(4300);
    expect(keyTarget({ key: 'ArrowDown' }, 8990, 9000, 800)).toBe(9000);
    expect(keyTarget({ key: 'PageUp' }, 100, 9000, 800)).toBe(0);
  });
});

describe('bindGlideRelease', () => {
  it('steers the glide only mid smooth glide, and unbinds', () => {
    const lenis = { isScrolling: 'smooth', reset: vi.fn(), scrollTo: vi.fn() };
    const off = bindGlideRelease(lenis);
    const e1 = new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true });
    document.body.dispatchEvent(e1);
    expect(lenis.reset).toHaveBeenCalledTimes(1);
    expect(lenis.scrollTo).toHaveBeenCalledWith(0);
    expect(e1.defaultPrevented).toBe(true);
    lenis.isScrolling = false;
    const e2 = new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true });
    document.body.dispatchEvent(e2);
    expect(lenis.scrollTo).toHaveBeenCalledTimes(1);
    expect(e2.defaultPrevented).toBe(false);
    off();
    lenis.isScrolling = 'smooth';
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(lenis.scrollTo).toHaveBeenCalledTimes(1);
  });
});
