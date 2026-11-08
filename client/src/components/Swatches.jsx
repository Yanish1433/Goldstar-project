import Box from '@mui/material/Box';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import { shop } from '../theme/tokens.js';
import { formatNPR } from '../lib/format.js';
import { Dot } from './shop/kit.jsx';

// Colour picker as a radio group (arrow keys move; name + price are read out). Shows "Colour: Black" above
// round swatches; each swatch is a 48 px target.
export default function Swatches({ colourways, value, onChange, showPrice = true, label = 'Colour' }) {
  const current = colourways.find((c) => c.key === value);
  return (
    <Box>
      <Typography sx={{ fontWeight: 800, fontSize: 15, mb: 1, minHeight: 32, display: 'flex', alignItems: 'center' }}>
        {label}
        {current ? <Box component="span" sx={{ fontWeight: 500, color: shop.ink2 }}>{`: ${current.name}`}</Box> : null}
      </Typography>
      <RadioGroup row aria-label={label} name="colourway" value={value} onChange={(e) => onChange(e.target.value)} sx={{ gap: 1, flexWrap: 'wrap', ml: -0.5 }}>
        {colourways.map((c) => (
          <Radio
            key={c.key}
            value={c.key}
            disableRipple
            slotProps={{ input: { 'aria-label': `${c.name}${showPrice ? `, ${formatNPR(c.price)}` : ''}${c.inStock ? '' : ', sold out'}` } }}
            sx={{ p: 0.75, borderRadius: '50%', '&.Mui-focusVisible': { outline: `3px solid ${shop.blue}`, outlineOffset: 0 }, '&:hover .MuiBox-root': { transform: 'scale(1.08)' } }}
            icon={<Dot hex={c.hex} size={34} />}
            checkedIcon={<Dot hex={c.hex} size={34} selected />}
          />
        ))}
      </RadioGroup>
    </Box>
  );
}
