import { useLocation, useOutlet } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';

// Route transition (Addendum B S4), enter only: opacity 0 -> 1 and a 12 px rise in 240 ms (ease-out); reduced motion:
// opacity only, 120 ms. An exit animation would have to keep the previous route element mounted, and that element
// re-evaluates its guards against the NEW location (RequireAuth then redirects in a loop), so the exit is skipped.
// Not used on Home (its fixed canvas must not sit inside a transformed parent) or for hash links. After the enter,
// focus moves to the page's h1 (tabindex -1).
export default function RouteTransition() {
  const outlet = useOutlet();
  const { pathname } = useLocation();
  const reduced = useReducedMotion();
  const focusH1 = () => {
    const h = document.querySelector('main h1');
    if (h) {
      h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
  };
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: reduced ? 0 : 12 }}
      animate={{ opacity: 1, y: 0, transition: { duration: reduced ? 0.12 : 0.24, ease: [0.22, 1, 0.36, 1] } }}
      onAnimationComplete={focusH1}
    >
      {outlet}
    </motion.div>
  );
}
