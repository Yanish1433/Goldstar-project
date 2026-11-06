import { Link as RouterLink, useParams } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import { PageBox, useTitle } from '../components/Page.jsx';
import { OrderItemsTable, StatusChip } from '../components/OrderParts.jsx';
import NotFound from './NotFound.jsx';
import { useOrder } from '../api/hooks.js';

export default function OrderConfirmation() {
  const { id } = useParams();
  const { data: order, isLoading, error } = useOrder(id);
  useTitle('Order placed');
  if (isLoading) return <PageBox sx={{ py: 10 }}><Skeleton variant="rectangular" height={320} /></PageBox>;
  if (error || !order) return <NotFound />;
  return (
    <PageBox sx={{ py: { xs: 6, md: 12 } }}>
      <Box sx={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
        <Typography variant="h3" component="h1">Order placed</Typography>
        <Typography variant="price" component="p" aria-label={`Order number ${order.orderNumber}`}>{order.orderNumber}</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography>Cash on delivery</Typography>
          <StatusChip status={order.status} />
        </Box>
        <Paper sx={{ p: { xs: 2, md: 3 }, width: '100%', boxSizing: 'border-box' }}>
          <OrderItemsTable order={order} />
        </Paper>
        <Typography color="text.secondary">This is a demo: no order will be delivered.</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button component={RouterLink} to="/account" variant="contained">View my orders</Button>
          <Button component={RouterLink} to="/shop" variant="outlined">Keep shopping</Button>
        </Box>
      </Box>
    </PageBox>
  );
}
