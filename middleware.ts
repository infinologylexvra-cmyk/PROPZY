import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const AUTH_COOKIE_NAME = 'propzy_token';
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'propzy-secret-jwt-key-2026-super-secure'
);


export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin routes except login page
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const cookieToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    let authUser: any = null;

    if (cookieToken) {
      try {
        const verified = await jwtVerify(cookieToken, SECRET_KEY);
        authUser = verified.payload;
      } catch (err) {
        authUser = null;
      }
    }

    if (!authUser || authUser.role !== 'admin') {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
