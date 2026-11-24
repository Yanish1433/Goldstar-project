import { useContext, useLayoutEffect, useRef } from 'react';
// UNSAFE_DataRouterStateContext: read-only, stable in v7; it holds router.state.restoreScrollPosition, the y that
// <ScrollRestoration/> saved when the shopper left this history entry (see the POP effect below).
import { UNSAFE_DataRouterStateContext, useLocation, useNavigationType } from 'react-router';

// Opening another page (PUSH/REPLACE to a different pathname, no #hash) always starts at the top, before paint.
// Back/Forward (POP) is restored by <ScrollRestoration/> at commit and then held there while the page settles (below);
// a same-path change (?colour= switch) never moves the page.
// Lenis (landing, /g10) is zeroed too: its destroy runs in a passive effect, so a still-easing instance could
// otherwise write its old position back after the reset. A short settle guard re-zeroes if anything (late content,
// anchoring, a stray focus) moves the page in the first second; it stops at the first wheel/touch/key/pointer input.
export const SETTLE_MS = 1000;

// Back/Forward: the page often has less height at commit than when the shopper left (skeletons, lazy sections, pinned
// scenes), so the browser clamps <ScrollRestoration/>'s scrollTo, or content above grows afterwards. Re-apply the saved
// y until the page has been stable for a moment. Cancelled by the first wheel/touch/key/pointer input.
export const RESTORE_MS = 4000;
export const RESTORE_STABLE_MS = 700;
// 'apply': target reachable but we are elsewhere; 'wait': page not tall enough yet; 'done': already there.
export function restoreStep({ target, scrollY, maxScroll }) {
  if (maxScroll + 0.5 < target) return 'wait';
  return Math.abs(scrollY - target) > 1 ? 'apply' : 'done';
}

const INPUTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
// Calls stop() on the first user input; returns the remover.
function stopOnInput(stop) {
  INPUTS.forEach((e) => window.addEventListener(e, stop, { passive: true, once: true }));
  return () => INPUTS.forEach((e) => window.removeEventListener(e, stop));
}

export function scrollToY(y) {
  try { window.__lenis?.scrollTo(y, { immediate: true, force: true }); } catch { /* ignore */ }
  window.scrollTo({ top: y, left: 0, behavior: 'instant' });
}

export function scrollToTop() {
  try { window.__lenis?.scrollTo(0, { immediate: true, force: true }); } catch { /* ignore */ }
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

// Product page colour switch: bring the shopper up to the shoe in its new colour. Smooth (instant under reduced
// motion); nothing when already near the top. Lenis (landing/story only) is driven too if present.
export function scrollTopForColour() {
  if (window.scrollY < 8) return;
  const reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  try { window.__lenis?.scrollTo(0, { immediate: reduced }); } catch { /* ignore */ }
  window.scrollTo({ top: 0, left: 0, behavior: reduced ? 'instant' : 'smooth' });
}

export default function RouteScrollTop() {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();
  const prev = useRef(pathname);
  useLayoutEffect(() => {
    if (prev.current === pathname) return undefined;
    prev.current = pathname;
    if (navType === 'POP' || hash) return undefined;
    scrollToTop();
    let raf = 0;
    const start = performance.now();
    let unlisten = () => {};
    const stop = () => { cancelAnimationFrame(raf); unlisten(); };
    unlisten = stopOnInput(stop);
    const tick = () => {
      if (window.scrollY > 0) {
        if (import.meta.env?.DEV) console.debug('[RouteScrollTop] guard re-zeroed from', window.scrollY);
        scrollToTop();
      }
      if (performance.now() - start < SETTLE_MS) raf = requestAnimationFrame(tick);
      else stop();
    };
    raf = requestAnimationFrame(tick);
    return stop;
  }, [pathname, hash, navType]);

  // POP: hold the saved position while the page settles. The target is snapshotted from the router when the entry
  // commits, before anything scrolls (the clamp's scroll event would otherwise overwrite a self-kept copy).
  const state = useContext(UNSAFE_DataRouterStateContext);
  const saved = state?.restoreScrollPosition;
  const { key } = useLocation();
  useLayoutEffect(() => {
    if (navType !== 'POP' || hash || typeof saved !== 'number' || saved <= 0) return undefined;
    const target = saved;
    const root = document.documentElement;
    const prevAnchor = root.style.overflowAnchor;
    root.style.overflowAnchor = 'none';
    let raf = 0;
    let lastH = -1;
    let stableSince = performance.now();
    const start = stableSince;
    let unlisten = () => {};
    const stop = () => {
      cancelAnimationFrame(raf);
      unlisten();
      root.style.overflowAnchor = prevAnchor;
    };
    unlisten = stopOnInput(stop);
    const tick = () => {
      const now = performance.now();
      const h = root.scrollHeight;
      if (h !== lastH) { lastH = h; stableSince = now; }
      const step = restoreStep({ target, scrollY: window.scrollY, maxScroll: h - window.innerHeight });
      if (step === 'apply') { scrollToY(target); stableSince = now; }
      if (now - start > RESTORE_MS || (step === 'done' && now - stableSince > RESTORE_STABLE_MS)) stop();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return stop;
  }, [key, navType, hash, saved]);
  return null;
}
