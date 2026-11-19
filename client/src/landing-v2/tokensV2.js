// Landing design tokens: the ONLY file in landing-v2 that holds raw colour values.
// Direction "daylight" (round 3, the captain: "a joy colour that matches the vibe of Goldstar"). Taken from
// goldstarshoes.com's own stylesheet: royal blue #2A27E9 is the brand's working colour (buttons, links, banners),
// navy #0B1A48 its ink, a warm sand #EBC989 its second note, on white. So: a white / cream page ground, navy ink,
// royal blue as the confident accent (CTAs, eyebrows, the full-bleed colour moments: the hero's disc, the ticker,
// the heritage wipe) and sand as the warm accent. Two hue families only: brand blue (blue + navy) and sand.
// Sand on white fails AA for text, so on light grounds sand is a fill / shape only; as text it lives on royal blue
// (>= 4.5:1), and on light grounds its text form is sandDeep. Product photos show their true colour.
// Contrast pairs are tested in test/landingV2.test.jsx.

// 'rgba(r,g,b,a)' from a '#RRGGBB' token: components build translucent tints with this, never by hand.
export const alpha = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

const C = {
  ground: '#FFFFFF', // page ground
  cream: '#FAF6EE', // alternate band ground, product tiles
  creamDeep: '#F1EAD9', // skeletons, pressed tiles
  navy: '#0B1A48', // primary ink
  ink2: '#3A4466', // secondary ink (>= 7:1 on white and cream)
  ink3: '#5A6382', // small labels (>= 4.5:1 on white and cream)
  blue: '#2A27E9', // royal blue: the brand accent
  blueDeep: '#120FBF', // hover / pressed blue
  onBlue: '#FFFFFF', // ink on royal blue
  onBlue2: '#D9DBFF', // secondary ink on royal blue (>= 4.5:1)
  sand: '#EBC989', // the warm accent: fills and shapes on light grounds, text only on blue
  sandSoft: '#F7E9CB', // sand wash (pills, glows)
  sandDeep: '#7A5915', // sand as text on light grounds (sale, ratings)
  white: '#FFFFFF',
  // The one sanctioned extra hue (round 4): the sky-blue ground of the hero's group photo (the mean of the photo's
  // edge pixels). Used only as the hero's photo ground, so the "flood" carries the photo's own sky to the screen
  // edges. Never a text colour, never on royal blue.
  photoGround: '#57C8E1',
};

export const tokensV2 = {
  ...C,
  ink: C.navy,
  line: alpha(C.navy, 0.1),
  lineStrong: alpha(C.navy, 0.22),
  lineOnBlue: alpha(C.onBlue, 0.28),
  blueWash: alpha(C.blue, 0.08),
  scrim: alpha(C.navy, 0.55),
  onAccent: C.onBlue,

  // Legacy names (QuickViewModal, Reviews3DV2 and the tests import them): remapped deliberately onto the daylight
  // palette (lit surfaces are white / cream, ink is navy, the accent is the real brand blue, gold means sand).
  paper: C.ground,
  paperDim: C.cream,
  inkOnPaper: C.navy,
  inkOnPaper2: C.ink2,
  inkOnPaper3: C.ink3,
  lineOnPaper: alpha(C.navy, 0.1),
  ivory: C.navy,
  ivoryDim: C.ink2,
  ivoryFaint: C.ink3,
  inkSecondary: C.ink2,
  inkMuted: C.ink3,
  blueHover: C.blueDeep,
  gold: C.sand,
  goldLight: C.sandSoft,
  goldDeep: C.sandDeep,
  goldWash: C.sandSoft,
  saffron: C.sand,
  tangerine: C.blue,
  pine: C.navy,
  pineDark: C.navy,
  sale: C.sandDeep,

  // Elevation: soft navy-tinted shadows on the light grounds.
  shadowCard: `0 4px 18px ${alpha(C.navy, 0.07)}, 0 1px 3px ${alpha(C.navy, 0.06)}`,
  shadowElevated: `0 14px 36px ${alpha(C.navy, 0.12)}, 0 2px 8px ${alpha(C.navy, 0.06)}`,
  shadowFloating: `0 28px 64px ${alpha(C.navy, 0.16)}, 0 4px 14px ${alpha(C.navy, 0.08)}`,
  shadowOnBlue: `0 30px 60px ${alpha(C.blueDeep, 0.45)}, 0 6px 16px ${alpha(C.navy, 0.25)}`,

  radiusSm: 8,
  radiusMd: 16,
  radiusLg: 24,
  radiusXl: 32,
  radiusPill: 999,
};

// Studio photos on white / cream tiles: their off-white sweep is lifted to pure white so `multiply` melts it into the
// tile (no visible photo box). Used with mixBlendMode: 'multiply', on white or cream tiles only (never on blue: the
// product would take the tint).
export const PHOTO_TILE = 'brightness(1.09) contrast(1.03)';

// One focus ring for every ground: a royal-blue line inside a white halo, visible on white, cream and on blue.
export const FOCUS_RING = {
  '&:focus-visible': {
    outline: `2px solid ${C.blue}`,
    outlineOffset: 2,
    boxShadow: `0 0 0 6px ${C.white}`,
  },
};
export const FOCUS_RING_LIGHT = FOCUS_RING;

// The landing's display face (round 4, the captain: "use this kind of writing font", the /g10 finale): the global
// theme family, Archivo Variable, on its width axis: heavy and extended (the WIDE recipe of src/landing/ui.jsx and
// the story finale: weight 800, wdth 112, -0.035em). @fontsource-variable/archivo/wdth.css is already loaded by
// main.jsx, so the landing ships no font file of its own.
export const KINETIC_FAMILY = '"Archivo Variable", "Mukta", system-ui, sans-serif';
export const WIDE = { fontStretch: '112%', fontVariationSettings: '"wdth" 112' };
export const KINETIC = {
  fontFamily: KINETIC_FAMILY,
  ...WIDE,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '-0.035em',
  lineHeight: 0.9,
  m: 0,
};

// Reviews3DV2 keeps its layout; its heading takes the landing's display face (a token change only).
export const DISPLAY_HEADING = {
  ...KINETIC,
  fontWeight: 760,
  lineHeight: 0.92,
  textWrap: 'balance',
};

// Section headings: the display face, uppercase, heavy.
export const DISPLAY_LIGHT = {
  ...KINETIC,
  fontWeight: 720,
  lineHeight: 0.9,
  textWrap: 'balance',
};

export const EYEBROW = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: C.blue,
};

// One easing family for the whole page (GSAP 'expo.out' / 'power3.out' and this CSS curve). One duration scale.
export const DUR = { fast: 0.24, base: 0.6, slow: 1.1 };
export const EASE_CSS = 'cubic-bezier(0.16, 1, 0.3, 1)';
export const TRANSITION_SPRING = EASE_CSS;

export const PHONE = '@media (max-width:899.95px)';
export const FINE_POINTER = '@media (hover: hover) and (pointer: fine)';
export const REDUCED = '@media (prefers-reduced-motion: reduce)';
