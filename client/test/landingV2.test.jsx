import { describe, expect, it, beforeAll, beforeEach } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { shopTheme } from '../src/theme/shopTheme.js';
import { tokensV2 } from '../src/landing-v2/tokensV2.js';
import LandingV2 from '../src/landing-v2/LandingV2.jsx';
import Hero3D from '../src/landing-v2/Hero3D.jsx';
import Marquee, { PROMISES } from '../src/landing-v2/Marquee.jsx';
import Categories, { CATEGORIES } from '../src/landing-v2/Categories.jsx';
import G10Band from '../src/landing-v2/G10Band.jsx';
import ShoeRail from '../src/landing-v2/ShoeRail.jsx';
import Heritage, { HERITAGE_LINES } from '../src/landing-v2/Heritage.jsx';
import Reviews3DV2 from '../src/landing-v2/Reviews3DV2.jsx';
import QuickViewModal from '../src/landing-v2/QuickViewModal.jsx';
import { apiState } from '../src/api/client.js';
import { useCart } from '../src/store/cart.js';

beforeAll(() => {
  apiState.mock = true;
});

const lum = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
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

const renderWithProviders = (ui) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider theme={shopTheme}>
        <MemoryRouter>{ui}</MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
};

describe('Landing (dark-room) palette', () => {
  describe('contrast (WCAG)', () => {
    it('ivory ink on the ground meets AAA (>= 7:1)', () => expect(contrast(tokensV2.ivory, tokensV2.ground)).toBeGreaterThanOrEqual(7));
    it('secondary ivory on the ground still meets AAA for running text (>= 7:1)', () => expect(contrast(tokensV2.ivoryDim, tokensV2.ground)).toBeGreaterThanOrEqual(7));
    it('faint labels on the ground meet AA (>= 4.5:1)', () => expect(contrast(tokensV2.ivoryFaint, tokensV2.ground)).toBeGreaterThanOrEqual(4.5));
    it('the gold accent on the ground meets AA (>= 4.5:1)', () => expect(contrast(tokensV2.gold, tokensV2.ground)).toBeGreaterThanOrEqual(4.5));
    it('the gold accent on raised ground meets AA (>= 4.5:1)', () => expect(contrast(tokensV2.gold, tokensV2.groundRaised)).toBeGreaterThanOrEqual(4.5));
    it('text on a gold button meets AA (>= 4.5:1)', () => expect(contrast(tokensV2.onGold, tokensV2.gold)).toBeGreaterThanOrEqual(4.5));
    it('ink on ivory surfaces meets AAA (>= 7:1)', () => expect(contrast(tokensV2.inkOnPaper, tokensV2.paper)).toBeGreaterThanOrEqual(7));
    it('secondary ink on ivory surfaces meets AA (>= 4.5:1)', () => expect(contrast(tokensV2.inkOnPaper2, tokensV2.paper)).toBeGreaterThanOrEqual(4.5));
    it('the deep accent on ivory surfaces meets AA (>= 4.5:1)', () => expect(contrast(tokensV2.goldDeep, tokensV2.paper)).toBeGreaterThanOrEqual(4.5));
    it('plain gold on ivory would fail AA for text (why goldDeep exists)', () => expect(contrast(tokensV2.gold, tokensV2.paper)).toBeLessThan(4.5));
  });

  it('only tokensV2.js holds colour values: no hex or hand-written rgba() in any landing component', () => {
    const dir = join(dirname(fileURLToPath(import.meta.url)), '../src/landing-v2');
    const offenders = readdirSync(dir)
      .filter((f) => /\.jsx?$/.test(f) && f !== 'tokensV2.js')
      .filter((f) => /#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(readFileSync(join(dir, f), 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('one accent hue: every chromatic token is the gold family (ground, ivory and ink are near-neutral)', () => {
    const hue = (hex) => {
      const n = parseInt(hex.slice(1), 16);
      const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      if (mx - mn < 0.0001) return null;
      const d = mx - mn;
      const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      return { h: (h * 60 + 360) % 360, s: d / (1 - Math.abs(mx + mn - 1)) };
    };
    Object.entries(tokensV2)
      .filter(([, v]) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v))
      .forEach(([k, v]) => {
        const c = hue(v);
        if (!c || c.s < 0.2) return; // neutral
        expect([k, c.h >= 25 && c.h <= 50]).toEqual([k, true]); // warm gold/amber family only
      });
  });
});

describe('Landing sections', () => {
  beforeEach(() => useCart.setState({ lines: [] }));

  it('Hero3D: editorial h1, poster image first (LCP), shop + G10 CTAs', () => {
    const { container } = renderWithProviders(<Hero3D />);
    expect(screen.getByRole('heading', { level: 1, name: /Made in Nepal\. Built for the Himalaya\./i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Shop all footwear/i })).toHaveAttribute('href', '/shop');
    expect(screen.getByRole('link', { name: /Explore G10 in 3D/i })).toHaveAttribute('href', '/g10');
    const poster = container.querySelector('[data-poster] img');
    expect(poster).toHaveAttribute('fetchpriority', 'high');
    expect(poster).toHaveAttribute('width', '1100');
    expect(container.querySelector('[data-poster] source')).toHaveAttribute('srcset', '/img/hero/boot-phone.webp');
    // jsdom has no WebGL: the still path, no canvas.
    expect(container.querySelector('canvas')).toBeNull();
    expect(container.querySelector('[data-hero]')).toHaveAttribute('data-hero', 'still');
  });

  it('Marquee: lists every promise once for assistive tech (the loop copy is hidden)', () => {
    renderWithProviders(<Marquee />);
    const region = screen.getByRole('region', { name: 'Why Goldstar' });
    PROMISES.forEach((p) => expect(within(region).getAllByText(p)).toHaveLength(2));
    expect(within(region).getAllByRole('listitem', { hidden: false })).toHaveLength(PROMISES.length);
  });

  it('Categories: Men, Women, Kids and Trek entries link into the shop', () => {
    renderWithProviders(<Categories />);
    expect(screen.getByRole('heading', { level: 2, name: /A shoe for every road in Nepal/i })).toBeInTheDocument();
    CATEGORIES.forEach((c) => expect(screen.getByRole('link', { name: new RegExp(`^Shop ${c.label}`) })).toHaveAttribute('href', c.to));
  });

  it('G10Band: featured G10-401 with real model counts, links to /g10 and the product', async () => {
    renderWithProviders(<G10Band />);
    expect(screen.getByRole('heading', { level: 2, name: /G10-401/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explore G10 in 3D/i })).toHaveAttribute('href', '/g10');
    expect(screen.getByRole('link', { name: /Buy the G10-401/i })).toHaveAttribute('href', '/product/g10-401');
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(await screen.findByText(/From NPR [0-9,]+/, {}, { timeout: 8000 })).toBeInTheDocument();
  });

  it('ShoeRail: product cards link to products, quick view opens, add to cart adds a proper cart line', async () => {
    const seen = [];
    renderWithProviders(<ShoeRail onQuickView={(p, c) => seen.push([p.slug, c.key])} />);
    expect(screen.getByRole('heading', { level: 2, name: /Best sellers, side by side/i })).toBeInTheDocument();
    const card = await screen.findByRole('article', { name: 'G10-401' }, { timeout: 5000 });
    expect(within(card).getAllByRole('link')[0].getAttribute('href')).toMatch(/^\/product\/g10-401\?colour=/);
    fireEvent.click(within(card).getByRole('button', { name: /Quick view G10-401/ }));
    expect(seen[0][0]).toBe('g10-401');
    fireEvent.click(within(card).getByRole('button', { name: /^Add G10-401/ }));
    const lines = useCart.getState().lines;
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ slug: 'g10-401', qty: 1 });
    expect(lines[0].colourwayName).toBeTruthy();
    expect(screen.getByRole('link', { name: /See every shoe/ })).toHaveAttribute('href', '/shop');
  });

  it('QuickViewModal: pick a size and add to cart', async () => {
    const product = {
      id: 'p1', slug: 'ax-3', name: 'AX-3', categories: [],
      colourways: [{ key: 'black', name: 'Black', hex: '#111111', price: 2000, regularPrice: 2700, inStock: true, sizes: ['6', '7', '8'], image: { thumb: '/x.webp' } }],
    };
    renderWithProviders(<QuickViewModal open onClose={() => {}} product={product} initialColour={product.colourways[0]} />);
    expect(screen.getByRole('heading', { name: 'AX-3' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '7' }));
    fireEvent.click(screen.getByRole('button', { name: /Add to cart/ }));
    expect(useCart.getState().lines[0]).toMatchObject({ slug: 'ax-3', size: '7', colourwayKey: 'black' });
  });

  it('Heritage: the Made in Nepal story', () => {
    renderWithProviders(<Heritage />);
    expect(screen.getByRole('heading', { level: 2, name: new RegExp(HERITAGE_LINES.join('\\s*')) })).toBeInTheDocument();
    expect(screen.getByText(/नेपालको आफ्नै पाइला/)).toBeInTheDocument();
  });

  it('Reviews3DV2 (kept): testimonials with verified badges', () => {
    renderWithProviders(<Reviews3DV2 />);
    expect(screen.getByRole('heading', { level: 2, name: /Tested on the Trails. Loved in the City/i })).toBeInTheDocument();
    expect(screen.getByText(/Bikash Shrestha/i)).toBeInTheDocument();
    expect(screen.getByText(/Pooja Thapa/i)).toBeInTheDocument();
    expect(screen.getByText(/Suman Gurung/i)).toBeInTheDocument();
  });

  it('LandingV2: every section in order, hero first and reviews last', () => {
    const { container } = renderWithProviders(<LandingV2 />);
    expect(screen.getByRole('heading', { level: 1, name: /Made in Nepal/i })).toBeInTheDocument();
    const ids = [...container.querySelectorAll('#landing-v2 > section, #landing-v2 > *')].map((el) => el.id || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')).filter(Boolean);
    expect(ids).toEqual(['landing-h1', 'Why Goldstar', 'categories', 'g10', 'all-shoes', 'heritage', 'reviews-section']);
  });
});
