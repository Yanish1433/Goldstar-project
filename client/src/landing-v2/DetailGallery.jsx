import { useRef } from 'react';
import Box from '@mui/material/Box';
import { tokensV2 as t, KINETIC, EYEBROW, PHOTO_TILE, PHONE } from './tokensV2.js';
import { Eyebrow, Display, GUTTER } from './ui.jsx';
import { useSectionMotion, MQ } from './motion.js';
import { shot } from './shots.js';

// 5. The details, as a horizontal gallery. Signature move (desktop >= 900px): the section pins and the vertical
// scroll drives the strip sideways; inside each frame the photo travels the other way (parallax) and the big number
// slides past it. Phones: a native swipe row with scroll-snap, no pin.
export const DETAILS = [
  { no: '01', title: 'The grip', line: 'A deep-lugged rubber outsole that bites on stone steps, scree and wet pavement.', img: 'C_M09895-1-scaled-2', alt: 'The lugged black outsole of the Goldstar G10-401' },
  { no: '02', title: 'The heel', line: 'A sturdy heel panel wearing the Goldstar G, the mark of a Nepali shoemaker.', img: 'C_M09748-2-1-scaled-2', alt: 'The heel of the Goldstar G10 L2102 with the G logo' },
  { no: '03', title: 'The collar', line: 'A padded ankle collar and a full lace-up, closing the boot snug around the ankle.', img: 'C_M09823-1-scaled-2', alt: 'The padded back collar of the Goldstar G10-401 in olive' },
  { no: '04', title: 'The colour', line: 'A pink outsole under a pink-and-grey upper: the women’s G10 L2102, made for the same trails.', img: 'C_M09751-2-1-scaled-2', alt: 'The pink outsole of the Goldstar G10 L2102' },
  { no: '05', title: 'The cupsole', line: 'The AX sneakers sit on a soft white cupsole, made for a long day on city pavements.', img: 'DSC08437-scaled-2-scaled-2', alt: 'The white cupsole of a Goldstar AX sneaker' },
];

export default function DetailGallery() {
  const ref = useRef(null);
  const trackRef = useRef(null);
  useSectionMotion(ref, (gsap) => {
    const mm = gsap.matchMedia();
    mm.add(MQ.desk, () => {
      const track = trackRef.current;
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: ref.current.querySelector('[data-gpin]'), start: 'top top', end: () => `+=${Math.round(dist() * 0.8)}`, pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true },
      });
      tl.to(track, { x: () => -dist(), duration: 1 }, 0)
        .fromTo('[data-gimg]', { xPercent: 6 }, { xPercent: -6, duration: 1 }, 0)
        .fromTo('[data-gno]', { xPercent: 60 }, { xPercent: -60, duration: 1 }, 0);
    });
    return () => mm.revert();
  });

  return (
    <Box component="section" id="details" aria-labelledby="details-heading" sx={{ position: 'relative', backgroundColor: t.photoGround, color: t.ink }}>
      <Box ref={ref}>
        <Box data-gpin sx={{ minHeight: { md: '100svh' }, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', pt: { xs: 8, md: 'calc(var(--appbar-h, 64px) + 24px)' }, pb: { xs: 8, md: 5 }, overflow: 'hidden' }}>
          <Box sx={{ ...GUTTER, maxWidth: 1440, mx: 'auto', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 2, mb: { xs: 4, md: 'clamp(20px, 4svh, 48px)' } }}>
            <Eyebrow onSky>Up close</Eyebrow>
            <Box sx={{ position: 'relative', alignSelf: 'flex-start', pb: { xs: '14px', md: '18px' } }}>
              <Display id="details-heading">Built in the details.</Display>
              {/* A quick white brush swash under the headline (decoration only). */}
              <Box component="svg" aria-hidden="true" viewBox="0 0 400 24" preserveAspectRatio="none" sx={{ position: 'absolute', left: '2%', bottom: 0, width: '46%', height: { xs: 12, md: 18 }, display: 'block', overflow: 'visible' }}>
                <path d="M3 17 C60 6 150 3 235 7 C300 10 355 7 397 2 C360 12 300 16 232 17 C150 19 70 21 3 17 Z" fill={t.white} />
              </Box>
            </Box>
          </Box>
          <Box
            ref={trackRef}
            component="ul"
            sx={{
              listStyle: 'none', m: 0, ...GUTTER, display: 'flex', gap: { xs: 1.5, md: 3 }, boxSizing: 'border-box',
              [PHONE]: { overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' }, overscrollBehaviorX: 'contain', scrollPaddingLeft: 16 },
              [`@media (min-width: 900px)`]: { width: 'max-content', willChange: 'transform' },
            }}
          >
            {DETAILS.map((d) => (
              <Box component="li" key={d.no} sx={{ flex: '0 0 auto', width: { xs: '82vw', sm: '60vw', md: 'min(44vw, calc((100svh - var(--appbar-h, 64px) - 300px) * 1.25))' }, minWidth: { md: 420 }, scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ position: 'relative', aspectRatio: '5 / 4', borderRadius: `${t.radiusLg}px`, overflow: 'hidden', backgroundColor: t.white, boxShadow: t.shadowCard }}>
                  <Box data-gimg component="img" src={shot(d.img).src} srcSet={shot(d.img).srcSet} sizes="(max-width: 899.95px) 82vw, 44vw" alt={d.alt} loading="lazy" decoding="async" width={1600} height={1600}
                    sx={{ position: 'absolute', top: 0, left: '-6%', width: '112%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply', filter: PHOTO_TILE, p: { xs: 1, md: 3 }, boxSizing: 'border-box', willChange: 'transform' }} />
                  <Box data-gno aria-hidden="true" component="span" sx={{ ...KINETIC, position: 'absolute', right: { xs: 12, md: 24 }, bottom: { xs: -8, md: -18 }, fontSize: { xs: 68, md: 'clamp(84px, 8.4vw, 140px)' }, fontWeight: 300, color: t.blue, opacity: 0.14, lineHeight: 1 }}>{d.no}</Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'baseline' }}>
                  <Box component="span" sx={{ ...EYEBROW, color: t.ink, fontVariantNumeric: 'tabular-nums' }}>{d.no}</Box>
                  <Box>
                    <Box component="h3" sx={{ ...KINETIC, color: t.ink, fontSize: { xs: 24, md: 32 }, fontWeight: 760 }}>{d.title}</Box>
                    <Box component="p" sx={{ m: 0, mt: 0.75, fontSize: { xs: 15, md: 16 }, lineHeight: 1.55, color: t.ink, maxWidth: '44ch' }}>{d.line}</Box>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
          <Box component="p" aria-hidden="true" sx={{ ...EYEBROW, color: t.ink, ...GUTTER, mt: 3, display: 'none', [PHONE]: { display: 'block' } }}>Swipe →</Box>
        </Box>
      </Box>
    </Box>
  );
}
