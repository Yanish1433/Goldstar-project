import { Link as RouterLink, useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Skeleton from '@mui/material/Skeleton';
import { PageBox, useTitle } from '../components/Page.jsx';
import { StatusChip } from '../components/OrderParts.jsx';
import { useLogout, useMe, useMyOrders } from '../api/hooks.js';
import { formatDate, formatNPR } from '../lib/format.js';
import { Panel } from '../components/shop/kit.jsx';
import { shop } from '../theme/tokens.js';

export default function Account() {
  useTitle('Your account');
  const me = useMe();
  const orders = useMyOrders({ limit: 50 });
  const logout = useLogout();
  const navigate = useNavigate();
  const user = me.data;
  const items = orders.data?.items || [];

  return (
    <PageBox sx={{ pt: { xs: 4, md: 6 }, pb: { xs: 8, md: 12 }, display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(0,4fr) minmax(0,8fr)' }, gap: { xs: 2.5, md: 4 }, alignItems: 'start' }}>
      <Typography variant="h1" component="h1" sx={{ gridColumn: '1 / -1', fontSize: { xs: 40, md: 64 }, mb: { md: 1 } }}>Your account</Typography>
      <Panel sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box aria-hidden="true" sx={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: shop.lilac, color: shop.lilacInk, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 22 }}>{(user.name || '?').trim().charAt(0).toUpperCase()}</Box>
            <Typography sx={{ fontWeight: 800, fontSize: 20 }}>{user.name}</Typography>
          </Box>
        ) : null}
        {user ? (
          <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: 1, columnGap: 3 }}>
            <Typography component="dt" color="text.secondary">Name</Typography><Typography component="dd" sx={{ m: 0 }}>{user.name}</Typography>
            <Typography component="dt" color="text.secondary">Email</Typography><Typography component="dd" sx={{ m: 0, overflowWrap: 'anywhere' }}>{user.email}</Typography>
            <Typography component="dt" color="text.secondary">Phone</Typography><Typography component="dd" sx={{ m: 0 }}>{user.phone || 'Not added'}</Typography>
          </Box>
        ) : <Skeleton variant="rectangular" width={280} height={96} />}
        <Button variant="outlined" onClick={async () => { navigate('/'); await logout.mutateAsync(); }} aria-disabled={logout.isPending}>Log out</Button>
      </Panel>

      <Panel>
        <Typography variant="h4" component="h2" sx={{ mb: 3 }}>Your orders</Typography>
        {orders.isLoading ? <Skeleton variant="rectangular" height={160} /> : items.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
            <Typography color="text.secondary">No orders yet.</Typography>
            <Button component={RouterLink} to="/shop" variant="contained">Shop all</Button>
          </Box>
        ) : (
          <>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Table aria-label="Your orders">
                <TableHead>
                  <TableRow>
                    <TableCell>Order number</TableCell><TableCell>Date</TableCell><TableCell align="right">Items</TableCell><TableCell align="right">Total</TableCell><TableCell>Status</TableCell><TableCell><span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Details</span></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((o) => (
                    <TableRow key={o.id} hover>
                      <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>{o.orderNumber}</TableCell>
                      <TableCell>{formatDate(o.createdAt)}</TableCell>
                      <TableCell align="right">{o.itemCount}</TableCell>
                      <TableCell align="right">{formatNPR(o.total)}</TableCell>
                      <TableCell><StatusChip status={o.status} /></TableCell>
                      <TableCell><Link component={RouterLink} to={`/account/orders/${o.id}`} aria-label={`View order ${o.orderNumber}`}>View</Link></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <List sx={{ display: { xs: 'block', md: 'none' }, p: 0 }} aria-label="Your orders">
              {items.map((o) => (
                <ListItem key={o.id} disableGutters sx={{ display: 'block', py: 2 }}>
                  <Link component={RouterLink} to={`/account/orders/${o.id}`} sx={{ display: 'block', textDecoration: 'none', color: 'text.primary' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{o.orderNumber}</Typography>
                      <StatusChip status={o.status} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">{formatDate(o.createdAt)} &middot; {o.itemCount} {o.itemCount === 1 ? 'item' : 'items'} &middot; {formatNPR(o.total)}</Typography>
                  </Link>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Panel>
    </PageBox>
  );
}
