'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Clock,
  User,
  Users,
  Wrench,
  CloudSun,
  FileSpreadsheet,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Send,
  Lock,
  Eye,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  FileEdit,
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Flame,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { DailyProgressService } from '@/lib/services/dailyProgress.service';
import { DailyProgress } from '@/types/planning';
import { WorkflowKanbanColumn } from '../WorkflowKanbanColumn';
import { UnifiedStatusBadge } from '../UnifiedStatusBadge';
import { getDisciplineMeta } from '../constants';
import { useAuth } from '@/lib/stores/useAuthStore';
import { logger } from '@/lib/logger';

export interface DailyReportsKanbanProps {
  projectId: string;
  userRoles: string[];
  activeFilter: string;
  onCardClick: (reportId: string) => void;
}

export const DailyReportsKanban: React.FC<DailyReportsKanbanProps> = ({
  projectId,
  userRoles = [],
  activeFilter = 'all',
  onCardClick,
}) => {
  const { user } = useAuth();

  const [reports, setReports] = useState<DailyProgress[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Role permissions
  const normalizedRoles = userRoles.map((r) => r.toLowerCase());
  const isPlanner = normalizedRoles.some((r) =>
    ['planning_engineer', 'planning_manager', 'planner'].includes(r)
  );
  const isPM = normalizedRoles.some((r) =>
    ['project_manager', 'pm', 'pm_engineer'].includes(r)
  );
  const isAdmin = normalizedRoles.some((r) =>
    ['admin', 'system_admin', 'ceo', 'coo', 'coo_assistant', 'chairman'].includes(r)
  );
  const canApprove = isPlanner || isPM || isAdmin;

  // Fetch reports list
  const loadReports = useCallback(async () => {
    if (!projectId) {
      setReports([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await DailyProgressService.getDailyReports(projectId);
      setReports(data || []);
    } catch (err) {
      logger.error('Failed to load daily progress reports for kanban', { detail: err });
      toast.error('حدث خطأ أثناء تحميل التقارير اليومية');
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Quick Submit
  const handleQuickSubmit = async (e: React.MouseEvent, report: DailyProgress) => {
    e.stopPropagation();
    setActionLoadingId(report.id);
    try {
      const success = await DailyProgressService.submitDailyReport(
        report.id,
        report.project_id,
        user?.id
      );
      if (success) {
        toast.success(`تم تقديم التقرير رقم #${report.report_no || report.id.slice(0, 6)} للمراجعة`);
        await loadReports();
      } else {
        toast.error('فشل تقديم التقرير');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء تقديم التقرير');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick Approve
  const handleQuickApprove = async (e: React.MouseEvent, report: DailyProgress) => {
    e.stopPropagation();
    setActionLoadingId(report.id);
    try {
      const success = await DailyProgressService.approveDailyReport(
        report.id,
        report.project_id,
        user?.id
      );
      if (success) {
        toast.success(`تم اعتماد التقرير رقم #${report.report_no || report.id.slice(0, 6)} وتوزيع الكميات`);
        await loadReports();
      } else {
        toast.error('فشل اعتماد التقرير');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء اعتماد التقرير');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter and Search reports
  const filteredReports = useMemo(() => {
    let list = [...reports];

    // 1. Filter by activeFilter
    if (activeFilter && activeFilter !== 'all') {
      if (activeFilter === 'my') {
        const userId = user?.id;
        const userName = user?.user_metadata?.full_name?.toLowerCase() || '';
        const userEmail = user?.email?.toLowerCase() || '';
        list = list.filter(
          (r) =>
            (userId && r.entered_by === userId) ||
            (userName && r.entered_by_name?.toLowerCase().includes(userName)) ||
            (userEmail && r.entered_by?.toLowerCase() === userEmail)
        );
      } else if (activeFilter === 'submitted') {
        list = list.filter((r) => r.status === 'submitted');
      } else if (activeFilter === 'draft') {
        list = list.filter((r) => r.status === 'draft');
      } else if (activeFilter === 'partially_approved') {
        list = list.filter((r) => r.status === 'partially_approved');
      } else if (activeFilter === 'approved') {
        list = list.filter((r) => r.status === 'approved');
      } else if (activeFilter === 'rejected') {
        list = list.filter((r) => r.status === 'rejected' || r.status === 'reopened');
      } else if (activeFilter === 'reopened') {
        list = list.filter((r) => r.status === 'reopened');
      } else if (activeFilter === 'critical_path' || activeFilter === 'critical') {
        list = list.filter((r) => (r.obstructions && r.obstructions.length > 0) || (r as any).is_critical);
      } else if (activeFilter === 'near_critical') {
        list = list.filter((r) => (r.lines && r.lines.length > 0));
      }
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((r) => {
        const no = String(r.report_no || '').toLowerCase();
        const date = String(r.progress_date || r.report_date || '').toLowerCase();
        const submitter = String(r.entered_by_name || '').toLowerCase();
        const notes = String(r.notes || '').toLowerCase();
        const disc = String(r.discipline || '').toLowerCase();
        return (
          no.includes(q) ||
          date.includes(q) ||
          submitter.includes(q) ||
          notes.includes(q) ||
          disc.includes(q)
        );
      });
    }

    return list;
  }, [reports, activeFilter, searchQuery, user]);

  // Group into the 5 Kanban Columns
  const columnsData = useMemo(() => {
    const draft = filteredReports.filter((r) => r.status === 'draft');
    const submitted = filteredReports.filter((r) => r.status === 'submitted');
    const partially_approved = filteredReports.filter((r) => r.status === 'partially_approved');
    const approved = filteredReports.filter((r) => r.status === 'approved');
    const rejected_reopened = filteredReports.filter(
      (r) => r.status === 'rejected' || r.status === 'reopened'
    );

    return {
      draft,
      submitted,
      partially_approved,
      approved,
      rejected_reopened,
    };
  }, [filteredReports]);

  // Card Submitter Initials
  const getInitials = (name?: string) => {
    if (!name) return 'م';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* Top Search & Stats Bar */}
      <div className="glass-card bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 p-3 rounded-2xl shadow-xs flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث برقم التقرير، اسم المهندس، التاريخ، التخصص..."
              className="w-full ps-9 pe-3 py-1.5 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 rounded-lg"
            >
              مسح
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {filteredReports.length}
            </span>
            <span>تقرير مطابق</span>
          </div>

          <button
            type="button"
            onClick={loadReports}
            disabled={isLoading}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="إعادة تحميل اللوحة"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 5-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
        {/* Column 1: مسودة (draft - slate) */}
        <WorkflowKanbanColumn
          title="مسودة الموقع"
          subtitle="تقارير قيد الإعداد بالموقع"
          count={columnsData.draft.length}
          colorScheme="slate"
          icon={FileEdit}
          emptyText="لا توجد مسودات تقارير حالياً"
        >
          {columnsData.draft.map((report) =>
            renderReportCard(report, {
              isActionLoading: actionLoadingId === report.id,
              onQuickSubmit: (e) => handleQuickSubmit(e, report),
              onCardClick,
              isPM,
              canApprove,
              getInitials,
            })
          )}
        </WorkflowKanbanColumn>

        {/* Column 2: قيد المراجعة (submitted - blue) */}
        <WorkflowKanbanColumn
          title="قيد المراجعة"
          subtitle="بانتظار مراجعة مهندس التخطيط"
          count={columnsData.submitted.length}
          colorScheme="blue"
          icon={Send}
          isHighlighted={columnsData.submitted.length > 0}
          emptyText="لا توجد تقارير بانتظار المراجعة"
        >
          {columnsData.submitted.map((report) =>
            renderReportCard(report, {
              isActionLoading: actionLoadingId === report.id,
              onQuickApprove: canApprove ? (e) => handleQuickApprove(e, report) : undefined,
              onCardClick,
              isPM,
              canApprove,
              getInitials,
            })
          )}
        </WorkflowKanbanColumn>

        {/* Column 3: معتمد جزئياً (partially_approved - amber) */}
        <WorkflowKanbanColumn
          title="معتمد جزئياً"
          subtitle="تم اعتماد بعض البنود ومراجعة البقية"
          count={columnsData.partially_approved.length}
          colorScheme="amber"
          icon={AlertCircle}
          emptyText="لا توجد تقارير معتمدة جزئياً"
        >
          {columnsData.partially_approved.map((report) =>
            renderReportCard(report, {
              isActionLoading: actionLoadingId === report.id,
              onCardClick,
              isPM,
              canApprove,
              getInitials,
            })
          )}
        </WorkflowKanbanColumn>

        {/* Column 4: معتمد بالكامل (approved - emerald) */}
        <WorkflowKanbanColumn
          title="معتمد بالكامل"
          subtitle="تم الترحيل وتحديث نسب الإنجاز"
          count={columnsData.approved.length}
          colorScheme="emerald"
          icon={CheckCircle2}
          emptyText="لا توجد تقارير معتمدة حتى الآن"
        >
          {columnsData.approved.map((report) =>
            renderReportCard(report, {
              isActionLoading: actionLoadingId === report.id,
              onCardClick,
              isPM,
              canApprove,
              getInitials,
            })
          )}
        </WorkflowKanbanColumn>

        {/* Column 5: مرفوض / معاد فتحه (rejected / reopened - rose) */}
        <WorkflowKanbanColumn
          title="مرفوض / معاد فتحه"
          subtitle="تحتاج لتعديل وإعادة تقديم"
          count={columnsData.rejected_reopened.length}
          colorScheme="rose"
          icon={XCircle}
          emptyText="سجل المرفوضات نظيف تماماً"
        >
          {columnsData.rejected_reopened.map((report) =>
            renderReportCard(report, {
              isActionLoading: actionLoadingId === report.id,
              onCardClick,
              isPM,
              canApprove,
              getInitials,
            })
          )}
        </WorkflowKanbanColumn>
      </div>
    </div>
  );
};

// Helper to render individual report card
interface CardRenderOptions {
  isActionLoading: boolean;
  onQuickSubmit?: (e: React.MouseEvent) => void;
  onQuickApprove?: (e: React.MouseEvent) => void;
  onCardClick: (reportId: string) => void;
  isPM: boolean;
  canApprove: boolean;
  getInitials: (name?: string) => string;
}

function renderReportCard(report: DailyProgress, options: CardRenderOptions) {
  const tag = getDisciplineMeta(report.discipline);
  const linesCount = report.lines?.length || 0;
  const photosCount = report.photos?.length || 0;
  const obstructionsCount = report.obstructions?.length || 0;

  return (
    <div
      key={report.id}
      onClick={() => options.onCardClick(report.id)}
      className="group relative glass-card bg-white/95 dark:bg-slate-900/95 hover:bg-white dark:hover:bg-slate-800/90 border border-slate-200/90 dark:border-slate-800 p-3.5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer space-y-3"
    >
      {/* Header: Report No, Discipline Tag & Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
              #{report.report_no || report.id.slice(0, 6)}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${tag.bg} ${tag.text} ${tag.border}`}
            >
              {tag.labelAr}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{report.progress_date || report.report_date || '—'}</span>
          </div>
        </div>

        <div className="shrink-0">
          <UnifiedStatusBadge status={report.status} entityType="report" size="sm" />
        </div>
      </div>

      {/* Metrics Row: Lines count, Photos, Obstructions, Manpower */}
      <div className="grid grid-cols-2 gap-2 text-[11px] py-2 px-1 border-y border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl">
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-bold font-mono text-xs">{linesCount}</span>
          <span className="text-slate-500 dark:text-slate-400 text-[10px]">بنود</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
          <Users className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
          <span className="font-bold font-mono text-xs">{report.manpower_count || '0'}</span>
          <span className="text-slate-500 dark:text-slate-400 text-[10px]">عمالة</span>
        </div>

        {photosCount > 0 && (
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
            <ImageIcon className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span className="font-bold font-mono text-xs">{photosCount}</span>
            <span className="text-slate-500 dark:text-slate-400 text-[10px]">صور</span>
          </div>
        )}

        {obstructionsCount > 0 && (
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="font-mono text-xs">{obstructionsCount}</span>
            <span className="text-[10px]">عوائق</span>
          </div>
        )}
      </div>

      {/* Planning Velocity & Critical Obstruction Banner */}
      {obstructionsCount > 0 ? (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-[10px] text-rose-800 dark:text-rose-300 font-bold animate-pulse">
          <Flame className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>عائق مسار حرج: يتطلب تدخلاً لتعويض الإنتاج</span>
        </div>
      ) : (
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 px-1 font-mono">
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-500" />
            <span>معدل الحرق اليومي: متوافق</span>
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
            مستهدف خط الأساس
          </span>
        </div>
      )}

      {/* Submitter & Private Note / PM Indicator */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[10px] border border-slate-200 dark:border-slate-700 shrink-0">
            {options.getInitials(report.entered_by_name)}
          </div>
          <span className="text-xs text-slate-700 dark:text-slate-300 font-bold leading-normal">
            {report.entered_by_name || 'مهندس الموقع'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* PM Review Lock Indicator */}
          {(options.isPM || report.pm_reviewed_at) && (
            <span
              className={`p-1 rounded-md text-[10px] ${
                report.pm_reviewed_at
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
              title={
                report.pm_reviewed_at
                  ? 'تمت مراجعة مدير المشروع الخاصة (PM Soft Review)'
                  : 'مراجعة خاصة بمدير المشروع'
              }
            >
              <Lock className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>

      {/* Rejection Snippet if Rejected */}
      {report.status === 'rejected' && report.rejection_reason && (
        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-[10px] text-rose-700 dark:text-rose-300 truncate">
          <strong>سبب الرفض: </strong> {report.rejection_reason}
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="flex items-center justify-between gap-1.5 pt-1">
        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold group-hover:underline flex items-center gap-0.5">
          <span>التفاصيل</span>
          <ChevronLeft className="w-3 h-3" />
        </span>

        <div className="flex items-center gap-1.5">
          {report.status === 'draft' && options.onQuickSubmit && (
            <button
              type="button"
              onClick={options.onQuickSubmit}
              disabled={options.isActionLoading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold shadow-xs transition-colors"
              title="تقديم التقرير للمراجعة فوراً"
            >
              {options.isActionLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              <span>تقديم</span>
            </button>
          )}

          {report.status === 'submitted' && options.onQuickApprove && (
            <button
              type="button"
              onClick={options.onQuickApprove}
              disabled={options.isActionLoading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold shadow-xs transition-colors"
              title="اعتماد التقرير وتوزيع الكميات فوراً"
            >
              {options.isActionLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              <span>اعتماد</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
