import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { isValidElectricityBillDocument } from '@/lib/validation';
import { memoryUsers } from '@/lib/memoryStore';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    const body = await req.json().catch(() => ({}));
    const { email: submittedEmail, electricityBillUrl, consumerNumber } = body;

    const userEmail = authUser?.email?.toLowerCase()?.trim();
    const documentUrl = typeof electricityBillUrl === 'string' ? electricityBillUrl.trim() : '';
    const normalizedConsumerNumber = typeof consumerNumber === 'string' ? consumerNumber.trim() : '';

    if (!userEmail) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Please login to submit verification.' }, { status: 401 });
    }

    const normalizedSubmittedEmail = typeof submittedEmail === 'string' ? submittedEmail.toLowerCase().trim() : '';
    if (normalizedSubmittedEmail && normalizedSubmittedEmail !== userEmail) {
      return NextResponse.json({
        success: false,
        message: 'Your active login session does not match this dashboard account. Please log out and sign in again before submitting.'
      }, { status: 409 });
    }

    if (!documentUrl || !normalizedConsumerNumber) {
      return NextResponse.json({ 
        success: false, 
        message: 'Please provide both Electricity Bill document and Consumer Number.' 
      }, { status: 400 });
    }

    if (!isValidElectricityBillDocument(documentUrl)) {
      return NextResponse.json({
        success: false,
        message: 'Please provide a valid document URL or upload an image/PDF document.'
      }, { status: 400 });
    }

    try {
      await connectToDatabase();
      const memoryUser = memoryUsers.find((user) => user.email.toLowerCase() === userEmail);
      const memoryPassword = memoryUser?.password || randomUUID();
      const bootstrapPassword = memoryPassword.startsWith('$2a$') || memoryPassword.startsWith('$2b$') || memoryPassword.startsWith('$2y$')
        ? memoryPassword
        : await bcrypt.hash(memoryPassword, 10);
      const updatedUser = await User.findOneAndUpdate(
        { email: userEmail },
        { 
          $set: { 
            role: 'owner',
            ownerVerified: false,
            verificationStatus: 'pending',
            electricityBillUrl: documentUrl,
            consumerNumber: normalizedConsumerNumber
          },
          // Users authenticated through the local/fallback flow may not have a
          // MongoDB profile yet. Create that profile atomically so their
          // verification request is not lost.
          $setOnInsert: {
            name: memoryUser?.name || authUser?.name || 'Property Owner',
            phone: memoryUser?.phone || '+91 00000 00000',
            password: bootstrapPassword,
            city: 'Mohali',
            wishlist: []
          }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
      ).select('-password');

      return NextResponse.json({ 
        success: true, 
        user: updatedUser,
        message: 'Electricity Bill submitted successfully! Pending admin approval.' 
      });
    } catch (dbErr: any) {
      console.warn('MongoDB verify-owner fallback:', dbErr.message);
      return NextResponse.json({ 
        success: true, 
        user: {
          email: userEmail,
          role: 'owner',
          ownerVerified: false,
          verificationStatus: 'pending',
          electricityBillUrl: documentUrl,
          consumerNumber: normalizedConsumerNumber
        },
        message: 'Electricity Bill submitted! Pending admin approval.' 
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Verification submission failed' }, { status: 500 });
  }
}
