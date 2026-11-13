import { useState, useMemo } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Sparkles, ArrowRight, ShoppingBag, Star, Heart, Check, Flame, ShieldCheck } from 'lucide-react';
import { useProducts } from '../api/hooks.js';
import { useCart } from '../store/cart.js';
import { useUi } from '../store/ui.js';
import { formatNPR } from '../lib/format.js';
import { tokensV2, DISPLAY_HEADING, FOCUS_RING } from './tokensV2.js';
import { WIDE } from '../theme/tokens.js';

const SIZES = ['4', '5', '6', '7'];

export default function WomensSectionV2({ onQuickView }) {
  const [selectedSize, setSelectedSize] = useState('all');
  const [addedSlug, setAddedSlug] = useState(null);
  const [cardSizes, setCardSizes] = useState({}); // { [slug]: selectedSize }

  const { data: qData } = useProducts({ limit: 48 });
  const items = qData?.items || [];

  // Filter products relevant to women
  const womensProducts = useMemo(() => {
    return items.filter((p) => {
      const isWomenCat = p.categories?.includes('women');
      const hasSmallSize = p.colourways?.some((c) => c.sizes?.some((s) => ['4', '5', '6'].includes(s)));
      const isG10L = p.slug?.includes('l2102');
      return isWomenCat || hasSmallSize || isG10L;
    });
  }, [items]);

  const displayedProducts = useMemo(() => {
    if (selectedSize === 'all') return womensProducts;
    return womensProducts.filter((p) =>
      p.colourways?.some((c) => c.sizes?.includes(selectedSize))
    );
  }, [womensProducts, selectedSize]);

  const addToCart = useCart((s) => s.add);
  const showSnackbar = useUi((s) => s.showSnackbar);
  const openCart = useUi((s) => s.openCart);

  const handleQuickAdd = (p, c) => {
    const chosenSize = cardSizes[p.slug] || (selectedSize !== 'all' ? selectedSize : c.sizes?.[0] || '5');
    addToCart({
      productId: p.slug,
      name: p.name,
      colourwayKey: c.key,
      colourName: c.name,
      size: chosenSize,
      unitPrice: c.price,
      image: c.image,
      qty: 1,
    });
    setAddedSlug(p.slug);
    showSnackbar({
      message: `Added ${p.name} (${c.name}, UK ${chosenSize}) to your bag!`,
      actionLabel: 'View Bag',
      onAction: () => openCart(),
    });
    setTimeout(() => setAddedSlug(null), 2200);
  };

  const handleSelectCardSize = (slug, sz) => {
    setCardSizes((prev) => ({ ...prev, [slug]: sz }));
  };

  return (
    <Box
      id="womens-section"
      component="section"
      aria-labelledby="womens-heading"
      sx={{
        py: { xs: 8, md: 14 },
        backgroundColor: '#0A0E17',
        backgroundImage: `
          radial-gradient(circle at 10% 20%, rgba(194, 18, 79, 0.12) 0%, transparent 45%),
          radial-gradient(circle at 90% 80%, rgba(255, 184, 0, 0.08) 0%, transparent 45%),
          linear-gradient(180deg, #070A0F 0%, #0A0E17 100%)
        `,
        color: '#FFFFFF',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Decorative Floral/Topography Glyph */}
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          right: '-5%',
          top: '-10%',
          fontSize: { xs: '38vw', md: '20vw' },
          fontFamily: '"Mukta", system-ui, sans-serif',
          fontWeight: 900,
          color: 'transparent',
          WebkitTextStroke: '1px rgba(194, 18, 79, 0.08)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        नारी
      </Box>

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
        {/* Editorial Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'flex-end' },
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2.5,
            mb: { xs: 4, md: 6 },
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
                backgroundColor: 'rgba(194, 18, 79, 0.16)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(194, 18, 79, 0.45)',
                color: '#FF6584',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                mb: 1.5,
                boxShadow: '0 4px 16px rgba(194, 18, 79, 0.25)',
              }}
            >
              <Heart size={14} fill="#FF6584" />
              Engineered For Women · Trail &amp; Street
            </Box>

            <Typography
              component="h2"
              id="womens-heading"
              sx={{
                ...DISPLAY_HEADING,
                fontSize: { xs: 'clamp(28px, 7vw, 42px)', md: 'clamp(38px, 3.8vw, 54px)' },
                color: '#FFFFFF',
                m: 0,
                lineHeight: 1.05,
              }}
            >
              Women’s Trek &amp; Lifestyle Collection.
            </Typography>

            <Box
              component="p"
              lang="ne"
              sx={{
                fontFamily: '"Mukta", system-ui, sans-serif',
                fontWeight: 700,
                fontSize: { xs: 15, md: 18 },
                color: '#FF6584',
                mt: 0.5,
                mb: 1,
              }}
            >
              सशक्त पाइलाहरू — हिमाली गोरेटोदेखि सहरको फेसनसम्म।
            </Box>

            <Typography
              sx={{
                fontSize: { xs: 14, md: 16 },
                color: 'rgba(255, 255, 255, 0.72)',
                lineHeight: 1.5,
                maxWidth: '56ch',
                m: 0,
              }}
            >
              Lightweight chassis, contoured heel cups, and all-weather traction from high Himalayan mountain passes to everyday office and campus strides.
            </Typography>
          </Box>

          {/* Size Filter Pills (Smooth Mobile Horizontal Scroll) */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              width: { xs: '100%', md: 'auto' },
              overflowX: { xs: 'auto', md: 'visible' },
              pb: { xs: 1, md: 0 },
              WebkitOverflowScrolling: 'touch',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 800,
                color: 'rgba(255, 255, 255, 0.65)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
                mr: 0.5,
              }}
            >
              Filter by UK Size:
            </Typography>

            <Box
              component="button"
              type="button"
              onClick={() => setSelectedSize('all')}
              sx={{
                minWidth: 44,
                height: 38,
                px: 2,
                borderRadius: '999px',
                border: `1.5px solid ${selectedSize === 'all' ? '#FF6584' : 'rgba(255,255,255,0.18)'}`,
                backgroundColor: selectedSize === 'all' ? '#FF6584' : 'rgba(255,255,255,0.06)',
                color: selectedSize === 'all' ? '#FFFFFF' : 'rgba(255,255,255,0.85)',
                fontSize: 12,
                fontWeight: 900,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 180ms ease',
                boxShadow: selectedSize === 'all' ? '0 0 14px rgba(255,101,132,0.45)' : 'none',
                ...FOCUS_RING,
              }}
            >
              All ({womensProducts.length})
            </Box>

            {SIZES.map((sz) => {
              const count = womensProducts.filter((p) =>
                p.colourways?.some((c) => c.sizes?.includes(sz))
              ).length;
              const isSelected = selectedSize === sz;

              return (
                <Box
                  key={sz}
                  component="button"
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  sx={{
                    minWidth: 44,
                    height: 38,
                    px: 1.75,
                    borderRadius: '999px',
                    border: `1.5px solid ${isSelected ? '#FF6584' : 'rgba(255,255,255,0.18)'}`,
                    backgroundColor: isSelected ? '#FF6584' : 'rgba(255,255,255,0.06)',
                    color: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.85)',
                    fontSize: 12,
                    fontWeight: 900,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 180ms ease',
                    boxShadow: isSelected ? '0 0 14px rgba(255,101,132,0.45)' : 'none',
                    ...FOCUS_RING,
                  }}
                >
                  UK {sz} {count ? `(${count})` : ''}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Product Cards: Premium Horizontal Swipe Rail on Mobile, 4-Col Grid on Desktop */}
        <Box
          sx={{
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
          {displayedProducts.map((p, index) => {
            const firstColour = p.colourways?.find((c) => c.inStock) || p.colourways?.[0];
            const hasSale = firstColour?.regularPrice > firstColour?.price;
            const savings = hasSale ? firstColour.regularPrice - firstColour.price : 0;
            const isAdded = addedSlug === p.slug;
            const chosenSize = cardSizes[p.slug] || (selectedSize !== 'all' ? selectedSize : firstColour?.sizes?.[0] || '5');
            const availableSizes = firstColour?.sizes?.filter((s) => ['4', '5', '6', '7'].includes(s)) || SIZES;

            return (
              <Box
                key={p.slug}
                sx={{
                  flex: { xs: '0 0 280px', sm: 'auto' },
                  scrollSnapAlign: { xs: 'start', sm: 'none' },
                  backgroundColor: 'rgba(17, 24, 39, 0.75)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '26px',
                  overflow: 'hidden',
                  border: '1.5px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 260ms ease, border-color 260ms ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    borderColor: 'rgba(255, 101, 132, 0.5)',
                    boxShadow: '0 20px 48px rgba(0, 0, 0, 0.6), 0 0 24px rgba(255, 101, 132, 0.2)',
                    '& .shoe-thumb': {
                      transform: 'scale(1.08) rotate(-3deg)',
                    },
                  },
                }}
              >
                {/* Image Stage */}
                <Box
                  component={RouterLink}
                  to={`/product/${p.slug}?colour=${firstColour?.key}`}
                  sx={{
                    position: 'relative',
                    aspectRatio: '1 / 0.95',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    p: 2.5,
                    display: 'grid',
                    placeItems: 'center',
                    textDecoration: 'none',
                    overflow: 'hidden',
                    ...FOCUS_RING,
                  }}
                >
                  {/* Floating Badges */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                      zIndex: 2,
                    }}
                  >
                    {hasSale ? (
                      <Box
                        sx={{
                          px: 1.25,
                          py: 0.35,
                          borderRadius: '999px',
                          backgroundColor: '#E11D48',
                          color: '#FFFFFF',
                          fontSize: 10.5,
                          fontWeight: 900,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          boxShadow: '0 2px 8px rgba(225, 29, 72, 0.5)',
                        }}
                      >
                        Save {formatNPR(savings)}
                      </Box>
                    ) : null}

                    {index === 0 ? (
                      <Box
                        sx={{
                          px: 1.25,
                          py: 0.35,
                          borderRadius: '999px',
                          backgroundColor: '#FF6584',
                          color: '#0A0E17',
                          fontSize: 10.5,
                          fontWeight: 900,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Bestseller
                      </Box>
                    ) : null}
                  </Box>

                  {/* Soft Radial Backlight */}
                  <Box
                    aria-hidden="true"
                    sx={{
                      position: 'absolute',
                      width: '60%',
                      height: '60%',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 101, 132, 0.12)',
                      filter: 'blur(20px)',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Product Shoe Image */}
                  <Box
                    component="img"
                    className="shoe-thumb"
                    src={firstColour?.image?.thumb || firstColour?.image?.src}
                    alt={`${p.name} in ${firstColour?.name}`}
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

                {/* Card Body */}
                <Box sx={{ p: 2.25, display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                  <Box>
                    {/* Series Tag & Rating */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box
                        sx={{
                          fontSize: 11,
                          fontWeight: 900,
                          color: '#FF6584',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Women’s Series
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, fontSize: 11, fontWeight: 800, color: '#FFB800' }}>
                        <Star size={12} fill="#FFB800" />
                        <span>4.9</span>
                      </Box>
                    </Box>

                    {/* Shoe Title */}
                    <Typography
                      component="h3"
                      sx={{
                        fontSize: { xs: 16, md: 18 },
                        fontWeight: 800,
                        ...WIDE,
                        color: '#FFFFFF',
                        lineHeight: 1.15,
                        m: 0,
                      }}
                    >
                      {p.name}
                    </Typography>

                    {/* Colorway & Availability */}
                    <Typography sx={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', mt: 0.3 }}>
                      {firstColour?.name} · {p.colourways?.length || 1} colorways
                    </Typography>

                    {/* Interactive Size Chips Directly on Card */}
                    <Box sx={{ mt: 1.5 }}>
                      <Box sx={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', mb: 0.5 }}>
                        Select Size (UK):
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap' }}>
                        {availableSizes.map((sz) => {
                          const isPicked = chosenSize === sz;
                          return (
                            <Box
                              key={sz}
                              component="button"
                              type="button"
                              onClick={() => handleSelectCardSize(p.slug, sz)}
                              sx={{
                                minWidth: 32,
                                height: 26,
                                px: 0.8,
                                borderRadius: '6px',
                                border: `1px solid ${isPicked ? '#FF6584' : 'rgba(255, 255, 255, 0.18)'}`,
                                backgroundColor: isPicked ? 'rgba(255, 101, 132, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                                color: isPicked ? '#FF6584' : 'rgba(255, 255, 255, 0.85)',
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 140ms ease',
                                ...FOCUS_RING,
                              }}
                            >
                              UK {sz}
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  </Box>

                  {/* Pricing & Add Button Footer */}
                  <Box
                    sx={{
                      mt: 2,
                      pt: 1.5,
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                    }}
                  >
                    <Box>
                      <Box sx={{ fontSize: 18, fontWeight: 900, ...WIDE, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>
                        {formatNPR(firstColour?.price || p.price)}
                      </Box>
                      {hasSale ? (
                        <Box component="s" sx={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>
                          {formatNPR(firstColour.regularPrice)}
                        </Box>
                      ) : null}
                    </Box>

                    <Box
                      component="button"
                      type="button"
                      aria-label={`Add ${p.name} to cart`}
                      onClick={() => handleQuickAdd(p, firstColour)}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.6,
                        minHeight: 40,
                        px: 2,
                        borderRadius: '999px',
                        backgroundColor: isAdded ? '#0F7A4F' : '#FF6584',
                        color: isAdded ? '#FFFFFF' : '#0A0E17',
                        border: 'none',
                        fontSize: 12,
                        fontWeight: 900,
                        cursor: 'pointer',
                        transition: 'all 180ms ease',
                        boxShadow: isAdded ? '0 0 14px rgba(15, 122, 79, 0.6)' : '0 4px 14px rgba(255, 101, 132, 0.4)',
                        '&:hover': {
                          backgroundColor: isAdded ? '#0F7A4F' : '#FFA0B4',
                          transform: 'scale(1.04)',
                        },
                        '&:active': {
                          transform: 'scale(0.96)',
                        },
                        ...FOCUS_RING,
                      }}
                    >
                      {isAdded ? (
                        <>
                          <Check size={14} strokeWidth={3} />
                          Added
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={14} strokeWidth={2.5} />
                          Add
                        </>
                      )}
                    </Box>
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
