import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Property from '@/models/Property';

// GET /api/user/wishlist?email=user@example.com OR ?userId=123
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  const userId = searchParams.get('userId');

  if (!email && !userId) {
    return NextResponse.json({ success: false, message: 'Email or userId is required.' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const filter: any = {};
    if (email) filter.email = email.trim().toLowerCase();
    else if (userId) filter._id = userId;

    const user = await User.findOne(filter).select('wishlist email name');

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const currentWishlist: string[] = user.wishlist || [];

    if (currentWishlist.length === 0) {
      return NextResponse.json({ success: true, wishlist: [] });
    }

    // Verify which property PIDs / IDs currently exist in the database
    const existingProperties = await Property.find({
      $or: [
        { pid: { $in: currentWishlist } },
        { _id: { $in: currentWishlist.filter((id: string) => id.match(/^[0-9a-fA-F]{24}$/)) } }
      ]
    }).select('pid _id').lean();

    const validPids = new Set<string>();
    existingProperties.forEach((p: any) => {
      if (p.pid) validPids.add(p.pid);
      if (p._id) validPids.add(p._id.toString());
    });

    const sanitizedWishlist = currentWishlist.filter((id: string) => validPids.has(id));

    // If any deleted properties were removed, update user document in database
    if (sanitizedWishlist.length !== currentWishlist.length) {
      await User.updateOne(filter, { $set: { wishlist: sanitizedWishlist } });
    }

    return NextResponse.json({
      success: true,
      wishlist: sanitizedWishlist
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Error fetching wishlist' }, { status: 500 });
  }
}

// POST /api/user/wishlist
// Body: { email?: string, userId?: string, wishlist: string[] }
export async function POST(req: NextRequest) {
  try {
    const { email, userId, wishlist } = await req.json();

    if ((!email && !userId) || !Array.isArray(wishlist)) {
      return NextResponse.json({ success: false, message: 'Invalid payload. User email/id and wishlist array are required.' }, { status: 400 });
    }

    await connectToDatabase();
    const filter: any = {};
    if (email) filter.email = email.trim().toLowerCase();
    else if (userId) filter._id = userId;

    // Filter incoming wishlist to only keep property PIDs that exist in the database
    const existingProperties = await Property.find({
      $or: [
        { pid: { $in: wishlist } },
        { _id: { $in: wishlist.filter((id: string) => typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)) } }
      ]
    }).select('pid _id').lean();

    const validPids = new Set<string>();
    existingProperties.forEach((p: any) => {
      if (p.pid) validPids.add(p.pid);
      if (p._id) validPids.add(p._id.toString());
    });

    const sanitizedWishlist = wishlist.filter((id: string) => validPids.has(id));

    const updatedUser = await User.findOneAndUpdate(
      filter,
      { $set: { wishlist: sanitizedWishlist } },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: 'User not found in database.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Wishlist synced successfully to MongoDB Atlas',
      wishlist: updatedUser.wishlist || []
    });
  } catch (error: any) {
    console.error('Wishlist sync error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to sync wishlist' }, { status: 500 });
  }
}
