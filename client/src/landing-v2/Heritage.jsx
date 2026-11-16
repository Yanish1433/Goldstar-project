import { useRef } from 'react';
import Box from '@mui/material/Box';
import { tokensV2 as t, KINETIC, EYEBROW, PHOTO_MONO, PHONE } from './tokensV2.js';
import { Cta, Eyebrow, WRAP } from './ui.jsx';
import { useSectionMotion } from './motion.js';

// 6. Heritage. Signature move (pinned, scrubbed): a full-bleed photograph zooms out from a close crop to the whole
// scene while a giant "50" counts up from 0 with the scroll and its weight swells from hairline to black; then the
// line "Walking the world for over five decades" (goldstarshoes.com's own) comes up line by line. Scroll up and the
// count runs back down. At rest (no JS, reduced motion) it reads 50+ with everything in place.
export const HERITAGE_LINES = ['Walking the world', 'for over five decades.'];
export const HERITAGE_FACTS = [
  { n: '50+', label: 'years of Goldstar' },
  { n: '77', label: 'districts we deliver to' },
  { n: '1', label: 'home: Kathmandu, Nepal' },
];
export const YEARS = 50;

export default function Heritage() {
  const ref = useRef(null);
  useSectionMotion(ref, (gsap, ScrollTrigger, root) => {
    const mm = gsap.matchMedia();
    const num = root.querySelector('[data-count]');
    const build = (phone) => {
      const counter = { v: 0 };
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root.querySelector('[data-hpin]'), start: 'top top', end: phone ? '+=60%' : '+=110%', pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true },
      });
      tl.fromTo('[data-hphoto]', { scale: 1.7 }, { scale: 1, duration: 1 }, 0)
        .fromTo('[data-hshade]', { opacity: 0.35 }, { opacity: 1, duration: 1 }, 0)
        .fromTo(counter, { v: 0 }, { v: YEARS, duration: 0.6, ease: 'power1.out', onUpdate: () => { num.textContent = String(Math.round(counter.v)); } }, 0)
        .fromTo(num, { fontWeight: 120 }, { fontWeight: 900, duration: 0.6 }, 0)
        .fromTo('[data-plus]', { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.1 }, 0.55)
        .fromTo('[data-hl] > span', { yPercent: 110 }, { yPercent: 0, stagger: 0.08, duration: 0.25 }, 0.55)
        .fromTo('[data-hrest]', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.2 }, 0.75);
    };
    mm.add('(min-width: 900px)', () => build(false));
    mm.add('(max-width: 899.95px)', () => build(true));
    return () => {
      mm.revert();
      num.textContent = String(YEARS);
    };
  });

  return (
    <Box component="section" id="heritage" aria-labelledby="heritage-heading" sx={{ position: 'relative', backgroundColor: t.ground, color: t.ivory }}>
      <Box ref={ref}>
        <Box data-hpin sx={{ position: 'relative', height: '100svh', minHeight: { xs: 640, md: 680 }, overflow: 'hidden', display: 'flex', alignItems: 'center', isolation: 'isolate' }}>
          <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, zIndex: -1, overflow: 'hidden' }}>
            <Box data-hphoto component="img" src="/v2/urban-man.jpg" alt="" width={1024} height={894} loading="lazy" decoding="async"
              sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 78%', filter: PHOTO_MONO, transformOrigin: '50% 82%', willChange: 'transform' }} />
            <Box data-hshade sx={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(90deg, ${t.scrim} 0%, ${t.veil} 50%, transparent 100%), linear-gradient(180deg, ${t.ground} 0%, transparent 25%, transparent 70%, ${t.ground} 100%)` }} />
          </Box>
          <Box sx={{ ...WRAP, position: 'relative', width: '100%', boxSizing: 'border-box', pt: 'var(--appbar-h, 64px)' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 'clamp(12px, 2.4svh, 24px)' }, maxWidth: 900 }}>
              <Eyebrow>Made in Nepal · <Box component="span" lang="ne" sx={{ fontFamily: '"Mukta", sans-serif', letterSpacing: 0, textTransform: 'none', fontSize: 14 }}>नेपालको आफ्नै पाइला</Box></Eyebrow>
              <Box aria-hidden="true" sx={{ display: 'flex', alignItems: 'flex-start', color: t.ivory }}>
                <Box component="span" data-count sx={{ ...KINETIC, fontWeight: 900, fontSize: { xs: 'clamp(140px, 44vw, 210px)', md: 'clamp(170px, min(17vw, 30svh), 300px)' }, lineHeight: 0.78, fontVariantNumeric: 'tabular-nums', minWidth: '1.05ch' }}>{YEARS}</Box>
                <Box component="span" data-plus sx={{ ...KINETIC, fontWeight: 300, fontSize: { xs: 60, md: 'clamp(80px, min(8vw, 14svh), 140px)' }, color: t.gold, lineHeight: 0.8 }}>+</Box>
              </Box>
              <Box component="h2" id="heritage-heading" data-hl sx={{ ...KINETIC, fontWeight: 760, fontSize: { xs: 'clamp(40px, 12vw, 60px)', md: 'clamp(52px, min(5vw, 9svh), 96px)' }, lineHeight: 0.9 }}>
                {HERITAGE_LINES.map((l) => (
                  <Box key={l} component="span" sx={{ display: 'block', overflow: 'hidden', pb: '0.04em' }}>
                    <Box component="span" sx={{ display: 'block' }}>{l}</Box>
                  </Box>
                ))}
              </Box>
              <Box data-hrest sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
                <Box component="p" sx={{ m: 0, maxWidth: '46ch', fontSize: { xs: 15, md: 18 }, lineHeight: 1.6, color: t.ivoryDim }}>
                  Goldstar has been Nepal’s own shoe for more than fifty years: made in Kathmandu, worn from the Terai to the Khumbu. From Nepal to every continent, the journey continues.
                </Box>
                <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: { xs: 2, md: 5 }, borderTop: `1px solid ${t.line}`, pt: { xs: 2, md: 2.5 }, maxWidth: 640, [PHONE]: { display: 'none' }, '@media (max-height: 760px)': { display: 'none' } }}>
                  {HERITAGE_FACTS.map((f) => (
                    <Box component="li" key={f.label} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box component="span" sx={{ ...KINETIC, fontWeight: 700, fontSize: { xs: 36, md: 52 }, lineHeight: 1 }}>{f.n}</Box>
                      <Box component="span" sx={{ ...EYEBROW, letterSpacing: '0.12em' }}>{f.label}</Box>
                    </Box>
                  ))}
                </Box>
                <Box><Cta href="https://goldstarshoes.com/" target="_blank" rel="noopener noreferrer" variant="text">Our story on goldstarshoes.com</Cta></Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
