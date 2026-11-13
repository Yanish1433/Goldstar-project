import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ArrowRight, Compass, Shield, Feather, Sparkles } from 'lucide-react';
import { tokensV2, DISPLAY_HEADING, FOCUS_RING } from './tokensV2.js';
import { WIDE } from '../theme/tokens.js';

const TERRAINS = [
  {
    id: 'trek',
    category: 'trek-collection',
    title: 'Himalayan Trek & High Trails',
    tagline: 'High-Altitude Grip · Ankle Protection',
    description: 'Deep diamond lug rubber outsoles engineered for muddy ridges, rocky ascents, and mountain passes across Annapurna, Langtang, and Everest routes.',
    linkText: 'Explore Trek Collection',
    bg: tokensV2.pine,
    color: '#FFFFFF',
    accentColor: tokensV2.gold,
    image: 'https://goldstarshoes.com/wp-content/uploads/2025/09/C_M09888-1-1-scaled-2.webp',
    icon: Compass,
    colSpan: { xs: 12, lg: 7 },
    minHeight: { xs: 340, md: 420 },
    stats: ['Rubber Lug Outsole', 'Metal Eyelets', 'EVA Midsole'],
  },
  {
    id: 'casual',
    category: 'casual',
    title: 'City Streets & Daily Commute',
    tagline: 'All-Day Cloud Comfort · Synthetic Suede',
    description: 'Ultra-lightweight traction soles paired with anatomical arch support for bustling streets, heritage stairs, and 10,000 daily steps.',
    linkText: 'Shop City Casuals',
    bg: tokensV2.cream,
    color: tokensV2.ink,
    accentColor: tokensV2.blue,
    image: 'https://goldstarshoes.com/wp-content/uploads/2025/09/C_M09584-2-1-scaled-2.webp',
    icon: Feather,
    colSpan: { xs: 12, lg: 5 },
    minHeight: { xs: 320, md: 420 },
    stats: ['Ultra-Lightweight', 'Arch Support', 'Breathable Mesh'],
  },
  {
    id: 'slip-resistant',
    category: 'trending',
    title: 'Slip-Resistant Traction Sole',
    tagline: 'Monsoon Ready · Wet Surface Grip',
    description: 'Dual-density vulcanized rubber treads that bite into slippery wet marble and slick mountain clay.',
    linkText: 'Shop Traction Styles',
    bg: tokensV2.white,
    color: tokensV2.ink,
    accentColor: '#0F7A4F',
    image: 'https://goldstarshoes.com/wp-content/uploads/2025/09/C_M09563-2-1-1-scaled.webp',
    icon: Shield,
    colSpan: { xs: 12, md: 6, lg: 5 },
    minHeight: { xs: 300, md: 360 },
    stats: ['Slip Tested', 'Shock Dampening'],
  },
  {
    id: 'new-arrivals',
    category: 'new-arrival',
    title: 'New Releases & Fresh Colorways',
    tagline: 'Straight Off the Kathmandu Factory Line',
    description: 'Fresh seasonal drops combining timeless Nepalese heritage with contemporary streetwear silhouettes.',
    linkText: 'See New Drops',
    bg: tokensV2.ink,
    color: '#FFFFFF',
    accentColor: tokensV2.gold,
    image: 'https://goldstarshoes.com/wp-content/uploads/2025/09/C_M09747-2-1-scaled-2.webp',
    icon: Sparkles,
    colSpan: { xs: 12, md: 6, lg: 7 },
    minHeight: { xs: 300, md: 360 },
    stats: ['Fresh 2026 Batches', 'COD Available Nationwide'],
  },
];

export default function BentoTerrainV2() {
  return (
    <Box
      component="section"
      aria-labelledby="terrain-heading"
      sx={{
        py: { xs: 8, md: 14 },
        backgroundColor: tokensV2.white,
        color: tokensV2.ink,
      }}
    >
      <Box
        sx={{
          maxWidth: 1440,
          mx: 'auto',
          px: { xs: 2.5, sm: 4, lg: 6 },
        }}
      >
        {/* Section Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 2,
            mb: { xs: 4, md: 6 },
          }}
        >
          <Box sx={{ maxWidth: '640px' }}>
            <Box
              component="p"
              sx={{
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: tokensV2.blue,
                m: 0,
                mb: 1,
              }}
            >
              Tailored For Where You Walk
            </Box>
            <Typography
              component="h2"
              id="terrain-heading"
              sx={{
                ...DISPLAY_HEADING,
                fontSize: { xs: 'clamp(32px, 8vw, 44px)', md: 'clamp(42px, 4vw, 56px)' },
                m: 0,
              }}
            >
              Engineered For Nepal’s Diverse Terrain.
            </Typography>
            <Typography
              sx={{
                mt: 1.5,
                fontSize: { xs: 15, md: 17 },
                color: tokensV2.inkSecondary,
                lineHeight: 1.6,
              }}
            >
              From steep Himalayan rock scrambles to rainy monsoon roads and campus pavements, find the purpose-built shoe for your path.
            </Typography>
          </Box>

          <Box
            component={RouterLink}
            to="/shop"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 3,
              py: 1.5,
              borderRadius: '999px',
              border: `2px solid ${tokensV2.ink}`,
              color: tokensV2.ink,
              textDecoration: 'none',
              fontSize: 15,
              fontWeight: 800,
              transition: 'all 200ms ease',
              '&:hover': {
                backgroundColor: tokensV2.ink,
                color: '#FFFFFF',
              },
              ...FOCUS_RING,
            }}
          >
            Browse All Styles
            <ArrowRight size={17} strokeWidth={2.5} aria-hidden="true" />
          </Box>
        </Box>

        {/* Bento Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: { xs: 2.5, md: 3.5 },
          }}
        >
          {TERRAINS.map((item) => {
            const Icon = item.icon;
            return (
              <Box
                key={item.id}
                component={RouterLink}
                to={`/shop?category=${item.category}`}
                sx={{
                  gridColumn: {
                    xs: `span 12`,
                    md: `span ${item.colSpan.md || 12}`,
                    lg: `span ${item.colSpan.lg}`,
                  },
                  position: 'relative',
                  borderRadius: '28px',
                  backgroundColor: item.bg,
                  color: item.color,
                  p: { xs: 3, sm: 4.5 },
                  minHeight: item.minHeight,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                  overflow: 'hidden',
                  border: item.bg === tokensV2.white ? `1px solid rgba(20,18,14,0.12)` : 'none',
                  boxShadow: tokensV2.shadowCard,
                  transition: 'transform 280ms cubic-bezier(0.22,1,0.36,1), box-shadow 280ms ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: tokensV2.shadowElevated,
                    '& .bento-img': {
                      transform: 'scale(1.08) rotate(-4deg)',
                    },
                    '& .cta-btn': {
                      transform: 'translateX(4px)',
                    },
                  },
                  ...FOCUS_RING,
                }}
              >
                {/* Background Illustration / Shoe */}
                <Box
                  aria-hidden="true"
                  sx={{
                    position: 'absolute',
                    right: { xs: '-8%', sm: '-4%', md: '2%' },
                    bottom: { xs: '-10%', sm: '-6%', md: '0%' },
                    width: { xs: '65%', sm: '50%', md: '48%' },
                    maxWidth: 360,
                    aspectRatio: '1 / 1',
                    pointerEvents: 'none',
                  }}
                >
                  <Box
                    component="img"
                    className="bento-img"
                    src={item.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      mixBlendMode: item.bg === tokensV2.white || item.bg === tokensV2.cream ? 'multiply' : 'normal',
                      filter: item.bg === tokensV2.ink || item.bg === tokensV2.pine ? 'drop-shadow(0 16px 32px rgba(0,0,0,0.45))' : 'none',
                      transition: 'transform 400ms cubic-bezier(0.22,1,0.36,1)',
                    }}
                  />
                </Box>

                {/* Card Top Content */}
                <Box sx={{ position: 'relative', zIndex: 1, maxWidth: { xs: '100%', sm: '70%', md: '60%' } }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '999px',
                      backgroundColor: 'rgba(255,255,255,0.14)',
                      backdropFilter: 'blur(8px)',
                      color: item.accentColor,
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      mb: 1.5,
                    }}
                  >
                    <Icon size={14} strokeWidth={2.5} />
                    {item.tagline}
                  </Box>

                  <Typography
                    component="h3"
                    sx={{
                      ...DISPLAY_HEADING,
                      fontSize: { xs: 24, sm: 28, md: 32 },
                      color: item.color,
                      m: 0,
                    }}
                  >
                    {item.title}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 1.25,
                      fontSize: { xs: 14, md: 15 },
                      lineHeight: 1.5,
                      opacity: 0.85,
                      fontWeight: 500,
                    }}
                  >
                    {item.description}
                  </Typography>
                </Box>

                {/* Card Bottom: Specs & Link */}
                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    pt: { xs: 4, md: 3 },
                  }}
                >
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {item.stats.map((s) => (
                      <Box
                        key={s}
                        sx={{
                          px: 1.25,
                          py: 0.4,
                          borderRadius: '999px',
                          backgroundColor: 'rgba(255,255,255,0.12)',
                          fontSize: 11,
                          fontWeight: 700,
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        {s}
                      </Box>
                    ))}
                  </Box>

                  <Box
                    className="cta-btn"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      fontSize: 15,
                      fontWeight: 800,
                      color: item.accentColor,
                      transition: 'transform 200ms ease',
                    }}
                  >
                    {item.linkText}
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
