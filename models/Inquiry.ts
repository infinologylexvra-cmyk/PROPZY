import mongoose, { Schema, Document } from 'mongoose';

export interface IInquiry extends Document {
  propertyId: string;
  propertyTitle: string;
  propertyPid: string;
  tenantName: string;
  tenantPhone: string;
  tenantMessage?: string;
  status: 'pending' | 'contacted' | 'closed';
  createdAt: Date;
}

const InquirySchema: Schema = new Schema({
  propertyId: { type: String, required: true },
  propertyTitle: { type: String, required: true },
  propertyPid: { type: String, required: true },
  tenantName: { type: String, required: true },
  tenantPhone: { type: String, required: true },
  tenantMessage: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'contacted', 'closed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Inquiry || mongoose.model<IInquiry>('Inquiry', InquirySchema);
