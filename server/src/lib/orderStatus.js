export const ORDER_STATUSES = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const FLOW = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export function allowedNext(from) {
  return FLOW[from] ?? [];
}

/** SPEC §2.4: the one place the status flow is decided. */
export function canTransition(from, to) {
  return allowedNext(from).includes(to);
}
