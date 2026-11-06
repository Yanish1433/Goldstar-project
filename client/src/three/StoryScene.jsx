import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import Shoe from './Shoe.jsx';
import LayerSlabs from './LayerSlabs.jsx';
import GoldDust from './GoldDust.jsx';
import Swoosh from './Swoosh.jsx';
import ParticleBox from './ParticleBox.jsx';
import Lights from './Lights.jsx';
import { SHOE } from './shoe.config.js';
import { SNAP_S, makeSample, sampleTimeline, sToP } from './timeline.js';
import { sampleFlight, makeFlightSample, advanceFlightClock, FLIGHT } from './flight.js';
import { useStory, overlay } from '../story/store.js';
import { useCart } from '../store/cart.js';
import { notifyAdded } from '../lib/addToCart.js';
import { tokens } from '../theme/tokens.js';

const lerp = (a, b, t) => a + (b - a) * t;

function SoftShadow({ groupRef }) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(0,0,0,0.55)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <group ref={groupRef}>
      <mesh rotation-x={-Math.PI / 2} scale={[4.4, 2.2, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function AnchorDebug({ points }) {
  return points.map((p, i) => (
    <mesh key={i} position={p}>
      <sphereGeometry args={[0.04, 12, 12]} />
      <meshBasicMaterial color={tokens.error} />
    </mesh>
  ));
}

// Everything inside the canvas. One useFrame drives the whole story; no React state per frame.
export default function StoryScene({ progress, tier, layout, reduced, quality, debug }) {
  const { camera, size, gl, invalidate } = useThree();
  const rig = useRef();
  const shoe = useRef();
  const slabs = useRef();
  const dust = useRef();
  const swoosh = useRef();
  const box = useRef();
  const shadowGroup = useRef();
  const contact = useRef();
  const [footprint, setFootprint] = useState(null);
  const sample = useMemo(() => makeSample(), []);
  const fl = useRef({ active: false, t: 0, frozen: { pos: new THREE.Vector3(), rotY: 0, S: 1 }, box0: new THREE.Vector3(), target: new THREE.Vector3(), landedFired: false, id: 0 });
  const fs = useMemo(() => makeFlightSample(), []);
  const tmp = useMemo(() => ({ v: new THREE.Vector3(), v2: new THREE.Vector3(), boxPos: new THREE.Vector3(), ndc: new THREE.Vector3() }), []);
  const readyFired = useRef(false);
  const perf = useRef({ el: null, frames: 0, last: 0 });
  const url = tier === 'lite' ? SHOE.urls.mobile : SHOE.urls.desktop;
  const dbgPoints = useRef([]);
  const [dbg, setDbg] = useState([]);
  const snapped = useRef({});

  // Snap array anchors onto the mesh surface once the model is loaded (rays from outside, in rig space).
  useEffect(() => {
    if (!footprint || !rig.current || !shoe.current) return;
    rig.current.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(rig.current.matrixWorld).invert();
    const ray = new THREE.Raycaster();
    const E = SHOE.extents;
    const out = {};
    const dbgPts = [];
    Object.entries(SHOE.anchors).forEach(([key, a]) => {
      if (!Array.isArray(a)) return;
      const mode = SHOE.anchorRays[key] || 'lateral';
      const o = mode === 'top' ? new THREE.Vector3(a[0] * E.u, 3, a[2] * E.w) : new THREE.Vector3(a[0] * E.u, a[1] * E.v, 3);
      const d = mode === 'top' ? new THREE.Vector3(0, -1, 0) : new THREE.Vector3(0, 0, -1);
      ray.set(o.applyMatrix4(rig.current.matrixWorld), d.transformDirection(rig.current.matrixWorld));
      const hit = ray.intersectObject(shoe.current.group, true)[0];
      const p = hit ? hit.point.clone().applyMatrix4(inv) : new THREE.Vector3(a[0] * E.u, a[1] * E.v, a[2] * E.w);
      p.add(mode === 'top' ? new THREE.Vector3(0, 0.02, 0) : new THREE.Vector3(0, 0, 0.02));
      out[key] = p;
      dbgPts.push(p.clone());
    });
    snapped.current = out;
    setDbg(dbgPts);
    // FX2: project every anchor at the callouts hold pose (s = 260) once, so cards can be ordered top to bottom.
    if (layout === 'desktop') {
      const smp = sampleTimeline(sToP(260), 'desktop');
      const save = { p: rig.current.position.clone(), r: rig.current.rotation.clone(), s: rig.current.scale.clone(), cp: camera.position.clone() };
      rig.current.position.set(smp.pos[0], smp.pos[1], smp.pos[2]);
      rig.current.rotation.set(smp.rot[0], smp.rot[1], smp.rot[2]);
      rig.current.scale.setScalar(smp.S);
      rig.current.updateMatrixWorld(true);
      camera.position.set(smp.cam.pos[0], smp.cam.pos[1], smp.cam.pos[2]);
      camera.lookAt(smp.cam.look[0], smp.cam.look[1], smp.cam.look[2]);
      camera.updateMatrixWorld();
      const v = new THREE.Vector3();
      const ys = {};
      Object.entries(out).forEach(([key, p]) => {
        v.copy(p).applyMatrix4(shoe.current.group.matrixWorld).project(camera);
        ys[key] = (-v.y * 0.5 + 0.5) * size.height;
      });
      rig.current.position.copy(save.p);
      rig.current.rotation.copy(save.r);
      rig.current.scale.copy(save.s);
      camera.position.copy(save.cp);
      useStory.setState({ anchorPreview: ys });
    }
  }, [footprint]);

  // Contact shadows only see the shoe and slabs (layer 1), never the dust, ribbon or box.
  useEffect(() => {
    const cam = contact.current?.children?.find((c) => c.isOrthographicCamera);
    if (cam) cam.layers.set(1);
  });

  // Reduced motion: render on demand, once per change of section.
  useEffect(() => {
    if (!reduced) return undefined;
    const unsub = useStory.subscribe((s, prev) => {
      if (s.activeSection !== prev.activeSection || s.colourKey !== prev.colourKey) invalidate();
    });
    invalidate();
    return unsub;
  }, [reduced, invalidate]);

  useEffect(() => {
    if (debug !== 'perf') return undefined;
    const el = document.createElement('div');
    el.setAttribute('data-perf', '');
    el.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:3000;background:#000;color:#fff;padding:6px 8px;font:12px/1.4 sans-serif;white-space:pre';
    document.body.appendChild(el);
    perf.current.el = el;
    return () => el.remove();
  }, [debug]);

  const projectToOverlay = (world, out) => {
    tmp.ndc.copy(world).project(camera);
    out.x = (tmp.ndc.x * 0.5 + 0.5) * size.width;
    out.y = (-tmp.ndc.y * 0.5 + 0.5) * size.height;
    out.vis = tmp.ndc.z < 1;
  };
  // Phones: the camera distance is scaled so the shoe spans ~85% of the portrait width (FX4).
  const aspect = size.width / size.height;
  const camScale = layout === 'phone' ? Math.min(2.4, Math.max(1, 2.9 / (0.63 * aspect) / 7.5)) : 1;
  useEffect(() => {
    overlay.size.w = size.width;
    overlay.size.h = size.height;
  }, [size.width, size.height]);

  // Pointer parallax (desktop, fine pointer, not reduced): damped follow, no overshoot.
  const par = useRef({ tx: 0, ty: 0, x: 0, y: 0 });
  useEffect(() => {
    if (reduced || layout !== 'desktop' || !window.matchMedia('(pointer: fine)').matches) return undefined;
    const move = (e) => {
      par.current.tx = (e.clientX / window.innerWidth - 0.5) * 2 * 0.12;
      par.current.ty = -(e.clientY / window.innerHeight - 0.5) * 2 * 0.12;
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [reduced, layout]);
  const rimCur = useRef(0.35);
  const prevSample = useMemo(() => makeSample(), []);
  const pt = useMemo(() => ({ x: 0, y: 0, vis: true }), []);

  const anchorWorld = (key, override) => {
    const a = override || SHOE.anchors[key];
    if (!override && snapped.current[key]) {
      shoe.current.group.updateWorldMatrix(true, false);
      return tmp.v2.copy(snapped.current[key]).applyMatrix4(shoe.current.group.matrixWorld);
    }
    if (typeof a === 'string') {
      const k = a.split(':')[1];
      return slabs.current?.anchorWorld(k) || null;
    }
    if (!a) return null;
    const E = SHOE.extents;
    tmp.v2.set(a[0] * E.u, a[1] * E.v, a[2] * E.w);
    shoe.current.group.updateWorldMatrix(true, false);
    return tmp.v2.applyMatrix4(shoe.current.group.matrixWorld);
  };

  useFrame((state, delta) => {
    if (!rig.current || !shoe.current) return;
    const dt = Math.min(delta, 0.05);
    const story = useStory.getState();
    const time = reduced ? 0 : state.clock.elapsedTime;

    // 1. Timeline sample (springed scroll progress, or the snapped section pose under reduced motion).
    const p = reduced ? sToP(SNAP_S[story.activeSection] ?? 0) : progress.get();
    sampleTimeline(p, layout, sample);
    const float = reduced ? 0 : sample.float;

    // 1b. Camera (U3): keyframed dolly / pedestal / crane plus damped pointer parallax.
    const F = fl.current;
    const cam = sample.cam;
    const pr = par.current;
    const k = 1 - Math.exp(-dt * 6);
    const ptx = F.active || reduced ? 0 : pr.tx;
    const pty = F.active || reduced ? 0 : pr.ty;
    pr.x += (ptx - pr.x) * k;
    pr.y += (pty - pr.y) * k;
    camera.position.set(cam.pos[0] + pr.x, cam.pos[1] + pr.y, cam.pos[2] * camScale);
    camera.lookAt(layout === 'phone' ? 0 : cam.look[0], cam.look[1], cam.look[2]); // no sideways bias on phones (shoe is centred)
    if (camera.fov !== cam.fov) {
      camera.fov = cam.fov;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
    let baseY = sample.pos[1];
    if (layout === 'phone') {
      const dist = camera.position.z - sample.pos[2];
      const vis = 2 * dist * Math.tan((cam.fov * Math.PI) / 360);
      baseY = cam.look[1] + (0.5 - sample.frac) * vis - 0.45 * sample.S * sample.e;
    }
    let px = sample.pos[0];
    let py = baseY + 0.05 * Math.sin(time * 2.2) * float;
    let pz = sample.pos[2];
    let ry = sample.rot[1] + 0.06 * Math.sin(time * 0.9) * float;
    let S = sample.S;
    let shoeVisible = sample.shoeVisible;

    // 2. Add-to-cart flight (button-triggered; owns the rig until it ends).
    if (story.flightRequest && !F.active && !reduced && story.tier !== 'static') {
      F.active = true;
      F.t = 0;
      F.last = performance.now();
      F.landedFired = false;
      F.frozen.pos.set(px, py, pz);
      F.frozen.rotY = ry;
      F.frozen.S = S;
      F.box0.set(px, py - 0.35, pz);
      const btn = document.getElementById('cart-button');
      const r = btn?.getBoundingClientRect();
      const cx = r ? r.left + r.width / 2 : window.innerWidth - 40;
      const cy = r ? r.top + r.height / 2 : 40;
      tmp.ndc.set((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1, 0.5).unproject(camera);
      tmp.ndc.sub(camera.position).normalize();
      F.target.copy(camera.position).addScaledVector(tmp.ndc, 6);
      F.line = story.flightRequest.line;
      useStory.getState().clearFlightRequest();
    }
    if (F.active) {
      const nowMs = performance.now();
      // real elapsed time, each frame capped at 100 ms (FX6). ?freeze=<ms> pins the clock for screenshots.
      const freeze = Number(new URLSearchParams(location.search).get('freeze'));
      F.t = Number.isFinite(freeze) && freeze > 0 ? freeze : advanceFlightClock(F.t, nowMs, F.last);
      F.last = nowMs;
      const f = sampleFlight(F.t, fs);
      if (!f.landed) {
        tmp.boxPos.lerpVectors(F.box0, F.target, f.fly);
        const k = f.drop;
        px = lerp(F.frozen.pos.x, tmp.boxPos.x, k);
        py = lerp(F.frozen.pos.y, tmp.boxPos.y, k);
        pz = lerp(F.frozen.pos.z, tmp.boxPos.z, k);
        ry = F.frozen.rotY + (Math.PI / 2) * k;
        S = F.frozen.S * lerp(1, 0.42, k) * f.boxScale;
        shoeVisible = true;
        box.current.apply(f, tmp.boxPos, f.boxScale);
      } else {
        if (!F.landedFired) {
          F.landedFired = true;
          clearTimeout(useStory.getState().flightTimer);
          if (useStory.getState().flightActive) {
            useCart.getState().endFlight();
            if (F.line) notifyAdded(F.line);
            useStory.getState().endFlightState();
          }
        }
        S *= f.ret;
        shoeVisible = S > 0.001;
        box.current.apply(f, tmp.boxPos, f.boxScale);
      }
      if (F.t >= FLIGHT.returnEnd) {
        F.active = false;
        box.current.hide();
      }
    }

    rig.current.position.set(px, py, pz);
    rig.current.rotation.set(sample.rot[0], ry, sample.rot[2]);
    rig.current.scale.setScalar(Math.max(S, 0.0001));
    rig.current.visible = shoeVisible;
    rig.current.updateMatrixWorld(true);

    // 3. Parts
    const fastColour = reduced;
    const rimTarget = (F.active && !fs.landed ? SHOE.look.rimFlight : SHOE.look.rimByChapter[story.activeSection] ?? 0.35) * (tier === 'lite' ? SHOE.look.liteRimScale : 1);
    rimCur.current += (rimTarget - rimCur.current) * (1 - Math.exp(-dt * 5));
    shoe.current.apply(sample.e, dt, story.colourKey, fastColour, rimCur.current);
    slabs.current?.apply(sample.e);
    swoosh.current?.apply(sample.swooshT, sample.swooshOpacity);
    dust.current?.apply(time * sample.dustSpeed, reduced ? 0.25 : sample.dust, reduced ? 0 : 1 - Math.min(1, Math.max(0, (sample.s - 60) / 50)), quality.current.dustFraction);

    if (shadowGroup.current) {
      shadowGroup.current.visible = shoeVisible && (tier !== 'full' || quality.current.shadows);
      shadowGroup.current.position.set(px, py - 0.77 * S - 0.14, pz);
    }

    // 4. DOM overlays (leader lines, dots, badges, phone dot): updated through refs, never React state.
    if (overlay.size.w > 1) {
      if (layout === 'desktop') {
        const co = overlay.callouts;
        for (let i = 0; i < co.length; i += 1) {
          const c = co[i];
          if (!c || !c.dot) continue;
          const sv = sample.callouts[c.index] || sample.callouts[3];
          const on = story.activeSection === 'story-callouts';
          const dotA = reduced ? (on ? 1 : 0) : sv.dot;
          const lineA = reduced ? (on ? 1 : 0) : sv.line;
          const textA = sv.text;
          if (dotA > 0 || c.last) {
            const w = anchorWorld(c.anchor, c.position);
            if (w) {
              projectToOverlay(w, pt);
              c.dot.style.transform = `translate(${pt.x}px,${pt.y}px) scale(${dotA})`;
              c.dot.style.opacity = dotA > 0 ? 1 : 0;
              c.line.setAttribute('points', `${pt.x},${pt.y} ${c.textPoint.x - 24},${c.textPoint.y} ${c.textPoint.x},${c.textPoint.y}`);
              c.line.style.strokeDashoffset = 1 - lineA;
              c.line.style.opacity = lineA > 0 ? 1 : 0;
            }
          }
          if (!reduced) {
            c.text.style.opacity = textA;
            c.text.style.transform = `translateY(${(1 - textA) * 16}px)`;
          }
          c.last = dotA > 0;
        }
        const la = overlay.layers;
        let prevBottom = -1e9;
        for (let i = 0; i < la.length; i += 1) {
          const l = la[i];
          if (!l || !l.dot) continue;
          const on = story.activeSection === 'story-explode';
          const a = reduced ? (on ? 1 : 0) : (sample.layers[l.index] ?? 0);
          if (a > 0 || l.last) {
            const w = anchorWorld(l.anchor, l.position);
            if (w) {
              projectToOverlay(w, pt);
              l.dot.style.transform = `translate(${pt.x}px,${pt.y}px) scale(${a})`;
              l.dot.style.opacity = a > 0 ? 1 : 0;
              // Keep the badge blocks apart: each starts below the previous one.
              const top = Math.max(pt.y - l.textPoint.h / 2, prevBottom + 14);
              prevBottom = top + l.textPoint.h;
              l.line.setAttribute('points', `${pt.x},${pt.y} ${l.textPoint.x - 16},${top + 24}`);
              l.line.style.strokeDashoffset = 1 - a;
              l.line.style.opacity = a > 0 ? 1 : 0;
              l.badge.style.transform = `translate(${l.textPoint.x}px,${top}px) translateY(${(1 - a) * 16}px)`;
            }
          }
          if (!reduced) l.badge.style.opacity = a;
          l.last = a > 0;
        }
      } else if (overlay.activeDot) {
        // Phone: one projected dot on the active anchor of the stepped panel.
        const section = story.activeSection;
        let item = null;
        if (!reduced && section === 'story-callouts' && sample.s >= 200 && sample.s < 335) item = overlay.callouts[sample.calloutIndex];
        else if (!reduced && section === 'story-explode' && sample.s >= 430 && sample.s < 505) item = overlay.layers[sample.layerIndex];
        const w = item ? anchorWorld(item.anchor, item.position) : null;
        if (w) {
          projectToOverlay(w, pt);
          overlay.activeDot.style.transform = `translate(${pt.x}px,${pt.y}px)`;
          overlay.activeDot.style.opacity = 1;
        } else overlay.activeDot.style.opacity = 0;
      }
    }

    // 5. First rendered frame with the model: tell the poster to fade out.
    if (!readyFired.current && footprint) {
      readyFired.current = true;
      story.setCanvasReady(true);
    }

    // 6. perf readout
    const pf = perf.current;
    if (pf.el) {
      pf.frames += 1;
      const now = performance.now();
      if (now - pf.last > 500) {
        const fps = (pf.frames * 1000) / (now - pf.last);
        pf.el.textContent = `fps ${fps.toFixed(0)}  tris ${gl.info.render.triangles}  calls ${gl.info.render.calls}  dpr ${gl.getPixelRatio().toFixed(2)}`;
        pf.last = now;
        pf.frames = 0;
      }
    }
  });

  return (
    <>
      <color attach="background" args={[tokens.ground]} />
      <Lights />
      <GoldDust ref={dust} count={tier === 'lite' ? 600 : 1500} px={Math.min(window.devicePixelRatio || 1, tier === 'lite' ? 1.25 : 1.5)} />
      <group ref={rig}>
        <Suspense fallback={null}>
          <Shoe ref={shoe} url={url} physical={tier === 'full'} onReady={(info) => setFootprint(info.footprint)} />
        </Suspense>
        <LayerSlabs ref={slabs} footprint={footprint} />
        <Swoosh ref={swoosh} />
        {debug === 'anchors' ? <AnchorDebug points={dbg} /> : null}
      </group>
      <ParticleBox ref={box} px={Math.min(window.devicePixelRatio || 1, 1.5)} scale={tier === 'lite' ? 0.6 : 1} />
      {tier === 'full' && quality.current.shadows ? (
        <group ref={shadowGroup}>
          <ContactShadows ref={contact} opacity={0.5} blur={2.6} far={2.5} resolution={256} scale={[7, 7]} frames={Infinity} />
        </group>
      ) : (
        <SoftShadow groupRef={shadowGroup} />
      )}
    </>
  );
}
