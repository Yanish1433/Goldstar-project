// Timing helpers used by the add-to-cart box (BoxIntoCart, boxTimeline). Trimmed from the old story flight.
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


export const FLIGHT_FRAME_CAP_MS = 100;
export function advanceFlightClock(tMs, nowMs, lastMs, cap = FLIGHT_FRAME_CAP_MS) {
  const dt = Math.min(Math.max(nowMs - lastMs, 0), cap);
  return tMs + dt;
}
