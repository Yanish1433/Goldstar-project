import { forwardRef } from 'react';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { Ruler } from 'lucide-react';
import { shop } from '../theme/tokens.js';

// Single-select UK size group. `allSizes` shows the full run with unavailable sizes disabled (struck through);
// `error` shows the inline "Choose a size" text; `onGuide` adds the size-guide link.
const SizePicker = forwardRef(function SizePicker({ sizes, allSizes, value, onChange, error, onGuide, id = 'size-group' }, ref) {
  const run = allSizes?.length ? allSizes : sizes;
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25, minHeight: 32 }}>
        <Typography id={`${id}-label`} sx={{ fontWeight: 800, fontSize: 15 }}>
          UK size{value ? <Box component="span" sx={{ fontWeight: 500, color: shop.ink2 }}>{`: ${value}`}</Box> : null}
        </Typography>
        {onGuide ? (
          <Box component="button" type="button" onClick={onGuide} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, minHeight: 44, px: 0.5, border: 0, background: 'none', cursor: 'pointer', font: 'inherit', fontSize: 14, fontWeight: 700, color: shop.ink, textDecoration: 'underline', textUnderlineOffset: 4, textDecorationThickness: 1.5 }}>
            <Ruler size={16} strokeWidth={2} aria-hidden="true" /> Size guide
          </Box>
        ) : null}
      </Box>
      <ToggleButtonGroup
        ref={ref}
        exclusive
        value={value}
        onChange={(_, v) => onChange(v)}
        aria-label="UK size"
        aria-describedby={error ? `${id}-error` : undefined}
        tabIndex={-1}
        sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: 1, '&:focus': { outline: 'none' } }}
      >
        {run.map((s) => {
          const off = !sizes.includes(s);
          return (
            <ToggleButton
              key={s}
              value={s}
              disabled={off}
              aria-label={off ? `UK size ${s}, not available in this colour` : `UK size ${s}`}
              sx={{
                minWidth: 0, minHeight: 52, borderRadius: `${shop.radius.md}px !important`, fontSize: 16, backgroundColor: shop.surface,
                ...(error ? { borderColor: `${shop.error} !important` } : null),
                '&.Mui-disabled': { color: 'rgba(22,18,14,0.35)', backgroundColor: 'transparent', borderStyle: 'dashed', textDecoration: 'line-through' },
              }}
            >
              {s}
            </ToggleButton>
          );
        })}
      </ToggleButtonGroup>
      {error ? (
        <Typography id={`${id}-error`} variant="body2" role="alert" sx={{ color: 'error.main', display: 'block', mt: 1, fontWeight: 700 }}>
          Choose a size
        </Typography>
      ) : null}
    </Box>
  );
});

export default SizePicker;
