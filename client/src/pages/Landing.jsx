import { Suspense, lazy, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { useTitle } from '../components/Page.jsx';
import { land } from '../theme/tokens.js';
import StoreHero from '../landing/StoreHero.jsx';

// Below the hero, every section is a lazy chunk fetched after the page has loaded: the first-paint bundle carries
// only the header and the hero.
const Below = lazy(() => import('../landing/LandingBelow.jsx'));

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

// The store's front page: Goldstar's whole line-up. A hero with a moving wall of every colourway and quick ways into
// the catalogue, then categories, tabbed shelves, the sale, the G10 3D feature, shop-by-colour and the brand story.
// The G10's own scroll-driven 3D story lives at /g10.
export default function Landing() {
  useTitle(null);
  const below = useAfterLoad();
  const spacer = <Box sx={{ minHeight: { xs: 3200, md: 2800 } }} />;

  return (
    <Box id="landing" sx={{ position: 'relative', mt: 'calc(var(--appbar-h, 64px) * -1)', backgroundColor: land.cream, color: land.ink, overflowX: 'clip' }}>
      <StoreHero />
      {below ? <Suspense fallback={spacer}><Below /></Suspense> : spacer}
    </Box>
  );
}
