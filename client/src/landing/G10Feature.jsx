import { useRef } from 'react';
import Box from '@mui/material/Box';
import { ArrowRight, Rotate3d } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useProduct } from '../api/hooks.js';
import { land, WIDE } from '../theme/tokens.js';
import { formatNPR } from '../lib/format.js';
import { DISPLAY, Eyebrow, LUG_PATTERN, Pill } from './ui.jsx';

const SPECS = ['Rubber lug outsole', 'EVA midsole', 'Synthetic-leather upper', 'Metal eyelets'];

// One feature in the line-up: the G10-401 gets its own band, with the boot rising and turning as you scroll past,
// and a way into the full 3D story at /g10.
export default function G10Feature() {
  const { data: p } = useProduct('g10-401');
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['14%', '-14%']);
  const rotate = useTransform(scrollYProgress, [0, 1], [-10, 6]);
  const ghostX = useTransform(scrollYProgress, [0, 1], ['6%', '-10%']);
  const from = p?.colourways?.length ? Math.min(...p.colourways.map((c) => c.price)) : null;

  return (
    <Box
      ref={ref}
      component="section"
      aria-labelledby="g10-h"
      sx={{
        position: 'relative', overflow: 'hidden', color: land.onPine, py: { xs: 9, md: 14 }, backgroundColor: land.pine,
        '&::before': { content: '""', position: 'absolute', inset: 0, backgroundImage: LUG_PATTERN, backgroundSize: '28px 28px', opacity: 0.06, pointerEvents: 'none' },
      }}
    >
      <Box component={motion.div} aria-hidden="true" style={reduced ? undefined : { x: ghostX }} sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', ...DISPLAY, fontSize: { xs: '52vw', md: '34vw' }, letterSpacing: '-0.06em', color: 'transparent', WebkitTextStroke: '1.5px rgba(246,242,234,0.16)', whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none' }}>
        G10
      </Box>
      <Box sx={{ position: 'relative', maxWidth: 1440, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, boxSizing: 'border-box', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 6fr' }, gap: { xs: 3, md: 6 }, alignItems: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.5 }, order: { xs: 2, md: 1 } }}>
          <Eyebrow tone={land.saffron}>Featured · New in the trek collection</Eyebrow>
          <Box component="h2" id="g10-h" sx={{ ...DISPLAY, fontSize: { xs: 'clamp(40px, 11vw, 56px)', md: 'clamp(56px, 5.4vw, 92px)' } }}>
            The <Box component="span" sx={{ whiteSpace: 'nowrap' }}>G10-401.</Box> See every layer.
          </Box>
          <Box component="p" sx={{ m: 0, fontSize: { xs: 16, md: 19 }, lineHeight: 1.5, color: land.onPine2, maxWidth: '40ch' }}>
            Our mid-cut trek boot has its own story: turn it, take it apart layer by layer and pick your colour, in 3D.
          </Box>
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {SPECS.map((s) => (
              <Box component="li" key={s} sx={{ px: 1.5, py: 0.75, borderRadius: '999px', border: '1px solid rgba(246,242,234,0.28)', fontSize: 13, fontWeight: 700, color: land.onPine }}>{s}</Box>
            ))}
          </Box>
          {from ? <Box component="p" sx={{ m: 0, fontSize: { xs: 18, md: 22 }, fontWeight: 800, ...WIDE, fontVariantNumeric: 'tabular-nums' }}>From {formatNPR(from)}</Box> : null}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 0.5, '@media (max-width:899.95px)': { '& > *': { flex: '1 1 0', px: 1.5 } } }}>
            <Pill to="/g10" variant="light"><Rotate3d size={18} strokeWidth={2.25} aria-hidden="true" /> Explore in 3D</Pill>
            <Pill to="/product/g10-401" variant="outline">Buy G10-401 <ArrowRight size={18} strokeWidth={2.25} aria-hidden="true" /></Pill>
          </Box>
        </Box>
        <Box sx={{ position: 'relative', order: { xs: 1, md: 2 }, aspectRatio: '1 / 1', maxWidth: { xs: 420, md: 720 }, width: '100%', mx: 'auto' }}>
          <Box aria-hidden="true" sx={{ position: 'absolute', left: '12%', right: '12%', bottom: '14%', height: '10%', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.28)', filter: 'blur(18px)' }} />
          <Box component={motion.div} style={reduced ? undefined : { y, rotate }} sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <Box
              component="img"
              src="/img/hero/boot-desktop.webp"
              alt="The G10-401 trek boot in black"
              width={1100}
              height={1100}
              loading="lazy"
              decoding="async"
              sx={{
                display: 'block', width: '100%', height: '100%', objectFit: 'contain',
                animation: 'gsFloat 6s ease-in-out infinite', '@keyframes gsFloat': { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-14px)' } },
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
