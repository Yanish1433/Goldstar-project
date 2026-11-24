import { Link as RouterLink, useParams } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import { ArrowRight, Check, PhoneCall, Truck, Banknote } from 'lucide-react';
import { PageBox, useTitle } from '../components/Page.jsx';
import { StatusChip, ShippingBlock } from '../components/OrderParts.jsx';
import { Band, Eyebrow, Panel, Steps, Thumb } from '../components/shop/kit.jsx';
import NotFound from './NotFound.jsx';
import { LoadError } from '../api/NetworkStates.jsx';
import { useOrder } from '../api/hooks.js';
import { formatNPR } from '../lib/format.js';
import { shop, WIDE } from '../theme/tokens.js';

const NEXT = [
  { icon: PhoneCall, title: 'A confirmation call', body: 'The store rings to confirm the address and the delivery fee.' },
  { icon: Truck, title: 'On its way', body: 'Your shoes are packed and sent to your door.' },
  { icon: Banknote, title: 'Pay on arrival', body: 'Hand over cash when the box arrives.' },
];

export default function OrderConfirmation() {
  const { id } = useParams();
  const { data: order, isLoading, error, refetch } = useOrder(id);
  useTitle('Order placed');
  if (isLoading) return <PageBox sx={{ py: 10 }}><Skeleton variant="rectangular" height={320} sx={{ borderRadius: `${shop.radius.xl}px` }} /></PageBox>;
  if (error && !order && error.status !== 404 && error.status !== 400) return <LoadError error={error} onRetry={refetch} />;
  if (error || !order) return <NotFound />;
  const count = order.items.reduce((n, i) => n + i.qty, 0);
  return (
    <Box sx={{ pb: { xs: 8, md: 12 } }}>
      <Band ground="pine" innerSx={{ py: { xs: 5, md: 8 }, display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'center' }, textAlign: { md: 'center' }, gap: 2 }}>
        <Box sx={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: shop.saffron, color: shop.ink, display: 'grid', placeItems: 'center', animation: 'gsPop 600ms cubic-bezier(0.22,1.4,0.36,1) both', '@keyframes gsPop': { from: { transform: 'scale(0.4)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } } }}>
          <Check size={32} strokeWidth={3} aria-hidden="true" />
        </Box>
        <Typography variant="h1" component="h1" sx={{ color: '#F4F0E6', fontSize: { xs: 44, md: 80 } }}>Order placed</Typography>
        <Typography sx={{ color: '#B9D8CF', fontSize: { xs: 16, md: 18 }, maxWidth: '46ch' }}>Thank you. Your order is in, and nothing is paid until the shoes reach you.</Typography>
        <Box sx={{ mt: 1, px: 2.5, py: 1.25, borderRadius: `${shop.radius.pill}px`, backgroundColor: 'rgba(255,255,255,0.1)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)' }}>
          <Typography component="p" aria-label={`Order number ${order.orderNumber}`} sx={{ color: '#FFFFFF', fontWeight: 800, ...WIDE, fontSize: { xs: 18, md: 22 }, letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums' }}>
            <Box component="span" aria-hidden="true" sx={{ color: shop.saffron, mr: 1, fontSize: '0.7em', letterSpacing: '0.1em' }}>ORDER</Box>
            {order.orderNumber}
          </Typography>
        </Box>
      </Band>

      <PageBox sx={{ pt: { xs: 3, md: 5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 3, md: 5 } }}><Steps current={3} /></Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(0,7fr) minmax(0,5fr)' }, gap: { xs: 2.5, md: 4 }, alignItems: 'start', maxWidth: 1120, mx: 'auto' }}>
          <Panel sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h4" component="h2">{count} {count === 1 ? 'item' : 'items'}</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: shop.ink2 }}>Cash on delivery</Typography>
                <StatusChip status={order.status} />
              </Box>
            </Box>
            <Box component="ul" aria-label="Items in this order" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column' }}>
              {order.items.map((i, n) => (
                <Box component="li" key={n} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, borderTop: n ? `1px solid ${shop.line}` : 0 }}>
                  <Thumb src={i.image} size={72} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }}>{i.name}</Typography>
                    <Typography variant="body2" sx={{ color: shop.ink2 }}>{i.colourwayName} · UK {i.size} · {i.qty} × {formatNPR(i.unitPrice)}</Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatNPR(i.lineTotal)}</Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ borderTop: `1px solid ${shop.line}`, pt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: shop.ink2 }}>Delivery</Typography>
                <Typography sx={{ color: shop.ink2, fontWeight: 600 }}>{order.deliveryFee ? formatNPR(order.deliveryFee) : 'Confirmed by phone'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Typography sx={{ fontWeight: 800, fontSize: 17 }}>Total</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: 26, ...WIDE, fontVariantNumeric: 'tabular-nums' }}>{formatNPR(order.total)}</Typography>
              </Box>
            </Box>
          </Panel>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Panel>
              <Eyebrow sx={{ color: shop.ink2, mb: 2 }}>What happens next</Eyebrow>
              <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {NEXT.map(({ icon: Icon, title, body }) => (
                  <Box component="li" key={title} sx={{ display: 'flex', gap: 1.5 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: shop.sunk, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon size={18} strokeWidth={2} aria-hidden="true" /></Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: 15 }}>{title}</Typography>
                      <Typography variant="body2" sx={{ color: shop.ink2 }}>{body}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Panel>
            {order.shipping ? (
              <Panel>
                <Eyebrow sx={{ color: shop.ink2, mb: 1.5 }}>Delivering to</Eyebrow>
                <ShippingBlock shipping={order.shipping} />
              </Panel>
            ) : null}
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button component={RouterLink} to="/account" variant="contained" size="large">View my orders</Button>
              <Button component={RouterLink} to="/shop" variant="outlined" size="large" endIcon={<ArrowRight size={18} strokeWidth={2.25} aria-hidden="true" />}>Keep shopping</Button>
            </Box>
          </Box>
        </Box>
      </PageBox>
    </Box>
  );
}
