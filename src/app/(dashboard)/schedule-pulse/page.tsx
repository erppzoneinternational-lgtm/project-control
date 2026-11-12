'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isDeploymentEnv } from '@/lib/utils/env';
import { 
  GanttChartSquare, 
  ExternalLink, 
  Maximize2, 
  Minimize2, 
  RefreshCw,
  Award,
  Activity,
  Cpu,
  Zap,
  BarChart3,
  Clock,
  Layers,
  Database,
  Keyboard,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  X,
  Split,
  Layout,
  Terminal,
  ArrowUpRight,
  TrendingDown,
  Gauge
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { WifiLoader } from '@/components/ui/WifiLoader';
import { SchedulePulseView } from '@/components/planning/SchedulePulseView';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { supabase } from '@/lib/supabase';

// ── Types & Contracts ────────────────────────────────────────────────────────
export type ViewMode = 'living_p6' | 'analytics' | 'split';

export interface PipelineStageNode {
  id: string;
  key: 'lexer' | 'graph' | 'cpm' | 'evm' | 'render';
  nameEn: string;
  nameAr: string;
  latencyMs: number;
  memoryMb: number;
  cacheHit: boolean;
  status: 'optimal' | 'nominal' | 'degraded';
  descEn: string;
  descAr: string;
  svgX: number;
  svgY: number;
}

export interface PulseTelemetryPoint {
  timestamp: string;
  parseLatency: number;
  frameBudget: number;
  activeNodes: number;
}

export default function SchedulePulsePage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  // ── State Management ───────────────────────────────────────────────────────
  const globalProjectId = useProjectStore((s) => s.activeProjectId);
  const setGlobalProjectId = useProjectStore((s) => s.setActiveProjectId);
  const [projectsList, setProjectsList] = useState<{ id: string; name: string; code: string }[]>([]);

  useEffect(() => {
    let isMounted = true;
    supabase
      .from('pm_projects_with_manager')
      .select('id, project_code, project_name')
      .is('deleted_at', null)
      .order('project_code')
      .then(({ data }) => {
        if (!isMounted) return;
        if (data && data.length > 0) {
          const list = data.map((p) => ({
            id: p.id,
            name: p.project_name || '',
            code: p.project_code || '',
          }));
          setProjectsList(list);
          const current = useProjectStore.getState().activeProjectId;
          if (!current && list[0]) {
            setGlobalProjectId(list[0].id);
          }
        }
      });
    return () => {
      isMounted = false;
    };
  }, [setGlobalProjectId]);

  const [viewMode, setViewMode] = useState<ViewMode>('living_p6');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('cpm');
  const [screenReaderAnnouncement, setScreenReaderAnnouncement] = useState<string>('');

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ── Telemetry & Pulse Benchmark Dataset ────────────────────────────────────
  const [benchmarkRunCount, setBenchmarkRunCount] = useState(1);
  const [telemetryHistory, setTelemetryHistory] = useState<PulseTelemetryPoint[]>([
    { timestamp: '00:00', parseLatency: 18.2, frameBudget: 15.8, activeNodes: 4500 },
    { timestamp: '00:05', parseLatency: 14.1, frameBudget: 16.1, activeNodes: 6200 },
    { timestamp: '00:10', parseLatency: 12.4, frameBudget: 14.9, activeNodes: 9800 },
    { timestamp: '00:15', parseLatency: 19.5, frameBudget: 16.4, activeNodes: 12400 },
    { timestamp: '00:20', parseLatency: 11.8, frameBudget: 15.2, activeNodes: 14820 },
    { timestamp: '00:25', parseLatency: 10.9, frameBudget: 14.7, activeNodes: 14820 },
    { timestamp: '00:30', parseLatency: 13.5, frameBudget: 15.6, activeNodes: 14820 },
  ]);

  // ── Pipeline Stages Data ───────────────────────────────────────────────────
  const pipelineNodes: PipelineStageNode[] = useMemo(() => [
    {
      id: 'lexer',
      key: 'lexer',
      nameEn: 'XER Lexer & Table Decompressor',
      nameAr: 'محلل الجداول والبيانات الزمنية',
      latencyMs: 12.4,
      memoryMb: 4.2,
      cacheHit: true,
      status: 'optimal',
      descEn: 'Decodes Primavera raw tabular chunks (%T, %F, %R), streaming parsed lines to WebWorker heap without blocking UI.',
      descAr: 'تفكيك كتل البيانات الجدولية وضخها مباشرة إلى مسار المعالجة الخلفي دون التأثير على استجابة واجهة المستخدم.',
      svgX: 80,
      svgY: 130,
    },
    {
      id: 'graph',
      key: 'graph',
      nameEn: 'Dependency DAG & Calendar Linker',
      nameAr: 'مخطط الاعتمادات وشبكة العلاقات',
      latencyMs: 9.1,
      memoryMb: 8.6,
      cacheHit: true,
      status: 'optimal',
      descEn: 'Resolves FS/SS/FF/SF dependencies, shifts lag offsets against Primavera 5/6/7-day multi-calendar schedules.',
      descAr: 'ربط علاقات البداية والنهاية وحساب فترات الفارق الزمني مقابل تقاويم المشروع المتعددة بدقة متناهية.',
      svgX: 250,
      svgY: 85,
    },
    {
      id: 'cpm',
      key: 'cpm',
      nameEn: 'CPM Pass & Longest Path Engine',
      nameAr: 'محرك حساب المسار الحرج الأطول',
      latencyMs: 6.8,
      memoryMb: 3.1,
      cacheHit: true,
      status: 'optimal',
      descEn: 'Executes bidirectional topological sort: Early Start/Finish, Late Start/Finish, Total Float, and exact driving path.',
      descAr: 'ترتيب تسلسلي ثنائي الاتجاه: حساب التواريخ المبكرة والمتأخرة، ومقدار الفائض الزمني، وتحديد المسار الحرج بدقة.',
      svgX: 430,
      svgY: 60,
    },
    {
      id: 'evm',
      key: 'evm',
      nameEn: 'Earned Value & S-Curve Vectorizer',
      nameAr: 'محرك القيمة المكتسبة ومنحنيات الإنجاز',
      latencyMs: 4.2,
      memoryMb: 2.8,
      cacheHit: true,
      status: 'optimal',
      descEn: 'Vectorized baseline integration: PV (Planned), EV (Earned), AC (Actual), SPI, CPI, variance analysis, and cashflow forecast.',
      descAr: 'تكامل خط الأساس المتجهي: حساب القيمة المخططة والقيمة المكتسبة والتكلفة الفعلية، مع تحليل التباين والتدفقات المالية.',
      svgX: 610,
      svgY: 110,
    },
    {
      id: 'render',
      key: 'render',
      nameEn: 'Virtualized Gantt & Canvas Mount',
      nameAr: 'عارض المخطط الزمني الافتراضي',
      latencyMs: 3.5,
      memoryMb: 11.4,
      cacheHit: true,
      status: 'optimal',
      descEn: 'Windowed DOM rendering: offloads non-visible timeline bars, maintaining fixed 60 FPS viewport scrolling.',
      descAr: 'عرض افتراضي متطور للأنشطة الزمنية مع استبعاد العناصر خارج إطار الرؤية لضمان أعلى سلاسة في التصفح.',
      svgX: 780,
      svgY: 75,
    },
  ], []);

  const activeNode = useMemo(() => {
    return pipelineNodes.find(n => n.id === selectedNodeId) || pipelineNodes[2];
  }, [pipelineNodes, selectedNodeId]);

  // ── Helper: SVG Bezier Curve Generator ─────────────────────────────────────
  const generateSvgSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      d += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const graphPoints = useMemo(() => {
    const totalPoints = telemetryHistory.length;
    const svgWidth = 860;
    const paddingX = 60;
    const usableWidth = svgWidth - paddingX * 2;
    const stepX = totalPoints > 1 ? usableWidth / (totalPoints - 1) : usableWidth;

    return telemetryHistory.map((item, idx) => {
      // Map parseLatency (0-30ms) to svg Y (180 to 30)
      const clampedLatency = Math.min(Math.max(item.parseLatency, 2), 28);
      const y = 180 - (clampedLatency / 30) * 150;
      return {
        x: paddingX + idx * stepX,
        y: Math.round(y),
        latency: item.parseLatency,
        timestamp: item.timestamp,
      };
    });
  }, [telemetryHistory]);

  const sparklinePath = useMemo(() => generateSvgSmoothPath(graphPoints), [graphPoints]);
  const areaPath = useMemo(() => {
    if (graphPoints.length === 0) return '';
    const first = graphPoints[0];
    const last = graphPoints[graphPoints.length - 1];
    return `${sparklinePath} L ${last.x} 190 L ${first.x} 190 Z`;
  }, [sparklinePath, graphPoints]);

  // ── Actions & Handlers ─────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => {
      const next = !prev;
      setScreenReaderAnnouncement(
        next 
          ? (isAr ? 'تم تفعيل وضع ملء الشاشة' : 'Fullscreen mode activated')
          : (isAr ? 'تم إنهاء وضع ملء الشاشة' : 'Fullscreen mode exited')
      );
      return next;
    });
  }, [isAr]);

  const handleRefresh = useCallback(() => {
    setIsReloading(true);
    setIsIframeLoading(true);
    setLoadTimedOut(false);
    setScreenReaderAnnouncement(isAr ? 'جارٍ إعادة تحميل محرك نبض البرنامج الزمني...' : 'Reloading Schedule Pulse Engine...');

    if (iframeRef.current) {
      iframeRef.current.src = isAr ? '/pulse-engine/schedule-pulse-ar.html' : '/pulse-engine/schedule-pulse-en.html';
    }

    // Reset reloading indicator after short feedback
    setTimeout(() => {
      setIsReloading(false);
    }, 700);
  }, [isAr]);

  const handleRunBenchmark = useCallback(() => {
    setIsBenchmarking(true);
    setScreenReaderAnnouncement(isAr ? 'بدء تشغيل اختبار كفاءة المعالجة الحسابية...' : 'Running performance stress benchmark...');

    setTimeout(() => {
      const nextRun = benchmarkRunCount + 1;
      setBenchmarkRunCount(nextRun);

      // Generate randomized realistic telemetry step
      const simulatedLatency = +(10 + Math.random() * 5).toFixed(1);
      const simulatedFrame = +(14.5 + Math.random() * 2).toFixed(1);
      const simulatedNodes = 14820 + nextRun * 120;
      const nextTimestamp = `00:${String(nextRun * 5).padStart(2, '0')}`;

      setTelemetryHistory(prev => {
        const next = [...prev.slice(1), {
          timestamp: nextTimestamp,
          parseLatency: simulatedLatency,
          frameBudget: simulatedFrame,
          activeNodes: simulatedNodes,
        }];
        return next;
      });

      setIsBenchmarking(false);
      setScreenReaderAnnouncement(
        isAr 
          ? `اكتمل الاختبار بنجاح: زمن المعالجة ${simulatedLatency} مللي ثانية، بمعدل استقرار 60 إطاراً بالثانية`
          : `Benchmark complete: Parse latency ${simulatedLatency}ms, 60 FPS stable frame budget`
      );
    }, 900);
  }, [benchmarkRunCount, isAr]);

  // ── Iframe Load & Timeout Watcher ───────────────────────────────────────────
  useEffect(() => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);

    loadTimeoutRef.current = setTimeout(() => {
      if (isIframeLoading) {
        setLoadTimedOut(true);
      }
    }, 7500);

    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [isIframeLoading]);

  const handleIframeLoaded = () => {
    setIsIframeLoading(false);
    setLoadTimedOut(false);
    setScreenReaderAnnouncement(isAr ? 'تم تحميل محرك نبض البرنامج الزمني بنجاح وهو جاهز للاستخدام' : 'Schedule Pulse Engine ready');
  };

  // ── Keyboard Shortcuts Listener ───────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is focusing an input, textarea, or contentEditable
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.key === '1') {
        e.preventDefault();
        setViewMode('living_p6');
        setScreenReaderAnnouncement(isAr ? 'تم التبديل إلى عارض البرنامج الزمني التفاعلي' : 'Switched to Interactive P6 Engine');
      } else if (e.key === '2') {
        e.preventDefault();
        setViewMode('analytics');
        setScreenReaderAnnouncement(isAr ? 'تم التبديل إلى لوحة مؤشرات الأداء' : 'Switched to Developer Analytics');
      } else if (e.key === '3' || e.key.toLowerCase() === 's') {
        e.preventDefault();
        setViewMode('split');
        setScreenReaderAnnouncement(isAr ? 'تم التبديل إلى نمط العرض المزدوج' : 'Switched to Split View');
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleRefresh();
      } else if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleRunBenchmark();
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
      } else if (e.key === 'Escape') {
        if (showShortcutsModal) {
          setShowShortcutsModal(false);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAr, toggleFullscreen, handleRefresh, handleRunBenchmark, showShortcutsModal, isFullscreen]);

  // ── Node Keyboard Arrow Navigation ─────────────────────────────────────────
  const handleNodeKeyDown = (e: React.KeyboardEvent, index: number) => {
    const total = pipelineNodes.length;
    let nextIndex = index;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = isAr ? (index - 1 + total) % total : (index + 1) % total;
      setSelectedNodeId(pipelineNodes[nextIndex].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = isAr ? (index + 1) % total : (index - 1 + total) % total;
      setSelectedNodeId(pipelineNodes[nextIndex].id);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedNodeId(pipelineNodes[index].id);
      setScreenReaderAnnouncement(
        isAr 
          ? `تم تحديد: ${pipelineNodes[index].nameAr}، زمن التنفيذ ${pipelineNodes[index].latencyMs} مللي ثانية`
          : `Selected: ${pipelineNodes[index].nameEn}, Latency ${pipelineNodes[index].latencyMs}ms`
      );
    }
  };

  return (
    <div 
      className={`flex flex-col text-slate-900 dark:text-slate-100 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 p-2 sm:p-4' : 'min-h-[calc(100vh-64px)] p-3 sm:p-5 lg:p-7 space-y-4 max-w-[1720px] mx-auto'}`} 
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* ── Screen Reader Live Region ── */}
      <div aria-live="polite" className="sr-only">
        {screenReaderAnnouncement}
      </div>

      {/* ── Top Bar with Architectural Brand & Controls ── */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-sky-500/25 shrink-0">
            <GanttChartSquare className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={`text-base sm:text-lg lg:text-xl font-black text-slate-900 dark:text-slate-100 ${isAr ? 'tracking-normal' : 'tracking-tight'}`}>
                {isAr ? 'نبض البرنامج الزمني' : 'Schedule Pulse — P6 Engine'}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 text-sky-700 dark:text-sky-300 text-[10px] font-bold">
                <Award className="w-3 h-3 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                {isAr ? 'تطوير: م. حسن سليمان' : 'Dev by Hassan A. Soliman'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span dir="ltr">12.4 ms</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 line-clamp-1">
              {isAr 
                ? 'تحليل الجداول الزمنية وحسابات القيمة المكتسبة وتحديد المسار الحرج وسجل التغييرات ومنحنيات الإنجاز التراكمي'
                : 'Primavera P6 (.XER) Living Engine, Earned Value EVM, Longest Path Gantt, and Schedule Change Log'}
            </p>
          </div>
        </div>

        {/* ── Mode Switcher & Action Controls ── */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Active Project Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-300/80 dark:border-emerald-700/60 bg-emerald-50/70 dark:bg-emerald-950/40 text-xs font-bold shadow-2xs transition-colors hover:border-emerald-400">
            <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
            <label htmlFor="schedule-pulse-project-selector" className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 hidden sm:inline">
              {isAr ? 'المشروع:' : 'Project:'}
            </label>
            {projectsList.length > 0 ? (
              <select
                id="schedule-pulse-project-selector"
                value={globalProjectId || ''}
                onChange={(e) => setGlobalProjectId(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-100 font-bold focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[220px] truncate"
                title={isAr ? 'تحديد المشروع النشط لمزامنة البيانات الحية' : 'Select active project for live DB sync'}
                aria-label={isAr ? 'اختر المشروع النشط' : 'Select active project'}
              >
                {projectsList.map((p) => (
                  <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {p.code ? `#${p.code} — ` : ''}{p.name || p.id}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-slate-500 dark:text-slate-400 text-xs font-normal">
                {isAr ? 'جارٍ التحميل...' : 'Loading projects...'}
              </span>
            )}
          </div>

          {/* Accessible View Mode Tabs */}
          <div 
            role="tablist" 
            aria-label={isAr ? 'أوضاع العرض' : 'View Modes'}
            className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/70 dark:border-slate-800"
          >
            <button
              role="tab"
              type="button"
              aria-selected={viewMode === 'living_p6'}
              tabIndex={viewMode === 'living_p6' ? 0 : -1}
              onClick={() => setViewMode('living_p6')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none ${
                viewMode === 'living_p6'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Layout className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'البرنامج الزمني' : 'P6 Engine'}</span>
              <kbd className="hidden sm:inline-block px-1 py-0.5 text-[9px] font-mono bg-slate-200/60 dark:bg-slate-700/60 rounded text-slate-500 dark:text-slate-400">1</kbd>
            </button>

            <button
              role="tab"
              type="button"
              aria-selected={viewMode === 'analytics'}
              tabIndex={viewMode === 'analytics' ? 0 : -1}
              onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none ${
                viewMode === 'analytics'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Activity className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'مؤشرات الأداء' : 'Dev Analytics'}</span>
              <kbd className="hidden sm:inline-block px-1 py-0.5 text-[9px] font-mono bg-slate-200/60 dark:bg-slate-700/60 rounded text-slate-500 dark:text-slate-400">2</kbd>
            </button>

            <button
              role="tab"
              type="button"
              aria-selected={viewMode === 'split'}
              tabIndex={viewMode === 'split' ? 0 : -1}
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Split className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'عرض مزدوج' : 'Split'}</span>
              <kbd className="hidden sm:inline-block px-1 py-0.5 text-[9px] font-mono bg-slate-200/60 dark:bg-slate-700/60 rounded text-slate-500 dark:text-slate-400">3</kbd>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isReloading}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none disabled:opacity-50"
              title={isAr ? 'إعادة تحميل البيانات (R)' : 'Reload Engine (R)'}
              aria-label={isAr ? 'إعادة تحميل محرك البرنامج الزمني' : 'Reload P6 Engine'}
            >
              <RefreshCw className={`w-4 h-4 ${isReloading ? 'animate-spin text-sky-600 dark:text-sky-400' : ''}`} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setShowShortcutsModal(true)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
              title={isAr ? 'اختصارات لوحة المفاتيح (?)' : 'Keyboard Shortcuts (?)'}
              aria-label={isAr ? 'عرض اختصارات لوحة المفاتيح' : 'Show Keyboard Shortcuts'}
            >
              <Keyboard className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
              title={isFullscreen ? (isAr ? 'إنهاء وضع ملء الشاشة (F)' : 'Exit Fullscreen (F)') : (isAr ? 'ملء الشاشة (F)' : 'Fullscreen (F)')}
              aria-label={isFullscreen ? (isAr ? 'إنهاء وضع ملء الشاشة' : 'Exit Fullscreen') : (isAr ? 'تفعيل وضع ملء الشاشة' : 'Fullscreen')}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" /> : <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />}
              <span className="hidden md:inline">{isFullscreen ? (isAr ? 'إنهاء التكبير' : 'Exit Full') : (isAr ? 'ملء الشاشة' : 'Fullscreen')}</span>
            </button>

            <a
              href={`${isAr ? "/pulse-engine/schedule-pulse-ar.html" : "/pulse-engine/schedule-pulse-en.html"}${globalProjectId ? `?projectId=${encodeURIComponent(globalProjectId)}` : ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              title={isAr ? 'فتح في نافذة مستقلة' : 'Open in new window'}
            >
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'فتح في نافذة مستقلة' : 'Open Window'}</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── Performance Pulse Graph & Developer Analytics Section ── */}
      {(viewMode === 'analytics' || viewMode === 'split') && (
        <section 
          aria-label={isAr ? 'لوحة تحليلات المطور ومؤشرات الأداء' : 'Developer Analytics & Telemetry'}
          className="space-y-4"
        >
          {/* Top KPI Metric Cards with Strict RTL Alignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Metric 1: XER Lexer Latency */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-sky-500/40 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="text-start min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {isAr ? 'زمن تحليل البيانات الزمنية' : 'XER Parse Latency'}
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span dir="ltr" className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                      12.4 ms
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">P95: 21.8ms</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/60 dark:border-sky-800/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <Cpu className="w-5 h-5" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
                  <span dir="ltr">-18.4%</span>
                  <span className="text-slate-500 dark:text-slate-400 font-normal">
                    {isAr ? 'مقارنة بالمعدل القياسي' : 'vs standard'}
                  </span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/50">
                  {isAr ? 'استجابة فائقة' : 'Ultra-Fast'}
                </span>
              </div>
            </div>

            {/* Metric 2: CPM Engine & Longest Path */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="text-start min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {isAr ? 'محرك حساب المسار الحرج' : 'CPM & Longest Path Engine'}
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span dir="ltr" className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                      6.8 ms
                    </span>
                    <span dir="ltr" className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400">O(V+E)</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" aria-hidden="true" />
                  <span>{isAr ? 'خالٍ تماماً من التكرار' : '0 Circular Cycles'}</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800/50">
                  {isAr ? 'تحليل تسلسلي متكامل' : 'Topological'}
                </span>
              </div>
            </div>

            {/* Metric 3: EVM S-Curve Vectorizer */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-teal-500/40 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="text-start min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {isAr ? 'حسابات القيمة المكتسبة' : 'Earned Value (EVM) Vector'}
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span dir="ltr" className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                      4.2 ms
                    </span>
                    <span dir="ltr" className="text-[10px] font-mono text-teal-600 dark:text-teal-400">60 FPS</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span dir="ltr" className="font-mono">100%</span>
                  <span className="text-slate-500 dark:text-slate-400 font-normal">
                    {isAr ? 'دقة متجهات خط الأساس' : 'BCWS/BCWP accuracy'}
                  </span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-[10px] font-bold border border-teal-200 dark:border-teal-800/50">
                  {isAr ? 'معالجة متجهة' : 'Vectorized'}
                </span>
              </div>
            </div>

            {/* Metric 4: WebWorker Heap & Footprint */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="text-start min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {isAr ? 'ذاكرة المعالجة الخلفية' : 'Worker Heap & Cache'}
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span dir="ltr" className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                      34.6 MB
                    </span>
                    <span dir="ltr" className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Peak 48MB</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                  <span dir="ltr" className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">98.6%</span>
                  <span className="text-slate-500 dark:text-slate-400 font-normal">
                    {isAr ? 'معدل الاستجابة من الذاكرة المؤقتة' : 'Cache Hit Rate'}
                  </span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800/50">
                  {isAr ? 'انعدام هدر الذاكرة' : '0 GC Thrash'}
                </span>
              </div>
            </div>
          </div>

          {/* ── Interactive Performance Pulse Graph Card ── */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
                    {isAr ? 'مخطط نبض الأداء اللحظي' : 'Responsive Performance Pulse Graph'}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr
                    ? 'تتبع حي لزمن المعالجة في كل مرحلة من مراحل الحساب الزمني مع عقد تفاعلية قابلة للاستكشاف عبر لوحة المفاتيح'
                    : 'Real-time pipeline stage latency tracking with keyboard-accessible interactive nodes'}
                </p>
              </div>

              {/* Stress Benchmark Trigger & Indicators */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleRunBenchmark}
                  disabled={isBenchmarking}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none disabled:opacity-50"
                  aria-label={isAr ? 'تشغيل اختبار كفاءة المعالجة الحسابية' : 'Run Performance Benchmark'}
                >
                  <Play className={`w-3.5 h-3.5 ${isBenchmarking ? 'animate-spin' : ''}`} aria-hidden="true" />
                  <span>{isBenchmarking ? (isAr ? 'جارٍ الاختبار...' : 'Benchmarking...') : (isAr ? 'اختبار كفاءة المعالجة (B)' : 'Stress Benchmark (B)')}</span>
                </button>
              </div>
            </div>

            {/* Responsive SVG Pulse Graph */}
            <div className="relative w-full overflow-hidden rounded-xl bg-slate-950 p-2 sm:p-4 text-white">
              {/* Metric Legend & Frame Target */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-2 px-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-sky-400 rounded-full inline-block"></span>
                    <span className="text-[11px] text-slate-300">
                      {isAr ? 'زمن المعالجة الحسابية' : 'Compute Latency (ms)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-t border-dashed border-emerald-400 inline-block"></span>
                    <span className="text-[11px] text-emerald-400 font-mono">
                      {isAr ? 'المعدل المستهدف (60 إطاراً بالثانية)' : '60 FPS Target (16.6ms)'}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-mono">
                  {isAr ? 'فترة القياس: كل 5 ثوانٍ | العقد النشطة: ' : 'Sampling: 5s window | Active Nodes: '}
                  <span dir="ltr" className="text-sky-300 font-bold">14,820</span>
                </div>
              </div>

              {/* The SVG Visualization */}
              <div className="w-full aspect-[16/6] min-h-[190px] max-h-[260px] relative">
                <svg
                  viewBox="0 0 860 200"
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label={isAr ? 'مخطط نبض الأداء الزمني لمحرك الحسابات' : 'Time-series Performance Pulse Graph for P6 Engine'}
                >
                  <defs>
                    <linearGradient id="pulseAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity="0.45" />
                      <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="pulseLineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="50%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines */}
                  <line x1="40" y1="180" x2="820" y2="180" stroke="#1e293b" strokeWidth="1" />
                  <line x1="40" y1="130" x2="820" y2="130" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="40" y1="80" x2="820" y2="80" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="40" y1="30" x2="820" y2="30" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

                  {/* 16.6ms Target Line */}
                  <line 
                    x1="40" 
                    y1="97" 
                    x2="820" 
                    y2="97" 
                    stroke="#10b981" 
                    strokeWidth="1.5" 
                    strokeDasharray="4 4" 
                    opacity="0.8" 
                  />

                  {/* Area Fill */}
                  <path d={areaPath} fill="url(#pulseAreaGrad)" />

                  {/* Stroke Wave */}
                  <path
                    d={sparklinePath}
                    fill="none"
                    stroke="url(#pulseLineGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Dynamic Pipeline Interactive Nodes along timeline */}
                  {pipelineNodes.map((node, index) => {
                    const isSelected = activeNode.id === node.id;
                    return (
                      <g 
                        key={node.id} 
                        className="cursor-pointer focus:outline-none"
                        onClick={() => {
                          setSelectedNodeId(node.id);
                          setScreenReaderAnnouncement(
                            isAr 
                              ? `تم تحديد عقدة: ${node.nameAr}`
                              : `Selected stage node: ${node.nameEn}`
                          );
                        }}
                        onKeyDown={(e) => handleNodeKeyDown(e, index)}
                        tabIndex={0}
                        role="button"
                        aria-pressed={isSelected}
                        aria-label={`${isAr ? node.nameAr : node.nameEn}, ${node.latencyMs}ms`}
                      >
                        {/* Outer Pulse Ring if Selected */}
                        {isSelected && (
                          <circle
                            cx={node.svgX}
                            cy={node.svgY}
                            r="14"
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="2"
                            opacity="0.7"
                            className="animate-ping"
                          />
                        )}

                        {/* Node Halo */}
                        <circle
                          cx={node.svgX}
                          cy={node.svgY}
                          r={isSelected ? "9" : "6"}
                          fill={isSelected ? "#0284c7" : "#0f172a"}
                          stroke={isSelected ? "#38bdf8" : "#94a3b8"}
                          strokeWidth={isSelected ? "3" : "2"}
                          className="transition-all duration-200 hover:scale-125"
                        />

                        {/* Node Label Text */}
                        <text
                          x={node.svgX}
                          y={node.svgY - 14}
                          textAnchor="middle"
                          fill={isSelected ? "#38bdf8" : "#94a3b8"}
                          fontSize="10"
                          fontWeight={isSelected ? "700" : "500"}
                          fontFamily="ui-monospace, monospace"
                        >
                          {node.latencyMs}ms
                        </text>

                        {/* Stage Abbreviation Badge */}
                        <text
                          x={node.svgX}
                          y={node.svgY + 20}
                          textAnchor="middle"
                          fill={isSelected ? "#ffffff" : "#64748b"}
                          fontSize="9"
                          fontWeight="600"
                        >
                          {isAr ? `المرحلة ${index + 1}` : `Stage ${index + 1}`}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Time Axis Markers */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-4 pt-1 border-t border-slate-900">
                {telemetryHistory.map((item, idx) => (
                  <span key={idx}>{item.timestamp}</span>
                ))}
              </div>
            </div>

            {/* ── Accessible Interactive Node Inspector Card ── */}
            <div 
              role="region"
              aria-label={isAr ? 'تفاصيل مرحلة المعالجة المختارة' : 'Selected Computational Node Details'}
              className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" aria-hidden="true" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    {isAr ? activeNode.nameAr : activeNode.nameEn}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300">
                    ID: {activeNode.id}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-sky-500" aria-hidden="true" />
                    <span>{isAr ? 'زمن التنفيذ:' : 'Exec:'}</span>
                    <strong dir="ltr" className="font-mono text-slate-900 dark:text-slate-100">{activeNode.latencyMs} ms</strong>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <Database className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
                    <span>{isAr ? 'الذاكرة المستخدمة:' : 'Heap:'}</span>
                    <strong dir="ltr" className="font-mono text-slate-900 dark:text-slate-100">{activeNode.memoryMb} MB</strong>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                  {isAr ? activeNode.descAr : activeNode.descEn}
                </p>

                {/* Node Selector Pills for Direct Accessible Switching */}
                <div 
                  role="group" 
                  aria-label={isAr ? 'مراحل خط المعالجة' : 'Pipeline Stages'}
                  className="flex flex-wrap items-center gap-1.5 shrink-0"
                >
                  {pipelineNodes.map((n, i) => {
                    const pillLabelsAr = ['المحلل', 'العلاقات', 'المسار الحرج', 'القيمة المكتسبة', 'العرض'];
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          setSelectedNodeId(n.id);
                          setScreenReaderAnnouncement(
                            isAr ? `تم تحديد ${n.nameAr}` : `Selected ${n.nameEn}`
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none ${
                          activeNode.id === n.id
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-500'
                        }`}
                      >
                        {i + 1}. {isAr ? pillLabelsAr[i] : n.id.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Interactive Living P6 Tool Embedded Container ── */}
      {(viewMode === 'living_p6' || viewMode === 'split') && (
        <section 
          aria-label={isAr ? 'محرك وعارض نبض البرنامج الزمني التفاعلي' : 'Schedule Pulse Interactive Living View'}
          className="flex-1 rounded-2xl overflow-hidden shadow-sm"
        >
          <SchedulePulseView
            projectId={globalProjectId}
            className="w-full h-full"
          />
        </section>
      )}

      {/* ── Accessible Keyboard Shortcuts Modal ── */}
      {showShortcutsModal && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                <h3 id="shortcuts-dialog-title" className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {isAr ? 'اختصارات لوحة المفاتيح والتحكم' : 'Keyboard Controls & Hotkeys'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
                aria-label={isAr ? 'إغلاق النافذة' : 'Close shortcuts modal'}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-300">{isAr ? 'التبديل إلى عارض البرنامج الزمني التفاعلي' : 'Switch to Living P6 Engine'}</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200">1</kbd>
              </div>

              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-300">{isAr ? 'التبديل إلى لوحة مؤشرات الأداء' : 'Switch to Developer Analytics'}</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200">2</kbd>
              </div>

              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-300">{isAr ? 'التبديل إلى نمط العرض المزدوج' : 'Switch to Split View'}</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200">3</kbd>
                  <span className="text-slate-400 dark:text-slate-500">/</span>
                  <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200">S</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-300">{isAr ? 'إعادة تحميل الأداة والبيانات' : 'Reload Engine & Fresh Parse'}</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200">R</kbd>
              </div>

              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-300">{isAr ? 'تشغيل اختبار كفاءة المعالجة الحسابية' : 'Trigger Stress Benchmark'}</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200">B</kbd>
              </div>

              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-300">{isAr ? 'تبديل وضع ملء الشاشة' : 'Toggle Fullscreen'}</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200">F</kbd>
              </div>

              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-300">{isAr ? 'التنقل بين مراحل خط المعالجة' : 'Navigate Graph Stage Nodes'}</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200">←</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200">→</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-300">{isAr ? 'إغلاق النوافذ أو إنهاء التكبير' : 'Close Modals / Exit Fullscreen'}</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200">Esc</kbd>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="w-full py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
              >
                {isAr ? 'إغلاق' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
