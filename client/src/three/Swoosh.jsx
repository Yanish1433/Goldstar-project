import { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react';
import * as THREE from 'three';
import { tokens } from '../theme/tokens.js';

const CURVE_POINTS = [
  [-2.0, -0.9, -0.6], [-1.1, -0.75, 0.5], [0.2, -0.3, 0.9], [1.3, 0.1, 0.5], [1.9, 0.5, -0.2], [2.2, 0.9, -0.4],
];
const TRAIL = 200;

// Flat gold ribbon drawn once during the explode (no bloom): a tube with drawRange plus trailing points.
const Swoosh = forwardRef(function Swoosh(_, ref) {
  const built = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(CURVE_POINTS.map((p) => new THREE.Vector3(...p)));
    const tube = new THREE.TubeGeometry(curve, 240, 0.012, 6);
    const tubeMat = new THREE.MeshBasicMaterial({ color: tokens.gold, toneMapped: false, transparent: true });
    const pts = new Float32Array(TRAIL * 3);
    const v = new THREE.Vector3();
    for (let i = 0; i < TRAIL; i += 1) {
      curve.getPoint(i / (TRAIL - 1), v);
      const j = ((i * 9301 + 49297) % 233280) / 233280 - 0.5;
      pts[i * 3] = v.x + j * 0.06;
      pts[i * 3 + 1] = v.y + (((i * 7919) % 1000) / 1000 - 0.5) * 0.06;
      pts[i * 3 + 2] = v.z + (((i * 104729) % 1000) / 1000 - 0.5) * 0.06;
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    const pm = new THREE.PointsMaterial({ color: tokens.gold, size: 0.02, sizeAttenuation: true, transparent: true, depthWrite: false, toneMapped: false });
    return { tube, tubeMat, pg, pm, indexCount: tube.index.count };
  }, []);

  useEffect(
    () => () => {
      built.tube.dispose();
      built.tubeMat.dispose();
      built.pg.dispose();
      built.pm.dispose();
    },
    [built],
  );

  useImperativeHandle(ref, () => ({
    apply(t, opacity) {
      const visible = t > 0.001 && opacity > 0.001;
      built.tubeObj.visible = visible;
      built.ptsObj.visible = visible;
      if (!visible) return;
      built.tube.setDrawRange(0, Math.floor((built.indexCount * t) / 3) * 3);
      built.pg.setDrawRange(0, Math.floor(TRAIL * t));
      built.tubeMat.opacity = opacity;
      built.pm.opacity = opacity * 0.8;
    },
  }));

  return (
    <group>
      <mesh ref={(el) => (built.tubeObj = el)} geometry={built.tube} material={built.tubeMat} visible={false} frustumCulled={false} />
      <points ref={(el) => (built.ptsObj = el)} geometry={built.pg} material={built.pm} visible={false} frustumCulled={false} />
    </group>
  );
});

export default Swoosh;
