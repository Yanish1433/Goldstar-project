import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { motion, useReducedMotion, useTransform } from 'motion/react';
import { motionTokens } from '../theme/tokens.js';
import { sToP } from '../three/timeline.js';

// Display type that arrives (Addendum B U6): each line sits in an overflow-hidden mask and rises into place.
// - Story h2s: the rise is scrubbed by the story's scroll MotionValue (reversible), staggered per line.
// - Hero h1: a masked rise on load. The heading is painted whole and fully opaque first; the mask only starts
//   once JS has measured the lines, and lines start 60% down so the title never disappears.
// Screen readers get the unsplit text (aria-label on the heading, line spans aria-hidden).
// Reduced motion / static: no split.

// Created once at module scope: creating it inside render would remount the heading on every render.
const MotionTypography = motion.create(Typography);

const MASK = { display: 'block', overflow: 'hidden', pb: '0.14em', mb: '-0.14em' };

function ScrubLine({ children, progress, s0, s1, sx }) {
  const y = useTransform(progress, [sToP(s0), sToP(s1)], ['105%', '0%']);
  return (
    <Box component="span" aria-hidden="true" sx={MASK}>
      <motion.span style={{ display: 'block', y }}>
        <Box component="span" sx={sx} style={{ display: 'block' }}>{children}</Box>
      </motion.span>
    </Box>
  );
}

function LoadLine({ children, index, sx }) {
  return (
    <Box component="span" aria-hidden="true" sx={MASK}>
      <motion.span
        style={{ display: 'block' }}
        initial={{ y: '60%' }}
        animate={{ y: '0%' }}
        transition={{ duration: 0.8, delay: 0.09 * index, ease: motionTokens.easeExpo }}
      >
        <Box component="span" sx={sx} style={{ display: 'block' }}>{children}</Box>
      </motion.span>
    </Box>
  );
}

// Groups the words of a single text node into visual lines.
export function measureLines(node) {
  const text = node.nodeValue;
  const words = [...text.matchAll(/\S+/g)];
  const lines = [];
  let lastTop = null;
  const range = document.createRange();
  words.forEach((w) => {
    range.setStart(node, w.index);
    range.setEnd(node, w.index + w[0].length);
    const rects = range.getClientRects();
    const top = rects.length ? Math.round(rects[0].top) : null;
    if (top === null) return;
    if (lastTop === null || Math.abs(top - lastTop) > 4) {
      lines.push(w[0]);
      lastTop = top;
    } else lines[lines.length - 1] += ` ${w[0]}`;
  });
  return lines;
}

export default function LineReveal({ text, lines: explicit, component = 'h2', variant = 'h2', progress, inS, stagger = 4, load = false, sx, id, lineSx }) {
  const reduced = useReducedMotion();
  const plain = explicit ? explicit.map((l) => l.text).join(' ') : text;
  const ref = useRef(null);
  const [lines, setLines] = useState(explicit ? explicit.map((l) => l.text) : null);
  const [tick, setTick] = useState(0);
  const animate = !reduced && (load || (progress && inS));

  // Measure after the fonts are ready, and again on resize (debounced).
  useLayoutEffect(() => {
    if (explicit || !animate) return undefined;
    let cancelled = false;
    const go = () => {
      const node = ref.current?.firstChild;
      if (cancelled || !node || node.nodeType !== 3) return;
      const ls = measureLines(node);
      if (ls.length) setLines(ls);
    };
    const ready = document.fonts?.ready ?? Promise.resolve();
    ready.then(() => requestAnimationFrame(go));
    return () => {
      cancelled = true;
    };
  }, [explicit, animate, plain, tick]);

  useEffect(() => {
    if (explicit || !animate) return undefined;
    let t;
    let w = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === w) return;
      w = window.innerWidth;
      clearTimeout(t);
      t = setTimeout(() => {
        setLines(null);
        setTick((n) => n + 1);
      }, 200);
    };
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
    };
  }, [explicit, animate]);

  const split = animate && lines;
  const fade = reduced && !load; // reduced motion: 150 ms opacity fade, never on the h1
  const Head = fade ? MotionTypography : Typography;
  const fadeProps = fade ? { initial: { opacity: 0.001 }, animate: { opacity: 1 }, transition: { duration: 0.15 } } : {};

  return (
    <Head component={component} variant={variant} id={id} sx={sx} aria-label={split ? plain : undefined} ref={ref} {...fadeProps}>
      {split
        ? lines.map((ln, i) => {
            const lsx = explicit?.[i]?.sx || lineSx;
            return load ? (
              <LoadLine key={`${i}-${ln}`} index={i} sx={lsx}>{ln}</LoadLine>
            ) : (
              <ScrubLine key={`${i}-${ln}`} progress={progress} s0={inS[0] + i * stagger} s1={inS[1] + i * stagger} sx={lsx}>{ln}</ScrubLine>
            );
          })
        : explicit
          ? explicit.map((l, i) => (
              <Box key={i} component="span" sx={l.sx} style={{ display: 'block' }}>{l.text}</Box>
            ))
          : plain}
    </Head>
  );
}
