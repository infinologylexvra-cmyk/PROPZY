import mongoose from 'mongoose';
import dns from 'dns';

// Prioritize IPv4 lookup order without overriding system DNS
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

const cached: GlobalMongoose = globalThis.mongooseCache ?? {
  conn: null,
  promise: null,
};

globalThis.mongooseCache = cached;

const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NETLIFY
);

export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  // 1. If mongoose is already connected and database handle is ready, return cached instance
  if (cached.conn && mongoose.connection.readyState === 1 && mongoose.connection.db) {
    return cached.conn;
  }

  // 2. If disconnected, clear old state
  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    cached.conn = null;
    cached.promise = null;
  }

  // 3. Establish singleton connection promise
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: true,
      autoIndex: false,
      minPoolSize: 0,
      maxPoolSize: 10,
      maxIdleTimeMS: 45000,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      family: 4,
    };

    console.log('[MongoDB] Connecting to Atlas...');
    cached.promise = mongoose
      .connect(uri, opts)
      .then((mongooseInstance) => {
        console.log('[MongoDB] Connected successfully to Atlas! readyState =', mongoose.connection.readyState);
        cached.conn = mongooseInstance;
        return mongooseInstance;
      })
      .catch((error) => {
        console.error('[MongoDB] Connection to Atlas failed:', error?.message || error);
        cached.promise = null;
        cached.conn = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
}
