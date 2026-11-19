import { useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import { motion, useReducedMotion } from 'motion/react';
import ProductPhoto from '../ProductPhoto.jsx';
import QuickAdd from '../QuickAdd.jsx';
import { WIDE } from '../../theme/tokens.js';
import { store } from '../../theme/storeTokens.js';
import { ShopBadge, badgesFor, descriptorFor, CardPrice, CardSwatches } from './kit.jsx';

const EASE = [0.22, 1, 0.36, 1];

// Shop card: cream photo tile (second photo crossfades in on hover), badges, quick add "+", name, descriptor,
// price, and real colour swatches that switch the card's photo (and the link's colour).
export default function ProductCard({ p, index = 0, eager = false, sizes = '(min-width:1200px) 30vw, (min-width:900px) 33vw, 50vw' }) {
  const firstKey = (p.colourways.find((c) => c.inStock) || p.colourways[0])?.key;
  const [key, setKey] = useState(firstKey);
  const [swapped, setSwapped] = useState(false); // crossfade only after a swatch tap, not on first paint
  const pick = (k) => {
    setSwapped(true);
    setKey(k);
  };
  const colour = p.colourways.find((c) => c.key === key) || p.colourways[0];
  const hover = colour?.secondImage || null;
  const photoRef = useRef(null);
  const reduced = useReducedMotion();
  const badges = badgesFor(p);
  const to = `/product/${p.slug}${colour && colour.key !== p.colourways[0]?.key ? `?colour=${colour.key}` : ''}`;

  return (
    <Box
      component={motion.div}
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -6% 0px' }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.07, ease: EASE }}
      sx={{ height: '100%' }}
    >
      <Box
        className="store-card"
        sx={{
          position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: store.ground, borderRadius: `${store.radius.lg}px`,
          boxShadow: `0 0 0 1px ${store.line}, ${store.shadowCard}`, p: { xs: 0.75, sm: 1 },
          transition: 'transform 320ms cubic-bezier(0.22,1,0.36,1), box-shadow 320ms cubic-bezier(0.22,1,0.36,1)',
          '@media (hover:hover)': {
            '&:hover, &:focus-within': { transform: 'translateY(-4px)', boxShadow: `0 0 0 1px ${store.line}, ${store.shadowLift}` },
            '&:hover .photo-alt, &:focus-within .photo-alt': { opacity: 1 },
            '&:hover .photo > img:first-of-type, &:focus-within .photo > img:first-of-type': { opacity: hover ? 0 : 1 },
            '&:hover .photo img, &:focus-within .photo img': { transform: 'scale(1.05)' },
            '&:hover .card-name': { color: store.blue },
          },
          '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover, &:focus-within': { transform: 'none' }, '& .photo img': { transition: 'none' } },
        }}
      >
        <Box
          component={RouterLink}
          to={to}
          sx={{
            display: 'flex', flexDirection: 'column', flex: 1, color: 'inherit', textDecoration: 'none', borderRadius: `${store.radius.md}px`,
            '&:focus-visible': { outline: `2px solid ${store.blue}`, outlineOffset: 3 },
          }}
        >
          <Box ref={photoRef} className="tile" sx={{ position: 'relative', borderRadius: `${store.radius.md + 2}px`, overflow: 'hidden', backgroundColor: store.cream }}>
            <ProductPhoto key={colour?.key} image={colour?.image} alt={`${p.name} in ${colour?.name}`} hoverImage={hover} eager={eager} sizes={sizes} sx={{ aspectRatio: '4 / 5', backgroundColor: store.cream, '& > img': { p: { xs: 1, md: 2 }, boxSizing: 'border-box' }, ...(swapped ? { '& > img:first-of-type': { animation: 'gsFade 320ms cubic-bezier(0.22,1,0.36,1)' } } : null) }} />
            {badges.length ? (
              <Box sx={{ position: 'absolute', top: { xs: 8, sm: 12 }, left: { xs: 8, sm: 12 }, display: 'flex', flexWrap: 'wrap', gap: 0.75, maxWidth: 'calc(100% - 72px)', '& > :nth-of-type(n+2)': { display: { xs: 'none', sm: 'inline-flex' } } }}>
                {badges.map((b) => <ShopBadge key={b} kind={b} />)}
              </Box>
            ) : null}
          </Box>
          <Box sx={{ pt: { xs: 1.25, sm: 1.75 }, px: { xs: 0.75, sm: 1 }, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography component="h3" className="card-name" sx={{ fontSize: { xs: 16, sm: 19 }, fontWeight: 800, lineHeight: 1.15, color: store.navy, transition: 'color 200ms ease', ...WIDE, letterSpacing: '-0.01em' }}>
              {p.name}
            </Typography>
            <Typography sx={{ fontSize: { xs: 13, sm: 14 }, color: store.ink2, lineHeight: 1.3 }}>{descriptorFor(p)}</Typography>
            <Box sx={{ mt: 0.5, color: store.navy }}>{colour ? <CardPrice product={p} colour={colour} /> : null}</Box>
          </Box>
        </Box>
        <Box sx={{ px: { xs: 0.75, sm: 1 }, mt: 0.5, mb: 0.5, minHeight: 36, display: 'flex', alignItems: 'center' }}>
          <CardSwatches product={p} value={colour?.key} onChange={pick} />
        </Box>
        <QuickAdd product={p} photoRef={photoRef} colourKey={colour?.key} />
      </Box>
    </Box>
  );
}

export function ProductCardSkeleton() {
  return (
    <Box aria-hidden="true">
      <Skeleton variant="rectangular" sx={{ aspectRatio: '4 / 5', width: '100%', height: 'auto', borderRadius: `${store.radius.lg}px`, backgroundColor: store.creamDeep }} />
      <Box sx={{ pt: 2, px: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Skeleton variant="rectangular" height={20} width="55%" />
        <Skeleton variant="rectangular" height={14} width="35%" />
        <Skeleton variant="rectangular" height={18} width="45%" />
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>{[0, 1, 2].map((i) => <Skeleton key={i} variant="circular" width={18} height={18} />)}</Box>
      </Box>
    </Box>
  );
}
