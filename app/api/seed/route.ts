import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Property from '@/models/Property';
import Inquiry from '@/models/Inquiry';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const propCount = await Property.countDocuments();
    const totalInquiries = await Inquiry.countDocuments();

    return NextResponse.json({
      success: true,
      message: 'MongoDB Atlas is connected with real database listings.',
      data: {
        propertiesCount: propCount,
        inquiriesCount: totalInquiries,
        database: 'MongoDB Atlas',
      },
    });
  } catch (error: any) {
    console.error('Atlas DB Status Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to connect to MongoDB Atlas database',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
