import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Blog from '@/models/Blog';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    let blog = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      blog = await Blog.findById(id).lean();
    }
    if (!blog) {
      blog = await Blog.findOne({ slug: id }).lean();
    }

    if (!blog) {
      return NextResponse.json(
        { success: false, message: 'Blog post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: blog });
  } catch (err: any) {
    console.error('Failed to get blog by id/slug:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve blog post' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    let deleted = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      deleted = await Blog.findByIdAndDelete(id);
    } else {
      deleted = await Blog.findOneAndDelete({ slug: id });
    }

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Blog post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (err: any) {
    console.error('Failed to delete blog:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to delete blog' },
      { status: 500 }
    );
  }
}
