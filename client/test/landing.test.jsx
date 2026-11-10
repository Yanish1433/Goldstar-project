import { describe, expect, it, beforeAll } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, RouterProvider, createMemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { shopTheme } from '../src/theme/shopTheme.js';
import { brand } from '../src/theme/tokens.js';
import { routes } from '../src/routes.jsx';
import { apiState } from '../src/api/client.js';
import Footer, { COLUMNS, CONTACT, SOCIAL } from '../src/components/Footer.jsx';
import { STORY_MODEL } from '../src/story/model.config.js';
import { BEATS, BEAT_START, BOXES, LANDING_KEYS, RANGE, beatCopy, bootLengthPx, colourAt, landingPose, showAt } from '../src/landing/showcase.js';

beforeAll(() => {
  apiState.mock = true;
});

const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

describe('brand palette (WCAG AA for text)', () => {
  const pairs = [
    ['onNight', 'night'], ['onNight2', 'night'], ['goldText', 'night'], ['goldText', 'navyDeep'], ['goldText', 'navy'],
    ['onNight', 'navy'], ['onNight2', 'navyDeep'], ['onNight2', 'nightRaised'], ['navy', 'paper'], ['ink2', 'paper'], ['onGold', 'gold'],
  ];
  pairs.forEach(([fg, bg]) => {
    it(`${fg} on ${bg} >= 4.5:1`, () => expect(contrast(brand[fg], brand[bg])).toBeGreaterThanOrEqual(4.5));
  });
  it('the WhatsApp button keeps 3:1 for its white icon', () => expect(contrast('#FFFFFF', brand.whatsapp)).toBeGreaterThanOrEqual(3));
});

describe('landing showcase timeline', () => {
  it('beats are in order inside the scroll range and their copy never overlaps the next beat', () => {
    BEATS.forEach((id, i) => {
      const w = beatCopy(id);
      expect(w.in[0]).toBeGreaterThan(0);
      if (w.out) expect(w.out[1]).toBeLessThanOrEqual(beatCopy(BEATS[i + 1]).in[0]);
      expect(BEAT_START[id]).toBeLessThan(RANGE);
    });
    expect(showAt(beatCopy('colour'), RANGE)).toBe(1);
  });
  it('the pose is continuous (no jumps) on desktop and phone', () => {
    ['desktop', 'phone'].forEach((layout) => {
      let prev = { ...landingPose(0, layout) };
      for (let t = 0.5; t <= RANGE; t += 0.5) {
        const o = landingPose(t, layout);
        expect(Math.abs(o.ry - prev.ry)).toBeLessThan(0.25); // fastest: the full turns into grip and colour
        expect(Math.abs(o.cx - prev.cx)).toBeLessThan(0.02);
        expect(Math.abs(o.fill - prev.fill)).toBeLessThan(0.03);
        prev = { ...o };
      }
    });
  });
  it('starts on the hero box (the poster render) and hits every key', () => {
    expect(landingPose(0, 'desktop')).toMatchObject({ cx: 0.68, cy: 0.55, w: 0.56, h: 0.74, fill: 0.9 });
    LANDING_KEYS.forEach((k) => expect(landingPose(k.t, 'desktop').ry).toBeCloseTo(k.ry, 6));
  });
  it('on phones the boot is big in the feature beats (>= 85% of the width) and the copy sits below it', () => {
    [[375, 667], [390, 844], [320, 568], [414, 896]].forEach(([W, H]) => {
      BEATS.forEach((id) => {
        const o = landingPose(BEAT_START[id] + 40, 'phone');
        expect(bootLengthPx(o, W, H, STORY_MODEL.frame) / W).toBeGreaterThanOrEqual(0.85);
      });
      const big = landingPose(150, 'phone');
      expect(bootLengthPx(big, W, H, STORY_MODEL.frame) / W).toBeGreaterThanOrEqual(0.9);
    });
    expect(BOXES.phone.side.cy + BOXES.phone.side.h / 2).toBeLessThan(0.625);
  });
  it('the boot fills the screen at the "G10" moment on desktop', () => {
    const o = landingPose(150, 'desktop');
    expect(bootLengthPx(o, 1440, 900, STORY_MODEL.frame) / 1440).toBeGreaterThan(0.45);
  });
  it('cycles every colourway in the colour beat', () => {
    const seen = new Set();
    for (let t = BEAT_START.colour; t <= RANGE; t += 1) seen.add(colourAt(t, 4));
    expect([...seen].sort()).toEqual([0, 1, 2, 3]);
    expect(colourAt(0, 4)).toBe(0);
  });
});

describe('footer', () => {
  const renderFooter = () => render(<ThemeProvider theme={shopTheme}><MemoryRouter><Footer /></MemoryRouter></ThemeProvider>);
  it('carries the company, contacts and address', () => {
    renderFooter();
    expect(screen.getByText('GOLDSTAR STRIDE LTD')).toBeInTheDocument();
    expect(screen.getByText('MADE WITH LOVE IN NEPAL')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: CONTACT.phone })).toHaveAttribute('href', 'tel:+9779801235097');
    expect(screen.getByRole('link', { name: CONTACT.email })).toHaveAttribute('href', 'mailto:inquire@goldstarstride.com');
    expect(screen.getByText('Sankha park, Ringroad, Kathmandu')).toBeInTheDocument();
    expect(screen.getByText('© 2025 GOLDSTAR SHOES | All Rights Reserved')).toBeInTheDocument();
    expect(document.getElementById('credits')).not.toBeNull();
  });
  it('has the four social buttons and the WhatsApp button', () => {
    renderFooter();
    const social = screen.getByRole('list', { name: 'Social media' });
    expect(within(social).getAllByRole('link').map((a) => a.getAttribute('aria-label'))).toEqual(SOCIAL.map((s) => `Goldstar on ${s.name}`));
    const wa = screen.getByRole('link', { name: 'Chat with Goldstar on WhatsApp' });
    expect(wa).toHaveAttribute('href', 'https://wa.me/9779801235097');
    expect(wa).toHaveAttribute('rel', 'noopener noreferrer');
  });
  it('lists Highlights, Support and Company with routed or external links', () => {
    renderFooter();
    expect(COLUMNS.map((c) => c.title)).toEqual(['Highlights', 'Support', 'Company']);
    const names = { Highlights: ['New Arrival', 'Best Seller', 'Women’s Collection', 'Men’s Collection', 'Best Deal'], Support: ['Privacy Policies', 'Track Order', 'Account Details', 'Lost Password', 'B2B'], Company: ['About', 'Career', 'Terms & Conditions'] };
    Object.entries(names).forEach(([title, labels]) => {
      const nav = screen.getByRole('navigation', { name: title });
      expect(within(nav).getAllByRole('link').map((a) => a.textContent)).toEqual(labels);
    });
    expect(screen.getByRole('link', { name: 'New Arrival' })).toHaveAttribute('href', '/shop?category=new-arrival');
    expect(screen.getByRole('link', { name: 'Track Order' })).toHaveAttribute('href', '/account');
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

describe('landing page (mock API, no WebGL: static tier)', () => {
  it('renders the showcase in flow mode, the colourways, the range and the brand band', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/'] });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <ThemeProvider theme={shopTheme}><QueryClientProvider client={qc}><RouterProvider router={router} /></QueryClientProvider></ThemeProvider>,
    );
    expect(await screen.findByRole('heading', { level: 1, name: /Built for every trail/ }, { timeout: 15000 })).toBeInTheDocument();
    expect(container.querySelector('[data-showcase="flow"]')).not.toBeNull();
    expect(container.querySelector('canvas')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Grip that reads the ground.' })).toBeInTheDocument();
    // Below the showcase the sections are lazy chunks that arrive after load.
    expect(await screen.findByRole('heading', { name: 'Pick your trail colour.' }, { timeout: 15000 })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Himalayan Earth, in stock/ }, { timeout: 15000 })).toHaveAttribute('href', '/product/g10-401?colour=olive');
    expect(await screen.findByRole('heading', { name: 'Shop the range.' }, { timeout: 15000 })).toBeInTheDocument();
    expect(await screen.findByText('AX-3', {}, { timeout: 15000 })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /From Kathmandu/ }, { timeout: 15000 })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Goldstar Shoes, home' }).length).toBe(2); // header + footer
  }, 30000);
});
