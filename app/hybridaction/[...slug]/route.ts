import { NextRequest, NextResponse } from 'next/server';

// Silently handle third-party browser extension tracker pings to prevent 404 log noise
export async function GET(req: NextRequest) {
  const callback = req.nextUrl.searchParams.get('__callback__');
  if (callback) {
    return new NextResponse(`${callback}({})`, {
      status: 200,
      headers: { 'Content-Type': 'application/javascript' }
    });
  }
  return NextResponse.json({ success: true });
}

export async function POST() {
  return NextResponse.json({ success: true });
}
