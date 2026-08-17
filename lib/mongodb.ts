import mongoose from 'mongoose';
import dns from 'dns';

// Optimize Node.js DNS resolution order on Windows for IPv4
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: GlobalMongoose | undefined;
}

const cached = globalThis.mongooseCache ?? {
  conn: null,
  promise: null,
};

globalThis.mongooseCache = cached;

const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NETLIFY
);

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  // 1. Return immediately if Mongoose connection is already active
  if ((mongoose.connection.readyState as number) === 1) {
    return mongoose;
  }

  // 2. Return cached instance if available
  if (cached.conn && (mongoose.connection.readyState as number) === 1) {
    return cached.conn;
  }

  // 3. Establish singleton connection promise
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      autoIndex: false, // Prevents Mongoose from blocking on cloud createIndexes during query
      minPoolSize: isServerless ? 0 : 2,
      maxPoolSize: isServerless ? 2 : 10,
      serverSelectionTimeoutMS: 3000, // Fast failure to avoid hanging requests
      connectTimeoutMS: 5000,
      family: 4, // Force IPv4 resolution on Windows for Atlas SRV
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((mongooseInstance) => {
        return mongooseInstance;
      })
      .catch((error) => {
        cached.promise = null;
        cached.conn = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }

  return cached.conn;
}
