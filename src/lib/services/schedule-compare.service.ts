'use client';

/**
 * ScheduleCompareService — two-version schedule comparison.
 *
 * Diffs the activity sets of two pm_schedule_versions rows of the SAME
 * project, keyed by activity code (activity_code ?? code):
 *
 *   added     — exists in target only
 *   removed   — exists in base only
 *   shifted   — present in both, planned start and/or finish moved
 *               (calendar-day deltas reported per edge)
 *   unchanged — present in both, identical dates
 *
 * `diffActivitySets` is pure (no Supabase) so it is unit-testable; the
 * service wraps it with loaders that read stamped activities per version.
 */

import { supabase } from '@/lib/supabase';
import type { ScheduleVersion } from './schedule-version.service';

/* ── Types ─────────────────────────────────────────────────────────── */

export interface CompareActivity {
  /** Canonical activity key: activity_code, falling back to code. */
  code: string;
  name: string;
  /** ISO date strings (yyyy-mm-dd) as stored in the date columns. */
  start: string | null;
  finish: string | null;
}

export type DiffKind = 'added' | 'removed' | 'shifted' | 'unchanged';

export interface ActivityDiffRow {
  code: string;
  name: string;
  kind: DiffKind;
  baseStart: string | null;
  baseFinish: string | null;
  targetStart: string | null;
  targetFinish: string | null;
  /** Calendar days the start moved (target − base); null when either side missing or unchanged-kind. */
  startShiftDays: number | null;
  /** Calendar days the finish moved (target − base). */
  finishShiftDays: number | null;
}

export interface CompareSummary {
  totalBase: number;
  totalTarget: number;
  added: number;
  removed: number;
  shifted: number;
  unchanged: number;
  /** Worst finish slip among shifted rows (+ = later), for the header glance. */
  maxFinishSlipDays: number | null;
}

export interface CompareResult {
  base: ScheduleVersion | null;
  target: ScheduleVersion | null;
  summary: CompareSummary;
  rows: ActivityDiffRow[];
}

/* ── Pure diff engine ──────────────────────────────────────────────── */

/** Calendar-day delta between two yyyy-mm-dd strings (UTC-safe, DST-proof). */
export function dayDelta(from: string | null, to: string | null): number | null {
  if (!from || !to) return null;
  const a = new Date(`${from.slice(0, 10)}T00:00:00Z`).getTime();
  const b = new Date(`${to.slice(0, 10)}T00:00:00Z`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86400000);
}

function normalize(rows: CompareActivity[]): Map<string, CompareActivity> {
  const map = new Map<string, CompareActivity>();
  for (const r of rows || []) {
    const code = String(r?.code ?? '').trim();
    if (!code || map.has(code)) continue; // first occurrence wins on duplicate codes
    map.set(code, { ...r, code });
  }
  return map;
}

export function emptySummary(): CompareSummary {
  return { totalBase: 0, totalTarget: 0, added: 0, removed: 0, shifted: 0, unchanged: 0, maxFinishSlipDays: null };
}

/**
 * Diff two activity sets keyed by code.
 * Rows come back sorted: added, removed, then shifted/unchanged by code.
 */
export function diffActivitySets(baseRows: CompareActivity[], targetRows: CompareActivity[]): { rows: ActivityDiffRow[]; summary: CompareSummary } {
  const base = normalize(baseRows);
  const target = normalize(targetRows);
  const rows: ActivityDiffRow[] = [];
  const summary = emptySummary();
  summary.totalBase = base.size;
  summary.totalTarget = target.size;

  let maxFinishSlip: number | null = null;

  // added / changed
  target.forEach((t, code) => {
    const b = base.get(code);
    if (!b) {
      rows.push({
        code, name: t.name, kind: 'added',
        baseStart: null, baseFinish: null,
        targetStart: t.start, targetFinish: t.finish,
        startShiftDays: null, finishShiftDays: null,
      });
      summary.added += 1;
      return;
    }
    const ss = dayDelta(b.start, t.start);
    const fs = dayDelta(b.finish, t.finish);
    const moved = (b.start !== t.start) || (b.finish !== t.finish);
    if (moved) {
      rows.push({
        code, name: t.name, kind: 'shifted',
        baseStart: b.start, baseFinish: b.finish,
        targetStart: t.start, targetFinish: t.finish,
        startShiftDays: ss, finishShiftDays: fs,
      });
      summary.shifted += 1;
      if (fs != null && (maxFinishSlip == null || fs > maxFinishSlip)) maxFinishSlip = fs;
    } else {
      rows.push({
        code, name: t.name, kind: 'unchanged',
        baseStart: b.start, baseFinish: b.finish,
        targetStart: t.start, targetFinish: t.finish,
        startShiftDays: null, finishShiftDays: null,
      });
      summary.unchanged += 1;
    }
  });

  // removed
  base.forEach((b, code) => {
    if (target.has(code)) return;
    rows.push({
      code, name: b.name, kind: 'removed',
      baseStart: b.start, baseFinish: b.finish,
      targetStart: null, targetFinish: null,
      startShiftDays: null, finishShiftDays: null,
    });
    summary.removed += 1;
  });

  const rank: Record<DiffKind, number> = { added: 0, removed: 1, shifted: 2, unchanged: 3 };
  rows.sort((x, y) => rank[x.kind] - rank[y.kind] || x.code.localeCompare(y.code));
  summary.maxFinishSlipDays = maxFinishSlip;
  return { rows, summary };
}

/* ── Supabase loaders ──────────────────────────────────────────────── */

export const ScheduleCompareService = {
  /** Activities stamped with a given schedule version (active only). */
  async loadVersionActivities(versionId: string): Promise<CompareActivity[]> {
    if (!versionId) return [];
    const { data, error } = await supabase
      .from('pm_project_activities')
      .select('code, activity_code, name_ar, planned_start, planned_finish')
      .eq('schedule_version_id', versionId)
      .eq('is_active', true)
      .order('planned_start', { ascending: true })
      .limit(5000);
    if (error) throw new Error(error.message);
    return (data || []).map((a) => ({
      code: String(a.activity_code || a.code || '').trim(),
      name: a.name_ar || 'نشط',
      start: a.planned_start ? String(a.planned_start).slice(0, 10) : null,
      finish: a.planned_finish ? String(a.planned_finish).slice(0, 10) : null,
    }));
  },

  /**
   * Full compare of two versions of the same project.
   * Returns null when either id is missing or both point at the same row.
   */
  async compareVersions(projectId: string, baseVersionId: string, targetVersionId: string): Promise<CompareResult | null> {
    if (!projectId || !baseVersionId || !targetVersionId || baseVersionId === targetVersionId) return null;

    const { data: vers, error } = await supabase
      .from('pm_schedule_versions')
      .select('*')
      .eq('project_id', projectId)
      .in('id', [baseVersionId, targetVersionId]);
    if (error) throw new Error(error.message);
    const list = (vers || []) as ScheduleVersion[];
    const base = list.find((v) => v.id === baseVersionId) ?? null;
    const target = list.find((v) => v.id === targetVersionId) ?? null;
    if (!base || !target) return null;

    const [baseRows, targetRows] = await Promise.all([
      this.loadVersionActivities(baseVersionId),
      this.loadVersionActivities(targetVersionId),
    ]);
    const { rows, summary } = diffActivitySets(baseRows, targetRows);
    return { base, target, summary, rows };
  },
};
