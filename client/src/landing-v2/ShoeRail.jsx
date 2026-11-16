import { useMemo, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import { Eye, Plus, Check } from 'lucide-react';
import { useProducts } from '../api/hooks.js';
import { formatNPR } from '../lib/format.js';
import { makeLine, addToCartAnimated, pickSourceRect } from '../lib/addToCart.js';
import { tokensV2 as t, DISPLAY_LIGHT, EYEBROW, FOCUS_RING, EASE_CSS, FINE_POINTER, PHONE } from './tokensV2.js';
import { Cta, Eyebrow, Display, Section, GUTTER } from './ui.jsx';
import { useSectionMotion } from './motion.js';

// 5. The shoe shelf. Calm, uniform cards: every shoe on the same lit ivory tile, the same type, one accent.
// Desktop (>= 900px, fine pointer): the row is pinned and the vertical scroll drives it sideways (GSAP
// ScrollTrigger, scrub). Under 900px or on touch: a native overflow-x scroll-snap row, no pin.
const btn = {
  minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1, px: 2,
  borderRadius: t.radiusPill, border: `1px solid ${t.lineStrong}`, backgroundColor: 'transparent', color: t.ivory,
  font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'border-color 200ms ease, background-color 200ms ease, color 200ms ease',
  [FINE_POINTER]: { '&:hover': { borderColor: t.ivory } },
  ...FOCUS_RING,
};

export function ShoeCard({ product, onQuickView }) {
  const first = product.colourways?.find((c) => c.inStock) || product.colourways?.[0];
  const [key, setKey] = useState(first?.key);
  const [added, setAdded] = useState(false);
  const photoRef = useRef(null);
  const c = product.colourways?.find((x) => x.key === key) || first;
  if (!c) return null;
  const sale = c.regularPrice > c.price;
  const isNew = product.categories?.includes('new-arrival');
  const size = c.sizes?.[Math.floor((c.sizes.length - 1) / 2)] || c.sizes?.[0];
  const photo = c.image?.thumb || c.image?.src;
  const href = `/product/${product.slug}?colour=${c.key}`;

  const add = (e) => {
    if (!size || !c.inStock) return;
    const res = addToCartAnimated(makeLine(product, c, size), { sourceRect: pickSourceRect(photoRef.current, e.currentTarget) });
    if (res.ok) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <Box component="article" data-card aria-label={product.name} sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
      <Box sx={{ position: 'relative', borderRadius: `${t.radiusMd}px`, backgroundColor: t.paper, overflow: 'hidden', aspectRatio: '4 / 5' }}>
        <Box component={RouterLink} to={href} aria-label={`${product.name}, ${c.name}, ${formatNPR(c.price)}`} sx={{ position: 'absolute', inset: 0, display: 'block', ...FOCUS_RING, '&:focus-visible': { ...FOCUS_RING['&:focus-visible'], outlineOffset: -4 } }}>
          <Box
            ref={photoRef}
            component="img"
            src={photo}
            alt={c.image?.alt || `${product.name} in ${c.name}`}
            loading="lazy"
            decoding="async"
            width={800}
            height={800}
            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', p: { xs: 2, md: 3 }, boxSizing: 'border-box', transition: `transform 900ms ${EASE_CSS}`, [FINE_POINTER]: { '[data-card]:hover &': { transform: 'scale(1.05)' } } }}
          />
        </Box>
        <Box sx={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 1, pointerEvents: 'none' }}>
          {sale ? <Box component="span" sx={{ ...EYEBROW, fontSize: 11, letterSpacing: '0.16em', color: t.goldDeep }}>Save {Math.round((1 - c.price / c.regularPrice) * 100)}%</Box> : null}
          {isNew && !sale ? <Box component="span" sx={{ ...EYEBROW, fontSize: 11, letterSpacing: '0.16em', color: t.inkOnPaper2 }}>New</Box> : null}
        </Box>
        <Box
          component="button"
          type="button"
          onClick={() => onQuickView?.(product, c)}
          aria-label={`Quick view ${product.name}`}
          sx={{
            position: 'absolute', right: 12, bottom: 12, width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
            display: 'grid', placeItems: 'center', backgroundColor: t.inkOnPaper, color: t.paper, ...FOCUS_RING,
            transition: `transform 500ms ${EASE_CSS}, opacity 300ms ease`,
            [FINE_POINTER]: { opacity: 0, transform: 'translateY(8px)', '[data-card]:hover &, &:focus-visible': { opacity: 1, transform: 'none' } },
          }}
        >
          <Eye size={18} strokeWidth={1.75} aria-hidden="true" />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Box component="h3" sx={{ m: 0, fontSize: { xs: 18, md: 20 }, fontWeight: 400, letterSpacing: '-0.01em', color: t.ivory }}>
            <Box component={RouterLink} to={href} tabIndex={-1} sx={{ color: 'inherit', textDecoration: 'none' }}>{product.name}</Box>
          </Box>
          <Box component="p" sx={{ m: 0, mt: 0.5, fontSize: 14, color: t.ivoryDim }}>{c.name}{product.colourways.length > 1 ? ` · ${product.colourways.length} colours` : ''}</Box>
        </Box>
        <Box component="p" sx={{ m: 0, textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          <Box component="span" sx={{ display: 'block', fontSize: { xs: 16, md: 17 }, color: t.ivory }}>{formatNPR(c.price)}</Box>
          {sale ? <Box component="s" sx={{ fontSize: 13, color: t.ivoryFaint }}>{formatNPR(c.regularPrice)}</Box> : null}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, mt: 'auto' }}>
        <Box role="radiogroup" aria-label={`${product.name} colour`} sx={{ display: 'flex', gap: 0.25 }}>
          {product.colourways.map((x) => (
            <Box
              key={x.key}
              component="button"
              type="button"
              role="radio"
              aria-checked={x.key === c.key}
              aria-label={x.name}
              onClick={() => setKey(x.key)}
              sx={{ width: 44, height: 44, p: 0, border: 'none', background: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', borderRadius: '50%', ...FOCUS_RING }}
            >
              <Box component="span" sx={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: x.hex, boxShadow: x.key === c.key ? `0 0 0 2px ${t.ground}, 0 0 0 3px ${t.ivory}` : `inset 0 0 0 1px ${t.lineStrong}` }} />
            </Box>
          ))}
        </Box>
        <Box component="button" type="button" onClick={add} disabled={!c.inStock || !size} aria-label={`Add ${product.name}, ${c.name}, UK ${size} to cart`} sx={{ ...btn, '&:disabled': { opacity: 0.45, cursor: 'not-allowed' } }}>
          {added ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
          {!c.inStock ? 'Sold out' : added ? 'Added' : `Add · UK ${size}`}
        </Box>
      </Box>
    </Box>
  );
}

export default function ShoeRail({ onQuickView }) {
  const ref = useRef(null);
  const trackRef = useRef(null);
  const q = useProducts({ limit: 12 });
  const items = useMemo(() => q.data?.items || [], [q.data]);

  useSectionMotion(ref, (gsap, ScrollTrigger, root) => {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (hover: hover) and (pointer: fine)', () => {
      const track = trackRef.current;
      if (!track) return;
      const dist = () => Math.max(0, track.scrollWidth - track.clientWidth);
      gsap.to(track.firstElementChild, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: { trigger: root.querySelector('[data-pin]'), start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 },
      });
    });
    gsap.from('[data-rail-head] > *', { y: 24, opacity: 0, duration: 1.1, stagger: 0.08, scrollTrigger: { trigger: '[data-rail-head]', start: 'top 85%' } });
    return () => mm.revert();
  }, [items.length]);

  return (
    <Section id="all-shoes" labelledBy="rail-heading">
      <Box ref={ref}>
        <Box data-pin sx={{ minHeight: { md: '100svh' }, display: 'flex', flexDirection: 'column', justifyContent: 'center', py: { xs: 10, md: 8 }, boxSizing: 'border-box', overflow: 'hidden' }}>
          <Box data-rail-head sx={{ ...GUTTER, maxWidth: 1440, mx: 'auto', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'flex-end' }, gap: 3, mb: { xs: 4, md: 6 } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Eyebrow>The shelf · {items.length || '—'} styles</Eyebrow>
              <Display id="rail-heading">Best sellers, side by side.</Display>
            </Box>
            <Cta to="/shop">Shop all footwear</Cta>
          </Box>
          <Box
            ref={trackRef}
            data-track
            sx={{
              overflowX: 'auto', overflowY: 'hidden', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
              WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain',
              [`@media (min-width: 900px) and (hover: hover) and (pointer: fine)`]: { overflowX: 'visible', scrollSnapType: 'none', overflow: 'hidden' },
            }}
          >
            <Box component="ul" sx={{ listStyle: 'none', m: 0, ...GUTTER, display: 'flex', gap: { xs: 2, md: 3 }, width: 'max-content', willChange: 'transform' }}>
              {(items.length ? items : Array.from({ length: 4 }, () => null)).map((p, i) => (
                <Box
                  component="li"
                  key={p?.slug || i}
                  sx={{ width: { xs: 'min(78vw, 320px)', sm: 340, md: 'clamp(300px, 26vw, 400px)' }, scrollSnapAlign: 'start', scrollMarginLeft: 16, flex: '0 0 auto' }}
                >
                  {p ? <ShoeCard product={p} onQuickView={onQuickView} /> : <Box aria-hidden="true" sx={{ aspectRatio: '4 / 5', borderRadius: `${t.radiusMd}px`, backgroundColor: t.groundLift }} />}
                </Box>
              ))}
              <Box component="li" sx={{ width: { xs: 'min(60vw, 260px)', md: 'clamp(260px, 20vw, 320px)' }, flex: '0 0 auto', scrollSnapAlign: 'start' }}>
                <Box
                  component={RouterLink}
                  to="/shop"
                  sx={{
                    aspectRatio: '4 / 5', borderRadius: `${t.radiusMd}px`, border: `1px solid ${t.line}`, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 1.5, p: 3,
                    color: t.ivory, textDecoration: 'none', transition: 'border-color 240ms ease', [FINE_POINTER]: { '&:hover': { borderColor: t.gold } }, ...FOCUS_RING,
                  }}
                >
                  <Box component="span" sx={{ ...EYEBROW }}>The whole range</Box>
                  <Box component="span" sx={{ ...DISPLAY_LIGHT, fontSize: { xs: 30, md: 40 } }}>See every shoe →</Box>
                </Box>
              </Box>
            </Box>
          </Box>
          <Box component="p" sx={{ ...EYEBROW, ...GUTTER, mt: 3, display: 'none', [PHONE]: { display: 'block' } }} aria-hidden="true">Swipe →</Box>
        </Box>
      </Box>
    </Section>
  );
}
