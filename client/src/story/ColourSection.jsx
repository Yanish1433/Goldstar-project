import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
const Dialog = lazy(() => import('@mui/material/Dialog'));
import IconButton from '@mui/material/IconButton';
import { X } from 'lucide-react';
import { PAGE_PX } from '../components/Page.jsx';
import Swatches from '../components/Swatches.jsx';
import SizePicker from '../components/SizePicker.jsx';
import ProductPhoto from '../components/ProductPhoto.jsx';
import Price from '../components/Price.jsx';
import { makeLine, addToCartNow, notifyAdded } from '../lib/addToCart.js';
import { useCart } from '../store/cart.js';
import { useUi } from '../store/ui.js';
import { tokens } from '../theme/tokens.js';
import { useStory } from './store.js';
import { useStoryCtx } from './StoryContext.jsx';
import LineReveal from '../components/LineReveal.jsx';
import { Section } from './Sections.jsx';

const frameWide = { px: PAGE_PX, mx: 'auto', maxWidth: 1440, width: '100%', boxSizing: 'border-box', height: '100%', position: 'relative' };

export function PhotoRail({ images, alt, onOpen, vertical }) {
  return (
    <Box component="ul" aria-label="Photos of the real G10-401" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: vertical ? 'column' : 'row', gap: '12px', flexShrink: 0, overflowX: vertical ? 'visible' : 'auto' }}>
      {images.slice(0, vertical ? 6 : 4).map((im, i) => (
        <li key={im.src}>
          <Box component="button" type="button" onClick={() => onOpen(i)} aria-label={`Open photo ${i + 1} of ${alt}`} sx={{ p: 0, border: 0, cursor: 'pointer', background: 'none', width: { xs: 64, md: 88 }, display: 'block', '&:hover': { outline: `2px solid ${tokens.gold}` } }}>
            <ProductPhoto image={{ src: im.thumb, thumb: im.thumb }} alt="" sizes="88px" eager />
          </Box>
        </li>
      ))}
    </Box>
  );
}

export default function ColourSection({ product }) {
  const { reduced, progress } = useStoryCtx();
  const layout = useStory((s) => s.layout);
  const tier = useStory((s) => s.tier);
  const colourKey = useStory((s) => s.colourKey);
  const setColour = useStory((s) => s.setColour);
  const flightActive = useStory((s) => s.flightActive);
  const phone = layout === 'phone';
  const [size, setSize] = useState(null);
  const [sizeError, setSizeError] = useState(false);
  const [open, setOpen] = useState(null);
  const sizeRef = useRef(null);

  const colours = product?.colourways || [];
  // Prefetch the other colourways' rail thumbs on idle so a colour switch shows its photos at once.
  useEffect(() => {
    if (!colours.length) return undefined;
    const run = () => colours.forEach((cw) => (cw.images || []).slice(0, 6).forEach((im) => { const i = new Image(); i.referrerPolicy = 'no-referrer'; i.src = im.thumb; }));
    const id = 'requestIdleCallback' in window ? window.requestIdleCallback(run, { timeout: 3000 }) : setTimeout(run, 1500);
    return () => ('cancelIdleCallback' in window ? window.cancelIdleCallback(id) : clearTimeout(id));
  }, [product]); // eslint-disable-line react-hooks/exhaustive-deps
  const colour = colours.find((c) => c.key === colourKey) || colours[0];

  useEffect(() => {
    if (colours.length && !colours.some((c) => c.key === colourKey)) setColour(colours[0].key);
  }, [colours, colourKey, setColour]);

  if (!product || !colour) {
    return (
      <Section id="story-colour">
        <Box sx={{ position: 'sticky', top: 0, height: '100svh', pt: 'var(--appbar-h, 96px)', boxSizing: 'border-box' }}>
          <Box sx={{ ...frameWide, display: 'flex', alignItems: 'center' }}>
            <Typography variant="h2" component="h2" id="story-colour-h" sx={{ fontSize: { xs: 'clamp(30px, 8.4vw, 76px)', sm: 'clamp(34px, 4.6vw, 76px)' } }}>Pick your colour</Typography>
          </Box>
        </Box>
      </Section>
    );
  }

  const images = colour.images || [];
  const onPick = (k) => {
    setColour(k);
    setSize(null);
    setSizeError(false);
  };

  const add = () => {
    if (!size) {
      setSizeError(true);
      sizeRef.current?.querySelector('button')?.focus();
      return;
    }
    if (flightActive) return;
    const line = makeLine(product, colour, size, 1);
    if (tier === 'static' || reduced) {
      addToCartNow(line);
      return;
    }
    const cart = useCart.getState();
    const res = cart.add(line);
    if (!res.ok) {
      useUi.getState().showSnackbar({ message: 'Your cart is full (10 lines). Remove one to add another.' });
      return;
    }
    cart.startFlight();
    useStory.getState().requestFlight(line);
    // Safety net: if the canvas cannot finish the flight (tab hidden, canvas lost), land it anyway.
    const timer = setTimeout(() => {
      if (useStory.getState().flightActive) {
        useStory.getState().endFlightState();
        useCart.getState().endFlight();
        notifyAdded(line);
      }
    }, 8000);
    useStory.setState({ flightTimer: timer }); // cleared by the canvas when the flight lands normally
  };

  const copy = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, md: 3 }, minWidth: 0, flex: 1, maxWidth: { md: 460 } }}>
      <LineReveal component="h2" variant="h2" id="story-colour-h" text="Pick your colour" progress={progress} inS={[665, 695]} sx={{ fontSize: { xs: 'clamp(30px, 8.4vw, 76px)', sm: 'clamp(34px, 4.6vw, 76px)' } }} />
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'wrap' }}>
        <Price variant="price" price={colour.price} regularPrice={colour.regularPrice} component="p" />
        <Typography variant="body1" aria-live="polite">
          {colour.name}
          {colour.nameNe ? <> &middot; <span lang="ne" style={{ fontFamily: 'Mukta' }}>{colour.nameNe}</span></> : null}
        </Typography>
      </Box>
      <Swatches colourways={colours} value={colour.key} onChange={onPick} />
      <SizePicker ref={sizeRef} sizes={colour.sizes} value={size} onChange={(v) => { setSize(v); if (v) setSizeError(false); }} error={sizeError} id="story-size" />
      <Box>
        <Button variant="contained" size="large" onClick={add} aria-disabled={flightActive} sx={{ minWidth: 200, opacity: flightActive ? 0.85 : 1 }}>
          {flightActive ? 'Adding…' : 'Add to cart'}
        </Button>
      </Box>
      {!phone ? <Typography variant="caption" color="text.secondary">Photos: the real G10-401. 3D: a stand-in sneaker.</Typography> : null}
    </Box>
  );

  return (
    <Section id="story-colour">
      <Box sx={{ position: 'sticky', top: 0, height: '100svh', pt: 'var(--appbar-h, 96px)', boxSizing: 'border-box', overflow: 'hidden' }}>
        <Box sx={{ ...frameWide, display: 'flex', gap: 3, alignItems: phone ? 'flex-end' : 'center', pb: phone ? 2 : 0 }}>
          {!phone ? <PhotoRail images={images} alt={`${product.name} ${colour.name}`} onOpen={setOpen} vertical /> : null}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1, minWidth: 0 }}>
            {phone ? (
              <>
                {copy}
                <PhotoRail images={images} alt={`${product.name} ${colour.name}`} onOpen={setOpen} />
                <Typography variant="caption" color="text.secondary">Photos: the real G10-401. 3D: a stand-in sneaker.</Typography>
              </>
            ) : copy}
          </Box>
        </Box>
      </Box>
      {open !== null ? (
      <Suspense fallback={null}>
      <Dialog open onClose={() => setOpen(null)} maxWidth="md" fullWidth aria-label={`${product.name} ${colour.name} photo`} slotProps={{ paper: { sx: { p: { xs: 2, sm: 4 } } } }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <IconButton aria-label="Close photo" onClick={() => setOpen(null)}><X size={20} strokeWidth={1.75} aria-hidden="true" /></IconButton>
        </Box>
        {open !== null && images[open] ? <ProductPhoto image={{ src: images[open].src, thumb: images[open].src }} alt={images[open].alt || `${product.name} in ${colour.name}`} eager sizes="90vw" /> : null}
      </Dialog>
      </Suspense>
      ) : null}
    </Section>
  );
}
