/**
 * Re-export for backward compatibility.
 * New code should use:
 *   - createSupabaseBrowserClient()  from '@/lib/supabase/client'
 *   - createSupabaseServerClient()   from '@/lib/supabase/server'
 *
 * This file provides the old `supabase` singleton for existing client components
 * that haven't been migrated yet.
 */
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export const supabase = createSupabaseBrowserClient();
