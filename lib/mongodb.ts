import mongoose from 'mongoose';
import dns from 'dns';

// Configure reliable DNS servers and IPv4 resolution for Atlas SRV lookup on Windows/Node
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
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

export async function invalidateMongoConnection(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (e) {}
  cached.conn = null;
  cached.promise = null;
  globalThis.mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase(forceRefresh = false): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://letsrentz_admin:Infinologylexvra@cluster0.saq1nen.mongodb.net/letsrentz?retryWrites=true&w=majority&appName=Cluster0';
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  if (forceRefresh) {
    await invalidateMongoConnection();
  }

  // 1. If mongoose is already connected and database handle is ready, return cached instance
  if (!forceRefresh && cached.conn && mongoose.connection.readyState === 1 && mongoose.connection.db) {
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
      bufferCommands: false,
      autoIndex: false,
      minPoolSize: 1,
      maxPoolSize: isServerless ? 1 : 10,
      maxIdleTimeMS: isServerless ? 10000 : 45000,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
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
