import { useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { FINALE, HOLD, PALETTE, SECTIONS, START, TOTAL, TRANSITION, copyTrack, endOf } from './storyline.js';
import { live, touch } from './state.js';
import { scrollToTime } from './scrollTime.js';

gsap.registerPlugin(ScrollTrigger);

const colourOf = (i) => PALETTE[SECTIONS[i].colour];

// The story's screen height: the SMALL viewport (100svh: the browser bars shown), so panels, pins, the canvas and the
// scrub all use one height that does not jump when a phone's URL bar slides away (which only resizes innerHeight).
// Desktop: equal to innerHeight. Older browsers without svh: innerHeight.
let probe = null;
export function stageHeight() {
  if (typeof document === 'undefined') return 0;
  if (!probe) {
    probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none';
  }
  if (!probe.isConnected) document.body.appendChild(probe);
  const h = probe.getBoundingClientRect().height;
  return h > 0 ? Math.min(h, window.innerHeight) : window.innerHeight;
}

// The one scroll owner. Motion mode: Lenis smooths the native scroll and drives ScrollTrigger from the GSAP
// ticker; each section is pinned for its `pin` vh; one master timeline (duration = TOTAL vh) is scrubbed by
// the story's scroll and carries every DOM animation (copy in/out, background + ink crossfade, the brand
// finale). The canvas reads `live.T` (the same time) on the same ticker.
// Reduced motion / static: no Lenis, no pins, no scrub. Sections flow at one screen each; the current section
// (IntersectionObserver) sets the pose instantly and the background fades.
export function useStoryEngine({ rootRef, bgRef, reduced, onTime }) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    const bg = bgRef.current;
    if (!root || !bg) return undefined;
    const doc = document.documentElement;
    const setVh = () => {
      const h = stageHeight();
      live.vh = h / 100;
      root.style.setProperty('--stage-h', `${h}px`);
      document.documentElement.style.setProperty('--stage-h', `${h}px`); // the fixed canvas + poster outside #story
    };
    setVh();

    if (reduced) {
      const els = SECTIONS.map((s) => root.querySelector(`#story-${s.id}`));
      const apply = (i) => {
        const pal = colourOf(i);
        bg.style.backgroundColor = pal.bg;
        doc.style.setProperty('--story-ink', pal.ink);
        live.T = HOLD[SECTIONS[i].id];
        touch();
        onTime?.(live.T, i);
      };
      apply(0);
      const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => e.isIntersecting && apply(els.indexOf(e.target))),
        { rootMargin: '-45% 0px -45% 0px' },
      );
      els.forEach((el) => el && io.observe(el));
      return () => {
        io.disconnect();
        doc.style.removeProperty('--story-ink');
      };
    }

    ScrollTrigger.config({ ignoreMobileResize: true });
    const lenis = new Lenis({ autoRaf: false, lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis; // used by in-page links (scroll to a section)

    const vh = () => live.vh;
    let scrub = null;
    let syncing = false;
    // After every Lenis frame, re-derive the story time from the real scroll position. onUpdate is the fast path;
    // this makes the time a pure function of scroll even when an update was missed (fast fling to the top, a refresh
    // mid-scroll, a native jump), so the hero can never stay on a stale mid-story frame.
    const sync = () => {
      if (!scrub || syncing) return;
      const T = scrollToTime(scrub.scroll(), scrub.start, scrub.end, TOTAL);
      if (Math.abs(T - live.T) < 1e-3) return;
      syncing = true;
      tlRef.time(T);
      live.T = T;
      touch();
      onTime?.(T);
      syncing = false;
    };
    let tlRef = null;
    const ctx = gsap.context(() => {
      // 1. Pins, in DOM order.
      SECTIONS.forEach((s) => {
        ScrollTrigger.create({
          trigger: `#story-${s.id}`,
          start: 'top top',
          end: () => `+=${s.pin * vh()}`,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
        });
      });

      // 2. Master timeline in vh units.
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
      tl.set({}, {}, TOTAL);
      tlRef = tl;

      // Background + ink crossfades during each transition.
      bg.style.backgroundColor = colourOf(0).bg;
      doc.style.setProperty('--story-ink', colourOf(0).ink);
      for (let i = 0; i < SECTIONS.length - 1; i += 1) {
        const t0 = endOf(SECTIONS[i].id);
        // Short, centred crossfade: less time spent in the muddy midpoint between two bold colours.
        tl.fromTo(bg, { backgroundColor: colourOf(i).bg }, { backgroundColor: colourOf(i + 1).bg, duration: TRANSITION * 0.55, ease: 'power2.inOut', immediateRender: false }, t0 + TRANSITION * 0.2);
        tl.fromTo(doc, { '--story-ink': colourOf(i).ink }, { '--story-ink': colourOf(i + 1).ink, duration: TRANSITION * 0.4, immediateRender: false }, t0 + TRANSITION * 0.3);
      }

      // Copy: rises in (staggered) while its panel slides up, leaves upward at the end of its pin.
      SECTIONS.forEach((s) => {
        const els = root.querySelectorAll(`#story-${s.id} [data-copy]`);
        if (!els.length) return;
        const tr = copyTrack(s.id);
        if (tr.in) tl.fromTo(els, { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: tr.in[1] - tr.in[0], stagger: 7, ease: 'power3.out' }, tr.in[0]);
        if (tr.out) tl.fromTo(els, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -60, duration: tr.out[1] - tr.out[0], stagger: 3, ease: 'power2.in', immediateRender: false }, tr.out[0]);
      });

      // Grip: the real sole photo slides in beside the boot.
      const slide = root.querySelector('#story-sole [data-slide]');
      if (slide) tl.fromTo(slide, { xPercent: 60, rotate: 8, autoAlpha: 0 }, { xPercent: 0, rotate: 0, autoAlpha: 1, duration: 90, ease: 'power3.out' }, START.sole - 70);

      // Brand finale.
      const fin = root.querySelector('#story-finale');
      if (fin) {
        const letters = fin.querySelectorAll('[data-letter]');
        const star = fin.querySelector('[data-star]');
        const starPath = fin.querySelector('[data-star-path]');
        const sub = fin.querySelectorAll('[data-sub]');
        const glow = fin.querySelector('[data-glow]');
        const word = fin.querySelector('[data-word]');
        const line = fin.querySelector('[data-line]');
        if (line) tl.fromTo(line, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: FINALE.line[1] - FINALE.line[0], ease: 'power3.out' }, FINALE.line[0]);
        const [l0, l1] = FINALE.letters;
        tl.fromTo(letters, { yPercent: 115, rotate: 6 }, { yPercent: 0, rotate: 0, duration: (l1 - l0) * 0.55, stagger: ((l1 - l0) * 0.45) / Math.max(1, letters.length - 1), ease: 'power4.out' }, l0);
        if (star && starPath) {
          const len = starPath.getTotalLength ? starPath.getTotalLength() : 100;
          gsap.set(starPath, { strokeDasharray: len });
          const [s0, s1] = FINALE.star;
          tl.fromTo(starPath, { strokeDashoffset: len, fillOpacity: 0 }, { strokeDashoffset: 0, duration: (s1 - s0) * 0.7 }, s0);
          tl.to(starPath, { fillOpacity: 1, duration: (s1 - s0) * 0.3 }, s0 + (s1 - s0) * 0.7);
          tl.fromTo(star, { rotate: -220, scale: 0.4 }, { rotate: 0, scale: 1, duration: s1 - s0, ease: 'power3.out' }, s0);
        }
        tl.fromTo(sub, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: FINALE.sub[1] - FINALE.sub[0], stagger: 8, ease: 'power2.out' }, FINALE.sub[0]);
        if (glow) tl.fromTo(glow, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: FINALE.settle[1] - FINALE.settle[0], ease: 'power1.out' }, FINALE.settle[0]);
        if (word) tl.fromTo(word, { letterSpacing: '0.06em' }, { letterSpacing: '0em', duration: FINALE.settle[1] - FINALE.letters[0], ease: 'power2.out' }, FINALE.letters[0]);
      }

      // 3. The scrub: story scroll (px) -> timeline time (vh). Exact: no extra smoothing (Lenis already smooths).
      scrub = ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: () => `+=${TOTAL * vh()}`,
        onUpdate: (self) => {
          const T = self.progress * TOTAL;
          tl.time(T);
          live.T = T;
          touch();
          onTime?.(T);
        },
        onRefresh: (self) => {
          const T = self.progress * TOTAL;
          tl.time(T);
          live.T = T;
          setVh();
          touch();
          onTime?.(T);
        },
      });
    }, root);
    gsap.ticker.add(sync);

    // Recompute pins after fonts settle (headline heights) and the first layout.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready?.then(refresh);
    const onResize = () => setVh();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      ctx.revert();
      gsap.ticker.remove(raf);
      gsap.ticker.remove(sync);
      lenis.destroy();
      if (window.__lenis === lenis) window.__lenis = null;
      doc.style.removeProperty('--story-ink');
      doc.style.removeProperty('--stage-h');
    };
  }, [rootRef, bgRef, reduced]); // eslint-disable-line react-hooks/exhaustive-deps
}

// Scroll to the start of a section's pin (Lenis when present, native otherwise).
export function scrollToSection(id, offset = 0) {
  const target = (START[id] + offset) * (live.vh > 1 ? live.vh : window.innerHeight / 100);
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    document.getElementById(`story-${id}`)?.scrollIntoView({ block: 'start' });
    return;
  }
  if (window.__lenis) window.__lenis.scrollTo(target, { duration: 1.6 });
  else window.scrollTo({ top: target, behavior: 'smooth' });
}
