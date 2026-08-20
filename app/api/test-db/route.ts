import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Property from '@/models/Property';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const t0 = performance.now();
  const uri = process.env.MONGODB_URI || '';
  const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');

  try {
    const conn = await connectToDatabase();
    const durConn = (performance.now() - t0).toFixed(2);

    const tQuery = performance.now();
    const PropertyModel = conn.models.Property || Property;
    const count = await PropertyModel.countDocuments();
    const sample = await PropertyModel.find({ verified: true }).select('pid title price city').limit(5).lean();
    const durQuery = (performance.now() - tQuery).toFixed(2);
    const totalTime = (performance.now() - t0).toFixed(2);

    return NextResponse.json({
      success: true,
      environment: process.env.VERCEL ? 'vercel-serverless' : 'local-node',
      uriUsed: maskedUri,
      timing: {
        connectionMs: durConn,
        queryMs: durQuery,
        totalMs: totalTime
      },
      database: {
        totalPropertiesInDb: count,
        verifiedSample: sample
      }
    });
  } catch (error: any) {
    const totalTime = (performance.now() - t0).toFixed(2);
    return NextResponse.json({
      success: false,
      environment: process.env.VERCEL ? 'vercel-serverless' : 'local-node',
      uriUsed: maskedUri,
      error: error?.message || String(error),
      totalMs: totalTime
    }, { status: 500 });
  }
}
