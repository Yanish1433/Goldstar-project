import { useMemo, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import { Eye, Plus, Check } from 'lucide-react';
import { useProducts } from '../api/hooks.js';
import { formatNPR } from '../lib/format.js';
import { makeLine, addToCartAnimated, pickSourceRect } from '../lib/addToCart.js';
import { tokensV2 as t, KINETIC, EYEBROW, PHOTO_TILE, FOCUS_RING, EASE_CSS, FINE_POINTER, PHONE, SHORT } from './tokensV2.js';
import { Cta, Eyebrow, Display, GUTTER } from './ui.jsx';
import { useSectionMotion, MQ } from './motion.js';
import { shelfPhoto } from './shots.js';

// 4. The centrepiece: "shoes pop up". The captain's favourite was the round-1 shoe shelf, where the cards came in
// as you scrolled and each shoe lifted out of its tile; round 0's shelves had the same pop (the shoe scaled and
// tipped out of its card on hover). This keeps that mechanic and makes it the scene:
//   desktop: the shelf pins; the empty cream plinths rise in, then the shoes pop up out of them one after another
//   (from below the plinth floor, overshooting, tipping and settling), each with a royal-blue ring and a contact shadow,
//   then the names and prices land. All scrubbed: scroll up and every shoe sinks back into its plinth.
//   phones: no pin; each card pops as it crosses the screen (its own scrubbed trigger).
// Quick view and add to cart work on every card at every point of the scene.
const btn = {
  minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1, px: 2,
  borderRadius: t.radiusPill, border: `1px solid ${t.lineStrong}`, backgroundColor: 'transparent', color: t.ink,
  font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'border-color 200ms ease, background-color 200ms ease, color 200ms ease',
  [FINE_POINTER]: { '&:hover': { borderColor: t.blue, backgroundColor: t.blue, color: t.onBlue } },
  ...FOCUS_RING,
};

export function PopCard({ product, onQuickView }) {
  const first = product.colourways?.find((c) => c.inStock) || product.colourways?.[0];
  const [key, setKey] = useState(first?.key);
  const [added, setAdded] = useState(false);
  const photoRef = useRef(null);
  const c = product.colourways?.find((x) => x.key === key) || first;
  if (!c) return null;
  const sale = c.regularPrice > c.price;
  const isNew = product.categories?.includes('new-arrival');
  const size = c.sizes?.[Math.floor((c.sizes.length - 1) / 2)] || c.sizes?.[0];
  const photo = shelfPhoto(product, c);
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
    <Box component="article" data-card aria-label={product.name} sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.25, md: 2 }, height: '100%' }}>
      <Box data-plinth sx={{ position: 'relative', borderRadius: `${t.radiusMd}px`, backgroundColor: t.cream, overflow: 'hidden', aspectRatio: '4 / 5', willChange: 'transform' }}>
        {/* The blue ring that flashes behind a shoe as it pops (decorative). */}
        <Box data-ring aria-hidden="true" sx={{ position: 'absolute', left: '50%', top: '52%', width: '70%', aspectRatio: '1', borderRadius: '50%', border: `2px solid ${t.blue}`, transform: 'translate(-50%, -50%) scale(0.4)', opacity: 0, pointerEvents: 'none' }} />
        {/* Contact shadow on the plinth floor. */}
        <Box data-shadow aria-hidden="true" sx={{ position: 'absolute', left: '18%', right: '18%', bottom: '14%', height: '7%', borderRadius: '50%', backgroundColor: t.ink, opacity: 0.16, filter: 'blur(10px)', pointerEvents: 'none' }} />
        <Box component={RouterLink} to={href} aria-label={`${product.name}, ${c.name}, ${formatNPR(c.price)}`} sx={{ position: 'absolute', inset: 0, display: 'block', ...FOCUS_RING, '&:focus-visible': { ...FOCUS_RING['&:focus-visible'], outlineOffset: -4 } }}>
          {/* Two wrappers: GSAP moves [data-shoe] (the pop), CSS moves [data-lift] (the hover), so they never fight. The
              blend sits on the outer wrapper: a transformed box isolates its children, so the group is what multiplies
              into the cream plinth. */}
          <Box data-shoe sx={{ position: 'absolute', inset: 0, willChange: 'transform', mixBlendMode: 'multiply' }}>
            <Box data-lift sx={{ position: 'absolute', inset: 0, transition: `transform 700ms ${EASE_CSS}`, [FINE_POINTER]: { '[data-card]:hover &': { transform: 'translateY(-6%) rotate(-5deg) scale(1.06)' } } }}>
              <Box
                ref={photoRef}
                component="img"
                src={photo.thumb}
                srcSet={photo.srcSet}
                sizes="(max-width: 899.95px) 46vw, 20vw"
                alt={c.image?.alt || `${product.name} in ${c.name}`}
                loading="lazy"
                decoding="async"
                width={800}
                height={800}
                sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', filter: PHOTO_TILE, p: { xs: 1, md: 2 }, boxSizing: 'border-box' }}
              />
            </Box>
          </Box>
        </Box>
        <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 1, pointerEvents: 'none' }}>
          {sale ? <Box component="span" sx={{ ...EYEBROW, fontSize: 11, letterSpacing: '0.16em', color: t.sandDeep }}>Save {Math.round((1 - c.price / c.regularPrice) * 100)}%</Box> : null}
          {isNew && !sale ? <Box component="span" sx={{ ...EYEBROW, fontSize: 11, letterSpacing: '0.16em', color: t.blue }}>New</Box> : null}
        </Box>
        <Box
          component="button"
          type="button"
          onClick={() => onQuickView?.(product, c)}
          aria-label={`Quick view ${product.name}`}
          sx={{
            position: 'absolute', right: 10, bottom: 10, width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
            display: 'grid', placeItems: 'center', backgroundColor: t.blue, color: t.onBlue, ...FOCUS_RING,
            transition: `transform 500ms ${EASE_CSS}, opacity 300ms ease`,
            [FINE_POINTER]: { opacity: 0, transform: 'translateY(8px)', '[data-card]:hover &, &:focus-visible': { opacity: 1, transform: 'none' } },
          }}
        >
          <Eye size={18} strokeWidth={1.75} aria-hidden="true" />
        </Box>
      </Box>
      <Box data-info sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, md: 1.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, [PHONE]: { flexDirection: 'column', gap: 0.25 } }}>
          <Box sx={{ minWidth: 0 }}>
            <Box component="h3" sx={{ ...KINETIC, fontSize: { xs: 26, md: 34 }, fontWeight: 760, lineHeight: 0.95, color: t.ink }}>
              <Box component={RouterLink} to={href} tabIndex={-1} sx={{ color: 'inherit', textDecoration: 'none' }}>{product.name}</Box>
            </Box>
            <Box component="p" sx={{ m: 0, mt: 0.5, fontSize: 13, color: t.ink2 }}>{c.name}{product.colourways.length > 1 ? ` · ${product.colourways.length} colours` : ''}</Box>
          </Box>
          <Box component="p" sx={{ m: 0, textAlign: { xs: 'left', md: 'right' }, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            <Box component="span" sx={{ display: { xs: 'inline', md: 'block' }, fontSize: { xs: 15, md: 16 }, fontWeight: 700, color: t.ink, mr: { xs: 1, md: 0 } }}>{formatNPR(c.price)}</Box>
            {sale ? <Box component="s" sx={{ fontSize: 12, color: t.ink3 }}>{formatNPR(c.regularPrice)}</Box> : null}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
          <Box role="radiogroup" aria-label={`${product.name} colour`} sx={{ display: 'flex', ml: -1.25 }}>
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
                <Box component="span" sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: x.hex, boxShadow: x.key === c.key ? `0 0 0 2px ${t.ground}, 0 0 0 4px ${t.blue}` : `inset 0 0 0 1px ${t.lineStrong}` }} />
              </Box>
            ))}
          </Box>
          <Box component="button" type="button" onClick={add} disabled={!c.inStock || !size} aria-label={`Add ${product.name}, ${c.name}, UK ${size} to cart`} sx={{ ...btn, flex: '1 1 100%', [PHONE]: { px: 1 }, '&:disabled': { opacity: 0.45, cursor: 'not-allowed' } }}>
            {added ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
            {!c.inStock ? 'Sold out' : added ? 'Added' : `Add · UK ${size}`}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// One card's pop, as a timeline segment (used by the pinned scene and by the per-card phone triggers).
function riseInto(tl, card, at, span = 1) {
  return tl.fromTo(card.querySelector('[data-plinth]'), { yPercent: 40, rotateX: -28, transformPerspective: 900, autoAlpha: 0.0001 }, { yPercent: 0, rotateX: 0, autoAlpha: 1, duration: 0.35 * span, ease: 'power3.out' }, at);
}
function popInto(tl, gsap, card, at, span = 1) {
  const q = (s) => card.querySelector(s);
  tl.fromTo(q('[data-shoe]'), { yPercent: 105, rotate: -22, scale: 0.72 }, { yPercent: -9, rotate: 4, scale: 1.1, duration: 0.3 * span, ease: 'power2.out' }, at + 0.22 * span)
    .to(q('[data-shoe]'), { yPercent: 0, rotate: 0, scale: 1, duration: 0.22 * span, ease: 'back.out(2.2)' }, at + 0.52 * span)
    .fromTo(q('[data-shadow]'), { scaleX: 0.2, opacity: 0 }, { scaleX: 1, opacity: 0.16, duration: 0.4 * span, ease: 'power2.out' }, at + 0.3 * span)
    .fromTo(q('[data-ring]'), { scale: 0.4, opacity: 0 }, { scale: 1.25, opacity: 0.7, duration: 0.25 * span, ease: 'power2.out' }, at + 0.34 * span)
    .to(q('[data-ring]'), { scale: 1.6, opacity: 0, duration: 0.25 * span, ease: 'power1.in' }, at + 0.59 * span)
    .fromTo(q('[data-info]'), { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3 * span, ease: 'power3.out' }, at + 0.55 * span);
  return tl;
}

export default function PopShelf({ onQuickView }) {
  const ref = useRef(null);
  const q = useProducts({ limit: 12 });
  const items = useMemo(() => q.data?.items || [], [q.data]);

  useSectionMotion(ref, (gsap, ScrollTrigger, root) => {
    if (!items.length) return undefined;
    const mm = gsap.matchMedia();
    const cards = gsap.utils.toArray('[data-card]', root);
    // Pinned scene: desktop, a single row (up to 5 shoes) and enough height for it.
    mm.add(`${MQ.desk} and (min-height: 600px)`, () => {
      if (cards.length > 5) return perCard();
      // On the way in (not pinned yet): the heading and the empty plinths rise into place.
      const pin = root.querySelector('[data-pin]');
      const enter = gsap.timeline({ scrollTrigger: { trigger: pin, start: 'top 85%', end: 'top top', scrub: 0.5 } });
      enter.fromTo('[data-shead] > *', { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.5, ease: 'power3.out' }, 0);
      cards.forEach((card, i) => riseInto(enter, card, 0.2 + i * 0.12, 1.4));
      // Pinned: the shoes pop up one after another.
      const tl = gsap.timeline({
        scrollTrigger: { trigger: pin, start: 'top top', end: () => `+=${Math.round(window.innerHeight * 1.2)}`, pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true },
      });
      cards.forEach((card, i) => popInto(tl, gsap, card, i * 0.3, 1));
      tl.to({}, { duration: 0.25 }); // a beat of rest with every shoe out before the pin releases
      return undefined;
    });
    function perCard() {
      cards.forEach((card) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 98%', end: 'top 40%', scrub: 0.5 } });
        riseInto(tl, card, 0, 1);
        popInto(tl, gsap, card, 0.2, 1);
      });
      gsap.fromTo('[data-shead] > *', { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: '[data-shead]', start: 'top 95%', end: 'top 65%', scrub: true } });
    }
    mm.add(`${MQ.phone}, ${MQ.desk} and (max-height: 599.95px)`, () => { perCard(); });
    return () => mm.revert();
  }, [items.length]);

  const list = items.length ? items : Array.from({ length: 5 }, () => null);
  return (
    <Box component="section" id="all-shoes" aria-labelledby="rail-heading" sx={{ position: 'relative', backgroundColor: t.ground, color: t.ink }}>
      <Box ref={ref}>
        <Box
          data-pin
          sx={{
            minHeight: { md: '100svh' }, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center',
            pt: { xs: 10, md: 'calc(var(--appbar-h, 64px) + 24px)' }, pb: { xs: 10, md: 5 }, overflow: 'hidden',
          }}
        >
          <Box data-shead sx={{ ...GUTTER, maxWidth: 1440, mx: 'auto', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'flex-end' }, gap: 2.5, mb: { xs: 4, md: 'clamp(24px, 4svh, 48px)' } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Eyebrow>Best sellers · {items.length || '—'} styles</Eyebrow>
              <Display id="rail-heading" sx={{ fontSize: { xs: 'clamp(52px, 15vw, 76px)', md: 'clamp(72px, 7vw, 128px)' }, [SHORT]: { fontSize: 'clamp(40px, 13svh, 60px)' } }}>Pick a pair.</Display>
            </Box>
            <Cta to="/shop">Shop all footwear</Cta>
          </Box>
          <Box
            component="ul"
            sx={{
              listStyle: 'none', m: 0, ...GUTTER, maxWidth: 1440, mx: 'auto', width: '100%', boxSizing: 'border-box',
              display: 'grid', gap: { xs: '28px 12px', md: 'clamp(16px, 1.6vw, 28px)' },
              gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: `repeat(${Math.min(Math.max(list.length, 3), 5)}, minmax(0, 1fr))` },
              // Keep the pinned row inside one screen: the plinths shrink with the viewport height.
              [`@media (min-width: 900px)`]: { '& [data-plinth]': { maxHeight: 'calc(100svh - var(--appbar-h, 64px) - 330px)', minHeight: 220, aspectRatio: 'auto', height: 'calc((min(100vw, 1440px) - 96px) / 5 * 1.2)' } },
              // Landscape phones: four or five across (two would make each card taller than the screen), plinths at
              // their own 4:5 ratio (not pinned, so no screen-height cap).
              [SHORT]: {
                gap: '24px 12px', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                '& [data-plinth]': { aspectRatio: '4 / 5', height: 'auto', maxHeight: 'none', minHeight: 0 },
                '& h3': { fontSize: 22 },
              },
              [`${SHORT} and (min-width: 800px)`]: { gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' },
            }}
          >
            {list.map((p, i) => (
              <Box component="li" key={p?.slug || i} sx={{ minWidth: 0 }}>
                {p ? <PopCard product={p} onQuickView={onQuickView} /> : <Box aria-hidden="true" sx={{ aspectRatio: '4 / 5', borderRadius: `${t.radiusMd}px`, backgroundColor: t.cream }} />}
              </Box>
            ))}
          </Box>
          <Box sx={{ ...GUTTER, maxWidth: 1440, mx: 'auto', width: '100%', boxSizing: 'border-box', mt: { xs: 4, md: 3 }, display: 'flex', justifyContent: 'center' }}>
            <Cta to="/shop" variant="text">See every shoe</Cta>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
