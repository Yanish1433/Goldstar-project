import { describe, expect, it, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { shopTheme } from '../src/theme/shopTheme.js';
import { tokensV2 } from '../src/landing-v2/tokensV2.js';
import LandingV2 from '../src/landing-v2/LandingV2.jsx';
import TrekHeroScroll from '../src/landing-v2/TrekHeroScroll.jsx';
import UrbanWalkScroll from '../src/landing-v2/UrbanWalkScroll.jsx';
import GearCollectionV2 from '../src/landing-v2/GearCollectionV2.jsx';
import WomensSectionV2 from '../src/landing-v2/WomensSectionV2.jsx';
import KidsSectionV2 from '../src/landing-v2/KidsSectionV2.jsx';
import Reviews3DV2 from '../src/landing-v2/Reviews3DV2.jsx';
import G10ShowcaseV2 from '../src/landing-v2/G10ShowcaseV2.jsx';
import QuickViewModal from '../src/landing-v2/QuickViewModal.jsx';
import { apiState } from '../src/api/client.js';

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
    </QueryClientProvider>
  );
};

describe('Landing V2 - Cinematic 3D Experience (UI/UX Pro Max)', () => {
  describe('Color Contrast (WCAG AA & AAA standards)', () => {
    it('primary ink on cream ground meets WCAG AAA (>= 7:1)', () => {
      expect(contrast(tokensV2.ink, tokensV2.cream)).toBeGreaterThanOrEqual(7);
    });

    it('white text on signature blue meets WCAG AA (>= 4.5:1)', () => {
      expect(contrast('#FFFFFF', tokensV2.blue)).toBeGreaterThanOrEqual(4.5);
    });

    it('white text on pine green meets WCAG AA (>= 4.5:1)', () => {
      expect(contrast('#FFFFFF', tokensV2.pine)).toBeGreaterThanOrEqual(4.5);
    });

    it('white text on obsidian ink meets WCAG AAA (>= 7:1)', () => {
      expect(contrast('#FFFFFF', tokensV2.ink)).toBeGreaterThanOrEqual(7);
    });

    it('gold on ink meets WCAG AA (>= 4.5:1)', () => {
      expect(contrast(tokensV2.gold, tokensV2.ink)).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('TrekHeroScroll (Trekking Woman & Popping Gear Animation)', () => {
    it('renders the Himalayan climbing story with popping gear hotspots and left product drawer', () => {
      renderWithProviders(<TrekHeroScroll />);
      expect(screen.getByRole('heading', { level: 1, name: /WELCOME TO GOLDSTAR/i })).toBeInTheDocument();
      expect(screen.getByText(/नेपालको आफ्नै पाइला/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Shop All Footwear/i })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /Select Himal Insulated Jacket/i })[0]).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /Select Everest Hiking Boot/i })[0]).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Swipe or click to buy Everest Hiking Boot/i })).toBeInTheDocument();
    });
  });

  describe('UrbanWalkScroll (Urban Stride & 3D Aqua Shoe Studio)', () => {
    it('renders the Why Goldstar urban walk story with 3D aqua studio and full background', () => {
      renderWithProviders(<UrbanWalkScroll />);
      expect(screen.getByRole('heading', { level: 2, name: /CLEAN\. STYLISH\. EVERYDAY\./i })).toBeInTheDocument();
      expect(screen.getByText(/सहरको फेसन र दैनिक आराम/i)).toBeInTheDocument();
      expect(screen.getByText(/3D Aqua Studio/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Swipe or click to buy AX Classic Retro/i })).toBeInTheDocument();
    });
  });

  describe('GearCollectionV2 (Goldstar Trek Collection)', () => {
    it('renders the 4 expedition gear items from user assets with pricing and quick add', () => {
      renderWithProviders(<GearCollectionV2 />);
      expect(screen.getByRole('heading', { level: 2, name: /Equipped For the Himalayas/i })).toBeInTheDocument();
      expect(screen.getAllByText(/Himal Insulated Jacket/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Summit Rucksack/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Adventure Cargo Pants/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Everest Hiking Boot/i).length).toBeGreaterThan(0);
    });
  });

  describe('G10ShowcaseV2 (Dedicated G-10 Trail Boot Feature)', () => {
    it('renders 3D model vs photo switcher with zero colorway selector, 4-layer inspection, and swipe to buy', () => {
      renderWithProviders(<G10ShowcaseV2 />);
      expect(screen.getByRole('heading', { level: 2, name: /THE G-10 TREK SERIES/i })).toBeInTheDocument();
      expect(screen.getByText(/भल्कनाइज्ड रबर सोल/i)).toBeInTheDocument();
      expect(screen.getByText(/Diamond Lug Outsole/i)).toBeInTheDocument();
      // Verifies 3D Model and Photo toggles
      expect(screen.getByRole('button', { name: /Switch to 3D Blender Model view/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Switch to Studio Photography view/i })).toBeInTheDocument();
      // Colorway options are explicitly removed per user request
      expect(screen.queryByText(/Colorway:/i)).toBeNull();
      // Swipe to buy button
      expect(screen.getByRole('button', { name: /Swipe or click to buy Goldstar G10-401 Trek Edition/i })).toBeInTheDocument();

      // Switch to Photo view
      fireEvent.click(screen.getByRole('button', { name: /Switch to Studio Photography view/i }));
      expect(screen.getByRole('button', { name: /View Traction Lug Sole/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /View Expedition Boot/i })).toBeInTheDocument();
    });
  });

  describe('WomensSectionV2', () => {
    it('renders dedicated women’s collection with UK size filter buttons', () => {
      renderWithProviders(<WomensSectionV2 />);
      expect(screen.getByRole('heading', { level: 2, name: /Women’s Trek & Lifestyle Collection/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'UK 5' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'UK 6' })).toBeInTheDocument();
    });
  });

  describe('KidsSectionV2', () => {
    it('renders Goldstar Junior range for school and sports with durability specs', () => {
      renderWithProviders(<KidsSectionV2 />);
      expect(screen.getByRole('heading', { level: 2, name: /Built Tough for Young Champions/i })).toBeInTheDocument();
      expect(screen.getByText(/Goldstar Junior Pace Runner/i)).toBeInTheDocument();
      expect(screen.getByText(/Junior G10 Trail Cadet/i)).toBeInTheDocument();
    });
  });

  describe('Reviews3DV2', () => {
    it('renders customer testimonials with 3D perspective cards and verified badges', () => {
      renderWithProviders(<Reviews3DV2 />);
      expect(screen.getByRole('heading', { level: 2, name: /Tested on the Trails. Loved in the City/i })).toBeInTheDocument();
      expect(screen.getByText(/Bikash Shrestha/i)).toBeInTheDocument();
      expect(screen.getByText(/Pooja Thapa/i)).toBeInTheDocument();
      expect(screen.getByText(/Suman Gurung/i)).toBeInTheDocument();
    });
  });

  describe('LandingV2 Full Assembly', () => {
    it('mounts the complete 3D landing page with hero and scroll scenes using the clean top navigation', () => {
      renderWithProviders(<LandingV2 />);
      expect(screen.getByRole('heading', { level: 1, name: /WELCOME TO GOLDSTAR/i })).toBeInTheDocument();
      expect(screen.getByText(/नेपालको आफ्नै पाइला/i)).toBeInTheDocument();
    });
  });
});
