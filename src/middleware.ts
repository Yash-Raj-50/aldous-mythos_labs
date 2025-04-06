import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Use the same secret as in auth.ts but in a format jose can use
const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET || 'aldous-mythos-labs-jwt-secret-key-2023'
);

export async function middleware(request: NextRequest) {
  // Get the token from cookies
  const token = request.cookies.get('auth_token')?.value;
  
  // Get the path of the request
  const { pathname } = request.nextUrl;
  
  // Check if the path is in the auth section (login, register, etc.)
  const isAuthRoute = pathname.startsWith('/auth');
  
  // Public paths that don't require authentication
  const isPublicPath = [
    '/_next', 
    '/images', 
    '/api/auth',
    '/favicon.ico'
  ].some(path => pathname.startsWith(path));

  // If this is a public path, allow access
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Verify token if it exists
  let isValidToken = false;
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isValidToken = true;
    } catch (error) {
      console.error('Token verification failed:', error);
      isValidToken = false;
    }
  }
  
  // If there's no valid token and this isn't an auth route, redirect to login
  if (!isValidToken && !isAuthRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  // If there is a valid token and this is an auth route, redirect to dashboard
  if (isValidToken && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Otherwise, continue as normal
  return NextResponse.next();
}

// Configure the middleware to run only on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};