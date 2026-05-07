import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Admin routes protection
    if (pathname.startsWith('/admin')) {
      if (!token || token.role !== 'admin') {
        const url = new URL('/auth/login', req.url);
        url.searchParams.set('callbackUrl', pathname);
        url.searchParams.set('error', 'AccessDenied');
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow auth pages
        if (pathname.startsWith('/auth/')) {
          return true;
        }

        // Allow public pages
        if (
          pathname === '/' ||
          pathname.startsWith('/search') ||
          pathname.startsWith('/hotels') ||
          pathname.startsWith('/api/webhook') ||
          pathname.startsWith('/api/grs') // GRS proxy needs auth check inside
        ) {
          return true;
        }

        // Dashboard and booking pages require authentication
        if (
          pathname.startsWith('/dashboard') ||
          pathname.startsWith('/booking') ||
          pathname.startsWith('/payment') ||
          pathname.startsWith('/admin')
        ) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - handled separately
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|.*\\.png$|.*\\.svg$).*)',
  ],
};
