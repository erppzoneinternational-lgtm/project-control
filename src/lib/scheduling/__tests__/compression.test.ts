/**
 * Unit tests for schedule-compression pure logic (specs/001-schedule-compression).
 * Covers FR1 gap detection and FR2/FR4 compression rules: pull-earlier-only,
 * cascade, milestone snapping, fromId scoping, daysSaved math, started flag.
 */
import { describe, expect, it } from 'vitest';
import { computeCompression, detectGaps } from '../compression';
import type { CompressionActivity } from '../compression';

/** Local-calendar-midnight Date from 'YYYY-MM-DD' (avoids ISO UTC parsing pitfalls). */
const d = (iso: string): Date => {
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, m - 1, day);
};

const jan = (day: number): Date => new Date(2026, 0, day);

const act = (
  id: string,
  start: string,
  finish: string,
  extra: Partial<CompressionActivity> = {}
): CompressionActivity => ({ id, start: d(start), finish: d(finish), is_milestone: false, ...extra });

const sameDay = (a: Date | undefined, b: Date) =>
  expect(a?.getTime()).toBe(b.getTime());

describe('detectGaps', () => {
  it('flags an idle gap between consecutive activities', () => {
    const gaps = detectGaps([
      act('A', '2026-01-01', '2026-01-05'),
      act('B', '2026-01-10', '2026-01-12'),
    ]);
    expect(gaps).toEqual([{ afterId: 'A', beforeId: 'B', gapDays: 4 }]);
  });

  it('ignores a perfectly chained pair (start = finish + 1 day)', () => {
    const gaps = detectGaps([
      act('A', '2026-01-01', '2026-01-05'),
      act('B', '2026-01-06', '2026-01-08'),
    ]);
    expect(gaps).toEqual([]);
  });

  it('reports overlaps as negative gapDays', () => {
    const gaps = detectGaps([
      act('A', '2026-01-01', '2026-01-05'),
      act('B', '2026-01-04', '2026-01-08'),
    ]);
    expect(gaps).toEqual([{ afterId: 'A', beforeId: 'B', gapDays: -2 }]);
  });

  it('emits one entry per broken pair, in chain order', () => {
    const gaps = detectGaps([
      act('A', '2026-01-01', '2026-01-02'),
      act('B', '2026-01-06', '2026-01-08'), // gap 3 after A
      act('C', '2026-01-07', '2026-01-09'), // overlap 2 with B
    ]);
    expect(gaps).toEqual([
      { afterId: 'A', beforeId: 'B', gapDays: 3 },
      { afterId: 'B', beforeId: 'C', gapDays: -2 },
    ]);
  });

  it('aligns milestone successors against the predecessor finish day itself', () => {
    const base = act('A', '2026-01-01', '2026-01-05');
    expect(detectGaps([base, act('M', '2026-01-05', '2026-01-05', { is_milestone: true })])).toEqual([]);
    expect(detectGaps([base, act('M', '2026-01-07', '2026-01-07', { is_milestone: true })])).toEqual([
      { afterId: 'A', beforeId: 'M', gapDays: 2 },
    ]);
    expect(detectGaps([base, act('M', '2026-01-03', '2026-01-03', { is_milestone: true })])).toEqual([
      { afterId: 'A', beforeId: 'M', gapDays: -2 },
    ]);
  });

  it('sorts internally and never mutates the input array', () => {
    const input = [
      act('B', '2026-01-10', '2026-01-12'),
      act('A', '2026-01-01', '2026-01-05'),
    ];
    const gaps = detectGaps(input);
    expect(gaps.map((g) => g.afterId)).toEqual(['A']);
    expect(input.map((a) => a.id)).toEqual(['B', 'A']); // order preserved
  });

  it('handles empty and single-activity inputs', () => {
    expect(detectGaps([])).toEqual([]);
    expect(detectGaps([act('only', '2026-01-01', '2026-01-02')])).toEqual([]);
  });
});

describe('computeCompression — pull-earlier-only', () => {
  it('closes a trailing gap by pulling the successor to finish + 1 day', () => {
    const plan = computeCompression([
      act('A', '2026-01-01', '2026-01-05'),
      act('B', '2026-01-10', '2026-01-12'),
    ]);
    expect(plan.changes.map((c) => c.id)).toEqual(['B']);
    sameDay(plan.changes[0].oldStart, d('2026-01-10'));
    sameDay(plan.changes[0].newStart, d('2026-01-06'));
    sameDay(plan.changes[0].newFinish, d('2026-01-08'));
    expect(plan.daysSaved).toBe(4);
  });

  it('cascades the shift through the whole chain', () => {
    const plan = computeCompression([
      act('A', '2026-01-01', '2026-01-05'),
      act('B', '2026-01-10', '2026-01-14'), // pulled 4 -> Jan 6..Jan 10
      act('C', '2026-01-20', '2026-01-22'), // pulled 9 -> Jan 11..Jan 13
    ]);
    expect(plan.changes.map((c) => [c.id, c.newStart.getTime()])).toEqual([
      ['B', d('2026-01-06').getTime()],
      ['C', d('2026-01-11').getTime()],
    ]);
    const dayMs = 86_400_000;
    expect(plan.changes.map((c) => (c.oldStart.getTime() - c.newStart.getTime()) / dayMs)).toEqual([
      4,
      9,
    ]);
    expect(plan.daysSaved).toBe(13); // sum of per-activity shifts
  });

  it('never pushes an overlapping activity later', () => {
    const plan = computeCompression([
      act('A', '2026-01-01', '2026-01-10'),
      act('B', '2026-01-05', '2026-01-08'), // starts before A finishes: keep as-is
    ]);
    expect(plan.changes).toEqual([]);
    expect(plan.daysSaved).toBe(0);
  });

  it('leaves an already-flush chain and the first activity untouched', () => {
    const acts = [
      act('A', '2026-01-01', '2026-01-03'),
      act('B', '2026-01-04', '2026-01-06'),
      act('C', '2026-01-07', '2026-01-07'),
    ];
    const plan = computeCompression(acts);
    expect(plan.changes).toEqual([]);
    expect(plan.daysSaved).toBe(0);
  });

  it('preserves duration on every change', () => {
    const acts = [
      act('A', '2026-01-01', '2026-01-02'),
      act('B', '2026-01-08', '2026-01-14'), // 7 days
      act('C', '2026-02-01', '2026-02-01'), // 1 day
    ];
    for (const c of computeCompression(acts).changes) {
      const oldDur = c.oldFinish.getTime() - c.oldStart.getTime();
      const newDur = c.newFinish.getTime() - c.newStart.getTime();
      expect(newDur).toBe(oldDur);
    }
  });

  it('is invariant: no change ever moves a row later', () => {
    const acts = [
      act('A', '2026-01-01', '2026-01-10'),
      act('B', '2026-01-05', '2026-01-20'), // overlaps A
      act('C', '2026-02-01', '2026-02-03'), // big gap
      act('M', '2026-02-20', '2026-02-20', { is_milestone: true }),
    ];
    for (const c of computeCompression(acts).changes) {
      expect(c.newStart.getTime()).toBeLessThanOrEqual(c.oldStart.getTime());
      expect(c.newFinish.getTime()).toBeLessThanOrEqual(c.oldFinish.getTime());
    }
  });

  it('produces identical plans regardless of input order', () => {
    const ordered = [
      act('A', '2026-01-01', '2026-01-05'),
      act('B', '2026-01-10', '2026-01-12'),
    ];
    const shuffled = [ordered[1], ordered[0]];
    expect(computeCompression(shuffled)).toEqual(computeCompression(ordered));
  });
});

describe('computeCompression — milestones', () => {
  it('snaps a milestone onto the predecessor finish day (zero duration)', () => {
    const plan = computeCompression([
      act('A', '2026-01-01', '2026-01-05'),
      act('M', '2026-01-09', '2026-01-09', { is_milestone: true }),
    ]);
    expect(plan.changes.map((c) => c.id)).toEqual(['M']);
    sameDay(plan.changes[0].newStart, d('2026-01-05'));
    sameDay(plan.changes[0].newFinish, d('2026-01-05'));
    expect(plan.daysSaved).toBe(4);
  });

  it('keeps a milestone already sitting on the finish day untouched', () => {
    const plan = computeCompression([
      act('A', '2026-01-01', '2026-01-05'),
      act('M', '2026-01-05', '2026-01-05', { is_milestone: true }),
    ]);
    expect(plan.changes).toEqual([]);
  });

  it('does not push a milestone that starts earlier than the finish day', () => {
    const plan = computeCompression([
      act('A', '2026-01-01', '2026-01-10'),
      act('M', '2026-01-04', '2026-01-04', { is_milestone: true }),
    ]);
    expect(plan.changes).toEqual([]);
  });

  it('forces zero duration even on malformed milestone rows (FR4)', () => {
    const plan = computeCompression([
      act('A', '2026-01-01', '2026-01-05'),
      act('M', '2026-01-09', '2026-01-11', { is_milestone: true }), // bad 3-day span
    ]);
    expect(plan.changes.map((c) => c.id)).toEqual(['M']);
    expect(plan.changes[0].newStart.getTime()).toBe(plan.changes[0].newFinish.getTime());
    sameDay(plan.changes[0].newFinish, d('2026-01-05'));
  });

  it('collapses a milestone chain onto the first snap day', () => {
    const plan = computeCompression([
      act('A', '2026-01-01', '2026-01-05'),
      act('M1', '2026-01-08', '2026-01-08', { is_milestone: true }),
      act('M2', '2026-01-12', '2026-01-12', { is_milestone: true }),
    ]);
    expect(plan.changes.map((c) => c.newStart.getTime())).toEqual([
      d('2026-01-05').getTime(),
      d('2026-01-05').getTime(),
    ]);
    expect(plan.daysSaved).toBe(10); // 3 + 7
  });
});

describe('computeCompression — fromId scoping', () => {
  const acts = [
    act('A', '2026-01-01', '2026-01-02'),
    act('B', '2026-01-05', '2026-01-07'),
    act('C', '2026-01-10', '2026-01-10'),
  ];

  it('scopes changes from the chosen activity onward, seeding from its predecessor', () => {
    const plan = computeCompression(acts, { fromId: 'B' });
    expect(plan.changes.map((c) => c.id)).toEqual(['B', 'C']);
    sameDay(plan.changes[0].newStart, d('2026-01-03')); // A.finish + 1
    sameDay(plan.changes[1].newStart, d('2026-01-06')); // B.newFinish + 1
    expect(plan.daysSaved).toBe(6); // 2 + 4
  });

  it('ignores gaps strictly before the chosen activity', () => {
    const plan = computeCompression(acts, { fromId: 'C' });
    expect(plan.changes.map((c) => c.id)).toEqual(['C']);
    sameDay(plan.changes[0].newStart, d('2026-01-08'));
  });

  it('throws for an unknown fromId', () => {
    expect(() => computeCompression(acts, { fromId: 'nope' })).toThrow(/nope/);
  });

  it('never moves the first activity when scoping the whole project', () => {
    const plan = computeCompression(acts);
    expect(plan.changes.some((c) => c.id === 'A')).toBe(false);
    expect(plan.changes.map((c) => c.id)).toEqual(['B', 'C']);
  });
});

describe('computeCompression — started flag & misc', () => {
  const fixture = (percentComplete?: number) => [
    act('A', '2026-01-01', '2026-01-05'),
    act('B', '2026-01-10', '2026-01-12', { percent_complete: percentComplete }),
  ];

  it('flags percent_complete > 0 as «بدأ تنفيذ» (started)', () => {
    expect(computeCompression(fixture(50)).changes[0].started).toBe(true);
    expect(computeCompression(fixture(0.5)).changes[0].started).toBe(true);
  });

  it('treats 0% and missing percent_complete as not started', () => {
    expect(computeCompression(fixture(0)).changes[0].started).toBe(false);
    expect(computeCompression(fixture(undefined)).changes[0].started).toBe(false);
  });

  it('returns an empty plan for empty input', () => {
    expect(computeCompression([])).toEqual({ changes: [], daysSaved: 0 });
  });

  it('never mutates the input array or its Date objects', () => {
    const acts = [
      act('B', '2026-01-10', '2026-01-12', { percent_complete: 40 }),
      act('A', '2026-01-01', '2026-01-05'),
    ];
    const before = acts.map((a) => [a.id, a.start.getTime(), a.finish.getTime(), a.percent_complete]);
    computeCompression(acts);
    const after = acts.map((a) => [a.id, a.start.getTime(), a.finish.getTime(), a.percent_complete]);
    expect(after).toEqual(before);
  });

  it('compresses 2000 activities well under the 200ms budget (spec NFR)', () => {
    const big: CompressionActivity[] = [];
    let day = 1;
    for (let i = 0; i < 2000; i++) {
      if (i % 3 === 1) day += 5; // periodic idle gap to close
      const len = i % 17 === 0 ? 0 : (i % 5) + 1; // occasional milestone
      big.push({
        id: `act-${i}`,
        start: jan(day),
        finish: jan(day + len),
        is_milestone: len === 0,
        percent_complete: i % 9 === 0 ? 25 : 0,
      });
      day += len + 1;
    }
    const t0 = Date.now();
    const plan = computeCompression(big);
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeLessThan(200);
    expect(plan.changes.length).toBeGreaterThan(0);
    expect(plan.daysSaved).toBeGreaterThan(0);
    for (const c of plan.changes) {
      expect(c.newStart.getTime()).toBeLessThanOrEqual(c.oldStart.getTime());
    }
  });
});
