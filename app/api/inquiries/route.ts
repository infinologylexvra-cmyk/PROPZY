import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Inquiry from '@/models/Inquiry';
import User from '@/models/User';
import { INITIAL_INQUIRIES } from '@/lib/seedData';
import { getAuthUser } from '@/lib/auth';
import { normalizeEmail, isAdminUser } from '@/lib/accessControl';

let memoryInquiries: any[] = [...INITIAL_INQUIRIES];

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);

  if (!authUser) {
    return NextResponse.json({ success: false, message: 'Unauthorized. Please login.' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const dbInquiries = await Inquiry.find().sort({ createdAt: -1 }).lean();

    if (isAdminUser(authUser)) {
      const combined = [...dbInquiries, ...memoryInquiries.filter(m => !dbInquiries.some((d: any) => d._id?.toString() === m._id))];
      return NextResponse.json({ success: true, data: combined });
    }

    const dbUser: any = await User.findOne({ email: normalizeEmail(authUser.email) }).lean();
    const currentEmail = normalizeEmail(dbUser?.email || authUser.email);
    const currentPhone = (dbUser?.phone || '').replace(/\D/g, '');
    const currentName = (dbUser?.name || authUser.name || '').toLowerCase().trim();

    const combined = [...dbInquiries, ...memoryInquiries.filter(m => !dbInquiries.some((d: any) => d._id?.toString() === m._id))];
    const visible = combined.filter((inq: any) => {
      const inquiryEmail = normalizeEmail(inq.tenantEmail);
      const inquiryPhone = (inq.tenantPhone || '').replace(/\D/g, '');
      const inquiryName = (inq.tenantName || '').toLowerCase().trim();

      return Boolean(
        (currentEmail && inquiryEmail && inquiryEmail === currentEmail) ||
        (currentPhone && inquiryPhone && inquiryPhone === currentPhone) ||
        (currentName && inquiryName && inquiryName === currentName)
      );
    });

    return NextResponse.json({ success: true, data: visible });
  } catch (err) {
    if (isAdminUser(authUser)) {
      return NextResponse.json({ success: true, data: memoryInquiries });
    }

    const dbUser: any = await User.findOne({ email: normalizeEmail(authUser.email) }).lean().catch(() => null);
    const currentEmail = normalizeEmail(dbUser?.email || authUser.email);
    const currentPhone = (dbUser?.phone || '').replace(/\D/g, '');
    const currentName = (dbUser?.name || authUser.name || '').toLowerCase().trim();

    const visible = memoryInquiries.filter((inq: any) => {
      const inquiryEmail = normalizeEmail(inq.tenantEmail);
      const inquiryPhone = (inq.tenantPhone || '').replace(/\D/g, '');
      const inquiryName = (inq.tenantName || '').toLowerCase().trim();

      return Boolean(
        (currentEmail && inquiryEmail && inquiryEmail === currentEmail) ||
        (currentPhone && inquiryPhone && inquiryPhone === currentPhone) ||
        (currentName && inquiryName && inquiryName === currentName)
      );
    });

    return NextResponse.json({ success: true, data: visible });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    const body = await req.json();

    const newInquiry = {
      propertyId: body.propertyId || `relax-${Date.now()}`,
      propertyTitle: body.propertyTitle || 'Property Inquiry',
      propertyPid: body.propertyPid || 'RELAX-PLAN',
      tenantName: body.tenantName,
      tenantPhone: body.tenantPhone,
      tenantEmail: body.tenantEmail || normalizeEmail(authUser?.email),
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
