import { Suspense, lazy, useEffect, useRef, useState } from 'react';
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
import { ShoppingBag, Menu, X } from 'lucide-react';
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

// Bar palettes. Every text colour here is AA (>= 4.5:1) on its bar: ivory on the dark bars, ink and deep gold on the
// light store bar (the white wordmark with a glow used to vanish on the white bar on /shop), navy and Goldstar royal
// blue on the landing's frosted white bar (the landing is a white "daylight" page, tokens in landing-v2/tokensV2.js).
const BAR = {
  brand: { ink: '#0B1A48', sub: '#2A27E9', hover: '#2A27E9', ground: 'rgba(255,255,255,0.86)', line: 'rgba(11,26,72,0.10)' },
  dark: { ink: '#F2EDE3', sub: '#E2B857', hover: '#E2B857', ground: 'rgba(13,12,10,0.82)', line: 'rgba(242,237,227,0.12)' },
  light: { ink: '#16120E', sub: '#75561A', hover: '#75561A', ground: 'rgba(246,242,234,0.88)', line: 'rgba(22,18,14,0.10)' },
};

// Has the page scrolled past the top? Only listened to where the bar changes with it (the landing).
function useScrolled(active) {
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > 8);
  useEffect(() => {
    if (!active) return undefined;
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [active]);
  return scrolled;
}

// The Goldstar logo. tone names the bar it sits on: 'dark' (ivory wordmark), 'light' (ink wordmark on the light
// store bar), 'brand' (navy wordmark, blue Nepali mark: the landing), 'inherit' (the /g10 story's current ink).
function AnimatedGoldstarLogo({ tone = 'dark' }) {
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
          '& .star-box': { transform: 'rotate(24deg) scale(1.15)' },
        },
        '&:focus-visible': { outline: `2px solid ${tone === 'inherit' ? 'currentColor' : BAR[tone].hover}`, outlineOffset: 4, borderRadius: '6px' },
      }}
    >
      {/* Animated Glowing Star (Highlighted with Radiant Glow) */}
      <Box
        className="star-box"
        sx={{
          display: 'grid',
          placeItems: 'center',
          transition: reduced ? 'none' : 'transform 350ms cubic-bezier(0.2, 0.8, 0.2, 1)',
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
            color: tone === 'inherit' ? 'inherit' : BAR[tone].ink,
            transition: 'color 260ms ease',
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
              color: tone === 'inherit' ? 'inherit' : BAR[tone].sub,
              letterSpacing: '0.02em',
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
              color: tone === 'inherit' ? 'inherit' : BAR[tone].sub,
              border: '1px solid currentColor',
              letterSpacing: '0.06em',
            }}
          >
            NEPAL
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// tone: 'dark' | 'light' | 'brand' | 'inherit' (the bar, as for the logo).
const navSx = (tone) => ({
  color: tone === 'inherit' ? 'inherit' : BAR[tone].ink,
  minHeight: 44,
  px: 2,
  fontWeight: 700,
  fontSize: 14,
  transition: 'color 180ms ease',
  '&:hover': { color: tone === 'inherit' ? 'inherit' : BAR[tone].hover, backgroundColor: 'transparent', textDecoration: 'underline', textUnderlineOffset: '6px' },
  '&.active': { color: tone === 'inherit' ? 'inherit' : BAR[tone].hover, textDecoration: 'underline', textUnderlineOffset: '6px', textDecorationThickness: '2px' },
});

function NavItem({ to, children, onClick, end, tone }) {
  return (
    <Button
      component={NavLink}
      to={to}
      end={end}
      onClick={onClick}
      sx={navSx(tone)}
    >
      {children}
    </Button>
  );
}

const NO_OVERSHOOT = 'cubic-bezier(0.22, 1, 0.36, 1)';

function CartButton({ tone }) {
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
        color: tone === 'inherit' ? 'inherit' : BAR[tone].ink,
        '&:hover': { color: tone === 'inherit' ? 'inherit' : BAR[tone].hover, backgroundColor: tone === 'light' ? 'rgba(22,18,14,0.06)' : tone === 'brand' ? 'rgba(42,39,233,0.08)' : 'rgba(242,237,227,0.08)' },
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
  const scrolled = useScrolled(landing);
  // Bar states. Store pages: the light frosted bar with the ink logo. Landing: the frosted white bar with the navy
  // logo and royal-blue accents, transparent only at scroll 0 over the white hero. /g10: a low-alpha frosted bar that takes the story's ink
  // (its grounds change colour per chapter; an opaque bar would crop the boot and clash).
  const tone = story ? 'inherit' : landing ? 'brand' : 'light'; // which bar: BAR.brand / BAR.light
  const bar = landing ? BAR.brand : BAR.light;
  const clear = landing && !scrolled;

  const links = (onClick, t = tone) => (
    <>
      <NavItem to="/shop" onClick={onClick} tone={t}>Shop</NavItem>
      <Button component={RouterLink} to="/shop?category=new-arrival" onClick={onClick} sx={navSx(t)}>
        New arrivals
      </Button>
      <NavItem to="/g10" onClick={onClick} tone={t}>G10 in 3D</NavItem>
      {me.data ? (
        <NavItem to="/account" onClick={onClick} tone={t}>Account</NavItem>
      ) : (
        <NavItem to="/login" onClick={onClick} tone={t}>Log in</NavItem>
      )}
      {isAdmin ? <NavItem to="/admin" onClick={onClick} tone={t}>Admin</NavItem> : null}
    </>
  );

  return (
    <MuiAppBar
      component="header"
      position="fixed"
      elevation={0}
      data-bar={story ? 'story' : clear ? 'clear' : landing ? 'brand' : 'light'}
      sx={{
        zIndex: 1200,
        top: 0,
        left: 0,
        right: 0,
        boxShadow: 'none',
        backgroundImage: 'none',
        transition: 'background-color 320ms ease, border-color 320ms ease, backdrop-filter 320ms ease, color 300ms ease',
        borderBottom: '1px solid transparent',
        ...(story
          ? {
              color: 'var(--story-ink, #F2EDE3)',
              backgroundColor: 'color-mix(in srgb, var(--story-ink, #F2EDE3) 6%, transparent)',
              backdropFilter: 'blur(12px) saturate(1.2)',
              WebkitBackdropFilter: 'blur(12px) saturate(1.2)',
              borderBottomColor: 'color-mix(in srgb, var(--story-ink, #F2EDE3) 14%, transparent)',
              '& .MuiButton-root, & .MuiIconButton-root, & .MuiTypography-root, & a': { color: 'inherit' },
              '& svg path[fill]': { fill: 'currentColor' },
            }
          : {
              color: bar.ink,
              backgroundColor: clear ? 'transparent' : bar.ground,
              backdropFilter: clear ? 'none' : 'blur(16px) saturate(1.3)',
              WebkitBackdropFilter: clear ? 'none' : 'blur(16px) saturate(1.3)',
              borderBottomColor: clear ? 'transparent' : bar.line,
            }),
      }}
    >
      <Toolbar sx={{ px: PAGE_PX, maxWidth: 1440, width: '100%', mx: 'auto', boxSizing: 'border-box', gap: 1 }} disableGutters>
        <AnimatedGoldstarLogo tone={tone} />

        <Box sx={{ flex: 1 }} />

        {/* Desktop Navigation Links */}
        <Box component="nav" aria-label="Main" sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
          {links()}
        </Box>

        {/* Shopping Cart Button */}
        <CartButton tone={tone} />

        {/* Mobile Menu Button */}
        <IconButton
          aria-label="Open menu"
          onClick={openMenu}
          sx={{
            display: { md: 'none' },
            mr: -1.5,
            color: tone === 'inherit' ? 'inherit' : BAR[tone].ink,
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
            PaperProps={{ sx: { width: { xs: '100vw', sm: 360 }, height: '100%', backgroundColor: landing ? '#FFFFFF' : '#0D0C0A', color: landing ? BAR.brand.ink : BAR.dark.ink } }}
          >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton aria-label="Close menu" onClick={closeMenu} sx={{ color: landing ? BAR.brand.ink : BAR.dark.ink }}>
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
                '& .MuiButton-root': { fontSize: 22, minHeight: 52 },
              }}
            >
              {links(closeMenu, landing ? 'brand' : 'dark')}
            </Box>
          </Drawer>
        </Suspense>
      ) : null}
    </MuiAppBar>
  );
}
