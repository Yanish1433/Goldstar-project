// The landing's G10 showcase as data: a sticky full-screen stage scrubbed by the scroll. Pure module (no DOM, no
// three): the canvas (LandingStage.jsx), the poster and the copy all read the same time T, in vh of scroll from the
// top of the showcase (100 = one viewport height). Tested in test/landing.test.jsx.
//
// Story: hero (boot on a dark stage, slow idle turn) -> the boot grows to fill the screen behind a giant "G10" with
// the real part/layer counts -> four feature beats (grip, cushioning, upper, colourways) with the boot held big
// beside the copy (desktop) or above it (phone, >= 85% of the viewport width).

const TAU = Math.PI * 2;

// Stage boxes: where the boot sits, as fractions of the stage (centre x/y, width, height) and how much of the box it
// fills. Same framing maths as the G10 story (story/Stage.jsx), so the hero box matches the story's hero poster
// render: poster square = fill * min(w, h) * POSTER_SCALE[layout].
export const BOXES = {
  desktop: {
    hero: { cx: 0.68, cy: 0.55, w: 0.56, h: 0.74, fill: 0.9 },
    big: { cx: 0.5, cy: 0.44, w: 0.9, h: 0.78, fill: 1.25 },
    side: { cx: 0.66, cy: 0.54, w: 0.6, h: 0.8, fill: 1.05 },
  },
  phone: {
    hero: { cx: 0.5, cy: 0.6, w: 0.94, h: 0.5, fill: 0.9 },
    big: { cx: 0.5, cy: 0.46, w: 1, h: 0.62, fill: 1.2 },
    side: { cx: 0.5, cy: 0.34, w: 1, h: 0.56, fill: 1.12 },
  },
};
export const POSTER_SCALE = { desktop: 1.3, phone: 1.15 };
// Rig framing (story/Stage.jsx): radius R (rig units, the boot is 3 long) times STORY_MODEL.frame fits the box.
export const FOV = 30;
export const R = 1.6;

// Scroll windows (T, vh). Each beat: the boot flies to its pose over [s - 10, s + 35], the copy fades in over
// [s + 10, s + 40] and out over [s + 75, s + 95] (the last beat stays).
export const HERO_OUT = [8, 55];
export const GROW = [15, 110];
export const INTER = { in: [80, 112], out: [150, 182] };
export const BEATS = ['grip', 'cushion', 'upper', 'colour'];
export const BEAT_START = { grip: 190, cushion: 285, upper: 380, colour: 475 };
export const RANGE = 560; // scroll length of the showcase; the stage is pinned (sticky) for this many vh
export const beatCopy = (id) => {
  const s = BEAT_START[id];
  return { in: [s + 10, s + 40], out: id === 'colour' ? null : [s + 75, s + 95] };
};
export const COLOUR_CYCLE = [BEAT_START.colour + 20, RANGE - 5];

const HERO_Y = -0.65; // 3/4 front, toe to the right (the poster's pose)
const KEYS = [
  { t: 0, box: 'hero', ry: HERO_Y, rx: 0, rz: 0.04, el: 0.14, lift: 0, z: 1 },
  { t: GROW[0], ease: 'linear' },
  // The boot comes forward and fills the screen.
  { t: GROW[1], box: 'big', ry: -0.3, rz: 0, el: 0.12 },
  { t: BEAT_START.grip - 10, ry: -0.1, ease: 'linear' },
  // Grip: a full turn into a tilted side profile that shows the lugs.
  { t: BEAT_START.grip + 35, box: 'side', ry: TAU + 0.12, rx: -0.42, rz: 0.06, el: 0.02 },
  { t: BEAT_START.cushion - 10, ry: TAU + 0.22, ease: 'linear' },
  // Cushioning: the medial side, lifted so the midsole sits near the middle, a little closer.
  { t: BEAT_START.cushion + 35, ry: TAU + Math.PI - 0.08, rx: 0, rz: -0.02, el: 0.05, lift: 0.18, z: 1.06 },
  { t: BEAT_START.upper - 10, ry: TAU + Math.PI + 0.04, ease: 'linear' },
  // Upper: toe towards the camera, looking down a little at the overlays and eyelets.
  { t: BEAT_START.upper + 35, ry: 2 * TAU - 0.9, rz: 0, el: 0.22, lift: 0, z: 1 },
  { t: BEAT_START.colour - 10, ry: 2 * TAU - 0.7, ease: 'linear' },
  // Colourways: back to the hero three-quarter, turning slowly while the colours change.
  { t: BEAT_START.colour + 35, ry: 3 * TAU + HERO_Y, rz: 0.04, el: 0.14 },
  { t: RANGE, ry: 3 * TAU + HERO_Y + 0.9, ease: 'linear' },
];
const NUM = ['ry', 'rx', 'rz', 'el', 'lift', 'z'];
const FULL = (() => {
  let prev = {};
  return KEYS.map((k) => {
    const f = { ...prev, ...k, ease: k.ease || 'inOut' };
    prev = f;
    return f;
  });
})();
export const LANDING_KEYS = FULL;

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a, b, f) => a + (b - a) * f;
const EASE = {
  linear: (x) => x,
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2),
};
export const smooth = (a, b, x) => {
  const f = clamp01((x - a) / (b - a || 1));
  return f * f * (3 - 2 * f);
};
// 0 -> 1 -> 0 visibility for a copy block with in/out windows.
export const showAt = (win, T) => Math.min(smooth(win.in[0], win.in[1], T), win.out ? 1 - smooth(win.out[0], win.out[1], T) : 1);

export const makeShowPose = () => ({ cx: 0, cy: 0, w: 0, h: 0, fill: 0, ry: 0, rx: 0, rz: 0, el: 0, lift: 0 });

export function landingPose(T, layout = 'desktop', out = makeShowPose()) {
  const t = Number.isFinite(T) ? Math.min(RANGE, Math.max(0, T)) : 0;
  let i = 1;
  while (i < FULL.length - 1 && FULL[i].t < t) i += 1;
  const a = FULL[i - 1];
  const b = FULL[i];
  const span = b.t - a.t;
  const f = span > 0 ? EASE[b.ease](clamp01((t - a.t) / span)) : 1;
  const boxes = BOXES[layout] || BOXES.desktop;
  const ba = boxes[a.box];
  const bb = boxes[b.box];
  out.cx = lerp(ba.cx, bb.cx, f);
  out.cy = lerp(ba.cy, bb.cy, f);
  out.w = lerp(ba.w, bb.w, f);
  out.h = lerp(ba.h, bb.h, f);
  for (let k = 0; k < NUM.length; k += 1) out[NUM[k]] = lerp(a[NUM[k]], b[NUM[k]], f);
  out.fill = lerp(ba.fill, bb.fill, f) * out.z;
  return out;
}

// On-screen boot length (px) for a pose on a W x H stage, side-on: the framing puts R * frame at
// fill * min(box) / 2, and the boot is 3 rig units long.
export const bootLengthPx = (pose, W, H, frame) => (pose.fill * Math.min(pose.w * W, pose.h * H) * 1.5) / (R * frame);

// Display colourway index during the colour beat.
export function colourAt(T, count) {
  if (count < 2 || T < COLOUR_CYCLE[0]) return 0;
  const f = clamp01((T - COLOUR_CYCLE[0]) / (COLOUR_CYCLE[1] - COLOUR_CYCLE[0]));
  return Math.min(count - 1, Math.floor(f * count * 0.999));
}

export const layoutOf = (width) => (width < 900 ? 'phone' : 'desktop');
