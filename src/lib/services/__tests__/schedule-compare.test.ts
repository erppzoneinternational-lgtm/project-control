/**
 * schedule-compare diff engine — unit tests on fixture rows.
 * Covers: ADDED / REMOVED / SHIFTED (start & finish day deltas) / UNCHANGED,
 * duplicate-code handling, code trimming, null-date edges, summary math.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }));

import {
  diffActivitySets,
  dayDelta,
  emptySummary,
  type CompareActivity,
} from '../schedule-compare.service';

const act = (code: string, name: string, start: string | null, finish: string | null): CompareActivity => ({
  code, name, start, finish,
});

describe('dayDelta', () => {
  it('computes calendar-day differences across month/year boundaries', () => {
    expect(dayDelta('2026-01-30', '2026-02-02')).toBe(3);
    expect(dayDelta('2025-12-31', '2026-01-01')).toBe(1);
    expect(dayDelta('2024-02-28', '2024-03-01')).toBe(2); // leap year
  });

  it('is negative when the target moves earlier', () => {
    expect(dayDelta('2026-05-10', '2026-05-03')).toBe(-7);
  });

  it('returns null when either side is missing or malformed', () => {
    expect(dayDelta(null, '2026-01-01')).toBeNull();
    expect(dayDelta('2026-01-01', null)).toBeNull();
    expect(dayDelta('not-a-date', '2026-01-01')).toBeNull();
  });
});

describe('diffActivitySets', () => {
  it('classifies added / removed / shifted / unchanged fixtures', () => {
    const base = [
      act('A1000', 'حفر', '2026-01-01', '2026-01-10'),   // will shift
      act('A2000', 'خرسانة', '2026-01-05', '2026-01-20'), // unchanged
      act('A3000', 'تسليح', '2026-02-01', '2026-02-15'), // removed
    ];
    const target = [
      act('A1000', 'حفر', '2026-01-06', '2026-01-15'),    // +5 / +5
      act('A2000', 'خرسانة', '2026-01-05', '2026-01-20'), // identical
      act('A4000', 'دهانات', '2026-03-01', '2026-03-10'), // added
    ];
    const { rows, summary } = diffActivitySets(base, target);

    expect(summary).toEqual({
      totalBase: 3,
      totalTarget: 3,
      added: 1,
      removed: 1,
      shifted: 1,
      unchanged: 1,
      maxFinishSlipDays: 5,
    });

    const byCode = Object.fromEntries(rows.map((r) => [r.code, r]));
    expect(byCode.A1000.kind).toBe('shifted');
    expect(byCode.A1000.startShiftDays).toBe(5);
    expect(byCode.A1000.finishShiftDays).toBe(5);
    expect(byCode.A2000.kind).toBe('unchanged');
    expect(byCode.A2000.startShiftDays).toBeNull();
    expect(byCode.A3000.kind).toBe('removed');
    expect(byCode.A3000.targetStart).toBeNull();
    expect(byCode.A4000.kind).toBe('added');
    expect(byCode.A4000.baseStart).toBeNull();
  });

  it('reports independent start/finish shifts in opposite directions', () => {
    const base = [act('S1', 'سابقة', '2026-04-01', '2026-04-30')];
    const target = [act('S1', 'سابقة', '2026-04-11', '2026-04-25')]; // start +10, finish −5
    const { rows, summary } = diffActivitySets(base, target);
    expect(rows[0].kind).toBe('shifted');
    expect(rows[0].startShiftDays).toBe(10);
    expect(rows[0].finishShiftDays).toBe(-5);
    expect(summary.shifted).toBe(1);
  });

  it('treats a null→date change as shifted with a null day count', () => {
    const base = [act('N1', 'بدون تواريخ', null, null)];
    const target = [act('N1', 'بدون تواريخ', '2026-06-01', '2026-06-10')];
    const { rows, summary } = diffActivitySets(base, target);
    expect(summary.shifted).toBe(1);
    expect(rows[0].kind).toBe('shifted');
    expect(rows[0].startShiftDays).toBeNull();
    expect(rows[0].targetStart).toBe('2026-06-01');
  });

  it('trims codes so padded duplicates still match', () => {
    const base = [act(' A100 ', 'مبطّنة', '2026-01-01', '2026-01-02')];
    const target = [act('A100', 'مبطّنة', '2026-01-01', '2026-01-02')];
    const { summary } = diffActivitySets(base, target);
    expect(summary).toMatchObject({ unchanged: 1, added: 0, removed: 0, shifted: 0 });
  });

  it('keeps only the first occurrence of a duplicated code inside one version', () => {
    const base = [
      act('DUP', 'الأولى', '2026-01-01', '2026-01-02'),
      act('DUP', 'الثانية', '2026-02-01', '2026-02-02'),
    ];
    const target = [act('DUP', 'الأولى', '2026-01-01', '2026-01-02')];
    const { rows, summary } = diffActivitySets(base, target);
    expect(summary.totalBase).toBe(1); // deduped
    expect(summary.totalTarget).toBe(1);
    expect(rows.filter((r) => r.code === 'DUP')).toHaveLength(1);
    expect(rows[0].kind).toBe('unchanged'); // matched against the FIRST base occurrence
  });

  it('handles empty sides gracefully', () => {
    expect(diffActivitySets([], []).summary).toEqual(emptySummary());
    const allAdded = diffActivitySets([], [act('X', 'جديد', '2026-01-01', '2026-01-02')]);
    expect(allAdded.summary).toMatchObject({ totalBase: 0, totalTarget: 1, added: 1 });
    const allRemoved = diffActivitySets([act('Y', 'قديم', '2026-01-01', '2026-01-02')], []);
    expect(allRemoved.summary).toMatchObject({ totalBase: 1, totalTarget: 0, removed: 1 });
  });

  it('tracks the worst (max) finish slip across shifted rows only', () => {
    const base = [
      act('M1', 'أ', '2026-01-01', '2026-01-10'),
      act('M2', 'ب', '2026-01-01', '2026-01-20'),
      act('M3', 'ج', '2026-01-01', '2026-01-05'), // gains days
      act('M4', 'د', '2026-01-01', '2026-01-08'), // unchanged
    ];
    const target = [
      act('M1', 'أ', '2026-01-01', '2026-01-25'),   // finish +15
      act('M2', 'ب', '2026-01-01', '2026-01-22'),   // finish +2
      act('M3', 'ج', '2026-01-01', '2026-01-03'),   // finish −2
      act('M4', 'د', '2026-01-01', '2026-01-08'),   // unchanged
    ];
    const { summary } = diffActivitySets(base, target);
    expect(summary.maxFinishSlipDays).toBe(15);
    expect(summary).toMatchObject({ shifted: 3, unchanged: 1 });
  });

  it('sorts rows: added, removed, then shifted/unchanged alphabetically', () => {
    const base = [act('B2', '', '2026-01-01', '2026-01-02'), act('B1', '', '2026-01-01', '2026-01-02'), act('B3', '', '2026-01-01', '2026-01-02')];
    const target = [act('A1', '', '2026-01-01', '2026-01-02'), act('B1', '', '2026-02-01', '2026-02-02'), act('B2', '', '2026-01-01', '2026-01-02')];
    const { rows } = diffActivitySets(base, target);
    expect(rows.map((r) => `${r.kind}:${r.code}`)).toEqual([
      'added:A1',
      'removed:B3',
      'shifted:B1',
      'unchanged:B2',
    ]);
  });
});
