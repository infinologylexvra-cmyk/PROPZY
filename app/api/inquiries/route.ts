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
      if (dbInquiries && dbInquiries.length > 0) {
        return NextResponse.json({ success: true, data: dbInquiries });
      }
      return NextResponse.json({ success: true, data: memoryInquiries });
    }

    const dbUser: any = await User.findOne({ email: normalizeEmail(authUser.email) }).lean();
    const currentEmail = normalizeEmail(dbUser?.email || authUser.email);
    const currentPhone = (dbUser?.phone || '').replace(/\D/g, '');
    const currentName = (dbUser?.name || authUser.name || '').toLowerCase().trim();

    const allInquiries = dbInquiries.length > 0 ? dbInquiries : memoryInquiries;
    const visible = allInquiries.filter((inq: any) => {
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
    console.warn('DB read fallback for inquiries:', err);
    if (isAdminUser(authUser)) {
      return NextResponse.json({ success: true, data: memoryInquiries });
    }

    const currentEmail = normalizeEmail(authUser.email);
    const currentName = (authUser.name || '').toLowerCase().trim();

    const visible = memoryInquiries.filter((inq: any) => {
      const inquiryEmail = normalizeEmail(inq.tenantEmail);
      const inquiryName = (inq.tenantName || '').toLowerCase().trim();
      return Boolean(
        (currentEmail && inquiryEmail && inquiryEmail === currentEmail) ||
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
        message: 'Your inquiry has been submitted successfully!' 
      });
    } catch (dbErr) {
      return NextResponse.json({ 
        success: true, 
        data: memInquiry, 
        message: 'Your inquiry has been submitted successfully!' 
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to submit request' }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser || !isAdminUser(authUser)) {
    return NextResponse.json({ success: false, message: 'Admin authorization required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, message: 'Missing id or status' }, { status: 400 });
    }

    // Update in memory array
    memoryInquiries = memoryInquiries.map(inq => 
      (inq._id?.toString() === id || inq.id === id) ? { ...inq, status } : inq
    );

    try {
      await connectToDatabase();
      let updated = null;
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        updated = await Inquiry.findByIdAndUpdate(id, { status }, { new: true });
      }
      if (!updated) {
        updated = await Inquiry.findOneAndUpdate(
          { $or: [{ _id: id }, { propertyId: id }, { propertyPid: id }] },
          { status },
          { new: true }
        );
      }
      return NextResponse.json({ success: true, data: updated || { id, status } });
    } catch (dbErr) {
      return NextResponse.json({ success: true, data: { id, status } });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Failed to update inquiry status' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser || !isAdminUser(authUser)) {
    return NextResponse.json({ success: false, message: 'Admin authorization required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing inquiry id' }, { status: 400 });
    }

    memoryInquiries = memoryInquiries.filter(inq => inq._id?.toString() !== id && inq.id !== id);

    try {
      await connectToDatabase();
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        await Inquiry.findByIdAndDelete(id);
      } else {
        await Inquiry.findOneAndDelete({ $or: [{ _id: id }, { propertyId: id }] });
      }
      return NextResponse.json({ success: true, message: 'Inquiry deleted successfully' });
    } catch (dbErr) {
      return NextResponse.json({ success: true, message: 'Inquiry deleted from memory' });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Failed to delete inquiry' }, { status: 500 });
  }
}
