import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Paths that don't require authentication
const publicPaths = [
  '/',
  '/login',
  '/register',
  '/verify-email',
  '/verification-success',
  '/verification-failed',
  '/pending-approval',
  '/forgot-password',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-email',
  '/api/auth/resend-verification',
];

// Path prefixes that require specific roles
const roleBasedPaths = {
  '/admin': ['ADMIN'],
  '/faculty': ['FACULTY'],
  '/student': ['STUDENT'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if path is public
  if (publicPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }
  
  // If it's an API route that's not specifically listed in publicPaths, let it through
  // (API routes should handle their own auth checking)
  if (pathname.startsWith('/api/') && !publicPaths.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Get token from cookies
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    // Verify token
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, secretKey);
    
    const userRole = payload.role as string;
    
    // Check role-based access
    for (const [pathPrefix, allowedRoles] of Object.entries(roleBasedPaths)) {
      if (pathname.startsWith(pathPrefix) && !allowedRoles.includes(userRole)) {
        // Redirect to appropriate dashboard instead of home
        if (userRole === 'ADMIN') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        } else if (userRole === 'FACULTY') {
          return NextResponse.redirect(new URL('/faculty/dashboard', request.url));
        } else if (userRole === 'STUDENT') {
          return NextResponse.redirect(new URL('/student/dashboard', request.url));
        } else {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    }
    
    return NextResponse.next();
  } catch (error) {
    // Token is invalid or expired
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Match all routes except for static files, favicon, etc.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
