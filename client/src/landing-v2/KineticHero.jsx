import { useRef, useId } from 'react';
import Box from '@mui/material/Box';
import { tokensV2 as t, KINETIC, HERO_SCRIPT, EYEBROW, PHONE, SHORT } from './tokensV2.js';
import { Cta, StarShape } from './ui.jsx';
import { useSectionMotion, MQ } from './motion.js';
import SideDoodles, { useSideScrub } from './SideDoodles.jsx';

// Side layer (see SideDoodles.jsx): desktop only, in the free strips beside the hero's content.
const SIDE = [
  { k: 'star', lx: 5.5, top: '20%', w: 44, rot: -10, d: 160, spin: 200, o: 0.9 },
  { k: 'boot', lx: 5.5, top: '40%', w: 68, rot: -6, d: 180, tilt: 6, c: 'blue', o: 0.6 },
  { k: 'feet', lx: 5.5, top: '62%', w: 52, rot: 8, d: 150, tilt: -5, c: 'ink', o: 0.5 },
  { k: 'star', lx: 5.5, top: '80%', w: 26, rot: 12, d: 200, spin: 240, o: 0.9 },
  { k: 'sneaker', lx: 94.5, top: '14%', w: 64, rot: 6, d: 170, tilt: -5, c: 'blue', o: 0.6 },
  { k: 'star', lx: 94.5, top: '34%', w: 40, rot: 12, d: 190, spin: -180, o: 0.9 },
  { k: 'feet', lx: 94.5, top: '50%', w: 52, rot: -8, d: 140, tilt: 5, c: 'ink', o: 0.5 },
  { k: 'star', lx: 94.5, top: '66%', w: 24, rot: -14, d: 200, spin: 220, o: 0.9 },
];

// 1. Hero. First paint is a complete, still composition on a white ground: the headline whole in big, wide navy
// type ("Walk the / world"), the Goldstar group photo (four friends in Goldstar sneakers on the photo's own sky blue,
// with its orange ribbons) in a tall arch, the copy and both CTAs, two sand Goldstar stars. The photo is a real
// <img fetchpriority=high> with its size set (the LCP). Nothing starts hidden.
// Signature move (pinned, scrubbed, reverses on the way up): the letters split and fly apart, the photo's own sky
// floods the screen from behind the arch (a flat photoGround circle that swells: the arch's edges melt into it), the
// arch glides to the centre, the stars spin up, and the brand line lands in navy on the sky.
// Only transform / opacity are animated (no filters, no clip-paths on scroll).
export const HERO_LINES = ['Walk the', 'world'];
export const HERO_LABEL = 'Walk the world. Goldstar shoes, made in Nepal for over five decades.';

// The photo: 904 x 1044 (the cleaned goldstarshoes.com original is 1024 x 1264; it is never upscaled: the arch is
// at most 600 CSS px wide). Phones / tablets: as big as its grid cell allows (the cell is a size container).
export const HERO_PHOTO = {
  src: '/img/landing/group-904.webp',
  srcSet: '/img/landing/group-600.webp 600w, /img/landing/group-904.webp 904w',
  sizes: '(max-width: 899.95px) 78vw, 38vw',
  width: 904,
  height: 1044,
  alt: 'Four friends in Goldstar sneakers laughing together on a sky-blue backdrop with orange ribbons',
};
const RATIO = HERO_PHOTO.width / HERO_PHOTO.height;
const ARCH_W = {
  xs: `min(84cqw, calc(96cqh * ${RATIO.toFixed(4)}), 440px)`,
  md: `min(38vw, calc((100svh - var(--appbar-h, 64px) - 12svh) * ${RATIO.toFixed(4)}), 600px)`,
};
// A true semicircle on top: horizontal radius half the width, vertical radius the same length (w/2 = RATIO/2 of h).
const ARCH_RADIUS = `50% 50% 28px 28px / ${((RATIO / 2) * 100).toFixed(2)}% ${((RATIO / 2) * 100).toFixed(2)}% 28px 28px`;

// The headline is the one place that takes the brush face (HERO_SCRIPT: Caveat Brush caps). Size from the longest
// line: "WALK THE" is ~3.63 em wide in it (+0.08 em tracking), so HL_EM = 3.75 keeps it inside its column (320 px
// phones included). The brush's stroke ends overhang the advance width a little; nothing here masks overflow.
// The -4deg tilt sits on the h1 wrapper, never on the letters (the scrub animates their transforms).
const HL_EM = 3.75;
// Desktop size is height-aware (svh cap, px floor): the stage grows (min-height) rather than letting the column rise under
// the fixed AppBar. The -4deg tilt about the bottom-left lifts the right end by ~sin 4deg x line width (~3.7 em x 0.07 =
// 0.26 em), so the h1 keeps that much padding on top.
export const HL_SIZE = {
  xs: `min(calc((100vw - 32px) / ${HL_EM}), 104px)`,
  md: `clamp(72px, calc(36vw / ${HL_EM}), min(15svh, 170px))`,
};
// Landscape phones (SHORT): two columns, the headline + CTAs left and the arch right, all in the first screen. The
// headline is sized by the height (23svh: eyebrow + two lines + tilt + the CTA row fit in 100svh under the bar) and by
// its column (about half the screen, minus the gutters).
export const HL_SIZE_SHORT = `min(23svh, calc((50vw - 36px) / ${HL_EM}), 104px)`;
const h1Sx = {
  ...KINETIC, ...HERO_SCRIPT, fontSize: HL_SIZE, m: 0, transform: 'rotate(-4deg)', transformOrigin: '0% 100%', pl: '0.04em', pt: { xs: '0.1em', md: '0.28em' }, pb: '0.08em',
  [SHORT]: { fontSize: HL_SIZE_SHORT, pt: '0.24em' },
};
const lineSx = {
  ...HERO_SCRIPT,
  display: 'block',
  fontSize: '1em',
  lineHeight: 0.88,
  whiteSpace: 'nowrap',
  color: t.ink,
  willChange: 'transform',
};

// The brush "signature" after WORLD: two hand-painted exclamation marks "!!" (tapered bars over a dot, filled shapes,
// rough edges from a static turbulence displacement). Absolute and sized in em, so it scales with the headline and
// never changes its box (no layout shift). Drawn on top-to-bottom by a stroked centre-line mask (see the effect);
// with no JS or reduced motion it is simply fully drawn.
function Flourish() {
  const uid = useId().replace(/:/g, '');
  const f = `hf-${uid}`;
  const m = `hm-${uid}`;
  return (
    <Box
      component="svg"
      data-hflour
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 100 100"
      sx={{ position: 'absolute', left: 'calc(100% + 0.06em)', bottom: '0.02em', width: '0.78em', height: '0.86em', overflow: 'visible', pointerEvents: 'none', display: { xs: 'block', md: 'block' }, [SHORT]: { display: 'block' } }}
    >
      <defs>
        <filter id={f} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" />
        </filter>
        <mask id={m} maskUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120">
          <path data-hdraw pathLength="1" d="M32 -2 L27 76 M26 79 L26 99" stroke="white" strokeWidth="34" fill="none" strokeLinecap="butt" />
          <path data-hdraw pathLength="1" d="M74 -2 L69 76 M68 79 L68 99" stroke="white" strokeWidth="34" fill="none" strokeLinecap="butt" />
        </mask>
      </defs>
      <g mask={`url(#${m})`}>
        <g filter={`url(#${f})`} fill={t.blue}>
          {/* Each "!": a brush bar, fat at the top and tapering to a point, leaning forward with the headline, then a dot. */}
          <path d="M18 7 C24 0 40 0 45 6 C43 28 37 50 31 71 C29 74 25 74 24 71 C21 50 18 28 18 7 Z" />
          <ellipse cx="26" cy="88" rx="10" ry="8.5" transform="rotate(-14 26 88)" />
          <path d="M60 7 C66 0 82 0 87 6 C85 28 79 50 73 71 C71 74 67 74 66 71 C63 50 60 28 60 7 Z" />
          <ellipse cx="68" cy="88" rx="10" ry="8.5" transform="rotate(-14 68 88)" />
        </g>
      </g>
    </Box>
  );
}

export default function KineticHero() {
  const ref = useRef(null);
  const sideRef = useSideScrub({ start: 'top top' });

  useSectionMotion(ref, (gsap, ScrollTrigger, root, SplitText) => {
    const mm = gsap.matchMedia();
    const lines = root.querySelectorAll('[data-hline]');
    const splits = [...lines].map((l) => new SplitText(l, { type: 'chars', charsClass: 'hc', aria: 'none' }));
    const stage = root.querySelector('[data-stage]');
    const wrap = root.querySelector('[data-awrap]');
    // Geometry from untransformed boxes, relative to the stage (the stage is the screen while pinned).
    const geo = () => {
      const s = stage.getBoundingClientRect();
      const w = wrap.getBoundingClientRect();
      const cx = w.left - s.left + w.width / 2;
      const cy = w.top - s.top + w.height / 2;
      const far = Math.max(Math.hypot(cx, cy), Math.hypot(s.width - cx, cy), Math.hypot(cx, s.height - cy), Math.hypot(s.width - cx, s.height - cy));
      return { cx, cy, W: s.width, H: s.height, aw: w.width, ah: w.height, cover: (far * 2) / Math.max(1, w.width * 0.88) + 0.08 };
    };
    const [a, b] = splits;
    const short = () => window.matchMedia(MQ.short).matches;

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
      // Brush caps differ a lot in width (W vs L), so the throw is a fixed distance in ems (not a % of each letter's own
      // width, which piled the narrow letters onto the wide ones). The leader is the letter at the exit end (first letter
      // flying left, last letter flying right), so the rest follow in a train instead of piling onto it.
      const em = (el) => parseFloat(getComputedStyle(el).fontSize) || 80;
      tl.to(a.chars, { x: (i, el) => -em(el) * 2.8, yPercent: (i) => (i % 2 ? -22 : 16), rotate: (i) => (i % 2 ? -10 : 7), stagger: { each: 0.03, from: 'start' }, duration: 0.55 }, 0)
        .to(b.chars, { x: (i, el) => em(el) * 3.2, yPercent: (i) => (i % 2 ? 18 : -14), rotate: (i) => (i % 2 ? 8 : -6), stagger: { each: 0.03, from: 'end' }, duration: 0.55 }, 0)
        .to('[data-hcopy]', { y: 50, autoAlpha: 0, duration: 0.22 }, 0)
        .to('[data-heyebrow]', { y: -30, autoAlpha: 0, duration: 0.22 }, 0)
        // The photo's sky floods the screen from behind the arch (a flat circle, transform only; no will-change: a
        // layer rasterised at rest size and scaled up goes soft, repainting a flat circle per frame is cheap).
        .fromTo('[data-flood]', { scale: 1 }, { scale: () => geo().cover, duration: 0.7, ease: 'power2.in', force3D: false }, 0.08)
        // The arch glides to the centre of the screen, sized to leave room for the brand line below it.
        .fromTo('[data-arch]', { x: 0, y: 0, scale: 1 }, {
          x: () => { const g = geo(); return g.W / 2 - g.cx; },
          y: () => { const g = geo(); return g.H * (phone ? (short() ? 0.4 : 0.42) : 0.43) - g.cy; },
          scale: () => { const g = geo(); return Math.min((g.H * (phone ? (short() ? 0.52 : 0.56) : 0.62)) / g.ah, (g.W * 0.86) / g.aw); },
          duration: 0.75,
          ease: 'power2.inOut',
          force3D: false,
        }, 0.08)
        .fromTo('[data-arch] img', { scale: 1 }, { scale: 1.06, duration: 0.75, force3D: false }, 0.08)
        .to('[data-ashadow]', { opacity: 0, duration: 0.4 }, 0.45)
        // The stars spin up and drift (depth: the near one travels further).
        .to('[data-hstar="1"]', { rotate: 220, yPercent: -160, xPercent: -40, scale: 1.4, duration: 1 }, 0)
        .to('[data-hstar="2"]', { rotate: -160, yPercent: -90, xPercent: 60, duration: 1 }, 0)
        // The signature leaves with WORLD.
        .to('[data-hflour]', { x: () => em(b.chars[0] || wrap) * 3.2, autoAlpha: 0, duration: 0.3 }, 0)
        .fromTo('[data-hend]', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.22 }, 0.74);
      return tl;
    };
    // The brush face swaps in after first paint and changes the headline's height: re-measure the pins below.
    let dead = false;
    document.fonts?.ready.then(() => { if (!dead) ScrollTrigger.refresh(); });
    mm.add(MQ.desk, () => { build(false); });
    mm.add(MQ.phone, () => { build(true); });
    // The stroke draws itself on once the brush face is in (the default render is fully drawn: the hidden state is
    // set here only, and only when motion is welcome).
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const strokes = root.querySelectorAll('[data-hdraw]');
      if (!strokes.length) return undefined;
      gsap.set(strokes, { strokeDasharray: 1, strokeDashoffset: 1 });
      const draw = () => { if (!dead) gsap.to(strokes, { strokeDashoffset: 0, duration: 0.3, ease: 'power1.out', stagger: 0.22, delay: 0.1 }); };
      if (document.fonts?.ready) document.fonts.ready.then(draw); else draw();
      return () => gsap.set(strokes, { clearProps: 'strokeDasharray,strokeDashoffset' });
    });
    return () => {
      dead = true;
      mm.revert();
      splits.forEach((s) => s.revert());
    };
  }, [], { split: true });

  return (
    <Box component="section" ref={ref} id="hero" aria-labelledby="landing-h1" sx={{ position: 'relative', backgroundColor: t.ground }}>
      <Box data-stage sx={{ position: 'relative', minHeight: { xs: 'max(100svh, 600px)', md: 'max(100svh, 640px)' }, [SHORT]: { minHeight: 'max(100svh, 300px)' }, overflow: 'hidden', isolation: 'isolate', backgroundColor: t.ground }}>
        <Box
          sx={{
            position: 'relative', minHeight: 'inherit', display: 'grid', boxSizing: 'border-box',
            pt: { xs: 'calc(var(--appbar-h, 56px) + 14px)', md: 'calc(var(--appbar-h, 64px) + max(3svh, 16px))' },
            pb: { xs: 'calc(88px + env(safe-area-inset-bottom))', md: '6svh' }, // phones: clear of the WhatsApp button
            px: { xs: 2, md: '4vw' },
            gap: { xs: 2, md: 'clamp(40px, 5vw, 96px)' },
            justifyContent: { md: 'center' },
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, max-content) minmax(0, max-content)' },
            gridTemplateRows: { xs: 'auto minmax(0, 1fr) auto', md: 'minmax(0, 1fr)' },
            // Landscape phones: text column left, arch right, one row; the gutters clear a notch.
            [SHORT]: {
              pt: 'calc(var(--appbar-h, 52px) + 8px)', pb: 'max(12px, env(safe-area-inset-bottom))',
              pl: 'max(16px, env(safe-area-inset-left))', pr: 'max(16px, env(safe-area-inset-right))',
              gap: '20px', gridTemplateColumns: 'minmax(0, 1.12fr) minmax(0, 0.88fr)', gridTemplateRows: 'minmax(0, 1fr)',
            },
          }}
        >
          {/* The arch with the group photo; the photo-sky circle behind it is what floods the screen. */}
          <Box sx={{ position: 'relative', zIndex: 2, gridColumn: { xs: 1, md: 2 }, gridRow: { xs: 2, md: 1 }, display: 'grid', placeItems: 'center', minHeight: 0, containerType: { xs: 'size', md: 'normal' }, [SHORT]: { gridColumn: 2, gridRow: 1, containerType: 'size' } }}>
            <Box data-awrap sx={{ position: 'relative', width: ARCH_W, [SHORT]: { width: ARCH_W.xs }, aspectRatio: `${HERO_PHOTO.width} / ${HERO_PHOTO.height}` }}>
              <Box data-flood aria-hidden="true" sx={{ position: 'absolute', left: '6%', width: '88%', top: '6%', aspectRatio: '1', borderRadius: '50%', backgroundColor: t.photoGround }} />
              <Box data-arch sx={{ position: 'absolute', inset: 0 }}>
                <Box data-ashadow aria-hidden="true" sx={{ position: 'absolute', inset: 0, borderRadius: ARCH_RADIUS, boxShadow: t.shadowElevated }} />
                <Box sx={{ position: 'absolute', inset: 0, borderRadius: ARCH_RADIUS, overflow: 'hidden', backgroundColor: t.photoGround }}>
                <Box
                  component="img"
                  src={HERO_PHOTO.src}
                  srcSet={HERO_PHOTO.srcSet}
                  sizes={HERO_PHOTO.sizes}
                  alt={HERO_PHOTO.alt}
                  width={HERO_PHOTO.width}
                  height={HERO_PHOTO.height}
                  fetchPriority="high"
                  decoding="async"
                  sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', transformOrigin: '50% 60%' }}
                />
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Text column: phones lay its two parts out in the grid rows around the arch (display: contents); desktop
              stacks them in one block centred in the row (never end-aligned: that is what pushed it under the bar). */}
          <Box data-hcol sx={{ display: { xs: 'contents', md: 'flex' }, flexDirection: 'column', gap: { md: '3svh' }, gridColumn: 1, gridRow: 1, alignSelf: { md: 'center' }, minWidth: 0, position: { md: 'relative' }, zIndex: { md: 1 }, [SHORT]: { display: 'flex', gap: '16px', alignSelf: 'center', position: 'relative', zIndex: 1 } }}>
          {/* Headline block. aria-label on the h1; SplitText's letters are aria-hidden. */}
          <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: { xs: 1.5, md: '2.4svh' }, [SHORT]: { gap: '6px' }, gridColumn: 1, gridRow: 1, minWidth: 0 }}>
            <Box data-heyebrow component="p" sx={{ ...EYEBROW, m: 0 }}>Goldstar · Made in Nepal</Box>
            <Box component="h1" id="landing-h1" aria-label={HERO_LABEL} sx={h1Sx}>
              <Box component="span" data-hline aria-hidden="true" sx={lineSx}>{HERO_LINES[0]}</Box>
              <Box component="span" sx={{ display: 'block', position: 'relative', width: 'fit-content' }}>
                <Box component="span" data-hline aria-hidden="true" sx={{ ...lineSx, color: t.blue }}>{HERO_LINES[1]}</Box>
                <Flourish />
              </Box>
            </Box>
          </Box>

          <Box data-hcopy sx={{ position: 'relative', zIndex: 1, gridColumn: 1, gridRow: { xs: 3, md: 'auto' }, display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 }, maxWidth: { md: 440 } }}>
            <Box component="p" sx={{ m: 0, fontSize: { xs: 15, md: 18 }, lineHeight: 1.55, color: t.ink2, [PHONE]: { display: 'none' }, [SHORT]: { display: 'none' } }}>
              Trek boots and everyday sneakers, made in Kathmandu and worn from the Terai to the Khumbu.
            </Box>
            <Box sx={{ display: 'flex', gap: { xs: 1, md: 1.5 }, flexWrap: { xs: 'nowrap', md: 'wrap' }, '& > a': { [PHONE]: { px: 2, fontSize: 14, flex: '1 1 auto' }, [SHORT]: { px: 2.5, fontSize: 14, flex: '0 1 auto' }, [`${SHORT} and (max-width:699.95px)`]: { px: 2, '& svg': { display: 'none' } } }, '@media (max-width:359.95px)': { flexWrap: 'wrap' }, [SHORT]: { flexWrap: 'nowrap' } }}>
              <Cta to="/shop" variant="solid">Shop all footwear</Cta>
              <Cta to="/g10">G10 in 3D</Cta>
            </Box>
          </Box>
          </Box>
        </Box>

        <SideDoodles items={SIDE} layerRef={sideRef} />

        {/* Two sand stars (decorative): the brand's star, drifting at their own depth. */}
        <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
          <StarShape data-hstar="1" sx={{ position: 'absolute', width: { xs: 44, md: 'clamp(56px, 5.5vw, 92px)' }, right: { xs: '7%', md: '40%' }, top: { xs: '36%', md: '20%' }, [SHORT]: { width: 36, right: '42%', top: '20%' }, transform: 'rotate(-12deg)', willChange: 'transform' }} />
          <StarShape data-hstar="2" sx={{ position: 'absolute', width: { xs: 26, md: 'clamp(30px, 2.6vw, 44px)' }, left: { xs: '5%', md: 'auto' }, right: { md: '5%' }, top: { xs: '58%', md: '80%' }, [SHORT]: { width: 22, left: 'auto', right: '3%', top: '80%' }, transform: 'rotate(14deg)', willChange: 'transform' }} />
        </Box>

        {/* The brand line, revealed in navy on the flooded sky at the end of the scene. */}
        <Box data-hend sx={{ position: 'absolute', zIndex: 4, left: 0, right: 0, bottom: { xs: '9svh', md: '6svh' }, [SHORT]: { bottom: '5svh' }, textAlign: 'center', color: t.ink, px: 2, opacity: 0, visibility: 'hidden' }}>
          <Box component="p" sx={{ ...EYEBROW, color: t.ink, m: 0 }}>Goldstar · Made in Nepal</Box>
          <Box component="p" sx={{ ...KINETIC, fontWeight: 800, fontSize: { xs: 'clamp(17px, 5.2vw, 28px)', md: 'clamp(30px, 3vw, 50px)' }, mt: 1, mx: 'auto', maxWidth: '22ch', textWrap: 'balance', [SHORT]: { fontSize: 'clamp(16px, 5.4svh, 24px)', maxWidth: '36ch', mt: 0.5 } }}>Walking the world for over five decades</Box>
        </Box>
      </Box>
    </Box>
  );
}
