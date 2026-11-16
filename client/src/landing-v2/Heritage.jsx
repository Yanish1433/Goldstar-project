import { useRef } from 'react';
import Box from '@mui/material/Box';
import { tokensV2 as t, DISPLAY_LIGHT, PHOTO_MONO } from './tokensV2.js';
import { Cta, Eyebrow, Section, WRAP } from './ui.jsx';
import { useSectionMotion } from './motion.js';

// 6. Heritage / Made in Nepal. A full-bleed Himalayan trail photograph pulled into the room (warm monochrome,
// dimmed, its edges melting into the ground), drifting slower than the page. Signature move: the statement is
// revealed line by line through masks.
export const HERITAGE_LINES = ['Fifty years', 'of walking', 'the Himalaya.'];
export const HERITAGE_FACTS = [
  { n: '50+', label: 'years of Goldstar' },
  { n: '77', label: 'districts we deliver to' },
  { n: '1', label: 'home: Kathmandu, Nepal' },
];

export default function Heritage() {
  const ref = useRef(null);
  useSectionMotion(ref, (gsap) => {
    gsap.fromTo('[data-bg]', { yPercent: -10 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('[data-line] > span', { yPercent: 110, duration: 1.4, stagger: 0.12, scrollTrigger: { trigger: '[data-lines]', start: 'top 78%' } });
    gsap.from('[data-fact]', { y: 24, opacity: 0, duration: 1.1, stagger: 0.1, scrollTrigger: { trigger: '[data-facts]', start: 'top 90%' } });
  });
  return (
    <Section id="heritage" labelledBy="heritage-heading" sx={{ overflow: 'hidden' }}>
      <Box ref={ref} sx={{ position: 'relative', minHeight: { xs: 'auto', md: '120svh' }, display: 'flex', alignItems: 'center', py: { xs: 14, md: 18 } }}>
        <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <Box
            data-bg
            component="img"
            src="/v2/trek-woman.jpg"
            alt=""
            width={1024}
            height={558}
            loading="lazy"
            decoding="async"
            sx={{ position: 'absolute', left: 0, top: '-12%', width: '100%', height: '124%', objectFit: 'cover', objectPosition: '62% 50%', filter: PHOTO_MONO }}
          />
          <Box sx={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(180deg, ${t.ground} 0%, transparent 30%, transparent 60%, ${t.ground} 100%), linear-gradient(90deg, ${t.scrim} 0%, ${t.veil} 45%, transparent 85%)` }} />
        </Box>
        <Box sx={{ ...WRAP, position: 'relative', width: '100%', boxSizing: 'border-box' }}>
          <Box sx={{ maxWidth: 820, display: 'flex', flexDirection: 'column', gap: { xs: 3, md: 4 } }}>
            <Eyebrow>Made in Nepal · <Box component="span" lang="ne" sx={{ fontFamily: '"Mukta", sans-serif', letterSpacing: 0, textTransform: 'none', fontSize: 14 }}>नेपालको आफ्नै पाइला</Box></Eyebrow>
            <Box component="h2" id="heritage-heading" data-lines sx={{ ...DISPLAY_LIGHT, color: t.ivory, fontSize: { xs: 'clamp(44px, 13vw, 64px)', md: 'clamp(72px, 7.4vw, 132px)' }, lineHeight: 0.98 }}>
              {HERITAGE_LINES.map((l) => (
                <Box key={l} component="span" data-line sx={{ display: 'block', overflow: 'hidden', pb: '0.06em' }}>
                  <Box component="span" sx={{ display: 'block' }}>{l}</Box>
                </Box>
              ))}
            </Box>
            <Box component="p" sx={{ m: 0, maxWidth: '46ch', fontSize: { xs: 16, md: 19 }, lineHeight: 1.6, color: t.ivoryDim }}>
              For more than five decades Goldstar has been Nepal’s own shoe: made in Kathmandu, worn from the Terai to the Khumbu, and now walking out to every continent.
            </Box>
            <Box component="ul" data-facts sx={{ listStyle: 'none', m: 0, p: 0, mt: { xs: 2, md: 4 }, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: { xs: 2, md: 5 }, borderTop: `1px solid ${t.line}`, pt: { xs: 3, md: 4 }, maxWidth: 720 }}>
              {HERITAGE_FACTS.map((f) => (
                <Box component="li" data-fact key={f.label} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box component="span" sx={{ ...DISPLAY_LIGHT, fontSize: { xs: 40, md: 64 }, lineHeight: 1, color: t.ivory, fontVariantNumeric: 'tabular-nums' }}>{f.n}</Box>
                  <Box component="span" sx={{ fontSize: { xs: 13, md: 15 }, lineHeight: 1.4, color: t.ivoryDim }}>{f.label}</Box>
                </Box>
              ))}
            </Box>
            <Box sx={{ mt: 2 }}>
              <Cta href="https://goldstarshoes.com/" target="_blank" rel="noopener noreferrer" variant="text">Our story on goldstarshoes.com</Cta>
            </Box>
          </Box>
        </Box>
      </Box>
    </Section>
  );
}

