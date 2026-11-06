import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { Minus, Plus } from 'lucide-react';
import { MAX_QTY } from '../store/cart.js';
import { tokens } from '../theme/tokens.js';

export default function QtyStepper({ value, onChange, label = 'Quantity' }) {
  return (
    <Box role="group" aria-label={label} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      <IconButton aria-label="Decrease quantity" disabled={value <= 1} onClick={() => onChange(value - 1)} sx={{ border: `1px solid ${tokens.fieldBorder}` }}>
        <Minus size={20} strokeWidth={1.75} aria-hidden="true" />
      </IconButton>
      <Typography aria-live="polite" sx={{ minWidth: 32, textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{value}</Typography>
      <IconButton aria-label="Increase quantity" disabled={value >= MAX_QTY} onClick={() => onChange(value + 1)} sx={{ border: `1px solid ${tokens.fieldBorder}` }}>
        <Plus size={20} strokeWidth={1.75} aria-hidden="true" />
      </IconButton>
    </Box>
  );
}
