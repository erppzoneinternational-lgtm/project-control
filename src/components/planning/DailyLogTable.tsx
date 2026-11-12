'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  Layers, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  Lock, 
  XCircle, 
  Eye, 
  Camera, 
  FileText, 
  AlertTriangle, 
  Send, 
  ChevronLeft, 
  RefreshCw, 
  Edit3,
  HardHat,
  Truck,
  Sun,
  CloudSun,
  CloudRain,
  Wind,
  ThermometerSun,
  CloudFog,
  Cloud,
  Maximize2,
  List,
} from 'lucide-react';
import { 
  DailyProgress, 
  DailyProgressStatus, 
  DailyDiscipline, 
  LineStatus, 
  InspectionStatus,
  DailyProgressPhoto
} from '@/types/planning';
import { DailyProgressService } from '@/lib/services/dailyProgress.service';
import { DISCIPLINE_LABELS } from './DailyProgressForm';
import { useLanguage } from '@/contexts/LanguageContext';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { ResizableTable } from '@/components/ui/ResizableTable';
import { emitAtsmatrixEvent } from '@/lib/services/atsmatrix.service';
import { DailyPhotoModal } from './DailyPhotoModal';
import { DailyReportTimeline } from './DailyReportTimeline';

export const STATUS_CONFIG: Record<
  DailyProgressStatus,
  { labelAr: string; color: string; border: string; icon: React.ElementType }
> = {
  draft: {
    labelAr: 'مسودة',
    color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-800/80',
    border: 'border-amber-300/80 dark:border-amber-800/80',
    icon: Clock,
  },
  submitted: {
    labelAr: 'قيد المراجعة',
    color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-300/80 dark:border-blue-800/80',
    border: 'border-blue-300/80 dark:border-blue-800/80',
    icon: Clock,
  },
  partially_approved: {
    labelAr: 'معتمد جزئياً',
    color: 'bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border-orange-300/80 dark:border-orange-800/80',
    border: 'border-orange-300/80 dark:border-orange-800/80',
    icon: AlertTriangle,
  },
  approved: {
    labelAr: 'معتمد بالكامل',
    color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800/80',
    border: 'border-emerald-300/80 dark:border-emerald-800/80',
    icon: Lock,
  },
  rejected: {
    labelAr: 'مرفوض',
    color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300/80 dark:border-rose-800/80',
    border: 'border-rose-300/80 dark:border-rose-800/80',
    icon: XCircle,
  },
  reopened: {
    labelAr: 'معاد فتحه',
    color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-300/80 dark:border-purple-800/80',
    border: 'border-purple-300/80 dark:border-purple-800/80',
    icon: RotateCcw,
  },
};

export const LINE_STATUS_CONFIG: Record<LineStatus, { labelAr: string; color: string }> = {
  pending: {
    labelAr: 'قيد المراجعة',
    color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  },
  approved: {
    labelAr: 'معتمد',
    color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  },
  rejected: {
    labelAr: 'مرفوض',
    color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  },
};

export const INSPECTION_STATUS_CONFIG: Record<InspectionStatus, { labelAr: string; color: string }> = {
  not_required: { labelAr: 'غير مطلوب', color: 'text-slate-400 dark:text-slate-500' },
  submitted: { labelAr: 'تم التقديم', color: 'text-blue-600 dark:text-blue-400' },
  lab_pending: { labelAr: 'معمل', color: 'text-amber-600 dark:text-amber-400' },
  approved: { labelAr: 'معتمد WIR', color: 'text-emerald-600 dark:text-emerald-400 font-bold' },
  rejected: { labelAr: 'مرفوض WIR', color: 'text-rose-600 dark:text-rose-400 font-bold' },
};

/**
 * Accessible, semantic weather status badge
 */
export const WeatherBadge: React.FC<{ weather?: string | null; isAr?: boolean }> = ({ weather, isAr = true }) => {
  if (!weather || !weather.trim()) {
    return (
      <span 
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
        title={isAr ? 'حالة الطقس غير مسجلة' : 'Weather not specified'}
      >
        <CloudSun className="w-3 h-3 opacity-60 shrink-0" aria-hidden="true" />
        <span>{isAr ? 'غير محدد' : 'N/A'}</span>
      </span>
    );
  }

  const w = weather.toLowerCase().trim();
  
  let icon = CloudSun;
  let colorClass = 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  
  if (w.includes('مطر') || w.includes('ممطر') || w.includes('rain') || w.includes('أمطار')) {
    icon = CloudRain;
    colorClass = 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  } else if (w.includes('شمس') || w.includes('مشمس') || w.includes('صافي') || w.includes('sun') || w.includes('clear')) {
    icon = Sun;
    colorClass = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  } else if (w.includes('رياح') || w.includes('عاصف') || w.includes('هواء') || w.includes('wind') || w.includes('storm')) {
    icon = Wind;
    colorClass = 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
  } else if (w.includes('حرار') || w.includes('حار') || w.includes('hot') || w.includes('heat')) {
    icon = ThermometerSun;
    colorClass = 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
  } else if (w.includes('غبار') || w.includes('تراب') || w.includes('ضباب') || w.includes('dust') || w.includes('fog')) {
    icon = CloudFog;
    colorClass = 'bg-stone-100 dark:bg-stone-900/60 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700';
  } else if (w.includes('غائم') || w.includes('سحب') || w.includes('cloud')) {
    icon = Cloud;
    colorClass = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  }

  const IconComponent = icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${colorClass}`}
      title={isAr ? `حالة الطقس: ${weather}` : `Weather condition: ${weather}`}
    >
      <IconComponent className="w-3 h-3 shrink-0" aria-hidden="true" />
      <span className="truncate max-w-[85px]">{weather}</span>
    </span>
  );
};

interface DailyLogTableProps {
  projectId: string;
  reports: DailyProgress[];
  loading?: boolean;
  canApprove?: boolean;
  isPm?: boolean;
  onRefresh: () => void;
  onReviewLines: (report: DailyProgress) => void;
  onReopenReport: (report: DailyProgress) => void;
  onAddObstruction: (report: DailyProgress) => void;
  onViewHistory?: (report: DailyProgress) => void;
  onEditDraft?: (report: DailyProgress) => void;
}

export const DailyLogTable: React.FC<DailyLogTableProps> = ({
  projectId,
  reports,
  loading = false,
  canApprove = true,
  isPm = true,
  onRefresh,
  onReviewLines,
  onReopenReport,
  onAddObstruction,
  onViewHistory,
  onEditDraft,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DailyProgressStatus | 'all'>('all');
  const [disciplineFilter, setDisciplineFilter] = useState<DailyDiscipline | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // View Mode: Table vs Chronological Timeline
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');

  // Photo modal state for accessible lightbox
  const [photoModalState, setPhotoModalState] = useState<{
    isOpen: boolean;
    photos: DailyProgressPhoto[];
    initialIndex: number;
    reportNo?: number | string;
    progressDate?: string;
    disciplineLabel?: string;
  }>({
    isOpen: false,
    photos: [],
    initialIndex: 0,
  });

  const openPhotoModal = (
    photos: DailyProgressPhoto[],
    index: number,
    report: DailyProgress,
    disciplineLabel?: string
  ) => {
    setPhotoModalState({
      isOpen: true,
      photos,
      initialIndex: index,
      reportNo: report.report_no,
      progressDate: report.progress_date,
      disciplineLabel,
    });
  };

  // Quick Date Preset Handler
  const handleSetDatePreset = (preset: 'today' | '7days' | 'month' | 'clear') => {
    if (preset === 'clear') {
      setStartDate('');
      setEndDate('');
      setPage(1);
      return;
    }
    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);
    if (preset === 'today') {
      setStartDate(todayIso);
      setEndDate(todayIso);
    } else if (preset === '7days') {
      const past = new Date(today);
      past.setDate(past.getDate() - 7);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(todayIso);
    } else if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().slice(0, 10));
      setEndDate(todayIso);
    }
    setPage(1);
  };

  // Expand rows state
  const [expandedReportIds, setExpandedReportIds] = useState<Set<string>>(new Set());

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Submitting Draft state
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Toggle row expansion
  const toggleExpand = (id: string) => {
    setExpandedReportIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Submit Draft Report handler
  const handleSubmitDraft = async (report: DailyProgress) => {
    setSubmittingId(report.id);
    try {
      const ok = await DailyProgressService.submitDailyReport(report.id, projectId);
      if (ok) {
        toast.success(`تم تقديم اليومية #${report.report_no} بنجاح لمراجعة مدير المشروع`);
        emitAtsmatrixEvent({
          agent_id: report.entered_by_name || 'site_engineer',
          action: 'SYNC',
          cluster: 'SYNTHESIS_BROKER',
          message: `Draft Daily Report #${report.report_no} submitted for PM review`,
          payload: { report_id: report.id, project_id: projectId },
        });
        onRefresh();
      } else {
        toast.error('تعذر تقديم التقرير اليومي — تأكد من الصلاحيات');
      }
    } catch (err: unknown) {
      const errInfo = err as { message?: string; code?: string; details?: string } | null | undefined;
      logger.error('Error submitting draft report', { detail: err });
      toast.error(errInfo?.message || 'فشل تقديم التقرير اليومي');
    } finally {
      setSubmittingId(null);
    }
  };

  // Processed (Filtered & Sorted) Reports
  const processedReports = useMemo(() => {
    let result = [...reports];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((r) => {
        const noMatch = `يومية #${r.report_no}`.includes(q) || String(r.report_no).includes(q);
        const dateMatch = r.progress_date?.includes(q);
        const userMatch = r.entered_by_name?.toLowerCase().includes(q) || r.entered_by?.toLowerCase().includes(q);
        const notesMatch = r.notes?.toLowerCase().includes(q);
        const weatherMatch = r.weather?.toLowerCase().includes(q);
        const equipmentMatch = 
          r.equipment_summary?.toLowerCase().includes(q) ||
          r.equipment_logs?.some((el) => el.equipment_name?.toLowerCase().includes(q));
        const manpowerMatch = r.manpower_logs?.some((ml) => ml.craft_type?.toLowerCase().includes(q));
        const lineMatch = r.lines?.some(
          (l) =>
            l.boq_item?.item_code?.toLowerCase().includes(q) ||
            l.boq_item?.description_ar?.toLowerCase().includes(q) ||
            l.zone?.toLowerCase().includes(q) ||
            l.wir_no?.toLowerCase().includes(q)
        );
        return noMatch || dateMatch || userMatch || notesMatch || weatherMatch || equipmentMatch || manpowerMatch || lineMatch;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Discipline filter
    if (disciplineFilter !== 'all') {
      result = result.filter((r) => r.discipline === disciplineFilter);
    }

    // Date range
    if (startDate) {
      result = result.filter((r) => r.progress_date >= startDate);
    }
    if (endDate) {
      result = result.filter((r) => r.progress_date <= endDate);
    }

    // Sort by progress_date desc, report_no desc
    result.sort((a, b) => {
      const cmpDate = (b.progress_date || '').localeCompare(a.progress_date || '');
      if (cmpDate !== 0) return cmpDate;
      return Number(b.report_no || 0) - Number(a.report_no || 0);
    });

    return result;
  }, [reports, searchQuery, statusFilter, disciplineFilter, startDate, endDate]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: reports.length,
      submitted: 0,
      rejected: 0,
      draft: 0,
      approved: 0,
      partially_approved: 0,
      reopened: 0,
    };
    for (const r of reports) {
      if (r.status in counts) {
        counts[r.status]++;
      }
    }
    return counts;
  }, [reports]);

  // Pagination
  const totalPages = Math.ceil(processedReports.length / pageSize) || 1;
  const paginatedReports = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processedReports.slice(start, start + pageSize);
  }, [processedReports, page, pageSize]);

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        {/* Status Pill Tabs Bar */}
        <div className="flex items-center gap-1.5 flex-wrap pb-1" role="tablist" aria-label={isAr ? 'تصفية سريعة لحالات التقارير اليومية' : 'Quick status filters'}>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'all'}
            onClick={() => { setStatusFilter('all'); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {isAr ? 'الكل' : 'All'} ({statusCounts.all})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'submitted'}
            onClick={() => { setStatusFilter('submitted'); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              statusFilter === 'submitted'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40'
            }`}
          >
            <span>{isAr ? 'قيد المراجعة' : 'Under Review'}</span>
            <span className="font-mono px-1 rounded bg-black/10 dark:bg-white/10 text-[10px]">{statusCounts.submitted}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'rejected'}
            onClick={() => { setStatusFilter('rejected'); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40'
            }`}
          >
            <span>{isAr ? 'مرفوض' : 'Rejected'}</span>
            <span className="font-mono px-1 rounded bg-black/10 dark:bg-white/10 text-[10px]">{statusCounts.rejected}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'draft'}
            onClick={() => { setStatusFilter('draft'); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              statusFilter === 'draft'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'
            }`}
          >
            <span>{isAr ? 'مسودة' : 'Draft'}</span>
            <span className="font-mono px-1 rounded bg-black/10 dark:bg-white/10 text-[10px]">{statusCounts.draft}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'approved'}
            onClick={() => { setStatusFilter('approved'); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
            }`}
          >
            <span>{isAr ? 'معتمد بالكامل' : 'Approved'}</span>
            <span className="font-mono px-1 rounded bg-black/10 dark:bg-white/10 text-[10px]">{statusCounts.approved}</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              aria-label={isAr ? 'البحث في سجل اليوميات' : 'Search daily logs'}
              placeholder={isAr ? 'البحث برقم التقرير، التاريخ، المهندس، المعدات، أو بنود الأعمال والـ WIR...' : 'Search report #, date, engineer, equipment, items or WIR...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full ps-9 pe-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              aria-label={isAr ? 'تصفية حسب حالة اليومية' : 'Filter by report status'}
              onChange={(e) => {
                setStatusFilter(e.target.value as DailyProgressStatus | 'all');
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="all">{isAr ? 'كافة الحالات' : 'All statuses'}</option>
              <option value="draft">🟡 {isAr ? 'مسودة' : 'Draft'}</option>
              <option value="submitted">🔵 {isAr ? 'قيد المراجعة' : 'Under Review'}</option>
              <option value="partially_approved">🟠 {isAr ? 'معتمد جزئياً' : 'Partially Approved'}</option>
              <option value="approved">🔒 {isAr ? 'معتمد بالكامل' : 'Approved'}</option>
              <option value="rejected">🔴 {isAr ? 'مرفوض' : 'Rejected'}</option>
              <option value="reopened">↩️ {isAr ? 'معاد فتحه' : 'Reopened'}</option>
            </select>

            {/* Discipline Filter */}
            <select
              value={disciplineFilter}
              aria-label={isAr ? 'تصفية حسب التخصص الهندسي' : 'Filter by discipline'}
              onChange={(e) => {
                setDisciplineFilter(e.target.value as DailyDiscipline | 'all');
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="all">{isAr ? 'كافة التخصصات' : 'All disciplines'}</option>
              <option value="civil">{isAr ? 'مدني وإنشائي' : 'Civil & Structural'}</option>
              <option value="finishing">{isAr ? 'تشطيبات' : 'Finishing'}</option>
              <option value="mep">{isAr ? 'كهروميكانيكا (MEP)' : 'MEP'}</option>
              <option value="landscape">{isAr ? 'لاندسكيب' : 'Landscape'}</option>
              <option value="water_features">{isAr ? 'حمامات وبحيرات' : 'Water Features'}</option>
              <option value="other">{isAr ? 'أخرى' : 'Other'}</option>
            </select>

            {/* View Mode Toggle: Table vs Timeline */}
            <div 
              className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0"
              role="radiogroup"
              aria-label={isAr ? 'نمط عرض سجل اليوميات' : 'Daily log display mode'}
            >
              <button
                type="button"
                role="radio"
                aria-checked={viewMode === 'table'}
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={isAr ? 'عرض الجدول التقليدي' : 'Table View'}
              >
                <List className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isAr ? 'جدول' : 'Table'}</span>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={viewMode === 'timeline'}
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={isAr ? 'عرض الخط الزمني للموقع' : 'Chronological Timeline View'}
              >
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span>{isAr ? 'خط زمني' : 'Timeline'}</span>
              </button>
            </div>

            {/* Refresh button */}
            <button
              onClick={onRefresh}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer shrink-0"
              title={isAr ? 'تحديث البيانات' : 'Refresh data'}
              aria-label={isAr ? 'تحديث البيانات' : 'Refresh data'}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Date Range Sub-Bar: Styled Pickers & Quick Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 shrink-0">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'نطاق التاريخ:' : 'Date range:'}</span>
            </span>

            {/* Start Date */}
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" aria-hidden="true" />
              <input
                type="date"
                aria-label={isAr ? 'تاريخ البداية' : 'Start date'}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="ps-8 pe-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            <span className="text-slate-400 dark:text-slate-500 font-bold text-xs">{isAr ? 'إلى' : 'to'}</span>

            {/* End Date */}
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" aria-hidden="true" />
              <input
                type="date"
                aria-label={isAr ? 'تاريخ النهاية' : 'End date'}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="ps-8 pe-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleSetDatePreset('today')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[11px] transition cursor-pointer"
              >
                {isAr ? 'اليوم' : 'Today'}
              </button>
              <button
                type="button"
                onClick={() => handleSetDatePreset('7days')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[11px] transition cursor-pointer"
              >
                {isAr ? 'آخر 7 أيام' : 'Last 7 Days'}
              </button>
              <button
                type="button"
                onClick={() => handleSetDatePreset('month')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[11px] transition cursor-pointer"
              >
                {isAr ? 'هذا الشهر' : 'This Month'}
              </button>

              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => handleSetDatePreset('clear')}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-[11px] hover:bg-rose-100 dark:hover:bg-rose-900/50 transition cursor-pointer"
                >
                  {isAr ? 'مسح التواريخ' : 'Clear dates'}
                </button>
              )}
            </div>
          </div>

          <div className="ms-auto text-xs text-slate-400 dark:text-slate-500">
            {isAr ? (
              <>إجمالي التقارير: <strong className="text-slate-700 dark:text-slate-300 font-mono">{processedReports.length}</strong> يومية</>
            ) : (
              <>Total Reports: <strong className="text-slate-700 dark:text-slate-300 font-mono">{processedReports.length}</strong> logs</>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Chronological Timeline or Resizable Table */}
      {viewMode === 'timeline' ? (
        <DailyReportTimeline
          reports={paginatedReports}
          loading={loading}
          canApprove={canApprove}
          isPm={isPm}
          isAr={isAr}
          onRefresh={onRefresh}
          onReviewLines={onReviewLines}
          onReopenReport={onReopenReport}
          onAddObstruction={onAddObstruction}
          onViewHistory={onViewHistory}
          onEditDraft={onEditDraft}
          onSubmitDraft={handleSubmitDraft}
          submittingId={submittingId}
          onOpenPhotoModal={openPhotoModal}
        />
      ) : (
        <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
          <div className="overflow-x-auto">
            <ResizableTable tableId="daily_log_table">
              <table className="w-full text-xs text-start" aria-label={isAr ? 'جدول تقارير الإنجاز اليومية وموارد الموقع' : 'Daily progress and site resources log table'}>
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
                <tr>
                  <th scope="col" className="w-10 px-3 py-3.5 text-center">
                    <span className="sr-only">{isAr ? 'توسيع التفاصيل' : 'Expand details'}</span>
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-start">{isAr ? 'رقم اليومية والتاريخ' : 'Report No & Date'}</th>
                  <th scope="col" className="px-4 py-3.5 text-start">{isAr ? 'التخصص الهندسي' : 'Discipline'}</th>
                  <th scope="col" className="px-3 py-3.5 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                  <th scope="col" className="px-3 py-3.5 text-center">{isAr ? 'عدد البنود' : 'Items'}</th>
                  <th scope="col" className="px-3 py-3.5 text-center">{isAr ? 'الموارد الميدانية والطقس' : 'Resources & Weather'}</th>
                  <th scope="col" className="px-3 py-3.5 text-center">{isAr ? 'المرفقات' : 'Attachments'}</th>
                  <th scope="col" className="px-4 py-3.5 text-start">{isAr ? 'المسؤول / الإدخال' : 'Responsible / Author'}</th>
                  <th scope="col" className="px-4 py-3.5 text-center">{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={`skeleton-row-${idx}`} className="animate-pulse">
                      <td className="px-3 py-4 text-center">
                        <div className="w-4 h-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                      </td>
                      <td className="px-4 py-4 space-y-1.5">
                        <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
                        <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800/60 rounded" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
                      </td>
                      <td className="px-3 py-4 text-center">
                        <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" />
                      </td>
                      <td className="px-3 py-4 text-center">
                        <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                      </td>
                      <td className="px-3 py-4 text-center space-y-1">
                        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                        <div className="h-3 w-10 bg-slate-100 dark:bg-slate-800/60 rounded mx-auto" />
                      </td>
                      <td className="px-3 py-4 text-center">
                        <div className="h-5 w-10 bg-slate-200 dark:bg-slate-800 rounded-lg mx-auto" />
                      </td>
                      <td className="px-4 py-4 space-y-1">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800/60 rounded" />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="h-7 w-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                          <div className="h-7 w-7 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : paginatedReports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-slate-400 dark:text-slate-500">
                    <div className="space-y-2">
                      <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                      <div className="font-bold text-slate-700 dark:text-slate-300">
                        لا توجد تقارير يومية مطابقة لمعايير البحث
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        يمكنك تغيير معايير التصفية أو تسجيل يومية جديدة
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedReports.map((report) => {
                  const isExpanded = expandedReportIds.has(report.id);
                  const statusInfo = STATUS_CONFIG[report.status] || STATUS_CONFIG.draft;
                  const StatusIcon = statusInfo.icon;
                  const disciplineInfo = DISCIPLINE_LABELS[report.discipline || 'civil'] || DISCIPLINE_LABELS.civil;
                  const linesCount = report.lines?.length || 0;
                  const photosCount = report.photos?.length || 0;
                  const obstructionsCount = report.obstructions?.length || 0;

                  return (
                    <React.Fragment key={report.id}>
                      <tr
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer ${
                          isExpanded ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                        }`}
                        onClick={() => toggleExpand(report.id)}
                      >
                        {/* Expand toggle */}
                        <td className="px-3 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(report.id);
                            }}
                            aria-expanded={isExpanded}
                            aria-label={
                              isExpanded
                                ? (isAr ? `طي تفاصيل اليومية رقم ${report.report_no}` : `Collapse report #${report.report_no}`)
                                : (isAr ? `عرض تفاصيل اليومية رقم ${report.report_no}` : `Expand report #${report.report_no}`)
                            }
                            title={
                              isExpanded
                                ? (isAr ? 'طي التفاصيل' : 'Collapse details')
                                : (isAr ? 'عرض التفاصيل' : 'Expand details')
                            }
                            className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                            ) : isAr ? (
                              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                            ) : (
                              <ChevronRight className="w-4 h-4" aria-hidden="true" />
                            )}
                          </button>
                        </td>

                        {/* Report No & Date */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {isAr ? `يومية #${report.report_no}` : `Log #${report.report_no}`}
                            </span>
                            {obstructionsCount > 0 && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                                title={isAr ? `مسجل بها ${obstructionsCount} إعاقة` : `${obstructionsCount} obstructions recorded`}
                              >
                                {obstructionsCount} {isAr ? 'إعاقة' : 'obstructions'}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                            {report.progress_date}
                          </div>
                        </td>

                        {/* Discipline Tag */}
                        <td className="px-4 py-3.5">
                          {(() => {
                            const DisciplineIcon = disciplineInfo.icon || Layers;
                            return (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors shadow-xs ${disciplineInfo.color} ${disciplineInfo.border || ''}`}
                              >
                                <DisciplineIcon className="w-3 h-3 shrink-0" aria-hidden="true" />
                                <span>{disciplineInfo.labelAr}</span>
                              </span>
                            );
                          })()}
                        </td>

                        {/* Status Approval Badge in RTL */}
                        <td className="px-3 py-3.5 text-center whitespace-nowrap">
                          <span
                            dir="rtl"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors shadow-xs ${statusInfo.color}`}
                          >
                            <StatusIcon className="w-3 h-3 shrink-0" aria-hidden="true" />
                            <span>{statusInfo.labelAr}</span>
                          </span>
                        </td>

                        {/* Lines Count */}
                        <td className="px-3 py-3.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {linesCount} {isAr ? 'بند' : 'items'}
                        </td>

                        {/* Field Resources & Weather */}
                        <td className="px-3 py-3.5 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            {/* Worker Count and Equipment Tags Row */}
                            <div className="flex items-center justify-center gap-1 flex-wrap">
                              {/* Worker Count Badge */}
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 font-mono text-[11px] font-bold"
                                title={isAr ? `إجمالي العمالة بالموقع: ${report.manpower_count || 0} فرد` : `Total manpower: ${report.manpower_count || 0}`}
                              >
                                <HardHat className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
                                <span>{report.manpower_count || 0}</span>
                                <span className="text-[9px] font-normal text-amber-700/80 dark:text-amber-300/80">{isAr ? 'فرد' : 'p'}</span>
                              </span>

                              {/* Equipment Tag */}
                              {(report.equipment_summary || (report.equipment_count && report.equipment_count > 0) || (report.equipment_logs && report.equipment_logs.length > 0)) ? (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60 text-[10px] font-medium max-w-[110px] truncate"
                                  title={
                                    report.equipment_summary 
                                      ? (isAr ? `معدات الموقع: ${report.equipment_summary}` : `Equipment: ${report.equipment_summary}`)
                                      : `${report.equipment_count || report.equipment_logs?.length || 0} ${isAr ? 'معدة' : 'eq.'}`
                                  }
                                >
                                  <Truck className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                                  <span className="truncate">
                                    {report.equipment_summary 
                                      ? report.equipment_summary 
                                      : `${report.equipment_count || report.equipment_logs?.length || 0} ${isAr ? 'معدة' : 'units'}`}
                                  </span>
                                </span>
                              ) : (
                                <span 
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50"
                                  title={isAr ? 'لا توجد معدات مسجلة' : 'No equipment recorded'}
                                >
                                  <Truck className="w-2.5 h-2.5 opacity-40 shrink-0" aria-hidden="true" />
                                  <span>-</span>
                                </span>
                              )}
                            </div>

                            {/* Weather Status Badge */}
                            <WeatherBadge weather={report.weather} isAr={isAr} />
                          </div>
                        </td>

                        {/* Attachments */}
                        <td className="px-3 py-3.5 text-center">
                          {photosCount > 0 ? (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                              title={isAr ? `${photosCount} صورة ميدانية` : `${photosCount} photos`}
                            >
                              <Camera className="w-3 h-3" aria-hidden="true" />
                              <span>{photosCount}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">-</span>
                          )}
                        </td>

                        {/* Entered By */}
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-slate-900 dark:text-white truncate max-w-[140px]">
                            {report.entered_by_name || report.entered_by || (isAr ? 'مهندس الموقع' : 'Site Engineer')}
                          </div>
                          {report.notes && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[140px]" title={report.notes}>
                              {report.notes}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td
                          className="px-4 py-3.5 text-center whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Edit Draft Button */}
                            {report.status === 'draft' && onEditDraft && (
                              <button
                                onClick={() => onEditDraft(report)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
                                title={isAr ? 'استكمال وتعديل بيانات وبنود المسودة' : 'Edit draft report'}
                                aria-label={isAr ? `تعديل مسودة اليومية #${report.report_no}` : `Edit draft report #${report.report_no}`}
                              >
                                <Edit3 className="w-3 h-3" aria-hidden="true" />
                                <span>{isAr ? 'تعديل' : 'Edit'}</span>
                              </button>
                            )}

                            {/* Submit Draft Button */}
                            {report.status === 'draft' && (
                              <button
                                onClick={() => handleSubmitDraft(report)}
                                disabled={submittingId === report.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 cursor-pointer"
                                title={isAr ? 'تقديم اليومية للاعتماد' : 'Submit daily report'}
                                aria-label={isAr ? `تقديم اليومية #${report.report_no} للاعتماد` : `Submit daily report #${report.report_no}`}
                              >
                                <Send className="w-3 h-3" aria-hidden="true" />
                                <span>{submittingId === report.id ? (isAr ? 'جاري التقديم...' : 'Submitting...') : (isAr ? 'تقديم' : 'Submit')}</span>
                              </button>
                            )}

                            {/* Review Lines Modal Button */}
                            {canApprove && (
                              <button
                                onClick={() => onReviewLines(report)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 font-bold text-[11px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                                title={isAr ? 'مراجعة واعتماد بنود اليومية' : 'Review daily lines'}
                                aria-label={isAr ? `مراجعة واعتماد بنود اليومية #${report.report_no}` : `Review lines for report #${report.report_no}`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>{isAr ? 'مراجعة' : 'Review'}</span>
                              </button>
                            )}

                            {/* Add Obstruction */}
                            <button
                              onClick={() => onAddObstruction(report)}
                              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
                              title={isAr ? 'تسجيل إعاقة موقع (EOT)' : 'Record site obstruction'}
                              aria-label={isAr ? `تسجيل إعاقة موقع لليومية #${report.report_no}` : `Record obstruction for report #${report.report_no}`}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>

                            {/* Reopen Report (PM only) */}
                            {isPm && report.status === 'approved' && (
                              <button
                                onClick={() => onReopenReport(report)}
                                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 cursor-pointer"
                                title={isAr ? 'إعادة فتح اليومية وتجميد نسب الإنجاز' : 'Reopen daily report'}
                                aria-label={isAr ? `إعادة فتح اليومية #${report.report_no}` : `Reopen daily report #${report.report_no}`}
                              >
                                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            )}

                            {/* Audit / History */}
                            {onViewHistory && (
                              <button
                                onClick={() => onViewHistory(report)}
                                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 cursor-pointer"
                                title={isAr ? 'سجل المراجعة والتدقيق' : 'Audit history'}
                                aria-label={isAr ? `سجل المراجعة والتدقيق لليومية #${report.report_no}` : `View audit history for report #${report.report_no}`}
                              >
                                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Line-Level Preview Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-50/60 dark:bg-slate-800/30">
                          <td colSpan={9} className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                                  <Layers className="w-4 h-4 text-emerald-500" />
                                  <span>تفاصيل بنود الأعمال المسجلة بالتقرير ({report.lines?.length || 0} بند)</span>
                                </h4>

                                 {canApprove && report.status !== 'approved' && (
                                  <button
                                    onClick={() => onReviewLines(report)}
                                    className="px-3 py-1 rounded-xl bg-emerald-700 dark:bg-emerald-600 text-white font-bold text-[11px] shadow-sm hover:bg-emerald-800 dark:hover:bg-emerald-500 transition"
                                  >
                                    فتح نافذة المراجعة والاعتماد
                                  </button>
                                )}
                              </div>

                              {/* Field Resources & Site Conditions Summary Card */}
                              {(report.manpower_count !== undefined || report.equipment_summary || (report.equipment_logs && report.equipment_logs.length > 0) || (report.manpower_logs && report.manpower_logs.length > 0) || report.weather) && (
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
                                  <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-800 dark:text-slate-200">
                                    <HardHat className="w-4 h-4 text-amber-500" aria-hidden="true" />
                                    <span>{isAr ? 'الموارد الميدانية والظروف التشغيلية لليومية' : 'Field Resources & Site Conditions'}</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                    {/* Manpower */}
                                    <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                                      <div className="text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                                        <HardHat className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                                        <span>{isAr ? 'العمالة المنفذة بالموقع' : 'On-Site Labor'}</span>
                                      </div>
                                      <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                                        {report.manpower_count || 0} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{isAr ? 'فرد / عامل' : 'workers'}</span>
                                      </div>
                                      {report.manpower_logs && report.manpower_logs.length > 0 && (
                                        <div className="mt-2 space-y-1 border-t border-amber-200/50 dark:border-amber-900/40 pt-1.5 text-[10px]">
                                          {report.manpower_logs.map((ml, idx) => (
                                            <div key={ml.id || idx} className="flex justify-between text-slate-600 dark:text-slate-400">
                                              <span>{ml.craft_type}</span>
                                              <span className="font-mono font-bold">{ml.headcount}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* Equipment */}
                                    <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                                      <div className="text-[11px] font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 mb-1">
                                        <Truck className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                                        <span>{isAr ? 'المعدات والآليات بالموقع' : 'Equipment & Machinery'}</span>
                                      </div>
                                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                        {report.equipment_summary || (report.equipment_count ? `${report.equipment_count} ${isAr ? 'معدة' : 'units'}` : (isAr ? 'لا توجد معدات مسجلة' : 'None recorded'))}
                                      </div>
                                      {report.equipment_logs && report.equipment_logs.length > 0 && (
                                        <div className="mt-2 space-y-1 border-t border-blue-200/50 dark:border-blue-900/40 pt-1.5 text-[10px]">
                                          {report.equipment_logs.map((el, idx) => (
                                            <div key={el.id || idx} className="flex justify-between text-slate-600 dark:text-slate-400">
                                              <span>{el.equipment_name} (x{el.quantity})</span>
                                              <span className="font-mono">{el.working_hours}h {isAr ? 'عمل' : 'work'} {el.idle_hours > 0 ? `• ${el.idle_hours}h ${isAr ? 'توقف' : 'idle'}` : ''}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* Weather & Site Environment */}
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                                        <CloudSun className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                                        <span>{isAr ? 'الطقس والظروف الميدانية' : 'Weather & Field Conditions'}</span>
                                      </div>
                                      <div className="mt-1">
                                        <WeatherBadge weather={report.weather} isAr={isAr} />
                                      </div>
                                      {report.notes && (
                                        <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 border-t border-slate-200 dark:border-slate-700 pt-1.5">
                                          <strong>{isAr ? 'ملاحظة:' : 'Note:'}</strong> {report.notes}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Lines Table */}
                              {(!report.lines || report.lines.length === 0) ? (
                                <div className="p-4 text-center text-slate-400 dark:text-slate-500 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                                  {isAr ? 'لا توجد بنود أعمال مسجلة في هذه اليومية' : 'No line items recorded for this daily log'}
                                </div>
                              ) : (
                                <div className="border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                                  <table className="w-full text-[11px] text-start" aria-label={isAr ? `بنود أعمال اليومية رقم ${report.report_no}` : `Line items for report #${report.report_no}`}>
                                    <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                                      <tr>
                                        <th scope="col" className="px-3 py-2.5 text-start">{isAr ? 'كود البند' : 'Item Code'}</th>
                                        <th scope="col" className="px-3 py-2.5 text-start">{isAr ? 'بيان الأعمال' : 'Description'}</th>
                                        <th scope="col" className="px-3 py-2.5 text-center">{isAr ? 'الكمية المنفذة' : 'Installed Qty'}</th>
                                        <th scope="col" className="px-3 py-2.5 text-center">{isAr ? 'المنطقة' : 'Zone'}</th>
                                        <th scope="col" className="px-3 py-2.5 text-center">{isAr ? 'طلب الاستلام (WIR)' : 'WIR Request'}</th>
                                        <th scope="col" className="px-3 py-2.5 text-center">{isAr ? 'حالة البند' : 'Line Status'}</th>
                                        <th scope="col" className="px-3 py-2.5 text-start">{isAr ? 'ملاحظات' : 'Remarks'}</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                      {report.lines.map((line) => {
                                        const lineStatus = LINE_STATUS_CONFIG[line.line_status || 'pending'] || LINE_STATUS_CONFIG.pending;
                                        const wirStatus = INSPECTION_STATUS_CONFIG[line.inspection_status || 'not_required'] || INSPECTION_STATUS_CONFIG.not_required;
                                        return (
                                          <tr key={line.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                                            <td className="px-3 py-2 font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                              {line.boq_item?.item_code || 'N/A'}
                                            </td>
                                            <td className="px-3 py-2 max-w-xs font-medium text-slate-800 dark:text-slate-200">
                                              <div className="line-clamp-1">{line.boq_item?.description_ar || 'بند عمل'}</div>
                                              {line.is_material_on_site && (
                                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                                                  [تشوين بالموقع MOS]
                                                </span>
                                              )}
                                              {line.is_claimable_vo && (
                                                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold ms-1">
                                                  [مطالبة VO]
                                                </span>
                                              )}
                                            </td>
                                            <td className="px-3 py-2 text-center font-mono font-bold text-slate-900 dark:text-white">
                                              {Number(line.qty_today).toLocaleString()} {line.boq_item?.unit || ''}
                                            </td>
                                            <td className="px-3 py-2 text-center text-slate-600 dark:text-slate-400">
                                              {line.zone || '-'}
                                            </td>
                                            <td className="px-3 py-2 text-center whitespace-nowrap">
                                              <div className="font-mono text-[10px] text-slate-700 dark:text-slate-300">{line.wir_no || '-'}</div>
                                              <span className={`text-[10px] ${wirStatus.color}`}>
                                                {wirStatus.labelAr}
                                              </span>
                                            </td>
                                            <td className="px-3 py-2 text-center whitespace-nowrap">
                                              <span
                                                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${lineStatus.color}`}
                                              >
                                                {lineStatus.labelAr}
                                              </span>
                                            </td>
                                            <td className="px-3 py-2 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                                              {line.remarks || (line.rejection_reason ? `سبب الرفض: ${line.rejection_reason}` : '-')}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {/* Photo Gallery Responsive Grid Preview */}
                              {photosCount > 0 && (
                                <div className="space-y-2 pt-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                      <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                                      <span>{isAr ? `الصور الميدانية المرفقة (${photosCount})` : `Attached site photos (${photosCount})`}</span>
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                      {isAr ? 'انقر على أي صورة للتكبير والمعاينة' : 'Click to enlarge'}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
                                    {report.photos?.map((photo, pIdx) => {
                                      const photoAlt = photo.caption
                                        ? `${photo.caption} - صورة توثيق موقع ليومية #${report.report_no} (${report.progress_date})`
                                        : (isAr ? `صورة موقع ليومية #${report.report_no} بتاريخ ${report.progress_date} - صورة ${pIdx + 1}` : `Site photo #${pIdx + 1} for report #${report.report_no}`);
                                      return (
                                        <div
                                          key={photo.id || pIdx}
                                          onClick={() => openPhotoModal(report.photos || [], pIdx, report, disciplineInfo.labelAr)}
                                          className="aspect-square sm:aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 relative group shadow-xs cursor-pointer focus-within:ring-2 focus-within:ring-emerald-500"
                                          role="button"
                                          tabIndex={0}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                              e.preventDefault();
                                              openPhotoModal(report.photos || [], pIdx, report, disciplineInfo.labelAr);
                                            }
                                          }}
                                          aria-label={photoAlt}
                                        >
                                          <img
                                            src={photo.photo_url}
                                            alt={photoAlt}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                          />
                                          <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition duration-200">
                                            <span className="p-1.5 rounded-xl bg-slate-900/80 text-white shadow-md backdrop-blur-xs">
                                              <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                                            </span>
                                          </div>
                                          {photo.caption && (
                                            <div className="absolute inset-x-0 bottom-0 bg-slate-950/75 px-2 py-1 text-[9px] text-white truncate">
                                              {photo.caption}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </ResizableTable>
      </div>
    </div>
    )}

        {/* Table Footer & Pagination */}
        <nav
          role="navigation"
          aria-label={isAr ? 'تصفح صفحات سجل اليوميات' : 'Daily log pagination'}
          className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 text-xs shadow-sm"
        >
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 flex-wrap">
            <span>
              {isAr 
                ? `عرض ${paginatedReports.length} من إجمالي ${processedReports.length} يومية`
                : `Showing ${paginatedReports.length} of ${processedReports.length} reports`}
            </span>

            {/* Page size selector */}
            <div className="flex items-center gap-1.5 ms-2">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{isAr ? 'لكل صفحة:' : 'Per page:'}</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                aria-label={isAr ? 'عدد العناصر المعروضة لكل صفحة' : 'Items displayed per page'}
                className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 dark:text-slate-400 font-mono font-medium" aria-current="page" aria-live="polite">
              {isAr ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
            </span>
            <div className="flex items-center gap-1.5">
              {/* Previous page button */}
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label={isAr ? 'الانتقال إلى الصفحة السابقة' : 'Go to previous page'}
                title={isAr ? 'الصفحة السابقة' : 'Previous page'}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
              >
                {isAr ? <ChevronRight className="w-4 h-4" aria-hidden="true" /> : <ChevronLeft className="w-4 h-4" aria-hidden="true" />}
              </button>

              {/* Next page button */}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label={isAr ? 'الانتقال إلى الصفحة التالية' : 'Go to next page'}
                title={isAr ? 'الصفحة التالية' : 'Next page'}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
              >
                {isAr ? <ChevronLeft className="w-4 h-4" aria-hidden="true" /> : <ChevronRight className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </nav>

      {/* Photo Expansion Lightbox Dialog */}
      <DailyPhotoModal
        isOpen={photoModalState.isOpen}
        onClose={() => setPhotoModalState((prev) => ({ ...prev, isOpen: false }))}
        photos={photoModalState.photos}
        initialIndex={photoModalState.initialIndex}
        reportNo={photoModalState.reportNo}
        progressDate={photoModalState.progressDate}
        disciplineLabel={photoModalState.disciplineLabel}
      />
    </div>
  );
};
