import { useState, useRef, Suspense, lazy } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { motion, useReducedMotion } from 'motion/react';
import { Rotate3d, ArrowRight, ShieldCheck, Check, Layers, Sparkles, Eye, Camera } from 'lucide-react';
import { tokensV2, DISPLAY_HEADING, FOCUS_RING } from './tokensV2.js';
import SwipeToBuy from './SwipeToBuy.jsx';
import { formatNPR } from '../lib/format.js';
import { WIDE } from '../theme/tokens.js';

// Lazy-load the real 3D Blender model canvas from three/ProductViewer
const ProductViewer = lazy(() => import('../three/ProductViewer.jsx'));

const G10_LAYERS = [
  {
    num: '01',
    name: 'Diamond Lug Outsole',
    nepali: 'भल्कनाइज्ड रबर सोल',
    desc: 'Heat-bonded natural rubber molded in Kathmandu with multi-directional diamond lugs that self-clean mud and grip wet mountain stone.',
  },
  {
    num: '02',
    name: 'EVA Shock Midsole',
    nepali: 'इभिए कुशन मिडसोल',
    desc: 'Dual-density compressed EVA foam dampens harsh heel strikes on downhill descents across high Himalayan passes.',
  },
  {
    num: '03',
    name: 'Rugged Synthetic Leather & Mesh',
    nepali: 'वाटर-रेसिस्टेन्ट क्यानभास',
    desc: 'Abrasion-resistant reinforced panels prevent scuffing from scree and loose gravel while allowing internal foot moisture to vent.',
  },
  {
    num: '04',
    name: 'Alloy Metal Eyelets & Ankle Shield',
    nepali: 'एङ्कल सपोर्ट र मेटल रिभेट',
    desc: 'Rust-proof alloy lace hooks provide rock-solid ankle lockdown, eliminating rollover sprains on unpredictable trail terrain.',
  },
];

const G10_PHOTOS = [
  { id: 'profile', label: 'Studio Profile', src: '/img/hero/boot-desktop.webp' },
  { id: 'sole', label: 'Traction Lug Sole', src: '/img/g10-sole.webp' },
  { id: 'trail', label: 'Expedition Boot', src: '/v2/gear-boot.jpg' },
];

export default function G10ShowcaseV2({ onQuickView }) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [activeLayer, setActiveLayer] = useState(0);
  const [viewMode, setViewMode] = useState('3d'); // '3d' (Blender model) or 'photo'
  const activePhoto = G10_PHOTOS[activePhotoIdx];
  const reduced = useReducedMotion();

  return (
    <Box
      id="g10-section"
      component="section"
      aria-labelledby="g10-heading"
      sx={{
        py: { xs: 8, md: 14 },
        backgroundColor: '#071A15',
        backgroundImage: `
          radial-gradient(circle at 15% 20%, rgba(0, 229, 255, 0.12) 0%, transparent 45%),
          radial-gradient(circle at 85% 80%, rgba(255, 184, 0, 0.1) 0%, transparent 45%)
        `,
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      {/* Background Devanagari Watermark */}
      <Box
        aria-hidden="true"
        lang="ne"
        sx={{
          position: 'absolute',
          left: '4%',
          bottom: '-6%',
          fontFamily: '"Mukta", system-ui, sans-serif',
          fontWeight: 900,
          fontSize: { xs: '38vw', md: '22vw' },
          lineHeight: 0.8,
          color: 'transparent',
          WebkitTextStroke: '1.5px rgba(255, 255, 255, 0.04)',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        जी-१०
      </Box>

      <Box
        sx={{
          maxWidth: 1440,
          mx: 'auto',
          px: { xs: 2.5, sm: 4, lg: 6 },
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Section Header */}
        <Box sx={{ maxWidth: 840, mb: { xs: 5, md: 8 } }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 0.5,
              borderRadius: '999px',
              backgroundColor: 'rgba(0, 229, 255, 0.18)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 229, 255, 0.45)',
              color: '#00E5FF',
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              mb: 1.5,
              boxShadow: '0 4px 16px rgba(0, 229, 255, 0.2)',
            }}
          >
            <Rotate3d size={14} strokeWidth={2.5} />
            3D Blender Model · G-10 Trek Architecture
          </Box>

          <Typography
            id="g10-heading"
            component="h2"
            sx={{
              ...DISPLAY_HEADING,
              fontSize: { xs: 'clamp(28px, 6vw, 44px)', md: 'clamp(40px, 4vw, 64px)' },
              color: '#FFFFFF',
              m: 0,
              textShadow: '0 4px 20px rgba(0,0,0,0.8)',
            }}
          >
            THE G-10 TREK SERIES.
          </Typography>

          <Box
            component="p"
            lang="ne"
            sx={{
              fontFamily: '"Mukta", system-ui, sans-serif',
              fontWeight: 700,
              fontSize: { xs: 17, md: 21 },
              color: tokensV2.gold,
              mt: 1,
              mb: 0,
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            }}
          >
            काठमाडौंमा थ्री-डी मोडेल गरिएको, हिमालको लागि निर्मित — घुमाएर हेर्नुहोस्।
          </Box>
        </Box>

        {/* Center: Split 3D Model Interactive Stage */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1.15fr 1fr' },
            gap: { xs: 4, lg: 6 },
            alignItems: 'center',
          }}
        >
          {/* Left: 3D Blender Model Canvas Container */}
          <Box
            sx={{
              position: 'relative',
              borderRadius: '32px',
              backgroundColor: 'rgba(12, 28, 24, 0.92)',
              backdropFilter: 'blur(24px)',
              p: { xs: 2.5, sm: 3.5 },
              border: '1.5px solid rgba(0, 229, 255, 0.35)',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.7), 0 0 50px rgba(0, 229, 255, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {/* Top Bar: View Mode Switcher (3D Model vs Photo) */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              {/* 3D vs Photo Mode Toggle */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  p: 0.5,
                  borderRadius: '999px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <Box
                  component="button"
                  type="button"
                  onClick={() => setViewMode('3d')}
                  aria-label="Switch to 3D Blender Model view"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1.5,
                    py: 0.4,
                    borderRadius: '999px',
                    backgroundColor: viewMode === '3d' ? '#00E5FF' : 'transparent',
                    color: viewMode === '3d' ? '#021B27' : '#FFFFFF',
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 900,
                    cursor: 'pointer',
                    transition: 'all 160ms ease',
                    ...FOCUS_RING,
                  }}
                >
                  <Rotate3d size={13} strokeWidth={2.5} />
                  <span>3D Model</span>
                </Box>
                <Box
                  component="button"
                  type="button"
                  onClick={() => setViewMode('photo')}
                  aria-label="Switch to Studio Photography view"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1.5,
                    py: 0.4,
                    borderRadius: '999px',
                    backgroundColor: viewMode === 'photo' ? tokensV2.gold : 'transparent',
                    color: viewMode === 'photo' ? tokensV2.ink : '#FFFFFF',
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 900,
                    cursor: 'pointer',
                    transition: 'all 160ms ease',
                    ...FOCUS_RING,
                  }}
                >
                  <Camera size={13} strokeWidth={2.5} />
                  <span>Photo</span>
                </Box>
              </Box>

              {/* Product Badge (Color swatches removed per user request) */}
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.5,
                  py: 0.4,
                  borderRadius: '999px',
                  backgroundColor: 'rgba(0, 229, 255, 0.1)',
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                  color: '#00E5FF',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                }}
              >
                <Sparkles size={13} />
                <span>Original G10-401 Edition</span>
              </Box>
            </Box>

            {/* THE 3D BLENDER MODEL STAGE */}
            <Box
              sx={{
                position: 'relative',
                aspectRatio: '4 / 3.2',
                borderRadius: '24px',
                overflow: 'hidden',
                backgroundColor: '#0D211C',
                border: '1px solid rgba(0, 229, 255, 0.25)',
                boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.6)',
              }}
            >
              {viewMode === '3d' ? (
                <Suspense
                  fallback={
                    <Box sx={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: '#00E5FF' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Rotate3d size={28} className="spin" />
                        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>Loading 3D Blender Model...</Typography>
                      </Box>
                    </Box>
                  }
                >
                  <ProductViewer
                    tier="full"
                    colourKey="black"
                  />
                  {/* Subtle 3D Interaction Pill Overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 10,
                      px: 2,
                      py: 0.5,
                      borderRadius: '999px',
                      backgroundColor: 'rgba(7, 26, 21, 0.88)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(0, 229, 255, 0.45)',
                      color: '#00E5FF',
                      fontSize: 11,
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                    }}
                  >
                    <Rotate3d size={12} strokeWidth={2.5} />
                    <span>Drag to Rotate 360° · Scroll to Zoom</span>
                  </Box>
                </Suspense>
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: tokensV2.cream,
                    p: 2,
                  }}
                >
                  <Box
                    component="img"
                    src={activePhoto.src}
                    alt={`Goldstar G10-401 Trek Edition - ${activePhoto.label}`}
                    sx={{
                      width: '88%',
                      height: '80%',
                      objectFit: 'contain',
                      mixBlendMode: 'multiply',
                      transition: 'opacity 200ms ease',
                    }}
                  />
                  {/* Real Photo Angle Selectors */}
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 0.75,
                      mt: 1,
                      zIndex: 2,
                    }}
                  >
                    {G10_PHOTOS.map((photo, idx) => (
                      <Box
                        key={photo.id}
                        component="button"
                        type="button"
                        onClick={() => setActivePhotoIdx(idx)}
                        aria-label={`View ${photo.label}`}
                        sx={{
                          px: 1.25,
                          py: 0.35,
                          borderRadius: '999px',
                          border: activePhotoIdx === idx ? '1.5px solid #071A15' : '1px solid rgba(0,0,0,0.2)',
                          backgroundColor: activePhotoIdx === idx ? '#071A15' : 'rgba(255,255,255,0.7)',
                          color: activePhotoIdx === idx ? '#FFFFFF' : '#071A15',
                          fontSize: 10.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 160ms ease',
                          ...FOCUS_RING,
                        }}
                      >
                        {photo.label}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            {/* Instant Swipe to Buy */}
            <Box sx={{ pt: 0.5 }}>
              <SwipeToBuy
                product={{
                  id: 'g10-401',
                  name: 'Goldstar G10-401 Trek Edition',
                  price: 3400,
                  image: '/img/hero/boot-desktop.webp',
                }}
              />
            </Box>

            {/* Direct Link to the full 3D interactive story at /g10 */}
            <Box
              component={RouterLink}
              to="/g10"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                color: '#00E5FF',
                fontSize: 13,
                fontWeight: 800,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
                ...FOCUS_RING,
              }}
            >
              <Rotate3d size={16} strokeWidth={2.5} />
              <span>Launch Fullscreen 3D Story Engine at /g10</span>
              <ArrowRight size={14} />
            </Box>
          </Box>

          {/* Right Column: 4 Engineering Layers Breakdown */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {G10_LAYERS.map((layer, idx) => {
              const isSelected = activeLayer === idx;
              return (
                <Box
                  key={layer.num}
                  component="button"
                  type="button"
                  onClick={() => setActiveLayer(idx)}
                  sx={{
                    p: 2.5,
                    borderRadius: '24px',
                    backgroundColor: isSelected ? 'rgba(0, 229, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(16px)',
                    border: `1.5px solid ${isSelected ? '#00E5FF' : 'rgba(255, 255, 255, 0.12)'}`,
                    boxShadow: isSelected ? '0 12px 32px rgba(0,0,0,0.4), 0 0 24px rgba(0, 229, 255, 0.18)' : 'none',
                    display: 'flex',
                    gap: 2,
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 229, 255, 0.08)',
                      borderColor: '#00E5FF',
                    },
                    ...FOCUS_RING,
                  }}
                >
                  {/* Layer Number Tag */}
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      backgroundColor: isSelected ? '#00E5FF' : 'rgba(255, 255, 255, 0.1)',
                      color: isSelected ? '#021B27' : '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 900,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {layer.num}
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', ...WIDE }}>
                        {layer.name}
                      </Typography>
                    </Box>

                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: tokensV2.gold, mt: 0.25 }}>
                      {layer.nepali}
                    </Typography>

                    <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, mt: 0.5 }}>
                      {layer.desc}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
