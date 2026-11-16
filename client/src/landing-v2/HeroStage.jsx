import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import '../three/quiet.js';
import Boot, { bootUrl } from '../three/Boot.jsx';
import StudioLights from '../three/StudioLights.jsx';
import { TIER_SETTINGS } from '../three/tier.js';
import { STORY_MODEL } from '../story/model.config.js';
import { FOV, R, landingPose, makeShowPose } from '../landing/showcase.js';
import { tokensV2 as t } from './tokensV2.js';

// The hero's canvas (lazy chunk, mounted on idle after first paint, never on the static tier or with reduced motion).
// Same framing maths and poses as landing/LandingStage.jsx (read-only, shared), plus two things of its own:
//   - pointer parallax: the boot leans a few degrees towards the pointer (live.px / live.py in -1..1);
//   - a warm gold rim from behind, so the dark boot separates from the dark room.
// Demand frame loop: renders only while the scroll, the pointer, the idle sway or a pose ease is moving, and never
// while the hero is off screen (live.active) — one WebGL context on the page, and it sleeps when not seen.
const damp = THREE.MathUtils.damp;
const KEYS = ['cx', 'cy', 'w', 'h', 'fill', 'ry', 'rx', 'rz', 'el', 'lift'];

function Rig({ url, live, colourKey, onReady }) {
  const boot = useRef(null);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const target = useMemo(() => makeShowPose(), []);
  const shown = useRef(null);
  const clock = useRef(0);
  const par = useRef({ x: 0, y: 0 });

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
    const idle = live.T < 30 ? 1 - live.T / 30 : 0;
    clock.current += idle > 0 ? dt : 0;
    target.ry += idle * 0.3 * Math.sin(clock.current * 0.42);
    // Pointer parallax, eased separately so it feels weighty.
    par.current.x = damp(par.current.x, live.px || 0, 3, dt);
    par.current.y = damp(par.current.y, live.py || 0, 3, dt);
    target.ry += par.current.x * 0.22;
    target.rx += par.current.y * 0.06;
    target.el += par.current.y * 0.04;
    const parMoving = Math.abs(par.current.x - (live.px || 0)) > 1e-3 || Math.abs(par.current.y - (live.py || 0)) > 1e-3;

    let s = shown.current;
    if (!s) s = shown.current = { ...target };
    let moving = false;
    KEYS.forEach((k) => {
      const v = damp(s[k], target[k], 6, dt);
      if (Math.abs(v - target[k]) > 1e-4) moving = true;
      s[k] = Math.abs(v - target[k]) > 1e-5 ? v : target[k];
    });

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
    if (live.active && (moving || idle > 0 || parMoving || colourMoving)) invalidate();
  });

  return <Boot ref={boot} url={url} colourKey={colourKey} onReady={() => { onReady?.(); invalidate(); }} />;
}

export default function HeroStage({ tier, live, colourKey, onReady }) {
  const settings = TIER_SETTINGS[tier] || TIER_SETTINGS.lite;
  return (
    <Canvas
      frameloop="demand"
      dpr={settings.dpr}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: FOV, position: [0, 0, 10], near: 0.1, far: 100 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.1;
        gl.setClearColor(0x000000, 0);
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <StudioLights />
      {/* Gold rim: two lights behind the boot, high and low, warm. */}
      <directionalLight position={[3.5, 3, -4.5]} intensity={2.4} color={t.gold} />
      <directionalLight position={[-4, 0.5, -3]} intensity={1.1} color={t.gold} />
      <Suspense fallback={null}>
        <Rig url={bootUrl(tier)} live={live} colourKey={colourKey} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
