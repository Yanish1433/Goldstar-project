import { describe, expect, it } from 'vitest';
import { formatNPR, formatRange } from '../src/lib/format.js';
import { canTransition, nextStatuses } from '../src/lib/orders.js';
import { convexHull, smoothHull } from '../src/three/hull.js';
import { sampleFlight, cubicBezier, FLIGHT, advanceFlightClock, FLIGHT_FRAME_CAP_MS } from '../src/three/flight.js';

describe('formatNPR', () => {
  it('formats with Indian grouping', () => {
    expect(formatNPR(3400)).toBe('NPR 3,400');
    expect(formatNPR(2775)).toBe('NPR 2,775');
    expect(formatNPR(100000)).toBe('NPR 1,00,000');
  });
  it('formats ranges', () => {
    expect(formatRange(2775, 3400)).toBe('NPR 2,775 – 3,400');
    expect(formatRange(2000, 2000)).toBe('NPR 2,000');
  });
});

describe('order status mirror', () => {
  it('follows SPEC 2.4', () => {
    expect(nextStatuses('placed')).toEqual(['confirmed', 'cancelled']);
    expect(nextStatuses('confirmed')).toEqual(['shipped', 'cancelled']);
    expect(nextStatuses('shipped')).toEqual(['delivered']);
    expect(nextStatuses('delivered')).toEqual([]);
    expect(nextStatuses('cancelled')).toEqual([]);
    expect(canTransition('placed', 'shipped')).toBe(false);
    expect(canTransition('shipped', 'cancelled')).toBe(false);
  });
});

describe('hull', () => {
  it('convex hull drops interior points and smoothing grows the vertex count', () => {
    const pts = [[0, 0], [2, 0], [2, 2], [0, 2], [1, 1], [0.5, 1.2]];
    expect(convexHull(pts)).toHaveLength(4);
    expect(smoothHull(pts, 2).length).toBe(16);
  });
});

describe('flight timeline', () => {
  it('phases follow SPEC 9.8', () => {
    expect(sampleFlight(0).lid).toBeCloseTo(-1.9);
    expect(sampleFlight(300).drop).toBe(0);
    expect(sampleFlight(900).drop).toBeCloseTo(1);
    expect(sampleFlight(900).lid).toBeCloseTo(-1.9);
    expect(sampleFlight(1150).lid).toBeCloseTo(0);
    expect(sampleFlight(1150).fly).toBe(0);
    expect(sampleFlight(1649).landed).toBe(false);
    expect(sampleFlight(1650).landed).toBe(true);
    expect(sampleFlight(1650).boxScale).toBeCloseTo(0.08, 2);
    expect(sampleFlight(FLIGHT.returnEnd).done).toBe(true);
    expect(sampleFlight(1650).ret).toBe(0);
    expect(sampleFlight(2100).ret).toBeCloseTo(1);
  });
  it('cubic bezier hits its endpoints and is monotone', () => {
    const e = cubicBezier(0.55, 0.055, 0.675, 0.19);
    expect(e(0)).toBe(0);
    expect(e(1)).toBe(1);
    expect(e(0.5)).toBeLessThan(0.5);
  });
});

describe('flight real-time clock (FX6)', () => {
  it('advances by wall-clock time, each frame capped at 100 ms', () => {
    expect(FLIGHT_FRAME_CAP_MS).toBe(100);
    expect(advanceFlightClock(0, 1016, 1000)).toBe(16);
    expect(advanceFlightClock(500, 1300, 1000)).toBe(600); // 300 ms hitch is capped to 100
    expect(advanceFlightClock(500, 900, 1000)).toBe(500); // clock never runs backwards
  });
  it('a slow GPU (140 ms frames) still finishes the flight, without being skipped through', () => {
    let t = 0;
    let now = 0;
    let frames = 0;
    while (t < FLIGHT.returnEnd && frames < 1000) {
      const next = now + 140;
      t = advanceFlightClock(t, next, now);
      now = next;
      frames += 1;
    }
    expect(t).toBeGreaterThanOrEqual(FLIGHT.returnEnd);
    expect(frames).toBe(Math.ceil(FLIGHT.returnEnd / 100));
    // wall time is stretched only by 140/100, nowhere near the old 8 s timeout
    expect(now).toBeLessThan(3500);
  });
});
