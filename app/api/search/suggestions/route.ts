import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Property from '@/models/Property';
import { memoryStore } from '@/lib/memoryStore';
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

    try {
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

      if (mongoResults && mongoResults.length > 0) {
        // Cache suggestions in Redis for 60 seconds
        await redisSet(cacheKey, mongoResults, 60);
        return NextResponse.json({ success: true, data: mongoResults, source: 'mongodb' });
      }
    } catch (dbErr) {
      console.warn('Search suggestions DB fallback:', (dbErr as Error).message);
    }

    // In-Memory Search Fallback
    const qLower = q.toLowerCase();
    const memResults = memoryStore
      .filter((p) =>
        p.pid?.toLowerCase().includes(qLower) ||
        p.title?.toLowerCase().includes(qLower) ||
        p.locality?.toLowerCase().includes(qLower) ||
        p.city?.toLowerCase().includes(qLower) ||
        p.category?.toLowerCase().includes(qLower) ||
        p.type?.toLowerCase().includes(qLower)
      )
      .slice(0, 6);

    return NextResponse.json({ success: true, data: memResults, source: 'memory' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
