import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Box from '@mui/material/Box';
import { tokens } from '../theme/tokens.js';
import Shoe from './Shoe.jsx';
import Lights from './Lights.jsx';
import { SHOE } from './shoe.config.js';
import { TIER_SETTINGS } from './tier.js';

// 360-degree viewer of the stand-in sneaker for the G10-401 product page (Addendum B U7). Its own canvas (the Home
// canvas is not mounted on this route), reusing Shoe, Lights and the tint lerp. Rotate-only orbit, keyboard
// rotate/zoom, optional hotspots. Frame loop: always while auto-rotating or tinting, demand after the first
// interaction, never while the tab is hidden.

const RIM = 0.3;

function Hotspot({ spot, onSelect }) {
  return (
    <Html position={spot.pos} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <Box
        component="button"
        type="button"
        onClick={(e) => onSelect(spot, e.currentTarget)}
        aria-label={`${spot.title}: show details`}
        sx={{
          pointerEvents: 'auto', display: 'inline-flex', alignItems: 'center', gap: 1, minWidth: 44, minHeight: 44, p: 0, border: 0, cursor: 'pointer',
          background: 'none', color: tokens.ink, font: 'inherit', fontSize: 14, whiteSpace: 'nowrap',
          '&:focus-visible': { outline: `2px solid ${tokens.goldLight}`, outlineOffset: 2 },
        }}
      >
        <Box component="span" sx={{ width: 44, height: 44, display: 'grid', placeItems: 'center' }}>
          <Box component="span" sx={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: tokens.gold, outline: `2px solid ${tokens.gold}`, outlineOffset: 3 }} />
        </Box>
        <Box component="span" sx={{ backgroundColor: tokens.surface1, px: 1, py: 0.5 }}>{spot.title}</Box>
      </Box>
    </Html>
  );
}

function Scene({ url, physical, colourKey, controlsRef, interacted, spots, showSpots, onSelect, onReady }) {
  const shoe = useRef();
  const rig = useRef();
  const { invalidate } = useThree();
  const [points, setPoints] = useState({});

  const ready = useCallback(() => {
    if (!rig.current || !shoe.current) return;
    rig.current.updateMatrixWorld(true);
    const ray = new THREE.Raycaster();
    const E = SHOE.extents;
    const out = {};
    const cast = (key, o, d) => {
      ray.set(o, d);
      const hit = ray.intersectObject(shoe.current.group, true)[0];
      if (hit) out[key] = hit.point.clone().add(d.clone().multiplyScalar(-0.03));
    };
    Object.entries(SHOE.anchors).forEach(([key, a]) => {
      if (!Array.isArray(a)) return;
      const top = SHOE.anchorRays[key] === 'top';
      cast(key, top ? new THREE.Vector3(a[0] * E.u, 3, a[2] * E.w) : new THREE.Vector3(a[0] * E.u, a[1] * E.v, 3), top ? new THREE.Vector3(0, -1, 0) : new THREE.Vector3(0, 0, -1));
    });
    Object.entries(SHOE.viewerLayerAnchors).forEach(([key, [u, v]]) => cast(key, new THREE.Vector3(u * E.u, v * E.v, 3), new THREE.Vector3(0, 0, -1)));
    setPoints(out);
    onReady?.();
    invalidate();
  }, [invalidate, onReady]);

  useFrame((_, dt) => {
    if (!shoe.current) return;
    const animating = shoe.current.apply(0, Math.min(dt, 0.05), colourKey, false, RIM);
    if (animating) invalidate();
  });

  return (
    <>
      <color attach="background" args={[tokens.ground]} />
      <Lights />
      <group ref={rig}>
        <Shoe ref={shoe} url={url} physical={physical} onReady={() => setTimeout(ready, 0)} />
      </group>
      {showSpots ? spots.filter((s) => points[s.anchor]).map((s) => <Hotspot key={s.key} spot={{ ...s, pos: points[s.anchor] }} onSelect={onSelect} />) : null}
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
        onStart={() => {}}
      />
    </>
  );
}

export default function ProductViewer({ tier = 'full', colourKey, spots, showSpots, onSelect }) {
  const [interacted, setInteracted] = useState(false);
  const [visible, setVisible] = useState(document.visibilityState === 'visible');
  const controlsRef = useRef(null);
  const settings = TIER_SETTINGS[tier] || TIER_SETTINGS.full;
  const url = tier === 'lite' ? SHOE.urls.mobile : SHOE.urls.desktop;
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
      aria-label="3D view of the stand-in sneaker. Left and right arrow keys rotate it, plus and minus zoom."
      onKeyDown={onKey}
      sx={{ position: 'relative', aspectRatio: '1 / 1', width: '100%', backgroundColor: tokens.ground, outlineOffset: 2, touchAction: 'pan-y', '& canvas': { display: 'block' } }}
    >
      <Canvas
        dpr={settings.dpr}
        frameloop={frameloop}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ fov: 35, position: [0, 1.1, 6.4], near: 0.1, far: 50 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = SHOE.look.exposure;
        }}
      >
        <Scene url={url} physical={tier === 'full'} colourKey={colourKey} controlsRef={controlsRef} interacted={interacted} spots={spotsMemo} showSpots={showSpots} onSelect={onSelect} />
      </Canvas>
    </Box>
  );
}
