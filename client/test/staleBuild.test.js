import { describe, expect, it, vi } from 'vitest';
import { isChunkError, reloadForNewBuild } from '../src/lib/staleBuild.js';

const store = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };

describe('stale build reload', () => {
  it('recognises chunk-load failures from each browser', () => {
    expect(isChunkError(new TypeError('Failed to fetch dynamically imported module: https://x/assets/Account-old.js'))).toBe(true);
    expect(isChunkError(new TypeError('Importing a module script failed.'))).toBe(true);
    expect(isChunkError(new TypeError("Expected a JavaScript module script but the server responded with a MIME type of \"text/html\". Strict MIME type checking is enforced for module scripts per HTML spec. 'text/html' is not a valid JavaScript MIME type."))).toBe(true);
    expect(isChunkError(new Error('Cannot read properties of undefined'))).toBe(false);
    expect(isChunkError(null)).toBe(false);
  });

  it('reloads once, then not again within 15 s (no loop when offline)', () => {
    const s = store();
    const reload = vi.fn();
    expect(reloadForNewBuild(s, 1_000_000, reload)).toBe(true);
    expect(reloadForNewBuild(s, 1_005_000, reload)).toBe(false);
    expect(reloadForNewBuild(s, 1_020_000, reload)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });
});
