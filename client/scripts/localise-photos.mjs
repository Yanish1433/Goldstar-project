// One-off: copies every catalogue photo referenced by src/api/mock/products.json into public/img/catalogue/ and
// rewrites the JSON to the local paths, so the static demo never depends on hotlinking goldstarshoes.com.
// Full-size photos are resized to 1600 px (webp q82); thumbnails stay 800 px. Re-run safe: local paths are skipped.
// Usage: node scripts/localise-photos.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.resolve(here, '../src/api/mock/products.json');
const outDir = path.resolve(here, '../public/img/catalogue');
fs.mkdirSync(outDir, { recursive: true });

const products = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const done = new Map();

async function localise(url, width) {
  if (!/^https?:/.test(url)) return url;
  const key = `${url}@${width}`;
  if (done.has(key)) return done.get(key);
  const base = path.basename(new URL(url).pathname).replace(/\.[a-z]+$/i, '');
  const name = `${base}${width === 800 ? '' : `-${width}`}.webp`;
  const file = path.join(outDir, name);
  if (!fs.existsSync(file)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await sharp(buf).resize({ width, height: width, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(file);
    console.log(name, (fs.statSync(file).size / 1024).toFixed(0), 'KB');
  }
  const local = `/img/catalogue/${name}`;
  done.set(key, local);
  return local;
}

for (const p of products) {
  for (const c of p.colourways) {
    for (const im of c.images) {
      im.thumb = await localise(im.thumb, 800);
      im.src = await localise(im.src, 1600);
    }
  }
}
fs.writeFileSync(jsonPath, `${JSON.stringify(products, null, 1)}\n`);
console.log('photos:', done.size);
