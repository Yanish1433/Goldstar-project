// Precomputes the assembled boot's silhouette for the fit tests: the support points of its 3D convex hull, in rig
// units (normalised exactly like splitModel.js buildParts: 3 long along +x, centred on the origin).
//   node scripts/boot-hull.mjs [public/models/g10-hd.glb] -> test/fixtures/bootHull.json
// Any projection of the boot (perspective included) has the same screen extent as the projection of its convex hull.
// The hull is thinned to its support points over N directions on a sphere and pushed out by 1% from the centre, so a
// projected bbox from these points never under-estimates the real one by more than a hair (the test keeps a margin too).
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import * as THREE from 'three';
import { ConvexHull } from 'three/examples/jsm/math/ConvexHull.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] || path.resolve(here, '../public/models/g10-hd.glb');
const outFile = path.resolve(here, '../test/fixtures/bootHull.json');
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(file);

const pts = [];
const v = new THREE.Vector3();
for (const scene of doc.getRoot().listScenes()) {
  scene.traverse((node) => {
    const mesh = node.getMesh();
    if (!mesh) return;
    const M = new THREE.Matrix4().fromArray(node.getWorldMatrix());
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute('POSITION');
      const el = [];
      for (let i = 0; i < pos.getCount(); i += 1) {
        pos.getElement(i, el);
        pts.push(v.set(el[0], el[1], el[2]).applyMatrix4(M).clone());
      }
    }
  });
}
const box = new THREE.Box3().setFromPoints(pts);
const size = box.getSize(new THREE.Vector3());
const centre = box.getCenter(new THREE.Vector3());
const k = 3 / size.x;
const rig = pts.map((p) => p.sub(centre).multiplyScalar(k));
const hull = new ConvexHull().setFromPoints(rig);
const onHull = new Set();
hull.faces.forEach((f) => {
  let e = f.edge;
  do {
    onHull.add(e.head().point);
    e = e.next;
  } while (e !== f.edge);
});
const verts = [...onHull];

// support points over a Fibonacci sphere of directions
const N = 2000;
const keep = new Set();
for (let i = 0; i < N; i += 1) {
  const y = 1 - (2 * (i + 0.5)) / N;
  const r = Math.sqrt(1 - y * y);
  const phi = i * Math.PI * (3 - Math.sqrt(5));
  const d = new THREE.Vector3(Math.cos(phi) * r, y, Math.sin(phi) * r);
  let best = -Infinity;
  let bi = 0;
  verts.forEach((p, j) => {
    const s = p.dot(d);
    if (s > best) { best = s; bi = j; }
  });
  keep.add(bi);
}
const out = [...keep].map((j) => verts[j].clone().multiplyScalar(1.01).toArray().map((x) => +x.toFixed(4)));
const rigSize = size.clone().multiplyScalar(k).toArray().map((x) => +x.toFixed(4));
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify({ source: path.basename(file), size: rigSize, inflate: 1.01, points: out })}\n`);
console.log(`${pts.length} vertices -> hull ${verts.length} -> ${out.length} support points; rig size ${rigSize}`);
