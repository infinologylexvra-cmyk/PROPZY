import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  googleId?: string;
  avatar?: string;
  role: 'tenant' | 'owner' | 'admin';
  city?: string;
  wishlist?: string[];
  ownerVerified?: boolean;
  verificationStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  electricityBillUrl?: string;
  consumerNumber?: string;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String, default: '' },
  password: { type: String, default: '' },
  googleId: { type: String, default: '' },
  avatar: { type: String, default: '' },
  role: { 
    type: String, 
    enum: ['tenant', 'owner', 'admin'], 
    default: 'tenant',
    required: true 
  },
  city: { type: String, default: 'Mohali' },
  wishlist: { type: [String], default: [] },
  ownerVerified: { type: Boolean, default: false },
  verificationStatus: { 
    type: String, 
    enum: ['none', 'pending', 'approved', 'rejected'], 
    default: 'none' 
  },
  electricityBillUrl: { type: String, default: '' },
  consumerNumber: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { autoIndex: false });

UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const pass = String(this.password);
  // Prevent double hashing if already hashed
  if (pass.startsWith('$2a$') || pass.startsWith('$2b$') || pass.startsWith('$2y$')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(pass, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (this: IUser, candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  const pass = String(this.password);
  // If stored password is a bcrypt hash
  if (pass.startsWith('$2a$') || pass.startsWith('$2b$') || pass.startsWith('$2y$')) {
    return await bcrypt.compare(candidatePassword, pass);
  }
  // Fallback for legacy plain-text passwords in database
  return pass === candidatePassword;
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
