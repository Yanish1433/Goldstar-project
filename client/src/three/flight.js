// Add-to-cart flight timeline (SPEC 9.8). Pure: sampleFlight(tMs) -> phase values. Times in ms from the click.
import { clamp01, easeInOutCubic, easeOutCubic } from './timeline.js';

export const FLIGHT = { gather: 450, dropStart: 300, dropEnd: 900, closeEnd: 1150, flyEnd: 1650, returnEnd: 2100 };

// Cubic-bezier easing (same maths as CSS), solved with Newton + bisection.
export function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i += 1) {
      const e = sx(t) - x;
      if (Math.abs(e) < 1e-5) return sy(t);
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 24; i += 1) {
      const e = sx(t);
      if (Math.abs(e - x) < 1e-5) break;
      if (e < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

export const easeExit = cubicBezier(0.55, 0.055, 0.675, 0.19);
export const easeExpo = cubicBezier(0.16, 1, 0.3, 1);

export function makeFlightSample() {
  return { t: 0, gather: 0, drop: 0, lid: -1.9, fly: 0, boxScale: 1, landed: false, burst: 0, ret: 0, done: false, boxVisible: true, shoeVisible: true };
}

export function sampleFlight(t, out = makeFlightSample()) {
  out.t = t;
  out.drop = easeInOutCubic(clamp01((t - FLIGHT.dropStart) / (FLIGHT.dropEnd - FLIGHT.dropStart)));
  out.lid = t < FLIGHT.dropEnd ? -1.9 : -1.9 * (1 - easeOutCubic(clamp01((t - FLIGHT.dropEnd) / (FLIGHT.closeEnd - FLIGHT.dropEnd))));
  out.fly = easeExit(clamp01((t - FLIGHT.closeEnd) / (FLIGHT.flyEnd - FLIGHT.closeEnd)));
  out.boxScale = 1 + (0.08 - 1) * out.fly;
  out.landed = t >= FLIGHT.flyEnd;
  out.burst = clamp01((t - FLIGHT.flyEnd) / 200);
  out.ret = easeExpo(clamp01((t - FLIGHT.flyEnd) / (FLIGHT.returnEnd - FLIGHT.flyEnd)));
  out.done = t >= FLIGHT.returnEnd;
  out.boxVisible = t < FLIGHT.flyEnd + 200;
  out.shoeVisible = t < FLIGHT.flyEnd;
  return out;
}

// Real-time flight clock (FX6): advance by wall-clock milliseconds, each frame capped at 100 ms so a hitch
// cannot skip a phase, but slow GPUs do not stretch the flight either (time still passes).
export const FLIGHT_FRAME_CAP_MS = 100;
export function advanceFlightClock(tMs, nowMs, lastMs, cap = FLIGHT_FRAME_CAP_MS) {
  const dt = Math.min(Math.max(nowMs - lastMs, 0), cap);
  return tMs + dt;
}
