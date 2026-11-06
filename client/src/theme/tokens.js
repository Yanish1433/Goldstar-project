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
export const CONCEPT_NOTE = 'Concept prototype — not an official Goldstar site.';
