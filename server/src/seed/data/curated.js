// Hand-curated seed data (SPEC §3.5). Everything here is either a public Goldstar
// spec line (rewritten in sentence case) or presentation data (swatch hexes, ordering).

/** Swatch colour per colourway key, in display order. */
export const SWATCHES = {
  black: { name: 'Black', hex: '#1E1E1E' },
  olive: { name: 'Olive', hex: '#5F6142' },
  pink: { name: 'Pink', hex: '#D9657F' },
  'grey-pink': { name: 'Grey pink', hex: '#B9A3A8' },
  coffee: { name: 'Coffee', hex: '#5A4030' },
  grey: { name: 'Grey', hex: '#8A8A8A' },
};

/** Nepali colour names (G10-401 only). Needs a native-speaker check before public use. */
export const NEPALI_NAMES = {
  'g10-401': { black: 'कालो', olive: 'जैतुनी' },
};

/**
 * Colour per Woo listing id where the `Color` attribute is empty or wrong.
 * 27285, 22961: attribute empty (olive photos). 22798: listing is the grey-pink
 * G10 L2102 but Woo's attribute says "Pink", which would merge it into 27299.
 */
export const COLOUR_OVERRIDES = {
  27285: 'olive',
  22961: 'olive',
  22798: 'grey-pink',
};

export const SORT_ORDER = {
  'g10-401': 1,
  'g10-l2102': 2,
  'ax-1-a': 3,
  'ax-3': 4,
  ax: 5,
};

export const FEATURED_SLUG = 'g10-401';

/** Acronyms that stay upper case when spec lines are sentence-cased. */
export const ACRONYMS = ['EVA', 'PU'];

/** G10-401 spec callouts (SPEC §3.5 table, exact copy). */
export const G10_401_CALLOUTS = [
  { order: 1, key: 'canvas-mesh', stage: 'callout', anchor: 'upper', badge: null, title: 'Canvas mesh upper', body: 'Canvas mesh makes up the body of the upper.' },
  { order: 2, key: 'pu-overlays', stage: 'callout', anchor: 'overlay', badge: null, title: 'PU synthetic leather', body: 'Synthetic leather overlays sit over the mesh where it meets the sole and heel.' },
  { order: 3, key: 'metal-eyelets', stage: 'callout', anchor: 'eyelets', badge: null, title: 'Metal eyelets', body: 'Metal eyelets, fitted for ruggedness.' },
  { order: 4, key: 'foam-collar', stage: 'callout', anchor: 'collar', badge: null, title: 'High-density foam', body: 'High-density foam padding around the collar.' },
  { order: 5, key: 'footbed', stage: 'layer', anchor: 'footbed', badge: 'support', title: 'Arch support', body: 'Arch support and a cushioned footbed.' },
  { order: 6, key: 'eva-midsole', stage: 'layer', anchor: 'midsole', badge: 'cushion', title: 'EVA midsole', body: 'An EVA midsole for bounce.' },
  { order: 7, key: 'rubber-outsole', stage: 'layer', anchor: 'outsole', badge: 'grip', title: 'Rubber outsole', body: 'A rubber outsole for durability and slip resistance.' },
].map((c) => ({ ...c, position: null }));

export const CALLOUTS_BY_SLUG = {
  'g10-401': G10_401_CALLOUTS,
};
