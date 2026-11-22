import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { portalLoginUrl } from '@/lib/supabase/config';
import { isE2EBypassAllowed } from '@/lib/middleware/e2e-bypass';
import {
  FOCUSED_PROJECTS_HOME_PATH,
  isFocusedProjectsMode,
  isRouteAllowedInFocusedMode,
} from '@/lib/config/module-visibility';

/**
 * Matches genuine static file extensions — replaces the broad pathname.includes('.')
 * check that could be bypassed via crafted paths (V8 fix).
 */
const STATIC_FILE_REGEX =
  /\.(ico|png|jpg|jpeg|svg|webp|woff|woff2|ttf|otf|css|js|map|html|mp4|webm|json|webmanifest|txt|xml)$/i;

/**
 * Prefixes to always skip (static assets, health check, API routes)
 */
function shouldSkip(pathname: string): boolean {
  return (
    pathname === '/api/health' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/erp-assets') ||
    pathname.startsWith('/fonts') ||
    STATIC_FILE_REGEX.test(pathname)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets, health route, and API routes (API routes enforce getUser() directly)
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

  // Protected routes: redirect to Portal login if not authenticated
  if (!user) {
    const redirectResponse = NextResponse.redirect(portalLoginUrl(request.nextUrl.href));
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  // Allow authenticated users to view /no-access regardless of Focused Projects Mode
  if (pathname === '/no-access') {
    return supabaseResponse;
  }

  // Focused Projects Mode route boundary: redirect hidden module routes to /projects
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
