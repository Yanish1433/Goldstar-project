import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import { ArrowRight, Lock, ShoppingBag, X } from 'lucide-react';
import { useCart, lineId, cartSubtotal, cartCount } from '../store/cart.js';
import { useUi } from '../store/ui.js';
import { useQuote } from '../api/hooks.js';
import { formatNPR } from '../lib/format.js';
import { shop } from '../theme/tokens.js';
import QtyStepper from './QtyStepper.jsx';
import { Thumb, TrustRow } from './shop/kit.jsx';

export default function CartDrawer() {
  const open = useUi((s) => s.cartOpen);
  const close = useUi((s) => s.closeCart);
  const lines = useCart((s) => s.lines);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const replacePrices = useCart((s) => s.replacePrices);
  const subtotal = useCart(cartSubtotal);
  const count = useCart(cartCount);
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
  const imageFor = (l) => l.image || quote.data?.lines?.find((q) => q.productId === l.productId && q.colourwayKey === l.colourwayKey)?.image || null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={close}
      slotProps={{ paper: { sx: { width: { xs: '100vw', sm: 440 }, display: 'flex', flexDirection: 'column', borderRadius: { sm: `${shop.radius.xl}px 0 0 ${shop.radius.xl}px` } }, 'aria-labelledby': 'cart-title' } }}
      transitionDuration={{ enter: 380, exit: 240 }}
    >
      <Box sx={{ px: 3, pt: 2.5, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${shop.line}` }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography id="cart-title" variant="h4" component="h2">Your cart</Typography>
          {count ? <Typography component="span" sx={{ fontSize: 14, fontWeight: 700, color: shop.ink2 }}>{count} {count === 1 ? 'item' : 'items'}</Typography> : null}
        </Box>
        <IconButton aria-label="Close cart" onClick={close} sx={{ mr: -1 }}>
          <X size={22} strokeWidth={2} aria-hidden="true" />
        </IconButton>
      </Box>
      {priceChanged ? (
        <Box sx={{ px: 3, pt: 2 }}>
          <Alert severity="info">A price changed since you added this. Totals are updated.</Alert>
        </Box>
      ) : null}
      {lines.length === 0 ? (
        <Box sx={{ flex: 1, px: 3, py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 2 }}>
          <Box sx={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: shop.saffron, display: 'grid', placeItems: 'center', mb: 1 }}>
            <ShoppingBag size={34} strokeWidth={1.75} aria-hidden="true" />
          </Box>
          <Typography variant="h4" component="p">Your cart is empty.</Typography>
          <Typography sx={{ color: shop.ink2, maxWidth: '30ch' }}>Trail boots and everyday pairs are waiting in the shop.</Typography>
          <Button variant="contained" size="large" onClick={() => { close(); navigate('/shop'); }} endIcon={<ArrowRight size={18} strokeWidth={2.25} aria-hidden="true" />} sx={{ mt: 1 }}>Shop all</Button>
        </Box>
      ) : (
        <>
          <Box component="ul" aria-label="Items in your cart" sx={{ listStyle: 'none', m: 0, flex: 1, overflowY: 'auto', px: 3, py: 1 }}>
            {lines.map((l, i) => {
              const id = lineId(l);
              const prob = problemFor(i);
              return (
                <Box component="li" key={id} sx={{ display: 'flex', gap: 2, py: 2, borderBottom: `1px solid ${shop.line}`, '&:last-of-type': { borderBottom: 0 } }}>
                  <Box component={RouterLink} to={`/product/${l.slug}?colour=${l.colourwayKey}`} onClick={close} tabIndex={-1} aria-hidden="true" sx={{ display: 'block' }}>
                    <Thumb src={imageFor(l)} size={92} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'baseline' }}>
                      <Typography component={RouterLink} to={`/product/${l.slug}?colour=${l.colourwayKey}`} onClick={close} sx={{ fontWeight: 800, fontSize: 16, color: 'inherit', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>{l.name}</Typography>
                      <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap' }}>{formatNPR(l.qty * l.unitPrice)}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: shop.ink2 }}>{l.colourwayName} · UK {l.size}{l.qty > 1 ? ` · ${formatNPR(l.unitPrice)} each` : ''}</Typography>
                    {prob ? <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 700 }}>{prob.message}</Typography> : null}
                    <Box sx={{ mt: 'auto', pt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <QtyStepper size="sm" value={l.qty} onChange={(q) => setQty(id, q)} label={`Quantity for ${l.name} ${l.colourwayName} UK ${l.size}`} />
                      <Button variant="text" size="small" aria-label={`Remove ${l.name} ${l.colourwayName} UK ${l.size}`} onClick={() => remove(id)} sx={{ color: shop.ink2, minHeight: 40, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 4 }}>
                        Remove
                      </Button>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
          <Box sx={{ p: 3, pt: 2.5, display: 'flex', flexDirection: 'column', gap: 1.25, backgroundColor: shop.surface, boxShadow: `0 -1px 0 ${shop.line}, 0 -12px 32px rgba(22,18,14,0.05)` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
              <Typography sx={{ color: shop.ink2 }}>Subtotal</Typography>
              <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{formatNPR(subtotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ color: shop.ink2 }}>Delivery</Typography>
              <Typography sx={{ fontWeight: 600, color: shop.ink2 }}>Confirmed by phone</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', pt: 1.25, borderTop: `1px solid ${shop.line}` }}>
              <Typography sx={{ fontWeight: 800, fontSize: 17 }}>Total</Typography>
              <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 24, fontStretch: '108%', fontVariationSettings: '"wdth" 108' }}>{formatNPR(subtotal)}</Typography>
            </Box>
            <Button variant="contained" size="large" onClick={() => { close(); navigate('/checkout'); }} startIcon={<Lock size={18} strokeWidth={2.25} aria-hidden="true" />} sx={{ mt: 1 }}>Checkout</Button>
            <Button variant="text" onClick={close} sx={{ alignSelf: 'center', minHeight: 40 }}>Keep shopping</Button>
            <TrustRow variant="mini" />
          </Box>
        </>
      )}
    </Drawer>
  );
}
