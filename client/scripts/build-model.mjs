// GLB compression pipeline (SPEC 11). Run: npm run model
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRMaterialsVariants } from '@gltf-transform/extensions';
import { dedup, weld, prune, textureCompress, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '../../_dl/shoe.glb');
const OUT = path.resolve(here, '../public/models');
const PATCHES = JSON.parse(fs.readFileSync(path.resolve(here, 'model-patches.json'), 'utf8'));
const BUDGET = { desktop: 4 * 1024 * 1024, mobile: 1.5 * 1024 * 1024 };
const TARGET_MEAN = 140; // ~0.55 luminance

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;

// Paints out third-party marks in UV space (SPEC Addendum B, FX1). channel: 'baseColor' | 'normal' | 'orm'.
async function patchTexture(buf, channel) {
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const C = info.channels;
  const out = Buffer.from(data);
  const k = W / 2048; // patches are authored for 2048 sources
  for (const p of PATCHES.patches) {
    if (!p.channels.includes(channel)) continue;
    const [rx, ry, rw, rh] = p.rect.map((v) => Math.round(v * k));
    const f = Math.max(1, Math.round(p.feather * k));
    let flat = null;
    if (p.flat) {
      if (channel === 'normal') flat = [128, 128, 255];
      else {
        const [sx, sy, sw, sh] = p.sample.map((v) => Math.round(v * k));
        const acc = [0, 0, 0];
        for (let y = sy; y < sy + sh; y += 1) for (let x = sx; x < sx + sw; x += 1) for (let c = 0; c < 3; c += 1) acc[c] += data[(y * W + x) * C + c];
        flat = acc.map((v) => v / (sw * sh));
      }
    }
    const [csx, csy] = p.copy ? p.copy.map((v) => Math.round(v * k)) : [0, 0];
    for (let y = Math.max(0, ry - f); y < Math.min(H, ry + rh + f); y += 1) {
      for (let x = Math.max(0, rx - f); x < Math.min(W, rx + rw + f); x += 1) {
        const dx = Math.max(rx - x, 0, x - (rx + rw - 1));
        const dy = Math.max(ry - y, 0, y - (ry + rh - 1));
        const d = Math.hypot(dx, dy);
        const w = d <= 0 ? 1 : Math.max(0, 1 - d / f);
        const s = w * w * (3 - 2 * w);
        if (s <= 0) continue;
        for (let c = 0; c < 3; c += 1) {
          const src = flat ? flat[c] : data[((csy + (y - ry)) * W + (csx + (x - rx))) * C + c];
          const i = (y * W + x) * C + c;
          out[i] = Math.round(data[i] + (src - data[i]) * s);
        }
      }
    }
  }
  return sharp(out, { raw: { width: W, height: H, channels: C } }).png().toBuffer();
}

async function build(name, size, quality) {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
  const doc = await io.read(SRC);
  const root = doc.getRoot();
  if (name === 'desktop') {
    console.log('nodes', root.listNodes().map((n) => n.getName()).join(', '));
    console.log('meshes', root.listMeshes().length, 'materials', root.listMaterials().length);
    root.listTextures().forEach((t) => console.log('  texture', t.getName(), t.getImage().byteLength, 'B'));
  }

  // 2. neutral base colour: lightest diffuse -> greyscale, normalised, mean ~0.55
  const diffuse = root.listTextures().filter((t) => /diffuse/i.test(t.getName()));
  let lightest = null;
  let best = -1;
  for (const t of diffuse) {
    const st = await sharp(Buffer.from(t.getImage())).stats();
    const mean = st.channels.slice(0, 3).reduce((s, c) => s + c.mean, 0) / 3;
    if (mean > best) {
      best = mean;
      lightest = t;
    }
  }
  const grey = await sharp(Buffer.from(lightest.getImage())).greyscale().normalise().raw().toBuffer({ resolveWithObject: true });
  const px = grey.data.length / grey.info.channels;
  let sum = 0;
  for (let i = 0; i < grey.data.length; i += grey.info.channels) sum += grey.data[i];
  const mean = sum / px;
  const a = TARGET_MEAN / mean; // scale so mean = 140 (clamped by 255)
  const neutral = await sharp(Buffer.from(lightest.getImage())).greyscale().normalise().linear(a, 0).png().toBuffer();
  lightest.setImage(new Uint8Array(await patchTexture(neutral, 'baseColor'))).setMimeType('image/png');
  // normal and ORM: same marks painted out in UV space
  for (const tex of root.listTextures()) {
    const n = tex.getName();
    const ch = /^normal/i.test(n) ? 'normal' : /occlusion/i.test(n) ? 'orm' : null;
    if (ch) tex.setImage(new Uint8Array(await patchTexture(Buffer.from(tex.getImage()), ch))).setMimeType('image/png');
  }

  // 3. drop variants, point the primitive at material 0, prune the rest
  const variants = root.listExtensionsUsed().find((e) => e instanceof KHRMaterialsVariants);
  const mat0 = root.listMaterials()[0];
  mat0.setBaseColorTexture(lightest);
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      prim.setMaterial(mat0);
      for (const m of prim.listMappings?.() || []) m.dispose();
    }
  }
  if (variants) variants.dispose();
  await doc.transform(prune());

  // 4. dedup / weld / prune
  await doc.transform(dedup(), weld(), prune());

  // 5. textures to WebP
  await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [size, size], quality }));

  // 6. meshopt
  await doc.transform(meshopt({ encoder: MeshoptEncoder, level: 'medium' }));

  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, `shoe-${name}.glb`);
  await io.write(file, doc);
  const bytes = fs.statSync(file).size;
  console.log(`shoe-${name}.glb  ${(bytes / 1024 / 1024).toFixed(2)} MB  (budget ${(BUDGET[name] / 1024 / 1024).toFixed(1)} MB)  neutral mean was ${mean.toFixed(0)}`);
  return bytes;
}

if (!fs.existsSync(SRC)) {
  console.error(`Source model not found: ${SRC}`);
  process.exit(1);
}
const d = await build('desktop', 2048, 82);
const m = await build('mobile', 1024, 78);
if (d > BUDGET.desktop || m > BUDGET.mobile) {
  console.error('Model budget exceeded.');
  process.exit(1);
}
console.log('Models within budget.');
