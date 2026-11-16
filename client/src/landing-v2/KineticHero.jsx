import { useRef } from 'react';
import Box from '@mui/material/Box';
import { tokensV2 as t, KINETIC, EYEBROW, PHOTO_MONO, PHOTO_TILE, PHONE } from './tokensV2.js';
import { Cta } from './ui.jsx';
import { useSectionMotion, MQ } from './motion.js';
import { HERO_SHOT } from './shots.js';

// 1. Hero. First paint is a complete, still composition: the headline whole ("Walk the / world"), the G10-401 pair on
// a lit ivory window between the two lines, the copy and both CTAs. The image is a real <img fetchpriority=high>
// with its size set (the LCP). Nothing starts hidden.
// Signature move (pinned, scrubbed, reverses on the way up): the two lines split letter by letter and slide apart
// to the left and right, the ivory window opens from the centre until it fills the screen while the pair scales up,
// and the Himalayan backdrop drifts slower than the type (depth).
export const HERO_LINES = ['Walk the', 'world'];
export const HERO_LABEL = 'Walk the world. Goldstar shoes, made in Nepal for over five decades.';

// The ivory window's resting box (CSS lengths, so the still composition needs no JS).
const WIN = {
  w: 'min(34vw, 470px)',
  h: 'min(46svh, 470px)',
  wPhone: 'min(72vw, 300px)',
  hPhone: 'min(30svh, 250px)',
};
const clipFor = (w, h, r = 28) => `inset(calc(50% - ${h} / 2) calc(50% - ${w} / 2) calc(50% - ${h} / 2) calc(50% - ${w} / 2) round ${r}px)`;

const lineSx = {
  ...KINETIC,
  display: 'block',
  fontWeight: 860,
  fontSize: { xs: 'clamp(84px, 27vw, 150px)', md: 'clamp(140px, 19.5vw, 360px)' },
  lineHeight: 0.8,
  letterSpacing: '-0.012em',
  whiteSpace: 'nowrap',
  color: t.ivory,
  willChange: 'transform',
};

export default function KineticHero() {
  const ref = useRef(null);

  useSectionMotion(ref, (gsap, ScrollTrigger, root, SplitText) => {
    const mm = gsap.matchMedia();
    const lines = root.querySelectorAll('[data-hline]');
    const splits = [...lines].map((l) => new SplitText(l, { type: 'chars', charsClass: 'hc', aria: 'none' }));
    const win = root.querySelector('[data-win]');
    // The resting window in px (same sizes as WIN), so the clip-path can be interpolated.
    const restClip = (phone) => () => {
      const W = win.offsetWidth;
      const H = win.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = phone ? Math.min(vw * 0.72, 300) : Math.min(vw * 0.34, 470);
      const h = phone ? Math.min(vh * 0.3, 250) : Math.min(vh * 0.46, 470);
      const y = Math.max(0, (H - h) / 2);
      const x = Math.max(0, (W - w) / 2);
      return `inset(${y}px ${x}px ${y}px ${x}px round ${phone ? 24 : 28}px)`;
    };
    const [a, b] = splits;

    const build = (phone) => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root.querySelector('[data-stage]'),
          start: 'top top',
          end: phone ? '+=75%' : '+=100%',
          pin: true,
          scrub: phone ? 0.4 : 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
      // The letters slide apart: line one to the left (last letter leads), line two to the right (first letter leads).
      tl.to(a.chars, { xPercent: -260, yPercent: (i) => (i % 2 ? -18 : 14), rotate: (i) => (i % 2 ? -8 : 6), stagger: { each: 0.03, from: 'end' }, duration: 0.6 }, 0)
        .to(b.chars, { xPercent: 260, yPercent: (i) => (i % 2 ? 16 : -12), rotate: (i) => (i % 2 ? 7 : -5), stagger: { each: 0.03, from: 'start' }, duration: 0.6 }, 0)
        .to('[data-hcopy]', { y: 60, autoAlpha: 0, duration: 0.25 }, 0)
        .to('[data-heyebrow]', { y: -30, autoAlpha: 0, duration: 0.25 }, 0)
        // The window opens from the centre to the full screen and the pair scales up inside it.
        .fromTo('[data-win]', { clipPath: restClip(phone) }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 0.75 }, 0.1)
        .fromTo('[data-win] img', { scale: 1 }, { scale: phone ? 1.6 : 1.9, duration: 0.85 }, 0.1)
        // Depth: the backdrop drifts and dims slower than the type.
        .fromTo('[data-hbg]', { scale: 1.12, yPercent: 0 }, { scale: 1.28, yPercent: 6, duration: 1 }, 0)
        .fromTo('[data-hend]', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.25 }, 0.72);
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
      <Box data-stage sx={{ position: 'relative', height: '100svh', minHeight: { xs: 600, md: 640 }, overflow: 'hidden', isolation: 'isolate' }}>
        {/* Backdrop: a Himalayan trail, pulled into the room (warm mono, dark). Decorative. */}
        <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, zIndex: -1 }}>
          <Box data-hbg component="img" src="/v2/trek-woman.jpg" alt="" width={1024} height={558} decoding="async"
            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '58% 40%', filter: PHOTO_MONO, opacity: 0.55, transform: 'scale(1.12)', transformOrigin: '50% 60%' }} />
          <Box sx={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(ellipse at 50% 50%, transparent 0%, ${t.veil} 70%), linear-gradient(180deg, ${t.scrim} 0%, transparent 28%, transparent 62%, ${t.ground} 100%)` }} />
        </Box>

        {/* The ivory window with the pair. Its clip opens on scroll; at rest it is a centred card. */}
        <Box
          data-win
          sx={{
            position: 'absolute', inset: 0, zIndex: 1, backgroundColor: t.paper,
            clipPath: clipFor(WIN.w, WIN.h),
            [PHONE]: { clipPath: clipFor(WIN.wPhone, WIN.hPhone, 24), top: '-4svh', bottom: '4svh' },
            display: 'grid', placeItems: 'center',
          }}
        >
          <Box
            component="img"
            src={HERO_SHOT.src}
            srcSet={HERO_SHOT.srcSet}
            sizes="(max-width: 899.95px) 72vw, 34vw"
            alt={HERO_SHOT.alt}
            width={1600}
            height={1600}
            fetchPriority="high"
            decoding="async"
            sx={{ width: `calc(${WIN.h} * 0.98)`, height: 'auto', aspectRatio: '1', mixBlendMode: 'multiply', filter: PHOTO_TILE, [PHONE]: { width: `calc(${WIN.hPhone} * 1.02)` }, willChange: 'transform' }}
          />
          <Box data-hend sx={{ position: 'absolute', left: 0, right: 0, bottom: { xs: '9svh', md: '7svh' }, textAlign: 'center', color: t.inkOnPaper, px: 2, opacity: 0, visibility: 'hidden' }}>
            <Box component="p" sx={{ ...EYEBROW, color: t.inkOnPaper2, m: 0 }}>G10-401 · Trek Everyday</Box>
            <Box component="p" sx={{ ...KINETIC, fontWeight: 700, fontSize: { xs: 34, md: 56 }, mt: 1 }}>Walking the world for over five decades</Box>
          </Box>
        </Box>

        {/* Headline: two lines, the window between them. aria-label on the h1; SplitText's letters are aria-hidden. */}
        <Box
          component="h1"
          id="landing-h1"
          aria-label={HERO_LABEL}
          sx={{
            ...KINETIC, position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
            // Ivory letters over the ivory window would vanish: `difference` inverts them where they cross it
            // (ink on the window and the pair, ivory on the dark backdrop), so the line always reads.
            mixBlendMode: 'difference',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            pt: { xs: 'calc(var(--appbar-h, 56px) + 54px)', md: 'calc(var(--appbar-h, 64px) + 6svh)' },
            pb: { xs: 'calc(30svh + 24px)', md: '18svh' },
            px: { xs: 2, md: '4vw' },
          }}
        >
          <Box component="span" data-hline aria-hidden="true" sx={{ ...lineSx, alignSelf: 'flex-start' }}>{HERO_LINES[0]}</Box>
          <Box component="span" data-hline aria-hidden="true" sx={{ ...lineSx, alignSelf: 'flex-end' }}>{HERO_LINES[1]}</Box>
        </Box>

        <Box data-heyebrow component="p" sx={{ ...EYEBROW, position: 'absolute', zIndex: 3, m: 0, left: { xs: 16, md: '4vw' }, top: { xs: 'calc(var(--appbar-h, 56px) + 18px)', md: 'calc(var(--appbar-h, 64px) + 2svh)' }, color: t.ivoryDim }}>
          Goldstar · Made in Nepal
        </Box>

        <Box data-hcopy sx={{ position: 'absolute', zIndex: 3, left: { xs: 16, md: '4vw' }, right: { xs: 16, md: 'auto' }, bottom: { xs: 'calc(88px + env(safe-area-inset-bottom))', md: '6svh' }, display: 'flex', flexDirection: 'column', gap: 2, maxWidth: { md: 380 } }}>
          <Box component="p" sx={{ m: 0, fontSize: { xs: 15, md: 17 }, lineHeight: 1.55, color: t.ivoryDim, [PHONE]: { display: 'none' } }}>
            Trek boots and everyday sneakers, made in Kathmandu and worn from the Terai to the Khumbu.
          </Box>
          <Box sx={{ display: 'flex', gap: { xs: 1, md: 1.5 }, flexWrap: { xs: 'nowrap', md: 'wrap' }, '& > a': { [PHONE]: { px: 2, fontSize: 14 } } }}>
            <Cta to="/shop" variant="solid">Shop all footwear</Cta>
            <Cta to="/g10">G10 in 3D</Cta>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
