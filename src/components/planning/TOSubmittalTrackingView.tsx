'use client';

import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileCheck,
  ChevronRight,
  User,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Deliverable, DeliverableItem, ConsultantApprovalCode } from '@/types/planning';

export interface TOSubmittalTrackingViewProps {
  projectId?: string;
  deliverables: Deliverable[];
  isLoading?: boolean;
  onNavigateToApprovals?: () => void;
  onNavigateToAssignments?: () => void;
  initialCodeFilter?: string;
}

export interface EnrichedSubmittalItem extends DeliverableItem {
  deliverable_ref: string;
  deliverable_title_ar: string;
  deliverable_title_en?: string;
  deliverable_kind: string;
  project_id: string;
}

export const TOSubmittalTrackingView: React.FC<TOSubmittalTrackingViewProps> = ({
  projectId,
  deliverables,
  isLoading = false,
  onNavigateToApprovals,
  onNavigateToAssignments,
  initialCodeFilter = 'all',
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [kindFilter, setKindFilter] = useState<'all' | 'E1' | 'E2'>('all');
  const [codeFilter, setCodeFilter] = useState<string>(initialCodeFilter);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Flatten all submittal items across deliverables
  const allItems: EnrichedSubmittalItem[] = useMemo(() => {
    return deliverables.flatMap((d) =>
      (d.items || []).map((item) => ({
        ...item,
        deliverable_ref: d.ref_code,
        deliverable_title_ar: d.title_ar,
        deliverable_title_en: d.title_en,
        deliverable_kind: d.kind,
        project_id: d.project_id,
      }))
    );
  }, [deliverables]);

  // Status and Code counts for filter pills
  const counts = useMemo(() => {
    const codeA = allItems.filter((i) => i.consultant_status === 'A').length;
    const codeB = allItems.filter((i) => i.consultant_status === 'B').length;
    const codeC = allItems.filter((i) => i.consultant_status === 'C').length;
    const codeD = allItems.filter((i) => i.consultant_status === 'D').length;
    const pending = allItems.filter(
      (i) => !i.consultant_status || i.consultant_status === 'pending'
    ).length;

    const e1 = allItems.filter((i) => i.deliverable_kind === 'E1').length;
    const e2 = allItems.filter((i) => i.deliverable_kind === 'E2').length;

    const inProgress = allItems.filter(
      (i) => i.status === 'in_progress' || i.status === 'received'
    ).length;
    const blocked = allItems.filter(
      (i) => i.status === 'blocked' || Boolean(i.blocked_reason)
    ).length;
    const approved = allItems.filter(
      (i) => ['A', 'B'].includes(i.consultant_status) || i.status === 'approved'
    ).length;

    return { codeA, codeB, codeC, codeD, pending, e1, e2, inProgress, blocked, approved };
  }, [allItems]);

  // Filter items based on active criteria
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Kind filter
      if (kindFilter !== 'all' && item.deliverable_kind !== kindFilter) {
        return false;
      }

      // Consultant Code filter
      if (codeFilter !== 'all') {
        if (codeFilter === 'pending') {
          if (item.consultant_status && item.consultant_status !== 'pending') return false;
        } else if (item.consultant_status !== codeFilter) {
          return false;
        }
      }

      // General Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'in_progress' && item.status !== 'in_progress' && item.status !== 'received') {
          return false;
        }
        if (statusFilter === 'blocked' && item.status !== 'blocked' && !item.blocked_reason) {
          return false;
        }
        if (statusFilter === 'approved' && !['A', 'B'].includes(item.consultant_status) && item.status !== 'approved') {
          return false;
        }
      }

      // Search query (sheet number, description, deliverable ref, engineer)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const sheet = (item.sheet_number || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const ref = (item.deliverable_ref || '').toLowerCase();
        const titleAr = (item.deliverable_title_ar || '').toLowerCase();
        const titleEn = (item.deliverable_title_en || '').toLowerCase();

        if (
          !sheet.includes(q) &&
          !desc.includes(q) &&
          !ref.includes(q) &&
          !titleAr.includes(q) &&
          !titleEn.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [allItems, kindFilter, codeFilter, statusFilter, searchQuery]);

  // Render Consultant Code Badge
  const renderConsultantCodeBadge = (code?: ConsultantApprovalCode | string) => {
    switch (code) {
      case 'A':
        return (
          <span
            role="status"
            aria-label={isAr ? 'كود أ: معتمد بدون ملاحظات' : 'Code A: Approved'}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
            <span className="font-mono font-bold">{isAr ? 'كود أ' : 'Code A'}</span>
            <span className="hidden sm:inline text-[10px] font-medium opacity-90">({isAr ? 'معتمد' : 'Approved'})</span>
          </span>
        );
      case 'B':
        return (
          <span
            role="status"
            aria-label={isAr ? 'كود ب: معتمد مع ملاحظات' : 'Code B: Approved as Noted'}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-800 shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" aria-hidden="true" />
            <span className="font-mono font-bold">{isAr ? 'كود ب' : 'Code B'}</span>
            <span className="hidden sm:inline text-[10px] font-medium opacity-90">({isAr ? 'معتمد بملاحظات' : 'As Noted'})</span>
          </span>
        );
      case 'C':
        return (
          <span
            role="status"
            aria-label={isAr ? 'كود ج: إعادة تقديم وتعديل' : 'Code C: Revise & Resubmit'}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
            <span className="font-mono font-bold">{isAr ? 'كود ج' : 'Code C'}</span>
            <span className="hidden sm:inline text-[10px] font-medium opacity-90">({isAr ? 'إعادة تقديم' : 'Revise'})</span>
          </span>
        );
      case 'D':
        return (
          <span
            role="status"
            aria-label={isAr ? 'كود د: مرفوض' : 'Code D: Rejected'}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-sm"
          >
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" aria-hidden="true" />
            <span className="font-mono font-bold">{isAr ? 'كود د' : 'Code D'}</span>
            <span className="hidden sm:inline text-[10px] font-medium opacity-90">({isAr ? 'مرفوض' : 'Rejected'})</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span
            role="status"
            aria-label={isAr ? 'قيد المراجعة والتدقيق لدى الاستشاري' : 'Pending Consultant Review'}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800 shadow-sm"
          >
            <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" aria-hidden="true" />
            <span>{isAr ? 'قيد التدقيق' : 'Pending'}</span>
          </span>
        );
    }
  };

  // Render Ball In Court Indicator
  const renderBallInCourt = (item: EnrichedSubmittalItem) => {
    if (['A', 'B'].includes(item.consultant_status)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
          <span>{isAr ? 'مكتمل (معتمد)' : 'Completed'}</span>
        </span>
      );
    }

    if (item.to_manager_approved && (!item.consultant_status || item.consultant_status === 'pending')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" aria-hidden="true" />
          <span>{isAr ? 'طرف الاستشاري' : 'With Consultant'}</span>
        </span>
      );
    }

    if (item.status === 'ready_to_return' && !item.to_manager_approved) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shrink-0" aria-hidden="true" />
          <span>{isAr ? 'طرف مدير المكتب الفني' : 'With TO Manager'}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" aria-hidden="true" />
        <span>{isAr ? 'طرف مهندس الإعداد' : 'With TO Engineer'}</span>
      </span>
    );
  };

  return (
    <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Controls Strip: Filters & Search */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        {/* Search, Actions & Kind Selectors */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <label htmlFor="submittal-search" className="sr-only">
              {isAr ? 'البحث في المخططات والتسليمات' : 'Search submittals and drawings'}
            </label>
            <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" aria-hidden="true" />
            </div>
            <input
              id="submittal-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'بحث برقم اللوحة، كود الحزمة، أو الوصف...'
                  : 'Search by sheet number, package ref, or description...'
              }
              className="w-full h-10 ps-10 pe-9 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={isAr ? 'مسح نص البحث' : 'Clear search'}
                className="absolute inset-y-0 end-0 pe-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg"
              >
                <XCircle className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            {/* Quick Navigation Shortcuts if handlers provided */}
            {onNavigateToApprovals && (
              <button
                type="button"
                onClick={onNavigateToApprovals}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 border border-slate-200/80 dark:border-slate-700"
              >
                <FileCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                <span>{isAr ? 'سجل الاعتمادات' : 'Approvals Register'}</span>
              </button>
            )}

            {onNavigateToAssignments && (
              <button
                type="button"
                onClick={onNavigateToAssignments}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 border border-slate-200/80 dark:border-slate-700"
              >
                <User className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                <span>{isAr ? 'توزيع المهام' : 'Assignments'}</span>
              </button>
            )}

            {/* Quick Kind Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setKindFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                  kindFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isAr ? 'كافة الأنواع' : 'All Types'} ({allItems.length})
              </button>
              <button
                type="button"
                onClick={() => setKindFilter('E1')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                  kindFilter === 'E1'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isAr ? 'مخططات تنفيذية' : 'Shop Drawings (E1)'} ({counts.e1})
              </button>
              <button
                type="button"
                onClick={() => setKindFilter('E2')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                  kindFilter === 'E2'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isAr ? 'اعتمادات مواد' : 'Materials (E2)'} ({counts.e2})
              </button>
            </div>
          </div>
        </div>

        {/* Consultant Code Badges Strip (Interactive Filter) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              {isAr ? 'تصفية حسب كود اعتماد الاستشاري:' : 'Filter by Consultant Review Code:'}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {filteredItems.length} {isAr ? 'مخطط معروض' : 'submittals shown'}
            </span>
          </div>

          <div
            className="flex flex-wrap items-center gap-2"
            role="toolbar"
            aria-label={isAr ? 'أزرار تصفية كود الاستشاري' : 'Consultant code filter buttons'}
          >
            <button
              type="button"
              onClick={() => setCodeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1 ${
                codeFilter === 'all'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {isAr ? 'كافة الأكواد' : 'All Codes'} ({allItems.length})
            </button>

            {/* Code A Pill */}
            <button
              type="button"
              onClick={() => setCodeFilter(codeFilter === 'A' ? 'all' : 'A')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 ${
                codeFilter === 'A'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'كود أ (معتمد)' : 'Code A'}</span>
              <span className="font-mono">({counts.codeA})</span>
            </button>

            {/* Code B Pill */}
            <button
              type="button"
              onClick={() => setCodeFilter(codeFilter === 'B' ? 'all' : 'B')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1 ${
                codeFilter === 'B'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                  : 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-900/50 hover:bg-sky-100 dark:hover:bg-sky-900/40'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'كود ب (معتمد بملاحظات)' : 'Code B'}</span>
              <span className="font-mono">({counts.codeB})</span>
            </button>

            {/* Code C Pill */}
            <button
              type="button"
              onClick={() => setCodeFilter(codeFilter === 'C' ? 'all' : 'C')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 ${
                codeFilter === 'C'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/40'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'كود ج (إعادة تقديم)' : 'Code C'}</span>
              <span className="font-mono">({counts.codeC})</span>
            </button>

            {/* Code D Pill */}
            <button
              type="button"
              onClick={() => setCodeFilter(codeFilter === 'D' ? 'all' : 'D')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 ${
                codeFilter === 'D'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/40'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'كود د (مرفوض)' : 'Code D'}</span>
              <span className="font-mono">({counts.codeD})</span>
            </button>

            {/* Pending Pill */}
            <button
              type="button"
              onClick={() => setCodeFilter(codeFilter === 'pending' ? 'all' : 'pending')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1 ${
                codeFilter === 'pending'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900/50 hover:bg-purple-100 dark:hover:bg-purple-900/40'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'قيد التدقيق' : 'Pending Review'}</span>
              <span className="font-mono">({counts.pending})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 w-full rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200/40 dark:border-slate-700/40"
              />
            ))}
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto border border-purple-200/50 dark:border-purple-800/40">
            <FileSpreadsheet className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            {isAr ? 'لا توجد مخططات أو تسليمات مطابقة للتصفية' : 'No submittals match your filter'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            {isAr
              ? 'جرّب تغيير كود الاعتماد، نوع الحزمة، أو إزالة نص البحث لعرض المخططات المسجلة.'
              : 'Try clearing the search text or adjusting the consultant code filter to view submittals.'}
          </p>
          {(searchQuery || codeFilter !== 'all' || kindFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCodeFilter('all');
                setKindFilter('all');
                setStatusFilter('all');
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            >
              {isAr ? 'إعادة ضبط كل التصفية' : 'Reset All Filters'}
            </button>
          )}
        </div>
      ) : (
        /* Submittal Register Table */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse" role="table">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/75 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200/80 dark:border-slate-800 text-[11px]">
                  <th scope="col" className="px-4 py-3.5 text-start whitespace-nowrap">
                    {isAr ? 'رقم اللوحة والمخطط' : 'Sheet Number'}
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-start whitespace-nowrap">
                    {isAr ? 'الحزمة والنوع' : 'Package & Kind'}
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-start">
                    {isAr ? 'بيان المخطط والوصف' : 'Description'}
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-start whitespace-nowrap">
                    {isAr ? 'قرار اعتماد الاستشاري' : 'Consultant Code'}
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-start whitespace-nowrap">
                    {isAr ? 'نسبة الإنجاز' : 'Progress'}
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-start whitespace-nowrap">
                    {isAr ? 'مسؤولية الإجراء والمتابعة' : 'Ball In Court'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredItems.map((item) => {
                  const progress = item.progress_pct ?? 0;
                  const isBlocked = item.status === 'blocked' || Boolean(item.blocked_reason);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-purple-50/30 dark:hover:bg-purple-950/30 transition-colors"
                    >
                      {/* Sheet Number & Revision */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            dir="ltr"
                            className="font-mono font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                          >
                            {item.sheet_number || 'DWG-000'}
                          </span>
                          <span
                            className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40"
                          >
                            {isAr ? `إصدار ${item.current_rev ?? 0}` : `Rev ${item.current_rev ?? 0}`}
                          </span>
                        </div>
                      </td>

                      {/* Package Ref & Kind */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            dir="ltr"
                            className="font-mono font-bold text-[11px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800"
                          >
                            {item.deliverable_ref}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {item.deliverable_kind}
                          </span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5 max-w-md">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {item.description || (isAr ? item.deliverable_title_ar : item.deliverable_title_en) || (isAr ? 'مخطط تنفيذي' : 'Drawing Deliverable')}
                          </p>
                          {isBlocked && (
                            <div className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                              <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
                              <span>{item.blocked_reason || (isAr ? 'عائق فني مسجل' : 'Obstruction logged')}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Consultant Code */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {renderConsultantCodeBadge(item.consultant_status)}
                      </td>

                      {/* Progress Bar & % */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div
                            className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
                            role="progressbar"
                            aria-valuenow={progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={isAr ? `نسبة إنجاز المخطط ${progress}%` : `Progress ${progress}%`}
                          >
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                progress >= 100
                                  ? 'bg-emerald-500'
                                  : progress >= 50
                                  ? 'bg-purple-500'
                                  : 'bg-blue-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span
                            dir="ltr"
                            className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 min-w-[32px] text-end"
                          >
                            {progress}%
                          </span>
                        </div>
                      </td>

                      {/* Ball In Court */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {renderBallInCourt(item)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TOSubmittalTrackingView;
