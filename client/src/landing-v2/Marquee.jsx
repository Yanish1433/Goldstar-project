import Box from '@mui/material/Box';
import { Star } from 'lucide-react';
import { tokensV2 as t, REDUCED, DISPLAY_LIGHT } from './tokensV2.js';

// 2. A slow marquee of what Goldstar promises. CSS only (no JS), pauses on hover and keyboard focus, and under
// reduced motion it stops and wraps into a still, centred list.
export const PROMISES = ['Made in Kathmandu', 'Cash on delivery', 'Delivered to all 77 districts', 'Five decades of Goldstar', 'Trek · Run · Every day', 'The G10-401, now in 3D'];

function Row({ hidden }) {
  return (
    <Box component="ul" aria-hidden={hidden || undefined} sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', alignItems: 'center', flex: '0 0 auto' }}>
      {PROMISES.map((p) => (
        <Box component="li" key={p} sx={{ display: 'flex', alignItems: 'center', gap: { xs: 3, md: 5 }, pr: { xs: 3, md: 5 }, whiteSpace: 'nowrap' }}>
          <span>{p}</span>
          <Star size={12} strokeWidth={0} fill={t.gold} aria-hidden="true" />
        </Box>
      ))}
    </Box>
  );
}

export default function Marquee() {
  return (
    <Box
      component="section"
      aria-label="Why Goldstar"
      tabIndex={0}
      sx={{
        position: 'relative', overflow: 'hidden', backgroundColor: t.ground, color: t.ivoryDim,
        borderTop: `1px solid ${t.line}`, borderBottom: `1px solid ${t.line}`, py: { xs: 2.5, md: 3.5 },
        ...DISPLAY_LIGHT, fontSize: { xs: 20, md: 30 }, lineHeight: 1.2, letterSpacing: '-0.01em',
        outline: 'none', '&:focus-visible': { boxShadow: `inset 0 0 0 2px ${t.gold}` },
        '@keyframes gsMarquee': { from: { transform: 'translate3d(0,0,0)' }, to: { transform: 'translate3d(-50%,0,0)' } },
        '& [data-track]': { display: 'flex', width: 'max-content', animation: 'gsMarquee 48s linear infinite' },
        '&:hover [data-track], &:focus-within [data-track]': { animationPlayState: 'paused' },
        [REDUCED]: {
          '& [data-track]': { animation: 'none', width: 'auto', flexWrap: 'wrap', justifyContent: 'center', px: 2 },
          '& [data-track] > ul': { flexWrap: 'wrap', justifyContent: 'center', rowGap: 1 },
          '& [data-track] > ul[aria-hidden]': { display: 'none' },
        },
      }}
    >
      <Box data-track>
        <Row />
        <Row hidden />
      </Box>
    </Box>
  );
}
