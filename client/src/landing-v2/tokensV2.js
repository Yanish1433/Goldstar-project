// Landing design tokens: the ONLY file in landing-v2 that holds raw colour values.
// Direction "dark-room" (.taste-skill/direction.json): one warm near-black ground from top to bottom, a soft ivory
// ink, a dimmer ivory for secondary text, and Goldstar gold as the single accent (dark ground, large type and
// hairlines only: gold on ivory fails AA for text, so on ivory surfaces the accent drops to goldDeep).
// Product photos bring their own colour; UI chrome never does. Contrast pairs are tested in test/landingV2.test.jsx.
import { WIDE } from '../theme/tokens.js';

// 'rgba(r,g,b,a)' from a '#RRGGBB' token: components build translucent tints with this, never by hand.
export const alpha = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

const C = {
  ground: '#0D0C0A', // warm brown-black page ground
  groundRaised: '#16140F',
  groundLift: '#1F1C16',
  ivory: '#F2EDE3', // primary ink on the ground
  ivoryDim: '#BDB4A4', // secondary ink on the ground (>= 7:1)
  ivoryFaint: '#948B7B', // small labels on the ground (>= 4.5:1)
  gold: '#E2B857', // the one accent
  goldDeep: '#75561A', // the accent on ivory surfaces (stars, small marks)
  paper: '#F2EDE3', // lit surfaces: product tiles, review cards, modal
  paperDim: '#E4DCCB',
  inkOnPaper: '#16140F',
  inkOnPaper2: '#4E4738',
  inkOnPaper3: '#6B6353',
  black: '#000000',
};

export const tokensV2 = {
  ...C,
  line: alpha(C.ivory, 0.12),
  lineStrong: alpha(C.ivory, 0.24),
  lineOnPaper: alpha(C.inkOnPaper, 0.1),
  goldWash: alpha(C.gold, 0.12),
  goldLine: alpha(C.gold, 0.55),
  veil: alpha(C.ground, 0.72),
  scrim: alpha(C.ground, 0.78),
  ivoryWash: alpha(C.ivory, 0.06),
  onGold: C.inkOnPaper,

  // Legacy names (QuickViewModal, Reviews3DV2 and the tests import them): mapped onto the restrained palette.
  cream: C.paper,
  creamDark: C.paperDim,
  white: C.paper,
  ink: C.inkOnPaper,
  inkSecondary: C.inkOnPaper2,
  inkMuted: C.inkOnPaper3,
  blue: C.inkOnPaper,
  blueHover: C.groundLift,
  blueWash: alpha(C.inkOnPaper, 0.06),
  goldLight: C.gold,
  saffron: C.gold,
  tangerine: C.gold,
  pine: C.groundRaised,
  pineDark: C.ground,
  sale: C.goldDeep,

  // Elevation: shadows are darkness, never colour.
  shadowCard: `0 4px 20px ${alpha(C.black, 0.18)}, 0 1px 3px ${alpha(C.black, 0.12)}`,
  shadowElevated: `0 14px 40px ${alpha(C.black, 0.32)}, 0 2px 8px ${alpha(C.black, 0.16)}`,
  shadowFloating: `0 28px 72px ${alpha(C.black, 0.55)}, 0 4px 16px ${alpha(C.black, 0.24)}`,
  photoShadow: `drop-shadow(0 18px 24px ${alpha(C.black, 0.28)})`,

  radiusSm: 8,
  radiusMd: 16,
  radiusLg: 24,
  radiusXl: 32,
  radiusPill: 999,
};

// Lifestyle photographs are pulled into the room: warm monochrome, a little darker. They take their own colour
// back on hover/focus (see Categories), product photos are never treated.
export const PHOTO_MONO = 'grayscale(1) sepia(0.28) brightness(0.62) contrast(1.06)';
export const PHOTO_LIVE = 'grayscale(0) sepia(0) brightness(0.86) contrast(1.04)';

// One focus ring for both grounds: a gold line with a dark halo, visible on the ground and on ivory surfaces.
export const FOCUS_RING = {
  '&:focus-visible': {
    outline: `2px solid ${C.gold}`,
    outlineOffset: 2,
    boxShadow: `0 0 0 6px ${C.inkOnPaper}`,
  },
};
export const FOCUS_RING_LIGHT = FOCUS_RING;

// Reviews3DV2 keeps its heavy heading; the new sections use the light editorial display below.
export const DISPLAY_HEADING = {
  fontWeight: 800,
  ...WIDE,
  letterSpacing: '-0.03em',
  lineHeight: 1.05,
  textWrap: 'balance',
};

// Dark-room type: light weights glow on dark. Extended Archivo at 300, tight but not cramped.
export const DISPLAY_LIGHT = {
  fontWeight: 300,
  fontStretch: '118%',
  fontVariationSettings: '"wdth" 118',
  letterSpacing: '-0.035em',
  lineHeight: 0.98,
  textWrap: 'balance',
  m: 0,
};

export const EYEBROW = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: C.ivoryFaint,
};

// One easing family for the whole page (GSAP 'expo.out' / 'power3.out' and this CSS curve).
export const EASE_CSS = 'cubic-bezier(0.16, 1, 0.3, 1)';
export const TRANSITION_SPRING = EASE_CSS;

export const PHONE = '@media (max-width:899.95px)';
export const FINE_POINTER = '@media (hover: hover) and (pointer: fine)';
export const REDUCED = '@media (prefers-reduced-motion: reduce)';
