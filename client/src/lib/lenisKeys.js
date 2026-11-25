// Lenis only follows a native scroll when it is idle, and Chrome drops its own keyboard scroll while Lenis is
// gliding (wheel or scrollTo). So Home/End/PageUp/PageDown/Space/arrows pressed mid-glide did nothing, or the page
// slid back to the old glide target. Fix: while Lenis is gliding, the key steers the glide itself (Home → top,
// End → bottom, a page or an arrow step from where the page is now). When Lenis is idle the browser handles keys.
const KEYS = new Set(['Home', 'End', 'PageUp', 'PageDown', ' ', 'Spacebar', 'ArrowUp', 'ArrowDown']);
const SOFT = new Set([' ', 'Spacebar', 'ArrowUp', 'ArrowDown']); // keys other widgets use for themselves
const ARROW_STEP = 40;
const PAGE = 0.875; // Chrome scrolls ~87.5% of the viewport per page

const closest = (t, sel) => (t && typeof t.closest === 'function' ? t.closest(sel) : null);

export function shouldReleaseGlide(e) {
  if (!e || e.defaultPrevented || !KEYS.has(e.key)) return false;
  if (e.altKey || e.metaKey) return false;
  if (e.ctrlKey && !(e.key === 'Home' || e.key === 'End')) return false;
  const t = e.target;
  if (closest(t, 'input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return false;
  if (SOFT.has(e.key) && closest(t, 'button, a[href], [role="radio"], [role="slider"], [role="button"], [role="tab"], [role="option"], [role="menuitem"]')) return false;
  return true;
}

/** Where a scroll key should take the page, given the current scroll, the max scroll and the viewport height. */
export function keyTarget(e, y, limit, vh) {
  const page = PAGE * vh;
  let t;
  switch (e.key) {
    case 'Home': t = 0; break;
    case 'End': t = limit; break;
    case 'PageUp': t = y - page; break;
    case 'PageDown': t = y + page; break;
    case ' ': case 'Spacebar': t = y + (e.shiftKey ? -page : page); break;
    case 'ArrowUp': t = y - ARROW_STEP; break;
    case 'ArrowDown': t = y + ARROW_STEP; break;
    default: return null;
  }
  return Math.max(0, Math.min(limit, t));
}

export function bindGlideRelease(lenis) {
  const onKey = (e) => {
    if (lenis.isScrolling !== 'smooth' || !shouldReleaseGlide(e)) return;
    const y = window.scrollY;
    const limit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const target = keyTarget(e, y, limit, window.innerHeight);
    if (target == null) return;
    e.preventDefault();
    lenis.reset(); // drop the old glide target
    lenis.scrollTo(target);
  };
  window.addEventListener('keydown', onKey, true);
  return () => window.removeEventListener('keydown', onKey, true);
}
