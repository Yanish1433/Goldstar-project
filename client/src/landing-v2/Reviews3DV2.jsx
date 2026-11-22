import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Star, CheckCircle, Quote, ThumbsUp } from 'lucide-react';
import { tokensV2, DISPLAY_HEADING } from './tokensV2.js';
import { WIDE } from '../theme/tokens.js';
import SideDoodles, { useSideScrub } from './SideDoodles.jsx';
const SIDE = [
  { k: 'boot', x: -510, y: 130, w: 64, rot: -6, d: 36, tilt: 5, c: 'blue', o: 0.6 },
  { k: 'star', x: -500, y: 240, w: 36, rot: 12, d: 30, spin: 140, o: 0.9 },
  { k: 'star', x: -380, y: 300, w: 20, rot: -10, d: 26, spin: -140, o: 0.9 },
  { k: 'hightop', x: 510, y: 140, w: 60, rot: 6, d: 36, tilt: -5, c: 'ink', o: 0.5 },
  { k: 'star', x: 500, y: 236, w: 30, rot: -12, d: 30, spin: -140, o: 0.9 },
  { k: 'feet', x: 420, y: 296, w: 44, rot: 8, d: 26, tilt: 5, c: 'blue', o: 0.55 },
  { k: 'star', x: -300, b: 34, w: 26, rot: 10, d: 28, spin: 120, o: 0.9 },
  { k: 'star', x: 300, b: 40, w: 22, rot: -10, d: 28, spin: -120, o: 0.9 },
  { k: 'boot', s: 'r', top: '70%', w: 62, rot: 5, d: 130, tilt: 5, c: 'ink', o: 0.5 },
  { ph: true, k: 'hightop', lx: 14, y: 10, w: 36, rot: 5, d: 17, tilt: -4, c: 'ink', o: 0.55 },
  { ph: true, k: 'star', lx: 86, y: 20, w: 16, rot: -10, d: 14, spin: 120, o: 0.9 },
  { ph: true, k: 'star', lx: 50, b: 20, w: 18, rot: 12, d: 14, spin: -120, o: 0.9 },
];

const REVIEWS = [
  {
    name: 'Bikash Shrestha',
    location: 'Pokhara, Kaski',
    shoe: 'Everest Hiking Boot (G10 Series)',
    rating: 5,
    title: 'Flawless grip on Mardi Himal trek!',
    body: 'Took these straight up to Mardi High Camp through wet mud and freezing scree. Zero blisters, insane traction on the rubber lugs, and they dried super fast. Best value trek shoes in Nepal.',
    verified: 'Verified Trekker Purchase',
    date: 'February 2026',
    terrain: 'Alpine Rock & Mud',
  },
  {
    name: 'Pooja Thapa',
    location: 'Lalitpur, Patan',
    shoe: 'AX Classic Retro (Mist Grey)',
    rating: 5,
    title: 'Looks like high-end designer suede, lasts forever',
    body: 'The synthetic suede feels plush and premium. I wear them to university and coffee shops every day. Everyone asks where I got them — so proud to say they are authentic Goldstars!',
    verified: 'Verified Buyer',
    date: 'January 2026',
    terrain: 'Campus & Urban Walk',
  },
  {
    name: 'Suman Gurung',
    location: 'Dharan, Sunsari',
    shoe: 'Junior Pace Runner & AX',
    rating: 5,
    title: 'Delivered in 2 days, paid COD at doorstep',
    body: 'Seamless order experience! The courier called before delivery, I checked the shoes right in front of him, and paid cash. The size 9 fit true to size. Super lightweight and comfortable.',
    verified: 'Verified Buyer',
    date: 'March 2026',
    terrain: 'City Commute',
  },
];

function Card3D({ rev }) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -y * 12, ry: x * 12 });
  };

  const handleMouseLeave = () => setTilt({ rx: 0, ry: 0 });

  return (
    <Box
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      sx={{
        perspective: '1000px',
        display: 'flex',
      }}
    >
      <Box
        component="article"
        sx={{
          width: '100%',
          p: { xs: 3, sm: 3.5 },
          borderRadius: '24px',
          backgroundColor: tokensV2.cream,
          color: tokensV2.ink,
          border: `1px solid ${tokensV2.lineOnPaper}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: tokensV2.shadowCard,
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: 'transform 120ms ease-out, box-shadow 240ms ease',
          '&:hover': {
            boxShadow: tokensV2.shadowElevated,
          },
        }}
      >
        <Box>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {Array.from({ length: rev.rating }, (_, i) => (
                <Star key={i} size={16} fill={tokensV2.sand} color={tokensV2.sandDeep} />
              ))}
            </Box>
            <Box
              sx={{
                fontSize: 11,
                fontWeight: 800,
                color: tokensV2.inkSecondary,
                backgroundColor: tokensV2.blueWash,
                px: 1,
                py: 0.3,
                borderRadius: '999px',
              }}
            >
              {rev.terrain}
            </Box>
          </Box>

          <Typography
            component="h3"
            sx={{
              fontSize: 18,
              fontWeight: 800,
              ...WIDE,
              m: 0,
              mb: 1,
            }}
          >
            "{rev.title}"
          </Typography>

          <Typography
            sx={{
              fontSize: { xs: 15, md: 14 }, // phones: body text >= 15px
              lineHeight: 1.6,
              color: tokensV2.inkSecondary,
              m: 0,
            }}
          >
            {rev.body}
          </Typography>
        </Box>

        {/* Author Footer */}
        <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${tokensV2.lineOnPaper}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Box sx={{ fontSize: 15, fontWeight: 800, color: tokensV2.ink }}>
                {rev.name}
              </Box>
              <Box sx={{ fontSize: 12, color: tokensV2.inkMuted }}>
                {rev.location} · <strong style={{ color: tokensV2.ink }}>{rev.shoe}</strong>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: 11,
                fontWeight: 800,
                color: tokensV2.inkSecondary,
              }}
            >
              <CheckCircle size={14} />
              Verified
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function Reviews3DV2() {
  const sideRef = useSideScrub();
  return (
    <Box
      id="reviews-section"
      component="section"
      aria-labelledby="reviews-heading"
      sx={{
        position: 'relative',
        py: { xs: 8, md: 14 },
        backgroundColor: tokensV2.ground,
        color: tokensV2.ink,
      }}
    >
      <SideDoodles items={SIDE} layerRef={sideRef} />
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1440,
          mx: 'auto',
          px: { xs: 2.5, sm: 4, lg: 6 },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            textAlign: 'center',
            maxWidth: '680px',
            mx: 'auto',
            mb: { xs: 5, md: 7 },
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              px: 2,
              py: 0.5,
              borderRadius: '999px',
              backgroundColor: tokensV2.sandSoft,
              color: tokensV2.ink,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              mb: 1.5,
            }}
          >
            <Star size={14} fill={tokensV2.sand} color={tokensV2.sandDeep} />
            Rated 4.9/5 by 3,450+ Nepali Walkers
          </Box>

          <Typography
            component="h2"
            id="reviews-heading"
            sx={{
              ...DISPLAY_HEADING,
              fontSize: { xs: 'clamp(32px, 8vw, 44px)', md: 'clamp(42px, 4vw, 56px)' },
              m: 0,
            }}
          >
            Tested on the Trails. Loved in the City.
          </Typography>

          <Typography
            sx={{
              mt: 1.5,
              fontSize: { xs: 15, md: 17 },
              color: tokensV2.ink2,
              lineHeight: 1.6,
            }}
          >
            Real feedback from customers across all 77 districts who trust Goldstar every single day.
          </Typography>
        </Box>

        {/* 3D Review Cards Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
          }}
        >
          {REVIEWS.map((rev) => (
            <Card3D key={rev.name} rev={rev} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
