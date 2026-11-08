// Packs the Blender G10-401 export for the web: re-encodes its webp textures (normal maps of the two big parts capped
// at 1536 px on desktop) so the desktop file stays under ~3.5 MB. Geometry keeps its meshopt + quantization.
//   node scripts/pack-g10.mjs <dir with parts.glb + mobile.glb>   -> public/models/g10-hd.glb, g10-hd-mobile.glb
// parts.glb is used for desktop (it is web.glb plus the insole for the exploded view).
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = process.argv[2];
if (!src) throw new Error('usage: node scripts/pack-g10.mjs <dir>');
const outDir = path.resolve(here, '../public/models');
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

async function pack(file, out, { cap, quality }) {
  const doc = await io.read(path.join(src, file));
  for (const t of doc.getRoot().listTextures()) {
    const img = Buffer.from(t.getImage());
    const meta = await sharp(img).metadata();
    const isNormal = /_n$/.test(t.getName());
    const width = Math.min(meta.width, cap[t.getName()] || meta.width);
    // Normal maps need more bits than ORM: near-lossless for them, a lower quality for ORM.
    const q = isNormal ? quality.normal : quality.orm;
    const next = await sharp(img).resize({ width, withoutEnlargement: true }).webp({ quality: q, effort: 6 }).toBuffer();
    if (next.length < img.length) t.setImage(new Uint8Array(next)).setMimeType('image/webp');
  }
  await io.write(path.join(outDir, out), doc);
  console.log(out, (fs.statSync(path.join(outDir, out)).size / 1048576).toFixed(2), 'MB');
}

// Small parts (collar, laces, tongue) never cover more than ~300 px on screen: 768 px normal maps are enough there.
await pack('parts.glb', 'g10-hd.glb', { cap: { upper_n: 1536, upper_orm: 1536, midsole_n: 1024, midsole_orm: 1024, collar_n: 768, laces_n: 768, tongue_n: 768 }, quality: { normal: 86, orm: 72 } });
await pack('mobile.glb', 'g10-hd-mobile.glb', { cap: {}, quality: { normal: 84, orm: 78 } });
