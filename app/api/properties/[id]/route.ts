import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Property from '@/models/Property';
import { INITIAL_PROPERTIES } from '@/lib/seedData';
import { memoryStore } from '@/lib/memoryStore';
import { getAuthUser } from '@/lib/auth';
import { canViewPropertyContactDetails, isAdminUser, isBrowserDocumentNavigation, isOwnedByUser, serializeProperty } from '@/lib/accessControl';
import { clearPropertiesCache } from '@/lib/propertiesCache';
import { extractPublicIdFromUrl, deleteCloudinaryImage } from '@/lib/cloudinary';
import { redisGet, redisSet } from '@/lib/redis';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (isBrowserDocumentNavigation(req)) {
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  }

  const { id } = await params;
  const authUser = await getAuthUser(req);
  const isGuest = !authUser;
  const singleCacheKey = `prop:single:${id.toLowerCase()}`;

  // Check Redis for unauthenticated public guests
  if (isGuest) {
    try {
      const cached = await redisGet<any>(singleCacheKey);
      if (cached) {
        return NextResponse.json(cached, {
          headers: { 'X-Cache-Status': 'REDIS-HIT' }
        });
      }
    } catch {}
  }

  try {
    await connectToDatabase();
    
    const normalizedPz = id.startsWith('prop-') ? `PZ-${id.replace('prop-', '')}` : id.startsWith('LR-') ? `PZ-${id.replace('LR-', '')}` : id;
    const normalizedLr = id.startsWith('prop-') ? `LR-${id.replace('prop-', '')}` : id.startsWith('PZ-') ? `LR-${id.replace('PZ-', '')}` : id;

    let property = await Property.findOne({
      $or: [{ pid: id }, { pid: normalizedPz }, { pid: normalizedLr }, { id: id }]
    });

    if (!property && id.match(/^[0-9a-fA-F]{24}$/)) {
      property = await Property.findById(id).catch(() => null);
    }

    if (property) {
      const canAccess = property.verified || isAdminUser(authUser) || isOwnedByUser(property.ownerEmail, authUser);

      if (!canAccess) {
        return NextResponse.json({ success: false, message: 'Property not found' }, { status: 404 });
      }

      const responsePayload = {
        success: true,
        data: serializeProperty(property, canViewPropertyContactDetails(property, authUser))
      };

      // Cache verified property response in Redis for guests (5 min TTL)
      if (isGuest && property.verified) {
        await redisSet(singleCacheKey, responsePayload, 300);
      }

      return NextResponse.json(responsePayload);
    }
  } catch (err) {
    console.warn('Fallback single property fetch:', err);
  }

  // Memory fallback
  const found = memoryStore.find(p => p.id === id || p.pid === id || p.pid === `PZ-${id.replace('prop-', '')}` || p.pid === `LR-${id.replace('prop-', '')}`) || INITIAL_PROPERTIES.find(p => p.id === id || p.pid === id || p.pid === `PZ-${id.replace('prop-', '')}` || p.pid === `LR-${id.replace('prop-', '')}`);
  if (found) {
    const canAccess = found.verified || isAdminUser(authUser) || isOwnedByUser(found.ownerEmail, authUser);

    if (!canAccess) {
      return NextResponse.json({ success: false, message: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: serializeProperty(found, canViewPropertyContactDetails(found, authUser))
    });
  }

  return NextResponse.json({ success: false, message: 'Property not found' }, { status: 404 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const authUser = await getAuthUser(req);

  if (!authUser && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, message: 'Unauthorized. Please login.' }, { status: 401 });
  }

  const normalizedPz = id.startsWith('prop-') ? `PZ-${id.replace('prop-', '')}` : id.startsWith('LR-') ? `PZ-${id.replace('LR-', '')}` : id;
  const normalizedLr = id.startsWith('prop-') ? `LR-${id.replace('prop-', '')}` : id.startsWith('PZ-') ? `LR-${id.replace('PZ-', '')}` : id;

  const queryFilter: any = [{ pid: id }, { pid: normalizedPz }, { pid: normalizedLr }, { id: id }];
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    queryFilter.push({ _id: id });
  }

  let updated: any = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await connectToDatabase(attempt === 2);
      
      let existing: any = await Property.findOne({ $or: queryFilter }).lean();

      if (existing) {
        if (authUser && !isAdminUser(authUser) && !isOwnedByUser(existing.ownerEmail, authUser)) {
          return NextResponse.json({ success: false, message: 'Forbidden. You can only modify your own property listing.' }, { status: 403 });
        }

        updated = await Property.findOneAndUpdate(
          { $or: queryFilter },
          { $set: body },
          { new: true }
        );
      }
      break;
    } catch (err: any) {
      console.warn(`[PATCH Property] Attempt ${attempt} failed:`, err?.message);
      if (attempt === 1) {
        continue;
      }
    }
  }

  // Sync memoryStore fallback if active
  const memIndex = memoryStore.findIndex(p => p.id === id || p.pid === id || p.pid === normalizedPz || p.pid === normalizedLr || (p._id && p._id.toString() === id));
  if (memIndex !== -1) {
    memoryStore[memIndex] = { ...memoryStore[memIndex], ...body };
  }

  // Invalidate server-side property listings and single property cache
  await clearPropertiesCache();

  if (updated || memIndex !== -1) {
    return NextResponse.json({ 
      success: true, 
      data: serializeProperty(updated || (memIndex !== -1 ? memoryStore[memIndex] : null), true) 
    });
  }

  return NextResponse.json({ success: false, message: 'Property not found' }, { status: 404 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authUser = await getAuthUser(req);

  if (!authUser) {
    return NextResponse.json({ success: false, message: 'Unauthorized. Please login.' }, { status: 401 });
  }

  const normalizedPz = id.startsWith('prop-') ? `PZ-${id.replace('prop-', '')}` : id.startsWith('LR-') ? `PZ-${id.replace('LR-', '')}` : id;
  const normalizedLr = id.startsWith('prop-') ? `LR-${id.replace('prop-', '')}` : id.startsWith('PZ-') ? `LR-${id.replace('PZ-', '')}` : id;

  const queryFilter: any = [{ pid: id }, { pid: normalizedPz }, { pid: normalizedLr }, { id: id }];
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    queryFilter.push({ _id: id });
  }

  let deleted: any = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await connectToDatabase(attempt === 2);

      let existing: any = await Property.findOne({ $or: queryFilter }).lean();
      if (!existing && id.match(/^[0-9a-fA-F]{24}$/)) {
        existing = await Property.findById(id).lean().catch(() => null);
      }

      if (existing) {
        if (!isAdminUser(authUser) && !isOwnedByUser(existing.ownerEmail, authUser)) {
          return NextResponse.json({ success: false, message: 'Forbidden. You can only delete your own property listing.' }, { status: 403 });
        }

        deleted = await Property.findOneAndDelete({ $or: queryFilter });
        if (!deleted && id.match(/^[0-9a-fA-F]{24}$/)) {
          deleted = await Property.findByIdAndDelete(id);
        }

        // Safely delete associated Cloudinary images in background
        if (existing.images && Array.isArray(existing.images)) {
          Promise.allSettled(
            existing.images.map(async (imgUrl: string) => {
              const publicId = extractPublicIdFromUrl(imgUrl);
              if (publicId) {
                await deleteCloudinaryImage(publicId);
              }
            })
          ).catch(err => console.warn('[Cloudinary Cleanup Error]:', err));
        }
      }
      break;
    } catch (err: any) {
      console.warn(`[DELETE Property] Attempt ${attempt} failed:`, err?.message);
      if (attempt === 1) {
        continue;
      }
    }
  }

  const memIndex = memoryStore.findIndex(p => p.id === id || p.pid === id || p.pid === normalizedPz || p.pid === normalizedLr || (p._id && p._id.toString() === id));
  if (memIndex !== -1) {
    memoryStore.splice(memIndex, 1);
  }

  // Invalidate server-side property listings and single property cache
  await clearPropertiesCache();

  if (deleted || memIndex !== -1) {
    return NextResponse.json({ success: true, data: serializeProperty(deleted || null, true) });
  }

  return NextResponse.json({ success: false, message: 'Property not found' }, { status: 404 });
}
