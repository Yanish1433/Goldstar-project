import { Link as RouterLink, useSearchParams } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Pagination from '@mui/material/Pagination';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import { motion } from 'motion/react';
import { PageBox, useTitle } from '../components/Page.jsx';
import Reveal from '../components/Reveal.jsx';
import LineReveal from '../components/LineReveal.jsx';
import ProductPhoto from '../components/ProductPhoto.jsx';
import Price from '../components/Price.jsx';
import QuickAdd from '../components/QuickAdd.jsx';
import { useUi } from '../store/ui.js';
import { useRef } from 'react';
import { useCategories, useProducts } from '../api/hooks.js';
import { tokens } from '../theme/tokens.js';

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'newest', label: 'Newest' },
];
const LIMIT = 12;

const grid = { display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', lg: 'repeat(3, minmax(0,1fr))' }, gap: { xs: 1.5, sm: 3 } };

function ColourDots({ colourways }) {
  const label = `${colourways.length} ${colourways.length === 1 ? 'colour' : 'colours'}: ${colourways.map((c) => c.name).join(', ')}`;
  return (
    <Box role="img" aria-label={label} sx={{ display: 'flex', gap: 0.75, alignItems: 'center', height: 16 }}>
      {colourways.map((c) => (
        <Box key={c.key} sx={{ width: 12, height: 12, backgroundColor: c.hex, outline: `1px solid ${tokens.fieldBorder}` }} />
      ))}
    </Box>
  );
}

function ProductCard({ p, index, lead }) {
  const first = p.colourways[0];
  const hover = first?.secondImage || p.colourways[1]?.image;
  const sale = first && first.regularPrice > first.price;
  const photoRef = useRef(null);
  // While the add-to-cart box plays from this grid, keep every card on its main photo (the pointer is still over
  // the card after a quick add, and the hover swap would show a half-faded second photo under the box).
  const boxing = useUi((s) => !!s.cartBox);
  return (
    <Card ref={photoRef} sx={{ position: 'relative' }} component={motion.div} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -6% 0px' }} transition={{ duration: 0.6, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}>
      <CardActionArea
        component={RouterLink}
        to={`/product/${p.slug}`}
        sx={boxing ? undefined : {
          '@media (hover:hover)': {
            '&:hover .photo-alt, &.Mui-focusVisible .photo-alt': { opacity: 1 },
            '&:hover .photo > img:first-of-type, &.Mui-focusVisible .photo > img:first-of-type': { opacity: hover ? 0 : 1 },
            '&:hover .photo img, &.Mui-focusVisible .photo img': { transform: 'scale(1.03)' },
            '&:hover .card-name, &.Mui-focusVisible .card-name': { textDecoration: 'underline', textDecorationThickness: '2px', textUnderlineOffset: '6px' },
          },
        }}
      >
        <ProductPhoto image={first?.image} alt={`${p.name} in ${first?.name}`} hoverImage={hover} eager={index < 2} sizes={lead ? '(min-width:1200px) 66vw, 100vw' : undefined} sx={lead ? { aspectRatio: { xs: '1 / 1', lg: '1.8 / 1' } } : undefined} />
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: { xs: 1.5, sm: 2.5 } }}>
          <Typography variant="h3" component="h3" className="card-name" sx={{ fontSize: 20 }}>{p.name}</Typography>
          <ColourDots colourways={p.colourways} />
          <Price from={p.priceFrom} to={p.priceTo} regularPrice={!sale || p.priceFrom !== p.priceTo ? undefined : first.regularPrice} price={sale && p.priceFrom === p.priceTo ? first.price : undefined} variant="body2" sx={{ fontWeight: 600 }} />
        </CardContent>
      </CardActionArea>
      <QuickAdd product={p} photoRef={photoRef} />
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card>
      <Skeleton variant="rectangular" sx={{ aspectRatio: '1 / 1', width: '100%', height: 'auto' }} />
      <Box sx={{ p: { xs: 1.5, sm: 2.5 }, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Skeleton variant="rectangular" height={26} width="55%" />
        <Skeleton variant="rectangular" height={16} width={48} />
        <Skeleton variant="rectangular" height={20} width="40%" />
      </Box>
    </Card>
  );
}

export default function Shop() {
  useTitle('Shop all');
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'featured';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const cats = useCategories();
  const q = useProducts({ category: category || undefined, sort, page, limit: LIMIT });

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  };

  const items = q.data?.items || [];
  const pages = q.data ? Math.max(1, Math.ceil(q.data.total / q.data.limit)) : 1;

  return (
    <PageBox sx={{ py: { xs: 6, md: 10 } }}>
      <LineReveal component="h1" variant="h3" text="Shop all" load sx={{ mb: { xs: 3, md: 5 } }} />
      <Reveal delay={0.08} sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, justifyContent: 'space-between', alignItems: { md: 'flex-start' }, mb: { xs: 4, md: 6 } }}>
        <ToggleButtonGroup exclusive value={category} onChange={(_, v) => update({ category: v || '' })} aria-label="Category" sx={{ '& .MuiToggleButton-root': { minHeight: 48, px: 2 } }}>
          <ToggleButton value="">All</ToggleButton>
          {(cats.data || []).map((c) => (
            <ToggleButton key={c.slug} value={c.slug}>{c.name}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel id="sort-label">Sort by</InputLabel>
          <Select labelId="sort-label" label="Sort by" value={sort} onChange={(e) => update({ sort: e.target.value === 'featured' ? '' : e.target.value })} sx={{ '& .MuiSelect-select': { display: 'flex', alignItems: 'center', minHeight: '52px !important', boxSizing: 'border-box' } }}>
            {SORTS.map((s) => (
              <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Reveal>

      {q.isError ? <Alert severity="error" sx={{ mb: 3 }}>Could not load the shoes. Try again in a moment.</Alert> : null}

      {q.isLoading ? (
        <Box sx={grid}>{Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}</Box>
      ) : items.length === 0 ? (
        <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
          <Typography>No shoes in this category yet.</Typography>
          <Button variant="outlined" onClick={() => update({ category: '' })}>Show all</Button>
        </Box>
      ) : (
        <Box sx={grid} component="ul" role="list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((p, i) => (
            <Box component="li" key={p.id} sx={i === 0 && page === 1 && items.length >= 3 ? { gridColumn: 'span 2', display: 'flex', '& > *': { flex: 1 } } : undefined}><ProductCard p={p} index={i} lead={i === 0 && page === 1 && items.length >= 3} /></Box>
          ))}
        </Box>
      )}
      {items.length > 0 ? <Reveal sx={{ mt: 4, maxWidth: '62ch' }}><Typography color="text.secondary">Cash on delivery. Delivery fee confirmed by phone.</Typography></Reveal> : null}
      {pages > 1 ? (
        <Box sx={{ mt: 6, display: 'flex', justifyContent: 'flex-start' }}>
          <Pagination count={pages} page={page} onChange={(_, v) => update({ page: v > 1 ? String(v) : '' })} />
        </Box>
      ) : null}
    </PageBox>
  );
}
