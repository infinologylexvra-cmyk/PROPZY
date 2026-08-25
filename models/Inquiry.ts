import mongoose, { Schema, Document } from 'mongoose';

export interface IInquiry extends Document {
  propertyId: string;
  propertyTitle: string;
  propertyPid: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail?: string;
  tenantMessage?: string;
  status: string;
  createdAt: Date;
}

const InquirySchema: Schema = new Schema({
  propertyId: { type: String, required: true },
  propertyTitle: { type: String, required: true },
  propertyPid: { type: String, required: true },
  tenantName: { type: String, required: true, trim: true },
  tenantPhone: { type: String, required: true, trim: true },
  tenantEmail: { type: String, default: '', trim: true, index: true },
  tenantMessage: { type: String, default: '', trim: true },
  status: { 
    type: String, 
    default: 'New', 
    index: true 
  },
  createdAt: { type: Date, default: Date.now, index: true }
});

export default mongoose.models.Inquiry || mongoose.model<IInquiry>('Inquiry', InquirySchema);
