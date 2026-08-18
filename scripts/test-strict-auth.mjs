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
  name: String,
  email: String,
  phone: String,
  password: String,
  role: String
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function testStrictAuth() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected!');

  console.log('\n--- Scenario 1: Random non-existent email ---');
  const fakeUser = await User.findOne({ email: 'random_fake_email_12345@test.com' });
  console.log('Lookup Result for non-existent user:', fakeUser);
  if (!fakeUser) {
    console.log('✅ Correct: Non-existent user is NOT found in database.');
  } else {
    console.error('❌ Error: Fake user found.');
  }

  console.log('\n--- Scenario 2: Existing user password verification ---');
  const existingUser = await User.findOne({ email: 'aman@gmail.com' });
  if (existingUser) {
    console.log('Found user in DB:', existingUser.email, existingUser.name);
    const wrongPassMatch = await bcrypt.compare('wrongPassword999', existingUser.password);
    console.log('Testing WRONG password match:', wrongPassMatch);
    if (!wrongPassMatch) {
      console.log('✅ Correct: Wrong password was REJECTED.');
    } else {
      console.error('❌ Error: Wrong password was accepted!');
    }
  }

  await mongoose.disconnect();
}

testStrictAuth().catch(console.error);
