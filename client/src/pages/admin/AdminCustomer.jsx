import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import { Mail, Phone, MapPin, ShoppingCart, Banknote, Receipt, CalendarClock, Inbox } from 'lucide-react';
import AdminNotFound from './AdminNotFound.jsx';
import { useAdminCustomer } from '../../api/hooks.js';
import { formatDate, formatNPR } from '../../lib/format.js';
import { Avatar, EmptyState, ErrorState, KpiCard, Panel, StatusChip, Thumb, fmtDateTime, fmtInt, fmtNPRCompact, fmtShortDate, useAdminPage } from './kit.jsx';

export function Component() {
  return <AdminCustomer />;
}

export default function AdminCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const q = useAdminCustomer(id);
  const c = q.data?.customer;
  useAdminPage(c?.name || 'Customer', [{ to: '/admin/customers', label: 'Customers' }]);

  if (q.isLoading) return <Box sx={{ display: 'grid', gap: 3 }}><Skeleton variant="rectangular" height={120} sx={{ borderRadius: '12px' }} /><Skeleton variant="rectangular" height={360} sx={{ borderRadius: '12px' }} /></Box>;
  if (q.error?.status === 404 || (!q.error && !c)) return <AdminNotFound what="customer" />;
  if (q.error) return <Panel><ErrorState title="Could not load this customer" error={q.error} onRetry={() => q.refetch()} /></Panel>;

  const orders = q.data.orders;
  const live = orders.filter((o) => o.status !== 'cancelled');
  const aov = live.length ? Math.round(c.totalSpent / live.length) : 0;
  const a = c.address;
  const link = (th) => ({ display: 'inline-flex', alignItems: 'center', gap: 0.75, color: th.admin.accentText, fontWeight: 600, fontSize: 14, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
      <Panel>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Avatar name={c.name} size={56} />
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="h2" component="p" sx={{ fontSize: 20 }}>{c.name}</Typography>
            <Typography variant="body2" sx={(th) => ({ color: th.admin.ink2 })}>Customer since {formatDate(c.createdAt)}{c.city ? ` · ${c.city}` : ''}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap' }}>
            <Box component="a" href={`mailto:${c.email}`} sx={link}><Mail size={15} aria-hidden="true" />{c.email}</Box>
            {c.phone || a?.phone ? <Box component="a" href={`tel:${c.phone || a.phone}`} sx={link}><Phone size={15} aria-hidden="true" />{c.phone || a.phone}</Box> : null}
          </Box>
        </Box>
      </Panel>

      <Box sx={{ display: 'grid', gap: { xs: 1.5, md: 2 }, gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', lg: 'repeat(4, minmax(0,1fr))' } }}>
        <KpiCard label="Orders" icon={ShoppingCart} value={fmtInt(c.orderCount)} foot={<Typography variant="caption" sx={(th) => ({ color: th.admin.ink3 })}>{orders.length - live.length} cancelled</Typography>} />
        <KpiCard label="Total spent" icon={Banknote} value={fmtNPRCompact(c.totalSpent)} foot={<Typography variant="caption" sx={(th) => ({ color: th.admin.ink3 })}>Excludes cancelled</Typography>} />
        <KpiCard label="Average order" icon={Receipt} value={fmtNPRCompact(aov)} />
        <KpiCard label="Last order" icon={CalendarClock} value={c.lastOrderAt ? fmtShortDate(c.lastOrderAt) : '—'} />
      </Box>

      <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 }, gridTemplateColumns: { xs: 'minmax(0,1fr)', lg: 'minmax(0,2fr) minmax(0,1fr)' }, alignItems: 'start' }}>
        <Panel title={`Orders (${orders.length})`} pad={false}>
          {orders.length === 0 ? <EmptyState icon={Inbox} title="No orders yet" body="This customer has an account but has not ordered." /> : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" aria-label={`Orders by ${c.name}`}>
                <TableHead>
                  <TableRow><TableCell>Order</TableCell><TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Placed</TableCell><TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Status</TableCell><TableCell align="right">Total</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/orders/${o.id}`)}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ display: { xs: 'none', sm: 'block' } }}><Thumb src={o.items[0]?.image} size={36} /></Box>
                          <Box>
                            <Box component={RouterLink} to={`/admin/orders/${o.id}`} onClick={(e) => e.stopPropagation()} sx={{ fontWeight: 700, color: 'inherit', textDecoration: 'none', whiteSpace: 'nowrap', '&:hover': { textDecoration: 'underline' } }}>{o.orderNumber}</Box>
                            <Typography variant="caption" component="div" sx={(th) => ({ color: th.admin.ink2 })}>{o.items.map((i) => `${i.name} (${i.colourwayName}, UK ${i.size})`).join(', ')}</Typography>
                            <Box sx={{ display: { sm: 'none' }, mt: 0.5 }}><StatusChip status={o.status} /></Box>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', display: { xs: 'none', sm: 'table-cell' } }}>{fmtDateTime(o.createdAt)}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}><StatusChip status={o.status} /></TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatNPR(o.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Panel>
        <Panel title="Latest delivery address">
          {a ? (
            <Box sx={{ display: 'flex', gap: 1.25 }}>
              <MapPin size={17} aria-hidden="true" style={{ flex: 'none', marginTop: 2 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{a.fullName}</Typography>
                <Typography variant="body2">{a.addressLine}</Typography>
                <Typography variant="body2">{a.area}, {a.city}</Typography>
                {a.landmark ? <Typography variant="body2" sx={(th) => ({ color: th.admin.ink2 })}>Landmark: {a.landmark}</Typography> : null}
                <Typography variant="body2" sx={{ mt: 0.5 }}>{a.phone}</Typography>
              </Box>
            </Box>
          ) : <Typography variant="body2" sx={(th) => ({ color: th.admin.ink2 })}>No address yet.</Typography>}
        </Panel>
      </Box>
    </Box>
  );
}
