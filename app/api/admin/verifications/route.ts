import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase, invalidateMongoConnection } from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { memoryUsers } from '@/lib/memoryStore';

// GET: Admin fetches pending/all owner verification requests
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Please login.' }, { status: 401 });
    }
    if (authUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    try {
      await connectToDatabase();
      const verifications = await User.find({
        verificationStatus: { $in: ['pending', 'approved', 'rejected'] }
      }).select('-password').sort({ createdAt: -1 }).lean();

      return NextResponse.json({ success: true, data: verifications, source: 'mongodb' });
    } catch (dbErr) {
      console.warn('MongoDB GET verifications error, falling back to memory:', dbErr);
      const memVerifs = memoryUsers.filter(u => u.verificationStatus && ['pending', 'approved', 'rejected'].includes(u.verificationStatus));
      return NextResponse.json({ success: true, data: memVerifs, source: 'memory' });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch verifications' }, { status: 500 });
  }
}

// POST: Admin approves or rejects owner verification
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Please login.' }, { status: 401 });
    }
    if (authUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { userId, email, action } = body;

    if (!userId && !email) {
      return NextResponse.json({ success: false, message: 'User ID or Email is required' }, { status: 400 });
    }
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ success: false, message: 'Invalid verification action' }, { status: 400 });
    }

    const cleanEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';
    const isValidId = userId && mongoose.Types.ObjectId.isValid(userId);

    // Build flexible query matching by valid ObjectId and/or email
    let query: any = {};
    if (isValidId && cleanEmail) {
      query = { $or: [{ _id: new mongoose.Types.ObjectId(userId) }, { email: cleanEmail }] };
    } else if (isValidId) {
      query = { _id: new mongoose.Types.ObjectId(userId) };
    } else if (cleanEmail) {
      query = { email: cleanEmail };
    } else {
      query = { email: cleanEmail || userId };
    }

    const isApprove = action === 'approve';
    const updateFields = {
      ownerVerified: isApprove,
      verificationStatus: isApprove ? 'approved' : 'rejected'
    };

    // Update in memoryStore if present
    const memoryUser = memoryUsers.find(u => 
      (cleanEmail && u.email.toLowerCase() === cleanEmail) || 
      (userId && (u.id === userId || (u as any)._id === userId))
    );
    if (memoryUser) {
      memoryUser.ownerVerified = isApprove;
      memoryUser.verificationStatus = isApprove ? 'approved' : 'rejected';
    }

    let updatedUser: any = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await connectToDatabase(attempt === 2);
        updatedUser = await User.findOneAndUpdate(
          query,
          { $set: updateFields },
          { new: true }
        ).select('-password').lean();

        if (updatedUser) break;
      } catch (dbErr: any) {
        console.warn(`MongoDB verification update attempt ${attempt} failed:`, dbErr?.message);
        if (attempt === 1) {
          invalidateMongoConnection();
          continue;
        }
      }
    }

    if (!updatedUser && !memoryUser) {
      return NextResponse.json({ success: false, message: 'Verification request not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: updatedUser || memoryUser,
      message: `Owner verification ${isApprove ? 'APPROVED' : 'REJECTED'} successfully!`
    });
  } catch (error: any) {
    console.error('Error in verification action:', error);
    return NextResponse.json({ success: false, message: error.message || 'Action failed' }, { status: 500 });
  }
}
