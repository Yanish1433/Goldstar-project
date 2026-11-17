// Contact sheet: lays PNGs out in a labelled grid (each scaled to the same height) and saves one PNG.
//   node scripts/contact-sheet.mjs <dir> <regex for file names> <out.png> [row height px = 360] [max width px = 2400]
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || 'C:/Users/Yanish Gurung/AppData/Local/Temp/claude/5c53f9f7d9df89f5/cfc6d61f-a836-41f0-995a-cb4d0f39dabb/scratchpad/pw/node_modules/playwright-core');
const [dir, re, out, rowH = '360', maxW = '2400'] = process.argv.slice(2);
const files = fs.readdirSync(dir).filter((f) => new RegExp(re).test(f) && f.endsWith('.png'));
const num = (f) => (f.match(/(\d+)x(\d+)/) || [0, 0, 0]).slice(1).map(Number);
files.sort((a, b) => num(a)[0] - num(b)[0] || num(a)[1] - num(b)[1] || a.localeCompare(b, 'en', { numeric: true }));
const imgs = files.map((f) => `<figure><img src="data:image/png;base64,${fs.readFileSync(path.join(dir, f)).toString('base64')}"><figcaption>${f.replace(/\.png$/, '')}</figcaption></figure>`).join('');
const html = `<!doctype html><style>body{margin:0;background:#1d1d1f;font:600 15px system-ui;color:#eee;width:${maxW}px}
main{display:flex;flex-wrap:wrap;gap:14px;padding:14px;align-items:flex-end}figure{margin:0}img{height:${rowH}px;display:block;box-shadow:0 0 0 1px #555}
figcaption{padding-top:4px}</style><main>${imgs}</main>`;
const b = await chromium.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage({ viewport: { width: Number(maxW), height: 600 } });
await p.setContent(html, { waitUntil: 'load' });
await p.screenshot({ path: out, fullPage: true, timeout: 180000 });
await b.close();
console.log(`${files.length} images -> ${out}`);
