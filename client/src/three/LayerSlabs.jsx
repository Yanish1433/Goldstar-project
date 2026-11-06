import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SHOE } from './shoe.config.js';
import { smoothHull, scaleAbout } from './hull.js';

// Slab motion table (SPEC 9.6): top y assembled -> exploded, x travel, yaw per e.
const SLABS = [
  { key: 'footbed', top1: 0.1, dx: -0.1, ry: 0.05 },
  { key: 'midsole', top1: -0.3, dx: 0, ry: -0.03 },
  { key: 'outsole', top1: -0.62, dx: 0.1, ry: 0.02 },
];
const TOP0 = -0.74;
const BEVEL = 0.015;

function buildGeometry(hull, thickness) {
  const shape = new THREE.Shape();
  hull.forEach(([x, z], i) => (i === 0 ? shape.moveTo(x, -z) : shape.lineTo(x, -z)));
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 2, curveSegments: 24 });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -(thickness + BEVEL), 0); // top face at local y = 0
  return geo;
}

// Three code slabs built from the shoe's own footprint. Imperative: apply(e) every frame.
const LayerSlabs = forwardRef(function LayerSlabs({ footprint }, ref) {
  const refs = useRef([]);
  const built = useMemo(() => {
    if (!footprint || footprint.length < 3) return null;
    const base = smoothHull(footprint, 2);
    return SLABS.map((s) => {
      const cfg = SHOE.slabs[s.key];
      const hull = scaleAbout(base, cfg.inset);
      const geometry = buildGeometry(hull, cfg.thickness);
      const material = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: cfg.roughness, metalness: cfg.metalness });
      // Anchor: lateral edge point nearest the toe (+x, +z), in slab-local space (top face is y 0).
      let best = hull[0];
      hull.forEach((p) => {
        if (p[0] + 1.5 * p[1] > best[0] + 1.5 * best[1]) best = p;
      });
      return { ...s, geometry, material, anchor: new THREE.Vector3(best[0] * 0.92, -cfg.thickness / 2, best[1] * 0.92) };
    });
  }, [footprint]);

  useEffect(
    () => () => {
      built?.forEach((b) => {
        b.geometry.dispose();
        b.material.dispose();
      });
    },
    [built],
  );

  const tmp = useMemo(() => new THREE.Vector3(), []);
  useImperativeHandle(ref, () => ({
    apply(e) {
      refs.current.forEach((m, i) => {
        if (!m) return;
        const s = SLABS[i];
        m.visible = e > 0.02;
        m.position.set(s.dx * e, TOP0 + (s.top1 - TOP0) * e, 0);
        m.rotation.y = s.ry * e;
        const k = 0.94 + 0.06 * e;
        m.scale.set(k, 1, k);
      });
    },
    // World position of a slab anchor ('footbed' | 'midsole' | 'outsole'); returns shared vector.
    anchorWorld(key) {
      const i = SLABS.findIndex((s) => s.key === key);
      const m = refs.current[i];
      if (!m || !built) return null;
      m.updateWorldMatrix(true, false);
      return tmp.copy(built[i].anchor).applyMatrix4(m.matrixWorld);
    },
  }));

  if (!built) return null;
  return (
    <group>
      {built.map((b, i) => (
        <mesh key={b.key} ref={(el) => { refs.current[i] = el; el?.layers.enable(1); }} geometry={b.geometry} material={b.material} visible={false} frustumCulled={false} />
      ))}
    </group>
  );
});

export default LayerSlabs;
