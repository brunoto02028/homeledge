import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/change-password', '/verify-email', '/api/auth', '/api/signup', '/shared', '/onboarding', '/invite', '/upload', '/verify', '/verify-purchase', '/privacy', '/terms', '/cookies', '/intelligence'];

// API routes that don't require authentication
const publicApiPrefixes = ['/api/auth/', '/api/signup'];
const publicApiExact = ['/api/auth/send-login-code', '/api/auth/forgot-password', '/api/auth/reset-password', '/api/plans', '/api/analytics/collect', '/api/news'];
const publicApiDynamic = ['/api/shared-links/', '/api/documents/mobile-upload', '/api/government/callback/', '/api/open-banking/callback', '/api/cron/', '/api/stripe/webhook', '/api/stripe/verify-checkout', '/api/stripe/verify-session', '/api/yoti/webhook', '/api/yoti/verify-link/', '/api/yoti/qrcode', '/api/intelligence/'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Allow public API routes
  if (publicApiPrefixes.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }
  if (publicApiExact.some(route => pathname === route)) {
    return NextResponse.next();
  }
  if (publicApiDynamic.some(prefix => pathname.startsWith(prefix) && pathname !== prefix.slice(0, -1))) {
    return NextResponse.next();
  }
  
  // Allow static files and Next.js internal routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Check for authentication token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // Allow landing page (/) for everyone — public marketing page
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Allow public CMS API
  if (pathname === '/api/cms') {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If authenticated and trying to access login/register, redirect to dashboard
  if (token && (pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname === '/reset-password')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Force password change for admin-created accounts
  if (token && !pathname.startsWith('/api/') && pathname !== '/change-password') {
    const mustChange = (token as any).mustChangePassword;
    if (mustChange === true) {
      return NextResponse.redirect(new URL('/change-password', request.url));
    }
  }

  // Redirect non-onboarded users to onboarding (skip API routes and onboarding itself)
  if (token && !pathname.startsWith('/api/') && pathname !== '/onboarding' && pathname !== '/change-password') {
    const onboarded = (token as any).onboardingCompleted;
    if (onboarded === false) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  // Permission-based route protection
  if (token && !pathname.startsWith('/api/') && pathname !== '/onboarding' && pathname !== '/dashboard') {
    const role = (token as any).role || 'user';
    const permissions: string[] = (token as any).permissions || [];

    // Admin always has access
    if (role !== 'admin') {
      // Admin routes require admin role
      if (pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      // Accountant routes require accountant or admin role
      if (pathname.startsWith('/accountant') && role !== 'accountant') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      // Admin-only routes (learning modules) — block non-admin entirely
      const adminOnlyRoutes = ['/learn', '/academy', '/relocation', '/english-hub'];
      if (adminOnlyRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      // Check feature permissions (only if permissions array is non-empty — empty = all access)
      if (permissions.length > 0) {
        const routePermMap: Record<string, string> = {
          '/household': 'household', '/entities': 'entities', '/statements': 'statements',
          '/documents': 'documents', '/life-events': 'life_events', '/invoices': 'invoices',
          '/bills': 'bills', '/providers': 'providers', '/actions': 'actions',
          '/categories': 'categories', '/reports': 'reports', '/files': 'files',
          '/vault': 'vault', '/projections': 'projections', '/transfers': 'transfers',
          '/properties': 'properties', '/product-calculator': 'product_calculator',
          '/tax-timeline': 'tax_timeline', '/services': 'services',
          '/email': 'email', '/settings': 'settings',
        };
        const matchedRoute = Object.keys(routePermMap).find(
          r => pathname === r || pathname.startsWith(r + '/')
        );
        if (matchedRoute && !permissions.includes(routePermMap[matchedRoute])) {
          return NextResponse.redirect(new URL('/settings?upgrade=1', request.url));
        }
      }
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
