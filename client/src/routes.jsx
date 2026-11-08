import { createBrowserRouter, Navigate } from 'react-router';
import Layout from './components/Layout.jsx';
import { RequireAuth, RequireAdmin, GuestOnly } from './components/Guards.jsx';
import NotFound from './pages/NotFound.jsx';
import RouteError from './pages/RouteError.jsx';

const lazyPage = (loader, name = 'default') => async () => {
  const mod = await loader();
  return { Component: mod[name] };
};

export const routes = [
  {
    path: '/',
    Component: Layout,
    // First load resolves the lazy page before the first render: render nothing meanwhile (the page ground is already painted).
    HydrateFallback: () => null,
    ErrorBoundary: RouteError,
    children: [
      { index: true, lazy: lazyPage(() => import('./pages/Home.jsx')) },
      { path: 'shop', lazy: lazyPage(() => import('./pages/Shop.jsx')) },
      { path: 'product/:slug', lazy: lazyPage(() => import('./pages/Product.jsx')) },
      {
        path: 'checkout',
        element: <RequireAuth />,
        children: [{ index: true, lazy: lazyPage(() => import('./pages/Checkout.jsx')) }],
      },
      { path: 'order/:id', element: <RequireAuth />, children: [{ index: true, lazy: lazyPage(() => import('./pages/OrderConfirmation.jsx')) }] },
      { path: 'login', element: <GuestOnly />, children: [{ index: true, lazy: lazyPage(() => import('./pages/Login.jsx')) }] },
      { path: 'register', element: <GuestOnly />, children: [{ index: true, lazy: lazyPage(() => import('./pages/Register.jsx')) }] },
      {
        path: 'account',
        element: <RequireAuth />,
        children: [
          { index: true, lazy: lazyPage(() => import('./pages/Account.jsx')) },
          { path: 'orders/:id', lazy: lazyPage(() => import('./pages/AccountOrder.jsx')) },
        ],
      },
      {
        path: 'admin',
        element: <RequireAdmin />,
        children: [
          {
            lazy: lazyPage(() => import('./pages/admin/AdminLayout.jsx')),
            children: [
              { index: true, element: <Navigate to="/admin/orders" replace /> },
              { path: 'products', lazy: lazyPage(() => import('./pages/admin/AdminProducts.jsx')) },
              { path: 'products/new', lazy: lazyPage(() => import('./pages/admin/AdminProductEdit.jsx')) },
              { path: 'products/:id', lazy: lazyPage(() => import('./pages/admin/AdminProductEdit.jsx')) },
              { path: 'orders', lazy: lazyPage(() => import('./pages/admin/AdminOrders.jsx')) },
              { path: 'orders/:id', lazy: lazyPage(() => import('./pages/admin/AdminOrder.jsx')) },
            ],
          },
        ],
      },
      { path: '*', Component: NotFound },
    ],
  },
];

export const router = createBrowserRouter(routes);
