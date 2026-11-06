import { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import { HistoryList, OrderItemsTable, ShippingBlock, StatusChip } from '../../components/OrderParts.jsx';
import NotFound from '../NotFound.jsx';
import { useAdminOrder, useSetOrderStatus } from '../../api/hooks.js';
import { nextStatuses, statusLabel } from '../../lib/orders.js';
import { formatDate } from '../../lib/format.js';
import { useUi } from '../../store/ui.js';

export function Component() {
  return <AdminOrder />;
}

export default function AdminOrder() {
  const { id } = useParams();
  const { data: order, isLoading, error } = useAdminOrder(id);
  const setStatus = useSetOrderStatus();
  const [next, setNext] = useState('');
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState('');
  const showSnackbar = useUi((s) => s.showSnackbar);

  if (isLoading) return <Skeleton variant="rectangular" height={320} />;
  if (error || !order) return <NotFound />;
  const allowed = nextStatuses(order.status);

  const apply = async () => {
    setErr('');
    try {
      await setStatus.mutateAsync({ id, status: next, note: note.trim() || undefined });
      showSnackbar({ message: `Order moved to ${statusLabel(next).toLowerCase()}` });
      setNext('');
      setNote('');
    } catch (e) {
      setErr(e.message);
    }
    setConfirm(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start', maxWidth: 900 }}>
      <Link component={RouterLink} to="/admin/orders" sx={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>Back to orders</Link>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h3" component="h1" sx={{ fontVariantNumeric: 'tabular-nums' }}>Order {order.orderNumber}</Typography>
        <StatusChip status={order.status} />
      </Box>
      <Typography variant="body2" color="text.secondary">
        {order.customer ? `${order.customer.name} · ${order.customer.email} · ` : ''}Placed {formatDate(order.createdAt)} &middot; Cash on delivery &middot; {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
      </Typography>
      <Box sx={{ width: '100%' }}><OrderItemsTable order={order} /></Box>
      <Box><Typography variant="h5" component="h2" sx={{ mb: 2 }}>Delivery</Typography><ShippingBlock shipping={order.shipping} /></Box>
      <Box><Typography variant="h5" component="h2" sx={{ mb: 1 }}>History</Typography><HistoryList history={order.statusHistory} /></Box>
      <Paper sx={{ p: 3, width: '100%', boxSizing: 'border-box' }}>
        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>Update status</Typography>
        {allowed.length === 0 ? <Typography color="text.secondary">This order is {order.status}. No further changes are possible.</Typography> : (
          <Box component="form" onSubmit={(e) => { e.preventDefault(); if (!next) return; next === 'cancelled' ? setConfirm(true) : apply(); }} sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start', maxWidth: 420 }}>
            {err ? <Alert severity="error" sx={{ width: '100%' }}>{err}</Alert> : null}
            <FormControl fullWidth>
              <InputLabel id="next-label">Next status</InputLabel>
              <Select labelId="next-label" label="Next status" value={next} onChange={(e) => setNext(e.target.value)}>
                {allowed.map((s) => <MenuItem key={s} value={s}>{statusLabel(s)}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button type="submit" variant="contained" aria-disabled={!next || setStatus.isPending}>Update status</Button>
          </Box>
        )}
      </Paper>
      <Dialog open={confirm} onClose={() => setConfirm(false)} aria-labelledby="cn-title">
        <DialogTitle id="cn-title">Cancel this order?</DialogTitle>
        <DialogContent><Typography color="text.secondary">This cannot be undone.</Typography></DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setConfirm(false)}>Keep order</Button>
          <Button variant="contained" onClick={apply}>Cancel order</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
