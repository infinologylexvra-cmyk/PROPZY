import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

import { connectToDatabase } from '../lib/mongodb.js';
import mongoose from 'mongoose';

async function testLibConnection() {
  console.log('Testing lib/mongodb.ts with direct replica set URI...');
  const t0 = performance.now();
  const conn = await connectToDatabase();
  console.log(`✅ Connected in ${(performance.now() - t0).toFixed(2)}ms!`);
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));
  await mongoose.disconnect();
}

testLibConnection().catch(console.error);
