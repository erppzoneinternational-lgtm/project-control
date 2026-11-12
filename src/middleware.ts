import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { isE2EBypassAllowed } from '@/lib/middleware/e2e-bypass';
import {
  FOCUSED_PROJECTS_HOME_PATH,
  isFocusedProjectsMode,
  isRouteAllowedInFocusedMode,
} from '@/lib/config/module-visibility';

/**
 * Public routes that do NOT require authentication.
 * Everything else requires a valid Supabase session.
 */
const PUBLIC_ROUTES = new Set([
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/privacy-policy',
  '/thank-you',
  '/landing',
  '/showcase',
  '/auth/callback',
  '/auth/confirm',
]);

/**
 * Matches genuine static file extensions — replaces the broad pathname.includes('.')
 * check that could be bypassed via crafted paths (V8 fix).
 */
const STATIC_FILE_REGEX =
  /\.(ico|png|jpg|jpeg|svg|webp|woff|woff2|ttf|otf|css|js|map|html|mp4|webm|json|webmanifest|txt|xml)$/i;

/**
 * Prefixes to always skip (static assets, API routes, etc.)
 */
function shouldSkip(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/erp-assets') ||
    pathname.startsWith('/fonts') ||
    STATIC_FILE_REGEX.test(pathname)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Forward loopback Google OAuth callbacks arriving at root ('/?code=...&state=google_local:...') to /auth/callback
  if (
    pathname === '/' &&
    searchParams.has('code') &&
    (searchParams.get('state') || '').startsWith('google_local:')
  ) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = '/auth/callback';
    return NextResponse.redirect(callbackUrl);
  }

  // Skip static assets and internal routes
  if (shouldSkip(pathname)) {
    return NextResponse.next();
  }

  // E2E testing bypass: only active when the server explicitly enables it
  // (PZONE_E2E_ENABLED=true, set by playwright.config.ts) and never on Vercel.
  if (
    isE2EBypassAllowed(
      {
        header: (name) => request.headers.get(name),
        cookie: (name) => request.cookies.get(name)?.value,
      },
      process.env,
    )
  ) {
    return NextResponse.next();
  }

  // Refresh session and get user
  const { user, supabaseResponse } = await updateSession(request);

  // Public routes: allow through (redirect to /projects if already logged in for auth pages)
  if (PUBLIC_ROUTES.has(pathname)) {
    if (user && (pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password')) {
      // Already authenticated — redirect away from login
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/projects';
      redirectUrl.search = ''; // Strip lingering ?redirect params
      const redirectResponse = NextResponse.redirect(redirectUrl);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return redirectResponse;
    }
    return supabaseResponse;
  }

  // Protected routes: redirect to login if not authenticated
  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    // Only append redirect param for meaningful deep links, never for root '/' or auth pages
    if (pathname && pathname !== '/' && pathname !== '/login') {
      redirectUrl.searchParams.set('redirect', pathname);
    } else {
      redirectUrl.searchParams.delete('redirect');
    }
    const redirectResponse = NextResponse.redirect(redirectUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  // Focused Projects Mode route boundary: redirect hidden module routes to /projects/dashboard
  if (isFocusedProjectsMode() && !isRouteAllowedInFocusedMode(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathname === '/projects/import' ? '/projects' : FOCUSED_PROJECTS_HOME_PATH;
    redirectUrl.search = '';
    const redirectResponse = NextResponse.redirect(redirectUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  return supabaseResponse;
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
