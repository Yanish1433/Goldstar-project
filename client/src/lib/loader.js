import { weighProgress } from './loaderProgress.js';
import { STORY_MODEL } from '../story/model.config.js';
import { detectTier } from '../three/tier.js';

// Reports real progress to the inline loader (window.gsLoader, see index.html): the API handshake, web fonts, the hero
// shoe GLB download (home route only; bytes streamed so the counter tracks the real transfer) and the first React
// mount. No-op when the loader is not on the page (repeat visit in the same session).
const active = () => typeof window !== 'undefined' && !!window.gsLoader && !window.gsLoader.done && !!document.getElementById('gs-loader');

const state = { api: 0, fonts: 0, model: 0, mount: 0 };
let weights = { api: 1, fonts: 1, model: 6, mount: 1 };
const done = () => Object.keys(weights).every((k) => weights[k] <= 0 || state[k] >= 1);

function push() {
  if (!active()) return;
  window.gsLoader.set(weighProgress(state, weights));
  if (done()) window.gsLoader.ready();
}
const set = (key, v) => {
  state[key] = Math.max(state[key], v);
  push();
};

async function fetchModel(url) {
  try {
    const res = await fetch(url);
    const total = Number(res.headers.get('content-length')) || 0;
    if (!res.body || !total) {
      await res.arrayBuffer();
      return set('model', 1);
    }
    const reader = res.body.getReader();
    let got = 0;
    for (;;) {
      const { done: end, value } = await reader.read();
      if (end) break;
      got += value.length;
      set('model', Math.min(0.99, got / total));
    }
  } catch {
    /* the scene will fetch it again itself; do not hold the loader */
  }
  set('model', 1);
}

export function trackLoad() {
  if (!active()) return;
  const reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const tier = detectTier();
  const wantsModel = location.pathname === '/' && tier !== 'static' && !reduced;
  if (!wantsModel) weights = { ...weights, model: 0 };
  if (wantsModel) fetchModel(STORY_MODEL.urls[tier === 'full' ? 'desktop' : 'mobile']); // the home story's boot
  (document.fonts?.ready ?? Promise.resolve()).then(() => set('fonts', 1));
  push();
}

export const markApi = () => set('api', 1);

// Called from the first mounted React effect: two frames later the page behind the loader has painted.
export function markMounted() {
  if (!active()) return;
  document.getElementById('content')?.setAttribute('aria-busy', 'true');
  window.addEventListener('gs:loader-done', () => document.getElementById('content')?.removeAttribute('aria-busy'), { once: true });
  requestAnimationFrame(() => requestAnimationFrame(() => set('mount', 1)));
}
