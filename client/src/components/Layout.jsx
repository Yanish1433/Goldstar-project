import { Suspense, lazy, useEffect, useRef } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Button from '@mui/material/Button';
import AppBar from './AppBar.jsx';
import Footer from './Footer.jsx';
import { useUi } from '../store/ui.js';
import { visuallyHidden } from './Page.jsx';

const CartDrawer = lazy(() => import('./CartDrawer.jsx'));

const BoxIntoCart = lazy(() => import('../three/BoxIntoCart.jsx'));

// The overlay chunk loads the first time an add-to-cart animation is requested.
function CartBoxHost() {
  const active = useUi((s) => !!s.cartBox);
  return active ? <Suspense fallback={null}><BoxIntoCart /></Suspense> : null;
}

const RouteTransition = lazy(() => import('./RouteTransition.jsx'));

function Toasts() {
  const snackbar = useUi((s) => s.snackbar);
  const hide = useUi((s) => s.hideSnackbar);
  return (
    <Snackbar
      open={!!snackbar}
      autoHideDuration={4000}
      onClose={(_, reason) => reason !== 'clickaway' && hide()}
      message={snackbar?.message}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      sx={{ '@media (max-width:599.95px)': { left: 0, right: 0, bottom: 0, '& .MuiSnackbarContent-root': { width: '100%', minWidth: 0 } } }}
      action={
        snackbar?.actionLabel ? (
          <Button size="small" onClick={() => { snackbar.onAction?.(); hide(); }} sx={{ minHeight: 44 }}>{snackbar.actionLabel}</Button>
        ) : null
      }
    />
  );
}

function Announcer() {
  const text = useUi((s) => s.announcement);
  return (
    <Box role="status" aria-live="polite" aria-atomic="true" sx={visuallyHidden}>
      {text}
    </Box>
  );
}

export default function Layout() {
  const headRef = useRef(null);
  const loc = useLocation();

  // Expose the sticky header height so sticky story frames can clear it.
  useEffect(() => {
    const el = headRef.current?.querySelector('header');
    if (!el) return undefined;
    const set = () => document.documentElement.style.setProperty('--appbar-h', `${el.getBoundingClientRect().height}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Hash links (e.g. /#story-explode, /#credits).
  useEffect(() => {
    if (!loc.hash) return undefined;
    const id = decodeURIComponent(loc.hash.slice(1));
    let tries = 0;
    const t = setInterval(() => {
      const el = document.getElementById(id);
      tries += 1;
      if (el) {
        el.scrollIntoView({ behavior: 'auto', block: 'start' });
        clearInterval(t);
      } else if (tries > 40) clearInterval(t);
    }, 100);
    return () => clearInterval(t);
  }, [loc.hash, loc.pathname]);

  return (
    <Box ref={headRef}>
      <Box
        component="a"
        href="#content"
        sx={{ ...visuallyHidden, '&:focus': { position: 'fixed', top: 8, left: 8, width: 'auto', height: 'auto', margin: 0, clip: 'auto', zIndex: 2000, backgroundColor: 'primary.main', color: 'primary.contrastText', p: 2, fontWeight: 600 } }}
      >
        Skip to content
      </Box>
      <AppBar />
      <Box component="main" id="content" tabIndex={-1} sx={{ outline: 'none', minHeight: '60vh' }}>
        <Suspense fallback={<Box sx={{ minHeight: '70vh' }} />}>
          {loc.pathname === '/' ? <Outlet /> : <RouteTransition />}
        </Suspense>
      </Box>
      <Footer />
      <Suspense fallback={null}><CartDrawer /></Suspense>
      <CartBoxHost />
      <Toasts />
      <Announcer />
      <ScrollRestoration getKey={(l) => l.pathname + l.search} />
    </Box>
  );
}
