import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { SHOE, tintFor } from './shoe.config.js';
import { disposeShoe } from './shoeDispose.js';
const easeOutCubic = (x) => 1 - (1 - x) ** 3;

const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _inv = new THREE.Matrix4();

// The GLB shoe, normalised into rig space (length 3.0, bottom at y -0.77, centred on x/z).
// Exposes apply(e, dt, colourKey, instant) and footprint points for the slabs.
// Fresnel gold edge (emissive only: no post pass) and, on the full tier, a masked clearcoat and fabric sheen.
function enhance(material, physical) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.rimColor = { value: new THREE.Color(SHOE.look.rimColor) };
    shader.uniforms.rimPower = { value: SHOE.look.rimPower };
    shader.uniforms.rimStrength = { value: 0.35 };
    material.userData.shader = shader;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
uniform vec3 rimColor;
uniform float rimPower;
uniform float rimStrength;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{ vec3 vd = normalize(vViewPosition); float fr = pow(1.0 - saturate(dot(normalize(normal), vd)), rimPower); totalEmissiveRadiance += rimColor * fr * rimStrength; }`);
    if (physical) {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <lights_physical_fragment>',
        `#include <lights_physical_fragment>
#ifdef USE_CLEARCOAT
material.clearcoat *= smoothstep(0.55, 0.3, roughnessFactor);
#endif
#ifdef USE_SHEEN
material.sheenColor *= smoothstep(0.3, 0.55, roughnessFactor);
#endif`,
      );
    }
  };
  material.customProgramCacheKey = () => (physical ? 'gs-shoe-physical' : 'gs-shoe-standard');
}

function toPhysical(src) {
  const m = new THREE.MeshPhysicalMaterial();
  THREE.MeshStandardMaterial.prototype.copy.call(m, src);
  m.clearcoat = SHOE.look.clearcoat;
  m.clearcoatRoughness = SHOE.look.clearcoatRoughness;
  m.sheen = SHOE.look.sheen;
  m.sheenColor = new THREE.Color(SHOE.look.sheenColor);
  m.sheenRoughness = 0.8;
  m.normalScale.set(SHOE.look.normalScale, SHOE.look.normalScale);
  return m;
}

const Shoe = forwardRef(function Shoe({ url, onReady, physical = false, shared = false }, ref) {
  const gltf = useGLTF(url, false, true);
  const scene = useMemo(() => {
    const s = gltf.scene.clone(true);
    s.traverse((o) => {
      if (o.isMesh) {
        o.material = physical ? toPhysical(o.material) : o.material.clone();
        enhance(o.material, physical);
        o.frustumCulled = false;
        o.layers.enable(1);
      }
    });
    return s;
  }, [gltf, physical]);
  const upper = useRef();
  const yaw = useRef();
  const norm = useRef();
  const tint = useRef({ from: new THREE.Color(), to: new THREE.Color(), t: 1, key: null, target: new THREE.Color() });
  const mats = useRef([]);

  useLayoutEffect(() => {
    mats.current = [];
    scene.traverse((o) => o.isMesh && mats.current.push(o.material));
    yaw.current.rotation.y = SHOE.normalise.yawOffset;
    norm.current.position.set(0, 0, 0);
    norm.current.scale.setScalar(1);
    norm.current.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    const k = SHOE.normalise.length / (SHOE.normalise.axis === 'x' ? size.x : size.z);
    norm.current.scale.setScalar(k);
    norm.current.position.set(-centre.x * k, SHOE.bottomY - box.min.y * k, -centre.z * k);

    // Footprint: vertices near the bottom, in rig space (relative to the rig group = upper's parent).
    const rig = upper.current.parent;
    rig.updateWorldMatrix(true, false);
    upper.current.updateMatrixWorld(true);
    _inv.copy(rig.matrixWorld).invert();
    const height = size.y * k;
    const limit = SHOE.bottomY + 0.04 * height;
    const pts = [];
    scene.traverse((o) => {
      if (!o.isMesh) return;
      _m.multiplyMatrices(_inv, o.matrixWorld);
      const pos = o.geometry.attributes.position;
      for (let i = 0; i < pos.count; i += 3) {
        _v.fromBufferAttribute(pos, i).applyMatrix4(_m);
        if (_v.y < limit) pts.push([_v.x, _v.z]);
      }
    });
    onReady?.({ footprint: pts, height, size: [size.x * k, size.y * k, size.z * k] });
    // Initial tint
    const t0 = tintFor('black');
    mats.current.forEach((m) => {
      m.color.set(t0.color);
      m.roughness = t0.roughness;
    });
    tint.current.from.set(t0.color);
    tint.current.to.set(t0.color);
    tint.current.key = null;

    return () => disposeShoe({ ownMaterials: mats.current, gltfScene: gltf.scene, clearCache: () => useGLTF.clear(url), shared });
  }, [scene]); // eslint-disable-line react-hooks/exhaustive-deps

  useImperativeHandle(ref, () => ({
    group: upper.current,
    // Returns true while the colour tint is still easing (callers on demand loops keep invalidating).
    apply(e, dt, colourKey, instant, rim = 0.35) {
      mats.current.forEach((m) => {
        if (m.userData.shader) m.userData.shader.uniforms.rimStrength.value = rim;
      });
      upper.current.position.y = 0.95 * e;
      upper.current.rotation.x = -0.06 * e;
      const T = tint.current;
      if (T.key !== colourKey) {
        const tt = tintFor(colourKey);
        T.target.set(tt.color);
        T.from.copy(mats.current[0]?.color || T.target);
        T.t = instant ? 1 : 0;
        T.key = colourKey;
      }
      if (T.t < 1) {
        T.t = Math.min(1, T.t + dt / 0.6);
        const f = easeOutCubic(T.t);
        mats.current.forEach((m) => {
          m.color.copy(T.from).lerp(T.target, f);
        });
      } else if (instant) {
        mats.current.forEach((m) => m.color.copy(T.target));
      }
      return T.t < 1;
    },
  }));

  return (
    <group ref={upper}>
      <group ref={yaw}>
        <group ref={norm}>
          <primitive object={scene} />
        </group>
      </group>
    </group>
  );
});

export default Shoe;
