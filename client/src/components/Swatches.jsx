import Box from '@mui/material/Box';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import { tokens } from '../theme/tokens.js';
import { formatNPR } from '../lib/format.js';

function Sw({ hex, selected }) {
  return (
    <Box
      className="swatch"
      sx={{ width: 44, height: 44, backgroundColor: hex, outline: selected ? `2px solid ${tokens.gold}` : `1px solid ${tokens.fieldBorder}`, outlineOffset: selected ? 3 : 0, transition: 'outline-color 180ms ease', flexShrink: 0 }}
    />
  );
}

// Colour picker as a radio group: arrow keys move, name + price are read out.
export default function Swatches({ colourways, value, onChange, showPrice = true, label = 'Colour', row = true }) {
  return (
    <RadioGroup row={row} aria-label={label} name="colourway" value={value} onChange={(e) => onChange(e.target.value)} sx={{ gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {colourways.map((c) => (
        <FormControlLabel
          key={c.key}
          value={c.key}
          sx={{ m: 0, gap: 1.25, alignItems: 'center', '& .Mui-focusVisible .swatch': { outline: `2px solid ${tokens.goldLight}`, outlineOffset: 3 } }}
          control={<Radio disableRipple sx={{ p: 0 }} icon={<Sw hex={c.hex} />} checkedIcon={<Sw hex={c.hex} selected />} />}
          label={
            <Typography component="span" variant="body1" sx={{ color: value === c.key ? 'primary.main' : 'text.primary', fontWeight: 600 }}>
              {c.name}
              {showPrice ? ` · ${formatNPR(c.price)}` : ''}
            </Typography>
          }
        />
      ))}
    </RadioGroup>
  );
}
