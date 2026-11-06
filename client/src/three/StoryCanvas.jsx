import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import StoryScene from './StoryScene.jsx';
import { TIER_SETTINGS } from './tier.js';
import { useStory } from '../story/store.js';
import { tokens } from '../theme/tokens.js';
import { SHOE } from './shoe.config.js';

// One fixed canvas behind the story. Renders only while the story is on screen and the tab is visible.
export default function StoryCanvas({ progress, storyRef }) {
  const tier = useStory((s) => s.tier);
  const layout = useStory((s) => s.layout);
  const reduced = useStory((s) => s.reduced);
  const settings = TIER_SETTINGS[tier] || TIER_SETTINGS.full;
  const [dpr, setDpr] = useState(settings.dpr);
  const [onScreen, setOnScreen] = useState(true);
  const [visible, setVisible] = useState(document.visibilityState === 'visible');
  const quality = useRef({ dustFraction: 1, shadows: tier === 'full' });
  const debug = new URLSearchParams(location.search).get('debug');

  useEffect(() => {
    const el = storyRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: '0px' });
    io.observe(el);
    const vis = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', vis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', vis);
    };
  }, [storyRef]);

  const frameloop = reduced ? 'demand' : onScreen && visible ? 'always' : 'never';

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundColor: tokens.ground }}>
      <Canvas
        dpr={dpr}
        frameloop={frameloop}
        flat={false}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ fov: 35, position: [0, 0.4, 7.5], near: 0.1, far: 50 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = SHOE.look.exposure;
          gl.setClearColor(0x000000, 0); // the contact-shadow pass must clear to transparent
        }}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <PerformanceMonitor
          bounds={() => [45, 60]}
          flipflops={3}
          onDecline={() => {
            quality.current.dustFraction = 0.5;
            quality.current.shadows = false;
            setDpr(1);
          }}
          onFallback={() => { if (!new URLSearchParams(location.search).has('nofallback')) useStory.getState().setTier('static'); }}
        />
        <AdaptiveDpr pixelated={false} />
        <StoryScene progress={progress} tier={tier} layout={layout} reduced={reduced} quality={quality} debug={debug} />
      </Canvas>
    </div>
  );
}
