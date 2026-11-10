import { Suspense, lazy, useEffect, useRef } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Button from '@mui/material/Button';
import GlobalStyles from '@mui/material/GlobalStyles';
import { ThemeProvider } from '@mui/material/styles';
import { shopTheme } from '../theme/shopTheme.js';
import { theme as storyTheme } from '../theme/theme.js';
import { shop } from '../theme/tokens.js';
import AppBar from './AppBar.jsx';
import Footer from './Footer.jsx';
import { useUi } from '../store/ui.js';
import { useMe } from '../api/hooks.js';
import { visuallyHidden } from './Page.jsx';
import { isStoryPath } from '../lib/paths.js';

const CartDrawer = lazy(() => import('./CartDrawer.jsx'));

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
      // Phones: full width at the bottom, lifted above the landing's Buy bar when it shows (--gs-bottom-ui).
      sx={{ '@media (max-width:599.95px)': { left: 0, right: 0, bottom: 'var(--gs-bottom-ui, 0px)', '& .MuiSnackbarContent-root': { width: '100%', minWidth: 0 } } }}
      action={
        snackbar?.actionLabel ? (
          <Button size="small" onClick={() => { snackbar.onAction?.(); hide(); }} sx={{ minHeight: 44, color: shop.saffron, '&:hover': { color: shop.saffron } }}>{snackbar.actionLabel}</Button>
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

// Commerce routes (and the landing, which paints its own dark and light bands) use the light shop theme; the G10
// story (/g10) keeps its own grounds; the admin has its own shell.
export const isAdminPath = (pathname) => pathname === '/admin' || pathname.startsWith('/admin/');
// (A non-admin on /admin sees the store's light 404 page.)
export const isLightRoute = (pathname) => !isStoryPath(pathname);

const lightGlobals = (
  <GlobalStyles
    styles={{
      html: { colorScheme: 'light' },
      body: { backgroundColor: shop.ground, color: shop.ink },
      '::selection': { backgroundColor: shop.blue, color: '#FFFFFF' },
      ':focus-visible': { outline: `3px solid ${shop.blue}`, outlineOffset: 2 },
      'input:-webkit-autofill': { WebkitBoxShadow: `0 0 0 100px ${shop.surface} inset`, WebkitTextFillColor: shop.ink, caretColor: shop.ink },
      '@keyframes gsFade': { from: { opacity: 0 }, to: { opacity: 1 } },
      '@keyframes gsRise': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
    }}
  />
);

// One provider whose theme swaps (not a conditional wrapper), so the header and main never remount on navigation.
function Themed({ light, children }) {
  return <ThemeProvider theme={light ? shopTheme : storyTheme}>{children}</ThemeProvider>;
}

export default function Layout() {
  const headRef = useRef(null);
  const loc = useLocation();
  const light = isLightRoute(loc.pathname);
  const me = useMe();
  // Admins on /admin get the console shell alone (no store header, footer or cart). Anyone else keeps the store
  // chrome, so a non-admin sees the ordinary store 404 there and the panel is not advertised.
  const bare = isAdminPath(loc.pathname) && (me.isLoading || me.data?.role === 'admin');

  // Expose the sticky header height so sticky story frames can clear it.
  useEffect(() => {
    const el = headRef.current?.querySelector('header');
    if (!el) return undefined;
    const set = () => document.documentElement.style.setProperty('--appbar-h', `${el.getBoundingClientRect().height}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, [bare]);

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

  if (bare) {
    return (
      <>
        <Outlet />
        <Announcer />
        <ScrollRestoration getKey={(l) => l.pathname + l.search} />
      </>
    );
  }

  return (
    <Box ref={headRef}>
      <Box
        component="a"
        href="#content"
        sx={{ ...visuallyHidden, '&:focus': { position: 'fixed', top: 8, left: 8, width: 'auto', height: 'auto', margin: 0, clip: 'auto', zIndex: 2000, backgroundColor: 'primary.main', color: 'primary.contrastText', p: 2, fontWeight: 600 } }}
      >
        Skip to content
      </Box>
      <Themed light={light}>
        {light ? lightGlobals : null}
        <AppBar />
        <Box component="main" id="content" tabIndex={-1} sx={{ outline: 'none', minHeight: '60vh', ...(light ? { backgroundColor: shop.ground, color: shop.ink } : null) }}>
          <Suspense fallback={<Box sx={{ minHeight: '70vh' }} />}>
            {/* No transformed wrapper on the story or the landing: their fixed/sticky stages must not sit inside one. */}
            {isStoryPath(loc.pathname) || loc.pathname === '/' ? <Outlet /> : <RouteTransition />}
          </Suspense>
        </Box>
      </Themed>
      <Footer />
      <ThemeProvider theme={shopTheme}>
        <Suspense fallback={null}><CartDrawer /></Suspense>
        <Toasts />
      </ThemeProvider>
      <Announcer />
      <ScrollRestoration getKey={(l) => l.pathname + l.search} />
    </Box>
  );
}
