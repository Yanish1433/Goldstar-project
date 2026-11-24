// Story time (vh units) as a pure function of the scroll position: 0 at/before the story's start, `total` at/after
// its end, linear between. The engine uses it every tick so the DOM timeline and the canvas can never be left on a
// stale time when a scroll update was missed (fast fling, refresh mid-scroll, native jump bypassing Lenis).
export function scrollToTime(scroll, start, end, total) {
  const span = end - start;
  if (!(span > 0) || !Number.isFinite(scroll)) return 0;
  const p = (scroll - start) / span;
  return Math.min(1, Math.max(0, p)) * total;
}
