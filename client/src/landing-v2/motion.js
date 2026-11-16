import { useEffect, useLayoutEffect } from 'react';

// GSAP + ScrollTrigger are imported on demand (after first paint), so neither is in the initial JS for `/`.
// Every section builds its tweens inside one gsap.context scoped to its own root, and the context is reverted on
// unmount: navigating / -> /g10 -> back leaves no stale pins or triggers behind. No Lenis on the landing (the /g10
// story runs its own), only native scroll.
let gsapPromise = null;
export function loadGsap() {
  if (!gsapPromise) {
    gsapPromise = Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([g, st]) => {
      const gsap = g.gsap || g.default;
      const ScrollTrigger = st.ScrollTrigger || st.default;
      gsap.registerPlugin(ScrollTrigger);
      gsap.defaults({ ease: 'expo.out' });
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
// The index of the landing section holding `el` (0 = hero), for refresh ordering.
function sectionOrder(el) {
  const sec = el.closest('#landing-v2 > section') || el.closest('section');
  if (!sec?.parentElement) return 0;
  return Array.prototype.indexOf.call(sec.parentElement.children, sec);
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
      const before = new Set(ScrollTrigger.getAll());
      ctx = gsap.context(() => {
        extra = build(gsap, ScrollTrigger, root, SplitText);
      }, root);
      // Sections build at different times (the shelf waits for its products), but pins must be measured top-down:
      // each pin's spacer moves everything after it. Rank this section's triggers by its place on the page.
      const order = sectionOrder(root);
      ScrollTrigger.getAll().forEach((st) => {
        if (!before.has(st)) st.refreshPriority = 1000 - order;
      });
      ScrollTrigger.sort();
      // Images and fonts above may still be settling: re-measure once everything has laid out.
      requestAnimationFrame(() => ScrollTrigger.refresh());
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
