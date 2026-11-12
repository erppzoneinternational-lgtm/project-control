import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const SAFE_ORIGIN_ANCHOR = 'https://projectcontrol.pzoneinternational.com';

/**
 * Strictly validates relative redirect paths to prevent Open Redirect attacks.
 * Must start with '/', must NOT start with '//' or '/\\', and must not contain
 * '@', backslashes, or ASCII control characters.
 */
function sanitizeNextPath(raw: string | null | undefined, fallback = '/'): string {
  if (!raw || typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    trimmed.includes('\\') ||
    trimmed.includes('@') ||
    /[\u0000-\u001F\u007F]/.test(trimmed)
  ) {
    return fallback;
  }
  try {
    const parsed = new URL(trimmed, SAFE_ORIGIN_ANCHOR);
    if (parsed.origin !== SAFE_ORIGIN_ANCHOR) {
      return fallback;
    }
  } catch {
    return fallback;
  }
  return trimmed;
}

/**
 * Validates x-forwarded-host against trusted P.Zone production & Vercel preview hosts.
 */
function getTrustedForwardedHost(rawHeader: string | null): string | null {
  if (!rawHeader) return null;
  const candidate = rawHeader.split(',')[0].trim().toLowerCase();
  if (!candidate || /[^a-z0-9.-]/.test(candidate)) return null;
  if (
    candidate === 'projectcontrol.pzoneinternational.com' ||
    (/^[a-z0-9-]+(\.[a-z0-9-]+)*\.vercel\.app$/.test(candidate) && !candidate.startsWith('.'))
  ) {
    return candidate;
  }
  return null;
}

function resolveRedirectOrigin(request: Request, fallbackOrigin: string): string {
  if (process.env.NODE_ENV === 'development') {
    return fallbackOrigin;
  }
  const trustedHost = getTrustedForwardedHost(request.headers.get('x-forwarded-host'));
  if (trustedHost) {
    return `https://${trustedHost}`;
  }
  return fallbackOrigin;
}

/**
 * OAuth PKCE Code Exchange Handler
 * Supabase redirects here after Google/Microsoft OAuth consent screen.
 * Exchanges the authorization code for a session and sets cookies.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  let idToken = searchParams.get('id_token');
  let accessToken = searchParams.get('access_token');
  let next = sanitizeNextPath(searchParams.get('next'), '/');

  const redirectOrigin = resolveRedirectOrigin(request, origin);

  if (state && state.startsWith('google_local:') && code && !idToken) {
    const stateNext = state.slice('google_local:'.length);
    if (stateNext) {
      next = sanitizeNextPath(stateNext, '/');
    }

    const googleClientId =
      process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!googleClientId || !googleClientSecret) {
      return NextResponse.redirect(`${redirectOrigin}/login?error=oauth_config_missing`);
    }

    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: googleClientId,
          client_secret: googleClientSecret,
          redirect_uri: origin,
          grant_type: 'authorization_code',
        }),
      });
      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        idToken = tokenData.id_token || null;
        accessToken = tokenData.access_token || null;
      }
    } catch {
      // Fall through to standard exchange if direct token exchange fails
    }
  }

  if (idToken) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
      access_token: accessToken || undefined,
    });
    if (!error) {
      return NextResponse.redirect(`${redirectOrigin}${next}`);
    }
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${redirectOrigin}${next}`);
    }
  }

  // Auth failed — redirect to login with error indicator
  return NextResponse.redirect(`${redirectOrigin}/login?error=auth_callback_failed`);
}
