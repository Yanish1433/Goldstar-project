import { ADMIN_COARSE } from '../../theme/adminTheme.js';
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import { Banknote, ShoppingCart, Receipt, Package, ArrowRight, Inbox, PackageCheck } from 'lucide-react';
import { useAdminStats } from '../../api/hooks.js';
import { formatNPR } from '../../lib/format.js';
import { Delta, EmptyState, ErrorState, KpiCard, Panel, SkeletonRows, StatusChip, Thumb, fmtDateTime, fmtInt, fmtNPRCompact, useAdminPage } from './kit.jsx';
import { StatusBars, TrendChart, TrendTable } from './charts.jsx';

const RANGES = [{ v: 7, label: '7 days' }, { v: 30, label: '30 days' }, { v: 90, label: '90 days' }];

export function Component() {
  return <AdminDashboard />;
}

export default function AdminDashboard() {
  useAdminPage('Dashboard');
  const [days, setDays] = useState(30);
  const [measure, setMeasure] = useState('revenue');
  const [asTable, setAsTable] = useState(false);
  const navigate = useNavigate();
  const stats = useAdminStats({ days });
  const s = stats.data;
  const k = s?.kpis;
  const loading = stats.isLoading;
  const vs = `vs previous ${days} days`;

  // A brand-new store (no orders in the range) gets explanatory empty states instead of flat-zero charts.
  const noOrders = !!s && s.series.every((d) => !d.orders && !d.revenue);
  const inRange = s ? s.statusBreakdown.reduce((a, r) => a + r.count, 0) : 0;

  if (stats.isError && !s) return <Panel><ErrorState title="Could not load the dashboard" error={stats.error} onRetry={() => stats.refetch()} /></Panel>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={(th) => ({ color: th.admin.ink2 })}>
          {s ? <>Store performance for the last <b>{days} days</b>. Revenue excludes cancelled orders.</> : 'Loading store performance…'}
        </Typography>
        <ToggleButtonGroup exclusive size="small" value={days} onChange={(_, v) => v && setDays(v)} aria-label="Date range">
          {RANGES.map((r) => <ToggleButton key={r.v} value={r.v}>{r.label}</ToggleButton>)}
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ display: 'grid', gap: { xs: 1.5, md: 2 }, gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', lg: 'repeat(4, minmax(0,1fr))' } }}>
        <KpiCard label="Revenue" icon={Banknote} loading={loading} value={k ? fmtNPRCompact(k.revenue.value) : ''} delta={k ? <Delta value={k.revenue.value} prev={k.revenue.prev} suffix={vs} /> : null} />
        <KpiCard label="Orders" icon={ShoppingCart} loading={loading} value={k ? fmtInt(k.orders.value) : ''} delta={k ? <Delta value={k.orders.value} prev={k.orders.prev} suffix={vs} /> : null} />
        <KpiCard label="Average order value" icon={Receipt} loading={loading} value={k ? fmtNPRCompact(k.aov.value) : ''} delta={k ? <Delta value={k.aov.value} prev={k.aov.prev} suffix={vs} /> : null} />
        <KpiCard
          label="Active products"
          icon={Package}
          loading={loading}
          value={k ? fmtInt(k.products.active) : ''}
          foot={k ? (
            <Box component={RouterLink} to="/admin/products?stock=low" sx={(th) => ({ fontSize: 13, fontWeight: 700, color: k.products.lowStock ? th.admin.warn : th.admin.good, textDecoration: 'none', [ADMIN_COARSE]: { display: 'inline-block', paddingBlock: '14px', marginBlock: '-14px' }, '&:hover': { textDecoration: 'underline' } })}>
              {k.products.lowStock ? `${k.products.lowStock} sizes low on stock` : 'Stock looks healthy'}
            </Box>
          ) : null}
        />
      </Box>

      <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 }, gridTemplateColumns: { xs: 'minmax(0,1fr)', lg: 'minmax(0,2fr) minmax(0,1fr)' } }}>
        <Panel
          title={measure === 'revenue' ? 'Revenue per day' : 'Orders per day'}
          action={(
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <ToggleButtonGroup exclusive size="small" value={measure} onChange={(_, v) => v && setMeasure(v)} aria-label="Measure">
                <ToggleButton value="revenue">Revenue</ToggleButton>
                <ToggleButton value="orders">Orders</ToggleButton>
              </ToggleButtonGroup>
              <ToggleButtonGroup exclusive size="small" value={asTable ? 'table' : 'chart'} onChange={(_, v) => v && setAsTable(v === 'table')} aria-label="View">
                <ToggleButton value="chart">Chart</ToggleButton>
                <ToggleButton value="table">Table</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}
        >
          {loading ? <Skeleton variant="rectangular" height={300} /> : noOrders && !asTable ? (
            <Box sx={{ minHeight: 300, display: 'grid', placeItems: 'center' }}>
              <EmptyState icon={ShoppingCart} title={`No orders in the last ${days} days`} body="Revenue and orders per day appear here as soon as customers start ordering." />
            </Box>
          ) : asTable ? <TrendTable data={s.series} /> : (
            <TrendChart height={300} data={s.series} measure={measure} label={measure === 'revenue' ? 'Revenue per day' : 'Orders per day'} />
          )}
        </Panel>

        <Panel title="Orders by status" action={<Typography variant="caption" sx={(th) => ({ color: th.admin.ink3 })}>{s ? `${inRange} in ${days} days` : ''}</Typography>}>
          {loading ? <Skeleton variant="rectangular" height={220} /> : (
            <>
              {inRange ? <StatusBars rows={s.statusBreakdown} onPick={(st) => navigate(`/admin/orders?status=${st}`)} /> : (
                <EmptyState icon={Inbox} title="Nothing to sort yet" body="Each order's status (placed, confirmed, shipped, delivered) is counted here." />
              )}
              <Box sx={(th) => ({ mt: 2.5, p: 1.5, borderRadius: '10px', backgroundColor: th.admin.accentWash, display: 'flex', alignItems: 'center', gap: 1.5 })}>
                <PackageCheck size={18} aria-hidden="true" />
                <Typography variant="body2" sx={{ flex: 1 }}><b>{s.openOrders}</b> open {s.openOrders === 1 ? 'order needs' : 'orders need'} action</Typography>
                <Button component={RouterLink} to="/admin/orders?status=placed" size="small" variant="text" endIcon={<ArrowRight size={15} aria-hidden="true" />}>Review</Button>
              </Box>
            </>
          )}
        </Panel>
      </Box>

      <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 }, gridTemplateColumns: { xs: 'minmax(0,1fr)', lg: 'minmax(0,2fr) minmax(0,1fr)' }, alignItems: 'start' }}>
        <Panel title="Recent orders" pad={false} action={<Button component={RouterLink} to="/admin/orders" size="small" variant="text" endIcon={<ArrowRight size={15} aria-hidden="true" />}>All orders</Button>}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" aria-label="Recent orders">
              <TableHead>
                <TableRow><TableCell>Order</TableCell><TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Customer</TableCell><TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Placed</TableCell><TableCell>Status</TableCell><TableCell align="right">Total</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {loading ? <SkeletonRows rows={6} cols={5} /> : s.recentOrders.length === 0 ? (
                  <TableRow><TableCell colSpan={5}><EmptyState icon={Inbox} title="No orders yet" body="New orders show up here the moment a customer checks out." /></TableCell></TableRow>
                ) : s.recentOrders.map((o) => (
                  <TableRow key={o.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/orders/${o.id}`)}>
                    <TableCell sx={{ fontWeight: 700 }}>
                      <Box component={RouterLink} to={`/admin/orders/${o.id}`} onClick={(e) => e.stopPropagation()} sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>{o.orderNumber}</Box>
                      <Typography variant="caption" component="div" sx={(th) => ({ display: { sm: 'none' }, color: th.admin.ink2, fontWeight: 400 })}>{o.customer?.name || o.shipping?.fullName} · {fmtDateTime(o.createdAt)}</Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{o.customer?.name || o.shipping?.fullName}<Typography variant="caption" component="div" sx={(th) => ({ color: th.admin.ink3 })}>{o.shipping?.city}</Typography></TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', display: { xs: 'none', sm: 'table-cell' } }}>{fmtDateTime(o.createdAt)}</TableCell>
                    <TableCell><StatusChip status={o.status} /></TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{formatNPR(o.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Panel>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
          <Panel title="Top products">
            {loading ? <Skeleton variant="rectangular" height={180} /> : s.topProducts.length === 0 ? (
              <EmptyState icon={Package} title="No sales in this period" />
            ) : (
              <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {s.topProducts.map((p, i) => (
                  <Box component="li" key={p.slug} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={(th) => ({ width: 16, fontWeight: 800, fontSize: 13, color: th.admin.ink3, fontVariantNumeric: 'tabular-nums' })}>{i + 1}</Typography>
                    <Thumb src={p.image} size={40} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box component={RouterLink} to={p.productId ? `/admin/products/${p.productId}` : '/admin/products'} sx={{ fontWeight: 700, fontSize: 14, color: 'inherit', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>{p.name}</Box>
                      <Typography variant="caption" component="div" sx={(th) => ({ color: th.admin.ink2 })}>{p.units} pairs sold</Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{fmtNPRCompact(p.revenue)}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Panel>
          <Panel title="Low stock" action={<Button component={RouterLink} to="/admin/products?stock=low" size="small" variant="text" endIcon={<ArrowRight size={15} aria-hidden="true" />}>Products</Button>}>
            {loading ? <Skeleton variant="rectangular" height={120} /> : s.lowStock.length === 0 ? (
              <Typography variant="body2" sx={(th) => ({ color: th.admin.ink2 })}>Every tracked size has more than 3 pairs.</Typography>
            ) : (
              <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1, [ADMIN_COARSE]: { gap: 0 } }}>
                {s.lowStock.map((r) => (
                  <Box component="li" key={`${r.productId}-${r.colourwayKey}-${r.size}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 14 }}>
                    <Box component={RouterLink} to={`/admin/products/${r.productId}`} sx={{ flex: 1, minWidth: 0, color: 'inherit', textDecoration: 'none', '&:hover': { textDecoration: 'underline' }, [ADMIN_COARSE]: { minHeight: 44, display: 'flex', alignItems: 'center', gap: 0.5 } }}>
                      {r.name} <Box component="span" sx={(th) => ({ color: th.admin.ink2 })}>· {r.colourwayName} · UK {r.size}</Box>
                    </Box>
                    <Box component="span" sx={(th) => ({ fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: r.qty === 0 ? th.admin.bad : th.admin.warn, whiteSpace: 'nowrap' })}>{r.qty === 0 ? 'Sold out' : `${r.qty} left`}</Box>
                  </Box>
                ))}
              </Box>
            )}
          </Panel>
        </Box>
      </Box>
    </Box>
  );
}
