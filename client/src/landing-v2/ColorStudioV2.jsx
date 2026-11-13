import { useState, useMemo } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ArrowRight, Palette, Check, Sparkles } from 'lucide-react';
import { useProducts } from '../api/hooks.js';
import { formatNPR } from '../lib/format.js';
import { tokensV2, DISPLAY_HEADING, FOCUS_RING } from './tokensV2.js';
import { WIDE } from '../theme/tokens.js';

export default function ColorStudioV2() {
  const { data: qData } = useProducts({ limit: 48 });
  const items = qData?.items || [];

  // Group all available colourways across all products
  const colorGroups = useMemo(() => {
    const map = new Map();
    items.forEach((product) => {
      product.colourways?.forEach((c) => {
        if (!c.image) return;
        const group = map.get(c.name) || {
          name: c.name,
          hex: c.hex,
          shoes: [],
        };
        group.shoes.push({
          product,
          colourway: c,
        });
        map.set(c.name, group);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.shoes.length - a.shoes.length);
  }, [items]);

  const [activeColor, setActiveColor] = useState(null);
  const selectedGroup = colorGroups.find((g) => g.name === activeColor) || colorGroups[0];

  if (!colorGroups.length) return null;

  return (
    <Box
      component="section"
      aria-labelledby="color-studio-heading"
      sx={{
        py: { xs: 8, md: 14 },
        backgroundColor: '#071612',
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(0, 229, 255, 0.09) 0%, transparent 45%),
          radial-gradient(circle at 80% 80%, rgba(255, 184, 0, 0.08) 0%, transparent 45%),
          linear-gradient(180deg, #070A0F 0%, #071612 100%)
        `,
        color: '#FFFFFF',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          maxWidth: 1440,
          mx: 'auto',
          px: { xs: 2, sm: 3.5, lg: 6 },
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'flex-end' },
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2.5,
            mb: { xs: 4, md: 5 },
          }}
        >
          <Box sx={{ maxWidth: 680 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 1.75,
                py: 0.45,
                borderRadius: '999px',
                backgroundColor: 'rgba(0, 229, 255, 0.16)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 229, 255, 0.45)',
                color: '#00E5FF',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                mb: 1.5,
              }}
            >
              <Palette size={15} />
              Tactile Palette Experience
            </Box>

            <Typography
              component="h2"
              id="color-studio-heading"
              sx={{
                ...DISPLAY_HEADING,
                fontSize: { xs: 'clamp(28px, 7vw, 42px)', md: 'clamp(38px, 3.8vw, 54px)' },
                color: '#FFFFFF',
                m: 0,
                lineHeight: 1.05,
              }}
            >
              Shop By Signature Colour.
            </Typography>

            <Box
              component="p"
              lang="ne"
              sx={{
                fontFamily: '"Mukta", system-ui, sans-serif',
                fontWeight: 700,
                fontSize: { xs: 15, md: 18 },
                color: tokensV2.gold,
                mt: 0.5,
                mb: 1,
              }}
            >
              प्रकृति र हिमालबाट प्रेरित — आफ्नो मनपर्ने रंग रोज्नुहोस्।
            </Box>

            <Typography
              sx={{
                fontSize: { xs: 14, md: 16 },
                color: 'rgba(255, 255, 255, 0.72)',
                lineHeight: 1.5,
                maxWidth: '52ch',
                m: 0,
              }}
            >
              Pick your aesthetic from nature-inspired mountain shades, classic leather tones, and vibrant street accents.
            </Typography>
          </Box>
        </Box>

        {/* Color Palette Swatch Tabs with Smooth Mobile Horizontal Scrolling */}
        <Box
          role="radiogroup"
          aria-label="Filter shoes by colorway"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            overflowX: 'auto',
            pb: 1.5,
            mb: { xs: 4, md: 6 },
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {colorGroups.map((group) => {
            const isSelected = group.name === selectedGroup.name;
            return (
              <Box
                key={group.name}
                component="button"
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setActiveColor(group.name)}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.25,
                  minHeight: 46,
                  pl: 1,
                  pr: 2,
                  borderRadius: '999px',
                  backgroundColor: isSelected ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                  color: isSelected ? '#00E5FF' : 'rgba(255, 255, 255, 0.85)',
                  border: `1.5px solid ${isSelected ? '#00E5FF' : 'rgba(255, 255, 255, 0.16)'}`,
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 180ms ease',
                  boxShadow: isSelected ? '0 0 16px rgba(0, 229, 255, 0.45)' : 'none',
                  '&:hover': {
                    borderColor: '#00E5FF',
                    transform: 'translateY(-2px)',
                  },
                  ...FOCUS_RING,
                }}
              >
                {/* Tactile Color Swatch Circle */}
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    backgroundColor: group.hex,
                    border: '2px solid #FFFFFF',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {isSelected ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
                </Box>
                <span>{group.name}</span>
                <Box
                  component="span"
                  sx={{
                    px: 0.85,
                    py: 0.15,
                    borderRadius: '999px',
                    backgroundColor: isSelected ? 'rgba(0, 229, 255, 0.25)' : 'rgba(255, 255, 255, 0.12)',
                    fontSize: 11,
                    fontWeight: 900,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {group.shoes.length}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Selected Colorway Showcase Grid (Swipe on Mobile, 4-Col on Desktop) */}
        <Box
          component="ul"
          sx={{
            listStyle: 'none',
            m: 0,
            p: 0,
            display: { xs: 'flex', sm: 'grid' },
            gridTemplateColumns: { sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: { xs: 2.25, md: 3 },
            overflowX: { xs: 'auto', sm: 'visible' },
            scrollSnapType: { xs: 'x mandatory', sm: 'none' },
            scrollPadding: '16px',
            pb: { xs: 2, sm: 0 },
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {selectedGroup.shoes.map(({ product, colourway }) => (
            <Box
              component="li"
              key={`${product.slug}-${colourway.key}`}
              sx={{
                flex: { xs: '0 0 280px', sm: 'auto' },
                scrollSnapAlign: { xs: 'start', sm: 'none' },
                display: 'flex',
              }}
            >
              <Box
                component={RouterLink}
                to={`/product/${product.slug}?colour=${colourway.key}`}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  borderRadius: '26px',
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(16px)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  p: 2.5,
                  border: '1.5px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
                  transition: 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 260ms ease, border-color 260ms ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    borderColor: 'rgba(0, 229, 255, 0.45)',
                    boxShadow: '0 20px 48px rgba(0, 0, 0, 0.6), 0 0 28px rgba(0, 229, 255, 0.18)',
                    '& img': {
                      transform: 'scale(1.08) rotate(-3deg)',
                    },
                  },
                  ...FOCUS_RING,
                }}
              >
                {/* Image Stage */}
                <Box
                  sx={{
                    position: 'relative',
                    aspectRatio: '1 / 0.92',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: '20px',
                    p: 2,
                    display: 'grid',
                    placeItems: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    component="img"
                    src={colourway.image.thumb || colourway.image.src}
                    alt={`${product.name} in ${colourway.name}`}
                    loading="lazy"
                    decoding="async"
                    sx={{
                      width: '92%',
                      height: '92%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 14px 20px rgba(0, 0, 0, 0.65))',
                      transition: 'transform 360ms cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                  />
                </Box>

                {/* Details */}
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                  <Box>
                    <Box sx={{ fontSize: 11, fontWeight: 900, color: '#00E5FF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {colourway.name}
                    </Box>
                    <Typography
                      component="h3"
                      sx={{
                        fontSize: { xs: 16, md: 18 },
                        fontWeight: 800,
                        ...WIDE,
                        color: '#FFFFFF',
                        lineHeight: 1.15,
                        m: 0,
                        mt: 0.3,
                      }}
                    >
                      {product.name}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ fontSize: 18, fontWeight: 900, ...WIDE, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>
                      {formatNPR(colourway.price || product.price)}
                    </Box>

                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: '#00E5FF',
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      <span>Shop Color</span>
                      <ArrowRight size={14} />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
