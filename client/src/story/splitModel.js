import * as THREE from 'three';

const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();

function nameMatch(obj, names) {
  for (let o = obj; o; o = o.parent) if (o.name && names.includes(o.name)) return true;
  return false;
}

// Build the part rig from a loaded glTF scene. Returns { root, parts: { name: Part }, size } where
// Part = { group, base: Vector3 (rest position), half, anchor: Vector3 (label point, group-local), materials (owned
// clones), tint (the tintable ones), geometries (owned), cfg }.
// The rig is normalised: `model.length` along +x, centred on the origin. Meshes are matched to parts by node name
// (ancestors count); anything unmatched goes to `fallbackPart`. Materials are cloned per consumer, so several
// canvases can share one cached glTF and tint it independently. The glTF geometry is shared, never disposed here.
export function buildParts(scene, model) {
  scene.updateMatrixWorld(true);
  const yaw = new THREE.Matrix4().makeRotationY(model.yawOffset || 0);
  const meshes = [];
  scene.traverse((o) => {
    if (o.isMesh) meshes.push({ mesh: o, M: new THREE.Matrix4().multiplyMatrices(yaw, o.matrixWorld) });
  });
  const box = new THREE.Box3();
  meshes.forEach(({ mesh, M }) => {
    const p = mesh.geometry.attributes.position;
    for (let i = 0; i < p.count; i += 1) box.expandByPoint(_v.fromBufferAttribute(p, i).applyMatrix4(M));
  });
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  const k = model.length / size.x;
  const N = new THREE.Matrix4().makeScale(k, k, k).premultiply(new THREE.Matrix4().makeTranslation(-centre.x * k, -centre.y * k, -centre.z * k));

  const names = model.order;
  const keep = new Set(model.keepMaterials || []);
  const pieces = Object.fromEntries(names.map((n) => [n, []]));
  meshes.forEach(({ mesh, M }) => {
    const named = names.find((n) => nameMatch(mesh, model.parts[n].nodeNames || []));
    pieces[named || model.fallbackPart].push({ geometry: mesh.geometry, material: mesh.material, M, shared: true });
  });

  // Lite model has no insole: model a footbed slab from the midsole outline instead.
  names.filter((n) => model.parts[n].generate === 'footbed' && !pieces[n].length).forEach((name) => {
    const geometry = makeFootbed(pieces.midsole || [], N);
    if (geometry) pieces[name].push({ geometry, material: new THREE.MeshStandardMaterial({ name: 'footbed', roughness: 0.92 }), M: new THREE.Matrix4(), shared: false, rig: true });
  });

  const root = new THREE.Group();
  const parts = {};
  names.forEach((name) => {
    const cfg = model.parts[name];
    const list = pieces[name];
    const group = new THREE.Group();
    group.name = `part:${name}`;
    const pbox = new THREE.Box3();
    list.forEach(({ geometry, M, rig }) => {
      if (rig) _m.identity();
      else _m.multiplyMatrices(N, M);
      const p = geometry.attributes.position;
      for (let i = 0; i < p.count; i += 1) pbox.expandByPoint(_v.fromBufferAttribute(p, i).applyMatrix4(_m));
    });
    const base = pbox.isEmpty() ? new THREE.Vector3() : pbox.getCenter(new THREE.Vector3());
    const half = pbox.isEmpty() ? new THREE.Vector3() : pbox.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    const clones = new Map();
    const tint = [];
    const geometries = [];
    list.forEach(({ geometry, material, M, shared, rig }) => {
      let mat = clones.get(material);
      if (!mat) {
        mat = shared ? material.clone() : material;
        clones.set(material, mat);
        const tintable = !keep.has(material.name) && !keep.has(name);
        if (tintable) tint.push(mat);
        if (tintable && model.finish?.parts?.includes(name)) applyFinish(mat, model.finish);
      }
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.matrixAutoUpdate = false;
      const local = new THREE.Matrix4().makeTranslation(-base.x, -base.y, -base.z);
      mesh.matrix.copy(rig ? local : local.multiply(N).multiply(M));
      mesh.frustumCulled = false;
      group.add(mesh);
      if (!shared) geometries.push(geometry);
    });
    group.position.copy(base);
    root.add(group);
    const a = cfg.anchor || [0, 0, 0];
    // A generated footbed is an approximation: it only shows while the boot is exploded (see Stage).
    const generated = list.length > 0 && list.every((x) => x.rig);
    if (generated) group.visible = false;
    parts[name] = { group, base, half, anchor: new THREE.Vector3(a[0] * half.x, a[1] * half.y, a[2] * half.z), materials: [...clones.values()], tint, geometries, cfg, generated };
  });
  return { root, parts, size: size.multiplyScalar(k) };
}

// Softer leather: roughness floor (shader), softened normals, and a sheen that follows the base colour (see createTinter).
function applyFinish(mat, finish) {
  if (mat.normalScale && finish.normalScale != null) mat.normalScale.multiplyScalar(finish.normalScale);
  if (mat.sheen > 0 && finish.sheenTint != null) mat.userData.sheenTint = finish.sheenTint;
  if (finish.roughMin != null) {
    const min = finish.roughMin.toFixed(3);
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
	roughnessFactor = max( roughnessFactor, ${min} );`);
    };
    mat.customProgramCacheKey = () => `gs-finish-${min}`;
  }
}
const followSheen = (m) => {
  if (m.userData.sheenTint != null && m.sheenColor) m.sheenColor.copy(m.color).multiplyScalar(m.userData.sheenTint);
};

// Point on a part (fractions -1..1 of its bounding box) in the coordinates of `space` (an ancestor of the rig).
export function partPoint(built, part, anchor, space, out = new THREE.Vector3()) {
  const p = built.parts[part];
  if (!p) return null;
  out.set(anchor[0] * p.half.x, anchor[1] * p.half.y, anchor[2] * p.half.z);
  p.group.localToWorld(out);
  return space ? space.worldToLocal(out) : out;
}

// Colour per part, eased. set(colours, instant) takes { part: '#hex' } (missing parts use `upper`);
// step(dt) eases towards it and returns true while anything is still moving.
export function createTinter(parts) {
  const targets = {};
  let moving = false;
  const near = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) < 0.002;
  return {
    set(colours, instant = false) {
      Object.entries(parts).forEach(([name, p]) => {
        const t = (targets[name] ||= new THREE.Color());
        t.set(colours[name] || colours.upper);
        if (instant) p.tint.forEach((m) => { m.color.copy(t); followSheen(m); });
      });
      moving = !instant;
    },
    step(dt) {
      if (!moving) return false;
      const f = 1 - Math.exp(-7 * dt);
      let any = false;
      Object.entries(parts).forEach(([name, p]) => {
        const t = targets[name];
        if (!t) return;
        p.tint.forEach((m) => {
          if (near(m.color, t)) m.color.copy(t);
          else {
            m.color.lerp(t, f);
            any = true;
          }
          followSheen(m);
        });
      });
      moving = any;
      return any;
    },
  };
}

// Footbed slab from the midsole's footprint: max radius per angle around the centroid (a foot outline is
// star-shaped from its centre), smoothed, inset, extruded and laid on the midsole top. Rig-space geometry.
function makeFootbed(midsolePieces, N, bins = 72, inset = 0.8, thickness = 0.07) {
  const pts = [];
  let top = -Infinity;
  midsolePieces.forEach(({ geometry, M }) => {
    _m.multiplyMatrices(N, M);
    const p = geometry.attributes.position;
    for (let i = 0; i < p.count; i += 1) {
      _v.fromBufferAttribute(p, i).applyMatrix4(_m);
      pts.push([_v.x, _v.z]);
      top = Math.max(top, _v.y);
    }
  });
  if (pts.length < 10) return null;
  const cx = pts.reduce((a, q) => a + q[0], 0) / pts.length;
  const cz = pts.reduce((a, q) => a + q[1], 0) / pts.length;
  const r = new Float32Array(bins);
  pts.forEach(([x, z]) => {
    const b = Math.floor(((Math.atan2(z - cz, x - cx) + Math.PI) / (2 * Math.PI)) * bins) % bins;
    r[b] = Math.max(r[b], Math.hypot(x - cx, z - cz));
  });
  const shape = new THREE.Shape();
  for (let b = 0; b < bins; b += 1) {
    const rr = ((r[(b + bins - 1) % bins] + 2 * r[b] + r[(b + 1) % bins]) / 4) * inset;
    const a = ((b + 0.5) / bins) * 2 * Math.PI - Math.PI;
    const x = cx + Math.cos(a) * rr;
    const z = cz + Math.sin(a) * rr;
    if (b === 0) shape.moveTo(x, -z);
    else shape.lineTo(x, -z);
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.03, bevelSegments: 2, curveSegments: 4 });
  g.rotateX(-Math.PI / 2); // shape (x, -z) in XY -> lies in XZ, extrusion goes +y
  g.translate(0, top - thickness - 0.03, 0);
  g.computeVertexNormals();
  return g;
}

// Releases what buildParts created for this consumer (material clones, generated geometry). Textures and glTF
// geometry belong to the shared useGLTF cache and stay.
export function disposeParts(built) {
  Object.values(built.parts).forEach((p) => {
    p.materials.forEach((mt) => mt.dispose());
    p.geometries.forEach((g) => g.dispose());
  });
}
