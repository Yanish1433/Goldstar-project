import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ArrowRight, Tag, Zap, Clock, CheckCircle2 } from 'lucide-react';
import { useProducts } from '../api/hooks.js';
import { formatNPR } from '../lib/format.js';
import { tokensV2, DISPLAY_HEADING, FOCUS_RING } from './tokensV2.js';
import { WIDE } from '../theme/tokens.js';

export default function SaleSpotlightV2({ onQuickView }) {
  const { data: qData } = useProducts({ limit: 48 });
  const items = qData?.items || [];

  // Filter products with real discounts
  const salePairs = useMemo(() => {
    return items.flatMap((p) =>
      p.colourways
        .filter((c) => c.regularPrice > c.price && c.image)
        .slice(0, 1)
        .map((c) => ({
          product: p,
          colour: c,
          savings: c.regularPrice - c.price,
          discountPercent: Math.round(((c.regularPrice - c.price) / c.regularPrice) * 100),
        }))
    );
  }, [items]);

  if (!salePairs.length) return null;
  const maxSavings = Math.max(...salePairs.map((s) => s.savings), 700);

  return (
    <Box
      component="section"
      aria-labelledby="sale-heading"
      sx={{
        position: 'relative',
        backgroundColor: tokensV2.tangerine,
        color: tokensV2.ink,
        py: { xs: 8, md: 14 },
        overflow: 'hidden',
      }}
    >
      {/* Decorative Giant Typography Watermark */}
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          right: { xs: -20, md: -10 },
          top: { xs: -40, md: -80 },
          fontWeight: 900,
          ...WIDE,
          fontSize: { xs: '38vw', md: '24vw' },
          lineHeight: 0.8,
          color: 'rgba(20,18,14,0.06)',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        छुट SALE
      </Box>

      <Box
        sx={{
          maxWidth: 1440,
          mx: 'auto',
          px: { xs: 2.5, sm: 4, lg: 6 },
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '5fr 7fr' },
            gap: { xs: 5, lg: 8 },
            alignItems: 'center',
          }}
        >
          {/* Left Column: Callout & Guarantee */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                alignSelf: 'flex-start',
                px: 1.75,
                py: 0.5,
                borderRadius: '999px',
                backgroundColor: tokensV2.ink,
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              <Zap size={14} color={tokensV2.gold} />
              Limited Factory Surplus Offer
            </Box>

            <Typography
              component="h2"
              id="sale-heading"
              sx={{
                ...DISPLAY_HEADING,
                fontSize: { xs: 'clamp(34px, 8.5vw, 50px)', md: 'clamp(46px, 4.5vw, 64px)' },
                m: 0,
                color: tokensV2.ink,
              }}
            >
              Save Up to {formatNPR(maxSavings)} Per Pair.
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: 16, md: 18 },
                lineHeight: 1.6,
                color: 'rgba(20,18,14,0.85)',
                fontWeight: 500,
                maxWidth: '44ch',
                m: 0,
              }}
            >
              Genuine Goldstar AX and casual series at factory-direct pricing while current warehouse batches last. No credit card required — pay cash upon doorstep arrival.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 1 }}>
              {[
                '100% Cash On Delivery in all 77 Districts',
                '7-Day No-Questions Size Exchange',
                'Delivered via Express Courier in 2-4 Days',
              ].map((point) => (
                <Box key={point} sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 14, fontWeight: 700 }}>
                  <CheckCircle2 size={16} color={tokensV2.ink} />
                  <span>{point}</span>
                </Box>
              ))}
            </Box>

            <Box sx={{ pt: 1 }}>
              <Box
                component={RouterLink}
                to="/shop?sort=price_asc"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.25,
                  minHeight: 52,
                  px: 4,
                  borderRadius: '999px',
                  backgroundColor: tokensV2.ink,
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontSize: 16,
                  fontWeight: 800,
                  transition: 'all 200ms ease',
                  '&:hover': {
                    backgroundColor: '#000000',
                    transform: 'translateY(-2px)',
                  },
                  ...FOCUS_RING,
                }}
              >
                Shop All Discounted Pairs
                <ArrowRight size={18} strokeWidth={2.5} />
              </Box>
            </Box>
          </Box>

          {/* Right Column: Featured Sale Pairs Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 2.5,
            }}
          >
            {salePairs.slice(0, 4).map(({ product, colour, savings, discountPercent }) => (
              <Box
                key={product.slug}
                component={RouterLink}
                to={`/product/${product.slug}?colour=${colour.key}`}
                sx={{
                  position: 'relative',
                  backgroundColor: tokensV2.white,
                  color: tokensV2.ink,
                  borderRadius: '24px',
                  p: 2.5,
                  textDecoration: 'none',
                  boxShadow: '0 12px 32px rgba(20,18,14,0.14)',
                  transition: 'transform 260ms ease, box-shadow 260ms ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 18px 48px rgba(20,18,14,0.22)',
                    '& img': {
                      transform: 'scale(1.08) rotate(-3deg)',
                    },
                  },
                  ...FOCUS_RING,
                }}
              >
                {/* Discount Badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    px: 1.25,
                    py: 0.4,
                    borderRadius: '999px',
                    backgroundColor: tokensV2.sale,
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    zIndex: 2,
                  }}
                >
                  Save {formatNPR(savings)} ({discountPercent}% OFF)
                </Box>

                {/* Photo Stage */}
                <Box
                  sx={{
                    position: 'relative',
                    aspectRatio: '1 / 1',
                    borderRadius: '18px',
                    backgroundColor: tokensV2.cream,
                    p: 2,
                    display: 'grid',
                    placeItems: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    component="img"
                    src={colour.image?.thumb || colour.image?.src}
                    alt={`${product.name} in ${colour.name}`}
                    loading="lazy"
                    decoding="async"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      mixBlendMode: 'multiply',
                      transition: 'transform 360ms ease',
                    }}
                  />
                </Box>

                {/* Details */}
                <Box>
                  <Typography
                    component="h3"
                    sx={{
                      fontSize: 18,
                      fontWeight: 800,
                      ...WIDE,
                      m: 0,
                    }}
                  >
                    {product.name}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: tokensV2.inkMuted, mt: 0.25 }}>
                    Colorway: {colour.name}
                  </Typography>

                  {/* Price */}
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
                    <Box
                      sx={{
                        fontSize: 20,
                        fontWeight: 900,
                        ...WIDE,
                        color: tokensV2.sale,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatNPR(colour.price)}
                    </Box>
                    <Box component="s" sx={{ fontSize: 14, color: tokensV2.inkMuted }}>
                      {formatNPR(colour.regularPrice)}
                    </Box>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
