// React Router keys the first page of every fresh document load "default", and ScrollRestoration saves scroll
// positions per key in sessionStorage. So scrolling a page and then opening any other URL in the same tab (typed,
// or a link from WhatsApp/Google/Facebook) restored the old position: the new page opened near its footer.
// On a fresh load ('navigate') forget the "default" position; keep it for a reload and for Back/Forward.
export const SCROLL_KEY = 'react-router-scroll-positions';

export function forgetStaleLoadScroll(storage = window.sessionStorage, navType = currentNavType()) {
  if (navType !== 'navigate') return false;
  try {
    const raw = storage.getItem(SCROLL_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object' || !('default' in saved)) return false;
    delete saved.default;
    storage.setItem(SCROLL_KEY, JSON.stringify(saved));
    return true;
  } catch {
    return false;
  }
}

function currentNavType() {
  try {
    return performance.getEntriesByType('navigation')[0]?.type || 'navigate';
  } catch {
    return 'navigate';
  }
}
