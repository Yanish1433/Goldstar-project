import { describe, expect, it } from 'vitest';
import { scrollToTime } from '../src/story/scrollTime.js';

describe('scrollToTime', () => {
  it('is 0 at and before the start', () => {
    expect(scrollToTime(100, 100, 1100, 500)).toBe(0);
    expect(scrollToTime(-50, 100, 1100, 500)).toBe(0);
    expect(scrollToTime(0, 0, 1000, 500)).toBe(0);
  });
  it('is TOTAL at and beyond the end', () => {
    expect(scrollToTime(1100, 100, 1100, 500)).toBe(500);
    expect(scrollToTime(99999, 100, 1100, 500)).toBe(500);
  });
  it('is linear between', () => {
    expect(scrollToTime(600, 100, 1100, 500)).toBeCloseTo(250);
    expect(scrollToTime(350, 100, 1100, 500)).toBeCloseTo(125);
  });
  it('is safe on a degenerate range or NaN', () => {
    expect(scrollToTime(5, 10, 10, 500)).toBe(0);
    expect(scrollToTime(NaN, 0, 10, 500)).toBe(0);
  });
});
