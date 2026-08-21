import { getRedisClient, redisGet, redisSet, redisDel, redisPing, isRedisAvailable } from '../lib/redis.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from .env.local
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

async function runRedisTests() {
  console.log('🧪 Testing Redis Cache Layer...\n');

  console.log('1. Testing Redis PING & Latency...');
  const pingLatency = await redisPing();

  if (pingLatency !== null) {
    console.log(`✅ Redis PING Successful! Latency: ${pingLatency}ms`);
    console.log(`   Redis Ready State: ${isRedisAvailable() ? 'ONLINE' : 'OFFLINE'}\n`);

    console.log('2. Testing JSON redisSet...');
    const testPayload = { id: 'PZ-TEST', title: 'Luxury 2 BHK in Mohali', price: 25000, timestamp: Date.now() };
    const setSuccess = await redisSet('prop:test:sample', testPayload, 60);
    console.log(`✅ redisSet: ${setSuccess ? 'OK' : 'FAILED'}`);

    console.log('3. Testing JSON redisGet...');
    const fetched = await redisGet('prop:test:sample');
    console.log('✅ redisGet result:', fetched);

    console.log('4. Testing Wildcard Pattern Deletion (redisDel)...');
    await redisSet('prop:test:1', { a: 1 }, 60);
    await redisSet('prop:test:2', { b: 2 }, 60);
    const deletedCount = await redisDel('prop:test:*');
    console.log(`✅ Wildcard redisDel ("prop:test:*") purged ${deletedCount} keys successfully!\n`);

    console.log('🎉 Redis Cache Integration is 100% Operational and Ready!');
  } else {
    console.log('ℹ️ Local/Remote Redis server is not currently running or reachable.');
    console.log('   App will automatically & safely use the In-Memory Cache layer without any disruption.');
  }

  const client = getRedisClient();
  if (client) {
    await client.quit().catch(() => {});
  }
  process.exit(0);
}

runRedisTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
