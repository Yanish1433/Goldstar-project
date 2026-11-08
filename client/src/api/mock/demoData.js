// Demo data for the mock API: customers across Nepal, ~60 days of orders (a little busier this month than last, with
// weekend peaks) and pairs on hand per size. A seeded PRNG keeps it identical on every load; dates are relative to
// today so the dashboard always looks current.

const DAY = 86_400_000;

export function rng(seedNum) {
  let a = seedNum >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const PEOPLE = [
  ['Aarav Shrestha', 'Baneshwor', 'Kathmandu', 'Near Everest Bank'],
  ['Sita Gurung', 'Lakeside', 'Pokhara', 'Opposite Fewa Park'],
  ['Bikash Tamang', 'Boudha', 'Kathmandu', 'Behind the stupa gate'],
  ['Pooja Maharjan', 'Jhamsikhel', 'Lalitpur', ''],
  ['Suman Rai', 'Itahari Chowk', 'Itahari', ''],
  ['Anisha Thapa', 'Pulchowk', 'Lalitpur', 'Near Labim Mall'],
  ['Rohan Karki', 'Traffic Chowk', 'Butwal', ''],
  ['Nisha Adhikari', 'Bharatpur Heights', 'Chitwan', 'Narayani bridge side'],
  ['Prakash Magar', 'Suryabinayak', 'Bhaktapur', ''],
  ['Sabina Lama', 'Thamel', 'Kathmandu', 'Chhetrapati side'],
  ['Dipesh Bhattarai', 'Main Road', 'Biratnagar', ''],
  ['Kritika Joshi', 'Dhangadhi Bazaar', 'Dhangadhi', 'Near Sheetal Chowk'],
  ['Manish Sherpa', 'Chabahil', 'Kathmandu', ''],
  ['Rekha Basnet', 'Bhanu Chowk', 'Dharan', ''],
  ['Sanjay Yadav', 'Adarsha Nagar', 'Birgunj', ''],
  ['Gita Poudel', 'Hetauda-4', 'Hetauda', 'Near the bus park'],
];
const TOLES = ['Shanti Marg', 'Pipal Bot', 'Ganesh Tole', 'Naya Basti', 'Bagmati Marg', 'Hariyali Path', 'Milan Chowk'];
const NOTES = ['Call before delivery', 'Deliver after 5 pm', 'Leave with the shop downstairs'];
const CANCEL = ['Customer changed their mind', 'Could not reach the customer by phone', 'Ordered the wrong size'];

const FLOW_TO = {
  placed: ['placed'],
  confirmed: ['placed', 'confirmed'],
  shipped: ['placed', 'confirmed', 'shipped'],
  delivered: ['placed', 'confirmed', 'shipped', 'delivered'],
  cancelled: ['placed', 'cancelled'],
};
const STEP_H = { placed: 0, confirmed: 3, shipped: 26, delivered: 70, cancelled: 5 };

export function makeDemo({ seed = 20261108, nowMs = Date.now() } = {}) {
  const rand = rng(seed);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const daysAgo = (n, hour = 12) => {
    const d = new Date(nowMs - n * DAY);
    d.setHours(hour, Math.floor(rand() * 60), 0, 0);
    return d;
  };

  const stockFor = (c) => Object.fromEntries(c.sizes.map((sz) => {
    const r = rand();
    const qty = c.inStock === false ? 0 : r < 0.08 ? 0 : r < 0.22 ? 1 + Math.floor(rand() * 3) : 6 + Math.floor(rand() * 22);
    return [sz, qty];
  }));

  const customers = PEOPLE.map(([name, area, city, landmark], i) => {
    const phone = `98${String(Math.floor(rand() * 1e8)).padStart(8, '0')}`;
    return {
      user: { id: `mock-u${10 + i}`, name, email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`, phone, role: 'user', createdAt: daysAgo(40 + Math.floor(rand() * 200)).toISOString() },
      weight: i < 4 ? 3 : i < 9 ? 2 : 1,
      ship: { fullName: name, phone, addressLine: `House ${10 + Math.floor(rand() * 90)}, ${pick(TOLES)}`, area, city, landmark, notes: '' },
    };
  });

  const statusFor = (age) => {
    const r = rand();
    if (age > 10) return r < 0.9 ? 'delivered' : 'cancelled';
    if (age > 4) return r < 0.55 ? 'delivered' : r < 0.82 ? 'shipped' : r < 0.92 ? 'confirmed' : 'cancelled';
    if (age >= 1) return r < 0.3 ? 'shipped' : r < 0.7 ? 'confirmed' : r < 0.95 ? 'placed' : 'cancelled';
    return r < 0.75 ? 'placed' : 'confirmed';
  };

  /** Order plans: { customer, lines: [{ pickProduct(buyable) }], at, status, history } — resolved against the catalogue by the mock. */
  const plans = (buyable) => {
    const weighted = customers.flatMap((c) => Array(c.weight).fill(c));
    const out = [];
    for (let age = 59; age >= 0; age -= 1) {
      const day = new Date(nowMs - age * DAY).getDay();
      const base = age >= 30 ? 1.25 : 1.75;
      const n = Math.max(0, Math.round(base + (day === 5 || day === 6 ? 1.2 : 0) + (rand() - 0.5) * 2.2));
      for (let k = 0; k < n; k += 1) {
        const cust = pick(weighted);
        const lineCount = 1 + (rand() < 0.22 ? 1 : 0);
        const items = Array.from({ length: lineCount }, () => {
          const { p, c } = pick(buyable);
          return { productId: p.id, colourwayKey: c.key, size: pick(c.sizes), qty: rand() < 0.15 ? 2 : 1 };
        });
        let at = daysAgo(age, 8 + Math.floor(rand() * 13));
        if (at.getTime() > nowMs - 5 * 60_000) at = new Date(nowMs - (k + 1) * 47 * 60_000);
        const status = statusFor(age);
        const history = FLOW_TO[status].map((s) => ({
          status: s,
          at: new Date(Math.min(nowMs - 60_000, at.getTime() + STEP_H[s] * 3_600_000 + (s === 'placed' ? 0 : rand() * 3_600_000))).toISOString(),
          note: s === 'cancelled' ? pick(CANCEL) : '',
        }));
        const shipping = { ...cust.ship, notes: rand() < 0.2 ? pick(NOTES) : '' };
        out.push({ userId: cust.user.id, items, shipping, at: at.toISOString(), status, history });
      }
    }
    return out;
  };

  return { users: customers.map((c) => c.user), stockFor, plans, daysAgo };
}
