import { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import { PageBox, useTitle } from '../components/Page.jsx';
import { HistoryList, OrderItemsTable, ShippingBlock, StatusChip } from '../components/OrderParts.jsx';
import NotFound from './NotFound.jsx';
import { useCancelOrder, useOrder } from '../api/hooks.js';
import { formatDate } from '../lib/format.js';

export default function AccountOrder() {
  const { id } = useParams();
  const { data: order, isLoading, error } = useOrder(id);
  const cancel = useCancelOrder();
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState('');
  useTitle(order ? `Order ${order.orderNumber}` : 'Order');
  if (isLoading) return <PageBox sx={{ py: 10 }}><Skeleton variant="rectangular" height={320} /></PageBox>;
  if (error || !order) return <NotFound />;

  const doCancel = async () => {
    setErr('');
    try {
      await cancel.mutateAsync({ id });
      setConfirm(false);
    } catch (e) {
      setErr(e.message);
      setConfirm(false);
    }
  };

  return (
    <PageBox sx={{ py: { xs: 6, md: 12 } }}>
      <Box sx={{ maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
        <Link component={RouterLink} to="/account" sx={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>Back to your account</Link>
        <Typography variant="h3" component="h1" sx={{ fontVariantNumeric: 'tabular-nums' }}>Order {order.orderNumber}</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusChip status={order.status} />
          <Typography variant="body2" color="text.secondary">Placed {formatDate(order.createdAt)} &middot; Cash on delivery &middot; {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}</Typography>
        </Box>
        {err ? <Alert severity="error">{err}</Alert> : null}
        <Box sx={{ width: '100%' }}><OrderItemsTable order={order} /></Box>
        <Box><Typography variant="h5" component="h2" sx={{ mb: 2 }}>Delivery</Typography><ShippingBlock shipping={order.shipping} /></Box>
        <Box><Typography variant="h5" component="h2" sx={{ mb: 1 }}>History</Typography><HistoryList history={order.statusHistory} /></Box>
        {order.status === 'placed' ? <Button variant="outlined" onClick={() => setConfirm(true)}>Cancel order</Button> : null}
      </Box>
      <Dialog open={confirm} onClose={() => setConfirm(false)} aria-labelledby="cancel-title">
        <DialogTitle id="cancel-title">Cancel this order?</DialogTitle>
        <DialogContent><Typography color="text.secondary">Order {order.orderNumber} will be cancelled. This cannot be undone.</Typography></DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setConfirm(false)}>Keep order</Button>
          <Button variant="contained" onClick={doCancel} aria-disabled={cancel.isPending}>Cancel order</Button>
        </DialogActions>
      </Dialog>
    </PageBox>
  );
}
