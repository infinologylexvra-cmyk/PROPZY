import dns from 'dns';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

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

async function inspect() {
  await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
  const db = mongoose.connection.db;
  const count = await db.collection('properties').countDocuments();
  const verifiedCount = await db.collection('properties').countDocuments({ verified: true });
  const unverifiedCount = await db.collection('properties').countDocuments({ verified: { $ne: true } });
  const sample = await db.collection('properties').find({}).limit(10).toArray();

  console.log('--- DATABASE INSPECTION ---');
  console.log('Total properties:', count);
  console.log('Verified count:', verifiedCount);
  console.log('Unverified count:', unverifiedCount);
  console.log('Sample properties:');
  sample.forEach(p => {
    console.log(`- PID: ${p.pid || p.id}, Title: "${p.title}", Verified: ${p.verified}, Category: ${p.category}, City: ${p.city}, Price: ${p.price}`);
  });
  await mongoose.disconnect();
}

inspect().catch(console.error);
