// Mobile audit: one headless page at a time, every route at every phone width, one table of findings.
//
//   node scripts/mobile-audit.mjs [--base http://127.0.0.1:5194] [--sizes 320x568,375x667] [--pages landing,shop]
//                                 [--shots dir] [--json out.json] [--shotsizes 320x568,375x667]
//
// Per page x width: horizontal overflow (document + elements bleeding off-screen after ancestor clipping), touch targets
// < 44 px (inline text links are listed separately), inputs < 16 px, text < 12 px, clipped text, stretched images, and
// overlaps between fixed/sticky bars. Needs a dev server started with VITE_USE_MOCK=true (in-browser mock API: the
// script signs in as the mock shopper, places a mock order, then signs in as the mock admin). Never touches a real API.
import { createRequire } from 'module';
import fs from 'fs';

const require = createRequire(import.meta.url);
const PW = process.env.PW_CORE || 'C:/Users/Yanish Gurung/AppData/Local/Temp/claude/5c53f9f7d9df89f5/cfc6d61f-a836-41f0-995a-cb4d0f39dabb/scratchpad/pw/node_modules/playwright-core';
const { chromium } = require(PW);
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };

const base = arg('base', 'http://127.0.0.1:5194');
const SIZES = arg('sizes', '320x568,360x740,375x667,390x844,414x896,768x1024,667x375').split(',');
const only = arg('pages') ? arg('pages').split(',') : null;
const shotDir = arg('shots', '');
const shotSizes = (arg('shotsizes', '375x667,320x568')).split(',');
const jsonOut = arg('json', '');
if (shotDir) fs.mkdirSync(shotDir, { recursive: true });

const PROBE = () => {
  const W = innerWidth;
  const out = { overflowDoc: 0, bleed: [], touch: [], inline: [], input: [], tiny: [], clipped: [], stretched: [], fixedOverlap: [] };
  out.overflowDoc = Math.max(0, document.scrollingElement.scrollWidth - W);
  const vis = (el, r) => {
    if (r.width <= 0 || r.height <= 0) return false;
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
      if (e.getAttribute('aria-hidden') === 'true' && !e.matches('svg,svg *')) return false;
    }
    return true;
  };
  const label = (el) => {
    const t = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || el.name || '').trim().replace(/\s+/g, ' ').slice(0, 28);
    const c = (typeof el.className === 'string' ? el.className : '').split(' ').filter((x) => x.startsWith('Mui')).slice(0, 1).join('');
    return `${el.tagName.toLowerCase()}${c ? '.' + c : ''}"${t}"`;
  };
  // clip rect of an element by its overflow-hidden/auto/scroll ancestors
  const clipped = (el, r) => {
    let l = r.left, rt = r.right;
    for (let e = el.parentElement; e && e !== document.body && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.position === 'fixed') break;
      if (cs.overflowX !== 'visible') { const p = e.getBoundingClientRect(); l = Math.max(l, p.left); rt = Math.min(rt, p.right); }
    }
    return [l, rt];
  };
  const all = [...document.querySelectorAll('body *')];
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (!vis(el, r)) continue;
    const cs = getComputedStyle(el);
    if (r.width <= 1.5 && r.height <= 1.5) continue; // sr-only / skip-link until focused
    // an element that is positioned off-screen on purpose (skip links, closed drawers) is not bleeding
    if (cs.position === 'fixed' && (r.right <= 0 || r.left >= W)) continue;
    const [l, rt] = clipped(el, r);
    if (rt > l && (rt > W + 1 || l < -1) && !el.closest('svg') && !el.closest('[data-sr-only],.visually-hidden') && !(cs.clip && cs.clip !== 'auto') && !(r.width <= 1 || r.height <= 1)) {
      out.bleed.push(`${label(el)} ${Math.round(l)}..${Math.round(rt)}`);
    }
    // touch targets
    if (el.matches('a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=tab],[role=menuitem],[role=radio],[role=checkbox],summary')) {
      if (el.matches('input[type=radio],input[type=checkbox]') && el.closest('label')) continue; // the label is the target
      if (el.disabled) continue;
      const small = r.width < 43.5 || r.height < 43.5;
      if (small) {
        // inline text link inside running text: WCAG exempts, listed separately
        const inline = el.tagName === 'A' && cs.display === 'inline';
        (inline ? out.inline : out.touch).push(`${label(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }
    // inputs
    if (el.matches('input:not([type=hidden]):not([type=radio]):not([type=checkbox]):not([type=range]):not([type=color]):not([type=file]),textarea,select') && parseFloat(cs.fontSize) < 15.99) {
      out.input.push(`${label(el)} ${cs.fontSize}`);
    }
    // text < 12px (own text only)
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (own && parseFloat(cs.fontSize) < 11.95) out.tiny.push(`${label(el)} ${cs.fontSize}`);
    // clipped text
    if (own && el.scrollWidth > el.clientWidth + 2 && cs.overflowX !== 'visible' && cs.textOverflow !== 'ellipsis' && cs.overflowX !== 'auto' && cs.overflowX !== 'scroll') out.clipped.push(`${label(el)} ${el.scrollWidth}>${el.clientWidth}`);
    // stretched images
    if (el.tagName === 'IMG' && el.naturalWidth > 0 && cs.objectFit === 'fill') {
      const a = el.naturalWidth / el.naturalHeight; const b = r.width / r.height;
      if (Math.abs(a - b) / a > 0.06) out.stretched.push(`${label(el)} ${a.toFixed(2)} vs ${b.toFixed(2)}`);
    }
  }
  // fixed/sticky bars overlapping each other
  const bars = all.filter((e) => { const p = getComputedStyle(e).position; const r = e.getBoundingClientRect(); return (p === 'fixed' || p === 'sticky') && r.width > 0 && r.height > 0 && r.right > 0 && r.left < W && r.bottom > 0 && r.top < innerHeight && r.height < innerHeight * 0.5 && vis(e, r) && getComputedStyle(e).pointerEvents !== 'none'; });
  for (let i = 0; i < bars.length; i += 1) for (let j = i + 1; j < bars.length; j += 1) {
    if (bars[i].contains(bars[j]) || bars[j].contains(bars[i])) continue;
    const a = bars[i].getBoundingClientRect(); const b = bars[j].getBoundingClientRect();
    const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left); const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (ox > 2 && oy > 2) out.fixedOverlap.push(`${label(bars[i])} x ${label(bars[j])} ${Math.round(ox)}x${Math.round(oy)}`);
  }
  const uniq = (a) => [...new Set(a)];
  for (const k of ['bleed', 'touch', 'inline', 'input', 'tiny', 'clipped', 'stretched', 'fixedOverlap']) out[k] = uniq(out[k]);
  return out;
};

const parse = (s) => { const [w, h] = s.split('x').map(Number); const touch = true; return { w, h, name: s }; };

const results = [];
let page;
let size;
const log = (m) => process.stderr.write(`${m}\n`);

async function measure(name, { scroll = true } = {}) {
  await page.waitForTimeout(500);
  // walk the page once so lazy images / reveals mount, then measure at the top again
  if (scroll) {
    const H = await page.evaluate(() => document.scrollingElement.scrollHeight);
    for (let y = 0; y < Math.min(H, 9000); y += size.h * 0.8) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(60); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(250);
  }
  const r = await page.evaluate(PROBE);
  results.push({ page: name, size: size.name, ...r });
  if (shotDir && shotSizes.includes(size.name)) {
    await page.screenshot({ path: `${shotDir}/${name.replace(/[^a-z0-9]+/gi, '-')}-${size.name}.jpg`, type: 'jpeg', quality: 55, fullPage: false });
  }
}

const go = async (path) => { await page.goto(base + path, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(400); };
const spa = async (path) => {
  await page.evaluate((p) => { history.pushState({ idx: (history.state?.idx ?? 0) + 1, key: String(Math.random()) }, '', p); dispatchEvent(new PopStateEvent('popstate', { state: history.state })); }, path);
  await page.waitForTimeout(700);
};
const want = (n) => !only || only.includes(n);

async function runSize(s) {
  size = parse(s);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: size.w, height: size.h }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  page = await ctx.newPage();
  page.on('pageerror', (e) => log(`  [pageerror ${size.name}] ${e.message.slice(0, 120)}`));
  try {
    // ---- public
    if (want('landing')) { await go('/'); await measure('landing'); }
    if (want('shop')) {
      await go('/shop'); await measure('shop');
      const f = page.getByRole('button', { name: /filters?/i }).first();
      if (await f.count()) { await f.click().catch(() => {}); await page.waitForTimeout(500); await measure('shop-filters', { scroll: false }); }
    }
    if (want('product')) {
      await go('/shop');
      await page.waitForSelector('a[href^="/product/"]', { timeout: 8000 }).catch(() => {});
      const href = await page.evaluate(() => document.querySelector('a[href^="/product/"]')?.getAttribute('href'));
      if (href) { await go(href); await page.waitForSelector('[aria-label="UK size"]', { timeout: 8000 }).catch(() => {}); await measure('product'); }
    }
    if (want('login')) { await go('/login'); await measure('login'); await page.getByRole('button', { name: /^(log in|sign in)/i }).first().click().catch(() => {}); await page.waitForTimeout(300); await measure('login-errors', { scroll: false }); }
    if (want('register')) { await go('/register'); await measure('register'); await page.getByRole('button', { name: /^(create|sign up|register)/i }).first().click().catch(() => {}); await page.waitForTimeout(300); await measure('register-errors', { scroll: false }); }
    if (want('404')) { await go('/nope-not-here'); await measure('404'); }
    if (want('g10')) { await go('/g10'); await measure('g10-top', { scroll: false }); await page.evaluate(() => window.scrollTo(0, document.scrollingElement.scrollHeight)); await page.waitForTimeout(900); await measure('g10-finale', { scroll: false }); }

    // ---- cart + checkout + order + account + admin, in one page load (the mock lives in memory)
    const needsFlow = ['cart-drawer', 'cart', 'checkout', 'checkout-errors', 'order', 'account', 'account-order', 'admin', 'admin-products', 'admin-product-edit', 'admin-orders', 'admin-order'].some(want);
    if (needsFlow) {
      await go('/login');
      await page.getByLabel(/email/i).first().fill('shopper@goldstar.test');
      await page.locator('input[type=password]').first().fill('Passw0rd1');
      await page.getByRole('button', { name: /^(log in|sign in)/i }).first().click();
      await page.waitForTimeout(900);
      await spa('/shop');
      await page.waitForSelector('a[href^="/product/"]', { timeout: 8000 }).catch(() => {});
      const href = await page.evaluate(() => document.querySelector('a[href^="/product/"]')?.getAttribute('href'));
      await spa(href || '/shop');
      await page.waitForSelector('[aria-label="UK size"]', { timeout: 8000 }).catch(() => {});
      // pick the first available size, then add to cart
      const sizeBtns = page.locator('[aria-label^="UK size "]:not([aria-label*="not available"])');
      if (await sizeBtns.count()) await sizeBtns.first().click({ force: true }).catch(() => {});
      await page.getByRole('button', { name: /^add to cart$/i }).first().click({ force: true }).catch(() => log('  add-to-cart click failed'));
      await page.waitForTimeout(900);
      if (want('cart-drawer')) {
        await page.waitForTimeout(500);
        await measure('cart-snackbar', { scroll: false });
        await page.locator('[aria-label^="Cart"]').first().click({ force: true }).catch(() => {});
        await page.waitForTimeout(700);
        await measure('cart-drawer', { scroll: false });
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      await spa('/checkout');
      await page.waitForTimeout(500);
      if (want('checkout')) await measure('checkout');
      if (want('checkout-errors')) { await page.getByRole('button', { name: /place order/i }).first().click().catch(() => {}); await page.waitForTimeout(500); await measure('checkout-errors', { scroll: false }); }
      // fill + place
      const fill = async (re, v) => { const l = page.getByLabel(re).first(); if (await l.count()) await l.fill(v).catch(() => {}); };
      await fill(/full name/i, 'Test Shopper'); await fill(/mobile/i, '9801234567'); await fill(/address line/i, 'Baneshwor Marg 12'); await fill(/area/i, 'Baneshwor'); await fill(/city/i, 'Kathmandu');
      await page.getByRole('button', { name: /place order/i }).first().click().catch(() => {});
      await page.waitForTimeout(1200);
      log(`  after place: ${await page.evaluate(() => location.pathname)} ${await page.evaluate(() => [...document.querySelectorAll('[id$=-error],[role=alert]')].map((e) => e.textContent).join(' | ').slice(0, 200))}`);
      if (want('order')) await measure('order');
      const orderId = await page.evaluate(() => location.pathname.match(/\/order\/([^/]+)/)?.[1]);
      if (want('account')) { await spa('/account'); await measure('account'); }
      if (want('account-order') && orderId) { await spa(`/account/orders/${orderId}`); await measure('account-order'); }
      // admin: log out through the mock, sign in as admin
      const adminNeeded = ['admin', 'admin-products', 'admin-product-edit', 'admin-orders', 'admin-order'].some(want);
      if (adminNeeded) {
        await page.evaluate(() => sessionStorage.setItem('gs-mock-user', 'mock-u2'));
        await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {}); // the mock restarts empty, signed in as admin
        await page.waitForTimeout(800);
        // seed one order straight into the in-browser mock so the admin order pages have something to show
        const adminOrderId = await page.evaluate(async () => {
          const m = await import('/src/api/mock/index.js');
          const list = await m.mockRequest('GET', '/products', null, {});
          const p = list.items[0];
          const full = await m.mockRequest('GET', `/products/${p.slug}`);
          const prod = full.product || full;
          const c = (prod.colourways || []).find((x) => x.inStock) || prod.colourways[0];
          const items = [{ productId: prod.id, colourwayKey: c.key, size: c.sizes[0], qty: 2 }];
          try {
            const o = await m.mockRequest('POST', '/orders', { paymentMethod: 'cod', items, shipping: { fullName: 'Test Shopper', phone: '9801234567', addressLine: 'Baneshwor Marg 12', area: 'Baneshwor', city: 'Kathmandu' } });
            return (o.order || o).id;
          } catch (e) { return 'ERR ' + (e.message || e); }
        });
        log(`  admin order: ${adminOrderId}`);
        if (want('admin')) { await spa('/admin'); await page.waitForTimeout(600); await measure('admin'); }
        if (want('admin-products')) { await spa('/admin/products'); await measure('admin-products'); }
        if (want('admin-product-edit')) { await spa('/admin/products/new'); await measure('admin-product-edit'); }
        if (want('admin-orders')) { await spa('/admin/orders'); await measure('admin-orders'); }
        if (want('admin-order') && adminOrderId && !String(adminOrderId).startsWith('ERR')) { await spa(`/admin/orders/${adminOrderId}`); await measure('admin-order'); }
      }
    }
  } catch (e) {
    log(`  ERROR at ${size.name}: ${e.message.split('\n')[0]}`);
  }
  await browser.close();
}

for (const s of SIZES) {
  log(`== ${s}`);
  await runSize(s);
}

// ---- table
const n = (a) => a.length;
console.log('page'.padEnd(20), 'size'.padEnd(9), 'docOvf bleed touch input tiny clip stretch fixOvl | inline');
for (const r of results) {
  console.log(r.page.padEnd(20), r.size.padEnd(9), String(r.overflowDoc).padStart(6), String(n(r.bleed)).padStart(5), String(n(r.touch)).padStart(5), String(n(r.input)).padStart(5), String(n(r.tiny)).padStart(4), String(n(r.clipped)).padStart(4), String(n(r.stretched)).padStart(7), String(n(r.fixedOverlap)).padStart(6), '|', n(r.inline));
}
const tot = (k) => results.reduce((a, r) => a + (k === 'overflowDoc' ? (r.overflowDoc > 0 ? 1 : 0) : n(r[k])), 0);
console.log(`TOTAL docOverflowPages=${tot('overflowDoc')} bleed=${tot('bleed')} touch=${tot('touch')} input=${tot('input')} tiny=${tot('tiny')} clipped=${tot('clipped')} stretched=${tot('stretched')} fixedOverlap=${tot('fixedOverlap')}`);
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(results, null, 1));
