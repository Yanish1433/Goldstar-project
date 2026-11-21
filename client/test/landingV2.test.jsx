import { describe, expect, it, beforeAll, beforeEach } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { shopTheme } from '../src/theme/shopTheme.js';
import { tokensV2, KINETIC, HERO_SCRIPT } from '../src/landing-v2/tokensV2.js';
import LandingV2 from '../src/landing-v2/LandingV2.jsx';
import KineticHero, { HERO_LINES, HERO_LABEL, HERO_PHOTO, HL_SIZE } from '../src/landing-v2/KineticHero.jsx';
import Ticker, { RANGES } from '../src/landing-v2/Ticker.jsx';
import CollectionStack, { COLLECTIONS } from '../src/landing-v2/CollectionStack.jsx';
import CategoryCards, { CATEGORIES, CATEGORY_LINKS } from '../src/landing-v2/CategoryCards.jsx';
import AdventureFinale, { FINALE_WORD, FINALE_LINES, FINALE_PIN } from '../src/landing-v2/AdventureFinale.jsx';
import mockProducts from '../src/api/mock/products.json';
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

describe('Landing (daylight) palette', () => {
  describe('contrast (WCAG)', () => {
    it('navy ink on the white ground meets AAA (>= 7:1)', () => expect(contrast(tokensV2.ink, tokensV2.ground)).toBeGreaterThanOrEqual(7));
    it('navy ink on the cream band meets AAA (>= 7:1)', () => expect(contrast(tokensV2.ink, tokensV2.cream)).toBeGreaterThanOrEqual(7));
    it('secondary ink meets AAA for running text on white and cream (>= 7:1)', () => {
      expect(contrast(tokensV2.ink2, tokensV2.ground)).toBeGreaterThanOrEqual(7);
      expect(contrast(tokensV2.ink2, tokensV2.cream)).toBeGreaterThanOrEqual(7);
    });
    it('small labels meet AA on white and cream (>= 4.5:1)', () => {
      expect(contrast(tokensV2.ink3, tokensV2.ground)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(tokensV2.ink3, tokensV2.cream)).toBeGreaterThanOrEqual(4.5);
    });
    it('royal blue text on white and cream meets AAA (>= 7:1)', () => {
      expect(contrast(tokensV2.blue, tokensV2.ground)).toBeGreaterThanOrEqual(7);
      expect(contrast(tokensV2.blue, tokensV2.cream)).toBeGreaterThanOrEqual(7);
    });
    it('white on a royal-blue button / band meets AAA (>= 7:1), also on the hover blue', () => {
      expect(contrast(tokensV2.onBlue, tokensV2.blue)).toBeGreaterThanOrEqual(7);
      expect(contrast(tokensV2.onBlue, tokensV2.blueDeep)).toBeGreaterThanOrEqual(7);
    });
    it('secondary ink on royal blue meets AA (>= 4.5:1)', () => expect(contrast(tokensV2.onBlue2, tokensV2.blue)).toBeGreaterThanOrEqual(4.5));
    it('sand on royal blue meets AA (>= 4.5:1): sand is text only on blue', () => expect(contrast(tokensV2.sand, tokensV2.blue)).toBeGreaterThanOrEqual(4.5));
    it('sand on white would fail AA for text (why sand is a fill there and sandDeep exists)', () => expect(contrast(tokensV2.sand, tokensV2.ground)).toBeLessThan(4.5));
    it('sandDeep text on white, cream and the sand wash meets AA (>= 4.5:1)', () => {
      expect(contrast(tokensV2.sandDeep, tokensV2.ground)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(tokensV2.sandDeep, tokensV2.cream)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(tokensV2.ink, tokensV2.sandSoft)).toBeGreaterThanOrEqual(7);
    });
    it('the sky-blue Details band: navy ink (headline, titles, body, labels) >= 7; blueDeep passes; royal blue is never text there (< 4.5)', () => {
      expect(contrast(tokensV2.ink, tokensV2.photoGround)).toBeGreaterThanOrEqual(7);
      expect(contrast(tokensV2.blueDeep, tokensV2.photoGround)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(tokensV2.blue, tokensV2.photoGround)).toBeLessThan(4.5);
    });
    it('the focus ring (blue line, white halo) reads on white, cream and blue grounds (>= 3:1 non-text)', () => {
      expect(contrast(tokensV2.blue, tokensV2.ground)).toBeGreaterThanOrEqual(3);
      expect(contrast(tokensV2.white, tokensV2.blue)).toBeGreaterThanOrEqual(3);
    });
    it('no dark page ground: the white and cream grounds are light', () => {
      expect(lum(tokensV2.ground)).toBeGreaterThan(0.9);
      expect(lum(tokensV2.cream)).toBeGreaterThan(0.85);
    });
  });

  it('only tokensV2.js holds colour values: no hex or hand-written rgba() in any landing component', () => {
    const dir = join(dirname(fileURLToPath(import.meta.url)), '../src/landing-v2');
    const offenders = readdirSync(dir)
      .filter((f) => /\.jsx?$/.test(f) && f !== 'tokensV2.js')
      .filter((f) => /#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(readFileSync(join(dir, f), 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('two hue families only: every chromatic token is brand blue (blue, navy) or sand, plus the hero photo ground', () => {
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
        const blue = c.h >= 220 && c.h <= 250;
        const sand = c.h >= 25 && c.h <= 50;
        if (k === 'photoGround') return; // the one sanctioned extra hue: the hero photo's own sky (checked below)
        expect([k, blue || sand]).toEqual([k, true]);
      });
  });

  it('photoGround (the hero photo sky, also the Details band ground) is the only extra hue, and navy ink reads on it', () => {
    expect(tokensV2.photoGround).toBe('#57C8E1');
    expect(contrast(tokensV2.ink, tokensV2.photoGround)).toBeGreaterThanOrEqual(7);
  });

  it('the brand colours are the ones goldstarshoes.com uses', () => {
    expect(tokensV2.blue).toBe('#2A27E9');
    expect(tokensV2.navy).toBe('#0B1A48');
    expect(tokensV2.sand).toBe('#EBC989');
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

  it('the display face is the /g10 finale face (Archivo, wide axis); the one exception is the hero headline brush face, the only font file', () => {
    expect(FONT_STACK).toMatch(/Archivo/);
    expect(KINETIC.fontFamily).toMatch(/^"Archivo Variable"/);
    expect(KINETIC.fontVariationSettings).toBe('"wdth" 112');
    expect(KINETIC.fontWeight).toBeGreaterThanOrEqual(800);
    expect(HERO_SCRIPT.fontFamily).toMatch(/^"Caveat Brush Hero"/);
    expect(HERO_SCRIPT.fontFamily).toMatch(/Caveat Brush Hero Fallback/);
    // the @font-face lives only in LandingV2 (swap, woff2), and index.html preloads exactly that file on /
    landingFiles().forEach((f) => expect([f, /@font-face/.test(readFileSync(join(landingDir, f), 'utf8'))]).toEqual([f, f === 'LandingV2.jsx']));
    expect(readFileSync(join(landingDir, 'LandingV2.jsx'), 'utf8')).toMatch(/font-display: swap/);
    expect(existsSync(join(here, '../public/fonts/caveat-brush-hero.woff2'))).toBe(true);
    expect(readFileSync(join(here, '../index.html'), 'utf8').match(/\.woff2/g)).toHaveLength(1);
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

  it('the AppBar is fixed, and the store routes get the frosted white brand bar of the landing (navy logo, royal-blue accents)', () => {
    const { container } = renderBar('/shop');
    const header = container.querySelector('header');
    expect(header.className).toMatch(/MuiAppBar-positionFixed/);
    ['/shop', '/product/g10-401', '/login', '/register', '/account', '/checkout', '/no-such-page'].forEach((path) => {
      const h = renderBar(path).container.querySelector('header');
      expect(h).toHaveAttribute('data-bar', 'brand'); // never 'clear': only the landing is transparent at the top
      expect(h.querySelector('a[aria-label="Goldstar home"] img').getAttribute('src')).toBe('/brand/goldstar-mark.webp'); // navy logo
    });
    // admin keeps its light cream bar
    expect(renderBar('/admin').container.querySelector('header')).toHaveAttribute('data-bar', 'light');
    // navy wordmark and royal-blue accents / active underline / focus ring on the frosted white bar and on the white
    // hero while the landing's bar is clear at scroll 0
    expect(contrast('#0B1A48', '#FFFFFF')).toBeGreaterThanOrEqual(7);
    expect(contrast('#2A27E9', '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokensV2.ink, tokensV2.ground)).toBeGreaterThanOrEqual(7);
  });

  it('the AppBar is clear only at the top of the landing (navy wordmark over the white hero), and frosted on /g10', () => {
    const home = renderBar('/').container.querySelector('header');
    expect(home).toHaveAttribute('data-bar', 'clear');
    expect(home.querySelector('a[aria-label="Goldstar home"] img').getAttribute('src')).toBe('/brand/goldstar-mark.webp'); // navy logo
    expect(renderBar('/g10').container.querySelector('header')).toHaveAttribute('data-bar', 'story');
  });
});

describe('Landing sections', () => {
  beforeEach(() => useCart.setState({ lines: [] }));

  it('KineticHero: whole headline at first paint (aria-label on the h1), the group photo as the LCP <img>, both CTAs, no canvas', () => {
    const { container } = renderWithProviders(<KineticHero />);
    const h1 = screen.getByRole('heading', { level: 1, name: /Walk the world/i });
    HERO_LINES.forEach((l) => expect(h1).toHaveTextContent(new RegExp(l, 'i')));
    expect(h1).toHaveAttribute('aria-label', HERO_LABEL);
    expect(getComputedStyle(h1).fontFamily).toBe(HERO_SCRIPT.fontFamily); // the brush face is the headline only
    expect(getComputedStyle(container.querySelector('[data-heyebrow]')).fontFamily).not.toMatch(/Caveat/);
    container.querySelectorAll('[data-hline]').forEach((l) => expect(l).toHaveAttribute('aria-hidden', 'true'));
    expect(screen.getByRole('link', { name: /Shop all footwear/i })).toHaveAttribute('href', '/shop');
    expect(screen.getByRole('link', { name: /^G10 in 3D/i })).toHaveAttribute('href', '/g10');
    expect(container.querySelectorAll('img')).toHaveLength(1);
    const img = container.querySelector('[data-arch] img');
    expect(img).toHaveAttribute('fetchpriority', 'high');
    expect(img).not.toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('width', String(HERO_PHOTO.width));
    expect(img).toHaveAttribute('height', String(HERO_PHOTO.height));
    expect(img.getAttribute('srcset')).toMatch(/group-600\.webp 600w.*group-904\.webp 904w/);
    expect(img.getAttribute('src')).toMatch(/^\/img\/landing\/group-/);
    const pub = readdirSync(join(here, '../public/img/landing'));
    ['group-600.webp', 'group-904.webp'].forEach((f) => expect(pub).toContain(f));
    expect(container.querySelector('canvas')).toBeNull();
  });

  it('KineticHero: the desktop headline is height-aware and the text column is never end-aligned (it must not rise under the AppBar)', () => {
    expect(Number(HL_SIZE.md.match(/(\d+)svh/)[1])).toBeLessThanOrEqual(16);
    expect(HL_SIZE.md).toMatch(/clamp\(\d+px/); // px floor: the stage grows instead of the type shrinking to nothing
    const { container } = renderWithProviders(<KineticHero />);
    expect(getComputedStyle(container.querySelector('[data-hcol]')).alignSelf).not.toBe('end');
  });

  it('Ticker: lists every collection once for assistive tech (the scrolling rows are hidden)', () => {
    renderWithProviders(<Ticker />);
    const region = screen.getByRole('region', { name: 'Goldstar collections' });
    expect(within(region).getAllByRole('listitem').map((li) => li.textContent)).toEqual(RANGES);
  });

  it('CollectionStack: Women, Men and Kids as a sticky deck, each linking into a real shop category, photos on disk', () => {
    const { container } = renderWithProviders(<CollectionStack />);
    expect(screen.getByRole('heading', { level: 2, name: /Who.s walking/i })).toBeInTheDocument();
    expect(COLLECTIONS.map((c) => c.title)).toEqual(['Women', 'Men', 'Kids']);
    const slugs = new Set(mockProducts.flatMap((p) => p.categories));
    const cat = readdirSync(join(here, '../public/img/catalogue'));
    COLLECTIONS.forEach((c) => {
      const link = screen.getByRole('link', { name: new RegExp(`^Shop ${c.title}`) });
      expect(link).toHaveAttribute('href', c.to);
      const q = new URL(c.to, 'http://x').searchParams.get('category');
      if (q) expect(slugs.has(q)).toBe(true);
      expect(c.photo.src).not.toMatch(/trek-woman|urban-man/);
      [c.photo.src, ...(c.photo.srcSet || '').split(', ').filter(Boolean).map((x) => x.split(' ')[0])]
        .forEach((src) => expect(cat).toContain(src.split('/').pop()));
    });
    const cards = container.querySelectorAll('[data-ccard]');
    expect(cards).toHaveLength(3);
    cards.forEach((el) => expect(getComputedStyle(el).position).toBe('sticky'));
  });

  it('the stack (audience) and the category cards (activity) never repeat a title or a photo', () => {
    const titles = [...COLLECTIONS, ...CATEGORIES].map((c) => c.title.toLowerCase());
    expect(new Set(titles).size).toBe(titles.length);
    const photos = [...COLLECTIONS, ...CATEGORIES].map((c) => c.photo.src);
    expect(new Set(photos).size).toBe(photos.length);
  });

  it('CategoryCards: Trek Everyday, Sneakers and Casual Shoes, each one link into a real shop category', () => {
    const { container } = renderWithProviders(<CategoryCards />);
    expect(screen.getByRole('heading', { level: 2, name: /Made for every road/i })).toBeInTheDocument();
    expect(CATEGORIES.map((c) => c.title)).toEqual(['Trek Everyday', 'Sneakers', 'Casual Shoes']);
    const slugs = new Set(mockProducts.flatMap((p) => p.categories));
    Object.values(CATEGORY_LINKS).forEach((to) => expect(slugs.has(new URL(to, 'http://x').searchParams.get('category'))).toBe(true));
    const files = readdirSync(join(here, '../public/img/categories'));
    CATEGORIES.forEach((c) => {
      const link = screen.getByRole('link', { name: new RegExp(`^Shop ${c.title}`) });
      expect(link).toHaveAttribute('href', c.to);
      expect(link.querySelectorAll('a')).toHaveLength(0); // no nested links
      expect(within(link).getByRole('heading', { level: 3, hidden: true })).toHaveTextContent(c.title);
      const img = link.querySelector('img');
      expect(img).toHaveAttribute('loading', 'lazy');
      expect(img).toHaveAttribute('width', '675');
      expect(img).toHaveAttribute('height', '900');
      img.getAttribute('srcset').split(', ').forEach((s) => expect(files).toContain(s.split(' ')[0].split('/').pop()));
    });
    expect(container.querySelectorAll('[data-catcard]')).toHaveLength(3);
  });

  it('AdventureFinale: the g10 finale before the footer, GOLDSTAR as an h2 (one h1 stays the hero), Shop all to /shop', () => {
    const { container } = renderWithProviders(<AdventureFinale />);
    // the line is split into two masked lines for the reveal, but reads as one sentence
    expect(container.querySelector('[data-flines]').textContent).toBe('Your adventure begins now.');
    expect(container.querySelectorAll('[data-fline]')).toHaveLength(FINALE_LINES.length);
    expect(container.querySelectorAll('[data-fletter]')).toHaveLength(FINALE_WORD.length);
    // the shine copy sits outside the h2 and is hidden from assistive tech and at rest
    const shine = container.querySelector('[data-fshine]');
    expect(shine).toHaveAttribute('aria-hidden', 'true');
    expect(getComputedStyle(shine).visibility).toBe('hidden');
    // the pin is long and slow: 175% of the viewport on desktop, 100% on phones
    expect(FINALE_PIN.desk).toBeGreaterThanOrEqual(1.5);
    expect(FINALE_PIN.phone).toBeGreaterThanOrEqual(1);
    const src = readFileSync(join(here, '../src/landing-v2/AdventureFinale.jsx'), 'utf8');
    expect(src).not.toMatch(/back\.out/); // no overshoot pops on a scrub
    expect(src).toMatch(/pinSpacing: true/);
    const h2 = screen.getByRole('heading', { level: 2, name: 'Goldstar' });
    expect(h2.textContent).toBe(FINALE_WORD);
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    expect(screen.getByText('गोल्डस्टार')).toHaveAttribute('lang', 'ne');
    expect(screen.getByRole('link', { name: /Shop all/ })).toHaveAttribute('href', '/shop');
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

  it('LandingV2: every section in order (hero, ticker, stack, categories, shelf, details, heritage, reviews, finale), one h1, no canvas', () => {
    const { container } = renderWithProviders(<LandingV2 />);
    expect(screen.getByRole('heading', { level: 1, name: /Walk the world/i })).toBeInTheDocument();
    const ids = [...container.querySelectorAll('#landing-v2 > section')].map((el) => el.id || el.getAttribute('aria-label'));
    expect(ids).toEqual(['hero', 'Goldstar collections', 'collections', 'categories', 'all-shoes', 'details', 'heritage', 'reviews-section', 'adventure']);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('canvas')).toBeNull();
  });
});
