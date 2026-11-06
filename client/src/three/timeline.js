// Pure scroll choreography (SPEC 9.4 / 9.5). No three.js imports: shared by the DOM sections and the canvas.
// s = scroll distance into the story in vh (0..900), p = s / 900.

export const STORY_VH = 1000;
export const SCROLL_VH = 900;

export const SECTIONS = [
  { id: 'story-hero', heightVh: 100, sticky: false, topVh: 0 },
  { id: 'story-performance', heightVh: 100, sticky: false, topVh: 100 },
  { id: 'story-callouts', heightVh: 200, sticky: true, topVh: 200 },
  { id: 'story-explode', heightVh: 200, sticky: true, topVh: 400 },
  { id: 'story-endure', heightVh: 100, sticky: false, topVh: 600 },
  { id: 'story-colour', heightVh: 200, sticky: true, topVh: 700 },
  { id: 'story-finale', heightVh: 100, sticky: false, topVh: 900 },
];

export const sToP = (s) => s / SCROLL_VH;
export const pToS = (p) => p * SCROLL_VH;

// Keyframes: pos [x,y,z], rot [rx,ry,rz], scale S. K8b (s 800) closes the turntable of s 700-800.
export const KEYFRAMES = [
  { id: 'K0', s: 0, pos: [1.1, 0.05, 0], rot: [0.12, -0.55, 0.04], S: 1.25 },
  { id: 'K1', s: 30, pos: [1.1, 0.05, 0], rot: [0.12, -0.45, 0.04], S: 1.25 },
  { id: 'K2', s: 100, pos: [2.7, -0.55, -1.4], rot: [0.05, 0.95, 0], S: 0.85 },
  { id: 'K3', s: 200, pos: [-1.5, -0.1, 0], rot: [0.16, -0.7, 0], S: 1.15 },
  { id: 'K4', s: 300, pos: [-1.5, -0.1, 0], rot: [0.16, -0.45, 0], S: 1.15 },
  { id: 'K5', s: 400, pos: [-0.3, -0.7, 0], rot: [0.38, -0.15, 0], S: 1.0 },
  { id: 'K6', s: 500, pos: [-0.3, -0.7, 0], rot: [0.38, 0.1, 0], S: 1.0 },
  { id: 'K7', s: 600, pos: [-1.7, -0.1, 0], rot: [0.1, -1.0, 0], S: 1.05 },
  { id: 'K8', s: 700, pos: [0.4, -0.15, 0], rot: [0.12, -0.5, 0], S: 1.2 },
  { id: 'K8b', s: 800, pos: [0.4, -0.15, 0], rot: [0.12, 2.64, 0], S: 1.2 },
  { id: 'K9', s: 820, pos: [0.4, -0.15, 0], rot: [0.12, 2.64, 0], S: 1.2 },
  { id: 'K10', s: 900, pos: [0.0, 1.6, -2.5], rot: [0.3, 3.2, 0], S: 0.6 },
];

// Phone layout (FX4): the shoe spans ~85% of the width at every chapter; `frac` is where its centre sits as a
// fraction of the viewport height (centred in the band between the AppBar and the text/panel).
// Table: id -> [S, frac]. K2 parks small and high above the headline; K10 drifts away.
export const PHONE_TABLE = {
  K0: [0.9, 0.33], K1: [0.9, 0.33], K2: [0.55, 0.2], K3: [0.78, 0.42], K4: [0.78, 0.42], K5: [0.78, 0.45], K6: [0.78, 0.45],
  K7: [0.86, 0.33], K8: [0.85, 0.27], K8b: [0.85, 0.27], K9: [0.85, 0.27], K10: [0.45, 0.1],
};

export function layoutKeyframes(layout) {
  if (layout !== 'phone') return KEYFRAMES.map((k) => (k.frac === undefined ? { ...k, frac: 0.5 } : k));
  return KEYFRAMES.map((k) => {
    const [S, frac] = PHONE_TABLE[k.id];
    const x = k.id === 'K10' ? k.pos[0] : 0;
    return { ...k, pos: [x, 0, k.pos[2]], S, frac };
  });
}

// Camera keyframes (U3), same easing as the rig: { s, pos, look, fov }. The camera is the only thing that
// "moves" between chapters besides the rig; phones scale pos z by the portrait fit factor in StoryScene.
export const CAMERA = [
  { s: 0, pos: [0, 0.4, 7.5], look: [0, 0, 0], fov: 35 },
  { s: 60, pos: [0, 0.4, 7.5], look: [0, 0, 0], fov: 35 },
  { s: 100, pos: [0, 0.4, 8.2], look: [0, 0, 0], fov: 35 }, // performance: dolly out
  { s: 200, pos: [0, 0.3, 6.6], look: [-0.25, 0, 0], fov: 35 }, // callouts: dolly in, bias to the shoe
  { s: 300, pos: [0, 0.3, 6.6], look: [-0.25, 0, 0], fov: 35 },
  { s: 400, pos: [0, 0.9, 7.0], look: [0, -0.25, 0], fov: 35 }, // explode: pedestal up, look down
  { s: 500, pos: [0, 0.9, 7.0], look: [0, -0.25, 0], fov: 35 },
  { s: 600, pos: [0, -0.1, 7.2], look: [0, 0, 0], fov: 35 }, // endure: low angle
  { s: 700, pos: [0, 0.3, 7.0], look: [0, 0, 0], fov: 35 }, // colour
  { s: 820, pos: [0, 0.3, 7.0], look: [0, 0, 0], fov: 35 },
  { s: 900, pos: [0, 1.2, 7.8], look: [0, 0.6, 0], fov: 35 }, // finale: crane up
];

export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// Piecewise-linear lookup for dust density etc.
function lerpTable(table, s) {
  if (s <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i += 1) {
    if (s <= table[i][0]) {
      const [s0, v0] = table[i - 1];
      const [s1, v1] = table[i];
      return v0 + ((v1 - v0) * (s - s0)) / (s1 - s0 || 1);
    }
  }
  return table[table.length - 1][1];
}

const DUST = [[0, 1], [60, 1], [110, 0.35], [200, 0.25], [700, 0.25], [710, 0.5], [800, 0.5], [900, 0.8]];

export const CALLOUT_STARTS = [205, 225, 245, 265]; // s (vh) where each callout begins drawing
export const LAYER_STARTS = [440, 455, 470];

const CALLOUT_COUNT = 4;
const LAYER_COUNT = 3;

// Output object is reused when `out` is passed (no per-frame allocations).
export function makeSample() {
  return {
    s: 0, pos: [0, 0, 0], rot: [0, 0, 0], S: 1, frac: 0.5,
    cam: { pos: [0, 0.4, 7.5], look: [0, 0, 0], fov: 35 },
    e: 0, swooshT: 0, swooshOpacity: 0, dust: 1, dustSpeed: 1, float: 0, shoeVisible: true,
    callouts: Array.from({ length: CALLOUT_COUNT }, () => ({ dot: 0, line: 0, text: 0 })),
    layers: new Array(LAYER_COUNT).fill(0),
    calloutIndex: 0, layerIndex: 0,
  };
}

export function sampleTimeline(p, layout = 'desktop', out = makeSample()) {
  const pc = clamp01(Number.isFinite(p) ? p : 0);
  const s = pc * SCROLL_VH;
  const kf = layoutKeyframes(layout);
  out.s = s;

  // Pose between keyframes with easeInOutCubic per segment.
  let i = 0;
  while (i < kf.length - 2 && s > kf[i + 1].s) i += 1;
  const a = kf[i];
  const b = kf[i + 1];
  const t = easeInOutCubic(clamp01((s - a.s) / (b.s - a.s || 1)));
  for (let k = 0; k < 3; k += 1) {
    out.pos[k] = a.pos[k] + (b.pos[k] - a.pos[k]) * t;
    out.rot[k] = a.rot[k] + (b.rot[k] - a.rot[k]) * t;
  }
  out.S = a.S + (b.S - a.S) * t;
  out.frac = (a.frac ?? 0.5) + ((b.frac ?? 0.5) - (a.frac ?? 0.5)) * t;

  // Camera: same easing per segment.
  let ci = 0;
  while (ci < CAMERA.length - 2 && s > CAMERA[ci + 1].s) ci += 1;
  const ca = CAMERA[ci];
  const cb = CAMERA[ci + 1];
  const ct = easeInOutCubic(clamp01((s - ca.s) / (cb.s - ca.s || 1)));
  for (let k = 0; k < 3; k += 1) {
    out.cam.pos[k] = ca.pos[k] + (cb.pos[k] - ca.pos[k]) * ct;
    out.cam.look[k] = ca.look[k] + (cb.look[k] - ca.look[k]) * ct;
  }
  out.cam.fov = ca.fov + (cb.fov - ca.fov) * ct;
  out.shoeVisible = out.S >= (layout === 'phone' ? 0.46 : 0.62);

  // Explode e: 0 -> 1 over s 400-450, hold, 1 -> 0 over s 520-570.
  const up = easeInOutCubic(clamp01((s - 400) / 50));
  const down = easeInOutCubic(clamp01((s - 520) / 50));
  out.e = up * (1 - down);

  // Swoosh draws over s 430-480, then fades with the badges over s 500-530.
  out.swooshT = clamp01((s - 430) / 50);
  out.swooshOpacity = 1 - clamp01((s - 500) / 30);

  // Callouts: dot over 3vh, line over 6vh, text over 6vh; fade out s 300-330 (lines retract first).
  const lineOut = 1 - clamp01((s - 300) / 15);
  const textOut = 1 - clamp01((s - 310) / 20);
  for (let c = 0; c < CALLOUT_COUNT; c += 1) {
    const st = CALLOUT_STARTS[c];
    out.callouts[c].dot = clamp01((s - st) / 3) * textOut;
    out.callouts[c].line = clamp01((s - st - 3) / 6) * lineOut;
    out.callouts[c].text = clamp01((s - st - 9) / 6) * textOut;
  }
  out.calloutIndex = Math.min(CALLOUT_COUNT - 1, Math.max(0, Math.floor((s - 200) / 25)));

  // Layer badges: each over 8vh, all fade with the swoosh.
  const layerOut = 1 - clamp01((s - 500) / 30);
  for (let l = 0; l < LAYER_COUNT; l += 1) out.layers[l] = clamp01((s - LAYER_STARTS[l]) / 8) * layerOut;
  out.layerIndex = Math.min(LAYER_COUNT - 1, Math.max(0, Math.floor((s - 430) / (70 / LAYER_COUNT))));

  out.dust = lerpTable(DUST, s);
  out.dustSpeed = 1 + 0.6 * clamp01((s - 800) / 100);

  // Idle float: hero and colour only.
  const heroF = 1 - clamp01((s - 60) / 40);
  const colourF = clamp01((s - 690) / 10) * (1 - clamp01((s - 820) / 20));
  out.float = Math.max(heroF, colourF);
  return out;
}

// Poses used when reduced motion snaps to a section (SPEC 9.10): s at which the section reads complete.
export const SNAP_S = {
  'story-hero': 0,
  'story-performance': 100,
  'story-callouts': 290,
  'story-explode': 480,
  'story-endure': 600,
  'story-colour': 750,
  'story-finale': 900,
};
