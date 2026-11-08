// The one file that knows the boot's parts.
//
// Model: the Goldstar G10-401 trek boot, modelled part by part in Blender from Goldstar product photography
// (.firstmate/reports/blender.md). Every part is a closed solid with its own PBR material: the colour is the
// material's base colour only, and all the detail (nubuck grain, mesh weave, stitching, bubble foam, lugs) lives in
// the baked normal + ORM textures, so a colourway is one colour per part and the detail survives any tint.
//   g10-hd.glb        desktop (~280k tris, includes the insole), packed by scripts/pack-g10.mjs to ~3.5 MB
//   g10-hd-mobile.glb lite tier (~95k tris, textures halved, no insole: a footbed is generated from the midsole)
// glTF space: metres, Y-up, toe +X, sole at y 0, boot 0.299 m long. The rig normalises it to `length` rig units.

const LENGTH = 3.0;
const SOURCE_LENGTH = 0.299; // metres
// Exploded offsets from the Blender export (exploded.json, metres) converted to rig units.
const m = (x, y, z) => [x, y, z].map((v) => +((v * LENGTH) / SOURCE_LENGTH).toFixed(3));

export const STORY_MODEL = {
  urls: { desktop: '/models/g10-hd.glb', mobile: '/models/g10-hd-mobile.glb' },
  length: LENGTH,
  yawOffset: 0,
  frame: 1.18, // framing radius multiplier vs the storyline (a mid-cut boot is taller than a sneaker)
  // Materials that keep their baked colour in every colourway (the grey tongue logo, the gunmetal hardware).
  keepMaterials: ['logo', 'eyelets'],
  order: ['outsole', 'midsole', 'insole', 'upper', 'overlays', 'toe_cap', 'heel_counter', 'eyelets', 'laces', 'tongue', 'collar', 'pull_tab'],
  fallbackPart: 'upper',
  parts: {
    outsole: { nodeNames: ['outsole'], offset: m(0, -0.075, 0), rot: [0, 0, 0], anchor: [0.5, -0.4, 1], label: 'Outsole', detail: 'Rubber lugs for grip and slip resistance' },
    midsole: { nodeNames: ['midsole'], offset: m(0, -0.038, 0), rot: [0, 0, 0], anchor: [-0.5, 0, 1], label: 'Midsole', detail: 'EVA foam for bounce' },
    insole: { nodeNames: ['insole'], generate: 'footbed', offset: m(0, 0.012, 0), rot: [0, 0, 0], anchor: [-0.35, 1, 0.3], label: 'Insole', detail: 'Arch support and a cushioned footbed' },
    upper: { nodeNames: ['upper'], offset: m(0, 0.06, 0), rot: [0, 0, 0], anchor: [-0.25, 0, 1], label: 'Upper', detail: 'PU synthetic leather over canvas mesh' },
    overlays: { nodeNames: ['overlays'], offset: m(0, 0.095, 0), rot: [0, 0, 0], anchor: [0.2, -0.3, 1], label: 'Leather overlays', detail: 'PU synthetic leather cage over the mesh' },
    toe_cap: { nodeNames: ['toe_cap'], offset: m(0.06, 0.05, 0), rot: [0, 0, -0.06], anchor: [0.4, 0, 1], label: 'Toe cap', detail: 'Rubber bumper against rocks and roots' },
    heel_counter: { nodeNames: ['heel_counter'], offset: m(-0.065, 0.055, 0), rot: [0, 0, 0.06], anchor: [-0.4, 0, 1], label: 'Heel counter', detail: 'Holds the heel steady on uneven ground' },
    eyelets: { nodeNames: ['eyelets'], offset: m(0.095, 0.09, 0), rot: [0, 0, 0], anchor: [0, 0.2, 1], label: 'Metal hardware', detail: 'D-rings and speed hooks' },
    laces: { nodeNames: ['laces'], offset: m(0.12, 0.13, 0), rot: [0, 0, 0.05], anchor: [-0.1, 0.1, 1], label: 'Laces', detail: 'Thick woven laces' },
    tongue: { nodeNames: ['tongue'], offset: m(0.075, 0.115, 0), rot: [0, 0, 0.1], anchor: [-0.4, 0.63, 0], label: 'Tongue', detail: 'Padded, with the Goldstar logo' },
    collar: { nodeNames: ['collar'], offset: m(-0.02, 0.13, 0), rot: [0, 0, -0.04], anchor: [0, 0.8, 0.8], label: 'Collar', detail: 'High-density foam padding' },
    pull_tab: { nodeNames: ['pull_tab'], offset: m(-0.075, 0.13, 0), rot: [0, 0, 0], anchor: [0, 0.5, 0], label: 'Pull tab', detail: 'Webbing loop for a quick pull-on' },
  },
};

// Storyboard callouts on the assembled boot (chapter "callouts"). Anchors: part + fraction of its bounding box.
export const CALLOUTS = [
  { key: 'logo', part: 'tongue', anchor: [-0.4, 0.63, 0], title: 'Goldstar Nepal', sub: 'Goldstar Trek' },
  { key: 'upper', part: 'upper', anchor: [0.15, -0.3, 1], title: 'Premium synthetic upper', sub: 'Abrasion resistant' },
  { key: 'hardware', part: 'eyelets', anchor: [-0.2, 0.3, 1], title: 'Reinforced metal hardware', sub: 'Secure lace locks' },
  { key: 'grip', part: 'outsole', anchor: [0.45, -0.3, 1], title: 'Traction grip', sub: 'Engineered for Nepal’s terrain' },
];

// Icon badges in the exploded "Designed to endure" chapter.
export const BADGES = [
  { key: 'water', part: 'upper', anchor: [0.3, -0.2, 1], title: 'Water repellent', icon: 'droplets' },
  { key: 'cushion', part: 'insole', anchor: [-0.4, 1, 0.4], title: 'Cushioned insole', icon: 'layers' },
];

// Every part, top of the exploded stack first (screen readers and the parts list).
export const LABEL_ORDER = ['collar', 'pull_tab', 'tongue', 'laces', 'eyelets', 'heel_counter', 'toe_cap', 'overlays', 'upper', 'insole', 'midsole', 'outsole'];

// Product page hotspots: the catalogue's spec-callout anchor keys -> a part and a point on it.
export const VIEWER_ANCHORS = {
  upper: { part: 'upper', anchor: [0.55, 0.05, 1] },
  overlay: { part: 'overlays', anchor: [-0.45, -0.35, 1] },
  eyelets: { part: 'eyelets', anchor: [-0.2, 0.3, 1] },
  collar: { part: 'collar', anchor: [0, 0.8, 0.8] },
  footbed: { part: 'midsole', anchor: [-0.75, 1, 1] },
  midsole: { part: 'midsole', anchor: [0.1, 0, 1] },
  outsole: { part: 'outsole', anchor: [0.55, -0.3, 1] },
};

// Display colourways (storyboard names), one colour per part (sRGB). `product` maps to the real SKU's colourway key
// for the cart; null = not sold yet ("Coming soon"). Unlisted parts use the upper's colour.
export const COLOURWAYS = [
  {
    key: 'earth', name: 'Himalayan Earth', hex: '#6E5236', product: 'olive',
    parts: { upper: '#7A5A3B', overlays: '#5A3F28', toe_cap: '#3E2B1C', heel_counter: '#3E2B1C', collar: '#4A3524', tongue: '#7A5A3B', laces: '#2B1F15', pull_tab: '#3E2B1C', insole: '#B08E68', midsole: '#6A664E', outsole: '#1E1C1A' },
  },
  {
    key: 'pink', name: 'Annapurna Pink', hex: '#E8628E', product: null,
    parts: { upper: '#E2789A', overlays: '#C9577F', toe_cap: '#2B2328', heel_counter: '#2B2328', collar: '#B9446C', tongue: '#E2789A', laces: '#F1E4E8', pull_tab: '#2B2328', insole: '#E8A3B9', midsole: '#F2DCE3', outsole: '#2B2328' },
  },
  {
    key: 'grey', name: 'Everest Grey', hex: '#A3A8AE', product: null,
    parts: { upper: '#8F949A', overlays: '#6B7076', toe_cap: '#3A3D41', heel_counter: '#3A3D41', collar: '#5B5F64', tongue: '#8F949A', laces: '#2B2D30', pull_tab: '#3A3D41', insole: '#7F8388', midsole: '#CDD1D5', outsole: '#232427' },
  },
  {
    key: 'black', name: 'Kathmandu Black', hex: '#1E1E20', product: 'black',
    parts: { upper: '#303034', overlays: '#262628', toe_cap: '#1F1F21', heel_counter: '#232325', collar: '#2A2A2D', tongue: '#303034', laces: '#1C1C1E', pull_tab: '#2A2A2D', insole: '#4A4038', midsole: '#38383C', outsole: '#1A1A1B' },
  },
];
export const DEFAULT_COLOUR = 'earth';
export const colourwayOf = (key) => COLOURWAYS.find((c) => c.key === key) || COLOURWAYS[0];
// Display colourway for a catalogue colourway key (the cart box): falls back to black.
export const displayForProduct = (productKey) => COLOURWAYS.find((c) => c.product === productKey) || COLOURWAYS.find((c) => c.key === 'black');

// Per-part colour (sRGB hex) for a display colourway key.
export function partColours(key) {
  return colourwayOf(key).parts;
}
export const partColour = (key, part) => partColours(key)[part] || partColours(key).upper;
