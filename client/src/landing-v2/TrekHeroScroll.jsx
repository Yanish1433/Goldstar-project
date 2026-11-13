import { useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { motion, useScroll, useReducedMotion } from 'motion/react';
import { Target, Compass, Sparkles, Check, ChevronDown, CheckCircle2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { tokensV2, DISPLAY_HEADING, FOCUS_RING } from './tokensV2.js';
import SwipeToBuy from './SwipeToBuy.jsx';
import { useCart } from '../store/cart.js';
import { useUi } from '../store/ui.js';
import { formatNPR } from '../lib/format.js';
import { WIDE } from '../theme/tokens.js';

// The 4 interactive gear items precisely mapped on the climbing woman image (1024x558)
const TREK_GEAR_POINTS = [
  {
    id: 'jacket',
    step: '01',
    name: 'Himal Insulated Jacket',
    nepali: 'हिमाल इन्सुलेटेड ज्याकेट',
    x: 54, // 54% from left
    y: 44, // 44% from top
    image: '/v2/gear-jacket.jpg',
    scrollRange: [0.12, 0.38],
    price: 4500,
    regularPrice: 5200,
    simpleSpecs: ['Windproof Alpine Barrier', 'High-Loft Thermal Warmth', 'Nepal Flag Arm Patch'],
  },
  {
    id: 'rucksack',
    step: '02',
    name: 'Summit Rucksack (65L)',
    nepali: 'समिट रकस्याक ६५ लिटर',
    x: 46, // 46% from left
    y: 36, // 36% from top
    image: '/v2/gear-rucksack.jpg',
    scrollRange: [0.38, 0.62],
    price: 5200,
    regularPrice: 5900,
    simpleSpecs: ['65L Expedition Capacity', 'Padded Back Support', 'Trek Pole Lash Loops'],
  },
  {
    id: 'pants',
    step: '03',
    name: 'Adventure Cargo Pants',
    nepali: 'एडभेन्चर कार्गो प्यान्ट',
    x: 53, // 53% from left
    y: 69, // 69% from top
    image: '/v2/gear-pants.jpg',
    scrollRange: [0.62, 0.82],
    price: 2800,
    regularPrice: 3200,
    simpleSpecs: ['Tough Anti-Tear Knees', 'Water-Resistant Coating', '6 Deep Cargo Pockets'],
  },
  {
    id: 'boot',
    step: '04',
    name: 'Everest Hiking Boot (G10)',
    nepali: 'एभरेस्ट हाइकिङ बुट (जी-१०)',
    x: 58, // 58% from left
    y: 86, // 86% from top
    image: '/v2/gear-boot.jpg',
    scrollRange: [0.82, 1.00],
    price: 3400,
    regularPrice: 3800,
    simpleSpecs: ['Diamond Rubber Rock Grip', 'Shock-Absorbing EVA Sole', 'Waterproof Trail Upper'],
  },
];

export default function TrekHeroScroll({ onQuickView }) {
  const containerRef = useRef(null);
  const reduced = useReducedMotion();

  // Active gear item (defaults to 'boot' so the shoes are highlighted)
  const [activeGearId, setActiveGearId] = useState('boot');
  const [isHovering, setIsHovering] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Smooth scroll progression tracking
  scrollYProgress.on('change', (v) => {
    if (isHovering) return;
    for (const g of TREK_GEAR_POINTS) {
      if (v >= g.scrollRange[0] && v <= g.scrollRange[1]) {
        setActiveGearId(g.id);
        break;
      }
    }
  });

  const activeGear = TREK_GEAR_POINTS.find((g) => g.id === activeGearId) || TREK_GEAR_POINTS[3];

  return (
    <Box
      id="trek-story"
      ref={containerRef}
      sx={{
        position: 'relative',
        minHeight: { xs: '220vh', md: '280vh' },
        backgroundColor: '#070A0F',
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
        }}
      >
        {/* FULL IMMERSIVE BACKGROUND: Woman climbing the mountain (Subtle breathing/ambient motion) */}
        <Box
          component="img"
          src="/v2/trek-woman.jpg"
          alt="Goal: Climbing the mountain in Goldstar Everest boots"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            // Positioned center-bottom so her boots and the rocky trail remain fully visible
            objectPosition: { xs: '65% 90%', md: '55% 85%' },
            filter: 'brightness(0.92) contrast(1.05)',
            pointerEvents: 'none',
            // Gentle ambient breathing animation (kind of animated, not fully animated)
            animation: reduced ? 'none' : 'gsMountainBreathe 14s ease-in-out infinite alternate',
            '@keyframes gsMountainBreathe': {
              '0%': { transform: 'scale(1.02)' },
              '100%': { transform: 'scale(1.06)' },
            },
          }}
        />

        {/* Ambient Dark Scrim for High-Contrast Readability */}
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            inset: 0,
            background: `
              linear-gradient(90deg, rgba(7, 10, 15, 0.9) 0%, rgba(7, 10, 15, 0.6) 35%, rgba(7, 10, 15, 0.1) 65%, transparent 100%),
              linear-gradient(180deg, rgba(7, 10, 15, 0.75) 0%, transparent 25%, transparent 75%, rgba(7, 10, 15, 0.5) 100%)
            `,
            pointerEvents: 'none',
          }}
        />

        {/* Top Header: "WELCOME TO GOLDSTAR" + "SHOP ALL" options */}
        <Box
          sx={{
            position: 'absolute',
            top: { xs: 20, md: 32 },
            left: { xs: 16, sm: 28, md: 44 },
            zIndex: 20,
            maxWidth: 580,
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 1.75,
              py: 0.5,
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 184, 0, 0.25)',
              backdropFilter: 'blur(10px)',
              border: '1.5px solid rgba(255, 184, 0, 0.6)',
              color: tokensV2.gold,
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              boxShadow: '0 4px 16px rgba(255, 184, 0, 0.2)',
            }}
          >
            <Sparkles size={14} />
            Welcome to Goldstar · Nepal
          </Box>

          <Typography
            component="h1"
            sx={{
              ...DISPLAY_HEADING,
              fontSize: { xs: 'clamp(28px, 6vw, 42px)', md: 'clamp(38px, 3.8vw, 54px)' },
              color: '#FFFFFF',
              lineHeight: 0.95,
              m: 0,
              mt: 1,
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.85)',
            }}
          >
            WELCOME TO GOLDSTAR.
          </Typography>

          <Box
            component="p"
            lang="ne"
            sx={{
              fontFamily: '"Mukta", system-ui, sans-serif',
              fontWeight: 700,
              fontSize: { xs: 16, md: 19 },
              color: tokensV2.gold,
              mt: 0.5,
              mb: 1.75,
              textShadow: '0 2px 8px rgba(0,0,0,0.85)',
            }}
          >
            नेपालको आफ्नै पाइला — हिमालदेखि सहरसम्म।
          </Box>

          {/* Shop All & 3D Jump Options */}
          <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box
              component={RouterLink}
              to="/shop"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 2.75,
                py: 1,
                borderRadius: '999px',
                backgroundColor: tokensV2.gold,
                color: tokensV2.ink,
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: '0.04em',
                textDecoration: 'none',
                boxShadow: '0 8px 24px rgba(255, 184, 0, 0.45)',
                transition: 'all 200ms ease',
                '&:hover': {
                  backgroundColor: '#FFA500',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 30px rgba(255, 184, 0, 0.65)',
                },
                ...FOCUS_RING,
              }}
            >
              <span>Shop All Footwear</span>
              <ArrowRight size={16} strokeWidth={2.5} />
            </Box>

            <Box
              component={RouterLink}
              to="/g10"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 2,
                py: 1,
                borderRadius: '999px',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 800,
                textDecoration: 'none',
                transition: 'all 200ms ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.22)',
                },
                ...FOCUS_RING,
              }}
            >
              <span>Explore G10 in 3D</span>
            </Box>
          </Box>
        </Box>

        {/* Hotspots Glowing Directly Over Her Gear */}
        {TREK_GEAR_POINTS.map((g) => {
          const isSelected = g.id === activeGearId;
          return (
            <Box
              key={g.id}
              onClick={() => setActiveGearId(g.id)}
              onMouseEnter={() => {
                setIsHovering(true);
                setActiveGearId(g.id);
              }}
              onMouseLeave={() => setIsHovering(false)}
              sx={{
                position: 'absolute',
                left: `${g.x}%`,
                top: `${g.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isSelected ? 30 : 15,
                cursor: 'pointer',
              }}
            >
              <Box
                component="button"
                type="button"
                aria-label={`Select ${g.name}`}
                sx={{
                  position: 'relative',
                  width: isSelected ? 36 : 26,
                  height: isSelected ? 36 : 26,
                  borderRadius: '50%',
                  backgroundColor: isSelected ? tokensV2.gold : 'rgba(255, 255, 255, 0.85)',
                  border: '2.5px solid #FFFFFF',
                  boxShadow: isSelected
                    ? '0 0 24px rgba(255, 184, 0, 0.95), 0 0 10px rgba(0,0,0,0.7)'
                    : '0 2px 8px rgba(0,0,0,0.4)',
                  p: 0,
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  '&:hover': {
                    transform: 'scale(1.25)',
                    backgroundColor: tokensV2.gold,
                  },
                  '&::before': isSelected
                    ? {
                        content: '""',
                        position: 'absolute',
                        inset: -7,
                        borderRadius: '50%',
                        border: '2px solid rgba(255, 184, 0, 0.85)',
                        animation: 'gsPulse 2s infinite ease-out',
                        '@keyframes gsPulse': {
                          '0%': { transform: 'scale(0.8)', opacity: 1 },
                          '100%': { transform: 'scale(2.1)', opacity: 0 },
                        },
                      }
                    : undefined,
                  ...FOCUS_RING,
                }}
              >
                <Box
                  sx={{
                    width: isSelected ? 9 : 6,
                    height: isSelected ? 9 : 6,
                    borderRadius: '50%',
                    backgroundColor: tokensV2.ink,
                  }}
                />
              </Box>
            </Box>
          );
        })}

        {/* COMPACT, SIMPLIFIED PRODUCT CARD (Lower on the left, simple terms, no heavy text) */}
        <Box
          sx={{
            position: 'absolute',
            left: { xs: 16, sm: 28, md: 44 },
            bottom: { xs: 20, md: 28 },
            zIndex: 25,
            width: { xs: 'calc(100% - 32px)', sm: 360, md: 390 },
            maxWidth: 400,
          }}
        >
          {/* Frosted Glassmorphism Card */}
          <Box
            component={motion.div}
            key={activeGear.id}
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            sx={{
              backgroundColor: 'rgba(10, 14, 22, 0.9)',
              backdropFilter: 'blur(24px)',
              borderRadius: '24px',
              p: { xs: 2, sm: 2.25 },
              border: '1.5px solid rgba(255, 184, 0, 0.45)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            {/* Quick Milestone Tabs */}
            <Box sx={{ display: 'flex', gap: 0.75, overflowX: 'auto', pb: 0.25 }}>
              {TREK_GEAR_POINTS.map((g) => {
                const on = g.id === activeGearId;
                return (
                  <Box
                    key={g.id}
                    component="button"
                    type="button"
                    onClick={() => setActiveGearId(g.id)}
                    aria-label={`Select ${g.name}`}
                    sx={{
                      px: 1.25,
                      py: 0.35,
                      borderRadius: '999px',
                      backgroundColor: on ? tokensV2.gold : 'rgba(255, 255, 255, 0.1)',
                      color: on ? tokensV2.ink : '#FFFFFF',
                      border: on ? '1px solid #FFFFFF' : '1px solid rgba(255,255,255,0.15)',
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 160ms ease',
                      '&:hover': {
                        backgroundColor: on ? tokensV2.gold : 'rgba(255, 255, 255, 0.2)',
                      },
                      ...FOCUS_RING,
                    }}
                  >
                    #{g.step} {g.name.split(' ')[0]}
                  </Box>
                );
              })}
            </Box>

            {/* Product Thumbnail & Simple Info */}
            <Box sx={{ display: 'flex', gap: 1.75, alignItems: 'center' }}>
              <Box
                sx={{
                  width: { xs: 68, sm: 76 },
                  height: { xs: 68, sm: 76 },
                  borderRadius: '16px',
                  backgroundColor: '#FFFFFF',
                  p: 0.75,
                  flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                  overflow: 'hidden',
                  display: 'grid',
                  placeItems: 'center',
                  border: '1.5px solid rgba(255, 184, 0, 0.4)',
                }}
              >
                <Box
                  component="img"
                  src={activeGear.image}
                  alt={activeGear.name}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </Box>

              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: tokensV2.gold }}>
                  {activeGear.nepali}
                </Typography>

                <Typography
                  component="h3"
                  sx={{
                    fontSize: { xs: 15, sm: 17 },
                    fontWeight: 900,
                    ...WIDE,
                    color: '#FFFFFF',
                    m: 0,
                    mt: 0.25,
                    lineHeight: 1.15,
                  }}
                >
                  {activeGear.name}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Box sx={{ fontSize: 18, fontWeight: 900, color: tokensV2.gold, ...WIDE }}>
                    {formatNPR(activeGear.price)}
                  </Box>
                  <Box component="s" sx={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    {formatNPR(activeGear.regularPrice)}
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* 3 Simple, Quick-to-Read Bullets */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35 }}>
              {activeGear.simpleSpecs.map((s) => (
                <Box
                  key={s}
                  sx={{
                    fontSize: 11.5,
                    color: 'rgba(255, 255, 255, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                  }}
                >
                  <CheckCircle2 size={13} color={tokensV2.gold} />
                  <span>{s}</span>
                </Box>
              ))}
            </Box>

            {/* "Swipe to Buy" Interactive Slider */}
            <SwipeToBuy
              product={{
                id: `goldstar-${activeGear.id}`,
                name: activeGear.name,
                price: activeGear.price,
                image: activeGear.image,
              }}
            />

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 10.5,
                color: 'rgba(255,255,255,0.7)',
                px: 0.5,
              }}
            >
              <span>🚚 Cash on Delivery · All 77 Districts</span>
              <span>🔄 7-Day Free Exchange</span>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
