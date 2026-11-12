import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeCompression } from '@/lib/scheduling/compression';
import type { GanttActivity } from '../planning/GanttChart';

function makeDate(str: string): Date {
  return new Date(`${str}T00:00:00`);
}

describe('ScheduleCompressionModal Integration Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('transforms GanttActivity list into valid compression candidates and computes savings', () => {
    const rawActivities: GanttActivity[] = [
      {
        id: 'act-1',
        code: 'ACT-01',
        name: 'Excavation',
        start: makeDate('2026-09-01'),
        finish: makeDate('2026-09-04'),
        duration: 4,
        pct: 100,
        critical: true,
        milestone: false,
        float: 0,
      },
      {
        id: 'act-2',
        code: 'ACT-02',
        name: 'Concrete',
        start: makeDate('2026-09-10'), // 5-day gap after act-1
        finish: makeDate('2026-09-15'),
        duration: 6,
        pct: 20,
        critical: true,
        milestone: false,
        float: 0,
      },
      {
        id: undefined, // unpersisted row
        code: 'ACT-TEMP',
        name: 'Draft',
        start: makeDate('2026-09-16'),
        finish: makeDate('2026-09-18'),
        duration: 3,
        pct: 0,
        critical: false,
        milestone: false,
        float: null,
      },
    ];

    const validActs = rawActivities
      .filter((a): a is GanttActivity & { id: string; start: Date; finish: Date } =>
        Boolean(a.id && a.start && a.finish)
      )
      .map((a) => ({
        id: a.id,
        start: a.start,
        finish: a.finish,
        is_milestone: a.milestone,
        percent_complete: a.pct,
      }));

    expect(validActs.length).toBe(2);

    const plan = computeCompression(validActs);
    expect(plan.changes.length).toBe(1);
    expect(plan.changes[0].id).toBe('act-2');
    expect(plan.changes[0].started).toBe(true); // pct > 0
    expect(plan.daysSaved).toBe(5);
  });

  it('handles scoped compression from a selected activity onward', () => {
    const activities: GanttActivity[] = [
      { id: '1', code: 'A', name: 'A', start: makeDate('2026-09-01'), finish: makeDate('2026-09-02'), duration: 2, pct: 0, critical: false, milestone: false, float: 0 },
      { id: '2', code: 'B', name: 'B', start: makeDate('2026-09-08'), finish: makeDate('2026-09-10'), duration: 3, pct: 0, critical: false, milestone: false, float: 0 },
      { id: '3', code: 'C', name: 'C', start: makeDate('2026-09-18'), finish: makeDate('2026-09-20'), duration: 3, pct: 0, critical: false, milestone: false, float: 0 },
    ];

    const validActs = activities.map((a) => ({
      id: a.id!,
      start: a.start!,
      finish: a.finish!,
      is_milestone: a.milestone,
    }));

    // Scoped from activity '3' onward
    const plan = computeCompression(validActs, { fromId: '3' });
    expect(plan.changes.length).toBe(1);
    expect(plan.changes[0].id).toBe('3');
    // Act 3 moves to Act 2 finish + 1 (Sept 11)
    expect(plan.changes[0].newStart).toEqual(makeDate('2026-09-11'));
  });
});
