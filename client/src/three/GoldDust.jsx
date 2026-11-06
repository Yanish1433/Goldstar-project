import { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react';
import * as THREE from 'three';
import { tokens } from '../theme/tokens.js';

const VERT = /* glsl */ `
  uniform float uTime; uniform float uDensity; uniform float uPx; uniform float uSpread;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float h = 7.0;
    p.y = mod(p.y + 3.0 + uTime * 0.04 * (0.6 + aSeed), h) - 3.0;
    p.x += sin(uTime * 0.3 + aSeed * 20.0) * 0.15;
    float behind = -4.0 + (position.z + 4.0) / 5.5 * 2.5;
    p.z = mix(behind, p.z, uSpread);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float base = (2.0 + 3.0 * aSeed) / 40.0;
    float bokeh = step(0.92, aSeed); // 8% become slow, large, faint discs
    float depth = -mv.z;
    gl_PointSize = base * uPx * (300.0 / depth) * (0.55 + 0.45 * uDensity) * mix(1.0, 4.0, bokeh);
    // depth fade: nothing crosses a heading at full alpha near the camera, and the far field falls away
    float fade = smoothstep(2.5, 5.5, depth) * (1.0 - smoothstep(10.5, 13.0, depth));
    float twinkle = 0.8 + 0.2 * sin(uTime * 1.5 + aSeed * 40.0);
    float a = 0.6 * uDensity * (0.4 + 0.6 * aSeed) * twinkle;
    vAlpha = mix(a, 0.15 * uDensity, bokeh) * fade;
  }
`;
const FRAG = /* glsl */ `
  uniform vec3 uColor; varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, a * vAlpha);
  }
`;

// Gold dust: soft round points drifting up. Imperative apply(); count is capped with drawRange.
const GoldDust = forwardRef(function GoldDust({ count = 1500, px = 1 }, ref) {
  const { geometry, material } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    let s = 1337;
    const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < count; i += 1) {
      pos[i * 3] = -6 + rnd() * 12;
      pos[i * 3 + 1] = -3 + rnd() * 7;
      pos[i * 3 + 2] = -4 + rnd() * 5.5;
      seed[i] = rnd();
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      uniforms: { uTime: { value: 0 }, uDensity: { value: 1 }, uPx: { value: px }, uSpread: { value: 1 }, uColor: { value: new THREE.Color(tokens.dust) } },
    });
    return { geometry: g, material: m };
  }, [count]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  useEffect(() => {
    material.uniforms.uPx.value = px;
  }, [px, material]);

  useImperativeHandle(ref, () => ({
    apply(time, density, spread, fraction = 1) {
      material.uniforms.uTime.value = time;
      material.uniforms.uDensity.value = density;
      material.uniforms.uSpread.value = spread;
      geometry.setDrawRange(0, Math.floor(count * fraction));
    },
  }));

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={-1} />;
});

export default GoldDust;
