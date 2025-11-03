import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { UserRole } from '@/types';

function getRoleBasedRedirect(role?: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return '/admin/dashboard';
    case UserRole.ZONE_USER:
      return '/zone-user/dashboard';
    default:
      return '/auth/login';
  }
}

function isRouteAccessible(pathname: string, role?: UserRole): boolean {
  if (!role) return false;

  // Public routes
  if (pathname.startsWith('/auth/') || pathname === '/') {
    return true;
  }

  // Admin routes
  if (pathname.startsWith('/admin/')) {
    return role === UserRole.ADMIN;
  }

  // Zone routes
  if (pathname.startsWith('/zone-user/')) {
    return role === UserRole.ZONE_USER || role === UserRole.ADMIN;
  }

  return false;
}

function shouldRedirectToLogin(pathname: string): boolean {
  // Public routes that don't need authentication
  const publicRoutes = ['/auth/login', '/auth/register', '/'];
  return !publicRoutes.includes(pathname) && !pathname.startsWith('/_next') && !pathname.startsWith('/api/');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken')?.value;
  const token = request.cookies.get('token')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const userRole = request.cookies.get('userRole')?.value as UserRole | undefined;
  
  const authToken = accessToken || token;

  // Log API calls
  if (pathname.startsWith('/api/')) {
    console.log(`\n--- API Request ---`);
    console.log(`[${new Date().toISOString()}] ${request.method} ${pathname}`);
    console.log('User Role:', userRole || 'Unauthenticated');

    // Block unauthenticated API access
    if (!authToken || !refreshToken) {
      console.log('Unauthenticated API access attempt');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check role-based access
    if (!isRouteAccessible(pathname, userRole)) {
      console.log('Unauthorized API access attempt');
      return NextResponse.json(
        { error: 'You do not have permission to access this resource' },
        { status: 403 }
      );
    }

    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }

  // Handle public routes
  if (!shouldRedirectToLogin(pathname)) {
    return NextResponse.next();
  }
  
  // Special handling for root path
  if (pathname === '/') {
    if (authToken && userRole) {
      return NextResponse.redirect(new URL(getRoleBasedRedirect(userRole), request.url));
    }
    return NextResponse.next();
  }

  // Require authentication for protected routes
  if (!authToken || !refreshToken) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  if (!isRouteAccessible(pathname, userRole)) {
    const redirectPath = getRoleBasedRedirect(userRole);
    console.log(`Middleware: Redirecting ${userRole} from ${pathname} to ${redirectPath}`);
    
    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    response.headers.set('X-Redirect-Reason', 'role-access');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.gif|.*\\.ico).*)',
    '/api/:path*',
  ],
};
