import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Dialog from '@mui/material/Dialog';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Popover from '@mui/material/Popover';
import { useReducedMotion } from 'motion/react';
import { detectTier } from '../three/tier.js';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import { X } from 'lucide-react';
import { PageBox, useTitle } from '../components/Page.jsx';
import ProductPhoto from '../components/ProductPhoto.jsx';
import Reveal from '../components/Reveal.jsx';
import LineReveal from '../components/LineReveal.jsx';

const ProductViewer = lazy(() => import('../three/ProductViewer.jsx'));
import Price from '../components/Price.jsx';
import Swatches from '../components/Swatches.jsx';
import SizePicker from '../components/SizePicker.jsx';
import QtyStepper from '../components/QtyStepper.jsx';
import ExternalLink from '../components/ExternalLink.jsx';
import NotFound from './NotFound.jsx';
import { useProduct } from '../api/hooks.js';
import { makeLine, addToCartAnimated, pickSourceRect, warmCartBox } from '../lib/addToCart.js';
import { ApiError } from '../api/client.js';
import { tokens } from '../theme/tokens.js';

function Loading() {
  return (
    <PageBox sx={{ py: { xs: 4, md: 8 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 6 }}>
      <Skeleton variant="rectangular" sx={{ aspectRatio: '1 / 1', height: 'auto' }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant="rectangular" height={48} width="50%" />
        <Skeleton variant="rectangular" height={36} width="40%" />
        <Skeleton variant="rectangular" height={120} />
      </Box>
    </PageBox>
  );
}

export default function Product() {
  const { slug } = useParams();
  const { data: product, isLoading, error } = useProduct(slug);
  const [params, setParams] = useSearchParams();
  const [size, setSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const sizeRef = useRef(null);
  const galleryRef = useRef(null);
  const addRef = useRef(null);
  const [view, setView] = useState('photos');
  const [showParts, setShowParts] = useState(true);
  const [pop, setPop] = useState(null); // { spot, el }
  const reduced = useReducedMotion();
  const tier = useMemo(() => detectTier(), []);
  const spots = useMemo(() => (product?.specCallouts || []).map((c) => ({ key: c.key, title: c.title, body: c.body, anchor: c.anchor })), [product]);
  useTitle(product?.name);

  const key = params.get('colour') || product?.colourways?.[0]?.key;
  const colour = product?.colourways?.find((c) => c.key === key) || product?.colourways?.[0];

  useEffect(() => {
    const id = setTimeout(warmCartBox, 1200);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    setSize(null);
    setImgIndex(0);
    setSizeError(false);
  }, [colour?.key, slug]);

  if (isLoading) return <Loading />;
  if (error instanceof ApiError && error.status === 404) return <NotFound />;
  if (!product || !colour) return <NotFound />;

  const can3d = slug === 'g10-401' && tier !== 'static' && !reduced;
  const images = colour.images || [];
  const main = images[imgIndex] || images[0];

  const add = () => {
    if (!size) {
      setSizeError(true);
      sizeRef.current?.querySelector('button')?.focus();
      sizeRef.current?.focus();
      return;
    }
    addToCartAnimated(makeLine(product, colour, size, qty), { sourceRect: pickSourceRect(galleryRef.current, addRef.current) });
  };

  return (
    <PageBox
      sx={{
        py: { xs: 3, md: 8 },
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(0,7fr) minmax(0,5fr)' },
        gridTemplateAreas: { xs: '"head" "gallery" "buy" "photos"', md: '"gallery head" "gallery buy" "photos photos"' },
        gridTemplateRows: { md: 'auto 1fr auto' },
        columnGap: { md: 8 },
        rowGap: { xs: 4, md: 4 },
        alignItems: 'start',
      }}
    >
      <Box sx={{ gridArea: 'gallery', display: 'flex', flexDirection: { xs: 'column-reverse', md: 'row' }, gap: 2, minWidth: 0 }}>
        <Box role="list" aria-label="Photo thumbnails" sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, flexWrap: { xs: 'wrap', md: 'nowrap' }, gap: 1.5, flexShrink: 0 }}>
          {images.map((im, i) => (
            <Box
              role="listitem"
              key={im.src}
              component="button"
              type="button"
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === imgIndex}
              onClick={() => setImgIndex(i)}
              sx={{ p: 0, border: 0, cursor: 'pointer', width: { xs: 64, md: 88 }, flexShrink: 0, background: 'none', outline: i === imgIndex ? `2px solid ${tokens.gold}` : 'none', outlineOffset: 2 }}
            >
              <ProductPhoto image={{ src: im.thumb, thumb: im.thumb }} alt="" sizes="88px" eager />
            </Box>
          ))}
        </Box>
        <Box ref={galleryRef} sx={{ flex: 1, minWidth: 0 }}>
          {can3d ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
              <ToggleButtonGroup exclusive value={view} onChange={(_, v) => v && setView(v)} aria-label="Gallery view" size="small">
                <ToggleButton value="photos" aria-label="Photos">Photos</ToggleButton>
                <ToggleButton value="3d" aria-label="3D view">3D</ToggleButton>
              </ToggleButtonGroup>
              {view === '3d' ? <FormControlLabel control={<Switch checked={showParts} onChange={(e) => setShowParts(e.target.checked)} />} label="Show parts" /> : null}
            </Box>
          ) : null}
          {can3d && view === '3d' ? (
            <>
              <Suspense fallback={<Box sx={{ aspectRatio: '1 / 1', width: '100%', backgroundColor: 'background.default' }} />}>
                <ProductViewer tier={tier === 'lite' ? 'lite' : 'full'} colourKey={colour.key} spots={spots} showSpots={showParts} onSelect={(spot, el) => setPop({ spot, el })} />
              </Suspense>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>3D: a stand-in sneaker. Photos: the real G10-401.</Typography>
              <Popover open={!!pop} anchorEl={pop?.el} onClose={() => setPop(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} transformOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Box sx={{ p: 2.5, maxWidth: 320 }}>
                  <Typography variant="h5" component="p">{pop?.spot.title}</Typography>
                  <Typography variant="body1">{pop?.spot.body}</Typography>
                </Box>
              </Popover>
            </>
          ) : (
            <>
          <ProductPhoto image={main} alt={main?.alt || `${product.name} in ${colour.name}`} eager sizes="(min-width:900px) 55vw, 100vw" onClick={() => setZoom(true)} sx={{ cursor: 'zoom-in' }} />
          <Button variant="text" onClick={() => setZoom(true)} sx={{ mt: 1 }}>Zoom photo</Button>
            </>
          )}
        </Box>
      </Box>

      <Box sx={{ gridArea: 'head', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <LineReveal component="h1" variant="h3" text={product.name} load />
        <Price variant="price" price={colour.price} regularPrice={colour.regularPrice} component="p" />
        <Typography variant="body1" color="text.secondary">
          {colour.name}
          {colour.nameNe ? <> &middot; <span lang="ne" style={{ fontFamily: 'Mukta' }}>{colour.nameNe}</span></> : null}
          {colour.inStock ? '' : ' · Out of stock'}
        </Typography>
      </Box>

      <Box sx={{ gridArea: 'buy', display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, alignSelf: 'start' }}>
        <Swatches colourways={product.colourways} value={colour.key} onChange={(k) => { const n = new URLSearchParams(params); n.set('colour', k); setParams(n, { replace: true }); }} />
        <SizePicker ref={sizeRef} sizes={colour.sizes} value={size} onChange={(v) => { setSize(v); if (v) setSizeError(false); }} error={sizeError} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="subtitle2">Quantity</Typography>
          <QtyStepper value={qty} onChange={setQty} />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'stretch' }}>
          <Button ref={addRef} variant="contained" size="large" fullWidth onClick={add}>Add to cart</Button>
          <ExternalLink href={colour.productUrl} sx={{ alignSelf: 'flex-start' }}>View on goldstarshoes.com</ExternalLink>
          {slug === 'g10-401' ? <Link component={RouterLink} to="/#story-explode" sx={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start' }}>See it come apart</Link> : null}
        </Box>
        {product.shortSpecs?.length ? (
          <Box component="ul" sx={{ m: 0, pl: 2.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {product.shortSpecs.map((s) => (
              <Typography component="li" key={s} variant="body1">{s}</Typography>
            ))}
          </Box>
        ) : null}
      </Box>

      {images.length > 1 ? (
        <Box component="section" aria-labelledby="photos-h" sx={{ gridArea: 'photos', mt: { xs: 2, md: 6 } }}>
          <Typography id="photos-h" variant="h3" component="h2" sx={{ mb: 3 }}>Photos of the {colour.name.toLowerCase()} {product.name}</Typography>
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', md: 'repeat(3, minmax(0,1fr))' }, gap: { xs: 1.5, md: 3 } }}>
            {images.map((im, i) => (
              <Reveal component="li" key={im.src} delay={Math.min(i, 5) * 0.06}>
                <ProductPhoto image={im} alt={im.alt || `${product.name} in ${colour.name}, photo ${i + 1}`} sizes="(min-width:900px) 33vw, 50vw" onClick={() => { setImgIndex(i); setZoom(true); }} sx={{ cursor: 'zoom-in' }} />
              </Reveal>
            ))}
          </Box>
        </Box>
      ) : null}

      <Dialog open={zoom} onClose={() => setZoom(false)} maxWidth="md" fullWidth aria-label={`${product.name} photo`} slotProps={{ paper: { sx: { p: { xs: 2, sm: 4 } } } }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <IconButton aria-label="Close photo" onClick={() => setZoom(false)}><X size={20} strokeWidth={1.75} aria-hidden="true" /></IconButton>
        </Box>
        <ProductPhoto image={main ? { src: main.src, thumb: main.src } : null} alt={main?.alt || product.name} eager sizes="90vw" />
      </Dialog>
    </PageBox>
  );
}
