import { useRef } from 'react';
import Box from '@mui/material/Box';
import { useProduct } from '../api/hooks.js';
import { formatNPR } from '../lib/format.js';
import { COLOURWAYS, STORY_MODEL } from '../story/model.config.js';
import { tokensV2 as t, DISPLAY_LIGHT, EYEBROW, PHONE } from './tokensV2.js';
import { Cta, Eyebrow, Section, WRAP } from './ui.jsx';
import { useSectionMotion } from './motion.js';

// 4. The featured G10 band. No second WebGL canvas here (the hero owns the page's only one): the outsole photograph
// is revealed through a clip-path wipe scrubbed by the scroll, beside real counts from the model, and the band
// sends people to the full 3D story at /g10.
export const G10_STATS = [
  { n: STORY_MODEL.order.length, label: 'parts, modelled one by one' },
  { n: 8, label: 'layers to take apart' },
  { n: COLOURWAYS.length, label: 'colourways' },
];

export default function G10Band() {
  const ref = useRef(null);
  const g10 = useProduct('g10-401');
  const from = g10.data?.colourways?.length ? Math.min(...g10.data.colourways.map((c) => c.price)) : null;
  useSectionMotion(ref, (gsap) => {
    gsap.fromTo('[data-sole]', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', ease: 'none', scrollTrigger: { trigger: '[data-sole-wrap]', start: 'top 85%', end: 'center 50%', scrub: 0.6 } });
    gsap.fromTo('[data-giant]', { xPercent: 6 }, { xPercent: -6, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('[data-stat]', { y: 28, opacity: 0, duration: 1.1, stagger: 0.1, scrollTrigger: { trigger: '[data-stats]', start: 'top 88%' } });
  });
  return (
    <Section id="g10" labelledBy="g10-heading" sx={{ py: { xs: 10, md: 16 }, overflow: 'hidden' }}>
      <Box ref={ref} sx={{ ...WRAP, position: 'relative' }}>
        <Box
          data-giant
          aria-hidden="true"
          sx={{ ...DISPLAY_LIGHT, fontWeight: 200, position: 'absolute', top: { xs: 40, md: 0 }, right: { xs: -20, md: -40 }, fontSize: { xs: '44vw', md: '30vw' }, lineHeight: 0.8, color: 'transparent', WebkitTextStroke: `1px ${t.line}`, pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap' }}
        >
          G10
        </Box>
        <Box sx={{ position: 'relative', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: { xs: 6, md: 8 }, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Eyebrow>Featured · The G10 series</Eyebrow>
            <Box component="h2" id="g10-heading" sx={{ ...DISPLAY_LIGHT, color: t.ivory, fontSize: { xs: 'clamp(40px, 12vw, 60px)', md: 'clamp(64px, 6.6vw, 120px)' } }}>
              G10-401
              <Box component="span" sx={{ display: 'block', fontSize: '0.42em', color: t.ivoryDim, letterSpacing: '-0.02em', mt: 1 }}>Grip that reads the ground.</Box>
            </Box>
            <Box component="p" sx={{ m: 0, maxWidth: '42ch', fontSize: { xs: 16, md: 18 }, lineHeight: 1.6, color: t.ivoryDim }}>
              A mid-cut trek boot made in Nepal: deep diamond rubber lugs, an EVA midsole for bounce and a tough synthetic-leather upper over breathable canvas mesh.
            </Box>
            <Box component="p" sx={{ m: 0, ...EYEBROW, color: t.ivory }}>
              {from ? `From ${formatNPR(from)}` : 'Made in Nepal'} <Box component="span" sx={{ color: t.ivoryFaint }}>· Cash on delivery</Box>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 3, mt: 1 }}>
              <Cta to="/g10" variant="solid">Explore G10 in 3D</Cta>
              <Cta to="/product/g10-401" variant="text">Buy the G10-401</Cta>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 5, md: 7 } }}>
            <Box data-sole-wrap sx={{ position: 'relative' }}>
              <Box data-sole sx={{ backgroundColor: t.paper, borderRadius: `${t.radiusLg}px`, p: { xs: 3, md: 6 }, boxShadow: t.shadowFloating }}>
              <Box
                component="img"
                src="/img/g10-sole.webp"
                alt="The G10-401 outsole: diamond rubber lugs and a grooved heel"
                width={620}
                height={262}
                loading="lazy"
                decoding="async"
                sx={{ display: 'block', width: '100%', height: 'auto' }}
              />
              </Box>
            </Box>
            <Box component="ul" data-stats sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: { xs: 2, md: 4 }, borderTop: `1px solid ${t.line}`, pt: { xs: 3, md: 4 } }}>
              {G10_STATS.map((s) => (
                <Box component="li" data-stat key={s.label} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box component="span" sx={{ ...DISPLAY_LIGHT, fontSize: { xs: 44, md: 72 }, color: t.gold, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.n}</Box>
                  <Box component="span" sx={{ fontSize: { xs: 13, md: 15 }, lineHeight: 1.4, color: t.ivoryDim, [PHONE]: { fontSize: 13 } }}>{s.label}</Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Section>
  );
}
