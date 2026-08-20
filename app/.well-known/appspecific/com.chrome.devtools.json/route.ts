import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json({}, {
    headers: {
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}
