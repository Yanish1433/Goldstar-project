// Dev helper: dumps the source GLB textures as PNG (full size) to a folder so marks can be located in UV space.
// Usage: node scripts/dump-textures.mjs <outDir> [glb]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(process.argv[2] || path.join(here, '../shots/raw/tex'));
const src = process.argv[3] ? path.resolve(process.argv[3]) : path.resolve(here, '../../_dl/shoe.glb');
fs.mkdirSync(out, { recursive: true });
const doc = await new NodeIO().registerExtensions(ALL_EXTENSIONS).read(src);
for (const t of doc.getRoot().listTextures()) {
  const name = t.getName().replace(/\.[a-z]+$/, '');
  const png = await sharp(Buffer.from(t.getImage())).png().toBuffer();
  fs.writeFileSync(path.join(out, `${name}.png`), png);
  const m = await sharp(png).metadata();
  console.log(name, m.width, 'x', m.height);
}
