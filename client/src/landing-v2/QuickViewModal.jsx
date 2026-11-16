import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import { X, ShoppingBag, ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { makeLine, addToCartAnimated, pickSourceRect } from '../lib/addToCart.js';
import { formatNPR } from '../lib/format.js';
import { tokensV2, FOCUS_RING, PHOTO_TILE } from './tokensV2.js';
import { WIDE } from '../theme/tokens.js';
import { shelfPhoto } from './shots.js';

export default function QuickViewModal({ open, onClose, product, initialColour }) {
  const [selectedKey, setSelectedKey] = useState(initialColour?.key || product?.colourways?.[0]?.key);
  const [selectedSize, setSelectedSize] = useState('8');
  const [added, setAdded] = useState(false);


  useEffect(() => {
    if (initialColour?.key) {
      setSelectedKey(initialColour.key);
    } else if (product?.colourways?.[0]?.key) {
      setSelectedKey(product.colourways[0].key);
    }
  }, [initialColour, product]);

  if (!product) return null;

  const currentColour = product.colourways?.find((c) => c.key === selectedKey) || product.colourways?.[0];
  const sizes = currentColour?.sizes?.length ? currentColour.sizes : ['5', '6', '7', '8', '9', '10'];
  const hasSale = currentColour?.regularPrice > currentColour?.price;
  const size = sizes.map(String).includes(String(selectedSize)) ? selectedSize : sizes[Math.floor((sizes.length - 1) / 2)];

  const handleAdd = (e) => {
    const res = addToCartAnimated(makeLine(product, currentColour, size), { sourceRect: pickSourceRect(e.currentTarget) });
    if (res.ok) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-shoe-title"
      sx={{
        display: 'grid',
        placeItems: 'center',
        p: { xs: 2, sm: 3 },
        backdropFilter: 'blur(8px)',
        backgroundColor: tokensV2.scrim,
        zIndex: 1300,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 880,
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: tokensV2.paper,
          color: tokensV2.inkOnPaper,
          borderRadius: '32px',
          boxShadow: tokensV2.shadowFloating,
          p: { xs: 3, sm: 4.5 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: { xs: 3, md: 4.5 },
          outline: 'none',
        }}
      >
        {/* Close Button */}
        <Box
          component="button"
          type="button"
          aria-label="Close product preview"
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: tokensV2.cream,
            border: 'none',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            color: tokensV2.ink,
            zIndex: 10,
            transition: 'all 180ms ease',
            '&:hover': {
              backgroundColor: tokensV2.ink,
              color: tokensV2.paper,
            },
            ...FOCUS_RING,
          }}
        >
          <X size={20} strokeWidth={2.5} />
        </Box>

        {/* Left: Product Image Stage */}
        <Box
          sx={{
            position: 'relative',
            aspectRatio: '1 / 1',
            borderRadius: '24px',
            backgroundColor: tokensV2.paperDim,
            display: 'grid',
            placeItems: 'center',
            p: 3,
            overflow: 'hidden',
          }}
        >
          {/* Subtle Ground blur */}
          <Box
            aria-hidden="true"
            sx={{
              position: 'absolute',
              bottom: '12%',
              width: '65%',
              height: '14%',
              borderRadius: '50%',
              backgroundColor: tokensV2.lineOnPaper,
              filter: 'blur(12px)',
            }}
          />

          <Box
            component="img"
            src={shelfPhoto(product, currentColour).thumb}
            alt={`${product.name} in ${currentColour?.name}`}
            sx={{
              position: 'relative',
              width: '94%',
              height: '94%',
              objectFit: 'contain',
              mixBlendMode: 'multiply',
              filter: PHOTO_TILE,
              zIndex: 1,
            }}
          />
        </Box>

        {/* Right: Customization & Purchase Options */}
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: 12,
                fontWeight: 800,
                color: tokensV2.goldDeep,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                mb: 0.75,
              }}
            >
              <ShieldCheck size={14} />
              Original Goldstar Stride
            </Box>

            <Typography
              component="h2"
              id="modal-shoe-title"
              sx={{
                fontSize: { xs: 24, md: 30 },
                fontWeight: 800,
                ...WIDE,
                lineHeight: 1.1,
                m: 0,
              }}
            >
              {product.name}
            </Typography>

            {/* Price */}
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
              <Box
                sx={{
                  fontSize: 26,
                  fontWeight: 900,
                  ...WIDE,
                  color: tokensV2.ink,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatNPR(currentColour?.price || product.price)}
              </Box>
              {hasSale ? (
                <Box component="s" sx={{ fontSize: 16, color: tokensV2.inkMuted }}>
                  {formatNPR(currentColour.regularPrice)}
                </Box>
              ) : null}
            </Box>

            {/* Colour Switcher */}
            <Box sx={{ mt: 3 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: tokensV2.inkSecondary, mb: 1 }}>
                Color: <strong>{currentColour?.name}</strong>
              </Typography>
              <Box role="radiogroup" aria-label="Available colors" sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {product.colourways?.map((cw) => {
                  const isSelected = cw.key === selectedKey;
                  return (
                    <Box
                      key={cw.key}
                      component="button"
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedKey(cw.key)}
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        backgroundColor: cw.hex,
                        border: `2px solid ${tokensV2.paper}`,
                        boxShadow: isSelected ? `0 0 0 2px ${tokensV2.ink}` : `0 0 0 1px ${tokensV2.lineOnPaper}`,
                        cursor: 'pointer',
                        p: 0,
                        '&:hover': { transform: 'scale(1.15)' },
                        ...FOCUS_RING,
                      }}
                    />
                  );
                })}
              </Box>
            </Box>

            {/* Size Selector */}
            <Box sx={{ mt: 3 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: tokensV2.inkSecondary, mb: 1 }}>
                Select UK Size:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {sizes.map((sz) => {
                  const isSelected = String(sz) === String(size);
                  return (
                    <Box
                      key={sz}
                      component="button"
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedSize(sz)}
                      sx={{
                        minWidth: 44,
                        height: 44,
                        px: 1.5,
                        borderRadius: '12px',
                        border: `1.5px solid ${isSelected ? tokensV2.ink : tokensV2.lineOnPaper}`,
                        backgroundColor: isSelected ? tokensV2.ink : 'transparent',
                        color: isSelected ? tokensV2.paper : tokensV2.ink,
                        fontSize: 14,
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 160ms ease',
                        '&:hover': {
                          borderColor: tokensV2.ink,
                        },
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

          {/* Action Buttons */}
          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box
              component="button"
              type="button"
              onClick={handleAdd}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                minHeight: 52,
                borderRadius: '999px',
                backgroundColor: tokensV2.ink,
                color: tokensV2.paper,
                border: 'none',
                fontSize: 16,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: tokensV2.shadowCard,
                transition: 'all 200ms ease',
                '&:hover': {
                  backgroundColor: tokensV2.blueHover,
                  transform: 'translateY(-2px)',
                },
                ...FOCUS_RING,
              }}
            >
              {added ? (
                <>
                  <Check size={18} strokeWidth={2.5} />
                  Added to cart
                </>
              ) : (
                <>
                  <ShoppingBag size={18} />
                  Add to cart · Cash on delivery
                </>
              )}
            </Box>

            <Box
              component={RouterLink}
              to={`/product/${product.slug}?colour=${currentColour?.key}`}
              onClick={onClose}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.75,
                minHeight: 46,
                borderRadius: '999px',
                border: `2px solid ${tokensV2.ink}`,
                color: tokensV2.ink,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 800,
                transition: 'all 180ms ease',
                '&:hover': {
                  backgroundColor: tokensV2.ink,
                  color: tokensV2.paper,
                },
                ...FOCUS_RING,
              }}
            >
              Full Specifications &amp; Reviews
              <ArrowRight size={16} strokeWidth={2.5} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
