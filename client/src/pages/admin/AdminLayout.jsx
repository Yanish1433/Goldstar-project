import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link as RouterLink } from 'react-router';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Button from '@mui/material/Button';
import {
  LayoutDashboard, ShoppingCart, Package, Users, Settings, PanelLeftClose, PanelLeftOpen, Menu as MenuIcon,
  Moon, Sun, LogOut, ChevronRight, X, Search,
} from 'lucide-react';
import { makeAdminTheme, ADMIN_COARSE } from '../../theme/adminTheme.js';
import { useAdmin } from '../../store/admin.js';
import { useUi } from '../../store/ui.js';
import { useAdminOrders, useLogout, useMe } from '../../api/hooks.js';
import { visuallyHidden } from '../../components/Page.jsx';
import { Avatar } from './kit.jsx';
import Logo from '../../landing/Logo.jsx';
import GlobalSearch from './GlobalSearch.jsx';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, badge: 'placed' },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

const W_OPEN = 248;
const W_SHUT = 72;

function Brand({ compact }) {
  return (
    <Box component={RouterLink} to="/admin" aria-label="Goldstar Admin, dashboard" sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: 'inherit', textDecoration: 'none', minHeight: 40, [ADMIN_COARSE]: { minHeight: 44 }, borderRadius: '8px' }}>
      {/* The real wordmark, in the admin ink (CSS mask). Compact rail: the same mark, clipped to the "G". */}
      {compact ? (
        <Box sx={{ width: 32, height: 28, overflow: 'hidden', flex: 'none' }}>
          <Logo variant="mark" tone="current" alt="" sx={{ height: 28, maxWidth: "none" }} />
        </Box>
      ) : (
        <Logo variant="mark" tone="current" alt="" sx={{ height: 24 }} />
      )}
      {compact ? null : (
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, whiteSpace: 'nowrap' }}>
          <Typography component="span" sx={(th) => ({ fontWeight: 700, fontSize: 12, color: th.admin.ink2, textTransform: 'uppercase', letterSpacing: '0.08em' })}>Admin</Typography>
        </Box>
      )}
    </Box>
  );
}

function NavList({ compact, onNavigate }) {
  const placed = useAdminOrders({ status: 'placed', page: 1, limit: 1 });
  const placedCount = placed.data?.total || 0;
  const linkSx = (th) => ({
    display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 40, [ADMIN_COARSE]: { minHeight: 44 }, px: compact ? 0 : 1.5, justifyContent: compact ? 'center' : 'flex-start',
    borderRadius: '8px', color: th.admin.ink2, textDecoration: 'none', fontWeight: 600, fontSize: 14.5, position: 'relative',
    transition: 'background-color 160ms ease, color 160ms ease',
    '&:hover': { backgroundColor: th.admin.sunk, color: th.admin.ink },
    '&.active': { backgroundColor: th.admin.accentWash, color: th.admin.accentText },
    '&:focus-visible': { outline: `2px solid ${th.admin.accentText}`, outlineOffset: 1 },
  });
  const item = (n) => {
    const Icon = n.icon;
    const count = n.badge === 'placed' ? placedCount : 0;
    const link = (
      <Box component={NavLink} to={n.to} end={n.end} onClick={onNavigate} sx={linkSx} aria-label={compact ? `${n.label}${count ? `, ${count} new` : ''}` : undefined}>
        <Icon size={19} aria-hidden="true" style={{ flex: 'none' }} />
        {compact ? null : <Box component="span" sx={{ flex: 1 }}>{n.label}</Box>}
        {count ? (
          <Box
            component="span"
            sx={(th) => ({
              minWidth: 20, height: 20, px: 0.75, borderRadius: 999, backgroundColor: th.admin.accent, color: '#FFFFFF', fontSize: 11.5, fontWeight: 800, display: 'grid', placeItems: 'center', fontVariantNumeric: 'tabular-nums',
              ...(compact ? { position: 'absolute', top: 2, right: 8, minWidth: 18, height: 18, fontSize: 10.5 } : null),
            })}
          >
            {count}
            {compact ? null : <Box component="span" sx={visuallyHidden}> new</Box>}
          </Box>
        ) : null}
      </Box>
    );
    return (
      <li key={n.to}>
        {compact ? <Tooltip title={n.label} placement="right">{link}</Tooltip> : link}
      </li>
    );
  };
  return (
    <Box component="nav" aria-label="Admin" sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>{NAV.map(item)}</Box>
    </Box>
  );
}

function Sidebar({ compact }) {
  const toggle = useAdmin((s) => s.toggleCollapsed);
  return (
    <Box
      component="aside"
      sx={(th) => ({
        position: 'sticky', top: 0, height: '100dvh', width: compact ? W_SHUT : W_OPEN, flex: 'none', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: 3, px: compact ? 1.5 : 2, py: 2,
        backgroundColor: th.admin.surface, borderRight: `1px solid ${th.admin.line}`, transition: 'width 200ms cubic-bezier(0.22,1,0.36,1)', overflow: 'hidden',
        '@media print': { display: 'none' },
      })}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: compact ? 'center' : 'space-between', minHeight: 40 }}>
        <Brand compact={compact} />
      </Box>
      <NavList compact={compact} />
      <Tooltip title={compact ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
        <IconButton onClick={toggle} aria-label={compact ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!compact} sx={{ alignSelf: compact ? 'center' : 'flex-start' }}>
          {compact ? <PanelLeftOpen size={19} aria-hidden="true" /> : <PanelLeftClose size={19} aria-hidden="true" />}
        </IconButton>
      </Tooltip>
    </Box>
  );
}

function AccountMenu() {
  const me = useMe().data;
  const mode = useAdmin((s) => s.mode);
  const toggleMode = useAdmin((s) => s.toggleMode);
  const logout = useLogout();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(null);
  const signOut = async () => {
    setAnchor(null);
    await logout.mutateAsync().catch(() => {});
    navigate('/login', { replace: true });
  };
  return (
    <>
      <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label={`Account: ${me?.name || 'Admin'}`} aria-haspopup="menu" aria-expanded={!!anchor} aria-controls={anchor ? 'admin-account-menu' : undefined} sx={{ width: 'auto', px: 0.5, gap: 1 }}>
        <Avatar name={me?.name || 'Admin'} size={32} />
      </IconButton>
      <Menu id="admin-account-menu" anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} slotProps={{ paper: { sx: { minWidth: 240 } } }}>
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{me?.name}</Typography>
          <Typography variant="caption" sx={(th) => ({ color: th.admin.ink2 })}>{me?.email}</Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={() => { toggleMode(); setAnchor(null); }}>
          {mode === 'dark' ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
          {mode === 'dark' ? 'Light theme' : 'Dark theme'}
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={signOut}><LogOut size={17} aria-hidden="true" />Sign out</MenuItem>
      </Menu>
    </>
  );
}

function TopBar({ desktop }) {
  const title = useAdmin((s) => s.title);
  const crumbs = useAdmin((s) => s.crumbs);
  const mode = useAdmin((s) => s.mode);
  const toggleMode = useAdmin((s) => s.toggleMode);
  const setDrawer = useAdmin((s) => s.setDrawer);
  const [searchOpen, setSearchOpen] = useState(false);
  const wide = useMediaQuery('(min-width:720px)');
  const showSearchField = wide || searchOpen;
  return (
    <Box
      component="header"
      sx={(th) => ({
        position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, minHeight: 64, px: { xs: 1.5, sm: 3 },
        backgroundColor: th.palette.mode === 'dark' ? 'rgba(16,15,13,0.86)' : 'rgba(246,244,239,0.86)', backdropFilter: 'saturate(1.3) blur(12px)',
        borderBottom: `1px solid ${th.admin.line}`, '@media print': { display: 'none' },
      })}
    >
      {!desktop && !searchOpen ? (
        <IconButton onClick={() => setDrawer(true)} aria-label="Open navigation" edge="start"><MenuIcon size={20} aria-hidden="true" /></IconButton>
      ) : null}
      {!searchOpen || wide ? (
        <Box sx={{ minWidth: 0, flex: wide ? '0 1 auto' : 1, mr: 'auto' }}>
          {crumbs.length ? (
            <Box component="nav" aria-label="Breadcrumb" sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 12.5 }}>
                {crumbs.map((c) => (
                  <Box component="li" key={c.to} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box component={RouterLink} to={c.to} sx={(th) => ({ color: th.admin.ink2, textDecoration: 'none', fontWeight: 600, [ADMIN_COARSE]: { display: 'inline-flex', alignItems: 'center', minHeight: 44, minWidth: 44 }, '&:hover': { color: th.admin.ink, textDecoration: 'underline' } })}>{c.label}</Box>
                    <ChevronRight size={13} aria-hidden="true" />
                  </Box>
                ))}
              </Box>
            </Box>
          ) : null}
          <Typography variant="h1" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: { xs: 18, sm: 22 } }}>{title}</Typography>
        </Box>
      ) : null}
      {showSearchField ? (
        <Box sx={{ flex: wide ? '0 1 380px' : 1, ml: wide ? 'auto' : 0, display: 'flex', alignItems: 'center', gap: 1 }}>
          <GlobalSearch autoFocus={!wide} onDone={() => setSearchOpen(false)} />
          {!wide ? <IconButton onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={20} aria-hidden="true" /></IconButton> : null}
        </Box>
      ) : (
        <IconButton onClick={() => setSearchOpen(true)} aria-label="Search orders, products and customers"><Search size={20} aria-hidden="true" /></IconButton>
      )}
      {!searchOpen || wide ? (
        <>
          <Tooltip title={mode === 'dark' ? 'Light theme' : 'Dark theme'}>
            <IconButton onClick={toggleMode} aria-label={mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
              {mode === 'dark' ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
            </IconButton>
          </Tooltip>
          <AccountMenu />
        </>
      ) : null}
    </Box>
  );
}

function AdminToasts() {
  const snackbar = useUi((s) => s.snackbar);
  const hide = useUi((s) => s.hideSnackbar);
  return (
    <Snackbar
      open={!!snackbar}
      autoHideDuration={4000}
      onClose={(_, reason) => reason !== 'clickaway' && hide()}
      message={snackbar?.message}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      action={snackbar?.actionLabel ? <Button size="small" onClick={() => { snackbar.onAction?.(); hide(); }} sx={{ color: 'inherit', textDecoration: 'underline' }}>{snackbar.actionLabel}</Button> : null}
    />
  );
}

export function Component() {
  return <AdminLayout />;
}

export default function AdminLayout() {
  const mode = useAdmin((s) => s.mode);
  const collapsed = useAdmin((s) => s.collapsed);
  const drawerOpen = useAdmin((s) => s.drawerOpen);
  const setDrawer = useAdmin((s) => s.setDrawer);
  const theme = useMemo(() => makeAdminTheme(mode), [mode]);
  const desktop = useMediaQuery('(min-width:900px)', { noSsr: true });
  const loc = useLocation();

  useEffect(() => {
    setDrawer(false);
    window.scrollTo(0, 0);
  }, [loc.pathname, setDrawer]);
  useEffect(() => {
    document.documentElement.style.background = theme.admin.canvas;
  }, [theme]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        component="a"
        href="#admin-main"
        sx={{ ...visuallyHidden, '&:focus': { position: 'fixed', top: 8, left: 8, width: 'auto', height: 'auto', margin: 0, clip: 'auto', zIndex: 2000, backgroundColor: 'primary.main', color: '#FFFFFF', px: 2, py: 1.5, borderRadius: '8px', fontWeight: 700 } }}
      >
        Skip to content
      </Box>
      <Box sx={(th) => ({ display: 'flex', minHeight: '100dvh', backgroundColor: th.admin.canvas, color: th.admin.ink })}>
        {desktop ? <Sidebar compact={collapsed} /> : (
          <Drawer open={drawerOpen} onClose={() => setDrawer(false)} slotProps={{ paper: { sx: { width: 280, p: 2, display: 'flex', flexDirection: 'column', gap: 3 } } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Brand />
              <IconButton onClick={() => setDrawer(false)} aria-label="Close navigation"><X size={20} aria-hidden="true" /></IconButton>
            </Box>
            <NavList onNavigate={() => setDrawer(false)} />
          </Drawer>
        )}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <TopBar desktop={desktop} />
          <Box component="main" id="admin-main" tabIndex={-1} sx={{ outline: 'none', flex: 1, px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 2, sm: 3 }, width: '100%', maxWidth: 1480, mx: 'auto', boxSizing: 'border-box', '@media print': { p: 0, maxWidth: 'none' } }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
      <AdminToasts />
    </ThemeProvider>
  );
}
