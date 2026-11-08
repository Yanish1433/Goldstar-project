// The one file that knows the story model's parts.
//
// Model: Goldstar G10-401 trek boot, reconstructed from Goldstar product photography (multi-view photo-to-3D,
// see .firstmate/reports/img3d-mv.md), built by `node scripts/build-g10.mjs <dir>` into g10-desktop.glb /
// g10-mobile.glb with a greyscale albedo that the story recolours per part (gradient map).
//
// To swap the model: point `urls` at the new GLBs, list each part's node names in `nodeNames`, tune `offset` /
// `rot` (exploded pose, rig units: the boot is normalised to `length` along +x, toe +x, centred) and `anchor`
// (fractions -1..1 of the part's own bounding box). `islands` / `where` rules (see splitModel.js) are only for
// single-mesh models. A part with `generate: 'footbed'` is modelled at load from the midsole outline.

export const STORY_MODEL = {
  urls: { desktop: '/models/g10-desktop.glb', mobile: '/models/g10-mobile.glb' },
  credit: 'G10-401 3D model reconstructed from Goldstar product photography.',
  length: 3.0,
  yawOffset: 0,
  frame: 1.18, // framing radius multiplier vs the storyline (a mid-cut boot is taller than a sneaker)
  albedoGain: 2.3, // the baked greyscale albedo is dark: stretch it before the gradient map
  order: ['outsole', 'midsole', 'insole', 'upper', 'laces', 'tongue', 'collar'],
  fallbackPart: 'upper',
  parts: {
    outsole: { nodeNames: ['outsole'], offset: [0, -0.72, 0], rot: [0, 0, 0], anchor: [0.5, -0.4, 1], label: 'Outsole', detail: 'Rubber lugs for traction', roughness: 0.92 },
    midsole: { nodeNames: ['midsole'], offset: [0, -0.36, 0], rot: [0, 0, 0], anchor: [-0.5, 0, 1], label: 'Midsole', detail: 'EVA foam for bounce', roughness: 0.75 },
    insole: { generate: 'footbed', offset: [0, 0.06, 0], rot: [0, 0, 0], anchor: [-0.35, 1, 0.3], label: 'Insole', detail: 'Arch support and a cushioned footbed', roughness: 0.95 },
    upper: { nodeNames: ['upper'], offset: [0, 0.42, 0], rot: [0, 0, 0], anchor: [-0.25, 0, 1], label: 'Upper', detail: 'Premium synthetic, abrasion resistant', roughness: null },
    laces: { nodeNames: ['laces'], offset: [0.1, 0.74, 0], rot: [0, 0, 0.05], anchor: [-0.1, 0.1, 1], label: 'Laces + hardware', detail: 'Reinforced metal lace locks', roughness: 0.8 },
    tongue: { nodeNames: ['tongue'], offset: [0.2, 1.0, 0], rot: [0, 0, 0.1], anchor: [0.7, 0.45, 0], label: 'Tongue', detail: 'Padded, with the Goldstar logo', roughness: 0.85 },
    collar: { nodeNames: ['collar'], offset: [-0.08, 1.2, 0], rot: [0, 0, -0.04], anchor: [0, 0.8, 0.8], label: 'Collar', detail: 'High-density foam padding', roughness: 0.85 },
  },
};

// Storyboard callouts on the assembled boot (chapter "callouts"). Anchors: part + fraction of its bounding box.
export const CALLOUTS = [
  { key: 'logo', part: 'tongue', anchor: [0.75, 0.35, 0], title: 'Goldstar Nepal', sub: 'Goldstar Trek' },
  { key: 'upper', part: 'upper', anchor: [0.45, -0.25, 1], title: 'Premium synthetic upper', sub: 'Abrasion resistant' },
  { key: 'hardware', part: 'laces', anchor: [-0.15, 0.25, 1], title: 'Reinforced metal hardware', sub: 'Secure lace locks' },
  { key: 'grip', part: 'outsole', anchor: [0.45, -0.3, 1], title: 'Traction grip', sub: 'Engineered for Nepal’s terrain' },
];

// Icon badges in the exploded "Designed to endure" chapter.
export const BADGES = [
  { key: 'water', part: 'upper', anchor: [0.6, -0.2, 1], title: 'Water repellent', icon: 'droplets' },
  { key: 'cushion', part: 'insole', anchor: [-0.4, 1, 0.4], title: 'Cushioned insole', icon: 'layers' },
];

// Order of the exploded layers (top of the stack first), for the phone legend and screen readers.
export const LABEL_ORDER = ['collar', 'tongue', 'laces', 'upper', 'insole', 'midsole', 'outsole'];

// Display colourways (storyboard names). `product` maps to the real SKU's colourway key for the cart;
// null = not sold yet ("Coming soon").
export const COLOURWAYS = [
  {
    key: 'earth', name: 'Himalayan Earth', hex: '#6E5236', product: 'olive',
    parts: { upper: ['#2A1C11', '#BC8D5E'], collar: ['#21170E', '#9A7150'], tongue: ['#2A1C11', '#C99C70'], laces: ['#120D09', '#6A4F3A'], insole: ['#5A4632', '#C9AA86'], midsole: ['#33332A', '#8E8C70'], outsole: ['#101010', '#4A4A46'] },
  },
  {
    key: 'pink', name: 'Annapurna Pink', hex: '#E8628E', product: null,
    parts: { upper: ['#A99DA4', '#FAF5F7'], collar: ['#6E1E3A', '#EE6E98'], tongue: ['#A99DA4', '#FAF5F7'], laces: ['#3E3A40', '#B4AEB6'], insole: ['#6E1E3A', '#EE6E98'], midsole: ['#8E2049', '#F27CA3'], outsole: ['#17151A', '#4A4650'] },
  },
  {
    key: 'grey', name: 'Everest Grey', hex: '#A3A8AE', product: null,
    parts: { upper: ['#34383C', '#BFC4C9'], collar: ['#272A2D', '#8E9399'], tongue: ['#34383C', '#C9CDD1'], laces: ['#1B1D20', '#6A6E73'], insole: ['#3E4246', '#ADB2B7'], midsole: ['#7E8286', '#E6E8EA'], outsole: ['#151618', '#45474A'] },
  },
  {
    key: 'black', name: 'Kathmandu Black', hex: '#1E1E20', product: 'black',
    parts: { upper: ['#0B0B0C', '#6E6E74'], collar: ['#09090A', '#58585E'], tongue: ['#0B0B0C', '#9A9AA0'], laces: ['#0D0D0F', '#606066'], insole: ['#3A332C', '#A0907C'], midsole: ['#141416', '#5A5A60'], outsole: ['#0A0A0A', '#3E3E42'] },
  },
];
export const DEFAULT_COLOUR = 'earth';
export const colourwayOf = (key) => COLOURWAYS.find((c) => c.key === key) || COLOURWAYS[0];

// Per-part [dark, light] for a display colourway key.
export function partColours(key) {
  return colourwayOf(key).parts;
}
