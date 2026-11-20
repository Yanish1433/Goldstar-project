import { useEffect, useRef } from 'react';
import { PHONE_QUERY } from '../landing-v2/tokensV2.js';

// Phones: the system Back gesture / button closes an open drawer instead of leaving the page (what people expect
// from a full-screen sheet). While `open`, one history entry (same URL, state flagged gsOverlay) sits on top; Back
// pops it and calls close(). Closing any other way (X, Esc, scrim, a link) drops that entry again, unless a route
// change already replaced it. Desktop: nothing changes.
// Pops we cause ourselves (dropping our entry after an X / Esc close) must not close a sheet that is open again by
// then (React StrictMode re-runs effects: cleanup's back() lands after the re-mount has pushed a new entry).
// One capture-phase listener (runs before any sheet's) marks those pops, so a count is never left over.
let ownPops = 0;
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', (e) => {
    if (ownPops > 0) {
      ownPops -= 1;
      e.gsOwnPop = true;
    }
  }, true);
}

export function useBackToClose(open, close) {
  const pushed = useRef(false);
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!open || typeof window === 'undefined' || !window.matchMedia?.(PHONE_QUERY).matches) return undefined;
    const href = window.location.href;
    window.history.pushState({ ...(window.history.state || {}), gsOverlay: true }, '');
    pushed.current = true;
    const onPop = (e) => {
      if (e.gsOwnPop || !pushed.current) return;
      pushed.current = false;
      closeRef.current();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      // Closed by X / Esc / scrim on the same page: take our entry back off the stack.
      if (pushed.current && window.history.state?.gsOverlay && window.location.href === href) {
        ownPops += 1;
        window.history.back();
      }
      pushed.current = false;
    };
  }, [open]);
}
