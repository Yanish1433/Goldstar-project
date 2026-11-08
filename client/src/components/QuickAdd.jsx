import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import { Plus } from 'lucide-react';
import { shop } from '../theme/tokens.js';
import { Dot } from './shop/kit.jsx';
import { formatNPR } from '../lib/format.js';
import { makeLine, addToCartAnimated, pickSourceRect } from '../lib/addToCart.js';

const chip = (on) => ({
  minWidth: 48, minHeight: 44, px: 1.5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1,
  border: `1.5px solid ${on ? shop.ink : shop.lineStrong}`, borderRadius: `${shop.radius.pill}px`, backgroundColor: on ? shop.ink : shop.surface, color: on ? '#FFFFFF' : shop.ink,
  font: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'background-color 180ms ease, color 180ms ease, border-color 180ms ease',
  '&:hover:not(:disabled)': { borderColor: shop.ink, ...(on ? null : { backgroundColor: shop.sunk }) }, '&:focus-visible': { outline: `3px solid ${shop.blue}`, outlineOffset: 2 },
  '&:disabled': { opacity: 0.4, cursor: 'not-allowed' },
});
const sizeChip = { ...chip(false), '&:hover:not(:disabled)': { backgroundColor: shop.blue, borderColor: shop.blue, color: '#FFFFFF' } };

// Quick add from a Shop card: a round "+" over the photo opens a small popover (colour if there is a choice, then
// size). Tapping a size adds it to the cart with the box animation, starting from the card's photo.
export default function QuickAdd({ product, photoRef, colourKey }) {
  const [anchor, setAnchor] = useState(null);
  const first = product.colourways.find((c) => c.inStock && c.sizes?.length) || product.colourways[0];
  const [key, setKey] = useState(colourKey || first?.key);
  // Follow the card's swatch choice.
  useEffect(() => {
    if (colourKey) setKey(colourKey);
  }, [colourKey]);
  const colour = product.colourways.find((c) => c.key === key) || first;
  if (!colour?.sizes?.length) return null;
  const id = `quick-${product.slug}`;

  const add = (size) => {
    const source = pickSourceRect(photoRef.current, anchor);
    setAnchor(null);
    addToCartAnimated(makeLine(product, colour, size), { sourceRect: source });
  };

  return (
    <>
      <Box
        component="button"
        type="button"
        aria-label={`Quick add ${product.name}`}
        aria-haspopup="dialog"
        aria-expanded={!!anchor}
        aria-controls={anchor ? id : undefined}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          position: 'absolute', top: { xs: 8, sm: 12 }, right: { xs: 8, sm: 12 }, zIndex: 2, width: 44, height: 44, borderRadius: '50%', border: 0,
          display: 'grid', placeItems: 'center', cursor: 'pointer', backgroundColor: shop.surface, color: shop.ink, boxShadow: '0 2px 10px rgba(22,18,14,0.16)',
          transition: 'transform 180ms cubic-bezier(0.22,1,0.36,1), background-color 180ms ease, color 180ms ease',
          '&:hover, &[aria-expanded="true"]': { backgroundColor: shop.blue, color: '#FFFFFF', transform: 'scale(1.08) rotate(90deg)' },
          '&:active': { transform: 'scale(0.94)' },
          '&:focus-visible': { outline: `3px solid ${shop.blue}`, outlineOffset: 2 },
        }}
      >
        <Plus size={20} strokeWidth={2.25} aria-hidden="true" />
      </Box>
      <Popover
        id={id}
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { role: 'dialog', 'aria-label': `Quick add ${product.name}`, sx: { mt: 1, p: 2.5, width: 'min(320px, calc(100vw - 32px))', display: 'flex', flexDirection: 'column', gap: 2 } } }}
      >
        <Box>
          <Typography component="p" sx={{ fontSize: 18, fontWeight: 800, fontStretch: '108%', fontVariationSettings: '"wdth" 108' }}>{product.name}</Typography>
          <Typography variant="body2" color="text.secondary">{colour.name} · {formatNPR(colour.price)}</Typography>
        </Box>
        {product.colourways.length > 1 ? (
          <Box role="radiogroup" aria-label="Colour" sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {product.colourways.map((c) => (
              <Box key={c.key} component="button" type="button" role="radio" aria-checked={c.key === colour.key} disabled={!c.inStock} onClick={() => setKey(c.key)} sx={chip(c.key === colour.key)}>
                <Dot hex={c.hex} size={16} />
                {c.name}
              </Box>
            ))}
          </Box>
        ) : null}
        <Box>
          <Typography variant="overline" component="p" sx={{ mb: 1, color: 'text.secondary' }}>Tap a UK size to add</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {colour.sizes.map((s) => (
              <Box key={s} component="button" type="button" aria-label={`Add UK size ${s} to cart`} disabled={!colour.inStock} onClick={() => add(s)} sx={sizeChip}>{s}</Box>
            ))}
          </Box>
        </Box>
      </Popover>
    </>
  );
}
