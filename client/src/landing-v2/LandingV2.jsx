import { useCallback, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import GlobalStyles from '@mui/material/GlobalStyles';
import { useTitle } from '../components/Page.jsx';
import { tokensV2 as t } from './tokensV2.js';
import KineticHero from './KineticHero.jsx';
import Ticker from './Ticker.jsx';
import CollectionStack from './CollectionStack.jsx';
import PopShelf from './PopShelf.jsx';
import DetailGallery from './DetailGallery.jsx';
import Heritage from './Heritage.jsx';
import Reviews3DV2 from './Reviews3DV2.jsx';
import QuickViewModal from './QuickViewModal.jsx';
import { useRefreshOnResize } from './motion.js';
import { useLandingLenis } from './smooth.js';

// The store's front page ("/"): a scroll story. Every section has its own move, all scrubbed to the scroll (so
// they run backwards when you scroll up), all on one easing family, one duration scale and one accent (gold).
//   1 KineticHero      the headline splits apart, the ivory window opens from the centre, the pair scales up
//   2 Ticker           the collection names, driven sideways by the scroll in opposite directions
//   3 CollectionStack  sticky cards that pile up and sink back (Trek Everyday, Sneak into Comfort, Women, Kids)
//   4 PopShelf         the centrepiece: shoes pop up out of their plinths (quick view + add to cart)
//   5 DetailGallery    pinned horizontal strip of close-ups with counter-parallax
//   6 Heritage         a "50" that counts with the scroll over a photo zooming out
//   7 Reviews3DV2      the Goldstar reviews (kept)
// Smooth scrolling: Lenis on the GSAP ticker (smooth.js), desktop only. No WebGL on this page; the G10 3D story is one link away (/g10). The Footer comes from Layout.
// The display face is self-hosted (public/fonts, preloaded in index.html) and declared here, so it only exists on
// the landing; the size-adjusted local fallback keeps the swap from moving the layout.
const FONT_CSS = `
@font-face {
  font-family: 'Sofia Sans XC';
  src: url(/fonts/sofia-sans-extra-condensed-latin-var.woff2) format('woff2');
  font-weight: 1 1000;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2212;
}
@font-face {
  font-family: 'Sofia Sans XC Fallback';
  src: local('Arial Narrow'), local('ArialNarrow'), local('Arial');
  size-adjust: 78%;
  ascent-override: 122%;
  descent-override: 32%;
  line-gap-override: 0%;
}`;
const fontFaces = <GlobalStyles styles={FONT_CSS} />;

export default function LandingV2() {
  useTitle('Goldstar · Walking the world for over five decades');
  const rootRef = useRef(null);
  useRefreshOnResize(rootRef);
  useLandingLenis(); // smooth wheel scrolling on desktop (off on touch and under reduced motion)
  const [modal, setModal] = useState({ open: false, product: null, colour: null });
  const openQuickView = useCallback((product, colour) => setModal({ open: true, product, colour }), []);
  const close = useCallback(() => setModal((m) => ({ ...m, open: false })), []);

  return (
    <Box
      ref={rootRef}
      id="landing-v2"
      className="gs-landing"
      sx={{
        position: 'relative',
        // The AppBar is fixed; Layout's spacer holds its height. The landing pulls up under it: the hero is dark and
        // the bar is transparent over it until the first scroll.
        mt: 'calc(var(--appbar-h, 64px) * -1)',
        backgroundColor: t.ground,
        color: t.ivory,
        overflowX: 'clip',
        '& ::selection': { backgroundColor: t.gold, color: t.onGold },
      }}
    >
      {fontFaces}
      <KineticHero />
      <Ticker />
      <CollectionStack />
      <PopShelf onQuickView={openQuickView} />
      <DetailGallery />
      <Heritage />
      <Reviews3DV2 />
      <QuickViewModal open={modal.open} onClose={close} product={modal.product} initialColour={modal.colour} />
    </Box>
  );
}
