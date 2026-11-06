import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../src/theme/theme.js';
import LineReveal from '../src/components/LineReveal.jsx';

const wrap = (ui) => render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('LineReveal', () => {
  it('hero h1 with explicit lines: full text in the DOM and as the accessible name', () => {
    const { container } = wrap(<LineReveal component="h1" variant="display" load lines={[{ text: 'G10-401' }, { text: 'Built for the trail.' }]} />);
    const h1 = screen.getByRole('heading', { level: 1, name: 'G10-401 Built for the trail.' });
    expect(h1).toHaveAttribute('aria-label', 'G10-401 Built for the trail.');
    expect(container.textContent).toContain('G10-401');
    expect(container.textContent).toContain('Built for the trail.');
    // line spans are hidden from assistive tech (the heading has the accessible name)
    const spans = h1.querySelectorAll('span[aria-hidden="true"]');
    expect(spans.length).toBeGreaterThanOrEqual(2);
    // the heading is never at opacity 0
    expect(getComputedStyle(h1).opacity).not.toBe('0');
  });

  it('plain mode (no scroll source, e.g. static tier) renders the whole text', () => {
    wrap(<LineReveal component="h2" variant="h2" text="Performance, redefined." />);
    expect(screen.getByRole('heading', { level: 2, name: 'Performance, redefined.' })).toBeInTheDocument();
  });

  it('measureLines groups words by visual line', async () => {
    const { measureLines } = await import('../src/components/LineReveal.jsx');
    const node = document.createTextNode('ONE TWO THREE FOUR');
    // jsdom has no layout: emulate rects (two words per line)
    const tops = [0, 0, 40, 40];
    let i = 0;
    const orig = document.createRange;
    document.createRange = () => ({
      setStart() {},
      setEnd() {},
      getClientRects() {
        const top = tops[i % 4];
        i += 1;
        return [{ top }];
      },
    });
    expect(measureLines(node)).toEqual(['ONE TWO', 'THREE FOUR']);
    document.createRange = orig;
  });
});
