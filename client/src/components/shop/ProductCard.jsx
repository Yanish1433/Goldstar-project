import { useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import { motion, useReducedMotion } from 'motion/react';
import ProductPhoto from '../ProductPhoto.jsx';
import QuickAdd from '../QuickAdd.jsx';
import { shop } from '../../theme/tokens.js';
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
      sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Box
        component={RouterLink}
        to={to}
        sx={{
          display: 'flex', flexDirection: 'column', flex: 1, color: 'inherit', textDecoration: 'none', borderRadius: `${shop.radius.lg}px`,
          '&:focus-visible': { outline: `3px solid ${shop.blue}`, outlineOffset: 4 },
          '& .tile': { transition: 'transform 320ms cubic-bezier(0.22,1,0.36,1), box-shadow 320ms cubic-bezier(0.22,1,0.36,1)' },
          ...({
            '@media (hover:hover)': {
              '&:hover .tile, &:focus-visible .tile': { transform: 'translateY(-4px)', boxShadow: shop.shadowLift },
              '&:hover .photo-alt, &:focus-visible .photo-alt': { opacity: 1 },
              '&:hover .photo > img:first-of-type, &:focus-visible .photo > img:first-of-type': { opacity: hover ? 0 : 1 },
              '&:hover .photo img, &:focus-visible .photo img': { transform: 'scale(1.04)' },
              '&:hover .card-name': { textDecoration: 'underline', textDecorationThickness: '2px', textUnderlineOffset: '5px' },
            },
          }),
        }}
      >
        <Box ref={photoRef} className="tile" sx={{ position: 'relative', borderRadius: `${shop.radius.lg}px`, overflow: 'hidden', backgroundColor: shop.tile }}>
          <ProductPhoto key={colour?.key} image={colour?.image} alt={`${p.name} in ${colour?.name}`} hoverImage={hover} eager={eager} sizes={sizes} sx={{ aspectRatio: '4 / 5', '& > img': { p: { xs: 1, md: 2 }, boxSizing: 'border-box' }, ...(swapped ? { '& > img:first-of-type': { animation: 'gsFade 320ms cubic-bezier(0.22,1,0.36,1)' } } : null) }} />
          {badges.length ? (
            <Box sx={{ position: 'absolute', top: { xs: 10, sm: 14 }, left: { xs: 10, sm: 14 }, display: 'flex', flexWrap: 'wrap', gap: 0.75, maxWidth: 'calc(100% - 72px)', '& > :nth-of-type(n+2)': { display: { xs: 'none', sm: 'inline-flex' } } }}>
              {badges.map((b) => <ShopBadge key={b} kind={b} />)}
            </Box>
          ) : null}
        </Box>
        <Box sx={{ pt: { xs: 1.5, sm: 2 }, px: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography component="h3" className="card-name" sx={{ fontSize: { xs: 16, sm: 19 }, fontWeight: 800, lineHeight: 1.15, fontStretch: '108%', fontVariationSettings: '"wdth" 108', letterSpacing: '-0.01em' }}>
            {p.name}
          </Typography>
          <Typography sx={{ fontSize: { xs: 13, sm: 14 }, color: shop.ink2, lineHeight: 1.3 }}>{descriptorFor(p)}</Typography>
          <Box sx={{ mt: 0.5 }}>{colour ? <CardPrice product={p} colour={colour} /> : null}</Box>
        </Box>
      </Box>
      <Box sx={{ px: 0.5, mt: 0.5, minHeight: 36, display: 'flex', alignItems: 'center' }}>
        <CardSwatches product={p} value={colour?.key} onChange={pick} />
      </Box>
      <QuickAdd product={p} photoRef={photoRef} colourKey={colour?.key} />
    </Box>
  );
}

export function ProductCardSkeleton() {
  return (
    <Box aria-hidden="true">
      <Skeleton variant="rectangular" sx={{ aspectRatio: '4 / 5', width: '100%', height: 'auto', borderRadius: `${shop.radius.lg}px` }} />
      <Box sx={{ pt: 2, px: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Skeleton variant="rectangular" height={20} width="55%" />
        <Skeleton variant="rectangular" height={14} width="35%" />
        <Skeleton variant="rectangular" height={18} width="45%" />
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>{[0, 1, 2].map((i) => <Skeleton key={i} variant="circular" width={18} height={18} />)}</Box>
      </Box>
    </Box>
  );
}
