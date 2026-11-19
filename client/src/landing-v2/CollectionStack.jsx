import { useRef } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import { ArrowUpRight } from 'lucide-react';
import { useCategories } from '../api/hooks.js';
import { tokensV2 as t, KINETIC, EYEBROW, PHOTO_TILE, FOCUS_RING, EASE_CSS, FINE_POINTER, PHONE, SHORT } from './tokensV2.js';
import { Eyebrow, Display, WRAP } from './ui.jsx';
import { useSectionMotion } from './motion.js';
import { shot } from './shots.js';

// 3. The collections, by who is walking (Women / Men / Kids), as a deck of cards. Each card is sticky just under the
// AppBar, so the next one slides up over it and they pile up. Signature move (scrubbed): as a card gets covered it
// sinks back (scales down, tilts away and dims), and the incoming card's photo settles from a slight zoom. Scrolling
// up peels them off again. Audience-led on purpose: the CategoryCards right below are activity-led (Trek / Sneakers /
// Casual), so no title or photo appears in both.
// Slugs are the shop's real categories (client/src/api/mock/products.json). There is no kids slug: Kids opens /shop.
export const COLLECTIONS = [
  {
    key: 'women', no: '01', title: 'Women', cat: 'women', to: '/shop?category=women',
    line: 'The G10 L2102 in pink and grey: a trek boot cut for women, light enough for every day.',
    photo: { ...shot('C_M09743-2-1-scaled-2'), alt: 'Goldstar G10 L2102 boots in pink and grey' }, tile: true,
  },
  {
    key: 'men', no: '02', title: 'Men', cat: 'men', to: '/shop?category=men',
    line: 'The AX range: clean low-tops on a soft cupsole, in black, coffee and grey, from the office to the ghat.',
    photo: { ...shot('C_M09597-1-scaled-2'), alt: 'A pair of black Goldstar AX sneakers' }, tile: true,
  },
  {
    key: 'kids', no: '03', title: 'Kids', cat: null, to: '/shop', note: 'In Goldstar stores',
    line: 'School shoes and play pairs, built to last a full year of running. Find them in our stores across Nepal.',
    photo: { ...shot('C_M09563-3-scaled-2'), alt: 'A pair of grey Goldstar sneakers' }, tile: true,
  },
];

const STICK = 'calc(var(--appbar-h, 64px) + 16px)';
const count0 = 3; // cards in the deck (COLLECTIONS.length; the pile's offsets are sized for it)

function Card({ c, i, count }) {
  return (
    <Box
      component="li"
      data-ccard
      sx={{
        position: 'sticky',
        top: `calc(${STICK} + ${i * 14}px)`,
        height: { xs: 'min(76svh, 620px)', md: 'min(calc(100svh - var(--appbar-h, 64px) - 64px), 680px)' },
        mb: { xs: '12svh', md: '14svh' },
        // Landscape phones: the card fills the screen under the bar (the pile's 14px steps included).
        [SHORT]: { height: `calc(100svh - ${STICK} - ${(count0 - 1) * 14 + 12}px)`, mb: '10svh' },
        '&:last-of-type': { mb: 0 },
        transformOrigin: '50% 0%',
        willChange: 'transform',
      }}
    >
      <Box
        component={RouterLink}
        to={c.to}
        aria-label={`Shop ${c.title}${count ? `, ${count} styles` : ''}`}
        sx={{
          position: 'relative', height: '100%', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 6fr' }, gridTemplateRows: { xs: 'auto 1fr', md: '1fr' },
          // Landscape phones: text beside the photo (stacked, the photo would be a sliver).
          [SHORT]: { gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gridTemplateRows: '1fr' },
          borderRadius: { xs: `${t.radiusLg}px`, md: `${t.radiusXl}px` }, overflow: 'hidden', textDecoration: 'none', color: t.ink,
          backgroundColor: t.white, boxShadow: `inset 0 0 0 1px ${t.line}, ${t.shadowFloating}`, ...FOCUS_RING,
          '& [data-arrow]': { transition: `transform 500ms ${EASE_CSS}, background-color 240ms ease, color 240ms ease` },
          [FINE_POINTER]: { '&:hover [data-arrow]': { transform: 'rotate(45deg)', backgroundColor: t.blue, borderColor: t.blue, color: t.onBlue } },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 2, p: { xs: 2.5, md: 5 }, [SHORT]: { p: 2.5, gap: 1 }, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box component="span" sx={{ ...EYEBROW, color: t.ink3, fontVariantNumeric: 'tabular-nums' }}>{c.no} / {String(COLLECTIONS.length).padStart(2, '0')}</Box>
            <Box data-arrow component="span" aria-hidden="true" sx={{ width: 48, height: 48, borderRadius: '50%', display: 'grid', placeItems: 'center', border: `1px solid ${t.lineStrong}` }}>
              <ArrowUpRight size={22} strokeWidth={1.5} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, md: 2.5 } }}>
            <Box component="h3" sx={{ ...KINETIC, fontSize: { xs: 'clamp(40px, 13vw, 64px)', md: 'clamp(64px, 6.4vw, 120px)' }, [SHORT]: { fontSize: 'clamp(32px, 12svh, 52px)' }, fontWeight: 800, lineHeight: 0.86 }}>{c.title}</Box>
            <Box component="p" sx={{ m: 0, maxWidth: '40ch', fontSize: { xs: 15, md: 17 }, lineHeight: 1.55, color: t.ink2, [PHONE]: { fontSize: 15 }, [SHORT]: { fontSize: 15, lineHeight: 1.45 } }}>{c.line}</Box>
            <Box component="span" sx={{ ...EYEBROW, color: t.blue }}>{c.note || (count ? `${count} styles online` : 'Shop online')}</Box>
          </Box>
        </Box>
        <Box sx={{ position: 'relative', overflow: 'hidden', backgroundColor: c.tile ? t.cream : t.creamDeep, m: { xs: 1, md: 1.5 }, mt: { xs: 0, md: 1.5 }, ml: { md: 0 }, [SHORT]: { m: 1, ml: 0 }, borderRadius: { xs: `${t.radiusMd}px`, md: `${t.radiusLg}px` }, minHeight: 0 }}>
          <Box
            data-cphoto
            component="img"
            src={c.photo.src}
            srcSet={c.photo.srcSet}
            sizes="(max-width: 899.95px) 92vw, 50vw"
            alt={c.photo.alt}
            loading="lazy"
            decoding="async"
            width={1600}
            height={1600}
            sx={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: c.tile ? 'contain' : 'cover',
              ...(c.tile ? { mixBlendMode: 'multiply', filter: PHOTO_TILE, p: { xs: 1, md: 4 }, boxSizing: 'border-box' } : { objectPosition: '50% 60%' }),
              willChange: 'transform',
            }}
          />
        </Box>
        <Box data-cdim aria-hidden="true" sx={{ position: 'absolute', inset: 0, backgroundColor: t.ink, opacity: 0, pointerEvents: 'none', borderRadius: 'inherit' }} />
      </Box>
    </Box>
  );
}

export default function CollectionStack() {
  const ref = useRef(null);
  const cats = useCategories();
  const count = (key) => (key ? cats.data?.find((x) => x.slug === key)?.count : undefined);

  useSectionMotion(ref, (gsap, ScrollTrigger, root) => {
    const cards = gsap.utils.toArray('[data-ccard]');
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      // Sink back as the next card arrives.
      if (next) {
        gsap.to(card, {
          scale: 0.9 + i * 0.012, rotateX: -6, transformPerspective: 1600, ease: 'none',
          scrollTrigger: { trigger: next, start: 'top 70%', end: () => `top ${parseFloat(getComputedStyle(next).top) || 80}px`, scrub: true, invalidateOnRefresh: true },
        });
        gsap.fromTo(card.querySelector('[data-cdim]'), { opacity: 0 }, {
          opacity: 0.32, ease: 'none',
          scrollTrigger: { trigger: next, start: 'top 55%', end: () => `top ${parseFloat(getComputedStyle(next).top) || 80}px`, scrub: true, invalidateOnRefresh: true },
        });
      }
      // The arriving photo settles from a slight zoom.
      gsap.fromTo(card.querySelector('[data-cphoto]'), { scale: 1.18, yPercent: 6 }, { scale: 1, yPercent: 0, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'top 25%', scrub: true } });
    });
    gsap.fromTo('[data-chead] > *', { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '[data-chead]', start: 'top 95%', end: 'top 60%', scrub: true } });
    // The deck's photos are lazy: once one lands, re-measure every trigger (debounced), so the pins below (the
    // shelf, the gallery, the finale) never keep a start computed before the photos were in.
    const pending = [...root.querySelectorAll('img')].filter((im) => !im.complete);
    let timer = null;
    const kick = () => {
      clearTimeout(timer);
      timer = setTimeout(() => ScrollTrigger.refresh(), 150);
    };
    pending.forEach((im) => im.addEventListener('load', kick, { once: true }));
    return () => {
      clearTimeout(timer);
      pending.forEach((im) => im.removeEventListener('load', kick));
    };
  });

  return (
    <Box component="section" id="collections" aria-labelledby="col-heading" sx={{ position: 'relative', backgroundColor: t.ground, color: t.ink, py: { xs: 10, md: 16 } }}>
      <Box ref={ref} sx={WRAP}>
        <Box data-chead sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'flex-end' }, gap: 3, mb: { xs: 5, md: 8 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Eyebrow>Shop by wearer</Eyebrow>
            <Display id="col-heading">Who&rsquo;s walking?</Display>
          </Box>
          <Box component="p" sx={{ m: 0, maxWidth: '36ch', fontSize: { xs: 16, md: 18 }, lineHeight: 1.6, color: t.ink2 }}>
            Women, men and kids: one Goldstar sole under every pair, cut for the feet that wear it.
          </Box>
        </Box>
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {COLLECTIONS.map((c, i) => <Card key={c.key} c={c} i={i} count={count(c.cat)} />)}
        </Box>
      </Box>
    </Box>
  );
}
