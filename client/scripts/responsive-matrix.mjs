// Responsive matrix: loads /g10 and / at every device size and asserts the layout is sane.
//
//   node scripts/responsive-matrix.mjs [--base http://localhost:5182] [--out dir] [--sizes 320x568,844x390]
//                                      [--routes g10,landing] [--walk] [--only-t0] [--shots]
//
// /g10, at every size: the intro steps (T 0..160) and each section's hold pose. Per step:
//  - no horizontal overflow (document wider than the viewport);
//  - intro: the boot (canvas pixels with alpha > 150, i.e. the boot itself, not its soft contact shadow) lies inside
//    the viewport and below the AppBar;
//  - no visible text sits on the boot (text box covering boot pixels), under the AppBar, or outside the viewport (cut
//    off), and no two visible text boxes from different elements overlap (headings included);
//  - touch targets (buttons, links, radios) in view are >= 44 x 44 CSS px.
// --walk adds the mid-transition steps (the boot in flight, the panels sliding).
// / (landing), at every size: walks the page in half-viewport steps: no horizontal overflow, no headings of different
// sections overlapping, at most one pinned element fixed at a time, no heading cut off at the sides.
//
// Needs the dev server (window.__story / window.__ST are dev-only) and playwright-core (PW_CORE env or the default path).
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { HOLD, START, SECTIONS, endOf } from '../src/story/storyline.js';

const require = createRequire(import.meta.url);
const PW = process.env.PW_CORE || 'C:/Users/Yanish Gurung/AppData/Local/Temp/claude/5c53f9f7d9df89f5/cfc6d61f-a836-41f0-995a-cb4d0f39dabb/scratchpad/pw/node_modules/playwright-core';
const { chromium } = require(PW);
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > 0 ? process.argv[i + 1] : d;
};
const flag = (k) => process.argv.includes(`--${k}`);

export const MATRIX = [
  // phones (portrait), DPR 2 (3 for two of them)
  '320x568', '360x640', '360x800', '375x667', '375x812', '390x844@3', '393x852', '412x915', '414x896', '430x932@3',
  // phone landscape
  '667x375', '844x390', '932x430',
  // tablets
  '768x1024', '820x1180', '1024x768', '1024x1366',
  // laptops / desktops (DPR 1, 1.25 for the scaled ones)
  '1280x720@1', '1366x650@1', '1440x900@1', '1536x730@1.25', '1841x822@1.25', '1920x1080@1', '2560x1080@1', '2560x1440@1',
];
const parse = (s) => {
  const [wh, d] = s.split('@');
  const [w, h] = wh.split('x').map(Number);
  const touch = w < 1100 || (h > w && w <= 1366); // phones + tablets
  return { w, h, dpr: d ? Number(d) : touch ? 2 : 1, touch, name: `${w}x${h}` };
};

const base = arg('base', 'http://localhost:5182');
const out = arg('out', 'responsive-out');
const sizes = (arg('sizes') ? arg('sizes').split(',') : MATRIX).map((s) => parse(MATRIX.find((m) => m.startsWith(s)) || s));
const routes = arg('routes', 'g10,landing').split(',');
const walk = flag('walk');
const onlyT0 = flag('only-t0');
const allShots = flag('shots'); // a screenshot of every step
fs.mkdirSync(out, { recursive: true });

// beat holds, the caption crossfades (34, 72) and the glide; text overlap is only judged for text at >= 0.6 opacity,
// so two captions mid-crossfade (0.5 each) are not counted
const INTRO_T = [0, 16, 34, 56, 72, 92, 104, 126, 160];
const holds = SECTIONS.filter((s) => s.id !== 'hero' && s.id !== 'finale').map((s) => [s.id, HOLD[s.id]]);
const mids = SECTIONS.slice(0, -1).map((s) => [`${s.id}>`, endOf(s.id) + 50]);

// ---------------------------------------------------------------------------------------------------------------
// In-page probes.
const TEXT_PROBE = ({ scope, appbarSel }) => {
  const W = innerWidth;
  const H = innerHeight;
  const root = document.querySelector(scope);
  const bar = document.querySelector(appbarSel);
  const appbar = bar ? bar.getBoundingClientRect().bottom : 0;
  const op = (el) => {
    let o = 1;
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
      o *= Number(cs.opacity);
    }
    return o;
  };
  const secOf = (el) => el.closest('section')?.id || (el.closest('[data-label-card]') ? 'labels' : '?');
  const texts = [];
  const all = root ? root.querySelectorAll('*') : [];
  all.forEach((el) => {
    if (el.closest('svg') || el.closest('[data-label-dot]')) return;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) return;
    const cs = getComputedStyle(el);
    if (cs.position === 'absolute' && el.clientWidth <= 1 && el.clientHeight <= 1) return; // sr-only
    if (el.closest('[style*="clip"]') || getComputedStyle(el.parentElement).clip !== 'auto') return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const r = range.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    if (r.bottom <= 0 || r.top >= H || r.right <= 0 || r.left >= W) return;
    const o = op(el);
    if (o < 0.5) return;
    texts.push({ el, t: el.textContent.trim().slice(0, 28), sec: secOf(el), x0: r.left, x1: r.right, y0: r.top, y1: r.bottom, o, heading: /^H[1-3]$/.test(el.tagName) || !!el.closest('h1,h2,h3') });
  });
  const problems = [];
  // overlaps between different text elements (not nested)
  for (let i = 0; i < texts.length; i += 1) {
    for (let j = i + 1; j < texts.length; j += 1) {
      const a = texts[i];
      const b = texts[j];
      if (a.el.contains(b.el) || b.el.contains(a.el) || a.o < 0.6 || b.o < 0.6) continue;
      const ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
      const iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
      if (ix > 2 && iy > 2) problems.push(`text overlap: "${a.t}" x "${b.t}"`);
    }
  }
  texts.forEach((t) => {
    if (t.x0 < -1 || t.x1 > W + 1) problems.push(`cut off sideways: "${t.t}" (${Math.round(t.x0)}..${Math.round(t.x1)})`);
    if (t.y1 > H + 1 && t.y0 < H) problems.push(`cut off at the bottom: "${t.t}" (${Math.round(t.y0)}..${Math.round(t.y1)} > ${H})`);
    if (t.y0 < appbar - 2 && t.y1 > 0) problems.push(`under the AppBar: "${t.t}" (top ${Math.round(t.y0)} < ${Math.round(appbar)})`);
  });
  // touch targets in view
  const small = [];
  (root ? root.querySelectorAll('button, a[href], [role="radio"]') : []).forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.bottom <= 0 || r.top >= H || op(el) < 0.5) return;
    if (r.width < 43.5 || r.height < 43.5) small.push(`${el.getAttribute('aria-label') || el.textContent.trim().slice(0, 20)} ${Math.round(r.width)}x${Math.round(r.height)}`);
  });
  if (small.length) problems.push(`small touch targets: ${small.join('; ')}`);
  // copy that does not fit its box (pushed out of the pinned panel, so cut off even if fully below the fold)
  (root ? root.querySelectorAll('[data-copybox]') : []).forEach((box) => {
    const r = box.getBoundingClientRect();
    if (r.bottom <= 0 || r.top >= H || op(box) < 0.5) return;
    const clipped = (e) => { for (let a = e; a && a !== box; a = a.parentElement) if (getComputedStyle(a).clip !== 'auto') return true; return false; }; // sr-only
    const last = [...box.querySelectorAll('*')].filter((e) => op(e) > 0.5 && e.getBoundingClientRect().height > 0 && !clipped(e)).reduce((m, e) => Math.max(m, e.getBoundingClientRect().bottom), 0);
    if (last > Math.min(r.bottom, H) + 2) problems.push(`copy overflows its box: ${box.closest('section')?.id} (${Math.round(last)} > ${Math.round(Math.min(r.bottom, H))})`);
  });
  // floating site UI (the WhatsApp button) must not cover copy or controls
  const fab = document.querySelector('a[aria-label="Chat with Goldstar on WhatsApp"]');
  const fr = fab && op(fab) > 0.5 ? fab.getBoundingClientRect() : null;
  if (fr && fr.width) {
    texts.forEach((t) => {
      if (t.x0 < fr.right && fr.left < t.x1 && t.y0 < fr.bottom && fr.top < t.y1) problems.push(`under the WhatsApp button: "${t.t}"`);
    });
  }
  const overflow = document.documentElement.scrollWidth - W;
  if (overflow > 0) problems.push(`horizontal overflow ${overflow}px`);
  return { appbar, problems, rects: texts.map(({ el, ...t }) => t) };
};

// Boot pixels from a canvas-only screenshot (CSS scale). Returns its bbox and how many boot pixels each text box covers.
const MASK = async ({ b64, rects }) => {
  const img = new Image();
  img.src = `data:image/png;base64,${b64}`;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data;
  const k = img.width / innerWidth;
  let x0 = 1e9;
  let x1 = -1;
  let y0 = 1e9;
  let y1 = -1;
  let n = 0;
  for (let y = 0; y < c.height; y += 1) {
    for (let xx = 0; xx < c.width; xx += 1) {
      if (d[(y * c.width + xx) * 4 + 3] > 150) {
        n += 1;
        if (xx < x0) x0 = xx;
        if (xx > x1) x1 = xx;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  const hits = rects.map((r) => {
    let h = 0;
    for (let y = Math.max(0, Math.floor(r.y0 * k)); y < Math.min(c.height, Math.ceil(r.y1 * k)); y += 1) {
      for (let xx = Math.max(0, Math.floor(r.x0 * k)); xx < Math.min(c.width, Math.ceil(r.x1 * k)); xx += 1) if (d[(y * c.width + xx) * 4 + 3] > 150) h += 1;
    }
    return h / (k * k);
  });
  return { n: n / (k * k), bbox: n ? { x0: x0 / k, x1: (x1 + 1) / k, y0: y0 / k, y1: (y1 + 1) / k } : null, hits };
};

const HIDE_ALL_BUT_CANVAS = 'body *{visibility:hidden!important} [data-stage-ready],[data-stage-ready] *{visibility:visible!important} html,body{background:transparent!important}';

async function settle(page) {
  await page.waitForFunction(() => !window.__story || performance.now() - window.__story.lastMove > 450, null, { timeout: 30000, polling: 100 });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}
async function scrollT(page, T) {
  await page.evaluate((T) => {
    const y = (T / 100) * innerHeight;
    if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
  }, T);
  await page.waitForTimeout(250);
  await settle(page);
}

async function g10(ctx, s, report) {
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`${base}/g10?tier=lite`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('[data-stage-ready="true"]', { timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  const steps = onlyT0 ? [['T0', 0]] : [...INTRO_T.map((t) => [`T${t}`, t]), ...holds, ...(walk ? mids : [])];
  for (const [label, T] of steps) {
    await scrollT(page, T);
    const intro = T <= 104;
    const probe = await page.evaluate(TEXT_PROBE, { scope: '#story', appbarSel: 'header' });
    const T_live = await page.evaluate(() => window.__story?.T);
    if (label === 'T0') await page.screenshot({ path: path.join(out, `g10-${s.name}-T0.png`), scale: 'device' });
    else if (allShots) await page.screenshot({ path: path.join(out, `g10-${s.name}-${label.replace('>', '-to')}.png`), scale: 'css' });
    const grab = async () => {
      await page.addStyleTag({ content: HIDE_ALL_BUT_CANVAS }).then((h) => h.evaluate((e) => e.setAttribute('data-hide', '')));
      await page.waitForTimeout(120);
      const buf = await page.screenshot({ omitBackground: true, scale: 'css' });
      await page.evaluate(() => document.querySelectorAll('style[data-hide]').forEach((e) => e.remove()));
      return page.evaluate(MASK, { b64: buf.toString('base64'), rects: probe.rects });
    };
    let m = await grab();
    if (!m.bbox && intro) {
      // a frame caught mid-swap (SwiftShader): ask for a new frame and look again
      await page.evaluate(() => window.__story?.invalidate?.());
      await settle(page);
      m = await grab();
    }
    // mid-transition steps: the next panel is sliding in and the boot is in flight, so copy below the fold or crossing
    // the boot is expected there; only overflow, text-on-text and touch targets are judged
    const mid = label.endsWith('>');
    const problems = mid ? probe.problems.filter((p) => /overflow|text overlap|touch/.test(p)) : [...probe.problems];
    if (intro && m.bbox) {
      const b = m.bbox;
      if (b.x0 < 0.5 || b.x1 > s.w - 0.5 || b.y1 > s.h - 0.5) problems.push(`boot outside the viewport (${b.x0.toFixed(0)},${b.y0.toFixed(0)})-(${b.x1.toFixed(0)},${b.y1.toFixed(0)})`);
      if (b.y0 < probe.appbar) problems.push(`boot under the AppBar (top ${b.y0.toFixed(0)} < ${probe.appbar.toFixed(0)})`);
    }
    if (intro && !m.bbox) problems.push('no boot on screen');
    probe.rects.forEach((r, i) => {
      if (r.sec === 'labels' || mid) return; // the label cards point at the boot by design (their dots sit on it)
      if (m.hits[i] > Math.max(24, 0.02 * (r.x1 - r.x0) * (r.y1 - r.y0))) problems.push(`text on the boot: "${r.t}" (${Math.round(m.hits[i])} px)`);
    });
    const b = m.bbox;
    report.push({ route: 'g10', size: s.name, step: label, T: Math.round(T_live ?? T), boot: b ? `${b.x0.toFixed(0)},${b.y0.toFixed(0)}-${b.x1.toFixed(0)},${b.y1.toFixed(0)} (${((b.x1 - b.x0) / s.w * 100).toFixed(0)}%w ${((b.y1 - b.y0) / s.h * 100).toFixed(0)}%h)` : '-', problems });
    if (problems.length) {
      await page.screenshot({ path: path.join(out, `FAIL-g10-${s.name}-${label.replace('>', '-to')}.png`), scale: 'css' });
    }
    console.log(`g10 ${s.name} ${label.padEnd(13)} T=${String(Math.round(T_live ?? T)).padStart(4)} boot ${report.at(-1).boot.padEnd(34)} ${problems.length ? 'FAIL ' + problems.join(' | ') : 'ok'}`);
  }
  if (errs.length) report.push({ route: 'g10', size: s.name, step: 'errors', problems: errs.slice(0, 3) });
  await page.close();
}

const LANDING_PROBE = () => {
  const W = innerWidth;
  const H = innerHeight;
  const problems = [];
  const overflow = document.documentElement.scrollWidth - W;
  if (overflow > 0) problems.push(`horizontal overflow ${overflow}px`);
  const fixed = [];
  document.querySelectorAll('.pin-spacer > *').forEach((el) => {
    if (getComputedStyle(el).position === 'fixed') fixed.push(el.closest('section')?.id || el.className.slice(0, 20));
  });
  if (fixed.length > 1) problems.push(`two pins fixed: ${fixed}`);
  const vis = (el) => {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.3) return false;
    }
    return true;
  };
  const heads = [...document.querySelectorAll('#landing-v2 h1, #landing-v2 h2')].map((h) => {
    const r = h.getBoundingClientRect();
    return { h, sec: h.closest('section')?.id || '?', t: h.textContent.trim().slice(0, 24), x0: r.left, x1: r.right, y0: r.top, y1: r.bottom };
  }).filter((h) => h.y1 > 0 && h.y0 < H && h.x1 - h.x0 > 0 && vis(h.h));
  for (let i = 0; i < heads.length; i += 1) {
    for (let j = i + 1; j < heads.length; j += 1) {
      const a = heads[i];
      const b = heads[j];
      if (a.sec === b.sec) continue;
      if (a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1) problems.push(`headings overlap: "${a.t}" x "${b.t}"`);
    }
  }
  heads.forEach((h) => {
    // text clipped at the sides: compare the text's own extent with the viewport
    const range = document.createRange();
    range.selectNodeContents(h.h);
    const r = range.getBoundingClientRect();
    // (the kinetic hero's letters fly out sideways by design once it scrolls: judge it at the top only)
    if ((r.left < -1 || r.right > W + 1) && !(h.h.id === 'landing-h1' && scrollY > 4)) problems.push(`heading cut off sideways: "${h.t}" (${Math.round(r.left)}..${Math.round(r.right)})`);
    if (h.h.scrollWidth > h.h.clientWidth + 2 && getComputedStyle(h.h).overflow !== 'visible') problems.push(`heading clipped: "${h.t}"`);
  });
  return problems;
};

async function landing(ctx, s, report) {
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (/\[landing\]/.test(m.text())) errs.push(m.text()); });
  await page.goto(`${base}/`, { waitUntil: 'load', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2200);
  const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const fails = [];
  const step = Math.round(s.h / 2);
  for (let y = 0; y <= total + step - 1; y += step) {
    const yy = Math.min(y, total);
    await page.evaluate((y) => {
      if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
    }, yy);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const p = await page.evaluate(LANDING_PROBE);
    if (p.length) {
      if (!fails.length) await page.screenshot({ path: path.join(out, `FAIL-landing-${s.name}-y${yy}.png`), scale: 'css' });
      fails.push(`y=${yy}: ${p.join(' | ')}`);
    }
    if (yy === 0) await page.screenshot({ path: path.join(out, `landing-${s.name}-top.png`), scale: 'css' });
  }
  report.push({ route: 'landing', size: s.name, step: `walk 0..${total} by ${step}`, problems: [...fails, ...errs.slice(0, 3)] });
  console.log(`landing ${s.name} H=${total} ${fails.length || errs.length ? 'FAIL\n  ' + [...fails, ...errs].slice(0, 6).join('\n  ') : 'ok'}`);
  await page.close();
}

const browser = await chromium.launch({ executablePath: CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const report = [];
try {
  for (const s of sizes) {
    const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: s.dpr, hasTouch: s.touch, isMobile: s.touch && s.w < 1100 });
    try {
      if (routes.includes('g10')) await g10(ctx, s, report);
      if (routes.includes('landing') && !onlyT0) await landing(ctx, s, report);
    } catch (e) {
      report.push({ route: '?', size: s.name, step: 'crash', problems: [String(e.message || e).split('\n')[0]] });
      console.log(`${s.name} CRASH ${e.message}`);
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1));
const bad = report.filter((r) => r.problems.length);
console.log(`\n${report.length} checks, ${bad.length} failing`);
process.exitCode = bad.length ? 1 : 0;
