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
