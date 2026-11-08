import { describe, expect, it } from 'vitest';
import { formatNPR, formatRange } from '../src/lib/format.js';
import { canTransition, nextStatuses } from '../src/lib/orders.js';

describe('formatNPR', () => {
  it('formats with Indian grouping', () => {
    expect(formatNPR(3400)).toBe('NPR 3,400');
    expect(formatNPR(2775)).toBe('NPR 2,775');
    expect(formatNPR(100000)).toBe('NPR 1,00,000');
  });
  it('formats ranges', () => {
    expect(formatRange(2775, 3400)).toBe('NPR 2,775 – 3,400');
    expect(formatRange(2000, 2000)).toBe('NPR 2,000');
  });
});

describe('order status mirror', () => {
  it('follows SPEC 2.4', () => {
    expect(nextStatuses('placed')).toEqual(['confirmed', 'cancelled']);
    expect(nextStatuses('confirmed')).toEqual(['shipped', 'cancelled']);
    expect(nextStatuses('shipped')).toEqual(['delivered']);
    expect(nextStatuses('delivered')).toEqual([]);
    expect(nextStatuses('cancelled')).toEqual([]);
    expect(canTransition('placed', 'shipped')).toBe(false);
    expect(canTransition('shipped', 'cancelled')).toBe(false);
  });
});
