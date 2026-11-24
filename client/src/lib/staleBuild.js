// After a deploy, an already-open tab still points at the previous build's hashed chunks. Those files are gone, and the
// static host answers the missing URL with index.html, so the lazy import fails and the route shows "That page didn't
// load". Reload once to pick up the new build; the timestamp guard stops a reload loop if the failure is real (offline).
const KEY = 'gs-stale-reload';
const WINDOW_MS = 15_000;

export const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|error loading dynamically imported|Failed to fetch dynamically|is not a valid JavaScript MIME type|ChunkLoadError/i;

export function isChunkError(err) {
  return !!err && CHUNK_ERROR.test(String(err.message || err));
}

// Returns true when it triggered a reload.
export function reloadForNewBuild(storage = window.sessionStorage, now = Date.now(), reload = () => window.location.reload()) {
  let last = 0;
  try { last = Number(storage.getItem(KEY)) || 0; } catch { /* storage blocked */ }
  if (now - last < WINDOW_MS) return false;
  try { storage.setItem(KEY, String(now)); } catch { /* storage blocked: still reload once */ }
  reload();
  return true;
}

export function installStaleBuildReload() {
  if (typeof window === 'undefined') return;
  // Vite fires this when a dynamic import's chunk (or its CSS) fails to load.
  window.addEventListener('vite:preloadError', (e) => {
    if (reloadForNewBuild()) e.preventDefault();
  });
}
