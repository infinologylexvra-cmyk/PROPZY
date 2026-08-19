import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Property from '@/models/Property';
import { INITIAL_PROPERTIES } from '@/lib/seedData';
import { memoryStore } from '@/lib/memoryStore';
import { getAuthUser } from '@/lib/auth';
import { canViewPropertyContactDetails, isAdminUser, isBrowserDocumentNavigation, isOwnedByUser, serializeProperty } from '@/lib/accessControl';
import { clearPropertiesCache } from '@/lib/propertiesCache';
import { extractPublicIdFromUrl, deleteCloudinaryImage } from '@/lib/cloudinary';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (isBrowserDocumentNavigation(req)) {
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  }

  const { id } = await params;
  const authUser = await getAuthUser(req);

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

      return NextResponse.json({
        success: true,
        data: serializeProperty(property, canViewPropertyContactDetails(property, authUser))
      });
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

  try {
    await connectToDatabase();
    
    const normalizedPz = id.startsWith('prop-') ? `PZ-${id.replace('prop-', '')}` : id.startsWith('LR-') ? `PZ-${id.replace('LR-', '')}` : id;
    const normalizedLr = id.startsWith('prop-') ? `LR-${id.replace('prop-', '')}` : id.startsWith('PZ-') ? `LR-${id.replace('PZ-', '')}` : id;

    const queryFilter: any = [{ pid: id }, { pid: normalizedPz }, { pid: normalizedLr }, { id: id }];
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      queryFilter.push({ _id: id });
    }

    let existing: any = await Property.findOne({ $or: queryFilter }).lean();

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Property not found' }, { status: 404 });
    }

    if (authUser && !isAdminUser(authUser) && !isOwnedByUser(existing.ownerEmail, authUser)) {
      return NextResponse.json({ success: false, message: 'Forbidden. You can only modify your own property listing.' }, { status: 403 });
    }

    // Update with $set to ensure partial fields (verified, featured, price, etc.) are updated accurately
    let updated = await Property.findOneAndUpdate(
      { $or: queryFilter },
      { $set: body },
      { new: true }
    );

    // Sync memoryStore fallback if active
    const memIndex = memoryStore.findIndex(p => p.id === id || p.pid === id || p.pid === normalizedPz || p.pid === normalizedLr || (p._id && p._id.toString() === id));
    if (memIndex !== -1) {
      memoryStore[memIndex] = { ...memoryStore[memIndex], ...body };
    }

    // Invalidate server-side property listings cache
    clearPropertiesCache();

    return NextResponse.json({ success: true, data: serializeProperty(updated || (memIndex !== -1 ? memoryStore[memIndex] : null), true) });
  } catch (err: any) {
    console.error('PATCH Error:', err.message);
    const memIndex = memoryStore.findIndex(p => p.id === id || p.pid === id);
    if (memIndex !== -1) {
      memoryStore[memIndex] = { ...memoryStore[memIndex], ...body };
    }
    return NextResponse.json({ success: true, message: err.message }, { status: 400 });
  }
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

  try {
    await connectToDatabase();

    const normalizedPz = id.startsWith('prop-') ? `PZ-${id.replace('prop-', '')}` : id.startsWith('LR-') ? `PZ-${id.replace('LR-', '')}` : id;
    const normalizedLr = id.startsWith('prop-') ? `LR-${id.replace('prop-', '')}` : id.startsWith('PZ-') ? `LR-${id.replace('PZ-', '')}` : id;

    let existing: any = await Property.findOne({ $or: [{ pid: id }, { pid: normalizedPz }, { pid: normalizedLr }, { id: id }] }).lean();
    if (!existing && id.match(/^[0-9a-fA-F]{24}$/)) {
      existing = await Property.findById(id).lean().catch(() => null);
    }

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Property not found' }, { status: 404 });
    }

    if (!isAdminUser(authUser) && !isOwnedByUser(existing.ownerEmail, authUser)) {
      return NextResponse.json({ success: false, message: 'Forbidden. You can only delete your own property listing.' }, { status: 403 });
    }

    let deleted = await Property.findOneAndDelete({ $or: [{ pid: id }, { pid: normalizedPz }, { pid: normalizedLr }, { id: id }] });
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

    const memIndex = memoryStore.findIndex(p => p.id === id || p.pid === id || p.pid === normalizedPz || p.pid === normalizedLr || (p._id && p._id.toString() === id));
    if (memIndex !== -1) {
      memoryStore.splice(memIndex, 1);
    }

    // Invalidate server-side property listings cache
    clearPropertiesCache();

    return NextResponse.json({ success: true, data: serializeProperty(deleted || null, true) });
  } catch (err: any) {
    console.error('DELETE Error:', err.message);
    return NextResponse.json({ success: false, message: err.message || 'Failed to delete property' }, { status: 400 });
  }
}
