import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load env vars from .env.local if not already in process.env
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
  console.error('Please ensure NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set in .env.local');
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

const PropertySchema = new mongoose.Schema({
  pid: String,
  title: String,
  images: [String],
}, { strict: false });

const Property = mongoose.models.Property || mongoose.model('Property', PropertySchema);

async function migrate() {
  console.log('🚀 Starting Base64 to Cloudinary Migration...');
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(mongodbUri);
  console.log('✅ Connected to MongoDB Atlas\n');

  console.log('Scanning properties collection...');
  const cursor = Property.find({}).cursor();

  let scannedCount = 0;
  let totalBase64Found = 0;
  let totalUploaded = 0;
  let totalPropertiesUpdated = 0;

  for (let prop = await cursor.next(); prop != null; prop = await cursor.next()) {
    scannedCount++;
    const currentImages = Array.isArray(prop.images) ? prop.images : [];
    const hasBase64 = currentImages.some(img => typeof img === 'string' && img.startsWith('data:image/'));

    if (!hasBase64) {
      continue;
    }

    totalBase64Found++;
    console.log(`\n--------------------------------------------------`);
    console.log(`📸 Found Base64 images in Property [${prop.pid || prop._id}] - "${prop.title || 'Untitled'}"`);

    const newImages = [];
    let updated = false;

    for (let i = 0; i < currentImages.length; i++) {
      const img = currentImages[i];
      if (typeof img === 'string' && img.startsWith('data:image/')) {
        try {
          console.log(`  ⏳ Uploading image ${i + 1}/${currentImages.length} to Cloudinary...`);
          const res = await cloudinary.uploader.upload(img, {
            folder: 'letsrentz/properties',
            resource_type: 'image',
          });
          newImages.push(res.secure_url);
          totalUploaded++;
          updated = true;
          console.log(`  ✓ Uploaded: ${res.secure_url}`);
        } catch (err) {
          console.error(`  ❌ Failed to upload image ${i + 1}:`, err.message);
          newImages.push(img); // keep original if upload failed
        }
      } else {
        newImages.push(img);
      }
    }

    if (updated) {
      await Property.updateOne(
        { _id: prop._id },
        { $set: { images: newImages } }
      );
      totalPropertiesUpdated++;
      console.log(`  ✅ Property ${prop.pid || prop._id} updated in MongoDB Atlas with Cloudinary URLs!`);
    }
  }

  console.log('\n=============================================');
  console.log(`🎉 Base64 Migration Complete!`);
  console.log(`Total properties scanned: ${scannedCount}`);
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
