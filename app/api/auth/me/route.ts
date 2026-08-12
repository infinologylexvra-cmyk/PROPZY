import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
    }

    try {
      await connectToDatabase();
      const dbUser: any = await User.findById(authUser.id).select('-password').lean();
      if (dbUser) {
        return NextResponse.json({
          success: true,
          user: {
            id: dbUser._id.toString(),
            name: dbUser.name,
            email: dbUser.email,
            phone: dbUser.phone,
            role: dbUser.role,
            city: dbUser.city || 'Mohali',
            wishlist: dbUser.wishlist || [],
            ownerVerified: dbUser.ownerVerified || false,
            verificationStatus: dbUser.verificationStatus || 'none',
            electricityBillUrl: dbUser.electricityBillUrl || '',
            consumerNumber: dbUser.consumerNumber || ''
          }
        });
      }
    } catch (dbErr) {
      // Fallback to token payload if DB is temporarily unreachable
    }

    return NextResponse.json({
      success: true,
      user: authUser
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
