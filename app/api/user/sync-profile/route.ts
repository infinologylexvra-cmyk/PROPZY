import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    try {
      await connectToDatabase();
      const dbUser: any = await User.findOne({ email: email.toLowerCase().trim() }).select('-password').lean();

      if (dbUser) {
        const currentWishlist: string[] = dbUser.wishlist || [];
        let sanitizedWishlist = currentWishlist;

        if (currentWishlist.length > 0) {
          const Property = (await import('@/models/Property')).default;
          const existingProps = await Property.find({
            $or: [
              { pid: { $in: currentWishlist } },
              { _id: { $in: currentWishlist.filter((id: string) => id.match(/^[0-9a-fA-F]{24}$/)) } }
            ]
          }).select('pid _id').lean();

          const validPids = new Set<string>();
          existingProps.forEach((p: any) => {
            if (p.pid) validPids.add(p.pid);
            if (p._id) validPids.add(p._id.toString());
          });

          sanitizedWishlist = currentWishlist.filter((id: string) => validPids.has(id));

          if (sanitizedWishlist.length !== currentWishlist.length) {
            await User.updateOne({ _id: dbUser._id }, { $set: { wishlist: sanitizedWishlist } });
          }
        }

        const userProfile = {
          id: dbUser._id?.toString(),
          name: dbUser.name,
          email: dbUser.email,
          phone: dbUser.phone,
          role: dbUser.role,
          city: dbUser.city || 'Mohali',
          wishlist: sanitizedWishlist,
          ownerVerified: dbUser.ownerVerified || false,
          verificationStatus: dbUser.verificationStatus || 'none',
          electricityBillUrl: dbUser.electricityBillUrl || '',
          consumerNumber: dbUser.consumerNumber || ''
        };

        return NextResponse.json({ success: true, user: userProfile });
      }
    } catch (dbErr: any) {
      console.warn('Sync profile MongoDB warning:', dbErr.message);
    }

    return NextResponse.json({ success: false, message: 'User not found in DB' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
