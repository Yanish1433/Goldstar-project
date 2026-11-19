import { useRef } from 'react';
import Box from '@mui/material/Box';
import { tokensV2 as t, KINETIC, EYEBROW, PHONE } from './tokensV2.js';
import { Cta, Eyebrow, WRAP } from './ui.jsx';
import { useSectionMotion } from './motion.js';

// 6. Heritage. Signature move: a royal-blue arch rises out of the cream gallery as the section scrolls in (a colour
// wipe, one transform), then the section pins and a giant sand "50" counts up from 0 with the scroll while its
// weight swells from hairline to black; the line "Walking the world for over five decades" (goldstarshoes.com's own)
// comes up line by line, under a large outlined Goldstar star that turns with the scroll. Scroll up and it all runs
// back. At rest (no JS, reduced motion) the section is plain royal blue and reads 50+ with everything in place.
export const HERITAGE_LINES = ['Walking the world', 'for over five decades.'];
export const HERITAGE_FACTS = [
  { n: '50+', label: 'years of Goldstar' },
  { n: '77', label: 'districts we deliver to' },
  { n: '1', label: 'home: Kathmandu, Nepal' },
];
export const YEARS = 50;
const ARCH = '22svh'; // how far the arch's curve rises above the panel

export default function Heritage() {
  const ref = useRef(null);
  useSectionMotion(ref, (gsap, ScrollTrigger, root) => {
    const mm = gsap.matchMedia();
    const num = root.querySelector('[data-count]');
    const pin = root.querySelector('[data-hpin]');
    const build = (phone) => {
      // The wipe: the blue arch rises while the section scrolls into view (not pinned yet).
      gsap.fromTo('[data-hwipe]', { yPercent: 100 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: pin, start: 'top bottom', end: 'top top', scrub: 0.4, invalidateOnRefresh: true } });
      const counter = { v: 0 };
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: pin, start: 'top top', end: phone ? '+=60%' : '+=85%', pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true },
      });
      tl.fromTo('[data-hin]', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.12, stagger: 0.04 }, 0)
        .fromTo(counter, { v: 0 }, { v: YEARS, duration: 0.6, ease: 'power1.out', onUpdate: () => { num.textContent = String(Math.round(counter.v)); } }, 0)
        .fromTo(num, { fontWeight: 120 }, { fontWeight: 900, duration: 0.6 }, 0)
        .fromTo('[data-plus]', { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.1 }, 0.55)
        .fromTo('[data-hl] > span > span', { yPercent: 110 }, { yPercent: 0, stagger: 0.08, duration: 0.25 }, 0.55)
        .fromTo('[data-hrest]', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.2 }, 0.75)
        .fromTo('[data-hstar]', { rotate: -36, scale: 0.82 }, { rotate: 36, scale: 1, duration: 1 }, 0);
    };
    mm.add('(min-width: 900px)', () => build(false));
    mm.add('(max-width: 899.95px)', () => build(true));
    return () => {
      mm.revert();
      num.textContent = String(YEARS);
    };
  });

  return (
    <Box component="section" id="heritage" aria-labelledby="heritage-heading" sx={{ position: 'relative', backgroundColor: t.cream, color: t.onBlue }}>
      <Box ref={ref}>
        <Box data-hpin sx={{ position: 'relative', height: '100svh', minHeight: { xs: 640, md: 680 }, overflow: 'hidden', display: 'flex', alignItems: 'center', isolation: 'isolate' }}>
          {/* The blue arch (decorative): at rest it fills the section; the wipe slides it up from below. */}
          <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, zIndex: -1, overflow: 'hidden' }}>
            <Box data-hwipe sx={{ position: 'absolute', left: '-12%', right: '-12%', top: `-${ARCH}`, bottom: 0, backgroundColor: t.blue, borderRadius: `50% 50% 0 0 / ${ARCH} ${ARCH} 0 0`, willChange: 'transform' }} />
            {/* The Goldstar star, outlined in sand, turning with the scroll. */}
            <Box data-hstar component="svg" viewBox="0 0 24 24" sx={{ position: 'absolute', width: { xs: '120vw', md: 'min(62vw, 120svh)' }, right: { xs: '-48vw', md: '-8vw' }, top: '50%', mt: { xs: '-60vw', md: 'min(-31vw, -60svh)' }, opacity: { xs: 0.45, md: 1 }, willChange: 'transform' }}>
              <path d="M12 1.6l3.05 6.6 7.25.86-5.36 4.95 1.45 7.15L12 17.62l-6.39 3.54 1.45-7.15L1.7 9.06l7.25-.86z" fill="none" stroke={t.sand} strokeWidth="0.12" strokeLinejoin="round" />
            </Box>
          </Box>
          <Box sx={{ ...WRAP, position: 'relative', width: '100%', boxSizing: 'border-box', pt: 'var(--appbar-h, 64px)' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 'clamp(12px, 2.4svh, 24px)' }, maxWidth: 900 }}>
              <Eyebrow onBlue data-hin>Made in Nepal · <Box component="span" lang="ne" sx={{ fontFamily: '"Mukta", sans-serif', letterSpacing: 0, textTransform: 'none', fontSize: 14 }}>नेपालको आफ्नै पाइला</Box></Eyebrow>
              <Box data-hin aria-hidden="true" sx={{ display: 'flex', alignItems: 'flex-start', color: t.sand }}>
                <Box component="span" data-count sx={{ ...KINETIC, fontWeight: 900, fontSize: { xs: 'clamp(140px, 44vw, 210px)', md: 'clamp(170px, min(17vw, 30svh), 300px)' }, lineHeight: 0.78, fontVariantNumeric: 'tabular-nums', minWidth: '1.05ch' }}>{YEARS}</Box>
                <Box component="span" data-plus sx={{ ...KINETIC, fontWeight: 300, fontSize: { xs: 60, md: 'clamp(80px, min(8vw, 14svh), 140px)' }, color: t.onBlue, lineHeight: 0.8 }}>+</Box>
              </Box>
              <Box component="h2" id="heritage-heading" data-hl sx={{ ...KINETIC, fontWeight: 760, fontSize: { xs: 'clamp(40px, 12vw, 60px)', md: 'clamp(52px, min(5vw, 9svh), 96px)' }, lineHeight: 0.9, color: t.onBlue }}>
                {HERITAGE_LINES.map((l) => (
                  <Box key={l} component="span" sx={{ display: 'block', overflow: 'hidden', pb: '0.04em' }}>
                    <Box component="span" sx={{ display: 'block' }}>{l}</Box>
                  </Box>
                ))}
              </Box>
              <Box data-hrest sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
                <Box component="p" sx={{ m: 0, maxWidth: '46ch', fontSize: { xs: 15, md: 18 }, lineHeight: 1.6, color: t.onBlue2 }}>
                  Goldstar has been Nepal’s own shoe for more than fifty years: made in Kathmandu, worn from the Terai to the Khumbu. From Nepal to every continent, the journey continues.
                </Box>
                <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: { xs: 2, md: 5 }, borderTop: `1px solid ${t.lineOnBlue}`, pt: { xs: 2, md: 2.5 }, maxWidth: 640, [PHONE]: { display: 'none' }, '@media (max-height: 760px)': { display: 'none' } }}>
                  {HERITAGE_FACTS.map((f) => (
                    <Box component="li" key={f.label} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box component="span" sx={{ ...KINETIC, fontWeight: 700, fontSize: { xs: 36, md: 52 }, lineHeight: 1, color: t.onBlue }}>{f.n}</Box>
                      <Box component="span" sx={{ ...EYEBROW, letterSpacing: '0.12em', color: t.onBlue2 }}>{f.label}</Box>
                    </Box>
                  ))}
                </Box>
                <Box><Cta href="https://goldstarshoes.com/" target="_blank" rel="noopener noreferrer" variant="text" onBlue>Our story on goldstarshoes.com</Cta></Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
