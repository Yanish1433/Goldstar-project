import Box from '@mui/material/Box';
import { Minus, Plus } from 'lucide-react';
import { MAX_QTY } from '../store/cart.js';
import { shop } from '../theme/tokens.js';

const btn = {
  width: 40, height: 40, border: 0, borderRadius: '50%', background: 'transparent', color: shop.ink, display: 'grid', placeItems: 'center', cursor: 'pointer',
  transition: 'background-color 180ms ease',
  '&:hover:not(:disabled)': { backgroundColor: shop.sunk },
  '&:disabled': { color: 'rgba(22,18,14,0.3)', cursor: 'not-allowed' },
  '&:focus-visible': { outline: `3px solid ${shop.blue}`, outlineOffset: 1 },
};

// Pill stepper: − n +. `size="sm"` for cart lines.
export default function QtyStepper({ value, onChange, label = 'Quantity', size = 'md' }) {
  const sm = size === 'sm';
  return (
    <Box role="group" aria-label={label} sx={{ display: 'inline-flex', alignItems: 'center', p: '2px', borderRadius: `${shop.radius.pill}px`, backgroundColor: shop.surface, boxShadow: `inset 0 0 0 1.5px ${shop.lineStrong}` }}>
      <Box component="button" type="button" aria-label="Decrease quantity" disabled={value <= 1} onClick={() => onChange(value - 1)} sx={{ ...btn, ...(sm ? { width: 36, height: 36 } : null) }}>
        <Minus size={16} strokeWidth={2.25} aria-hidden="true" />
      </Box>
      <Box component="span" aria-live="polite" sx={{ minWidth: sm ? 24 : 32, textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: sm ? 15 : 16 }}>{value}</Box>
      <Box component="button" type="button" aria-label="Increase quantity" disabled={value >= MAX_QTY} onClick={() => onChange(value + 1)} sx={{ ...btn, ...(sm ? { width: 36, height: 36 } : null) }}>
        <Plus size={16} strokeWidth={2.25} aria-hidden="true" />
      </Box>
    </Box>
  );
}
