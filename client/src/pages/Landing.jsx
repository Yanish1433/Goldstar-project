import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { useTitle } from '../components/Page.jsx';
import { useProduct } from '../api/hooks.js';
import { detectTier } from '../three/tier.js';
import { brand } from '../theme/tokens.js';
import Showcase from '../landing/Showcase.jsx';
import BuyBar from '../landing/BuyBar.jsx';
import ColourStrip from '../landing/ColourStrip.jsx';
import ShopRange from '../landing/ShopRange.jsx';
import MadeInNepal from '../landing/MadeInNepal.jsx';

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
      <ColourStrip product={product} />
      <ShopRange />
      <MadeInNepal />
    </Box>
  );
}
