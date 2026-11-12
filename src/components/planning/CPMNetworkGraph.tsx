'use client';

import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  GitBranch,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertTriangle,
  Layers,
  Clock,
  Info,
  Kanban,
  Network,
  ListOrdered,
  X,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  buildScheduleGraph,
  computeCPM,
  type GraphActivityNode,
  type GraphDependencyEdge,
  type CPMCalculationResult,
} from '@/lib/scheduling/graph';
import type { GanttActivity } from './GanttChart';
import type { ActivityDependency } from '@/types/schedule';

interface Props {
  activities: GanttActivity[];
  projectId?: string;
  dependencies?: ActivityDependency[];
}

type ViewMode = 'critical_chain' | 'swimlanes' | 'network';

const fmtD = (d: Date | null | undefined, isAr: boolean) =>
  d
    ? new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
      }).format(d)
    : '—';

export default function CPMNetworkGraph({ activities, dependencies = [] }: Props) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [viewMode, setViewMode] = useState<ViewMode>('critical_chain');
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Canvas Pan & Zoom State for Interactive Network
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Prepare Graph Nodes
  const graphNodes: GraphActivityNode[] = useMemo(() => {
    return activities
      .filter((a) => a.id || a.code)
      .map((a, i) => ({
        id: a.id || `temp-${a.code || i}`,
        code: a.code || `ACT-${i + 1}`,
        name: a.name || (isAr ? 'نشاط بدون اسم' : 'Activity'),
        duration: a.milestone ? 0 : Math.max(1, a.duration || 1),
        plannedStart: a.start,
        plannedFinish: a.finish,
        isMilestone: a.milestone,
        percentComplete: a.pct,
      }));
  }, [activities, isAr]);

  // 2. Prepare Graph Edges
  const graphEdges: GraphDependencyEdge[] = useMemo(() => {
    if (dependencies && dependencies.length > 0) {
      return dependencies.map((d) => ({
        id: d.id,
        predecessorId: d.predecessor_id,
        successorId: d.successor_id,
        type: d.relationship || 'FS',
        lagDays: d.lag_days || 0,
      }));
    }

    // Auto-synthesize sequential flow if no explicit links in DB
    const sorted = [...graphNodes].sort((a, b) => {
      const sA = a.plannedStart ? a.plannedStart.getTime() : 0;
      const sB = b.plannedStart ? b.plannedStart.getTime() : 0;
      return sA - sB;
    });

    const synth: GraphDependencyEdge[] = [];
    for (let i = 1; i < sorted.length; i++) {
      synth.push({
        id: `synth-${sorted[i - 1].id}-${sorted[i].id}`,
        predecessorId: sorted[i - 1].id,
        successorId: sorted[i].id,
        type: 'FS',
        lagDays: 0,
      });
    }
    return synth;
  }, [dependencies, graphNodes]);

  // 3. Compute CPM Graph Network
  const cpmData: CPMCalculationResult = useMemo(() => {
    if (!graphNodes.length) {
      return {
        nodes: new Map(),
        criticalPath: [],
        projectEarlyStart: new Date(),
        projectEarlyFinish: new Date(),
        totalProjectDurationDays: 0,
        hasCycle: false,
      };
    }
    const graph = buildScheduleGraph(graphNodes, graphEdges);
    return computeCPM(graph);
  }, [graphNodes, graphEdges]);

  // Node Map for fast O(1) lookups
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphActivityNode>();
    for (const n of graphNodes) map.set(n.id, n);
    return map;
  }, [graphNodes]);

  // Predecessor & Successor Adjacency Maps
  const { predsByNode, succsByNode } = useMemo(() => {
    const pMap = new Map<string, GraphDependencyEdge[]>();
    const sMap = new Map<string, GraphDependencyEdge[]>();
    for (const n of graphNodes) {
      pMap.set(n.id, []);
      sMap.set(n.id, []);
    }
    for (const e of graphEdges) {
      sMap.get(e.predecessorId)?.push(e);
      pMap.get(e.successorId)?.push(e);
    }
    return { predsByNode: pMap, succsByNode: sMap };
  }, [graphNodes, graphEdges]);

  // 4. Visual Layout for Network View
  const networkLayout = useMemo(() => {
    if (!graphNodes.length) {
      return { nodeCoords: new Map<string, { x: number; y: number }>(), width: 1200, height: 600 };
    }

    const rankMap = new Map<string, number>();
    function getRank(id: string, visited = new Set<string>()): number {
      if (rankMap.has(id)) return rankMap.get(id)!;
      if (visited.has(id)) return 0;
      visited.add(id);

      const preds = predsByNode.get(id) || [];
      if (preds.length === 0) {
        rankMap.set(id, 0);
        return 0;
      }
      const maxPredRank = Math.max(...preds.map((p) => getRank(p.predecessorId, visited)));
      const r = maxPredRank + 1;
      rankMap.set(id, r);
      return r;
    }

    for (const n of graphNodes) {
      getRank(n.id);
    }

    const columns = new Map<number, string[]>();
    for (const [id, rank] of rankMap) {
      if (!columns.has(rank)) columns.set(rank, []);
      columns.get(rank)!.push(id);
    }

    const NODE_W = 200;
    const NODE_H = 88;
    const GAP_X = 70;
    const GAP_Y = 24;
    const PAD = 40;

    const maxRank = Math.max(0, ...Array.from(columns.keys()));
    const maxRowsInCol = Math.max(1, ...Array.from(columns.values()).map((c) => c.length));

    const nodeCoords = new Map<string, { x: number; y: number }>();

    for (let r = 0; r <= maxRank; r++) {
      const colNodes = columns.get(r) || [];
      const totalColH = colNodes.length * NODE_H + (colNodes.length - 1) * GAP_Y;
      const startY = PAD + Math.max(0, (maxRowsInCol * (NODE_H + GAP_Y) - totalColH) / 2);

      colNodes.forEach((nodeId, idx) => {
        const x = PAD + r * (NODE_W + GAP_X);
        const y = startY + idx * (NODE_H + GAP_Y);
        nodeCoords.set(nodeId, { x, y });
      });
    }

    const totalW = PAD * 2 + (maxRank + 1) * (NODE_W + GAP_X);
    const totalH = PAD * 2 + maxRowsInCol * (NODE_H + GAP_Y);

    return { nodeCoords, width: Math.max(1100, totalW), height: Math.max(480, totalH) };
  }, [graphNodes, predsByNode]);

  // Fit to screen function
  const fitToScreen = useCallback(() => {
    if (!containerRef.current || !networkLayout.width) return;
    const containerW = containerRef.current.clientWidth || 900;
    const containerH = 500;
    const scaleX = (containerW - 60) / networkLayout.width;
    const scaleY = (containerH - 60) / networkLayout.height;
    const fitScale = Math.min(1.0, Math.max(0.35, Math.min(scaleX, scaleY)));
    setZoom(fitScale);
    setPan({ x: 20, y: 20 });
  }, [networkLayout]);

  // Mouse Drag to Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // primary click only
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom((z) => Math.min(2.0, Math.max(0.25, z + delta)));
  };

  // Group activities into Phases / WBS categories for Swimlane view
  const swimlaneGroups = useMemo(() => {
    const groups = new Map<string, GraphActivityNode[]>();

    for (const node of graphNodes) {
      // Determine phase/group from code prefix or name
      const codeParts = node.code.split(/[-._]/);
      const groupKey = codeParts.length > 1 ? codeParts[0] : (isAr ? 'أنشطة عامة' : 'General');
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey)!.push(node);
    }

    return Array.from(groups.entries()).map(([name, nodes]) => ({
      name,
      nodes,
      criticalCount: nodes.filter((n) => cpmData.nodes.get(n.id)?.isCritical).length,
    }));
  }, [graphNodes, cpmData.nodes, isAr]);

  // Filtered Critical Path Chain
  const criticalChainNodes = useMemo(() => {
    return cpmData.criticalPath
      .map((id) => nodeMap.get(id))
      .filter((n): n is GraphActivityNode => n !== undefined);
  }, [cpmData.criticalPath, nodeMap]);

  // Selected Activity Details
  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) : null;
  const selectedCPM = selectedNodeId ? cpmData.nodes.get(selectedNodeId) : null;
  const selectedPreds = selectedNodeId ? predsByNode.get(selectedNodeId) || [] : [];
  const selectedSuccs = selectedNodeId ? succsByNode.get(selectedNodeId) || [] : [];

  const NODE_W = 200;
  const NODE_H = 88;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden space-y-3 p-4">
      {/* ── Top Header & Mode Switcher ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              {isAr ? 'شبكة العلاقات وهندسة المسار الحرج' : 'CPM Dependency & Critical Path Graph'}
              {cpmData.hasCycle && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">
                  {isAr ? 'تنبيه: حلقة دائرية' : 'Cycle Detected'}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isAr
                ? 'عرض واضح ومباشر لشبكة الأنشطة والمسار الحرج بدون تشتت أو تمرير معقد'
                : 'Clear, structured views for CPM logic, critical paths, and phase dependencies'}
            </p>
          </div>
        </div>

        {/* ── Layout View Switcher ── */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode('critical_chain')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'critical_chain'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>{isAr ? 'سلسلة المسار الحرج' : 'Critical Chain'}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('swimlanes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'swimlanes'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>{isAr ? 'مسارات المراحل (Swimlanes)' : 'Phase Swimlanes'}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('network')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'network'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>{isAr ? 'المخطط الشبكي التفاعلي' : 'Interactive DAG'}</span>
          </button>
        </div>
      </div>

      {/* ── KPI Summary Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <div>
            <span className="text-slate-400 text-[10px] block">{isAr ? 'إجمالي الأنشطة' : 'Total Activities'}</span>
            <strong className="font-black text-slate-800 dark:text-slate-200">{graphNodes.length}</strong>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <div>
            <span className="text-slate-400 text-[10px] block">{isAr ? 'أنشطة المسار الحرج' : 'Critical Activities'}</span>
            <strong className="font-black text-rose-600 dark:text-rose-400">{cpmData.criticalPath.length}</strong>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-500" />
          <div>
            <span className="text-slate-400 text-[10px] block">{isAr ? 'المدة الإجمالية للمسار' : 'Critical Duration'}</span>
            <strong className="font-black text-emerald-600 dark:text-emerald-400">
              {cpmData.totalProjectDurationDays} {isAr ? 'يوم' : 'days'}
            </strong>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-teal-500" />
          <div>
            <span className="text-slate-400 text-[10px] block">{isAr ? 'علاقات الاعتماد' : 'Total Dependencies'}</span>
            <strong className="font-black text-teal-600 dark:text-teal-400">{graphEdges.length}</strong>
          </div>
        </div>
      </div>

      {/* ── Main Viewport Area ── */}
      <div className="relative">
        {/* ════ VIEW 1: LINEAR CRITICAL CHAIN (Super easy to follow, step by step) ════ */}
        {viewMode === 'critical_chain' && (
          <div className="space-y-4 py-2">
            <div className="p-3 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4" />
                <span>
                  {isAr
                    ? `التسلسل الخطي للمسار الحرج (${criticalChainNodes.length} نشاط بدون سماحية تراجع TF=0)`
                    : `Linear Critical Path Sequence (${criticalChainNodes.length} zero-float bottleneck activities)`}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {fmtD(cpmData.projectEarlyStart, isAr)} → {fmtD(cpmData.projectEarlyFinish, isAr)}
              </span>
            </div>

            {criticalChainNodes.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                {isAr ? 'لا توجد أنشطة على المسار الحرج حالياً' : 'No critical activities found'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {criticalChainNodes.map((node, index) => {
                  const cpm = cpmData.nodes.get(node.id);
                  const isSelected = selectedNodeId === node.id;
                  const preds = predsByNode.get(node.id) || [];
                  const succs = succsByNode.get(node.id) || [];

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`relative rounded-xl border p-3 flex flex-col justify-between transition-all cursor-pointer select-none bg-white dark:bg-slate-900 ${
                        isSelected
                          ? 'border-rose-500 ring-2 ring-rose-400 shadow-md'
                          : 'border-rose-200 dark:border-rose-900/50 hover:border-rose-400 shadow-sm'
                      }`}
                    >
                      {/* Step Indicator Badge */}
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="font-mono text-[11px] font-black text-slate-800 dark:text-slate-200 truncate">
                            {node.code}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                          {node.isMilestone ? '◆ محطة' : `${node.duration} يوم`}
                        </span>
                      </div>

                      {/* Name */}
                      <div className="py-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight">
                          {node.name}
                        </h4>
                      </div>

                      {/* Schedule Dates & Float */}
                      <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-[9px] font-mono text-slate-500 dark:text-slate-400">
                        <div>
                          <span className="block opacity-60">البداية</span>
                          <strong className="text-slate-700 dark:text-slate-300">
                            {fmtD(cpm?.earlyStart || node.plannedStart, isAr)}
                          </strong>
                        </div>
                        <div className="text-center">
                          <span className="block opacity-60">النهاية</span>
                          <strong className="text-slate-700 dark:text-slate-300">
                            {fmtD(cpm?.earlyFinish || node.plannedFinish, isAr)}
                          </strong>
                        </div>
                        <div className="text-end">
                          <span className="block opacity-60">السماحية</span>
                          <strong className="text-rose-600 dark:text-rose-400 font-black">
                            0d (حرج)
                          </strong>
                        </div>
                      </div>

                      {/* Direct Connections Pill */}
                      <div className="mt-2 pt-1 flex items-center justify-between text-[10px] text-slate-400">
                        <span>سابق: {preds.length}</span>
                        <span>لاحق: {succs.length}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════ VIEW 2: WBS SWIMLANES (Organized cleanly by phase) ════ */}
        {viewMode === 'swimlanes' && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {swimlaneGroups.map((group) => (
                <div
                  key={group.name}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-3 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Kanban className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-xs font-black text-slate-900 dark:text-white">
                        {group.name}
                      </h3>
                      <span className="text-[10px] text-slate-400">({group.nodes.length} نشاط)</span>
                    </div>
                    {group.criticalCount > 0 && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                        {group.criticalCount} حرج
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pe-1">
                    {group.nodes.map((node) => {
                      const cpm = cpmData.nodes.get(node.id);
                      const isCrit = cpm?.isCritical;
                      const isSelected = selectedNodeId === node.id;

                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 cursor-pointer transition-all bg-white dark:bg-slate-900 ${
                            isSelected
                              ? 'border-emerald-500 ring-2 ring-emerald-400'
                              : isCrit
                              ? 'border-rose-300 dark:border-rose-900/60 hover:border-rose-400'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-black text-slate-700 dark:text-slate-300">
                                {node.code}
                              </span>
                              {isCrit && (
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {node.name}
                            </p>
                          </div>

                          <div className="text-end shrink-0 font-mono text-[9px] text-slate-500 dark:text-slate-400">
                            <div>{fmtD(cpm?.earlyStart || node.plannedStart, isAr)}</div>
                            <div className={isCrit ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                              {node.duration}d | TF: {cpm?.totalFloatDays ?? 0}d
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ VIEW 3: INTERACTIVE SMART DAG (With drag-to-pan & auto-fit) ════ */}
        {viewMode === 'network' && (
          <div className="space-y-2">
            {/* Canvas Toolbar */}
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                  {isAr ? 'اسحب بالماوس للتحريك بحرية، واستخدم العجلة للتكبير' : 'Click & drag canvas to pan, scroll to zoom'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setOnlyCritical((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    onlyCritical
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {isAr ? 'المسار الحرج فقط' : 'Critical Only'}
                </button>

                <button
                  type="button"
                  onClick={fitToScreen}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer shadow-sm"
                  title={isAr ? 'ملاءمة حجم الشاشة تلقائياً' : 'Fit to Screen'}
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>{isAr ? 'ملء الشاشة' : 'Fit'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.25, z - 0.1))}
                  aria-label={isAr ? 'تصغير' : 'Zoom out'}
                  title={isAr ? 'تصغير' : 'Zoom Out'}
                  className="p-1 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 px-1">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.0, z + 0.1))}
                  aria-label={isAr ? 'تكبير' : 'Zoom in'}
                  title={isAr ? 'تكبير' : 'Zoom In'}
                  className="p-1 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive Draggable Canvas Container */}
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              className={`relative border border-slate-200 dark:border-slate-800 rounded-xl h-[520px] overflow-hidden select-none bg-slate-50/70 dark:bg-slate-950/70 ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: '0 0',
                  width: networkLayout.width,
                  height: networkLayout.height,
                  position: 'relative',
                }}
              >
                {/* SVG Connections */}
                <svg
                  className="absolute inset-0 pointer-events-none"
                  width={networkLayout.width}
                  height={networkLayout.height}
                >
                  <defs>
                    <marker
                      id="arrow-norm"
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
                    </marker>
                    <marker
                      id="arrow-crit"
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="7"
                      markerHeight="7"
                      orient="auto"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
                    </marker>
                  </defs>

                  {graphEdges.map((edge, idx) => {
                    const srcCoord = networkLayout.nodeCoords.get(edge.predecessorId);
                    const dstCoord = networkLayout.nodeCoords.get(edge.successorId);
                    if (!srcCoord || !dstCoord) return null;

                    if (onlyCritical) {
                      const critSet = new Set(cpmData.criticalPath);
                      if (!critSet.has(edge.predecessorId) || !critSet.has(edge.successorId)) {
                        return null;
                      }
                    }

                    const isEdgeCritical =
                      cpmData.criticalPath.includes(edge.predecessorId) &&
                      cpmData.criticalPath.includes(edge.successorId);

                    const x1 = srcCoord.x + NODE_W;
                    const y1 = srcCoord.y + NODE_H / 2;
                    const x2 = dstCoord.x;
                    const y2 = dstCoord.y + NODE_H / 2;

                    const dx = Math.max(30, (x2 - x1) / 2);
                    const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

                    return (
                      <g key={edge.id || `e-${idx}`}>
                        <path
                          d={pathD}
                          fill="none"
                          stroke={isEdgeCritical ? '#e11d48' : '#94a3b8'}
                          strokeWidth={isEdgeCritical ? 2.5 : 1.2}
                          strokeDasharray={edge.type !== 'FS' ? '4 3' : undefined}
                          markerEnd={isEdgeCritical ? 'url(#arrow-crit)' : 'url(#arrow-norm)'}
                        />
                        <text
                          x={(x1 + x2) / 2}
                          y={(y1 + y2) / 2 - 5}
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="bold"
                          fill={isEdgeCritical ? '#be123c' : '#64748b'}
                        >
                          {edge.type}
                          {edge.lagDays ? `+${edge.lagDays}d` : ''}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Node Cards */}
                {graphNodes.map((node) => {
                  const coord = networkLayout.nodeCoords.get(node.id);
                  if (!coord) return null;

                  const cpmNode = cpmData.nodes.get(node.id);
                  const isCrit = cpmNode?.isCritical ?? false;
                  if (onlyCritical && !isCrit) return null;

                  const isSelected = selectedNodeId === node.id;

                  return (
                    <div
                      key={node.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeId(node.id);
                      }}
                      style={{
                        position: 'absolute',
                        left: coord.x,
                        top: coord.y,
                        width: NODE_W,
                        height: NODE_H,
                      }}
                      className={`rounded-xl border shadow-sm p-2 flex flex-col justify-between transition-all cursor-pointer text-start ${
                        isCrit
                          ? 'border-rose-400 dark:border-rose-800 bg-rose-50/90 dark:bg-rose-950/60 text-rose-950 dark:text-rose-100 ring-1 ring-rose-300 dark:ring-rose-900/60'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:border-emerald-400 dark:hover:border-emerald-500'
                      } ${isSelected ? 'ring-2 ring-emerald-500 scale-105 z-30 shadow-lg' : 'z-10'}`}
                    >
                      <div className="flex items-center justify-between gap-1 border-b border-slate-200/50 dark:border-slate-700/50 pb-1">
                        <span className="font-mono text-[10px] font-black truncate max-w-[110px]">
                          {node.code}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            node.isMilestone
                              ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                              : isCrit
                              ? 'bg-rose-200 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          }`}
                        >
                          {node.isMilestone ? '◆ Milestone' : `${node.duration}d`}
                        </span>
                      </div>

                      <div className="text-[10px] font-bold line-clamp-1 leading-tight">
                        {node.name}
                      </div>

                      <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[8px] font-mono text-slate-500 dark:text-slate-400">
                        <div>
                          <span className="block opacity-60">ES</span>
                          <strong className="text-slate-700 dark:text-slate-300">{fmtD(cpmNode?.earlyStart || node.plannedStart, isAr)}</strong>
                        </div>
                        <div className="text-center">
                          <span className="block opacity-60">EF</span>
                          <strong className="text-slate-700 dark:text-slate-300">{fmtD(cpmNode?.earlyFinish || node.plannedFinish, isAr)}</strong>
                        </div>
                        <div className="text-end">
                          <span className="block opacity-60">TF</span>
                          <strong className={isCrit ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-emerald-600 dark:text-emerald-400'}>
                            {cpmNode?.totalFloatDays ?? 0}d
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Slide-Over Activity Inspector Drawer ── */}
        {selectedNode && (
          <div className="fixed inset-y-0 end-0 w-80 md:w-96 bg-white dark:bg-slate-900 border-s border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  {selectedNode.code}
                </span>
                {selectedCPM?.isCritical && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                    {isAr ? 'نشاط حرج' : 'Critical'}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedNodeId(null)}
                aria-label={isAr ? 'إغلاق' : 'Close'}
                title={isAr ? 'إغلاق' : 'Close'}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {selectedNode.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {selectedNode.isMilestone ? 'محطة رئيسية (Milestone)' : `المدة المقدرة: ${selectedNode.duration} يوم`}
              </p>
            </div>

            {/* CPM Schedule Metrics Grid */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950/50 space-y-2 text-xs">
              <h4 className={`text-[11px] font-bold text-slate-500 dark:text-slate-400 ${isAr ? 'tracking-normal' : 'uppercase tracking-wider'}`}>
            {isAr ? 'حسابات ومواعيد CPM' : 'CPM Calculation Dates'}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Early Start (ES)</span>
                  <strong>{fmtD(selectedCPM?.earlyStart || selectedNode.plannedStart, isAr)}</strong>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Early Finish (EF)</span>
                  <strong>{fmtD(selectedCPM?.earlyFinish || selectedNode.plannedFinish, isAr)}</strong>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Late Start (LS)</span>
                  <strong>{fmtD(selectedCPM?.lateStart, isAr)}</strong>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Late Finish (LF)</span>
                  <strong>{fmtD(selectedCPM?.lateFinish, isAr)}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-bold">{isAr ? 'إجمالي السماحية (Total Float):' : 'Total Float (TF):'}</span>
                <span className={`font-black font-mono ${selectedCPM?.isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {selectedCPM?.totalFloatDays ?? 0} {isAr ? 'يوم' : 'days'}
                </span>
              </div>
            </div>

            {/* Predecessors List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>{isAr ? 'الأنشطة السابقة (Predecessors)' : 'Predecessors'}</span>
                <span className="text-[10px] text-slate-400 font-mono">({selectedPreds.length})</span>
              </h4>
              {selectedPreds.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">{isAr ? 'لا يوجد أنشطة سابقة' : 'No predecessors'}</p>
              ) : (
                <div className="space-y-1.5">
                  {selectedPreds.map((p) => {
                    const pNode = nodeMap.get(p.predecessorId);
                    return (
                      <div
                        key={p.id}
                        onClick={() => pNode && setSelectedNodeId(pNode.id)}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-mono text-[10px] font-black text-slate-500 dark:text-slate-400 block">
                            {pNode?.code || p.predecessorId}
                          </span>
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                            {pNode?.name || 'نشاط سابق'}
                          </p>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                          {p.type}{p.lagDays ? `+${p.lagDays}d` : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Successors List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>{isAr ? 'الأنشطة اللاحقة (Successors)' : 'Successors'}</span>
                <span className="text-[10px] text-slate-400 font-mono">({selectedSuccs.length})</span>
              </h4>
              {selectedSuccs.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">{isAr ? 'لا يوجد أنشطة لاحقة' : 'No successors'}</p>
              ) : (
                <div className="space-y-1.5">
                  {selectedSuccs.map((s) => {
                    const sNode = nodeMap.get(s.successorId);
                    return (
                      <div
                        key={s.id}
                        onClick={() => sNode && setSelectedNodeId(sNode.id)}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-mono text-[10px] font-black text-slate-500 dark:text-slate-400 block">
                            {sNode?.code || s.successorId}
                          </span>
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                            {sNode?.name || 'نشاط لاحق'}
                          </p>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                          {s.type}{s.lagDays ? `+${s.lagDays}d` : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
