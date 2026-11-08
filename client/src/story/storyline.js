// THE timeline. One declarative file: sections -> scroll length, background colour, ink colour,
// shoe pose (stage box, camera orbit, shoe rotation, lift), per-part explode, anatomy labels and colourway.
// Everything is keyed in "vh units" of scroll from the top of the story, so a value here is exact:
// 100 = one viewport height of scrolling. Pure module (no DOM, no three): tested in test/storyline.test.js.
//
// Geometry of the scroll: every section is one viewport tall and is pinned for `pin` vh. Section i's panel
// reaches the top of the viewport at S(i) = sum over j < i of (100 + pin_j); it holds for pin_i; then for 100 vh
// the next section slides up over it. That slide is the "transition" in which the shoe flies to its next pose
// and the background crossfades.

const TAU = Math.PI * 2;

// Palette: saturated but related (all mid/high chroma, warm/cool alternating). Ink pairs pass WCAG AA
// (>= 4.5:1 for body text) against their ground; see test/storyline.test.js.
export const PALETTE = {
  tangerine: { bg: '#FF5A1F', ink: '#1A0B05', soft: '#3A1608', accent: '#FFFFFF' },
  lilac: { bg: '#A996FF', ink: '#140F33', soft: '#2B2266', accent: '#FFFFFF' },
  pine: { bg: '#0F4D42', ink: '#F4F0E6', soft: '#B9D8CF', accent: '#FFC21A' },
  saffron: { bg: '#FFC21A', ink: '#1A1405', soft: '#4A3A08', accent: '#0F4D42' },
  raspberry: { bg: '#D0175A', ink: '#FFFFFF', soft: '#FFD3E2', accent: '#FFC21A' },
  aubergine: { bg: '#24163F', ink: '#FFFFFF', soft: '#C9BEEA', accent: '#FFC21A' },
  goldstar: { bg: '#2A27E9', ink: '#FFFFFF', soft: '#D9D8FF', accent: '#FFC93C' },
};

export const SECTIONS = [
  { id: 'hero', pin: 40, colour: 'tangerine', title: 'Built for every trail' },
  { id: 'reveal', pin: 140, colour: 'lilac', title: '360° of craft' },
  { id: 'anatomy', pin: 260, colour: 'pine', title: 'Anatomy' },
  { id: 'sole', pin: 100, colour: 'saffron', title: 'Grip' },
  { id: 'colour', pin: 140, colour: 'raspberry', title: 'Colourways' },
  { id: 'studio', pin: 90, colour: 'aubergine', title: 'Studio' },
  { id: 'finale', pin: 130, colour: 'goldstar', title: 'Goldstar' },
];

export const TRANSITION = 100;

// Start of each section's pin, in vh units from the top of the story.
export const START = {};
{
  let s = 0;
  SECTIONS.forEach((sec) => {
    START[sec.id] = s;
    s += TRANSITION + sec.pin;
  });
}
export const sectionIndex = (id) => SECTIONS.findIndex((s) => s.id === id);
export const pinOf = (id) => SECTIONS[sectionIndex(id)].pin;
export const endOf = (id) => START[id] + pinOf(id);
// Total scroll of the story timeline (the finale's pin end).
export const TOTAL = endOf(SECTIONS[SECTIONS.length - 1].id);
// Absolute time of a fraction of a section's pin (0 = panel just pinned, 1 = about to leave).
export const at = (id, frac) => START[id] + frac * pinOf(id);
// The "hold" pose of each section: what reduced motion and the static screenshots show.
export const HOLD = {
  hero: at('hero', 0),
  reveal: at('reveal', 0.18),
  anatomy: at('anatomy', 0.55),
  sole: at('sole', 0.5),
  colour: at('colour', 0.25),
  studio: at('studio', 0.3),
  finale: at('finale', 1),
};

// Stage boxes: where the shoe lives on screen, as fractions of the viewport (centre x/y, width, height).
// Copy is laid out in the complementary area, so text never sits on the shoe.
// Phones: the stage is always the top ~45% and the copy sits below it.
export const LAYOUTS = {
  desktop: {
    right: { cx: 0.68, cy: 0.55, w: 0.56, h: 0.74 },
    left: { cx: 0.32, cy: 0.55, w: 0.56, h: 0.74 },
    mid: { cx: 0.53, cy: 0.55, w: 0.42, h: 0.86 },
    centre: { cx: 0.5, cy: 0.5, w: 0.6, h: 0.58 },
  },
  phone: {
    right: { cx: 0.5, cy: 0.32, w: 0.94, h: 0.4 },
    left: { cx: 0.5, cy: 0.32, w: 0.94, h: 0.4 },
    mid: { cx: 0.5, cy: 0.33, w: 0.94, h: 0.5 },
    centre: { cx: 0.5, cy: 0.36, w: 0.94, h: 0.42 },
  },
};

// Pose defaults. Units: R = framing radius (rig units, the shoe is 3 long), angles in radians.
// rx/ry/rz: shoe rotation (Euler 'YXZ': yaw ry, then roll rx about the length axis, then pitch rz).
// az/el: camera orbit around the shoe. lift: shoe y offset. explode: 0..1. shadow: contact shadow opacity.
const BASE = { box: 'right', fill: 0.92, R: 1.6, az: 0, el: 0.14, rx: 0, ry: 0, rz: 0, lift: 0, explode: 0, shadow: 1, alpha: 1, studio: 0 };

// Keyframes. `t` is absolute vh; `ease` is how we arrive at this key from the previous one.
// Values not given are carried over from the previous key.
const HERO_Y = 3.6; // 3/4 front: toe toward the copy and slightly toward the camera
const REVEAL_Y0 = HERO_Y + Math.PI; // half a turn during the flight
const REVEAL_Y1 = REVEAL_Y0 + TAU; // a full 360 in the pin
const ANAT_Y = 2 * TAU - 0.42; // lateral 3/4, toe right
const SOLE_Y = 2 * TAU + 0.1;
const COLOUR_Y = 2 * TAU + 2.7;
const STUDIO_Y = 3 * TAU - 0.55;

export const ANATOMY = {
  explodeIn: [at('anatomy', 0.02), at('anatomy', 0.3)],
  labelsFrom: at('anatomy', 0.3),
  labelStep: 9,
  labelFade: 8,
  labelsOut: [at('anatomy', 0.76), at('anatomy', 0.8)],
  explodeOut: [at('anatomy', 0.8), at('anatomy', 1)],
};

export const KEYS = [
  { t: 0, ...BASE, box: 'right', fill: 0.94, ry: HERO_Y, rz: 0.1, el: 0.16 },
  { t: endOf('hero'), ry: HERO_Y + 0.25, ease: 'linear' },
  // flight hero -> reveal: lift and bank mid-air, half turn
  { t: endOf('hero') + 50, box: 'mid', lift: 0.35, rz: -0.18, ry: HERO_Y + 0.25 + Math.PI / 2 + 0.1, fill: 0.8, shadow: 0.2, ease: 'in' },
  { t: START.reveal, box: 'left', lift: 0, rz: 0.04, ry: REVEAL_Y0, fill: 0.92, el: 0.1, shadow: 1, ease: 'out' },
  { t: endOf('reveal'), ry: REVEAL_Y1, ease: 'linear' },
  // reveal -> anatomy: dolly back for the exploded stack, look down a little
  { t: START.anatomy, box: 'mid', R: 2.45, fill: 0.95, el: 0.3, ry: ANAT_Y, rz: 0, ease: 'inOut' },
  { t: ANATOMY.explodeIn[0], explode: 0, ease: 'linear' },
  { t: ANATOMY.explodeIn[1], explode: 1, ry: ANAT_Y + 0.12, shadow: 0.35, ease: 'inOut' },
  { t: ANATOMY.explodeOut[0], explode: 1, ry: ANAT_Y + 0.3, ease: 'linear' },
  { t: ANATOMY.explodeOut[1], explode: 0, ry: ANAT_Y + 0.36, shadow: 1, ease: 'inOut' },
  // anatomy -> sole: roll over to show the outsole
  { t: endOf('anatomy') + 50, box: 'centre', R: 1.8, lift: 0.5, rx: -0.7, rz: 0.15, ry: SOLE_Y + TAU, el: 0.12, shadow: 0, ease: 'in' },
  { t: START.sole, box: 'left', R: 1.6, fill: 0.98, lift: 0, rx: -1.32, rz: 0.12, ry: SOLE_Y + TAU, el: 0.04, shadow: 0, ease: 'out' },
  { t: endOf('sole'), fill: 1.06, rz: 0.2, ease: 'linear' },
  // sole -> colour: land back on its feet, spin into a 3/4 hero pose
  { t: START.colour, box: 'right', fill: 0.94, rx: 0, rz: 0.06, ry: COLOUR_Y + TAU, el: 0.16, shadow: 1, ease: 'inOut' },
  { t: endOf('colour'), ry: COLOUR_Y + TAU + 0.35, ease: 'linear' },
  // colour -> studio: centre stage, hands over to the user
  { t: START.studio, box: 'centre', fill: 0.92, ry: STUDIO_Y + TAU, rz: 0, el: 0.2, studio: 1, ease: 'inOut' },
  { t: endOf('studio'), studio: 1, ease: 'linear' },
  // studio -> finale: the shoe takes off and leaves the frame upward while the wordmark rises
  { t: endOf('studio') + 30, studio: 0, lift: 0.25, ease: 'in' },
  { t: START.finale, lift: 4.2, ry: STUDIO_Y + TAU + 1.6, rz: -0.35, shadow: 0, alpha: 0, ease: 'in' },
  { t: TOTAL, ease: 'linear' },
];

const NUM_KEYS = ['fill', 'R', 'az', 'el', 'rx', 'ry', 'rz', 'lift', 'explode', 'shadow', 'alpha', 'studio'];

// Fill every key with the values carried over from the previous one.
const FULL = (() => {
  let prev = { ...BASE };
  return KEYS.map((k) => {
    const full = { ...prev, ...k, ease: k.ease || 'inOut' };
    prev = full;
    return full;
  });
})();

export const EASES = {
  linear: (x) => x,
  in: (x) => x * x * x,
  out: (x) => 1 - (1 - x) ** 3,
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2),
};

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a, b, f) => a + (b - a) * f;
export const smooth = (a, b, x) => {
  const f = clamp01((x - a) / (b - a || 1));
  return f * f * (3 - 2 * f);
};

export function makePose() {
  return { cx: 0, cy: 0, w: 0, h: 0, fill: 0, R: 0, az: 0, el: 0, rx: 0, ry: 0, rz: 0, lift: 0, explode: 0, shadow: 0, alpha: 0, studio: 0 };
}

// Sample the shoe pose at story time T (vh units) for a layout ('desktop' | 'phone').
export function samplePose(T, layout = 'desktop', out = makePose()) {
  const t = Number.isFinite(T) ? Math.min(TOTAL, Math.max(0, T)) : 0;
  let i = 1;
  while (i < FULL.length - 1 && FULL[i].t < t) i += 1;
  const a = FULL[i - 1];
  const b = FULL[i];
  const span = b.t - a.t;
  const f = span > 0 ? EASES[b.ease](clamp01((t - a.t) / span)) : 1;
  const boxes = LAYOUTS[layout] || LAYOUTS.desktop;
  const ba = boxes[a.box];
  const bb = boxes[b.box];
  out.cx = lerp(ba.cx, bb.cx, f);
  out.cy = lerp(ba.cy, bb.cy, f);
  out.w = lerp(ba.w, bb.w, f);
  out.h = lerp(ba.h, bb.h, f);
  for (let k = 0; k < NUM_KEYS.length; k += 1) out[NUM_KEYS[k]] = lerp(a[NUM_KEYS[k]], b[NUM_KEYS[k]], f);
  return out;
}

// Anatomy label visibility (0..1) for the n-th part in the label order.
export function labelAt(T, n) {
  const s = ANATOMY.labelsFrom + n * ANATOMY.labelStep;
  return Math.min(smooth(s, s + ANATOMY.labelFade, T), 1 - smooth(ANATOMY.labelsOut[0], ANATOMY.labelsOut[1], T));
}

// Which section is "current" at T: the one whose panel covers most of the viewport.
export function sectionAt(T) {
  for (let i = SECTIONS.length - 1; i >= 0; i -= 1) {
    if (T >= START[SECTIONS[i].id] - TRANSITION / 2) return i;
  }
  return 0;
}

// Background at T: crossfade between neighbouring sections during each transition.
// Returns [fromIndex, toIndex, mix 0..1].
export function backgroundAt(T) {
  for (let i = 0; i < SECTIONS.length - 1; i += 1) {
    const end = endOf(SECTIONS[i].id);
    if (T < end) return [i, i, 0];
    if (T < end + TRANSITION) return [i, i + 1, EASES.inOut(clamp01((T - end) / TRANSITION))];
  }
  const last = SECTIONS.length - 1;
  return [last, last, 0];
}

// Colourway scrubbing in the colour chapter: index into the product's colourways.
export function colourIndexAt(T, count) {
  if (count < 2) return 0;
  const f = clamp01((T - START.colour) / pinOf('colour'));
  return Math.min(count - 1, Math.floor(f * count * 0.999 + (T < START.colour ? 0 : 0)));
}

// Copy (DOM text) tracks, used to build the GSAP master timeline. Times are absolute vh.
export function copyTrack(id) {
  const s = START[id];
  const e = endOf(id);
  return {
    in: id === 'hero' ? null : [s - 75, s - 5],
    out: id === 'finale' ? null : [e - 20, e + 30],
  };
}

// Brand finale tracks (letters rise one by one, star draws and spins, Devanagari line fades up).
export const FINALE = {
  letters: [START.finale - 45, START.finale + 55],
  star: [START.finale - 60, START.finale + 45],
  sub: [START.finale + 40, START.finale + 80],
  settle: [START.finale + 70, TOTAL],
};
