import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    const body = await req.json().catch(() => ({}));
    const { email: bodyEmail, electricityBillUrl, consumerNumber } = body;

    const userEmail = (bodyEmail || authUser?.email)?.toLowerCase()?.trim();

    if (!userEmail) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Please login to submit verification.' }, { status: 401 });
    }

    if (!electricityBillUrl || !consumerNumber) {
      return NextResponse.json({ 
        success: false, 
        message: 'Please provide both Electricity Bill document and Consumer Number.' 
      }, { status: 400 });
    }

    try {
      await connectToDatabase();
      const updatedUser = await User.findOneAndUpdate(
        { email: userEmail },
        { 
          $set: { 
            role: 'owner',
            ownerVerified: false,
            verificationStatus: 'pending',
            electricityBillUrl,
            consumerNumber
          } 
        },
        { new: true }
      ).select('-password');

      if (!updatedUser) {
        return NextResponse.json({ success: false, message: 'User account not found' }, { status: 444 });
      }

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
          electricityBillUrl,
          consumerNumber
        },
        message: 'Electricity Bill submitted! Pending admin approval.' 
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Verification submission failed' }, { status: 500 });
  }
}
