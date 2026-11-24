import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import { Plus, Search, LayoutGrid, List, ChevronDown, ChevronRight, PackageSearch, Star } from 'lucide-react';
import { useAdminProducts } from '../../api/hooks.js';
import { LOW_STOCK } from '../../lib/adminStats.js';
import { formatNPR, formatRange } from '../../lib/format.js';
import { visuallyHidden } from '../../components/Page.jsx';
import { EmptyState, ErrorState, Panel, SkeletonRows, Thumb, fmtShortDate, useAdminPage } from './kit.jsx';

// Stock summary for a product: total pairs and how many sizes are low / sold out (null stock = not tracked).
export function stockOf(p) {
  let total = 0;
  let low = 0;
  let out = 0;
  let tracked = false;
  p.colourways.forEach((c) => c.sizes.forEach((s) => {
    if (!c.stock && c.inStock !== false) return;
    tracked = true;
    const q = c.inStock === false ? 0 : Number(c.stock?.[s] ?? 0);
    total += q;
    if (q === 0) out += 1;
    else if (q <= LOW_STOCK) low += 1;
  }));
  return { tracked, total, low, out };
}
const onSale = (p) => p.colourways.some((c) => c.regularPrice > c.price);

export function Swatches({ colourways, size = 16 }) {
  return (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
      {colourways.map((c) => (
        <Tooltip key={c.key} title={`${c.name}${c.inStock === false ? ' (out of stock)' : ''}`}>
          <Box
            role="img"
            aria-label={c.name}
            sx={(th) => ({ width: size, height: size, borderRadius: '50%', backgroundColor: c.hex, boxShadow: `inset 0 0 0 1px ${th.admin.lineStrong}`, opacity: c.inStock === false ? 0.35 : 1 })}
          />
        </Tooltip>
      ))}
    </Box>
  );
}

function StatusBadge({ p }) {
  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
      <Box component="span" sx={(th) => ({ fontSize: 12.5, fontWeight: 700, px: 1.25, lineHeight: '24px', borderRadius: 999, backgroundColor: p.active ? (th.palette.mode === 'dark' ? 'rgba(111,211,162,0.14)' : '#DDF1E8') : th.admin.sunk, color: p.active ? th.admin.good : th.admin.ink2 })}>
        {p.active ? 'Active' : 'Archived'}
      </Box>
      {p.featured ? (
        <Box component="span" sx={(th) => ({ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 12.5, fontWeight: 700, px: 1, lineHeight: '24px', borderRadius: 999, backgroundColor: th.admin.accentWash, color: th.admin.accentText })}>
          <Star size={12} aria-hidden="true" />Featured
        </Box>
      ) : null}
    </Box>
  );
}

function PriceCell({ p }) {
  const sale = onSale(p);
  const maxRegular = Math.max(...p.colourways.map((c) => c.regularPrice || c.price));
  return (
    <Box sx={{ whiteSpace: 'nowrap' }}>
      <Box sx={{ fontWeight: 700 }}>{formatRange(p.priceFrom, p.priceTo)}</Box>
      {sale ? (
        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', justifyContent: 'flex-end' }}>
          <Typography variant="caption" sx={(th) => ({ color: th.admin.ink3, textDecoration: 'line-through' })}>{formatNPR(maxRegular)}</Typography>
          <Box component="span" sx={(th) => ({ fontSize: { xs: 12, md: 11 }, fontWeight: 800, px: 0.75, borderRadius: 999, lineHeight: '18px', color: th.palette.mode === 'dark' ? '#FF9CB9' : '#C2124F', backgroundColor: th.palette.mode === 'dark' ? 'rgba(255,156,185,0.14)' : '#FCE4EC' })}>Sale</Box>
        </Box>
      ) : null}
    </Box>
  );
}

function StockCell({ p }) {
  const s = stockOf(p);
  if (!s.tracked) return <Typography variant="body2" sx={(th) => ({ color: th.admin.ink3 })}>Not tracked</Typography>;
  return (
    <Box>
      <Box sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{s.total} pairs</Box>
      <Typography variant="caption" sx={(th) => ({ color: s.out ? th.admin.bad : s.low ? th.admin.warn : th.admin.good, fontWeight: 600 })}>
        {s.out || s.low ? [s.out ? `${s.out} sold out` : '', s.low ? `${s.low} low` : ''].filter(Boolean).join(' · ') : 'All sizes healthy'}
      </Typography>
    </Box>
  );
}

/** Colourway × size matrix of pairs on hand. */
export function StockMatrix({ p }) {
  const sizes = [...new Set(p.colourways.flatMap((c) => c.sizes))].sort((a, b) => parseFloat(a) - parseFloat(b));
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box component="table" sx={(th) => ({ borderCollapse: 'separate', borderSpacing: 4, fontSize: 13, fontVariantNumeric: 'tabular-nums', '& th': { fontWeight: 700, color: th.admin.ink2, textAlign: 'left', pr: 1, whiteSpace: 'nowrap' } })}>
        <caption style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Pairs on hand for {p.name} by colour and UK size</caption>
        <thead>
          <tr><th scope="col">Colour</th>{sizes.map((s) => <Box component="th" key={s} scope="col" sx={{ textAlign: 'center !important', minWidth: 40 }}>UK {s}</Box>)}</tr>
        </thead>
        <tbody>
          {p.colourways.map((c) => (
            <tr key={c.key}>
              <th scope="row"><Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: c.hex }} />{c.name}</Box></th>
              {sizes.map((s) => {
                const has = c.sizes.includes(s);
                const q = !has ? null : c.inStock === false ? 0 : c.stock ? Number(c.stock[s] ?? 0) : null;
                return (
                  <Box
                    component="td"
                    key={s}
                    sx={(th) => ({
                      textAlign: 'center', borderRadius: '6px', py: 0.5, fontWeight: 700,
                      backgroundColor: !has ? 'transparent' : q === 0 ? (th.palette.mode === 'dark' ? 'rgba(255,156,148,0.14)' : '#FBE4E2') : q != null && q <= LOW_STOCK ? th.admin.warnWash : th.admin.sunk,
                      color: !has ? th.admin.ink3 : q === 0 ? th.admin.bad : q != null && q <= LOW_STOCK ? th.admin.warn : th.admin.ink,
                    })}
                  >
                    {!has ? '—' : q == null ? '·' : q}
                  </Box>
                );
              })}
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  );
}

const SORTS = {
  name: (a, b) => a.name.localeCompare(b.name),
  price: (a, b) => a.priceFrom - b.priceFrom,
  stock: (a, b) => stockOf(a).total - stockOf(b).total,
  updated: (a, b) => String(a.updatedAt).localeCompare(String(b.updatedAt)),
};

export function Component() {
  return <AdminProducts />;
}

export default function AdminProducts() {
  useAdminPage('Products');
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const qParam = params.get('q') || '';
  const status = params.get('status') || 'all';
  const stock = params.get('stock') || 'all';
  const view = params.get('view') === 'grid' ? 'grid' : 'table';
  const [search, setSearch] = useState(qParam);
  const [sortBy, setSortBy] = useState({ key: 'name', dir: 'asc' });
  const [open, setOpen] = useState(() => new Set());
  // The catalogue is small: load it whole and filter / sort here.
  const q = useAdminProducts({ q: qParam || undefined, active: status === 'all' ? 'all' : status === 'active' ? 'true' : 'false', page: 1, limit: 100 });

  useEffect(() => {
    const t = setTimeout(() => {
      if (search.trim() !== qParam) update({ q: search.trim() }, true);
    }, 300);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  function update(patch, replace = false) {
    const n = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v && v !== 'all' && v !== 'table' ? n.set(k, v) : n.delete(k)));
    setParams(n, { replace });
  }

  const all = q.data?.items || [];
  const rows = useMemo(() => {
    let list = all;
    if (stock === 'low') list = list.filter((p) => { const s = stockOf(p); return s.low + s.out > 0; });
    const cmp = SORTS[sortBy.key];
    return [...list].sort((a, b) => cmp(a, b) * (sortBy.dir === 'asc' ? 1 : -1));
  }, [all, stock, sortBy]);
  const sort = (key) => setSortBy((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));
  const head = (k, label, align) => (
    <TableCell align={align} sortDirection={sortBy.key === k ? sortBy.dir : false} sx={k === 'updated' ? { display: { xs: 'none', lg: 'table-cell' } } : k === 'stock' ? { display: { xs: 'none', sm: 'table-cell' } } : undefined}>
      <TableSortLabel active={sortBy.key === k} direction={sortBy.key === k ? sortBy.dir : 'asc'} onClick={() => sort(k)}>{label}</TableSortLabel>
    </TableCell>
  );
  const toggle = (id) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const lowCount = all.filter((p) => { const s = stockOf(p); return s.low + s.out > 0; }).length;
  const filtered = qParam || status !== 'all' || stock !== 'all';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or series"
          aria-label="Search products"
          sx={{ flex: { xs: '1 1 100%', sm: '1 1 240px' }, maxWidth: { sm: 320 } }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={16} aria-hidden="true" /></InputAdornment> } }}
        />
        <Select size="small" value={status} onChange={(e) => update({ status: e.target.value })} inputProps={{ 'aria-label': 'Status' }}>
          <MenuItem value="all">All statuses</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="archived">Archived</MenuItem>
        </Select>
        <Select size="small" value={stock} onChange={(e) => update({ stock: e.target.value })} inputProps={{ 'aria-label': 'Stock' }}>
          <MenuItem value="all">Any stock</MenuItem>
          <MenuItem value="low">Low or sold out{q.data ? ` (${lowCount})` : ''}</MenuItem>
        </Select>
        <Box sx={{ flex: 1 }} />
        <ToggleButtonGroup exclusive size="small" value={view} onChange={(_, v) => v && update({ view: v })} aria-label="Layout">
          <ToggleButton value="table" aria-label="Table view"><List size={16} aria-hidden="true" /></ToggleButton>
          <ToggleButton value="grid" aria-label="Grid view"><LayoutGrid size={16} aria-hidden="true" /></ToggleButton>
        </ToggleButtonGroup>
        <Button component={RouterLink} to="/admin/products/new" variant="contained" startIcon={<Plus size={16} aria-hidden="true" />}>Add product</Button>
      </Box>

      {q.isError && !q.data ? <Panel><ErrorState title="Could not load products" error={q.error} onRetry={() => q.refetch()} /></Panel> : !q.isLoading && rows.length === 0 ? (
        <Panel>
          <EmptyState
            icon={PackageSearch}
            title={filtered ? 'No products match' : 'No products yet'}
            body={filtered ? 'Try a different search or clear the filters.' : 'Add your first product to start selling.'}
            action={filtered ? <Button variant="outlined" onClick={() => { setSearch(''); setParams({}); }}>Clear filters</Button> : <Button component={RouterLink} to="/admin/products/new" variant="contained">Add product</Button>}
          />
        </Panel>
      ) : view === 'grid' ? (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', md: 'repeat(3, minmax(0,1fr))', xl: 'repeat(4, minmax(0,1fr))' } }}>
          {q.isLoading ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} variant="rectangular" height={300} sx={{ borderRadius: '12px' }} />) : rows.map((p) => {
            const s = stockOf(p);
            return (
              <Panel key={p.id} component="article" aria-label={p.name} pad={false} sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Box component={RouterLink} to={`/admin/products/${p.id}`} sx={{ display: 'block', color: 'inherit', textDecoration: 'none', '&:hover img': { transform: 'scale(1.03)' } }}>
                  <Box sx={{ aspectRatio: '1', backgroundColor: '#EDE7DC', display: 'grid', placeItems: 'center', overflow: 'hidden', position: 'relative' }}>
                    {p.colourways[0]?.images?.[0] ? <img src={p.colourways[0].images[0].thumb} alt="" loading="lazy" style={{ width: '88%', height: '88%', objectFit: 'contain', mixBlendMode: 'multiply', transition: 'transform 240ms ease' }} /> : null}
                    <Box sx={{ position: 'absolute', top: 8, left: 8 }}><StatusBadge p={p} /></Box>
                  </Box>
                  <Box sx={{ p: 1.75, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Typography sx={{ fontWeight: 700 }}>{p.name}</Typography>
                    <Swatches colourways={p.colourways} size={14} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatNPR(p.priceFrom)}</Typography>
                      <Typography variant="caption" sx={(th) => ({ color: s.out ? th.admin.bad : s.low ? th.admin.warn : th.admin.ink2, fontWeight: 600 })}>{s.tracked ? `${s.total} pairs` : ''}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Panel>
            );
          })}
        </Box>
      ) : (
        <Panel pad={false} sx={{ overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table aria-label="Products">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 40, p: 0 }}><Box component="span" sx={visuallyHidden}>Expand</Box></TableCell>
                  {head('name', 'Product')}
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Colours</TableCell>
                  {head('price', 'Price', 'right')}
                  {head('stock', 'Stock')}
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Status</TableCell>
                  {head('updated', 'Updated')}
                </TableRow>
              </TableHead>
              <TableBody>
                {q.isLoading ? <SkeletonRows rows={5} cols={7} /> : rows.map((p) => (
                  <Fragment key={p.id}>
                    <TableRow hover sx={{ cursor: 'pointer', '& > td': open.has(p.id) ? { borderBottom: 0 } : undefined }} onClick={() => navigate(`/admin/products/${p.id}`)}>
                      <TableCell sx={{ p: 0, pl: 1 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); toggle(p.id); }}
                          aria-label={`${open.has(p.id) ? 'Hide' : 'Show'} stock by size for ${p.name}`}
                          aria-expanded={open.has(p.id)}
                          sx={{ width: 32, height: 32 }}
                        >
                          {open.has(p.id) ? <ChevronDown size={17} aria-hidden="true" /> : <ChevronRight size={17} aria-hidden="true" />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Thumb src={p.colourways[0]?.images?.[0]?.thumb} size={48} />
                          <Box sx={{ minWidth: 0 }}>
                            <Box component={RouterLink} to={`/admin/products/${p.id}`} onClick={(e) => e.stopPropagation()} sx={{ fontWeight: 700, color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: { xs: 44, md: 0 }, minWidth: { xs: 44, md: 0 }, '&:hover': { textDecoration: 'underline' } }}>{p.name}</Box>
                            <Typography variant="caption" component="div" sx={(th) => ({ color: th.admin.ink2 })}>{p.series ? `${p.series} series · ` : ''}{p.colourways.length} {p.colourways.length === 1 ? 'colour' : 'colours'}</Typography>
                            <Box sx={{ display: { md: 'none' }, mt: 0.5 }}><Swatches colourways={p.colourways} size={12} /></Box>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Swatches colourways={p.colourways} /></TableCell>
                      <TableCell align="right"><PriceCell p={p} /></TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}><StockCell p={p} /></TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><StatusBadge p={p} /></TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, whiteSpace: 'nowrap' }}>{fmtShortDate(p.updatedAt)}</TableCell>
                    </TableRow>
                    {open.has(p.id) ? (
                      <TableRow>
                        <TableCell colSpan={7} sx={(th) => ({ backgroundColor: th.admin.canvas, py: 2 })}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                            <StockMatrix p={p} />
                            <Button component={RouterLink} to={`/admin/products/${p.id}#variants`} size="small" variant="outlined">Edit stock</Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </Box>
          {q.data ? (
            <Box sx={(th) => ({ px: 2, py: 1.5, borderTop: `1px solid ${th.admin.line}` })}>
              <Typography variant="body2" sx={(th) => ({ color: th.admin.ink2 })}>{rows.length} of {q.data.total} products</Typography>
            </Box>
          ) : null}
        </Panel>
      )}
    </Box>
  );
}
