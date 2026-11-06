import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import { statusChipSx } from '../theme/theme.js';
import { statusLabel } from '../lib/orders.js';
import { formatNPR, formatDate } from '../lib/format.js';

export const StatusChip = ({ status }) => <Chip label={statusLabel(status)} size="small" sx={statusChipSx(status)} />;

export function OrderItemsTable({ order }) {
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" aria-label="Items in this order">
        <TableHead>
          <TableRow>
            <TableCell>Shoe</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell align="right">Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {order.items.map((i, n) => (
            <TableRow key={n}>
              <TableCell>{i.name}, {i.colourwayName}, UK {i.size}</TableCell>
              <TableCell align="right">{i.qty}</TableCell>
              <TableCell align="right">{formatNPR(i.unitPrice)}</TableCell>
              <TableCell align="right">{formatNPR(i.lineTotal)}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={3} align="right" sx={{ fontWeight: 600 }}>Delivery</TableCell>
            <TableCell align="right">{order.deliveryFee ? formatNPR(order.deliveryFee) : 'Confirmed by phone'}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={3} align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>{formatNPR(order.total)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Box>
  );
}

export function ShippingBlock({ shipping }) {
  const rows = [
    ['Name', shipping.fullName],
    ['Phone', shipping.phone],
    ['Address', [shipping.addressLine, shipping.area, shipping.city].filter(Boolean).join(', ')],
    ['Landmark', shipping.landmark],
    ['Notes', shipping.notes],
  ].filter((r) => r[1]);
  return (
    <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: 1, columnGap: 3 }}>
      {rows.map(([k, v]) => (
        <Box key={k} sx={{ display: 'contents' }}>
          <Typography component="dt" variant="body2" color="text.secondary">{k}</Typography>
          <Typography component="dd" variant="body2" sx={{ m: 0 }}>{v}</Typography>
        </Box>
      ))}
    </Box>
  );
}

export function HistoryList({ history = [] }) {
  return (
    <List aria-label="Status history" sx={{ p: 0 }}>
      {[...history].reverse().map((h, i) => (
        <ListItem key={i} disableGutters sx={{ gap: 2, alignItems: 'center', py: 1 }}>
          <StatusChip status={h.status} />
          <Typography variant="body2" color="text.secondary">{formatDate(h.at)}{h.note ? ` · ${h.note}` : ''}</Typography>
        </ListItem>
      ))}
    </List>
  );
}
