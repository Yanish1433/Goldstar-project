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

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// useSectionMotion(ref, (gsap, ScrollTrigger, root) => { ...tweens... }, deps)
// Skipped entirely under reduced motion (the markup's resting state is the final state) and in jsdom.
export function useSectionMotion(ref, build, deps = []) {
  useIso(() => {
    if (typeof window === 'undefined' || prefersReducedMotion() || !window.IntersectionObserver) return undefined;
    let ctx = null;
    let extra = null;
    let dead = false;
    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (dead || !ref.current) return;
      ctx = gsap.context(() => {
        extra = build(gsap, ScrollTrigger, ref.current);
      }, ref.current);
      // Images and fonts above may still be settling: re-measure once everything has laid out.
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }).catch(() => {});
    return () => {
      dead = true;
      if (typeof extra === 'function') extra();
      ctx?.revert();
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
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
