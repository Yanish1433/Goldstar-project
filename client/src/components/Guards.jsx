import { Navigate, Outlet, useLocation } from 'react-router';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { useMe } from '../api/hooks.js';
import NotFound from '../pages/NotFound.jsx';
import { PageBox } from './Page.jsx';

function Pending() {
  return (
    <PageBox sx={{ py: 8, minHeight: '60vh' }}>
      <Skeleton variant="rectangular" height={48} width="40%" sx={{ mb: 3 }} />
      <Skeleton variant="rectangular" height={240} />
    </PageBox>
  );
}

export function RequireAuth() {
  const me = useMe();
  const loc = useLocation();
  if (me.isLoading) return <Pending />;
  if (!me.data) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const me = useMe();
  if (me.isLoading) return <Pending />;
  if (me.data?.role !== 'admin') return <NotFound />; // do not advertise the panel
  return <Outlet />;
}

export function GuestOnly() {
  const me = useMe();
  const loc = useLocation();
  if (me.isLoading) return <Pending />;
  if (me.data) {
    const next = new URLSearchParams(loc.search).get('next');
    return <Navigate to={next && next.startsWith('/') && !next.startsWith('//') ? next : '/account'} replace />;
  }
  return (
    <Box>
      <Outlet />
    </Box>
  );
}
