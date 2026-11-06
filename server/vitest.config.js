import { defineConfig } from 'vitest/config';

// Tests never read server/.env: config comes from here, and the database is always
// MONGODB_URI_TEST (default goldstar_test), never the dev data.
const testUri = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/goldstar_test';

export default defineConfig({
  test: {
    include: ['test/**/*.test.js'],
    environment: 'node',
    fileParallelism: false, // all files share one test database
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: {
      NODE_ENV: 'test',
      PORT: '5051',
      MONGODB_URI: testUri,
      MONGODB_URI_TEST: testUri,
      JWT_SECRET: 'test-only-secret-0123456789-0123456789-abcdef',
      JWT_EXPIRES_IN: '7d',
      COOKIE_SECURE: 'false',
      CLIENT_ORIGIN: 'http://localhost:5173',
    },
  },
});
