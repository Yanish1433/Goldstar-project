import { Fragment, useRef } from 'react';
import Box from '@mui/material/Box';
import { tokensV2 as t, alpha, KINETIC, FINE_POINTER } from './tokensV2.js';
import { Cta, StarShape } from './ui.jsx';
import { useSectionMotion, MQ } from './motion.js';

// 9. The last word before the footer: the /g10 story's brand finale, on the landing. A royal-blue band with sand
// "Your adventure begins now.", a sand Goldstar star, GOLDSTAR in white from edge to edge, the Nepali name in sand
// and a sand "Shop all" pill.
// Signature move: a slow, pinned sequence (desktop: the stage holds for 175% of the viewport, phones 100%), scrubbed
// with smoothing (scrub 1.2, on top of Lenis), so nothing moves faster than the scroll and everything reverses:
//   1 the two lines of "Your adventure begins now." rise out of their masks, one after the other
//   2 the star turns and grows in (its idle float lives on a wrapper, so the scrub and the float never fight)
//   3 G-O-L-D-S-T-A-R rise one by one out of their slots
//   4 the Nepali name and the Shop all pill fade up
//   5 a sand shine sweeps across GOLDSTAR (a masked window and its counter-moving copy: transform only, no paint)
// No element reaches its final state in the first quarter of the pin. Only transform / opacity / visibility change.
// Reduced motion: the still composition (motion never runs; the shine stays hidden).
// The band ends on a sand rule, so the royal blue never touches the footer's navy directly.
export const FINALE_WORD = 'GOLDSTAR';
export const FINALE_LINES = ['Your adventure', 'begins now.'];
// "GOLDSTAR" at weight 900, wdth 112, -0.02em is 6.46 ems wide (measured in Chromium; WORD_EM keeps a hair of
// margin); the font size is the width available divided by that, so the word runs edge to edge and never overflows
// (320 px to 1920 px).
const WORD_EM = 6.5;
// Pin length, in viewport heights.
export const FINALE_PIN = { desk: 1.75, phone: 1 };
// The shine window is this share of the word's width.
const SHINE_W = 0.22;
// (a mask: only its alpha matters, so black stands for 'shown')
const FEATHER = 'linear-gradient(90deg, transparent, black 42%, black 58%, transparent)';

const WORD_SX = {
  ...KINETIC, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 0.86, whiteSpace: 'nowrap',
  fontSize: `min(calc((100vw - 32px) / ${WORD_EM}), 300px)`,
  '@media (min-width:600px)': { fontSize: `min(calc((100vw - 96px) / ${WORD_EM}), 300px)` },
};

function Letters({ data }) {
  return FINALE_WORD.split('').map((ch, i) => (
    <Box key={i} component="span" aria-hidden="true" sx={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', pb: '0.04em' }}>
      <Box component="span" {...(data ? { [data]: '' } : {})} sx={{ display: 'inline-block', transformOrigin: '0% 100%' }}>{ch}</Box>
    </Box>
  ));
}

export default function AdventureFinale() {
  const ref = useRef(null);

  useSectionMotion(ref, (gsap, ScrollTrigger, root) => {
    // Phones: the address bar showing / hiding must not re-measure (and re-pin) the stage. (GSAP's default, set
    // explicitly because this pin is the last thing on the page.)
    ScrollTrigger.config({ ignoreMobileResize: true });
    const isPhone = () => window.matchMedia(MQ.phone).matches;
    const pin = root.querySelector('[data-fpin]');
    const shine = root.querySelector('[data-fshine]');
    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight * (isPhone() ? FINALE_PIN.phone : FINALE_PIN.desk))}`,
        pin: true,
        pinSpacing: true, // the footer scrolls in after the pin, never under it
        scrub: 1.2,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    // Timeline units: 10 = the whole pin.
    tl.fromTo('[data-fline]', { yPercent: 110, rotate: 2.5 }, { yPercent: 0, rotate: 0, duration: 3.4, stagger: 0.8, ease: 'power1.out' }, 0.2)
      .fromTo('[data-fstar]', { scale: 0.25, rotate: -160, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 3.2, ease: 'power2.out' }, 1.4)
      .fromTo('[data-fletter]', { yPercent: 118, rotate: 6 }, { yPercent: 0, rotate: 0, duration: 2.2, stagger: 0.32, ease: 'expo.out' }, 2.6)
      .fromTo('[data-fsub]', { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.6, stagger: 0.45 }, 6.4)
      // The window travels from just left of the word to just past it; its copy moves the opposite way, so the sand
      // letters inside stay exactly over the white ones. Same duration and ease on both: they stay locked.
      .set(shine, { visibility: 'visible' }, 7.8)
      .fromTo(shine, { xPercent: -100 }, { xPercent: 100 / SHINE_W, duration: 2.2, ease: 'power1.inOut' }, 7.8)
      .fromTo(shine.firstElementChild, { xPercent: SHINE_W * 100 }, { xPercent: -100, duration: 2.2, ease: 'power1.inOut' }, 7.8)
      .set(shine, { visibility: 'hidden' }, 10);
    // Idle float on the wrapper (not on the star the scrub drives), only while the finale is on screen.
    gsap.to('[data-ffloat]', {
      y: isPhone() ? -6 : -10, rotate: 5, duration: 3.2, ease: 'sine.inOut', repeat: -1, yoyo: true,
      scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', toggleActions: 'play pause resume pause' },
    });
  });

  return (
    <Box
      component="section"
      ref={ref}
      id="adventure"
      aria-labelledby="adventure-h"
      sx={{ position: 'relative', overflow: 'hidden', backgroundColor: t.blue, color: t.onBlue, borderBottom: `6px solid ${t.sand}` }}
    >
      <Box
        data-fpin
        sx={{
          position: 'relative', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100svh', minHeight: 520, boxSizing: 'border-box', px: { xs: 2, sm: 4 },
          pt: 'calc(var(--appbar-h, 64px) + 3svh)', pb: { xs: 5, md: '6svh' },
          // A soft, static sand glow behind the word (only the children move).
          backgroundImage: `radial-gradient(ellipse 55% 38% at 50% 58%, ${alpha(t.sand, 0.16)}, ${alpha(t.sand, 0)} 70%)`,
        }}
      >
        <Box component="p" data-flines sx={{ ...KINETIC, fontWeight: 800, color: t.sand, fontSize: { xs: 'clamp(22px, 7vw, 30px)', md: 'clamp(30px, 3.2vw, 58px)' }, lineHeight: 0.98, letterSpacing: '-0.02em' }}>
          {FINALE_LINES.map((l, i) => (
            <Fragment key={l}>
              {i ? ' ' : null}
              <Box component="span" sx={{ display: 'block', overflow: 'hidden', pb: '0.06em' }}>
                <Box component="span" data-fline sx={{ display: 'block', transformOrigin: '0% 100%' }}>{l}</Box>
              </Box>
            </Fragment>
          ))}
        </Box>
        <Box data-ffloat sx={{ my: { xs: 3, md: '4svh' } }}>
          <StarShape data-fstar sx={{ width: { xs: 56, md: 'clamp(64px, 5.4vw, 104px)' } }} />
        </Box>
        <Box sx={{ position: 'relative', maxWidth: '100%' }}>
          <Box component="h2" id="adventure-h" aria-label="Goldstar" sx={{ ...WORD_SX, color: t.onBlue }}>
            <Letters data="data-fletter" />
          </Box>
          {/* The shine: a narrow feathered window holding a sand copy of the word (hidden at rest). */}
          <Box
            data-fshine
            aria-hidden="true"
            sx={{
              position: 'absolute', top: 0, bottom: 0, left: 0, width: `${SHINE_W * 100}%`, overflow: 'hidden', visibility: 'hidden', pointerEvents: 'none',
              maskImage: FEATHER, WebkitMaskImage: FEATHER,
            }}
          >
            <Box sx={{ ...WORD_SX, position: 'absolute', top: 0, left: 0, width: `${100 / SHINE_W}%`, color: t.sand, textAlign: 'center' }}>
              <Letters />
            </Box>
          </Box>
        </Box>
        {/* Mukta is loaded at 600 only: no heavier weight here (it would be faux-bolded). */}
        <Box data-fsub component="p" lang="ne" sx={{ m: 0, fontFamily: 'Mukta, sans-serif', fontWeight: 600, fontSize: { xs: 30, md: 'clamp(36px, 4vw, 68px)' }, lineHeight: 1.15, mt: { xs: 1.5, md: 2 }, color: t.sand }}>
          गोल्डस्टार
        </Box>
        <Box data-fsub sx={{ mt: { xs: 4, md: '5svh' } }}>
          <Cta
            to="/shop"
            variant="solid"
            onBlue
            icon={false}
            sx={{
              px: 4.5, fontSize: 17, backgroundColor: t.sand, borderColor: t.sand, color: t.ink,
              [FINE_POINTER]: { '&:hover': { backgroundColor: t.white, borderColor: t.white, color: t.blue } },
            }}
          >
            Shop all
          </Cta>
        </Box>
      </Box>
    </Box>
  );
}
