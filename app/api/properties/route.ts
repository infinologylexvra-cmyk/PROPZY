import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Property from '@/models/Property';
import User from '@/models/User';
import { INITIAL_PROPERTIES, PropertyItem } from '@/lib/seedData';
import { memoryStore } from '@/lib/memoryStore';
import { getAuthUser } from '@/lib/auth';
import { canViewPropertyContactDetails, isAdminUser, isBrowserDocumentNavigation, normalizeEmail, serializeProperty } from '@/lib/accessControl';

export async function GET(req: NextRequest) {
  if (isBrowserDocumentNavigation(req)) {
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  }

  const authUser = await getAuthUser(req);
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const city = searchParams.get('city');
  const locality = searchParams.get('locality');
  const maxPrice = searchParams.get('maxPrice');
  const type = searchParams.get('type');
  const pid = searchParams.get('pid');
  const bedrooms = searchParams.get('bedrooms');
  const search = searchParams.get('search');
  const verified = searchParams.get('verified');
  const admin = searchParams.get('admin');

  if (admin === 'true' && !isAdminUser(authUser)) {
    return NextResponse.json({ success: false, message: 'Forbidden. Admin privileges required.' }, { status: 403 });
  }

  try {
    await connectToDatabase();

    // Build MongoDB query
    const filter: any = {};

    if (category && category !== 'all') {
      if (category === 'buy' || category === 'sell') {
        filter.category = { $in: ['buy', 'sell'] };
      } else {
        filter.category = category;
      }
    }
    if (city && city !== 'all') filter.city = new RegExp(city, 'i');
    if (locality) filter.locality = new RegExp(locality, 'i');
    if (type && type !== 'all') filter.type = type;
    if (pid) filter.pid = pid.trim().toUpperCase();
    if (bedrooms && bedrooms !== 'all') filter.bedrooms = Number(bedrooms);
    if (maxPrice) filter.price = { $lte: Number(maxPrice) };
    
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { locality: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
        { address: new RegExp(search, 'i') },
        { pid: new RegExp(search, 'i') }
      ];
    }

    const properties = await Property.find(filter).sort({ createdAt: -1 }).lean();
    const normalizedAuthEmail = normalizeEmail(authUser?.email);
    const visibleProperties = properties.filter((property: any) => {
      if (admin === 'true' && isAdminUser(authUser)) {
        return true;
      }

      const isOwner = Boolean(normalizedAuthEmail && normalizeEmail(property.ownerEmail) === normalizedAuthEmail);

      if (!authUser) {
        return property.verified === true;
      }

      if (verified === 'all' || verified === 'false') {
        return property.verified === true || isOwner;
      }

      return property.verified === true || isOwner;
    });

    return NextResponse.json({
      success: true,
      data: visibleProperties.map((property: any) =>
        serializeProperty(property, canViewPropertyContactDetails(property, authUser))
      ),
      source: 'mongodb'
    });
  } catch (error) {
    // In-memory filtering fallback

    let filtered = [...memoryStore];

    if (category && category !== 'all') {
      if (category === 'buy' || category === 'sell') {
        filtered = filtered.filter(p => p.category === 'buy' || p.category === 'sell');
      } else {
        filtered = filtered.filter(p => p.category === category);
      }
    }
    if (city && city !== 'all') filtered = filtered.filter(p => p.city.toLowerCase() === city.toLowerCase());
    if (locality) filtered = filtered.filter(p => p.locality.toLowerCase().includes(locality.toLowerCase()));
    if (type && type !== 'all') filtered = filtered.filter(p => p.type === type);
    if (pid) filtered = filtered.filter(p => p.pid.toUpperCase() === pid.trim().toUpperCase());
    if (bedrooms && bedrooms !== 'all') filtered = filtered.filter(p => p.bedrooms === Number(bedrooms));
    if (maxPrice) filtered = filtered.filter(p => p.price <= Number(maxPrice));
    
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.locality.toLowerCase().includes(q) || 
        p.city.toLowerCase().includes(q) || 
        p.pid.toLowerCase().includes(q)
      );
    }

    const normalizedAuthEmail = normalizeEmail(authUser?.email);
    const visibleProperties = filtered.filter((property: any) => {
      if (admin === 'true' && isAdminUser(authUser)) {
        return true;
      }

      const isOwner = Boolean(normalizedAuthEmail && normalizeEmail(property.ownerEmail) === normalizedAuthEmail);

      if (!authUser) {
        return property.verified === true;
      }

      if (verified === 'all' || verified === 'false') {
        return property.verified === true || isOwner;
      }

      return property.verified === true || isOwner;
    });

    return NextResponse.json({
      success: true,
      data: visibleProperties.map((property: any) =>
        serializeProperty(property, canViewPropertyContactDetails(property, authUser))
      ),
      source: 'memory'
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const body = await req.json();

    const validCategories = ['rent', 'buy', 'sell', 'pg', 'commercial'];
    const validTypes = ['house', 'flat', 'pg', 'commercial', 'plot'];
    const validFurnishing = ['unfurnished', 'semi-furnished', 'fully-furnished'];

    if (authUser.role === 'tenant') {
      return NextResponse.json({ success: false, message: 'Forbidden. Property owners only.' }, { status: 403 });
    }

    await connectToDatabase();
    const existingUser = await User.findOne({ email: authUser.email.toLowerCase().trim() });

    if (authUser.role !== 'admin') {
      if (!existingUser || (!existingUser.ownerVerified && existingUser.verificationStatus !== 'approved')) {
        return NextResponse.json({
          success: false,
          message: 'Owner verification required! Please submit your Electricity Bill in your Profile for admin approval before posting properties.'
        }, { status: 403 });
      }
    }

    const pidGenerated = body.pid || `LR-${Math.floor(100 + Math.random() * 900)}`;
    const resolvedOwnerName = existingUser?.name || authUser.name || body.ownerName || 'Property Owner';
    const resolvedOwnerPhone = existingUser?.phone || body.ownerPhone || '+91 98765 43210';
    const resolvedOwnerEmail = authUser.email.toLowerCase().trim();

    const newProperty = {
      pid: pidGenerated,
      title: body.title || 'Untitled Property Listing',
      category: validCategories.includes(body.category) ? body.category : 'rent',
      type: validTypes.includes(body.type) ? body.type : 'flat',
      city: body.city || 'Mohali',
      locality: body.locality || 'Sector 70',
      address: body.address || `${body.locality || 'Sector 70'}, ${body.city || 'Mohali'}`,
      price: Number(body.price) || 10000,
      deposit: Number(body.deposit) || 0,
      bedrooms: Number(body.bedrooms) || 1,
      bathrooms: Number(body.bathrooms) || 1,
      areaSqFt: Number(body.areaSqFt) || 500,
      furnishing: validFurnishing.includes(body.furnishing) ? body.furnishing : 'semi-furnished',
      verified: body.verified !== undefined ? body.verified : false,
      featured: body.featured !== undefined ? body.featured : false,
      images: Array.isArray(body.images) && body.images.length > 0 ? body.images : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
      description: body.description || `Property listing in ${body.locality || 'Mohali'}.`,
      amenities: Array.isArray(body.amenities) ? body.amenities : ['Power Backup', 'Car Parking'],
      ownerName: resolvedOwnerName,
      ownerPhone: resolvedOwnerPhone,
      ownerEmail: resolvedOwnerEmail,
      ownerRole: (existingUser?.role === 'owner' ? 'owner' : 'agent') as 'owner' | 'agent',
      available: true,
      createdAt: new Date()
    };

    try {
      await connectToDatabase();
      const created = await Property.create(newProperty);
      return NextResponse.json({ 
        success: true, 
        data: created, 
        message: 'Property posted successfully to MongoDB Atlas!' 
      });
    } catch (dbErr: any) {
      console.warn('MongoDB POST fallback:', dbErr.message);
      const memObj: PropertyItem = {
        ...newProperty,
        id: `prop-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      memoryStore.unshift(memObj);
      return NextResponse.json({ 
        success: true, 
        data: memObj, 
        message: 'Property posted successfully!' 
      });
    }
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to create property' 
    }, { status: 400 });
  }
}
