import { useRef } from 'react';
import Box from '@mui/material/Box';
import { tokensV2 as t, KINETIC, FINE_POINTER } from './tokensV2.js';
import { Cta, StarShape } from './ui.jsx';
import { useSectionMotion } from './motion.js';

// 8. The last word before the footer: the /g10 story's brand finale, on the landing. A royal-blue band with sand
// "Your adventure begins now.", a sand Goldstar star, GOLDSTAR in white from edge to edge, the Nepali name in sand
// and a sand "Shop all" pill. Signature move (scrubbed, reverses): the letters rise out of their slots one by one, the
// star spins in, the lines fade up. Reduced motion: the still composition (motion never runs).
// The band ends on a sand rule, so the royal blue never touches the footer's navy directly.
export const FINALE_WORD = 'GOLDSTAR';
// "GOLDSTAR" at weight 900, wdth 112, -0.02em is WORD_EM ems wide (measured in Chromium); the font size is the
// width available divided by that, so the word runs edge to edge and never overflows (320 px to 1920 px).
const WORD_EM = 6.62;

export default function AdventureFinale() {
  const ref = useRef(null);

  useSectionMotion(ref, (gsap) => {
    const st = { trigger: ref.current, start: 'top 85%', end: 'top 15%', scrub: 0.6 };
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: st });
    tl.fromTo('[data-fline]', { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3 }, 0)
      .fromTo('[data-fstar]', { scale: 0.2, rotate: -220, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.5, ease: 'back.out(1.6)' }, 0.1)
      .fromTo('[data-fletter]', { yPercent: 105, scaleY: 1.25 }, { yPercent: 0, scaleY: 1, duration: 0.45, stagger: 0.05 }, 0.2)
      .fromTo('[data-fsub]', { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.25, stagger: 0.08 }, 0.65);
  });

  return (
    <Box
      component="section"
      ref={ref}
      id="adventure"
      aria-labelledby="adventure-h"
      sx={{
        position: 'relative', overflow: 'hidden', backgroundColor: t.blue, color: t.onBlue, textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: { xs: '86svh', md: '100svh' }, boxSizing: 'border-box', px: { xs: 2, sm: 4 },
        pt: { xs: 10, md: 'calc(var(--appbar-h, 64px) + 6svh)' }, pb: { xs: 10, md: '10svh' },
        borderBottom: `6px solid ${t.sand}`,
      }}
    >
      <Box data-fline component="p" sx={{ ...KINETIC, fontWeight: 800, color: t.sand, textWrap: 'balance', fontSize: { xs: 'clamp(22px, 7vw, 30px)', md: 'clamp(30px, 3.2vw, 58px)' }, lineHeight: 0.98, letterSpacing: '-0.02em' }}>
        Your adventure begins now.
      </Box>
      <StarShape data-fstar sx={{ width: { xs: 56, md: 'clamp(64px, 5.4vw, 104px)' }, my: { xs: 3, md: '4svh' } }} />
      <Box
        component="h2"
        id="adventure-h"
        aria-label="Goldstar"
        sx={{
          ...KINETIC, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 0.86, color: t.onBlue, whiteSpace: 'nowrap', maxWidth: '100%',
          fontSize: `min(calc((100vw - 32px) / ${WORD_EM}), 300px)`,
          '@media (min-width:600px)': { fontSize: `min(calc((100vw - 96px) / ${WORD_EM}), 300px)` },
        }}
      >
        {FINALE_WORD.split('').map((ch, i) => (
          <Box key={i} component="span" aria-hidden="true" sx={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', pb: '0.04em' }}>
            <Box component="span" data-fletter sx={{ display: 'inline-block', transformOrigin: '50% 100%' }}>{ch}</Box>
          </Box>
        ))}
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
  );
}
