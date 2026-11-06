import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { tokens } from '../theme/tokens.js';

// The gold-particle shoebox (Addendum B U5): a wireframe drawn in dust. 70% of the points sit on the edges
// (dense, larger) and 30% on the faces (small, alpha 0.5), so it reads as a box. Edge points converge in
// order along each edge, so the edges draw like a pen stroke. The lid is its own hinged group (4 edges +
// face). While the box flies it leaves a 120-point trail that fades over 250 ms.

const VERT = /* glsl */ `
  uniform float uT; uniform float uBurst; uniform float uPx;
  attribute vec3 aScatter; attribute float aDelay; attribute float aSize; attribute float aAlpha;
  varying float vAlpha;
  void main() {
    float g = clamp((uT - aDelay) / 260.0, 0.0, 1.0);
    g = 1.0 - pow(1.0 - g, 3.0);
    vec3 p = mix(aScatter, position, g);
    p += normalize(position + vec3(0.001)) * 0.3 * uBurst;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * 3.4 * uPx * (7.5 / -mv.z);
    vAlpha = aAlpha * (0.1 + 0.9 * g) * (1.0 - uBurst);
  }
`;
const FRAG = /* glsl */ `
  uniform vec3 uColor; varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    gl_FragColor = vec4(uColor, smoothstep(0.5, 0.1, d) * vAlpha);
  }
`;
const TRAIL_VERT = /* glsl */ `
  uniform float uNow; uniform float uPx; attribute float aBirth;
  varying float vAlpha;
  void main() {
    float age = uNow - aBirth;
    vAlpha = clamp(1.0 - age / 250.0, 0.0, 1.0) * 0.85;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = 3.0 * uPx * (7.5 / -mv.z);
  }
`;

const BOX = { w: 1.7, h: 0.9, d: 1.1 };
const TRAIL = 120;

function rng(seed) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function sphere(r, rnd, out, o) {
  const u = rnd() * 2 - 1;
  const th = rnd() * Math.PI * 2;
  const k = Math.sqrt(1 - u * u);
  out[o] = r * k * Math.cos(th);
  out[o + 1] = r * u;
  out[o + 2] = r * k * Math.sin(th);
}

// Builds a Points geometry from `edges` ([[a,b],...]) and a face sampler; 70/30 split.
function build(count, edges, faceSample, seed, px) {
  const rnd = rng(seed);
  const target = new Float32Array(count * 3);
  const scatter = new Float32Array(count * 3);
  const delay = new Float32Array(count);
  const size = new Float32Array(count);
  const alpha = new Float32Array(count);
  const edgeN = Math.floor(count * 0.7);
  const per = Math.ceil(edgeN / edges.length);
  for (let i = 0; i < count; i += 1) {
    if (i < edgeN) {
      const e = Math.min(edges.length - 1, Math.floor(i / per));
      const t = ((i % per) + rnd() * 0.5) / per;
      const [a, b] = edges[e];
      for (let j = 0; j < 3; j += 1) target[i * 3 + j] = a[j] + (b[j] - a[j]) * t;
      delay[i] = (e / edges.length) * 80 + t * 110; // ordered along each edge: a pen stroke
      size[i] = 1.2;
      alpha[i] = 1;
    } else {
      faceSample(rnd, target, i * 3);
      delay[i] = rnd() * 190;
      size[i] = 0.7;
      alpha[i] = 0.5;
    }
    sphere(2.6, rnd, scatter, i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(target, 3));
  g.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3));
  g.setAttribute('aDelay', new THREE.BufferAttribute(delay, 1));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  g.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  const m = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    uniforms: { uT: { value: 0 }, uBurst: { value: 0 }, uPx: { value: px }, uColor: { value: new THREE.Color(tokens.gold) } },
  });
  return { g, m };
}

const { w, h, d } = BOX;
const C = [[-w / 2, -h / 2, -d / 2], [w / 2, -h / 2, -d / 2], [w / 2, -h / 2, d / 2], [-w / 2, -h / 2, d / 2], [-w / 2, h / 2, -d / 2], [w / 2, h / 2, -d / 2], [w / 2, h / 2, d / 2], [-w / 2, h / 2, d / 2]];
// Body: bottom 4, vertical 4, top rim 4 (the lid sits on the rim).
const BODY_EDGES = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 5], [2, 6], [3, 7], [4, 5], [5, 6], [6, 7], [7, 4]].map(([a, b]) => [C[a], C[b]]);
// Lid (local, hinge at z 0): rectangle x +-w/2, z 0..d at y 0.
const L = [[-w / 2, 0, 0], [w / 2, 0, 0], [w / 2, 0, d], [-w / 2, 0, d]];
const LID_EDGES = [[0, 1], [1, 2], [2, 3], [3, 0]].map(([a, b]) => [L[a], L[b]]);

function bodyFace(rnd, t, o) {
  const f = Math.floor(rnd() * 5); // bottom, front, back, left, right (open top)
  const u = rnd() - 0.5;
  const v = rnd() - 0.5;
  let x; let y; let z;
  if (f === 0) { x = u * w; y = -h / 2; z = v * d; }
  else if (f === 1) { x = u * w; y = v * h; z = d / 2; }
  else if (f === 2) { x = u * w; y = v * h; z = -d / 2; }
  else if (f === 3) { x = -w / 2; y = v * h; z = u * d; }
  else { x = w / 2; y = v * h; z = u * d; }
  t[o] = x; t[o + 1] = y; t[o + 2] = z;
}
function lidFace(rnd, t, o) {
  t[o] = (rnd() - 0.5) * w;
  t[o + 1] = 0;
  t[o + 2] = rnd() * d;
}

const ParticleBox = forwardRef(function ParticleBox({ px = 1, scale = 1 }, ref) {
  const group = useRef();
  const lid = useRef();
  const trailRef = useRef();
  const head = useRef(0);
  const lastPush = useRef(-1);
  const built = useMemo(() => {
    const body = build(Math.round(2400 * scale), BODY_EDGES, bodyFace, 5, px);
    const lidPts = build(Math.round(600 * scale), LID_EDGES, lidFace, 6, px);
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3));
    const birth = new Float32Array(TRAIL).fill(-1e6);
    tg.setAttribute('aBirth', new THREE.BufferAttribute(birth, 1));
    const tm = new THREE.ShaderMaterial({
      vertexShader: TRAIL_VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      uniforms: { uNow: { value: 0 }, uPx: { value: px }, uColor: { value: new THREE.Color(tokens.gold) } },
    });
    return { body, lid: lidPts, tg, tm };
  }, [scale]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () => () => {
      built.body.g.dispose(); built.body.m.dispose();
      built.lid.g.dispose(); built.lid.m.dispose();
      built.tg.dispose(); built.tm.dispose();
    },
    [built],
  );

  useImperativeHandle(ref, () => ({
    group: group.current,
    apply(f, pos, boxScale) {
      group.current.visible = f.boxVisible;
      group.current.position.copy(pos);
      group.current.scale.setScalar(boxScale);
      lid.current.rotation.x = f.lid;
      for (const o of [built.body, built.lid]) {
        o.m.uniforms.uT.value = f.t;
        o.m.uniforms.uBurst.value = f.burst;
      }
      // Trail: one point per frame while the box flies (world space), fading over 250 ms.
      built.tm.uniforms.uNow.value = f.t;
      if (f.fly > 0.001 && !f.landed && f.t !== lastPush.current) {
        lastPush.current = f.t;
        const i = head.current % TRAIL;
        const p = built.tg.attributes.position;
        p.setXYZ(i, pos.x, pos.y, pos.z);
        built.tg.attributes.aBirth.setX(i, f.t);
        p.needsUpdate = true;
        built.tg.attributes.aBirth.needsUpdate = true;
        head.current += 1;
      }
    },
    hide() {
      group.current.visible = false;
      built.tg.attributes.aBirth.array.fill(-1e6);
      built.tg.attributes.aBirth.needsUpdate = true;
      head.current = 0;
      lastPush.current = -1;
    },
  }));

  return (
    <>
      <group ref={group} visible={false}>
        <points geometry={built.body.g} material={built.body.m} frustumCulled={false} />
        <group ref={lid} position={[0, BOX.h / 2, -BOX.d / 2]}>
          <points geometry={built.lid.g} material={built.lid.m} frustumCulled={false} />
        </group>
      </group>
      <points ref={trailRef} geometry={built.tg} material={built.tm} frustumCulled={false} />
    </>
  );
});

export default ParticleBox;
