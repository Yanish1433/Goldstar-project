// Pure helpers for the first-load screen (inline loader in index.html + src/lib/loader.js).

// Weighted progress of named parts, each 0..1. Parts with weight 0 (or missing) are ignored.
export function weighProgress(parts, weights) {
  let total = 0;
  let sum = 0;
  for (const key of Object.keys(weights)) {
    const w = weights[key];
    if (!(w > 0)) continue;
    total += w;
    sum += w * Math.min(1, Math.max(0, parts[key] ?? 0));
  }
  return total ? sum / total : 1;
}

// The loader may leave once the real work is done AND it has been visible for `min` ms, or when `max` ms passed.
export function shouldExit({ elapsed, done, min = 1200, max = 8000 }) {
  return elapsed >= max || (done && elapsed >= min);
}

// Ease-out towards `ceil` so the counter moves before any real progress is known.
export const fakeProgress = (elapsedMs, ceil = 0.45, tau = 700) => ceil * (1 - Math.exp(-Math.max(0, elapsedMs) / tau));
