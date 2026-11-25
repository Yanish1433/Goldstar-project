import { useEffect } from 'react';
import { loadGsap, appbarH } from './motion.js';
import { bindGlideRelease } from '../lib/lenisKeys.js';

// Smooth scrolling for the landing: Lenis, driven by the GSAP ticker (the same pattern as the /g10 story engine:
// autoRaf off, lenis.raf on gsap.ticker, ScrollTrigger.update on every Lenis scroll, lagSmoothing(0) while it runs).
//  - One instance at a time, page-wide: `window.__lenis` is the shared owner slot (/g10 uses it too). The landing
//    never creates a second one, and it only clears the slot if the instance there is its own.
//  - Off under reduced motion and on touch / no-hover devices (native momentum is better there). The media queries
//    are watched: switching (e.g. a 2-in-1 going to tablet mode) tears it down or brings it back live.
//  - Lenis and gsap load after first paint, so neither is in the initial JS for `/`.
//  - Modals (quick view, the mobile menu) keep native scroll: the page behind them must not move.
const OFF_QUERIES = ['(prefers-reduced-motion: reduce)', '(pointer: coarse)', '(hover: none)'];
export const LENIS_OPTS = { autoRaf: false, lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, syncTouch: false };

let lenisPromise = null;
const loadLenis = () => {
  if (!lenisPromise) lenisPromise = import('lenis').then((m) => m.default || m.Lenis);
  return lenisPromise;
};

export function startLenis(gsap, ScrollTrigger, Lenis) {
  if (window.__lenis) return () => {}; // someone already owns the page scroll
  const lenis = new Lenis({
    ...LENIS_OPTS,
    // In-page #anchors scroll smoothly and clear the fixed AppBar.
    anchors: { offset: -appbarH() },
    prevent: (node) => !!node.closest?.('.MuiModal-root, [role="dialog"]'),
  });
  lenis.on('scroll', ScrollTrigger.update);
  const raf = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis;
  const unbindKeys = bindGlideRelease(lenis);
  return () => {
    unbindKeys();
    gsap.ticker.remove(raf);
    lenis.destroy();
    if (window.__lenis === lenis) window.__lenis = null;
    if (!window.__lenis) gsap.ticker.lagSmoothing(500, 33); // GSAP's default, only when nobody else smooths
  };
}

export function useLandingLenis() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mqs = OFF_QUERIES.map((q) => window.matchMedia(q));
    let stop = null;
    let gen = 0; // each decide() bumps it; a late async start for an older decision is dropped
    let alive = true;
    const decide = () => {
      const my = ++gen;
      const off = mqs.some((m) => m.matches);
      if (off) {
        stop?.();
        stop = null;
        return;
      }
      if (stop) return;
      Promise.all([loadGsap(), loadLenis()]).then(([{ gsap, ScrollTrigger }, Lenis]) => {
        if (!alive || my !== gen || stop) return;
        stop = startLenis(gsap, ScrollTrigger, Lenis);
      }).catch(() => {});
    };
    decide();
    mqs.forEach((m) => m.addEventListener?.('change', decide));
    return () => {
      alive = false;
      mqs.forEach((m) => m.removeEventListener?.('change', decide));
      stop?.();
      stop = null;
    };
  }, []);
}
