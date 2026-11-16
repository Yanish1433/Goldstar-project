import { forwardRef, useEffect, useRef } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import { ArrowUpRight } from 'lucide-react';
import { tokensV2 as t, FOCUS_RING, EASE_CSS, DISPLAY_LIGHT, EYEBROW, FINE_POINTER } from './tokensV2.js';
import { magnetic } from './motion.js';

// Small shared pieces for the landing sections.

export function Eyebrow({ children, sx, ...p }) {
  return (
    <Box component="p" sx={{ ...EYEBROW, m: 0, display: 'flex', alignItems: 'center', gap: 1.5, ...sx }} {...p}>
      <Box component="span" aria-hidden="true" sx={{ width: 28, height: '1px', backgroundColor: t.gold, flex: '0 0 auto' }} />
      {children}
    </Box>
  );
}

export const Display = forwardRef(function Display({ component = 'h2', sx, children, ...p }, ref) {
  return (
    <Box ref={ref} component={component} sx={{ ...DISPLAY_LIGHT, color: t.ivory, fontSize: { xs: 'clamp(34px, 9vw, 48px)', md: 'clamp(48px, 4.8vw, 84px)' }, ...sx }} {...p}>
      {children}
    </Box>
  );
});

// CTA. variant 'solid': the one lit (gold) action of a screen. 'line': a hairline ivory ghost. 'text': an inline link.
// Magnetic on a fine pointer only (motion.js); 48px tall (touch target >= 44).
export function Cta({ to, href, variant = 'line', children, icon = true, sx, ...p }) {
  const ref = useRef(null);
  useEffect(() => (variant === 'solid' ? magnetic(ref.current) : undefined), [variant]);
  const solid = variant === 'solid';
  const text = variant === 'text';
  const link = href ? { component: 'a', href } : { component: RouterLink, to };
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
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        color: solid ? t.onGold : t.ivory,
        backgroundColor: solid ? t.gold : 'transparent',
        border: text ? 'none' : `1px solid ${solid ? t.gold : t.lineStrong}`,
        transition: `transform 500ms ${EASE_CSS}, background-color 240ms ease, border-color 240ms ease, color 240ms ease`,
        willChange: 'transform',
        '& svg': { transition: `transform 400ms ${EASE_CSS}` },
        [FINE_POINTER]: {
          '&:hover': solid
            ? { backgroundColor: t.ivory, borderColor: t.ivory }
            : { borderColor: t.ivory, '& svg': { transform: 'translate(2px, -2px)' } },
        },
        ...(text ? { borderBottom: `1px solid ${t.goldLine}`, borderRadius: 0, minHeight: 44 } : null),
        ...FOCUS_RING,
        ...sx,
      }}
      {...p}
    >
      {children}
      {icon ? <ArrowUpRight size={18} strokeWidth={1.75} aria-hidden="true" /> : null}
    </Box>
  );
}

// Section wrapper: the same dark ground everywhere (no bands), consistent gutters.
export function Section({ id, children, sx, labelledBy, ...p }) {
  return (
    <Box component="section" id={id} aria-labelledby={labelledBy} sx={{ position: 'relative', backgroundColor: t.ground, color: t.ivory, ...sx }} {...p}>
      {children}
    </Box>
  );
}

export const GUTTER = { px: { xs: 2, sm: 4, lg: 6 } };
export const WRAP = { maxWidth: 1440, mx: 'auto', ...GUTTER };
