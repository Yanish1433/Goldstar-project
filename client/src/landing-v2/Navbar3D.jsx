import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Compass, Footprints, Shield, User, Baby, Sparkles, ShoppingBag, Eye } from 'lucide-react';
import { tokensV2, FOCUS_RING } from './tokensV2.js';
import { useCart } from '../store/cart.js';
import { useUi } from '../store/ui.js';

const NAV_ITEMS = [
  { id: 'trek-story', label: 'Trek Story', icon: Compass },
  { id: 'why-goldstar', label: 'Why Goldstar', icon: Footprints },
  { id: 'trek-gear', label: 'Trek Gear', icon: Shield },
  { id: 'g10-section', label: 'G-10 Trek', icon: Eye },
  { id: 'womens-section', label: "Women's", icon: User },
  { id: 'kids-section', label: "Kids'", icon: Baby },
  { id: 'all-shoes', label: 'All Footwear', icon: Sparkles },
];

export default function Navbar3D() {
  const [activeSection, setActiveSection] = useState('trek-story');
  const [scrolled, setScrolled] = useState(false);
  const cartLines = useCart((s) => s.lines);
  const openCart = useUi((s) => s.openCart);
  const totalItems = cartLines.reduce((sum, l) => sum + (l.qty || 1), 0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      const sections = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(Boolean);
      const scrollPos = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i].offsetTop <= scrollPos) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Box
      component="nav"
      aria-label="3D Story navigation"
      sx={{
        position: 'sticky',
        top: 16,
        zIndex: 1200,
        maxWidth: 1200,
        mx: 'auto',
        px: { xs: 1.5, sm: 2 },
        perspective: '1000px',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          p: 1,
          borderRadius: '999px',
          backgroundColor: scrolled ? 'rgba(20, 18, 14, 0.88)' : 'rgba(20, 18, 14, 0.72)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: scrolled
            ? '0 20px 48px rgba(0, 0, 0, 0.35), 0 2px 6px rgba(0, 0, 0, 0.2)'
            : '0 12px 32px rgba(0, 0, 0, 0.25)',
          transform: scrolled ? 'translateZ(10px) rotateX(1deg)' : 'translateZ(0)',
          transition: 'all 300ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Brand Tag Pill */}
        <Box
          component="button"
          type="button"
          onClick={() => scrollTo('trek-story')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 0.75,
            borderRadius: '999px',
            backgroundColor: tokensV2.gold,
            color: tokensV2.ink,
            border: 'none',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'transform 180ms ease',
            '&:hover': {
              transform: 'scale(1.04)',
            },
            ...FOCUS_RING,
          }}
        >
          <Sparkles size={14} />
          Goldstar 3D
        </Box>

        {/* Scroll Nav Items (Horizontal Rail on Mobile) */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            px: 0.5,
          }}
        >
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            return (
              <Box
                key={id}
                component="button"
                type="button"
                onClick={() => scrollTo(id)}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  minHeight: 38,
                  px: { xs: 1.5, sm: 2 },
                  borderRadius: '999px',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.22)' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)',
                  border: isActive ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid transparent',
                  fontFamily: 'inherit',
                  fontSize: { xs: 12, sm: 13 },
                  fontWeight: isActive ? 800 : 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    transform: 'translateY(-1px)',
                  },
                  ...FOCUS_RING,
                }}
              >
                <Icon size={14} color={isActive ? tokensV2.gold : 'currentColor'} />
                {label}
              </Box>
            );
          })}
        </Box>

        {/* Cart Trigger */}
        <Box
          component="button"
          type="button"
          aria-label={`Open shopping bag (${totalItems} items)`}
          onClick={openCart}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            px: 2,
            py: 0.75,
            minHeight: 38,
            borderRadius: '999px',
            backgroundColor: tokensV2.blue,
            color: '#FFFFFF',
            border: 'none',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(36, 32, 217, 0.35)',
            transition: 'transform 180ms ease, background-color 180ms ease',
            '&:hover': {
              backgroundColor: tokensV2.blueHover,
              transform: 'scale(1.04)',
            },
            ...FOCUS_RING,
          }}
        >
          <ShoppingBag size={15} />
          <span>Bag</span>
          <Box
            component="span"
            sx={{
              px: 0.75,
              py: 0.15,
              borderRadius: '999px',
              backgroundColor: '#FFFFFF',
              color: tokensV2.blue,
              fontSize: 11,
              fontWeight: 900,
            }}
          >
            {totalItems}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
