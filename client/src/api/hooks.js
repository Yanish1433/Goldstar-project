import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiFetch, ApiError, isUnreachable } from './client.js';

export const useMe = () =>
  useQuery({
    queryKey: ['me'],
    queryFn: async ({ signal }) => {
      try {
        return (await apiFetch('/auth/me', { signal })).user;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null; // guest
        throw e;
      }
    },
    staleTime: 60_000,
    retry: (n, e) => isUnreachable(e) && n < 2, // a 401 means guest: never retried
  });

export const useProducts = (params) =>
  useQuery({ queryKey: ['products', params], queryFn: ({ signal }) => apiFetch('/products', { query: params, signal }), placeholderData: keepPreviousData });

export const useProduct = (slug) => useQuery({ queryKey: ['product', slug], queryFn: async ({ signal }) => (await apiFetch(`/products/${slug}`, { signal })).product, enabled: !!slug });

export const useCategories = () => useQuery({ queryKey: ['categories'], queryFn: async ({ signal }) => (await apiFetch('/categories', { signal })).items });

export const useQuote = (items, enabled = true) =>
  useQuery({
    queryKey: ['quote', items],
    queryFn: ({ signal }) => apiFetch('/cart/quote', { method: 'POST', body: { items }, signal }),
    enabled: enabled && items.length > 0,
    staleTime: 0,
  });

export const useMyOrders = (params) => useQuery({ queryKey: ['orders', 'mine', params], queryFn: ({ signal }) => apiFetch('/orders/mine', { query: params, signal }) });
export const useOrder = (id) => useQuery({ queryKey: ['order', id], queryFn: async ({ signal }) => (await apiFetch(`/orders/${id}`, { signal })).order, enabled: !!id });

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b) => apiFetch('/auth/login', { method: 'POST', body: b }),
    onSuccess: (d) => {
      qc.setQueryData(['me'], d.user);
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
export function useRegister() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b) => apiFetch('/auth/register', { method: 'POST', body: b }), onSuccess: (d) => qc.setQueryData(['me'], d.user) });
}
export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      qc.setQueryData(['me'], null);
      qc.removeQueries({ queryKey: ['orders'] });
      qc.removeQueries({ queryKey: ['order'] });
      qc.removeQueries({ queryKey: ['admin'] });
    },
  });
}
export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b) => apiFetch('/orders', { method: 'POST', body: b }),
    onSuccess: (d) => {
      qc.setQueryData(['order', d.order.id], d.order);
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }) => apiFetch(`/orders/${id}/cancel`, { method: 'POST', body: note ? { note } : {} }),
    onSuccess: (d) => {
      qc.setQueryData(['order', d.order.id], d.order);
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export const useAdminProducts = (params, opts) => useQuery({ queryKey: ['admin', 'products', params], queryFn: ({ signal }) => apiFetch('/admin/products', { query: params, signal }), placeholderData: keepPreviousData, ...opts });
export const useAdminProduct = (id) => useQuery({ queryKey: ['admin', 'product', id], queryFn: async ({ signal }) => (await apiFetch(`/admin/products/${id}`, { signal })).product, enabled: !!id && id !== 'new' });
export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => (id ? apiFetch(`/admin/products/${id}`, { method: 'PATCH', body }) : apiFetch('/admin/products', { method: 'POST', body })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['product'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
export const useAdminOrders = (params, opts) => useQuery({ queryKey: ['admin', 'orders', params], queryFn: ({ signal }) => apiFetch('/admin/orders', { query: params, signal }), placeholderData: keepPreviousData, ...opts });
export const useAdminOrder = (id) => useQuery({ queryKey: ['admin', 'order', id], queryFn: async ({ signal }) => (await apiFetch(`/admin/orders/${id}`, { signal })).order, enabled: !!id });
export function useSetOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }) => apiFetch(`/admin/orders/${id}/status`, { method: 'PATCH', body: note ? { status, note } : { status } }),
    onSuccess: (d) => {
      qc.setQueryData(['admin', 'order', d.order.id], d.order);
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order'] });
    },
  });
}

export const useAdminStats = (params) => useQuery({ queryKey: ['admin', 'stats', params], queryFn: ({ signal }) => apiFetch('/admin/stats', { query: params, signal }), placeholderData: keepPreviousData });
export const useAdminCustomers = (params, opts) => useQuery({ queryKey: ['admin', 'customers', params], queryFn: ({ signal }) => apiFetch('/admin/customers', { query: params, signal }), placeholderData: keepPreviousData, ...opts });
export const useAdminCustomer = (id) => useQuery({ queryKey: ['admin', 'customer', id], queryFn: ({ signal }) => apiFetch(`/admin/customers/${id}`, { signal }), enabled: !!id });
