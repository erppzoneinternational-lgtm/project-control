/**
 * Africa/Cairo timezone utilities for accurate Egyptian construction operations (D10, P20).
 */

const CAIRO_TZ = 'Africa/Cairo';

/**
 * Returns today's date in Africa/Cairo as YYYY-MM-DD string.
 */
export function todayCairo(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: CAIRO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Returns current Date object for Africa/Cairo context.
 */
export function nowCairo(): Date {
  const cairoString = new Date().toLocaleString('en-US', { timeZone: CAIRO_TZ });
  return new Date(cairoString);
}

/**
 * Returns current date/time string formatted in Cairo timezone.
 */
export function nowCairoString(): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: CAIRO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());
}

/**
 * Calculates elapsed hours from a given timestamp to now.
 * Returns Infinity if timestamp is invalid or null.
 */
export function hoursSince(timestamp: string | number | Date | null | undefined): number {
  if (!timestamp) return Infinity;
  const time = typeof timestamp === 'object' && timestamp instanceof Date 
    ? timestamp.getTime() 
    : new Date(timestamp).getTime();
  if (isNaN(time)) return Infinity;
  const elapsedMs = Date.now() - time;
  return elapsedMs / (1000 * 60 * 60);
}

/**
 * Determines whether a site is "silent" (last daily log or report older than threshold, default 48h).
 */
export function isSilentSite(lastReportDate: string | number | Date | null | undefined, thresholdHours = 48): boolean {
  if (!lastReportDate) return true;
  return hoursSince(lastReportDate) > thresholdHours;
}
