import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDb, disconnectDb, mongoose } from '../src/db.js';
import { runSeed } from '../src/seed/seed.js';

export const ADMIN = { email: 'admin@goldstar.test', password: 'Test-admin-pass-123', name: 'Test Admin' };

export async function startDb() {
  const uri = process.env.MONGODB_URI;
  const dbName = new URL(uri).pathname.replace('/', '');
  // Safety net: never run (or drop) against anything that is not a test database.
  if (!dbName.endsWith('_test')) throw new Error(`Refusing to run tests against database "${dbName}"`);
  await connectDb(uri);
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
}

export async function stopDb() {
  await mongoose.connection.dropDatabase();
  await disconnectDb();
}

export async function seedOffline() {
  return runSeed({ offline: true, admin: { ...ADMIN, reset: false }, log: () => {} });
}

export const makeApp = (opts) => createApp(opts);

/** A supertest agent keeps cookies, like a browser. */
export const agentFor = (app) => request.agent(app);

let counter = 0;
export function newUser(overrides = {}) {
  counter += 1;
  return {
    name: `Test User ${counter}`,
    email: `user${counter}-${Date.now()}@example.com`,
    password: 'Passw0rd-test',
    ...overrides,
  };
}

export async function registeredAgent(app, overrides) {
  const agent = agentFor(app);
  const body = newUser(overrides);
  const res = await agent.post('/api/auth/register').send(body);
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, user: res.body.user, body };
}

export async function adminAgent(app) {
  const agent = agentFor(app);
  const res = await agent.post('/api/auth/login').send({ email: ADMIN.email, password: ADMIN.password });
  if (res.status !== 200) throw new Error(`admin login failed: ${res.status}`);
  return agent;
}

export const SHIPPING = {
  fullName: 'Sita Gurung',
  phone: '9812345678',
  addressLine: '12 Lazimpat Marg',
  area: 'Lazimpat',
  city: 'Kathmandu',
};

export async function g10Line(app, { colourwayKey = 'black', size = '8', qty = 2 } = {}) {
  const res = await request(app).get('/api/products/g10-401');
  return { productId: res.body.product.id, colourwayKey, size, qty };
}
