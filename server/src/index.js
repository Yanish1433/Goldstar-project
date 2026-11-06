import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDb, disconnectDb } from './db.js';

try {
  await connectDb(env.MONGODB_URI);
} catch (err) {
  console.error(`Could not connect to MongoDB at the configured MONGODB_URI: ${err.message}`);
  console.error('Is the MongoDB service running? Check MONGODB_URI in server/.env.');
  process.exit(1);
}

const server = createApp().listen(env.PORT, () => {
  console.log(`Goldstar API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

server.on('error', (err) => {
  console.error(err.code === 'EADDRINUSE' ? `Port ${env.PORT} is already in use.` : err.message);
  process.exit(1);
});

async function shutdown() {
  server.close();
  await disconnectDb();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
