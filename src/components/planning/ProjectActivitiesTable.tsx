'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  Search,
  Loader2,
  AlertTriangle,
  Milestone,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Table as TableIcon,
  X,
  RefreshCw,
  FolderKanban,
  CheckCircle2,
  Clock,
  Flame,
  Layers,
  ChevronUp,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ResizableTable } from '@/components/ui/ResizableTable';
import { toast } from 'sonner';

interface ProjectActivity {
  id: string;
  code: string | null;
  activity_code?: string | null;
  name_ar: string | null;
  planned_start: string | null;
  planned_finish: string | null;
  duration_days: number | null;
  percent_complete: number | null;
  is_critical: boolean | null;
  is_milestone: boolean | null;
  status: string | null;
  total_float_days: number | null;
  free_float_days?: number | null;
  wbs_item_id?: string | null;
}

interface WbsItemInfo {
  id: string;
  wbs_code: string;
  name_ar: string;
}

type SortKey =
  | 'code'
  | 'name_ar'
  | 'duration_days'
  | 'planned_start'
  | 'planned_finish'
  | 'percent_complete'
  | 'status'
  | 'total_float_days';

type StatusFilterKey =
  | 'all'
  | 'critical'
  | 'in_progress'
  | 'not_started'
  | 'completed'
  | 'milestone'
  | 'critical_float';

const STATUS_CLS: Record<string, string> = {
  not_started: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  in_progress: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/50',
  completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50',
};

const STATUS_AR: Record<string, string> = {
  not_started: 'لم تبدأ',
  in_progress: 'جارية',
  completed: 'منتهية',
};

const STATUS_EN: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
};

function formatDate(dateStr: string | null, isAr: boolean): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

function formatDuration(days: number | null, isMilestone: boolean | null, isAr: boolean): string {
  if (isMilestone || days === 0) {
    return isAr ? 'معلم (0 يوم)' : 'Milestone (0d)';
  }
  if (days === null || days === undefined) return '—';
  return isAr ? `${days} يوم` : `${days} d`;
}

function formatFloat(floatDays: number | null, isAr: boolean): string {
  if (floatDays === null || floatDays === undefined) return '—';
  if (floatDays <= 0) {
    return isAr ? `${floatDays} يوم (حرج)` : `${floatDays}d (Crit)`;
  }
  return isAr ? `+${floatDays} يوم` : `+${floatDays}d`;
}

export default function ProjectActivitiesTable({ projectId }: { projectId: string }) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('all');
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');
  const [sortKey, setSortKey] = useState<SortKey>('planned_start');
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [expandedWbsKeys, setExpandedWbsKeys] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch project activities
  const {
    data: activities = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['project-activities', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pm_project_activities')
        .select(
          'id, code, activity_code, name_ar, planned_start, planned_finish, duration_days, percent_complete, is_critical, is_milestone, status, total_float_days, free_float_days, wbs_item_id'
        )
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('planned_start', { ascending: true })
        .limit(3000);
      if (error) throw error;
      return (data || []) as ProjectActivity[];
    },
    enabled: !!projectId,
  });

  // Fetch project WBS items for hierarchy mapping
  const { data: wbsItems = [] } = useQuery({
    queryKey: ['project-wbs-items', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pm_wbs_items')
        .select('id, wbs_code, name_ar')
        .eq('project_id', projectId)
        .order('wbs_code', { ascending: true });
      if (error) return [];
      return (data || []) as WbsItemInfo[];
    },
    enabled: !!projectId,
  });

  const wbsMap = useMemo(() => {
    const map = new Map<string, WbsItemInfo>();
    wbsItems.forEach((w) => map.set(w.id, w));
    return map;
  }, [wbsItems]);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success(isAr ? `تم نسخ الكود: ${code}` : `Copied code: ${code}`);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleSort = (field: SortKey) => {
    if (sortKey === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(field);
      setSortAsc(true);
    }
  };

  const toggleRowExpand = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  const toggleWbsGroup = (key: string) => {
    setExpandedWbsKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleAllWbsGroups = (expand: boolean) => {
    if (expand) {
      const allKeys = new Set(groupedByWbs.map((g) => g.key));
      setExpandedWbsKeys(allKeys);
    } else {
      setExpandedWbsKeys(new Set());
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = activities.length;
    const critical = activities.filter((a) => a.is_critical).length;
    const inProgress = activities.filter((a) => a.status === 'in_progress').length;
    const notStarted = activities.filter((a) => a.status === 'not_started').length;
    const done = activities.filter(
      (a) => a.status === 'completed' || Number(a.percent_complete || 0) >= 100
    ).length;
    const milestones = activities.filter((a) => a.is_milestone).length;
    const criticalFloat = activities.filter(
      (a) => a.total_float_days !== null && a.total_float_days <= 0
    ).length;
    const avgPct = total
      ? Math.round(activities.reduce((s, a) => s + Number(a.percent_complete || 0), 0) / total)
      : 0;
    return { total, critical, inProgress, notStarted, done, milestones, criticalFloat, avgPct };
  }, [activities]);

  // Filtered activities
  const filtered = useMemo(() => {
    let list = activities;

    // Search filter
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter((a) => {
        const code = (a.code || a.activity_code || '').toLowerCase();
        const name = (a.name_ar || '').toLowerCase();
        const wbs = a.wbs_item_id && wbsMap.has(a.wbs_item_id)
          ? `${wbsMap.get(a.wbs_item_id)?.wbs_code} ${wbsMap.get(a.wbs_item_id)?.name_ar}`.toLowerCase()
          : '';
        return code.includes(s) || name.includes(s) || wbs.includes(s);
      });
    }

    // Status pill filter
    if (statusFilter === 'critical') {
      list = list.filter((a) => a.is_critical);
    } else if (statusFilter === 'in_progress') {
      list = list.filter((a) => a.status === 'in_progress');
    } else if (statusFilter === 'not_started') {
      list = list.filter((a) => a.status === 'not_started');
    } else if (statusFilter === 'completed') {
      list = list.filter((a) => a.status === 'completed' || Number(a.percent_complete || 0) >= 100);
    } else if (statusFilter === 'milestone') {
      list = list.filter((a) => a.is_milestone);
    } else if (statusFilter === 'critical_float') {
      list = list.filter((a) => a.total_float_days !== null && a.total_float_days <= 0);
    }

    // Sorting
    return [...list].sort((a, b) => {
      let va: string | number | boolean | null | undefined = a[sortKey] as string | number | boolean | null | undefined;
      let vb: string | number | boolean | null | undefined = b[sortKey] as string | number | boolean | null | undefined;

      if (sortKey === 'code') {
        va = a.code || a.activity_code || '';
        vb = b.code || b.activity_code || '';
      }

      if (va === null || va === undefined) return sortAsc ? 1 : -1;
      if (vb === null || vb === undefined) return sortAsc ? -1 : 1;

      if (typeof va === 'string' && typeof vb === 'string') {
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      }

      return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
  }, [activities, search, statusFilter, sortKey, sortAsc, wbsMap]);

  // Grouped by WBS for Tree view
  const groupedByWbs = useMemo(() => {
    const groups: {
      key: string;
      wbsCode: string;
      wbsName: string;
      items: ProjectActivity[];
      avgProgress: number;
      criticalCount: number;
    }[] = [];

    const map = new Map<string, ProjectActivity[]>();

    filtered.forEach((act) => {
      const key = act.wbs_item_id || 'unassigned';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(act);
    });

    map.forEach((items, key) => {
      let wbsCode = '—';
      let wbsName = isAr ? 'أنشطة غير مسندة لهيكل WBS' : 'Unassigned to WBS';

      if (key !== 'unassigned' && wbsMap.has(key)) {
        const info = wbsMap.get(key)!;
        wbsCode = info.wbs_code;
        wbsName = info.name_ar;
      }

      const totalItems = items.length;
      const criticalCount = items.filter((i) => i.is_critical).length;
      const avgProgress = totalItems
        ? Math.round(items.reduce((acc, i) => acc + Number(i.percent_complete || 0), 0) / totalItems)
        : 0;

      groups.push({
        key,
        wbsCode,
        wbsName,
        items,
        avgProgress,
        criticalCount,
      });
    });

    // Sort groups by WBS code
    groups.sort((a, b) => a.wbsCode.localeCompare(b.wbsCode));
    return groups;
  }, [filtered, wbsMap, isAr]);

  // Header sort component
  const SortHeader = ({
    field,
    label,
    align = 'start',
    className = '',
  }: {
    field: SortKey;
    label: string;
    align?: 'start' | 'center' | 'end';
    className?: string;
  }) => {
    const isCurrent = sortKey === field;
    return (
      <th
        scope="col"
        role="columnheader"
        aria-sort={isCurrent ? (sortAsc ? 'ascending' : 'descending') : 'none'}
        className={`px-3 py-2.5 font-bold text-slate-500 dark:text-slate-400 select-none ${
          align === 'center' ? 'text-center' : align === 'end' ? 'text-end' : 'text-start'
        } ${className}`}
      >
        <button
          type="button"
          onClick={() => handleSort(field)}
          className={`inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1 py-0.5 cursor-pointer ${
            align === 'center' ? 'mx-auto' : ''
          }`}
          title={isAr ? `فرز حسب ${label}` : `Sort by ${label}`}
        >
          <span>{label}</span>
          {isCurrent ? (
            sortAsc ? (
              <ArrowUp className="w-3 h-3 text-emerald-500" />
            ) : (
              <ArrowDown className="w-3 h-3 text-emerald-500" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-70" />
          )}
        </button>
      </th>
    );
  };

  // 1. Empty state: No project selected
  if (!projectId) {
    return (
      <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-4 shadow-sm">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/40">
          <FolderKanban className="w-7 h-7" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {isAr ? 'يرجى اختيار مشروع لعرض أنشطته' : 'Please select a project'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {isAr
              ? 'اختر مشروعاً من القائمة المنسدلة في الأعلى لاستعراض الأنشطة المستوردة من Primavera، تتبع المسار الحرج وفترات السماح (Float).'
              : 'Select a project from the top selector to inspect Primavera-imported activities, critical path, and float metrics.'}
          </p>
        </div>
      </div>
    );
  }

  // 2. Loading state: Skeleton loader
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Stats & Search Skeleton */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-7 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
            ))}
          </div>
          <div className="h-9 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>

        {/* Table Skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm animate-pulse">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="px-4 py-3.5 flex items-center gap-4">
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded font-mono" />
                <div className="h-4 flex-1 bg-slate-200 dark:bg-slate-800 rounded max-w-sm" />
                <div className="h-4 w-14 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-2 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
                <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. Error state
  if (error) {
    return (
      <div className="py-12 text-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/40 p-6 shadow-sm">
        <AlertTriangle className="w-9 h-9 text-rose-500 mx-auto" />
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {isAr ? 'فشل تحميل أنشطة المشروع' : 'Failed to load project activities'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {error instanceof Error ? error.message : (isAr ? 'حدث خطأ أثناء الاتصال بقاعدة البيانات' : 'Unknown error')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {isAr ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </div>
    );
  }

  // Filter Pills Definitions
  const filterPills: {
    id: StatusFilterKey;
    label: string;
    count: number;
    icon?: React.ReactNode;
    activeClass: string;
  }[] = [
    {
      id: 'all',
      label: isAr ? 'الكل' : 'All',
      count: stats.total,
      activeClass: 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900',
    },
    {
      id: 'critical',
      label: isAr ? 'المسار الحرج' : 'Critical Path',
      count: stats.critical,
      icon: <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />,
      activeClass: 'bg-rose-500 text-white shadow-sm shadow-rose-500/20',
    },
    {
      id: 'in_progress',
      label: isAr ? 'جارية' : 'In Progress',
      count: stats.inProgress,
      icon: <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />,
      activeClass: 'bg-blue-600 text-white shadow-sm shadow-blue-500/20',
    },
    {
      id: 'not_started',
      label: isAr ? 'لم تبدأ' : 'Not Started',
      count: stats.notStarted,
      activeClass: 'bg-slate-600 text-white',
    },
    {
      id: 'completed',
      label: isAr ? 'منتهية' : 'Completed',
      count: stats.done,
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />,
      activeClass: 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20',
    },
    {
      id: 'milestone',
      label: isAr ? 'معالم رئيسية' : 'Milestones',
      count: stats.milestones,
      icon: <Milestone className="w-3.5 h-3.5 text-purple-500 shrink-0" />,
      activeClass: 'bg-purple-600 text-white shadow-sm shadow-purple-500/20',
    },
    {
      id: 'critical_float',
      label: isAr ? 'تعويم حرج (≤ 0)' : 'Critical Float',
      count: stats.criticalFloat,
      activeClass: 'bg-amber-600 text-white shadow-sm shadow-amber-500/20',
    },
  ];

  return (
    <div className="space-y-4">
      {/* ── Toolbar: Filter pills, Search, View mode switch ── */}
      <div className="flex flex-col gap-3">
        {/* Row 1: Interactive Status Filter Pills */}
        <div
          role="group"
          aria-label={isAr ? 'تصفية الأنشطة حسب الحالة' : 'Filter activities by status'}
          className="flex flex-wrap items-center gap-1.5"
        >
          {filterPills.map((pill) => {
            const isActive = statusFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStatusFilter(pill.id)}
                aria-pressed={isActive}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isActive
                    ? `${pill.activeClass} border-transparent shadow-sm`
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {pill.icon}
                <span>{pill.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums font-mono ${
                    isActive
                      ? 'bg-white/20 dark:bg-slate-900/20 text-current'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Row 2: Search input + View mode toggle + Quick summary */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Search Input with RTL-aware positioning */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearch('');
              }}
              placeholder={isAr ? 'بحث بالكود، اسم النشاط، أو WBS…' : 'Search code, activity, or WBS…'}
              className="w-full ps-9 pe-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-start"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 cursor-pointer"
                aria-label={isAr ? 'مسح البحث' : 'Clear search'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls & Mode Switch */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-label={isAr ? 'عرض جدول مسطح' : 'Table view'}
                title={isAr ? 'عرض جدول مسطح' : 'Table view'}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>{isAr ? 'جدول' : 'Table'}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('tree')}
                aria-label={isAr ? 'عرض شجرة WBS' : 'WBS tree view'}
                title={isAr ? 'عرض شجرة WBS' : 'WBS tree view'}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'tree'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>{isAr ? 'شجرة WBS' : 'Tree'}</span>
              </button>
            </div>

            {/* Tree expansion buttons */}
            {viewMode === 'tree' && groupedByWbs.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleAllWbsGroups(true)}
                  className="px-2 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  {isAr ? 'توسيع الكل' : 'Expand All'}
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button
                  type="button"
                  onClick={() => toggleAllWbsGroups(false)}
                  className="px-2 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  {isAr ? 'طي الكل' : 'Collapse All'}
                </button>
              </div>
            )}

            {/* Refresh query button */}
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              title={isAr ? 'تحديث البيانات' : 'Refresh'}
              aria-label={isAr ? 'تحديث البيانات' : 'Refresh'}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-emerald-500' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Table Card / Content ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3 p-6">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {activities.length === 0
                  ? (isAr ? 'لا توجد أنشطة مستوردة لهذا المشروع' : 'No activities imported for this project')
                  : (isAr ? 'لا نتائج مطابقة للبحث أو التصفية' : 'No matching activities')}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {activities.length === 0
                  ? (isAr
                      ? 'يمكنك استيراد جدول زمني بصيغة XER من صفحة الأساس (Baseline) لإنشاء الأنشطة والعلاقات تلقائياً.'
                      : 'You can import an XER schedule file from the Baseline page to automatically generate activities and dependencies.')
                  : (isAr
                      ? 'جرب تعديل معايير البحث أو الضغط على فلتر "الكل" لعرض جميع الأنشطة.'
                      : 'Try adjusting your search query or reset the filter pill to "All".')}
              </p>
            </div>
            {activities.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                {isAr ? 'إعادة ضبط التصفية' : 'Reset filters'}
              </button>
            )}
          </div>
        ) : viewMode === 'tree' ? (
          /* ── TREE VIEW (Grouped by WBS) ── */
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {groupedByWbs.map((group) => {
              const isExpanded = expandedWbsKeys.has(group.key);
              return (
                <div key={group.key} className="transition-colors">
                  {/* WBS Header Accordion Button */}
                  <button
                    type="button"
                    onClick={() => toggleWbsGroup(group.key)}
                    aria-expanded={isExpanded}
                    aria-controls={`wbs-group-${group.key}`}
                    className="w-full px-4 py-3 bg-slate-50/70 dark:bg-slate-950/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 flex items-center justify-between gap-3 text-start transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/50">
                        {group.wbsCode}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {group.wbsName}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      {group.criticalCount > 0 && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/50">
                          <Flame className="w-3 h-3" />
                          {group.criticalCount} {isAr ? 'حرج' : 'crit'}
                        </span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <div className="w-14 sm:w-20 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              group.avgProgress >= 100
                                ? 'bg-emerald-500'
                                : group.avgProgress > 0
                                ? 'bg-blue-500'
                                : 'bg-transparent'
                            }`}
                            style={{ width: `${group.avgProgress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                          {group.avgProgress}%
                        </span>
                      </div>

                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {group.items.length} {isAr ? 'نشاط' : 'act'}
                      </span>
                    </div>
                  </button>

                  {/* WBS Child Activities Table */}
                  {isExpanded && (
                    <div id={`wbs-group-${group.key}`} className="overflow-x-auto">
                      <table className="w-full text-xs text-start">
                        <thead>
                          <tr className="bg-slate-100/50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[10px] border-b border-slate-200 dark:border-slate-800">
                            <th scope="col" className="px-3 py-2 font-bold text-start">{isAr ? 'الكود' : 'Code'}</th>
                            <th scope="col" className="px-3 py-2 font-bold text-start">{isAr ? 'اسم النشاط' : 'Activity Name'}</th>
                            <th scope="col" className="px-2.5 py-2 font-bold text-center">{isAr ? 'المدة' : 'Duration'}</th>
                            <th scope="col" className="px-2.5 py-2 font-bold text-start">{isAr ? 'البداية' : 'Start'}</th>
                            <th scope="col" className="px-2.5 py-2 font-bold text-start">{isAr ? 'النهاية' : 'Finish'}</th>
                            <th scope="col" className="px-2.5 py-2 font-bold text-center">{isAr ? '% الإنجاز' : '% Progress'}</th>
                            <th scope="col" className="px-2.5 py-2 font-bold text-center">{isAr ? 'الحالة' : 'Status'}</th>
                            <th scope="col" className="px-2.5 py-2 font-bold text-center">{isAr ? 'التعويم' : 'Float'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                          {group.items.map((a) => {
                            const pct = Math.round(Number(a.percent_complete || 0));
                            const code = a.code || a.activity_code || '—';
                            return (
                              <tr
                                key={a.id}
                                className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                                  a.is_critical ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                                }`}
                              >
                                <td className="px-3 py-2 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                  <div className="flex items-center gap-1">
                                    <span dir="ltr">{code}</span>
                                    {code !== '—' && (
                                      <button
                                        type="button"
                                        onClick={() => handleCopyCode(code, a.id)}
                                        aria-label={isAr ? `نسخ الكود ${code}` : `Copy ${code}`}
                                        title={isAr ? 'نسخ الكود' : 'Copy code'}
                                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                      >
                                        {copiedId === a.id ? (
                                          <Check className="w-3 h-3 text-emerald-500" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2 max-w-[280px]">
                                  <div className="flex items-center gap-1.5">
                                    {a.is_milestone && <Milestone className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
                                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate" title={a.name_ar || ''}>
                                      {a.name_ar || '—'}
                                    </span>
                                    {a.is_critical && (
                                      <span
                                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 shrink-0"
                                        title={isAr ? 'نشاط على المسار الحرج' : 'Critical path activity'}
                                      >
                                        {isAr ? 'حرج' : 'CP'}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-2.5 py-2 text-center tabular-nums text-slate-600 dark:text-slate-400 text-[11px]">
                                  {formatDuration(a.duration_days, a.is_milestone, isAr)}
                                </td>
                                <td className="px-2.5 py-2 text-slate-500 dark:text-slate-400 text-[11px] tabular-nums" title={a.planned_start || ''}>
                                  {formatDate(a.planned_start, isAr)}
                                </td>
                                <td className="px-2.5 py-2 text-slate-500 dark:text-slate-400 text-[11px] tabular-nums" title={a.planned_finish || ''}>
                                  {formatDate(a.planned_finish, isAr)}
                                </td>
                                <td className="px-2.5 py-2 text-center">
                                  <div className="flex items-center gap-1.5 justify-center">
                                    <div
                                      role="progressbar"
                                      aria-valuenow={pct}
                                      aria-valuemin={0}
                                      aria-valuemax={100}
                                      className="w-12 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
                                    >
                                      <div
                                        className={`h-full rounded-full transition-all ${
                                          pct >= 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-blue-500' : 'bg-transparent'
                                        }`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] tabular-nums font-mono text-slate-500 dark:text-slate-400 w-8">{pct}%</span>
                                  </div>
                                </td>
                                <td className="px-2.5 py-2 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                      STATUS_CLS[a.status || 'not_started'] || STATUS_CLS.not_started
                                    }`}
                                  >
                                    {(isAr ? STATUS_AR : STATUS_EN)[a.status || 'not_started'] || a.status}
                                  </span>
                                </td>
                                <td className="px-2.5 py-2 text-center tabular-nums text-[10px]">
                                  <span
                                    className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                                      (a.total_float_days ?? 0) <= 0
                                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
                                        : 'text-slate-500 dark:text-slate-400'
                                    }`}
                                  >
                                    {formatFloat(a.total_float_days, isAr)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ── TABLE VIEW (Full Detailed Resizable Table) ── */
          <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
            <ResizableTable tableId="project_activities_table">
              <table
                className="w-full text-xs text-start min-w-[880px]"
                aria-label={isAr ? 'جدول أنشطة المشروع' : 'Project activities table'}
              >
                <caption className="sr-only">
                  {isAr ? `أنشطة المشروع (${filtered.length} نشاط)` : `Project activities (${filtered.length} activities)`}
                </caption>
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur text-slate-500 dark:text-slate-400 text-[11px] border-b border-slate-200 dark:border-slate-800">
                    <SortHeader field="code" label={isAr ? 'الكود' : 'Code'} />
                    <SortHeader field="name_ar" label={isAr ? 'اسم النشاط' : 'Activity Name'} />
                    <SortHeader field="duration_days" label={isAr ? 'المدة' : 'Duration'} align="center" />
                    <SortHeader field="planned_start" label={isAr ? 'البداية المخططة' : 'Planned Start'} />
                    <SortHeader field="planned_finish" label={isAr ? 'النهاية المخططة' : 'Planned Finish'} />
                    <SortHeader field="percent_complete" label={isAr ? '% الإنجاز' : '% Progress'} align="center" />
                    <SortHeader field="status" label={isAr ? 'الحالة' : 'Status'} align="center" />
                    <SortHeader field="total_float_days" label={isAr ? 'فترة السماح (Float)' : 'Total Float'} align="center" />
                    <th scope="col" className="px-2.5 py-2.5 font-bold text-center text-slate-500 dark:text-slate-400">
                      {isAr ? 'تفاصيل' : 'Details'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filtered.map((a) => {
                    const pct = Math.round(Number(a.percent_complete || 0));
                    const isExpanded = expandedRowId === a.id;
                    const code = a.code || a.activity_code || '—';
                    const wbs = a.wbs_item_id && wbsMap.has(a.wbs_item_id) ? wbsMap.get(a.wbs_item_id) : null;

                    return (
                      <React.Fragment key={a.id}>
                        <tr
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                            a.is_critical ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                          } ${isExpanded ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}
                        >
                          {/* Code */}
                          <td className="px-3 py-2 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <span dir="ltr">{code}</span>
                              {code !== '—' && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyCode(code, a.id)}
                                  aria-label={isAr ? `نسخ الكود ${code}` : `Copy ${code}`}
                                  title={isAr ? 'نسخ الكود' : 'Copy code'}
                                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                >
                                  {copiedId === a.id ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Activity Name */}
                          <td className="px-3 py-2 max-w-[280px]">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                {a.is_milestone && <Milestone className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
                                <span className="font-bold text-slate-800 dark:text-slate-100 truncate" title={a.name_ar || ''}>
                                  {a.name_ar || '—'}
                                </span>
                                {a.is_critical && (
                                  <span
                                    className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 shrink-0"
                                    title={isAr ? 'نشاط على المسار الحرج' : 'Critical path activity'}
                                  >
                                    {isAr ? 'حرج' : 'CP'}
                                  </span>
                                )}
                              </div>
                              {wbs && (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                                  <Layers className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500 shrink-0" />
                                  <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400">{wbs.wbs_code}</span>
                                  <span className="truncate text-slate-600 dark:text-slate-300">{wbs.name_ar}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Duration */}
                          <td className="px-2.5 py-2 text-center tabular-nums text-slate-600 dark:text-slate-400 text-[11px] font-medium">
                            {formatDuration(a.duration_days, a.is_milestone, isAr)}
                          </td>

                          {/* Planned Start */}
                          <td className="px-2.5 py-2 text-slate-600 dark:text-slate-300 text-[11px] tabular-nums" title={a.planned_start || ''}>
                            {formatDate(a.planned_start, isAr)}
                          </td>

                          {/* Planned Finish */}
                          <td className="px-2.5 py-2 text-slate-600 dark:text-slate-300 text-[11px] tabular-nums" title={a.planned_finish || ''}>
                            {formatDate(a.planned_finish, isAr)}
                          </td>

                          {/* Progress */}
                          <td className="px-2.5 py-2 text-center">
                            <div className="flex items-center gap-1.5 justify-center">
                              <div
                                role="progressbar"
                                aria-valuenow={pct}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                className="w-12 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
                              >
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    pct >= 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-blue-500' : 'bg-transparent'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[10px] tabular-nums font-mono text-slate-500 dark:text-slate-400 w-8">{pct}%</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-2.5 py-2 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                STATUS_CLS[a.status || 'not_started'] || STATUS_CLS.not_started
                              }`}
                            >
                              {(isAr ? STATUS_AR : STATUS_EN)[a.status || 'not_started'] || a.status}
                            </span>
                          </td>

                          {/* Total Float */}
                          <td className="px-2.5 py-2 text-center tabular-nums text-[10px]">
                            <span
                              className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                                (a.total_float_days ?? 0) <= 0
                                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {formatFloat(a.total_float_days, isAr)}
                            </span>
                          </td>

                          {/* Action toggle */}
                          <td className="px-2.5 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => toggleRowExpand(a.id)}
                              aria-expanded={isExpanded}
                              aria-controls={`activity-details-${a.id}`}
                              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200 transition-colors cursor-pointer"
                              title={isAr ? 'عرض التفاصيل' : 'Toggle details'}
                              aria-label={isAr ? `عرض تفاصيل ${a.name_ar}` : `Toggle details for ${a.name_ar}`}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Details Row */}
                        {isExpanded && (
                          <tr id={`activity-details-${a.id}`} className="bg-slate-50/70 dark:bg-slate-950/40">
                            <td colSpan={9} className="px-5 py-3 text-xs border-b border-slate-200 dark:border-slate-800">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-1">
                                <div className="space-y-1">
                                  <span className={`text-[10px] font-bold text-slate-500 dark:text-slate-400 ${isAr ? 'tracking-normal' : 'uppercase tracking-wider'}`}>
                            {isAr ? 'كود WBS والتبعية' : 'WBS Node'}
                                  </span>
                                  <p className="font-bold text-slate-700 dark:text-slate-200">
                                    {wbs ? `${wbs.wbs_code} — ${wbs.name_ar}` : (isAr ? 'غير مسند لهيكل WBS' : 'Unassigned')}
                                  </p>
                                </div>

                                <div className="space-y-1">
                                  <span className={`text-[10px] font-bold text-slate-500 dark:text-slate-400 ${isAr ? 'tracking-normal' : 'uppercase tracking-wider'}`}>
                            {isAr ? 'فترات السماح (Float)' : 'Float Details'}
                                  </span>
                                  <p className="text-slate-700 dark:text-slate-200 font-mono">
                                    {isAr
                                      ? `إجمالي: ${a.total_float_days ?? '—'} يوم | حر: ${a.free_float_days ?? '—'} يوم`
                                      : `Total: ${a.total_float_days ?? '—'}d | Free: ${a.free_float_days ?? '—'}d`}
                                  </p>
                                </div>

                                <div className="space-y-1">
                                  <span className={`text-[10px] font-bold text-slate-500 dark:text-slate-400 ${isAr ? 'tracking-normal' : 'uppercase tracking-wider'}`}>
                            {isAr ? 'نوع النشاط والمسار' : 'Activity Type'}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {a.is_milestone && (
                                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-bold text-[10px]">
                                        {isAr ? 'معلم تعاقدي' : 'Milestone'}
                                      </span>
                                    )}
                                    {a.is_critical ? (
                                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold text-[10px]">
                                        {isAr ? 'على المسار الحرج (Critical)' : 'Critical Path'}
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-bold text-[10px]">
                                        {isAr ? 'نشاط عادي' : 'Standard'}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <span className={`text-[10px] font-bold text-slate-500 dark:text-slate-400 ${isAr ? 'tracking-normal' : 'uppercase tracking-wider'}`}>
                            {isAr ? 'تاريخ التوليد/التحديث' : 'Dates (ISO)'}
                                  </span>
                                  <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                    {a.planned_start ? a.planned_start.slice(0, 10) : '—'} ➔{' '}
                                    {a.planned_finish ? a.planned_finish.slice(0, 10) : '—'}
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </ResizableTable>
          </div>
        )}

        {/* ── Table Footer ── */}
        {filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <div>
              {isAr
                ? `عرض ${filtered.length.toLocaleString('ar-EG')} من إجمالي ${activities.length.toLocaleString('ar-EG')} نشاط`
                : `Showing ${filtered.length} of ${activities.length} activities`}
            </div>
            <div className="flex items-center gap-3 font-mono">
              <span className="text-rose-500 font-bold">
                {isAr ? `${stats.critical} حرج` : `${stats.critical} critical`}
              </span>
              <span>•</span>
              <span className="text-emerald-500 font-bold">
                {isAr ? `${stats.done} منتهي` : `${stats.done} completed`}
              </span>
              <span>•</span>
              <span className="text-blue-500 font-bold">
                {isAr ? `${stats.avgPct}% متوسط الإنجاز` : `${stats.avgPct}% avg progress`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
