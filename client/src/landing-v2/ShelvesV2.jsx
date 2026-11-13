import { useState, useRef, useMemo } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ArrowLeft, ArrowRight, Eye, ShoppingBag, Star, Sparkles, Check, Flame } from 'lucide-react';
import { useProducts } from '../api/hooks.js';
import { useCart } from '../store/cart.js';
import { useUi } from '../store/ui.js';
import { formatNPR } from '../lib/format.js';
import { tokensV2, DISPLAY_HEADING, FOCUS_RING } from './tokensV2.js';
import { WIDE } from '../theme/tokens.js';

const TABS = [
  { id: 'all', label: 'All Best Sellers', filter: () => true },
  { id: 'trek', label: 'Trek & Trail', filter: (p) => p.categories?.includes('trek-collection') || p.slug?.startsWith('g10') },
  { id: 'casual', label: 'City Casuals', filter: (p) => p.categories?.includes('casual') || p.slug?.startsWith('ax') },
  { id: 'sale', label: 'On Sale (-26%)', filter: (p) => p.colourways?.some((c) => c.regularPrice > c.price) },
  { id: 'women', label: 'Women’s Sizes', filter: (p) => p.categories?.includes('women') },
  { id: 'men', label: 'Men’s Sizes', filter: (p) => p.categories?.includes('men') },
];

function InteractiveCard({ product, onQuickView }) {
  const [selectedKey, setSelectedKey] = useState(
    product.colourways?.find((c) => c.inStock)?.key || product.colourways?.[0]?.key
  );
  const [selectedCardSize, setSelectedCardSize] = useState('8');
  const [added, setAdded] = useState(false);
  const addToCart = useCart((s) => s.add);
  const showSnackbar = useUi((s) => s.showSnackbar);
  const openCart = useUi((s) => s.openCart);

  const activeColour = useMemo(() => {
    return product.colourways?.find((c) => c.key === selectedKey) || product.colourways?.[0];
  }, [product, selectedKey]);

  const hasSale = activeColour?.regularPrice > activeColour?.price;
  const savings = hasSale ? activeColour.regularPrice - activeColour.price : 0;
  const photo = activeColour?.image?.thumb || activeColour?.image?.src || '';
  const availableSizes = activeColour?.sizes || ['7', '8', '9', '10'];

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const finalSize = selectedCardSize || availableSizes[0];
    addToCart({
      productId: product.slug,
      name: product.name,
      colourwayKey: activeColour.key,
      colourName: activeColour.name,
      size: finalSize,
      unitPrice: activeColour.price,
      image: activeColour.image,
      qty: 1,
    });
    setAdded(true);
    showSnackbar({
      message: `Added ${product.name} (${activeColour.name}, UK ${finalSize}) to your bag!`,
      actionLabel: 'View Bag',
      onAction: () => openCart(),
    });
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(16px)',
        borderRadius: '26px',
        overflow: 'hidden',
        border: '1.5px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
        transition: 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 260ms ease, border-color 260ms ease',
        '&:hover': {
          transform: 'translateY(-6px)',
          borderColor: 'rgba(0, 229, 255, 0.45)',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.6), 0 0 28px rgba(0, 229, 255, 0.18)',
          '& .shoe-img': {
            transform: 'scale(1.08) rotate(-3deg)',
          },
          '& .quick-actions': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}
    >
      {/* Top Image Stage */}
      <Box
        component={RouterLink}
        to={`/product/${product.slug}?colour=${activeColour?.key}`}
        aria-label={`${product.name} in ${activeColour?.name}, price ${formatNPR(activeColour?.price)}`}
        sx={{
          position: 'relative',
          display: 'block',
          aspectRatio: '1 / 0.92',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          p: 2.5,
          overflow: 'hidden',
          textDecoration: 'none',
          color: 'inherit',
          ...FOCUS_RING,
        }}
      >
        {/* Floating Badges */}
        <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 0.75, zIndex: 2, flexWrap: 'wrap' }}>
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
          {product.categories?.includes('new-arrival') ? (
            <Box
              sx={{
                px: 1.25,
                py: 0.35,
                borderRadius: '999px',
                backgroundColor: '#00E5FF',
                color: '#070A0F',
                fontSize: 10.5,
                fontWeight: 900,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                boxShadow: '0 2px 8px rgba(0, 229, 255, 0.4)',
              }}
            >
              New
            </Box>
          ) : null}
        </Box>

        {/* Ambient Backlight */}
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            width: '60%',
            height: '60%',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 229, 255, 0.08)',
            filter: 'blur(20px)',
            pointerEvents: 'none',
          }}
        />

        {/* Product Photo */}
        <Box
          component="img"
          className="shoe-img"
          src={photo}
          alt={`${product.name} in ${activeColour?.name}`}
          loading="lazy"
          decoding="async"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 14px 20px rgba(0, 0, 0, 0.65))',
            transition: 'transform 360ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />

        {/* Quick View Trigger Pill */}
        <Box
          className="quick-actions"
          sx={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            right: 12,
            display: 'flex',
            justifyContent: 'center',
            opacity: { xs: 1, md: 0 },
            transform: { xs: 'none', md: 'translateY(6px)' },
            transition: 'opacity 200ms ease, transform 200ms ease',
            zIndex: 3,
          }}
        >
          <Box
            component="button"
            type="button"
            aria-label={`Quick view ${product.name}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView?.(product, activeColour);
            }}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              minHeight: 38,
              px: 2,
              borderRadius: '999px',
              backgroundColor: 'rgba(7, 10, 15, 0.88)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 160ms ease',
              '&:hover': {
                backgroundColor: '#00E5FF',
                color: '#070A0F',
                borderColor: '#00E5FF',
              },
              ...FOCUS_RING,
            }}
          >
            <Eye size={14} />
            Quick Inspect
          </Box>
        </Box>
      </Box>

      {/* Card Body */}
      <Box sx={{ p: 2.25, display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
        <Box>
          {/* Rating & COD Badges */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, fontSize: 11.5, fontWeight: 800, color: '#FFB800' }}>
              <Star size={12} fill="#FFB800" color="#FFB800" />
              <span>4.9 (500+)</span>
            </Box>
            <Box sx={{ fontSize: 11, fontWeight: 800, color: '#00E5FF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              COD Available
            </Box>
          </Box>

          {/* Product Name */}
          <Box
            component={RouterLink}
            to={`/product/${product.slug}?colour=${activeColour?.key}`}
            sx={{
              display: 'block',
              textDecoration: 'none',
              color: '#FFFFFF',
              '&:hover': { color: '#00E5FF' },
              ...FOCUS_RING,
            }}
          >
            <Typography
              component="h3"
              sx={{
                fontSize: { xs: 17, md: 19 },
                fontWeight: 800,
                ...WIDE,
                lineHeight: 1.15,
                m: 0,
              }}
            >
              {product.name}
            </Typography>
          </Box>

          {/* Active Colourway Name */}
          <Typography sx={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', mt: 0.4 }}>
            {activeColour?.name} · {product.colourways?.length || 1} available colors
          </Typography>

          {/* Colorway Swatches with Interactive Switch */}
          {product.colourways?.length > 1 ? (
            <Box
              role="radiogroup"
              aria-label={`Colorways for ${product.name}`}
              sx={{ display: 'flex', gap: 0.75, mt: 1.25, flexWrap: 'wrap' }}
            >
              {product.colourways.map((cw) => {
                const isSelected = cw.key === selectedKey;
                return (
                  <Box
                    key={cw.key}
                    component="button"
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`Select ${cw.name} colorway`}
                    onClick={() => setSelectedKey(cw.key)}
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      backgroundColor: cw.hex,
                      border: `2px solid ${isSelected ? '#00E5FF' : '#FFFFFF'}`,
                      boxShadow: isSelected
                        ? '0 0 0 2px #00E5FF'
                        : '0 1px 4px rgba(0,0,0,0.4)',
                      cursor: 'pointer',
                      p: 0,
                      transition: 'transform 160ms ease',
                      '&:hover': { transform: 'scale(1.2)' },
                      ...FOCUS_RING,
                    }}
                  />
                );
              })}
            </Box>
          ) : null}

          {/* Interactive Size Chips Directly on Card */}
          <Box sx={{ mt: 1.5 }}>
            <Box sx={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', mb: 0.5 }}>
              Size (UK):
            </Box>
            <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap' }}>
              {availableSizes.slice(0, 5).map((sz) => {
                const isPicked = selectedCardSize === sz;
                return (
                  <Box
                    key={sz}
                    component="button"
                    type="button"
                    onClick={() => setSelectedCardSize(sz)}
                    sx={{
                      minWidth: 32,
                      height: 26,
                      px: 0.8,
                      borderRadius: '6px',
                      border: `1px solid ${isPicked ? '#00E5FF' : 'rgba(255, 255, 255, 0.18)'}`,
                      backgroundColor: isPicked ? 'rgba(0, 229, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      color: isPicked ? '#00E5FF' : 'rgba(255, 255, 255, 0.85)',
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

        {/* Pricing & Add to Cart Footer */}
        <Box
          sx={{
            pt: 2,
            mt: 2,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Box>
            <Box sx={{ fontSize: { xs: 18, md: 20 }, fontWeight: 900, ...WIDE, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>
              {formatNPR(activeColour?.price || product.price)}
            </Box>
            {hasSale ? (
              <Box component="s" sx={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>
                {formatNPR(activeColour.regularPrice)}
              </Box>
            ) : null}
          </Box>

          {/* Quick Add Button */}
          <Box
            component="button"
            type="button"
            aria-label={`Add ${product.name} to cart`}
            onClick={handleQuickAdd}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              minHeight: 40,
              px: 2,
              borderRadius: '999px',
              backgroundColor: added ? '#0F7A4F' : '#00E5FF',
              color: added ? '#FFFFFF' : '#070A0F',
              border: 'none',
              fontSize: 12.5,
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: added ? '0 0 14px rgba(15, 122, 79, 0.6)' : '0 4px 14px rgba(0, 229, 255, 0.35)',
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
            {added ? (
              <>
                <Check size={15} strokeWidth={3} />
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
    </Box>
  );
}

export default function ShelvesV2({ onQuickView }) {
  const [activeTab, setActiveTab] = useState('all');
  const railRef = useRef(null);
  const { data: qData, isLoading } = useProducts({ limit: 48, sort: 'featured' });
  const allProducts = qData?.items || [];

  const activeTabDef = TABS.find((t) => t.id === activeTab) || TABS[0];
  const filteredProducts = useMemo(() => {
    return allProducts.filter(activeTabDef.filter);
  }, [allProducts, activeTabDef]);

  return (
    <Box
      component="section"
      aria-labelledby="shelf-heading"
      sx={{
        py: { xs: 8, md: 14 },
        backgroundColor: '#070A0F',
        backgroundImage: `
          radial-gradient(circle at 50% 10%, rgba(0, 229, 255, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 90%, rgba(255, 184, 0, 0.08) 0%, transparent 50%)
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
            mb: 4,
          }}
        >
          <Box>
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
              <Sparkles size={14} />
              Iconic Goldstar Catalogue
            </Box>

            <Typography
              component="h2"
              id="shelf-heading"
              sx={{
                ...DISPLAY_HEADING,
                fontSize: { xs: 'clamp(28px, 7vw, 42px)', md: 'clamp(38px, 3.8vw, 54px)' },
                color: '#FFFFFF',
                m: 0,
                lineHeight: 1.05,
              }}
            >
              Curated For Every Trail.
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
                mb: 0,
              }}
            >
              काठमाडौंदेखि हिमालसम्म — हरेक पाइलाको लागि प्रामाणिक नेपाली जुत्ता।
            </Box>
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
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1.5px solid rgba(255, 255, 255, 0.25)',
              color: '#FFFFFF',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: '0.04em',
              transition: 'all 200ms ease',
              '&:hover': {
                backgroundColor: '#00E5FF',
                color: '#070A0F',
                borderColor: '#00E5FF',
                boxShadow: '0 0 20px rgba(0, 229, 255, 0.5)',
              },
              ...FOCUS_RING,
            }}
          >
            <span>View Full Shop</span>
            <ArrowRight size={16} strokeWidth={2.5} />
          </Box>
        </Box>

        {/* Category Filter Tabs with Smooth Horizontal Mobile Scrolling */}
        <Box
          role="tablist"
          aria-label="Filter catalogue by category"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            overflowX: 'auto',
            pb: 1.5,
            mb: { xs: 4, md: 5 },
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {TABS.map((tab) => {
            const isSelected = tab.id === activeTab;
            const count = allProducts.filter(tab.filter).length;

            return (
              <Box
                key={tab.id}
                component="button"
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveTab(tab.id)}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  minHeight: 42,
                  px: 2.25,
                  borderRadius: '999px',
                  border: `1.5px solid ${isSelected ? '#00E5FF' : 'rgba(255, 255, 255, 0.16)'}`,
                  backgroundColor: isSelected ? '#00E5FF' : 'rgba(255, 255, 255, 0.06)',
                  color: isSelected ? '#070A0F' : 'rgba(255, 255, 255, 0.85)',
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 180ms ease',
                  boxShadow: isSelected ? '0 0 16px rgba(0, 229, 255, 0.45)' : 'none',
                  ...FOCUS_RING,
                }}
              >
                <span>{tab.label}</span>
                <Box
                  component="span"
                  sx={{
                    px: 0.85,
                    py: 0.15,
                    borderRadius: '999px',
                    backgroundColor: isSelected ? 'rgba(7, 10, 15, 0.25)' : 'rgba(255, 255, 255, 0.12)',
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                >
                  {count}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Product Cards: Premium Responsive Grid / Rail */}
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
          {filteredProducts.map((p) => (
            <Box
              key={p.slug}
              sx={{
                flex: { xs: '0 0 280px', sm: 'auto' },
                scrollSnapAlign: { xs: 'start', sm: 'none' },
                display: 'flex',
              }}
            >
              <InteractiveCard product={p} onQuickView={onQuickView} />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
