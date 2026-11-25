import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Link as RouterLink, NavLink, useLocation, useNavigate } from 'react-router';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
const Drawer = lazy(() => import('@mui/material/Drawer'));
import { useReducedMotion } from 'motion/react';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { tokens } from '../theme/tokens.js';
import { PAGE_PX } from './Page.jsx';
import { SHORT } from '../landing-v2/tokensV2.js';
import Logo from '../landing/Logo.jsx';
import { leaveOnClick, useBackToClose } from '../lib/useBackToClose.js';
import { useMe } from '../api/hooks.js';
import { useCart, cartCount, cartVisibleCount } from '../store/cart.js';
import { useUi } from '../store/ui.js';
import { isLandingPath, isStoryPath } from '../lib/paths.js';

// Bar palettes. Every text colour here is AA (>= 4.5:1) on its bar: ivory on the dark bars, ink and deep gold on the
// light store bar (the white wordmark with a glow used to vanish on the white bar on /shop), navy and Goldstar royal
// blue on the landing's frosted white bar (the landing is a white "daylight" page, tokens in landing-v2/tokensV2.js).
const BAR = {
  brand: { ink: '#0B1A48', sub: '#2A27E9', hover: '#2A27E9', ground: 'rgba(255,255,255,0.94)', line: 'rgba(11,26,72,0.10)' },
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

// The Goldstar logo (the "GoldStar®" crop of the real wordmark). tone names the bar it sits on: 'dark' (white
// wordmark), 'light' and 'brand' (navy wordmark), 'inherit' (the /g10 story's current ink, via a CSS mask).
// The link carries the accessible name, so the image is decorative (alt="").
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
      aria-label="Goldstar home"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        textDecoration: 'none',
        minHeight: 44,
        py: 0.5,
        cursor: 'pointer',
        flex: '0 0 auto',
        '& .gs-logo': { transition: reduced ? 'none' : 'opacity 200ms ease, transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)' },
        '&:hover .gs-logo': { opacity: 0.82, transform: reduced ? 'none' : 'translateY(-1px)' },
        '&:focus-visible': { outline: `2px solid ${tone === 'inherit' ? 'currentColor' : BAR[tone].hover}`, outlineOffset: 4, borderRadius: '6px' },
      }}
    >
      <Logo
        variant="mark"
        tone={tone === 'inherit' ? 'current' : tone === 'dark' ? 'white' : 'navy'}
        alt=""
        className="gs-logo"
        sx={{ height: { xs: 26, sm: 30, md: 34 } }}
      />
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
  const leaveMenu = useBackToClose(menuOpen, closeMenu); // phones: Back closes the menu

  useEffect(() => {
    closeMenu();
  }, [loc.pathname, loc.hash, closeMenu]);

  const story = isStoryPath(loc.pathname);
  const landing = isLandingPath(loc.pathname);
  const scrolled = useScrolled(landing);
  const admin = loc.pathname === '/admin' || loc.pathname.startsWith('/admin/');
  // Bar states. Landing and the store (shop, product, login, register, account, checkout, and any unknown path):
  // the frosted white bar with the navy logo and royal-blue accents. Only the landing is transparent, at scroll 0
  // over its white hero. Admin keeps the light cream bar. /g10: a low-alpha frosted bar that takes the story's ink
  // (its grounds change colour per chapter; an opaque bar would crop the boot and clash).
  const brand = !story && !admin;
  const tone = story ? 'inherit' : brand ? 'brand' : 'light'; // which bar: BAR.brand / BAR.light
  const bar = brand ? BAR.brand : BAR.light;
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
      data-bar={story ? 'story' : clear ? 'clear' : brand ? 'brand' : 'light'}
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
      <Toolbar
        sx={{
          px: PAGE_PX, maxWidth: 1440, width: '100%', mx: 'auto', boxSizing: 'border-box', gap: 1,
          // Landscape phones: a compact bar (more of the short screen for the page) whose ends clear a notch.
          [SHORT]: { minHeight: 52, pl: 'max(16px, env(safe-area-inset-left))', pr: 'max(16px, env(safe-area-inset-right))' },
        }}
        disableGutters
      >
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
          >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', [SHORT]: { p: 1, pr: 'max(8px, env(safe-area-inset-right))' } }}>
              <IconButton aria-label="Close menu" onClick={closeMenu} sx={{ color: brand ? BAR.brand.ink : BAR.dark.ink }}>
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
                [SHORT]: { gap: 0.5, pl: 'max(24px, env(safe-area-inset-left))', '& .MuiButton-root': { fontSize: 18, minHeight: 44 } },
              }}
            >
              {links(leaveOnClick(leaveMenu), brand ? 'brand' : 'dark')}
            </Box>
          </Drawer>
        </Suspense>
      ) : null}
    </MuiAppBar>
  );
}
