import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import Shoe from './Shoe.jsx';
import Lights from './Lights.jsx';
import { SHOE } from './shoe.config.js';
import { detectTier } from './tier.js';
import { advanceFlightClock } from './flight.js';
import { useUi } from '../store/ui.js';
import { sampleBox, makeBoxSample, BOX_T, BOX_FLY_SCALE, clamp01 } from './boxTimeline.js';

// Self-contained overlay: a fixed, click-through canvas that plays "shoe arcs into a shoebox, lid closes, box flies
// to the cart icon". Mounted once in Layout; renders only while useUi.cartBox is set. Orthographic camera, so
// 1 world unit = 1 CSS px and screen rects map straight onto the scene.

const BODY = { L: 2.3, W: 1.3, H: 1.0, T: 0.05 }; // box-local units; the shoe (length 3.0) is scaled by SHOE_K
const SHOE_K = 0.62;
const LID_H = 0.34;
const KRAFT = '#b88b5c';
const KRAFT_IN = '#9c7248';
const LID_COL = '#1d1b19';

const modelUrl = () => SHOE.urls[detectTier() === 'full' ? 'desktop' : 'mobile'];
try {
  useGLTF.preload(modelUrl(), false, true);
} catch {
  /* preload is best-effort */
}

function lidTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 288;
  const g = c.getContext('2d');
  g.fillStyle = LID_COL;
  g.fillRect(0, 0, 512, 288);
  g.strokeStyle = '#E2B857';
  g.lineWidth = 3;
  g.strokeRect(14, 14, 484, 260);
  g.fillStyle = '#E2B857';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '600 62px Archivo, Arial, sans-serif';
  g.fillText('GOLDSTAR', 256, 168);
  g.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 ? 13 : 30;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    g.lineTo(256 + r * Math.cos(a), 88 + r * Math.sin(a));
  }
  g.closePath();
  g.fill();
  g.font = '500 20px Arial, sans-serif';
  g.fillText('SHOES  ·  NEPAL', 256, 228);
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

// Open-top base: floor + four walls, plus loose tissue paper.
function Base() {
  const { L, W, H, T } = BODY;
  return (
    <group>
      <Slab pos={[0, T / 2, 0]} size={[L, T, W]} color={KRAFT_IN} />
      <Slab pos={[0, H / 2, W / 2 - T / 2]} size={[L, H, T]} color={KRAFT} />
      <Slab pos={[0, H / 2, -W / 2 + T / 2]} size={[L, H, T]} color={KRAFT} />
      <Slab pos={[L / 2 - T / 2, H / 2, 0]} size={[T, H, W - 2 * T]} color={KRAFT} />
      <Slab pos={[-L / 2 + T / 2, H / 2, 0]} size={[T, H, W - 2 * T]} color={KRAFT} />
      <mesh position={[0, 0.12, 0]} rotation={[0.04, 0.05, -0.03]}>
        <boxGeometry args={[L - 0.18, 0.012, W - 0.16]} />
        <meshStandardMaterial color="#f3ece0" roughness={1} />
      </mesh>
      <mesh position={[0.15, 0.2, 0.1]} rotation={[0.12, -0.2, 0.1]}>
        <boxGeometry args={[0.9, 0.01, 0.6]} />
        <meshStandardMaterial color="#fbf6ec" roughness={1} />
      </mesh>
    </group>
  );
}

// Lid: top plate with the brand print + 4 skirts, hinged at the back top edge (pivot rotates about x).
function Lid({ lidRef }) {
  const { L, W, H, T } = BODY;
  const tex = useMemo(lidTexture, []);
  useEffect(() => () => tex.dispose(), [tex]);
  const lw = L + 0.1;
  const ld = W + 0.1;
  const sh = LID_H - 0.04;
  return (
    <group ref={lidRef} position={[0, H + 0.01, -ld / 2]}>
      <group position={[0, 0, ld / 2]}>
        <mesh position={[0, LID_H - 0.02, 0]}>
          <boxGeometry args={[lw, 0.04, ld]} />
          <meshStandardMaterial attach="material-0" color={LID_COL} roughness={0.8} />
          <meshStandardMaterial attach="material-1" color={LID_COL} roughness={0.8} />
          <meshStandardMaterial attach="material-2" map={tex} roughness={0.7} />
          <meshStandardMaterial attach="material-3" color={KRAFT_IN} roughness={0.9} />
          <meshStandardMaterial attach="material-4" color={LID_COL} roughness={0.8} />
          <meshStandardMaterial attach="material-5" color={LID_COL} roughness={0.8} />
        </mesh>
        <Slab pos={[0, sh / 2, ld / 2 - T / 2]} size={[lw, sh, T]} color={LID_COL} rough={0.8} />
        <Slab pos={[0, sh / 2, -ld / 2 + T / 2]} size={[lw, sh, T]} color={LID_COL} rough={0.8} />
        <Slab pos={[lw / 2 - T / 2, sh / 2, 0]} size={[T, sh, ld]} color={LID_COL} rough={0.8} />
        <Slab pos={[-lw / 2 + T / 2, sh / 2, 0]} size={[T, sh, ld]} color={LID_COL} rough={0.8} />
      </group>
    </group>
  );
}

function Scene({ req }) {
  const { size } = useThree();
  const root = useRef();
  const boxG = useRef();
  const lid = useRef();
  const shoeG = useRef();
  const shoe = useRef();
  const shadow = useRef();
  const shadowTex = useMemo(shadowTexture, []);
  const clock = useRef({ t: 0, last: null, landed: false, cart: null });
  const sample = useMemo(makeBoxSample, []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const S = Math.min(96, Math.max(52, size.width * 0.14)); // px per box unit
  const home = useMemo(() => ({ x: 0, y: -size.height * 0.04 }), [size.height]);
  const src = useMemo(() => {
    const r = req.sourceRect;
    const w = size.width;
    const h = size.height;
    if (!r) return { x: -w * 0.22, y: -h * 0.18, px: S * 2.2 };
    const cx = Math.min(w - 20, Math.max(20, r.left + r.width / 2));
    const cy = Math.min(h - 20, Math.max(20, r.top + r.height / 2));
    return { x: cx - w / 2, y: h / 2 - cy, px: Math.min(Math.max(r.width * 0.5, S * 1.6), S * 3.2) };
  }, [req.sourceRect, size.width, size.height, S]);

  useLayoutEffect(() => {
    shoe.current?.apply(0, 0, req.colour, true, 0.25);
  }, [req.colour]);

  useFrame((_, dtSec) => {
    const C = clock.current;
    const now = performance.now();
    if (C.last == null) {
      C.last = now;
      const r = document.getElementById('cart-button')?.getBoundingClientRect();
      C.cart = r
        ? { x: r.left + r.width / 2 - size.width / 2, y: size.height / 2 - (r.top + r.height / 2) }
        : { x: size.width / 2 - 40, y: size.height / 2 - 40 };
    }
    C.t = advanceFlightClock(C.t, now, C.last);
    C.last = now;
    const s = sampleBox(C.t, sample);

    // Box: pops in at home, then flies to the cart icon along a quadratic arc.
    const f = s.fly;
    const u = 1 - f;
    const cx = home.x + (C.cart.x - home.x) * 0.15;
    const cy = Math.max(home.y, C.cart.y) + size.height * 0.12;
    root.current.position.set(u * u * home.x + 2 * u * f * cx + f * f * C.cart.x, u * u * home.y + 2 * u * f * cy + f * f * C.cart.y, 0);
    const k = (0.6 + 0.4 * s.pop) * (1 + (BOX_FLY_SCALE - 1) * f) * S;
    boxG.current.scale.set(k, k * (1 - 0.035 * s.impact), k);
    boxG.current.rotation.set(0.62 + 0.5 * f, -0.55 + 1.2 * f, 0.35 * f);
    lid.current.rotation.x = s.lid;
    shadow.current.material.opacity = (1 - f) * clamp01(s.pop);
    shadow.current.visible = f < 0.98;

    // Shoe: arcs in through screen space, then falls into the box (box-local coordinates).
    boxG.current.updateWorldMatrix(true, false);
    const restY = BODY.T + 0.1 + 0.77 * SHOE_K + 0.02;
    const hoverY = BODY.H + 1.6;
    if (s.t < BOX_T.arcEnd) {
      const a = s.arc;
      const lift = 4 * a * (1 - a) * S * 1.4;
      const wx = src.x + (home.x - src.x) * a;
      const wy = src.y + (home.y + hoverY * S * 0.62 - src.y) * a + lift;
      tmp.set(wx, wy, 0);
      shoeG.current.position.copy(boxG.current.worldToLocal(tmp));
    } else {
      shoeG.current.position.set(0, hoverY + (restY - hoverY) * s.drop + 0.22 * s.bounce, 0);
    }
    const startK = src.px / 3 / (S * (0.6 + 0.4 * s.pop));
    shoeG.current.scale.setScalar(startK + (SHOE_K - startK) * Math.min(1, s.arc * 1.15));
    const tumble = 1 - Math.min(1, s.arc * 1.1);
    shoeG.current.rotation.set(0.5 * tumble, -0.9 * tumble, 0.7 * tumble);
    shoe.current?.apply(0, Math.min(dtSec, 0.05), req.colour, true, 0.25);

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
      <Lights />
      <ambientLight intensity={0.5} />
      <group ref={root}>
        <group ref={boxG}>
          <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
            <planeGeometry args={[4.4, 3.2]} />
            <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
          </mesh>
          <Base />
          <Lid lidRef={lid} />
          <group ref={shoeG}>
            <Shoe ref={shoe} url={modelUrl()} />
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
