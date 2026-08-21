import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from .env.local
function loadEnvLocal() {
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
}

loadEnvLocal();

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const mongodbUri = process.env.MONGODB_URI;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ Cloudinary environment variables are missing.');
  process.exit(1);
}

if (!mongodbUri) {
  console.error('❌ MONGODB_URI is not set in .env.local');
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

async function migrate() {
  console.log('🚀 Starting Base64 to Cloudinary Migration...');
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(mongodbUri);
  console.log('✅ Connected to MongoDB Atlas\n');

  const col = mongoose.connection.collection('properties');
  
  // Get list of all property IDs only (super fast, minimal memory)
  const propList = await col.find({}, { projection: { _id: 1, pid: 1, title: 1 } }).toArray();
  console.log(`Total properties to inspect: ${propList.length}\n`);

  let totalBase64Found = 0;
  let totalUploaded = 0;
  let totalPropertiesUpdated = 0;

  for (let i = 0; i < propList.length; i++) {
    const meta = propList[i];
    
    // Fetch only this single property's images
    const doc = await col.findOne({ _id: meta._id }, { projection: { images: 1 } });
    if (!doc) continue;

    const currentImages = Array.isArray(doc.images) ? doc.images : [];
    const hasBase64 = currentImages.some(img => typeof img === 'string' && img.startsWith('data:image/'));

    if (!hasBase64) {
      continue;
    }

    totalBase64Found++;
    console.log(`[${i + 1}/${propList.length}] 📸 Migrating Property: ${meta.pid || meta._id} ("${meta.title || 'Untitled'}")`);

    const newImages = [];
    let updated = false;

    for (let imgIdx = 0; imgIdx < currentImages.length; imgIdx++) {
      const img = currentImages[imgIdx];
      if (typeof img === 'string' && img.startsWith('data:image/')) {
        try {
          process.stdout.write(`  ⏳ Uploading image ${imgIdx + 1}/${currentImages.length} to Cloudinary... `);
          const res = await cloudinary.uploader.upload(img, {
            folder: 'letsrentz/properties',
            resource_type: 'image',
          });
          newImages.push(res.secure_url);
          totalUploaded++;
          updated = true;
          console.log(`✓ Uploaded (${res.secure_url.substring(0, 55)}...)`);
        } catch (err) {
          console.log(`❌ Failed (${err.message})`);
          newImages.push(img); // keep original
        }
      } else {
        newImages.push(img);
      }
    }

    if (updated) {
      await col.updateOne(
        { _id: meta._id },
        { $set: { images: newImages } }
      );
      totalPropertiesUpdated++;
      console.log(`  💾 Updated in MongoDB: ${meta.pid || meta._id}\n`);
    }
  }

  console.log('=============================================');
  console.log(`🎉 Base64 Migration Complete!`);
  console.log(`Total properties scanned: ${propList.length}`);
  console.log(`Properties containing Base64 images: ${totalBase64Found}`);
  console.log(`Total Base64 images migrated to Cloudinary: ${totalUploaded}`);
  console.log(`Properties updated in MongoDB: ${totalPropertiesUpdated}`);
  console.log('=============================================');

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration fatal error:', err);
  process.exit(1);
});
