import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router';
import RouteScrollTop from '../src/components/RouteScrollTop.jsx';

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
});
