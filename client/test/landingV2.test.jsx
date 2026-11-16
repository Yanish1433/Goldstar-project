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
import KineticHero, { HERO_LINES } from '../src/landing-v2/KineticHero.jsx';
import Ticker, { RANGES } from '../src/landing-v2/Ticker.jsx';
import CollectionStack, { COLLECTIONS } from '../src/landing-v2/CollectionStack.jsx';
import PopShelf from '../src/landing-v2/PopShelf.jsx';
import DetailGallery, { DETAILS } from '../src/landing-v2/DetailGallery.jsx';
import Heritage, { HERITAGE_LINES } from '../src/landing-v2/Heritage.jsx';
import Reviews3DV2 from '../src/landing-v2/Reviews3DV2.jsx';
import QuickViewModal from '../src/landing-v2/QuickViewModal.jsx';
import { localise, shelfPhoto } from '../src/landing-v2/shots.js';
import { FONT_STACK } from '../src/theme/tokens.js';
import AppBar from '../src/components/AppBar.jsx';
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

const here = dirname(fileURLToPath(import.meta.url));
const landingDir = join(here, '../src/landing-v2');
const landingFiles = () => readdirSync(landingDir).filter((f) => /\.jsx?$/.test(f));

describe('Landing guards (round 2)', () => {
  it('no 3D on "/": nothing in landing-v2 (or the / page) imports three, @react-three or the G10 story', () => {
    const srcs = [...landingFiles().map((f) => join(landingDir, f)), join(here, '../src/pages/Landing.jsx')];
    const offenders = srcs.filter((f) => /from ['"](three|@react-three\/[^'"]+)['"]|from ['"]\.\.\/(three|story)\//.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('the display font is scoped to the landing: the theme FONT_STACK is unchanged', () => {
    expect(FONT_STACK).not.toMatch(/Sofia/);
    expect(FONT_STACK).toMatch(/Archivo/);
    const themeDir = join(here, '../src/theme');
    readdirSync(themeDir).forEach((f) => expect([f, /Sofia/.test(readFileSync(join(themeDir, f), 'utf8'))]).toEqual([f, false]));
  });

  it('every photo is served locally: API image URLs map onto public/img/catalogue, nothing hotlinks goldstarshoes.com', () => {
    expect(localise('https://goldstarshoes.com/wp-content/uploads/2025/09/C_M09888-1-1-scaled-2-800x800.webp')).toBe('/img/catalogue/C_M09888-1-1-scaled-2-800x800.webp');
    expect(localise('https://goldstarshoes.com/wp-content/uploads/2025/09/C_M09888-1-1-scaled-2.webp')).toBe('/img/catalogue/C_M09888-1-1-scaled-2-800x800.webp');
    const cat = readdirSync(join(here, '../public/img/catalogue'));
    expect(cat).toContain(shelfPhoto({ slug: 'ax-3' }, { key: 'grey' }).thumb.split('/').pop());
    const offenders = landingFiles().filter((f) => /src=\{?["'`]https?:\/\/goldstarshoes/.test(readFileSync(join(landingDir, f), 'utf8')));
    expect(offenders).toEqual([]);
  });

  const renderBar = (path) => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={qc}><ThemeProvider theme={shopTheme}><MemoryRouter initialEntries={[path]}><AppBar /></MemoryRouter></ThemeProvider></QueryClientProvider>,
    );
  };

  it('the AppBar is fixed, with a bar background and an AA logo on the light store routes', () => {
    const { container } = renderBar('/shop');
    const header = container.querySelector('header');
    expect(header.className).toMatch(/MuiAppBar-positionFixed/);
    expect(header).toHaveAttribute('data-bar', 'light');
    // ink wordmark and the deep-gold Nepali mark on the light bar ground
    expect(contrast('#16120E', '#F6F2EA')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#75561A', '#F6F2EA')).toBeGreaterThanOrEqual(4.5);
    // ivory wordmark on the landing's dark bar (and on the dark hero while the bar is clear at scroll 0)
    expect(contrast('#F2EDE3', '#0D0C0A')).toBeGreaterThanOrEqual(4.5);
  });

  it('the AppBar is clear only at the top of the landing, and frosted on /g10', () => {
    expect(renderBar('/').container.querySelector('header')).toHaveAttribute('data-bar', 'clear');
    expect(renderBar('/g10').container.querySelector('header')).toHaveAttribute('data-bar', 'story');
  });
});

describe('Landing sections', () => {
  beforeEach(() => useCart.setState({ lines: [] }));

  it('KineticHero: whole headline at first paint (aria-label on the h1), real LCP <img>, both CTAs, no canvas', () => {
    const { container } = renderWithProviders(<KineticHero />);
    const h1 = screen.getByRole('heading', { level: 1, name: /Walk the world/i });
    HERO_LINES.forEach((l) => expect(h1).toHaveTextContent(new RegExp(l, 'i')));
    expect(screen.getByRole('link', { name: /Shop all footwear/i })).toHaveAttribute('href', '/shop');
    expect(screen.getByRole('link', { name: /^G10 in 3D/i })).toHaveAttribute('href', '/g10');
    const img = container.querySelector('[data-win] img');
    expect(img).toHaveAttribute('fetchpriority', 'high');
    expect(img).toHaveAttribute('width', '1600');
    expect(img.getAttribute('srcset')).toMatch(/800w.*1600w/);
    expect(img.getAttribute('src')).toMatch(/^\/img\/catalogue\//);
    expect(container.querySelector('canvas')).toBeNull();
  });

  it('Ticker: lists every collection once for assistive tech (the scrolling rows are hidden)', () => {
    renderWithProviders(<Ticker />);
    const region = screen.getByRole('region', { name: 'Goldstar collections' });
    expect(within(region).getAllByRole('listitem').map((li) => li.textContent)).toEqual(RANGES);
  });

  it('CollectionStack: Trek Everyday, Sneak into Comfort, Women and Kids cards link into the shop', () => {
    renderWithProviders(<CollectionStack />);
    expect(screen.getByRole('heading', { level: 2, name: /Four ways to walk/i })).toBeInTheDocument();
    expect(COLLECTIONS.map((c) => c.title)).toEqual(['Trek Everyday', 'Sneak into Comfort', 'Women', 'Kids']);
    COLLECTIONS.forEach((c) => expect(screen.getByRole('link', { name: new RegExp(`^Shop ${c.title}`) })).toHaveAttribute('href', c.to));
  });

  it('PopShelf (the shoes pop-up centrepiece): cards link to products, quick view opens, add to cart adds a proper cart line', async () => {
    const seen = [];
    renderWithProviders(<PopShelf onQuickView={(p, c) => seen.push([p.slug, c.key])} />);
    expect(screen.getByRole('heading', { level: 2, name: /Pick a pair/i })).toBeInTheDocument();
    const card = await screen.findByRole('article', { name: 'G10-401' }, { timeout: 5000 });
    expect(within(card).getAllByRole('link')[0].getAttribute('href')).toMatch(/^\/product\/g10-401\?colour=/);
    // the pop structure: plinth > shoe (GSAP) > lift (hover) > photo, served locally
    expect(card.querySelector('[data-plinth] [data-shoe] [data-lift] img').getAttribute('src')).toMatch(/^\/img\/catalogue\//);
    fireEvent.click(within(card).getByRole('button', { name: /Quick view G10-401/ }));
    expect(seen[0][0]).toBe('g10-401');
    fireEvent.click(within(card).getByRole('button', { name: /^Add G10-401/ }));
    const lines = useCart.getState().lines;
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ slug: 'g10-401', qty: 1 });
    expect(lines[0].colourwayName).toBeTruthy();
    const radios = within(card).getAllByRole('radio');
    fireEvent.click(radios[1]);
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('link', { name: /See every shoe/ })).toHaveAttribute('href', '/shop');
  });

  it('DetailGallery: five close-ups, each with a title and a local photo', () => {
    const { container } = renderWithProviders(<DetailGallery />);
    expect(screen.getByRole('heading', { level: 2, name: /Built in the details/i })).toBeInTheDocument();
    DETAILS.forEach((d) => expect(screen.getByRole('heading', { level: 3, name: d.title })).toBeInTheDocument());
    container.querySelectorAll('[data-gimg]').forEach((img) => expect(img.getAttribute('src')).toMatch(/^\/img\/catalogue\//));
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

  it('Heritage: five decades, the count reads 50 at rest', () => {
    const { container } = renderWithProviders(<Heritage />);
    expect(screen.getByRole('heading', { level: 2, name: new RegExp(HERITAGE_LINES.join('\\s*')) })).toBeInTheDocument();
    expect(container.querySelector('[data-count]')).toHaveTextContent('50');
    expect(screen.getByText(/नेपालको आफ्नै पाइला/)).toBeInTheDocument();
  });

  it('Reviews3DV2 (kept): testimonials with verified badges', () => {
    renderWithProviders(<Reviews3DV2 />);
    expect(screen.getByRole('heading', { level: 2, name: /Tested on the Trails. Loved in the City/i })).toBeInTheDocument();
    expect(screen.getByText(/Bikash Shrestha/i)).toBeInTheDocument();
    expect(screen.getByText(/Pooja Thapa/i)).toBeInTheDocument();
    expect(screen.getByText(/Suman Gurung/i)).toBeInTheDocument();
  });

  it('LandingV2: every section in order, hero first and reviews last, no canvas', () => {
    const { container } = renderWithProviders(<LandingV2 />);
    expect(screen.getByRole('heading', { level: 1, name: /Walk the world/i })).toBeInTheDocument();
    const ids = [...container.querySelectorAll('#landing-v2 > section')].map((el) => el.id || el.getAttribute('aria-label'));
    expect(ids).toEqual(['hero', 'Goldstar collections', 'collections', 'all-shoes', 'details', 'heritage', 'reviews-section']);
    expect(container.querySelector('canvas')).toBeNull();
  });
});
