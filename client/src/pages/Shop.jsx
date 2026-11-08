import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import { ArrowRight, ArrowUpDown, Rotate3d, SearchX } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { PageBox, useTitle } from '../components/Page.jsx';
import Reveal from '../components/Reveal.jsx';
import LineReveal from '../components/LineReveal.jsx';
import ProductCard, { ProductCardSkeleton } from '../components/shop/ProductCard.jsx';
import { Band, Eyebrow, Panel, TrustRow } from '../components/shop/kit.jsx';
import { useCategories, useProducts } from '../api/hooks.js';
import { shop, WIDE } from '../theme/tokens.js';

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'newest', label: 'Newest' },
];
const LIMIT = 12;

const grid = {
  listStyle: 'none', p: 0, m: 0, display: 'grid',
  gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', md: 'repeat(3, minmax(0,1fr))', xl: 'repeat(4, minmax(0,1fr))' },
  columnGap: { xs: 1.5, sm: 2.5, md: 3 }, rowGap: { xs: 4, md: 6 },
};

const LINES = {
  '': 'Trail boots and everyday pairs, from the Goldstar line-up.',
  'trek-collection': 'Grip, ankle support and a sole built for trails.',
  'new-arrival': 'Fresh off the line this season.',
  casual: 'Easy everyday pairs for the city.',
  women: 'Trail and street pairs in women’s sizes.',
  men: 'Trail and street pairs in men’s sizes.',
  trending: 'What people are picking up right now.',
  'in-stock': 'Ready to deliver.',
};

// Category pills: one scrollable row (a wrap would turn into a wall of boxes on phones). Edges fade to show more.
function CategoryPills({ cats, value, onChange }) {
  const ref = useRef(null);
  const [edges, setEdges] = useState({ l: false, r: false });
  const measure = () => {
    const el = ref.current;
    if (!el) return;
    setEdges({ l: el.scrollLeft > 4, r: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  };
  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [cats.length]);
  // Keep the chosen pill in view.
  useEffect(() => {
    ref.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [value]);
  const mask = `linear-gradient(90deg, ${edges.l ? 'transparent 0, #000 32px' : '#000 0'}, ${edges.r ? '#000 calc(100% - 32px), transparent 100%' : '#000 100%'})`;
  const all = [{ slug: '', name: 'All' }, ...cats];
  return (
    <Box
      ref={ref}
      role="group"
      aria-label="Category"
      onScroll={measure}
      sx={{
        display: 'flex', gap: 1, overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
        py: 0.5, maskImage: mask, WebkitMaskImage: mask, scrollPaddingInline: 16,
      }}
    >
      {all.map((c) => {
        const on = c.slug === value;
        return (
          <Box
            key={c.slug || 'all'}
            component="button"
            type="button"
            aria-pressed={on}
            onClick={() => onChange(c.slug)}
            sx={{
              flexShrink: 0, minHeight: 40, px: 2, borderRadius: `${shop.radius.pill}px`, border: `1.5px solid ${on ? shop.ink : shop.lineStrong}`,
              backgroundColor: on ? shop.ink : shop.surface, color: on ? '#FFFFFF' : shop.ink, font: 'inherit', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer',
              transition: 'background-color 200ms ease, color 200ms ease, border-color 200ms ease, transform 140ms ease',
              '&:hover': on ? null : { borderColor: shop.ink },
              '&:active': { transform: 'scale(0.96)' },
              '&:focus-visible': { outline: `3px solid ${shop.blue}`, outlineOffset: 2 },
            }}
          >
            {c.name}
          </Box>
        );
      })}
    </Box>
  );
}

function SortSelect({ value, onChange }) {
  return (
    <Select
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      inputProps={{ 'aria-label': 'Sort by' }}
      renderValue={(v) => (
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
          <Box component="span" sx={{ display: { xs: 'inline-flex', sm: 'none' } }}><ArrowUpDown size={18} strokeWidth={2.25} aria-hidden="true" /></Box>
          <Box component="span" sx={{ color: shop.ink2, fontWeight: 500, display: { xs: 'none', sm: 'inline' } }}>Sort:</Box>
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{SORTS.find((s) => s.value === v)?.label}</Box>
        </Box>
      )}
      MenuProps={{ anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, transformOrigin: { vertical: 'top', horizontal: 'right' } }}
      sx={{
        flexShrink: 0, borderRadius: `${shop.radius.pill}px`, fontSize: 14, fontWeight: 700, backgroundColor: shop.surface,
        '& .MuiSelect-select': { minHeight: '40px !important', height: 40, boxSizing: 'border-box', display: 'flex', alignItems: 'center', py: 0, pl: { xs: 1.5, sm: 2 }, pr: { xs: '28px !important', sm: '36px !important' } },
        '& .MuiSelect-icon': { right: { xs: 4, sm: 7 } },
      }}
    >
      {SORTS.map((s) => (
        <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
      ))}
    </Select>
  );
}

// A deliberate feature tile in the grid: the G10-401 in 3D.
function PromoTile({ index }) {
  const reduced = useReducedMotion();
  return (
    <Box
      component={motion.div}
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.07, ease: [0.22, 1, 0.36, 1] }}
      sx={{ height: '100%' }}
    >
      <Box
        component={RouterLink}
        to="/product/g10-401?view=3d"
        sx={{
          position: 'relative', overflow: 'hidden', height: '100%', minHeight: { xs: 280, md: 0 }, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          p: { xs: 2, md: 3.5 }, borderRadius: `${shop.radius.lg}px`, backgroundColor: shop.lilac, color: shop.lilacInk, textDecoration: 'none',
          transition: 'transform 320ms cubic-bezier(0.22,1,0.36,1), box-shadow 320ms ease',
          '@media (hover:hover)': { '&:hover': { transform: 'translateY(-4px)', boxShadow: shop.shadowLift }, '&:hover .promo-img': { transform: 'rotate(-4deg) scale(1.05)' }, '&:hover .promo-cta': { gap: 1.5 } },
          '&:focus-visible': { outline: `3px solid ${shop.blue}`, outlineOffset: 4 },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Eyebrow sx={{ color: shop.lilacInk, mb: 1, fontSize: { xs: 10, md: 12 } }}>G10-401 · In 3D</Eyebrow>
          <Typography component="p" sx={{ fontWeight: 800, ...WIDE, fontSize: { xs: 22, md: 'clamp(28px, 2.6vw, 40px)' }, lineHeight: 0.98, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            Turn it. Take it apart.
          </Typography>
        </Box>
        <Box className="promo-img" component="img" src="/img/hero/boot-desktop.webp" alt="" loading="lazy" width={1100} height={1100} sx={{ position: 'absolute', right: { xs: '-18%', md: '-10%' }, bottom: { xs: '8%', md: '4%' }, width: { xs: '105%', md: '92%' }, height: 'auto', mixBlendMode: 'multiply', transition: 'transform 600ms cubic-bezier(0.22,1,0.36,1)', pointerEvents: 'none' }} />
        <Box className="promo-cta" sx={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 1, alignSelf: 'flex-start', minHeight: 44, px: { xs: 1.75, md: 2.5 }, borderRadius: `${shop.radius.pill}px`, backgroundColor: shop.lilacInk, color: '#FFFFFF', fontWeight: 700, fontSize: { xs: 13, md: 15 }, whiteSpace: 'nowrap', transition: 'gap 220ms ease' }}>
          <Rotate3d size={18} strokeWidth={2} aria-hidden="true" />
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Open&nbsp;</Box>3D view
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}><ArrowRight size={16} strokeWidth={2.25} aria-hidden="true" /></Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'featured';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const cats = useCategories();
  const q = useProducts({ category: category || undefined, sort, page, limit: LIMIT });
  const catName = (cats.data || []).find((c) => c.slug === category)?.name;
  const title = category && catName ? catName : 'Shop all';
  useTitle(title);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in patch)) next.delete('page');
    setParams(next, { preventScrollReset: true });
  };

  const items = q.data?.items || [];
  const total = q.data?.total ?? null;
  const pages = q.data ? Math.max(1, Math.ceil(q.data.total / q.data.limit)) : 1;
  const hasG10 = items.some((p) => p.slug === 'g10-401');
  const promoAt = page === 1 && hasG10 && items.length >= 4 ? 3 : -1;
  const cells = items.map((p) => ({ kind: 'product', p }));
  if (promoAt >= 0) cells.splice(promoAt, 0, { kind: 'promo' });

  return (
    <Box sx={{ pb: { xs: 8, md: 12 } }}>
      <Band ground="tangerine" innerSx={{ py: { xs: 3, md: 6 }, minHeight: { md: 220 }, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-end' }, justifyContent: 'space-between', gap: { xs: 2, md: 4 } }}>
        <Box sx={{ position: 'relative', zIndex: 1, minWidth: 0 }}>
          <Eyebrow sx={{ mb: { xs: 1.5, md: 2 }, color: shop.tangerineInk }}>Goldstar Shoes · Made in Nepal</Eyebrow>
          <LineReveal component="h1" variant="h1" text={title} load key={title} sx={{ color: shop.tangerineInk }} />
        </Box>
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 0.5, pb: { md: 1 } }}>
          <Typography sx={{ fontSize: { xs: 15, md: 17 }, fontWeight: 600, lineHeight: 1.4, color: shop.tangerineInk }}>{LINES[category] || LINES['']}</Typography>
          <Typography aria-live="polite" sx={{ fontSize: 14, fontWeight: 800, color: 'rgba(26,11,5,0.78)', fontVariantNumeric: 'tabular-nums' }}>
            {total == null ? ' ' : `${total} ${total === 1 ? 'style' : 'styles'}`}
          </Typography>
        </Box>
      </Band>

      <Box
        sx={{
          position: 'sticky', top: 'var(--appbar-h, 64px)', zIndex: 20, backgroundColor: 'rgba(246,242,234,0.9)', backdropFilter: 'saturate(1.4) blur(14px)',
          boxShadow: `inset 0 -1px 0 ${shop.line}`, mt: { xs: 1, md: 1.5 },
        }}
      >
        <PageBox sx={{ py: 1.25, display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <CategoryPills cats={cats.data || []} value={category} onChange={(v) => update({ category: v })} />
          </Box>
          <SortSelect value={sort} onChange={(v) => update({ sort: v === 'featured' ? '' : v })} />
        </PageBox>
      </Box>

      <PageBox sx={{ pt: { xs: 3, md: 5 } }}>
        {q.isError ? <Alert severity="error" sx={{ mb: 3 }}>Could not load the shoes. Try again in a moment.</Alert> : null}

        {q.isLoading ? (
          <Box sx={grid} aria-busy="true" aria-label="Loading shoes">{Array.from({ length: 6 }, (_, i) => <ProductCardSkeleton key={i} />)}</Box>
        ) : items.length === 0 && !q.isError ? (
          <Panel sx={{ py: { xs: 6, md: 10 }, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 2 }}>
            <Box sx={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: shop.saffron, display: 'grid', placeItems: 'center', mb: 1 }}>
              <SearchX size={28} strokeWidth={2} aria-hidden="true" />
            </Box>
            <Typography component="h2" variant="h4">Nothing here yet</Typography>
            <Typography color="text.secondary" sx={{ maxWidth: '40ch' }}>No shoes match {catName ? `“${catName}”` : 'this filter'} right now. Try another category or see the whole range.</Typography>
            <Button variant="contained" onClick={() => update({ category: '' })} sx={{ mt: 1 }}>Show all shoes</Button>
          </Panel>
        ) : (
          <Box component="ul" role="list" sx={grid}>
            {cells.map((c, i) => (
              <Box component="li" key={c.kind === 'promo' ? 'promo' : c.p.id} sx={{ minWidth: 0 }}>
                {c.kind === 'promo' ? <PromoTile index={i} /> : <ProductCard p={c.p} index={i} eager={i < 4} />}
              </Box>
            ))}
          </Box>
        )}

        {pages > 1 ? (
          <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
            <Pagination count={pages} page={page} onChange={(_, v) => update({ page: v > 1 ? String(v) : '' })} />
          </Box>
        ) : null}

        {items.length > 0 ? (
          <Reveal sx={{ mt: { xs: 6, md: 10 } }}>
            <Panel sx={{ py: { xs: 2.5, md: 3 } }}>
              <TrustRow />
            </Panel>
          </Reveal>
        ) : null}
      </PageBox>
    </Box>
  );
}
