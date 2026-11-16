import { useCallback, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { useTitle } from '../components/Page.jsx';
import { tokensV2 as t } from './tokensV2.js';
import Hero3D from './Hero3D.jsx';
import Marquee from './Marquee.jsx';
import Categories from './Categories.jsx';
import G10Band from './G10Band.jsx';
import ShoeRail from './ShoeRail.jsx';
import Heritage from './Heritage.jsx';
import Reviews3DV2 from './Reviews3DV2.jsx';
import QuickViewModal from './QuickViewModal.jsx';
import { useRefreshOnResize } from './motion.js';

// The store's front page ("/"), direction "dark-room": one warm near-black ground from top to bottom, ivory ink and
// Goldstar gold as the single accent (tokensV2.js is the only file here with colour values).
//   1 Hero3D      cinematic 3D hero: poster first, the G10 in WebGL on idle, scroll push-in, hand-off
//   2 Marquee     what Goldstar promises
//   3 Categories  Men / Women / Kids / Trek index
//   4 G10Band     featured G10-401, links to the 3D story at /g10
//   5 ShoeRail    the shoe shelf: pinned horizontal rail (desktop) / scroll-snap row (touch)
//   6 Heritage    Made in Nepal, full-bleed Himalaya
//   7 Reviews3DV2 the Goldstar reviews (kept, retinted)
// The Footer comes from Layout.
export default function LandingV2() {
  useTitle('Goldstar · Made in Nepal, built for the Himalaya');
  const rootRef = useRef(null);
  useRefreshOnResize(rootRef);
  const [modal, setModal] = useState({ open: false, product: null, colour: null });
  const openQuickView = useCallback((product, colour) => setModal({ open: true, product, colour }), []);
  const close = useCallback(() => setModal((m) => ({ ...m, open: false })), []);

  return (
    <Box
      ref={rootRef}
      id="landing-v2"
      sx={{
        position: 'relative',
        mt: 'calc(var(--appbar-h, 64px) * -1)',
        backgroundColor: t.ground,
        color: t.ivory,
        overflowX: 'clip',
        '& ::selection': { backgroundColor: t.gold, color: t.onGold },
      }}
    >
      <Hero3D />
      <Marquee />
      <Categories />
      <G10Band />
      <ShoeRail onQuickView={openQuickView} />
      <Heritage />
      <Reviews3DV2 />
      <QuickViewModal open={modal.open} onClose={close} product={modal.product} initialColour={modal.colour} />
    </Box>
  );
}
