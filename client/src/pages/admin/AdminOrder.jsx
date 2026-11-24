import { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';
import { Printer, Phone, Mail, MapPin, Check, Truck, PackageCheck, XCircle, ClipboardCheck, Copy } from 'lucide-react';
import AdminNotFound from './AdminNotFound.jsx';
import { useAdminCustomer, useAdminOrder, useSetOrderStatus } from '../../api/hooks.js';
import { nextStatuses, statusLabel } from '../../lib/orders.js';
import { formatNPR } from '../../lib/format.js';
import { useUi } from '../../store/ui.js';
import { Avatar, DefList, ErrorState, Panel, StatusChip, Thumb, fmtDateTime, fmtNPRCompact, useAdminPage } from './kit.jsx';

const ACTION = {
  confirmed: { label: 'Confirm order', icon: ClipboardCheck, help: 'Stock checked and the customer confirmed by phone.' },
  shipped: { label: 'Mark as shipped', icon: Truck, help: 'Handed to the delivery rider.' },
  delivered: { label: 'Mark as delivered', icon: PackageCheck, help: 'Delivered and cash collected.' },
  cancelled: { label: 'Cancel order', icon: XCircle, help: '' },
};
const FLOW = ['placed', 'confirmed', 'shipped', 'delivered'];

function Timeline({ order }) {
  const history = order.statusHistory || [];
  const done = new Set(history.map((h) => h.status));
  const upcoming = order.status === 'cancelled' || order.status === 'delivered' ? [] : FLOW.filter((s) => !done.has(s));
  const entries = [...history.map((h) => ({ ...h, done: true })), ...upcoming.map((s) => ({ status: s, done: false }))];
  return (
    <Box component="ol" aria-label="Status timeline" sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {entries.map((e, i) => {
        const last = i === entries.length - 1;
        const current = e.done && (i === history.length - 1);
        return (
          <Box component="li" key={`${e.status}-${i}`} sx={{ display: 'grid', gridTemplateColumns: '24px 1fr', columnGap: 1.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box
                aria-hidden="true"
                sx={(th) => ({
                  width: 20, height: 20, borderRadius: '50%', mt: 0.25, display: 'grid', placeItems: 'center', flex: 'none',
                  backgroundColor: !e.done ? 'transparent' : e.status === 'cancelled' ? th.admin.bad : current ? th.admin.accent : th.admin.good,
                  border: e.done ? 'none' : `2px dashed ${th.admin.lineStrong}`, color: '#FFFFFF',
                })}
              >
                {e.done ? (e.status === 'cancelled' ? <XCircle size={12} /> : <Check size={12} strokeWidth={3} />) : null}
              </Box>
              {!last ? <Box sx={(th) => ({ width: 2, flex: 1, minHeight: 20, my: 0.5, backgroundColor: e.done && entries[i + 1]?.done ? th.admin.good : th.admin.line })} /> : null}
            </Box>
            <Box sx={{ pb: last ? 0 : 2 }}>
              <Typography sx={(th) => ({ fontWeight: 700, fontSize: 14, color: e.done ? th.admin.ink : th.admin.ink3 })}>
                {statusLabel(e.status)}{current ? <Box component="span" sx={(th) => ({ ml: 1, fontSize: 12, fontWeight: 700, color: th.admin.accentText })}>Current</Box> : null}
              </Typography>
              <Typography variant="caption" sx={(th) => ({ color: th.admin.ink2, display: 'block' })}>
                {e.done ? fmtDateTime(e.at) : 'Pending'}
              </Typography>
              {e.note ? <Typography variant="body2" sx={(th) => ({ mt: 0.5, color: th.admin.ink2, fontStyle: 'italic' })}>“{e.note}”</Typography> : null}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function StatusActions({ order }) {
  const setStatus = useSetOrderStatus();
  const showSnackbar = useUi((s) => s.showSnackbar);
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [err, setErr] = useState('');
  const allowed = nextStatuses(order.status);
  const apply = async (status) => {
    setErr('');
    setConfirm(null);
    try {
      await setStatus.mutateAsync({ id: order.id, status, note: note.trim() || undefined });
      showSnackbar({ message: `Order ${order.orderNumber} ${status === 'cancelled' ? 'cancelled' : `marked as ${statusLabel(status).toLowerCase()}`}` });
      setNote('');
    } catch (e) {
      setErr(e.status === 409 ? 'This order changed in the meantime. Reload to see its current status.' : e.message);
    }
  };
  if (!allowed.length) {
    return (
      <Typography variant="body2" sx={(th) => ({ color: th.admin.ink2 })}>
        This order is {order.status}. No further changes are possible.
      </Typography>
    );
  }
  const primary = allowed.find((s) => s !== 'cancelled');
  const P = primary ? ACTION[primary] : null;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {err ? <Alert severity="error">{err}</Alert> : null}
      {P ? <Typography variant="body2" sx={(th) => ({ color: th.admin.ink2 })}>Next step: {P.help}</Typography> : null}
      <TextField size="small" label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} slotProps={{ htmlInput: { maxLength: 300 } }} helperText="Saved in the timeline." />
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {P ? (
          <Button variant="contained" onClick={() => apply(primary)} disabled={setStatus.isPending} startIcon={setStatus.isPending ? <CircularProgress size={15} color="inherit" /> : <P.icon size={16} aria-hidden="true" />}>
            {P.label}
          </Button>
        ) : null}
        {allowed.includes('cancelled') ? <Button variant="outlined" color="error" onClick={() => setConfirm('cancelled')} disabled={setStatus.isPending} sx={(th) => ({ color: th.admin.bad })}>Cancel order</Button> : null}
      </Box>
      <Dialog open={confirm === 'cancelled'} onClose={() => setConfirm(null)} aria-labelledby="cancel-title">
        <DialogTitle id="cancel-title">Cancel order {order.orderNumber}?</DialogTitle>
        <DialogContent><Typography variant="body2" color="text.secondary">The customer will see this order as cancelled. This cannot be undone.{note.trim() ? ` Note: “${note.trim()}”.` : ''}</Typography></DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setConfirm(null)}>Keep order</Button>
          <Button variant="contained" color="error" onClick={() => apply('cancelled')}>Cancel order</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function CustomerPanel({ order }) {
  const c = order.customer;
  const detail = useAdminCustomer(c?.id);
  const showSnackbar = useUi((s) => s.showSnackbar);
  const s = order.shipping;
  const copy = async (text, what) => {
    try {
      await navigator.clipboard.writeText(text);
      showSnackbar({ message: `${what} copied` });
    } catch {
      showSnackbar({ message: `Could not copy the ${what.toLowerCase()}` });
    }
  };
  const address = [s.addressLine, s.area, s.city].filter(Boolean).join(', ');
  return (
    <>
      <Panel title="Customer">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Avatar name={c?.name || s.fullName} size={40} />
          <Box sx={{ minWidth: 0 }}>
            {c ? <Box component={RouterLink} to={`/admin/customers/${c.id}`} sx={{ fontWeight: 700, color: 'inherit', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>{c.name}</Box> : <Typography sx={{ fontWeight: 700 }}>{s.fullName}</Typography>}
            <Typography variant="caption" component="div" sx={(th) => ({ color: th.admin.ink2 })}>
              {detail.data ? `${detail.data.customer.orderCount} ${detail.data.customer.orderCount === 1 ? 'order' : 'orders'} · ${fmtNPRCompact(detail.data.customer.totalSpent)} spent` : ' '}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {c?.email ? <Box component="a" href={`mailto:${c.email}`} sx={(th) => ({ display: 'flex', alignItems: 'center', gap: 1, minHeight: { xs: 44, md: 0 }, color: th.admin.accentText, fontSize: 14, fontWeight: 600, textDecoration: 'none', overflowWrap: 'anywhere', '&:hover': { textDecoration: 'underline' } })}><Mail size={15} aria-hidden="true" />{c.email}</Box> : null}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box component="a" href={`tel:${s.phone}`} sx={(th) => ({ display: 'flex', alignItems: 'center', gap: 1, minHeight: { xs: 44, md: 0 }, minWidth: { xs: 44, md: 0 }, color: th.admin.accentText, fontSize: 14, fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } })}><Phone size={15} aria-hidden="true" />{s.phone}</Box>
            <Button size="small" variant="text" onClick={() => copy(s.phone, 'Phone number')} aria-label="Copy phone number" sx={{ minWidth: { xs: 44, md: 0 }, px: 1 }}><Copy size={14} aria-hidden="true" /></Button>
          </Box>
        </Box>
      </Panel>
      <Panel title="Delivery address" action={<Button size="small" variant="text" startIcon={<Copy size={14} aria-hidden="true" />} onClick={() => copy(`${s.fullName}, ${address}${s.landmark ? ` (${s.landmark})` : ''}, ${s.phone}`, 'Address')}>Copy</Button>}>
        <Box sx={{ display: 'flex', gap: 1.25 }}>
          <MapPin size={17} aria-hidden="true" style={{ flex: 'none', marginTop: 2 }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{s.fullName}</Typography>
            <Typography variant="body2">{s.addressLine}</Typography>
            <Typography variant="body2">{s.area}, {s.city}</Typography>
            {s.landmark ? <Typography variant="body2" sx={(th) => ({ color: th.admin.ink2 })}>Landmark: {s.landmark}</Typography> : null}
          </Box>
        </Box>
        {s.notes ? <Alert severity="info" sx={{ mt: 2 }}>Delivery note: {s.notes}</Alert> : null}
      </Panel>
    </>
  );
}

export function ItemsTable({ order, dense }) {
  return (
    <Box>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {order.items.map((i, n) => (
          <Box component="li" key={n} sx={(th) => ({ display: 'grid', gridTemplateColumns: dense ? '1fr auto auto' : 'auto minmax(0,1fr) auto', gap: 2, alignItems: 'center', py: 1.5, borderBottom: `1px solid ${th.admin.line}` })}>
            {dense ? null : <Thumb src={i.image} size={56} alt="" />}
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}>{i.name}</Typography>
              <Typography variant="body2" sx={(th) => ({ color: th.admin.ink2 })}>{i.colourwayName} · UK {i.size} · {i.qty} × {formatNPR(i.unitPrice)}</Typography>
            </Box>
            {dense ? <Typography sx={{ fontWeight: 700 }}>× {i.qty}</Typography> : null}
            <Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{formatNPR(i.lineTotal)}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 0.75, columnGap: 3, pt: 2, ml: 'auto', maxWidth: 360, fontVariantNumeric: 'tabular-nums' }}>
        <Typography variant="body2" sx={(th) => ({ color: th.admin.ink2 })}>Subtotal</Typography><Typography variant="body2" sx={{ textAlign: 'right' }}>{formatNPR(order.subtotal)}</Typography>
        <Typography variant="body2" sx={(th) => ({ color: th.admin.ink2 })}>Delivery</Typography><Typography variant="body2" sx={{ textAlign: 'right' }}>{order.deliveryFee ? formatNPR(order.deliveryFee) : 'Confirmed by phone'}</Typography>
        <Typography sx={{ fontWeight: 800 }}>Total</Typography><Typography sx={{ fontWeight: 800, textAlign: 'right' }}>{formatNPR(order.total)}</Typography>
      </Box>
    </Box>
  );
}

export function Component() {
  return <AdminOrder />;
}

export default function AdminOrder() {
  const { id } = useParams();
  const { data: order, isLoading, error, refetch } = useAdminOrder(id);
  useAdminPage(order ? `Order ${order.orderNumber}` : 'Order', [{ to: '/admin/orders', label: 'Orders' }]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' } }}>
        <Skeleton variant="rectangular" height={360} sx={{ borderRadius: '12px' }} />
        <Skeleton variant="rectangular" height={360} sx={{ borderRadius: '12px' }} />
      </Box>
    );
  }
  if (error?.status === 404 || (!error && !order)) return <AdminNotFound what="order" />;
  if (error) return <Panel><ErrorState title="Could not load this order" error={error} onRetry={refetch} /></Panel>;
  const qty = order.items.reduce((s, i) => s + i.qty, 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <StatusChip status={order.status} />
        <Box component="span" sx={(th) => ({ fontSize: 13, fontWeight: 700, px: 1.25, lineHeight: '24px', borderRadius: 999, backgroundColor: order.paymentStatus === 'paid' ? (th.palette.mode === 'dark' ? 'rgba(111,211,162,0.14)' : '#DDF1E8') : th.admin.sunk, color: order.paymentStatus === 'paid' ? th.admin.good : th.admin.ink2 })}>
          {order.paymentStatus === 'paid' ? 'Paid · cash on delivery' : 'Unpaid · cash on delivery'}
        </Box>
        <Typography variant="body2" sx={(th) => ({ color: th.admin.ink2 })}>Placed {fmtDateTime(order.createdAt)} · {qty} {qty === 1 ? 'pair' : 'pairs'}</Typography>
        <Box sx={{ flex: 1 }} />
        <Button component={RouterLink} to={`/admin/orders/${order.id}/slip`} variant="outlined" startIcon={<Printer size={16} aria-hidden="true" />}>Packing slip</Button>
      </Box>

      <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 }, gridTemplateColumns: { xs: 'minmax(0,1fr)', lg: 'minmax(0,2fr) minmax(0,1fr)' }, alignItems: 'start' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 }, minWidth: 0 }}>
          <Panel title={`Items (${order.items.length})`}><ItemsTable order={order} /></Panel>
          <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 }, gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(2, minmax(0,1fr))' }, alignItems: 'start' }}>
            <Panel title="Update status"><StatusActions order={order} /></Panel>
            <Panel title="Timeline"><Timeline order={order} /></Panel>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 }, minWidth: 0 }}>
          <CustomerPanel order={order} />
          <Panel title="Payment">
            <DefList rows={[['Method', 'Cash on delivery'], ['Status', order.paymentStatus === 'paid' ? 'Paid' : 'To collect on delivery'], ['Amount', formatNPR(order.total)]]} />
          </Panel>
        </Box>
      </Box>
    </Box>
  );
}
