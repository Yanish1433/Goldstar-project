import { useRef } from 'react';
import Box from '@mui/material/Box';
import { tokensV2 as t, KINETIC } from './tokensV2.js';
import { useSectionMotion } from './motion.js';

// 2. The collections by name (goldstarshoes.com's own ranges). Signature move: two oversized rows that the scroll
// itself drives in opposite directions (no clock, no loop): scroll down and they slide, stop and they stop, scroll
// up and they slide back. The band is royal blue: the hero's flooded disc carries straight into it.
export const RANGES = ['Trek Everyday', 'Sneak into Comfort', 'Winter Neo', 'Classic', 'G-10 Series', 'Open Footwear'];

function Row({ items, dim, dir }) {
  return (
    <Box data-trow={dir} aria-hidden="true" sx={{ display: 'flex', gap: { xs: 3, md: 5 }, width: 'max-content', alignItems: 'center', willChange: 'transform', transform: dir === 'r' ? 'translateX(-30%)' : 'none' }}>
      {[...items, ...items].map((r, i) => (
        <Box key={`${r}-${i}`} component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: { xs: 3, md: 5 } }}>
          <Box component="span" sx={{ ...KINETIC, fontWeight: dim ? 300 : 820, fontSize: { xs: 'clamp(56px, 17vw, 96px)', md: 'clamp(96px, 11vw, 200px)' }, lineHeight: 1, color: dim ? t.sand : t.onBlue, whiteSpace: 'nowrap' }}>{r}</Box>
          <Box component="span" sx={{ width: { xs: 10, md: 16 }, height: { xs: 10, md: 16 }, borderRadius: '50%', backgroundColor: dim ? t.onBlue : t.sand, flex: '0 0 auto' }} />
        </Box>
      ))}
    </Box>
  );
}

export default function Ticker() {
  const ref = useRef(null);
  useSectionMotion(ref, (gsap) => {
    const st = { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: 0.6 };
    gsap.fromTo('[data-trow="l"]', { xPercent: 0 }, { xPercent: -30, ease: 'none', scrollTrigger: st });
    gsap.fromTo('[data-trow="r"]', { xPercent: -30 }, { xPercent: 0, ease: 'none', scrollTrigger: { ...st } });
  });
  const half = Math.ceil(RANGES.length / 2);
  return (
    <Box component="section" ref={ref} aria-label="Goldstar collections" sx={{ position: 'relative', backgroundColor: t.blue, color: t.onBlue, py: { xs: 6, md: 10 }, overflow: 'hidden' }}>
      <Box component="ul" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', m: 0, p: 0 }}>
        {RANGES.map((r) => <li key={r}>{r}</li>)}
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, md: 2 } }}>
        <Row items={RANGES.slice(0, half).concat(RANGES.slice(half))} dir="l" />
        <Row items={RANGES.slice(half).concat(RANGES.slice(0, half))} dim dir="r" />
      </Box>
    </Box>
  );
}
