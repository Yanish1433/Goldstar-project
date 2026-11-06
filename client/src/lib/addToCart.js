import { useCart } from '../store/cart.js';
import { useUi } from '../store/ui.js';

export const makeLine = (product, colourway, size, qty = 1) => ({
  productId: product.id,
  slug: product.slug,
  name: product.name,
  colourwayKey: colourway.key,
  colourwayName: colourway.name,
  size: String(size),
  qty,
  unitPrice: colourway.price,
  image: colourway.images?.[0]?.thumb || colourway.images?.[0]?.src || null,
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
