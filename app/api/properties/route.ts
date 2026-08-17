import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Property from '@/models/Property';
import User from '@/models/User';
import { INITIAL_PROPERTIES, PropertyItem } from '@/lib/seedData';
import { memoryStore } from '@/lib/memoryStore';
import { getAuthUser } from '@/lib/auth';
import { canViewPropertyContactDetails, isAdminUser, isBrowserDocumentNavigation, normalizeEmail, serializeProperty } from '@/lib/accessControl';

export const runtime = 'nodejs';

// In-Memory Fast API Cache Layer
interface CacheEntry {
  payload: any;
  timestamp: number;
}
const apiPropertiesCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30000; // 30 Seconds TTL

// In-Flight Request Deduplication Map
const inFlightRequests = new Map<string, Promise<any>>();

function clearPropertiesApiCache() {
  apiPropertiesCache.clear();
}

export async function GET(req: NextRequest) {
  const tStart = performance.now();

  try {
    if (isBrowserDocumentNavigation(req)) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    // 1. Authentication
    const tAuthStart = performance.now();
    const authUser = await getAuthUser(req);
    const tAuthEnd = performance.now();
    const durAuth = (tAuthEnd - tAuthStart).toFixed(2);

    // 2. Build Deterministic Cache Key (with strict role / user isolation)
    const { searchParams } = new URL(req.url);
    const sortedParams = Array.from(searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');

    const cacheIdentity = !authUser
      ? 'guest'
      : isAdminUser(authUser)
      ? 'admin'
      : `user:${authUser.id || 'auth'}`;

    const cacheKey = `prop:${cacheIdentity}:${sortedParams}`;

    // 3. Fast Cache Lookup
    const tCacheStart = performance.now();
    const cached = apiPropertiesCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      const tTotal = (performance.now() - tStart).toFixed(2);
      return NextResponse.json(cached.payload, {
        headers: {
          'Cache-Control': 'public, s-maxage=12, stale-while-revalidate=45',
          'X-Cache-Status': 'HIT',
          'Server-Timing': `auth;dur=${durAuth}, cache;dur=${(performance.now() - tCacheStart).toFixed(2)}, total;dur=${tTotal}`
        }
      });
    }

    // 4. In-Flight Request Deduplication (reuse concurrent query promise)
    const existingInFlight = inFlightRequests.get(cacheKey);
    if (existingInFlight) {
      try {
        const result = await existingInFlight;
        const tTotal = (performance.now() - tStart).toFixed(2);
        return NextResponse.json(result.payload, {
          headers: {
            'Cache-Control': 'public, s-maxage=12, stale-while-revalidate=45',
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
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 24));
    const includeTotal = searchParams.get('includeTotal') === 'true';

    if (admin === 'true' && !isAdminUser(authUser)) {
      return NextResponse.json({ success: false, message: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    // 5. Execute DB Query with Promise In-Flight Registration
    const executeQuery = async () => {
      const tConnStart = performance.now();
      const mongooseInstance = await connectToDatabase();
      const tConnEnd = performance.now();
      const durConn = (tConnEnd - tConnStart).toFixed(2);

      // Diagnostic: inspect topology state immediately after connectToDatabase()
      const client = (mongooseInstance.connection as any).getClient?.();
      const topology = client?.topology;
      const serversBefore = topology?.description?.servers ? Array.from(topology.description.servers.keys()) : [];
      const topologyTypeBefore = topology?.description?.type || 'unknown';

      // 1. Time immediately after connectToDatabase()
      const tAfterConn = performance.now();

      // Build MongoDB filter
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

      // Role-based visibility filtering in DB query
      if (!isAdminUser(authUser) || admin !== 'true') {
        if (!authUser) {
          // Guests only see verified listings
          filter.verified = true;
        } else if (verified !== 'all' && verified !== 'false') {
          // Regular user: verified listings OR listings owned by this user
          filter.$or = [
            { verified: true },
            { ownerEmail: authUser.email.toLowerCase().trim() }
          ];
        }
      }

      const skip = (page - 1) * limit;
      const fetchLimit = includeTotal ? limit : limit + 1;

      // 2. Time before creating Mongoose query
      const tBeforeQueryCreate = performance.now();

      // Projected listing fields
      const projection = 'pid title category type city locality address price deposit bedrooms bathrooms areaSqFt furnishing verified featured images ownerEmail ownerRole available createdAt';

      const dataQuery = Property.find(filter)
        .select(projection)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(fetchLimit)
        .lean();

      // 3. Time before .exec()
      const tBeforeExec = performance.now();
      const durQueryBuild = (tBeforeExec - tBeforeQueryCreate).toFixed(2);

      let properties: any[] = [];
      let totalCount: number | undefined;

      if (includeTotal) {
        const [fetchedProps, count] = await Promise.all([
          dataQuery.exec(),
          Property.countDocuments(filter).exec()
        ]);
        properties = fetchedProps;
        totalCount = count;
      } else {
        properties = await dataQuery.exec();
      }

      // 4. Time immediately after .exec()
      const tAfterExec = performance.now();
      const durExec = (tAfterExec - tBeforeExec).toFixed(2);
      const durQuery = (tAfterExec - tBeforeQueryCreate).toFixed(2);

      const serversAfter = topology?.description?.servers ? Array.from(topology.description.servers.keys()) : [];
      const topologyTypeAfter = topology?.description?.type || 'unknown';

      console.log(`\n🔍 [DIAGNOSTIC TIMINGS]`);
      console.log(`   1. connectToDatabase(): ${durConn} ms (readyState: ${mongooseInstance.connection.readyState})`);
      console.log(`   2. Topology before query: Type=${topologyTypeBefore}, Known Servers=[${serversBefore.join(', ')}]`);
      console.log(`   3. Query Object Build: ${durQueryBuild} ms`);
      console.log(`   4. Query .exec() execution: ${durExec} ms`);
      console.log(`   5. Topology after query: Type=${topologyTypeAfter}, Known Servers=[${serversAfter.join(', ')}]\n`);

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

      // Cache sanitized response
      apiPropertiesCache.set(cacheKey, { payload, timestamp: Date.now() });

      return {
        payload,
        timings: { durConn, durQuery, durExec, durQueryBuild, durAccess }
      };
    };

    // Register in-flight promise
    const queryPromise = executeQuery();
    inFlightRequests.set(cacheKey, queryPromise);

    try {
      const { payload, timings } = await queryPromise;
      const tTotal = (performance.now() - tStart).toFixed(2);

      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `[API Properties] Auth: ${durAuth}ms | DB Conn: ${timings.durConn}ms | Query Build: ${timings.durQueryBuild}ms | Query Exec: ${timings.durExec}ms | Access: ${timings.durAccess}ms | Total: ${tTotal}ms`
        );
      }

      return NextResponse.json(payload, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Cache-Status': 'MISS',
          'Server-Timing': `auth;dur=${durAuth}, db_conn;dur=${timings.durConn}, db_build;dur=${timings.durQueryBuild}, db_exec;dur=${timings.durExec}, access;dur=${timings.durAccess}, total;dur=${tTotal}`
        }
      });
    } catch (error: any) {
      console.error('[API Properties Error]:', error.message);

      // If a stale cache entry exists, return it with a stale indicator
      if (cached) {
        return NextResponse.json({
          ...cached.payload,
          source: 'cache-stale',
          warning: 'Serving stale cache due to database unavailability'
        }, {
          headers: { 'X-Cache-Status': 'STALE' }
        });
      }

      // Fail quickly with clear 503 instead of fabricating data
      return NextResponse.json({
        success: false,
        message: 'Database temporarily unavailable. Please try again.',
        error: error.message
      }, { status: 503 });
    } finally {
      // Guaranteed in-flight promise cleanup
      inFlightRequests.delete(cacheKey);
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

    clearPropertiesApiCache();

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
