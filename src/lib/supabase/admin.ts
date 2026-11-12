import { createClient } from '@supabase/supabase-js';

const SUPABASE_SCHEMA = (process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public') as 'public';

/**
 * Privileged Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * ONLY use in Server Route Handlers or Server Actions.
 * Never expose this client or the service role key to the browser.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing from environment variables');
  }
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing from environment variables');
  }

  return createClient(url, key, {
    db: { schema: SUPABASE_SCHEMA },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
