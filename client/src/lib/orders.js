// Mirror of the server status machine (SPEC 2.4). Used to offer only allowed next statuses.
export const STATUSES = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const FLOW = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const nextStatuses = (from) => FLOW[from] || [];
export const canTransition = (from, to) => nextStatuses(from).includes(to);

export const statusLabel = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
