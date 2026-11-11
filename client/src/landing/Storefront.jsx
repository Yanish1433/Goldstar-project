import { useMemo, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import { ArrowLeft, ArrowRight, MapPin, Phone, Rotate3d, Tag, Truck } from 'lucide-react';
import ProductCard, { ProductCardSkeleton } from '../components/shop/ProductCard.jsx';
import Reveal from '../components/Reveal.jsx';
import { useCategories, useProducts } from '../api/hooks.js';
import { brand, WIDE } from '../theme/tokens.js';
import { formatNPR } from '../lib/format.js';
import { Eyebrow, Pill, SectionTitle } from './ui.jsx';

const WRAP = { maxWidth: 1440, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, boxSizing: 'border-box' };
const REDUCED = '@media (prefers-reduced-motion: reduce)';
const focusRing = (c = brand.navy) => ({ '&:focus-visible': { outline: `3px solid ${c}`, outlineOffset: 3 } });

// All active products, shared by every section on the page (one cached query).
const useAll = () => {
  const q = useProducts({ sort: 'featured', limit: 48, page: 1 });
  return { ...q, items: q.data?.items || [] };
};

const CAT_COPY = {
  'trek-collection': { label: 'Trek collection', line: 'Grip and ankle support for trails.' },
  casual: { label: 'Casual', line: 'Easy pairs for the city.' },
  men: { label: 'Men', line: 'Trail and street, men’s sizes.' },
  women: { label: 'Women', line: 'Trail and street, women’s sizes.' },
  'new-arrival': { label: 'New arrivals', line: 'Fresh off the line.' },
  trending: { label: 'Trending', line: 'What people are picking up.' },
  'in-stock': { label: 'Ready to ship', line: 'In stock, delivered fast.' },
};
const CAT_ORDER = ['trek-collection', 'casual', 'men', 'women', 'new-arrival', 'trending', 'in-stock'];

// --- Ticker -----------------------------------------------------------------------------------------------
const TICKS = [
  { icon: Truck, text: 'Cash on delivery across Nepal' },
  { icon: MapPin, text: 'Made in Kathmandu' },
  { icon: Phone, text: 'Order by phone +977-9801235097' },
  { icon: Tag, text: 'Sale prices on the AX range' },
  { icon: Rotate3d, text: 'New: explore the G10 in 3D' },
];

export function Ticker() {
  return (
    <Box aria-label="Why Goldstar" role="region" sx={{ backgroundColor: brand.gold, color: brand.onGold, overflow: 'hidden', py: 1.5, borderBlock: `1px solid ${brand.onGold}` }}>
      <Box
        component="ul"
        sx={{
          listStyle: 'none', m: 0, p: 0, display: 'flex', width: 'max-content', gap: 5,
          animation: 'gsTick 40s linear infinite', '@keyframes gsTick': { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(calc(-50% - 20px))' } },
          [REDUCED]: { animation: 'none', flexWrap: 'wrap', width: 'auto', px: 2 },
        }}
      >
        {[0, 1].map((copy) =>
          TICKS.map(({ icon: Icon, text }) => (
            <Box component="li" key={`${copy}-${text}`} aria-hidden={copy === 1 ? 'true' : undefined} sx={{ display: 'flex', alignItems: 'center', gap: 1, whiteSpace: 'nowrap', fontSize: 14, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', ...WIDE, [REDUCED]: copy === 1 ? { display: 'none' } : {} }}>
              <Icon size={16} strokeWidth={2.25} aria-hidden="true" /> {text}
            </Box>
          )),
        )}
      </Box>
    </Box>
  );
}

// --- Shop by category ---------------------------------------------------------------------------------------
const TINTS = ['#E4E6F5', '#F3E3BF', '#EDE7DC', '#F6D9CF', '#DCEBDF', '#EDE7DC'];

function CatTile({ slug, count, image, big, tint }) {
  const c = CAT_COPY[slug] || { label: slug, line: '' };
  return (
    <Box
      component={RouterLink}
      to={`/shop?category=${slug}`}
      aria-label={`${c.label}, ${count} ${count === 1 ? 'style' : 'styles'}`}
      sx={{
        position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: big ? { xs: 300, md: '100%' } : { xs: 190, md: 230 },
        p: { xs: 2, md: 2.5 }, borderRadius: '24px', overflow: 'hidden', backgroundColor: tint, color: brand.ink, textDecoration: 'none',
        gridColumn: big ? { xs: 'span 2', md: 'span 2' } : undefined, gridRow: big ? { md: 'span 2' } : undefined,
        '& img': {
          position: 'absolute', right: big ? '4%' : '-4%', top: big ? '4%' : '0%', height: big ? '70%' : '64%', width: 'auto', maxWidth: big ? '92%' : '86%', aspectRatio: '1 / 1', objectFit: 'contain',
          mixBlendMode: 'multiply', transform: 'rotate(-8deg)', transition: 'transform 500ms cubic-bezier(0.22,1,0.36,1)',
        },
        '@media (hover:hover)': { '&:hover img': { transform: 'rotate(-2deg) scale(1.06)' }, '&:hover .arrow': { transform: 'translateX(4px)' } },
        ...focusRing(),
      }}
    >
      {image ? <img src={image.thumb || image.src} alt="" width={800} height={800} loading="lazy" decoding="async" /> : null}
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1 }}>
        <Box>
          <Box component="h3" sx={{ m: 0, fontWeight: 800, ...WIDE, letterSpacing: '-0.02em', lineHeight: 1, fontSize: big ? { xs: 32, md: 48 } : { xs: 19, md: 24 } }}>{c.label}</Box>
          <Box component="p" sx={{ m: 0, mt: 0.75, fontSize: { xs: 13, md: 15 }, fontWeight: 600, color: brand.ink2 }}>
            {big ? `${c.line} ` : ''}{count} {count === 1 ? 'style' : 'styles'}
          </Box>
        </Box>
        <Box className="arrow" sx={{ flex: '0 0 auto', width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', backgroundColor: big ? brand.navy : brand.ink, color: '#fff', transition: 'transform 220ms ease' }}>
          <ArrowRight size={18} strokeWidth={2.25} aria-hidden="true" />
        </Box>
      </Box>
    </Box>
  );
}

// Closes the grid's last row: the whole shop, sized to fill whatever is left on desktop.
function AllTile({ total, span }) {
  return (
    <Box
      component={RouterLink}
      to="/shop"
      sx={{
        gridColumn: { xs: 'span 2', md: `span ${span}` }, minHeight: { xs: 150, md: 230 }, p: { xs: 2, md: 3 }, borderRadius: '24px', boxSizing: 'border-box',
        backgroundColor: brand.navy, color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2,
        backgroundImage: `radial-gradient(circle at 85% 20%, rgba(226,184,87,0.35) 0%, rgba(226,184,87,0) 55%)`,
        '@media (hover:hover)': { '&:hover .arrow': { transform: 'translateX(6px)' } }, ...focusRing(),
      }}
    >
      <Box>
        <Eyebrow>Everything Goldstar</Eyebrow>
        <Box sx={{ mt: 1, fontWeight: 800, ...WIDE, letterSpacing: '-0.02em', lineHeight: 1, fontSize: { xs: 26, md: 36 } }}>Shop all {total || ''} styles</Box>
      </Box>
      <Box className="arrow" sx={{ flex: '0 0 auto', width: 48, height: 48, borderRadius: '50%', display: 'grid', placeItems: 'center', backgroundColor: brand.gold, color: brand.onGold, transition: 'transform 220ms ease' }}>
        <ArrowRight size={20} strokeWidth={2.25} aria-hidden="true" />
      </Box>
    </Box>
  );
}

export function CategoryGrid() {
  const cats = useCategories();
  const { items } = useAll();
  const list = useMemo(() => {
    const counts = Object.fromEntries((cats.data || []).map((c) => [c.slug, c.count]));
    const used = new Set();
    return CAT_ORDER.filter((s) => counts[s]).map((slug) => {
      // A different product's photo per tile where possible.
      const ps = items.filter((p) => p.categories.includes(slug));
      const p = ps.find((x) => !used.has(x.slug)) || ps[0];
      if (p) used.add(p.slug);
      const cw = p?.colourways.find((c) => c.image) || null;
      return { slug, count: counts[slug], image: cw?.image };
    });
  }, [cats.data, items]);

  return (
    <Box component="section" aria-labelledby="cats-h" sx={{ backgroundColor: brand.paper, color: brand.ink, py: { xs: 8, md: 12 } }}>
      <Box sx={WRAP}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: { xs: 4, md: 6 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Eyebrow tone={brand.navy}>Find your pair</Eyebrow>
            <SectionTitle id="cats-h">Shop by category.</SectionTitle>
          </Box>
          <Pill to="/shop" variant="navy" size="sm">Everything <ArrowRight size={18} strokeWidth={2.25} aria-hidden="true" /></Pill>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, gap: { xs: 1.5, md: 2.5 } }}>
          {list.length
            ? [
                ...list.map((c, i) => <CatTile key={c.slug} {...c} big={i === 0} tint={TINTS[i % TINTS.length]} />),
                <AllTile key="all" total={items.length} span={(4 - ((list.length - 1 + 4) % 4)) % 4 || 4} />,
              ]
            : Array.from({ length: 5 }, (_, i) => <Box key={i} sx={{ minHeight: { xs: 190, md: 230 }, borderRadius: '24px', backgroundColor: brand.paper2, gridColumn: i === 0 ? 'span 2' : undefined, gridRow: i === 0 ? { md: 'span 2' } : undefined }} />)}
        </Box>
      </Box>
    </Box>
  );
}

// --- Shelves: tabbed product rows ----------------------------------------------------------------------------
const SHELVES = [
  { id: 'all', label: 'Best of Goldstar', test: () => true },
  { id: 'new', label: 'New arrivals', test: (p) => p.categories.includes('new-arrival'), to: '/shop?category=new-arrival' },
  { id: 'trending', label: 'Trending', test: (p) => p.categories.includes('trending'), to: '/shop?category=trending' },
  { id: 'men', label: 'Men', test: (p) => p.categories.includes('men'), to: '/shop?category=men' },
  { id: 'women', label: 'Women', test: (p) => p.categories.includes('women'), to: '/shop?category=women' },
];

export function Shelves() {
  const { items, isLoading, isError } = useAll();
  const [tab, setTab] = useState('all');
  const railRef = useRef(null);
  const shelf = SHELVES.find((s) => s.id === tab);
  const shown = items.filter(shelf.test);
  const nudge = (d) => {
    const el = railRef.current;
    if (el) el.scrollBy({ left: d * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <Box component="section" aria-labelledby="shelf-h" sx={{ backgroundColor: brand.paper, color: brand.ink, pb: { xs: 9, md: 13 }, borderTop: `1px solid ${brand.lineInk}`, pt: { xs: 7, md: 10 } }}>
      <Box sx={WRAP}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Eyebrow tone={brand.navy}>The line-up</Eyebrow>
            <SectionTitle id="shelf-h">Shop the range.</SectionTitle>
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            {[[-1, ArrowLeft, 'Scroll back'], [1, ArrowRight, 'Scroll on']].map(([d, Icon, label]) => (
              <Box key={d} component="button" type="button" aria-label={label} onClick={() => nudge(d)} sx={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${brand.ink}`, backgroundColor: 'transparent', color: brand.ink, cursor: 'pointer', display: 'grid', placeItems: 'center', '&:hover': { backgroundColor: brand.ink, color: '#fff' }, ...focusRing() }}>
                <Icon size={20} strokeWidth={2.25} aria-hidden="true" />
              </Box>
            ))}
          </Box>
        </Box>

        <Box role="tablist" aria-label="Shelves" sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1, mb: { xs: 3, md: 4 }, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
          {SHELVES.map((s) => {
            const on = s.id === tab;
            const n = items.filter(s.test).length;
            return (
              <Box
                key={s.id}
                component="button"
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setTab(s.id);
                  railRef.current?.scrollTo({ left: 0 });
                }}
                sx={{
                  flex: '0 0 auto', minHeight: 44, px: 2.25, borderRadius: '999px', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  border: `2px solid ${on ? brand.navy : brand.lineInk}`, backgroundColor: on ? brand.navy : 'transparent', color: on ? '#fff' : brand.ink,
                  transition: 'background-color 180ms ease, color 180ms ease, border-color 180ms ease', '&:hover': { borderColor: brand.navy }, ...focusRing(),
                }}
              >
                {s.label}{items.length ? <Box component="span" sx={{ ml: 0.75, opacity: 0.7, fontVariantNumeric: 'tabular-nums' }}>{n}</Box> : null}
              </Box>
            );
          })}
        </Box>

        <Box
          ref={railRef}
          component="ul"
          role="tabpanel"
          aria-label={shelf.label}
          aria-busy={isLoading ? 'true' : 'false'}
          sx={{
            listStyle: 'none', p: 0, m: 0, display: 'grid', gridAutoFlow: 'column', gridAutoColumns: { xs: '68%', sm: '42%', md: 'calc((100% - 72px) / 4)' }, gap: { xs: 1.5, sm: 2.5, md: 3 },
            overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' }, '& > li': { scrollSnapAlign: 'start' }, pb: 1,
          }}
        >
          {isLoading
            ? Array.from({ length: 4 }, (_, i) => <li key={i}><ProductCardSkeleton /></li>)
            : shown.map((p, i) => <li key={`${tab}-${p.slug}`}><ProductCard p={p} index={i} sizes="(min-width:900px) 25vw, 68vw" /></li>)}
          {!isLoading ? (
            <li>
              <Box component={RouterLink} to={shelf.to || '/shop'} sx={{ height: '100%', minHeight: 280, aspectRatio: { md: '1 / 1' }, borderRadius: '20px', backgroundColor: brand.navy, color: '#fff', textDecoration: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 3, boxSizing: 'border-box', '&:hover .arrow': { transform: 'translateX(6px)' }, ...focusRing() }}>
                <Eyebrow>See them all</Eyebrow>
                <Box>
                  <Box sx={{ fontWeight: 800, ...WIDE, fontSize: { xs: 26, md: 32 }, lineHeight: 1, letterSpacing: '-0.02em', mb: 2 }}>{shelf.id === 'all' ? 'The whole shop' : shelf.label}</Box>
                  <Box className="arrow" sx={{ width: 48, height: 48, borderRadius: '50%', display: 'grid', placeItems: 'center', backgroundColor: brand.gold, color: brand.onGold, transition: 'transform 220ms ease' }}>
                    <ArrowRight size={20} strokeWidth={2.25} aria-hidden="true" />
                  </Box>
                </Box>
              </Box>
            </li>
          ) : null}
        </Box>
        {isError ? <Box component="p" role="alert" sx={{ color: brand.ink2 }}>The range could not load. <Box component={RouterLink} to="/shop" sx={{ color: brand.navy, fontWeight: 700 }}>Open the shop</Box>.</Box> : null}
      </Box>
    </Box>
  );
}

// --- Deals ---------------------------------------------------------------------------------------------------
export function Deals() {
  const { items } = useAll();
  const deals = useMemo(
    () => items.flatMap((p) => p.colourways.filter((c) => c.regularPrice > c.price && c.image).slice(0, 1).map((c) => ({ p, c, save: c.regularPrice - c.price }))),
    [items],
  );
  if (!deals.length) return null;
  const best = Math.max(...deals.map((d) => d.save));
  return (
    <Box component="section" aria-labelledby="deals-h" sx={{ position: 'relative', overflow: 'hidden', backgroundColor: brand.gold, color: brand.onGold, py: { xs: 8, md: 12 } }}>
      <Box aria-hidden="true" sx={{ position: 'absolute', right: { xs: -40, md: -20 }, top: { xs: -30, md: -60 }, fontWeight: 900, ...WIDE, fontSize: { xs: 180, md: 380 }, lineHeight: 1, letterSpacing: '-0.06em', color: 'rgba(20,18,12,0.07)', userSelect: 'none', pointerEvents: 'none' }}>SALE</Box>
      <Box sx={{ ...WRAP, position: 'relative', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: { xs: 4, md: 6 }, alignItems: 'center' }}>
        <Reveal sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Eyebrow tone={brand.onGold}>On sale now</Eyebrow>
          <SectionTitle id="deals-h">Save up to {formatNPR(best)}.</SectionTitle>
          <Box component="p" sx={{ m: 0, fontSize: { xs: 16, md: 18 }, lineHeight: 1.5, maxWidth: '38ch', fontWeight: 500 }}>
            Everyday casuals at a lower price, while sizes last. Pay cash when your pair arrives.
          </Box>
          <Box sx={{ mt: 1 }}><Pill to="/shop?category=casual" variant="navy">Shop the sale <ArrowRight size={18} strokeWidth={2.25} aria-hidden="true" /></Pill></Box>
        </Reveal>
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
          {deals.map(({ p, c, save }, i) => (
            <Reveal component="li" key={p.slug} delay={i * 0.08}>
              <Box component={RouterLink} to={`/product/${p.slug}?colour=${c.key}`} sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 2, p: 1.5, borderRadius: '22px', backgroundColor: brand.paper, color: brand.ink, textDecoration: 'none', boxShadow: '0 14px 30px rgba(20,18,12,0.16)', transition: 'transform 220ms ease', '&:hover': { transform: 'translateY(-3px)' }, ...focusRing(brand.onGold) }}>
                <Box sx={{ aspectRatio: '1 / 1', borderRadius: '16px', backgroundColor: brand.paper2, overflow: 'hidden', '& img': { width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' } }}>
                  <img src={c.image.thumb || c.image.src} alt="" width={800} height={800} loading="lazy" decoding="async" />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Box component="span" sx={{ display: 'inline-block', px: 1, py: 0.25, borderRadius: '999px', backgroundColor: '#C2124F', color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Save {formatNPR(save)}</Box>
                  <Box sx={{ mt: 1, fontWeight: 800, ...WIDE, fontSize: 20 }}>{p.name}</Box>
                  <Box sx={{ mt: 0.5, display: 'flex', gap: 1, alignItems: 'baseline', flexWrap: 'wrap', fontVariantNumeric: 'tabular-nums' }}>
                    <Box component="span" sx={{ fontWeight: 800, fontSize: 17 }}>{formatNPR(c.price)}</Box>
                    <Box component="s" sx={{ color: brand.ink2, fontSize: 14 }}>{formatNPR(c.regularPrice)}</Box>
                  </Box>
                  <Box sx={{ mt: 0.5, fontSize: 13, color: brand.ink2 }}>{p.colourways.length} colours</Box>
                </Box>
              </Box>
            </Reveal>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

// --- Shop by colour ------------------------------------------------------------------------------------------
export function ColourBrowse() {
  const { items } = useAll();
  const groups = useMemo(() => {
    const m = new Map();
    items.forEach((p) => p.colourways.forEach((c, i) => {
      if (!c.image) return;
      const g = m.get(c.name) || { name: c.name, hex: c.hex, list: [] };
      g.list.push({ p, c, to: `/product/${p.slug}${i === 0 ? '' : `?colour=${c.key}`}` });
      m.set(c.name, g);
    }));
    return [...m.values()].sort((a, b) => b.list.length - a.list.length);
  }, [items]);
  const [pick, setPick] = useState(null);
  const current = groups.find((g) => g.name === pick) || groups[0];
  if (!groups.length) return null;

  return (
    <Box component="section" aria-labelledby="colour-h" sx={{ backgroundColor: brand.night, color: brand.onNight, py: { xs: 8, md: 12 } }}>
      <Box sx={WRAP}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: { xs: 3, md: 4 } }}>
          <Eyebrow>Pick a colour, any colour</Eyebrow>
          <SectionTitle id="colour-h">Shop by colour.</SectionTitle>
        </Box>
        <Box role="radiogroup" aria-label="Colour" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, mb: { xs: 3, md: 5 } }}>
          {groups.map((g) => {
            const on = g.name === current.name;
            return (
              <Box
                key={g.name}
                component="button"
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setPick(g.name)}
                sx={{
                  display: 'inline-flex', alignItems: 'center', gap: 1, minHeight: 48, pl: 0.75, pr: 2, borderRadius: '999px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 700,
                  border: `2px solid ${on ? brand.gold : brand.line}`, backgroundColor: on ? 'rgba(226,184,87,0.12)' : 'transparent', color: brand.onNight, transition: 'border-color 180ms ease, background-color 180ms ease',
                  '&:hover': { borderColor: brand.goldText }, ...focusRing(brand.goldText),
                }}
              >
                <Box component="span" aria-hidden="true" sx={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: g.hex, boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.25)' }} />
                {g.name}
                <Box component="span" sx={{ color: brand.onNight2, fontVariantNumeric: 'tabular-nums' }}>{g.list.length}</Box>
              </Box>
            );
          })}
        </Box>
        <Box component="ul" key={current.name} sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, gap: { xs: 1.5, md: 2.5 } }}>
          {current.list.map(({ p, c, to }, i) => (
            <Reveal component="li" key={`${p.slug}-${c.key}`} delay={i * 0.06}>
              <Box component={RouterLink} to={to} aria-label={`${p.name} in ${c.name}, ${formatNPR(c.price)}`} sx={{ display: 'block', borderRadius: '22px', overflow: 'hidden', backgroundColor: brand.paper2, color: brand.ink, textDecoration: 'none', '& img': { display: 'block', width: '100%', height: 'auto', aspectRatio: '1 / 1', objectFit: 'contain', mixBlendMode: 'multiply', transition: 'transform 400ms cubic-bezier(0.22,1,0.36,1)' }, '&:hover img': { transform: 'scale(1.05)' }, ...focusRing(brand.goldText) }}>
                <img src={c.image.thumb || c.image.src} alt="" width={800} height={800} loading="lazy" decoding="async" />
                <Box sx={{ px: 2, pb: 1.75, pt: 0.5, display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'baseline' }}>
                  <Box component="span" sx={{ fontWeight: 800, ...WIDE, fontSize: { xs: 14, md: 16 } }}>{p.name}</Box>
                  <Box component="span" sx={{ fontSize: 13, fontWeight: 700, color: brand.ink2, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{formatNPR(c.price)}</Box>
                </Box>
              </Box>
            </Reveal>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
