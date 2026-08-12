import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Property from '@/models/Property';
import Inquiry from '@/models/Inquiry';
import { INITIAL_PROPERTIES } from '@/lib/seedData';

const SEED_INQUIRIES = [
  {
    propertyId: 'prop-101',
    propertyTitle: '3 BHK Flat for Rent in Sector 75, Mohali',
    propertyPid: 'LR-924',
    tenantName: 'Rahul Verma',
    tenantPhone: '+91 98765 43210',
    tenantMessage: 'Hi, I am interested in scheduling a site visit for this 3 BHK flat in Sector 75.',
    status: 'pending',
  },
  {
    propertyId: 'prop-102',
    propertyTitle: '2 BHK Independent Flat in Zirakpur',
    propertyPid: 'LR-685',
    tenantName: 'Priya Sharma',
    tenantPhone: '+91 98123 45678',
    tenantMessage: 'Looking for direct owner contact details and possession availability.',
    status: 'contacted',
  },
  {
    propertyId: 'prop-103',
    propertyTitle: 'Fully Furnished Girls PG near Paragon School',
    propertyPid: 'LR-237',
    tenantName: 'Ananya Gupta',
    tenantPhone: '+91 97890 12345',
    tenantMessage: 'Interested in room sharing options with food included.',
    status: 'pending',
  },
];

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // Option to force seed via query parameter ?force=true
    const force = req.nextUrl.searchParams.get('force') === 'true';

    const propCount = await Property.countDocuments();
    let seededPropertiesCount = propCount;

    if (propCount === 0 || force) {
      if (force) {
        await Property.deleteMany({});
        await Inquiry.deleteMany({});
      }

      const insertedProps = await Property.insertMany(INITIAL_PROPERTIES);
      seededPropertiesCount = insertedProps.length;

      await Inquiry.insertMany(SEED_INQUIRIES);
    }

    const totalInquiries = await Inquiry.countDocuments();

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully on MongoDB Atlas!',
      data: {
        propertiesCount: seededPropertiesCount,
        inquiriesCount: totalInquiries,
        database: 'MongoDB Atlas',
      },
    });
  } catch (error: any) {
    console.error('Atlas Seed Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to seed MongoDB Atlas database',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
