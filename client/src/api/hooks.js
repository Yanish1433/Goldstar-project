import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiFetch, ApiError } from './client.js';

export const useMe = () =>
  useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return (await apiFetch('/auth/me')).user;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null; // guest
        throw e;
      }
    },
    staleTime: 60_000,
    retry: false,
  });

export const useProducts = (params) =>
  useQuery({ queryKey: ['products', params], queryFn: () => apiFetch('/products', { query: params }), placeholderData: keepPreviousData });

export const useProduct = (slug) => useQuery({ queryKey: ['product', slug], queryFn: async () => (await apiFetch(`/products/${slug}`)).product, enabled: !!slug });

export const useCategories = () => useQuery({ queryKey: ['categories'], queryFn: async () => (await apiFetch('/categories')).items });

export const useQuote = (items, enabled = true) =>
  useQuery({
    queryKey: ['quote', items],
    queryFn: () => apiFetch('/cart/quote', { method: 'POST', body: { items } }),
    enabled: enabled && items.length > 0,
    staleTime: 0,
  });

export const useMyOrders = (params) => useQuery({ queryKey: ['orders', 'mine', params], queryFn: () => apiFetch('/orders/mine', { query: params }) });
export const useOrder = (id) => useQuery({ queryKey: ['order', id], queryFn: async () => (await apiFetch(`/orders/${id}`)).order, enabled: !!id });

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

export const useAdminProducts = (params) => useQuery({ queryKey: ['admin', 'products', params], queryFn: () => apiFetch('/admin/products', { query: params }), placeholderData: keepPreviousData });
export const useAdminProduct = (id) => useQuery({ queryKey: ['admin', 'product', id], queryFn: async () => (await apiFetch(`/admin/products/${id}`)).product, enabled: !!id && id !== 'new' });
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
export const useAdminOrders = (params) => useQuery({ queryKey: ['admin', 'orders', params], queryFn: () => apiFetch('/admin/orders', { query: params }), placeholderData: keepPreviousData });
export const useAdminOrder = (id) => useQuery({ queryKey: ['admin', 'order', id], queryFn: async () => (await apiFetch(`/admin/orders/${id}`)).order, enabled: !!id });
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
