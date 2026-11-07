// Pure timeline for the box-into-cart overlay. sampleBox(tMs) -> phase values (no three.js imports, unit-testable).
// Beats (ms from the first rendered frame): the box pops in, the shoe arcs in from where the click happened,
// drops (gravity) into the box and bounces once, the lid swings shut, then the closed box flies to the cart icon.
import { cubicBezier } from './flight.js';

export const BOX_T = {
  pop: 200, // box scales in
  arcStart: 40,
  arcEnd: 700, // shoe reaches the hover point above the box
  dropEnd: 900, // shoe has hit the bottom of the box
  bounceEnd: 1040,
  lidStart: 980,
  lidEnd: 1280, // lid shut
  flyStart: 1320,
  flyEnd: 1700, // box reaches the cart icon: onLand fires here
  end: 1780,
};

export const LID_OPEN = -1.95; // radians about the hinge at the back top edge (negative = front edge lifts)
export const BOX_FLY_SCALE = 0.1;

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeOutCubic = (x) => 1 - (1 - x) ** 3;
const easeInOutCubic = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
const easeOutBack = (x) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
};
export const easeFly = cubicBezier(0.45, 0, 0.7, 0.25);

export function makeBoxSample() {
  return { t: 0, pop: 0, arc: 0, drop: 0, bounce: 0, impact: 0, lid: LID_OPEN, fly: 0, landed: false, done: false, shoeVisible: true, opacity: 1 };
}

export function sampleBox(t, out = makeBoxSample()) {
  const T = BOX_T;
  out.t = t;
  out.pop = easeOutBack(clamp01(t / T.pop));
  out.arc = easeInOutCubic(clamp01((t - T.arcStart) / (T.arcEnd - T.arcStart)));
  const du = clamp01((t - T.arcEnd) / (T.dropEnd - T.arcEnd));
  out.drop = du * du; // free fall: distance ~ t^2
  const bu = clamp01((t - T.dropEnd) / (T.bounceEnd - T.dropEnd));
  out.bounce = Math.sin(Math.PI * bu) * (1 - bu) * (t >= T.dropEnd ? 1 : 0); // one small damped hop
  // Box squashes a touch when the shoe lands, then settles.
  const iu = clamp01((t - T.dropEnd) / 160);
  out.impact = t < T.dropEnd ? 0 : Math.sin(Math.PI * iu) * (1 - iu);
  const lu = clamp01((t - T.lidStart) / (T.lidEnd - T.lidStart));
  // Swings shut with a tiny rebound at the end (lid is stopped by the base, then settles).
  out.lid = LID_OPEN * (1 - easeInOutCubic(lu)) + (lu > 0.92 ? 0.05 * Math.sin(Math.PI * ((lu - 0.92) / 0.08)) : 0);
  out.fly = easeFly(clamp01((t - T.flyStart) / (T.flyEnd - T.flyStart)));
  out.landed = t >= T.flyEnd;
  out.done = t >= T.end;
  out.shoeVisible = true;
  out.opacity = t < T.flyEnd ? 1 : 1 - clamp01((t - T.flyEnd) / (T.end - T.flyEnd));
  return out;
}

export const BOX_DURATION = BOX_T.flyEnd;
export { easeOutCubic, clamp01 };
