import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { TOUCH_QUERY, TOUCH, PHONE_QUERY } from '../src/landing-v2/tokensV2.js';
import { Steps, STEPS_NARROW } from '../src/components/shop/kit.jsx';
import { shopTheme } from '../src/theme/shopTheme.js';
import { makeAdminTheme, ADMIN_COARSE } from '../src/theme/adminTheme.js';
import Logo from '../src/landing/Logo.jsx';

// Media features used here: width / height / orientation / pointer, evaluated against a device description.
function matches(query, { w, h, coarse = false }) {
  return query.split(',').some((part) => {
    const feats = [...part.matchAll(/\(([^)]+)\)/g)].map((m) => m[1].replace(/\s/g, ''));
    return feats.every((f) => {
      const [k, v] = f.split(':');
      const n = parseFloat(v);
      if (k === 'orientation') return v === (w > h ? 'landscape' : 'portrait');
      if (k === 'pointer') return v === (coarse ? 'coarse' : 'fine');
      if (k === 'max-width') return w <= n;
      if (k === 'min-width') return w >= n;
      if (k === 'max-height') return h <= n;
      if (k === 'min-height') return h >= n;
      throw new Error(`unknown feature ${k}`);
    });
  });
}

const MOUSE_DESKTOP = [[1280, 600], [1280, 800], [1366, 657], [1440, 900], [1920, 1080], [2560, 1440], [1024, 768]];
const TABLETS = [[768, 1024], [820, 1180], [1024, 768], [1024, 1366]];
const PHONES = [[320, 568], [360, 740], [375, 667], [390, 844], [414, 896], [430, 932], [568, 320], [667, 375], [844, 390], [932, 430]];

describe('responsive: touch-sized controls', () => {
  it('TOUCH covers every phone and every touch tablet, never a mouse desktop', () => {
    expect(TOUCH).toBe(`@media ${TOUCH_QUERY}`);
    expect(TOUCH_QUERY.startsWith(PHONE_QUERY)).toBe(true);
    PHONES.forEach(([w, h]) => expect(matches(TOUCH_QUERY, { w, h, coarse: true }), `${w}x${h}`).toBe(true));
    TABLETS.forEach(([w, h]) => expect(matches(TOUCH_QUERY, { w, h, coarse: true }), `tablet ${w}x${h}`).toBe(true));
    MOUSE_DESKTOP.forEach(([w, h]) => expect(matches(TOUCH_QUERY, { w, h }), `desktop ${w}x${h}`).toBe(false));
  });
  it('admin: 44px controls on a touch tablet, dense 40px with a mouse', () => {
    const t = makeAdminTheme('light');
    const btn = t.components.MuiButton.styleOverrides.root;
    expect(btn.minHeight).toBe(40);
    expect(btn[ADMIN_COARSE].minHeight).toBe(44);
    expect(t.components.MuiIconButton.styleOverrides.root[ADMIN_COARSE]).toEqual({ width: 44, height: 44 });
    expect(t.components.MuiTableCell.styleOverrides.root[ADMIN_COARSE]['& a:not(.MuiButtonBase-root)'].paddingBlock).toBe(14);
    expect(matches(ADMIN_COARSE.replace('@media ', ''), { w: 1024, h: 768, coarse: true })).toBe(true);
    expect(matches(ADMIN_COARSE.replace('@media ', ''), { w: 1024, h: 768 })).toBe(false);
  });
});

describe('responsive: checkout steps at 320px', () => {
  it('under 380px only the current step keeps a visible label; all three stay readable', () => {
    expect(STEPS_NARROW).toBe('@media (max-width: 379.95px)');
    render(<ThemeProvider theme={shopTheme}><Steps current={1} /></ThemeProvider>);
    const list = screen.getByRole('list', { name: 'Checkout progress' });
    expect(list.textContent).toMatch(/Cart/);
    expect(list.textContent).toMatch(/Delivery/);
    expect(list.textContent).toMatch(/Confirmed/);
    expect(list.querySelector('[aria-current="step"]').textContent).toMatch(/Delivery/);
  });
});

describe('responsive: logo never stretches', () => {
  it('a squeezed box contains the artwork (object-fit contain, left aligned)', () => {
    const { container } = render(<div style={{ width: 100 }}><Logo tone="white" sx={{ height: 34 }} /></div>);
    const img = container.querySelector('img');
    const cs = getComputedStyle(img);
    expect(cs.objectFit).toBe('contain');
    expect(cs.maxWidth).toBe('100%');
  });
});
