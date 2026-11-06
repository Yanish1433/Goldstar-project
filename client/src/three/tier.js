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
  lite: { dpr: [1, 1.25], dust: 600, liveShadows: false, model: 'mobile' },
};

export const layoutFor = (width) => (width < 900 ? 'phone' : 'desktop');
