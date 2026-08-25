import mongoose, { Schema, Document } from 'mongoose';

export interface IContactMessage extends Document {
  fullName: string;
  workEmail: string;
  company?: string;
  inquiryType: string;
  message: string;
  status: 'pending' | 'read' | 'replied' | 'archived';
  createdAt: Date;
}

const ContactMessageSchema: Schema = new Schema({
  fullName: { type: String, required: true, trim: true },
  workEmail: { type: String, required: true, trim: true, lowercase: true, index: true },
  company: { type: String, default: '', trim: true },
  inquiryType: { type: String, default: 'General Inquiry', trim: true },
  message: { type: String, required: true, trim: true },
  status: { 
    type: String, 
    enum: ['pending', 'read', 'replied', 'archived'], 
    default: 'pending',
    index: true 
  },
  createdAt: { type: Date, default: Date.now, index: true }
});

export default mongoose.models.ContactMessage || mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema);
