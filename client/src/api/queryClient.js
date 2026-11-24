import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError, isUnreachable } from './client.js';

/**
 * The app's React Query client.
 * - Retries only failures that may pass on their own (server unreachable, timeout, 5xx), twice with backoff.
 *   4xx answers (validation, not found, forbidden, rate limited) are final and shown at once.
 * - A 401 from any request other than /auth/me means the session expired: `onAuthLost` sends the user to log in.
 * React Query also dedupes identical requests (StrictMode double effects), cancels queries whose components
 * unmount (the `signal` reaches fetch) and never sets state after unmount.
 */
export function makeQueryClient({ onAuthLost } = {}) {
  let qc;
  const authLost = (err) => {
    if (!(err instanceof ApiError) || err.status !== 401 || !qc) return;
    if (qc.getQueryData(['me']) == null) return; // already signed out: the page handles 401 itself (login form)
    qc.setQueryData(['me'], null);
    qc.removeQueries({ queryKey: ['admin'] });
    onAuthLost?.();
  };
  qc = new QueryClient({
    queryCache: new QueryCache({ onError: (err, query) => query.queryKey[0] !== 'me' && authLost(err) }),
    mutationCache: new MutationCache({ onError: authLost }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        // Up to 4 retries (~25 s in all): long enough to ride out a free-tier API waking from sleep.
        retry: (n, e) => (isUnreachable(e) || (e instanceof ApiError && e.status >= 500)) && n < 4,
        retryDelay: (n) => Math.min(1500 * 2 ** n, 10000),
      },
      mutations: { retry: false }, // placing an order twice would be worse than asking the user to retry
    },
  });
  return qc;
}
