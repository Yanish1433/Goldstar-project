import { forwardRef, useEffect, useRef } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import { ArrowUpRight } from 'lucide-react';
import { tokensV2 as t, FOCUS_RING, EASE_CSS, DISPLAY_LIGHT, EYEBROW, FINE_POINTER } from './tokensV2.js';
import { magnetic } from './motion.js';

// Small shared pieces for the landing sections.

// onBlue: the eyebrow sits on a royal-blue ground (sand text, >= 4.5:1).
export function Eyebrow({ children, sx, onBlue = false, onSky = false, ...p }) {
  return (
    <Box component="p" sx={{ ...EYEBROW, m: 0, display: 'flex', alignItems: 'center', gap: 1.5, ...(onBlue ? { color: t.sand } : null), ...(onSky ? { color: t.ink } : null), ...sx }} {...p}>
      <Box component="span" aria-hidden="true" sx={{ width: 28, height: 3, borderRadius: 2, backgroundColor: onBlue ? t.sand : onSky ? t.white : t.blue, flex: '0 0 auto' }} />
      {children}
    </Box>
  );
}

export const Display = forwardRef(function Display({ component = 'h2', sx, children, ...p }, ref) {
  return (
    <Box ref={ref} component={component} sx={{ ...DISPLAY_LIGHT, color: t.ink, fontSize: { xs: 'clamp(34px, 9vw, 48px)', md: 'clamp(48px, 4.8vw, 84px)' }, ...sx }} {...p}>
      {children}
    </Box>
  );
});

// The Goldstar star, as a shape (decorative). Fill and size come from the caller.
export function StarShape({ fill = t.sand, sx, ...p }) {
  return (
    <Box component="svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false" sx={{ display: 'block', ...sx }} {...p}>
      <path d="M12 1.6l3.05 6.6 7.25.86-5.36 4.95 1.45 7.15L12 17.62l-6.39 3.54 1.45-7.15L1.7 9.06l7.25-.86z" fill={fill} />
    </Box>
  );
}

// CTA. variant 'solid': the one royal-blue action of a screen. 'line': a hairline navy ghost. 'text': an inline link.
// onBlue: the same three on a royal-blue ground (white solid with blue text, white hairline, white link).
// Magnetic on a fine pointer only (motion.js); 48px tall (touch target >= 44).
export function Cta({ to, href, variant = 'line', onBlue = false, children, icon = true, sx, ...p }) {
  const ref = useRef(null);
  useEffect(() => (variant === 'solid' ? magnetic(ref.current) : undefined), [variant]);
  const solid = variant === 'solid';
  const text = variant === 'text';
  const link = href ? { component: 'a', href } : { component: RouterLink, to };
  const ink = onBlue ? t.onBlue : t.ink;
  const solidBg = onBlue ? t.white : t.blue;
  const solidInk = onBlue ? t.blue : t.onBlue;
  return (
    <Box
      ref={ref}
      {...link}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        minHeight: 48,
        px: text ? 0 : 3,
        borderRadius: t.radiusPill,
        textDecoration: 'none',
        fontFamily: 'inherit',
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        color: solid ? solidInk : ink,
        backgroundColor: solid ? solidBg : 'transparent',
        border: text ? 'none' : `1.5px solid ${solid ? solidBg : onBlue ? t.lineOnBlue : t.lineStrong}`,
        transition: `transform 500ms ${EASE_CSS}, background-color 240ms ease, border-color 240ms ease, color 240ms ease`,
        willChange: 'transform',
        '& svg': { transition: `transform 400ms ${EASE_CSS}` },
        [FINE_POINTER]: {
          '&:hover': solid
            ? (onBlue ? { backgroundColor: t.sand, borderColor: t.sand, color: t.ink } : { backgroundColor: t.blueDeep, borderColor: t.blueDeep })
            : { borderColor: ink, '& svg': { transform: 'translate(2px, -2px)' } },
        },
        ...(text ? { borderBottom: `2px solid ${onBlue ? t.sand : t.blue}`, borderRadius: 0, minHeight: 44 } : null),
        ...FOCUS_RING,
        ...sx,
      }}
      {...p}
    >
      {children}
      {icon ? <ArrowUpRight size={18} strokeWidth={2} aria-hidden="true" /> : null}
    </Box>
  );
}

// Section wrapper: white or cream band, consistent gutters.
export function Section({ id, children, sx, labelledBy, ...p }) {
  return (
    <Box component="section" id={id} aria-labelledby={labelledBy} sx={{ position: 'relative', backgroundColor: t.ground, color: t.ink, ...sx }} {...p}>
      {children}
    </Box>
  );
}

export const GUTTER = { px: { xs: 2, sm: 4, lg: 6 } };
export const WRAP = { maxWidth: 1440, mx: 'auto', ...GUTTER };
