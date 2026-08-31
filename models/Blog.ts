import mongoose, { Schema, Document } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  authorName: string;
  authorRole: string;
  coverImage?: string;
  readTime: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema: Schema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, index: true },
  excerpt: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  category: { type: String, default: 'Rental Guide', trim: true, index: true },
  authorName: { type: String, default: 'PROPZY Editorial', trim: true },
  authorRole: { type: String, default: 'Real Estate Expert', trim: true },
  coverImage: { type: String, default: '' },
  readTime: { type: String, default: '4 min read' },
  tags: [{ type: String, trim: true }],
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Blog || mongoose.model<IBlog>('Blog', BlogSchema);
