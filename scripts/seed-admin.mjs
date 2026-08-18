import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['tenant', 'owner', 'admin'], default: 'admin' },
  city: { type: String, default: 'Mohali' },
  wishlist: { type: [String], default: [] },
  ownerVerified: { type: Boolean, default: true },
  verificationStatus: { type: String, default: 'approved' },
  createdAt: { type: Date, default: Date.now }
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seedAdmin() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas!\n');

  const email = 'admin@propzy.com';
  const rawPassword = 'admin';
  const name = 'Admin';
  const phone = '9999900000';
  const role = 'admin';

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(rawPassword, salt);

  const existing = await User.findOne({ email });

  if (existing) {
    console.log(`Found existing user with email ${email}. Updating to role 'admin' and password 'admin'...`);
    existing.name = name;
    existing.password = hashedPassword;
    existing.role = role;
    existing.phone = existing.phone || phone;
    existing.ownerVerified = true;
    existing.verificationStatus = 'approved';
    await existing.save();
    console.log(`✅ Admin user [${existing._id}] updated successfully!`);
  } else {
    console.log(`Creating new Admin user with email ${email}...`);
    const newAdmin = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      city: 'Mohali',
      wishlist: [],
      ownerVerified: true,
      verificationStatus: 'approved'
    });
    console.log(`✅ Admin user [${newAdmin._id}] created successfully!`);
  }

  // Verification check
  const verified = await User.findOne({ email });
  const isMatch = await bcrypt.compare('admin', verified.password);
  console.log('\n--- Admin User in MongoDB Atlas ---');
  console.log({
    id: verified._id.toString(),
    name: verified.name,
    email: verified.email,
    phone: verified.phone,
    role: verified.role,
    passwordMatchTest: isMatch ? '✅ Successfully verified (matches "admin")' : '❌ Password match failed'
  });

  await mongoose.disconnect();
  console.log('\nDone!');
}

seedAdmin().catch(err => {
  console.error('Error seeding admin user:', err);
  process.exit(1);
});
