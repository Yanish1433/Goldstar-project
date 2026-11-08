import { useCart } from '../store/cart.js';
import { useUi } from '../store/ui.js';
import { playSparkles } from './sparkles.js';

export const makeLine = (product, colourway, size, qty = 1) => ({
  productId: product.id,
  slug: product.slug,
  name: product.name,
  colourwayKey: colourway.key,
  colourwayName: colourway.name,
  size: String(size),
  qty,
  unitPrice: colourway.price,
  image: colourway.images?.[0]?.thumb || colourway.images?.[0]?.src || colourway.image?.thumb || colourway.image?.src || null,
});

export const addedText = (line) => `Added ${line.name}, ${line.colourwayName}, UK ${line.size} to your cart.`;

// Feedback after a cart add (announcement + snackbar). Called on landing for the 3D flight.
export function notifyAdded(line) {
  const ui = useUi.getState();
  ui.announce(addedText(line));
  ui.showSnackbar({ message: 'Added to cart', actionLabel: 'View cart', onAction: () => useUi.getState().openCart() });
}

// Instant add (Shop, Product, static tier). Returns { ok, reason }.
export function addToCartNow(line) {
  const res = useCart.getState().add(line);
  if (!res.ok) {
    useUi.getState().showSnackbar({ message: 'Your cart is full (10 lines). Remove one to add another.' });
    useUi.getState().announce('Your cart is full.');
    return res;
  }
  useUi.getState().bump();
  notifyAdded(line);
  return res;
}

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Pick the first element whose rect is meaningfully inside the viewport (shoe photo, else the button).
export function pickSourceRect(...els) {
  const vh = window.innerHeight;
  for (const el of els) {
    const r = el?.getBoundingClientRect?.();
    if (r && r.width > 0 && r.bottom > 40 && r.top < vh - 40) return { left: r.left, top: r.top, width: r.width, height: r.height };
  }
  const r = els.find(Boolean)?.getBoundingClientRect?.();
  return r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null;
}

// Public API: gold sparkles burst from `sourceRect` (viewport rect of the button / product photo) and stream to the
// cart icon; onLand runs once when they arrive (~720 ms). Returns true if animating. Reduced motion or no 2D canvas:
// onLand runs at once and it returns false.
export function playAddToCart({ sourceRect, onLand } = {}) {
  if (reducedMotion()) {
    onLand?.();
    return false;
  }
  return playSparkles({ sourceRect, onLand });
}

// Add a line with the sparkles: the badge count, bump and toast are held until the sparkles reach the cart.
export function addToCartAnimated(line, { sourceRect } = {}) {
  if (reducedMotion()) return addToCartNow(line);
  const res = useCart.getState().add(line);
  if (!res.ok) return addToCartNow(line); // full: reuse the message path
  useCart.getState().startFlight();
  const land = () => {
    useCart.getState().endFlight();
    useUi.getState().bump();
    notifyAdded(line);
  };
  playAddToCart({ sourceRect, onLand: land });
  return res;
}
