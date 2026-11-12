import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

const SUPABASE_SCHEMA = (process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public') as 'public';

/**
 * Server-side Supabase client for use in:
 * - Server Components
 * - Server Actions
 * - Route Handlers
 *
 * Must be called inside a request context (not at module level).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  let cookieDomain: string | undefined;
  try {
    const headerStore = await headers();
    const host = (headerStore.get('x-forwarded-host') || headerStore.get('host') || '').split(':')[0];
    if (host.endsWith('.pzoneinternational.com')) {
      cookieDomain = '.pzoneinternational.com';
    }
  } catch {
    // Ignore outside request headers context
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: SUPABASE_SCHEMA },
      ...(cookieDomain
        ? {
            cookieOptions: {
              domain: cookieDomain,
              path: '/',
              sameSite: 'lax' as const,
              secure: true,
            },
          }
        : {}),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                ...(cookieDomain ? { domain: cookieDomain } : {}),
              })
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}
