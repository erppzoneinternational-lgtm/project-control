import { createBrowserClient } from '@supabase/ssr';
import {
  SUPABASE_URL,
  SUPABASE_KEY,
  SUPABASE_SCHEMA,
  cookieOptions,
} from './config';

/**
 * Browser (client-side) Supabase client.
 * Use in 'use client' components.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY, {
    db: { schema: SUPABASE_SCHEMA as 'public' },
    cookieOptions,
  });
}
