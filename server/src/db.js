import mongoose from 'mongoose';

mongoose.set('strictQuery', true);
mongoose.set('sanitizeFilter', true);

export async function connectDb(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  // Build declared indexes before serving traffic.
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

export function dbIsUp() {
  return mongoose.connection.readyState === 1;
}

export { mongoose };
