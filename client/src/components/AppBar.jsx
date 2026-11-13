import { Suspense, lazy, useEffect, useRef } from 'react';
import { Link as RouterLink, NavLink, useLocation, useNavigate } from 'react-router';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
const Drawer = lazy(() => import('@mui/material/Drawer'));
import Typography from '@mui/material/Typography';
import { useReducedMotion } from 'motion/react';
import { ShoppingBag, Menu, X, Sparkles } from 'lucide-react';
import { tokens } from '../theme/tokens.js';
import { PAGE_PX } from './Page.jsx';
import { useMe } from '../api/hooks.js';
import { useCart, cartCount, cartVisibleCount } from '../store/cart.js';
import { useUi } from '../store/ui.js';
import { isLandingPath, isStoryPath } from '../lib/paths.js';

export function Star({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="gsStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="50%" stopColor="#FFB800" />
          <stop offset="100%" stopColor="#E69500" />
        </linearGradient>
      </defs>
      <path
        d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"
        fill="url(#gsStarGrad)"
        stroke="#E69500"
        strokeWidth="0.5"
      />
    </svg>
  );
}

// Styled Animated Goldstar Logo (Highlighted with Luminous Glow, Zero Background)
function AnimatedGoldstarLogo() {
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const loc = useLocation();

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (loc.pathname === '/' || loc.pathname === '/v2' || loc.pathname === '') {
      // Smoothly scroll to the very first section / top of landing page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Navigate to homepage and immediately scroll to top
      navigate('/');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }, 50);
    }
  };

  return (
    <Box
      component="a"
      href="/"
      onClick={handleLogoClick}
      aria-label="Goldstar Shoes Homepage - Go to top of first page"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.25,
        textDecoration: 'none',
        minHeight: 44,
        py: 0.5,
        cursor: 'pointer',
        backgroundColor: 'transparent',
        border: 'none',
        boxShadow: 'none',
        transition: 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        '&:hover': {
          transform: 'scale(1.06)',
          '& .star-box': {
            transform: 'rotate(24deg) scale(1.2)',
            filter: 'drop-shadow(0 0 20px rgba(255, 184, 0, 1)) drop-shadow(0 0 35px rgba(255, 224, 102, 0.9))',
          },
          '& .brand-text': {
            textShadow: '0 2px 14px rgba(0, 0, 0, 0.95), 0 0 28px rgba(255, 184, 0, 0.95), 0 0 10px #FFFFFF',
          },
        },
      }}
    >
      {/* Animated Glowing Star (Highlighted with Radiant Glow) */}
      <Box
        className="star-box"
        sx={{
          display: 'grid',
          placeItems: 'center',
          transition: 'transform 350ms cubic-bezier(0.2, 0.8, 0.2, 1), filter 350ms ease',
          filter: 'drop-shadow(0 0 10px rgba(255, 184, 0, 0.9)) drop-shadow(0 2px 6px rgba(0,0,0,0.9))',
          animation: reduced ? 'none' : 'gsStarGlow 3.5s ease-in-out infinite',
          '@keyframes gsStarGlow': {
            '0%, 100%': {
              transform: 'scale(1)',
              filter: 'drop-shadow(0 0 8px rgba(255, 184, 0, 0.85)) drop-shadow(0 2px 6px rgba(0,0,0,0.9))',
            },
            '50%': {
              transform: 'scale(1.12) rotate(8deg)',
              filter: 'drop-shadow(0 0 20px rgba(255, 184, 0, 1)) drop-shadow(0 0 30px rgba(255, 224, 102, 0.8)) drop-shadow(0 2px 8px rgba(0,0,0,0.95))',
            },
          },
        }}
      >
        <Star size={26} />
      </Box>

      {/* Brand Wordmark & Nepali Tag (Highlighted with Contrast Shadows, No Background) */}
      <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <Typography
          className="brand-text"
          component="span"
          sx={{
            fontWeight: 900,
            fontSize: { xs: 20, sm: 23 },
            letterSpacing: '0.07em',
            color: '#FFFFFF',
            textShadow: '0 2px 12px rgba(0, 0, 0, 0.95), 0 0 20px rgba(255, 184, 0, 0.5), 0 0 4px #FFFFFF',
            transition: 'text-shadow 260ms ease',
          }}
        >
          GOLDSTAR
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
          <Typography
            component="span"
            lang="ne"
            sx={{
              fontFamily: '"Mukta", system-ui, sans-serif',
              fontWeight: 800,
              fontSize: 12,
              color: '#FFB800',
              letterSpacing: '0.02em',
              textShadow: '0 2px 8px rgba(0,0,0,0.95), 0 0 14px rgba(255, 184, 0, 0.85)',
            }}
          >
            गोल्डस्टार
          </Typography>
          <Box
            component="span"
            sx={{
              fontSize: 8.5,
              fontWeight: 900,
              px: 0.6,
              py: 0.1,
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 184, 0, 0.18)',
              color: '#FFB800',
              border: '1px solid rgba(255, 184, 0, 0.65)',
              letterSpacing: '0.06em',
              textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              boxShadow: '0 0 8px rgba(255, 184, 0, 0.35)',
            }}
          >
            NEPAL
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function NavItem({ to, children, onClick, end, isLanding }) {
  return (
    <Button
      component={NavLink}
      to={to}
      end={end}
      onClick={onClick}
      sx={{
        color: isLanding ? '#FFFFFF' : 'text.primary',
        textShadow: isLanding ? '0 2px 8px rgba(0,0,0,0.85)' : 'none',
        minHeight: 44,
        px: 2,
        fontWeight: 700,
        fontSize: 14,
        transition: 'color 180ms ease, text-shadow 180ms ease',
        '&:hover': {
          color: '#FFB800',
          textShadow: '0 0 12px rgba(255, 184, 0, 0.75)',
          backgroundColor: 'transparent',
        },
        '&.active': {
          color: '#FFB800',
          textShadow: '0 0 10px rgba(255, 184, 0, 0.6)',
        },
      }}
    >
      {children}
    </Button>
  );
}

const NO_OVERSHOOT = 'cubic-bezier(0.22, 1, 0.36, 1)';

function CartButton({ isLanding }) {
  const count = useCart(cartCount);
  const visible = useCart(cartVisibleCount);
  const openCart = useUi((s) => s.openCart);
  const reduced = useReducedMotion();
  const pill = useRef(null);
  const icon = useRef(null);
  const prev = useRef(visible);

  useEffect(() => {
    if (visible > prev.current && pill.current?.animate) {
      pill.current.animate([{ backgroundColor: tokens.goldLight }, { backgroundColor: tokens.gold }], { duration: 180, easing: 'ease-out' });
      if (!reduced) {
        pill.current.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 300, easing: NO_OVERSHOOT });
        icon.current?.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-2px)' }, { transform: 'translateY(0)' }], { duration: 180, easing: 'ease-out' });
      }
    }
    prev.current = visible;
  }, [visible, reduced]);

  return (
    <IconButton
      id="cart-button"
      aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
      onClick={openCart}
      sx={{
        ml: 0.5,
        mr: { xs: 0, md: -1.5 },
        color: isLanding ? '#FFFFFF' : 'inherit',
        '&:hover': {
          color: '#FFB800',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        },
      }}
    >
      <Badge
        sx={{ '& .MuiBadge-badge': { backgroundColor: 'transparent', padding: 0, minWidth: 0, height: 'auto' } }}
        badgeContent={
          <span
            ref={pill}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 20,
              height: 20,
              borderRadius: 10,
              padding: '0 5px',
              boxSizing: 'border-box',
              backgroundColor: tokens.gold,
              color: tokens.onGold,
              fontSize: 12,
              fontWeight: 800,
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            }}
          >
            {visible}
          </span>
        }
        invisible={visible === 0}
      >
        <span ref={icon} style={{ display: 'inline-flex' }}>
          <ShoppingBag size={21} strokeWidth={2} aria-hidden="true" />
        </span>
      </Badge>
    </IconButton>
  );
}

export default function AppBar() {
  const me = useMe();
  const loc = useLocation();
  const menuOpen = useUi((s) => s.menuOpen);
  const openMenu = useUi((s) => s.openMenu);
  const closeMenu = useUi((s) => s.closeMenu);
  const isAdmin = me.data?.role === 'admin';
  const menuSeen = useRef(false);
  if (menuOpen) menuSeen.current = true;

  useEffect(() => {
    closeMenu();
  }, [loc.pathname, loc.hash, closeMenu]);

  const story = isStoryPath(loc.pathname);
  const landing = isLandingPath(loc.pathname);

  const links = (onClick) => (
    <>
      <NavItem to="/shop" onClick={onClick} isLanding={landing}>Shop</NavItem>
      <Button
        component={RouterLink}
        to="/shop?category=new-arrival"
        onClick={onClick}
        sx={{
          color: landing ? '#FFFFFF' : 'text.primary',
          textShadow: landing ? '0 2px 8px rgba(0,0,0,0.85)' : 'none',
          minHeight: 44,
          px: 2,
          fontWeight: 700,
          fontSize: 14,
          '&:hover': {
            color: '#FFB800',
            textShadow: '0 0 12px rgba(255, 184, 0, 0.75)',
            backgroundColor: 'transparent',
          },
        }}
      >
        New arrivals
      </Button>
      <NavItem to="/g10" onClick={onClick} isLanding={landing}>G10 in 3D</NavItem>
      {me.data ? (
        <NavItem to="/account" onClick={onClick} isLanding={landing}>Account</NavItem>
      ) : (
        <NavItem to="/login" onClick={onClick} isLanding={landing}>Log in</NavItem>
      )}
      {isAdmin ? <NavItem to="/admin" onClick={onClick} isLanding={landing}>Admin</NavItem> : null}
    </>
  );

  return (
    <MuiAppBar
      component="header"
      elevation={0}
      sx={{
        zIndex: 1200,
        // Entire Navbar Background is 100% TRANSPARENT on the landing page!
        ...(landing
          ? {
              backgroundColor: 'transparent !important',
              boxShadow: 'none !important',
              borderBottom: 'none !important',
              backdropFilter: 'none !important',
              backgroundImage: 'linear-gradient(180deg, rgba(7, 10, 15, 0.55) 0%, transparent 100%)',
            }
          : null),
        ...(story
          ? {
              backgroundColor: 'transparent',
              color: 'var(--story-ink, #F2EDE3)',
              boxShadow: 'none',
              transition: 'color 300ms ease',
              '& .MuiButton-root, & .MuiIconButton-root, & .MuiTypography-root, & a': { color: 'inherit' },
              '& svg path[fill]': { fill: 'currentColor' },
            }
          : null),
        ...(!landing && !story
          ? {
              backgroundColor: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }
          : null),
      }}
    >
      <Toolbar sx={{ px: PAGE_PX, maxWidth: 1440, width: '100%', mx: 'auto', boxSizing: 'border-box', gap: 1 }} disableGutters>
        {/* Styled Animated Goldstar Logo on White Capsule Background */}
        <AnimatedGoldstarLogo />

        <Box sx={{ flex: 1 }} />

        {/* Desktop Navigation Links */}
        <Box component="nav" aria-label="Main" sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
          {links()}
        </Box>

        {/* Shopping Cart Button */}
        <CartButton isLanding={landing} />

        {/* Mobile Menu Button */}
        <IconButton
          aria-label="Open menu"
          onClick={openMenu}
          sx={{
            display: { md: 'none' },
            mr: -1.5,
            color: landing ? '#FFFFFF' : 'inherit',
          }}
        >
          <Menu size={22} strokeWidth={2} aria-hidden="true" />
        </IconButton>
      </Toolbar>

      {/* Mobile Drawer */}
      {menuOpen || menuSeen.current ? (
        <Suspense fallback={null}>
          <Drawer
            anchor="right"
            open={menuOpen}
            onClose={closeMenu}
            PaperProps={{ sx: { width: { xs: '100vw', sm: 360 }, height: '100%', backgroundColor: '#0A0E14', color: '#FFFFFF' } }}
          >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton aria-label="Close menu" onClick={closeMenu} sx={{ color: '#FFFFFF' }}>
                <X size={20} strokeWidth={1.75} aria-hidden="true" />
              </IconButton>
            </Box>
            <Box
              component="nav"
              aria-label="Main"
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                px: 3,
                gap: 1.5,
                '& .MuiButton-root': { fontSize: 22, minHeight: 52, color: '#FFFFFF' },
              }}
            >
              {links(closeMenu)}
            </Box>
          </Drawer>
        </Suspense>
      ) : null}
    </MuiAppBar>
  );
}
