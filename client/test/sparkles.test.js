import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUi } from '../src/store/ui.js';
import { useCart, cartVisibleCount } from '../src/store/cart.js';
import { addToCartAnimated, makeLine, playAddToCart } from '../src/lib/addToCart.js';
import { stepSparkles, resetSparkles } from '../src/lib/sparkles.js';

const product = { id: 'p1', slug: 'g10-401', name: 'G10-401' };
const colourway = { key: 'olive', name: 'Olive', price: 2775, images: [] };
const rect = { left: 100, top: 400, width: 200, height: 56 };

// A 2D context that accepts every call (jsdom has no canvas).
const stubCtx = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ addColorStop() {} })), set: (t, k, v) => { t[k] = v; return true; } });

const setMotion = (reduce) => {
  window.matchMedia = (q) => ({ matches: reduce && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} });
};

describe('add to cart sparkles', () => {
  beforeEach(() => {
    useUi.setState({ bumpTick: 0, snackbar: null });
    useCart.setState({ lines: [], pendingFlights: 0 });
    document.body.innerHTML = '<button id="cart-button">cart</button>';
    document.getElementById('cart-button').getBoundingClientRect = () => ({ left: 1380, top: 12, width: 44, height: 44 });
  });
  afterEach(() => {
    resetSparkles();
    vi.restoreAllMocks();
  });

  it('reduced motion: adds at once with the bump and toast, no canvas', () => {
    setMotion(true);
    addToCartAnimated(makeLine(product, colourway, '8'), { sourceRect: rect });
    expect(useCart.getState().lines).toHaveLength(1);
    expect(cartVisibleCount(useCart.getState())).toBe(1);
    expect(useUi.getState().bumpTick).toBe(1);
    expect(useUi.getState().snackbar?.message).toBe('Added to cart');
    expect(document.querySelector('canvas.gs-sparkles')).toBeNull();
  });

  it('plays on a 2D canvas: the count, bump and toast wait for the sparkles to reach the cart, once', () => {
    setMotion(false);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => stubCtx());
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
    addToCartAnimated(makeLine(product, colourway, '8'), { sourceRect: rect });
    const overlay = document.querySelector('canvas.gs-sparkles');
    expect(overlay).not.toBeNull();
    expect(overlay.getAttribute('aria-hidden')).toBe('true');
    expect(overlay.style.pointerEvents).toBe('none');
    expect(useCart.getState().lines).toHaveLength(1);
    expect(cartVisibleCount(useCart.getState())).toBe(0); // held while flying
    expect(useUi.getState().bumpTick).toBe(0);
    let t = 0;
    while (t < 690) { stepSparkles(16); t += 16; }
    expect(useUi.getState().bumpTick).toBe(0);
    while (t < 750) { stepSparkles(16); t += 16; }
    expect(useUi.getState().bumpTick).toBe(1);
    expect(cartVisibleCount(useCart.getState())).toBe(1);
    expect(useUi.getState().snackbar?.message).toBe('Added to cart');
    // everything dies out shortly after
    let alive = true;
    while (alive && t < 3000) { alive = stepSparkles(16); t += 16; }
    expect(alive).toBe(false);
    expect(t).toBeLessThan(1100);
    expect(useUi.getState().bumpTick).toBe(1);
  });

  it('without a 2D canvas it lands at once', () => {
    setMotion(false);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null);
    const onLand = vi.fn();
    expect(playAddToCart({ sourceRect: rect, onLand })).toBe(false);
    expect(onLand).toHaveBeenCalledTimes(1);
  });
});
