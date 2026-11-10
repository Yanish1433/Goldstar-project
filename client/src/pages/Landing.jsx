import { Suspense, lazy, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { useTitle } from '../components/Page.jsx';
import { useProduct } from '../api/hooks.js';
import { detectTier } from '../three/tier.js';
import { brand } from '../theme/tokens.js';
import Showcase from '../landing/Showcase.jsx';
import BuyBar from '../landing/BuyBar.jsx';

// Everything below the showcase is a lazy chunk fetched after the page has loaded (the showcase is 5+ screens tall, so
// none of it is near the viewport at first paint): the first-paint bundle carries only the hero, the header and the Buy bar.
const ColourStrip = lazy(() => import('../landing/ColourStrip.jsx'));
const ShopRange = lazy(() => import('../landing/ShopRange.jsx'));
const MadeInNepal = lazy(() => import('../landing/MadeInNepal.jsx'));

function useAfterLoad() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    let t;
    const go = () => {
      t = setTimeout(() => setOk(true), 200);
    };
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go, { once: true });
    return () => {
      window.removeEventListener('load', go);
      clearTimeout(t);
    };
  }, []);
  return ok;
}

// The store's front page: an Apple-style launch page for the G10-401 (dark cinematic showcase with the 3D boot),
// then the colourways, the range and the brand story on light and navy bands. The 3D is a lazy chunk mounted after
// first paint; static-tier devices and reduced motion get the poster and a plain flowing page instead.
const reducedNow = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function Landing() {
  useTitle(null);
  const { data: product } = useProduct('g10-401');
  const [tier] = useState(() => detectTier());
  const [reduced, setReduced] = useState(reducedNow);
  const flow = reduced || tier === 'static';
  const below = useAfterLoad();

  // Phones: the floating WhatsApp button stands down on the landing (the Buy bar carries it).
  useEffect(() => {
    document.documentElement.dataset.landing = '';
    return () => {
      delete document.documentElement.dataset.landing;
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(!!mq.matches);
    mq?.addEventListener?.('change', on);
    return () => mq?.removeEventListener?.('change', on);
  }, []);

  return (
    <Box id="landing" data-flow={flow ? 'true' : 'false'} sx={{ position: 'relative', mt: 'calc(var(--appbar-h, 64px) * -1)', backgroundColor: brand.night, color: brand.onNight, overflowX: 'clip' }}>
      <Showcase product={product} tier={tier} flow={flow} />
      <BuyBar product={product} />
      {below ? (
        <Suspense fallback={<Box sx={{ minHeight: { xs: 2600, md: 1900 } }} />}>
          <ColourStrip product={product} />
          <ShopRange />
          <MadeInNepal />
        </Suspense>
      ) : (
        <Box sx={{ minHeight: { xs: 2600, md: 1900 } }} />
      )}
    </Box>
  );
}
