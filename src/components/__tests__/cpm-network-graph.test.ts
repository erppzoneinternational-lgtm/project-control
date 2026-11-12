import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildScheduleGraph, computeCPM } from '@/lib/scheduling/graph';
import type { GanttActivity } from '../planning/GanttChart';
import type { ActivityDependency } from '@/types/schedule';

function makeDate(str: string): Date {
  return new Date(`${str}T00:00:00`);
}

describe('CPMNetworkGraph Component Logic & Invariants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds DAG network with explicit dependencies and computes critical path', () => {
    const activities: GanttActivity[] = [
      { id: '1', code: 'ACT-01', name: 'Excavation', start: makeDate('2026-09-01'), finish: makeDate('2026-09-04'), duration: 4, pct: 100, critical: true, milestone: false, float: 0 },
      { id: '2', code: 'ACT-02', name: 'Lean Concrete', start: makeDate('2026-09-05'), finish: makeDate('2026-09-07'), duration: 3, pct: 50, critical: true, milestone: false, float: 0 },
      { id: '3', code: 'ACT-03', name: 'Rebar Inspection', start: makeDate('2026-09-08'), finish: makeDate('2026-09-09'), duration: 2, pct: 0, critical: true, milestone: false, float: 0 },
    ];

    const dependencies: ActivityDependency[] = [
      { id: 'd1', predecessor_id: '1', successor_id: '2', relationship: 'FS', lag_days: 0 },
      { id: 'd2', predecessor_id: '2', successor_id: '3', relationship: 'FS', lag_days: 0 },
    ];

    const nodes = activities.map((a) => ({
      id: a.id!,
      code: a.code,
      name: a.name,
      duration: a.duration,
      plannedStart: a.start,
      plannedFinish: a.finish,
      isMilestone: a.milestone,
      percentComplete: a.pct,
    }));

    const edges = dependencies.map((d) => ({
      id: d.id,
      predecessorId: d.predecessor_id,
      successorId: d.successor_id,
      type: d.relationship,
      lagDays: d.lag_days,
    }));

    const graph = buildScheduleGraph(nodes, edges);
    const cpm = computeCPM(graph, makeDate('2026-09-01'));

    expect(cpm.hasCycle).toBe(false);
    expect(cpm.criticalPath).toEqual(['1', '2', '3']);
    expect(cpm.totalProjectDurationDays).toBe(9);
  });

  it('handles synthesised sequential links when no explicit dependencies are given', () => {
    const activities: GanttActivity[] = [
      { id: '1', code: 'A', name: 'First', start: makeDate('2026-09-01'), finish: makeDate('2026-09-03'), duration: 3, pct: 0, critical: false, milestone: false, float: 0 },
      { id: '2', code: 'B', name: 'Second', start: makeDate('2026-09-04'), finish: makeDate('2026-09-06'), duration: 3, pct: 0, critical: false, milestone: false, float: 0 },
    ];

    const nodes = activities.map((a) => ({
      id: a.id!,
      code: a.code,
      name: a.name,
      duration: a.duration,
      plannedStart: a.start,
      plannedFinish: a.finish,
      isMilestone: a.milestone,
    }));

    // Auto-synthesized sequential links
    const edges = [
      { id: 'synth-1-2', predecessorId: '1', successorId: '2', type: 'FS' as const, lagDays: 0 },
    ];

    const graph = buildScheduleGraph(nodes, edges);
    const cpm = computeCPM(graph, makeDate('2026-09-01'));

    expect(cpm.criticalPath).toEqual(['1', '2']);
    expect(cpm.nodes.get('1')?.earlyStart).toEqual(makeDate('2026-09-01'));
    expect(cpm.nodes.get('2')?.earlyFinish).toEqual(makeDate('2026-09-06'));
  });
});
