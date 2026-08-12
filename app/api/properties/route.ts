import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Property from '@/models/Property';
import User from '@/models/User';
import { INITIAL_PROPERTIES, PropertyItem } from '@/lib/seedData';
import { memoryStore } from '@/lib/memoryStore';

export async function GET(req: NextRequest) {
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
    
    // Admin request sees all properties; public website only sees verified properties by default
    if (admin === 'true' || verified === 'all') {
      if (verified === 'false') filter.verified = false;
      if (verified === 'true') filter.verified = true;
    } else {
      if (verified === 'false') filter.verified = false;
      else filter.verified = true;
    }

    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { locality: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
        { address: new RegExp(search, 'i') },
        { pid: new RegExp(search, 'i') }
      ];
    }

    const properties = await Property.find(filter).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: properties, source: 'mongodb' });
  } catch (error) {
    console.warn('Falling back to memory store:', error);
    
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
    
    if (admin === 'true' || verified === 'all') {
      if (verified === 'false') filtered = filtered.filter(p => !p.verified);
      if (verified === 'true') filtered = filtered.filter(p => p.verified);
    } else {
      if (verified === 'false') filtered = filtered.filter(p => !p.verified);
      else filtered = filtered.filter(p => p.verified);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.locality.toLowerCase().includes(q) || 
        p.city.toLowerCase().includes(q) || 
        p.pid.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, data: filtered, source: 'memory' });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validCategories = ['rent', 'buy', 'sell', 'pg', 'commercial'];
    const validTypes = ['house', 'flat', 'pg', 'commercial', 'plot'];
    const validFurnishing = ['unfurnished', 'semi-furnished', 'fully-furnished'];

    // Strict Owner Verification Check
    if (body.ownerEmail) {
      try {
        await connectToDatabase();
        const existingUser = await User.findOne({ email: body.ownerEmail.toLowerCase().trim() });
        if (existingUser && (!existingUser.ownerVerified && existingUser.verificationStatus !== 'approved')) {
          return NextResponse.json({
            success: false,
            message: 'Owner verification required! Please submit your Electricity Bill in your Profile for admin approval before posting properties.'
          }, { status: 403 });
        }
      } catch (e) {}
    }

    const pidGenerated = body.pid || `LR-${Math.floor(100 + Math.random() * 900)}`;

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
      ownerName: body.ownerName || 'Property Owner',
      ownerPhone: body.ownerPhone || '+91 98765 43210',
      ownerEmail: body.ownerEmail ? body.ownerEmail.toLowerCase().trim() : '',
      ownerRole: body.ownerRole || 'owner',
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
