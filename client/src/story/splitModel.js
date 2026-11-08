import * as THREE from 'three';

// ---------------------------------------------------------------------------------------------
// Pure part: classify the triangles of one indexed mesh into parts.
// pos(i) -> [x, y, z] (mesh-local), index = triangle vertex indices.
// rules: ordered [{ islands: [rank...] | undefined, where: { maxY, minY, minNormalY, maxNormalY, below } | undefined }]
// `below`: [[x, y], ...] sorted by x; a triangle passes when its centroid y is under that piecewise-linear line.
// Returns { tri: Int16Array (rule index per triangle, or -1), islandCount }.
// Islands are found by welding vertices on position (UV seams split vertices) and ranked by triangle count,
// largest first; ties keep first-seen order, so ranks are stable for a given file.
// ---------------------------------------------------------------------------------------------
export function lineAt(pts, x) {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i += 1) {
    if (x <= pts[i][0]) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0 || 1);
    }
  }
  return pts[pts.length - 1][1];
}

export function classifyTriangles(pos, vertexCount, index, rules, weld = 2000) {
  const P = new Float32Array(vertexCount * 3);
  const id = new Int32Array(vertexCount);
  const seen = new Map();
  for (let i = 0; i < vertexCount; i += 1) {
    const p = pos(i);
    P[i * 3] = p[0];
    P[i * 3 + 1] = p[1];
    P[i * 3 + 2] = p[2];
    const key = `${Math.round(p[0] * weld)},${Math.round(p[1] * weld)},${Math.round(p[2] * weld)}`;
    let w = seen.get(key);
    if (w === undefined) {
      w = i;
      seen.set(key, i);
    }
    id[i] = w;
  }
  const parent = new Int32Array(vertexCount);
  for (let i = 0; i < vertexCount; i += 1) parent[i] = i;
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  const triCount = index.length / 3;
  for (let t = 0; t < triCount; t += 1) {
    union(id[index[t * 3]], id[index[t * 3 + 1]]);
    union(id[index[t * 3]], id[index[t * 3 + 2]]);
  }
  // Count triangles per island (insertion order = first triangle seen).
  const counts = new Map();
  const rootOf = new Int32Array(triCount);
  for (let t = 0; t < triCount; t += 1) {
    const r = find(id[index[t * 3]]);
    rootOf[t] = r;
    counts.set(r, (counts.get(r) || 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]);
  const rank = new Map(ranked.map((r, i) => [r, i]));

  const tri = new Int16Array(triCount).fill(-1);
  const ruleIslands = rules.map((r) => (r.islands ? new Set(r.islands) : null));
  for (let t = 0; t < triCount; t += 1) {
    const rk = rank.get(rootOf[t]);
    const a = index[t * 3] * 3;
    const b = index[t * 3 + 1] * 3;
    const c = index[t * 3 + 2] * 3;
    const cy = (P[a + 1] + P[b + 1] + P[c + 1]) / 3;
    const cx = (P[a] + P[b] + P[c]) / 3;
    let ny = null;
    for (let r = 0; r < rules.length; r += 1) {
      const isl = ruleIslands[r];
      if (!isl || !isl.has(rk)) continue;
      const w = rules[r].where;
      if (w) {
        if (w.maxY !== undefined && cy > w.maxY) continue;
        if (w.minY !== undefined && cy < w.minY) continue;
        if (w.below && cy > lineAt(w.below, cx)) continue;
        if (w.minNormalY !== undefined || w.maxNormalY !== undefined) {
          if (ny === null) {
            const e1x = P[b] - P[a];
            const e1y = P[b + 1] - P[a + 1];
            const e1z = P[b + 2] - P[a + 2];
            const e2x = P[c] - P[a];
            const e2y = P[c + 1] - P[a + 1];
            const e2z = P[c + 2] - P[a + 2];
            const nx = e1y * e2z - e1z * e2y;
            const nyy = e1z * e2x - e1x * e2z;
            const nz = e1x * e2y - e1y * e2x;
            ny = nyy / (Math.hypot(nx, nyy, nz) || 1);
          }
          if (w.minNormalY !== undefined && ny < w.minNormalY) continue;
          if (w.maxNormalY !== undefined && ny > w.maxNormalY) continue;
        }
      }
      tri[t] = r;
      break;
    }
  }
  return { tri, islandCount: ranked.length };
}

// ---------------------------------------------------------------------------------------------
// Gradient-map material: the greyscale albedo is remapped from uDark to uLight per part, so a colourway
// is two colours per part and stays crisp (no muddy multiply). Maps (normal, ORM) are kept.
// ---------------------------------------------------------------------------------------------
export function gradientMaterial(src, uniforms, roughness) {
  const m = new THREE.MeshStandardMaterial();
  THREE.MeshStandardMaterial.prototype.copy.call(m, src);
  m.color.set('#ffffff');
  m.side = THREE.DoubleSide; // split shells are open
  if (roughness != null) m.roughness = roughness;
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uDark = uniforms.uDark;
    shader.uniforms.uLight = uniforms.uLight;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uDark;\nuniform vec3 uLight;')
      .replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, vMapUv );
  float gLum = dot( sampledDiffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) );
  gLum = clamp( pow( gLum, 0.4545 ), 0.0, 1.0 );
  diffuseColor.rgb *= mix( uDark, uLight, gLum );
#else
  diffuseColor.rgb *= uLight;
#endif`,
      );
  };
  m.customProgramCacheKey = () => 'gs-gradient-map';
  return m;
}

const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();

function nameMatch(obj, names) {
  for (let o = obj; o; o = o.parent) if (o.name && names.includes(o.name)) return true;
  return false;
}

// Build the part rig from a loaded glTF scene. Returns { root, parts: { name: Part } } where
// Part = { group, base: Vector3 (rest position), anchor: Vector3 (label point, group-local), uniforms, materials, geometries }.
// The rig is normalised: `length` along +x, centred on the origin.
export function buildParts(scene, model) {
  scene.updateMatrixWorld(true);
  const yaw = new THREE.Matrix4().makeRotationY(model.yawOffset || 0);
  const meshes = [];
  scene.traverse((o) => {
    if (o.isMesh) meshes.push({ mesh: o, M: new THREE.Matrix4().multiplyMatrices(yaw, o.matrixWorld) });
  });
  // Normalisation from the bounding box of all meshes.
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
  const pieces = Object.fromEntries(names.map((n) => [n, []])); // { geometry, material, M, indices }
  const ruleList = names.map((n) => model.parts[n]);
  const hasIslands = ruleList.some((r) => r.islands);

  meshes.forEach(({ mesh, M }) => {
    const named = names.find((n) => nameMatch(mesh, model.parts[n].nodeNames || []));
    const g = mesh.geometry;
    if (named || !hasIslands || !g.index) {
      pieces[named || model.fallbackPart].push({ geometry: g, material: mesh.material, M, shared: true });
      return;
    }
    const p = g.attributes.position;
    const { tri } = classifyTriangles((i) => [p.getX(i), p.getY(i), p.getZ(i)], p.count, g.index.array, ruleList);
    const buckets = names.map(() => []);
    const fb = names.indexOf(model.fallbackPart);
    for (let t = 0; t < tri.length; t += 1) {
      const r = tri[t] >= 0 ? tri[t] : fb;
      buckets[r].push(g.index.array[t * 3], g.index.array[t * 3 + 1], g.index.array[t * 3 + 2]);
    }
    buckets.forEach((idx, r) => {
      if (!idx.length) return;
      const sub = new THREE.BufferGeometry();
      Object.entries(g.attributes).forEach(([key, attr]) => sub.setAttribute(key, attr));
      sub.setIndex(idx);
      pieces[names[r]].push({ geometry: sub, material: mesh.material, M, shared: false });
    });
  });

  const root = new THREE.Group();
  const parts = {};
  names.forEach((name) => {
    const cfg = model.parts[name];
    const list = pieces[name];
    const uniforms = { uDark: { value: new THREE.Color('#222222') }, uLight: { value: new THREE.Color('#dddddd') } };
    const group = new THREE.Group();
    group.name = `part:${name}`;
    const pbox = new THREE.Box3();
    list.forEach(({ geometry, M }) => {
      _m.multiplyMatrices(N, M);
      const p = geometry.attributes.position;
      const idx = geometry.index ? geometry.index.array : null;
      const n = idx ? idx.length : p.count;
      for (let i = 0; i < n; i += 1) pbox.expandByPoint(_v.fromBufferAttribute(p, idx ? idx[i] : i).applyMatrix4(_m));
    });
    const base = pbox.isEmpty() ? new THREE.Vector3() : pbox.getCenter(new THREE.Vector3());
    const half = pbox.isEmpty() ? new THREE.Vector3() : pbox.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    const materials = new Map();
    const geometries = [];
    list.forEach(({ geometry, material, M, shared }) => {
      let mat = materials.get(material);
      if (!mat) {
        mat = gradientMaterial(material, uniforms, cfg.roughness);
        materials.set(material, mat);
      }
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.matrixAutoUpdate = false;
      mesh.matrix.copy(new THREE.Matrix4().makeTranslation(-base.x, -base.y, -base.z).multiply(N).multiply(M));
      mesh.frustumCulled = false;
      group.add(mesh);
      if (!shared) geometries.push(geometry);
    });
    group.position.copy(base);
    root.add(group);
    const a = cfg.anchor || [0, 0, 0];
    parts[name] = { group, base, anchor: new THREE.Vector3(a[0] * half.x, a[1] * half.y, a[2] * half.z), uniforms, materials: [...materials.values()], geometries, cfg };
  });
  return { root, parts, size: size.multiplyScalar(k) };
}

export function disposeParts(built) {
  Object.values(built.parts).forEach((p) => {
    p.materials.forEach((m) => m.dispose());
    p.geometries.forEach((g) => g.dispose());
  });
}
