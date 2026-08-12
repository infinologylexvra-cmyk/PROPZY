import mongoose from 'mongoose';
import dns from 'dns';

// Ensure Node.js resolves MongoDB Atlas SRV records properly on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

declare const process: NodeJS.Process;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/letsrentz';

interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: GlobalMongoose | undefined;
}

let cached = globalThis.mongooseCache;

if (!cached) {
  cached = globalThis.mongooseCache = { conn: null, promise: null };
}

let lastConnectErrorTime = 0;
const RETRY_COOLDOWN_MS = 15000; // 15 seconds cooldown if DB fails

export async function connectToDatabase() {
  if (cached?.conn) {
    return cached.conn;
  }

  if (Date.now() - lastConnectErrorTime < RETRY_COOLDOWN_MS) {
    throw new Error('Database connection in cooldown due to previous timeout');
  }

  if (!cached?.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 8000,
      tlsAllowInvalidCertificates: true,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      lastConnectErrorTime = 0;
      return mongooseInstance;
    }).catch((err) => {
      cached!.promise = null;
      lastConnectErrorTime = Date.now();
      console.warn('MongoDB connection issue:', err.message || err);
      throw err;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    lastConnectErrorTime = Date.now();
    throw e;
  }

  return cached!.conn;
}
