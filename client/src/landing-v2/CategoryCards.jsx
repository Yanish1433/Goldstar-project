import { useRef } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import { tokensV2 as t, alpha, KINETIC, FOCUS_RING, EASE_CSS, FINE_POINTER, PHONE, REDUCED, SHORT, SHORT_QUERY } from './tokensV2.js';
import { Eyebrow, Display, WRAP } from './ui.jsx';
import { useSectionMotion, MQ } from './motion.js';
import SideDoodles, { useSideScrub } from './SideDoodles.jsx';
const SIDE = [
  { k: 'sneaker', x: -480, y: 28, w: 54, rot: -5, d: 34, tilt: 5, c: 'blue', o: 0.6 },
  { k: 'star', x: -320, y: 46, w: 26, rot: 10, d: 30, spin: 120, o: 0.9 },
  { k: 'star', x: 120, y: 34, w: 22, rot: -12, d: 28, spin: -120, o: 0.9 },
  { k: 'boot', x: 470, y: 26, w: 58, rot: 6, d: 34, tilt: -5, c: 'ink', o: 0.5 },
  { k: 'feet', x: -460, b: 26, w: 50, rot: 8, d: 34, tilt: 5, c: 'ink', o: 0.5 },
  { k: 'star', x: -260, b: 44, w: 30, rot: -8, d: 30, spin: 140, o: 0.9 },
  { k: 'star', x: 280, b: 40, w: 24, rot: 14, d: 30, spin: -140, o: 0.9 },
  { k: 'hightop', x: 470, b: 30, w: 52, rot: -5, d: 34, tilt: 5, c: 'blue', o: 0.55 },
  { k: 'boot', s: 'r', top: '30%', w: 66, rot: 5, d: 150, tilt: 5, c: 'blue', o: 0.55 },
  { ph: true, k: 'sneaker', lx: 84, y: 14, w: 34, rot: 6, d: 8, tilt: -4, c: 'blue', o: 0.6 },
  { ph: true, k: 'star', lx: 16, y: 30, w: 14, rot: -10, d: 8, spin: 120, o: 0.9 },
  { ph: true, k: 'star', lx: 50, b: 22, w: 18, rot: 12, d: 8, spin: -120, o: 0.9 },
];

// 3. Shop by category: three tall photo cards, goldstarshoes.com's own home-page block (Trek Everyday / Sneakers /
// Casual Shoes, their photos and lines). Each card is one link (title, line and the SHOP NOW pill inside it).
// Signature move (scrubbed, reverses): the cards rise in one after the other, and each photo drifts slower than its
// card (parallax inside the frame: the photo sits in an oversized holder, so its edges never show). Hover zooms the
// photo. Phones: a horizontal swipe row with scroll-snap.

// The shop's real category slugs (client/src/api/mock/products.json and GET /categories). The catalogue has no
// separate "sneakers" slug: the AX sneakers are filed under `casual`, so Sneakers and Casual Shoes both open it.
export const CATEGORY_LINKS = {
  trek: '/shop?category=trek-collection',
  sneakers: '/shop?category=casual',
  casual: '/shop?category=casual',
};

const img = (k) => ({ src: `/img/categories/${k}-900.webp`, srcSet: `/img/categories/${k}-600.webp 450w, /img/categories/${k}-900.webp 675w` });

export const CATEGORIES = [
  { key: 'trek', title: 'Trek Everyday', line: 'Everyday Trails, Everyday Tales', to: CATEGORY_LINKS.trek, photo: { ...img('trek'), alt: 'A trekker in an orange down jacket by a riverside campfire, Goldstar trek boots beside him', pos: '50% 40%' } },
  { key: 'sneakers', title: 'Sneakers', line: 'Sneak into Comfort, Stride with Purpose', to: CATEGORY_LINKS.sneakers, photo: { ...img('sneakers'), alt: 'Black and white Goldstar sneakers on a step by a brick wall', pos: '50% 50%' } },
  { key: 'casual', title: 'Casual Shoes', line: 'Where Fashion Meets Function', to: CATEGORY_LINKS.casual, photo: { ...img('casual'), alt: 'A woman sitting on a wall against the sky in dark Goldstar casual shoes', pos: '50% 50%' } },
];

// Navy veil over the bottom of the photo: the text sits where it is >= 0.78 (white on it passes AA even on the
// pale brick-wall photo), fading out above the middle of the card.
const VEIL = `linear-gradient(to top, ${alpha(t.navy, 0.92)} 0%, ${alpha(t.navy, 0.8)} 34%, ${alpha(t.navy, 0.6)} 46%, ${alpha(t.navy, 0.18)} 62%, ${alpha(t.navy, 0)} 74%)`;

function Card({ c }) {
  return (
    <Box component="li" data-catcard sx={{ position: 'relative', minWidth: 0, [PHONE]: { flex: '0 0 auto', width: 'min(80vw, 360px)', scrollSnapAlign: 'center' },
      // Landscape phones: the whole card fits the screen height under the bar (3:4), and two or three show at once.
      [`@media (max-width:899.95px) and ${SHORT_QUERY}`]: { width: 'min(34vw, calc((100svh - var(--appbar-h, 52px) - 48px) * 0.75))' } }}>
      <Box
        component={RouterLink}
        to={c.to}
        aria-label={`Shop ${c.title}: ${c.line}`}
        sx={{
          position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center',
          aspectRatio: '3 / 4', maxHeight: { md: '82svh' }, [SHORT]: { maxHeight: 'calc(100svh - var(--appbar-h, 52px) - 48px)' }, width: '100%', overflow: 'hidden', isolation: 'isolate',
          borderRadius: { xs: `${t.radiusLg}px`, md: `${t.radiusXl}px` }, textDecoration: 'none', color: t.white, backgroundColor: t.navy,
          boxShadow: t.shadowElevated, ...FOCUS_RING,
          '& img': { transition: `transform 900ms ${EASE_CSS}` },
          '& [data-pill]': { transition: 'background-color 240ms ease, color 240ms ease' },
          [FINE_POINTER]: {
            '&:hover img': { transform: 'scale(1.07)' },
            '&:hover [data-pill]': { backgroundColor: t.white, color: t.navy },
          },
          [REDUCED]: { '& img': { transition: 'none' } },
          '&:focus-visible [data-pill]': { backgroundColor: t.white, color: t.navy },
        }}
      >
        {/* Oversized holder (12% taller than the card): the parallax moves it, the hover zooms the photo inside. */}
        <Box data-cpar aria-hidden="true" sx={{ position: 'absolute', left: 0, right: 0, top: '-6%', bottom: '-6%', zIndex: -2, willChange: 'transform' }}>
          <Box
            component="img"
            src={c.photo.src}
            srcSet={c.photo.srcSet}
            sizes="(max-width: 899.95px) 80vw, 32vw"
            alt=""
            width={675}
            height={900}
            loading="lazy"
            decoding="async"
            sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: c.photo.pos }}
          />
        </Box>
        <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, zIndex: -1, backgroundImage: VEIL }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: { xs: 1.25, md: 1.5 }, px: { xs: 2, md: 3 }, pb: { xs: 3, md: 'clamp(24px, 3.4vw, 48px)' } }}>
          <Box component="h3" sx={{ ...KINETIC, fontWeight: 800, fontSize: { xs: 'clamp(24px, 7.4vw, 32px)', md: 'clamp(24px, 2.3vw, 42px)' }, [SHORT]: { fontSize: 'clamp(20px, 7svh, 28px)' }, lineHeight: 0.95, color: t.white }}>{c.title}</Box>
          <Box component="p" sx={{ m: 0, fontSize: { xs: 15, md: 17 }, lineHeight: 1.45, color: t.white, maxWidth: '30ch' }}>{c.line}</Box>
          <Box data-pill component="span" aria-hidden="true" sx={{ mt: { xs: 1.5, md: 2.5 }, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, px: 3.5, borderRadius: t.radiusPill, border: `2px solid ${t.white}`, fontSize: 14, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.white }}>
            Shop now
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function CategoryCards() {
  const ref = useRef(null);

  const sideRef = useSideScrub();
  useSectionMotion(ref, (gsap) => {
    const mm = gsap.matchMedia();
    const cards = gsap.utils.toArray('[data-catcard]');
    gsap.fromTo('[data-cathead] > *', { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '[data-cathead]', start: 'top 95%', end: 'top 65%', scrub: true } });
    mm.add(MQ.desk, () => {
      // Rise in, one after the other (each card's own window starts a little later), slight tilt settling flat.
      cards.forEach((card, i) => {
        gsap.fromTo(card, { y: 160 + i * 70, rotate: i === 1 ? 0 : (i === 0 ? -2.5 : 2.5) }, {
          y: 0, rotate: 0, ease: 'none',
          scrollTrigger: { trigger: '[data-catlist]', start: 'top bottom', end: 'top 30%', scrub: 0.6 },
        });
      });
    });
    mm.add(MQ.phone, () => {
      gsap.fromTo(cards, { y: 80 }, { y: 0, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: '[data-catlist]', start: 'top bottom', end: 'top 55%', scrub: 0.4 } });
    });
    // Parallax inside the frame: the photo drifts against the scroll (transform only, within the 6% overhang).
    cards.forEach((card) => {
      gsap.fromTo(card.querySelector('[data-cpar]'), { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    return () => mm.revert();
  });

  return (
    <Box component="section" id="categories" aria-labelledby="cat-heading" sx={{ position: 'relative', backgroundColor: t.cream, color: t.ink, py: { xs: 9, md: 14 } }}>
      <SideDoodles items={SIDE} layerRef={sideRef} />
      <Box ref={ref} sx={{ ...WRAP, position: 'relative', zIndex: 1 }}>
        <Box data-cathead sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'flex-end' }, gap: 3, mb: { xs: 4, md: 7 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Eyebrow>Shop by category</Eyebrow>
            <Display id="cat-heading">Made for every road.</Display>
          </Box>
          <Box component="p" sx={{ m: 0, maxWidth: '36ch', fontSize: { xs: 16, md: 18 }, lineHeight: 1.6, color: t.ink2 }}>
            From Kathmandu pavements to the Annapurna circuit, pick a starting point.
          </Box>
        </Box>
        <Box
          component="ul"
          data-catlist
          sx={{
            listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: { md: 1.5, lg: 2 },
            [PHONE]: {
              display: 'flex', gap: 1.5, overflowX: 'auto', scrollSnapType: 'x mandatory', overscrollBehaviorX: 'contain',
              mx: { xs: -2, sm: -4 }, px: { xs: 2, sm: 4 }, scrollPaddingInline: { xs: '16px', sm: '32px' }, pb: 2, pt: 1,
              scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
            },
          }}
        >
          {CATEGORIES.map((c) => <Card key={c.key} c={c} />)}
        </Box>
      </Box>
    </Box>
  );
}
