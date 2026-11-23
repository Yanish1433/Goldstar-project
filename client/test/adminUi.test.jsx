import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../src/theme/theme.js';
import { routes } from '../src/routes.jsx';
import { apiState } from '../src/api/client.js';
import { mockRequest } from '../src/api/mock/index.js';
import { seedMockShop } from './mockShop.js';
import { validateProduct } from '../src/pages/admin/AdminProductEdit.jsx';
import { niceTicks } from '../src/pages/admin/charts.jsx';

const T = { timeout: 15000 };

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

describe('admin console (signed in as admin)', () => {
  beforeAll(async () => {
    apiState.mock = true;
    await seedMockShop(mockRequest); // signs in as the admin
  });
  afterAll(async () => {
    await mockRequest('POST', '/auth/logout');
  });

  it('an admin opening a store page is sent to the panel', async () => {
    renderAt('/shop');
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' }, T)).toBeInTheDocument();
  });
  it('an admin on /login is sent to the panel, not the store', async () => {
    renderAt('/login');
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' }, T)).toBeInTheDocument();
  });

  it('/admin shows the dashboard inside its own shell, without the store header or footer', async () => {
    const { container } = renderAt('/admin');
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' }, T)).toBeInTheDocument();
    // jsdom has no wide viewport: the navigation lives in the mobile drawer.
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    const nav = await screen.findByRole('navigation', { name: 'Admin' }, T);
    for (const name of ['Dashboard', 'Orders', 'Products', 'Customers', 'Settings']) expect(within(nav).getByRole('link', { name: new RegExp(`^${name}`) })).toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: /View store/ })).toBeNull(); // admins stay in the panel
    fireEvent.click(screen.getByRole('button', { name: 'Close navigation' }));
    expect(await screen.findByRole('article', { name: 'Revenue' }, T)).toBeInTheDocument();
    expect(await screen.findByRole('table', { name: 'Recent orders' }, T)).toBeInTheDocument();
    expect(container.querySelector('footer')).toBeNull();
    expect(screen.queryByRole('button', { name: /cart/i })).toBeNull();
  });

  it('/admin/orders lists orders with status tab counts', async () => {
    renderAt('/admin/orders');
    expect(await screen.findByRole('heading', { level: 1, name: 'Orders' }, T)).toBeInTheDocument();
    const table = await screen.findByRole('table', { name: 'Orders' }, T);
    expect(await within(table).findAllByText(/^GS-\d{6}-/, {}, T)).not.toHaveLength(0);
    expect(screen.getByRole('tab', { name: /^All \d+/ })).toBeInTheDocument();
  });

  it('/admin/customers lists customers; a customer page shows their orders', async () => {
    renderAt('/admin/customers');
    expect(await screen.findByRole('heading', { level: 1, name: 'Customers' }, T)).toBeInTheDocument();
    const link = await screen.findByRole('link', { name: 'Bikash Tamang' }, T);
    fireEvent.click(link);
    expect(await screen.findByRole('heading', { level: 1, name: 'Bikash Tamang' }, T)).toBeInTheDocument();
    expect(await screen.findByRole('table', { name: 'Orders by Bikash Tamang' }, T)).toBeInTheDocument();
  });

  it('/admin/products shows the catalogue; the editor opens with its sections', async () => {
    renderAt('/admin/products');
    expect(await screen.findByRole('heading', { level: 1, name: 'Products' }, T)).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('link', { name: 'G10-401' }, T));
    expect(await screen.findByRole('heading', { level: 1, name: 'G10-401' }, T)).toBeInTheDocument();
    for (const h of ['Details', 'Pricing', 'Colours, sizes and stock', 'Images', 'Status', 'Preview']) expect(screen.getByRole('heading', { name: h })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  }, 60000); // heavy jsdom render (list + editor + live card preview): ~20-27 s on a loaded machine

  it('unknown admin pages show the admin not-found state', async () => {
    renderAt('/admin/nope');
    expect(await screen.findByText('This page does not exist', {}, T)).toBeInTheDocument();
  });
});

describe('admin helpers', () => {
  const good = { name: 'Trail', slug: 'trail', colourways: [{ key: 'olive', name: 'Olive', hex: '#5F6142', price: 3000, regularPrice: '', sizes: ['8'], stock: { 8: 4 }, productUrl: 'https://goldstarshoes.com/x', images: [] }] };
  it('validateProduct accepts a complete product and flags each problem by path', () => {
    expect(validateProduct(good, true)).toEqual([]);
    const bad = { ...good, name: ' ', slug: 'Bad Slug', colourways: [{ ...good.colourways[0], key: 'Olive!', hex: 'green', price: 2.5, regularPrice: 1, sizes: [], productUrl: 'https://example.com/' }] };
    const paths = validateProduct(bad, true).map((e) => e.path);
    expect(paths).toEqual(expect.arrayContaining(['name', 'slug', 'colourways.0.key', 'colourways.0.hex', 'colourways.0.price', 'colourways.0.sizes', 'colourways.0.productUrl']));
    const neg = validateProduct({ ...good, colourways: [{ ...good.colourways[0], stock: { 8: -2 } }] }, false);
    expect(neg.map((e) => e.path)).toEqual(['colourways.0.stock.8']);
    const cheaper = validateProduct({ ...good, colourways: [{ ...good.colourways[0], regularPrice: 2000 }] }, false);
    expect(cheaper.map((e) => e.path)).toEqual(['colourways.0.regularPrice']);
  });
  it('niceTicks rounds the axis to clean steps', () => {
    expect(niceTicks(37000)).toEqual([0, 10000, 20000, 30000, 40000]);
    expect(niceTicks(7)).toEqual([0, 2, 4, 6, 8]);
    expect(niceTicks(0)).toEqual([0, 1, 2, 3, 4]);
  });
});
