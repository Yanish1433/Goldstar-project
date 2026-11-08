import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { gsap } from 'gsap';
import { useTitle } from '../components/Page.jsx';
import { useProduct } from '../api/hooks.js';
import { detectTier, layoutFor } from '../three/tier.js';
import { PALETTE, SECTIONS, START, colourIndexAt, endOf, pinOf, sectionAt } from '../story/storyline.js';
import { useStoryUi } from '../story/state.js';
import { useStoryEngine } from '../story/useStoryEngine.js';
import { AnatomySection, CalloutsSection, ColourSection, FinaleSection, HeroSection, PerformanceSection, SoleSection, StageLabels, StudioSection } from '../story/Sections.jsx';
import { COLOURWAYS, DEFAULT_COLOUR } from '../story/model.config.js';

const Stage = lazy(() => import('../story/Stage.jsx'));

function useEnv() {
  // Tier, layout and reduced motion are decided before the first paint (a static device never mounts WebGL).
  useState(() => {
    const reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    useStoryUi.setState({ tier: detectTier(), layout: layoutFor(window.innerWidth), reduced, section: 0, userColour: null });
    return null;
  });
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const onMq = () => useStoryUi.getState().set({ reduced: !!mq.matches });
    const onResize = () => {
      const layout = layoutFor(window.innerWidth);
      if (layout !== useStoryUi.getState().layout) useStoryUi.getState().set({ layout });
    };
    mq?.addEventListener?.('change', onMq);
    window.addEventListener('resize', onResize);
    return () => {
      mq?.removeEventListener?.('change', onMq);
      window.removeEventListener('resize', onResize);
    };
  }, []);
}

export default function Home() {
  useTitle('G10-401');
  const { data: product } = useProduct('g10-401');
  useEnv();
  const tier = useStoryUi((s) => s.tier);
  const reduced = useStoryUi((s) => s.reduced);
  const flow = reduced || tier === 'static'; // no pins, no scrub
  const rootRef = useRef(null);
  const bgRef = useRef(null);
  const degRef = useRef(null);
  const productRef = useRef(product);
  productRef.current = product;
  const [mountStage, setMountStage] = useState(false);

  // Default display colourway.
  useEffect(() => {
    if (!useStoryUi.getState().colourKey) useStoryUi.getState().set({ colourKey: DEFAULT_COLOUR });
  }, []);

  // Low-frequency side effects of story time (called by the engine on every scroll update).
  const onTimeRef = useRef(null);
  onTimeRef.current = (T) => {
    const ui = useStoryUi.getState();
    const i = sectionAt(T);
    if (ui.section !== i) ui.set({ section: i });
    if (degRef.current) {
      const f = Math.min(1, Math.max(0, (T - START.performance) / pinOf('performance')));
      const txt = `${Math.round(f * 360)}°`;
      if (degRef.current.textContent !== txt) degRef.current.textContent = txt;
    }
    if (!ui.userColour && T >= START.colour - 40 && T <= endOf('colour')) {
      const k = COLOURWAYS[colourIndexAt(T, COLOURWAYS.length)].key;
      if (k !== ui.colourKey) ui.set({ colourKey: k });
    }
  };

  useStoryEngine({ rootRef, bgRef, reduced: flow, onTime: (T) => onTimeRef.current?.(T) });

  // The canvas mounts after the first paint (idle), so the copy is the first thing on screen.
  useEffect(() => {
    if (tier === 'static') return undefined;
    const go = () => setMountStage(true);
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(go, { timeout: 800 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(go, 200);
    return () => clearTimeout(t);
  }, [tier]);

  // Hero copy arrives on load (time-based, once). Reduced motion: no movement.
  useLayoutEffect(() => {
    if (flow) return undefined;
    const ctx = gsap.context(() => {
      gsap.from('#story-hero [data-copy]', { autoAlpha: 0, y: 40, duration: 1, stagger: 0.09, ease: 'power3.out', delay: 0.1 });
    }, rootRef);
    return () => ctx.revert();
  }, [flow]);

  return (
    <Box
      id="story"
      ref={rootRef}
      data-flow={flow ? 'true' : 'false'}
      sx={{ position: 'relative', mt: 'calc(var(--appbar-h, 64px) * -1)', isolation: 'isolate' }}
    >
      <Box
        ref={bgRef}
        aria-hidden="true"
        sx={{ position: 'fixed', inset: 0, zIndex: -1, backgroundColor: PALETTE[SECTIONS[0].colour].bg, transition: flow ? 'background-color 500ms ease' : 'none' }}
      />
      {mountStage ? (
        <Suspense fallback={null}>
          <Stage rootRef={rootRef} />
        </Suspense>
      ) : null}
      {tier !== 'static' ? <StageLabels /> : null}
      <HeroSection product={product} />
      <PerformanceSection ref={degRef} />
      <CalloutsSection />
      <AnatomySection />
      <SoleSection />
      <ColourSection product={product} />
      <StudioSection product={product} />
      <FinaleSection />
    </Box>
  );
}
