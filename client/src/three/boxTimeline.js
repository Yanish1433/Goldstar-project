// Pure timeline for the box-into-cart overlay. sampleBox(tMs) -> phase values (no three.js imports, unit-testable).
// Beats (ms from the first rendered frame): the shoe arcs in from where the click happened, gold particles swirl in and
// form the outline of the box around it, the shoe drops (gravity) and bounces, the particles crossfade into the solid
// cardboard box + black GOLDSTAR lid, the lid swings shut, then the closed box flies to the cart icon trailing sparkles.
import { cubicBezier } from './flight.js';

export const BOX_T = {
  pop: 300, // box group eases to full size
  arcStart: 40,
  arcEnd: 680, // shoe reaches the hover point above the box
  formStart: 120, // particles start converging
  formEnd: 980, // ...and have settled on the box edges/faces
  dropEnd: 900, // shoe has hit the bottom of the box
  bounceEnd: 1040,
  solidStart: 860, // crossfade particles -> solid box
  solidEnd: 1160,
  lidStart: 1180,
  lidEnd: 1460, // lid shut
  flyStart: 1500,
  flyEnd: 1920, // box reaches the cart icon: onLand fires here
  end: 2000,
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
  return { t: 0, pop: 0, arc: 0, drop: 0, bounce: 0, impact: 0, form: 0, solid: 0, pfade: 1, lid: LID_OPEN, fly: 0, landed: false, done: false, shoeVisible: true, opacity: 1 };
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
  const iu = clamp01((t - T.dropEnd) / 160);
  out.impact = t < T.dropEnd ? 0 : Math.sin(Math.PI * iu) * (1 - iu);
  out.form = easeOutCubic(clamp01((t - T.formStart) / (T.formEnd - T.formStart)));
  out.solid = easeInOutCubic(clamp01((t - T.solidStart) / (T.solidEnd - T.solidStart)));
  out.pfade = 1 - out.solid; // particle alpha
  const lu = clamp01((t - T.lidStart) / (T.lidEnd - T.lidStart));
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

// Deterministic particle layout (box-local units). Targets lie on the box edges (60%) and faces (40%); starts are on a
// shell around the box. Returned as flat arrays ready for BufferAttributes: start[3n], target[3n], rnd[3n].
export function makeParticleLayout(n, dims, seed = 7) {
  let a = seed >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const { hx, hz, y0, y1 } = dims;
  const start = new Float32Array(n * 3);
  const target = new Float32Array(n * 3);
  const rnd = new Float32Array(n * 3);
  const corner = (i, bit, lo, hi) => ((i >> bit) & 1 ? hi : lo);
  for (let i = 0; i < n; i += 1) {
    let x;
    let y;
    let z;
    if (rand() < 0.6) {
      // one of 12 edges: pick axis + the two fixed corners
      const axis = Math.floor(rand() * 3);
      const c = Math.floor(rand() * 4);
      const u = rand();
      if (axis === 0) { x = -hx + 2 * hx * u; y = corner(c, 0, y0, y1); z = corner(c, 1, -hz, hz); }
      else if (axis === 1) { x = corner(c, 0, -hx, hx); y = y0 + (y1 - y0) * u; z = corner(c, 1, -hz, hz); }
      else { x = corner(c, 0, -hx, hx); y = corner(c, 1, y0, y1); z = -hz + 2 * hz * u; }
    } else {
      const face = Math.floor(rand() * 6);
      const u = rand();
      const v = rand();
      if (face < 2) { x = face ? hx : -hx; y = y0 + (y1 - y0) * u; z = -hz + 2 * hz * v; }
      else if (face < 4) { z = face === 3 ? hz : -hz; y = y0 + (y1 - y0) * u; x = -hx + 2 * hx * v; }
      else { y = face === 5 ? y1 : y0; x = -hx + 2 * hx * u; z = -hz + 2 * hz * v; }
    }
    target.set([x, y, z], i * 3);
    const th = rand() * Math.PI * 2;
    const ph = Math.acos(2 * rand() - 1);
    const r = 3.5 + rand() * 3.5;
    start.set([r * Math.sin(ph) * Math.cos(th), 0.6 + Math.abs(r * Math.cos(ph)) * 0.8, r * Math.sin(ph) * Math.sin(th)], i * 3);
    rnd.set([rand(), rand(), rand()], i * 3);
  }
  return { start, target, rnd };
}
