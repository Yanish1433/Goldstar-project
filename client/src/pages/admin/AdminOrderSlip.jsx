import { Link as RouterLink, useParams } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import { Printer, ArrowLeft } from 'lucide-react';
import AdminNotFound from './AdminNotFound.jsx';
import { useAdminOrder } from '../../api/hooks.js';
import { formatDate, formatNPR } from '../../lib/format.js';
import { ErrorState, Panel, useAdminPage } from './kit.jsx';

export function Component() {
  return <AdminOrderSlip />;
}

// Packing slip: a paper-white A5/A4 sheet that prints on its own (the shell hides its chrome for print).
export default function AdminOrderSlip() {
  const { id } = useParams();
  const { data: o, isLoading, error, refetch } = useAdminOrder(id);
  useAdminPage(o ? `Packing slip ${o.orderNumber}` : 'Packing slip', [{ to: '/admin/orders', label: 'Orders' }, ...(o ? [{ to: `/admin/orders/${o.id}`, label: o.orderNumber }] : [])]);
  if (isLoading) return <Skeleton variant="rectangular" height={600} sx={{ maxWidth: 760, mx: 'auto', borderRadius: '12px' }} />;
  if (error?.status === 404 || (!error && !o)) return <AdminNotFound what="order" />;
  if (error) return <Panel><ErrorState onRetry={refetch} /></Panel>;
  const s = o.shipping;
  const qty = o.items.reduce((n, i) => n + i.qty, 0);
  const cell = { py: 1, px: 1, borderBottom: '1px solid #DDD6CA', textAlign: 'left', fontSize: 13.5, verticalAlign: 'top' };
  return (
    <Box sx={{ maxWidth: 760, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', flexWrap: 'wrap', '@media print': { display: 'none' } }}>
        <Button component={RouterLink} to={`/admin/orders/${o.id}`} variant="text" startIcon={<ArrowLeft size={16} aria-hidden="true" />}>Back to order</Button>
        <Button variant="contained" startIcon={<Printer size={16} aria-hidden="true" />} onClick={() => window.print()}>Print slip</Button>
      </Box>
      <Box
        component="article"
        aria-label={`Packing slip for order ${o.orderNumber}`}
        sx={{
          backgroundColor: '#FFFFFF', color: '#16120E', borderRadius: '12px', border: '1px solid rgba(22,18,14,0.12)', boxShadow: '0 1px 2px rgba(22,18,14,0.06)', p: { xs: 2.5, sm: 5 },
          '@media print': { border: 0, boxShadow: 'none', borderRadius: 0, p: 0 },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <svg width="36" height="36" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#FF5A1F" /><path d="M32 9.5l6.6 14.3 15.7 1.8-11.6 10.7 3.2 15.4L32 43.9l-13.9 7.8 3.2-15.4L9.7 25.6l15.7-1.8z" fill="#1A0B05" /></svg>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 18, lineHeight: 1.1, fontStretch: '112%', fontVariationSettings: '"wdth" 112' }}>Goldstar Shoes</Typography>
              <Typography sx={{ fontSize: 12.5, color: '#5A5247' }}>Made in Nepal · goldstarshoes.com</Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: { sm: 'right' } }}>
            <Typography sx={{ fontWeight: 800, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5247' }}>Packing slip</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>{o.orderNumber}</Typography>
            <Typography sx={{ fontSize: 13, color: '#5A5247' }}>Placed {formatDate(o.createdAt)}</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 4 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5247', mb: 0.75 }}>Deliver to</Typography>
            <Typography sx={{ fontWeight: 700 }}>{s.fullName}</Typography>
            <Typography sx={{ fontSize: 14 }}>{s.addressLine}</Typography>
            <Typography sx={{ fontSize: 14 }}>{s.area}, {s.city}</Typography>
            {s.landmark ? <Typography sx={{ fontSize: 14 }}>Landmark: {s.landmark}</Typography> : null}
            <Typography sx={{ fontSize: 14, fontWeight: 700, mt: 0.5 }}>{s.phone}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5247', mb: 0.75 }}>Payment</Typography>
            <Typography sx={{ fontWeight: 700 }}>{o.paymentStatus === 'paid' ? 'Paid' : 'Cash on delivery'}</Typography>
            {o.paymentStatus !== 'paid' ? <Typography sx={{ fontSize: 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>Collect {formatNPR(o.total)}</Typography> : null}
            {s.notes ? <Typography sx={{ fontSize: 14, mt: 1 }}><b>Note:</b> {s.notes}</Typography> : null}
          </Box>
        </Box>

        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontVariantNumeric: 'tabular-nums' }}>
          <thead>
            <tr>
              {['', 'Item', 'Colour', 'Size', 'Qty', 'Price'].map((h, i) => (
                <Box component="th" key={h || 'check'} scope="col" sx={{ ...cell, fontSize: 11.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5A5247', borderBottom: '2px solid #16120E', textAlign: i >= 4 ? 'right' : 'left', width: i === 0 ? 28 : undefined }}>
                  {h || <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Packed</span>}
                </Box>
              ))}
            </tr>
          </thead>
          <tbody>
            {o.items.map((i, n) => (
              <tr key={n}>
                <Box component="td" sx={cell}><Box aria-hidden="true" sx={{ width: 14, height: 14, border: '1.5px solid #16120E', borderRadius: '3px', mt: 0.25 }} /></Box>
                <Box component="td" sx={{ ...cell, fontWeight: 700 }}>{i.name}</Box>
                <Box component="td" sx={cell}>{i.colourwayName}</Box>
                <Box component="td" sx={cell}>UK {i.size}</Box>
                <Box component="td" sx={{ ...cell, textAlign: 'right', fontWeight: 700 }}>{i.qty}</Box>
                <Box component="td" sx={{ ...cell, textAlign: 'right' }}>{formatNPR(i.lineTotal)}</Box>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <Box component="td" colSpan={4} sx={{ ...cell, borderBottom: 0, fontWeight: 700 }}>{qty} {qty === 1 ? 'pair' : 'pairs'}</Box>
              <Box component="td" sx={{ ...cell, borderBottom: 0, textAlign: 'right', fontWeight: 800 }}>Total</Box>
              <Box component="td" sx={{ ...cell, borderBottom: 0, textAlign: 'right', fontWeight: 800 }}>{formatNPR(o.total)}</Box>
            </tr>
          </tfoot>
        </Box>

        <Box sx={{ mt: 5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {['Packed by', 'Received by (signature)'].map((l) => (
            <Box key={l}>
              <Box sx={{ borderBottom: '1px solid #16120E', height: 32 }} />
              <Typography sx={{ fontSize: 12, color: '#5A5247', mt: 0.5 }}>{l}</Typography>
            </Box>
          ))}
        </Box>
        <Typography sx={{ fontSize: 12, color: '#5A5247', mt: 4, textAlign: 'center' }}>Thank you for choosing Goldstar.</Typography>
      </Box>
    </Box>
  );
}
