// Design tokens (SPEC 5.1 / 5.3). Components use these or the MUI theme, never raw hex.
export const tokens = {
  ground: '#0B0A08',
  surface1: '#15130F',
  surface2: '#1C1915',
  surface3: '#24201A',
  ink: '#F2EDE3',
  inkSecondary: '#B8AF9F',
  inkDisabled: '#6E675C',
  gold: '#E2B857',
  goldLight: '#F0CF7A',
  goldDark: '#C99A3A',
  onGold: '#0B0A08',
  blue: '#2A27E9',
  blueLight: '#8C8AFF',
  blueDark: '#120FBF',
  error: '#FF7A72',
  success: '#5BB98C',
  warning: '#F0A85A',
  info: '#8C8AFF',
  divider: 'rgba(242,237,227,0.10)',
  tile: '#EDE7DC',
  white: '#FFFFFF',
  fieldBorder: 'rgba(242,237,227,0.18)',
  fieldBorderHover: 'rgba(242,237,227,0.32)',
  goldWash: 'rgba(226,184,87,0.10)',
  goldRipple: 'rgba(226,184,87,0.24)',
  goldBorder: 'rgba(226,184,87,0.6)',
  goldHoverWash: 'rgba(226,184,87,0.08)',
  scrim: 'rgba(5,4,3,0.72)',
  shadowFloat: '0 24px 64px rgba(0,0,0,0.6)',
  shadowMenu: '0 12px 32px rgba(0,0,0,0.5)',
  // 3D
  slabFootbed: '#C9B79A',
  slabMidsole: '#E8E2D6',
  slabOutsole: '#1A1918',
  dust: '#E2B857',
  rim: '#F0CF7A',
  softbox: '#FFF6E6',
  lightKey: '#FFFFFF',
};

export const chipTones = {
  placed: { bg: 'rgba(140,138,255,0.16)', fg: '#B9B8FF' },
  confirmed: { bg: 'rgba(226,184,87,0.16)', fg: '#F0CF7A' },
  shipped: { bg: 'rgba(42,39,233,0.28)', fg: '#C9C8FF' },
  delivered: { bg: 'rgba(91,185,140,0.16)', fg: '#8FD9B3' },
  cancelled: { bg: 'rgba(255,122,114,0.14)', fg: '#FFB0AA' },
};

export const motionTokens = {
  easeOut: [0.22, 1, 0.36, 1],
  easeExpo: [0.16, 1, 0.3, 1],
  easeInOut: [0.76, 0, 0.24, 1],
  easeExit: [0.55, 0.055, 0.675, 0.19],
  css: {
    easeOut: 'cubic-bezier(0.22,1,0.36,1)',
    easeExpo: 'cubic-bezier(0.16,1,0.3,1)',
    easeInOut: 'cubic-bezier(0.76,0,0.24,1)',
    easeExit: 'cubic-bezier(0.55,0.055,0.675,0.19)',
  },
  press: 140,
  hover: 180,
  ui: 240,
  drawer: 320,
  reveal: 800,
  staggerItem: 70,
  staggerLine: 90,
};

export const FONT_STACK = '"Archivo Variable", "Mukta", system-ui, sans-serif';

// Commerce (Shop, Product, Cart, Checkout, Account): a light system carrying the Home story's identity. Warm off-white
// pages, cream photo tiles (#EDE7DC, the catalogue's own background), Goldstar-blue pill CTAs, and the story's section
// grounds as bands and badges. Every text pairing below is AA (checked: ink 16.7:1, ink2 6.9:1 on ground, blue 7.3:1,
// sale 5.4:1, white on pine 9.7:1, ink on lilac 7.5:1 / saffron 11.5:1 / tangerine 6.0:1).
export const shop = {
  ground: '#F6F2EA',
  surface: '#FFFFFF',
  sunk: '#EFE9DF',
  tile: '#EDE7DC',
  ink: '#16120E',
  ink2: '#5A5247',
  ink3: '#7A7166', // 4.8:1 on white: meta text only
  line: 'rgba(22,18,14,0.10)',
  lineStrong: 'rgba(22,18,14,0.22)',
  lineInk: 'rgba(22,18,14,0.85)',
  blue: '#2A27E9',
  blueHover: '#1F1CC9',
  bluePress: '#1714A8',
  blueWash: 'rgba(42,39,233,0.08)',
  sale: '#C2124F',
  success: '#0F7A4F',
  error: '#B3261E',
  // Home story grounds
  tangerine: '#FF5A1F',
  tangerineInk: '#1A0B05',
  lilac: '#A996FF',
  lilacInk: '#140F33',
  pine: '#0F4D42',
  saffron: '#FFC21A',
  raspberry: '#D0175A',
  aubergine: '#24163F',
  shadowCard: '0 1px 2px rgba(22,18,14,0.06), 0 8px 24px rgba(22,18,14,0.06)',
  shadowLift: '0 2px 4px rgba(22,18,14,0.06), 0 18px 40px rgba(22,18,14,0.12)',
  shadowFloat: '0 24px 64px rgba(22,18,14,0.22)',
  scrim: 'rgba(22,18,14,0.48)',
  radius: { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 },
};

// Archivo at the story's display width.
export const WIDE = { fontStretch: '112%', fontVariationSettings: '"wdth" 112' };
