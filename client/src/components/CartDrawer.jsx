import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import { Trash2, X } from 'lucide-react';
import { useCart, lineId, cartSubtotal } from '../store/cart.js';
import { useUi } from '../store/ui.js';
import { useQuote } from '../api/hooks.js';
import { formatNPR } from '../lib/format.js';
import QtyStepper from './QtyStepper.jsx';
import ProductPhoto from './ProductPhoto.jsx';

export default function CartDrawer() {
  const open = useUi((s) => s.cartOpen);
  const close = useUi((s) => s.closeCart);
  const lines = useCart((s) => s.lines);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const replacePrices = useCart((s) => s.replacePrices);
  const subtotal = useCart(cartSubtotal);
  const navigate = useNavigate();
  const [priceChanged, setPriceChanged] = useState(false);

  const items = useMemo(() => lines.map((l) => ({ productId: l.productId, colourwayKey: l.colourwayKey, size: l.size, qty: l.qty })), [lines]);
  // Re-price from the server whenever the drawer opens (queryKey changes with the lines; staleTime 0).
  const quote = useQuote(items, open);

  useEffect(() => {
    if (!open) {
      setPriceChanged(false);
      return;
    }
    if (quote.data?.lines && replacePrices(quote.data.lines)) setPriceChanged(true);
  }, [open, quote.data, replacePrices]);

  const problems = quote.data?.problems || [];
  const problemFor = (i) => problems.find((p) => p.index === i);

  return (
    <Drawer anchor="right" open={open} onClose={close} slotProps={{ paper: { sx: { width: { xs: '100vw', sm: 420 }, display: 'flex', flexDirection: 'column' }, 'aria-labelledby': 'cart-title' } }} transitionDuration={{ enter: 320, exit: 220 }}>
      <Box sx={{ p: 3, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography id="cart-title" variant="h4" component="h2" sx={{ fontSize: 24 }}>Your cart</Typography>
        <IconButton aria-label="Close cart" onClick={close}>
          <X size={20} strokeWidth={1.75} aria-hidden="true" />
        </IconButton>
      </Box>
      {priceChanged ? (
        <Box sx={{ px: 3, pb: 2 }}>
          <Alert severity="info">A price changed since you added this. Totals are updated.</Alert>
        </Box>
      ) : null}
      {lines.length === 0 ? (
        <Box sx={{ px: 3, py: 4, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
          <Typography>Your cart is empty.</Typography>
          <Button variant="contained" onClick={() => { close(); navigate('/shop'); }}>Shop all</Button>
        </Box>
      ) : (
        <>
          <List sx={{ flex: 1, overflowY: 'auto', px: 3, py: 0 }}>
            {lines.map((l, i) => {
              const id = lineId(l);
              const prob = problemFor(i);
              return (
                <ListItem key={id} disableGutters sx={{ alignItems: 'flex-start', gap: 2, py: 2 }}>
                  <Box sx={{ width: 64, flexShrink: 0 }}>
                    <ProductPhoto image={l.image ? { src: l.image, thumb: l.image } : null} alt="" sizes="64px" />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" component="p">{l.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{l.colourwayName} &middot; UK {l.size}</Typography>
                    {prob ? <Typography variant="caption" sx={{ color: 'error.main', display: 'block' }}>{prob.message}</Typography> : null}
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <QtyStepper value={l.qty} onChange={(q) => setQty(id, q)} label={`Quantity for ${l.name} ${l.colourwayName} UK ${l.size}`} />
                      <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{formatNPR(l.qty * l.unitPrice)}</Typography>
                    </Box>
                  </Box>
                  <IconButton aria-label={`Remove ${l.name} ${l.colourwayName} UK ${l.size}`} onClick={() => remove(id)}>
                    <Trash2 size={20} strokeWidth={1.75} aria-hidden="true" />
                  </IconButton>
                </ListItem>
              );
            })}
          </List>
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, backgroundColor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Typography variant="h6" component="p">Subtotal</Typography>
              <Typography variant="h4" component="p" sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatNPR(subtotal)}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">Cash on delivery. Delivery fee confirmed by phone.</Typography>
            <Button variant="contained" size="large" onClick={() => { close(); navigate('/checkout'); }}>Checkout</Button>
          </Box>
        </>
      )}
    </Drawer>
  );
}
