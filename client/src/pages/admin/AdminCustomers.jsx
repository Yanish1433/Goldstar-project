import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Pagination from '@mui/material/Pagination';
import { Search, UsersRound } from 'lucide-react';
import { useAdminCustomers } from '../../api/hooks.js';
import { formatNPR, formatDate } from '../../lib/format.js';
import { Avatar, EmptyState, ErrorState, Panel, SkeletonRows, fmtShortDate, useAdminPage } from './kit.jsx';

const SORTS = [
  { v: 'spent', label: 'Top spenders' },
  { v: 'orders', label: 'Most orders' },
  { v: 'recent', label: 'Recent order' },
  { v: 'joined', label: 'Newest customers' },
  { v: 'name', label: 'Name A–Z' },
];
const LIMIT = 20;

export function Component() {
  return <AdminCustomers />;
}

export default function AdminCustomers() {
  useAdminPage('Customers');
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const qParam = params.get('q') || '';
  const sort = params.get('sort') || 'spent';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const [search, setSearch] = useState(qParam);
  const list = useAdminCustomers({ q: qParam || undefined, sort, page, limit: LIMIT });

  useEffect(() => {
    const t = setTimeout(() => {
      if (search.trim() !== qParam) update({ q: search.trim() }, true);
    }, 300);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  function update(patch, replace = false) {
    const n = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v && !(k === 'sort' && v === 'spent') ? n.set(k, String(v)) : n.delete(k)));
    if (!('page' in patch)) n.delete('page');
    setParams(n, { replace });
  }

  const data = list.data;
  const items = data?.items || [];
  const total = data?.total || 0;
  const pages = data ? Math.max(1, Math.ceil(total / data.limit)) : 1;

  return (
    <Panel pad={false} sx={{ overflow: 'hidden' }} aria-label="Customers">
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', p: { xs: 1.5, sm: 2 } }}>
        <TextField
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, email, phone or city"
          aria-label="Search customers"
          sx={{ flex: { xs: '1 1 100%', sm: '1 1 260px' }, maxWidth: { sm: 340 } }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={16} aria-hidden="true" /></InputAdornment> } }}
        />
        <Select size="small" value={sort} onChange={(e) => update({ sort: e.target.value })} inputProps={{ 'aria-label': 'Sort customers' }}>
          {SORTS.map((s) => <MenuItem key={s.v} value={s.v}>{s.label}</MenuItem>)}
        </Select>
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" sx={(th) => ({ color: th.admin.ink2 })}>{data ? `${total} ${total === 1 ? 'customer' : 'customers'}` : ''}</Typography>
      </Box>

      {list.isError && !data ? <ErrorState title="Could not load customers" error={list.error} onRetry={() => list.refetch()} /> : !list.isLoading && items.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title={qParam ? 'No customers match' : 'No customers yet'}
          body={qParam ? 'Try a different name, email, phone or city.' : 'People who create an account in the store show up here.'}
          action={qParam ? <Button variant="outlined" onClick={() => setSearch('')}>Clear search</Button> : null}
        />
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table aria-label="Customers">
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>City</TableCell>
                <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Orders</TableCell>
                <TableCell align="right">Spent</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Last order</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Joined</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.isLoading ? <SkeletonRows rows={8} cols={6} /> : items.map((c) => (
                <TableRow key={c.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/customers/${c.id}`)}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                      <Box sx={{ display: { xs: 'none', sm: 'block' } }}><Avatar name={c.name} size={36} /></Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Box component={RouterLink} to={`/admin/customers/${c.id}`} onClick={(e) => e.stopPropagation()} sx={{ fontWeight: 700, color: 'inherit', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>{c.name}</Box>
                        <Typography variant="caption" component="div" sx={(th) => ({ color: th.admin.ink2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: { xs: 190, sm: 'none' } })}>{c.email}</Typography>
                        <Typography variant="caption" component="div" sx={(th) => ({ color: th.admin.ink3, display: { md: 'none' } })}>{c.orderCount} {c.orderCount === 1 ? 'order' : 'orders'}{c.city ? ` · ${c.city}` : ''}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{c.city || <Box component="span" sx={(th) => ({ color: th.admin.ink3 })}>—</Box>}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'table-cell' } }}>{c.orderCount}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatNPR(c.totalSpent)}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, whiteSpace: 'nowrap' }}>{c.lastOrderAt ? fmtShortDate(c.lastOrderAt) : '—'}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, whiteSpace: 'nowrap' }}>{formatDate(c.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
      {pages > 1 ? (
        <Box sx={(th) => ({ display: 'flex', justifyContent: 'flex-end', px: 2, py: 1.5, borderTop: `1px solid ${th.admin.line}` })}>
          <Pagination count={pages} page={Math.min(page, pages)} onChange={(_, v) => update({ page: v > 1 ? v : '' })} aria-label="Customer pages" />
        </Box>
      ) : null}
    </Panel>
  );
}
