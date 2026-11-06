import { create } from 'zustand';

export const useUi = create((set) => ({
  cartOpen: false,
  menuOpen: false,
  announcement: '',
  snackbar: null, // { message, actionLabel?, onAction? }
  bumpTick: 0,
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  openMenu: () => set({ menuOpen: true }),
  closeMenu: () => set({ menuOpen: false }),
  // Re-announce identical text by toggling a zero-width suffix.
  announce: (text) => set((s) => ({ announcement: s.announcement === text ? `${text}​` : text })),
  showSnackbar: (snackbar) => set({ snackbar }),
  hideSnackbar: () => set({ snackbar: null }),
  bump: () => set((s) => ({ bumpTick: s.bumpTick + 1 })),
}));
