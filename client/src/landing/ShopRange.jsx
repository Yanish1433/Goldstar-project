import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import { ArrowRight } from 'lucide-react';
import ProductCard, { ProductCardSkeleton } from '../components/shop/ProductCard.jsx';
import { useProducts } from '../api/hooks.js';
import { brand } from '../theme/tokens.js';
import { Eyebrow, Pill, SectionTitle } from './ui.jsx';

// "Shop the range": the first row of the catalogue (featured first), with the store's own product cards.
const COUNT = 4;

export default function ShopRange() {
  const q = useProducts({ sort: 'featured', limit: COUNT, page: 1 });
  const items = q.data?.items || [];
  return (
    <Box component="section" aria-labelledby="range-h" sx={{ backgroundColor: brand.paper, color: brand.ink, pt: { xs: 2, md: 4 }, pb: { xs: 9, md: 14 }, borderTop: `1px solid ${brand.lineInk}` }}>
      <Box sx={{ maxWidth: 1440, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, boxSizing: 'border-box', pt: { xs: 7, md: 10 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: { xs: 4, md: 6 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Eyebrow tone={brand.navy}>The Goldstar line-up</Eyebrow>
            <SectionTitle id="range-h">Shop the range.</SectionTitle>
          </Box>
          <Pill to="/shop" variant="navy" size="sm">
            See all shoes <ArrowRight size={18} strokeWidth={2.25} aria-hidden="true" />
          </Pill>
        </Box>
        <Box component="ul" aria-busy={q.isLoading ? 'true' : 'false'} sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, columnGap: { xs: 1.5, sm: 2.5, md: 3 }, rowGap: { xs: 4, md: 6 } }}>
          {q.isLoading
            ? Array.from({ length: COUNT }, (_, i) => <li key={i}><ProductCardSkeleton /></li>)
            : items.slice(0, COUNT).map((p, i) => <li key={p.slug}><ProductCard p={p} index={i} sizes="(min-width:900px) 25vw, 50vw" /></li>)}
        </Box>
        {q.isError ? <Box component="p" role="alert" sx={{ color: brand.ink2 }}>The range could not load. <Box component={RouterLink} to="/shop" sx={{ color: brand.navy, fontWeight: 700 }}>Open the shop</Box>.</Box> : null}
      </Box>
    </Box>
  );
}
