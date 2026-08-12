import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Property from '@/models/Property';
import { INITIAL_PROPERTIES } from '@/lib/seedData';
import { memoryStore } from '@/lib/memoryStore';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await connectToDatabase();
    
    const normalizedPid = id.startsWith('prop-') ? `LR-${id.replace('prop-', '')}` : id;
    let property = await Property.findOne({
      $or: [{ pid: id }, { pid: normalizedPid }, { id: id }]
    });

    if (!property && id.match(/^[0-9a-fA-F]{24}$/)) {
      property = await Property.findById(id).catch(() => null);
    }

    if (property) {
      return NextResponse.json({ success: true, data: property });
    }
  } catch (err) {
    console.warn('Fallback single property fetch:', err);
  }

  // Memory fallback
  const found = memoryStore.find(p => p.id === id || p.pid === id) || INITIAL_PROPERTIES.find(p => p.id === id || p.pid === id);
  if (found) {
    return NextResponse.json({ success: true, data: found });
  }

  return NextResponse.json({ success: false, message: 'Property not found' }, { status: 404 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  try {
    await connectToDatabase();
    
    const normalizedPid = id.startsWith('prop-') ? `LR-${id.replace('prop-', '')}` : id;

    // Try finding & updating by pid or id
    let updated = await Property.findOneAndUpdate(
      { $or: [{ pid: id }, { pid: normalizedPid }, { id: id }] },
      body,
      { new: true }
    );

    // If not found and valid Mongo ObjectId, try findByIdAndUpdate
    if (!updated && id.match(/^[0-9a-fA-F]{24}$/)) {
      updated = await Property.findByIdAndUpdate(id, body, { new: true });
    }

    // Sync memoryStore fallback if active
    const memIndex = memoryStore.findIndex(p => p.id === id || p.pid === id || p.pid === normalizedPid || (p._id && p._id.toString() === id));
    if (memIndex !== -1) {
      memoryStore[memIndex] = { ...memoryStore[memIndex], ...body };
    }

    return NextResponse.json({ success: true, data: updated || (memIndex !== -1 ? memoryStore[memIndex] : null) });
  } catch (err: any) {
    console.error('PATCH Error:', err.message);
    const memIndex = memoryStore.findIndex(p => p.id === id || p.pid === id);
    if (memIndex !== -1) {
      memoryStore[memIndex] = { ...memoryStore[memIndex], ...body };
    }
    return NextResponse.json({ success: true, message: err.message }, { status: 400 });
  }
}
