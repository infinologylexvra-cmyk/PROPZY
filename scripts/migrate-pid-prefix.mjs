import mongoose from 'mongoose';
import dns from 'dns';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DNS resolution fix for Windows + MongoDB Atlas SRV
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

// Load .env.local
function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...rest] = trimmed.split('=');
        if (key && !process.env[key.trim()]) {
          process.env[key.trim()] = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
        }
      }
    });
  }
}

loadEnvLocal();

const mongodbUri = process.env.MONGODB_URI;

if (!mongodbUri) {
  console.error('❌ MONGODB_URI is not set in .env.local');
  process.exit(1);
}

async function runMigration() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(mongodbUri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });
  console.log('✅ Connected to MongoDB successfully.');

  const db = mongoose.connection.db;

  // 1. Migrate Properties collection (pid field)
  console.log('\n--- Migrating Properties (pid: LR-* -> PZ-*) ---');
  const propertiesCol = db.collection('properties');
  const lrProperties = await propertiesCol.find({ pid: { $regex: /^LR-/i } }).toArray();
  console.log(`Found ${lrProperties.length} properties with LR- prefix.`);

  let updatedPropsCount = 0;
  for (const prop of lrProperties) {
    const oldPid = prop.pid;
    const newPid = oldPid.replace(/^LR-/i, 'PZ-');
    await propertiesCol.updateOne(
      { _id: prop._id },
      { $set: { pid: newPid } }
    );
    console.log(`  Updated property [${prop.title?.slice(0, 30)}...]: ${oldPid} -> ${newPid}`);
    updatedPropsCount++;
  }
  console.log(`✅ Successfully updated ${updatedPropsCount} properties.`);

  // 2. Migrate Inquiries collection (propertyPid field)
  console.log('\n--- Migrating Inquiries (propertyPid: LR-* -> PZ-*) ---');
  const inquiriesCol = db.collection('inquiries');
  const lrInquiries = await inquiriesCol.find({ propertyPid: { $regex: /^LR-/i } }).toArray();
  console.log(`Found ${lrInquiries.length} inquiries with LR- propertyPid.`);

  let updatedInquiriesCount = 0;
  for (const inq of lrInquiries) {
    const oldPid = inq.propertyPid;
    const newPid = oldPid.replace(/^LR-/i, 'PZ-');
    await inquiriesCol.updateOne(
      { _id: inq._id },
      { $set: { propertyPid: newPid } }
    );
    console.log(`  Updated inquiry [${inq.tenantName || inq._id}]: ${oldPid} -> ${newPid}`);
    updatedInquiriesCount++;
  }
  console.log(`✅ Successfully updated ${updatedInquiriesCount} inquiries.`);

  // 3. Migrate Users collection (wishlist items: LR-* -> PZ-*)
  console.log('\n--- Migrating Users (wishlist items: LR-* -> PZ-*) ---');
  const usersCol = db.collection('users');
  const usersWithWishlist = await usersCol.find({ wishlist: { $exists: true, $ne: [] } }).toArray();
  
  let updatedUsersCount = 0;
  for (const user of usersWithWishlist) {
    let hasChanges = false;
    const newWishlist = (user.wishlist || []).map((item) => {
      if (typeof item === 'string' && item.match(/^LR-/i)) {
        hasChanges = true;
        return item.replace(/^LR-/i, 'PZ-');
      }
      return item;
    });

    if (hasChanges) {
      await usersCol.updateOne(
        { _id: user._id },
        { $set: { wishlist: newWishlist } }
      );
      console.log(`  Updated user wishlist [${user.email}]: ${JSON.stringify(user.wishlist)} -> ${JSON.stringify(newWishlist)}`);
      updatedUsersCount++;
    }
  }
  console.log(`✅ Successfully updated ${updatedUsersCount} user wishlists.`);

  // Summary
  console.log('\n=========================================');
  console.log(`🎉 MIGRATION COMPLETE!`);
  console.log(`- Properties updated: ${updatedPropsCount}`);
  console.log(`- Inquiries updated: ${updatedInquiriesCount}`);
  console.log(`- User wishlists updated: ${updatedUsersCount}`);
  console.log('=========================================\n');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

runMigration().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
