import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Inquiry from '@/models/Inquiry';

let memoryInquiries: any[] = [];

export async function GET() {
  try {
    await connectToDatabase();
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: inquiries });
  } catch (err) {
    return NextResponse.json({ success: true, data: memoryInquiries });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const newInquiry = {
      propertyId: body.propertyId,
      propertyTitle: body.propertyTitle,
      propertyPid: body.propertyPid,
      tenantName: body.tenantName,
      tenantPhone: body.tenantPhone,
      tenantMessage: body.tenantMessage || '',
      status: 'pending',
      createdAt: new Date()
    };

    try {
      await connectToDatabase();
      const created = await Inquiry.create(newInquiry);
      return NextResponse.json({ success: true, data: created, message: 'Inquiry submitted successfully!' });
    } catch (dbErr) {
      const memInquiry = { ...newInquiry, _id: `inq-${Date.now()}` };
      memoryInquiries.unshift(memInquiry);
      return NextResponse.json({ success: true, data: memInquiry, message: 'Inquiry submitted successfully!' });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to submit inquiry' }, { status: 400 });
  }
}
