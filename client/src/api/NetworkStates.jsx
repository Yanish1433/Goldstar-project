import { useState, useSyncExternalStore } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { CloudOff, WifiOff } from 'lucide-react';
import { ApiError } from './client.js';

const subscribe = (cb) => {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
};
const getOnline = () => navigator.onLine;

/** navigator.onLine, kept in sync with the browser's online/offline events. */
export function useOnline() {
  return useSyncExternalStore(subscribe, getOnline, () => true);
}

/** A small fixed banner while the browser is offline. React Query refetches on its own when the connection returns. */
export function OfflineBanner() {
  const online = useOnline();
  return (
    <Box role="status" aria-live="polite" sx={{ position: 'fixed', left: 0, right: 0, bottom: 16, zIndex: 2100, display: 'flex', justifyContent: 'center', pointerEvents: 'none', px: 2, '@media print': { display: 'none' } }}>
      {online ? null : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25, borderRadius: 999, backgroundColor: '#1C1B19', color: '#FFFFFF', fontSize: 14, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', maxWidth: 520 }}>
          <WifiOff size={17} aria-hidden="true" style={{ flex: 'none' }} />
          You are offline. We will reconnect when your connection is back.
        </Box>
      )}
    </Box>
  );
}

/** Title and body for a failed request, by kind: offline, server unreachable / timed out, or a server error. */
export function describeError(error) {
  const code = error instanceof ApiError ? error.code : null;
  if (code === 'OFFLINE') return { title: 'You are offline', body: 'Check your internet connection, then try again.', icon: WifiOff };
  if (code === 'NETWORK' || code === 'TIMEOUT') return { title: 'Can’t reach the server', body: 'The store server is not answering right now. Try again in a moment.', icon: CloudOff };
  if (error instanceof ApiError && error.status === 429) return { title: 'Too many requests', body: error.message, icon: CloudOff };
  return { title: 'Something went wrong', body: error?.message && error.status >= 500 ? error.message : 'We could not load this. Try again in a moment.', icon: CloudOff };
}

/** Full-area "can't load" state with a Retry button, for store pages and route guards. */
export function LoadError({ error, onRetry, title, minHeight = '50vh' }) {
  const [busy, setBusy] = useState(false);
  const d = describeError(error);
  const Icon = d.icon;
  const retry = async () => {
    setBusy(true);
    try {
      await onRetry?.();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Box role="alert" sx={{ minHeight, display: 'grid', placeItems: 'center', px: 2, py: 6 }}>
      <Box sx={{ maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 1.5 }}>
        <Box sx={{ width: 52, height: 52, borderRadius: '14px', display: 'grid', placeItems: 'center', backgroundColor: 'rgba(0,0,0,0.06)' }}>
          <Icon size={24} aria-hidden="true" />
        </Box>
        <Typography component="h1" sx={{ fontSize: 22, fontWeight: 800 }}>{title || d.title}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{d.body}</Typography>
        {onRetry ? (
          <Button variant="contained" onClick={retry} disabled={busy} startIcon={busy ? <CircularProgress size={15} color="inherit" /> : null} sx={{ mt: 1, minHeight: 44, px: 3 }}>
            Try again
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}
