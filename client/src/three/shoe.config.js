// The one file that knows about the model. Swap the GLB, then only this file changes (SPEC 9.3).
//
// Credit: 3D shoe 'Materials Variants Shoe' (c) 2021 Shopify, Inc., licensed CC BY 4.0
// (https://creativecommons.org/licenses/by/4.0/), from the Khronos glTF Sample Assets
// (https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/MaterialsVariantsShoe).
// Recoloured and compressed. Logos and trademarks excluded. The 3D model is a stand-in
// sneaker, not the Goldstar G10-401.
export const SHOE = {
  urls: { desktop: '/models/shoe-desktop.glb', mobile: '/models/shoe-mobile.glb' },
  normalise: { length: 3.0, axis: 'x', yawOffset: 0 }, // yawOffset = Math.PI if the toe points -X
  // Part -> GLB node names. Empty array = no such node: use the code slab for that part.
  parts: {
    upper: ['Shoe'],
    footbed: [],
    midsole: [],
    outsole: [],
  },
  // Code slabs (used when parts[x] is empty). Thickness in normalised units.
  slabs: {
    footbed: { thickness: 0.05, inset: 0.94, color: '#C9B79A', roughness: 0.9, metalness: 0 },
    midsole: { thickness: 0.16, inset: 0.98, color: '#E8E2D6', roughness: 0.7, metalness: 0 },
    outsole: { thickness: 0.09, inset: 1.0, color: '#1A1918', roughness: 0.95, metalness: 0 },
  },
  // Callout anchors in normalised shoe-local fractions: u along length (-1 heel .. +1 toe),
  // v up (-1 bottom .. +1 top), w across (-1 medial .. +1 lateral, +1 faces camera at yaw 0).
  anchors: {
    collar: [-0.5, 0.8, 0.4],
    eyelets: [-0.15, 0.5, 0.3],
    upper: [0.55, 0.15, 0.95],
    overlay: [-0.08, -0.3, 0.95],
    footbed: 'slab:footbed',
    midsole: 'slab:midsole',
    outsole: 'slab:outsole',
  },
  // Anchors are snapped onto the mesh surface at load by casting a ray from outside:
  // 'lateral' casts from +z toward the shoe at (u, v); 'top' casts down at (u, w).
  anchorRays: { collar: 'top', eyelets: 'top', upper: 'lateral', overlay: 'lateral' },
  // Product viewer hotspots for the three layer parts, placed on the sole wall (rays from +z at u, v).
  viewerLayerAnchors: { footbed: [-0.35, -0.62], midsole: [0.1, -0.78], outsole: [0.55, -0.92] },
  tints: {
    black: { color: '#4A4846', roughness: 1.0 },
    olive: { color: '#8C8A5A', roughness: 1.0 },
    fallback: { color: '#B0AAA0', roughness: 1.0 },
  },
  // Look (Addendum B U1/U2/S1): studio rim, fresnel gold edge and material realism. Strength per chapter.
  look: {
    rimColor: '#E2B857',
    rimPower: 4.0,
    rimByChapter: { 'story-hero': 0.35, 'story-performance': 0.35, 'story-callouts': 0.2, 'story-explode': 0.25, 'story-endure': 0.3, 'story-colour': 0.3, 'story-finale': 0.3 },
    rimFlight: 0.5,
    liteRimScale: 0.8,
    environmentIntensity: 1.4,
    exposure: 1.1,
    normalScale: 1.25,
    clearcoat: 0.6,
    clearcoatRoughness: 0.25,
    sheen: 0.4,
    sheenColor: '#3A352C',
  },
  // Rig-space extents the anchor fractions map onto.
  extents: { u: 1.5, v: 0.77, w: 0.585 },
  bottomY: -0.77,
  credit: {
    title: 'Materials Variants Shoe',
    author: 'Shopify, Inc.',
    year: 2021,
    licence: 'CC BY 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    source: 'https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/MaterialsVariantsShoe',
    changes: 'Recoloured, textures resized and compressed.',
  },
};

export const tintFor = (key) => SHOE.tints[key] || SHOE.tints.fallback;
