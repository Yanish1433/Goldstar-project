// Converts raw PNG captures in shots/raw to WebP posters (<= 120 KB, 1440 wide) in public/posters.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, '../shots/raw');
const out = path.resolve(here, '../public/posters');
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(src).filter((n) => n.endsWith('.png'))) {
  let q = 80;
  let buf;
  do {
    buf = await sharp(path.join(src, f)).resize({ width: 1440 }).webp({ quality: q }).toBuffer();
    q -= 8;
  } while (buf.length > 120 * 1024 && q > 20);
  const name = f.replace('.png', '.webp');
  fs.writeFileSync(path.join(out, name), buf);
  console.log(name, (buf.length / 1024).toFixed(1), 'KB');
}
