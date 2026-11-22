import { useRef } from 'react';
import Box from '@mui/material/Box';
import { tokensV2 as t } from './tokensV2.js';
import { StarShape } from './ui.jsx';
import { useSectionMotion } from './motion.js';

// A decorative side layer for the landing's empty left and right edges: the Goldstar star (StarShape, the same one
// the hero spins), a small sparkle, and shoe doodles (trek boot, sneaker, footprint pair) in 2px rounded line-art.
//
// No overlap with content, by construction: every section's content column is max 1440px with 48px side gutters
// (32px under 1200px). An item of width w is centred in the free strip beside that column and only shown once the
// strip is at least w + 28px wide (`minVw` below), so at 1280 / 1440 only the small stars fit, at 1920 everything does.
// Phones (< 900px) and landscape phones: none (CSS display:none; the markup stays aria-hidden, absolute, inert).
//
// Motion: one scrubbed timeline per section (useSideScrub): each item drifts up/down at its own pace, stars rotate
// slowly, shoes tilt a few degrees. Reduced motion: no timeline, the markup's resting pose is the final state.

const COLOUR = { blue: t.blue, ink: t.ink, sand: t.sand };

function Doodle({ kind, colour }) {
  const stroke = COLOUR[colour] || t.blue;
  const common = { fill: 'none', stroke, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', vectorEffect: 'non-scaling-stroke' };
  if (kind === 'boot') {
    return (
      <Box component="svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false" sx={{ display: 'block', width: '100%', height: '100%', overflow: 'visible' }}>
        <path {...common} d="M17 7 L39 8 L40 25 Q41 32 49 34 L58 37 Q62 39 62 46 L62 50 L7 50 L8 43 Q9 38 14 37 L17 35 Z" />
        <path {...common} d="M7 50 L7 55 L62 55 L62 50" />
        <path {...common} d="M17 14 Q28 12 39 14 M18 20.5 L38 21 M19 27 L39.5 27.5" />
        <path {...common} d="M13 55 v4 M24 55 v4 M35 55 v4 M46 55 v4 M57 55 v4" />
      </Box>
    );
  }
  if (kind === 'sneaker') {
    return (
      <Box component="svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false" sx={{ display: 'block', width: '100%', height: '100%', overflow: 'visible' }}>
        <path {...common} d="M5 41 Q5 31 12 29 L22 26 Q26 33 34 33 L50 35 Q61 37 61 45 L61 49 L5 49 Z" />
        <path {...common} d="M5 49 L5 54 L61 54 L61 49" />
        <path {...common} d="M27 28 l4 -5 M32 30 l4 -5 M37 31.5 l4 -5" />
        <path {...common} d="M12 43 Q30 38 52 43" />
      </Box>
    );
  }
  // 'feet': two bare footprints, the second one a step ahead
  return (
    <Box component="svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false" sx={{ display: 'block', width: '100%', height: '100%', overflow: 'visible' }}>
      <g {...common}>
        <path d="M19 22 C26 22 29 31 27 39 C26 44 27 48 25 53 C24 57 20 58 17 56 C14 54 15 49 14 44 C12 36 12 22 19 22 Z" />
        <circle cx="11" cy="19" r="1.5" />
        <circle cx="16" cy="15" r="1.6" />
        <circle cx="22" cy="14" r="1.6" />
        <circle cx="27.5" cy="17" r="1.5" />
        <path d="M43 8 C50 8 53 17 51 25 C50 30 51 34 49 39 C48 43 44 44 41 42 C38 40 39 35 38 30 C36 22 36 8 43 8 Z" />
        <circle cx="35" cy="5" r="1.5" />
        <circle cx="40" cy="1.4" r="1.6" />
        <circle cx="46" cy="0.8" r="1.6" />
        <circle cx="51.5" cy="3.6" r="1.5" />
      </g>
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

// item: { k: 'star'|'sparkle'|'boot'|'sneaker'|'feet', w: 28 (px), rot: -12, d: 90 (drift, px), spin: 160 (star turn) | tilt: 6 (shoe), o: 0.5 (opacity), c: 'blue'|'ink'|'sand' }
// Position, one of:
//   gutter:  s: 'l'|'r', top: '14%'            centred in the free strip beside the 1440px column (see top)
//   zone:    x: -480 (px from the layer's centre) or lx: 7 (% of the layer's width), plus y: 40 (px from the top) | b: 36 (px from the
//            bottom) | top: '20%'. A zone is a measured empty area INSIDE a section (hero strips, section padding bands, the gap
//            beside a heading, the empty middle of a collection card). Shown from 1200px wide (laptops and up).
export default function SideDoodles({ items, layerRef, sx }) {
  return (
    <Box ref={layerRef} data-side="layer" aria-hidden="true" sx={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'clip', pointerEvents: 'none', display: 'none', '@media (min-width: 900px) and (min-height: 500.02px)': { display: 'block' }, ...sx }}>
      {items.map((it, i) => {
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
      tl.fromTo(n, { y: d * 0.5, rotation: base - (spin ? spin / 2 : tilt) }, { y: -d * 0.5, rotation: base + (spin ? spin / 2 : tilt), duration: 1 }, 0);
    });
    return undefined;
  }, []);
  return ref;
}
