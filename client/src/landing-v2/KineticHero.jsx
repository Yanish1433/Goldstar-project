import { useRef } from 'react';
import Box from '@mui/material/Box';
import { tokensV2 as t, KINETIC, EYEBROW, PHOTO_TILE, PHONE } from './tokensV2.js';
import { Cta, StarShape } from './ui.jsx';
import { useSectionMotion, MQ } from './motion.js';
import { HERO_SHOT } from './shots.js';

// 1. Hero. First paint is a complete, still composition on a white ground: the headline whole in big navy type
// ("Walk the / world"), the G10-401 pair on a white card tilted over a royal-blue disc, the copy and both CTAs, two
// sand Goldstar stars. The pair is a real <img fetchpriority=high> with its size set (the LCP). Nothing starts hidden.
// Signature move (pinned, scrubbed, reverses on the way up): the letters split and fly apart, the blue disc swells
// until it floods the whole screen (a colour wipe that carries straight into the blue ticker below), the card
// straightens and glides to the centre, the stars spin up, and the brand line lands in white on blue.
// Only transform / opacity are animated (no filters, no clip-paths on scroll).
export const HERO_LINES = ['Walk the', 'world'];
export const HERO_LABEL = 'Walk the world. Goldstar shoes, made in Nepal for over five decades.';

// The disc and the card (CSS lengths, so the still composition needs no JS).
const DISC = { xs: 'min(76vw, 36svh, 340px)', md: 'min(38vw, 62svh, 620px)' };
const CARD = 0.6; // card side, as a share of the disc

const lineSx = {
  ...KINETIC,
  display: 'block',
  fontWeight: 880,
  fontSize: { xs: 'clamp(72px, 24vw, 140px)', md: 'clamp(104px, min(12.6vw, 24svh), 270px)' },
  lineHeight: 0.82,
  letterSpacing: '-0.012em',
  whiteSpace: 'nowrap',
  color: t.ink,
  willChange: 'transform',
};

export default function KineticHero() {
  const ref = useRef(null);

  useSectionMotion(ref, (gsap, ScrollTrigger, root, SplitText) => {
    const mm = gsap.matchMedia();
    const lines = root.querySelectorAll('[data-hline]');
    const splits = [...lines].map((l) => new SplitText(l, { type: 'chars', charsClass: 'hc', aria: 'none' }));
    const stage = root.querySelector('[data-stage]');
    const wrap = root.querySelector('[data-dwrap]');
    // Geometry from untransformed boxes, relative to the stage (the stage is the screen while pinned).
    const geo = () => {
      const s = stage.getBoundingClientRect();
      const w = wrap.getBoundingClientRect();
      const cx = w.left - s.left + w.width / 2;
      const cy = w.top - s.top + w.height / 2;
      const far = Math.max(Math.hypot(cx, cy), Math.hypot(s.width - cx, cy), Math.hypot(cx, s.height - cy), Math.hypot(s.width - cx, s.height - cy));
      return { cx, cy, W: s.width, H: s.height, cover: (far * 2) / Math.max(1, w.width) + 0.08 };
    };
    const [a, b] = splits;

    const build = (phone) => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: phone ? '+=75%' : '+=100%',
          pin: true,
          scrub: phone ? 0.4 : 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
      // The letters fly apart: line one out to the left (last letter leads), line two out to the right, under the
      // swelling disc.
      tl.to(a.chars, { xPercent: -280, yPercent: (i) => (i % 2 ? -22 : 16), rotate: (i) => (i % 2 ? -10 : 7), stagger: { each: 0.03, from: 'end' }, duration: 0.55 }, 0)
        .to(b.chars, { xPercent: 300, yPercent: (i) => (i % 2 ? 18 : -14), rotate: (i) => (i % 2 ? 8 : -6), stagger: { each: 0.03, from: 'start' }, duration: 0.55 }, 0)
        .to('[data-hcopy]', { y: 50, autoAlpha: 0, duration: 0.22 }, 0)
        .to('[data-heyebrow]', { y: -30, autoAlpha: 0, duration: 0.22 }, 0)
        // The disc floods the screen (a scale, so it stays on the compositor).
        .fromTo('[data-disc]', { scale: 1 }, { scale: () => geo().cover, duration: 0.7, ease: 'power2.in' }, 0.08)
        // The card straightens and glides to the centre of the screen, a little above the brand line.
        .fromTo('[data-hcard]', { x: 0, y: 0, rotate: -6, scale: 1 }, {
          x: () => { const g = geo(); return g.W / 2 - g.cx; },
          y: () => { const g = geo(); return g.H * (phone ? 0.42 : 0.44) - g.cy; },
          rotate: 0,
          scale: phone ? 1.15 : 1.12,
          duration: 0.75,
          ease: 'power2.inOut',
        }, 0.08)
        .fromTo('[data-hcard] img', { scale: 1 }, { scale: 1.08, duration: 0.75 }, 0.08)
        // The stars spin up and drift (depth: the near one travels further).
        .to('[data-hstar="1"]', { rotate: 220, yPercent: -160, xPercent: -40, scale: 1.4, duration: 1 }, 0)
        .to('[data-hstar="2"]', { rotate: -160, yPercent: -90, xPercent: 60, duration: 1 }, 0)
        .fromTo('[data-hend]', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.22 }, 0.74);
      return tl;
    };
    mm.add(MQ.desk, () => { build(false); });
    mm.add(MQ.phone, () => { build(true); });
    return () => {
      mm.revert();
      splits.forEach((s) => s.revert());
    };
  }, [], { split: true });

  return (
    <Box component="section" ref={ref} id="hero" aria-labelledby="landing-h1" sx={{ position: 'relative', backgroundColor: t.ground }}>
      <Box data-stage sx={{ position: 'relative', height: '100svh', minHeight: { xs: 600, md: 640 }, overflow: 'hidden', isolation: 'isolate', backgroundColor: t.ground }}>
        <Box
          sx={{
            position: 'absolute', inset: 0, display: 'grid', boxSizing: 'border-box',
            pt: { xs: 'calc(var(--appbar-h, 56px) + 14px)', md: 'calc(var(--appbar-h, 64px) + 3svh)' },
            pb: { xs: 'calc(20px + env(safe-area-inset-bottom))', md: '6svh' },
            px: { xs: 2, md: '4vw' },
            gap: { xs: 2, md: '3vw' },
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1.15fr) minmax(0, 1fr)' },
            gridTemplateRows: { xs: 'auto minmax(0, 1fr) auto', md: 'minmax(0, 1fr) auto' },
          }}
        >
          {/* Headline block. aria-label on the h1; SplitText's letters are aria-hidden. */}
          <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: { xs: 1.5, md: '2.4svh' }, gridColumn: 1, gridRow: 1, alignSelf: { md: 'center' }, minWidth: 0 }}>
            <Box data-heyebrow component="p" sx={{ ...EYEBROW, m: 0 }}>Goldstar · Made in Nepal</Box>
            <Box component="h1" id="landing-h1" aria-label={HERO_LABEL} sx={{ ...KINETIC, m: 0 }}>
              <Box component="span" data-hline aria-hidden="true" sx={lineSx}>{HERO_LINES[0]}</Box>
              <Box component="span" data-hline aria-hidden="true" sx={{ ...lineSx, color: t.blue }}>{HERO_LINES[1]}</Box>
            </Box>
          </Box>

          {/* The disc and the card with the pair. */}
          <Box sx={{ position: 'relative', zIndex: 2, gridColumn: { xs: 1, md: 2 }, gridRow: { xs: 2, md: '1 / span 2' }, display: 'grid', placeItems: 'center', minHeight: 0 }}>
            <Box data-dwrap sx={{ position: 'relative', width: DISC, aspectRatio: '1', display: 'grid', placeItems: 'center' }}>
              <Box data-disc aria-hidden="true" sx={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: t.blue, willChange: 'transform' }} />
              <Box data-hcard sx={{ position: 'relative', width: `${CARD * 100}%`, aspectRatio: '1', borderRadius: { xs: `${t.radiusMd}px`, md: `${t.radiusLg}px` }, backgroundColor: t.white, boxShadow: t.shadowOnBlue, overflow: 'hidden', transform: 'rotate(-6deg)', willChange: 'transform', display: 'grid', placeItems: 'center' }}>
                <Box
                  component="img"
                  src={HERO_SHOT.src}
                  srcSet={HERO_SHOT.srcSet}
                  sizes="(max-width: 899.95px) 46vw, 23vw"
                  alt={HERO_SHOT.alt}
                  width={1600}
                  height={1600}
                  fetchPriority="high"
                  decoding="async"
                  sx={{ width: '108%', maxWidth: 'none', height: 'auto', aspectRatio: '1', mixBlendMode: 'multiply', filter: PHOTO_TILE, willChange: 'transform' }}
                />
              </Box>
            </Box>
          </Box>

          <Box data-hcopy sx={{ position: 'relative', zIndex: 1, gridColumn: 1, gridRow: { xs: 3, md: 2 }, display: 'flex', flexDirection: 'column', gap: 2, maxWidth: { md: 420 } }}>
            <Box component="p" sx={{ m: 0, fontSize: { xs: 15, md: 18 }, lineHeight: 1.55, color: t.ink2, [PHONE]: { display: 'none' } }}>
              Trek boots and everyday sneakers, made in Kathmandu and worn from the Terai to the Khumbu.
            </Box>
            <Box sx={{ display: 'flex', gap: { xs: 1, md: 1.5 }, flexWrap: { xs: 'nowrap', md: 'wrap' }, '& > a': { [PHONE]: { px: 2, fontSize: 14, flex: '1 1 auto' } } }}>
              <Cta to="/shop" variant="solid">Shop all footwear</Cta>
              <Cta to="/g10">G10 in 3D</Cta>
            </Box>
          </Box>
        </Box>

        {/* Two sand stars (decorative): the brand's star, drifting at their own depth. */}
        <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
          <StarShape data-hstar="1" sx={{ position: 'absolute', width: { xs: 44, md: 'clamp(56px, 5.5vw, 92px)' }, right: { xs: '7%', md: '40%' }, top: { xs: '36%', md: '20%' }, transform: 'rotate(-12deg)', willChange: 'transform' }} />
          <StarShape data-hstar="2" sx={{ position: 'absolute', width: { xs: 26, md: 'clamp(30px, 2.6vw, 44px)' }, left: { xs: '8%', md: 'auto' }, right: { md: '5%' }, top: { xs: '72%', md: '80%' }, transform: 'rotate(14deg)', willChange: 'transform' }} />
        </Box>

        {/* The brand line, revealed in white on the flooded blue at the end of the scene. */}
        <Box data-hend sx={{ position: 'absolute', zIndex: 4, left: 0, right: 0, bottom: { xs: '10svh', md: '8svh' }, textAlign: 'center', color: t.onBlue, px: 2, opacity: 0, visibility: 'hidden' }}>
          <Box component="p" sx={{ ...EYEBROW, color: t.sand, m: 0 }}>G10-401 · Trek Everyday</Box>
          <Box component="p" sx={{ ...KINETIC, fontWeight: 760, fontSize: { xs: 34, md: 60 }, mt: 1 }}>Walking the world for over five decades</Box>
        </Box>
      </Box>
    </Box>
  );
}
