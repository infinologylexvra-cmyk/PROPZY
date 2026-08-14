import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

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

    await connectToDatabase();
    const verifications = await User.find({
      verificationStatus: { $in: ['pending', 'approved', 'rejected'] }
    }).select('-password').sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: verifications, source: 'mongodb' });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: [], source: 'memory' });
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

    const { userId, email, action } = await req.json();

    if (!userId && !email) {
      return NextResponse.json({ success: false, message: 'User ID or Email is required' }, { status: 400 });
    }
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ success: false, message: 'Invalid verification action' }, { status: 400 });
    }

    const query = userId ? { _id: userId } : { email: email.toLowerCase().trim() };
    const isApprove = action === 'approve';

    const updateFields = {
      ownerVerified: isApprove,
      verificationStatus: isApprove ? 'approved' : 'rejected'
    };

    try {
      await connectToDatabase();
      // This is intentionally a conditional update. MongoDB evaluates the
      // pending-status condition atomically, so two admins cannot approve and
      // reject the same request from separate tabs/browsers.
      const updatedUser = await User.findOneAndUpdate(
        { ...query, verificationStatus: 'pending' },
        { $set: updateFields },
        { new: true }
      ).select('-password');

      if (!updatedUser) {
        const currentUser = await User.findOne(query).select('verificationStatus').lean();
        if (!currentUser) {
          return NextResponse.json({ success: false, message: 'Verification request not found.' }, { status: 404 });
        }
        return NextResponse.json({
          success: false,
          message: `This request was already ${currentUser.verificationStatus}. The queue has been refreshed.`
        }, { status: 409 });
      }

      return NextResponse.json({
        success: true,
        user: updatedUser,
        message: `Owner verification ${isApprove ? 'APPROVED' : 'REJECTED'} successfully!`
      });
    } catch (dbErr: any) {
      return NextResponse.json({
        success: false,
        message: 'Unable to update this verification right now. Please try again.'
      }, { status: 503 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Action failed' }, { status: 500 });
  }
}
