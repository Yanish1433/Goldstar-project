import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ArrowRight, MapPin, Award, Layers, Hammer, Phone, MessageSquare } from 'lucide-react';
import { tokensV2, DISPLAY_HEADING, FOCUS_RING } from './tokensV2.js';
import { WIDE } from '../theme/tokens.js';

const PILLARS = [
  {
    icon: Layers,
    title: 'Vulcanized Rubber Outsoles',
    description: 'Directly molded in Balaju, Kathmandu using heat-bonded natural rubber compounds for maximum abrasion resistance on rough mountain trails.',
  },
  {
    icon: Award,
    title: 'Dual-Density EVA Shock Cushion',
    description: 'Engineered footbed architecture that absorbs high-impact heel strikes and delivers cloud-like bounce over thousands of daily steps.',
  },
  {
    icon: Hammer,
    title: 'Double-Stitched Reinforcement',
    description: 'Heavy gauge multi-strand nylon stitching across all stress zones, with anti-rust alloy metal eyelets that stay rugged for years.',
  },
  {
    icon: MapPin,
    title: '100% Nepali Craftsmanship',
    description: 'Providing fair livelihood to local artisans and shoe-makers right here in Nepal, preserving genuine home-grown manufacturing pride.',
  },
];

export default function HeritageStoryV2() {
  return (
    <Box
      component="section"
      aria-labelledby="heritage-heading"
      sx={{
        position: 'relative',
        backgroundColor: tokensV2.blue,
        color: '#FFFFFF',
        py: { xs: 9, md: 16 },
        overflow: 'hidden',
      }}
    >
      {/* Background Graphic: Diamond Outsole Pattern */}
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.04,
          backgroundImage: `radial-gradient(#FFFFFF 1.5px, transparent 1.5px)`,
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
        }}
      />

      <Box
        sx={{
          maxWidth: 1440,
          mx: 'auto',
          px: { xs: 2.5, sm: 4, lg: 6 },
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Giant Devanagari Wordmark Accent */}
        <Box
          aria-hidden="true"
          lang="ne"
          sx={{
            fontFamily: '"Mukta", system-ui, sans-serif',
            fontWeight: 800,
            fontSize: { xs: 'clamp(64px, 18vw, 160px)', md: 'clamp(120px, 14vw, 220px)' },
            lineHeight: 0.85,
            color: 'transparent',
            WebkitTextStroke: `2px ${tokensV2.gold}`,
            opacity: 0.85,
            mb: { xs: 3, md: 5 },
            userSelect: 'none',
            letterSpacing: '0.02em',
          }}
        >
          गोल्डस्टार
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '6fr 6fr' },
            gap: { xs: 6, lg: 10 },
            alignItems: 'start',
          }}
        >
          {/* Left Column: Story Editorial */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                alignSelf: 'flex-start',
                px: 2,
                py: 0.6,
                borderRadius: '999px',
                backgroundColor: 'rgba(255, 184, 0, 0.2)',
                color: tokensV2.gold,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Proudly Made in Nepal
            </Box>

            <Typography
              component="h2"
              id="heritage-heading"
              sx={{
                ...DISPLAY_HEADING,
                fontSize: { xs: 'clamp(34px, 8.5vw, 48px)', md: 'clamp(46px, 4.5vw, 64px)' },
                m: 0,
                color: '#FFFFFF',
              }}
            >
              Crafted in Kathmandu for Every Road in Nepal.
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: 16, md: 19 },
                lineHeight: 1.65,
                color: 'rgba(255,255,255,0.88)',
                fontWeight: 400,
                maxWidth: '48ch',
                m: 0,
              }}
            >
              For over three decades, Goldstar has carried generations of Nepali walkers: school children, daily city commuters, farmers, police, and Himalayan trekkers. Every stitch and lug is forged for enduring resilience.
            </Typography>

            {/* Quick Actions / Hotline */}
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
                  gap: 1,
                  minHeight: 52,
                  px: 4,
                  borderRadius: '999px',
                  backgroundColor: tokensV2.white,
                  color: tokensV2.blue,
                  textDecoration: 'none',
                  fontSize: 16,
                  fontWeight: 800,
                  transition: 'all 200ms ease',
                  '&:hover': {
                    backgroundColor: tokensV2.gold,
                    color: tokensV2.ink,
                    transform: 'translateY(-2px)',
                  },
                  ...FOCUS_RING,
                }}
              >
                Shop Authentic Goldstar
                <ArrowRight size={18} strokeWidth={2.5} />
              </Box>

              <Box
                component="a"
                href="tel:+9779801235097"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  minHeight: 52,
                  px: 3,
                  borderRadius: '999px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontSize: 15,
                  fontWeight: 700,
                  transition: 'all 200ms ease',
                  '&:hover': {
                    borderColor: '#FFFFFF',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                  ...FOCUS_RING,
                }}
              >
                <Phone size={17} />
                Call +977-9801235097
              </Box>
            </Box>
          </Box>

          {/* Right Column: 4 Craftsmanship Pillars */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 2.5,
            }}
          >
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <Box
                  key={pillar.title}
                  sx={{
                    p: 3,
                    borderRadius: '24px',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.16)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    transition: 'transform 240ms ease, background-color 240ms ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      backgroundColor: 'rgba(255,255,255,0.12)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      backgroundColor: tokensV2.gold,
                      color: tokensV2.ink,
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Icon size={22} strokeWidth={2.25} />
                  </Box>

                  <Typography
                    component="h3"
                    sx={{
                      fontSize: 18,
                      fontWeight: 800,
                      ...WIDE,
                      color: '#FFFFFF',
                      m: 0,
                    }}
                  >
                    {pillar.title}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 14,
                      lineHeight: 1.55,
                      color: 'rgba(255,255,255,0.8)',
                      m: 0,
                    }}
                  >
                    {pillar.description}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
