import type { ErrorLike } from '@/types/services-types';
/**
 * Weekly report generation wrapper — the single entry point the UI calls.
 *
 * Responsibilities (kept out of the raw service so the service stays a thin data layer):
 *  1. Duplicate guard — check-before-call for the same (project, week_start); the table's
 *     UNIQUE(project_id, week_start) constraint is only a backstop.
 *  2. Version binding — prefer the APPROVED schedule version; fall back to the latest
 *     available one and flag it so the UI can show 'لا توجد نسخة معتمدة بعد — تم استخدام آخر نسخة'.
 *  3. Friendly errors — maps the typed empty-data error and DB failures to Arabic messages
 *     instead of letting the UI crash.
 */

import { supabase } from '@/lib/supabase';
import {
  WeeklyReportService,
  WeeklyReportEmptyError,
} from '@/lib/services/weeklyReport.service';
import type { ScheduleVersion } from '@/lib/services/schedule-version.service';
import type { WeeklyReport } from '@/types/planning';

export interface WeeklyGenerationParams {
  projectId: string;
  /** YYYY-MM-DD */
  weekStart: string;
  /** YYYY-MM-DD (typically weekStart + 6 days) */
  weekEnd: string;
  generatedBy?: string | null;
}

export type WeeklyGenerationResult =
  | {
      status: 'created';
      report: WeeklyReport;
      versionUsed: ScheduleVersion | null;
      usedFallbackVersion: boolean;
    }
  | { status: 'duplicate'; existing: WeeklyReport }
  | { status: 'empty'; messageAr: string }
  | { status: 'error'; messageAr: string };

const GENERIC_ERROR_AR = 'تعذر توليد التقرير الأسبوعي — حاول مرة أخرى';

async function findExistingReport(
  projectId: string,
  weekStart: string
): Promise<WeeklyReport | null> {
  const { data, error } = await supabase
    .from('pm_weekly_reports')
    .select('*')
    .eq('project_id', projectId)
    .eq('week_start', weekStart)
    .limit(1);

  if (error) return null;
  return (data?.[0] as WeeklyReport) ?? null;
}

export async function runWeeklyReportGeneration(
  params: WeeklyGenerationParams
): Promise<WeeklyGenerationResult> {
  const { projectId, weekStart, weekEnd, generatedBy } = params;

  if (!projectId) {
    return { status: 'error', messageAr: 'اختر مشروعاً أولاً' };
  }
  if (!weekStart || !weekEnd || new Date(weekEnd) < new Date(weekStart)) {
    return { status: 'error', messageAr: 'فترة الأسبوع غير صالحة — تأكد من تاريخي البداية والنهاية' };
  }

  // 1. Duplicate guard (check-before-call).
  try {
    const existing = await findExistingReport(projectId, weekStart);
    if (existing) return { status: 'duplicate', existing };
  } catch {
    // Non-fatal: proceed and rely on the UNIQUE-constraint backstop below.
  }

  // 2. Version binding: approved first, else latest available.
  let versionUsed: ScheduleVersion | null = null;
  let usedFallbackVersion = false;
  try {
    const resolution = await WeeklyReportService.resolveReportingVersion(projectId);
    versionUsed = resolution.version;
    usedFallbackVersion = resolution.usedFallback;
  } catch {
    // Binding is best-effort — never block report generation on it.
  }

  const versionRef = versionUsed
    ? {
        id: versionUsed.id,
        version_no: versionUsed.version_no,
        version_type: versionUsed.version_type,
        status: versionUsed.status,
        data_date: versionUsed.data_date ?? null,
      }
    : null;

  // 3. Generate.
  try {
    const report = await WeeklyReportService.generateWeeklyReport(
      projectId,
      weekStart,
      weekEnd,
      generatedBy ?? undefined,
      { scheduleVersion: versionRef }
    );

    if (!report) return { status: 'error', messageAr: GENERIC_ERROR_AR };

    return { status: 'created', report, versionUsed, usedFallbackVersion };
  } catch (err) {
    if (err instanceof WeeklyReportEmptyError) {
      return { status: 'empty', messageAr: err.messageAr };
    }

    // UNIQUE-violation race (another tab generated it meanwhile).
    if ((err as ErrorLike)?.code === '23505') {
      const existing = await findExistingReport(projectId, weekStart).catch(() => null);
      if (existing) return { status: 'duplicate', existing };
    }

    if (process.env.NODE_ENV !== 'production') {
      console.warn('[runWeeklyReportGeneration] failed:', err);
    }
    return { status: 'error', messageAr: GENERIC_ERROR_AR };
  }
}

/** Local-timezone-safe YYYY-MM-DD formatting (avoids toISOString UTC shifts). */
function fmtLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** weekEnd = weekStart + 6 days. */
export function computeWeekEnd(weekStart: string): string {
  const d = new Date(`${weekStart}T00:00:00`);
  d.setDate(d.getDate() + 6);
  return fmtLocalDate(d);
}

/** Most recent (≤ today) week start for the given JS day-of-week (default 6 = Saturday). */
export function mostRecentWeekStart(dayOfWeek = 6, now: Date = new Date()): string {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  while (d.getDay() !== dayOfWeek) d.setDate(d.getDate() - 1);
  return fmtLocalDate(d);
}
