import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Property from '@/models/Property';
import { redisGet, redisSet } from '@/lib/redis';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';

  if (!q || q.length < 1) {
    return NextResponse.json({ success: true, data: [] });
  }

  const cacheKey = `search:sugg:${q.toLowerCase()}`;

  // 1. Fast Redis Cache Check (< 2ms)
  try {
    const cached = await redisGet<any[]>(cacheKey);
    if (cached && Array.isArray(cached)) {
      return NextResponse.json(
        { success: true, data: cached, source: 'redis' },
        { headers: { 'X-Cache-Status': 'REDIS-HIT' } }
      );
    }
  } catch {}

  try {
    const regex = new RegExp(q, 'i');

    await connectToDatabase();
    const mongoResults = await Property.find({
      $or: [
        { pid: regex },
        { title: regex },
        { locality: regex },
        { city: regex },
        { category: regex },
        { type: regex }
      ]
    })
      .select('pid title locality city price category type verified images')
      .limit(6)
      .lean();

    const results = mongoResults || [];

    // Cache suggestions in Redis for 60 seconds
    if (results.length > 0) {
      await redisSet(cacheKey, results, 60);
    }

    return NextResponse.json({ success: true, data: results, source: 'mongodb' });
  } catch (error: any) {
    console.warn('Search suggestions error:', error?.message);
    return NextResponse.json({ success: true, data: [], source: 'empty' });
  }
}
