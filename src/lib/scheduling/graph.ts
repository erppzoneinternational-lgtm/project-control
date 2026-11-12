/**
 * Graph Engineering for Construction ERP Project Scheduling & CPM Networks
 * =========================================================================
 *
 * Implements:
 * 1. Directed Acyclic Graph (DAG) construction for Primavera / Gantt activity networks.
 * 2. Topological sort and cycle detection (DFS / Kahn's algorithm with cycle path trace).
 * 3. CPM (Critical Path Method) Forward Pass & Backward Pass.
 * 4. Total Float (TF) and Free Float (FF) calculations.
 * 5. Critical Path identification (longest path / zero-float network).
 * 6. Graph-Aware Schedule Compression (compression respecting dependency DAG links).
 *
 * All operations are pure and deterministic (no IO / Supabase in this layer).
 */

export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface GraphActivityNode {
  id: string;
  code: string;
  name: string;
  duration: number; // in whole days (0 for milestones)
  plannedStart: Date | null;
  plannedFinish: Date | null;
  isMilestone: boolean;
  percentComplete?: number;
}

export interface GraphDependencyEdge {
  id?: string;
  predecessorId: string;
  successorId: string;
  type: DependencyType; // default 'FS'
  lagDays: number; // lag in calendar days (negative for lead)
}

export interface ScheduleGraph {
  nodes: Map<string, GraphActivityNode>;
  edges: GraphDependencyEdge[];
  predecessors: Map<string, GraphDependencyEdge[]>; // key = successorId
  successors: Map<string, GraphDependencyEdge[]>; // key = predecessorId
}

export interface CPMNodeResult {
  id: string;
  code: string;
  earlyStart: Date;
  earlyFinish: Date;
  lateStart: Date;
  lateFinish: Date;
  totalFloatDays: number;
  freeFloatDays: number;
  isCritical: boolean;
  durationDays: number;
}

export interface CPMCalculationResult {
  nodes: Map<string, CPMNodeResult>;
  criticalPath: string[]; // activity IDs in chronological order along the critical chain
  projectEarlyStart: Date;
  projectEarlyFinish: Date;
  totalProjectDurationDays: number;
  hasCycle: boolean;
  cyclePath?: string[];
}

export interface GraphCompressionChange {
  id: string;
  oldStart: Date;
  oldFinish: Date;
  newStart: Date;
  newFinish: Date;
  started: boolean;
}

export interface GraphCompressionResult {
  changes: GraphCompressionChange[];
  daysSaved: number;
}

const MS_PER_DAY = 86_400_000;

/** Whole-day number for a timestamp's local calendar day (DST-safe). */
export function toDayNumber(d: Date): number {
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / MS_PER_DAY);
}

/** Local-midnight Date from a whole-day number. */
export function fromDayNumber(n: number): Date {
  const utc = new Date(n * MS_PER_DAY);
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
}

/**
 * Builds the graph structure from nodes and dependency edges.
 */
export function buildScheduleGraph(
  nodes: GraphActivityNode[],
  edges: GraphDependencyEdge[]
): ScheduleGraph {
  const nodeMap = new Map<string, GraphActivityNode>();
  const predMap = new Map<string, GraphDependencyEdge[]>();
  const succMap = new Map<string, GraphDependencyEdge[]>();

  for (const n of nodes) {
    nodeMap.set(n.id, n);
    predMap.set(n.id, []);
    succMap.set(n.id, []);
  }

  // Filter edges to only those connecting known nodes
  const validEdges: GraphDependencyEdge[] = [];
  for (const edge of edges) {
    if (nodeMap.has(edge.predecessorId) && nodeMap.has(edge.successorId)) {
      validEdges.push(edge);
      predMap.get(edge.successorId)!.push(edge);
      succMap.get(edge.predecessorId)!.push(edge);
    }
  }

  return {
    nodes: nodeMap,
    edges: validEdges,
    predecessors: predMap,
    successors: succMap,
  };
}

/**
 * Detects cycles in the schedule dependency graph.
 * Returns { hasCycle: true, cyclePath: [...] } if a circular dependency is detected.
 */
export function detectCycles(graph: ScheduleGraph): { hasCycle: boolean; cyclePath?: string[] } {
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const parentMap = new Map<string, string>();

  const nodes = Array.from(graph.nodes.keys());

  for (const startNode of nodes) {
    if (!visited.has(startNode)) {
      const stack: string[] = [startNode];
      const trace: string[] = [];

      function dfs(current: string): boolean {
        visited.add(current);
        inStack.add(current);
        trace.push(current);

        const outgoing = graph.successors.get(current) || [];
        for (const edge of outgoing) {
          const succ = edge.successorId;
          if (!visited.has(succ)) {
            parentMap.set(succ, current);
            if (dfs(succ)) return true;
          } else if (inStack.has(succ)) {
            // Cycle detected! Extract cycle path
            const cycleStartIndex = trace.indexOf(succ);
            const cycle = trace.slice(cycleStartIndex).concat(succ);
            graphCycleFound = cycle;
            return true;
          }
        }

        inStack.delete(current);
        trace.pop();
        return false;
      }

      let graphCycleFound: string[] | undefined;
      if (dfs(startNode)) {
        return { hasCycle: true, cyclePath: graphCycleFound };
      }
    }
  }

  return { hasCycle: false };
}

/**
 * Performs topological sort on the graph nodes.
 */
export function topologicalSort(graph: ScheduleGraph): { order: string[]; isAcyclic: boolean } {
  const inDegree = new Map<string, number>();
  for (const [nodeId] of graph.nodes) {
    inDegree.set(nodeId, 0);
  }

  for (const edge of graph.edges) {
    inDegree.set(edge.successorId, (inDegree.get(edge.successorId) || 0) + 1);
  }

  const queue: string[] = [];
  for (const [nodeId, deg] of inDegree) {
    if (deg === 0) {
      queue.push(nodeId);
    }
  }

  const order: string[] = [];
  while (queue.length > 0) {
    // Deterministic sort tie-breaker by planned start then code
    queue.sort((a, b) => {
      const nodeA = graph.nodes.get(a)!;
      const nodeB = graph.nodes.get(b)!;
      const startA = nodeA.plannedStart ? toDayNumber(nodeA.plannedStart) : 0;
      const startB = nodeB.plannedStart ? toDayNumber(nodeB.plannedStart) : 0;
      if (startA !== startB) return startA - startB;
      return nodeA.code.localeCompare(nodeB.code);
    });

    const current = queue.shift()!;
    order.push(current);

    const outgoing = graph.successors.get(current) || [];
    for (const edge of outgoing) {
      const succ = edge.successorId;
      const newDeg = (inDegree.get(succ) || 1) - 1;
      inDegree.set(succ, newDeg);
      if (newDeg === 0) {
        queue.push(succ);
      }
    }
  }

  const isAcyclic = order.length === graph.nodes.size;
  return { order, isAcyclic };
}

/**
 * CPM Engine: Performs Critical Path Method Forward & Backward passes.
 */
export function computeCPM(
  graph: ScheduleGraph,
  projectStartDate?: Date
): CPMCalculationResult {
  const cycleCheck = detectCycles(graph);
  if (cycleCheck.hasCycle) {
    return {
      nodes: new Map(),
      criticalPath: [],
      projectEarlyStart: projectStartDate || new Date(),
      projectEarlyFinish: projectStartDate || new Date(),
      totalProjectDurationDays: 0,
      hasCycle: true,
      cyclePath: cycleCheck.cyclePath,
    };
  }

  const { order } = topologicalSort(graph);

  // Determine default base project start
  let baseStartDay: number;
  if (projectStartDate) {
    baseStartDay = toDayNumber(projectStartDate);
  } else {
    // Find minimum planned start among all nodes
    const starts = Array.from(graph.nodes.values())
      .map((n) => (n.plannedStart ? toDayNumber(n.plannedStart) : null))
      .filter((n): n is number => n !== null);
    baseStartDay = starts.length > 0 ? Math.min(...starts) : toDayNumber(new Date());
  }

  // 1. FORWARD PASS
  const earlyStartDays = new Map<string, number>();
  const earlyFinishDays = new Map<string, number>();

  for (const nodeId of order) {
    const node = graph.nodes.get(nodeId)!;
    const dur = node.isMilestone ? 0 : Math.max(1, node.duration);
    const preds = graph.predecessors.get(nodeId) || [];

    let es = node.plannedStart ? toDayNumber(node.plannedStart) : baseStartDay;

    if (preds.length > 0) {
      let maxReqStart = -Infinity;
      for (const p of preds) {
        const pNode = graph.nodes.get(p.predecessorId)!;
        const pES = earlyStartDays.get(p.predecessorId) ?? baseStartDay;
        const pEF = earlyFinishDays.get(p.predecessorId) ?? baseStartDay;
        const lag = p.lagDays || 0;

        let reqStart: number;
        switch (p.type) {
          case 'FS': // Finish-to-Start: successor starts after predecessor finishes (+ lag)
            reqStart = (pNode.isMilestone || node.isMilestone) ? pEF + lag : pEF + lag + 1;
            break;
          case 'SS': // Start-to-Start: successor starts after predecessor starts (+ lag)
            reqStart = pES + lag;
            break;
          case 'FF': // Finish-to-Finish: successor finishes after predecessor finishes (+ lag)
            reqStart = node.isMilestone ? pEF + lag : pEF + lag - dur + 1;
            break;
          case 'SF': // Start-to-Finish: successor finishes after predecessor starts (+ lag)
            reqStart = node.isMilestone ? pES + lag : pES + lag - dur + 1;
            break;
        }
        if (reqStart > maxReqStart) {
          maxReqStart = reqStart;
        }
      }
      if (maxReqStart !== -Infinity) {
        es = maxReqStart;
      }
    }

    const ef = node.isMilestone ? es : es + dur - 1;
    earlyStartDays.set(nodeId, es);
    earlyFinishDays.set(nodeId, ef);
  }

  // Project Early Finish
  const allEF = Array.from(earlyFinishDays.values());
  const maxProjectFinishDay = allEF.length > 0 ? Math.max(...allEF) : baseStartDay;

  // 2. BACKWARD PASS
  const lateStartDays = new Map<string, number>();
  const lateFinishDays = new Map<string, number>();

  // Walk in reverse topological order
  for (let i = order.length - 1; i >= 0; i--) {
    const nodeId = order[i];
    const node = graph.nodes.get(nodeId)!;
    const dur = node.isMilestone ? 0 : Math.max(1, node.duration);
    const succs = graph.successors.get(nodeId) || [];

    let lf = maxProjectFinishDay;

    if (succs.length > 0) {
      let minReqFinish = Infinity;
      for (const s of succs) {
        const sNode = graph.nodes.get(s.successorId)!;
        const sLS = lateStartDays.get(s.successorId) ?? maxProjectFinishDay;
        const sLF = lateFinishDays.get(s.successorId) ?? maxProjectFinishDay;
        const lag = s.lagDays || 0;

        let reqFinish: number;
        switch (s.type) {
          case 'FS':
            reqFinish = (sNode.isMilestone || node.isMilestone) ? sLS - lag : sLS - lag - 1;
            break;
          case 'SS':
            reqFinish = node.isMilestone ? sLS - lag : sLS - lag + dur - 1;
            break;
          case 'FF':
            reqFinish = sLF - lag;
            break;
          case 'SF':
            reqFinish = node.isMilestone ? sLF - lag : sLF - lag + dur - 1;
            break;
        }
        if (reqFinish < minReqFinish) {
          minReqFinish = reqFinish;
        }
      }
      if (minReqFinish !== Infinity) {
        lf = minReqFinish;
      }
    }

    const ls = node.isMilestone ? lf : lf - dur + 1;
    lateStartDays.set(nodeId, ls);
    lateFinishDays.set(nodeId, lf);
  }

  // 3. FLOAT & CRITICAL PATH
  const cpmResults = new Map<string, CPMNodeResult>();
  const criticalPath: string[] = [];

  for (const nodeId of order) {
    const node = graph.nodes.get(nodeId)!;
    const es = earlyStartDays.get(nodeId)!;
    const ef = earlyFinishDays.get(nodeId)!;
    const ls = lateStartDays.get(nodeId)!;
    const lf = lateFinishDays.get(nodeId)!;

    const totalFloat = ls - es; // = lf - ef

    // Free Float = min(Successor ES - lag) - EF
    const succs = graph.successors.get(nodeId) || [];
    let freeFloat = totalFloat;
    if (succs.length > 0) {
      let minSuccImpact = Infinity;
      for (const s of succs) {
        const sNode = graph.nodes.get(s.successorId)!;
        const sES = earlyStartDays.get(s.successorId)!;
        const lag = s.lagDays || 0;
        let allowedEF: number;
        switch (s.type) {
          case 'FS':
            allowedEF = (sNode.isMilestone || node.isMilestone) ? sES - lag : sES - lag - 1;
            break;
          case 'SS':
            allowedEF = node.isMilestone ? sES - lag : sES - lag + (node.duration || 1) - 1;
            break;
          case 'FF':
            allowedEF = earlyFinishDays.get(s.successorId)! - lag;
            break;
          case 'SF':
            allowedEF = node.isMilestone ? earlyFinishDays.get(s.successorId)! - lag : earlyFinishDays.get(s.successorId)! - lag + (node.duration || 1) - 1;
            break;
        }
        const slack = allowedEF - ef;
        if (slack < minSuccImpact) {
          minSuccImpact = slack;
        }
      }
      if (minSuccImpact !== Infinity) {
        freeFloat = Math.max(0, minSuccImpact);
      }
    }

    const isCritical = totalFloat <= 0;
    if (isCritical) {
      criticalPath.push(nodeId);
    }

    cpmResults.set(nodeId, {
      id: nodeId,
      code: node.code,
      earlyStart: fromDayNumber(es),
      earlyFinish: fromDayNumber(ef),
      lateStart: fromDayNumber(ls),
      lateFinish: fromDayNumber(lf),
      totalFloatDays: totalFloat,
      freeFloatDays: freeFloat,
      isCritical,
      durationDays: node.isMilestone ? 0 : Math.max(1, node.duration),
    });
  }

  const allES = Array.from(earlyStartDays.values());
  const minProjectStartDay = allES.length > 0 ? Math.min(...allES) : baseStartDay;

  return {
    nodes: cpmResults,
    criticalPath,
    projectEarlyStart: fromDayNumber(minProjectStartDay),
    projectEarlyFinish: fromDayNumber(maxProjectFinishDay),
    totalProjectDurationDays: maxProjectFinishDay - minProjectStartDay + 1,
    hasCycle: false,
  };
}

/**
 * Graph-Aware Schedule Compression:
 * Compresses activities earlier along the DAG network while strictly honoring
 * all predecessor constraints (FS/SS/FF/SF + lags).
 */
export function compressGraphSchedule(
  graph: ScheduleGraph,
  opts: { fromId?: string } = {}
): GraphCompressionResult {
  const { order, isAcyclic } = topologicalSort(graph);
  if (!isAcyclic) {
    throw new Error('compressGraphSchedule: cannot compress a graph with circular dependencies');
  }

  let beginIndex = 0;
  if (opts.fromId) {
    beginIndex = order.indexOf(opts.fromId);
    if (beginIndex === -1) {
      throw new Error(`compressGraphSchedule: fromId "${opts.fromId}" not found in graph`);
    }
  }

  const changes: GraphCompressionChange[] = [];
  let daysSaved = 0;

  // Track the updated finish day of each activity in topological walk
  const currentFinishDays = new Map<string, number>();

  // Pre-seed untouched predecessors before beginIndex
  for (let i = 0; i < beginIndex; i++) {
    const id = order[i];
    const node = graph.nodes.get(id)!;
    if (node.plannedFinish) {
      currentFinishDays.set(id, toDayNumber(node.plannedFinish));
    }
  }

  for (let i = beginIndex; i < order.length; i++) {
    const id = order[i];
    const node = graph.nodes.get(id)!;
    if (!node.plannedStart || !node.plannedFinish) continue;

    const oldStartN = toDayNumber(node.plannedStart);
    const oldFinishN = toDayNumber(node.plannedFinish);
    const durDays = node.isMilestone ? 0 : oldFinishN - oldStartN;

    const preds = graph.predecessors.get(id) || [];
    let earliestPossibleStartN = oldStartN;

    if (preds.length > 0) {
      let maxPredTargetStart = -Infinity;
      for (const p of preds) {
        const predFinishN = currentFinishDays.get(p.predecessorId);
        if (predFinishN !== undefined) {
          const lag = p.lagDays || 0;
          let targetStart: number;
          if (p.type === 'FS') {
            targetStart = node.isMilestone ? predFinishN + lag : predFinishN + lag + 1;
          } else {
            targetStart = predFinishN + lag;
          }
          if (targetStart > maxPredTargetStart) {
            maxPredTargetStart = targetStart;
          }
        }
      }

      if (maxPredTargetStart !== -Infinity) {
        // Pull-earlier only: min(earliestPossible, currentStart)
        earliestPossibleStartN = Math.min(maxPredTargetStart, oldStartN);
      }
    } else if (i > 0 && beginIndex === 0) {
      // In absence of explicit graph link, pull to previous sorted activity's finish
      const prevId = order[i - 1];
      const prevFinishN = currentFinishDays.get(prevId);
      if (prevFinishN !== undefined) {
        const candidate = node.isMilestone ? prevFinishN : prevFinishN + 1;
        earliestPossibleStartN = Math.min(candidate, oldStartN);
      }
    }

    const newStartN = earliestPossibleStartN;
    const newFinishN = node.isMilestone ? newStartN : newStartN + durDays;

    currentFinishDays.set(id, newFinishN);

    if (newStartN !== oldStartN || newFinishN !== oldFinishN) {
      changes.push({
        id: node.id,
        oldStart: fromDayNumber(oldStartN),
        oldFinish: fromDayNumber(oldFinishN),
        newStart: fromDayNumber(newStartN),
        newFinish: fromDayNumber(newFinishN),
        started: (node.percentComplete ?? 0) > 0,
      });
      daysSaved += oldStartN - newStartN;
    }
  }

  return { changes, daysSaved };
}
