import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import { ArrowRight, Rotate3d } from 'lucide-react';
import { useProducts } from '../api/hooks.js';
import { land, WIDE } from '../theme/tokens.js';
import { formatNPR } from '../lib/format.js';
import { DISPLAY, Eyebrow, Pill } from './ui.jsx';

const PHONE = '@media (max-width:899.95px)';
const REDUCED = '@media (prefers-reduced-motion: reduce)';

// Quick ways into the catalogue, straight from the hero.
export const QUICK = [
  { slug: 'new-arrival', label: 'New arrivals' },
  { slug: 'trek-collection', label: 'Trek' },
  { slug: 'casual', label: 'Casual' },
  { slug: 'men', label: 'Men' },
  { slug: 'women', label: 'Women' },
];

// Every colourway in the catalogue as a tile: one product per colour, so the wall shows the whole range.
export function tilesFrom(products) {
  return products.flatMap((p) =>
    p.colourways.filter((c) => c.image).map((c, i) => ({
      id: `${p.slug}-${c.key}`,
      to: `/product/${p.slug}${i === 0 ? '' : `?colour=${c.key}`}`,
      name: p.name,
      colour: c.name,
      price: c.price,
      sale: c.regularPrice > c.price,
      image: c.image,
    })),
  );
}

// Rotate a list so each column starts somewhere different.
const rotate = (arr, k) => (arr.length ? arr.map((_, i) => arr[(i + k) % arr.length]) : arr);

function Tile({ t, hidden, eager, sx }) {
  return (
    <Box
      component={RouterLink}
      to={t.to}
      tabIndex={hidden ? -1 : undefined}
      aria-hidden={hidden ? 'true' : undefined}
      aria-label={hidden ? undefined : `${t.name}, ${t.colour}, ${formatNPR(t.price)}`}
      sx={{
        position: 'relative', display: 'block', flex: '0 0 auto', borderRadius: '22px', overflow: 'hidden', backgroundColor: land.white,
        textDecoration: 'none', color: land.ink, aspectRatio: '4 / 5', boxShadow: '0 10px 24px rgba(10,8,60,0.28)',
        transition: 'transform 260ms cubic-bezier(0.22,1,0.36,1)',
        '& img': { position: 'absolute', inset: '6% 6% 22% 6%', width: '88%', height: '72%', objectFit: 'contain', mixBlendMode: 'multiply', transition: 'transform 400ms cubic-bezier(0.22,1,0.36,1)' },
        '@media (hover:hover)': { '&:hover': { transform: 'translateY(-4px)' }, '&:hover img': { transform: 'scale(1.06) rotate(-3deg)' } },
        '&:focus-visible': { outline: `3px solid ${land.saffron}`, outlineOffset: 3 },
        ...sx,
      }}
    >
      <img src={t.image.thumb || t.image.src} alt="" width={800} height={800} loading={eager ? 'eager' : 'lazy'} decoding="async" />
      {t.sale ? (
        <Box component="span" sx={{ position: 'absolute', top: 12, left: 12, px: 1.1, py: 0.4, borderRadius: '999px', backgroundColor: land.sale, color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Sale</Box>
      ) : null}
      <Box sx={{ position: 'absolute', left: 14, right: 14, bottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
        <Box component="span" sx={{ fontSize: { xs: 13, md: 15 }, fontWeight: 800, ...WIDE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</Box>
        <Box component="span" sx={{ fontSize: { xs: 12, md: 13 }, fontWeight: 700, color: land.ink2, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{formatNPR(t.price)}</Box>
      </Box>
    </Box>
  );
}

// A looping column (desktop) or row (phone) of tiles: the list twice, slid by half its length. Hover pauses it.
function Track({ tiles, dir = 'up', axis = 'y', seconds = 46, eagerFirst = false }) {
  const anim = axis === 'y' ? (dir === 'up' ? 'gsUp' : 'gsDown') : dir === 'up' ? 'gsLeft' : 'gsRight';
  return (
    <Box
      sx={{
        display: 'flex', flexDirection: axis === 'y' ? 'column' : 'row', gap: axis === 'y' ? 2.25 : 1.5, width: axis === 'y' ? '100%' : 'max-content',
        animation: `${anim} ${seconds}s linear infinite`, willChange: 'transform',
        '@keyframes gsUp': { from: { transform: 'translateY(0)' }, to: { transform: 'translateY(calc(-50% - 9px))' } },
        '@keyframes gsDown': { from: { transform: 'translateY(calc(-50% - 9px))' }, to: { transform: 'translateY(0)' } },
        '@keyframes gsLeft': { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(calc(-50% - 6px))' } },
        '@keyframes gsRight': { from: { transform: 'translateX(calc(-50% - 6px))' }, to: { transform: 'translateX(0)' } },
        '&:hover, &:focus-within': { animationPlayState: 'paused' },
        [REDUCED]: { animation: 'none' },
      }}
    >
      {[0, 1].map((copy) =>
        tiles.map((t, i) => (
          <Tile key={`${copy}-${t.id}`} t={t} hidden={copy === 1} eager={eagerFirst && copy === 0 && i < 3} sx={axis === 'x' ? { width: { xs: 148, sm: 180 } } : undefined} />
        )),
      )}
    </Box>
  );
}

// The store's front door: Goldstar as a whole range (not one shoe). Copy and quick links on the left, a moving wall
// of every colourway in the catalogue on the right (two sliding rows under the copy on phones).
export default function StoreHero() {
  const q = useProducts({ sort: 'featured', limit: 48, page: 1 });
  const products = useMemo(() => q.data?.items || [], [q.data]);
  const tiles = useMemo(() => tilesFrom(products), [products]);
  const from = products.length ? Math.min(...products.map((p) => p.priceFrom)) : null;
  const colours = tiles.length;
  const cols = [rotate(tiles, 0), rotate(tiles, 4), rotate(tiles, 8)];

  return (
    <Box
      component="section"
      aria-labelledby="landing-h1"
      sx={{
        position: 'relative', overflow: 'hidden', color: land.ink, minHeight: { md: '100svh' }, backgroundColor: land.cream,
      }}
    >
      <Box sx={{ position: 'relative', maxWidth: 1440, mx: 'auto', boxSizing: 'border-box', px: { xs: 2, sm: 3, lg: 4 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 4, md: 6 }, minHeight: { md: '100svh' } }}>
        {/* Copy */}
        <Box
          sx={{
            display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: { xs: 3, md: 4 }, pt: { xs: 'calc(var(--appbar-h, 56px) + 32px)', md: 'calc(var(--appbar-h, 64px) + 48px)' }, pb: { xs: 0, md: 8 },
            '@keyframes gsHeroRise': { from: { opacity: 0, transform: 'translateY(18px)' }, to: { opacity: 1, transform: 'none' } },
            '& > *': { animation: 'gsHeroRise 900ms cubic-bezier(0.16,1,0.3,1) both', [REDUCED]: { animation: 'none' } },
            '& > *:nth-of-type(2)': { animationDelay: '90ms' },
            '& > *:nth-of-type(3)': { animationDelay: '180ms' },
            '& > *:nth-of-type(4)': { animationDelay: '270ms' },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, md: 2 } }}>
            <Eyebrow tone={land.blue}>Goldstar Shoes · Made in Nepal</Eyebrow>
            <Box component="h1" id="landing-h1" sx={{ ...DISPLAY, fontSize: { xs: 'clamp(44px, 13vw, 64px)', md: 'clamp(64px, 6.4vw, 112px)' } }}>
              A pair for every road.
            </Box>
            <Box component="p" sx={{ m: 0, fontSize: { xs: 16, md: 19 }, lineHeight: 1.5, color: land.ink2, maxWidth: '40ch' }}>
              Trek boots, everyday casuals and new arrivals for men and women. Order online and pay cash on delivery.
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', [PHONE]: { '& > *': { flex: '1 1 0', px: 1.5 } } }}>
            <Pill to="/shop" variant="blue">Shop all shoes <ArrowRight size={18} strokeWidth={2.25} aria-hidden="true" /></Pill>
            <Pill to="/shop?category=new-arrival" variant="outline">New arrivals</Pill>
          </Box>

          <Box component="nav" aria-label="Shop by category" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {QUICK.map((c) => (
              <Box
                key={c.slug}
                component={RouterLink}
                to={`/shop?category=${c.slug}`}
                sx={{
                  display: 'inline-flex', alignItems: 'center', minHeight: 44, px: 2, borderRadius: '999px', border: `1px solid ${land.line}`, backgroundColor: land.white,
                  color: land.ink, fontSize: 14, fontWeight: 700, textDecoration: 'none', transition: 'background-color 180ms ease, border-color 180ms ease, color 180ms ease',
                  '&:hover': { backgroundColor: land.saffron, borderColor: land.saffron }, '&:focus-visible': { outline: `3px solid ${land.blue}`, outlineOffset: 2 },
                }}
              >
                {c.label}
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: { xs: 2, md: 3 }, pt: 2.5, borderTop: `1px solid ${land.line}` }}>
            {products.length ? (
              <Box component="dl" sx={{ m: 0, display: 'flex', gap: { xs: 3, md: 4 }, '& dd': { m: 0, fontSize: { xs: 22, md: 28 }, fontWeight: 800, ...WIDE, fontVariantNumeric: 'tabular-nums' }, '& dt': { fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: land.ink2 }, '& div': { display: 'flex', flexDirection: 'column-reverse', gap: 0.25 } }}>
                <div><dt>Styles</dt><dd>{products.length}</dd></div>
                <div><dt>Colourways</dt><dd>{colours}</dd></div>
                {from ? <div><dt>From</dt><dd>{formatNPR(from)}</dd></div> : null}
              </Box>
            ) : null}
            <Box component={RouterLink} to="/g10" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, minHeight: 44, color: land.blue, fontSize: 15, fontWeight: 700, textDecoration: 'none', ml: { md: 'auto' }, '&:hover': { textDecoration: 'underline', textUnderlineOffset: '4px' } }}>
              <Rotate3d size={18} strokeWidth={2} aria-hidden="true" /> New: the G10 in 3D
            </Box>
          </Box>
        </Box>

        {/* Product wall: three columns on desktop */}
        <Box
          aria-label="Shoes in the shop"
          role="region"
          sx={{
            display: { xs: 'none', md: 'grid' }, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 2.25, px: 2.25, boxSizing: 'border-box', overflow: 'hidden', alignSelf: 'start',
            mt: 'calc(var(--appbar-h, 64px) + 20px)', height: 'calc(100svh - var(--appbar-h, 64px) - 44px)', borderRadius: '32px', backgroundColor: land.blue,
            '& > div:nth-of-type(2)': { mt: -14 },
          }}
        >
          {tiles.length ? cols.map((c, i) => <div key={i}><Track tiles={c} dir={i === 1 ? 'down' : 'up'} seconds={44 + i * 6} eagerFirst /></div>) : null}
        </Box>

        {/* Phones: two sliding rows */}
        <Box role="region" aria-label="Shoes in the shop" sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, mx: { xs: -2, sm: -3 }, mb: 0, py: 2.5, overflow: 'hidden', backgroundColor: land.blue }}>
          {tiles.length ? (
            <>
              <Track tiles={cols[0]} axis="x" dir="up" seconds={38} eagerFirst />
              <Track tiles={cols[1]} axis="x" dir="down" seconds={44} />
            </>
          ) : <Box sx={{ height: 400 }} />}
        </Box>
      </Box>
    </Box>
  );
}
