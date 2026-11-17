// Live resize / orientation flip on /g10 (same page, no reload): after each resize the layout, the pins and the 3D boxes
// must recompute (no stale box): at the intro the boot sits where that layout puts it, and at the performance hold the
// pinned panel covers the screen and its copy and boot do not overlap.
//   node scripts/responsive-flip.mjs [--base http://localhost:5182]
import { createRequire } from 'module';
import { HOLD, LAYOUTS, storyLayout } from '../src/story/storyline.js';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || 'C:/Users/Yanish Gurung/AppData/Local/Temp/claude/5c53f9f7d9df89f5/cfc6d61f-a836-41f0-995a-cb4d0f39dabb/scratchpad/pw/node_modules/playwright-core');
const i = process.argv.indexOf('--base');
const base = i > 0 ? process.argv[i + 1] : 'http://localhost:5182';

const BBOX = async (b64) => {
  const img = new Image();
  img.src = `data:image/png;base64,${b64}`;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data;
  let x0 = 1e9; let x1 = -1; let y0 = 1e9; let y1 = -1;
  for (let y = 0; y < c.height; y += 1) for (let xx = 0; xx < c.width; xx += 1) if (d[(y * c.width + xx) * 4 + 3] > 150) { x0 = Math.min(x0, xx); x1 = Math.max(x1, xx); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return x1 < 0 ? null : { x0, x1, y0, y1 };
};
const HIDE = 'body *{visibility:hidden!important} [data-stage-ready],[data-stage-ready] *{visibility:visible!important} html,body{background:transparent!important}';

async function settle(page) {
  await page.waitForTimeout(700); // ScrollTrigger's resize refresh is debounced (~200 ms)
  await page.waitForFunction(() => performance.now() - window.__story.lastMove > 450, null, { timeout: 30000, polling: 100 });
}
async function goT(page, T) {
  await page.evaluate((T) => window.__lenis.scrollTo((T / 100) * window.__story.vh * 100, { immediate: true, force: true }), T);
  await page.waitForTimeout(250);
  await settle(page);
}
async function boot(page) {
  const h = await page.addStyleTag({ content: HIDE });
  await page.waitForTimeout(120);
  const buf = await page.screenshot({ omitBackground: true, scale: 'css' });
  await h.evaluate((e) => e.remove());
  return page.evaluate(BBOX, buf.toString('base64'));
}

const browser = await chromium.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let fails = 0;
const runs = [
  { name: 'phone portrait <-> landscape', start: [390, 844], seq: [[844, 390], [390, 844]], touch: true },
  { name: 'desktop live resize', start: [1440, 900], seq: [[1366, 650], [820, 1180], [1841, 822]], touch: false },
];
for (const run of runs) {
  const ctx = await browser.newContext({ viewport: { width: run.start[0], height: run.start[1] }, deviceScaleFactor: run.touch ? 2 : 1, hasTouch: run.touch, isMobile: run.touch });
  const page = await ctx.newPage();
  await page.goto(`${base}/g10?tier=lite`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('[data-stage-ready="true"]', { timeout: 120000 });
  await page.waitForTimeout(900);
  for (const [W, H] of [run.start, ...run.seq]) {
    await page.setViewportSize({ width: W, height: H });
    await goT(page, 0);
    const l = storyLayout(W, H);
    const b = await boot(page);
    const box = LAYOUTS[l].intro;
    const cx = b ? (b.x0 + b.x1) / 2 / W : NaN;
    const okIntro = b && Math.abs(cx - box.cx) < 0.08 && b.y0 >= 50 && b.y1 <= H;
    await goT(page, HOLD.performance);
    const st = await page.evaluate(() => {
      const sec = document.querySelector('#story-performance').getBoundingClientRect();
      const copy = document.querySelector('#story-performance [data-copybox]').getBoundingClientRect();
      const vh = window.__story.vh;
      return { top: Math.round(sec.top), h: Math.round(sec.height), copy: [copy.left, copy.right, copy.top, copy.bottom].map(Math.round), vh, sw: document.documentElement.scrollWidth };
    });
    const pb = await boot(page);
    const okPin = Math.abs(st.top) <= 2 && Math.abs(st.h - H) <= 2 && Math.abs(st.vh * 100 - H) < 1 && st.sw <= W;
    const okSide = pb && (l === 'phone' ? pb.y1 <= st.copy[2] + 40 : pb.x1 <= st.copy[0] + 4); // boot clear of the copy (phone: above it)
    const ok = okIntro && okPin && okSide;
    if (!ok) fails += 1;
    console.log(`${run.name}: ${W}x${H} (${l}) intro boot cx ${(cx * 100).toFixed(1)}% (box ${box.cx * 100}%) y ${b?.y0}-${b?.y1} | performance pin top ${st.top} h ${st.h} vh ${st.vh.toFixed(2)} boot x ${pb?.x0}-${pb?.x1} y ${pb?.y0}-${pb?.y1} copy x ${st.copy[0]}-${st.copy[1]} y ${st.copy[2]}-${st.copy[3]} -> ${ok ? 'PASS' : 'FAIL'}`);
  }
  await ctx.close();
}
await browser.close();
console.log(fails ? `${fails} FAIL` : 'all PASS');
process.exitCode = fails ? 1 : 0;
