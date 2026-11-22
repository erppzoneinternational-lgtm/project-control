import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  SUPABASE_URL,
  SUPABASE_KEY,
  SUPABASE_SCHEMA,
  cookieOptions,
} from './config';

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

  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    db: { schema: SUPABASE_SCHEMA as 'public' },
    cookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, {
              ...cookieOptions,
              ...options,
              domain: cookieOptions.domain,
            })
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing sessions.
        }
      },
    },
  });
}
