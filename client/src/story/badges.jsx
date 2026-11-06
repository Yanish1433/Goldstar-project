import Box from '@mui/material/Box';
import { tokens } from '../theme/tokens.js';

// Three custom layer badges (SPEC 5.6): 28px, 2px gold strokes, square tiles.
const common = { width: 28, height: 28, viewBox: '0 0 28 28', fill: 'none', stroke: tokens.gold, strokeWidth: 2, strokeLinecap: 'square', 'aria-hidden': true, focusable: 'false' };

export const SupportIcon = () => (
  <svg {...common}>
    <path d="M4 20 C4 8 24 8 24 20" />
    <path d="M3 23 H25" />
  </svg>
);

export const CushionIcon = () => (
  <svg {...common}>
    <path d="M3 8 Q8 4 14 8 T25 8" />
    <path d="M3 14 Q8 10 14 14 T25 14" />
    <path d="M3 20 Q8 16 14 20 T25 20" />
  </svg>
);

export const GripIcon = () => (
  <svg {...common}>
    <path d="M3 10 L7 14 L3 18 M10 10 L14 14 L10 18 M17 10 L21 14 L17 18 M24 10 L28 14 L24 18" />
  </svg>
);

const ICONS = { support: SupportIcon, cushion: CushionIcon, grip: GripIcon };

export function BadgeTile({ badge }) {
  const Icon = ICONS[badge];
  if (!Icon) return null;
  return (
    <Box sx={{ width: 48, height: 48, flexShrink: 0, backgroundColor: tokens.surface2, display: 'grid', placeItems: 'center' }}>
      <Icon />
    </Box>
  );
}
