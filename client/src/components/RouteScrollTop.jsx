import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router';

// Opening another page (PUSH/REPLACE to a different pathname, no #hash) always starts at the top, before paint.
// Back/Forward (POP) is left to <ScrollRestoration/>; a same-path change (?colour= switch) never moves the page.
// Lenis (landing, /g10) is zeroed too: its destroy runs in a passive effect, so a still-easing instance could
// otherwise write its old position back after the reset. A short settle guard re-zeroes if anything (late content,
// anchoring, a stray focus) moves the page in the first second; it stops at the first wheel/touch/key/pointer input.
export const SETTLE_MS = 1000;

export function scrollToTop() {
  try { window.__lenis?.scrollTo(0, { immediate: true, force: true }); } catch { /* ignore */ }
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
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
    const stop = () => {
      cancelAnimationFrame(raf);
      INPUTS.forEach((e) => window.removeEventListener(e, stop));
    };
    const INPUTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
    INPUTS.forEach((e) => window.addEventListener(e, stop, { passive: true, once: true }));
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
  return null;
}
