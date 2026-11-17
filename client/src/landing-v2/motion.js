import { useEffect, useLayoutEffect } from 'react';

// GSAP + ScrollTrigger are imported on demand (after first paint), so neither is in the initial JS for `/`.
// Every section builds its tweens inside one gsap.context scoped to its own root, and the context is reverted on
// unmount: navigating / -> /g10 -> back leaves no stale pins or triggers behind. Smooth
// scrolling (Lenis) lives in smooth.js.
let gsapPromise = null;
export function loadGsap() {
  if (!gsapPromise) {
    gsapPromise = Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([g, st]) => {
      const gsap = g.gsap || g.default;
      const ScrollTrigger = st.ScrollTrigger || st.default;
      gsap.registerPlugin(ScrollTrigger);
      gsap.defaults({ ease: 'expo.out' });
      // Refresh in page order, every time. Each pin's spacer pushes everything below it down, so a pin must be measured
      // after every pin above it. Triggers are created in whatever order sections happen to build (the shelf waits for
      // its products; gsap.matchMedia rebuilds a section's triggers when the window crosses a breakpoint and appends
      // them last). Re-sorting by DOM position at the start of each refresh makes the order independent of build time.
      // Only on the landing: /g10 builds its own triggers in order and is left alone.
      ScrollTrigger.addEventListener('refreshInit', () => {
        if (document.getElementById('landing-v2')) ScrollTrigger.sort(byPageOrder);
      });
      if (import.meta.env?.DEV) {
        window.__ST = ScrollTrigger; // dev only: the overlap check (and you, in the console) can read the live triggers
        ScrollTrigger.addEventListener('refresh', () => assertPinsInOrder(ScrollTrigger));
      }
      return { gsap, ScrollTrigger };
    });
  }
  return gsapPromise;
}

// SplitText ships free with GSAP 3.13. Loaded with the rest of the motion code, only when motion runs.
let splitPromise = null;
export function loadSplitText() {
  if (!splitPromise) {
    splitPromise = Promise.all([loadGsap(), import('gsap/SplitText')]).then(([{ gsap }, m]) => {
      const SplitText = m.SplitText || m.default;
      gsap.registerPlugin(SplitText);
      return SplitText;
    });
  }
  return splitPromise;
}

// The fixed AppBar's height (Layout keeps --appbar-h current). Pinned scenes sit under the translucent bar on
// purpose (full-bleed stages) and pad their copy by this much.
export const appbarH = () => {
  if (typeof window === 'undefined') return 64;
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--appbar-h')) || 64;
};

// Screen tiers the scenes branch on (gsap.matchMedia keys).
export const MQ = {
  desk: '(min-width: 900px)',
  phone: '(max-width: 899.95px)',
};

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// useSectionMotion(ref, (gsap, ScrollTrigger, root) => { ...tweens... }, deps)
// Skipped entirely under reduced motion (the markup's resting state is the final state) and in jsdom.
// Page (DOM) order of two triggers. Same element (e.g. the shelf's "enter" and its pin): keep creation order (stable
// sort). Triggers without an element go last.
export function byPageOrder(a, b) {
  const ea = a.trigger;
  const eb = b.trigger;
  if (!ea || !eb) return (ea ? 0 : 1) - (eb ? 0 : 1);
  if (ea === eb) return 0;
  const pos = ea.compareDocumentPosition(eb);
  if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1; // b after a (or inside a)
  if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
  return 0;
}

let refreshQueued = false;
function scheduleRefresh(ScrollTrigger) {
  if (refreshQueued) return;
  refreshQueued = true;
  requestAnimationFrame(() => {
    refreshQueued = false;
    ScrollTrigger.refresh();
  });
}

// Dev-only guard: after every refresh, the landing's pins must not overlap in scroll space (a pin that starts before
// the one above it releases means two scenes are fixed on screen at once). Logs loudly; the Playwright check and
// anyone with the console open will see it.
export function assertPinsInOrder(ScrollTrigger) {
  const root = document.getElementById('landing-v2');
  if (!root) return [];
  const pins = ScrollTrigger.getAll().filter((s) => s.pin && root.contains(s.pin)).sort(byPageOrder);
  const errs = [];
  const seen = new Set();
  pins.forEach((p, i) => {
    if (seen.has(p.pin)) errs.push(`pinned twice: ${p.pin.closest('section')?.id}`);
    seen.add(p.pin);
    const prev = pins[i - 1];
    if (prev && p.start < prev.end - 1) errs.push(`${p.pin.closest('section')?.id} starts at ${Math.round(p.start)} before ${prev.pin.closest('section')?.id} releases at ${Math.round(prev.end)}`);
  });
  if (errs.length) console.error('[landing] pin overlap:', errs.join('; '));
  return errs;
}

// With { split: true } the build also receives SplitText as its 4th argument.
export function useSectionMotion(ref, build, deps = [], { split = false } = {}) {
  useIso(() => {
    if (typeof window === 'undefined' || prefersReducedMotion() || !window.IntersectionObserver) return undefined;
    let ctx = null;
    let extra = null;
    let dead = false;
    // Split text waits for the web font, so the letters are measured in the face they will be drawn in.
    Promise.all([loadGsap(), split ? loadSplitText() : null, split ? document.fonts?.ready : null]).then(([{ gsap, ScrollTrigger }, SplitText]) => {
      if (dead || !ref.current) return;
      ref.current.setAttribute('data-motion', 'on');
      const root = ref.current;
      ctx = gsap.context(() => {
        extra = build(gsap, ScrollTrigger, root, SplitText);
      }, root);
      // Sections build at different times, but pins must be measured top-down: one refresh (which sorts by page
      // order, see loadGsap) once this section has laid out. Coalesced, so 6 sections building cost one refresh.
      scheduleRefresh(ScrollTrigger);
    }).catch(() => {});
    return () => {
      dead = true;
      if (typeof extra === 'function') extra();
      ctx?.revert();
      ref.current?.removeAttribute('data-motion');
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

// Keep every trigger's start/end true while the landing settles (web fonts, product data, a restored scroll position
// after coming back from /g10): when the landing's own height changes, refresh ScrollTrigger once (debounced).
// Scoped to the landing root and disconnected on unmount, so it never touches the /g10 story.
export function useRefreshOnResize(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined' || prefersReducedMotion()) return undefined;
    let t = null;
    let last = el.offsetHeight;
    const kick = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        loadGsap().then(({ ScrollTrigger }) => ScrollTrigger.refresh()).catch(() => {});
      }, 180);
    };
    const ro = new ResizeObserver(() => {
      const h = el.offsetHeight;
      if (Math.abs(h - last) < 2) return;
      last = h;
      kick();
    });
    ro.observe(el);
    // The AppBar height differs per breakpoint: pins measured against it are refreshed when it changes.
    const bar = document.querySelector('header');
    let barLast = bar?.offsetHeight;
    const roBar = bar ? new ResizeObserver(() => {
      if (bar.offsetHeight === barLast) return;
      barLast = bar.offsetHeight;
      kick();
    }) : null;
    if (bar) roBar.observe(bar);
    document.fonts?.ready?.then(kick);
    if (document.readyState !== 'complete') window.addEventListener('load', kick, { once: true });
    kick();
    return () => {
      clearTimeout(t);
      ro.disconnect();
      roBar?.disconnect();
      window.removeEventListener('load', kick);
    };
  }, [ref]);
}

// Magnetic hover for primary buttons: only on a fine pointer that can hover, never under reduced motion.
export function magnetic(el, strength = 0.25) {
  if (!el || typeof window === 'undefined') return () => {};
  if (!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches || prefersReducedMotion()) return () => {};
  const move = (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  };
  const leave = () => {
    el.style.transform = '';
  };
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerleave', leave);
  return () => {
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerleave', leave);
    leave();
  };
}
