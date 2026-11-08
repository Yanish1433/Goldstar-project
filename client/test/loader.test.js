import { describe, expect, it } from 'vitest';
import { weighProgress, shouldExit, fakeProgress } from '../src/lib/loaderProgress.js';

describe('loader progress', () => {
  it('weights parts and ignores zero-weight parts', () => {
    expect(weighProgress({ a: 1, b: 0 }, { a: 1, b: 1 })).toBe(0.5);
    expect(weighProgress({ a: 1, b: 0 }, { a: 1, b: 0 })).toBe(1);
    expect(weighProgress({ a: 0.5, b: 1 }, { a: 3, b: 1 })).toBeCloseTo(0.625);
    expect(weighProgress({}, { a: 1 })).toBe(0);
  });
  it('fake progress eases up but never passes its ceiling', () => {
    expect(fakeProgress(0)).toBe(0);
    expect(fakeProgress(300)).toBeGreaterThan(0.1);
    expect(fakeProgress(60000)).toBeLessThanOrEqual(0.45);
  });
  it('holds for the minimum display time, and gives up at the cap', () => {
    expect(shouldExit({ elapsed: 500, done: true })).toBe(false);
    expect(shouldExit({ elapsed: 1300, done: true })).toBe(true);
    expect(shouldExit({ elapsed: 3000, done: false })).toBe(false);
    expect(shouldExit({ elapsed: 8000, done: false })).toBe(true);
  });
});
