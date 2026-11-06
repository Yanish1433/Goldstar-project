/** Money is whole NPR integers everywhere (Store API currency_minor_unit is 0). */
export const DELIVERY_FEE = 0;

export function toNpr(value) {
  const n = Number.parseInt(String(value ?? '').replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

export function sum(values) {
  return values.reduce((a, b) => a + b, 0);
}
