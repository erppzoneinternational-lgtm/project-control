import { describe, it, expect } from 'vitest';
import {
  buildScheduleGraph,
  detectCycles,
  topologicalSort,
  computeCPM,
  compressGraphSchedule,
  toDayNumber,
  fromDayNumber,
  type GraphActivityNode,
  type GraphDependencyEdge,
} from '../graph';

function makeDate(str: string): Date {
  return new Date(`${str}T00:00:00`);
}

describe('Graph Engineering: Schedule CPM & DAG Engine', () => {
  describe('Graph Construction & Topological Sorting', () => {
    it('builds graph and sorts a linear chain (A -> B -> C)', () => {
      const nodes: GraphActivityNode[] = [
        { id: '1', code: 'A', name: 'Act A', duration: 5, plannedStart: makeDate('2026-09-01'), plannedFinish: makeDate('2026-09-05'), isMilestone: false },
        { id: '2', code: 'B', name: 'Act B', duration: 3, plannedStart: makeDate('2026-09-06'), plannedFinish: makeDate('2026-09-08'), isMilestone: false },
        { id: '3', code: 'C', name: 'Act C', duration: 2, plannedStart: makeDate('2026-09-09'), plannedFinish: makeDate('2026-09-10'), isMilestone: false },
      ];

      const edges: GraphDependencyEdge[] = [
        { predecessorId: '1', successorId: '2', type: 'FS', lagDays: 0 },
        { predecessorId: '2', successorId: '3', type: 'FS', lagDays: 0 },
      ];

      const graph = buildScheduleGraph(nodes, edges);
      expect(graph.nodes.size).toBe(3);
      expect(graph.edges.length).toBe(2);
      expect(graph.predecessors.get('2')?.length).toBe(1);
      expect(graph.successors.get('1')?.length).toBe(1);

      const { order, isAcyclic } = topologicalSort(graph);
      expect(isAcyclic).toBe(true);
      expect(order).toEqual(['1', '2', '3']);
    });

    it('handles diamond DAG (A -> B, A -> C, B -> D, C -> D)', () => {
      const nodes: GraphActivityNode[] = [
        { id: 'A', code: 'ACT-A', name: 'Start', duration: 4, plannedStart: makeDate('2026-09-01'), plannedFinish: makeDate('2026-09-04'), isMilestone: false },
        { id: 'B', code: 'ACT-B', name: 'Path 1', duration: 6, plannedStart: makeDate('2026-09-05'), plannedFinish: makeDate('2026-09-10'), isMilestone: false },
        { id: 'C', code: 'ACT-C', name: 'Path 2', duration: 3, plannedStart: makeDate('2026-09-05'), plannedFinish: makeDate('2026-09-07'), isMilestone: false },
        { id: 'D', code: 'ACT-D', name: 'Merge', duration: 2, plannedStart: makeDate('2026-09-11'), plannedFinish: makeDate('2026-09-12'), isMilestone: false },
      ];

      const edges: GraphDependencyEdge[] = [
        { predecessorId: 'A', successorId: 'B', type: 'FS', lagDays: 0 },
        { predecessorId: 'A', successorId: 'C', type: 'FS', lagDays: 0 },
        { predecessorId: 'B', successorId: 'D', type: 'FS', lagDays: 0 },
        { predecessorId: 'C', successorId: 'D', type: 'FS', lagDays: 0 },
      ];

      const graph = buildScheduleGraph(nodes, edges);
      const { order, isAcyclic } = topologicalSort(graph);

      expect(isAcyclic).toBe(true);
      expect(order[0]).toBe('A');
      expect(order[3]).toBe('D');
      expect(order.slice(1, 3)).toContain('B');
      expect(order.slice(1, 3)).toContain('C');
    });
  });

  describe('Cycle Detection', () => {
    it('detects no cycle in valid DAG', () => {
      const nodes: GraphActivityNode[] = [
        { id: '1', code: 'A', name: 'A', duration: 1, plannedStart: makeDate('2026-09-01'), plannedFinish: makeDate('2026-09-01'), isMilestone: false },
        { id: '2', code: 'B', name: 'B', duration: 1, plannedStart: makeDate('2026-09-02'), plannedFinish: makeDate('2026-09-02'), isMilestone: false },
      ];
      const edges: GraphDependencyEdge[] = [
        { predecessorId: '1', successorId: '2', type: 'FS', lagDays: 0 },
      ];

      const graph = buildScheduleGraph(nodes, edges);
      const res = detectCycles(graph);
      expect(res.hasCycle).toBe(false);
    });

    it('detects direct 2-node cycle (A -> B -> A)', () => {
      const nodes: GraphActivityNode[] = [
        { id: 'A', code: 'ACT-A', name: 'A', duration: 2, plannedStart: makeDate('2026-09-01'), plannedFinish: makeDate('2026-09-02'), isMilestone: false },
        { id: 'B', code: 'ACT-B', name: 'B', duration: 2, plannedStart: makeDate('2026-09-03'), plannedFinish: makeDate('2026-09-04'), isMilestone: false },
      ];
      const edges: GraphDependencyEdge[] = [
        { predecessorId: 'A', successorId: 'B', type: 'FS', lagDays: 0 },
        { predecessorId: 'B', successorId: 'A', type: 'FS', lagDays: 0 },
      ];

      const graph = buildScheduleGraph(nodes, edges);
      const res = detectCycles(graph);
      expect(res.hasCycle).toBe(true);
      expect(res.cyclePath).toBeDefined();
    });

    it('detects multi-node indirect cycle (A -> B -> C -> D -> B)', () => {
      const nodes: GraphActivityNode[] = [
        { id: 'A', code: 'A', name: 'A', duration: 1, plannedStart: makeDate('2026-09-01'), plannedFinish: makeDate('2026-09-01'), isMilestone: false },
        { id: 'B', code: 'B', name: 'B', duration: 1, plannedStart: makeDate('2026-09-02'), plannedFinish: makeDate('2026-09-02'), isMilestone: false },
        { id: 'C', code: 'C', name: 'C', duration: 1, plannedStart: makeDate('2026-09-03'), plannedFinish: makeDate('2026-09-03'), isMilestone: false },
        { id: 'D', code: 'D', name: 'D', duration: 1, plannedStart: makeDate('2026-09-04'), plannedFinish: makeDate('2026-09-04'), isMilestone: false },
      ];
      const edges: GraphDependencyEdge[] = [
        { predecessorId: 'A', successorId: 'B', type: 'FS', lagDays: 0 },
        { predecessorId: 'B', successorId: 'C', type: 'FS', lagDays: 0 },
        { predecessorId: 'C', successorId: 'D', type: 'FS', lagDays: 0 },
        { predecessorId: 'D', successorId: 'B', type: 'FS', lagDays: 0 },
      ];

      const graph = buildScheduleGraph(nodes, edges);
      const res = detectCycles(graph);
      expect(res.hasCycle).toBe(true);
    });
  });

  describe('CPM Engine: Critical Path & Float Calculation', () => {
    it('computes CPM for classic diamond network with critical and float paths', () => {
      // Network:
      // A (dur 4, day 1..4)
      // Path 1: B (dur 6, day 5..10) -> critical
      // Path 2: C (dur 3, day 5..7) -> non-critical (TF = 3, FF = 3)
      // D (dur 2, day 11..12) -> critical
      const nodes: GraphActivityNode[] = [
        { id: 'A', code: 'A', name: 'Start Activity', duration: 4, plannedStart: makeDate('2026-09-01'), plannedFinish: makeDate('2026-09-04'), isMilestone: false },
        { id: 'B', code: 'B', name: 'Long Path Activity', duration: 6, plannedStart: makeDate('2026-09-05'), plannedFinish: makeDate('2026-09-10'), isMilestone: false },
        { id: 'C', code: 'C', name: 'Short Path Activity', duration: 3, plannedStart: makeDate('2026-09-05'), plannedFinish: makeDate('2026-09-07'), isMilestone: false },
        { id: 'D', code: 'D', name: 'End Activity', duration: 2, plannedStart: makeDate('2026-09-11'), plannedFinish: makeDate('2026-09-12'), isMilestone: false },
      ];

      const edges: GraphDependencyEdge[] = [
        { predecessorId: 'A', successorId: 'B', type: 'FS', lagDays: 0 },
        { predecessorId: 'A', successorId: 'C', type: 'FS', lagDays: 0 },
        { predecessorId: 'B', successorId: 'D', type: 'FS', lagDays: 0 },
        { predecessorId: 'C', successorId: 'D', type: 'FS', lagDays: 0 },
      ];

      const graph = buildScheduleGraph(nodes, edges);
      const cpm = computeCPM(graph, makeDate('2026-09-01'));

      expect(cpm.hasCycle).toBe(false);
      expect(cpm.totalProjectDurationDays).toBe(12); // Sept 1 to Sept 12 = 12 calendar days

      // Check Critical Path (A -> B -> D)
      expect(cpm.criticalPath).toEqual(['A', 'B', 'D']);

      const nodeA = cpm.nodes.get('A')!;
      expect(nodeA.isCritical).toBe(true);
      expect(nodeA.totalFloatDays).toBe(0);

      const nodeB = cpm.nodes.get('B')!;
      expect(nodeB.isCritical).toBe(true);
      expect(nodeB.totalFloatDays).toBe(0);

      const nodeC = cpm.nodes.get('C')!;
      expect(nodeC.isCritical).toBe(false);
      expect(nodeC.totalFloatDays).toBe(3); // 3 days float
      expect(nodeC.freeFloatDays).toBe(3);

      const nodeD = cpm.nodes.get('D')!;
      expect(nodeD.isCritical).toBe(true);
      expect(nodeD.totalFloatDays).toBe(0);
    });

    it('calculates CPM with milestone and lags (FS + lag)', () => {
      const nodes: GraphActivityNode[] = [
        { id: 'M1', code: 'M1', name: 'Start Milestone', duration: 0, plannedStart: makeDate('2026-09-01'), plannedFinish: makeDate('2026-09-01'), isMilestone: true },
        { id: 'A1', code: 'A1', name: 'Foundation', duration: 5, plannedStart: makeDate('2026-09-01'), plannedFinish: makeDate('2026-09-05'), isMilestone: false },
        { id: 'A2', code: 'A2', name: 'Curing (Lag)', duration: 4, plannedStart: makeDate('2026-09-08'), plannedFinish: makeDate('2026-09-11'), isMilestone: false },
        { id: 'M2', code: 'M2', name: 'Completion Milestone', duration: 0, plannedStart: makeDate('2026-09-11'), plannedFinish: makeDate('2026-09-11'), isMilestone: true },
      ];

      const edges: GraphDependencyEdge[] = [
        { predecessorId: 'M1', successorId: 'A1', type: 'FS', lagDays: 0 },
        { predecessorId: 'A1', successorId: 'A2', type: 'FS', lagDays: 2 }, // 2 days lag after A1 finish
        { predecessorId: 'A2', successorId: 'M2', type: 'FS', lagDays: 0 },
      ];

      const graph = buildScheduleGraph(nodes, edges);
      const cpm = computeCPM(graph, makeDate('2026-09-01'));

      expect(cpm.hasCycle).toBe(false);
      expect(cpm.criticalPath).toEqual(['M1', 'A1', 'A2', 'M2']);

      const a2 = cpm.nodes.get('A2')!;
      expect(toDayNumber(a2.earlyStart)).toBe(toDayNumber(makeDate('2026-09-08')));
      expect(toDayNumber(a2.earlyFinish)).toBe(toDayNumber(makeDate('2026-09-11')));
    });

    it('handles SS and FF relationships with lags', () => {
      const nodes: GraphActivityNode[] = [
        { id: '1', code: 'ACT-1', name: 'Excavation', duration: 10, plannedStart: makeDate('2026-09-01'), plannedFinish: makeDate('2026-09-10'), isMilestone: false },
        { id: '2', code: 'ACT-2', name: 'Pipe Laying', duration: 8, plannedStart: makeDate('2026-09-04'), plannedFinish: makeDate('2026-09-11'), isMilestone: false },
      ];

      // Pipe laying starts 3 days after excavation starts (SS + 3)
      const edges: GraphDependencyEdge[] = [
        { predecessorId: '1', successorId: '2', type: 'SS', lagDays: 3 },
      ];

      const graph = buildScheduleGraph(nodes, edges);
      const cpm = computeCPM(graph, makeDate('2026-09-01'));

      const act2 = cpm.nodes.get('2')!;
      expect(toDayNumber(act2.earlyStart)).toBe(toDayNumber(makeDate('2026-09-04')));
    });
  });

  describe('Graph-Aware Schedule Compression', () => {
    it('compresses a graph with idle gaps along dependency lines', () => {
      const nodes: GraphActivityNode[] = [
        { id: '1', code: 'ACT-1', name: 'Activity 1', duration: 3, plannedStart: makeDate('2026-09-01'), plannedFinish: makeDate('2026-09-03'), isMilestone: false },
        // Has a 7-day idle gap (planned to start Sept 11 instead of Sept 4)
        { id: '2', code: 'ACT-2', name: 'Activity 2', duration: 4, plannedStart: makeDate('2026-09-11'), plannedFinish: makeDate('2026-09-14'), isMilestone: false },
        // Has another 5-day idle gap
        { id: '3', code: 'ACT-3', name: 'Activity 3', duration: 2, plannedStart: makeDate('2026-09-20'), plannedFinish: makeDate('2026-09-21'), isMilestone: false },
      ];

      const edges: GraphDependencyEdge[] = [
        { predecessorId: '1', successorId: '2', type: 'FS', lagDays: 0 },
        { predecessorId: '2', successorId: '3', type: 'FS', lagDays: 0 },
      ];

      const graph = buildScheduleGraph(nodes, edges);
      const res = compressGraphSchedule(graph);

      expect(res.changes.length).toBe(2);
      expect(res.daysSaved).toBe(7 + 12); // Act 2 shifted by 7 days; Act 3 shifted by (20 - 8 = 12 days)

      const ch2 = res.changes.find((c) => c.id === '2')!;
      expect(toDayNumber(ch2.newStart)).toBe(toDayNumber(makeDate('2026-09-04')));
      expect(toDayNumber(ch2.newFinish)).toBe(toDayNumber(makeDate('2026-09-07')));

      const ch3 = res.changes.find((c) => c.id === '3')!;
      expect(toDayNumber(ch3.newStart)).toBe(toDayNumber(makeDate('2026-09-08')));
      expect(toDayNumber(ch3.newFinish)).toBe(toDayNumber(makeDate('2026-09-09')));
    });

    it('honors scoped compression starting fromId onward', () => {
      const nodes: GraphActivityNode[] = [
        { id: '1', code: 'ACT-1', name: 'Act 1', duration: 3, plannedStart: makeDate('2026-09-01'), plannedFinish: makeDate('2026-09-03'), isMilestone: false },
        { id: '2', code: 'ACT-2', name: 'Act 2', duration: 3, plannedStart: makeDate('2026-09-10'), plannedFinish: makeDate('2026-09-12'), isMilestone: false },
        { id: '3', code: 'ACT-3', name: 'Act 3', duration: 2, plannedStart: makeDate('2026-09-20'), plannedFinish: makeDate('2026-09-21'), isMilestone: false },
      ];

      const edges: GraphDependencyEdge[] = [
        { predecessorId: '1', successorId: '2', type: 'FS', lagDays: 0 },
        { predecessorId: '2', successorId: '3', type: 'FS', lagDays: 0 },
      ];

      const graph = buildScheduleGraph(nodes, edges);
      // Compress from Act 3 only
      const res = compressGraphSchedule(graph, { fromId: '3' });

      expect(res.changes.length).toBe(1);
      expect(res.changes[0].id).toBe('3');
      // Act 3 pulls to Act 2's finish + 1 (Sept 13)
      expect(toDayNumber(res.changes[0].newStart)).toBe(toDayNumber(makeDate('2026-09-13')));
    });
  });
});
