import { Navigate, Outlet, useLocation } from 'react-router';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { useMe } from '../api/hooks.js';
import NotFound from '../pages/NotFound.jsx';
import { PageBox } from './Page.jsx';
import { landingFor } from '../lib/paths.js';
import { LoadError } from '../api/NetworkStates.jsx';

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
  if (me.isError) return <LoadError error={me.error} onRetry={() => me.refetch()} />;
  if (!me.data) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const me = useMe();
  const loc = useLocation();
  if (me.isLoading) return <Pending />;
  if (me.isError) return <LoadError error={me.error} onRetry={() => me.refetch()} minHeight="100dvh" />;
  // Signed out (or the session expired): log in and come back. Signed in without admin rights: do not advertise the panel.
  if (!me.data) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  if (me.data.role !== 'admin') return <NotFound />;
  return <Outlet />;
}

export function GuestOnly() {
  const me = useMe();
  const loc = useLocation();
  if (me.isLoading) return <Pending />;
  if (me.data) {
    return <Navigate to={landingFor(me.data, new URLSearchParams(loc.search).get('next'))} replace />;
  }
  return (
    <Box>
      <Outlet />
    </Box>
  );
}
