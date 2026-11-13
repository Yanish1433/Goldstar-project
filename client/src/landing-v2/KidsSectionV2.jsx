import { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Baby, Shield, Sparkles, ShoppingBag, ArrowRight, CheckCircle2, Check, Zap } from 'lucide-react';
import { tokensV2, DISPLAY_HEADING, FOCUS_RING } from './tokensV2.js';
import { useCart } from '../store/cart.js';
import { useUi } from '../store/ui.js';
import { formatNPR } from '../lib/format.js';
import { WIDE } from '../theme/tokens.js';

const KIDS_ITEMS = [
  {
    id: 'kid-school-runner',
    name: 'Goldstar Junior Pace Runner',
    tag: 'School & Sports Daily',
    image: 'https://goldstarshoes.com/wp-content/uploads/2025/09/C_M09563-2-1-1-scaled.webp',
    price: 1450,
    regularPrice: 1750,
    accent: '#FFB800',
    badge: 'School Uniform Approved',
    sizes: ['11C', '12C', '13C', '1', '2', '3'],
    features: ['Reinforced Rubber Toe', 'Padded Ankle Collar', 'Washable Canvas Mesh'],
  },
  {
    id: 'kid-trek-mini',
    name: 'Junior G10 Trail Cadet',
    tag: 'Family Trek & Hiking',
    image: 'https://goldstarshoes.com/wp-content/uploads/2025/09/C_M09888-1-1-scaled-2.webp',
    price: 1850,
    regularPrice: 2200,
    accent: '#00E5FF',
    badge: '100% Trail Grip',
    sizes: ['12C', '13C', '1', '2', '3', '4'],
    features: ['Diamond Lug Sole', 'Ankle Support', 'Water-Resistant Upper'],
  },
  {
    id: 'kid-retro-velcro',
    name: 'Goldstar Junior Court Stride',
    tag: 'Easy Slip-On & Play',
    image: 'https://goldstarshoes.com/wp-content/uploads/2025/09/C_M09584-2-1-scaled-2.webp',
    price: 1350,
    regularPrice: 1600,
    accent: '#10B981',
    badge: 'Playground Favorite',
    sizes: ['10C', '11C', '12C', '13C', '1', '2'],
    features: ['Dual Velcro Straps', 'Ultra-Light Sole', 'Non-Marking Outsole'],
  },
];

export default function KidsSectionV2() {
  const [selectedKidSizes, setSelectedKidSizes] = useState({
    'kid-school-runner': '1',
    'kid-trek-mini': '2',
    'kid-retro-velcro': '12C',
  });
  const [addedItem, setAddedItem] = useState(null);

  const addToCart = useCart((s) => s.add);
  const showSnackbar = useUi((s) => s.showSnackbar);
  const openCart = useUi((s) => s.openCart);

  const handleSelectSize = (itemId, size) => {
    setSelectedKidSizes((prev) => ({ ...prev, [itemId]: size }));
  };

  const handleAdd = (item) => {
    const size = selectedKidSizes[item.id] || item.sizes[0];
    addToCart({
      productId: item.id,
      name: item.name,
      colourwayKey: 'kid-standard',
      colourName: 'Junior Edition',
      size,
      unitPrice: item.price,
      image: { src: item.image },
      qty: 1,
    });
    setAddedItem(item.id);
    showSnackbar({
      message: `Added ${item.name} (Size ${size}) to your bag!`,
      actionLabel: 'View Bag',
      onAction: () => openCart(),
    });
    setTimeout(() => setAddedItem(null), 2200);
  };

  return (
    <Box
      id="kids-section"
      component="section"
      aria-labelledby="kids-heading"
      sx={{
        py: { xs: 8, md: 14 },
        backgroundColor: '#081216',
        backgroundImage: `
          radial-gradient(circle at 85% 15%, rgba(0, 229, 255, 0.1) 0%, transparent 45%),
          radial-gradient(circle at 15% 85%, rgba(255, 184, 0, 0.1) 0%, transparent 45%),
          linear-gradient(180deg, #0A0E17 0%, #081216 100%)
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
                backgroundColor: 'rgba(255, 184, 0, 0.16)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 184, 0, 0.45)',
                color: '#FFB800',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                mb: 1.5,
                boxShadow: '0 4px 16px rgba(255, 184, 0, 0.25)',
              }}
            >
              <Baby size={15} />
              Goldstar Junior · School, Sports &amp; Play
            </Box>

            <Typography
              component="h2"
              id="kids-heading"
              sx={{
                ...DISPLAY_HEADING,
                fontSize: { xs: 'clamp(28px, 7vw, 42px)', md: 'clamp(38px, 3.8vw, 54px)' },
                color: '#FFFFFF',
                m: 0,
                lineHeight: 1.05,
              }}
            >
              Built Tough for Young Champions.
            </Typography>

            <Box
              component="p"
              lang="ne"
              sx={{
                fontFamily: '"Mukta", system-ui, sans-serif',
                fontWeight: 700,
                fontSize: { xs: 15, md: 18 },
                color: '#FFB800',
                mt: 0.5,
                mb: 1,
              }}
            >
              नेपालका भावी ताराहरूका लागि — स्कूलदेखि खेलमैदानसम्म।
            </Box>

            <Typography
              sx={{
                fontSize: { xs: 14, md: 16 },
                color: 'rgba(255, 255, 255, 0.72)',
                lineHeight: 1.5,
                maxWidth: '54ch',
                m: 0,
              }}
            >
              Generations of Nepali school students have grown up wearing indestructible Goldstars. Reinforced rubber bumper caps, slip-proof traction, and lightweight comfort for playground football and daily classes.
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
              py: 1.35,
              borderRadius: '999px',
              backgroundColor: tokensV2.gold,
              color: tokensV2.ink,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: '0.04em',
              boxShadow: '0 6px 20px rgba(255, 184, 0, 0.35)',
              transition: 'all 200ms ease',
              '&:hover': {
                backgroundColor: '#FFA500',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(255, 184, 0, 0.5)',
              },
              ...FOCUS_RING,
            }}
          >
            <span>Explore Junior Range</span>
            <ArrowRight size={16} strokeWidth={2.5} />
          </Box>
        </Box>

        {/* Kids Product Cards: Horizontal Snap Rail on Mobile, 3-Col Grid on Desktop */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'grid' },
            gridTemplateColumns: { md: 'repeat(3, 1fr)' },
            gap: { xs: 2.25, md: 3.5 },
            overflowX: { xs: 'auto', md: 'visible' },
            scrollSnapType: { xs: 'x mandatory', md: 'none' },
            scrollPadding: '16px',
            pb: { xs: 2, md: 0 },
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {KIDS_ITEMS.map((item) => {
            const savings = item.regularPrice - item.price;
            const isAdded = addedItem === item.id;
            const currentSize = selectedKidSizes[item.id] || item.sizes[0];

            return (
              <Box
                key={item.id}
                sx={{
                  flex: { xs: '0 0 295px', md: 'auto' },
                  scrollSnapAlign: { xs: 'start', md: 'none' },
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '28px',
                  p: { xs: 2.25, sm: 3 },
                  border: '1.5px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 260ms ease, border-color 260ms ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    borderColor: `${item.accent}`,
                    boxShadow: `0 24px 50px rgba(0, 0, 0, 0.65), 0 0 30px ${item.accent}33`,
                    '& img': {
                      transform: 'scale(1.08) rotate(-3deg)',
                    },
                  },
                }}
              >
                <Box>
                  {/* Photo Stage */}
                  <Box
                    sx={{
                      position: 'relative',
                      aspectRatio: '4 / 3.2',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '22px',
                      p: 2,
                      display: 'grid',
                      placeItems: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Tag Badge */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        px: 1.25,
                        py: 0.35,
                        borderRadius: '999px',
                        backgroundColor: item.accent,
                        color: '#070A0F',
                        fontSize: 10.5,
                        fontWeight: 900,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        boxShadow: `0 2px 8px ${item.accent}66`,
                        zIndex: 2,
                      }}
                    >
                      {item.tag}
                    </Box>

                    {/* Toughness Pill */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        px: 1,
                        py: 0.25,
                        borderRadius: '999px',
                        backgroundColor: 'rgba(0, 0, 0, 0.65)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: 'rgba(255, 255, 255, 0.85)',
                        fontSize: 9.5,
                        fontWeight: 800,
                        zIndex: 2,
                      }}
                    >
                      {item.badge}
                    </Box>

                    {/* Soft Glow */}
                    <Box
                      aria-hidden="true"
                      sx={{
                        position: 'absolute',
                        width: '60%',
                        height: '60%',
                        borderRadius: '50%',
                        backgroundColor: `${item.accent}1A`,
                        filter: 'blur(20px)',
                        pointerEvents: 'none',
                      }}
                    />

                    <Box
                      component="img"
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      sx={{
                        width: '90%',
                        height: '90%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 12px 18px rgba(0, 0, 0, 0.7))',
                        transition: 'transform 360ms cubic-bezier(0.22, 1, 0.36, 1)',
                      }}
                    />
                  </Box>

                  {/* Details */}
                  <Box sx={{ mt: 2.25 }}>
                    <Typography
                      component="h3"
                      sx={{
                        fontSize: { xs: 18, sm: 20 },
                        fontWeight: 800,
                        ...WIDE,
                        color: '#FFFFFF',
                        lineHeight: 1.15,
                        m: 0,
                      }}
                    >
                      {item.name}
                    </Typography>

                    {/* Feature Bullets with Icons */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1.5 }}>
                      {item.features.map((feat) => (
                        <Box
                          key={feat}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            fontSize: 12.5,
                            color: 'rgba(255, 255, 255, 0.75)',
                          }}
                        >
                          <CheckCircle2 size={13} color={item.accent} strokeWidth={2.5} />
                          <span>{feat}</span>
                        </Box>
                      ))}
                    </Box>

                    {/* Interactive Kid Size Picker */}
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', mb: 0.6 }}>
                        Pick Size:
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap' }}>
                        {item.sizes.map((sz) => {
                          const isPicked = currentSize === sz;
                          return (
                            <Box
                              key={sz}
                              component="button"
                              type="button"
                              onClick={() => handleSelectSize(item.id, sz)}
                              sx={{
                                minWidth: 32,
                                height: 26,
                                px: 0.8,
                                borderRadius: '6px',
                                border: `1px solid ${isPicked ? item.accent : 'rgba(255, 255, 255, 0.18)'}`,
                                backgroundColor: isPicked ? `${item.accent}33` : 'rgba(255, 255, 255, 0.05)',
                                color: isPicked ? item.accent : 'rgba(255, 255, 255, 0.85)',
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 140ms ease',
                                ...FOCUS_RING,
                              }}
                            >
                              {sz}
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Pricing & Add to Cart Footer */}
                <Box
                  sx={{
                    mt: 2.5,
                    pt: 2,
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Box sx={{ fontSize: 19, fontWeight: 900, ...WIDE, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>
                      {formatNPR(item.price)}
                    </Box>
                    <Box component="s" sx={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>
                      {formatNPR(item.regularPrice)}
                    </Box>
                  </Box>

                  <Box
                    component="button"
                    type="button"
                    aria-label={`Add ${item.name} to bag`}
                    onClick={() => handleAdd(item)}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.75,
                      minHeight: 42,
                      px: 2.25,
                      borderRadius: '999px',
                      backgroundColor: isAdded ? '#0F7A4F' : item.accent,
                      color: isAdded ? '#FFFFFF' : '#070A0F',
                      border: 'none',
                      fontSize: 12.5,
                      fontWeight: 900,
                      cursor: 'pointer',
                      boxShadow: isAdded ? '0 0 14px rgba(15, 122, 79, 0.6)' : `0 4px 16px ${item.accent}66`,
                      transition: 'all 180ms ease',
                      '&:hover': {
                        transform: 'scale(1.04)',
                        filter: 'brightness(1.1)',
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
                        <span>Added!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={14} strokeWidth={2.5} />
                        <span>Add to Bag</span>
                      </>
                    )}
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
