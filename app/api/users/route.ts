import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { memoryUsers } from '@/lib/memoryStore';

export async function GET(req: NextRequest) {
  try {
    let dbConnected = false;
    let dbUsers: any[] = [];

    try {
      await connectToDatabase();
      dbConnected = true;
    } catch (err: any) {}

    if (dbConnected) {
      try {
        dbUsers = await User.find({}).sort({ createdAt: -1 }).lean();
      } catch (err: any) {}
    }


    // Map DB users
    const mappedDbUsers = dbUsers.map((u: any) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role === 'owner' ? 'Landlord / Owner' : u.role === 'admin' ? 'Super Admin' : 'Tenant',
      status: 'Active',
      propertiesCount: 0,
      createdAt: u.createdAt || new Date()
    }));

    // Map memory users not present in DB
    const existingEmails = new Set(mappedDbUsers.map(u => u.email.toLowerCase()));
    const mappedMemUsers = memoryUsers
      .filter(m => !existingEmails.has(m.email.toLowerCase()))
      .map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        role: m.role === 'owner' ? 'Landlord / Owner' : m.role === 'admin' ? 'Super Admin' : 'Tenant',
        status: 'Active',
        propertiesCount: 0,
        createdAt: new Date()
      }));

    const combinedUsers = [...mappedDbUsers, ...mappedMemUsers];

    return NextResponse.json({
      success: true,
      data: combinedUsers,
      source: dbConnected ? 'database' : 'memory'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
