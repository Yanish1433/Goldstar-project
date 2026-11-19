// Store (Shop / Login / Register) tokens. These values MIRROR landing-v2/tokensV2.js (royal blue, navy ink, sand, cream)
// on purpose: the store must not import from landing-v2, whose files change independently. Sand is a fill on light
// grounds (navy text on it: 9:1); as text it lives only on royal blue.
export const store = {
  ground: '#FFFFFF',
  cream: '#FAF6EE',
  creamDeep: '#F1EAD9',
  navy: '#0B1A48',
  ink2: '#3A4466', // >= 7:1 on white and cream
  ink3: '#5A6382', // >= 4.5:1 on white and cream
  blue: '#2A27E9',
  blueDeep: '#120FBF',
  onBlue: '#FFFFFF',
  onBlue2: '#D9DBFF', // >= 4.5:1 on royal blue
  sand: '#EBC989',
  sandSoft: '#F7E9CB',
  sale: '#C2124F',
  error: '#B3261E',
  line: 'rgba(11,26,72,0.10)',
  lineStrong: 'rgba(11,26,72,0.22)',
  shadowCard: '0 1px 2px rgba(11,26,72,0.06), 0 10px 28px rgba(11,26,72,0.07)',
  shadowLift: '0 2px 4px rgba(11,26,72,0.08), 0 22px 44px rgba(11,26,72,0.16)',
  radius: { md: 14, lg: 22, xl: 30, pill: 999 },
};

// The wide, heavy grotesk of the /g10 finale: Archivo at width 112, weight 800.
export const DISPLAY = {
  fontWeight: 800, fontStretch: '112%', fontVariationSettings: '"wdth" 112', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 0.96,
};

// Blue focus ring for light grounds / white ring for the blue ground.
export const ring = (onBlue = false) => ({ outline: `2px solid ${onBlue ? '#FFFFFF' : store.blue}`, outlineOffset: 3 });
