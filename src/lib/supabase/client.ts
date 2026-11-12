import { createBrowserClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_SCHEMA = (process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public') as 'public';

function getSharedCookieOptions() {
  if (
    typeof window !== 'undefined' &&
    window.location.hostname.endsWith('.pzoneinternational.com')
  ) {
    return {
      domain: '.pzoneinternational.com',
      path: '/',
      sameSite: 'lax' as const,
      secure: true,
    };
  }
  return undefined;
}

/**
 * Browser (client-side) Supabase client.
 * Use in 'use client' components.
 */
export function createSupabaseBrowserClient() {
  const cookieOptions = getSharedCookieOptions();
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: SUPABASE_SCHEMA },
      ...(cookieOptions ? { cookieOptions } : {}),
    }
  );
}

let cachedHrDbClient: { cacheKey: string; client: SupabaseClient } | null = null;

/**
 * Read-only client for the company HR/Auth database.
 * This is a SEPARATE Supabase project used as the canonical employee registry.
 * NEVER write to this database — treat it as read-only.
 *
 * Uses standalone `@supabase/supabase-js` `createClient` with session persistence
 * disabled so it NEVER collides with `@supabase/ssr`'s global `cachedBrowserClient`
 * singleton (which belongs exclusively to the main Pzone ERP project).
 */
export function createHrDbClient() {
  const url =
    process.env.NEXT_PUBLIC_HR_SUPABASE_URL ||
    process.env.VITE_AUTH_SUPABASE_URL ||
    'https://ftmguacqywsucjhjiacn.supabase.co';
  const key =
    process.env.NEXT_PUBLIC_HR_SUPABASE_ANON_KEY ||
    process.env.VITE_AUTH_SUPABASE_ANON_KEY ||
    'sb_publishable_wA0JjYAnQc4eeAkFR8kkYQ_Sg8dNbWE';

  const cacheKey = `${url}::${key}`;
  if (cachedHrDbClient && cachedHrDbClient.cacheKey === cacheKey) {
    return cachedHrDbClient.client;
  }

  const client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  cachedHrDbClient = { cacheKey, client };
  return client;
}
