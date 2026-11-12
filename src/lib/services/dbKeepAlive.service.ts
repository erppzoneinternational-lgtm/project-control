import type { ErrorLike } from '@/types/services-types';
import { supabase } from '@/lib/supabase';

export interface KeepAliveResult {
  ok: boolean;
  latencyMs: number;
  timestamp: string;
  error?: string;
}

export class DbKeepAliveService {
  /**
   * Ping the Supabase database with a lightweight query to keep the instance active.
   */
  static async pingDatabase(): Promise<KeepAliveResult> {
    const start = performance.now();
    try {
      // Lightweight query on a fast indexed table
      const { error } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);

      const latencyMs = Math.round(performance.now() - start);

      if (error) {
        return {
          ok: false,
          latencyMs,
          timestamp: new Date().toISOString(),
          error: error.message,
        };
      }

      return {
        ok: true,
        latencyMs,
        timestamp: new Date().toISOString(),
      };
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        ok: false,
        latencyMs,
        timestamp: new Date().toISOString(),
        error: (err as ErrorLike)?.message || 'Unknown database connection error',
      };
    }
  }
}
