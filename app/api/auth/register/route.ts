import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { memoryUsers, MemoryUser } from '@/lib/memoryStore';
import { signJWT, setAuthCookie } from '@/lib/auth';
import { isValidEmail } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password, role } = await req.json();

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ success: false, message: 'Please provide all required registration fields.' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, message: 'Please enter a valid email address (e.g. name@example.com).' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const selectedRole = (role === 'owner' || role === 'admin') ? role : 'tenant';

    // Helper to return response with JWT cookie
    const createAuthResponse = async (userPayload: { id: string; name: string; email: string; phone: string; role: 'tenant' | 'owner' | 'admin'; wishlist?: string[] }, message: string) => {
      const token = await signJWT({
        id: userPayload.id,
        name: userPayload.name,
        email: userPayload.email,
        role: userPayload.role
      });

      const response = NextResponse.json({
        success: true,
        message,
        token,
        user: userPayload
      });

      return setAuthCookie(response, token);
    };

    // Hash password with bcrypt for memory fallback / safety
    const hashedPassword = await bcrypt.hash(password, 10);

    let dbConnected = false;
    try {
      await connectToDatabase();
      dbConnected = true;
    } catch (dbErr) {
      console.warn('Atlas DB unavailable during registration, using memory fallback');
    }

    if (dbConnected) {
      try {
        const existing = await User.findOne({ email: cleanEmail });
        if (existing) {
          return NextResponse.json({ success: false, message: 'An account with this email address already exists. Please login instead.' }, { status: 400 });
        }

        // UserSchema pre-save hook will hash password if not already hashed
        const newUser = await User.create({
          name: name.trim(),
          email: cleanEmail,
          phone: phone.trim(),
          password,
          role: selectedRole,
          wishlist: []
        });

        const createdUserData = {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          wishlist: []
        };

        memoryUsers.push({ ...createdUserData, password: hashedPassword });

        return createAuthResponse(createdUserData, 'Registration successful! Welcome to Propzy.');
      } catch (err: any) {
        console.warn('Atlas user creation error:', err.message);
      }
    }

    // Memory fallback creation if DB is offline/unreachable
    const existingMem = memoryUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (existingMem) {
      return NextResponse.json({ success: false, message: 'An account with this email address already exists. Please login instead.' }, { status: 400 });
    }

    const createdMemUser: MemoryUser = {
      id: `usr-mem-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role: selectedRole
    };

    memoryUsers.push(createdMemUser);

    return createAuthResponse({
      id: createdMemUser.id,
      name: createdMemUser.name,
      email: createdMemUser.email,
      phone: createdMemUser.phone,
      role: createdMemUser.role
    }, 'Registration successful! Welcome to Propzy.');
  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Registration failed' }, { status: 500 });
  }
}
