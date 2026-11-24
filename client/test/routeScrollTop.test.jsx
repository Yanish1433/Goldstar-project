import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, Outlet, ScrollRestoration } from 'react-router';
import RouteScrollTop, { scrollTopForColour, restoreStep } from '../src/components/RouteScrollTop.jsx';

function setup(initial = ['/product/a']) {
  const router = createMemoryRouter(
    [{ element: <><Outlet /><RouteScrollTop /></>, children: [{ path: '*', element: <div /> }] }],
    { initialEntries: initial },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe('RouteScrollTop', () => {
  let spy;
  beforeEach(() => {
    spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    window.__lenis = { scrollTo: vi.fn() };
  });
  afterEach(() => { spy.mockRestore(); delete window.__lenis; });

  it('scrolls to 0 (and zeroes Lenis) on a push to another pathname', async () => {
    const r = setup();
    await act(async () => { await r.navigate('/product/b'); });
    expect(spy).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
    expect(window.__lenis.scrollTo).toHaveBeenCalledWith(0, { immediate: true, force: true });
  });
  it('does not move on a colour switch (same path, replace)', async () => {
    const r = setup();
    await act(async () => { await r.navigate('/product/a?colour=x', { replace: true }); });
    expect(spy).not.toHaveBeenCalled();
  });
  it('leaves Back/Forward to ScrollRestoration', async () => {
    const r = setup();
    await act(async () => { await r.navigate('/product/b'); });
    spy.mockClear();
    await act(async () => { await r.navigate(-1); });
    expect(spy).not.toHaveBeenCalled();
  });
  it('leaves hash links alone', async () => {
    const r = setup(['/']);
    await act(async () => { await r.navigate('/g10#story'); });
    expect(spy).not.toHaveBeenCalled();
  });

  it('a colour change scrolls smoothly to the top, only when scrolled down', () => {
    window.matchMedia = window.matchMedia || (() => ({ matches: false }));
    Object.defineProperty(window, 'scrollY', { value: 500, configurable: true });
    scrollTopForColour();
    expect(spy).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'smooth' });
    spy.mockClear();
    Object.defineProperty(window, 'scrollY', { value: 3, configurable: true });
    scrollTopForColour();
    expect(spy).not.toHaveBeenCalled();
  });
  it('the router guard itself ignores a colour replace (the swatch handler owns it)', async () => {
    const r = setup();
    await act(async () => { await r.navigate('/product/a?colour=x', { replace: true }); });
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('restoreStep', () => {
  it('waits while the page is too short, applies when reachable and off target, is done when there', () => {
    expect(restoreStep({ target: 2000, scrollY: 900, maxScroll: 1200 })).toBe('wait');
    expect(restoreStep({ target: 2000, scrollY: 900, maxScroll: 2600 })).toBe('apply');
    expect(restoreStep({ target: 2000, scrollY: 2001, maxScroll: 2600 })).toBe('done');
    expect(restoreStep({ target: 2000, scrollY: 1998, maxScroll: 2600 })).toBe('apply');
  });
});

describe('RouteScrollTop Back restore', () => {
  let spy; let y; let h; let rafs;
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    y = 0; h = 5000;
    rafs = 0;
    Object.defineProperty(window, 'scrollY', { get: () => y, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { get: () => h, configurable: true });
    // scrollTo behaves like a browser: clamped to the page height.
    spy = vi.spyOn(window, 'scrollTo').mockImplementation((a, b) => {
      const top = typeof a === 'object' ? a.top : b;
      y = Math.max(0, Math.min(top, h - 800));
    });
  });
  afterEach(() => { vi.useRealTimers(); spy.mockRestore(); delete window.scrollY; delete window.innerHeight; delete document.documentElement.scrollHeight; });

  const setupRestore = () => {
    const router = createMemoryRouter(
      [{ element: <><Outlet /><ScrollRestoration /><RouteScrollTop /></>, children: [{ path: '*', element: <div /> }] }],
      { initialEntries: ['/shop'] },
    );
    render(<RouterProvider router={router} />);
    return router;
  };
  const frames = async (n) => { for (let i = 0; i < n; i += 1) await act(async () => { vi.advanceTimersByTime(17); }); };

  it('re-applies the saved y after the page grows, and stops at the first wheel', async () => {
    const r = setupRestore();
    y = 2000;
    await act(async () => { await r.navigate('/product/a'); });
    expect(y).toBe(0);
    h = 1000; // product page is short when we come back: the restore is clamped
    await act(async () => { await r.navigate(-1); });
    expect(y).toBeLessThan(2000);
    h = 5000; // content arrives
    await frames(4);
    expect(y).toBe(2000);
    // A second Back/Forward cycle: shopper scrolls by hand, the guard must not fight them.
    await act(async () => { await r.navigate('/product/b'); });
    y = 1500;
    h = 1000;
    await act(async () => { await r.navigate(-1); });
    window.dispatchEvent(new Event('wheel'));
    h = 5000;
    y = 300;
    spy.mockClear();
    await frames(4);
    expect(spy).not.toHaveBeenCalled();
    expect(y).toBe(300);
  });
});
