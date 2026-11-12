/**
 * Schedule compression («ضغط الجدول») — pure planning logic.
 *
 * Spec: specs/001-schedule-compression/spec.md (FR1, FR2, FR4).
 * No supabase / IO here — the Gantt orchestrator owns preview UI, confirmation
 * and batch writes (FR3/FR4). These functions are deterministic and pure so
 * they can be unit-tested and reused by any caller.
 *
 * Core invariant (owner decision 2026-08-26): pull-EARLIER only. A proposal
 * never moves an activity to a later date, therefore overlapping chains are
 * left untouched by compression (closing an overlap would require pushing a
 * successor later, which v1 forbids) — overlaps are surfaced by detectGaps()
 * instead (FR1 toast).
 *
 * Dates: `Date` objects in, `Date` objects out. All math is done on whole
 * calendar-day numbers derived from each timestamp's LOCAL calendar day, so
 * DST transitions cannot skew day counts. Returned dates are anchored at
 * local midnight of the computed calendar day.
 */

/** Activity shape consumed by the compression engine (subset of pm_project_activities). */
export interface CompressionActivity {
  /** Row id (pm_project_activities.id). */
  id: string;
  /** Planned start. Any time-of-day is accepted; only its calendar day matters. */
  start: Date;
  /** Planned finish (inclusive calendar day). */
  finish: Date;
  /** True for zero-duration milestone rows (FR4). */
  is_milestone: boolean;
  /** Optional progress fraction; > 0 flags the row «بدأ تنفيذ» (started). */
  percent_complete?: number;
}

/**
 * A gap or overlap between two consecutive activities in date order.
 *
 * `afterId` is the EARLIER activity (the gap/overlap comes after it);
 * `beforeId` is the LATER one (it comes before it).
 */
export interface GapInfo {
  afterId: string;
  beforeId: string;
  /**
   * Signed size in calendar days. > 0 = idle gap days between the pair,
   * < 0 = overlap days. Zero (perfectly chained pairs) is not reported.
   * A milestone successor's alignment target is the predecessor's finish day
   * itself; every other successor targets finish + 1 day.
   */
  gapDays: number;
}

/** One activity that compression would move (a row of the FR2 preview table). */
export interface CompressionChange {
  id: string;
  oldStart: Date;
  oldFinish: Date;
  newStart: Date;
  newFinish: Date;
  /** True when percent_complete > 0 — still compressible, flagged «بدأ تنفيذ». */
  started: boolean;
}

/** Result of a compression pass over a set of activities. */
export interface CompressionPlan {
  /** Only activities whose dates would actually change; untouched rows are excluded. */
  changes: CompressionChange[];
  /** Total days saved = Σ(oldStart − newStart) across all changes. */
  daysSaved: number;
}

const MS_PER_DAY = 86_400_000;

/** Whole-day number for a timestamp's LOCAL calendar day (DST-safe). */
function dayNumber(d: Date): number {
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / MS_PER_DAY);
}

/** Local-midnight Date for a whole-day number produced by dayNumber(). */
function fromDayNumber(n: number): Date {
  const utc = new Date(n * MS_PER_DAY);
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
}

/** Copy sorted by planned_start (ties: finish, then id) without mutating input. */
function sortByStart<T extends CompressionActivity>(acts: T[]): T[] {
  return [...acts].sort((a, b) => {
    const byStart = dayNumber(a.start) - dayNumber(b.start);
    if (byStart !== 0) return byStart;
    const byFinish = dayNumber(a.finish) - dayNumber(b.finish);
    if (byFinish !== 0) return byFinish;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/**
 * FR1 — detect gaps AND overlaps between date-ordered consecutive activities.
 *
 * Sorts internally by planned_start (input order and contents are not
 * mutated), then walks consecutive pairs. A pair is aligned — and therefore
 * not reported — when the later activity starts exactly on its target:
 * predecessor finish + 1 day, or the predecessor finish day itself for
 * milestone successors. Positive gapDays = gap to compress; negative =
 * overlap.
 */
export function detectGaps(acts: CompressionActivity[]): GapInfo[] {
  const sorted = sortByStart(acts);
  const gaps: GapInfo[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    const alignedOn = dayNumber(prev.finish) + (cur.is_milestone ? 0 : 1);
    const gapDays = dayNumber(cur.start) - alignedOn;
    if (gapDays !== 0) {
      gaps.push({ afterId: prev.id, beforeId: cur.id, gapDays });
    }
  }
  return gaps;
}

/**
 * FR2 — compute the compression plan for a set of activities.
 *
 * Deterministic v1 rule, walking the chain in date order:
 * - Non-milestone: candidate start = previous activity's NEW finish + 1 day.
 *   A move is proposed only when that candidate is EARLIER than the
 *   activity's own start (pull-earlier-only); an overlapping successor keeps
 *   its own dates because honoring it would push it later, which v1 forbids.
 *   Equivalent closed form: newStart = min(candidateStart, ownStart).
 * - Milestone: snaps onto the previous activity's new finish day (no +1),
 *   again only if that is earlier; duration stays zero (FR4), even for
 *   malformed milestone rows whose stored finish > start.
 * - Duration (finish − start in days) is preserved on every other row.
 * - The first activity of an unscoped walk has nothing to pull toward and is
 *   never moved. Untouched activities are excluded from `changes`.
 *
 * @param opts.fromId scope compression "from a chosen activity onward": the
 *   walk starts AT that activity (it may move), seeded with the ORIGINAL
 *   finish of its sorted predecessor, which stays untouched. Unknown ids
 *   throw. Omit to compress the whole project.
 */
export function computeCompression(
  acts: CompressionActivity[],
  opts: { fromId?: string } = {}
): CompressionPlan {
  const sorted = sortByStart(acts);

  let beginIndex = 0;
  if (opts.fromId !== undefined) {
    beginIndex = sorted.findIndex((a) => a.id === opts.fromId);
    if (beginIndex === -1) {
      throw new Error(`computeCompression: fromId "${opts.fromId}" not found`);
    }
  }

  // Cursor = finish day of the most recently processed activity's NEW dates.
  // Seeded from the scoped chain's untouched predecessor when fromId is used.
  let cursorFinish: number | null = beginIndex > 0 ? dayNumber(sorted[beginIndex - 1].finish) : null;

  const changes: CompressionChange[] = [];
  let daysSaved = 0;

  for (let i = beginIndex; i < sorted.length; i++) {
    const act = sorted[i];
    const oldStartN = dayNumber(act.start);
    const oldFinishN = dayNumber(act.finish);

    if (cursorFinish === null) {
      cursorFinish = oldFinishN; // very first activity of the whole project
      continue;
    }

    const earliestStartN = cursorFinish + (act.is_milestone ? 0 : 1);
    const newStartN = Math.min(earliestStartN, oldStartN); // never pushes later
    const newFinishN = act.is_milestone ? newStartN : newStartN + (oldFinishN - oldStartN);

    if (newStartN !== oldStartN || newFinishN !== oldFinishN) {
      changes.push({
        id: act.id,
        oldStart: fromDayNumber(oldStartN),
        oldFinish: fromDayNumber(oldFinishN),
        newStart: fromDayNumber(newStartN),
        newFinish: fromDayNumber(newFinishN),
        started: (act.percent_complete ?? 0) > 0,
      });
      daysSaved += oldStartN - newStartN;
    }

    cursorFinish = newFinishN;
  }

  return { changes, daysSaved };
}
