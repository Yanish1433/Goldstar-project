import { describe, expect, it, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../src/theme/theme.js';
import { routes } from '../src/routes.jsx';
import { apiState } from '../src/api/client.js';

beforeAll(() => {
  apiState.mock = true;
});

function renderAt(path) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

const T = { timeout: 15000 };

describe('route smoke renders with the mock API', () => {
  it('/ renders the storefront landing (Walk the world hero, shop all footwear, link to the G10 in 3D, no canvas)', async () => {
    const { container } = renderAt('/');
    expect(await screen.findByRole('heading', { level: 1, name: /Walk the world/i }, T)).toBeInTheDocument();
    expect((await screen.findAllByRole('link', { name: /Shop all footwear/i }, T))[0]).toHaveAttribute('href', '/shop');
    expect(screen.getAllByRole('link', { name: /^G10 in 3D/i })[0]).toHaveAttribute('href', '/g10');
    expect(container.querySelector('canvas')).toBeNull();
  });
  it('/g10 renders the story copy when WebGL is missing', async () => {
    renderAt('/g10');
    expect(await screen.findByRole('heading', { level: 1, name: /Explore further/i }, T)).toBeInTheDocument();
  });
  it('/shop lists products', async () => {
    renderAt('/shop');
    expect(await screen.findByRole('heading', { name: 'Shop all' }, T)).toBeInTheDocument();
    expect(await screen.findByText('AX-3', {}, T)).toBeInTheDocument();
  });
  it('/product/g10-401 shows the buy panel with a safe external link', async () => {
    renderAt('/product/g10-401');
    expect(await screen.findByRole('button', { name: 'Add to cart' }, T)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View on goldstarshoes.com/ })).toHaveAttribute('rel', 'noopener noreferrer');
  });
  it('/login renders', async () => {
    renderAt('/login');
    expect(await screen.findByRole('heading', { name: 'Log in' }, T)).toBeInTheDocument();
  });
  it('/register renders', async () => {
    renderAt('/register');
    expect(await screen.findByRole('heading', { name: 'Create an account' }, T)).toBeInTheDocument();
  });
  it('unknown routes show Not found', async () => {
    renderAt('/nope');
    expect(await screen.findByRole('heading', { name: 'Page not found' }, T)).toBeInTheDocument();
  });
  it('guests are redirected from /account to login', async () => {
    renderAt('/account');
    expect(await screen.findByRole('heading', { name: 'Log in' }, T)).toBeInTheDocument();
  });
  it('non-admins see Not found on /admin', async () => {
    renderAt('/admin/orders');
    expect(await screen.findByRole('heading', { name: 'Page not found' }, T)).toBeInTheDocument();
  });
});
