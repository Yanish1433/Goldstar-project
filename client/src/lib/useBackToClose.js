import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { PHONE_QUERY } from '../landing-v2/tokensV2.js';

// Phones: the system Back gesture / button closes an open drawer instead of leaving the page (what people expect
// from a full-screen sheet). While `open`, one history entry (same URL, state flagged gsOverlay) sits on top; Back
// pops it and calls close(). Closing any other way (X, Esc, scrim, a link) drops that entry again, unless a route
// change already replaced it. Desktop: nothing changes.
// Pops we cause ourselves (dropping our entry after an X / Esc close) must not close a sheet that is open again by
// then (React StrictMode re-runs effects: cleanup's back() lands after the re-mount has pushed a new entry).
// Leaving the page from inside the sheet (a link, Checkout): use the returned `leave(to)`. It navigates with
// replace over our entry instead of popping it: a back() there landed mid-navigation and cancelled it, so phone
// menu links and the cart's Checkout did nothing.
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
  const navigate = useNavigate();
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

  return useCallback((to, opts = {}) => {
    const onOurEntry = pushed.current && window.history.state?.gsOverlay;
    pushed.current = false; // the cleanup must not pop: the navigation takes our entry's place
    navigate(to, onOurEntry ? { ...opts, replace: true } : opts);
    closeRef.current();
  }, [navigate]);
}

/** onClick for a <Link> inside a sheet: plain clicks go through leave(); new-tab clicks are left alone. */
export function leaveOnClick(leave) {
  return (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const href = e.currentTarget.getAttribute('href');
    if (!href || !href.startsWith('/')) return;
    e.preventDefault();
    leave(href);
  };
}
