import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const PropertySchema = new mongoose.Schema({}, { strict: false });
const Property = mongoose.models.Property || mongoose.model('Property', PropertySchema);

async function run() {
  console.log('--- TESTING LIVE DATABASE QUERY ---');
  console.log('Using URI:', process.env.MONGODB_URI?.replace(/:([^:@]+)@/, ':****@'));
  const t0 = Date.now();
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    family: 4
  });
  console.log('✅ Connected in', Date.now() - t0, 'ms');

  const t1 = Date.now();
  const properties = await Property.find({ verified: true }).limit(50).lean();
  console.log('✅ Query took', Date.now() - t1, 'ms');
  console.log('Total verified properties in Atlas:', properties.length);
  console.log('\nTop 10 Live Database Properties:');
  properties.slice(0, 10).forEach((p, i) => {
    console.log(`${i + 1}. [${p.pid}] ${p.title} - ₹${p.price?.toLocaleString('en-IN')} (${p.city}, ${p.locality || ''})`);
  });
  await mongoose.disconnect();
}

run().catch(console.error);
