import { useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { motion, useScroll, useReducedMotion } from 'motion/react';
import { Footprints, Check, ArrowRight, ShoppingBag, ShieldCheck, Zap, Sparkles, Rotate3d, Layers } from 'lucide-react';
import { tokensV2, DISPLAY_HEADING, FOCUS_RING } from './tokensV2.js';
import SwipeToBuy from './SwipeToBuy.jsx';
import { useCart } from '../store/cart.js';
import { useUi } from '../store/ui.js';
import { formatNPR } from '../lib/format.js';
import { WIDE } from '../theme/tokens.js';

const AVAILABLE_SIZES = ['6', '7', '8', '9', '10'];

export default function UrbanWalkScroll({ onQuickView }) {
  const containerRef = useRef(null);
  const reduced = useReducedMotion();
  const [selectedSize, setSelectedSize] = useState('8');

  // Mouse tilt micro-physics for interactive 3D shoe card
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const handleMouseMove = (e) => {
    if (reduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -y * 18, ry: x * 18 });
  };
  const handleMouseLeave = () => setTilt({ rx: 0, ry: 0 });

  return (
    <Box
      id="why-goldstar"
      ref={containerRef}
      sx={{
        position: 'relative',
        minHeight: { xs: '180vh', md: '220vh' },
        backgroundColor: '#050D14',
        color: '#FFFFFF',
      }}
    >
      {/* Sticky Fullscreen Viewport */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* FULL IMMERSIVE BACKGROUND: Man walking in the park wearing the shoes (Stylish stride, steady, NOT closed on scroll) */}
        <Box
          component="img"
          src="/v2/urban-man.jpg"
          alt="Stylish man walking in park wearing Goldstar grey sneakers, shoes visible on walkway"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            // Positioned at center-bottom so his feet, stepping stride, and grey sneakers are visible on the sunlit path
            objectPosition: { xs: '50% 85%', md: '50% 75%' },
            filter: 'brightness(0.85) contrast(1.05)',
            pointerEvents: 'none',
          }}
        />

        {/* Ambient Dark Cyan / Indigo Scrim for High-Contrast Overlays */}
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            inset: 0,
            background: `
              linear-gradient(90deg, rgba(3, 14, 26, 0.92) 0%, rgba(3, 14, 26, 0.6) 40%, rgba(3, 14, 26, 0.45) 70%, rgba(3, 14, 26, 0.88) 100%),
              linear-gradient(180deg, rgba(3, 14, 26, 0.75) 0%, transparent 25%, transparent 75%, rgba(3, 14, 26, 0.85) 100%)
            `,
            pointerEvents: 'none',
          }}
        />

        {/* Top Header Tag */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 20,
            pt: { xs: 2.5, md: 3.5 },
            px: { xs: 2.5, sm: 4, lg: 6 },
            maxWidth: 1440,
            mx: 'auto',
            width: '100%',
            boxSizing: 'border-box',
            pointerEvents: 'none',
          }}
        >
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
              boxShadow: '0 4px 16px rgba(0, 229, 255, 0.25)',
            }}
          >
            <Footprints size={14} />
            Everyday Stride Architecture · Kathmandu Streets
          </Box>
        </Box>

        {/* Center: Split Showcase (Left: Stylish Vibe Story · Right: Glowing 3D Aqua Shoe Card) */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 20,
            maxWidth: 1440,
            width: '100%',
            mx: 'auto',
            px: { xs: 2.5, sm: 4, lg: 6 },
            boxSizing: 'border-box',
            flexGrow: 1,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1.05fr 1fr' },
            gap: { xs: 3, lg: 6 },
            alignItems: 'center',
            minHeight: 0,
            my: 'auto',
          }}
        >
          {/* Left: Stylish Vibe Story Card (Short, Simple & Punchy) */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              maxWidth: 480,
            }}
          >
            <Typography
              component="h2"
              sx={{
                ...DISPLAY_HEADING,
                fontSize: { xs: 'clamp(28px, 6vw, 42px)', md: 'clamp(38px, 3.8vw, 54px)' },
                color: '#FFFFFF',
                lineHeight: 0.95,
                m: 0,
                textShadow: '0 4px 24px rgba(0, 0, 0, 0.9)',
              }}
            >
              CLEAN. STYLISH. EVERYDAY.
            </Typography>

            <Box
              component="p"
              lang="ne"
              sx={{
                fontFamily: '"Mukta", system-ui, sans-serif',
                fontWeight: 700,
                fontSize: { xs: 16, md: 19 },
                color: '#00E5FF',
                mt: 0.25,
                m: 0,
                textShadow: '0 2px 10px rgba(0,0,0,0.9)',
              }}
            >
              सहरको फेसन र दैनिक आराम — गोल्डस्टार।
            </Box>

            {/* 3 Short, Quick-to-Read Feature Chips */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 0.5 }}>
              {[
                'Cloud EVA Midsole · 85% Shock Absorbed',
                'Mist Suede · Zero Blisters, Stain-Resistant',
                'Non-Slip Rubber · Kathmandu Pavement Grip',
              ].map((feat) => (
                <Box
                  key={feat}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'rgba(255, 255, 255, 0.92)',
                    backgroundColor: 'rgba(4, 20, 36, 0.75)',
                    backdropFilter: 'blur(12px)',
                    p: 1.1,
                    px: 1.5,
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 229, 255, 0.28)',
                  }}
                >
                  <Sparkles size={14} color="#00E5FF" />
                  <span>{feat}</span>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Right: ATTRACTIVE 3D AQUA SECTION FOR SHOES */}
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: { xs: 'center', lg: 'flex-end' },
            }}
          >
            {/* The 3D Aqua Pedestal Card */}
            <Box
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: 480,
                borderRadius: '32px',
                backgroundColor: 'rgba(4, 20, 35, 0.88)',
                backdropFilter: 'blur(24px)',
                p: { xs: 2.5, sm: 3.5 },
                boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85), 0 0 60px rgba(0, 229, 255, 0.28)',
                border: '1.5px solid rgba(0, 229, 255, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                transition: 'transform 140ms ease-out, box-shadow 300ms ease',
                '&:hover': {
                  boxShadow: '0 36px 90px rgba(0, 0, 0, 0.9), 0 0 75px rgba(0, 229, 255, 0.4)',
                },
              }}
            >
              {/* Header Badges */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.5,
                    py: 0.45,
                    borderRadius: '999px',
                    backgroundColor: '#00E5FF',
                    color: '#031B2B',
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    boxShadow: '0 0 16px rgba(0, 229, 255, 0.6)',
                  }}
                >
                  <Rotate3d size={13} strokeWidth={2.5} />
                  <span>3D Aqua Studio</span>
                </Box>

                <Box
                  sx={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: 'rgba(255, 255, 255, 0.75)',
                  }}
                >
                  Over 35M Pairs Sold
                </Box>
              </Box>

              {/* 3D Floating Sneaker Stage with Glowing Aqua Ring */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4 / 3.2',
                  borderRadius: '24px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  overflow: 'hidden',
                  display: 'grid',
                  placeItems: 'center',
                  p: 2,
                  boxShadow: 'inset 0 0 40px rgba(0, 229, 255, 0.15)',
                }}
              >
                {/* Luminous Aqua Energy Ring below shoe */}
                <Box
                  aria-hidden="true"
                  sx={{
                    position: 'absolute',
                    bottom: '10%',
                    width: '85%',
                    height: '24%',
                    borderRadius: '50%',
                    border: '2px solid rgba(0, 229, 255, 0.55)',
                    backgroundColor: 'rgba(0, 229, 255, 0.12)',
                    boxShadow: '0 0 28px rgba(0, 229, 255, 0.45)',
                    transform: 'rotateX(60deg)',
                  }}
                />

                {/* The Clean Grey Sneaker (Clean Bug-Free Upload) */}
                <Box
                  component="img"
                  src="/v2/grey-sneakers.jpg"
                  alt="Goldstar AX Classic Retro Sneaker in Mist Grey"
                  sx={{
                    width: '90%',
                    height: '86%',
                    objectFit: 'contain',
                    position: 'relative',
                    zIndex: 2,
                    filter: 'drop-shadow(0 16px 30px rgba(0,0,0,0.18))',
                    transition: 'transform 300ms ease',
                    '&:hover': {
                      transform: 'scale(1.08) rotate(-2deg)',
                    },
                  }}
                />
              </Box>

              {/* Product Info, Price & Sizing Row */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography sx={{ fontSize: 17, fontWeight: 900, ...WIDE, color: '#FFFFFF', m: 0 }}>
                      AX Classic Retro (Mist Grey)
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: '#00E5FF', fontWeight: 700, mt: 0.25 }}>
                      मिस्ट ग्रे सिन्थेटिक स्वेड स्निकर
                    </Typography>
                  </Box>

                  <Box sx={{ textAlign: 'right' }}>
                    <Box sx={{ fontSize: 18, fontWeight: 900, color: '#00E5FF', ...WIDE }}>
                      NPR 2,000
                    </Box>
                    <Box component="s" sx={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                      NPR 2,700
                    </Box>
                  </Box>
                </Box>

                {/* UK Size Chips */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', mr: 0.5 }}>
                    UK Size:
                  </Typography>
                  {AVAILABLE_SIZES.map((size) => {
                    const isSel = size === selectedSize;
                    return (
                      <Box
                        key={size}
                        component="button"
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        aria-label={`Select UK size ${size}`}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: isSel ? '#00E5FF' : 'rgba(255, 255, 255, 0.1)',
                          color: isSel ? '#031B2B' : '#FFFFFF',
                          border: isSel ? '2px solid #FFFFFF' : '1px solid rgba(255, 255, 255, 0.2)',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'grid',
                          placeItems: 'center',
                          transition: 'all 160ms ease',
                          '&:hover': {
                            backgroundColor: isSel ? '#00E5FF' : 'rgba(0, 229, 255, 0.25)',
                          },
                          ...FOCUS_RING,
                        }}
                      >
                        {size}
                      </Box>
                    );
                  })}
                </Box>

                {/* Instant "Swipe to Buy" Slider */}
                <Box sx={{ mt: 0.5 }}>
                  <SwipeToBuy
                    product={{
                      id: 'goldstar-ax-grey',
                      slug: 'ax-classic-retro',
                      name: 'AX Classic Retro (Mist Grey)',
                      price: 2000,
                      image: '/v2/grey-sneakers.jpg',
                      colourKey: 'grey',
                      colourName: 'Alpine Mist Grey',
                    }}
                    size={selectedSize}
                  />
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 10.5,
                    color: 'rgba(255,255,255,0.65)',
                    px: 0.5,
                  }}
                >
                  <span>🚚 COD in all 77 Districts</span>
                  <span>🔄 7-Day Size Exchange</span>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Bottom Trust Ticker */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 20,
            pb: { xs: 2, md: 3 },
            px: { xs: 2.5, sm: 4, lg: 6 },
            maxWidth: 1440,
            mx: 'auto',
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.75)',
            flexWrap: 'wrap',
            gap: 1,
            pointerEvents: 'none',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShieldCheck size={16} color="#00E5FF" />
            <span>Over 35 Million Pairs Sold Across Nepal Since 1990</span>
          </Box>
          <Box
            component="span"
            lang="ne"
            sx={{ fontFamily: '"Mukta", system-ui, sans-serif', fontWeight: 700, color: '#00E5FF' }}
          >
            नेपालमा निर्मित हरेक पाइलाको भरोसा
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
