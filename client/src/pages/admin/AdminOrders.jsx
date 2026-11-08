import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Pagination from '@mui/material/Pagination';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { Search, Download, Inbox, X } from 'lucide-react';
import { useAdminOrders } from '../../api/hooks.js';
import { apiFetch } from '../../api/client.js';
import { useUi } from '../../store/ui.js';
import { STATUSES, statusLabel, nextStatuses } from '../../lib/orders.js';
import { dayKey } from '../../lib/adminStats.js';
import { formatNPR } from '../../lib/format.js';
import { EmptyState, ErrorState, Panel, SkeletonRows, StatusChip, Thumb, fmtDateTime, useAdminPage } from './kit.jsx';

const PRESETS = [
  { v: '', label: 'Any time' },
  { v: 'today', label: 'Today' },
  { v: '7', label: 'Last 7 days' },
  { v: '30', label: 'Last 30 days' },
  { v: 'custom', label: 'Custom range' },
];
const presetRange = (p) => {
  if (p === 'today') return { from: dayKey(Date.now()), to: dayKey(Date.now()) };
  if (p === '7' || p === '30') return { from: dayKey(Date.now() - (Number(p) - 1) * 86_400_000), to: dayKey(Date.now()) };
  return null;
};
const hideXs = { display: { xs: 'none', md: 'table-cell' } };

// Inline status change: only the allowed next statuses; optimistic, rolled back with a toast on error.
export function StatusCell({ order }) {
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
      showSnackbar({ message: `Order ${order.orderNumber} moved to ${statusLabel(status).toLowerCase()}` });
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
        inputProps={{ 'aria-label': `Status of order ${order.orderNumber}: ${statusLabel(order.status)}. Change status` }}
        renderValue={(v) => <StatusChip status={v} />}
        sx={{ '& .MuiSelect-select': { py: 0.25, pr: '26px !important', minHeight: 'auto', display: 'flex', alignItems: 'center' } }}
      >
        <MenuItem value={order.status} disabled>{statusLabel(order.status)} (current)</MenuItem>
        {next.map((s) => <MenuItem key={s} value={s}>Mark as {statusLabel(s).toLowerCase()}</MenuItem>)}
      </Select>
      <Dialog open={confirm} onClose={() => setConfirm(false)} onClick={(e) => e.stopPropagation()} aria-labelledby={`cancel-${order.id}`}>
        <DialogTitle id={`cancel-${order.id}`}>Cancel order {order.orderNumber}?</DialogTitle>
        <DialogContent><Typography variant="body2" color="text.secondary">The customer will see it as cancelled. This cannot be undone.</Typography></DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setConfirm(false)}>Keep order</Button>
          <Button variant="contained" color="error" onClick={() => { setConfirm(false); change('cancelled'); }}>Cancel order</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function toCsv(items) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['Order', 'Placed', 'Customer', 'Phone', 'City', 'Items', 'Total (NPR)', 'Status', 'Payment'];
  const rows = items.map((o) => [o.orderNumber, new Date(o.createdAt).toISOString(), o.customer?.name || o.shipping?.fullName, o.shipping?.phone, o.shipping?.city, o.items.reduce((s, i) => s + i.qty, 0), o.total, o.status, o.paymentStatus]);
  return [head, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
}

export function Component() {
  return <AdminOrders />;
}

export default function AdminOrders() {
  useAdminPage('Orders');
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const showSnackbar = useUi((s) => s.showSnackbar);
  const status = params.get('status') || 'all';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const limit = [10, 20, 50].includes(Number(params.get('limit'))) ? Number(params.get('limit')) : 20;
  const sort = params.get('sort') || 'newest';
  const qParam = params.get('q') || '';
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const preset = params.get('range') || (from || to ? 'custom' : '');
  const [search, setSearch] = useState(qParam);
  const query = { status, q: qParam || undefined, from: from || undefined, to: to || undefined, sort, page, limit };
  const orders = useAdminOrders(query);

  useEffect(() => setSearch(qParam), [qParam]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (search.trim() !== qParam) update({ q: search.trim() }, true);
    }, 300);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  function update(patch, replace = false) {
    const n = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v && v !== 'all' ? n.set(k, String(v)) : n.delete(k)));
    if (!('page' in patch)) n.delete('page');
    setParams(n, { replace });
  }
  const setPreset = (p) => {
    const r = presetRange(p);
    if (p === 'custom') update({ range: 'custom', from: from || dayKey(Date.now() - 6 * 86_400_000), to: to || dayKey(Date.now()) });
    else update({ range: p, from: r?.from || '', to: r?.to || '' });
  };
  const sortBy = (key) => {
    const [cur, dir] = sort === 'newest' ? ['date', 'desc'] : sort === 'oldest' ? ['date', 'asc'] : sort === 'total_desc' ? ['total', 'desc'] : ['total', 'asc'];
    const nextDir = cur === key && dir === 'desc' ? 'asc' : 'desc';
    update({ sort: key === 'date' ? (nextDir === 'desc' ? '' : 'oldest') : nextDir === 'desc' ? 'total_desc' : 'total_asc' });
  };
  const sortState = (key) => {
    if (key === 'date' && (sort === 'newest' || sort === 'oldest')) return sort === 'newest' ? 'desc' : 'asc';
    if (key === 'total' && sort.startsWith('total')) return sort === 'total_desc' ? 'desc' : 'asc';
    return false;
  };

  const data = orders.data;
  const items = data?.items || [];
  const counts = data?.counts;
  const total = data?.total || 0;
  const pages = data ? Math.max(1, Math.ceil(total / data.limit)) : 1;
  const filtered = !!(qParam || from || to);

  const exportCsv = async () => {
    try {
      const all = await apiFetch('/admin/orders', { query: { ...query, page: 1, limit: 100 } });
      const blob = new Blob([`﻿${toCsv(all.items)}`], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `goldstar-orders-${dayKey(Date.now())}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      showSnackbar({ message: `Exported ${all.items.length} orders` });
    } catch (e) {
      showSnackbar({ message: e.message || 'Could not export orders.' });
    }
  };

  return (
    <Panel pad={false} sx={{ overflow: 'hidden' }} aria-label="Orders">
      <Box sx={(th) => ({ borderBottom: `1px solid ${th.admin.line}`, px: { xs: 0.5, sm: 1.5 } })}>
        <Tabs value={status} onChange={(_, v) => update({ status: v })} variant="scrollable" scrollButtons={false} aria-label="Order status">
          {['all', ...STATUSES].map((s) => (
            <Tab
              key={s}
              value={s}
              label={(
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                  {s === 'all' ? 'All' : statusLabel(s)}
                  <Box component="span" sx={(th) => ({ fontSize: 12, fontWeight: 700, px: 0.75, minWidth: 22, borderRadius: 999, backgroundColor: status === s ? th.admin.accentWash : th.admin.sunk, color: status === s ? th.admin.accentText : th.admin.ink2, fontVariantNumeric: 'tabular-nums', lineHeight: '20px' })}>
                    {counts ? counts[s] ?? 0 : '–'}
                  </Box>
                </Box>
              )}
            />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', p: { xs: 1.5, sm: 2 } }}>
        <TextField
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Order number, name or phone"
          aria-label="Search orders by order number, customer name or phone"
          sx={{ flex: { xs: '1 1 100%', sm: '1 1 280px' }, maxWidth: { sm: 360 } }}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><Search size={16} aria-hidden="true" /></InputAdornment>,
              endAdornment: search ? <InputAdornment position="end"><IconButton size="small" onClick={() => setSearch('')} aria-label="Clear search" sx={{ width: 28, height: 28 }}><X size={15} aria-hidden="true" /></IconButton></InputAdornment> : null,
            },
          }}
        />
        <Select size="small" value={preset} onChange={(e) => setPreset(e.target.value)} displayEmpty inputProps={{ 'aria-label': 'Date range' }} sx={{ minWidth: 150 }}>
          {PRESETS.map((p) => <MenuItem key={p.v} value={p.v}>{p.label}</MenuItem>)}
        </Select>
        {preset === 'custom' ? (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField size="small" type="date" label="From" value={from} onChange={(e) => update({ range: 'custom', from: e.target.value, to })} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: to || undefined } }} />
            <TextField size="small" type="date" label="To" value={to} onChange={(e) => update({ range: 'custom', from, to: e.target.value })} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: from || undefined } }} />
          </Box>
        ) : null}
        <Box sx={{ flex: 1 }} />
        {filtered ? <Button size="small" variant="text" onClick={() => { setSearch(''); setParams(status !== 'all' ? { status } : {}); }}>Clear filters</Button> : null}
        <Tooltip title="Download the orders matching these filters (up to 100)">
          <Button size="small" variant="outlined" startIcon={<Download size={15} aria-hidden="true" />} onClick={exportCsv} disabled={!total}>Export CSV</Button>
        </Tooltip>
      </Box>

      {orders.isError && !data ? <ErrorState title="Could not load orders" onRetry={() => orders.refetch()} /> : !orders.isLoading && items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={filtered || status !== 'all' ? 'No orders match' : 'No orders yet'}
          body={filtered || status !== 'all' ? 'Try another status, a wider date range or a different search.' : 'Orders placed in the store will show up here.'}
          action={filtered ? <Button variant="outlined" onClick={() => { setSearch(''); setParams({}); }}>Clear filters</Button> : <Button component={RouterLink} to="/" target="_blank" variant="outlined">Open the store</Button>}
        />
      ) : (
        <Box sx={{ overflowX: 'auto', opacity: orders.isPlaceholderData ? 0.6 : 1, transition: 'opacity 160ms ease' }}>
          <Table aria-label="Orders" aria-busy={orders.isFetching}>
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell sx={hideXs}>Customer</TableCell>
                <TableCell sx={hideXs} sortDirection={sortState('date')}>
                  <TableSortLabel active={!!sortState('date')} direction={sortState('date') || 'desc'} onClick={() => sortBy('date')}>Placed</TableSortLabel>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Payment</TableCell>
                <TableCell sx={{ pl: { xs: 0, sm: 2 } }}>Status</TableCell>
                <TableCell align="right" sortDirection={sortState('total')} sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  <TableSortLabel active={!!sortState('total')} direction={sortState('total') || 'desc'} onClick={() => sortBy('total')}>Total</TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.isLoading ? <SkeletonRows rows={8} cols={6} /> : items.map((o) => {
                const qty = o.items.reduce((s, i) => s + i.qty, 0);
                return (
                  <TableRow key={o.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/orders/${o.id}`)}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}><Thumb src={o.items[0]?.image} size={40} /></Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Box component={RouterLink} to={`/admin/orders/${o.id}`} onClick={(e) => e.stopPropagation()} sx={{ fontWeight: 700, color: 'inherit', textDecoration: 'none', whiteSpace: 'nowrap', '&:hover': { textDecoration: 'underline' } }}>{o.orderNumber}</Box>
                          <Typography variant="caption" component="div" sx={(th) => ({ color: th.admin.ink2 })}>
                            {qty} {qty === 1 ? 'pair' : 'pairs'}
                            <Box component="span" sx={{ display: { sm: 'none' } }}> · <b>{formatNPR(o.total)}</b></Box>
                          </Typography>
                          <Typography variant="caption" component="div" sx={(th) => ({ color: th.admin.ink2, display: { md: 'none' } })}>
                            {o.customer?.name || o.shipping?.fullName} · {fmtDateTime(o.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={hideXs}>
                      <Box sx={{ fontWeight: 600 }}>{o.customer?.name || o.shipping?.fullName}</Box>
                      <Typography variant="caption" sx={(th) => ({ color: th.admin.ink2 })}>{o.shipping?.city} · {o.shipping?.phone}</Typography>
                    </TableCell>
                    <TableCell sx={{ ...hideXs, whiteSpace: 'nowrap' }}>{fmtDateTime(o.createdAt)}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, whiteSpace: 'nowrap' }}>
                      <Box component="span" sx={(th) => ({ fontSize: 13, fontWeight: 600, color: o.paymentStatus === 'paid' ? th.admin.good : th.admin.ink2 })}>{o.paymentStatus === 'paid' ? 'Paid' : 'COD · unpaid'}</Box>
                    </TableCell>
                    <TableCell sx={{ pl: { xs: 0, sm: 2 } }}><StatusCell order={o} /></TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap', display: { xs: 'none', sm: 'table-cell' } }}>{formatNPR(o.total)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}

      {total > 0 ? (
        <Box sx={(th) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', px: 2, py: 1.5, borderTop: `1px solid ${th.admin.line}` })}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="body2" sx={(th) => ({ color: th.admin.ink2, fontVariantNumeric: 'tabular-nums' })} aria-live="polite">
              {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </Typography>
            <Select size="small" value={limit} onChange={(e) => update({ limit: e.target.value === 20 ? '' : e.target.value })} inputProps={{ 'aria-label': 'Rows per page' }} sx={{ '& .MuiSelect-select': { py: 0.5 } }}>
              {[10, 20, 50].map((n) => <MenuItem key={n} value={n}>{n} per page</MenuItem>)}
            </Select>
          </Box>
          {pages > 1 ? <Pagination count={pages} page={Math.min(page, pages)} onChange={(_, v) => update({ page: v > 1 ? v : '' })} siblingCount={0} aria-label="Order pages" /> : null}
        </Box>
      ) : null}
    </Panel>
  );
}
