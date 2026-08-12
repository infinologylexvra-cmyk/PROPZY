import mongoose from 'mongoose';
import dns from 'dns';

// Optimize Node.js DNS resolution order on Windows for MongoDB Atlas SRV records
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
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
const RETRY_COOLDOWN_MS = 5000; // 5s cooldown between retry attempts

export async function connectToDatabase() {
  if (cached?.conn) {
    return cached.conn;
  }

  if (Date.now() - lastConnectErrorTime < RETRY_COOLDOWN_MS) {
    throw new Error('MongoDB offline (memory store fallback active)');
  }

  if (!cached?.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 4000,
      tlsAllowInvalidCertificates: true,
      family: 4, // Force IPv4 resolution on Windows
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      lastConnectErrorTime = 0;
      return mongooseInstance;
    }).catch((err) => {
      cached!.promise = null;
      lastConnectErrorTime = Date.now();
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
