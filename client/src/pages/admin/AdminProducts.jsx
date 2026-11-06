import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Chip from '@mui/material/Chip';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import { useAdminProducts } from '../../api/hooks.js';
import { formatDate, formatRange } from '../../lib/format.js';
import { tokens } from '../../theme/tokens.js';
import { statusChipSx } from '../../theme/theme.js';

const LIMIT = 20;

export function Component() {
  return <AdminProducts />;
}

export default function AdminProducts() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const qParam = params.get('q') || '';
  const hideArchived = params.get('active') === 'true';
  const [search, setSearch] = useState(qParam);
  const [sortBy, setSortBy] = useState({ key: 'name', dir: 'asc' });
  const q = useAdminProducts({ q: qParam || undefined, active: hideArchived ? 'true' : 'all', page, limit: LIMIT });

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
    Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    if (!('page' in patch)) n.delete('page');
    setParams(n);
  };

  const rows = [...(q.data?.items || [])].sort((a, b) => {
    const av = sortBy.key === 'price' ? a.priceFrom : sortBy.key === 'updated' ? a.updatedAt : (a[sortBy.key] || '');
    const bv = sortBy.key === 'price' ? b.priceFrom : sortBy.key === 'updated' ? b.updatedAt : (b[sortBy.key] || '');
    return (av > bv ? 1 : av < bv ? -1 : 0) * (sortBy.dir === 'asc' ? 1 : -1);
  });
  const sort = (key) => setSortBy((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));
  const SortHead = ({ k, children, align }) => (
    <TableCell align={align} sortDirection={sortBy.key === k ? sortBy.dir : false}>
      <TableSortLabel active={sortBy.key === k} direction={sortBy.key === k ? sortBy.dir : 'asc'} onClick={() => sort(k)}>{children}</TableSortLabel>
    </TableCell>
  );
  const pages = q.data ? Math.max(1, Math.ceil(q.data.total / q.data.limit)) : 1;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="h3" component="h1">Products</Typography>
        <Button component={RouterLink} to="/admin/products/new" variant="contained">New product</Button>
      </Box>
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField label="Search products" size="small" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 280 }} />
        <FormControlLabel control={<Switch checked={hideArchived} onChange={(e) => update({ active: e.target.checked ? 'true' : '' })} />} label="Hide archived" />
      </Box>
      {q.isError ? <Alert severity="error">Could not load products.</Alert> : null}
      {!q.isLoading && rows.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
          <Typography color="text.secondary">No products match.</Typography>
          <Button component={RouterLink} to="/admin/products/new" variant="outlined">New product</Button>
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: 'calc(100vh - 320px)', minHeight: 200 }}>
          <Table stickyHeader aria-label="Products" sx={{ '& .MuiTableCell-stickyHeader': { backgroundColor: 'background.default' } }}>
            <TableHead>
              <TableRow>
                <TableCell>Photo</TableCell>
                <SortHead k="name">Name</SortHead>
                <SortHead k="series">Series</SortHead>
                <TableCell>Colourways</TableCell>
                <SortHead k="price" align="right">Price</SortHead>
                <TableCell>Featured</TableCell>
                <TableCell>Active</TableCell>
                <SortHead k="updated">Updated</SortHead>
              </TableRow>
            </TableHead>
            <TableBody>
              {q.isLoading ? Array.from({ length: 5 }, (_, r) => (
                <TableRow key={r}>{Array.from({ length: 8 }, (_, c) => <TableCell key={c}><Skeleton variant="rectangular" height={20} width={c === 1 ? 100 : 60} /></TableCell>)}</TableRow>
              )) : rows.map((p) => (
                <TableRow key={p.id} hover tabIndex={0} sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/products/${p.id}`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`/admin/products/${p.id}`)} aria-label={`Edit ${p.name}`}>
                  <TableCell>
                    <Box sx={{ width: 40, height: 40, backgroundColor: tokens.tile, overflow: 'hidden' }}>
                      {p.colourways?.[0]?.images?.[0] ? <img src={p.colourways[0].images[0].thumb} alt="" width={40} height={40} loading="lazy" referrerPolicy="no-referrer" style={{ width: 40, height: 40, objectFit: 'contain', mixBlendMode: 'multiply' }} /> : null}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                  <TableCell>{p.series || ''}</TableCell>
                  <TableCell>{p.colourways?.map((c) => c.name).join(', ')}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatRange(p.priceFrom, p.priceTo)}</TableCell>
                  <TableCell>{p.featured ? 'Yes' : ''}</TableCell>
                  <TableCell>{p.active ? <Chip size="small" label="Active" sx={statusChipSx('delivered')} /> : <Chip size="small" label="Archived" />}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(p.updatedAt)}</TableCell>
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
