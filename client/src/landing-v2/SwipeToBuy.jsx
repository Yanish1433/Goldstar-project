import { useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ChevronRight, Check, ShoppingBag } from 'lucide-react';
import { tokensV2, FOCUS_RING } from './tokensV2.js';
import { useCart } from '../store/cart.js';
import { useUi } from '../store/ui.js';
import { formatNPR } from '../lib/format.js';

export default function SwipeToBuy({ product, size = '8', onComplete, sx }) {
  const [dragProgress, setDragProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const trackRef = useRef(null);
  const isDragging = useRef(false);

  const addToCart = useCart((s) => s.add);
  const showSnackbar = useUi((s) => s.showSnackbar);
  const openCart = useUi((s) => s.openCart);

  const handleSuccess = () => {
    setCompleted(true);
    setDragProgress(1);
    addToCart({
      productId: product.id || product.slug,
      name: product.name,
      colourwayKey: product.colourKey || 'default',
      colourName: product.colourName || 'Official Edition',
      size,
      unitPrice: product.price,
      image: { src: product.image },
      qty: 1,
    });
    showSnackbar({
      message: `🎉 Ordered ${product.name}! Pay cash when delivered.`,
      actionLabel: 'View Bag',
      onAction: () => openCart(),
    });
    onComplete?.();
    setTimeout(() => {
      setCompleted(false);
      setDragProgress(0);
    }, 2800);
  };

  const handlePointerDown = (e) => {
    if (completed) return;
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current || completed || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const handleWidth = 48;
    const maxDistance = rect.width - handleWidth - 8;
    const currentX = e.clientX - rect.left - handleWidth / 2;
    const progress = Math.min(1, Math.max(0, currentX / maxDistance));
    setDragProgress(progress);
    if (progress >= 0.88) {
      isDragging.current = false;
      handleSuccess();
    }
  };

  const handlePointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (dragProgress < 0.88 && !completed) {
      setDragProgress(0);
    }
  };

  const handleTrackClick = (e) => {
    // If not dragging, clicking the right side completes the purchase
    if (!completed && !isDragging.current && dragProgress === 0) {
      handleSuccess();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!completed) handleSuccess();
    }
  };

  return (
    <Box
      ref={trackRef}
      role="button"
      tabIndex={0}
      aria-label={`Swipe or click to buy ${product.name} for ${formatNPR(product.price)}`}
      onClick={handleTrackClick}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      sx={{
        position: 'relative',
        height: 52,
        borderRadius: '999px',
        backgroundColor: completed ? '#0F7A4F' : 'rgba(20, 18, 14, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(255, 255, 255, 0.25)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
        userSelect: 'none',
        touchAction: 'none',
        cursor: completed ? 'default' : 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: 'background-color 300ms ease',
        ...sx,
      }}
    >
      {/* Background fill showing progress */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${dragProgress * 100}%`,
          backgroundColor: completed ? '#0F7A4F' : tokensV2.blue,
          transition: isDragging.current ? 'none' : 'width 200ms ease',
          opacity: 0.85,
        }}
      />

      {/* Label Text in Center */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: '#FFFFFF',
          pointerEvents: 'none',
          pl: 5,
        }}
      >
        {completed ? (
          <>
            <Check size={16} strokeWidth={3} />
            <span>Added with Cash on Delivery!</span>
          </>
        ) : (
          <>
            <span>Swipe to Buy · {formatNPR(product.price)}</span>
            <ChevronRight size={15} opacity={0.6} />
          </>
        )}
      </Box>

      {/* Draggable Thumb / Handle */}
      <Box
        sx={{
          position: 'absolute',
          left: 4,
          top: 4,
          bottom: 4,
          width: 44,
          height: 44,
          borderRadius: '50%',
          backgroundColor: completed ? '#FFFFFF' : tokensV2.gold,
          color: completed ? '#0F7A4F' : tokensV2.ink,
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          transform: `translateX(${dragProgress * ((trackRef.current?.clientWidth || 240) - 56)}px)`,
          transition: isDragging.current ? 'none' : 'transform 200ms ease',
          zIndex: 2,
        }}
      >
        {completed ? (
          <Check size={20} strokeWidth={3} />
        ) : (
          <ChevronRight size={22} strokeWidth={3} />
        )}
      </Box>
    </Box>
  );
}
