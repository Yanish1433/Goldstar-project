// Builds a small store inside the in-browser mock through its own API (register, check out, move statuses), so admin
// tests never depend on invented seed data. The mock itself starts with no orders and no customers.
const ship = (fullName, phone, city) => ({ fullName, phone, addressLine: 'House 4, Ganesh Tole', area: 'Ward 3', city, landmark: '', notes: '' });

export const SHOPPERS = [
  { name: 'Sita Gurung', email: 'sita@example.com', phone: '9841111111', city: 'Pokhara', orders: [{ qty: 2, to: 'delivered' }, { qty: 1, to: 'cancelled' }] },
  { name: 'Bikash Tamang', email: 'bikash@example.com', phone: '9802222222', city: 'Kathmandu', orders: [{ qty: 1, to: 'shipped' }] },
  { name: 'Aarav Shrestha', email: 'aarav@example.com', phone: '9813333333', city: 'Lalitpur', orders: [{ qty: 1, to: null }] },
];

const PATH = { confirmed: ['confirmed'], shipped: ['confirmed', 'shipped'], delivered: ['confirmed', 'shipped', 'delivered'], cancelled: ['cancelled'] };

/** Returns { orders, product }; leaves the mock signed in as the admin. */
export async function seedMockShop(mockRequest) {
  const { product } = await mockRequest('GET', '/products/g10-401');
  const c = product.colourways.find((x) => x.inStock);
  const item = (qty) => ({ productId: product.id, colourwayKey: c.key, size: c.sizes[0], qty });
  const placed = [];
  for (const s of SHOPPERS) {
    await mockRequest('POST', '/auth/register', { name: s.name, email: s.email, password: 'password1', phone: s.phone });
    for (const o of s.orders) {
      const { order } = await mockRequest('POST', '/orders', { items: [item(o.qty)], paymentMethod: 'cod', shipping: ship(s.name, s.phone, s.city) });
      placed.push({ ...order, to: o.to });
    }
  }
  await mockRequest('POST', '/auth/login', { email: 'admin@goldstar.test', password: 'x' });
  for (const o of placed) {
    for (const st of o.to ? PATH[o.to] : []) await mockRequest('PATCH', `/admin/orders/${o.id}/status`, { status: st });
  }
  return { orders: placed, product };
}
