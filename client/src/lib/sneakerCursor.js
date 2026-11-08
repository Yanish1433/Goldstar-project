// Animated sneaker cursor (desktop, fine pointers only). Plain DOM + one rAF loop, transform/opacity only, no React.
// - Position is written straight from every pointermove (no lag): the toe tip is always exactly on the pointer.
// - Only the pose is smoothed (tilt with horizontal travel, a small step bob while moving), settling flat when still.
// - Over links/buttons/cards it grows and kicks (toe up) with an accent ring; on mouse-down it squashes.
// - Fast moves leave a few tread prints that fade.
// - Text fields keep the native text cursor; the boot hides there.
// - Reduced motion: a static boot pinned to the pointer (no lag, bob, kick or prints).

export const CURSOR_QUERY = '(hover: hover) and (pointer: fine)';
export const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

const mq = (win, q) => !!win?.matchMedia?.(q).matches;

// Only for a real mouse/trackpad; never on touch or coarse pointers.
export function shouldEnableCursor(win = typeof window !== 'undefined' ? window : undefined) {
  return !!win && mq(win, CURSOR_QUERY);
}

const INTERACTIVE = 'a[href], button, [role="button"], [role="radio"], [role="tab"], [role="option"], [role="menuitem"], [role="checkbox"], [role="switch"], label, summary, select, .MuiCardActionArea-root, [data-cursor="kick"]';
const TEXT = 'input:not([type="radio"]):not([type="checkbox"]):not([type="range"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="color"]):not([type="file"]), textarea, [contenteditable=""], [contenteditable="true"]';

// Side-view boot (G10-401 silhouette): toe at the left, the hotspot at the toe tip of the sole (1.5, 31).
const W = 48;
const H = 36;
const TIP = { x: 1.5, y: 31 };
const SCALE = 1;
const BOOT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">
  <g stroke="#FFFFFF" stroke-width="2.4" stroke-linejoin="round" paint-order="stroke">
    <path d="M3 29 C3 23.5 6.5 21 12 20 L19.5 18.4 L24.2 9.5 L25.6 3.4 C25.9 1.9 27 1 28.6 1 L38.4 1 C40.2 1 41.3 2.2 41.3 4 L41.3 21.4 C44.2 22.4 46.2 24.6 46.2 27.6 L46.2 29.6 L3 29.6 Z" fill="#16120E"/>
    <path d="M1.6 29 L47 29 L47 31.6 C47 33.4 45.8 34.6 44 34.6 L5 34.6 C3 34.6 1.5 33.2 1.5 31.2 Z" fill="#16120E"/>
  </g>
  <path d="M2.4 30.4 L46.2 30.4" stroke="#FFC21A" stroke-width="1.6" stroke-linecap="round"/>
  <g stroke="#F6F2EA" stroke-width="1.3" stroke-linecap="round" opacity="0.92">
    <path d="M20.6 18.2 L24.6 16.6"/><path d="M22.2 15.2 L26.1 13.6"/><path d="M23.6 12.2 L27.4 10.6"/><path d="M24.8 9.2 L28.4 7.8"/>
  </g>
  <path d="M30 2.4 L30 0.2 L34 0.2 L34 2.4" stroke="#FFC21A" stroke-width="1.4" fill="none" stroke-linejoin="round"/>
  <path d="M8 24.6 C14 23.2 22 23.6 30 25.6" stroke="#F6F2EA" stroke-width="1" fill="none" opacity="0.55"/>
  <g fill="#FFFFFF" opacity="0.5"><rect x="9" y="33" width="3" height="1.2" rx="0.6"/><rect x="17" y="33" width="3" height="1.2" rx="0.6"/><rect x="25" y="33" width="3" height="1.2" rx="0.6"/><rect x="33" y="33" width="3" height="1.2" rx="0.6"/><rect x="40" y="33" width="3" height="1.2" rx="0.6"/></g>
</svg>`;

// A tiny tread print (oval with lugs).
const PRINT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="18" viewBox="0 0 10 18" aria-hidden="true"><g fill="currentColor"><rect x="1" y="0.5" width="8" height="2.2" rx="1.1"/><rect x="0.5" y="4" width="9" height="2.2" rx="1.1"/><rect x="0.5" y="7.5" width="9" height="2.2" rx="1.1"/><rect x="1.5" y="12" width="7" height="2" rx="1"/><rect x="2" y="15.2" width="6" height="2" rx="1"/></g></svg>`;

const BASE_ROT = -14; // toe angled down onto the target
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function css(el, styles) {
  Object.assign(el.style, styles);
  return el;
}

// Mounts the cursor. Returns a cleanup function. Safe to call once per page.
export function mountSneakerCursor({ win = window, doc = document } = {}) {
  if (!shouldEnableCursor(win)) return () => {};
  const reduced = mq(win, REDUCED_QUERY);

  const style = doc.createElement('style');
  style.textContent = `
@media ${CURSOR_QUERY} {
  html.gs-cursor, html.gs-cursor * { cursor: none !important; }
  html.gs-cursor ${TEXT.split(', ').join(`, html.gs-cursor `)} { cursor: text !important; }
}
.gs-cursor-root { position: fixed; left: 0; top: 0; width: 0; height: 0; pointer-events: none; z-index: 2147483000; }
.gs-cursor-root > * { position: absolute; left: 0; top: 0; pointer-events: none; will-change: transform, opacity; }
.gs-cursor-ring { width: 30px; height: 30px; margin: -15px 0 0 -15px; border-radius: 50%; border: 2px solid #2A27E9; box-shadow: 0 0 0 2px rgba(255,255,255,0.9); opacity: 0; transform: scale(0.4); transition: opacity 90ms ease, transform 110ms cubic-bezier(0.22,1,0.36,1); }
.gs-cursor-root[data-hover="true"] .gs-cursor-ring { opacity: 1; transform: scale(1); }
.gs-cursor-dot { width: 6px; height: 6px; margin: -3px 0 0 -3px; border-radius: 50%; background: #16120E; box-shadow: 0 0 0 1.5px #FFFFFF; }
.gs-cursor-print { color: rgba(22,18,14,0.28); transition: opacity 700ms ease; }
.gs-cursor-root[data-hidden="true"] > * { opacity: 0 !important; }
.gs-cursor-boot svg { display: block; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.25)); }
`;
  doc.head.appendChild(style);

  const root = css(doc.createElement('div'), {});
  root.className = 'gs-cursor-root';
  root.setAttribute('aria-hidden', 'true');
  root.dataset.mode = reduced ? 'static' : 'animated';
  root.dataset.hidden = 'true';

  const prints = reduced ? [] : Array.from({ length: 4 }, () => {
    const p = doc.createElement('div');
    p.className = 'gs-cursor-print';
    p.innerHTML = PRINT_SVG;
    p.style.opacity = '0';
    root.appendChild(p);
    return p;
  });
  // The ring is positioned by a wrapper's transform; the ring itself only scales in/out on hover.
  const ring = doc.createElement('div');
  ring.className = 'gs-cursor-ringpos';
  const ringInner = doc.createElement('div');
  ringInner.className = 'gs-cursor-ring';
  ring.appendChild(ringInner);
  const boot = doc.createElement('div');
  boot.className = 'gs-cursor-boot';
  // Pivot at the toe tip so rotation and scale keep the hotspot on the pointer.
  const ox = TIP.x * SCALE;
  const oy = TIP.y * SCALE;
  css(boot, { width: `${W * SCALE}px`, height: `${H * SCALE}px`, marginLeft: `${-ox}px`, marginTop: `${-oy}px`, transformOrigin: `${ox}px ${oy}px` });
  boot.innerHTML = BOOT_SVG.replace(`width="${W}" height="${H}"`, `width="${W * SCALE}" height="${H * SCALE}"`);
  const dot = doc.createElement('div');
  dot.className = 'gs-cursor-dot';
  root.append(ring, boot, dot);
  doc.body.appendChild(root);
  // The native cursor is only hidden once the boot has a position (first move), so a resting mouse never vanishes.

  const mql = win.matchMedia(CURSOR_QUERY);
  const s = {
    x: -100, y: -100, // pointer
    bx: -100, by: -100, // boot (lagged)
    vx: 0, speed: 0, tilt: 0, phase: 0, amp: 0,
    hover: false, kick: 0, kickV: 0, down: false, squash: 0,
    seen: false, text: false, lastPrint: 0, printIdx: 0, lastT: 0, hiddenAttr: 'true', lastMove: 0,
  };

  const place = () => {
    const rot = BASE_ROT + s.tilt + s.kick + Math.sin(s.phase) * 5 * s.amp;
    const lift = -Math.abs(Math.sin(s.phase)) * 3 * s.amp;
    const grow = s.hover ? 1.18 : 1;
    const sx = grow * (1 + 0.12 * s.squash);
    const sy = grow * (1 - 0.2 * s.squash);
    boot.style.transform = `translate3d(${s.bx}px, ${s.by + lift}px, 0) rotate(${rot}deg) scale(${sx}, ${sy})`;
    dot.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
    ring.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
  };

  const dropPrint = (t) => {
    if (reduced || t - s.lastPrint < 90) return;
    s.lastPrint = t;
    const p = prints[s.printIdx++ % prints.length];
    const ang = (Math.atan2(s.lastDy || 0, s.lastDx || 1) * 180) / Math.PI + 90;
    const side = s.printIdx % 2 ? 6 : -6;
    p.style.transition = 'none';
    p.style.opacity = '0.9';
    p.style.transform = `translate3d(${s.bx - 5 + side}px, ${s.by - 9}px, 0) rotate(${ang}deg)`;
    // Next frame: fade.
    win.requestAnimationFrame(() => {
      p.style.transition = '';
      p.style.opacity = '0';
    });
  };

  let raf = 0;
  const tick = (t) => {
    raf = 0;
    const dt = Math.min(0.05, s.lastT ? (t - s.lastT) / 1000 : 1 / 60);
    s.lastT = t;
    const f = (r) => 1 - Math.pow(1 - r, dt * 60); // frame-rate independent smoothing factor
    s.tilt += (clamp(s.vx * 0.01, -14, 14) - s.tilt) * f(0.35);
    s.vx *= Math.pow(0.002, dt); // velocity fades once the mouse stops
    const moving = s.speed > 0.08;
    s.amp += ((moving ? 1 : 0) - s.amp) * f(0.3);
    if (moving) s.phase += dt * clamp(12 + s.speed * 8, 12, 24);
    s.speed *= Math.pow(0.0002, dt);
    // Kick: stiff, critically damped spring toward the hover angle (toe up), settles in about 100 ms.
    const target = s.hover ? 18 : 0;
    s.kickV += ((target - s.kick) * 1600 - s.kickV * 80) * dt;
    s.kick += s.kickV * dt;
    s.squash += ((s.down ? 1 : 0) - s.squash) * f(0.6);
    place();
    const settled = Math.abs(s.tilt) < 0.05 && s.amp < 0.01 && Math.abs(s.kick - target) < 0.05 && Math.abs(s.kickV) < 0.5 && Math.abs(s.squash - (s.down ? 1 : 0)) < 0.01;
    if (!settled) raf = win.requestAnimationFrame(tick);
    else s.lastT = 0;
  };
  const wake = () => {
    if (reduced) {
      s.bx = s.x;
      s.by = s.y;
      s.squash = s.down ? 0.5 : 0;
      place();
      return;
    }
    if (!raf) raf = win.requestAnimationFrame(tick);
  };

  const setHidden = (v) => {
    if (s.hiddenAttr !== v) root.dataset.hidden = s.hiddenAttr = v;
  };
  let lastTarget = null;
  const onMove = (e) => {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    if (!mql.matches) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    const now = e.timeStamp || win.performance.now();
    s.x = e.clientX;
    s.y = e.clientY;
    // Instant: the boot sits on the pointer this very event.
    s.bx = s.x;
    s.by = s.y;
    if (!s.seen) {
      s.seen = true;
      doc.documentElement.classList.add('gs-cursor');
    } else {
      const d = Math.hypot(dx, dy);
      const ms = Math.max(4, now - (s.lastMove || now - 16));
      s.vx = s.vx * 0.5 + (dx / ms) * 1000 * 0.5;
      s.speed = Math.min(4, s.speed * 0.6 + (d / 16) * 0.4);
      s.lastDx = dx;
      s.lastDy = dy;
      if (d > 38) dropPrint(now);
    }
    s.lastMove = now;
    // Hover / text-field checks only when the element under the pointer changes.
    if (e.target !== lastTarget) {
      lastTarget = e.target;
      const el = e.target instanceof win.Element ? e.target : null;
      s.text = !!el?.closest(TEXT);
      const hover = !s.text && !!el?.closest(INTERACTIVE);
      if (hover !== s.hover) {
        s.hover = hover;
        root.dataset.hover = String(hover);
      }
    }
    setHidden(String(s.text));
    place();
    wake();
  };
  // Touch (a phone that misreports, or a touch laptop): the boot gets out of the way and the native cursor returns
  // until a real mouse moves again.
  const park = () => {
    s.seen = false;
    s.down = false;
    setHidden('true');
    doc.documentElement.classList.remove('gs-cursor');
  };
  const onDown = (e) => {
    if (e.pointerType === 'touch') return park();
    if (e.button !== 0) return;
    s.down = true;
    wake();
  };
  const onUp = () => {
    s.down = false;
    wake();
  };
  const onLeave = (e) => {
    if (!e.relatedTarget) setHidden('true');
  };
  const onEnter = () => {
    if (s.seen && !s.text) setHidden('false');
  };

  const onMedia = (e) => {
    if (!e.matches) park();
  };
  mql.addEventListener?.('change', onMedia);
  doc.addEventListener('pointermove', onMove, { passive: true });
  doc.addEventListener('pointerdown', onDown, { passive: true });
  doc.addEventListener('pointerup', onUp, { passive: true });
  doc.addEventListener('mouseout', onLeave, { passive: true });
  doc.addEventListener('mouseover', onEnter, { passive: true });
  win.addEventListener('blur', onUp);

  return () => {
    if (raf) win.cancelAnimationFrame(raf);
    mql.removeEventListener?.('change', onMedia);
    doc.removeEventListener('pointermove', onMove);
    doc.removeEventListener('pointerdown', onDown);
    doc.removeEventListener('pointerup', onUp);
    doc.removeEventListener('mouseout', onLeave);
    doc.removeEventListener('mouseover', onEnter);
    win.removeEventListener('blur', onUp);
    doc.documentElement.classList.remove('gs-cursor');
    root.remove();
    style.remove();
  };
}
