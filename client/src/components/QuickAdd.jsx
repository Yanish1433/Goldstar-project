import { useState } from 'react';
import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import { Plus } from 'lucide-react';
import { tokens } from '../theme/tokens.js';
import { formatNPR } from '../lib/format.js';
import { makeLine, addToCartAnimated, pickSourceRect, warmCartBox } from '../lib/addToCart.js';

const chip = (on) => ({
  minWidth: 44, minHeight: 44, px: 1.25, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1,
  border: `1px solid ${on ? tokens.gold : tokens.fieldBorder}`, backgroundColor: on ? tokens.goldWash : 'transparent', color: tokens.ink,
  font: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer',
  '&:hover': { borderColor: tokens.gold }, '&:focus-visible': { outline: `2px solid ${tokens.goldLight}`, outlineOffset: 2 },
  '&:disabled': { opacity: 0.4, cursor: 'not-allowed' },
});

// Quick add from a Shop card: a round "+" over the photo opens a small popover (colour if there is a choice, then
// size). Tapping a size adds it to the cart with the box animation, starting from the card's photo.
export default function QuickAdd({ product, photoRef }) {
  const [anchor, setAnchor] = useState(null);
  const first = product.colourways.find((c) => c.inStock && c.sizes?.length) || product.colourways[0];
  const [key, setKey] = useState(first?.key);
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
        onPointerEnter={warmCartBox}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          position: 'absolute', top: { xs: 8, sm: 12 }, right: { xs: 8, sm: 12 }, zIndex: 2, width: 44, height: 44, borderRadius: '50%', border: 0,
          display: 'grid', placeItems: 'center', cursor: 'pointer', backgroundColor: tokens.ground, color: tokens.ink, boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
          transition: 'transform 180ms ease, background-color 180ms ease, color 180ms ease',
          '&:hover': { backgroundColor: tokens.gold, color: tokens.onGold, transform: 'scale(1.06)' },
          '&:focus-visible': { outline: `2px solid ${tokens.goldLight}`, outlineOffset: 2 },
        }}
      >
        <Plus size={20} strokeWidth={2} aria-hidden="true" />
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
          <Typography variant="h5" component="p" sx={{ fontSize: 18 }}>{product.name}</Typography>
          <Typography variant="body2" color="text.secondary">{colour.name} · {formatNPR(colour.price)}</Typography>
        </Box>
        {product.colourways.length > 1 ? (
          <Box role="radiogroup" aria-label="Colour" sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {product.colourways.map((c) => (
              <Box key={c.key} component="button" type="button" role="radio" aria-checked={c.key === colour.key} disabled={!c.inStock} onClick={() => setKey(c.key)} sx={chip(c.key === colour.key)}>
                <Box component="span" aria-hidden="true" sx={{ width: 14, height: 14, backgroundColor: c.hex, outline: `1px solid ${tokens.fieldBorder}` }} />
                {c.name}
              </Box>
            ))}
          </Box>
        ) : null}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Tap a UK size to add</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {colour.sizes.map((s) => (
              <Box key={s} component="button" type="button" aria-label={`Add UK size ${s} to cart`} disabled={!colour.inStock} onClick={() => add(s)} sx={chip(false)}>{s}</Box>
            ))}
          </Box>
        </Box>
      </Popover>
    </>
  );
}
