'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Clock,
  HardHat,
  CheckCircle2,
  XCircle,
  Search,
  Layers,
  Globe2,
  Building2,
  Eye,
  Loader2,
  ShieldAlert,
  AlertCircle,
  Plus,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { DailyObstruction, ObstructionScope } from '@/types/planning';

interface ObstructionWithProject {
  project?: { name_ar?: string; name_en?: string; code?: string };
}
import { DailyProgressService } from '@/lib/services/dailyProgress.service';
import { useLanguage } from '@/contexts/LanguageContext';
import { UNIFIED_TAXONOMY_CATEGORIES as ALL_CATEGORIES } from './DailyObstructionModal';

export interface ObstructionReportProps {
  projectId?: string;
  className?: string;
  onOpenCreateModal?: () => void;
}

export const UNIFIED_TAXONOMY_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  owner_directive: {
    ar: 'توجيهات المالك / أمر تغيير',
    en: 'Owner Directive / VO',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800',
  },
  weather: {
    ar: 'ظروف جوية قاهرة',
    en: 'Adverse Weather',
    color: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300 dark:border-sky-800',
  },
  material_delay: {
    ar: 'تأخر توريد / اعتماد المواد',
    en: 'Material Delay',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  },
  drawing_delay: {
    ar: 'تأخر اعتماد اللوحات',
    en: 'Shop Drawing Delay',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  },
  subcontractor: {
    ar: 'تعثر مقاول الباطن',
    en: 'Subcontractor Default',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800',
  },
  permit_authority: {
    ar: 'تراخيص الجهات الحكومية',
    en: 'Permits & Authorities',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
  },
  equipment: {
    ar: 'أعطال / نقص المعدات',
    en: 'Equipment Breakdown',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300 dark:border-orange-800',
  },
  manpower: {
    ar: 'نقص العمالة / الإنتاجية',
    en: 'Manpower Shortage',
    color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
  },
  safety: {
    ar: 'ملاحظات السلامة (HSE)',
    en: 'Safety (HSE) Stop',
    color: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300 dark:border-red-800',
  },
  access: {
    ar: 'عوائق الوصول للموقع',
    en: 'Site Access Barrier',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800',
  },
  other: {
    ar: 'إعاقة أخرى غير مصنفة',
    en: 'Other / Force Majeure',
    color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  },
};

export const ObstructionReport: React.FC<ObstructionReportProps> = ({
  projectId,
  className = '',
  onOpenCreateModal,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const queryClient = useQueryClient();

  // Filters State
  const [selectedProjectId] = useState<string>(projectId || 'all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedScope, setSelectedScope] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Resolve Modal State
  const [resolvingObstruction, setResolvingObstruction] = useState<DailyObstruction | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [resolvedDate, setResolvedDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Detail Modal State
  const [viewingObstruction, setViewingObstruction] = useState<DailyObstruction | null>(null);

  // Fetch Cross-Project Obstructions
  const {
    data: obstructions = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [
      'cross-project-obstructions',
      selectedProjectId,
      selectedType,
      selectedScope,
      selectedStatus,
    ],
    queryFn: () =>
      DailyProgressService.getCrossProjectObstructions({
        projectId: selectedProjectId !== 'all' ? selectedProjectId : undefined,
        obstructionType: selectedType !== 'all' ? selectedType : undefined,
        scope: selectedScope !== 'all' ? (selectedScope as ObstructionScope) : undefined,
        status: selectedStatus,
      }),
  });

  // Resolve Mutation
  const resolveMutation = useMutation({
    mutationFn: async () => {
      if (!resolvingObstruction) return;
      const success = await DailyProgressService.resolveObstruction(
        resolvingObstruction.id,
        resolutionNotes.trim() || undefined,
        resolvedDate ? `${resolvedDate}T17:00:00Z` : new Date().toISOString()
      );
      if (!success) {
        throw new Error(isAr ? 'فشل تحديث حالة الإعاقة' : 'Failed to resolve obstruction');
      }
      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cross-project-obstructions'] });
      queryClient.invalidateQueries({ queryKey: ['kpi'] });
      toast.success(isAr ? 'تم إغلاق الإعاقة وتوثيق حلها بنجاح' : 'Obstruction resolved successfully');
      setResolvingObstruction(null);
      setResolutionNotes('');
    },
    onError: (err: Error) => {
      toast.error(err.message || (isAr ? 'حدث خطأ أثناء إغلاق الإعاقة' : 'Error resolving obstruction'));
    },
  });

  // Filtered dataset
  const filteredObstructions = useMemo(() => {
    return obstructions.filter((item) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const descMatch = item.description?.toLowerCase().includes(query);
        const partyMatch = item.responsible_party?.toLowerCase().includes(query);
        const notesMatch = item.resolution_notes?.toLowerCase().includes(query);
        const projectMatch =
          (item as ObstructionWithProject).project?.name_ar?.toLowerCase().includes(query) ||
          (item as ObstructionWithProject).project?.name_en?.toLowerCase().includes(query) ||
          (item as ObstructionWithProject).project?.code?.toLowerCase().includes(query);

        if (!descMatch && !partyMatch && !notesMatch && !projectMatch) {
          return false;
        }
      }
      return true;
    });
  }, [obstructions, searchQuery]);

  // Metric Computations
  const metrics = useMemo(() => {
    const total = obstructions.length;
    const active = obstructions.filter((o) => !o.resolved_at).length;
    const resolved = total - active;
    const totalIdleManpower = obstructions.reduce((sum, o) => sum + Number(o.idle_manpower || 0), 0);
    const totalIdleHours = totalIdleManpower * 8;
    const totalEotDays = obstructions.reduce((sum, o) => sum + Number(o.eot_days || 0), 0);

    // Distribution by Taxonomy
    const typeCountMap = new Map<string, number>();
    obstructions.forEach((o) => {
      let t = o.obstruction_type || 'other';
      if (!UNIFIED_TAXONOMY_LABELS[t]) t = 'other';
      typeCountMap.set(t, (typeCountMap.get(t) || 0) + 1);
    });

    let topCategoryKey = 'drawing_delay';
    let topCategoryCount = 0;
    typeCountMap.forEach((count, key) => {
      if (count > topCategoryCount) {
        topCategoryCount = count;
        topCategoryKey = key;
      }
    });

    const topCategoryLabel = UNIFIED_TAXONOMY_LABELS[topCategoryKey]
      ? isAr
        ? UNIFIED_TAXONOMY_LABELS[topCategoryKey].ar
        : UNIFIED_TAXONOMY_LABELS[topCategoryKey].en
      : topCategoryKey;

    return {
      total,
      active,
      resolved,
      totalIdleManpower,
      totalIdleHours,
      totalEotDays,
      topCategoryKey,
      topCategoryCount,
      topCategoryLabel,
      typeDistribution: Array.from(typeCountMap.entries())
        .map(([type, count]) => ({
          type,
          count,
          pct: total > 0 ? Math.round((count / total) * 100) : 0,
          config: UNIFIED_TAXONOMY_LABELS[type] || UNIFIED_TAXONOMY_LABELS.other,
        }))
        .sort((a, b) => b.count - a.count),
    };
  }, [obstructions, isAr]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={`space-y-6 ${className}`} data-testid="obstruction-report">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="obstruction-metrics-grid">
        {/* Metric 1: Total Active Obstructions */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'الإعاقات النشطة القائمة' : 'Active Obstructions'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white" data-testid="active-obstructions-count">
              {metrics.active}
            </span>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
              / {metrics.total} {isAr ? 'إجمالي' : 'total'}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              {metrics.resolved} {isAr ? 'تم حلها' : 'resolved'}
            </span>
          </div>
        </div>

        {/* Metric 2: Idle Manpower Hours */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'ساعات العمالة المعطلة' : 'Idle Manpower Hours'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <HardHat className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white" data-testid="idle-manpower-hours">
              {metrics.totalIdleHours.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
              {isAr ? 'ساعة عمل' : 'hrs'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>{isAr ? 'ما يعادل' : 'Equivalent to'} </span>
            <strong className="text-slate-800 dark:text-slate-200">{metrics.totalIdleManpower}</strong>
            <span> {isAr ? 'عامل/يوم' : 'man-days'}</span>
          </div>
        </div>

        {/* Metric 3: Total Claimed EOT Days */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'أيام التمديد المطلوبة (EOT)' : 'Total Claimed EOT Days'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white" data-testid="claimed-eot-days">
              {metrics.totalEotDays}
            </span>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
              {isAr ? 'يوم تعويض' : 'days'}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 font-medium">
            <span>{isAr ? 'طبقاً لإخطارات فيديك (20.1)' : 'Logged per FIDIC 20.1'}</span>
          </div>
        </div>

        {/* Metric 4: Top Root Cause */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'السبب الجذري الأكثر تكراراً' : 'Top Root Cause'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-base font-bold text-slate-900 dark:text-white block truncate" title={metrics.topCategoryLabel} data-testid="top-root-cause-label">
              {metrics.total > 0 ? metrics.topCategoryLabel : (isAr ? 'لا توجد إعاقات' : 'No obstructions')}
            </span>
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
              {metrics.total > 0 ? `${metrics.topCategoryCount} ${isAr ? 'واقعة' : 'events'}` : '—'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
            {metrics.total > 0 && (
              <span>{Math.round((metrics.topCategoryCount / metrics.total) * 100)}% {isAr ? 'من إجمالي المعوقات' : 'of all events'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Category Distribution Bar */}
      {metrics.typeDistribution.length > 0 && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3" data-testid="taxonomy-distribution-card">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? 'توزيع الإعاقات طبقاً للتصنيف الموحد (11 فئة)' : 'Taxonomy Distribution (11 Types)'}</span>
            </h4>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
              {metrics.total} {isAr ? 'إعاقة مسجلة' : 'records'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
            {metrics.typeDistribution.map((item) => (
              <div
                key={item.type}
                className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate" title={isAr ? item.config.ar : item.config.en}>
                    {isAr ? item.config.ar : item.config.en}
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                    {item.count}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                  <span>{item.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar & Search */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3" data-testid="obstruction-filters-bar">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute start-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث في الوصف أو المتسبب...' : 'Search description/party...'}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 py-2 ps-9 pe-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              data-testid="search-obstruction-input"
            />
          </div>

          {/* Taxonomy Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              data-testid="filter-taxonomy-select"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{isAr ? 'جميع التصنيفات (11 فئة)' : 'All Taxonomies'}</option>
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat.type} value={cat.type} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {isAr ? cat.labelAr : cat.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Scope Filter */}
          <div>
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              data-testid="filter-scope-select"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{isAr ? 'جميع النطاقات (Task + Site)' : 'All Scopes'}</option>
              <option value="task" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{isAr ? 'بند / مهمة محددة (Task)' : 'Task Level'}</option>
              <option value="site_wide" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{isAr ? 'شامل الموقع بالكامل (Site-Wide)' : 'Site-Wide Impact'}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'active' | 'resolved')}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              data-testid="filter-status-select"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{isAr ? 'جميع الحالات (نشط + محلول)' : 'All Statuses'}</option>
              <option value="active" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{isAr ? 'نشط وغير محلول فقط' : 'Active Only'}</option>
              <option value="resolved" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{isAr ? 'تم حله فقط' : 'Resolved Only'}</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isAr ? 'تحديث' : 'Refresh'}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>{isAr ? 'تحديث' : 'Refresh'}</span>
            </button>

            {onOpenCreateModal && (
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-amber-600 hover:bg-amber-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-amber-500/20 transition-all cursor-pointer"
                data-testid="open-create-obstruction-btn"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{isAr ? 'تسجيل إعاقة' : 'Log New'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Obstructions Table */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs" data-testid="obstructions-table">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="p-3.5 text-start">{isAr ? 'التصنيف والمشروع' : 'Taxonomy & Project'}</th>
                <th className="p-3.5 text-start">{isAr ? 'النطاق (Scope)' : 'Scope'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الوصف والتأثير' : 'Description'}</th>
                <th className="p-3.5 text-center">{isAr ? 'أيام التمديد (EOT)' : 'Claimed EOT'}</th>
                <th className="p-3.5 text-center">{isAr ? 'العمالة / المعدات' : 'Idle Resources'}</th>
                <th className="p-3.5 text-start">{isAr ? 'المتسبب وتاريخ البدء' : 'Party & Start'}</th>
                <th className="p-3.5 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="p-3.5 text-center">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-amber-600 mb-2" />
                    <span>{isAr ? 'جاري تحميل سجل الإعاقات...' : 'Loading obstructions...'}</span>
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-red-500">
                    <AlertCircle className="mx-auto h-6 w-6 mb-2" />
                    <span>{isAr ? 'فشل تحميل سجل الإعاقات' : 'Failed to load obstructions'}</span>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && filteredObstructions.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 dark:text-slate-500">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500/50 mb-2" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">
                      {isAr ? 'لا توجد إعاقات مطابقة لمعايير البحث' : 'No obstructions match the criteria'}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      {isAr ? 'الموقع يعمل بشكل طبيعي دون تسجيل أسباب تعطل نشطة.' : 'Site operations running smoothly without logged blockers.'}
                    </p>
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                filteredObstructions.map((item) => {
                  const typeConfig = UNIFIED_TAXONOMY_LABELS[item.obstruction_type] || UNIFIED_TAXONOMY_LABELS.other;
                  const isResolved = Boolean(item.resolved_at);
                  const projectName =
                    (item as ObstructionWithProject).project?.name_ar ||
                    (item as ObstructionWithProject).project?.name_en ||
                    (item as ObstructionWithProject).project?.code ||
                    item.project_id;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      data-testid={`obstruction-row-${item.id}`}
                    >
                      {/* Taxonomy & Project */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold ${typeConfig.color}`}>
                            {isAr ? typeConfig.ar : typeConfig.en}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[160px]">
                            <Building2 className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span className="truncate">{projectName}</span>
                          </div>
                        </div>
                      </td>

                      {/* Scope */}
                      <td className="p-3.5">
                        {item.scope === 'site_wide' ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <Globe2 className="h-3 w-3" />
                            <span>{isAr ? 'شامل الموقع' : 'Site-Wide'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <Layers className="h-3 w-3" />
                            <span>{isAr ? 'بند محدد' : 'Task'}</span>
                          </span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="p-3.5 max-w-xs">
                        <p className="line-clamp-2 text-slate-800 dark:text-slate-200 font-normal leading-relaxed">
                          {item.description}
                        </p>
                        {item.resolution_notes && (
                          <p className="mt-1 line-clamp-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            ✓ {item.resolution_notes}
                          </p>
                        )}
                      </td>

                      {/* Claimed EOT */}
                      <td className="p-3.5 text-center">
                        {Number(item.eot_days) > 0 ? (
                          <span className="font-mono font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800">
                            +{item.eot_days} {isAr ? 'يوم' : 'd'}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>

                      {/* Idle Resources */}
                      <td className="p-3.5 text-center">
                        <div className="space-y-0.5">
                          {Number(item.idle_manpower) > 0 ? (
                            <div className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400">
                              {item.idle_manpower} {isAr ? 'عامل' : 'workers'}
                            </div>
                          ) : null}
                          {item.idle_equipment_summary ? (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]" title={item.idle_equipment_summary}>
                              {item.idle_equipment_summary}
                            </div>
                          ) : null}
                          {!item.idle_manpower && !item.idle_equipment_summary && (
                            <span className="text-slate-400 dark:text-slate-500">—</span>
                          )}
                        </div>
                      </td>

                      {/* Party & Start */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {item.responsible_party}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            {formatDate(item.started_at)}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        {isResolved ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>{isAr ? 'تم الحل' : 'Resolved'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
                            <ShieldAlert className="h-3 w-3" />
                            <span>{isAr ? 'نشط وقائم' : 'Active'}</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingObstruction(item)}
                            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={isAr ? 'عرض التفاصيل' : 'View Details'}
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {!isResolved && (
                            <button
                              type="button"
                              onClick={() => {
                                setResolvingObstruction(item);
                                setResolutionNotes('');
                                setResolvedDate(new Date().toISOString().slice(0, 10));
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-all cursor-pointer"
                              data-testid={`resolve-btn-${item.id}`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{isAr ? 'إغلاق وحل' : 'Resolve'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolve Obstruction Modal */}
      {resolvingObstruction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200" data-testid="resolve-obstruction-modal">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAr ? 'إغلاق وتوثيق حل الإعاقة' : 'Resolve & Close Obstruction'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'توثيق تاريخ وزوال سبب التوقف واستئناف الأعمال' : 'Record resolution date & mitigation measures'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResolvingObstruction(null)}
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-full transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'الإعاقة الحالية:' : 'Obstruction:'}
                </span>
                <p className="text-slate-600 dark:text-slate-400 line-clamp-3">
                  {resolvingObstruction.description}
                </p>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {isAr ? 'تاريخ زوال الإعاقة واستئناف العمل *' : 'Resolution Date *'}
                </label>
                <input
                  type="date"
                  value={resolvedDate}
                  onChange={(e) => setResolvedDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  data-testid="resolve-date-input"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {isAr ? 'ملاحظات وتفاصيل الحل والإجراء المتخذ' : 'Resolution Notes & Corrective Actions'}
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder={
                    isAr
                      ? 'مثال: تم استلام اعتماد اللوحات برقم خطاب REF-123 واستئناف الأعمال الخرسانية...'
                      : 'e.g. Shop drawings approved under letter REF-123, works resumed...'
                  }
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  data-testid="resolve-notes-input"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingObstruction(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => resolveMutation.mutate()}
                  disabled={resolveMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                  data-testid="confirm-resolve-btn"
                >
                  {resolveMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isAr ? 'تأكيد الحل والإغلاق' : 'Confirm Resolution'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Obstruction Detail Modal */}
      {viewingObstruction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>{isAr ? 'تفاصيل الإعاقة والمطالبة' : 'Obstruction & Claim Details'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setViewingObstruction(null)}
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-full transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-2">
                <span className="text-slate-400 dark:text-slate-500 block">{isAr ? 'الوصف الكامل:' : 'Full Description:'}</span>
                <p className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                  {viewingObstruction.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block mb-0.5">{isAr ? 'الجهة المتسببة:' : 'Responsible Party:'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{viewingObstruction.responsible_party}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block mb-0.5">{isAr ? 'أيام التمديد (EOT):' : 'Claimed EOT Days:'}</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400 font-mono">+{viewingObstruction.eot_days || 0} {isAr ? 'يوم' : 'days'}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block mb-0.5">{isAr ? 'تاريخ البدء:' : 'Start Date:'}</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{formatDate(viewingObstruction.started_at)}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block mb-0.5">{isAr ? 'تاريخ الحل:' : 'Resolved Date:'}</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatDate(viewingObstruction.resolved_at)}</span>
                </div>
              </div>

              {viewingObstruction.resolution_notes && (
                <div className="space-y-1">
                  <span className="text-slate-400 dark:text-slate-500 block">{isAr ? 'ملاحظات الحل والإجراء المتخذ:' : 'Resolution Notes:'}</span>
                  <p className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                    {viewingObstruction.resolution_notes}
                  </p>
                </div>
              )}

              {viewingObstruction.evidence_path && (
                <div className="pt-2">
                  <a
                    href={viewingObstruction.evidence_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isAr ? 'عرض المستند الداعم / الصورة المرفقة' : 'View Attached Evidence'}</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
