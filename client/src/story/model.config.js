// The one file that knows the story model's parts. To swap the model:
//   1. drop the GLBs in client/public/models and point `urls` at them;
//   2. fill each part's `nodeNames` with the GLB node (or mesh) names that make up that part;
//   3. delete `islands` / `where` (they only exist to cut up the current single-mesh stand-in);
//   4. tune `offset` / `rot` (exploded pose, rig units: the shoe is normalised to `length` along +x, toe +x)
//      and `anchor` (label point, as fractions -1..1 of the part's own bounding box).
// Parts are matched in `order`; anything unmatched falls into `fallbackPart`.
//
// The current GLB ('Materials Variants Shoe', Shopify, CC BY 4.0, see SHOE.credit) is ONE mesh made of
// 25 disconnected islands. splitModel.js welds and ranks them by triangle count (0 = largest), which is
// stable for this file. Island map (desktop and mobile files are identical):
//   0 upper shell (incl. the floor = insole, eyelet panels), 1 long lace, 2 sole unit (midsole + outsole),
//   3 tongue, 4 heel pull loop, 5/10-13/22/23 lace crossings, 6-9 side overlays, 14-21 eyelets, 24 heel tab.
// `where` rules cut an island by triangle centroid (mesh-local units, model is -1..1 long) and face normal;
// `below` is a floor line [[x, y], ...] under which the centroid must sit.
import { SHOE } from '../three/shoe.config.js';

export const STORY_MODEL = {
  urls: SHOE.urls,
  credit: SHOE.credit,
  length: 3.0,
  yawOffset: 0, // Math.PI if the new model's toe points -X
  order: ['insole', 'outsole', 'laces', 'tongue', 'midsole', 'upper'],
  fallbackPart: 'upper',
  parts: {
    laces: {
      nodeNames: ['Laces', 'laces'],
      islands: [1, 5, 10, 11, 12, 13, 22, 23],
      offset: [0.15, 1.85, 0],
      rot: [0, 0, 0.1],
      anchor: [0.35, 0.7, 0],
      label: 'Laces',
      detail: 'Flat laces through metal eyelets',
      roughness: 0.85,
    },
    tongue: {
      nodeNames: ['Tongue', 'tongue'],
      islands: [3],
      offset: [0.3, 1.25, 0],
      rot: [0, 0, 0.16],
      anchor: [0.2, 0.85, 0],
      label: 'Tongue',
      detail: 'High-density foam padding',
      roughness: 0.9,
    },
    upper: {
      nodeNames: ['Upper', 'upper'],
      islands: [0, 4, 6, 7, 8, 9, 14, 15, 16, 17, 18, 19, 20, 21, 24],
      offset: [0, 0.62, 0],
      rot: [0, 0, 0],
      anchor: [0.55, 0.1, 1],
      label: 'Upper',
      detail: 'Canvas mesh with PU synthetic leather overlays',
      roughness: null, // keep the texture's roughness
    },
    insole: {
      nodeNames: ['Insole', 'insole', 'Footbed'],
      islands: [0],
      where: { minNormalY: 0.6, below: [[-1, -0.2], [0.05, -0.24], [0.15, -0.29], [1, -0.29]] }, // floor only, not the toe box
      offset: [0, 0.02, 0],
      rot: [0, 0, 0],
      anchor: [-0.55, 0, 0.6],
      label: 'Insole',
      detail: 'Arch support and a cushioned footbed',
      roughness: 0.95,
    },
    midsole: {
      nodeNames: ['Midsole', 'midsole'],
      islands: [2],
      offset: [0, -0.5, 0],
      rot: [0, 0, 0],
      anchor: [-0.6, 0.2, 1],
      label: 'Midsole',
      detail: 'EVA foam for bounce',
      roughness: 0.7,
    },
    outsole: {
      nodeNames: ['Outsole', 'outsole'],
      islands: [2],
      where: { maxY: -0.405 },
      offset: [0, -1.0, 0],
      rot: [0, 0, 0],
      anchor: [0.65, -0.4, 1],
      label: 'Outsole',
      detail: 'Rubber for durability and slip resistance',
      roughness: 0.92,
    },
  },
  // Gradient map per part and colourway: the greyscale albedo is remapped from `dark` (texture black)
  // to `light` (texture white). Keys follow the product's colourway keys.
  colourways: {
    black: {
      upper: ['#101012', '#86868E'],
      tongue: ['#121214', '#7A7A82'],
      laces: ['#141416', '#6A6A72'],
      insole: ['#4A4038', '#B8A68C'],
      midsole: ['#1A1A1C', '#6E6E74'],
      outsole: ['#121212', '#7A7A80'],
    },
    olive: {
      upper: ['#22241A', '#8A8C5E'],
      tongue: ['#25271B', '#7E8056'],
      laces: ['#2C2D22', '#C9C3A6'],
      insole: ['#4A4038', '#B4A386'],
      midsole: ['#56523F', '#E2DBC4'],
      outsole: ['#161613', '#5E5B50'],
    },
  },
};

// Order of the anatomy labels (top of the exploded stack first).
export const LABEL_ORDER = ['laces', 'tongue', 'upper', 'insole', 'midsole', 'outsole'];

// Colours for a colourway key; unknown keys are derived from the swatch hex.
export function partColours(key, hex = '#777777') {
  const cw = STORY_MODEL.colourways[key];
  if (cw) return cw;
  const out = {};
  Object.keys(STORY_MODEL.parts).forEach((p) => {
    out[p] = [shade(hex, 0.25), shade(hex, 1.25)];
  });
  return out;
}

function shade(hex, k) {
  const n = parseInt(hex.replace('#', ''), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
