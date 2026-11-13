import { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useTitle } from '../components/Page.jsx';
import { tokensV2, FOCUS_RING } from './tokensV2.js';
import TrekHeroScroll from './TrekHeroScroll.jsx';
import UrbanWalkScroll from './UrbanWalkScroll.jsx';
import GearCollectionV2 from './GearCollectionV2.jsx';
import G10ShowcaseV2 from './G10ShowcaseV2.jsx';
import WomensSectionV2 from './WomensSectionV2.jsx';
import KidsSectionV2 from './KidsSectionV2.jsx';
import ShelvesV2 from './ShelvesV2.jsx';
import ColorStudioV2 from './ColorStudioV2.jsx';
import HeritageStoryV2 from './HeritageStoryV2.jsx';
import Reviews3DV2 from './Reviews3DV2.jsx';
import QuickViewModal from './QuickViewModal.jsx';

export default function LandingV2() {
  useTitle('Goldstar 3D · Cinematic Nepal Footwear & Gear');
  const [modalData, setModalData] = useState({ open: false, product: null, colour: null });

  const handleOpenQuickView = (product, colour) => {
    setModalData({ open: true, product, colour });
  };

  const handleCloseQuickView = () => {
    setModalData((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box
      id="landing-v2"
      sx={{
        position: 'relative',
        mt: 'calc(var(--appbar-h, 64px) * -1)',
        pt: 'var(--appbar-h, 64px)',
        backgroundColor: '#070A0F',
        color: '#FFFFFF',
        overflowX: 'clip',
      }}
    >
      {/* 1. Cinematic Scrolling Story: The Trekking Woman climbing the Himalayas with popping gear */}
      <TrekHeroScroll onQuickView={handleOpenQuickView} />

      {/* 2. Scrolling Animation: "Why Goldstar" / Urban Stride with grey sneaker pop-out */}
      <UrbanWalkScroll onQuickView={handleOpenQuickView} />

      {/* 3. The Goldstar Trek Collection Breakdown (Jacket, Rucksack, Pants, Boot) */}
      <GearCollectionV2 />

      {/* 3.5. Dedicated G-10 Trek Footwear Showcase (Layer Breakdown & Colorway Switcher) */}
      <G10ShowcaseV2 onQuickView={handleOpenQuickView} />

      {/* 4. Dedicated Women's Section */}
      <WomensSectionV2 onQuickView={handleOpenQuickView} />

      {/* 5. Dedicated Kids' Section */}
      <KidsSectionV2 />

      {/* 6. All Footwear & Shelves Curator */}
      <Box id="all-shoes">
        <ShelvesV2 onQuickView={handleOpenQuickView} />
      </Box>

      {/* 7. Signature Mountain Color Studio */}
      <ColorStudioV2 />

      {/* 8. Authentic Nepal Heritage Story */}
      <HeritageStoryV2 />

      {/* 9. 3D Tilt Community Reviews */}
      <Reviews3DV2 />

      {/* Quick View Modal */}
      <QuickViewModal
        open={modalData.open}
        onClose={handleCloseQuickView}
        product={modalData.product}
        initialColour={modalData.colour}
      />
    </Box>
  );
}
