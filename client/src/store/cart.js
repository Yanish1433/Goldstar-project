import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const MAX_QTY = 5;
export const MAX_LINES = 10;
export const CART_KEY = 'gs-cart-v1';

export const lineId = (l) => `${l.productId}|${l.colourwayKey}|${l.size}`;
const clampQty = (q) => Math.min(MAX_QTY, Math.max(1, Math.floor(Number(q) || 1)));

// localStorage is user-editable and survives deploys: keep only well-formed lines (a bad one would crash the header badge,
// the drawer and the checkout totals), clamp quantities, drop repeats and cap the length.
export function sanitizeLines(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const l of raw) {
    if (!l || typeof l !== 'object') continue;
    const { productId, slug, colourwayKey, size } = l;
    if (![productId, slug, colourwayKey].every((v) => typeof v === 'string' && v) || !['string', 'number'].includes(typeof size) || size === '') continue;
    if (!Number.isFinite(l.unitPrice) || l.unitPrice < 0) continue;
    const line = { ...l, size: String(size), qty: clampQty(l.qty) };
    const id = lineId(line);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(line);
    if (out.length >= MAX_LINES) break;
  }
  return out;
}

export const useCart = create(
  persist(
    (set, get) => ({
      lines: [],
      pendingFlights: 0,
      // Returns { ok: boolean, reason?: 'FULL' }
      add: (line) => {
        const lines = get().lines;
        const id = lineId(line);
        const i = lines.findIndex((l) => lineId(l) === id);
        if (i >= 0) {
          const next = lines.slice();
          next[i] = { ...next[i], qty: clampQty(next[i].qty + (line.qty || 1)) };
          set({ lines: next });
          return { ok: true };
        }
        if (lines.length >= MAX_LINES) return { ok: false, reason: 'FULL' };
        set({ lines: [...lines, { ...line, qty: clampQty(line.qty || 1) }] });
        return { ok: true };
      },
      setQty: (id, qty) => set({ lines: get().lines.map((l) => (lineId(l) === id ? { ...l, qty: clampQty(qty) } : l)) }),
      remove: (id) => set({ lines: get().lines.filter((l) => lineId(l) !== id) }),
      clear: () => set({ lines: [] }),
      // Re-price from the server quote. Returns true when any unit price changed.
      replacePrices: (quoteLines) => {
        let changed = false;
        const map = new Map(quoteLines.map((q) => [`${q.productId}|${q.colourwayKey}|${q.size}`, q]));
        const lines = get().lines.map((l) => {
          const q = map.get(lineId(l));
          if (q && q.unitPrice !== l.unitPrice) {
            changed = true;
            return { ...l, unitPrice: q.unitPrice, image: q.image || l.image };
          }
          return l;
        });
        if (changed) set({ lines });
        return changed;
      },
      startFlight: () => set({ pendingFlights: get().pendingFlights + 1 }),
      endFlight: () => set({ pendingFlights: Math.max(0, get().pendingFlights - 1) }),
    }),
    {
      name: CART_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines }),
      merge: (persisted, current) => ({ ...current, lines: sanitizeLines(persisted?.lines) }),
    },
  ),
);

export const cartCount = (s) => s.lines.reduce((n, l) => n + l.qty, 0);
export const cartSubtotal = (s) => s.lines.reduce((n, l) => n + l.qty * l.unitPrice, 0);
export const cartVisibleCount = (s) => Math.max(0, cartCount(s) - s.pendingFlights);
