import { forwardRef } from 'react';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

// Single-select UK size group. `error` shows the inline "Choose a size" text.
const SizePicker = forwardRef(function SizePicker({ sizes, value, onChange, error, id = 'size-group' }, ref) {
  return (
    <Box>
      <Typography id={`${id}-label`} variant="body1" sx={{ mb: 1, fontWeight: 600 }}>UK size</Typography>
      <ToggleButtonGroup
        ref={ref}
        exclusive
        value={value}
        onChange={(_, v) => onChange(v)}
        aria-label="UK size"
        aria-describedby={error ? `${id}-error` : undefined}
        tabIndex={-1}
        sx={{ '&:focus': { outline: 'none' } }}
      >
        {sizes.map((s) => (
          <ToggleButton key={s} value={s} aria-label={`UK size ${s}`} sx={{ minWidth: 56, minHeight: 56 }}>
            {s}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {error ? (
        <Typography id={`${id}-error`} variant="caption" role="alert" sx={{ color: 'error.main', display: 'block', mt: 1 }}>
          Choose a size
        </Typography>
      ) : null}
    </Box>
  );
});

export default SizePicker;
