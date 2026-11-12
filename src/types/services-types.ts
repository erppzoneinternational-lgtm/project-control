import type { Mock } from 'vitest';
import type { supabase } from '@/lib/supabase';

/** Generic JSON-like row returned from Supabase when no generated type exists. */
export type DbRow = Record<string, unknown>;

/** Shape of an error-like value (Error or Supabase PostgrestError) used after catching `unknown`. */
export interface ErrorLike {
  message?: string;
  details?: string;
  code?: string;
}

/** Raw shape of a chainable mock builder literal (every member is a vi.fn). */
export type MockBuilderShape = Record<string, Mock>;

/** Mock builder usable wherever a real Supabase query builder is expected. */
export type MockQueryBuilder = MockBuilderShape & ReturnType<typeof supabase.from>;

/** Extract a message from an unknown caught value. */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

/** Window augmented with the optional atsmatrix visualizer hook. */
export type WindowWithAtsmatrix = Window & { atsmatrixEmit?: (event: unknown) => void };

/** BOQ item shape joined onto daily progress lines in weekly report aggregation. */
export interface WeeklyBoqItem {
  id: string;
  item_code: string;
  description_ar: string;
  unit: string;
  contract_qty: number;
  rate_egp: number;
}

/** Progress allocation row with nested line -> daily progress date, as read by the S-curve builder. */
export interface WeeklyAllocationRow {
  allocated_qty: number | null;
  snapshot_rate_egp: number | null;
  created_at: string | null;
  line?: { daily_progress?: { progress_date?: string } | null } | null;
}
