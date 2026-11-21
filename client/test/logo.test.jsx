import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Logo, { LOGO_SIZES, MARK_RATIO } from '../src/landing/Logo.jsx';

describe('logo', () => {
  it('mark and full crops declare their intrinsic size (no layout shift)', () => {
    const { container } = render(<><Logo variant="mark" alt="" /><Logo variant="full" /></>);
    const [mark, full] = container.querySelectorAll('img');
    expect([mark.getAttribute('width'), mark.getAttribute('height')]).toEqual(['774', '115']);
    expect([full.getAttribute('width'), full.getAttribute('height')]).toEqual(['960', '115']);
    expect(mark.getAttribute('src')).toBe('/brand/goldstar-mark.webp');
    expect(MARK_RATIO).toBeCloseTo(774 / 115, 5);
    expect(LOGO_SIZES.mark[1]).toBe(LOGO_SIZES.full[1]);
  });
  it('white tone uses the knockout', () => {
    const { container } = render(<Logo variant="mark" tone="white" alt="" />);
    expect(container.querySelector('img').getAttribute('src')).toBe('/brand/goldstar-mark-white.webp');
  });
  it('decorative image has an empty alt; the current tone is a labelled mask', () => {
    const { container } = render(<Logo variant="mark" alt="" />);
    expect(container.querySelector('img').getAttribute('alt')).toBe('');
    render(<Logo variant="mark" tone="current" alt="Goldstar Shoes" />);
    expect(screen.getByRole('img', { name: 'Goldstar Shoes' })).toBeTruthy();
  });
  it('the files exist', () => {
    for (const f of ['goldstar-mark', 'goldstar-mark-white', 'goldstar-logo', 'goldstar-logo-white']) {
      expect(readFileSync(resolve(__dirname, `../public/brand/${f}.webp`)).length).toBeGreaterThan(1000);
    }
  });
});
