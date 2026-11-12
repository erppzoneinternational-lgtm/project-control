import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
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
 * Auth Confirm Route Handler (Verify OTP / PKCE Code)
 * Handles token_hash & recovery links on server side, setting cookies securely.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next');
  const next =
    rawNext !== null
      ? sanitizeNextPath(rawNext, '/')
      : type === 'recovery'
      ? '/reset-password'
      : '/';

  const supabase = await createSupabaseServerClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('[auth/confirm] verifyOtp error:', error.message);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('[auth/confirm] exchangeCodeForSession error:', error.message);
  }

  return NextResponse.redirect(`${origin}/forgot-password?error=auth_confirmation_failed`);
}
