import { beforeEach, describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../src/theme/theme.js';
import QuickAdd from '../src/components/QuickAdd.jsx';
import { useCart } from '../src/store/cart.js';

const product = {
  id: 'p1', slug: 'g10-401', name: 'G10-401',
  colourways: [
    { key: 'black', name: 'Black', hex: '#1E1E1E', price: 3400, regularPrice: 3400, inStock: true, sizes: ['8', '9'], image: { thumb: '/img/a.webp', src: '/img/a-1600.webp' } },
    { key: 'olive', name: 'Olive', hex: '#6B6B3A', price: 2775, regularPrice: 2775, inStock: true, sizes: ['7'], image: null },
  ],
};

describe('Shop quick add', () => {
  beforeEach(() => useCart.setState({ lines: [], pendingFlights: 0 }));

  it('picks a colour, then one tap on a size adds that line to the cart', () => {
    render(<ThemeProvider theme={theme}><QuickAdd product={product} photoRef={createRef()} /></ThemeProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Quick add G10-401' }));
    fireEvent.click(screen.getByRole('radio', { name: /Olive/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Add UK size 7 to cart' }));
    const [line] = useCart.getState().lines;
    expect(line).toMatchObject({ productId: 'p1', colourwayKey: 'olive', size: '7', qty: 1, unitPrice: 2775 });
  });

  it('defaults to the first colour and keeps its photo on the cart line', () => {
    render(<ThemeProvider theme={theme}><QuickAdd product={product} photoRef={createRef()} /></ThemeProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Quick add G10-401' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add UK size 9 to cart' }));
    expect(useCart.getState().lines[0]).toMatchObject({ colourwayKey: 'black', size: '9', image: '/img/a.webp' });
  });
});
