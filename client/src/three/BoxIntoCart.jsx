import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import Boot, { bootUrl } from './Boot.jsx';
import StudioLights from './StudioLights.jsx';
import { displayForProduct } from '../story/model.config.js';
import { detectTier } from './tier.js';
import { advanceFlightClock } from './flight.js';
import { useUi } from '../store/ui.js';
import { sampleBox, makeBoxSample, makeParticleLayout, BOX_T, BOX_FLY_SCALE } from './boxTimeline.js';
import { fitBox, bootLocalPose, WALL, FLOOR, FLAP_OPEN } from './boxFit.js';

// Self-contained overlay: a fixed, click-through canvas. Gold sparkles swirl in and form a shoebox; the boot arcs in,
// rotates to lie on its side, drops into the open box and settles on the tissue paper; two tissue flaps fold over it;
// the black GOLDSTAR lid drops shut; the closed box flies to the cart icon. The box is SIZED FROM THE BOOT'S BOUNDING
// BOX (boxFit.js: inner length = boot + 8%), so any model fits. Orthographic camera (1 world unit = 1 CSS px), the box
// tilted to a 3/4 top-down view so the boot is seen settling inside before the lid closes.

const KRAFT = '#c4935f';
const KRAFT_IN = '#a47848';
const LID_COL = '#1d1b19';
const TISSUE = '#f7efe2';
const BOOT_LIFT = '#2e2a26';
const TRAIL_N = 44;
const TILT = 0.98;
const YAW = -0.5;

// The boot that goes into the box is the real G10-401 (same files as the home story).
const modelUrl = () => bootUrl(detectTier());
try {
  useGLTF.preload(modelUrl(), false, true);
} catch {
  /* preload is best-effort */
}

function lidTexture() {
  const c = document.createElement('canvas');
  c.width = 640;
  c.height = 400;
  const g = c.getContext('2d');
  g.fillStyle = LID_COL;
  g.fillRect(0, 0, 640, 400);
  g.strokeStyle = '#E2B857';
  g.lineWidth = 4;
  g.strokeRect(18, 18, 604, 364);
  g.fillStyle = '#E2B857';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '700 84px Archivo, Arial, sans-serif';
  g.fillText('GOLDSTAR', 320, 236);
  g.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 ? 17 : 40;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    g.lineTo(320 + r * Math.cos(a), 122 + r * Math.sin(a));
  }
  g.closePath();
  g.fill();
  g.font = '500 26px Arial, sans-serif';
  g.fillText('SHOES  ·  NEPAL', 320, 308);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  gr.addColorStop(0, 'rgba(0,0,0,0.55)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

const Slab = ({ pos, size, color, rough = 0.9 }) => (
  <mesh position={pos}>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} roughness={rough} metalness={0} />
  </mesh>
);

// Open-top base (floor + four walls) with tissue paper on the floor. All sizes come from the fit.
function Base({ fit }) {
  const { outer, inner, floorTop } = fit;
  const wallH = outer.H - FLOOR;
  const wy = FLOOR + wallH / 2;
  return (
    <group>
      <Slab pos={[0, FLOOR / 2, 0]} size={[outer.L, FLOOR, outer.Z]} color={KRAFT_IN} />
      <Slab pos={[0, wy, outer.Z / 2 - WALL / 2]} size={[outer.L, wallH, WALL]} color={KRAFT} />
      <Slab pos={[0, wy, -outer.Z / 2 + WALL / 2]} size={[outer.L, wallH, WALL]} color={KRAFT} />
      <Slab pos={[outer.L / 2 - WALL / 2, wy, 0]} size={[WALL, wallH, inner.Z]} color={KRAFT} />
      <Slab pos={[-outer.L / 2 + WALL / 2, wy, 0]} size={[WALL, wallH, inner.Z]} color={KRAFT} />
      <mesh position={[0, floorTop - 0.04, 0]}>
        <boxGeometry args={[inner.L - 0.02, 0.08, inner.Z - 0.02]} />
        <meshStandardMaterial color={TISSUE} roughness={1} />
      </mesh>
      <mesh position={[inner.L * 0.2, floorTop + 0.01, inner.Z * 0.18]} rotation={[0.1, -0.3, 0.06]}>
        <boxGeometry args={[inner.L * 0.34, 0.012, inner.Z * 0.28]} />
        <meshStandardMaterial color="#fffaf0" roughness={1} />
      </mesh>
    </group>
  );
}

// Two tissue flaps, hinged on the inner top of the front/back walls; open = standing up and leaning out (120deg).
function Flaps({ fit, aRef, bRef }) {
  const { inner, flapY } = fit;
  const d = inner.Z / 2 + 0.08;
  return (
    <group>
      <group ref={aRef} position={[0, flapY, -inner.Z / 2]}>
        <mesh position={[0, 0, d / 2]}>
          <boxGeometry args={[inner.L - 0.04, 0.014, d]} />
          <meshStandardMaterial color={TISSUE} roughness={1} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <group ref={bRef} position={[0, flapY + 0.012, inner.Z / 2]}>
        <mesh position={[0, 0, -d / 2]}>
          <boxGeometry args={[inner.L - 0.04, 0.014, d]} />
          <meshStandardMaterial color="#fffaf2" roughness={1} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

// Lid: brand-printed top plate + 4 skirts that overlap the wall tops, hinged on the back top edge.
function Lid({ fit, lidRef }) {
  const { outer, lidH, rim } = fit;
  const tex = useMemo(lidTexture, []);
  useEffect(() => () => tex.dispose(), [tex]);
  const lw = outer.L + 0.14;
  const ld = outer.Z + 0.14;
  const sk = lidH + 0.3; // skirt height, reaching below the rim
  const T = WALL * 0.7;
  return (
    <group ref={lidRef} position={[0, rim, -ld / 2]}>
      <group position={[0, 0, ld / 2]}>
        <mesh position={[0, lidH - 0.02, 0]}>
          <boxGeometry args={[lw, 0.05, ld]} />
          <meshStandardMaterial attach="material-0" color={LID_COL} roughness={0.8} />
          <meshStandardMaterial attach="material-1" color={LID_COL} roughness={0.8} />
          <meshStandardMaterial attach="material-2" map={tex} roughness={0.65} />
          <meshStandardMaterial attach="material-3" color={KRAFT_IN} roughness={0.9} />
          <meshStandardMaterial attach="material-4" color={LID_COL} roughness={0.8} />
          <meshStandardMaterial attach="material-5" color={LID_COL} roughness={0.8} />
        </mesh>
        <Slab pos={[0, lidH - sk / 2 - 0.02, ld / 2 - T / 2]} size={[lw, sk, T]} color={LID_COL} rough={0.8} />
        <Slab pos={[0, lidH - sk / 2 - 0.02, -ld / 2 + T / 2]} size={[lw, sk, T]} color={LID_COL} rough={0.8} />
        <Slab pos={[lw / 2 - T / 2, lidH - sk / 2 - 0.02, 0]} size={[T, sk, ld]} color={LID_COL} rough={0.8} />
        <Slab pos={[-lw / 2 + T / 2, lidH - sk / 2 - 0.02, 0]} size={[T, sk, ld]} color={LID_COL} rough={0.8} />
      </group>
    </group>
  );
}

// Gold sparkles: soft round points with a pale core, normal blending (visible on light photos as well as dark).
const SPARK_FRAG = `
varying float vA;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  if (r > 1.0) discard;
  float core = 1.0 - r;
  vec3 col = mix(vec3(0.89, 0.66, 0.2), vec3(1.0, 0.95, 0.72), core * core);
  gl_FragColor = vec4(col, vA * core * 1.4);
}`;
const FORM_VERT = `
attribute vec3 aStart; attribute vec3 aTarget; attribute vec3 aRnd;
uniform float uForm, uFade, uTime, uSize, uDpr, uMid;
varying float vA;
void main() {
  float d = aRnd.x * 0.4;
  float e = clamp((uForm - d) / (1.0 - d), 0.0, 1.0);
  e = 1.0 - pow(1.0 - e, 3.0);
  vec3 p = mix(aStart, aTarget, e);
  float ang = (1.0 - e) * (2.5 + aRnd.y * 3.0);
  float c = cos(ang), s = sin(ang);
  vec3 q = p - vec3(0.0, uMid, 0.0);
  p = vec3(q.x * c - q.z * s, q.y + uMid, q.x * s + q.z * c);
  float tw = 0.7 + 0.3 * sin(uTime * 14.0 + aRnd.z * 40.0);
  vA = tw * uFade * smoothstep(0.0, 0.12, uForm * 1.4 - d * 0.5);
  gl_PointSize = uSize * uDpr * (0.55 + aRnd.y) * (1.0 + (1.0 - e) * 0.5);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const TRAIL_VERT = `
attribute float aI;
uniform float uA, uDpr;
varying float vA;
void main() {
  vA = (1.0 - aI) * uA;
  gl_PointSize = 15.0 * uDpr * (1.0 - aI * 0.7);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

function setFade(group, a, state) {
  const transparent = a < 0.999;
  group.traverse((o) => {
    if (!o.isMesh) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
      if (m.transparent !== transparent) {
        m.transparent = transparent;
        m.depthWrite = !transparent;
        m.needsUpdate = true;
      }
      m.opacity = a;
    });
  });
  state.a = a;
}

const _v = new THREE.Vector3();
const _e = new THREE.Euler();

function Scene({ req }) {
  const { size, viewport } = useThree();
  const root = useRef();
  const boxG = useRef();
  const solidG = useRef();
  const lid = useRef();
  const flapA = useRef();
  const flapB = useRef();
  const shoeG = useRef();
  const shoe = useRef();
  const shadow = useRef();
  const fade = useRef({ a: -1 });
  const [fit, setFit] = useState(null);
  const shadowTex = useMemo(shadowTexture, []);
  const clock = useRef({ t: 0, last: null, landed: false, cart: null });
  const sample = useMemo(makeBoxSample, []);
  const dpr = viewport.dpr || 1;
  const bootTint = displayForProduct(req.colour).key; // the colourway that was added
  const lite = useMemo(() => detectTier() !== 'full', []);

  // Particles (points) and the sparkle trail.
  const form = useMemo(() => {
    if (!fit) return null;
    const n = lite ? 1000 : 2400;
    const { start, target, rnd } = makeParticleLayout(n, { hx: fit.outer.L / 2 + 0.02, hz: fit.outer.Z / 2 + 0.02, y0: 0, y1: fit.outer.H });
    // starts scale with the box so the swirl radius is proportional
    for (let i = 0; i < start.length; i += 1) start[i] *= fit.outer.L / 2.4;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
    g.setAttribute('aTarget', new THREE.BufferAttribute(target, 3));
    g.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 3));
    const m = new THREE.ShaderMaterial({
      vertexShader: FORM_VERT,
      fragmentShader: SPARK_FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: { uForm: { value: 0 }, uFade: { value: 1 }, uTime: { value: 0 }, uSize: { value: lite ? 4.5 : 5.5 }, uDpr: { value: dpr }, uMid: { value: fit.outer.H / 2 } },
    });
    const pts = new THREE.Points(g, m);
    pts.frustumCulled = false;
    pts.renderOrder = 10;
    return pts;
  }, [fit, lite, dpr]);
  const trail = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL_N * 3), 3));
    g.setAttribute('aI', new THREE.BufferAttribute(Float32Array.from({ length: TRAIL_N }, (_, i) => i / TRAIL_N), 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: TRAIL_VERT,
      fragmentShader: SPARK_FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: { uA: { value: 1 }, uDpr: { value: dpr } },
    });
    const pts = new THREE.Points(g, m);
    pts.frustumCulled = false;
    pts.renderOrder = 11;
    pts.visible = false;
    return pts;
  }, [dpr]);
  useEffect(
    () => () => {
      [form, trail].forEach((p) => {
        if (!p) return;
        p.geometry.dispose();
        p.material.dispose();
      });
    },
    [form, trail],
  );

  // Box scale: desktop box ~300 px wide on screen, phone ~270 px.
  const S = Math.min(76, Math.max(40, size.width * 0.17));
  const unitW = fit ? fit.outer.L : 3.4;
  const boxPx = unitW * S;
  const src = useMemo(() => {
    const r = req.sourceRect;
    const w = size.width;
    const h = size.height;
    if (!r) return { x: -w * 0.1, y: -h * 0.2, px: S * 2.6 };
    const cx = Math.min(w - 20, Math.max(20, r.left + r.width / 2));
    const cy = Math.min(h - 20, Math.max(20, r.top + r.height / 2));
    return { x: cx - w / 2, y: h / 2 - cy, px: Math.min(Math.max(r.width * 0.5, S * 1.8), S * 3.4) };
  }, [req.sourceRect, size.width, size.height, S]);
  // Home: between the trigger and the screen centre, kept fully on screen.
  const home = useMemo(() => {
    const mx = Math.max(0, size.width / 2 - boxPx * 0.62);
    const my = Math.max(0, size.height / 2 - boxPx * 0.5);
    return { x: Math.min(mx, Math.max(-mx, src.x * 0.45)), y: Math.min(my, Math.max(-my, src.y * 0.45 - size.height * 0.03)) };
  }, [src, size.width, size.height, boxPx]);

  // Box dimensions come from the boot's normalised bounding box once the model is placed.
  // The charcoal boot gets a soft warm emissive lift so it reads against the tissue and the kraft walls.
  const onShoeReady = useCallback(({ size: sz, built }) => {
    built.root.traverse((o) => o.isMesh && o.material.emissive?.set(BOOT_LIFT));
    setFit(fitBox(sz));
  }, []);

  useFrame((_, dtSec) => {
    if (!fit || !form) return; // wait for the model: the clock starts when the box can be built
    const C = clock.current;
    const now = performance.now();
    if (C.last == null) {
      C.last = now;
      const r = document.getElementById('cart-button')?.getBoundingClientRect();
      C.cart = r
        ? { x: r.left + r.width / 2 - size.width / 2, y: size.height / 2 - (r.top + r.height / 2) }
        : { x: size.width / 2 - 40, y: size.height / 2 - 40 };
    }
    const freeze = import.meta.env.DEV && typeof window !== 'undefined' ? window.__gsCartBoxT : undefined; // dev-only test hook: pin the timeline
    C.t = Number.isFinite(freeze) ? freeze : advanceFlightClock(C.t, now, C.last);
    C.last = now;
    const s = sampleBox(C.t, sample);

    // Box: eases to full size at home, then flies to the cart icon along a quadratic arc.
    const cx = home.x + (C.cart.x - home.x) * 0.15;
    const cy = Math.max(home.y, C.cart.y) + size.height * 0.12;
    const path = (f) => {
      const u = 1 - f;
      return [u * u * home.x + 2 * u * f * cx + f * f * C.cart.x, u * u * home.y + 2 * u * f * cy + f * f * C.cart.y];
    };
    const f = s.fly;
    const [bx, by] = path(f);
    root.current.position.set(bx, by, 0);
    const pop = 0.75 + 0.25 * Math.min(1.08, s.pop);
    const k = pop * (1 + (BOX_FLY_SCALE - 1) * f) * S;
    boxG.current.scale.set(k, k * (1 - 0.03 * s.impact), k);
    boxG.current.rotation.set(TILT + 0.25 * f, YAW + 1.2 * f, 0.35 * f);
    // Centre the box on its own middle so it sits in the middle of `home`.
    boxG.current.position.set(0, -fit.outer.H * 0.5 * k * 0.55, 0);
    lid.current.rotation.x = s.lid;
    flapA.current.rotation.x = FLAP_OPEN * (1 - s.flapA) * -1;
    flapB.current.rotation.x = FLAP_OPEN * (1 - s.flapB);
    if (Math.abs(fade.current.a - s.solid) > 0.004) setFade(solidG.current, s.solid, fade.current);
    solidG.current.visible = s.solid > 0.003;
    shadow.current.material.opacity = (1 - f) * s.solid;
    shadow.current.visible = f < 0.98 && s.solid > 0.003;

    // Sparkles converge on the box outline, then fade as the solid box takes over.
    const U = form.material.uniforms;
    U.uForm.value = s.form;
    U.uFade.value = s.pfade;
    U.uTime.value = C.t / 1000;
    form.visible = s.pfade > 0.003;

    // Sparkle trail: stateless, laid along the flight path behind the box.
    trail.visible = f > 0.001;
    if (trail.visible) {
      const pos = trail.geometry.attributes.position;
      for (let i = 0; i < TRAIL_N; i += 1) {
        const fi = Math.max(0, f - (i / TRAIL_N) * 0.3);
        const [px, py] = path(fi);
        const j = Math.sin(i * 12.9898) * 43758.5453;
        const j2 = Math.sin(i * 78.233) * 12345.678;
        pos.setXYZ(i, px + (j - Math.floor(j) - 0.5) * 26 * (i / TRAIL_N), py + (j2 - Math.floor(j2) - 0.5) * 26 * (i / TRAIL_N), 5);
      }
      pos.needsUpdate = true;
    }

    // Boot. Placed by its bounding-box CENTRE (so rotation never moves it off its path); the group origin follows.
    boxG.current.updateWorldMatrix(true, false);
    const { sx } = fit.boot;
    const cOff = 0; // the boot rig is centred on its bounding box
    let centre;
    let rot;
    let sc = 1;
    if (s.t < BOX_T.arcEnd) {
      // Arc in world space (kept in front of the box), landing exactly on the hover point above the box.
      const a = s.arc;
      _v.set(0, fit.hoverCY, 0);
      const hov = boxG.current.localToWorld(_v.clone());
      const wx = src.x + (hov.x - src.x) * a;
      const wy = src.y + (hov.y - src.y) * a + 4 * a * (1 - a) * S * 1.6;
      centre = boxG.current.worldToLocal(_v.set(wx, wy, 600 * (1 - a) * (1 - a)));
      const startK = src.px / sx / (S * pop);
      sc = startK + (1 - startK) * a;
      const lie = s.lie;
      rot = [(Math.PI / 2) * lie + 0.5 * (1 - lie), -0.9 * (1 - lie), 0.7 * (1 - lie)];
    } else {
      const p = bootLocalPose(s, fit);
      centre = _v.set(p.cx, p.cy, p.cz);
      rot = p.rot;
    }
    _e.set(rot[0], rot[1], rot[2]);
    shoeG.current.rotation.copy(_e);
    shoeG.current.scale.setScalar(sc);
    const off = new THREE.Vector3(0, cOff, 0).applyEuler(_e).multiplyScalar(sc);
    shoeG.current.position.copy(centre).sub(off);

    const wrap = document.getElementById('gs-cartbox');
    if (wrap) wrap.style.opacity = String(s.opacity);
    if (s.landed && !C.landed) {
      C.landed = true;
      useUi.getState().landCartBox(req.id);
    }
    if (s.done) useUi.getState().endCartBox(req.id);
  });

  return (
    <>
      <StudioLights />
      <ambientLight intensity={0.7} />
      <directionalLight position={[-2.5, 3, -3]} intensity={2.4} color="#E2B857" />
      <directionalLight position={[3, 4, 2]} intensity={1.1} color="#fff4e0" />
      <primitive object={trail} />
      <group ref={root}>
        <group ref={boxG}>
          {fit ? (
            <>
              <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                <planeGeometry args={[fit.outer.L * 1.35, fit.outer.Z * 1.35]} />
                <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
              </mesh>
              <group ref={solidG} visible={false}>
                <Base fit={fit} />
                <Flaps fit={fit} aRef={flapA} bRef={flapB} />
                <Lid fit={fit} lidRef={lid} />
              </group>
              <primitive object={form} />
            </>
          ) : null}
          <group ref={shoeG} visible={!!fit}>
            <Boot ref={shoe} url={modelUrl()} colourKey={bootTint} onReady={onShoeReady} />
          </group>
        </group>
      </group>
    </>
  );
}

// If anything in the canvas throws (no WebGL, model 404), land the cart add immediately instead of hanging.
class Guard extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    useUi.getState().endCartBox(this.props.id);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function BoxIntoCart() {
  const req = useUi((s) => s.cartBox);
  if (!req) return null;
  return (
    <div id="gs-cartbox" aria-hidden="true" data-testid="cart-box" style={{ position: 'fixed', inset: 0, zIndex: 1350, pointerEvents: 'none' }}>
      <Guard id={req.id} key={req.id}>
        <Canvas
          orthographic
          camera={{ position: [0, 0, 1000], zoom: 1, near: 0.1, far: 3000 }}
          gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
          dpr={[1, 1.5]}
          style={{ pointerEvents: 'none' }}
        >
          <Suspense fallback={null}>
            <Scene req={req} />
          </Suspense>
        </Canvas>
      </Guard>
    </div>
  );
}
