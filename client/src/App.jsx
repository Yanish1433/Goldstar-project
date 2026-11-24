import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { theme } from './theme/theme.js';
import { router } from './routes.jsx';
import { makeQueryClient } from './api/queryClient.js';
import { OfflineBanner } from './api/NetworkStates.jsx';

// Session expired mid-visit (401): back to the login page, which returns here after signing in.
const queryClient = makeQueryClient({
  onAuthLost: () => {
    const { pathname, search } = router.state.location;
    if (pathname.startsWith('/login')) return;
    router.navigate(`/login?next=${encodeURIComponent(pathname + search)}`, { replace: true });
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <OfflineBanner />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
