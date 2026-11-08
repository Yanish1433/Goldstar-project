import { create } from 'zustand';

let boxSeq = 0;
let boxTimer = null;

export const useUi = create((set, get) => ({
  cartOpen: false,
  menuOpen: false,
  announcement: '',
  snackbar: null, // { message, actionLabel?, onAction? }
  bumpTick: 0,
  cartBox: null, // active box-into-cart request: { id, colour, sourceRect, onLand } (see three/BoxIntoCart.jsx)
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  openMenu: () => set({ menuOpen: true }),
  closeMenu: () => set({ menuOpen: false }),
  // Re-announce identical text by toggling a zero-width suffix.
  announce: (text) => set((s) => ({ announcement: s.announcement === text ? `${text}​` : text })),
  showSnackbar: (snackbar) => set({ snackbar }),
  hideSnackbar: () => set({ snackbar: null }),
  // Start the box-into-cart overlay. Returns false when one is already playing (caller should add instantly).
  startCartBox: (req) => {
    if (get().cartBox) return false;
    const id = ++boxSeq;
    set({ cartBox: { id, colour: req.colour ?? 'black', sourceRect: req.sourceRect ?? null, onLand: req.onLand ?? null } });
    // Safety net: if the canvas cannot finish (context lost, tab hidden, chunk failed), land anyway.
    boxTimer = setTimeout(() => get().landCartBox(id), 6000);
    return true;
  },
  // Fire onLand exactly once (cart icon reached).
  landCartBox: (id) => {
    const b = get().cartBox;
    if (!b || b.id !== id || b.landed) return;
    set({ cartBox: { ...b, landed: true, onLand: null } });
    b.onLand?.();
  },
  endCartBox: (id) => {
    const b = get().cartBox;
    if (!b || b.id !== id) return;
    get().landCartBox(id);
    clearTimeout(boxTimer);
    set({ cartBox: null });
  },
  bump: () => set((s) => ({ bumpTick: s.bumpTick + 1 })),
}));
