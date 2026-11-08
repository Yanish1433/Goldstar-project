import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, PerformanceMonitor, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import '../three/quiet.js';
import { gsap } from 'gsap';
import { STORY_MODEL, CALLOUTS, BADGES, partColours } from './model.config.js';
import { buildParts, createTinter, disposeParts } from './splitModel.js';
import StudioLights from '../three/StudioLights.jsx';
import { trackAt, makePose, samplePose } from './storyline.js';
import { live, touch, useStoryUi } from './state.js';

const FOV = 30;
const IDLE_MS = 900; // stop rendering this long after the last change

// Renders exactly once per GSAP tick (after Lenis + ScrollTrigger have updated `live.T`), so the 3D is
// frame-locked to the scroll. Idle frames are skipped.
function Driver({ active }) {
  const advance = useThree((s) => s.advance);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    live.invalidate = () => touch();
    const tick = () => {
      if (!active.current) return;
      const idle = performance.now() - live.lastMove > IDLE_MS && !live.drag.active;
      if (idle && live.pending <= 0) return;
      live.pending -= 1;
      advance(performance.now());
    };
    gsap.ticker.add(tick);
    touch();
    return () => {
      gsap.ticker.remove(tick);
      live.invalidate = null;
    };
  }, [advance, invalidate, active]);
  // Resizes change the framing: render again.
  const size = useThree((s) => s.size);
  useEffect(() => touch(), [size]);
  return null;
}

const damp = (a, b, lambda, dt) => THREE.MathUtils.damp(a, b, lambda, dt);
// Exploded view stagger (fraction of the explode track), outside in.
const EXPLODE_DELAY = { collar: 0, pull_tab: 0, laces: 0.04, eyelets: 0.04, tongue: 0.07, toe_cap: 0.12, heel_counter: 0.16, overlays: 0.16, upper: 0.16, insole: 0.2, midsole: 0.1, outsole: 0 };
const LABEL_SETS = [['callouts', CALLOUTS], ['badges', BADGES]];

function ShoeRig({ url, onReady, shadowRef }) {
  const gltf = useGLTF(url, false, true);
  const built = useMemo(() => buildParts(gltf.scene, STORY_MODEL), [gltf]);
  const tinter = useMemo(() => createTinter(built.parts), [built]);
  const rig = useRef();
  const pose = useMemo(() => makePose(), []);
  const camera = useThree((s) => s.camera);
  const sizeRef = useRef({ w: 1, h: 1 });
  const size = useThree((s) => s.size);
  sizeRef.current = { w: size.width, h: size.height };
  const colourKey = useStoryUi((s) => s.colourKey);
  const shown = useRef({ yaw: 0, pitch: 0, zoom: 1 });
  const tmp = useMemo(() => ({ v: new THREE.Vector3(), first: true }), []);

  // Colour per part for the current colourway (eased in the frame loop; the first one is instant).
  useEffect(() => {
    tinter.set(partColours(colourKey), tmp.first);
    tmp.first = false;
    touch();
  }, [colourKey, tinter, tmp]);

  useLayoutEffect(() => {
    if (shadowRef.current) shadowRef.current.position.y = -built.size.y / 2 - 0.01; // floor under the boot
    onReady?.();
    touch();
    return () => disposeParts(built);
  }, [built]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state, dtRaw) => {
    const dt = Math.min(0.1, dtRaw || 0.016);
    const { w: W, h: H } = sizeRef.current;
    const layout = useStoryUi.getState().layout;
    samplePose(live.T, layout, pose);

    // Studio interaction, eased.
    const s = shown.current;
    const D = live.drag;
    s.yaw = damp(s.yaw, D.yaw, 8, dt);
    s.pitch = damp(s.pitch, D.pitch, 8, dt);
    s.zoom = damp(s.zoom, D.zoom, 8, dt);
    if (Math.abs(s.yaw - D.yaw) + Math.abs(s.pitch - D.pitch) + Math.abs(s.zoom - D.zoom) < 0.0005) Object.assign(s, { yaw: D.yaw, pitch: D.pitch, zoom: D.zoom });
    const k = pose.studio;
    const easing = Math.abs(s.yaw - D.yaw) + Math.abs(s.pitch - D.pitch) + Math.abs(s.zoom - D.zoom) > 0.001;

    // Camera: frame the shoe (radius R) inside the stage box, then shift it there with a view offset.
    const bw = pose.w * W;
    const bh = pose.h * H;
    const m = pose.fill * Math.min(bw, bh) * (1 + (s.zoom - 1) * k);
    const t = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const d = (pose.R * (STORY_MODEL.frame || 1) * H) / (m * t);
    const el = pose.el + s.pitch * k;
    camera.position.set(Math.sin(pose.az) * Math.cos(el) * d, Math.sin(el) * d, Math.cos(pose.az) * Math.cos(el) * d);
    camera.lookAt(0, 0, 0);
    camera.setViewOffset(W, H, W / 2 - pose.cx * W, H / 2 - pose.cy * H, W, H);
    camera.near = Math.max(0.05, d - 8);
    camera.far = d + 12;
    camera.updateProjectionMatrix();

    // Shoe.
    const g = rig.current;
    g.visible = pose.alpha > 0.02;
    g.position.set(0, pose.lift, 0);
    g.rotation.set(pose.rx, pose.ry + s.yaw * k, pose.rz, 'YXZ');

    // Exploded view: each part slides along its offset, staggered from the outside in.
    Object.entries(built.parts).forEach(([name, p]) => {
      const delay = EXPLODE_DELAY[name] || 0;
      const e = THREE.MathUtils.smoothstep(Math.min(1, Math.max(0, (pose.explode - delay) / (1 - 0.2))), 0, 1);
      const o = p.cfg.offset;
      const r = p.cfg.rot;
      p.group.position.set(p.base.x + o[0] * e, p.base.y + o[1] * e, p.base.z + o[2] * e);
      p.group.rotation.set(r[0] * e, r[1] * e, r[2] * e);
      if (p.generated) p.group.visible = e > 0.02;
    });
    const colourMoving = tinter.step(dt);

    // Contact shadow follows the lift (fades as the shoe leaves the floor).
    const sh = shadowRef.current;
    if (sh) {
      const mat = sh.children[0]?.material;
      if (mat) mat.opacity = 0.55 * pose.shadow * Math.max(0, 1 - pose.lift * 1.2) * pose.alpha;
    }

    // Anatomy labels: project each part's anchor and lay the label cards out in a column.
    positionLabels(built, g, camera, W, H, layout, tmp.v);

    if (easing || colourMoving) touch();
  });

  return (
    <group ref={rig}>
      <primitive object={built.root} />
    </group>
  );
}

const _ndc = new THREE.Vector3();
// Label cards (callouts on the assembled boot, badges on the exploded stack): project each anchor and lay the
// cards out in a column right of the stage (desktop); phones show numbered dots only (legend in the copy).
function positionLabels(built, rigGroup, camera, W, H, layout, v) {
  const L = live.labels;
  if (!L) return;
  const T = live.T;
  const phone = layout === 'phone';
  rigGroup.updateMatrixWorld();
  LABEL_SETS.forEach(([setKey, list]) => {
    const els = L[setKey];
    if (!els) return;
    const items = [];
    list.forEach((item, n) => {
      const el = els[item.key];
      const p = built.parts[item.part];
      if (!el || !p) return;
      const vis = trackAt(setKey, T, n);
      if (vis <= 0.001) {
        if (el.shown) {
          el.root.style.opacity = '0';
          el.root.style.visibility = 'hidden';
          el.shown = false;
        }
        return;
      }
      v.set(item.anchor[0] * p.half.x, item.anchor[1] * p.half.y, item.anchor[2] * p.half.z);
      p.group.localToWorld(v);
      _ndc.copy(v).project(camera);
      items.push({ el, vis, x: ((_ndc.x + 1) / 2) * W, y: ((1 - _ndc.y) / 2) * H });
    });
    if (!items.length) return;
    const colX = W * 0.775;
    const gap = setKey === 'badges' ? 96 : 76;
    const sorted = [...items].sort((a, b) => a.y - b.y);
    let y = H * 0.18;
    sorted.forEach((it) => {
      it.cy = Math.max(it.y, y);
      y = it.cy + gap;
    });
    const over = sorted[sorted.length - 1].cy - H * 0.88;
    if (over > 0) sorted.forEach((it) => (it.cy -= over));
    items.forEach(({ el, vis, x, y: ay, cy }) => {
      const r = el.root.style;
      if (!el.shown) {
        r.visibility = 'visible';
        el.shown = true;
      }
      r.opacity = String(vis);
      el.dot.style.transform = `translate(${x}px, ${ay}px) scale(${0.4 + 0.6 * vis})`;
      if (phone) {
        el.card.style.display = 'none';
        el.line.style.display = 'none';
        return;
      }
      el.card.style.display = '';
      el.line.style.display = '';
      el.card.style.transform = `translate(${colX + (1 - vis) * 16}px, ${cy}px) translateY(-50%)`;
      const ex = colX - 36;
      el.line.setAttribute('d', `M${x.toFixed(1)} ${ay.toFixed(1)} L${ex.toFixed(1)} ${cy.toFixed(1)} L${(colX - 10).toFixed(1)} ${cy.toFixed(1)}`);
      const len = Math.hypot(ex - x, cy - ay) + (colX - 10 - ex);
      el.line.style.strokeDasharray = `${len} ${len}`;
      el.line.style.strokeDashoffset = String(len * (1 - Math.min(1, vis * 1.4)));
    });
  });
}

export default function Stage({ rootRef }) {
  const tier = useStoryUi((s) => s.tier);
  const reduced = useStoryUi((s) => s.reduced);
  const [dpr, setDpr] = useState(tier === 'lite' ? [1, 1.25] : [1, 1.5]);
  const active = useRef(true);
  const shadowRef = useRef();
  const url = tier === 'lite' ? STORY_MODEL.urls.mobile : STORY_MODEL.urls.desktop;
  const [ready, setReady] = useState(false);

  // Only render while the story is on screen and the tab is visible.
  useEffect(() => {
    const el = rootRef.current;
    let onScreen = true;
    const upd = () => {
      active.current = onScreen && document.visibilityState === 'visible';
      if (active.current) touch();
    };
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      upd();
    });
    if (el) io.observe(el);
    document.addEventListener('visibilitychange', upd);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', upd);
    };
  }, [rootRef]);

  return (
    <div
      aria-hidden="true"
      data-stage-ready={ready ? 'true' : 'false'}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: ready ? 1 : 0, transition: reduced ? 'none' : 'opacity 600ms ease' }}
    >
      <Canvas
        frameloop="never"
        dpr={dpr}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ fov: FOV, position: [0, 0, 10], near: 0.1, far: 100 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NeutralToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.setClearColor(0x000000, 0);
        }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Driver active={active} />
        <PerformanceMonitor bounds={() => [45, 60]} flipflops={3} onDecline={() => setDpr(1)} />
        <StudioLights />
        <Suspense fallback={null}>
          <ShoeRig
            url={url}
            shadowRef={shadowRef}
            onReady={() => {
              setReady(true);
              useStoryUi.getState().set({ canvasReady: true });
            }}
          />
        </Suspense>
        <ContactShadows ref={shadowRef} position={[0, -0.8, 0]} scale={7} far={2.2} blur={2.6} resolution={tier === 'lite' ? 256 : 512} opacity={0.55} color="#000000" />
      </Canvas>
    </div>
  );
}
