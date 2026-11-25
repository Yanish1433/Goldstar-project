import { describe, it, expect, vi } from 'vitest';
import { leaveOnClick } from '../src/lib/useBackToClose.js';

const click = (href, o = {}) => {
  const a = document.createElement('a');
  if (href) a.setAttribute('href', href);
  return { currentTarget: a, button: 0, defaultPrevented: false, preventDefault: vi.fn(), ...o };
};

describe('leaveOnClick', () => {
  it('routes a plain click on an in-app link through leave()', () => {
    const leave = vi.fn();
    const e = click('/shop?category=new-arrival');
    leaveOnClick(leave)(e);
    expect(e.preventDefault).toHaveBeenCalled();
    expect(leave).toHaveBeenCalledWith('/shop?category=new-arrival');
  });
  it('leaves new-tab / modified / external clicks to the browser', () => {
    const leave = vi.fn();
    for (const e of [click('/shop', { metaKey: true }), click('/shop', { ctrlKey: true }), click('/shop', { button: 1 }), click('https://x.y/'), click('/shop', { defaultPrevented: true })]) {
      leaveOnClick(leave)(e);
      expect(e.preventDefault).not.toHaveBeenCalled();
    }
    expect(leave).not.toHaveBeenCalled();
  });
});
