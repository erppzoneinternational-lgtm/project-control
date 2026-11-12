'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ListTodo,
  Clock,
  Play,
  Check,
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  FileCode,
  Layers,
  User,
  Search,
  RefreshCw,
  CheckCircle2,
  X,
  HardHat,
  ClipboardCheck,
  XCircle,
  UploadCloud,
  MapPin,
  Loader2,
  Save,
  Flame,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
  CalendarClock,
  AlertCircle,
  Building2,
  Keyboard,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { DeliverableItem } from '@/types/planning';
import { StakeholderFull } from '@/types';
import { DeliverablesService } from '@/lib/services/deliverables.service';
import { ProjectService } from '@/lib/services/project.service';
import { ConsultantReviewModal } from './ConsultantReviewModal';
import { useAuth } from '@/lib/stores/useAuthStore';
import { supabase } from '@/lib/supabase';
import {
  SiteTaskService,
  groupSiteTasksByDate,
  type SiteTask,
  type SiteTaskStatus,
  type SiteTaskPriority,
  type SiteTaskGroups,
} from '@/lib/services/siteTask.service';
import { logger } from '@/lib/logger';
import { useUserRoles } from '@/lib/hooks/useUserRoles';

interface MyTasksViewProps {
  stakeholderId?: string;
}

/* ── Site Tasks (F6) — labels mirrored from site-workspace ── */
const SITE_STATUS_LABEL: Record<SiteTaskStatus, string> = {
  pending: 'لم تبدأ',
  in_progress: 'قيد التنفيذ',
  pm_review: 'بانتظار اعتماد مدير المشروع',
  qc_pending: 'بانتظار استلام QC',
  approved: 'معتمدة',
  rejected: 'مرفوضة',
  done: 'منجزة',
  cancelled: 'ملغاة',
};

const SITE_STATUS_CLS: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  in_progress: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  pm_review: 'bg-teal-50 text-teal-800 dark:bg-violet-950/40 dark:text-teal-300',
  qc_pending: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
  approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  rejected: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  done: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  cancelled: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

const SITE_PRIORITY_LABEL: Record<SiteTaskPriority, string> = {
  urgent: 'عاجلة',
  high: 'مرتفعة',
  normal: 'عادية',
  low: 'منخفضة',
};

const SITE_PRIORITY_CLS: Record<SiteTaskPriority, string> = {
  urgent: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  normal: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  low: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

interface SiteProjectGroup {
  projectId: string;
  label: string;
  tasks: SiteTask[];
}

interface ZoneLookup {
  [zoneId: string]: string;
}

/* ── Date Helpers ── */
const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return iso;
  }
};

const isOverdue = (planned: string | null | undefined): boolean => {
  if (!planned) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(planned) < today;
};

const isDueDateToday = (planned: string | null | undefined): boolean => {
  if (!planned) return false;
  const d = new Date(planned);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

const isDueDateTomorrow = (planned: string | null | undefined): boolean => {
  if (!planned) return false;
  const d = new Date(planned);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate()
  );
};

/* ── Priority Indicators with icons & semantic colors ── */
const PriorityIndicator: React.FC<{ priority: SiteTaskPriority }> = ({ priority }) => {
  switch (priority) {
    case 'urgent':
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          title="أولوية عاجلة جداً"
        >
          <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 animate-pulse shrink-0" />
          <span>عاجلة</span>
        </span>
      );
    case 'high':
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
          title="أولوية مرتفعة"
        >
          <ArrowUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 stroke-[2.5] shrink-0" />
          <span>مرتفعة</span>
        </span>
      );
    case 'normal':
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
          title="أولوية عادية"
        >
          <Minus className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>عادية</span>
        </span>
      );
    case 'low':
    default:
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
          title="أولوية منخفضة"
        >
          <ArrowDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>منخفضة</span>
        </span>
      );
  }
};

/* ── Due Date Indicators with relative badges ── */
const DueDateIndicator: React.FC<{ plannedDate: string | null | undefined }> = ({ plannedDate }) => {
  if (!plannedDate) return <span className="text-slate-400 text-xs">—</span>;
  const overdue = isOverdue(plannedDate);
  const isToday = isDueDateToday(plannedDate);
  const isTomorrow = isDueDateTomorrow(plannedDate);

  if (overdue) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-[11px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
        <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
        <span>متأخرة ({formatDate(plannedDate)})</span>
      </span>
    );
  }
  if (isToday) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 shadow-2xs">
        <CalendarClock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>مستحقة اليوم</span>
      </span>
    );
  }
  if (isTomorrow) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
        <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        <span>غداً ({formatDate(plannedDate)})</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span>{formatDate(plannedDate)}</span>
    </span>
  );
};

/* ── Accessible Interactive Checkbox Component ── */
const TaskCheckbox: React.FC<{
  task: SiteTask;
  isActing: boolean;
  onToggle: (task: SiteTask) => void;
}> = ({ task, isActing, onToggle }) => {
  const isApprovedOrDone = task.status === 'approved' || task.status === 'done';
  const isUnderReview = task.status === 'pm_review' || task.status === 'qc_pending';
  const isInProgress = task.status === 'in_progress';
  const isRejected = task.status === 'rejected';

  const ariaChecked = isApprovedOrDone ? true : isUnderReview ? 'mixed' : false;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={ariaChecked}
      aria-label={`تحديد المهمة: ${task.title_ar} - الحالة الحالية: ${SITE_STATUS_LABEL[task.status] || task.status}`}
      tabIndex={0}
      disabled={isActing || isUnderReview || isApprovedOrDone}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(task);
      }}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          onToggle(task);
        }
      }}
      className={`relative w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
        isApprovedOrDone
          ? 'bg-emerald-600 border-2 border-emerald-600 text-white shadow-xs shadow-emerald-500/30 cursor-default'
          : isUnderReview
          ? 'bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500 text-amber-600 dark:text-amber-400 cursor-default'
          : isInProgress
          ? 'bg-blue-50 hover:bg-blue-600 dark:bg-blue-950/40 border-2 border-blue-500 text-blue-600 hover:text-white dark:text-blue-300 dark:hover:text-white cursor-pointer group/chk'
          : isRejected
          ? 'bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-600 hover:text-white dark:text-rose-300 cursor-pointer'
          : 'bg-white hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 border-2 border-slate-300 hover:border-emerald-500 dark:border-slate-600 dark:hover:border-emerald-500 text-transparent hover:text-emerald-600 cursor-pointer group/chk'
      }`}
      title={
        isApprovedOrDone
          ? 'مهمة معتمدة ومنجزة'
          : isUnderReview
          ? 'بانتظار الاعتماد'
          : isInProgress
          ? 'قيد التنفيذ — انقر للرفع للاعتماد'
          : isRejected
          ? 'مرفوضة — انقر لإعادة العمل'
          : 'لم تبدأ — انقر لبدء التنفيذ'
      }
    >
      {isActing ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : isApprovedOrDone ? (
        <Check className="w-4 h-4 stroke-[3]" />
      ) : isUnderReview ? (
        <Clock className="w-3.5 h-3.5" />
      ) : isInProgress ? (
        <>
          <Play className="w-3.5 h-3.5 group-hover/chk:hidden" />
          <UploadCloud className="w-3.5 h-3.5 hidden group-hover/chk:block" />
        </>
      ) : isRejected ? (
        <RotateCcw className="w-3.5 h-3.5" />
      ) : (
        <Play className="w-3.5 h-3.5 opacity-0 group-hover/chk:opacity-100 transition-opacity" />
      )}
    </button>
  );
};

/* ── Bespoke Illustrations for Empty & Loading States ── */
const TodayEmptyIllustration = () => (
  <svg className="w-24 h-24 mx-auto text-emerald-500" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="48" className="fill-emerald-50 dark:fill-emerald-950/30 stroke-emerald-200 dark:stroke-emerald-800/40" strokeWidth="2" strokeDasharray="4 4" />
    <circle cx="60" cy="60" r="36" className="fill-emerald-100/60 dark:fill-emerald-900/30" />
    <rect x="42" y="36" width="36" height="48" rx="8" className="fill-white dark:fill-slate-800 stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="2.5" />
    <path d="M50 32H70V36C70 37.1 69.1 38 68 38H52C50.9 38 50 37.1 50 36V32Z" className="fill-emerald-600 dark:fill-emerald-500" />
    <circle cx="60" cy="30" r="3" className="fill-emerald-200 dark:fill-emerald-700" />
    <path d="M50 52L56 58L70 44" className="stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M50 68H70" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="2" strokeLinecap="round" />
    <path d="M50 74H64" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="2" strokeLinecap="round" />
    <path d="M88 38L90 44L96 46L90 48L88 54L86 48L80 46L86 44L88 38Z" className="fill-amber-400 dark:fill-amber-300" />
    <path d="M28 68L29.5 72.5L34 74L29.5 75.5L28 80L26.5 75.5L22 74L26.5 72.5L28 68Z" className="fill-emerald-400 dark:fill-emerald-300" />
  </svg>
);

const OverdueEmptyIllustration = () => (
  <svg className="w-24 h-24 mx-auto text-emerald-500" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="48" className="fill-emerald-50 dark:fill-emerald-950/20 stroke-emerald-200 dark:stroke-emerald-800/40" strokeWidth="2" strokeDasharray="3 3" />
    <circle cx="60" cy="60" r="38" className="fill-white dark:fill-slate-800 stroke-emerald-500/30" strokeWidth="2" />
    <path d="M60 30V40M60 80V90M30 60H40M80 60H90" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="2" strokeLinecap="round" />
    <circle cx="60" cy="60" r="24" className="fill-emerald-500/10 stroke-emerald-500" strokeWidth="2.5" />
    <path d="M50 60L57 67L72 52" className="stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="86" cy="34" r="10" className="fill-emerald-500" />
    <path d="M82 34L85 37L91 31" className="stroke-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const UpcomingEmptyIllustration = () => (
  <svg className="w-24 h-24 mx-auto text-blue-500" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="48" className="fill-blue-50 dark:fill-blue-950/20 stroke-blue-200 dark:stroke-blue-800/40" strokeWidth="2" strokeDasharray="4 4" />
    <rect x="36" y="38" width="48" height="46" rx="8" className="fill-white dark:fill-slate-800 stroke-blue-500" strokeWidth="2.5" />
    <path d="M36 50H84" className="stroke-blue-500" strokeWidth="2" />
    <line x1="48" y1="32" x2="48" y2="40" className="stroke-blue-600 dark:stroke-blue-400" strokeWidth="3" strokeLinecap="round" />
    <line x1="72" y1="32" x2="72" y2="40" className="stroke-blue-600 dark:stroke-blue-400" strokeWidth="3" strokeLinecap="round" />
    <circle cx="50" cy="62" r="3" className="fill-blue-400" />
    <circle cx="60" cy="62" r="3" className="fill-blue-400" />
    <circle cx="70" cy="62" r="3" className="fill-blue-400" />
    <circle cx="50" cy="72" r="3" className="fill-blue-300 dark:fill-blue-600" />
    <circle cx="60" cy="72" r="3" className="fill-blue-300 dark:fill-blue-600" />
  </svg>
);

const GeneralEmptyIllustration = () => (
  <svg className="w-24 h-24 mx-auto text-slate-400" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="48" className="fill-slate-50 dark:fill-slate-800/40 stroke-slate-200 dark:stroke-slate-700/60" strokeWidth="2" strokeDasharray="4 4" />
    <path d="M40 76C40 60 50 48 60 48C70 48 80 60 80 76H40Z" className="fill-amber-500/20 stroke-amber-500 dark:stroke-amber-400" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M36 76H84C85.5 76 87 77.5 86 79L84 82H36L34 79C33 77.5 34.5 76 36 76Z" className="fill-amber-500 dark:fill-amber-600" />
    <circle cx="60" cy="46" r="4" className="fill-amber-400" />
    <path d="M60 52V62" className="stroke-amber-600 dark:stroke-amber-400" strokeWidth="2" strokeLinecap="round" />
    <circle cx="86" cy="80" r="10" className="fill-emerald-500" />
    <path d="M82 80L85 83L90 77" className="stroke-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SearchEmptyIllustration = () => (
  <svg className="w-24 h-24 mx-auto text-slate-400" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="48" className="fill-slate-50 dark:fill-slate-800/30 stroke-slate-200 dark:stroke-slate-700/60" strokeWidth="2" strokeDasharray="4 4" />
    <circle cx="56" cy="56" r="18" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="2.5" />
    <line x1="69" y1="69" x2="82" y2="82" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="56" cy="56" r="8" className="fill-slate-200 dark:fill-slate-700 stroke-none" />
  </svg>
);

const QcEmptyIllustration = () => (
  <svg className="w-24 h-24 mx-auto text-cyan-500" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="48" className="fill-cyan-50 dark:fill-cyan-950/20 stroke-cyan-200 dark:stroke-cyan-800/40" strokeWidth="2" strokeDasharray="4 4" />
    <rect x="40" y="34" width="40" height="52" rx="8" className="fill-white dark:fill-slate-800 stroke-cyan-600 dark:stroke-cyan-400" strokeWidth="2.5" />
    <path d="M50 48L56 54L70 40" className="stroke-cyan-600 dark:stroke-cyan-400" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M48 64H72" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="2" strokeLinecap="round" />
    <path d="M48 72H64" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="2" strokeLinecap="round" />
    <circle cx="78" cy="74" r="12" className="fill-cyan-500/20 stroke-cyan-600 dark:stroke-cyan-400" strokeWidth="2" strokeDasharray="2 2" />
    <path d="M74 74L77 77L82 72" className="stroke-cyan-600 dark:stroke-cyan-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DeliverablesEmptyIllustration = () => (
  <svg className="w-24 h-24 mx-auto text-emerald-500" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="48" className="fill-emerald-50 dark:fill-emerald-950/20 stroke-emerald-200 dark:stroke-emerald-800/40" strokeWidth="2" strokeDasharray="4 4" />
    <path d="M38 42C38 38.7 40.7 36 44 36H72L86 50V80C86 83.3 83.3 86 80 86H44C40.7 86 38 83.3 38 80V42Z" className="fill-white dark:fill-slate-800 stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="2.5" />
    <path d="M72 36V50H86" className="fill-emerald-100 dark:fill-emerald-900/60 stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="2" />
    <line x1="48" y1="58" x2="68" y2="58" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="2" strokeLinecap="round" />
    <line x1="48" y1="66" x2="76" y2="66" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="2" strokeLinecap="round" />
    <line x1="48" y1="74" x2="62" y2="74" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SkeletonWorkbench = () => (
  <div className="space-y-4 p-5 animate-pulse">
    {/* KPI cards skeleton */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800/60 p-4 space-y-2 border border-slate-200/50 dark:border-slate-800">
          <div className="w-16 h-3 bg-slate-200 dark:bg-slate-700 rounded-full" />
          <div className="w-10 h-6 bg-slate-300 dark:bg-slate-600 rounded-lg" />
        </div>
      ))}
    </div>
    {/* Filter bar skeleton */}
    <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-800" />
    {/* Task rows skeleton */}
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800/60 p-4 flex items-center justify-between border border-slate-200/50 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0" />
            <div className="space-y-2">
              <div className="w-48 sm:w-72 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="w-28 h-3 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
          </div>
          <div className="w-24 h-8 bg-slate-200 dark:bg-slate-700 rounded-xl shrink-0" />
        </div>
      ))}
    </div>
    <div className="text-center pt-2 text-xs text-slate-400 dark:text-slate-500">
      جاري مواءمة وتجهيز مهامك الميدانية وجداول الموقع...
    </div>
  </div>
);

export const MyTasksView: React.FC<MyTasksViewProps> = ({
  stakeholderId: propStakeholderId,
}) => {
  const { user } = useAuth();
  const { roles = [], isAdmin } = useUserRoles();
  const isQc = useMemo(
    () => isAdmin || roles.some((r) => ['qc_inspector', 'qc_engineer'].includes(r)),
    [roles, isAdmin]
  );
  const canSeeDeliverables = useMemo(
    () => isAdmin || roles.some((r) => ['technical_office', 'to_engineer', 'to_manager', 'planning_engineer', 'planning_manager', 'project_manager'].includes(r)),
    [roles, isAdmin]
  );

  // ─── Shared stakeholder resolution ──────────────────────────────
  // Resolve once via SiteTaskService.resolveMyStakeholderId (email → stakeholders.id).
  // This stakeholder id is reused across the 3 sections so they all show "my" data.
  const [resolvedStakeholderId, setResolvedStakeholderId] = useState<string>(
    propStakeholderId || ''
  );
  const [stakeholderResolved, setStakeholderResolved] = useState<boolean>(
    Boolean(propStakeholderId)
  );
  const [stakeholderResolving, setStakeholderResolving] = useState<boolean>(
    !propStakeholderId
  );

  useEffect(() => {
    if (propStakeholderId) {
      setResolvedStakeholderId(propStakeholderId);
      setStakeholderResolved(true);
      setStakeholderResolving(false);
      return;
    }
    if (!user?.email) {
      setStakeholderResolving(false);
      return;
    }
    let cancelled = false;
    setStakeholderResolving(true);
    SiteTaskService.resolveMyStakeholderId(user.email, user.id).then((id) => {
      if (cancelled) return;
      if (id) {
        setResolvedStakeholderId(id);
        setStakeholderResolved(true);
      } else {
        setStakeholderResolved(false);
      }
      setStakeholderResolving(false);
    });
    return () => {
      cancelled = true;
    };
  }, [propStakeholderId, user]);

  // ════════════════════════════════════════════════════════════════
  // SECTION 1 — Site Tasks (assignee)
  // ════════════════════════════════════════════════════════════════
  const [siteProjects, setSiteProjects] = useState<{ id: string; label: string }[]>(
    []
  );
  const [assigneeGroups, setAssigneeGroups] = useState<SiteProjectGroup[]>([]);
  const [siteTasksLoading, setSiteTasksLoading] = useState(false);
  const [zoneMap, setZoneMap] = useState<ZoneLookup>({});
  const [actingTaskId, setActingTaskId] = useState<string | null>(null);
  const [siteError, setSiteError] = useState<string | null>(null);

  // Per-row "raise progress" state (in_progress → pm_review)
  const [progressDraft, setProgressDraft] = useState<Record<string, string>>({});
  const [progressSavingId, setProgressSavingId] = useState<string | null>(null);

  // Load projects scope for cross-project site tasks
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('pm_projects_with_manager')
          .select('id, project_code, project_name')
          .order('project_code');
        if (cancelled || !data?.length) return;
        setSiteProjects(
          data.map((p: { id: string; project_code: string; project_name: string }) => ({
            id: p.id,
            label: `#${p.project_code} — ${p.project_name}`,
          }))
        );
      } catch (err) {
        logger.warn('Failed to load projects for site tasks', { detail: err });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadSiteTasks = useCallback(
    async (stkId: string, projects: { id: string; label: string }[]) => {
      if (!stkId || projects.length === 0) {
        setAssigneeGroups([]);
        setZoneMap({});
        return;
      }
      setSiteTasksLoading(true);
      setSiteError(null);
      try {
        const groups = await Promise.all(
          projects.map(async (p) => {
            const [tasks, zones] = await Promise.all([
              SiteTaskService.getTasksForAssignee(p.id, stkId),
              SiteTaskService.getZones(p.id),
            ]);
            return { projectId: p.id, label: p.label, tasks, zones };
          })
        );
        const flatGroups: SiteProjectGroup[] = [];
        const zMap: ZoneLookup = {};
        for (const g of groups) {
          for (const z of g.zones) {
            if (z?.id) zMap[z.id] = z.name_ar;
          }
          if (g.tasks.length > 0) {
            flatGroups.push({
              projectId: g.projectId,
              label: g.label,
              tasks: g.tasks,
            });
          }
        }
        setAssigneeGroups(flatGroups);
        setZoneMap(zMap);
      } catch (e) {
        setSiteError((e as Error).message || 'فشل تحميل مهام الموقع');
      } finally {
        setSiteTasksLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (resolvedStakeholderId && siteProjects.length > 0) {
      loadSiteTasks(resolvedStakeholderId, siteProjects);
    }
  }, [resolvedStakeholderId, siteProjects, loadSiteTasks]);

  const handleSiteTransition = useCallback(
    async (task: SiteTask, target: SiteTaskStatus, note?: string) => {
      setActingTaskId(task.id);
      setSiteError(null);
      try {
        await SiteTaskService.transitionTaskState({
          taskId: task.id,
          toState: target,
          reason: note,
        });
        await loadSiteTasks(resolvedStakeholderId, siteProjects);
      } catch (e) {
        setSiteError((e as Error).message || 'فشل تحديث حالة المهمة');
      } finally {
        setActingTaskId(null);
      }
    },
    [resolvedStakeholderId, siteProjects, loadSiteTasks]
  );

  // Progress is server-derived only (PRD §5.2) — no manual override allowed
  const handleSaveProgress = useCallback(
    async (_task?: SiteTask) => {
      // Intentionally no-op: progress_pct is calculated server-side
      // from verified_qty / planned_qty in rpc_site_task_transition
    },
    []
  );

  const totalAssigneeTasks = useMemo(
    () => assigneeGroups.reduce((sum, g) => sum + g.tasks.length, 0),
    [assigneeGroups]
  );

  // ── Personal Tasks Workbench States ──
  type WorkbenchTab = 'all' | 'today' | 'overdue' | 'upcoming' | 'review_done';
  const [workbenchTab, setWorkbenchTab] = useState<WorkbenchTab>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [siteSearchQuery, setSiteSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'workbench' | 'table'>('workbench');
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  // Flatten tasks across all projects with projectLabel for personal workbench
  interface FlatTask extends SiteTask {
    projectLabel: string;
  }
  const allAssignedTasks: FlatTask[] = useMemo(() => {
    return assigneeGroups.flatMap((g) =>
      g.tasks.map((t) => ({
        ...t,
        projectLabel: g.label,
      }))
    );
  }, [assigneeGroups]);

  // Open tasks for date urgency bucketing (approved/done/cancelled don't show as overdue)
  const openAssignedTasks = useMemo(() => {
    return allAssignedTasks.filter(
      (t) => t.status !== 'approved' && t.status !== 'done' && t.status !== 'cancelled'
    );
  }, [allAssignedTasks]);

  const dateBuckets = useMemo(() => {
    return groupSiteTasksByDate(openAssignedTasks);
  }, [openAssignedTasks]);

  const todayCount = dateBuckets.today.length;
  const overdueCount = dateBuckets.overdue.length;
  const upcomingCount = dateBuckets.tomorrow.length + dateBuckets.later.length;
  const reviewDoneCount = useMemo(() => {
    return allAssignedTasks.filter((t) =>
      ['pm_review', 'qc_pending', 'approved', 'done'].includes(t.status)
    ).length;
  }, [allAssignedTasks]);

  // Filtered workbench tasks based on tab, priority, and search
  const filteredWorkbenchTasks = useMemo(() => {
    let pool: FlatTask[] = [];
    if (workbenchTab === 'today') {
      pool = dateBuckets.today;
    } else if (workbenchTab === 'overdue') {
      pool = dateBuckets.overdue;
    } else if (workbenchTab === 'upcoming') {
      pool = [...dateBuckets.tomorrow, ...dateBuckets.later];
    } else if (workbenchTab === 'review_done') {
      pool = allAssignedTasks.filter((t) =>
        ['pm_review', 'qc_pending', 'approved', 'done'].includes(t.status)
      );
    } else {
      pool = allAssignedTasks;
    }

    return pool.filter((t) => {
      if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;
      if (siteSearchQuery.trim()) {
        const q = siteSearchQuery.toLowerCase();
        const matchTitle = (t.title_ar || '').toLowerCase().includes(q);
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        const matchPrj = (t.projectLabel || '').toLowerCase().includes(q);
        const zoneName = (t.zone_id && zoneMap[t.zone_id]) || '';
        const matchZone = zoneName.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchPrj && !matchZone) return false;
      }
      return true;
    });
  }, [
    workbenchTab,
    dateBuckets,
    allAssignedTasks,
    selectedPriority,
    siteSearchQuery,
    zoneMap,
  ]);

  // Checkbox toggle handler
  const handleToggleCheckbox = useCallback(
    async (task: SiteTask) => {
      if (actingTaskId === task.id) return;
      if (task.status === 'pending') {
        await handleSiteTransition(task, 'in_progress');
      } else if (task.status === 'in_progress') {
        await handleSiteTransition(task, 'pm_review');
      } else if (task.status === 'rejected') {
        await handleSiteTransition(task, 'in_progress');
      }
    },
    [actingTaskId, handleSiteTransition]
  );

  // ════════════════════════════════════════════════════════════════
  // SECTION 2 — QC Receivables
  // ════════════════════════════════════════════════════════════════
  const [qcGroups, setQcGroups] = useState<SiteProjectGroup[]>([]);
  const [qcLoading, setQcLoading] = useState(false);
  const [qcError, setQcError] = useState<string | null>(null);

  // Reject modal state
  const [rejectTask, setRejectTask] = useState<SiteTask | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const loadQcReceivables = useCallback(
    async (stkId: string, projects: { id: string; label: string }[]) => {
      if (!stkId || projects.length === 0) {
        setQcGroups([]);
        return;
      }
      setQcLoading(true);
      setQcError(null);
      try {
        const groups = await Promise.all(
          projects.map(async (p) => {
            const tasks = await SiteTaskService.getQcReceivables(p.id, stkId);
            return { projectId: p.id, label: p.label, tasks };
          })
        );
        setQcGroups(
          groups
            .filter((g) => g.tasks.length > 0)
            .map((g) => ({
              projectId: g.projectId,
              label: g.label,
              tasks: g.tasks,
            }))
        );
      } catch (e) {
        setQcError((e as Error).message || 'فشل تحميل استلامات QC');
      } finally {
        setQcLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (isQc && resolvedStakeholderId && siteProjects.length > 0) {
      loadQcReceivables(resolvedStakeholderId, siteProjects);
    }
  }, [isQc, resolvedStakeholderId, siteProjects, loadQcReceivables]);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === '1') {
        e.preventDefault();
        setWorkbenchTab('all');
      } else if (e.key === '2') {
        e.preventDefault();
        setWorkbenchTab('today');
      } else if (e.key === '3') {
        e.preventDefault();
        setWorkbenchTab('overdue');
      } else if (e.key === '4') {
        e.preventDefault();
        setWorkbenchTab('upcoming');
      } else if (e.key === '5') {
        e.preventDefault();
        setWorkbenchTab('review_done');
      } else if (e.key === 'v' || e.key === 'V' || e.key === 'ر') {
        e.preventDefault();
        setViewMode((prev) => (prev === 'workbench' ? 'table' : 'workbench'));
      } else if (e.key === 'r' || e.key === 'R' || e.key === 'ق') {
        e.preventDefault();
        if (resolvedStakeholderId) {
          loadSiteTasks(resolvedStakeholderId, siteProjects);
          if (isQc) loadQcReceivables(resolvedStakeholderId, siteProjects);
        }
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      } else if (e.key === 'Escape') {
        setShowShortcutsModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resolvedStakeholderId, siteProjects, isQc, loadSiteTasks, loadQcReceivables]);

  const handleApproveQc = useCallback(
    async (task: SiteTask) => {
      await handleSiteTransition(task, 'approved');
      await loadQcReceivables(resolvedStakeholderId, siteProjects);
    },
    [handleSiteTransition, resolvedStakeholderId, siteProjects, loadQcReceivables]
  );

  const openRejectModal = useCallback((task: SiteTask) => {
    setRejectTask(task);
    setRejectNote('');
  }, []);

  const handleSubmitQcReject = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!rejectTask) return;
      const note = rejectNote.trim();
      if (note.length < 3) return;
      await handleSiteTransition(rejectTask, 'rejected', note);
      await loadQcReceivables(resolvedStakeholderId, siteProjects);
      setRejectTask(null);
      setRejectNote('');
    },
    [rejectTask, rejectNote, handleSiteTransition, resolvedStakeholderId, siteProjects, loadQcReceivables]
  );

  const totalQcTasks = useMemo(
    () => qcGroups.reduce((sum, g) => sum + g.tasks.length, 0),
    [qcGroups]
  );

  // ════════════════════════════════════════════════════════════════
  // SECTION 3 — Deliverables (unchanged behavior, just relabelled)
  // ════════════════════════════════════════════════════════════════
  const [stakeholders, setStakeholders] = useState<StakeholderFull[]>([]);
  const [selectedStakeholderId, setSelectedStakeholderId] = useState<string>(
    propStakeholderId || ''
  );
  const [items, setItems] = useState<DeliverableItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modals
  const [reviewItem, setReviewItem] = useState<DeliverableItem | null>(null);

  // Update Rev Modal
  const [revModalItem, setRevModalItem] = useState<DeliverableItem | null>(null);
  const [revNote, setRevNote] = useState('');
  const [updatingRev, setUpdatingRev] = useState(false);

  // Log Delay Modal
  const [delayModalItem, setDelayModalItem] = useState<DeliverableItem | null>(null);
  const [delayReason, setDelayReason] = useState('');
  const [loggingDelay, setLoggingDelay] = useState(false);

  // Keep the deliverables stakeholder picker in sync with the shared resolved id
  // unless the user has manually chosen a different engineer from the dropdown.
  const [deliverablesPickerTouched, setDeliverablesPickerTouched] =
    useState<boolean>(Boolean(propStakeholderId));
  useEffect(() => {
    if (!deliverablesPickerTouched && resolvedStakeholderId) {
      setSelectedStakeholderId(resolvedStakeholderId);
    }
  }, [resolvedStakeholderId, deliverablesPickerTouched]);

  // 1. Fetch Stakeholders
  useEffect(() => {
    ProjectService.getStakeholdersDirectory()
      .then((stks) => {
        setStakeholders(stks);
      })
      .catch((err) => logger.error('Failed to load stakeholders', { detail: err }));
  }, []);

  // 2. Fetch Tasks for selected stakeholder
  const fetchTasks = useCallback(async (stkId: string) => {
    if (!stkId) return;
    setLoading(true);
    try {
      const data = await DeliverablesService.getMyDeliverables(stkId);
      setItems(data);
    } catch (err) {
      logger.error('Failed to load my tasks', { detail: err });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStakeholderId) {
      fetchTasks(selectedStakeholderId);
    }
  }, [selectedStakeholderId, fetchTasks]);

  const selectedStakeholder = useMemo(() => {
    return stakeholders.find((s) => s.id === selectedStakeholderId);
  }, [stakeholders, selectedStakeholderId]);

  // Quick Action Handlers
  const handleStartWork = useCallback(
    async (itemId: string) => {
      const updated = await DeliverablesService.startWorkOnItem(
        itemId,
        selectedStakeholderId
      );
      if (updated) {
        setItems((prev) => prev.map((i) => (i.id === itemId ? updated : i)));
      }
    },
    [selectedStakeholderId]
  );

  const handleCompleteWork = useCallback(async (itemId: string) => {
    const updated = await DeliverablesService.completeWorkOnItem(itemId);
    if (updated) {
      setItems((prev) => prev.map((i) => (i.id === itemId ? updated : i)));
    }
  }, []);

  const handleSaveRevIncrement = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!revModalItem) return;

      setUpdatingRev(true);
      try {
        const newRev = (revModalItem.current_rev || 0) + 1;
        const history = revModalItem.rev_history || [];
        const updatedHistory = [
          ...history,
          {
            rev: newRev,
            date: new Date().toISOString(),
            by: selectedStakeholder?.name_ar || 'مهندس المكتب الفني',
            notes: revNote || 'ترقية الإصدار بواسطة المهندس المسؤول',
          },
        ];

        const payload: Partial<DeliverableItem> = {
          ...revModalItem,
          current_rev: newRev,
          rev_history: updatedHistory,
        };

        const result = await DeliverablesService.saveDeliverableItem(payload);
        if (result) {
          setItems((prev) => prev.map((i) => (i.id === result.id ? result : i)));
          setRevModalItem(null);
          setRevNote('');
        }
      } catch (err) {
        logger.error('Failed to bump rev', { detail: err });
      } finally {
        setUpdatingRev(false);
      }
    },
    [revModalItem, revNote, selectedStakeholder]
  );

  const handleSaveDelay = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!delayModalItem || !delayReason.trim()) return;

      setLoggingDelay(true);
      try {
        const payload: Partial<DeliverableItem> = {
          ...delayModalItem,
          blocked_reason: delayReason.trim(),
          blocked_since: new Date().toISOString(),
          status: 'blocked',
        };
        const result = await DeliverablesService.saveDeliverableItem(payload);
        if (result) {
          setItems((prev) => prev.map((i) => (i.id === result.id ? result : i)));
          setDelayModalItem(null);
          setDelayReason('');
        }
      } catch (err) {
        logger.error('Failed to log delay', { detail: err });
      } finally {
        setLoggingDelay(false);
      }
    },
    [delayModalItem, delayReason]
  );

  // Filtered tasks
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
      if (selectedType !== 'all' && item.item_type !== selectedType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSheet = (item.sheet_number || '').toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        if (!matchSheet && !matchDesc) return false;
      }
      return true;
    });
  }, [items, selectedStatus, selectedType, searchQuery]);

  // Counts
  const inProgressCount = items.filter((i) => i.status === 'in_progress').length;
  const readyCount = items.filter((i) => i.status === 'ready_to_return').length;
  const codeCCount = items.filter((i) => i.consultant_status === 'C').length;

  const showLoadingShell =
    stakeholderResolving && !stakeholderResolved && !resolvedStakeholderId;

  return (
    <div className="space-y-6">
      {/* Top Header & Engineer Switcher */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20">
            <ListTodo className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              مهامي الهندسية (My Technical Tasks)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isQc
                ? 'مهام الموقع، استلامات QC، والمستخلصات المسندة إليك'
                : canSeeDeliverables
                ? 'مهام الموقع وتسليمات المكتب الفني المسندة إليك'
                : 'مهام الموقع والتنفيذ الميداني المسندة إليك'}
            </p>
          </div>
        </div>

        {/* Engineer Picker & Quick Action Tools */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Keyboard Shortcuts Trigger Button */}
          <button
            type="button"
            onClick={() => setShowShortcutsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
            title="عرض اختصارات لوحة المفاتيح (?)"
          >
            <Keyboard className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">اختصارات</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono shadow-2xs text-slate-700 dark:text-slate-300">
              ?
            </kbd>
          </button>

          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <select
              value={selectedStakeholderId}
              onChange={(e) => {
                setDeliverablesPickerTouched(true);
                setSelectedStakeholderId(e.target.value);
              }}
              className="px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="" disabled>
                — اختر المهندس —
              </option>
              {stakeholders.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name_ar} ({s.role || 'مهندس'})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              if (selectedStakeholderId) fetchTasks(selectedStakeholderId);
              if (resolvedStakeholderId) {
                loadSiteTasks(resolvedStakeholderId, siteProjects);
                if (isQc) loadQcReceivables(resolvedStakeholderId, siteProjects);
              }
            }}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
            title="تحديث المهام (R)"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-500' : ''}`}
            />
          </button>
        </div>
      </div>

      {(siteError || qcError) && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{siteError || qcError}</span>
        </div>
      )}

      {showLoadingShell && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          جاري تحديد هوية المهندس من البريد الإلكتروني...
        </div>
      )}

      {!stakeholderResolving && !stakeholderResolved && !propStakeholderId && (
        <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          تعذّر تحديد هوية المهندس تلقائياً — تأكد من ربط بريدك الإلكتروني بملف
          «أصحاب المصلحة».
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1 — مساحة مهام الموقع (Site Tasks Workbench)
          ═══════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 shadow-2xs">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  مساحة مهام الموقع (Site Tasks Workbench)
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {totalAssigneeTasks}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                مهامك الميدانية وجداول الاستلام والتنفيذ موزعة بحسب الأولوية والجدول الزمني
              </p>
            </div>
          </div>

          {/* View Mode Toggle: Interactive Cards vs Detailed Table */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('workbench')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === 'workbench'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="عرض قائمة البطاقات التفاعلية (V)"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>بطاقات المهام</span>
              <kbd className="hidden md:inline px-1 text-[9px] font-mono text-slate-400 dark:text-slate-500">V</kbd>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="عرض الجدول التفصيلي (V)"
            >
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>جدول المشاريع</span>
            </button>
          </div>
        </div>

        {/* ── KPI Mini Metric Cards (Due Today, Overdue, Upcoming, In Review/Done) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Due Today */}
          <button
            type="button"
            onClick={() => setWorkbenchTab('today')}
            className={`p-4 rounded-3xl text-start transition-all duration-200 border ${
              workbenchTab === 'today'
                ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 shadow-sm ring-2 ring-amber-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-900/40 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-amber-700 dark:text-amber-300">
                مستحقة اليوم
              </div>
              <div className="p-2 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
                <CalendarClock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
              {todayCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span>{todayCount > 0 ? 'تتطلب اهتمامك الميداني اليوم' : 'لا توجد مهام مستحقة لليوم'}</span>
            </div>
          </button>

          {/* 2. Overdue */}
          <button
            type="button"
            onClick={() => setWorkbenchTab('overdue')}
            className={`p-4 rounded-3xl text-start transition-all duration-200 border ${
              workbenchTab === 'overdue'
                ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 shadow-sm ring-2 ring-rose-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900/40 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                <span>متأخرة</span>
                {overdueCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </div>
              <div className="p-2 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
              {overdueCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              <span>{overdueCount > 0 ? 'تجاوزت التاريخ المخطط' : 'سجل منضبط بالكامل'}</span>
            </div>
          </button>

          {/* 3. Upcoming */}
          <button
            type="button"
            onClick={() => setWorkbenchTab('upcoming')}
            className={`p-4 rounded-3xl text-start transition-all duration-200 border ${
              workbenchTab === 'upcoming'
                ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 shadow-sm ring-2 ring-blue-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/40 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-blue-700 dark:text-blue-300">
                مهام قادمة
              </div>
              <div className="p-2 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
              {upcomingCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              <span>غداً والفترات اللاحقة</span>
            </div>
          </button>

          {/* 4. In Review & Done */}
          <button
            type="button"
            onClick={() => setWorkbenchTab('review_done')}
            className={`p-4 rounded-3xl text-start transition-all duration-200 border ${
              workbenchTab === 'review_done'
                ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800 shadow-sm ring-2 ring-teal-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-200 dark:hover:border-teal-900/40 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-teal-700 dark:text-teal-300">
                للاعتماد / منجزة
              </div>
              <div className="p-2 rounded-2xl bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
              {reviewDoneCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              <span>بانتظار الاعتماد أو مكتملة</span>
            </div>
          </button>
        </div>

        {/* ── Filter Bar (Tabs, Search, Priority) ── */}
        <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Urgency Filter Tabs with Keyboard badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setWorkbenchTab('all')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition ${
                workbenchTab === 'all'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>الكل</span>
              <span className="font-mono text-[10px] opacity-70">({allAssignedTasks.length})</span>
              <kbd className="hidden lg:inline text-[9px] opacity-60 font-mono">1</kbd>
            </button>

            <button
              type="button"
              onClick={() => setWorkbenchTab('today')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition ${
                workbenchTab === 'today'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <CalendarClock className="w-3.5 h-3.5" />
              <span>مستحقة اليوم</span>
              <span className="font-mono text-[10px] opacity-70">({todayCount})</span>
              <kbd className="hidden lg:inline text-[9px] opacity-60 font-mono">2</kbd>
            </button>

            <button
              type="button"
              onClick={() => setWorkbenchTab('overdue')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition ${
                workbenchTab === 'overdue'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>متأخرة</span>
              <span className="font-mono text-[10px] opacity-70">({overdueCount})</span>
              <kbd className="hidden lg:inline text-[9px] opacity-60 font-mono">3</kbd>
            </button>

            <button
              type="button"
              onClick={() => setWorkbenchTab('upcoming')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition ${
                workbenchTab === 'upcoming'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>قادمة</span>
              <span className="font-mono text-[10px] opacity-70">({upcomingCount})</span>
              <kbd className="hidden lg:inline text-[9px] opacity-60 font-mono">4</kbd>
            </button>

            <button
              type="button"
              onClick={() => setWorkbenchTab('review_done')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition ${
                workbenchTab === 'review_done'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>المراجعة والإنجاز</span>
              <span className="font-mono text-[10px] opacity-70">({reviewDoneCount})</span>
              <kbd className="hidden lg:inline text-[9px] opacity-60 font-mono">5</kbd>
            </button>
          </div>

          {/* Search & Priority Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 sm:w-56 min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="بحث في مهام الموقع أو المنطقة..."
                value={siteSearchQuery}
                onChange={(e) => setSiteSearchQuery(e.target.value)}
                className="w-full ps-9 pe-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                aria-label="تصفية حسب الأولوية"
                className="px-2.5 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">كل الأولويات</option>
                <option value="urgent">عاجلة (Urgent)</option>
                <option value="high">مرتفعة (High)</option>
                <option value="normal">عادية (Normal)</option>
                <option value="low">منخفضة (Low)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Main Content Container ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          {siteTasksLoading ? (
            <SkeletonWorkbench />
          ) : filteredWorkbenchTasks.length === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500 p-6 space-y-2">
              {workbenchTab === 'today' ? (
                <>
                  <TodayEmptyIllustration />
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">
                    أحسنت! لا توجد مهام مستحقة لتاريخ اليوم
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    أنجزت جميع المهام المجدولة لليوم، أو لم تتم جدولة مهام إضافية لتاريخ اليوم.
                  </div>
                </>
              ) : workbenchTab === 'overdue' ? (
                <>
                  <OverdueEmptyIllustration />
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">
                    سجل المهام منضبط بالكامل
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    لا توجد أي مهام متأخرة عن موعدها المخطط، مؤشرات الأداء تسير وفق المخطط.
                  </div>
                </>
              ) : workbenchTab === 'upcoming' ? (
                <>
                  <UpcomingEmptyIllustration />
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">
                    لا توجد مهام قادمة مسندة
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    لم يتم إدراج مهام جديدة للفترات القادمة حالياً.
                  </div>
                </>
              ) : siteSearchQuery.trim() || selectedPriority !== 'all' ? (
                <>
                  <SearchEmptyIllustration />
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">
                    لا توجد نتائج تطابق خيارات البحث والفلترة
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    جرّب تغيير كلمات البحث أو إعادة تعيين فلتر الأولويات لعرض المهام.
                  </div>
                </>
              ) : (
                <>
                  <GeneralEmptyIllustration />
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">
                    لا توجد مهام موقع مفتوحة مسندة إليك
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    لا توجد مهام بحاجة لإجراء منك حالياً.
                  </div>
                </>
              )}
            </div>
          ) : viewMode === 'workbench' ? (
            /* ── Checklist / Workbench Card View ── */
            <div
              role="list"
              aria-label="قائمة مهام العمل الميداني"
              className="p-4 sm:p-5 space-y-3 divide-y divide-transparent"
            >
              {filteredWorkbenchTasks.map((task) => {
                const zoneName = (task.zone_id && zoneMap[task.zone_id]) || 'المنطقة العامة';
                const draftVal = progressDraft[task.id];
                return (
                  <div
                    key={task.id}
                    role="listitem"
                    className={`p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700/60 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      task.priority === 'urgent'
                        ? 'border-s-4 border-s-rose-500'
                        : task.priority === 'high'
                        ? 'border-s-4 border-s-amber-500'
                        : task.priority === 'normal'
                        ? 'border-s-4 border-s-blue-500'
                        : 'border-s-4 border-s-slate-300 dark:border-s-slate-700'
                    }`}
                  >
                    {/* Start in RTL: Checkbox + Title & Details */}
                    <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                      <TaskCheckbox
                        task={task}
                        isActing={actingTaskId === task.id}
                        onToggle={handleToggleCheckbox}
                      />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`text-sm font-bold text-slate-900 dark:text-white line-clamp-1 ${
                              task.status === 'approved' || task.status === 'done'
                                ? 'line-through text-slate-500 dark:text-slate-400'
                                : ''
                            }`}
                          >
                            {task.title_ar}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              SITE_STATUS_CLS[task.status] || SITE_STATUS_CLS.pending
                            }`}
                          >
                            {SITE_STATUS_LABEL[task.status] || task.status}
                          </span>
                        </div>

                        {task.rejection_reason && (
                          <div className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 rounded-xl w-fit">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>سبب الرفض: {task.rejection_reason}</span>
                          </div>
                        )}

                        {/* Meta tags: Project, Zone, Due Date */}
                        <div className="flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                            <span className="line-clamp-1 max-w-[160px]">{task.projectLabel}</span>
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                            <span>{zoneName}</span>
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <DueDateIndicator plannedDate={task.planned_date} />
                        </div>
                      </div>
                    </div>

                    {/* End in RTL: Priority + Progress bar + Actions */}
                    <div className="flex items-center gap-3 sm:gap-4 justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                      <PriorityIndicator priority={task.priority} />

                      {/* Progress bar */}
                      <div className="hidden sm:inline-flex items-center gap-1.5 min-w-[6.5rem]">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(100, task.progress_pct || 0)
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 w-8 text-start">
                          {Math.max(0, Math.min(100, task.progress_pct || 0))}%
                        </span>
                      </div>

                      {/* Quick Action buttons */}
                      <div className="flex items-center gap-1.5">
                        {task.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleSiteTransition(task, 'in_progress')}
                            disabled={actingTaskId === task.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition shadow-2xs"
                            title="بدء تنفيذ المهمة"
                          >
                            {actingTaskId === task.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                            <span>بدء</span>
                          </button>
                        )}

                        {task.status === 'in_progress' && (
                          <div className="inline-flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              aria-label={`نسبة إنجاز مهمة ${task.title_ar}`}
                              value={draftVal ?? String(task.progress_pct ?? 0)}
                              onChange={(e) =>
                                setProgressDraft((prev) => ({
                                  ...prev,
                                  [task.id]: e.target.value,
                                }))
                              }
                              className="w-14 px-1.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-center text-slate-900 dark:text-slate-100"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveProgress(task)}
                              disabled={
                                progressSavingId === task.id || draftVal === undefined
                              }
                              title="حفظ نسبة الإنجاز"
                              className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                            >
                              {progressSavingId === task.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Save className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSiteTransition(task, 'pm_review')}
                              disabled={actingTaskId === task.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white disabled:opacity-50 transition shadow-2xs"
                              title="رفع للاعتماد من مدير المشروع"
                            >
                              {actingTaskId === task.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <UploadCloud className="w-3.5 h-3.5" />
                              )}
                              <span>رفع للاعتماد</span>
                            </button>
                          </div>
                        )}

                        {task.status === 'rejected' && (
                          <button
                            type="button"
                            onClick={() => handleSiteTransition(task, 'in_progress')}
                            disabled={actingTaskId === task.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 transition shadow-2xs"
                            title="إعادة فتح المهمة والعمل عليها"
                          >
                            {actingTaskId === task.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5" />
                            )}
                            <span>إعادة العمل</span>
                          </button>
                        )}

                        {(task.status === 'pm_review' || task.status === 'qc_pending') && (
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 italic px-2 py-1 rounded-xl bg-slate-50 dark:bg-slate-800">
                            بانتظار الاعتماد
                          </span>
                        )}

                        {(task.status === 'approved' || task.status === 'done') && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>معتمدة</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── Detailed Table View Grouped by Project ── */
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {assigneeGroups.map((g) => {
                const groupTasks = g.tasks.filter((t) => {
                  if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;
                  if (workbenchTab === 'today') return isDueDateToday(t.planned_date);
                  if (workbenchTab === 'overdue') return isOverdue(t.planned_date) && t.status !== 'approved' && t.status !== 'done';
                  if (workbenchTab === 'upcoming') return !isDueDateToday(t.planned_date) && !isOverdue(t.planned_date);
                  if (workbenchTab === 'review_done') return ['pm_review', 'qc_pending', 'approved', 'done'].includes(t.status);
                  return true;
                });
                if (groupTasks.length === 0) return null;

                return (
                  <div key={g.projectId}>
                    <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{g.label}</span>
                      <span className="font-mono text-slate-400 dark:text-slate-500">· {groupTasks.length}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-start text-xs border-collapse">
                        <thead className="bg-slate-50/40 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 font-bold">
                          <tr>
                            <th className="p-3 text-start w-10">#</th>
                            <th className="p-3 text-start">العنوان</th>
                            <th className="p-3 text-start">المنطقة</th>
                            <th className="p-3 text-start">التاريخ المخطط</th>
                            <th className="p-3 text-center">الأولوية</th>
                            <th className="p-3 text-center">نسبة الإنجاز</th>
                            <th className="p-3 text-center">الحالة</th>
                            <th className="p-3 text-center">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                          {groupTasks.map((task) => {
                            const zoneName = (task.zone_id && zoneMap[task.zone_id]) || '—';
                            const draftVal = progressDraft[task.id];
                            return (
                              <tr
                                key={task.id}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                              >
                                <td className="p-3 text-center">
                                  <TaskCheckbox
                                    task={task}
                                    isActing={actingTaskId === task.id}
                                    onToggle={handleToggleCheckbox}
                                  />
                                </td>
                                <td className="p-3 max-w-xs">
                                  <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                                    {task.title_ar}
                                  </div>
                                  {task.rejection_reason && (
                                    <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5 line-clamp-1">
                                      سبب الرفض: {task.rejection_reason}
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                  {zoneName}
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                  <DueDateIndicator plannedDate={task.planned_date} />
                                </td>
                                <td className="p-3 text-center">
                                  <PriorityIndicator priority={task.priority} />
                                </td>
                                <td className="p-3 text-center whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1.5 min-w-[7rem]">
                                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                      <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                        style={{
                                          width: `${Math.max(
                                            0,
                                            Math.min(100, task.progress_pct || 0)
                                          )}%`,
                                        }}
                                      />
                                    </div>
                                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 w-8 text-start">
                                      {Math.max(0, Math.min(100, task.progress_pct || 0))}%
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      SITE_STATUS_CLS[task.status] || SITE_STATUS_CLS.pending
                                    }`}
                                  >
                                    {SITE_STATUS_LABEL[task.status] || task.status}
                                  </span>
                                </td>
                                <td className="p-3 text-center whitespace-nowrap">
                                  {task.status === 'pending' && (
                                    <button
                                      type="button"
                                      onClick={() => handleSiteTransition(task, 'in_progress')}
                                      disabled={actingTaskId === task.id}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition"
                                    >
                                      {actingTaskId === task.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Play className="w-3 h-3" />
                                      )}
                                      <span>بدء التنفيذ</span>
                                    </button>
                                  )}

                                  {task.status === 'in_progress' && (
                                    <div className="inline-flex items-center gap-1.5">
                                      <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        aria-label={`نسبة إنجاز مهمة ${task.title_ar}`}
                                        value={draftVal ?? String(task.progress_pct ?? 0)}
                                        onChange={(e) =>
                                          setProgressDraft((prev) => ({
                                            ...prev,
                                            [task.id]: e.target.value,
                                          }))
                                        }
                                        className="w-14 px-1.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-center text-slate-900 dark:text-slate-100"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSaveProgress(task)}
                                        disabled={
                                          progressSavingId === task.id || draftVal === undefined
                                        }
                                        title="حفظ نسبة الإنجاز"
                                        className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                                      >
                                        {progressSavingId === task.id ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Save className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSiteTransition(task, 'pm_review')}
                                        disabled={actingTaskId === task.id}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-teal-700 hover:bg-teal-800 text-white disabled:opacity-50 transition"
                                      >
                                        {actingTaskId === task.id ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <UploadCloud className="w-3.5 h-3.5" />
                                        )}
                                        <span>رفع للاعتماد</span>
                                      </button>
                                    </div>
                                  )}

                                  {task.status === 'rejected' && (
                                    <button
                                      type="button"
                                      onClick={() => handleSiteTransition(task, 'in_progress')}
                                      disabled={actingTaskId === task.id}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 transition"
                                    >
                                      {actingTaskId === task.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <RotateCcw className="w-3 h-3" />
                                      )}
                                      <span>إعادة العمل</span>
                                    </button>
                                  )}

                                  {(task.status === 'pm_review' ||
                                    task.status === 'qc_pending') && (
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                                      بانتظار مراجعة أخرى
                                    </span>
                                  )}

                                  {(task.status === 'approved' || task.status === 'done') && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>معتمدة</span>
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2 — استلامات QC (QC Roles Only)
          ═══════════════════════════════════════════════════════════ */}
      {isQc && (
        <>
        <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              استلامات QC
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {totalQcTasks}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          {qcLoading ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
              <span className="text-xs">جاري تحميل استلامات QC...</span>
            </div>
          ) : totalQcTasks === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 p-6 space-y-2">
              <QcEmptyIllustration />
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">
                لا توجد استلامات QC معلقة
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                جميع بنود الموقع خاضعة للرقابة ولا توجد أعمال بانتظار فحص واستلام الجودة حالياً.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {qcGroups.map((g) => (
                <div key={g.projectId}>
                  <div className="px-4 py-2 bg-slate-50/60 dark:bg-slate-800/40 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>{g.label}</span>
                    <span className="font-mono text-slate-400 dark:text-slate-500">· {g.tasks.length}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs border-collapse">
                      <thead className="bg-slate-50/40 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 font-bold">
                        <tr>
                          <th className="p-3 text-start">العنوان</th>
                          <th className="p-3 text-start">المنطقة</th>
                          <th className="p-3 text-start">تاريخ الاستلام</th>
                          <th className="p-3 text-center">الأولوية</th>
                          <th className="p-3 text-center">نسبة الإنجاز</th>
                          <th className="p-3 text-center">الحالة</th>
                          <th className="p-3 text-center">قرار QC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {g.tasks.map((task) => {
                          const zoneName =
                            (task.zone_id && zoneMap[task.zone_id]) || '—';
                          return (
                            <tr
                              key={task.id}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                            >
                              <td className="p-3 max-w-xs">
                                <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                                  {task.title_ar}
                                </div>
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {zoneName}
                              </td>
                              <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {formatDate(task.inspection_date || task.planned_date)}
                              </td>
                              <td className="p-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    SITE_PRIORITY_CLS[task.priority] ||
                                    SITE_PRIORITY_CLS.normal
                                  }`}
                                >
                                  {SITE_PRIORITY_LABEL[task.priority] || task.priority}
                                </span>
                              </td>
                              <td className="p-3 text-center whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5 min-w-[7rem]">
                                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                    <div
                                      className="h-full bg-emerald-500"
                                      style={{
                                        width: `${Math.max(
                                          0,
                                          Math.min(100, task.progress_pct || 0)
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 w-8 text-start">
                                    {Math.max(
                                      0,
                                      Math.min(100, task.progress_pct || 0)
                                    )}
                                    %
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    SITE_STATUS_CLS[task.status] ||
                                    SITE_STATUS_CLS.qc_pending
                                  }`}
                                >
                                  {SITE_STATUS_LABEL[task.status] || task.status}
                                </span>
                              </td>
                              <td className="p-3 text-center whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleApproveQc(task)}
                                    disabled={actingTaskId === task.id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition"
                                  >
                                    {actingTaskId === task.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Check className="w-3 h-3" />
                                    )}
                                    <span>اعتماد</span>
                                  </button>
                                  <button
                                    onClick={() => openRejectModal(task)}
                                    disabled={actingTaskId === task.id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 disabled:opacity-50 transition"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    <span>رفض</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* QC Reject Modal — requires reason note */}
      {rejectTask && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 dark:border-rose-950/40 bg-rose-50/50 dark:bg-rose-950/20">
              <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
                <XCircle className="w-5 h-5" />
                <h3 className="text-sm font-bold">رفض استلام QC</h3>
              </div>
              <button
                onClick={() => setRejectTask(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitQcReject} className="p-6 space-y-4">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                رفض استلام:{' '}
                <span className="font-bold text-slate-900 dark:text-white">
                  {rejectTask.title_ar}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  سبب الرفض <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="اكتب سبب الرفض (مثال: عدم مطابقة التنفيذ للمواصفات، أو نقص في المواد)..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  سبب الرفض إلزامي — لا يمكن المتابعة بدونه.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectTask(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={rejectNote.trim().length < 3 || actingTaskId === rejectTask.id}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {actingTaskId === rejectTask.id
                    ? 'جاري الرفض...'
                    : 'تأكيد الرفض'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3 — المستخلصات / التسليمات (TO / PM / Admin Only)
          ═══════════════════════════════════════════════════════════ */}
      {canSeeDeliverables && (
        <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
              <FileCode className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              المستخلصات / التسليمات
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {items.length}
            </span>
          </div>
        </div>

        {/* KPI Mini Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                إجمالي المهام المسندة
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                {items.length}
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                جاري العمل عليها
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                {inProgressCount}
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                جاهزة للإعادة للمكتب
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                {readyCount}
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                إعادة تقديم Code C
              </div>
              <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                {codeCCount}
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث برقم اللوحة أو الوصف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-10 pe-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <option value="all">كل الحالات (All Statuses)</option>
            <option value="pending">جديدة (Pending)</option>
            <option value="in_progress">قيد العمل (In Progress)</option>
            <option value="ready_to_return">جاهزة للإعادة (Ready)</option>
            <option value="blocked">معطلة (Blocked)</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <option value="all">كل الأنواع</option>
            <option value="drawing">لوحات رسم (Drawings)</option>
            <option value="material">عينات مواد (Materials)</option>
          </select>
        </div>

        {/* Tasks List Table */}
        <div className="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-20 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
              <span className="text-xs">جاري تحميل قائمة المهام...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500 p-6 space-y-2">
              <DeliverablesEmptyIllustration />
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">
                لا توجد مستخلصات أو تسليمات مسندة تطابق خيارات البحث
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                جميع اللوحات والمخططات وعينات المواد منجزة أو لا توجد بنود تطابق شروط الفلترة المحددة.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs border-collapse">
                <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                  <tr>
                    <th className="p-3.5 text-start">رقم اللوحة / البند</th>
                    <th className="p-3.5 text-start">الوصف</th>
                    <th className="p-3.5 text-center">الإصدار الحالي</th>
                    <th className="p-3.5 text-center">حالة الاستشاري</th>
                    <th className="p-3.5 text-center">حالة العمل</th>
                    <th className="p-3.5 text-center">إجراءات سريعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                    >
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {item.item_type === 'drawing' ? (
                            <FileCode className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <Layers className="w-4 h-4 text-amber-500 shrink-0" />
                          )}
                          <span>{item.sheet_number || 'بند عام'}</span>
                        </div>
                      </td>

                      <td className="p-3.5 max-w-sm">
                        <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                          {item.description}
                        </div>
                        {item.blocked_reason && (
                          <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>المانع: {item.blocked_reason}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          Rev {item.current_rev}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        {item.consultant_status === 'A' ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Code A
                          </span>
                        ) : item.consultant_status === 'B' ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                            Code B
                          </span>
                        ) : item.consultant_status === 'C' ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            Code C
                          </span>
                        ) : item.consultant_status === 'D' ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                            Code D
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">قيد المراجعة</span>
                        )}
                      </td>

                      <td className="p-3.5 text-center whitespace-nowrap">
                        {item.status === 'in_progress' ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
                            قيد العمل
                          </span>
                        ) : item.status === 'ready_to_return' ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            جاهزة للإعادة
                          </span>
                        ) : item.status === 'blocked' ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                            معطلة
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            مستلمة
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Start Work */}
                          {item.status !== 'in_progress' &&
                            item.status !== 'ready_to_return' && (
                              <button
                                onClick={() => handleStartWork(item.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 transition"
                                title="بدء العمل"
                              >
                                <Play className="w-3 h-3" />
                                <span>بدء</span>
                              </button>
                            )}

                          {/* Complete Work */}
                          {item.status === 'in_progress' && (
                            <button
                              onClick={() => handleCompleteWork(item.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs"
                              title="إنهاء العمل"
                            >
                              <Check className="w-3 h-3" />
                              <span>إتمام</span>
                            </button>
                          )}

                          {/* Bump Revision */}
                          <button
                            onClick={() => setRevModalItem(item)}
                            className="p-1.5 rounded-xl text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            title="ترقية رقم الإصدار (Rev+1)"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          {/* Log Delay */}
                          <button
                            onClick={() => setDelayModalItem(item)}
                            className="p-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="تسجيل مانع / عائق للوحة"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>

                          {/* Consultant Review */}
                          <button
                            onClick={() => setReviewItem(item)}
                            className="px-2 py-1 rounded-xl text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                          >
                            قرار الاستشاري
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Consultant Review Modal */}
        <ConsultantReviewModal
          isOpen={!!reviewItem}
          onClose={() => setReviewItem(null)}
          item={reviewItem}
          onSuccess={(updated) => {
            setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
            setReviewItem(null);
          }}
        />

        {/* Bump Revision Modal */}
        {revModalItem && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-2.5">
                  <RotateCcw className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    ترقية إصدار اللوحة (Rev{' '}
                    {(revModalItem.current_rev || 0) + 1})
                  </h3>
                </div>
                <button
                  onClick={() => setRevModalItem(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveRevIncrement} className="p-6 space-y-4">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  سيتم زيادة رقم الإصدار من{' '}
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    Rev {revModalItem.current_rev || 0}
                  </span>{' '}
                  إلى{' '}
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    Rev {(revModalItem.current_rev || 0) + 1}
                  </span>{' '}
                  وتوثيقها في السجل.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ملاحظات التعديل الجديد (اختياري)
                  </label>
                  <textarea
                    rows={3}
                    value={revNote}
                    onChange={(e) => setRevNote(e.target.value)}
                    placeholder="مثال: تعديل مسارات شبكة الصرف وتحديث القطاعات الإنشائية..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRevModalItem(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={updatingRev}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-700/20"
                  >
                    {updatingRev ? 'جاري التحديث...' : 'تأكيد الترقية'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Log Delay Modal */}
        {delayModalItem && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 dark:border-rose-950/40 bg-rose-50/50 dark:bg-rose-950/20">
                <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="text-sm font-bold">تسجيل مانع أو تعطل للوحة</h3>
                </div>
                <button
                  onClick={() => setDelayModalItem(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDelay} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    سبب المانع أو التعطل <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={delayReason}
                    onChange={(e) => setDelayReason(e.target.value)}
                    placeholder="اكتب تفاصيل المانع (مثال: انتظار رد الاستشاري بخصوص أبعاد عمود الخرسانة)..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDelayModalItem(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loggingDelay || !delayReason.trim()}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
                  >
                    {loggingDelay ? 'جاري التسجيل...' : 'تأكيد تسجيل المانع'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          KEYBOARD SHORTCUTS MODAL
          ═══════════════════════════════════════════════════════════ */}
      {showShortcutsModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-modal-title"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowShortcutsModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
                <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <Keyboard className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="shortcuts-modal-title" className="text-sm font-bold">
                    اختصارات لوحة المفاتيح
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    تنقل أسرع بين المهام والإجراءات الميدانية
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-normal">
                  التنقل بين التبويبات
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">عرض كل المهام</span>
                    <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] shadow-2xs">1</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">مهام مستحقة اليوم</span>
                    <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] shadow-2xs">2</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">المهام المتأخرة</span>
                    <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] shadow-2xs">3</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">المهام القادمة</span>
                    <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] shadow-2xs">4</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 sm:col-span-2">
                    <span className="text-slate-700 dark:text-slate-300">المراجعة والإنجاز</span>
                    <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] shadow-2xs">5</kbd>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-normal">
                  الإجراءات وعرض المهام
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">تبديل نمط العرض (بطاقات / جدول)</span>
                    <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] shadow-2xs">V</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">تحديث البيانات</span>
                    <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] shadow-2xs">R</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">فتح / إغلاق الاختصارات</span>
                    <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] shadow-2xs">?</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">إغلاق النوافذ المنبثقة</span>
                    <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] shadow-2xs">Esc</kbd>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
