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
  glacier: { bg: '#9ED6E6', ink: '#0A2430', soft: '#123A4A', accent: '#0A2430' },
  saffron: { bg: '#FFC21A', ink: '#1A1405', soft: '#4A3A08', accent: '#0F4D42' },
  raspberry: { bg: '#D0175A', ink: '#FFFFFF', soft: '#FFD3E2', accent: '#FFC21A' },
  aubergine: { bg: '#24163F', ink: '#FFFFFF', soft: '#C9BEEA', accent: '#FFC21A' },
  goldstar: { bg: '#2A27E9', ink: '#FFFFFF', soft: '#D9D8FF', accent: '#FFC93C' },
};

export const SECTIONS = [
  { id: 'hero', pin: 200, colour: 'tangerine', title: 'Explore further' },
  { id: 'performance', pin: 120, colour: 'lilac', title: 'Performance, redefined' },
  { id: 'callouts', pin: 180, colour: 'pine', title: 'Built in' },
  { id: 'anatomy', pin: 220, colour: 'glacier', title: 'Designed to endure' },
  { id: 'sole', pin: 110, colour: 'saffron', title: 'Traction grip' },
  { id: 'colour', pin: 200, colour: 'raspberry', title: 'Colour customisation' },
  { id: 'studio', pin: 90, colour: 'aubergine', title: 'Add to cart' },
  { id: 'finale', pin: 130, colour: 'goldstar', title: 'Your adventure begins now' },
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

// The hero's opening: a scroll-scrubbed macro close-up (tongue logo -> metal hardware -> outsole lugs) that pulls
// back to the full hero pose at `end`, then the hero copy arrives. Everything is in vh from the top of the story,
// tied 1:1 to scroll, so scrolling up plays it backward exactly. Captions and the rail read introBeat(T).
const BEAT_AT = [40, 80]; // where the caption crossfades are centred (between beat 1|2 and 2|3)
export const INTRO = {
  end: at('hero', 0.8), // 160: full hero pose reached (this is also HOLD.hero)
  fade: 12, // width of a caption crossfade
  captionOut: [112, 122], // the last caption leaves, the rail goes with it
  copyIn: [118, 139], // hero headline + buttons arrive (their stagger ends exactly at `end`)
  // The click targets of the rail: a point where each beat is fully shown.
  beatT: [17, 60, 99],
};
export const INTRO_BEATS = 3;

// Which close-up beat is on at T. vis[i] is caption i's opacity (0..1); rail is the rail's opacity; progress 0..1
// is the rail thumb position (0 at the top, 1 when the last caption leaves); index is the strongest beat (for the rail's active dot / label).
export function introBeat(T) {
  const t = Number.isFinite(T) ? T : 0;
  const h = INTRO.fade / 2;
  const vis = [];
  for (let i = 0; i < INTRO_BEATS; i += 1) {
    const inn = i === 0 ? 1 : smooth(BEAT_AT[i - 1] - h, BEAT_AT[i - 1] + h, t);
    const out = i === INTRO_BEATS - 1 ? 1 - smooth(INTRO.captionOut[0], INTRO.captionOut[1], t) : 1 - smooth(BEAT_AT[i] - h, BEAT_AT[i] + h, t);
    vis.push(inn * out);
  }
  let index = 0;
  vis.forEach((v, i) => {
    if (v > vis[index]) index = i;
  });
  const rail = 1 - smooth(INTRO.captionOut[0], INTRO.captionOut[1], t);
  return { vis, index, rail, progress: clamp01(t / INTRO.captionOut[0]) };
}

// The "hold" pose of each section: what reduced motion and the static screenshots show.
export const HOLD = {
  hero: INTRO.end,
  performance: at('performance', 0.2),
  callouts: at('callouts', 0.6),
  anatomy: at('anatomy', 0.55),
  sole: at('sole', 0.5),
  colour: at('colour', 0.12),
  studio: at('studio', 0.3),
  finale: at('finale', 1),
};

// Stage boxes: where the shoe lives on screen, as fractions of the viewport (centre x/y, width, height).
// Copy is laid out in the complementary area, so text never sits on the shoe.
// Phones: the stage is the top half and the copy sits below it. From the performance chapter on, the phone boxes
// are near full width and over half the screen tall, so the boot fills >= 85% of the viewport width (the hero keeps
// its own smaller box, matched by the HeroPoster render in Sections.jsx).
export const LAYOUTS = {
  desktop: {
    hero: { cx: 0.68, cy: 0.55, w: 0.56, h: 0.74 },
    macro: { cx: 0.68, cy: 0.55, w: 0.56, h: 0.74 }, // the hero's close-up intro: same place on desktop
    right: { cx: 0.68, cy: 0.55, w: 0.56, h: 0.74 },
    left: { cx: 0.32, cy: 0.55, w: 0.56, h: 0.74 },
    mid: { cx: 0.53, cy: 0.55, w: 0.42, h: 0.86 },
    centre: { cx: 0.5, cy: 0.5, w: 0.6, h: 0.58 },
  },
  phone: {
    hero: { cx: 0.5, cy: 0.32, w: 0.94, h: 0.4 },
    macro: { cx: 0.5, cy: 0.2, w: 0.94, h: 0.4 }, // higher: the close-up spills below the box, the captions sit under it
    right: { cx: 0.5, cy: 0.33, w: 0.98, h: 0.53 },
    left: { cx: 0.5, cy: 0.33, w: 0.98, h: 0.53 },
    mid: { cx: 0.5, cy: 0.32, w: 0.98, h: 0.55 },
    centre: { cx: 0.5, cy: 0.36, w: 0.94, h: 0.42 },
  },
};

// Pose defaults. Units: R = framing radius (rig units, the shoe is 3 long), angles in radians.
// rx/ry/rz: shoe rotation (Euler 'YXZ': yaw ry, then roll rx about the length axis, then pitch rz).
// az/el: camera orbit around the shoe. lift: shoe y offset. explode: 0..1. shadow: contact shadow opacity.
// fx/fy/fz: the point of the shoe (rig units, shoe-local, toe +x) that sits at the centre of the framing; the macro
// close-ups look at the tongue logo, the hardware and the lugs by moving it. 0 = the whole shoe, centred.
const BASE = { box: 'right', fill: 0.92, R: 1.6, az: 0, el: 0.14, rx: 0, ry: 0, rz: 0, lift: 0, explode: 0, shadow: 1, alpha: 1, studio: 0, fx: 0, fy: 0, fz: 0 };

// Keyframes. `t` is absolute vh; `ease` is how we arrive at this key from the previous one.
// Values not given are carried over from the previous key.
// Yaw is unwrapped (it only ever accumulates), so every flight spins the short or deliberate way.
const HERO_Y = -0.65; // 3/4 front, toe to the right (storyboard)
// Macro close-ups of the intro: framing radius R (rig units, 0.6+ keeps the textures sharp and the near plane clear
// of the upper), shoe yaw/roll, camera elevation and the focus point f = [x, y, z] on the shoe.
const MACRO = {
  logo: { R: 0.72, ry: -0.9, el: 0.3, f: [0, 0.78, 0] },
  hardware: { R: 0.8, ry: -0.5, el: 0.25, f: [0.3, 0.3, 0] },
  lugs: { R: 0.95, ry: -1.3, el: 0.08, rx: -0.3, f: [0.5, -0.25, 0] },
};
const PERF_Y0 = HERO_Y + 0.2 + Math.PI; // half a turn during the flight
const PERF_Y1 = PERF_Y0 + TAU; // a full 360 in the pin
const CALL_Y = 2 * TAU - 0.9; // toe toward the camera: logo on the tongue + lateral side
const ANAT_Y = 2 * TAU - 0.5;
const SOLE_Y = 3 * TAU + 0.12; // side profile, tilted to show the side tread (never from below)
const COLOUR_Y = 3 * TAU - 0.65;
const STUDIO_Y = 4 * TAU - 0.5;

// Label tracks (DOM cards positioned by the canvas): start, step between items, fade length, out window.
export const TRACKS = {
  callouts: { from: at('callouts', 0.08), step: 10, fade: 8, out: [at('callouts', 0.84), at('callouts', 0.92)] },
  badges: { from: at('anatomy', 0.32), step: 12, fade: 8, out: [at('anatomy', 0.76), at('anatomy', 0.8)] },
};
export const ANATOMY = {
  explodeIn: [at('anatomy', 0.02), at('anatomy', 0.3)],
  explodeOut: [at('anatomy', 0.8), at('anatomy', 1)],
};

export const KEYS = [
  // 1. Close-up on the tongue logo.
  { t: 0, ...BASE, box: 'macro', fill: 0.9, R: MACRO.logo.R, ry: MACRO.logo.ry, rz: 0.04, el: MACRO.logo.el, shadow: 0, fx: MACRO.logo.f[0], fy: MACRO.logo.f[1], fz: MACRO.logo.f[2] },
  { t: 30, ry: MACRO.logo.ry + 0.12, ease: 'linear' },
  // 2. Pan to the lace hardware.
  { t: 50, R: MACRO.hardware.R, ry: MACRO.hardware.ry, el: MACRO.hardware.el, fx: MACRO.hardware.f[0], fy: MACRO.hardware.f[1], fz: MACRO.hardware.f[2], ease: 'inOut' },
  { t: 70, ry: MACRO.hardware.ry + 0.12, ease: 'linear' },
  // 3. Down to the outsole lugs.
  { t: 90, R: MACRO.lugs.R, ry: MACRO.lugs.ry, el: MACRO.lugs.el, rx: MACRO.lugs.rx, fx: MACRO.lugs.f[0], fy: MACRO.lugs.f[1], fz: MACRO.lugs.f[2], ease: 'inOut' },
  { t: 112, ry: MACRO.lugs.ry + 0.12, ease: 'linear' },
  // Pull back to the full hero pose (R only ever grows, so scrolling down never zooms back in).
  { t: INTRO.end, box: 'hero', R: 1.6, rx: 0, ry: HERO_Y, rz: 0.04, el: 0.14, shadow: 1, fx: 0, fy: 0, fz: 0, ease: 'inOut' },
  { t: endOf('hero'), ry: HERO_Y + 0.2, ease: 'linear' },
  // flight hero -> performance: lift and bank mid-air, half turn
  { t: endOf('hero') + 50, box: 'mid', lift: 0.3, rz: -0.16, ry: HERO_Y + 0.2 + Math.PI / 2, fill: 0.8, shadow: 0.2, ease: 'in' },
  { t: START.performance, box: 'left', lift: 0, rz: 0.02, ry: PERF_Y0, fill: 1.15, el: 0.1, shadow: 1, ease: 'out' },
  { t: endOf('performance'), ry: PERF_Y1, ease: 'linear' },
  // performance -> callouts: come forward, toe to the camera
  { t: START.callouts, box: 'mid', fill: 1.15, el: 0.16, ry: CALL_Y, rz: 0, ease: 'inOut' },
  { t: endOf('callouts'), ry: CALL_Y + 0.25, ease: 'linear' },
  // callouts -> anatomy: dolly back for the exploded stack, look down a little
  { t: START.anatomy, box: 'mid', R: 2.4, fill: 0.95, el: 0.26, ry: ANAT_Y, ease: 'inOut' },
  { t: ANATOMY.explodeIn[0], explode: 0, ease: 'linear' },
  { t: ANATOMY.explodeIn[1], explode: 1, ry: ANAT_Y + 0.12, shadow: 0.35, ease: 'inOut' },
  { t: ANATOMY.explodeOut[0], explode: 1, ry: ANAT_Y + 0.3, ease: 'linear' },
  { t: ANATOMY.explodeOut[1], explode: 0, ry: ANAT_Y + 0.36, shadow: 1, ease: 'inOut' },
  // anatomy -> grip: a full spin into a tilted side profile
  { t: endOf('anatomy') + 50, box: 'centre', R: 1.7, lift: 0.4, rx: -0.25, rz: 0.1, ry: SOLE_Y - 1.2, el: 0.1, shadow: 0.2, ease: 'in' },
  { t: START.sole, box: 'left', R: 1.6, fill: 1.15, lift: 0, rx: -0.42, rz: 0.06, ry: SOLE_Y, el: 0.02, shadow: 0.5, ease: 'out' },
  { t: endOf('sole'), fill: 1.18, rz: 0.1, ease: 'linear' },
  // grip -> colour: land on its feet, 3/4 hero pose
  { t: START.colour, box: 'right', fill: 1.15, rx: 0, rz: 0.04, ry: COLOUR_Y, el: 0.14, shadow: 1, ease: 'inOut' },
  { t: endOf('colour'), ry: COLOUR_Y + 0.35, ease: 'linear' },
  // colour -> studio: centre stage, hands over to the user
  { t: START.studio, box: 'centre', fill: 1.12, ry: STUDIO_Y, rz: 0, el: 0.18, studio: 1, ease: 'inOut' },
  { t: endOf('studio'), studio: 1, ease: 'linear' },
  // studio -> finale: the boot takes off and leaves the frame upward while the wordmark rises
  { t: endOf('studio') + 30, studio: 0, lift: 0.25, ease: 'in' },
  { t: START.finale, lift: 4.4, ry: STUDIO_Y + 1.6, rz: -0.35, shadow: 0, alpha: 0, ease: 'in' },
  { t: TOTAL, ease: 'linear' },
];

const NUM_KEYS = ['fill', 'R', 'az', 'el', 'rx', 'ry', 'rz', 'lift', 'explode', 'shadow', 'alpha', 'studio', 'fx', 'fy', 'fz'];

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
  return { cx: 0, cy: 0, w: 0, h: 0, fill: 0, R: 0, az: 0, el: 0, rx: 0, ry: 0, rz: 0, lift: 0, explode: 0, shadow: 0, alpha: 0, studio: 0, fx: 0, fy: 0, fz: 0 };
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

// Label visibility (0..1) for the n-th item of a track.
export function trackAt(track, T, n) {
  const tr = typeof track === 'string' ? TRACKS[track] : track;
  const s = tr.from + n * tr.step;
  return Math.min(smooth(s, s + tr.fade, T), 1 - smooth(tr.out[0], tr.out[1], T));
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
  return Math.min(count - 1, Math.floor(f * count * 0.999));
}

// Copy (DOM text) tracks, used to build the GSAP master timeline. Times are absolute vh.
export function copyTrack(id) {
  const s = START[id];
  const e = endOf(id);
  return {
    in: id === 'hero' ? INTRO.copyIn : [s - 75, s - 5],
    out: id === 'finale' ? null : [e - 20, e + 18],
  };
}

// Brand finale tracks (letters rise one by one, star draws and spins, Devanagari line fades up).
export const FINALE = {
  line: [START.finale - 80, START.finale - 10], // "Your adventure begins now."
  letters: [START.finale - 40, START.finale + 55],
  star: [START.finale - 55, START.finale + 45],
  sub: [START.finale + 40, START.finale + 80],
  settle: [START.finale + 70, TOTAL],
};
