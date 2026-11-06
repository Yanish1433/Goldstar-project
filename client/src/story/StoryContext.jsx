import { createContext, useContext, useEffect, useState } from 'react';
import { useScroll, useSpring, useReducedMotion, useTransform } from 'motion/react';
import { sToP } from '../three/timeline.js';
import { useStory } from './store.js';
import { layoutFor } from '../three/tier.js';

export const StoryCtx = createContext(null);
export const useStoryCtx = () => useContext(StoryCtx);

// Scroll progress over the story: raw -> spring (no spring under reduced motion). Same source for DOM and canvas.
export function useStoryProgress(storyRef) {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: storyRef, offset: ['start start', 'end end'] });
  const spring = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.5, restDelta: 0.0005 });
  return { progress: reduced ? scrollYProgress : spring, reduced: !!reduced, raw: scrollYProgress };
}

// Tier + layout detection, written to the story store (rare updates only).
export function useStoryEnv(reduced) {
  const setEnv = useStory((s) => s.setEnv);
  useEffect(() => {
    const apply = () => setEnv({ layout: layoutFor(window.innerWidth) });
    setEnv({ reduced, layout: layoutFor(window.innerWidth) });
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [reduced, setEnv]);
}

// MotionValue helper: opacity/y keyed on story scroll distance in vh.
export function useSFade(progress, inS, outS, dy = 32, outDy = 40) {
  const pts = [];
  const op = [];
  const ys = [];
  if (inS) {
    pts.push(sToP(inS[0]), sToP(inS[1]));
    op.push(0, 1);
    ys.push(dy, 0);
  } else {
    pts.push(0);
    op.push(1);
    ys.push(0);
  }
  if (outS) {
    pts.push(sToP(outS[0]), sToP(outS[1]));
    op.push(1, 0);
    ys.push(0, -outDy);
  } else {
    pts.push(1);
    op.push(1);
    ys.push(0);
  }
  const opacity = useTransform(progress, pts, op);
  const y = useTransform(progress, pts, ys);
  return { opacity, y };
}

// Active step index (low frequency React state) from a progress MotionValue.
export function useStepIndex(progress, fromS, toS, count) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const calc = (p) => {
      const s = p * 900;
      const idx = Math.min(count - 1, Math.max(0, Math.floor(((s - fromS) / (toS - fromS)) * count)));
      setI((prev) => (prev === idx ? prev : idx));
    };
    calc(progress.get());
    return progress.on('change', calc);
  }, [progress, fromS, toS, count]);
  return i;
}
