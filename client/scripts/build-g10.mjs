// Builds the story model from the photo-derived G10-401 assets (see .firstmate/reports/img3d-mv.md):
//   parts.glb (6 named part nodes, colour atlas) + web-gray.glb (same atlas in greyscale)
// -> public/models/g10-desktop.glb (greyscale albedo, 2048 webp)  and  g10-mobile.glb (decimated, 1024 webp).
// The story recolours the greyscale albedo per part (gradient map), so every colourway comes from one file.
// Usage: node scripts/build-g10.mjs <dir with parts.glb and web-gray.glb>
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, quantize, simplify, textureCompress, meshopt, weld } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = process.argv[2];
if (!src) throw new Error('usage: node scripts/build-g10.mjs <dir>');
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

async function load() {
  const doc = await io.read(path.join(src, 'parts.glb'));
  const gray = await io.read(path.join(src, 'web-gray.glb'));
  const grayTex = gray.getRoot().listMaterials()[0].getBaseColorTexture();
  doc.getRoot().listMaterials().forEach((m) => {
    const t = m.getBaseColorTexture();
    if (t) t.setImage(grayTex.getImage()).setMimeType(grayTex.getMimeType());
    m.setBaseColorFactor([1, 1, 1, 1]);
  });
  return doc;
}

// The source mesh is unindexed with per-face normals: drop normals so weld() can index it (positions + UVs).
function dropNormals(doc) {
  doc.getRoot().listMeshes().forEach((m) => m.listPrimitives().forEach((p) => {
    const n = p.getAttribute('NORMAL');
    if (n) { p.setAttribute('NORMAL', null); n.dispose(); }
  }));
}

// Smooth normals, averaged over every vertex at the same position (so UV seams don't show as creases).
function smoothNormals(doc) {
  doc.getRoot().listMeshes().forEach((m) => m.listPrimitives().forEach((p) => {
    const pos = p.getAttribute('POSITION');
    const idx = p.getIndices().getArray();
    const n = pos.getCount();
    const P = []; const v = [0, 0, 0];
    for (let i = 0; i < n; i += 1) { pos.getElement(i, v); P.push([v[0], v[1], v[2]]); }
    const key = (q) => `${Math.round(q[0] * 1e5)},${Math.round(q[1] * 1e5)},${Math.round(q[2] * 1e5)}`;
    const acc = new Map();
    for (let t = 0; t < idx.length; t += 3) {
      const [a, b, c] = [P[idx[t]], P[idx[t + 1]], P[idx[t + 2]]];
      const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const fn = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]; // area-weighted
      for (const q of [a, b, c]) { const k = key(q); const s = acc.get(k) || [0, 0, 0]; s[0] += fn[0]; s[1] += fn[1]; s[2] += fn[2]; acc.set(k, s); }
    }
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 1) { const s = acc.get(key(P[i])); const l = Math.hypot(...s) || 1; out[i * 3] = s[0] / l; out[i * 3 + 1] = s[1] / l; out[i * 3 + 2] = s[2] / l; }
    p.setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(out).setBuffer(pos.getBuffer()));
  }));
}

for (const [name, size, ratio] of [['desktop', 2048, 1], ['mobile', 1024, 0.35]]) {
  const doc = await load();
  dropNormals(doc);
  await doc.transform(dedup(), weld());
  if (ratio < 1) await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.01, lockBorder: false }));
  smoothNormals(doc);
  await doc.transform(prune(), textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [size, size], quality: 80 }), quantize(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  const out = path.join(here, '..', 'public', 'models', `g10-${name}.glb`);
  await io.write(out, doc);
  const tris = doc.getRoot().listMeshes().reduce((n, m) => n + m.listPrimitives().reduce((k, p) => k + (p.getIndices()?.getCount() || 0) / 3, 0), 0);
  console.log(name, `${(fs.statSync(out).size / 1024).toFixed(0)} kB`, `${Math.round(tris)} tris`, doc.getRoot().listNodes().map((n) => n.getName()).join(','));
}
