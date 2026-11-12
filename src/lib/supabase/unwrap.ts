/**
 * Supabase query unwrap & verification helpers.
 * Prevents silent error swallowing and enforces visibility on DB failures.
 */

export interface PostgrestErrorLike {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
}

/**
 * Unwraps a Supabase response. Throws a contextual Error if error is present.
 * If data is null and no error, returns empty array or null depending on context.
 */
export function unwrap<T>(
  res: { data: T | null; error: PostgrestErrorLike | null },
  ctx: string
): T {
  if (res.error) {
    const errorMsg =
      res.error.message || res.error.details || res.error.hint || 'Database operation failed';
    throw new Error(`${ctx}: ${errorMsg}`);
  }
  return (res.data ?? ([] as unknown as T));
}

/**
 * Asserts that a mutation (update/delete/archive) actually affected at least one row.
 * Throws a permission/not-found error if 0 rows were returned.
 */
export function assertRows<T>(rows: T[] | null | undefined, ctx: string): T[] {
  if (!rows || rows.length === 0) {
    throw new Error(`${ctx}: no rows changed (permission?)`);
  }
  return rows;
}
