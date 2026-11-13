// Design tokens and styling constants for Landing V2
// Adheres strictly to ui-ux-pro-max guidelines (contrast >= 4.5:1, 44px+ touch targets, 8px rhythm)
import { land, shop, WIDE } from '../theme/tokens.js';

export const tokensV2 = {
  // Brand Grounds
  cream: '#F4EFE6',
  creamDark: '#ECE4D6',
  white: '#FFFFFF',
  ink: '#14120E',
  inkSecondary: '#544D42',
  inkMuted: '#7A7265',
  
  // Signature Brand Colors
  blue: '#2420D9',
  blueHover: '#1B18BA',
  blueWash: 'rgba(36,32,217,0.08)',
  gold: '#FFB800',
  goldLight: '#FFD159',
  saffron: '#FFB800',
  tangerine: '#FF5722',
  pine: '#0D483D',
  pineDark: '#072E27',
  sale: '#C2124F',
  
  // Elevation / Shadows
  shadowCard: '0 4px 20px rgba(20,18,14,0.06), 0 1px 3px rgba(20,18,14,0.04)',
  shadowElevated: '0 12px 36px rgba(20,18,14,0.12), 0 2px 8px rgba(20,18,14,0.06)',
  shadowFloating: '0 24px 64px rgba(20,18,14,0.18), 0 4px 16px rgba(20,18,14,0.08)',
  
  // Border radius tokens
  radiusSm: 8,
  radiusMd: 16,
  radiusLg: 24,
  radiusXl: 32,
  radiusPill: 999,
};

export const FOCUS_RING = {
  '&:focus-visible': {
    outline: `3px solid ${tokensV2.blue}`,
    outlineOffset: 3,
  },
};

export const FOCUS_RING_LIGHT = {
  '&:focus-visible': {
    outline: `3px solid ${tokensV2.gold}`,
    outlineOffset: 3,
  },
};

export const DISPLAY_HEADING = {
  fontWeight: 800,
  ...WIDE,
  letterSpacing: '-0.03em',
  lineHeight: 1.05,
  textWrap: 'balance',
};

export const TRANSITION_SPRING = 'cubic-bezier(0.22, 1, 0.36, 1)';
