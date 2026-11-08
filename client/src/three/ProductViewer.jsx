import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Box from '@mui/material/Box';
import { tokens } from '../theme/tokens.js';
import Boot, { bootUrl } from './Boot.jsx';
import StudioLights from './StudioLights.jsx';
import { TIER_SETTINGS } from './tier.js';
import { VIEWER_ANCHORS, displayForProduct } from '../story/model.config.js';
import { partPoint } from '../story/splitModel.js';

// 360-degree viewer of the G10-401 for its product page. Its own canvas (the home canvas is not mounted on this
// route), the same part rig, tint and studio light as the home story. Rotate-only orbit, keyboard rotate/zoom,
// optional hotspots on the real parts. Frame loop: always while auto-rotating, demand after the first interaction
// (colour eases keep asking for frames), never while the tab is hidden.

// A warm studio cream, like the catalogue photography: the charcoal boot reads crisply against it.
const VIEWER_BG = '#E9E3D8';

function Hotspot({ spot, onSelect, wrapRef }) {
  return (
    <Html ref={wrapRef} position={spot.pos} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none', transition: 'opacity 200ms ease' }}>
      <Box
        component="button"
        type="button"
        onClick={(e) => onSelect(spot, e.currentTarget)}
        aria-label={`${spot.title}: show details`}
        sx={{
          pointerEvents: 'auto', display: 'inline-flex', alignItems: 'center', gap: 1, minWidth: 44, minHeight: 44, p: 0, border: 0, cursor: 'pointer',
          background: 'none', color: tokens.ink, font: 'inherit', fontSize: 14, whiteSpace: 'nowrap',
          '&:focus-visible': { outline: `2px solid ${tokens.onGold}`, outlineOffset: 2 },
        }}
      >
        <Box component="span" sx={{ width: 44, height: 44, display: 'grid', placeItems: 'center' }}>
          <Box component="span" sx={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: tokens.gold, boxShadow: `0 0 0 3px ${tokens.onGold}` }} />
        </Box>
        <Box component="span" sx={{ backgroundColor: tokens.surface1, px: 1, py: 0.5 }}>{spot.title}</Box>
      </Box>
    </Html>
  );
}

function Scene({ url, colourKey, controlsRef, interacted, spots, showSpots, onSelect }) {
  const boot = useRef();
  const rig = useRef();
  const { invalidate } = useThree();
  const [points, setPoints] = useState({});

  const ready = useCallback(({ built }) => {
    if (!rig.current) return;
    rig.current.updateMatrixWorld(true);
    const out = {};
    Object.entries(VIEWER_ANCHORS).forEach(([key, a]) => {
      const p = partPoint(built, a.part, a.anchor, rig.current);
      if (p) out[key] = p;
    });
    setPoints(out);
    invalidate();
  }, [invalidate]);

  // Hotspots on the far side of the boot fade out (each spot faces outwards from the boot's centre line).
  const wraps = useRef({});
  useFrame(({ camera }, dt) => {
    if (boot.current?.step(Math.min(dt, 0.05))) invalidate();
    Object.entries(points).forEach(([key, p]) => {
      const el = wraps.current[key];
      if (!el) return;
      const facing = p.z * camera.position.z + (p.y > 0.6 ? 1 : 0) * camera.position.y > -0.3;
      const o = facing ? '1' : '0';
      if (el.style.opacity !== o) {
        el.style.opacity = o;
        el.style.visibility = facing ? 'visible' : 'hidden';
      }
    });
  });

  return (
    <>
      <color attach="background" args={[VIEWER_BG]} />
      <StudioLights />
      <group ref={rig} position={[0, 0.05, 0]}>
        <Boot ref={boot} url={url} colourKey={colourKey} onReady={(r) => setTimeout(() => ready(r), 0)} />
      </group>
      {showSpots ? spots.filter((s) => points[s.anchor]).map((s) => <Hotspot key={s.key} spot={{ ...s, pos: points[s.anchor] }} onSelect={onSelect} wrapRef={(el) => { wraps.current[s.anchor] = el; }} />) : null}
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minPolarAngle={0.35}
        maxPolarAngle={1.45}
        minDistance={5.5}
        maxDistance={9}
        enableDamping
        dampingFactor={0.08}
        autoRotate={!interacted}
        autoRotateSpeed={0.6}
      />
    </>
  );
}

export default function ProductViewer({ tier = 'full', colourKey, spots, showSpots, onSelect }) {
  const display = displayForProduct(colourKey).key;
  const [interacted, setInteracted] = useState(false);
  const [visible, setVisible] = useState(document.visibilityState === 'visible');
  const controlsRef = useRef(null);
  const settings = TIER_SETTINGS[tier] || TIER_SETTINGS.full;
  const url = bootUrl(tier);
  const wrap = useRef(null);

  useEffect(() => {
    const vis = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, []);

  const stop = useCallback(() => setInteracted(true), []);
  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return undefined;
    c.addEventListener('start', stop);
    return () => c.removeEventListener('start', stop);
  });

  const onKey = (e) => {
    const c = controlsRef.current;
    if (!c) return;
    const step = Math.PI / 12; // 15 degrees
    let used = true;
    if (e.key === 'ArrowLeft') c.setAzimuthalAngle(c.getAzimuthalAngle() - step);
    else if (e.key === 'ArrowRight') c.setAzimuthalAngle(c.getAzimuthalAngle() + step);
    else if (e.key === '+' || e.key === '=') c.object.position.multiplyScalar(0.92);
    else if (e.key === '-' || e.key === '_') c.object.position.multiplyScalar(1.08);
    else used = false;
    if (!used) return;
    e.preventDefault();
    const d = c.object.position.length();
    if (d < 5.5) c.object.position.multiplyScalar(5.5 / d);
    if (d > 9) c.object.position.multiplyScalar(9 / d);
    setInteracted(true);
    c.update();
  };

  const frameloop = !visible ? 'never' : interacted ? 'demand' : 'always';
  const spotsMemo = useMemo(() => spots, [spots]);

  return (
    <Box
      ref={wrap}
      role="group"
      tabIndex={0}
      aria-label="3D view of the G10-401. Drag or use the left and right arrow keys to turn it, plus and minus to zoom."
      onKeyDown={onKey}
      sx={{ position: 'relative', aspectRatio: '1 / 1', width: '100%', backgroundColor: VIEWER_BG, outlineOffset: 2, touchAction: 'pan-y', '& canvas': { display: 'block' } }}
    >
      <Canvas
        dpr={settings.dpr}
        frameloop={frameloop}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ fov: 35, position: [0, 1.1, 6.4], near: 0.1, far: 50 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NeutralToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <Scene url={url} colourKey={display} controlsRef={controlsRef} interacted={interacted} spots={spotsMemo} showSpots={showSpots} onSelect={onSelect} />
      </Canvas>
    </Box>
  );
}
