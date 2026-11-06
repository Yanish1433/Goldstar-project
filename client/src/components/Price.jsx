import Typography from '@mui/material/Typography';
import { formatNPR, formatRange } from '../lib/format.js';

// Price or range; sale shows the regular price struck through after it.
export default function Price({ from, to, price, regularPrice, variant = 'body1', sx, component = 'span' }) {
  const lo = price ?? from;
  const hi = price ?? to ?? lo;
  const sale = regularPrice && price && regularPrice > price;
  return (
    <Typography component={component} variant={variant} sx={{ fontVariantNumeric: 'tabular-nums', ...sx }}>
      {formatRange(lo, hi)}
      {sale ? (
        <>
          {' '}
          <Typography component="s" variant="inherit" sx={{ color: 'text.secondary', textDecorationThickness: '1px' }}>
            <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Regular price </span>
            {formatNPR(regularPrice)}
          </Typography>
        </>
      ) : null}
    </Typography>
  );
}
