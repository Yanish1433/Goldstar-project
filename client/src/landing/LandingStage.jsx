import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import '../three/quiet.js';
import Boot, { bootUrl } from '../three/Boot.jsx';
import StudioLights from '../three/StudioLights.jsx';
import { TIER_SETTINGS } from '../three/tier.js';
import { STORY_MODEL } from '../story/model.config.js';
import { FOV, R, landingPose, makeShowPose } from './showcase.js';

// The landing's own small canvas (lazy chunk, mounted after first paint): the G10 boot (three/Boot.jsx, the same
// URLs and part rig as everywhere) under the shared studio light, framed by the showcase poses. Demand frame loop:
// it renders only when the scroll moves (live.invalidate), while the pose is still easing, during the hero's slow
// idle turn, or while a colour change eases. Nothing renders while the showcase is off screen or the tab is hidden.

const damp = THREE.MathUtils.damp;
const KEYS = ['cx', 'cy', 'w', 'h', 'fill', 'ry', 'rx', 'rz', 'el', 'lift'];

function Rig({ url, live, colourKey, onReady }) {
  const boot = useRef(null);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const target = useMemo(() => makeShowPose(), []);
  const shown = useRef(null);
  const clock = useRef(0);

  useEffect(() => {
    live.invalidate = () => {
      if (live.active) invalidate();
    };
    invalidate();
    return () => {
      live.invalidate = null;
    };
  }, [invalidate, live]);

  useFrame((state, dtRaw) => {
    const dt = Math.min(0.1, dtRaw || 0.016);
    const { width: W, height: H } = state.size;
    landingPose(live.T, live.layout, target);
    // Hero idle: a slow sway around the poster pose (starts at 0, so the crossfade from the poster is seamless),
    // gone once the boot starts to grow. Reduced motion never mounts this canvas.
    const idle = live.T < 30 ? 1 - live.T / 30 : 0;
    clock.current += idle > 0 ? dt : 0;
    target.ry += idle * 0.32 * Math.sin(clock.current * 0.45);

    let s = shown.current;
    if (!s) s = shown.current = { ...target };
    let moving = false;
    KEYS.forEach((k) => {
      const v = damp(s[k], target[k], 7, dt);
      if (Math.abs(v - target[k]) > 1e-4) moving = true;
      s[k] = Math.abs(v - target[k]) > 1e-5 ? v : target[k];
    });

    // Camera: frame radius R inside the box (story/Stage.jsx maths), shifted there with a view offset.
    const m = s.fill * Math.min(s.w * W, s.h * H);
    const d = (R * (STORY_MODEL.frame || 1) * H) / (m * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    camera.position.set(0, Math.sin(s.el) * d, Math.cos(s.el) * d);
    camera.lookAt(0, 0, 0);
    camera.setViewOffset(W, H, W / 2 - s.cx * W, H / 2 - s.cy * H, W, H);
    camera.near = Math.max(0.05, d - 8);
    camera.far = d + 12;
    camera.updateProjectionMatrix();

    const g = boot.current?.group;
    if (g) {
      g.position.set(0, s.lift, 0);
      g.rotation.set(s.rx, s.ry, s.rz, 'YXZ');
    }
    const colourMoving = boot.current?.step(dt);
    if (live.active && (moving || idle > 0 || colourMoving)) invalidate();
  });

  return <Boot ref={boot} url={url} colourKey={colourKey} onReady={() => { onReady?.(); invalidate(); }} />;
}

export default function LandingStage({ tier, live, colourKey, onReady }) {
  const settings = TIER_SETTINGS[tier] || TIER_SETTINGS.lite;
  return (
    <Canvas
      frameloop="demand"
      dpr={settings.dpr}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: FOV, position: [0, 0, 10], near: 0.1, far: 100 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.setClearColor(0x000000, 0);
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <StudioLights />
      <Suspense fallback={null}>
        <Rig url={bootUrl(tier)} live={live} colourKey={colourKey} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
