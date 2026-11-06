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

export default function Account() {
  useTitle('Your account');
  const me = useMe();
  const orders = useMyOrders({ limit: 50 });
  const logout = useLogout();
  const navigate = useNavigate();
  const user = me.data;
  const items = orders.data?.items || [];

  return (
    <PageBox sx={{ py: { xs: 6, md: 12 }, display: 'flex', flexDirection: 'column', gap: { xs: 6, md: 10 } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
        <Typography variant="h3" component="h1">Your account</Typography>
        {user ? (
          <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: 1, columnGap: 3 }}>
            <Typography component="dt" color="text.secondary">Name</Typography><Typography component="dd" sx={{ m: 0 }}>{user.name}</Typography>
            <Typography component="dt" color="text.secondary">Email</Typography><Typography component="dd" sx={{ m: 0, overflowWrap: 'anywhere' }}>{user.email}</Typography>
            <Typography component="dt" color="text.secondary">Phone</Typography><Typography component="dd" sx={{ m: 0 }}>{user.phone || 'Not added'}</Typography>
          </Box>
        ) : <Skeleton variant="rectangular" width={280} height={96} />}
        <Button variant="outlined" onClick={async () => { navigate('/'); await logout.mutateAsync(); }} aria-disabled={logout.isPending}>Log out</Button>
      </Box>

      <Box>
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
      </Box>
    </PageBox>
  );
}
