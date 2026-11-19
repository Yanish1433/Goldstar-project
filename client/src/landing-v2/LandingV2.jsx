import { useCallback, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import GlobalStyles from '@mui/material/GlobalStyles';
import { useTitle } from '../components/Page.jsx';
import { tokensV2 as t } from './tokensV2.js';
import KineticHero from './KineticHero.jsx';
import Ticker from './Ticker.jsx';
import CollectionStack from './CollectionStack.jsx';
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
//   3 CollectionStack  Women / Men / Kids as a deck of sticky cards that slide up and pile over each other (white ground)
//   4 CategoryCards    three tall photo cards (Trek Everyday, Sneakers, Casual Shoes) rise in, photos drift inside (cream)
//   5 PopShelf         the centrepiece: shoes pop up out of their plinths (quick view + add to cart)
//   6 DetailGallery    pinned horizontal strip of close-ups with counter-parallax
//   7 Heritage         a blue arch rises, then a sand "50" counts with the scroll
//   8 Reviews3DV2      the Goldstar reviews (kept)
//   9 AdventureFinale  pinned, slow finale: "Your adventure begins now.", the star, GOLDSTAR letter by letter
// Display type: the global Archivo Variable on its width axis (KINETIC in tokensV2); the one landing-only font is the
// hero headline's brush face (HERO_SCRIPT, below).
// Smooth scrolling: Lenis on the GSAP ticker (smooth.js), desktop only. No WebGL on this page; the G10 3D story is one link away (/g10). The Footer comes from Layout.
// The hero headline's brush face: a ~11 KB latin-caps woff2 (preloaded on / in index.html), swap, with a local
// Impact fallback scaled to the brush's width ("WALK THE": 3.63 em vs Impact's 3.84 em) so the swap shifts nothing.
const HERO_FONT_FACES = `
@font-face { font-family: "Caveat Brush Hero"; font-style: normal; font-weight: 400; font-display: swap; src: url(/fonts/caveat-brush-hero.woff2) format("woff2"); }
@font-face { font-family: "Caveat Brush Hero Fallback"; src: local("Impact"); size-adjust: 94.5%; ascent-override: 101%; descent-override: 32%; line-gap-override: 0%; }
`;

export default function LandingV2() {
  useTitle('Goldstar · Walking the world for over five decades');
  const rootRef = useRef(null);
  useRefreshOnResize(rootRef);
  useLandingLenis(); // smooth wheel scrolling on desktop (off on touch and under reduced motion)
  const [modal, setModal] = useState({ open: false, product: null, colour: null });
  const openQuickView = useCallback((product, colour) => setModal({ open: true, product, colour }), []);
  const close = useCallback(() => setModal((m) => ({ ...m, open: false })), []);

  return (
    <>
    <GlobalStyles styles={HERO_FONT_FACES} />
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
      <CollectionStack />
      <CategoryCards />
      <PopShelf onQuickView={openQuickView} />
      <DetailGallery />
      <Heritage />
      <Reviews3DV2 />
      <AdventureFinale />
      <QuickViewModal open={modal.open} onClose={close} product={modal.product} initialColour={modal.colour} />
    </Box>
    </>
  );
}
