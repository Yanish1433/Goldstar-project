// Device tiers (SPEC 9.10): full | lite | static.
export function hasWebGL2() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2'));
  } catch {
    return false;
  }
}

export function detectTier(search = typeof location !== 'undefined' ? location.search : '') {
  const forced = new URLSearchParams(search).get('tier');
  if (forced === 'full' || forced === 'lite' || forced === 'static') return forced;
  if (typeof window === 'undefined') return 'static';
  const nav = navigator;
  if (!hasWebGL2()) return 'static';
  if (nav.connection?.saveData) return 'static';
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2) return 'static';
  if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 2) return 'static';
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  if (coarse || window.innerWidth < 900) return 'lite';
  return 'full';
}

export const TIER_SETTINGS = {
  full: { dpr: [1, 1.5], dust: 1500, liveShadows: true, model: 'desktop' },
  // Phones: up to 2x (their screens are 2-3x; 1.25 looked soft next to desktop). PerformanceMonitor steps down if needed.
  lite: { dpr: [1, 2], dust: 600, liveShadows: false, model: 'mobile' },
};

// Which G10 file to load. Phones get the full desktop model (same detail and textures as desktop) unless the device
// or network is constrained: little memory, or a 2G/3G connection. Those keep the lite file (~1.4 MB vs ~3.5 MB).
// (Save-Data and <=2 GB devices never get here: detectTier sends them to the static tier.)
export function wantsLiteModel(tier, nav = typeof navigator !== 'undefined' ? navigator : {}) {
  if (tier === 'full') return false;
  const forced = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('model') : null;
  if (forced === 'lite') return true;
  if (forced === 'full') return false;
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return true;
  const et = nav.connection?.effectiveType;
  return et === 'slow-2g' || et === '2g' || et === '3g';
}

export const layoutFor = (width) => (width < 900 ? 'phone' : 'desktop');
