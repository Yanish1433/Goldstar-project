import { useState, useMemo } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ArrowRight, Star, ShieldCheck, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useProducts } from '../api/hooks.js';
import { formatNPR } from '../lib/format.js';
import { tokensV2, DISPLAY_HEADING, FOCUS_RING } from './tokensV2.js';
import { WIDE } from '../theme/tokens.js';

// Curated hero showcases
const HERO_SHOWCASES = [
  {
    id: 'g10-401-black',
    slug: 'g10-401',
    name: 'G10-401 Trek Edition',
    colour: 'Deep Obsidian',
    hex: '#1E1E24',
    price: 3400,
    regularPrice: 3400,
    tag: 'Trek Series Flagship',
    rating: '4.9',
    reviews: '1,280',
    terrain: 'Himalayan High Trails & Boulders',
    image: 'https://goldstarshoes.com/wp-content/uploads/2025/09/C_M09888-1-1-scaled-2.webp',
    specs: ['Diamond Rubber Lug', 'High-Density EVA Cushion', 'Reinforced Metal Eyelets', 'Water-Resistant Canvas'],
  },
  {
    id: 'ax-1-coffee',
    slug: 'ax-1-a-coffee',
    name: 'AX-1/A City Stride',
    colour: 'Kathmandu Coffee',
    hex: '#5A3D28',
    price: 3000,
    regularPrice: 3000,
    tag: 'Premium Suede Edition',
    rating: '4.8',
    reviews: '940',
    terrain: 'Urban Commute & Heritage Walks',
    image: 'https://goldstarshoes.com/wp-content/uploads/2025/09/C_M09584-2-1-scaled-2.webp',
    specs: ['Pure Synthetic Suede', 'Ultra-Lightweight Traction Sole', 'Anatomical Arch Support', 'Breathable Lining'],
  },
  {
    id: 'ax-grey',
    slug: 'ax',
    name: 'AX Classic Retro',
    colour: 'Alpine Mist Grey',
    hex: '#8D9099',
    price: 2000,
    regularPrice: 2700,
    tag: 'Limited Sale - 26% OFF',
    rating: '4.9',
    reviews: '2,150',
    terrain: 'Campus, Gym & Everyday Trail',
    image: 'https://goldstarshoes.com/wp-content/uploads/2025/09/C_M09563-2-1-1-scaled.webp',
    specs: ['Dual-Density Sole', 'Anti-Slip Tread Pattern', 'Plush Padded Collar', 'Flexible Movement'],
  },
  {
    id: 'g10-pink',
    slug: 'g10-l2102',
    name: 'G10 L2102 Trekker',
    colour: 'Wild Himalayan Berry',
    hex: '#D4738C',
    price: 3500,
    regularPrice: 3500,
    tag: 'Women’s Trek Exclusive',
    rating: '5.0',
    reviews: '620',
    terrain: 'All-Terrain Steep Ascents',
    image: 'https://goldstarshoes.com/wp-content/uploads/2025/09/C_M09747-2-1-scaled-2.webp',
    specs: ['Tailored Footbed Geometry', 'Reinforced Heel Cup', 'EVA Impact Dampening', 'Mud-Shedding Sole'],
  },
];

export default function HeroV2({ onQuickView }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeShoe = HERO_SHOWCASES[activeIdx];
  const reduced = useReducedMotion();

  // Try fetching live products from backend to enhance pricing if online
  const { data: prodData } = useProducts({ limit: 12 });
  const livePrice = useMemo(() => {
    if (!prodData?.items) return activeShoe.price;
    const match = prodData.items.find((p) => p.slug === activeShoe.slug);
    if (!match) return activeShoe.price;
    const cw = match.colourways.find((c) => c.name.toLowerCase().includes(activeShoe.colour.toLowerCase())) || match.colourways[0];
    return cw?.price || activeShoe.price;
  }, [prodData, activeShoe]);

  return (
    <Box
      component="header"
      sx={{
        position: 'relative',
        backgroundColor: tokensV2.cream,
        color: tokensV2.ink,
        pt: { xs: 4, md: 8 },
        pb: { xs: 8, md: 12 },
        overflow: 'hidden',
        borderBottom: `1px solid ${tokensV2.creamDark}`,
      }}
    >
      {/* Subtle Himalayan Topographic Lines background */}
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.035,
          pointerEvents: 'none',
          backgroundImage: `radial-gradient(${tokensV2.ink} 1.5px, transparent 1.5px)`,
          backgroundSize: '32px 32px',
        }}
      />

      <Box
        sx={{
          maxWidth: 1440,
          mx: 'auto',
          px: { xs: 2.5, sm: 4, lg: 6 },
          position: 'relative',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1.1fr 1fr' },
            gap: { xs: 5, lg: 8 },
            alignItems: 'center',
          }}
        >
          {/* Left Column: Brand Story & Call to Actions */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2.5, md: 3.5 } }}>
            {/* Heritage Pill */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.75,
                  py: 0.65,
                  borderRadius: '999px',
                  backgroundColor: tokensV2.white,
                  boxShadow: '0 2px 8px rgba(20,18,14,0.06)',
                  border: '1px solid rgba(20,18,14,0.08)',
                  fontSize: { xs: 12, md: 13 },
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: tokensV2.blue,
                }}
              >
                <Sparkles size={14} strokeWidth={2.5} color={tokensV2.gold} />
                Handcrafted in Nepal · Since 1990
              </Box>

              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  fontSize: 13,
                  fontWeight: 700,
                  color: tokensV2.inkSecondary,
                }}
              >
                <CheckCircle2 size={15} color="#0F7A4F" />
                Cash On Delivery (COD)
              </Box>
            </Box>

            {/* Main Headline */}
            <Box>
              <Typography
                component="h1"
                sx={{
                  ...DISPLAY_HEADING,
                  fontSize: { xs: 'clamp(38px, 9.5vw, 56px)', md: 'clamp(54px, 5.2vw, 76px)' },
                  lineHeight: 0.95,
                  letterSpacing: '-0.035em',
                  m: 0,
                }}
              >
                BUILT FOR HIMALAYAN ROADS &amp; CITY STREETS.
              </Typography>

              {/* Devanagari sub-headline */}
              <Box
                component="p"
                lang="ne"
                sx={{
                  fontFamily: '"Mukta", system-ui, sans-serif',
                  fontWeight: 700,
                  fontSize: { xs: 20, md: 24 },
                  color: tokensV2.blue,
                  mt: 1.5,
                  mb: 0,
                  lineHeight: 1.2,
                }}
              >
                हिमालको बाटोदेखि शहरको गलीसम्म — नेपालको आफ्नै ब्राण्ड।
              </Box>
            </Box>

            {/* Description */}
            <Typography
              sx={{
                fontSize: { xs: 16, md: 18 },
                lineHeight: 1.6,
                color: tokensV2.inkSecondary,
                maxWidth: '48ch',
                m: 0,
                fontWeight: 500,
              }}
            >
              Engineered with slip-resistant vulcanized rubber outsoles, responsive EVA shock absorption, and rugged all-day comfort. Designed in Kathmandu for every trail in Nepal.
            </Typography>

            {/* Call to Action Buttons */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap',
                pt: 1,
              }}
            >
              <Box
                component={RouterLink}
                to="/shop"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.25,
                  minHeight: 54,
                  px: { xs: 3.5, md: 4.5 },
                  borderRadius: '999px',
                  backgroundColor: tokensV2.blue,
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontSize: 16,
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  boxShadow: '0 8px 24px rgba(36,32,217,0.32)',
                  transition: `transform 200ms ${tokensV2.TRANSITION_SPRING}, background-color 200ms ease`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    backgroundColor: tokensV2.blueHover,
                  },
                  '&:active': {
                    transform: 'scale(0.98)',
                  },
                  ...FOCUS_RING,
                }}
              >
                Shop Full Collection
                <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
              </Box>

              <Box
                component={RouterLink}
                to="/shop?category=trek-collection"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  minHeight: 54,
                  px: 3.5,
                  borderRadius: '999px',
                  backgroundColor: tokensV2.white,
                  color: tokensV2.ink,
                  border: `2px solid ${tokensV2.ink}`,
                  textDecoration: 'none',
                  fontSize: 16,
                  fontWeight: 800,
                  transition: 'all 200ms ease',
                  '&:hover': {
                    backgroundColor: tokensV2.ink,
                    color: '#FFFFFF',
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: 'scale(0.98)',
                  },
                  ...FOCUS_RING,
                }}
              >
                Explore Trek Series
              </Box>
            </Box>

            {/* Social Proof & Metrics */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                gap: 2.5,
                pt: { xs: 2, md: 3 },
                borderTop: `1px solid rgba(20,18,14,0.12)`,
              }}
            >
              {[
                { number: '30+ Yrs', text: 'Heritage & Trust' },
                { number: '100%', text: 'Genuine Rubber' },
                { number: '77', text: 'Districts Delivered' },
                { number: '4.9 ★', text: 'Over 15k+ Walkers' },
              ].map((stat) => (
                <Box key={stat.text}>
                  <Box
                    sx={{
                      fontSize: { xs: 20, md: 24 },
                      fontWeight: 900,
                      ...WIDE,
                      color: tokensV2.ink,
                      lineHeight: 1,
                    }}
                  >
                    {stat.number}
                  </Box>
                  <Box
                    sx={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: tokensV2.inkMuted,
                      mt: 0.5,
                    }}
                  >
                    {stat.text}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Right Column: Interactive Featured Shoe Stage */}
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* The Main Stage Card */}
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                borderRadius: '32px',
                backgroundColor: tokensV2.white,
                p: { xs: 3, sm: 4 },
                boxShadow: tokensV2.shadowElevated,
                border: '1px solid rgba(20,18,14,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
              }}
            >
              {/* Header inside Card */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 1.5,
                }}
              >
                <Box>
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-block',
                      px: 1.25,
                      py: 0.4,
                      borderRadius: '999px',
                      backgroundColor: activeShoe.regularPrice > activeShoe.price ? tokensV2.sale : 'rgba(36,32,217,0.1)',
                      color: activeShoe.regularPrice > activeShoe.price ? '#FFFFFF' : tokensV2.blue,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {activeShoe.tag}
                  </Box>
                  <Typography
                    component="h2"
                    sx={{
                      fontSize: { xs: 22, md: 26 },
                      fontWeight: 800,
                      ...WIDE,
                      mt: 0.75,
                      m: 0,
                    }}
                  >
                    {activeShoe.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: tokensV2.inkMuted,
                      fontWeight: 600,
                    }}
                  >
                    Colour: <strong>{activeShoe.colour}</strong> · {activeShoe.terrain}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                  <Box
                    sx={{
                      fontSize: { xs: 22, md: 26 },
                      fontWeight: 900,
                      ...WIDE,
                      color: tokensV2.ink,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatNPR(livePrice)}
                  </Box>
                  {activeShoe.regularPrice > livePrice ? (
                    <Box
                      component="s"
                      sx={{
                        fontSize: 14,
                        color: tokensV2.inkMuted,
                        display: 'block',
                      }}
                    >
                      {formatNPR(activeShoe.regularPrice)}
                    </Box>
                  ) : null}
                </Box>
              </Box>

              {/* Shoe Image Box with Spring Motion */}
              <Box
                sx={{
                  position: 'relative',
                  aspectRatio: '4 / 3',
                  display: 'grid',
                  placeItems: 'center',
                  backgroundColor: tokensV2.cream,
                  borderRadius: '24px',
                  overflow: 'hidden',
                  p: { xs: 2, sm: 3 },
                }}
              >
                {/* Floating Rating Pill */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 14,
                    left: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1.25,
                    py: 0.5,
                    borderRadius: '999px',
                    backgroundColor: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(8px)',
                    fontSize: 12,
                    fontWeight: 800,
                    color: tokensV2.ink,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    zIndex: 2,
                  }}
                >
                  <Star size={14} fill={tokensV2.gold} color={tokensV2.gold} />
                  {activeShoe.rating} ({activeShoe.reviews})
                </Box>

                {/* Soft ground blur shadow */}
                <Box
                  aria-hidden="true"
                  sx={{
                    position: 'absolute',
                    bottom: '12%',
                    width: '68%',
                    height: '14%',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(20,18,14,0.18)',
                    filter: 'blur(16px)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Shoe Photo with Motion Transition */}
                <Box
                  component={motion.img}
                  key={activeShoe.id}
                  src={activeShoe.image}
                  alt={`${activeShoe.name} in ${activeShoe.colour}`}
                  initial={reduced ? false : { opacity: 0, scale: 0.94, y: 12 }}
                  animate={reduced ? undefined : { opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  sx={{
                    position: 'relative',
                    width: '92%',
                    height: '88%',
                    objectFit: 'contain',
                    mixBlendMode: 'multiply',
                    zIndex: 1,
                    transition: 'transform 300ms ease',
                    '@media (hover:hover)': {
                      '&:hover': {
                        transform: 'scale(1.05) rotate(-2deg)',
                      },
                    },
                  }}
                />
              </Box>

              {/* Specs Tag Rail */}
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                {activeShoe.specs.map((spec) => (
                  <Box
                    key={spec}
                    sx={{
                      px: 1.25,
                      py: 0.5,
                      borderRadius: '999px',
                      backgroundColor: tokensV2.cream,
                      color: tokensV2.inkSecondary,
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <CheckCircle2 size={13} color={tokensV2.blue} />
                    {spec}
                  </Box>
                ))}
              </Box>

              {/* Interactive Color Switcher Bar */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  pt: 1.5,
                  borderTop: `1px solid rgba(20,18,14,0.08)`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: tokensV2.inkSecondary }}>
                    Colorway:
                  </Typography>
                  <Box
                    role="radiogroup"
                    aria-label="Select hero sneaker colorway"
                    sx={{ display: 'flex', gap: 1 }}
                  >
                    {HERO_SHOWCASES.map((shoe, idx) => {
                      const isSelected = idx === activeIdx;
                      return (
                        <Box
                          key={shoe.id}
                          component="button"
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          aria-label={`Switch hero shoe to ${shoe.name} in ${shoe.colour}`}
                          onClick={() => setActiveIdx(idx)}
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            backgroundColor: shoe.hex,
                            border: `2px solid ${isSelected ? tokensV2.blue : '#FFFFFF'}`,
                            boxShadow: isSelected
                              ? `0 0 0 2px ${tokensV2.blue}, 0 2px 8px rgba(0,0,0,0.18)`
                              : '0 1px 4px rgba(0,0,0,0.15)',
                            cursor: 'pointer',
                            display: 'grid',
                            placeItems: 'center',
                            transition: 'transform 180ms ease, box-shadow 180ms ease',
                            '&:hover': {
                              transform: 'scale(1.15)',
                            },
                            ...FOCUS_RING,
                          }}
                        >
                          {isSelected ? (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: '#FFFFFF',
                              }}
                            />
                          ) : null}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>

                {/* Direct Link to Product */}
                <Box
                  component={RouterLink}
                  to={`/product/${activeShoe.slug}`}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: 14,
                    fontWeight: 800,
                    color: tokensV2.blue,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                    ...FOCUS_RING,
                  }}
                >
                  View Details
                  <ChevronRight size={16} strokeWidth={2.5} />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
