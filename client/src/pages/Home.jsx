import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { useTitle } from '../components/Page.jsx';
import { useProduct } from '../api/hooks.js';
import { StoryCtx, useStoryEnv, useStoryProgress } from '../story/StoryContext.jsx';
import { overlay, useStory } from '../story/store.js';
import { CalloutsSection, EndureSection, ExplodeSection, FinaleSection, HeroSection, PerformanceSection } from '../story/Sections.jsx';
import ColourSection from '../story/ColourSection.jsx';
const StaticStory = lazy(() => import('../story/StaticStory.jsx'));
const ChapterNav = lazy(() => import('../story/ChapterNav.jsx'));
import { detectTier, layoutFor } from '../three/tier.js';
import { SECTIONS } from '../three/timeline.js';
import { tokens } from '../theme/tokens.js';

const StoryCanvas = lazy(() => import('../three/StoryCanvas.jsx'));

function ScrollStory({ product }) {
  const storyRef = useRef(null);
  const { progress, reduced } = useStoryProgress(storyRef);
  const canvasReady = useStory((s) => s.canvasReady);
  const phone = useStory((s) => s.layout) === 'phone';
  const [mountCanvas, setMountCanvas] = useState(false);
  const dotRef = useRef(null);

  // The canvas mounts after the hero poster has painted (idle, 1500 ms timeout).
  useEffect(() => {
    const go = () => setMountCanvas(true);
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(go, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(go, 300);
    return () => clearTimeout(t);
  }, []);

  // Active section = the one crossing the viewport centre (drives reduced-motion snapping and the phone panel).
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && useStory.getState().setActiveSection(e.target.id)),
      { rootMargin: '-50% 0px -50% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [product]);

  useEffect(() => {
    overlay.activeDot = dotRef.current;
    return () => {
      overlay.activeDot = null;
    };
  }, [phone]);

  const ctx = useMemo(() => ({ progress, reduced }), [progress, reduced]);
  const callouts = useMemo(() => (product?.specCallouts || []).filter((c) => c.stage === 'callout').sort((a, b) => a.order - b.order).slice(0, 4), [product]);
  const layers = useMemo(() => (product?.specCallouts || []).filter((c) => c.stage === 'layer').sort((a, b) => a.order - b.order).slice(0, 3), [product]);

  return (
    <StoryCtx.Provider value={ctx}>
      <Box id="story" ref={storyRef} sx={{ position: 'relative', mt: 'calc(var(--appbar-h, 64px) * -1)' }}>
        {mountCanvas ? (
          <Suspense fallback={null}>
            <StoryCanvas progress={progress} storyRef={storyRef} />
          </Suspense>
        ) : null}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <HeroSection product={product} posterVisible={!canvasReady} />
          <PerformanceSection product={product} />
          <CalloutsSection items={callouts} />
          <ExplodeSection items={layers} />
          <EndureSection product={product} />
          <ColourSection product={product} />
          <FinaleSection product={product} />
        </Box>
        <Suspense fallback={null}><ChapterNav /></Suspense>
        {phone ? (
          <Box
            ref={dotRef}
            aria-hidden="true"
            sx={{ position: 'fixed', left: -6, top: -6, width: 12, height: 12, borderRadius: '50%', backgroundColor: tokens.gold, outline: `2px solid ${tokens.gold}`, outlineOffset: 3, zIndex: 3, pointerEvents: 'none', opacity: 0, transform: 'translate(-100px,-100px)' }}
          />
        ) : null}
      </Box>
    </StoryCtx.Provider>
  );
}

export default function Home() {
  useTitle('G10-401');
  const { data: product } = useProduct('g10-401');
  // Decide the tier synchronously so a static device never mounts the story (then PerformanceMonitor may demote later).
  useState(() => {
    useStory.setState({ tier: detectTier(), layout: layoutFor(window.innerWidth) });
    return null;
  });
  const tier = useStory((s) => s.tier);
  return tier === 'static' ? <StaticHome product={product} /> : <ScrollStoryWithEnv product={product} />;
}

function ScrollStoryWithEnv({ product }) {
  return <EnvBridge><ScrollStory product={product} /></EnvBridge>;
}

function EnvBridge({ children }) {
  // Layout follows the window; reduced motion is read inside the story and mirrored to the store.
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  useStoryEnv(!!reduced);
  return children;
}

function StaticHome({ product }) {
  const reduced = false;
  useStoryEnv(reduced);
  return (
    <Box sx={{ position: 'relative', zIndex: 1, backgroundColor: 'background.default' }}>
      <Suspense fallback={null}><StaticStory product={product} /></Suspense>
    </Box>
  );
}
