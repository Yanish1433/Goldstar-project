import { useRef } from 'react';
import Box from '@mui/material/Box';
import { tokensV2 as t } from './tokensV2.js';
import { StarShape } from './ui.jsx';
import { useSectionMotion } from './motion.js';
import { BOOT, SNEAKER, HIGHTOP, PRINT, PRINT_A, PRINT_B } from './shoeArt.js';

// A decorative side layer for the landing's empty left and right edges: the Goldstar star (StarShape, the same one
// the hero spins), a small sparkle, and shoe doodles (trek boot, sneaker, sole-print pair; the path data lives in shoeArt.js) in 2px rounded line-art.
//
// No overlap with content, by construction: every section's content column is max 1440px with 48px side gutters
// (32px under 1200px). An item of width w is centred in the free strip beside that column and only shown once the
// strip is at least w + 28px wide (`minVw` below), so at 1280 / 1440 only the small stars fit, at 1920 everything does.
// Phones and tablets in portrait (< 900px wide, >= 500px tall) get their OWN small set (items flagged `ph: true`, see below) placed in
// measured empty spots of the phone layouts; the desktop items never show there. Landscape phones: none (CSS display:none; the markup
// stays aria-hidden, absolute, inert).
//
// Motion: one scrubbed timeline per section (useSideScrub): each item drifts up/down at its own pace, stars rotate
// slowly, shoes tilt a few degrees. Reduced motion: no timeline, the markup's resting pose is the final state.

const COLOUR = { blue: t.blue, ink: t.ink, sand: t.sand };

function Doodle({ kind, colour }) {
  const stroke = COLOUR[colour] || t.blue;
  const common = { fill: 'none', stroke, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', vectorEffect: 'non-scaling-stroke' };
  const paths = (arr) => arr.map((d, i) => <path key={i} {...common} d={d} />);
  const svgProps = { viewBox: '0 0 64 64', 'aria-hidden': 'true', focusable: 'false', sx: { display: 'block', width: '100%', height: '100%', overflow: 'visible' } };
  if (kind === 'boot') return <Box component="svg" {...svgProps}>{paths(BOOT)}</Box>;
  if (kind === 'hightop') return <Box component="svg" {...svgProps}>{paths(HIGHTOP)}</Box>;
  if (kind === 'sneaker') return <Box component="svg" {...svgProps}>{paths(SNEAKER)}</Box>;
  // 'feet': a pair of shoe-sole prints, the second one a step ahead
  return (
    <Box component="svg" {...svgProps}>
      <g transform={PRINT_A}>{paths(PRINT)}</g>
      <g transform={PRINT_B}>{paths(PRINT)}</g>
    </Box>
  );
}

function Sparkle() {
  return (
    <Box component="svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false" sx={{ display: 'block', width: '100%', height: '100%' }}>
      <path d="M12 1.5 Q13.2 10.8 22.5 12 Q13.2 13.2 12 22.5 Q10.8 13.2 1.5 12 Q10.8 10.8 12 1.5 Z" fill={t.sand} />
    </Box>
  );
}

// Smallest viewport width at which an item of width w fits in the free strip beside the 1440px column (see top).
// The strip is 48px wide at 1200-1440 and grows by 1px per side for every 2px of viewport; keep 14px clear of the
// column (a colour swatch's 44px tap box starts ~10px inside the gutter), so w + 28 <= strip. Only 20px stars fit at 1280-1440.
const minVwFor = (w) => (w <= 20 ? 1200 : 1440 + 2 * (w + 28 - 48));

// item: { k: 'star'|'sparkle'|'boot'|'sneaker'|'hightop'|'feet', w: 28 (px), rot: -12, d: 90 (drift, px), spin: 160 (star turn) | tilt: 6 (shoe), o: 0.5 (opacity), c: 'blue'|'ink'|'sand' }
// Position, one of:
//   gutter:  s: 'l'|'r', top: '14%'            centred in the free strip beside the 1440px column (see top)
//   zone:    x: -480 (px from the layer's centre) or lx: 7 (% of the layer's width), plus y: 40 (px from the top) | b: 36 (px from the
//            bottom) | top: '20%'. A zone is a measured empty area INSIDE a section (hero strips, section padding bands, the gap
//            beside a heading, the empty middle of a collection card). Shown from 1200px wide (laptops and up).
const PHONE_MQ = '@media (max-width: 899.95px) and (min-height: 500.02px)';
// ph: true marks a phone-only item: lx (% of the layer's width) plus y (px from the top) | b (px from the bottom) | top ('12%'); d is the
// drift (use about half the desktop travel).
export default function SideDoodles({ items, layerRef, sx }) {
  return (
    <Box ref={layerRef} data-side="layer" aria-hidden="true" sx={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'clip', pointerEvents: 'none', display: 'none', '@media (min-width: 900px) and (min-height: 500.02px)': { display: 'block' }, [PHONE_MQ]: { display: 'block' }, ...sx }}>
      {items.map((it, i) => {
        if (it.ph) {
          const pv = it.y !== undefined ? { top: it.y } : it.b !== undefined ? { bottom: it.b } : { top: it.top };
          return (
            <Box
              key={i}
              data-side="item"
              data-kind={it.k}
              data-phone="1"
              data-fade={it.fade || 0}
              data-d={it.d}
              data-spin={it.spin || 0}
              data-tilt={it.tilt || 0}
              sx={{ position: 'absolute', ...pv, width: it.w, height: it.w, left: `calc(${it.lx}% - ${it.w / 2}px)`, opacity: it.o ?? 0.5, transform: `rotate(${it.rot || 0}deg)`, willChange: 'transform', display: 'none', [PHONE_MQ]: { display: 'block' } }}
            >
              {it.k === 'star' ? <StarShape sx={{ width: '100%', height: '100%' }} /> : it.k === 'sparkle' ? <Sparkle /> : <Doodle kind={it.k} colour={it.c} />}
            </Box>
          );
        }
        const zone = it.x !== undefined || it.lx !== undefined;
        const free = '(100% - min(100%, 1440px)) / 4 + 24px';
        let pos;
        if (it.x !== undefined) pos = { left: `calc(50% + ${it.x}px - ${it.w / 2}px)` };
        else if (it.lx !== undefined) pos = { left: `calc(${it.lx}% - ${it.w / 2}px)` };
        else if (it.s === 'l') pos = { left: `max(4px, calc(${free} - ${it.w / 2}px))` };
        else pos = { right: `max(4px, calc(${free} - ${it.w / 2}px))` };
        const vert = it.y !== undefined ? { top: it.y } : it.b !== undefined ? { bottom: it.b } : { top: it.top };
        return (
          <Box
            key={i}
            data-side="item"
            data-kind={it.k}
            data-d={it.d}
            data-spin={it.spin || 0}
            data-tilt={it.tilt || 0}
            sx={{
              position: 'absolute', ...vert, width: it.w, height: it.w, ...pos, opacity: it.o ?? 0.5,
              transform: `rotate(${it.rot || 0}deg)`, willChange: 'transform', display: 'none',
              [`@media (min-width: ${zone ? 1200 : minVwFor(it.w)}px) and (min-height: 500.02px)`]: { display: 'block' },
            }}
          >
            {it.k === 'star' ? <StarShape sx={{ width: '100%', height: '100%' }} /> : it.k === 'sparkle' ? <Sparkle /> : <Doodle kind={it.k} colour={it.c} />}
          </Box>
        );
      })}
    </Box>
  );
}

// One scrubbed timeline for a section's layer. `start`/`end` are ScrollTrigger positions on the layer's section.
export function useSideScrub({ start = 'top bottom', end = 'bottom top' } = {}) {
  const ref = useRef(null);
  useSectionMotion(ref, (gsap, ScrollTrigger, root) => {
    const section = root.closest('section');
    // every item of the section, including those inside its cards (the collection cards carry their own small layers)
    const nodes = gsap.utils.toArray('[data-side="item"]', section);
    if (!section || !nodes.length) return undefined;
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: section, start, end, scrub: 0.8 } });
    nodes.forEach((n, i) => {
      const d = parseFloat(n.dataset.d) || 80;
      const spin = parseFloat(n.dataset.spin) || 0;
      const tilt = parseFloat(n.dataset.tilt) || 0;
      const base = gsap.getProperty(n, 'rotation') || 0;
      const fade = parseFloat(n.dataset.fade) || 0;
      // the hero's phone items leave early: the arch swells over them as the scene starts
      if (fade) tl.to(n, { opacity: 0, duration: fade }, 0);
      tl.fromTo(n, { y: d * 0.5, rotation: base - (spin ? spin / 2 : tilt) }, { y: -d * 0.5, rotation: base + (spin ? spin / 2 : tilt), duration: 1 }, 0);
    });
    return undefined;
  }, []);
  return ref;
}
