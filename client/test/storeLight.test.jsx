import { describe, expect, it, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../src/theme/theme.js';
import { routes } from '../src/routes.jsx';
import { apiState } from '../src/api/client.js';

beforeAll(() => { apiState.mock = true; });

function renderAt(path) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<ThemeProvider theme={theme}><QueryClientProvider client={qc}><RouterProvider router={router} /></QueryClientProvider></ThemeProvider>);
}
const T = { timeout: 15000 };

describe('light store pages', () => {
  it('new arrivals gets its own title and a pressed chip', async () => {
    renderAt('/shop?category=new-arrival');
    expect(await screen.findByRole('heading', { level: 1, name: 'New arrivals' }, T)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'New arrivals', pressed: true }, T)).toBeInTheDocument();
  });
  it('category chips only exist for catalogue categories', async () => {
    renderAt('/shop');
    await screen.findByRole('button', { name: 'Men' }, T);
    expect(screen.queryByRole('button', { name: /kids/i })).toBeNull();
  });
  it('login keeps labelled fields and the show-password toggle', async () => {
    renderAt('/login');
    expect(await screen.findByLabelText('Email', {}, T)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/register');
  });
});

describe('shop badges and prices (landing palette: navy / royal blue / sand, no green or red)', () => {
  const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`; };
  const GREEN_RED = ['#0F4D42', '#C2124F', '#D0175A'].map(rgb);
  it('New is sand / navy, Trek navy / white, Sale a white pill with a royal-blue outline', async () => {
    const { ShopBadge, PriceTag } = await import('../src/components/shop/kit.jsx');
    const { container } = render(<ThemeProvider theme={theme}><ShopBadge kind="new" /><ShopBadge kind="trek" /><ShopBadge kind="sale" /><ShopBadge kind="soon" /><PriceTag price={2000} regularPrice={2700} /></ThemeProvider>);
    const [n, t, s] = [...container.querySelectorAll('span')].filter((el) => ['New', 'Trek', 'Sale'].includes(el.textContent));
    expect(getComputedStyle(n).backgroundColor).toBe(rgb('#EBC989'));
    expect(getComputedStyle(n).color).toBe(rgb('#0B1A48'));
    expect(getComputedStyle(t).backgroundColor).toBe(rgb('#0B1A48'));
    expect(getComputedStyle(t).color).toBe(rgb('#FFFFFF'));
    expect(getComputedStyle(s).color).toBe(rgb('#2A27E9'));
    expect(getComputedStyle(s).boxShadow).toMatch(/inset/);
    container.querySelectorAll('*').forEach((el) => {
      const cs = getComputedStyle(el);
      expect(GREEN_RED).not.toContain(cs.backgroundColor);
      expect(GREEN_RED).not.toContain(cs.color);
    });
    expect(screen.getByText(/Save 26%/)).toBeInTheDocument();
  });
});
