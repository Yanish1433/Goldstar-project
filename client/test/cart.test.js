import { beforeEach, describe, expect, it } from 'vitest';
import { useCart, lineId, cartCount, cartSubtotal, cartVisibleCount, sanitizeLines, MAX_LINES } from '../src/store/cart.js';

const line = (o = {}) => ({ productId: 'p1', slug: 'g10-401', name: 'G10-401', colourwayKey: 'olive', colourwayName: 'Olive', size: '8', qty: 1, unitPrice: 2775, image: null, ...o });

describe('cart store', () => {
  beforeEach(() => useCart.setState({ lines: [], pendingFlights: 0 }));

  it('merges the same product + colour + size', () => {
    useCart.getState().add(line());
    useCart.getState().add(line({ qty: 2 }));
    expect(useCart.getState().lines).toHaveLength(1);
    expect(cartCount(useCart.getState())).toBe(3);
  });
  it('different size or colour makes a new line', () => {
    useCart.getState().add(line());
    useCart.getState().add(line({ size: '9' }));
    useCart.getState().add(line({ colourwayKey: 'black' }));
    expect(useCart.getState().lines).toHaveLength(3);
  });
  it('caps qty at 5 per line', () => {
    useCart.getState().add(line({ qty: 4 }));
    useCart.getState().add(line({ qty: 4 }));
    expect(useCart.getState().lines[0].qty).toBe(5);
    useCart.getState().setQty(lineId(line()), 99);
    expect(useCart.getState().lines[0].qty).toBe(5);
    useCart.getState().setQty(lineId(line()), 0);
    expect(useCart.getState().lines[0].qty).toBe(1);
  });
  it('allows at most 10 lines', () => {
    for (let i = 0; i < MAX_LINES; i += 1) expect(useCart.getState().add(line({ size: String(i) })).ok).toBe(true);
    expect(useCart.getState().add(line({ size: 'x' })).ok).toBe(false);
    expect(useCart.getState().lines).toHaveLength(10);
  });
  it('subtotal, remove and clear', () => {
    useCart.getState().add(line({ qty: 2 }));
    useCart.getState().add(line({ size: '9', unitPrice: 3400 }));
    expect(cartSubtotal(useCart.getState())).toBe(2 * 2775 + 3400);
    useCart.getState().remove(lineId(line({ size: '9' })));
    expect(useCart.getState().lines).toHaveLength(1);
    useCart.getState().clear();
    expect(useCart.getState().lines).toHaveLength(0);
  });
  it('replacePrices reports changes from the server quote', () => {
    useCart.getState().add(line());
    const q = [{ productId: 'p1', colourwayKey: 'olive', size: '8', unitPrice: 2900 }];
    expect(useCart.getState().replacePrices(q)).toBe(true);
    expect(useCart.getState().lines[0].unitPrice).toBe(2900);
    expect(useCart.getState().replacePrices(q)).toBe(false);
  });
  it('pending flights hold back the visible badge count', () => {
    useCart.getState().add(line());
    useCart.getState().startFlight();
    expect(cartVisibleCount(useCart.getState())).toBe(0);
    useCart.getState().endFlight();
    expect(cartVisibleCount(useCart.getState())).toBe(1);
  });
  it('persists under gs-cart-v1 without pendingFlights', () => {
    useCart.getState().add(line());
    useCart.getState().startFlight();
    const saved = JSON.parse(localStorage.getItem('gs-cart-v1'));
    expect(saved.state.lines).toHaveLength(1);
    expect(saved.state.pendingFlights).toBeUndefined();
  });
});

describe('sanitizeLines (a saved cart is user-editable)', () => {
  it('drops malformed lines, repeats and bad prices; clamps qty; caps length', () => {
    const good = line();
    const out = sanitizeLines([good, good, null, 'x', { ...good, productId: 5 }, { ...good, size: '9', unitPrice: 'free' }, { ...good, size: 10, qty: 99 }, { ...good, size: '11', qty: 'abc' }]);
    expect(out.map((l) => [l.size, l.qty])).toEqual([['8', 1], ['10', 5], ['11', 1]]);
    expect(sanitizeLines('nope')).toEqual([]);
    expect(sanitizeLines(Array.from({ length: 30 }, (_, i) => line({ size: String(i + 1) })))).toHaveLength(MAX_LINES);
  });
});
