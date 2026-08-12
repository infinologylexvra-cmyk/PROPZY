import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Inquiry from '@/models/Inquiry';
import { INITIAL_INQUIRIES } from '@/lib/seedData';

let memoryInquiries: any[] = [...INITIAL_INQUIRIES];

export async function GET() {
  try {
    await connectToDatabase();
    const dbInquiries = await Inquiry.find().sort({ createdAt: -1 });
    const combined = [...dbInquiries, ...memoryInquiries.filter(m => !dbInquiries.some((d: any) => d._id?.toString() === m._id))];
    return NextResponse.json({ success: true, data: combined });
  } catch (err) {
    return NextResponse.json({ success: true, data: memoryInquiries });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const newInquiry = {
      propertyId: body.propertyId || `relax-${Date.now()}`,
      propertyTitle: body.propertyTitle || 'Property Inquiry',
      propertyPid: body.propertyPid || 'RELAX-PLAN',
      tenantName: body.tenantName,
      tenantPhone: body.tenantPhone,
      tenantMessage: body.tenantMessage || '',
      status: body.status || 'New',
      createdAt: new Date()
    };

    const memInquiry = { ...newInquiry, _id: `inq-${Date.now()}`, id: `inq-${Date.now()}` };
    memoryInquiries.unshift(memInquiry);

    try {
      await connectToDatabase();
      const created = await Inquiry.create(newInquiry);
      return NextResponse.json({ 
        success: true, 
        data: created, 
        message: 'Your Relax Plan request has been submitted successfully! Our Relationship Manager (RM) will contact you shortly.' 
      });
    } catch (dbErr) {
      return NextResponse.json({ 
        success: true, 
        data: memInquiry, 
        message: 'Your Relax Plan request has been submitted successfully! Our Relationship Manager (RM) will contact you shortly.' 
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to submit request' }, { status: 400 });
  }
}
