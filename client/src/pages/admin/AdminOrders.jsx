import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import TableContainer from '@mui/material/TableContainer';
import Link from '@mui/material/Link';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import { StatusChip } from '../../components/OrderParts.jsx';
import { useAdminOrders } from '../../api/hooks.js';
import { apiFetch } from '../../api/client.js';
import { useUi } from '../../store/ui.js';
import { STATUSES, statusLabel, nextStatuses } from '../../lib/orders.js';
import { statusChipSx } from '../../theme/theme.js';
import { formatDate, formatNPR } from '../../lib/format.js';

const LIMIT = 20;
const COLS = 7;

// Inline status change (S6): only allowed next statuses; optimistic update, rolled back with a Snackbar on error.
function StatusCell({ order }) {
  const qc = useQueryClient();
  const showSnackbar = useUi((s) => s.showSnackbar);
  const [confirm, setConfirm] = useState(false);
  const next = nextStatuses(order.status);
  if (!next.length) return <StatusChip status={order.status} />;
  const change = async (status) => {
    const snapshots = qc.getQueriesData({ queryKey: ['admin', 'orders'] });
    qc.setQueriesData({ queryKey: ['admin', 'orders'] }, (old) => (old?.items ? { ...old, items: old.items.map((x) => (x.id === order.id ? { ...x, status } : x)) } : old));
    try {
      await apiFetch(`/admin/orders/${order.id}/status`, { method: 'PATCH', body: { status } });
      showSnackbar({ message: `Order moved to ${statusLabel(status).toLowerCase()}` });
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    } catch (e) {
      snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
      showSnackbar({ message: e.status === 409 ? 'That change is not allowed any more. The order was left as it was.' : e.message });
    }
  };
  return (
    <>
    <Select
      size="small"
      variant="standard"
      disableUnderline
      value={order.status}
      onChange={(e) => (e.target.value === 'cancelled' ? setConfirm(true) : change(e.target.value))}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      inputProps={{ 'aria-label': `Status of order ${order.orderNumber}` }}
      renderValue={(v) => <StatusChip status={v} />}
      sx={{ '& .MuiSelect-select': { py: 0.5, pr: '28px !important', minHeight: 'auto', display: 'flex', alignItems: 'center' } }}
    >
      <MenuItem value={order.status} disabled sx={statusChipSx(order.status)}>{statusLabel(order.status)} (current)</MenuItem>
      {next.map((s) => <MenuItem key={s} value={s}>{statusLabel(s)}</MenuItem>)}
    </Select>
    <Dialog open={confirm} onClose={() => setConfirm(false)} onClick={(e) => e.stopPropagation()} aria-labelledby={`cancel-${order.id}`}>
      <DialogTitle id={`cancel-${order.id}`}>Cancel this order?</DialogTitle>
      <DialogContent><Typography color="text.secondary">Order {order.orderNumber} will be cancelled. This cannot be undone.</Typography></DialogContent>
      <DialogActions>
        <Button variant="text" onClick={() => setConfirm(false)}>Keep order</Button>
        <Button variant="contained" onClick={() => { setConfirm(false); change('cancelled'); }}>Cancel order</Button>
      </DialogActions>
    </Dialog>
    </>
  );
}

export function Component() {
  return <AdminOrders />;
}

export default function AdminOrders() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get('status') || 'all';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const qParam = params.get('q') || '';
  const [search, setSearch] = useState(qParam);
  const [compact, setCompact] = useState(false);
  const orders = useAdminOrders({ status, q: qParam || undefined, page, limit: LIMIT });

  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== qParam) {
        const n = new URLSearchParams(params);
        search ? n.set('q', search) : n.delete('q');
        n.delete('page');
        setParams(n, { replace: true });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch) => {
    const n = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v && v !== 'all' ? n.set(k, v) : n.delete(k)));
    if (!('page' in patch)) n.delete('page');
    setParams(n);
  };
  const items = orders.data?.items || [];
  const pages = orders.data ? Math.max(1, Math.ceil(orders.data.total / orders.data.limit)) : 1;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h3" component="h1">Orders</Typography>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, justifyContent: 'space-between', gap: 2, alignItems: { lg: 'center' } }}>
        <Tabs value={status} onChange={(_, v) => update({ status: v })} variant="scrollable" scrollButtons={false} aria-label="Order status">
          <Tab value="all" label="All" />
          {STATUSES.map((s) => <Tab key={s} value={s} label={statusLabel(s)} />)}
        </Tabs>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControlLabel control={<Switch checked={compact} onChange={(e) => setCompact(e.target.checked)} />} label="Compact rows" />
          <TextField label="Search by order number or phone" size="small" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: { lg: 320 } }} />
        </Box>
      </Box>
      {orders.isError ? <Alert severity="error">Could not load orders.</Alert> : null}
      {!orders.isLoading && items.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
          <Typography color="text.secondary">{status === 'all' && !qParam ? 'No orders yet.' : 'No orders match.'}</Typography>
          <Link component={RouterLink} to="/shop" sx={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>View the shop</Link>
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)', minHeight: 200 }}>
          <Table stickyHeader size={compact ? 'small' : 'medium'} aria-label="Orders" sx={{ '& .MuiTableCell-stickyHeader': { backgroundColor: 'background.default' }, '& .MuiTableCell-root': compact ? { py: 0.5 } : undefined }}>
            <TableHead>
              <TableRow>
                <TableCell>Order number</TableCell><TableCell>Date</TableCell><TableCell>Customer</TableCell><TableCell>Phone</TableCell>
                <TableCell align="right">Items</TableCell><TableCell align="right">Total</TableCell><TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.isLoading ? Array.from({ length: 6 }, (_, r) => (
                <TableRow key={r}>{Array.from({ length: COLS }, (_, c) => <TableCell key={c}><Skeleton variant="rectangular" height={20} width={c === 0 ? 120 : 70} /></TableCell>)}</TableRow>
              )) : items.map((o) => (
                <TableRow key={o.id} hover tabIndex={0} sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/orders/${o.id}`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`/admin/orders/${o.id}`)} aria-label={`Open order ${o.orderNumber}`}>
                  <TableCell sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{o.orderNumber}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(o.createdAt)}</TableCell>
                  <TableCell>{o.customer?.name || o.shipping?.fullName}</TableCell>
                  <TableCell>{o.shipping?.phone}</TableCell>
                  <TableCell align="right">{o.items?.reduce((s, i) => s + i.qty, 0)}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatNPR(o.total)}</TableCell>
                  <TableCell><StatusCell order={o} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {pages > 1 ? <Pagination count={pages} page={page} onChange={(_, v) => update({ page: v > 1 ? String(v) : '' })} /> : null}
    </Box>
  );
}
