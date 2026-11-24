import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import { ArrowRight, ArrowUpDown, Rotate3d, SearchX, Sparkle } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { PageBox, useTitle } from '../components/Page.jsx';
import Reveal from '../components/Reveal.jsx';
import ProductCard, { ProductCardSkeleton } from '../components/shop/ProductCard.jsx';
import { Eyebrow, Panel, TrustRow } from '../components/shop/kit.jsx';
import { useCategories, useProducts } from '../api/hooks.js';
import { store, DISPLAY, ring } from '../theme/storeTokens.js';
import { SHORT } from '../landing-v2/tokensV2.js';

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
  // Landscape phones: three or four across (two would make one card taller than the screen).
  [SHORT]: { gridTemplateColumns: 'repeat(3, minmax(0,1fr))', columnGap: 2, rowGap: 3 },
  [`${SHORT} and (min-width:800px)`]: { gridTemplateColumns: 'repeat(4, minmax(0,1fr))' },
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

// Friendly chip / title labels for the slugs the catalogue has. Slugs not listed fall back to the API's name.
const LABELS = { 'new-arrival': 'New arrivals', 'trek-collection': 'Trek', casual: 'Casual', women: 'Women', men: 'Men', trending: 'Trending', 'in-stock': 'In stock' };
const ORDER = ['new-arrival', 'men', 'women', 'trek-collection', 'casual', 'trending', 'in-stock'];
const rank = (slug) => (ORDER.includes(slug) ? ORDER.indexOf(slug) : ORDER.length);

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
  const all = [{ slug: '', name: 'All' }, ...[...cats].sort((a, b) => rank(a.slug) - rank(b.slug)).map((c) => ({ ...c, name: LABELS[c.slug] || c.name }))];
  return (
    <Box
      ref={ref}
      role="group"
      aria-label="Category"
      onScroll={measure}
      sx={{
        display: 'flex', gap: 1, overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
        py: 0.5, maskImage: mask, WebkitMaskImage: mask, scrollPaddingInline: 16,
        scrollSnapType: 'x proximity', overscrollBehaviorX: 'contain', '& > button': { scrollSnapAlign: 'start' },
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
              flexShrink: 0, minHeight: 44, px: 2.25, borderRadius: `${store.radius.pill}px`, border: `1.5px solid ${on ? store.blue : store.lineStrong}`,
              backgroundColor: on ? store.blue : store.ground, color: on ? '#FFFFFF' : store.navy, font: 'inherit', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer',
              transition: 'background-color 200ms ease, color 200ms ease, border-color 200ms ease, transform 140ms ease',
              '&:hover': on ? null : { borderColor: store.blue, backgroundColor: store.cream },
              '&:active': { transform: 'scale(0.96)' },
              '&:focus-visible': ring(),
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
          <Box component="span" sx={{ color: store.ink2, fontWeight: 500, display: { xs: 'none', sm: 'inline' } }}>Sort:</Box>
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{SORTS.find((s) => s.value === v)?.label}</Box>
        </Box>
      )}
      MenuProps={{ anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, transformOrigin: { vertical: 'top', horizontal: 'right' } }}
      sx={{
        flexShrink: 0, borderRadius: `${store.radius.pill}px`, fontSize: 14, fontWeight: 700, backgroundColor: store.ground, color: store.navy,
        '& .MuiOutlinedInput-notchedOutline': { borderColor: store.lineStrong },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: store.blue },
        '& .MuiSelect-select': { minHeight: '44px !important', height: 44, boxSizing: 'border-box', display: 'flex', alignItems: 'center', py: 0, pl: { xs: 1.5, sm: 2 }, pr: { xs: '28px !important', sm: '36px !important' } },
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
          p: { xs: 2, md: 3.5 }, borderRadius: `${store.radius.lg}px`, backgroundColor: store.blue, color: '#FFFFFF', textDecoration: 'none',
          transition: 'transform 320ms cubic-bezier(0.22,1,0.36,1), box-shadow 320ms ease',
          '@media (hover:hover)': { '&:hover': { transform: 'translateY(-4px)', boxShadow: store.shadowLift }, '&:hover .promo-img': { transform: 'rotate(-4deg) scale(1.05)' }, '&:hover .promo-cta': { gap: 1.5 } },
          '&:focus-visible': ring(),
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Eyebrow sx={{ color: store.sand, mb: 1, fontSize: 12 }}>G10-401 · In 3D</Eyebrow>
          <Typography component="p" sx={{ ...DISPLAY, fontSize: { xs: 22, md: 'clamp(28px, 2.6vw, 40px)' }, color: '#FFFFFF' }}>
            Turn it. Take it apart.
          </Typography>
        </Box>
        <Box aria-hidden="true" sx={{ position: 'absolute', right: { xs: '-22%', md: '-14%' }, bottom: { xs: '10%', md: '6%' }, width: { xs: '100%', md: '88%' }, aspectRatio: '1 / 1', borderRadius: '50%', backgroundColor: store.cream, overflow: 'hidden', pointerEvents: 'none' }}>
          <Box className="promo-img" component="img" src="/img/hero/boot-desktop.webp" alt="" loading="lazy" width={1100} height={1100} sx={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply', transition: 'transform 600ms cubic-bezier(0.22,1,0.36,1)' }} />
        </Box>
        <Box className="promo-cta" sx={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 1, alignSelf: 'flex-start', minHeight: 44, px: { xs: 1.75, md: 2.5 }, borderRadius: `${store.radius.pill}px`, backgroundColor: store.sand, color: store.navy, fontWeight: 800, fontSize: { xs: 13, md: 15 }, whiteSpace: 'nowrap', transition: 'gap 220ms ease' }}>
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
  const reduced = useReducedMotion();
  // The URL is user input (a typed or old link): anything the API would reject with a 400 falls back to the default.
  const rawCategory = (params.get('category') || '').trim().toLowerCase();
  const category = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rawCategory) && rawCategory.length <= 60 ? rawCategory : '';
  const sort = SORTS.some((s) => s.value === params.get('sort')) ? params.get('sort') : 'featured';
  const page = Math.min(1000, Math.max(1, Math.floor(Number(params.get('page'))) || 1));
  const cats = useCategories();
  const q = useProducts({ category: category || undefined, sort, page, limit: LIMIT });
  const catName = (cats.data || []).find((c) => c.slug === category)?.name;
  const label = category ? LABELS[category] || catName : '';
  const title = category && label ? label : 'Shop all';
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
  // A stale ?page= beyond the last page (the catalogue shrank, or a typed link): go to the last page rather than show an empty shop.
  useEffect(() => {
    if (q.data && !q.isPlaceholderData && page > 1 && q.data.items.length === 0 && q.data.total > 0) update({ page: pages > 1 ? String(pages) : '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data, q.isPlaceholderData, page, pages]);
  const hasG10 = items.some((p) => p.slug === 'g10-401');
  const promoAt = page === 1 && hasG10 && items.length >= 4 ? 3 : -1;
  const cells = items.map((p) => ({ kind: 'product', p }));
  if (promoAt >= 0) cells.splice(promoAt, 0, { kind: 'promo' });

  return (
    <Box sx={{ pb: { xs: 8, md: 12 }, backgroundColor: store.ground, color: store.navy, minHeight: '70vh' }}>
      <Box component="section" sx={{ px: { xs: 1, sm: 1.5 }, pt: { xs: 1, sm: 1.5 } }}>
        <Box
          className="shop-banner"
          sx={{
            position: 'relative', overflow: 'hidden', backgroundColor: store.blue, color: store.onBlue, borderRadius: { xs: `${store.radius.lg}px`, md: `${store.radius.xl}px` },
            '&::after': { content: '""', position: 'absolute', right: { xs: -70, md: -40 }, top: { xs: -80, md: -90 }, width: { xs: 220, md: 340 }, height: { xs: 220, md: 340 }, borderRadius: '50%', backgroundColor: store.blueDeep, opacity: 0.55, pointerEvents: 'none' },
          }}
        >
          <PageBox sx={{ position: 'relative', zIndex: 1, py: { xs: 2.5, md: 4.5 }, minHeight: { md: 170 }, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-end' }, justifyContent: 'space-between', gap: { xs: 1, md: 4 }, [SHORT]: { py: 1.5, minHeight: 0, flexDirection: 'row', alignItems: 'flex-end', gap: 3 } }}>
            <Box sx={{ minWidth: 0 }}>
              <Eyebrow sx={{ mb: { xs: 0.5, md: 1.25 }, color: store.sand, display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                <Sparkle size={14} fill="currentColor" strokeWidth={0} aria-hidden="true" /> Goldstar Shoes · Made in Nepal
              </Eyebrow>
              <Box
                component={motion.h1}
                key={title}
                initial={reduced ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                sx={{ m: 0, ...DISPLAY, fontSize: { xs: 'clamp(30px, 10vw, 40px)', md: 'clamp(52px, 6vw, 84px)' }, [SHORT]: { fontSize: 'clamp(28px, 9svh, 40px)' }, color: '#FFFFFF' }}
              >
                {title}
              </Box>
            </Box>
            <Box sx={{ maxWidth: 360, pb: { md: 0.5 } }}>
              <Typography sx={{ fontSize: { xs: 15, md: 17 }, fontWeight: 600, lineHeight: 1.4, color: store.onBlue }}>{LINES[category] || LINES['']}</Typography>
              <Typography aria-live="polite" sx={{ fontSize: 13, fontWeight: 800, color: store.sand, fontVariantNumeric: 'tabular-nums', minHeight: 18, display: { xs: 'none', sm: 'block' }, mt: 0.25 }}>
                {total == null ? ' ' : `${total} ${total === 1 ? 'style' : 'styles'}`}
              </Typography>
            </Box>
          </PageBox>
        </Box>
      </Box>

      <Box
        sx={{
          position: 'sticky', top: 'var(--appbar-h, 64px)', zIndex: 20, backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'saturate(1.4) blur(14px)',
          boxShadow: `inset 0 -1px 0 ${store.line}`, mt: { xs: 1, md: 1.5 },
        }}
      >
        <PageBox sx={{ py: 1, display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <CategoryPills cats={cats.data || []} value={category} onChange={(v) => update({ category: v })} />
          </Box>
          <SortSelect value={sort} onChange={(v) => update({ sort: v === 'featured' ? '' : v })} />
        </PageBox>
      </Box>

      <PageBox sx={{ pt: { xs: 3, md: 5 } }}>
        {q.isError ? <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={() => q.refetch()} disabled={q.isFetching}>Retry</Button>}>{q.error?.code === 'OFFLINE' ? 'You are offline, so the shoes could not load.' : 'Could not load the shoes. Check your connection and retry.'}</Alert> : null}

        {q.isLoading ? (
          <Box sx={grid} aria-busy="true" aria-label="Loading shoes">{Array.from({ length: 6 }, (_, i) => <ProductCardSkeleton key={i} />)}</Box>
        ) : items.length === 0 && !q.isError ? (
          <Panel sx={{ py: { xs: 6, md: 10 }, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 2 }}>
            <Box sx={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: store.sand, display: 'grid', placeItems: 'center', mb: 1 }}>
              <SearchX size={28} strokeWidth={2} aria-hidden="true" />
            </Box>
            <Typography component="h2" variant="h4">Nothing here yet</Typography>
            <Typography color="text.secondary" sx={{ maxWidth: '40ch' }}>No shoes match {label ? `“${label}”` : 'this filter'} right now. Try another category or see the whole range.</Typography>
            <Button variant="contained" onClick={() => update({ category: '' })} sx={{ mt: 1, backgroundColor: store.blue, color: '#fff', '&:hover': { backgroundColor: store.blueDeep } }}>Show all shoes</Button>
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
            <Pagination sx={{ '& .MuiPaginationItem-root': { minWidth: 44, height: 44, borderRadius: '999px', fontWeight: 700, color: store.navy }, '& .Mui-selected': { backgroundColor: `${store.blue} !important`, color: '#fff' } }} count={pages} page={page} onChange={(_, v) => update({ page: v > 1 ? String(v) : '' })} />
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
