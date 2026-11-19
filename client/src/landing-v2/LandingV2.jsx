import { useCallback, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { useTitle } from '../components/Page.jsx';
import { tokensV2 as t } from './tokensV2.js';
import KineticHero from './KineticHero.jsx';
import Ticker from './Ticker.jsx';
import CategoryCards from './CategoryCards.jsx';
import PopShelf from './PopShelf.jsx';
import DetailGallery from './DetailGallery.jsx';
import Heritage from './Heritage.jsx';
import Reviews3DV2 from './Reviews3DV2.jsx';
import AdventureFinale from './AdventureFinale.jsx';
import QuickViewModal from './QuickViewModal.jsx';
import { useRefreshOnResize } from './motion.js';
import { useLandingLenis } from './smooth.js';

// The store's front page ("/"): a scroll story. Every section has its own move, all scrubbed to the scroll (so
// they run backwards when you scroll up), all on one easing family, one duration scale and one palette (white / cream, navy ink, royal blue, sand).
//   1 KineticHero      the headline flies apart, the group photo's sky floods the screen, the arch glides to the centre
//   2 Ticker           the collection names, driven sideways by the scroll in opposite directions
//   3 CategoryCards    three tall photo cards (Trek Everyday, Sneakers, Casual Shoes) rise in, photos drift inside
//   4 PopShelf         the centrepiece: shoes pop up out of their plinths (quick view + add to cart)
//   5 DetailGallery    pinned horizontal strip of close-ups with counter-parallax
//   6 Heritage         a blue arch rises, then a sand "50" counts with the scroll
//   7 Reviews3DV2      the Goldstar reviews (kept)
//   8 AdventureFinale  the /g10 finale on the landing: "Your adventure begins now.", the star, GOLDSTAR edge to edge
// Display type: the global Archivo Variable on its width axis (KINETIC in tokensV2), no landing-only font file.
// Smooth scrolling: Lenis on the GSAP ticker (smooth.js), desktop only. No WebGL on this page; the G10 3D story is one link away (/g10). The Footer comes from Layout.
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
        // The AppBar is fixed; Layout's spacer holds its height. The landing pulls up under it: the hero is white and
        // the bar is transparent (navy ink) over it until the first scroll, then frosted white.
        mt: 'calc(var(--appbar-h, 64px) * -1)',
        backgroundColor: t.ground,
        color: t.ink,
        overflowX: 'clip',
        '& ::selection': { backgroundColor: t.blue, color: t.onBlue },
      }}
    >
      <KineticHero />
      <Ticker />
      <CategoryCards />
      <PopShelf onQuickView={openQuickView} />
      <DetailGallery />
      <Heritage />
      <Reviews3DV2 />
      <AdventureFinale />
      <QuickViewModal open={modal.open} onClose={close} product={modal.product} initialColour={modal.colour} />
    </Box>
  );
}
