import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  SUPABASE_URL,
  SUPABASE_KEY,
  SUPABASE_SCHEMA,
  cookieOptions,
} from './config';

/**
 * Creates a Supabase client for use in Next.js middleware.
 * Handles cookie refresh for session management.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    db: { schema: SUPABASE_SCHEMA as 'public' },
    cookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, {
            ...cookieOptions,
            ...options,
            domain: cookieOptions.domain,
          })
        );
      },
    },
  });

  // IMPORTANT: Do NOT call supabase.auth.getSession() here.
  // Use getUser() which validates the JWT against Supabase Auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, supabaseResponse };
}
