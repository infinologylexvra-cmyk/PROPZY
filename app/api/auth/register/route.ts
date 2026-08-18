import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { signJWT, setAuthCookie } from '@/lib/auth';
import { isValidEmail, getPasswordValidationMessage } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password, role, city } = await req.json();

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ success: false, message: 'Please provide all required registration fields.' }, { status: 400 });
    }

    const passwordError = getPasswordValidationMessage(password);
    if (passwordError) {
      return NextResponse.json({ success: false, message: passwordError }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, message: 'Please enter a valid email address (e.g. name@example.com).' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanCity = (city && typeof city === 'string' && city.trim()) ? city.trim() : 'Mohali';
    const selectedRole = (role === 'owner' || role === 'admin') ? role : 'tenant';

    // Helper to return response with JWT cookie
    const createAuthResponse = async (userPayload: { id: string; name: string; email: string; phone: string; role: 'tenant' | 'owner' | 'admin'; city?: string; wishlist?: string[] }, message: string) => {
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

    // Connect to MongoDB Atlas
    await connectToDatabase();

    // Check if email or phone is already registered
    const existing = await User.findOne({
      $or: [
        { email: cleanEmail },
        { phone: cleanPhone }
      ]
    });

    if (existing) {
      const msg = existing.email === cleanEmail 
        ? 'An account with this email address already exists. Please login instead.'
        : 'An account with this mobile phone number already exists. Please login instead.';
      return NextResponse.json({ success: false, message: msg }, { status: 400 });
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password: hashedPassword,
      role: selectedRole,
      city: cleanCity,
      wishlist: []
    });

    const createdUserData = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      city: newUser.city || cleanCity,
      wishlist: []
    };

    return createAuthResponse(createdUserData, 'Registration successful! Welcome to Propzy.');
  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Registration failed. Please check your connection and try again.'
    }, { status: 500 });
  }
}
