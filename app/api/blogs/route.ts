import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Blog from '@/models/Blog';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const filter: any = {};
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { authorName: { $regex: search, $options: 'i' } }
      ];
    }

    const blogs = await Blog.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: blogs });
  } catch (err: any) {
    console.error('Failed to retrieve blogs:', err);
    return NextResponse.json({ success: false, message: 'Failed to retrieve blogs', data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      excerpt,
      content,
      category = 'Rental Guide',
      authorName = 'PROPZY Team',
      authorRole = 'Real Estate Expert',
      coverImage = '',
      readTime = '4 min read',
      tags = []
    } = body;

    if (!title || !content || !excerpt) {
      return NextResponse.json(
        { success: false, message: 'Please provide title, excerpt, and content.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let baseSlug = slugify(title);
    if (!baseSlug) {
      baseSlug = `blog-${Date.now().toString(36)}`;
    }

    let finalSlug = baseSlug;
    const existing = await Blog.findOne({ slug: finalSlug });
    if (existing) {
      finalSlug = `${baseSlug}-${Date.now().toString(36)}`;
    }

    const newBlog = await Blog.create({
      title: title.trim(),
      slug: finalSlug,
      excerpt: excerpt.trim(),
      content: content.trim(),
      category: category.trim(),
      authorName: authorName.trim(),
      authorRole: authorRole.trim(),
      coverImage: coverImage.trim(),
      readTime: readTime.trim() || '4 min read',
      tags: Array.isArray(tags) ? tags : [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      data: newBlog,
      message: 'Blog post published successfully!'
    });
  } catch (err: any) {
    console.error('Blog creation error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to create blog post' },
      { status: 500 }
    );
  }
}
