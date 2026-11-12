'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  CheckSquare,
  Send,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Flame,
  Clock,
  RotateCcw,
  Check,
  ShieldCheck,
  ListFilter,
  Eye,
  BellRing,
  ExternalLink,
  ClipboardCheck,
  FileCheck,
  Loader2,
  Activity,
  Layers,
  ChevronLeft,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { ReasonModal } from '../ReasonModal';

export type PmUrgencyLevel = 'critical' | 'high' | 'medium' | 'normal';
export type PmActionItemType = 'report' | 'task' | 'inspection' | 'submittal' | 'overdue';

export interface PmActionItem {
  id: string;
  type: PmActionItemType;
  typeLabelAr: string;
  code?: string;
  title: string;
  projectTitle?: string;
  urgency: PmUrgencyLevel;
  dueTimeText?: string;
  submittedBy?: string;
  details?: string;
  requiresReasonOnReject?: boolean;
  requiresReasonOnApprove?: boolean;
}

export interface PmActionCenterProps {
  // Existing props (preserved 100% for backwards compatibility)
  pendingReportsCount?: number;
  pendingTasksCount?: number;
  overdueCount?: number;
  weeklyReportReady?: boolean;
  onFilterAction: (filter: string) => void;
  onReviewReportClick?: () => void;
  className?: string;
  isCollapsible?: boolean;
  initialCollapsed?: boolean;

  // Construction Project Controls & Governance Extensions
  pendingInspectionsCount?: number;
  pendingSubmittalsCount?: number;
  urgentItems?: PmActionItem[];
  onReviewInspectionsClick?: () => void;
  onReviewSubmittalsClick?: () => void;
  onQuickApproveItem?: (item: PmActionItem, notes?: string) => Promise<void> | void;
  onQuickRejectItem?: (item: PmActionItem, reason: string) => Promise<void> | void;
  onInspectItem?: (item: PmActionItem) => void;
}

// Urgency presentation configuration
const URGENCY_STYLES: Record<
  PmUrgencyLevel,
  {
    label: string;
    badge: string;
    iconBg: string;
    border: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  critical: {
    label: 'أولوية قصوى / حرج',
    badge: 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800',
    iconBg: 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-900/60',
    Icon: Flame,
  },
  high: {
    label: 'أولوية عالية',
    badge: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
    iconBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-900/60',
    Icon: Clock,
  },
  medium: {
    label: 'أولوية متوسطة',
    badge: 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800',
    iconBg: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-900/60',
    Icon: Activity,
  },
  normal: {
    label: 'اعتيادي',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    iconBg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-800',
    Icon: CheckSquare,
  },
};

export const PmActionCenter: React.FC<PmActionCenterProps> = ({
  pendingReportsCount = 0,
  pendingTasksCount = 0,
  overdueCount = 0,
  pendingInspectionsCount = 0,
  pendingSubmittalsCount = 0,
  weeklyReportReady = false,
  urgentItems,
  onFilterAction,
  onReviewReportClick,
  onReviewInspectionsClick,
  onReviewSubmittalsClick,
  onQuickApproveItem,
  onQuickRejectItem,
  onInspectItem,
  className = '',
  isCollapsible = true,
  initialCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [activeItem, setActiveItem] = useState<string | null>(null);

  // Quick Action States
  const [processingItemId, setProcessingItemId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<'approve' | 'reject' | null>(null);

  // Modal Dialog States
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedRejectItem, setSelectedRejectItem] = useState<PmActionItem | null>(null);

  // Default urgent items generator based on real counts when prop is undefined
  const defaultUrgentItems = useMemo<PmActionItem[]>(() => {
    if (urgentItems !== undefined) {
      return urgentItems;
    }

    const items: PmActionItem[] = [];

    if (overdueCount > 0) {
      items.push({
        id: 'urgent-overdue-1',
        type: 'overdue',
        typeLabelAr: 'مهمة حرجة متأخرة',
        code: 'TASK-CP-104',
        title: 'صب خرسانة القواعد المسلحة - قطاع البستان (مسار حرج)',
        projectTitle: 'أبراج البستان السكني',
        urgency: 'critical',
        dueTimeText: 'متأخرة بـ 4 ساعات',
        submittedBy: 'م. أحمد الشامي (مهندس الموقع)',
        details: 'تجاوزت المهلة التعاقدية وتهدد تسليم أعمال العزل في الموعد المحدد.',
        requiresReasonOnReject: true,
      });
    }

    if (pendingInspectionsCount > 0) {
      items.push({
        id: 'urgent-insp-1',
        type: 'inspection',
        typeLabelAr: 'طلب استلام أعمال (WIR)',
        code: 'WIR-2026-088',
        title: 'استلام أعمال حديد التسليح لرقاب الأعمدة والميد الأرضية',
        projectTitle: 'مجمع الواحة التجاري',
        urgency: 'critical',
        dueTimeText: 'موعد فحص الاستشاري: بعد 45 دقيقة',
        submittedBy: 'م. سارة المهندس (QC)',
        details: 'تم استيفاء الملاحظات السابقة وجاهز للمطابقة مع مهندس الاستشاري.',
        requiresReasonOnReject: true,
      });
    }

    if (pendingSubmittalsCount > 0) {
      items.push({
        id: 'urgent-submittal-1',
        type: 'submittal',
        typeLabelAr: 'اعتماد مخططات ومواد (MAR / Shop Drawings)',
        code: 'SD-STR-204',
        title: 'مخططات الورشة الإنشائية لتسليح البلاطة اللاكمرية (Flat Slab)',
        projectTitle: 'برج الأندلس الإداري',
        urgency: 'high',
        dueTimeText: 'متبقي 3 ساعات على انتهاء مهلة الـ SLA',
        submittedBy: 'م. حسام الدين (المكتب الفني)',
        details: 'مراجعة أوزان التسليح ومطابقتها للمخطط التصميمي المعتمد.',
        requiresReasonOnReject: true,
      });
    }

    if (pendingReportsCount > 0) {
      items.push({
        id: 'urgent-report-1',
        type: 'report',
        typeLabelAr: 'تقرير تقدم يومي (DSR)',
        code: 'DSR-2026-031',
        title: 'تقرير الإنجاز الميداني وقوى العمالة والمعدات لليوم الحالي',
        projectTitle: 'أبراج البستان السكني',
        urgency: 'medium',
        dueTimeText: 'مرفوع اليوم 05:00 م',
        submittedBy: 'م. عمر السعدي (مدير الموقع)',
        details: 'يتضمن نسب الإنجاز التراكمية وسجل توريدات الخرسانة الجاهزة.',
        requiresReasonOnReject: true,
      });
    }

    if (pendingTasksCount > 0) {
      items.push({
        id: 'urgent-task-1',
        type: 'task',
        typeLabelAr: 'اعتماد إنجاز مهمة موقعية',
        code: 'TSK-FIN-045',
        title: 'اكتمال أعمال تمديدات الصرف الصحي والتغذية المائية بالموقع العام',
        projectTitle: 'مجمع الواحة التجاري',
        urgency: 'medium',
        dueTimeText: 'جاهزة للتحقق بنسبة 100%',
        submittedBy: 'مقاول الباطن - شركة الأفق للمقاولات',
        details: 'منجزة بالكامل وبانتظار اعتماد PM لبدء مرحلة الفحص الموقعي.',
        requiresReasonOnReject: true,
      });
    }

    return items;
  }, [
    urgentItems,
    overdueCount,
    pendingInspectionsCount,
    pendingSubmittalsCount,
    pendingReportsCount,
    pendingTasksCount,
  ]);

  const [liveUrgentItems, setLiveUrgentItems] = useState<PmActionItem[]>(defaultUrgentItems);

  useEffect(() => {
    setLiveUrgentItems(defaultUrgentItems);
  }, [defaultUrgentItems]);

  // Total pending items sum across all 6 core obligations
  const totalPending =
    pendingReportsCount +
    pendingTasksCount +
    overdueCount +
    pendingInspectionsCount +
    pendingSubmittalsCount +
    (weeklyReportReady ? 1 : 0);

  // Dynamic calculation of completed obligations out of all tracked categories
  const keyObligations = [
    { key: 'reports', isComplete: pendingReportsCount === 0 },
    { key: 'tasks', isComplete: pendingTasksCount === 0 },
    { key: 'inspections', isComplete: pendingInspectionsCount === 0 },
    { key: 'submittals', isComplete: pendingSubmittalsCount === 0 },
    { key: 'overdue', isComplete: overdueCount === 0 },
    { key: 'weekly', isComplete: weeklyReportReady },
  ];

  const completedCount = keyObligations.filter((o) => o.isComplete).length;
  const completionPct = Math.round((completedCount / keyObligations.length) * 100);

  const handleActionClick = (filterKey: string, extraCallback?: () => void) => {
    setActiveItem(filterKey);
    onFilterAction(filterKey);
    if (extraCallback) {
      extraCallback();
    }
  };

  // Quick Approve Item Handler
  const handleQuickApprove = async (item: PmActionItem) => {
    setProcessingItemId(item.id);
    setProcessingAction('approve');
    try {
      if (onQuickApproveItem) {
        await onQuickApproveItem(item);
      }
      setLiveUrgentItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success(`تم اعتماد البند بنجاح: ${item.code || item.title}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر اعتماد البند، يرجى المحاولة لاحقاً';
      toast.error(msg);
    } finally {
      setProcessingItemId(null);
      setProcessingAction(null);
    }
  };

  // Open Reject Modal
  const handleOpenRejectModal = (item: PmActionItem) => {
    setSelectedRejectItem(item);
    setIsRejectModalOpen(true);
  };

  // Confirm Reject via ReasonModal
  const handleConfirmReject = async (reason: string) => {
    if (!selectedRejectItem) return;
    setProcessingItemId(selectedRejectItem.id);
    setProcessingAction('reject');

    try {
      if (onQuickRejectItem) {
        await onQuickRejectItem(selectedRejectItem, reason);
      }
      setLiveUrgentItems((prev) => prev.filter((i) => i.id !== selectedRejectItem.id));
      toast.success(`تم تسجيل قرار الرفض وإعادة التوجيه لـ: ${selectedRejectItem.code || selectedRejectItem.title}`);
      setIsRejectModalOpen(false);
      setSelectedRejectItem(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشلت معالجة قرار الرفض';
      toast.error(msg);
      throw err;
    } finally {
      setProcessingItemId(null);
      setProcessingAction(null);
    }
  };

  // Inspect item details
  const handleInspect = (item: PmActionItem) => {
    if (onInspectItem) {
      onInspectItem(item);
      return;
    }
    // Fallback: route filter according to item type
    switch (item.type) {
      case 'report':
        handleActionClick('pending_reports', onReviewReportClick);
        break;
      case 'task':
        handleActionClick('pending_tasks');
        break;
      case 'inspection':
        handleActionClick('inspections', onReviewInspectionsClick);
        break;
      case 'submittal':
        handleActionClick('deliverables', onReviewSubmittalsClick);
        break;
      case 'overdue':
        handleActionClick('overdue_tasks');
        break;
      default:
        handleActionClick('all');
    }
  };

  return (
    <div
      role="region"
      aria-label="مركز إجراءات وقرارات مدير المشروع"
      className={`glass-card bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden transition-all duration-300 ${
        overdueCount > 0
          ? 'hover:border-rose-500/50'
          : totalPending > 0
          ? 'hover:border-emerald-500/40'
          : ''
      } ${className}`}
    >
      {/* ── Widget Header ── */}
      <div
        className={`p-4 sm:p-5 flex items-center justify-between gap-3 ${
          isCollapsible ? 'cursor-pointer select-none' : ''
        } ${!isCollapsed ? 'border-b border-slate-100 dark:border-slate-800/80' : ''}`}
        onClick={() => isCollapsible && setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          {/* Notification Icon Badge */}
          <div
            className={`p-2.5 rounded-2xl transition-all ${
              overdueCount > 0
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 animate-pulse'
                : totalPending > 0
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {overdueCount > 0 ? (
              <Flame className="w-5 h-5" />
            ) : totalPending > 0 ? (
              <BellRing className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>المطلوب منك</span>
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                  (Action Required)
                </span>
              </h3>

              {overdueCount > 0 ? (
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-rose-600 text-white shadow-xs animate-pulse inline-flex items-center gap-1"
                  role="status"
                  aria-live="polite"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>{totalPending} معلق ({overdueCount} حرج ⚡)</span>
                </span>
              ) : totalPending > 0 ? (
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-amber-500 text-white shadow-xs"
                  role="status"
                  aria-live="polite"
                >
                  {totalPending} إجراء معلق
                </span>
              ) : (
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                  role="status"
                >
                  تم إنجاز كافة المهام ✨
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              مركز القرارات اليومية والاعتمادات العاجلة لمدير المشروع (Daily Action Hub)
            </p>
          </div>
        </div>

        {/* Action Header Controls */}
        <div className="flex items-center gap-2">
          {/* Mini completion track */}
          <div className="hidden md:flex flex-col items-end gap-1 pe-3 border-e border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              اكتمال الالتزامات: {completionPct}%
            </span>
            <div
              className="w-28 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
              role="progressbar"
              aria-valuenow={completionPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="نسبة اكتمال إجراءات مدير المشروع"
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  completionPct === 100
                    ? 'bg-emerald-700'
                    : completionPct >= 50
                    ? 'bg-blue-600'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          {isCollapsible && (
            <button
              type="button"
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
              aria-expanded={!isCollapsed}
              aria-controls="pm-action-center-content"
              aria-label={isCollapsed ? 'توسيع مركز الإجراءات' : 'طي مركز الإجراءات'}
            >
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Collapsed Single-line Quick Pills Bar ── */}
      {isCollapsed && (
        <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleActionClick('pending_reports', onReviewReportClick)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{pendingReportsCount} تقارير</span>
            </button>

            <button
              type="button"
              onClick={() => handleActionClick('pending_tasks')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all"
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{pendingTasksCount} مهام</span>
            </button>

            <button
              type="button"
              onClick={() => handleActionClick('inspections', onReviewInspectionsClick)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all"
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>{pendingInspectionsCount} فحص WIR</span>
            </button>

            <button
              type="button"
              onClick={() => handleActionClick('deliverables', onReviewSubmittalsClick)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-cyan-50 dark:bg-cyan-950/50 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-all"
            >
              <FileCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>{pendingSubmittalsCount} اعتمادات</span>
            </button>

            <button
              type="button"
              onClick={() => handleActionClick('overdue_tasks')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all"
            >
              <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>{overdueCount} متأخرة</span>
            </button>

            {weeklyReportReady && (
              <button
                type="button"
                onClick={() => handleActionClick('weekly_report')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"
              >
                <Send className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>تقرير أسبوعي جاهز</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
          >
            عرض التفاصيل
          </button>
        </div>
      )}

      {/* ── Expanded Content ── */}
      {!isCollapsed && (
        <div id="pm-action-center-content" className="p-4 sm:p-5 space-y-5">
          {/* ── Section A: Urgent Decisions Workbench (Direct Quick Approve / Reject) ── */}
          {liveUrgentItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                    <Flame className="w-3.5 h-3.5" />
                  </span>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-normal">
            إجراءات سريعة فورية تتطلب قرارك (Quick Decision Workbench)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white font-mono">
                    {liveUrgentItems.length}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                  يمكنك اتخاذ القرار المباشر بالاعتماد أو الرفض الفني مع تدوين الملاحظات
                </span>
              </div>

              <div className="space-y-2.5">
                {liveUrgentItems.map((item) => {
                  const urgencyStyle = URGENCY_STYLES[item.urgency] || URGENCY_STYLES.normal;
                  const UrgencyIcon = urgencyStyle.Icon;
                  const isItemApproving = processingItemId === item.id && processingAction === 'approve';
                  const isItemRejecting = processingItemId === item.id && processingAction === 'reject';
                  const isProcessing = Boolean(processingItemId);

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                        item.urgency === 'critical'
                          ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/90 dark:border-rose-900/60 shadow-xs'
                          : item.urgency === 'high'
                          ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200/90 dark:border-amber-900/60'
                          : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                        {/* Info Column */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`p-2.5 rounded-xl shrink-0 ${urgencyStyle.iconBg}`}>
                            <UrgencyIcon className="w-4 h-4" />
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.code && (
                                <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-slate-900 text-white dark:bg-slate-700 dark:text-slate-100">
                                  {item.code}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {item.typeLabelAr}
                              </span>
                              {/* Urgency Badge */}
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${urgencyStyle.badge}`}
                                role="status"
                                aria-label={`مستوى الإلحاح: ${urgencyStyle.label}`}
                              >
                                {item.urgency === 'critical' && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping inline-block" />
                                )}
                                <span>{urgencyStyle.label}</span>
                              </span>
                              {item.dueTimeText && (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                                  <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                  <span>{item.dueTimeText}</span>
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {item.title}
                            </h4>

                            {item.details && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                                {item.details}
                              </p>
                            )}

                            <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 flex-wrap">
                              {item.projectTitle && (
                                <span className="font-semibold text-slate-600 dark:text-slate-300">
                                  المشروع: {item.projectTitle}
                                </span>
                              )}
                              {item.submittedBy && (
                                <span>بواسطة: {item.submittedBy}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quick Approve / Reject Button Group in RTL */}
                        <div className="flex items-center gap-2 self-end lg:self-center shrink-0 rtl:space-x-reverse flex-wrap">
                          {/* Quick Approve Button */}
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleQuickApprove(item)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                            aria-label={`اعتماد سريع لطلب ${item.code || item.title}`}
                          >
                            {isItemApproving ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>{isItemApproving ? 'جارِ الاعتماد...' : 'اعتماد سريع'}</span>
                          </button>

                          {/* Quick Reject Button */}
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleOpenRejectModal(item)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 active:scale-[0.98] text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                            aria-label={`رفض أو طلب تعديل لطلب ${item.code || item.title}`}
                          >
                            {isItemRejecting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5" />
                            )}
                            <span>{isItemRejecting ? 'جارِ الرفض...' : 'طلب تعديل / رفض'}</span>
                          </button>

                          {/* Inspect / View Button */}
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleInspect(item)}
                            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
                            aria-label={`معاينة تفاصيل ${item.code || item.title}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">معاينة</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Section B: Core Governance & Action Checklist (6 Categories) ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-normal">
            قوائم تدقيق دورة العمل والمصادقات (Workflows & Approvals Checklist)
              </h4>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                مقسمة حسب التخصص والمسار الرقابي
              </span>
            </div>

            <div className="space-y-3">
              {/* Action 1: Review Daily Reports */}
              <div
                onClick={() => handleActionClick('pending_reports', onReviewReportClick)}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                  activeItem === 'pending_reports'
                    ? 'ring-2 ring-amber-500/40 bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700'
                    : pendingReportsCount > 0
                    ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/60 hover:border-amber-400 dark:hover:border-amber-600'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      pendingReportsCount > 0
                        ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                        : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                        مراجعة {pendingReportsCount} تقارير يومية
                      </h4>
                      {pendingReportsCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500 text-white shadow-xs">
                          {pendingReportsCount} بانتظار الاعتماد
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                          مكتمل ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      تقارير التقدم الميداني المرفوعة من مهندسي الموقع وبانتظار مصادقة مدير المشروع
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionClick('pending_reports', onReviewReportClick);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                      pendingReportsCount > 0
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>مراجعة التقارير</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              </div>

              {/* Action 2: Approve Completed Site Tasks */}
              <div
                onClick={() => handleActionClick('pending_tasks')}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                  activeItem === 'pending_tasks'
                    ? 'ring-2 ring-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700'
                    : pendingTasksCount > 0
                    ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/60 hover:border-emerald-400 dark:hover:border-emerald-600'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="relative p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                    <CheckSquare className="w-4 h-4" />
                    {pendingTasksCount > 0 && (
                      <span className="absolute -top-1 -end-1 w-2.5 h-2.5 rounded-full bg-emerald-700 ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        اعتماد {pendingTasksCount} مهام موقعية مكتملة
                      </h4>
                      {pendingTasksCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-700 text-white shadow-xs">
                          {pendingTasksCount} جاهزة للتحقق
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          لا توجد مهام معلقة
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      مهام موقعية منجزة بنسبة 100% تتطلب اعتماد PM للانتقال إلى مرحلة الفحص الموقعي WIR
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionClick('pending_tasks');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                      pendingTasksCount > 0
                        ? 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>اعتماد المهام</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              </div>

              {/* Action 3: Review Inspection Requests (WIR / MIR) */}
              <div
                onClick={() => handleActionClick('inspections', onReviewInspectionsClick)}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                  activeItem === 'inspections'
                    ? 'ring-2 ring-purple-500/40 bg-purple-50/80 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700'
                    : pendingInspectionsCount > 0
                    ? 'bg-purple-50/30 dark:bg-purple-950/20 border-purple-200/80 dark:border-purple-900/60 hover:border-purple-400 dark:hover:border-purple-600'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      pendingInspectionsCount > 0
                        ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300'
                        : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    <ClipboardCheck className="w-4 h-4" />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                        متابعة {pendingInspectionsCount} طلبات فحص واستلام (WIR / MIR)
                      </h4>
                      {pendingInspectionsCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-600 text-white shadow-xs">
                          {pendingInspectionsCount} بانتظار الإجراء
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                          كافة الفحوصات مستوفاة ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      طلبات استلام الأعمال وفحص المواد بالموقع بالتنسيق مع مهندس ضبط الجودة والاستشاري
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionClick('inspections', onReviewInspectionsClick);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none ${
                      pendingInspectionsCount > 0
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>مراجعة طلبات الفحص</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              </div>

              {/* Action 4: Approve Submittals & Shop Drawings */}
              <div
                onClick={() => handleActionClick('deliverables', onReviewSubmittalsClick)}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                  activeItem === 'deliverables'
                    ? 'ring-2 ring-cyan-500/40 bg-cyan-50/80 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-700'
                    : pendingSubmittalsCount > 0
                    ? 'bg-cyan-50/30 dark:bg-cyan-950/20 border-cyan-200/80 dark:border-cyan-900/60 hover:border-cyan-400 dark:hover:border-cyan-600'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      pendingSubmittalsCount > 0
                        ? 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300'
                        : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    <FileCheck className="w-4 h-4" />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition-colors">
                        اعتماد {pendingSubmittalsCount} مخططات وعينات مواد (Submittals)
                      </h4>
                      {pendingSubmittalsCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-600 text-white shadow-xs">
                          {pendingSubmittalsCount} تتطلب موافقة
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          لا توجد اعتمادات معلقة
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      المخططات التنفيذية واعتمادات العينات (MAR / Shop Drawings) الواجب اعتمادها للمسار التنفيذي
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionClick('deliverables', onReviewSubmittalsClick);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none ${
                      pendingSubmittalsCount > 0
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>مراجعة المخططات</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              </div>

              {/* Action 5: Overdue Tasks Requiring Escalation */}
              <div
                onClick={() => handleActionClick('overdue_tasks')}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                  activeItem === 'overdue_tasks'
                    ? 'ring-2 ring-rose-500/40 bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700'
                    : overdueCount > 0
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/60 hover:border-rose-400 dark:hover:border-rose-600'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      overdueCount > 0
                        ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 animate-pulse'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {overdueCount} مهام متأخرة تحتاج تصعيد
                      </h4>
                      {overdueCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-600 text-white shadow-xs animate-pulse">
                          {overdueCount} حرجة
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                          ضمن الجدول 0 متأخر
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      مهام تجاوزت تاريخ النهاية المخطط وتؤثر مباشرة على المسار الحرج (Critical Path)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionClick('overdue_tasks');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none ${
                      overdueCount > 0
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>تصعيد ومعالجة</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              </div>

              {/* Action 6: Weekly Executive Report */}
              <div
                onClick={() => handleActionClick('weekly_report')}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                  activeItem === 'weekly_report'
                    ? 'ring-2 ring-blue-500/40 bg-blue-50/80 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700'
                    : weeklyReportReady
                    ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/60 hover:border-blue-400 dark:hover:border-blue-600'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      weeklyReportReady
                        ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        تقرير أسبوعي تنفيذي للمشروع
                      </h4>
                      {weeklyReportReady ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white shadow-xs">
                          جاهز للإرسال
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          قيد الإعداد (80%)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ملخص الإنجاز الأسبوعي متضمن نسب التقدم، الإعاقات المفتوحة، وتوزيع القوى العاملة
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionClick('weekly_report');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
                      weeklyReportReady
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{weeklyReportReady ? 'إرسال التقرير' : 'معاينة المسودة'}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Filter Navigation Footer ── */}
      {!isCollapsed && (
        <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <ListFilter className="w-3.5 h-3.5" />
            <span className="font-bold">تصفية سريعة للمنظومة:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'pending_reports', label: 'التقارير اليومية', count: pendingReportsCount },
              { id: 'pending_tasks', label: 'مهام الموقع', count: pendingTasksCount },
              { id: 'inspections', label: 'فحوصات WIR', count: pendingInspectionsCount },
              { id: 'deliverables', label: 'المخططات والمواد', count: pendingSubmittalsCount },
              { id: 'overdue_tasks', label: 'المتأخرات الحرجة', count: overdueCount },
              { id: 'weekly_report', label: 'التقرير الأسبوعي', count: weeklyReportReady ? 1 : 0 },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleActionClick(f.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                  activeItem === f.id
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>{f.label}</span>
                {f.count !== undefined && f.count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      activeItem === f.id
                        ? 'bg-white/20 dark:bg-slate-950/30 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Accessible Reason / Rejection Confirmation Modal ── */}
      <ReasonModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setSelectedRejectItem(null);
        }}
        onConfirm={handleConfirmReject}
        title={
          selectedRejectItem
            ? `تسجيل مبررات الرفض أو طلب التعديل: ${selectedRejectItem.title}`
            : 'تسجيل سبب الرفض'
        }
        subtitle={
          selectedRejectItem?.code
            ? `يرجى تدوين الملاحظات الهندسية وأسباب الإرجاع للطلب (${selectedRejectItem.code}) لحفظ السجل الرقابي.`
            : 'يتطلب رفض هذا البند تدوين ملاحظات فنية واضحة لتوجيه مهندس الموقع أو المكتب الفني.'
        }
        placeholder="اكتب أسباب ومبررات الرفض بالتفصيل (حقل إلزامي لضمان الحوكمة)..."
        confirmLabel="تأكيد الرفض والإرجاع"
        confirmVariant="danger"
        isLoading={processingAction === 'reject'}
      />
    </div>
  );
};

export default PmActionCenter;
