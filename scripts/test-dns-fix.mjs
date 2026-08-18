import dns from 'dns';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set public DNS servers for reliable SRV resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  console.warn('Could not set DNS servers:', e.message);
}

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...rest] = trimmed.split('=');
      if (key && !process.env[key.trim()]) {
        process.env[key.trim()] = rest.join('=').trim();
      }
    }
  });
}

async function testAtlas() {
  const t0 = performance.now();
  console.log('Connecting to MongoDB Atlas with Google/Cloudflare DNS...');
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      family: 4
    });
    console.log(`✅ Connected successfully in ${(performance.now() - t0).toFixed(2)}ms!`);
    const count = await mongoose.connection.db.collection('properties').countDocuments();
    console.log(`Found ${count} property documents in MongoDB Atlas.`);
  } catch (err) {
    console.error('❌ Connection failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

testAtlas();
