import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUi } from '../src/store/ui.js';
import { useCart } from '../src/store/cart.js';
import { playAddToCart, addToCartAnimated, makeLine } from '../src/lib/addToCart.js';
import { sampleBox, BOX_T, LID_OPEN, makeParticleLayout } from '../src/three/boxTimeline.js';

const product = { id: 'p1', slug: 'g10-401', name: 'G10-401' };
const colourway = { key: 'olive', name: 'Olive', price: 2775, images: [] };

describe('cart box trigger', () => {
  beforeEach(() => {
    useUi.setState({ cartBox: null, bumpTick: 0, snackbar: null });
    useCart.setState({ lines: [], pendingFlights: 0 });
    window.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} });
  });

  it('startCartBox sets the request and refuses a second while busy', () => {
    expect(useUi.getState().startCartBox({ colour: 'olive' })).toBe(true);
    expect(useUi.getState().cartBox.colour).toBe('olive');
    expect(useUi.getState().startCartBox({ colour: 'black' })).toBe(false);
    useUi.getState().endCartBox(useUi.getState().cartBox.id);
    expect(useUi.getState().cartBox).toBeNull();
  });

  it('onLand fires exactly once, even if landed then ended', () => {
    const onLand = vi.fn();
    useUi.getState().startCartBox({ colour: 'olive', onLand });
    const { id } = useUi.getState().cartBox;
    useUi.getState().landCartBox(id);
    useUi.getState().landCartBox(id);
    useUi.getState().endCartBox(id);
    expect(onLand).toHaveBeenCalledTimes(1);
  });

  it('reduced motion skips the overlay and lands immediately', () => {
    window.matchMedia = (q) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} });
    const onLand = vi.fn();
    expect(playAddToCart({ colour: 'olive', onLand })).toBe(false);
    expect(onLand).toHaveBeenCalledTimes(1);
    expect(useUi.getState().cartBox).toBeNull();
  });

  it('addToCartAnimated adds to the cart at once but holds the badge until the box lands', () => {
    const line = makeLine(product, colourway, 8, 1);
    expect(useUi.getState().startCartBox({})).toBe(true); // busy -> instant path
    useUi.getState().endCartBox(useUi.getState().cartBox.id);
    const tier = new URLSearchParams('?tier=full');
    window.history.pushState({}, '', `/?${tier}`);
    addToCartAnimated(line);
    expect(useCart.getState().lines).toHaveLength(1);
    expect(useCart.getState().pendingFlights).toBe(1);
    const { id } = useUi.getState().cartBox;
    useUi.getState().endCartBox(id);
    expect(useCart.getState().pendingFlights).toBe(0);
    expect(useUi.getState().bumpTick).toBe(1);
  });
});

describe('box timeline', () => {
  it('lid opens, shuts, then the box flies and lands in order', () => {
    expect(sampleBox(0).lid).toBe(LID_OPEN);
    expect(sampleBox(BOX_T.lidEnd + 1).lid).toBeCloseTo(0, 1);
    expect(sampleBox(BOX_T.flyStart).fly).toBe(0);
    expect(sampleBox(BOX_T.flyEnd).landed).toBe(true);
    expect(sampleBox(BOX_T.end).done).toBe(true);
    expect(sampleBox(BOX_T.flyEnd - 1).landed).toBe(false);
  });
  it('total runs about 2s', () => {
    expect(BOX_T.end).toBeGreaterThanOrEqual(1800);
    expect(BOX_T.end).toBeLessThanOrEqual(2100);
  });
  it('particles form, then crossfade into the solid box before the lid closes', () => {
    expect(sampleBox(0).form).toBe(0);
    expect(sampleBox(BOX_T.formEnd).form).toBe(1);
    let prev = -1;
    for (let t = 0; t <= BOX_T.formEnd; t += 50) {
      const f = sampleBox(t).form;
      expect(f).toBeGreaterThanOrEqual(prev);
      prev = f;
    }
    expect(sampleBox(BOX_T.solidStart - 1).solid).toBe(0);
    expect(sampleBox(BOX_T.solidEnd).solid).toBe(1);
    expect(sampleBox(BOX_T.solidEnd).pfade).toBe(0);
    const mid = sampleBox((BOX_T.solidStart + BOX_T.solidEnd) / 2);
    expect(mid.solid + mid.pfade).toBeCloseTo(1);
    expect(BOX_T.solidEnd).toBeLessThanOrEqual(BOX_T.lidStart);
    expect(sampleBox(BOX_T.solidStart).lid).toBe(LID_OPEN);
  });
  it('particle layout is deterministic and on the box surface', () => {
    const dims = { hx: 1.2, hz: 0.7, y0: 0, y1: 1 };
    const a = makeParticleLayout(500, dims);
    const b = makeParticleLayout(500, dims);
    expect(Array.from(a.target)).toEqual(Array.from(b.target));
    for (let i = 0; i < 500; i += 1) {
      const [x, y, z] = [a.target[i * 3], a.target[i * 3 + 1], a.target[i * 3 + 2]];
      expect(Math.abs(x)).toBeLessThanOrEqual(1.2 + 1e-6);
      expect(Math.abs(z)).toBeLessThanOrEqual(0.7 + 1e-6);
      expect(y).toBeGreaterThanOrEqual(-1e-6);
      expect(y).toBeLessThanOrEqual(1 + 1e-6);
      const onFace = Math.abs(Math.abs(x) - 1.2) < 1e-6 || Math.abs(Math.abs(z) - 0.7) < 1e-6 || y < 1e-6 || Math.abs(y - 1) < 1e-6;
      expect(onFace).toBe(true);
    }
  });
});
