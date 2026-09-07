import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Property from '@/models/Property';
import User from '@/models/User';
import { PropertyItem } from '@/lib/seedData';
import { getAuthUser } from '@/lib/auth';
import { canViewPropertyContactDetails, isAdminUser, isBrowserDocumentNavigation, normalizeEmail, serializeProperty } from '@/lib/accessControl';
import { 
  getPropertiesCache, 
  getStalePropertiesCache,
  setPropertiesCache, 
  clearPropertiesCache, 
  getInFlight, 
  setInFlight, 
  deleteInFlight, 
  buildPropertyCacheKey 
} from '@/lib/propertiesCache';
import { uploadBase64ImagesToCloudinary } from '@/lib/cloudinary';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const tStart = performance.now();

  try {
    if (process.env.NODE_ENV === 'production' && isBrowserDocumentNavigation(req)) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    // 1. Authentication
    const tAuthStart = performance.now();
    const authUser = await getAuthUser(req);
    const durAuth = (performance.now() - tAuthStart).toFixed(2);

    // 2. Build Deterministic Cache Key (with strict role/user isolation)
    const searchParams = req.nextUrl.searchParams;
    const cacheKey = buildPropertyCacheKey(searchParams, authUser);

    // Filter summaries for diagnostic logs
    const filterSummary = Array.from(searchParams.entries())
      .filter(([k]) => k !== 'admin')
      .map(([k, v]) => `${k}=${v}`)
      .join(', ') || 'none';

    // 3. Fast Cache Lookup (Bypassed for Admin queries to ensure real-time moderation status)
    const isAdminQuery = searchParams.get('admin') === 'true';
    if (!isAdminQuery) {
      const tCacheStart = performance.now();
      const cached = await getPropertiesCache(cacheKey);
      if (cached) {
        const durCache = (performance.now() - tCacheStart).toFixed(2);
        const tTotal = (performance.now() - tStart).toFixed(2);
        const returnedCount = cached.payload?.data?.length || 0;
        const cacheTag = cached.source === 'redis' ? 'REDIS-HIT' : 'MEMORY-HIT';

        if (process.env.NODE_ENV !== 'production') {
          console.log(`\n[API Properties]\n  Cache: ${cacheTag}\n  DB Query: skipped\n  Filters: ${filterSummary}\n  Returned: ${returnedCount} properties\n  Total: ${tTotal}ms\n`);
        }

        return NextResponse.json(cached.payload, {
          headers: {
            'Cache-Control': 'public, s-maxage=45, stale-while-revalidate=60',
            'X-Cache-Status': cacheTag,
            'Server-Timing': `auth;dur=${durAuth}, cache;dur=${durCache}, total;dur=${tTotal}`
          }
        });
      }
    }

    // 4. In-Flight Request Deduplication (reuse concurrent query promise)
    const existingInFlight = getInFlight(cacheKey);
    if (existingInFlight) {
      try {
        const result = await existingInFlight;
        const tTotal = (performance.now() - tStart).toFixed(2);
        return NextResponse.json(result.payload, {
          headers: {
            'Cache-Control': 'public, s-maxage=45, stale-while-revalidate=60',
            'X-Cache-Status': 'DEDUP',
            'Server-Timing': `auth;dur=${durAuth}, dedup;dur=${tTotal}, total;dur=${tTotal}`
          }
        });
      } catch {
        // If the in-flight request errored, proceed to execute independently
      }
    }

    // Query Parameters
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
    const isAdminView = admin === 'true' || isAdminUser(authUser);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const rawLimit = searchParams.get('limit');
    const limit = rawLimit
      ? Math.min(1000, Math.max(1, Number(rawLimit)))
      : (isAdminView ? 1000 : 100);
    const includeTotal = searchParams.get('includeTotal') === 'true';

    // 5. Execute DB Query with Promise In-Flight Registration
    const executeQuery = async () => {
      const tConnStart = performance.now();
      const conn = await connectToDatabase();
      const durConn = (performance.now() - tConnStart).toFixed(2);
      const PropertyModel = conn.models.Property || Property;

      // Build MongoDB filter
      const filter: any = {};

      if (category && category !== 'all') {
        if (typeof category === 'string' && category.includes(',')) {
          const catList = category.split(',').map(c => c.trim()).filter(Boolean);
          filter.category = { $in: catList };
        } else if (category === 'buy' || category === 'sell') {
          filter.category = { $in: ['buy', 'sell'] };
        } else if (category === 'pg') {
          // When filtering by PG / Hostel, include all PG properties as well as 1 BHK rental properties
          if (!bedrooms || bedrooms === 'all') {
            filter.$or = [
              { category: 'pg' },
              { type: 'pg' },
              { bedrooms: 1, category: { $in: ['rent', 'pg'] } }
            ];
          } else {
            filter.category = 'pg';
          }
        } else {
          filter.category = category;
        }
      }
      if (city && city !== 'all') filter.city = new RegExp(city, 'i');
      if (locality) filter.locality = new RegExp(locality, 'i');
      if (type && type !== 'all') filter.type = type;
      if (pid) filter.pid = pid.trim().toUpperCase();
      if (bedrooms && bedrooms !== 'all') {
        if (typeof bedrooms === 'string' && bedrooms.includes(',')) {
          const bhkList = bedrooms.split(',').map(b => Number(b.trim())).filter(n => !isNaN(n));
          if (bhkList.length > 0) {
            filter.bedrooms = { $in: bhkList };
          }
        } else {
          filter.bedrooms = Number(bedrooms);
        }
      }
      if (maxPrice) filter.price = { $lte: Number(maxPrice) };

      if (search) {
        const searchOr = [
          { title: new RegExp(search, 'i') },
          { locality: new RegExp(search, 'i') },
          { city: new RegExp(search, 'i') },
          { address: new RegExp(search, 'i') },
          { pid: new RegExp(search, 'i') }
        ];
        if (filter.$or) {
          filter.$and = filter.$and || [];
          filter.$and.push({ $or: filter.$or }, { $or: searchOr });
          delete filter.$or;
        } else if (filter.$and) {
          filter.$and.push({ $or: searchOr });
        } else {
          filter.$or = searchOr;
        }
      }

      // Verified status filtering & visibility access control
      if (isAdminView) {
        // Admin Portal: sees ALL listings (verified & pending review) by default unless explicitly filtering
        if (verified === 'true') {
          filter.verified = true;
        } else if (verified === 'false') {
          filter.verified = false;
        }
        // If verified is not passed or verified === 'all', no filter.verified is applied -> Admin sees all!
      } else if (verified === 'all') {
        // Used by Dashboard "My Properties" tab for logged-in owners
        if (authUser?.email) {
          const userVisibilityOr = [
            { verified: true },
            { ownerEmail: authUser.email.toLowerCase().trim() }
          ];

          if (filter.$or) {
            filter.$and = filter.$and || [];
            filter.$and.push({ $or: filter.$or }, { $or: userVisibilityOr });
            delete filter.$or;
          } else if (filter.$and) {
            filter.$and.push({ $or: userVisibilityOr });
          } else {
            filter.$or = userVisibilityOr;
          }
        } else {
          // Unauthenticated users never see unverified listings
          filter.verified = true;
        }
      } else if (verified === 'false') {
        // Explicitly requested unverified listings only (e.g. Owner pending tab)
        if (authUser?.email) {
          filter.verified = false;
          filter.ownerEmail = authUser.email.toLowerCase().trim();
        } else {
          // Guests cannot view unverified listings
          filter.verified = false;
          filter._id = null; // Yields 0 results
        }
      } else {
        // Standard public browsing (/properties, homepage, search, or verified='true'):
        // STRICTLY VERIFIED PROPERTIES ONLY
        filter.verified = true;
      }

      const skip = (page - 1) * limit;
      const fetchLimit = includeTotal ? limit : limit + 1;

      // 2. Projected lightweight listing fields
      const projection = 'pid title category type city locality address price deposit bedrooms bathrooms areaSqFt furnishing verified featured images ownerEmail ownerRole available createdAt';

      const tQueryStart = performance.now();
      console.log('[API Properties] Filter:', JSON.stringify(filter), 'Limit:', fetchLimit);
      console.log('[API Properties] Querying MongoDB...');
      
      let properties: any[] = [];
      let totalCount: number | undefined;

      if (includeTotal) {
        const [fetchedProps, count] = await Promise.all([
          PropertyModel.find(filter).select(projection).sort({ createdAt: -1 }).skip(skip).limit(fetchLimit).lean().exec(),
          PropertyModel.countDocuments(filter).exec()
        ]);
        properties = fetchedProps;
        totalCount = count;
      } else {
        properties = await PropertyModel.find(filter).select(projection).sort({ createdAt: -1 }).skip(skip).limit(fetchLimit).lean().exec();
      }

      console.log('[API Properties] MongoDB returned:', properties.length, 'properties in', (performance.now() - tQueryStart).toFixed(2), 'ms');

      const durQuery = (performance.now() - tQueryStart).toFixed(2);

      let hasMore = false;
      if (!includeTotal) {
        hasMore = properties.length > limit;
        if (hasMore) {
          properties = properties.slice(0, limit);
        }
      } else if (totalCount !== undefined) {
        hasMore = page * limit < totalCount;
      }

      // 6. Access Control & Owner Contact Masking
      const tAccessStart = performance.now();
      const sanitizedProperties = properties.map((property: any) =>
        serializeProperty(property, canViewPropertyContactDetails(property, authUser))
      );
      const durAccess = (performance.now() - tAccessStart).toFixed(2);

      const payload = {
        success: true,
        data: sanitizedProperties,
        pagination: {
          page,
          limit,
          hasMore,
          ...(totalCount !== undefined ? { total: totalCount, totalPages: Math.ceil(totalCount / limit) } : {})
        },
        source: 'mongodb'
      };

      // Cache sanitized response in server cache for public visitors
      if (!isAdminQuery) {
        await setPropertiesCache(cacheKey, payload);
      }

      return {
        payload,
        timings: { durConn, durQuery, durAccess }
      };
    };

    // Register in-flight promise
    const queryPromise = executeQuery();
    setInFlight(cacheKey, queryPromise);

    try {
      const { payload, timings } = await queryPromise;
      const tTotal = (performance.now() - tStart).toFixed(2);
      const returnedCount = payload?.data?.length || 0;

      if (process.env.NODE_ENV !== 'production') {
        console.log(`\n[API Properties]\n  Cache: MISS\n  DB Connection: ${timings.durConn}ms\n  DB Query: ${timings.durQuery}ms\n  Filters: ${filterSummary}\n  Returned: ${returnedCount} properties\n  Total: ${tTotal}ms\n`);
      }

      return NextResponse.json(payload, {
        headers: {
          'Cache-Control': isAdminQuery ? 'no-store, no-cache, must-revalidate, max-age=0' : 'public, s-maxage=45, stale-while-revalidate=60',
          'X-Cache-Status': isAdminQuery ? 'ADMIN-BYPASS' : 'MISS',
          'Server-Timing': `auth;dur=${durAuth}, db_conn;dur=${timings.durConn}, db_query;dur=${timings.durQuery}, access;dur=${timings.durAccess}, total;dur=${tTotal}`
        }
      });
    } catch (error: any) {
      console.error('[API Properties Error]:', error.message);

      // 1. If a stale cache entry exists, return it with a stale indicator
      const staleCache = await getStalePropertiesCache(cacheKey);
      if (staleCache) {
        return NextResponse.json({
          ...staleCache.payload,
          source: 'cache-stale',
          warning: 'Serving stale cache due to database unavailability'
        }, {
          headers: { 'X-Cache-Status': 'STALE' }
        });
      }

      // Return empty database result for public visitors on error
      if (!isAdminQuery) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            hasMore: false,
            total: 0,
            totalPages: 0
          }
        });
      }

      // 3. For admin queries, fail with 503 so admins know moderation state is unavailable
      return NextResponse.json({
        success: false,
        message: 'Database temporarily unavailable. Please try again.',
        error: error.message
      }, { status: 503 });
    } finally {
      // Guaranteed in-flight promise cleanup
      deleteInFlight(cacheKey);
    }
  } catch (fatalError: any) {
    console.error('[FATAL GET ERROR]:', fatalError);
    return NextResponse.json({
      success: false,
      message: fatalError.message || 'Internal error',
      stack: fatalError.stack
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let authUser = await getAuthUser(req);
    const body = await req.json().catch(() => ({}));

    // Fallback: If session cookie was not attached by browser, verify user identity via MongoDB Atlas
    if (!authUser && body?.ownerEmail) {
      try {
        await connectToDatabase();
        const fallbackDbUser = await User.findOne({ email: String(body.ownerEmail).toLowerCase().trim() }).lean();
        if (fallbackDbUser) {
          authUser = {
            id: (fallbackDbUser as any)._id.toString(),
            name: (fallbackDbUser as any).name,
            email: (fallbackDbUser as any).email,
            role: (fallbackDbUser as any).role || 'owner'
          };
        }
      } catch (dbAuthErr) {
        console.warn('[POST properties] DB user auth fallback warning:', dbAuthErr);
      }
    }

    if (!authUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const validCategories = ['rent', 'buy', 'sell', 'pg', 'commercial'];
    const validTypes = ['house', 'flat', 'pg', 'commercial', 'plot'];
    const validFurnishing = ['unfurnished', 'semi-furnished', 'fully-furnished'];

    if (authUser.role === 'tenant') {
      return NextResponse.json({ success: false, message: 'Forbidden. Property owners only.' }, { status: 403 });
    }

    const cleanAuthEmail = authUser.email.toLowerCase().trim();
    let existingUser: any = null;

    try {
      await connectToDatabase();
      existingUser = await User.findOne({ email: cleanAuthEmail }).lean();
    } catch (userErr: any) {
      console.warn('MongoDB user lookup warning in POST properties:', userErr?.message);
    }

    if (authUser.role !== 'admin') {
      const isApprovedOwner = 
        authUser.role === 'owner' || 
        existingUser?.role === 'owner' || 
        existingUser?.ownerVerified === true || 
        existingUser?.verificationStatus === 'approved';

      if (!isApprovedOwner) {
        return NextResponse.json({
          success: false,
          message: 'Owner verification required! Please submit your Electricity Bill in your Profile for admin approval before posting properties.'
        }, { status: 403 });
      }
    }

    const cleanedImages = Array.isArray(body.images) 
      ? body.images.filter((img: string) => typeof img === 'string' && img.trim().length > 0)
      : [];

    if (cleanedImages.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'At least one property photo is required. Please upload photos before posting.'
      }, { status: 400 });
    }

    // Generate guaranteed unique PID to prevent MongoDB unique index collisions
    const pidGenerated = body.pid || `PZ-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
    const resolvedOwnerName = existingUser?.name || authUser.name || body.ownerName || 'Property Owner';
    const resolvedOwnerPhone = existingUser?.phone || body.ownerPhone || '+91 98765 43210';
    const resolvedOwnerEmail = cleanAuthEmail;

    const uploadedImages = await uploadBase64ImagesToCloudinary(cleanedImages);

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
      bedrooms: body.bedrooms !== undefined && !isNaN(Number(body.bedrooms)) ? Number(body.bedrooms) : (body.category === 'commercial' || body.type === 'commercial' ? 0 : 1),
      bathrooms: body.bathrooms !== undefined && !isNaN(Number(body.bathrooms)) ? Number(body.bathrooms) : 1,
      areaSqFt: Number(body.areaSqFt) || 500,
      furnishing: validFurnishing.includes(body.furnishing) ? body.furnishing : 'semi-furnished',
      verified: body.verified !== undefined ? body.verified : false,
      featured: body.featured !== undefined ? body.featured : false,
      images: uploadedImages,
      description: body.description || `Property listing in ${body.locality || 'Mohali'}.`,
      amenities: Array.isArray(body.amenities) ? body.amenities : ['Power Backup', 'Car Parking'],
      ownerName: resolvedOwnerName,
      ownerPhone: resolvedOwnerPhone,
      ownerEmail: resolvedOwnerEmail,
      ownerRole: 'owner' as const,
      available: true,
      createdAt: new Date()
    };

    await clearPropertiesCache();

    let created: any = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await connectToDatabase(attempt === 2);
        created = await Property.create(newProperty);
        if (created) break;
      } catch (dbErr: any) {
        console.warn(`MongoDB Property.create attempt ${attempt} failed:`, dbErr?.message);
        if (attempt === 1) {
          continue;
        }
      }
    }

    if (created) {
      return NextResponse.json({ 
        success: true, 
        data: created, 
        message: 'Property posted successfully to MongoDB Atlas!' 
      });
    }

    return NextResponse.json({ 
      success: false, 
      message: 'Failed to create property in database. Please check connection and try again.' 
    }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to create property' 
    }, { status: 400 });
  }
}
