import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Popover from '@mui/material/Popover';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import { useReducedMotion } from 'motion/react';
import {
  ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, Feather, Footprints, Images, Layers, Mountain, Rotate3d, Shield, ShoppingBag, Sparkles, Wind, X, ZoomIn,
} from 'lucide-react';
import { detectTier } from '../three/tier.js';
import { PageBox, useTitle } from '../components/Page.jsx';
import ProductPhoto from '../components/ProductPhoto.jsx';
import Reveal from '../components/Reveal.jsx';
import LineReveal from '../components/LineReveal.jsx';
import Swatches from '../components/Swatches.jsx';
import SizePicker from '../components/SizePicker.jsx';
import QtyStepper from '../components/QtyStepper.jsx';
import ExternalLink from '../components/ExternalLink.jsx';
import Quiet3D from '../components/Quiet3D.jsx';
import ProductCard from '../components/shop/ProductCard.jsx';
import { Band, Eyebrow, PriceTag, ShopBadge, TrustRow, badgesFor, descriptorFor } from '../components/shop/kit.jsx';
import NotFound from './NotFound.jsx';
import { LoadError } from '../api/NetworkStates.jsx';
import { useProduct, useProducts } from '../api/hooks.js';
import { makeLine, addToCartAnimated, pickSourceRect } from '../lib/addToCart.js';
import { ApiError } from '../api/client.js';
import { formatNPR } from '../lib/format.js';
import { shop, WIDE } from '../theme/tokens.js';
import { store } from '../theme/storeTokens.js';
import { TOUCH, SHORT } from '../landing-v2/tokensV2.js';

const ProductViewer = lazy(() => import('../three/ProductViewer.jsx'));

const CAT_NAMES = { 'trek-collection': 'Trek collection', casual: 'Casual', 'new-arrival': 'New arrival' };

// Icon per feature line, by keyword.
const FEATURE_ICONS = [
  [/off.?road|trail|trek/i, Mountain],
  [/outsole|slip|grip|traction/i, Footprints],
  [/midsole|bounce|light/i, Feather],
  [/leather|suede|synthetic/i, Shield],
  [/mesh|canvas|breath/i, Wind],
  [/foam|footbed|arch|cushion/i, Layers],
  [/eyelet|metal/i, Sparkles],
];
const iconFor = (s) => FEATURE_ICONS.find(([re]) => re.test(s))?.[1] || Check;
const tidy = (s) => s.replace(/^Pu /, 'PU ').replace(/^Eva /, 'EVA ');

// General UK → EU / foot length chart (approximate, for the demo's size guide).
const SIZE_CHART = [['4', '37', '22.9'], ['5', '38', '23.8'], ['6', '39', '24.6'], ['7', '40.5', '25.4'], ['8', '42', '26.2'], ['9', '43', '27.1'], ['10', '44.5', '27.9'], ['11', '45.5', '28.8']];

function Loading() {
  return (
    <PageBox sx={{ py: { xs: 3, md: 6 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: { xs: 3, md: 8 } }}>
      <Skeleton variant="rectangular" sx={{ aspectRatio: '1 / 1', height: 'auto', borderRadius: `${shop.radius.xl}px` }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: { md: 4 } }}>
        <Skeleton variant="rectangular" height={14} width="30%" />
        <Skeleton variant="rectangular" height={56} width="70%" />
        <Skeleton variant="rectangular" height={32} width="40%" />
        <Skeleton variant="rectangular" height={160} />
        <Skeleton variant="rectangular" height={56} sx={{ borderRadius: `${shop.radius.pill}px` }} />
      </Box>
    </PageBox>
  );
}

const roundBtn = {
  width: 44, height: 44, borderRadius: '50%', border: 0, display: 'grid', placeItems: 'center', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.92)', color: shop.ink,
  boxShadow: '0 2px 10px rgba(22,18,14,0.12)', transition: 'transform 180ms ease, background-color 180ms ease',
  '&:hover': { backgroundColor: '#FFFFFF', transform: 'scale(1.06)' }, '&:focus-visible': { outline: `3px solid ${shop.blue}`, outlineOffset: 2 },
};

// Photos / 3D segmented control.
function ViewToggle({ value, onChange }) {
  const opts = [['photos', 'Photos', Images], ['3d', '3D view', Rotate3d]];
  return (
    <Box role="radiogroup" aria-label="Gallery view" sx={{ display: 'inline-flex', p: '4px', borderRadius: `${shop.radius.pill}px`, backgroundColor: 'rgba(255,255,255,0.92)', boxShadow: '0 2px 10px rgba(22,18,14,0.1)' }}>
      {opts.map(([v, label, Icon]) => {
        const on = v === value;
        return (
          <Box
            key={v}
            component="button"
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(v)}
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.75, minHeight: 36, [TOUCH]: { minHeight: 44 }, px: 1.75, border: 0, borderRadius: `${shop.radius.pill}px`, cursor: 'pointer', font: 'inherit', fontSize: 14, fontWeight: 700,
              backgroundColor: on ? shop.ink : 'transparent', color: on ? '#FFFFFF' : shop.ink, transition: 'background-color 200ms ease, color 200ms ease',
              '&:focus-visible': { outline: `3px solid ${shop.blue}`, outlineOffset: 1 },
            }}
          >
            <Icon size={16} strokeWidth={2} aria-hidden="true" />
            {label}
          </Box>
        );
      })}
    </Box>
  );
}

// Big image + thumbnails (desktop) / a swipe track with dots (phones).
function Gallery({ images, index, setIndex, alt, onZoom, top }) {
  const track = useRef(null);
  const fromScroll = useRef(false);
  // Phones: keep the track in sync when the index changes from outside (thumbnail, colour change).
  useEffect(() => {
    const el = track.current;
    if (!el || fromScroll.current) {
      fromScroll.current = false;
      return;
    }
    if (el.clientWidth && getComputedStyle(el).display !== 'none') el.scrollTo({ left: index * el.clientWidth, behavior: 'auto' });
  }, [index]);
  const onScroll = () => {
    const el = track.current;
    if (!el?.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) {
      fromScroll.current = true;
      setIndex(i);
    }
  };
  const main = images[index] || images[0];
  const go = (d) => setIndex((index + d + images.length) % images.length);
  const tile = { position: 'relative', borderRadius: { xs: `${shop.radius.lg}px`, md: `${shop.radius.xl}px` }, overflow: 'hidden', backgroundColor: shop.tile };
  return (
    <Box sx={{ display: 'flex', gap: 2, minWidth: 0 }}>
      {images.length > 1 ? (
        <Box role="list" aria-label="Photo thumbnails" sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', gap: 1.25, flexShrink: 0, maxHeight: 'min(72vh, 680px)', overflowY: 'auto', scrollbarWidth: 'none', p: '3px' }}>
          {images.map((im, i) => (
            <Box
              role="listitem"
              key={`${im.src}-${i}`}
              component="button"
              type="button"
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              sx={{
                p: 0, border: 0, cursor: 'pointer', width: 68, flexShrink: 0, background: 'none', borderRadius: `${shop.radius.md}px`, overflow: 'hidden',
                boxShadow: i === index ? `0 0 0 2px ${shop.ink}` : `0 0 0 1px ${shop.line}`, opacity: i === index ? 1 : 0.8, transition: 'box-shadow 180ms ease, opacity 180ms ease',
                '&:hover': { opacity: 1 }, '&:focus-visible': { outline: `3px solid ${shop.blue}`, outlineOffset: 2 },
              }}
            >
              <ProductPhoto image={{ src: im.thumb, thumb: im.thumb }} alt="" sizes="68px" eager />
            </Box>
          ))}
        </Box>
      ) : null}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Desktop: one big photo with arrows */}
        <Box sx={{ ...tile, display: { xs: 'none', md: 'block' } }}>
          {/* One fixed full-size source (no srcset): a viewport change (resize, zoom, rotation) would otherwise swap the file
              and repaint the main photo blank while the new one decodes. */}
          <ProductPhoto image={main ? { src: main.src, thumb: main.src, alt: main.alt } : null} alt={main?.alt || alt} eager onClick={onZoom} sx={{ cursor: 'zoom-in', '& > img': { p: 3, boxSizing: 'border-box' } }} />
          {top}
          {images.length > 1 ? (
            <Box sx={{ position: 'absolute', right: 16, bottom: 16, display: 'flex', gap: 1 }}>
              <Box component="button" type="button" aria-label="Previous photo" onClick={() => go(-1)} sx={roundBtn}><ChevronLeft size={20} strokeWidth={2.25} aria-hidden="true" /></Box>
              <Box component="button" type="button" aria-label="Next photo" onClick={() => go(1)} sx={roundBtn}><ChevronRight size={20} strokeWidth={2.25} aria-hidden="true" /></Box>
            </Box>
          ) : null}
          <Box component="button" type="button" aria-label="Zoom photo" onClick={onZoom} sx={{ ...roundBtn, position: 'absolute', left: 16, bottom: 16 }}><ZoomIn size={20} strokeWidth={2} aria-hidden="true" /></Box>
        </Box>
        {/* Phones: swipe track */}
        <Box sx={{ ...tile, display: { xs: 'block', md: 'none' } }}>
          <Box
            ref={track}
            onScroll={onScroll}
            role="region"
            aria-label="Photos, swipe for more"
            sx={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' }, overscrollBehaviorX: 'contain' }}
          >
            {images.map((im, i) => (
              <Box key={`${im.src}-${i}`} sx={{ flex: '0 0 100%', scrollSnapAlign: 'center' }}>
                <ProductPhoto image={im} alt={im.alt || `${alt}, photo ${i + 1}`} eager={i === 0} sizes="100vw" onClick={onZoom} sx={{ '& > img': { p: 2, boxSizing: 'border-box' } }} />
              </Box>
            ))}
          </Box>
          {top}
          {images.length > 1 ? (
            <Box aria-hidden="true" sx={{ position: 'absolute', left: 0, right: 0, bottom: 12, display: 'flex', justifyContent: 'center', gap: 0.75 }}>
              {images.map((im, i) => (
                <Box key={`${im.src}-${i}`} sx={{ width: i === index ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === index ? shop.ink : 'rgba(22,18,14,0.25)', transition: 'width 240ms cubic-bezier(0.22,1,0.36,1), background-color 240ms ease' }} />
              ))}
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}

function Related({ slug }) {
  const q = useProducts({ limit: 8 });
  const items = (q.data?.items || []).filter((p) => p.slug !== slug).slice(0, 4);
  if (!items.length) return null;
  return (
    <PageBox component="section" aria-labelledby="related-h" sx={{ mt: { xs: 8, md: 12 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, mb: { xs: 2.5, md: 4 } }}>
        <Box>
          <Eyebrow sx={{ color: shop.ink2, mb: 1 }}>More from Goldstar</Eyebrow>
          <Typography id="related-h" component="h2" variant="h2">Complete the look</Typography>
        </Box>
        <Button component={RouterLink} to="/shop" variant="text" endIcon={<ArrowRight size={18} strokeWidth={2.25} aria-hidden="true" />} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>Shop all</Button>
      </Box>
      <Box
        component="ul"
        role="list"
        sx={{
          listStyle: 'none', m: 0, p: 0, display: 'grid', gap: { xs: 1.5, md: 3 },
          gridAutoFlow: { xs: 'column', md: 'row' }, gridAutoColumns: { xs: '62%', sm: '40%' }, gridTemplateColumns: { md: 'repeat(4, minmax(0,1fr))' },
          overflowX: { xs: 'auto', md: 'visible' }, scrollSnapType: 'x mandatory', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
          mx: { xs: -2, sm: -3, md: 0 }, px: { xs: 2, sm: 3, md: 0 }, scrollPaddingInline: 16,
        }}
      >
        {items.map((p, i) => (
          <Box component="li" key={p.id} sx={{ minWidth: 0, scrollSnapAlign: 'start' }}>
            <ProductCard p={p} index={i} sizes="(min-width:900px) 22vw, 62vw" />
          </Box>
        ))}
      </Box>
    </PageBox>
  );
}

export default function Product() {
  const { slug } = useParams();
  const { data: product, isLoading, error, refetch } = useProduct(slug);
  const [params, setParams] = useSearchParams();
  const [size, setSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [guide, setGuide] = useState(false);
  const sizeRef = useRef(null);
  const galleryRef = useRef(null);
  const addRef = useRef(null);
  const [view, setView] = useState(params.get('view') === '3d' ? '3d' : 'photos');
  const [showParts, setShowParts] = useState(true);
  const [pop, setPop] = useState(null); // { spot, el }
  const [barOn, setBarOn] = useState(false);
  const reduced = useReducedMotion();
  const tier = useMemo(() => detectTier(), []);
  const spots = useMemo(() => (product?.specCallouts || []).map((c) => ({ key: c.key, title: c.title, body: c.body, anchor: c.anchor })), [product]);
  useTitle(product?.name);

  const key = params.get('colour') || product?.colourways?.[0]?.key;
  const colour = product?.colourways?.find((c) => c.key === key) || product?.colourways?.[0];

  useEffect(() => {
    setSize(null);
    setImgIndex(0);
    setSizeError(false);
  }, [colour?.key, slug]);

  // Phones: a sticky add bar while the main Add to cart button is off screen.
  useEffect(() => {
    const el = addRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    // Off as soon as any of the real button is on screen: the bar never sits on top of it.
    const io = new IntersectionObserver(([e]) => setBarOn(!e.isIntersecting), { rootMargin: '0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [product, colour?.key]);

  // While the sticky bar shows (phones only: it is hidden from md up), lift the WhatsApp button and the snackbar above
  // it (--gs-bottom-ui), so the button never sits on the bar's Add to cart.
  useEffect(() => {
    const root = document.documentElement;
    if (barOn && window.matchMedia?.('(max-width:899.95px)').matches) root.style.setProperty('--gs-bottom-ui', (window.matchMedia('(max-height:500px) and (orientation:landscape)').matches ? 'calc(64px + env(safe-area-inset-bottom))' : 'calc(76px + env(safe-area-inset-bottom))'));
    else root.style.removeProperty('--gs-bottom-ui');
    return () => root.style.removeProperty('--gs-bottom-ui');
  }, [barOn]);

  if (isLoading) return <Loading />;
  if (error instanceof ApiError && error.status === 404) return <NotFound />;
  if (error && !product) return <LoadError error={error} onRetry={refetch} />;
  if (!product || !colour) return <NotFound />;

  const can3d = slug === 'g10-401' && tier !== 'static' && !reduced;
  const images = colour.images || [];
  const main = images[imgIndex] || images[0];
  const allSizes = [...new Set(product.colourways.flatMap((c) => c.sizes || []))].sort((a, b) => Number(a) - Number(b));
  const badges = badgesFor(product);
  const cat = (product.categories || []).find((c) => CAT_NAMES[c]);

  const add = (from) => {
    if (!size) {
      setSizeError(true);
      sizeRef.current?.scrollIntoView?.({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      sizeRef.current?.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
      return;
    }
    addToCartAnimated(makeLine(product, colour, size, qty), { sourceRect: pickSourceRect(galleryRef.current, from || addRef.current) });
  };

  const viewToggle = can3d ? <Box sx={{ position: 'absolute', top: { xs: 12, md: 16 }, left: { xs: 12, md: 16 }, zIndex: 2 }}><ViewToggle value={view} onChange={setView} /></Box> : null;

  return (
    <Box sx={{ pb: { xs: 14, md: 12 } }}>
      <PageBox sx={{ pt: { xs: 2, md: 3 } }}>
        <Box component="nav" aria-label="Breadcrumb" sx={{ mb: { xs: 2, md: 3 } }}>
          <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, fontSize: 14, color: shop.ink2, '& a': { color: shop.ink2, textDecoration: 'none', fontWeight: 600, minHeight: 32, display: 'inline-flex', alignItems: 'center', '&:hover': { color: shop.ink, textDecoration: 'underline' } } }}>
            <li><RouterLink to="/shop">Shop</RouterLink></li>
            {cat ? <><li aria-hidden="true">/</li><li><RouterLink to={`/shop?category=${cat}`}>{CAT_NAMES[cat]}</RouterLink></li></> : null}
            <li aria-hidden="true">/</li>
            <Box component="li" aria-current="page" sx={{ color: shop.ink, fontWeight: 700 }}>{product.name}</Box>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(0,7fr) minmax(0,5fr)' }, columnGap: { md: 6, lg: 10 }, rowGap: 3, alignItems: 'start', [SHORT]: { gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', columnGap: 3 } }}>
          {/* Landscape phones: photo beside the details, sticky, and never taller than the screen. */}
          <Box ref={galleryRef} sx={{ minWidth: 0, position: { md: 'sticky' }, top: { md: 'calc(var(--appbar-h, 64px) + 24px)' }, [SHORT]: { position: 'sticky', top: 'calc(var(--appbar-h, 52px) + 12px)', width: '100%', maxWidth: 'calc(100svh - var(--appbar-h, 52px) - 32px)', justifySelf: 'center' } }}>
            {can3d && view === '3d' ? (
              <Box sx={{ position: 'relative', borderRadius: { xs: `${shop.radius.lg}px`, md: `${shop.radius.xl}px` }, overflow: 'hidden', backgroundColor: '#E9E3D8' }}>
                <Quiet3D fallback={<ProductPhoto image={main} alt={main?.alt || `${product.name} in ${colour.name}`} sizes="(min-width:900px) 55vw, 100vw" />}>
                  <Suspense fallback={<Box sx={{ aspectRatio: '1 / 1', width: '100%', backgroundColor: '#E9E3D8' }} />}>
                    <ProductViewer tier={tier === 'lite' ? 'lite' : 'full'} colourKey={colour.key} spots={spots} showSpots={showParts} onSelect={(spot, el) => setPop({ spot, el })} />
                  </Suspense>
                </Quiet3D>
                {viewToggle}
                <Box sx={{ position: 'absolute', left: { xs: 12, md: 16 }, right: { xs: 12, md: 16 }, bottom: { xs: 12, md: 16 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', pointerEvents: 'none' }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, px: 1.5, py: 0.75, borderRadius: `${shop.radius.pill}px`, backgroundColor: 'rgba(255,255,255,0.9)' }}>Drag to turn · tap a dot</Typography>
                  <FormControlLabel control={<Switch size="small" checked={showParts} onChange={(e) => setShowParts(e.target.checked)} />} label="Show parts" sx={{ m: 0, pr: 1.5, pl: 0.5, borderRadius: `${shop.radius.pill}px`, backgroundColor: 'rgba(255,255,255,0.9)', pointerEvents: 'auto', '& .MuiFormControlLabel-label': { fontSize: 13, fontWeight: 700 } }} />
                </Box>
                <Popover open={!!pop} anchorEl={pop?.el} onClose={() => setPop(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} transformOrigin={{ vertical: 'top', horizontal: 'center' }}>
                  <Box sx={{ p: 2.5, maxWidth: 320 }}>
                    <Typography variant="h5" component="p" sx={{ mb: 0.5 }}>{pop?.spot.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{pop?.spot.body}</Typography>
                  </Box>
                </Popover>
              </Box>
            ) : (
              <Gallery images={images} index={imgIndex} setIndex={setImgIndex} alt={`${product.name} in ${colour.name}`} onZoom={() => setZoom(true)} top={viewToggle} />
            )}
          </Box>

          <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3, pt: { md: 2 } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {badges.map((b) => <ShopBadge key={b} kind={b} />)}
                <Typography component="span" sx={{ fontSize: 14, fontWeight: 600, color: shop.ink2 }}>{descriptorFor(product)}</Typography>
              </Box>
              <LineReveal component="h1" variant="h1" text={product.name} load sx={{ fontSize: { xs: 'clamp(36px, 11vw, 48px)', md: 'clamp(44px, 4.4vw, 68px)' } }} />
              <PriceTag price={colour.price} regularPrice={colour.regularPrice} size="lg" />
              <Typography variant="body2" sx={{ color: shop.ink2 }}>
                {colour.name}
                {colour.nameNe ? <> · <span lang="ne" style={{ fontFamily: 'Mukta' }}>{colour.nameNe}</span></> : null}
                {colour.inStock ? ' · In stock' : ' · Sold out'}
              </Typography>
            </Box>

            <Box sx={{ height: '1px', backgroundColor: shop.line }} />

            <Swatches colourways={product.colourways} value={colour.key} onChange={(k) => { const n = new URLSearchParams(params); n.set('colour', k); setParams(n, { replace: true, preventScrollReset: true }); }} />
            <SizePicker ref={sizeRef} sizes={colour.sizes} allSizes={allSizes} value={size} onChange={(v) => { setSize(v); if (v) setSizeError(false); }} error={sizeError} onGuide={() => setGuide(true)} />

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <QtyStepper value={qty} onChange={setQty} />
              <Button ref={addRef} variant="contained" size="large" onClick={() => add()} disabled={!colour.inStock} startIcon={<ShoppingBag size={20} strokeWidth={2} aria-hidden="true" />} sx={{ flex: 1 }}>
                Add to cart
              </Button>
            </Box>

            <ExternalLink href={colour.productUrl} sx={{ alignSelf: 'flex-start', mt: -1.5, fontSize: 14, color: shop.ink }}>View on goldstarshoes.com</ExternalLink>

            <Box sx={{ backgroundColor: shop.surface, borderRadius: `${shop.radius.lg}px`, boxShadow: `inset 0 0 0 1px ${shop.line}`, p: 2.5 }}>
              <TrustRow variant="stack" />
            </Box>

            {product.shortSpecs?.length ? (
              <Box component="section" aria-labelledby="features-h">
                <Typography id="features-h" component="h2" sx={{ fontWeight: 800, fontSize: 15, mb: 1.5 }}>Why you’ll like it</Typography>
                <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
                  {product.shortSpecs.slice(0, 6).map((s) => {
                    const Icon = iconFor(s);
                    return (
                      <Box component="li" key={s} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: `${shop.radius.sm + 2}px`, backgroundColor: shop.sunk, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          <Icon size={18} strokeWidth={2} aria-hidden="true" />
                        </Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{tidy(s)}</Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ) : null}

            <Box>
              <Accordion defaultExpanded={false}>
                <AccordionSummary expandIcon={<ChevronDown size={20} strokeWidth={2} aria-hidden="true" />}>Features & materials</AccordionSummary>
                <AccordionDetails>
                  <Box component="ul" sx={{ m: 0, pl: 2.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {(product.shortSpecs || []).map((s) => <Typography component="li" variant="body2" key={s}>{tidy(s)}</Typography>)}
                  </Box>
                </AccordionDetails>
              </Accordion>
              <Accordion>
                <AccordionSummary expandIcon={<ChevronDown size={20} strokeWidth={2} aria-hidden="true" />}>Details</AccordionSummary>
                <AccordionDetails>
                  <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'max-content 1fr', columnGap: 3, rowGap: 1, '& dt': { color: shop.ink2, fontSize: 14 }, '& dd': { m: 0, fontSize: 14, fontWeight: 600 } }}>
                    <dt>Style</dt><dd>{product.name}{product.series ? ` · ${product.series} series` : ''}</dd>
                    <dt>Colours</dt><dd>{product.colourways.map((c) => `${c.name} (${formatNPR(c.price)})`).join(', ')}</dd>
                    <dt>UK sizes</dt><dd>{allSizes.join(', ')}</dd>
                    <dt>Made in</dt><dd>Nepal</dd>
                  </Box>
                </AccordionDetails>
              </Accordion>
              <Accordion>
                <AccordionSummary expandIcon={<ChevronDown size={20} strokeWidth={2} aria-hidden="true" />}>Delivery & payment</AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ color: shop.ink2 }}>How ordering works: you pay in cash when the shoes arrive, and the delivery fee is confirmed on a phone call before dispatch.</Typography>
                </AccordionDetails>
              </Accordion>
            </Box>
          </Box>
        </Box>
      </PageBox>

      {slug === 'g10-401' ? (
        <Reveal sx={{ mt: { xs: 8, md: 12 } }}>
          <Band ground="pine" innerSx={{ py: { xs: 5, md: 7 }, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 3 }}>
            <Box>
              <Eyebrow sx={{ color: store.sand, mb: 1.5 }}>Technology · Eight layers</Eyebrow>
              <Typography component="h2" sx={{ fontWeight: 800, ...WIDE, textTransform: 'uppercase', fontSize: { xs: 34, md: 'clamp(44px, 4.4vw, 68px)' }, lineHeight: 0.94, letterSpacing: '-0.03em' }}>Designed to endure.</Typography>
              <Typography sx={{ mt: 1.5, color: store.onBlue2, maxWidth: '44ch' }}>Laces to outsole, every layer of the G10-401 pulled apart in 3D.</Typography>
            </Box>
            <Button component={RouterLink} to="/g10#story-anatomy" size="large" endIcon={<ArrowRight size={18} strokeWidth={2.25} aria-hidden="true" />} sx={{ alignSelf: { xs: 'flex-start', md: 'center' }, backgroundColor: store.sand, color: store.navy, '&:hover': { backgroundColor: store.ground } }}>
              See it come apart
            </Button>
          </Band>
        </Reveal>
      ) : null}

      <Related slug={slug} />

      {/* Phones: sticky add bar */}
      <Box
        aria-hidden={!barOn}
        inert={!barOn}
        sx={{
          display: { xs: 'flex', md: 'none' }, position: 'fixed', left: 8, right: 8, bottom: 'calc(8px + env(safe-area-inset-bottom, 0px))', zIndex: 1100,
          alignItems: 'center', gap: 1.5, p: 1, pl: 2, borderRadius: `${shop.radius.pill}px`, backgroundColor: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(12px)', boxShadow: shop.shadowFloat,
          transform: barOn ? 'translateY(0)' : 'translateY(140%)', transition: 'transform 320ms cubic-bezier(0.22,1,0.36,1)',
          // Landscape phones: just the button, bottom right (the short screen keeps its height for the page).
          [SHORT]: { left: 'auto', right: 'max(8px, env(safe-area-inset-right))', p: 0.5, pl: 0.5, '& [data-barinfo]': { display: 'none' } },
        }}
      >
        <Box data-barinfo sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}{size ? ` · UK ${size}` : ''}</Typography>
          <PriceTag price={colour.price} regularPrice={colour.regularPrice} size="sm" />
        </Box>
        <Button variant="contained" onClick={(e) => add(e.currentTarget)} disabled={!colour.inStock} tabIndex={barOn ? 0 : -1} sx={{ flexShrink: 0 }}>
          {size ? 'Add to cart' : 'Choose size'}
        </Button>
      </Box>

      <Dialog open={zoom} onClose={() => setZoom(false)} maxWidth="md" fullWidth aria-label={`${product.name} photo`} slotProps={{ paper: { sx: { p: { xs: 1.5, sm: 2 }, overflow: 'hidden' } } }}>
        <Box sx={{ position: 'relative' }}>
          <ProductPhoto image={main ? { src: main.src, thumb: main.src } : null} alt={main?.alt || product.name} eager sizes="90vw" sx={{ borderRadius: `${shop.radius.lg}px` }} />
          <IconButton aria-label="Close photo" onClick={() => setZoom(false)} sx={{ position: 'absolute', top: 12, right: 12, backgroundColor: '#FFFFFF', '&:hover': { backgroundColor: '#FFFFFF' } }}><X size={20} strokeWidth={2} aria-hidden="true" /></IconButton>
        </Box>
      </Dialog>

      <Dialog open={guide} onClose={() => setGuide(false)} maxWidth="xs" fullWidth aria-labelledby="guide-title">
        <DialogTitle id="guide-title" sx={{ pr: 7 }}>Size guide</DialogTitle>
        <IconButton aria-label="Close size guide" onClick={() => setGuide(false)} sx={{ position: 'absolute', top: 16, right: 16 }}><X size={20} strokeWidth={2} aria-hidden="true" /></IconButton>
        <DialogContent sx={{ pb: 3.5 }}>
          <Typography variant="body2" sx={{ color: shop.ink2, mb: 2 }}>A general chart. Measure your foot heel to toe, standing, and pick the size at or just above it.</Typography>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontVariantNumeric: 'tabular-nums', '& th, & td': { textAlign: 'left', py: 1.1, px: 1.5, borderBottom: `1px solid ${shop.line}`, fontSize: 15 }, '& th': { fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: shop.ink2 } }}>
            <thead><tr><th scope="col">UK</th><th scope="col">EU</th><th scope="col">Foot (cm)</th></tr></thead>
            <tbody>
              {SIZE_CHART.map(([uk, eu, cm]) => (
                <Box component="tr" key={uk} sx={allSizes.includes(uk) ? { '& td': { fontWeight: 700 } } : { '& td': { color: shop.ink3 } }}>
                  <td>{uk}</td><td>{eu}</td><td>{cm}</td>
                </Box>
              ))}
            </tbody>
          </Box>
          <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: shop.ink2 }}>Bold sizes come in this style.</Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
