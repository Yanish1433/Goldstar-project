import { Suspense, lazy, useEffect, useRef } from 'react';
import { Link as RouterLink, NavLink, useLocation } from 'react-router';
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
import { brand } from '../theme/tokens.js';
import Logo from '../landing/Logo.jsx';

export function Star({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" fill={tokens.gold} />
    </svg>
  );
}

const navSx = (active) => ({ color: active ? 'primary.main' : 'text.primary', minHeight: 44, px: 2 });

function NavItem({ to, children, onClick, end }) {
  return (
    <Button component={NavLink} to={to} end={end} onClick={onClick} sx={{ color: 'text.primary', minHeight: 44, px: 2, '&.active': { color: 'primary.main' } }}>
      {children}
    </Button>
  );
}

// Badge feedback (Addendum B U8) with the Web Animations API (no extra JS animation engine in the entry chunk):
// the number scales 1 -> 1.25 -> 1 on a critically damped curve (no overshoot), a 180 ms colour flash to goldLight,
// and a 2 px nudge of the bag. Reduced motion: the colour flash only.
const NO_OVERSHOOT = 'cubic-bezier(0.22, 1, 0.36, 1)';

function CartButton() {
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
    <IconButton id="cart-button" aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`} onClick={openCart} sx={{ ml: 0.5, mr: { xs: 0, md: -1.5 } }}>
      <Badge
        sx={{ '& .MuiBadge-badge': { backgroundColor: 'transparent', padding: 0, minWidth: 0, height: 'auto' } }}
        badgeContent={
          <span
            ref={pill}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 20, height: 20, borderRadius: 10, padding: '0 5px', boxSizing: 'border-box', backgroundColor: tokens.gold, color: tokens.onGold, fontSize: 12, fontWeight: 700 }}
          >
            {visible}
          </span>
        }
        invisible={visible === 0}
      >
        <span ref={icon} style={{ display: 'inline-flex' }}>
          <ShoppingBag size={20} strokeWidth={1.75} aria-hidden="true" />
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

  const links = (onClick) => (
    <>
      <NavItem to="/g10" onClick={onClick}>G10 in 3D</NavItem>
      <NavItem to="/shop" onClick={onClick}>Shop</NavItem>
      <Button component={RouterLink} to="/g10#story-anatomy" onClick={onClick} sx={navSx(false)}>Technology</Button>
      {me.data ? <NavItem to="/account" onClick={onClick}>Account</NavItem> : <NavItem to="/login" onClick={onClick}>Log in</NavItem>}
      {isAdmin ? <NavItem to="/admin" onClick={onClick}>Admin</NavItem> : null}
    </>
  );

  const story = isStoryPath(loc.pathname);
  const landing = isLandingPath(loc.pathname);
  return (
    <MuiAppBar
      component="header"
      sx={{
        zIndex: 1200,
        // G10 story: the header floats over the story and takes the current section's ink.
        ...(story
          ? { backgroundColor: 'transparent', color: 'var(--story-ink, #F2EDE3)', transition: 'color 300ms ease', '& .MuiButton-root, & .MuiIconButton-root, & .MuiTypography-root, & a': { color: 'inherit' }, '& svg path[fill]': { fill: 'currentColor' } }
          : null),
        // Landing: a dark glass bar over the night-navy hero (Apple-style product nav), white ink, knockout logo.
        ...(landing
          ? {
            backgroundColor: 'rgba(10,12,40,0.72)', backdropFilter: 'saturate(1.6) blur(18px)', boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.08)', color: brand.onNight,
            '& .MuiButton-root, & .MuiIconButton-root, & a': { color: 'inherit' }, '& .MuiButton-root.active': { color: brand.goldText },
          }
          : null),
      }}
    >
      <Toolbar sx={{ px: PAGE_PX, maxWidth: 1440, width: '100%', mx: 'auto', boxSizing: 'border-box', gap: 1 }} disableGutters>
        {story ? (
        <Box component={RouterLink} to="/" aria-label="Goldstar, home" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary', textDecoration: 'none', minHeight: 44 }}>
          <Star />
          <Typography component="span" sx={{ fontWeight: 600, fontSize: 18, fontStretch: '105%', fontVariationSettings: '"wdth" 105', lineHeight: 1 }}>Goldstar</Typography>
          <Typography component="span" lang="ne" sx={{ fontFamily: 'Mukta', fontWeight: 600, fontSize: 17, color: 'text.secondary', display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>
            गोल्डस्टार
          </Typography>
        </Box>
        ) : (
          <Box component={RouterLink} to="/" aria-label="Goldstar Shoes, home" sx={{ display: 'flex', alignItems: 'center', minHeight: 44, '&:focus-visible': { outlineOffset: 4 } }}>
            <Logo tone={landing ? 'white' : 'navy'} sx={{ height: { xs: 20, sm: 24 } }} />
          </Box>
        )}
        <Box sx={{ flex: 1 }} />
        <Box component="nav" aria-label="Main" sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>{links()}</Box>
        <CartButton />
        <IconButton aria-label="Open menu" onClick={openMenu} sx={{ display: { md: 'none' }, mr: -1.5 }}>
          <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
        </IconButton>
      </Toolbar>
      {menuOpen || menuSeen.current ? (
      <Suspense fallback={null}>
      <Drawer anchor="right" open={menuOpen} onClose={closeMenu} PaperProps={{ sx: { width: { xs: '100vw', sm: 360 }, height: '100%' } }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton aria-label="Close menu" onClick={closeMenu}>
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </IconButton>
        </Box>
        <Box component="nav" aria-label="Main" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', px: 2, gap: 1, '& .MuiButton-root': { fontSize: 24, minHeight: 56 } }}>
          {links(closeMenu)}
        </Box>
      </Drawer>
      </Suspense>
      ) : null}
    </MuiAppBar>
  );
}
