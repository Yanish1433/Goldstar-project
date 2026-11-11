import { forwardRef } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import { brand, land, WIDE } from '../theme/tokens.js';

// Landing type and buttons. Archivo (wide cut for display) + Mukta for Devanagari; gold is the only accent.
export const DISPLAY = { fontWeight: 800, ...WIDE, letterSpacing: '-0.035em', lineHeight: 0.92, m: 0, textWrap: 'balance' };

export const Eyebrow = ({ children, tone = 'gold', sx, ...p }) => (
  <Box
    component="p"
    sx={{ m: 0, fontSize: { xs: 12, md: 13 }, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: tone === 'gold' ? brand.goldText : tone, ...sx }}
    {...p}
  >
    {children}
  </Box>
);

export const SectionTitle = ({ children, component = 'h2', sx, ...p }) => (
  <Box component={component} sx={{ ...DISPLAY, fontSize: { xs: 'clamp(34px, 9.6vw, 46px)', md: 'clamp(48px, 4.6vw, 76px)' }, ...sx }} {...p}>
    {children}
  </Box>
);

// Pills: gold filled (primary), or an outline in the current ink.
const pill = (variant, size) => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1, boxSizing: 'border-box',
  minHeight: size === 'sm' ? 44 : { xs: 48, md: 54 }, px: size === 'sm' ? 2.25 : { xs: 2.5, md: 3.5 },
  borderRadius: '999px', fontFamily: 'inherit', fontSize: size === 'sm' ? 15 : { xs: 15, md: 16 }, fontWeight: 700, letterSpacing: '0.01em',
  textDecoration: 'none', whiteSpace: 'nowrap', cursor: 'pointer',
  transition: 'transform 180ms cubic-bezier(0.22,1,0.36,1), background-color 180ms ease, color 180ms ease, border-color 180ms ease',
  '@media (hover:hover)': { '&:hover': { transform: 'translateY(-2px)' } },
  '&:active': { transform: 'translateY(0) scale(0.98)' },
  '&:focus-visible': { outline: `3px solid ${brand.goldText}`, outlineOffset: 3 },
  ...(variant === 'gold'
    ? { backgroundColor: brand.gold, color: brand.onGold, border: `2px solid ${brand.gold}`, '@media (hover:hover)': { '&:hover': { transform: 'translateY(-2px)', backgroundColor: brand.goldText, borderColor: brand.goldText } } }
    : variant === 'blue' || variant === 'ink' || variant === 'light'
      ? (() => {
        const [bg, fg, hover] = variant === 'blue' ? [land.blue, '#FFFFFF', land.blueDeep] : variant === 'ink' ? [land.ink, '#FFFFFF', '#000000'] : [land.paper, land.ink, '#FFFFFF'];
        return { backgroundColor: bg, color: fg, border: `2px solid ${bg}`, '&:focus-visible': { outline: `3px solid ${variant === 'light' ? land.paper : land.ink}`, outlineOffset: 3 }, '@media (hover:hover)': { '&:hover': { transform: 'translateY(-2px)', backgroundColor: hover, borderColor: hover } } };
      })()
    : variant === 'navy'
      ? { backgroundColor: brand.navy, color: '#FFFFFF', border: `2px solid ${brand.navy}`, '&:focus-visible': { outline: `3px solid ${brand.navy}`, outlineOffset: 3 }, '@media (hover:hover)': { '&:hover': { transform: 'translateY(-2px)', backgroundColor: brand.navyDeep, borderColor: brand.navyDeep } } }
      : { backgroundColor: 'transparent', color: 'inherit', border: '2px solid currentColor' }),
});

export const Pill = forwardRef(function Pill({ to, href, variant = 'gold', size, children, sx, ...p }, ref) {
  if (to) return <Box component={RouterLink} ref={ref} to={to} sx={{ ...pill(variant, size), ...sx }} {...p}>{children}</Box>;
  if (href) return <Box component="a" ref={ref} href={href} sx={{ ...pill(variant, size), ...sx }} {...p}>{children}</Box>;
  return <Box component="button" type="button" ref={ref} sx={{ ...pill(variant, size), ...sx }} {...p}>{children}</Box>;
});

// The G10-401's outsole lug pattern (diamond lugs on a grooved field) as a tiny tiled SVG, for textured grounds.
export const LUG_PATTERN = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path d="M14 3l7 11-7 11-7-11z" fill="none" stroke="white" stroke-width="1.4"/><path d="M0 14h4M24 14h4" stroke="white" stroke-width="1.4"/></svg>',
)}")`;
