'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ProjectService } from '@/lib/services/project.service';
import { ProjectTabsService } from '@/lib/services/projectTabs.service';
import { Project, ArchiveLog, ProjectStatus } from '@/types';
import { BackButton } from '@/components/ui/BackButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Archive,
  RotateCcw,
  Trash2,
  Eye,
  Loader2,
  Search,
  Building2,
  X,
  Database,
  Clock,
  User,
  Check,
  Copy,
  Filter,
  List,
  LayoutGrid,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';
import { useCleanupEffect } from '@/lib/utils/useCleanupEffect';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScrySearch } from '@/components/ui/ScrySearch';
import { ErrorState } from '@/components/ui/ErrorState';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { canEditPath } from '@/lib/rbac/access-control';

type SortField = 'deleted_at' | 'name' | 'code' | 'client' | 'value' | 'status';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'table' | 'grid';

/**
 * Custom accessible focus trap hook for modal dialogs.
 * Traps Tab/Shift-Tab, handles Escape key, prevents background scroll,
 * and restores focus to previously active element on close.
 */
function useFocusTrap(isOpen: boolean, onDismiss: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    const modal = containerRef.current;
    if (!modal) return;

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    // Focus first focusable element
    const focusables = Array.from(modal.querySelectorAll<HTMLElement>(focusableSelectors));
    if (focusables.length > 0) {
      focusables[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onDismissRef.current();
        return;
      }

      if (e.key === 'Tab') {
        const currentFocusables = Array.from(modal.querySelectorAll<HTMLElement>(focusableSelectors));
        if (currentFocusables.length === 0) return;

        const first = currentFocusables[0];
        const last = currentFocusables[currentFocusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen]);

  return containerRef;
}

export default function ProjectArchiveBankPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { roles, isAdmin } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();
  const canEditProject =
    isAdmin || canEditPath('/projects', roles, isAdmin, dbAccessRules);

  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [archiveLogs, setArchiveLogs] = useState<ArchiveLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedPayload, setSelectedPayload] = useState<Record<string, unknown> | null>(null);

  // New features: confirmation modal, view mode, filters, sorting, notifications
  const [projectToRestore, setProjectToRestore] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteCode, setDeleteCode] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortField>('deleted_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Focus trap hooks for both modals
  const restoreModalRef = useFocusTrap(!!projectToRestore && !restoringId, () => {
    if (!restoringId) setProjectToRestore(null);
  });
  const jsonModalRef = useFocusTrap(!!selectedPayload, () => setSelectedPayload(null));

  // Auto-dismiss feedback message after 6 seconds
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => {
      setFeedback(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const loadData = useCallback(async (isCancelled?: () => boolean) => {
    setLoading(true);
    setError(null);
    try {
      const [projects, logs] = await Promise.all([
        ProjectService.getArchivedProjects(),
        ProjectTabsService.getArchiveLogs(),
      ]);
      if (!isCancelled || !isCancelled()) {
        setArchivedProjects(projects || []);
        setArchiveLogs((logs || []).filter((l) => l.entity_type === 'PROJECT'));
      }
    } catch (rawErr: unknown) {
      const err = rawErr as { message?: string };
      console.error('Failed to load archived projects data:', err);
      if (!isCancelled || !isCancelled()) {
        setError(err?.message || (isAr ? 'تعذر استرجاع بيانات الأرشيف' : 'Failed to load archive data'));
      }
    } finally {
      if (!isCancelled || !isCancelled()) {
        setLoading(false);
      }
    }
  }, [isAr]);

  useCleanupEffect(async (isCancelled) => {
    await loadData(isCancelled);
  }, [loadData]);

  // Find archive log snapshot for project
  const getArchiveLog = useCallback(
    (projectId: string) => {
      return archiveLogs.find((l) => l.entity_id === projectId || l.project_id === projectId);
    },
    [archiveLogs]
  );

  // Restore project execution
  const handleConfirmRestore = async (id: string) => {
    const targetProj = archivedProjects.find((p) => p.id === id);
    const targetName = targetProj?.project_name || targetProj?.project_name_en || targetProj?.project_code || id;

    setRestoringId(id);
    setFeedback(null);
    try {
      await ProjectService.restoreProject(id);
      setProjectToRestore(null);
      setFeedback({
        type: 'success',
        message: isAr
          ? `تمت استعادة المشروع "${targetName}" بنجاح إلى المشاريع النشطة!`
          : `Project "${targetName}" has been successfully restored to active projects!`,
      });
      await loadData();
    } catch (rawErr: unknown) {
      const err = rawErr as { message?: string };
      console.error('Restore failed:', err);
      setFeedback({
        type: 'error',
        message: isAr
          ? `فشلت استعادة المشروع: ${err?.message || 'خطأ غير متوقع أثناء استعادة المشروع'}`
          : `Restore failed: ${err?.message || 'Unexpected error'}`,
      });
    } finally {
      setRestoringId(null);
    }
  };

  // Permanent delete (archived only) — frees the project code for reuse
  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    const name = projectToDelete.project_name || projectToDelete.project_code || projectToDelete.id;
    setDeleting(true);
    setFeedback(null);
    try {
      await ProjectService.purgeArchivedProject(projectToDelete.id, deleteCode);
      setProjectToDelete(null);
      setFeedback({ type: 'success', message: isAr ? `تم حذف المشروع "${name}" نهائياً — يمكنك الآن استخدام نفس الكود لمشروع جديد` : `Project "${name}" permanently deleted — its code is free to reuse` });
      await loadData();
    } catch (rawErr: unknown) {
      const err = rawErr as { message?: string };
      setFeedback({ type: 'error', message: (isAr ? 'فشل الحذف: ' : 'Delete failed: ') + (err?.message || '') });
    } finally {
      setDeleting(false);
    }
  };

  // Copy JSON snapshot to clipboard
  const handleCopyJson = async () => {
    if (!selectedPayload) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(selectedPayload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy JSON:', err);
    }
  };

  // Distinct client options extracted from actual archived items
  const clientOptions = useMemo(() => {
    const set = new Set<string>();
    archivedProjects.forEach((p) => {
      const cName = p.client_name_raw || p.client?.name_ar || p.client?.name_en;
      if (cName) set.add(cName.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, isAr ? 'ar' : 'en'));
  }, [archivedProjects, isAr]);

  // Distinct status options extracted from archived projects
  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    archivedProjects.forEach((p) => {
      if (p.status) set.add(p.status);
    });
    return Array.from(set);
  }, [archivedProjects]);

  const getStatusLabel = useCallback((status: string): string => {
    const map: Record<string, { ar: string; en: string }> = {
      tender: { ar: 'عطاء', en: 'Tender' },
      not_started: { ar: 'لم يبدأ', en: 'Not Started' },
      working: { ar: 'قيد التنفيذ', en: 'Working' },
      on_hold: { ar: 'موقوف مؤقتاً', en: 'On Hold' },
      handing_over: { ar: 'قيد التسليم', en: 'Handing Over' },
      finished: { ar: 'منتهي', en: 'Finished' },
      halted: { ar: 'متوقف', en: 'Halted' },
      cancelled: { ar: 'ملغي', en: 'Cancelled' },
    };
    const item = map[status];
    if (!item) return status;
    return isAr ? `${item.ar} (${status})` : item.en;
  }, [isAr]);

  // Format currency helper
  const formatCurrency = (val: number | string | undefined | null) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val || 0).replace(/,/g, ''));
    const safeNum = isNaN(num) ? 0 : num;
    return new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    }).format(safeNum);
  };

  // Format date helper
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return isAr ? 'غير محدد' : 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Sort handler for table headers
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder(field === 'name' || field === 'code' || field === 'client' ? 'asc' : 'desc');
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setSelectedStatus('all');
    setSelectedClient('all');
    setSortBy('deleted_at');
    setSortOrder('desc');
  };

  const hasActiveFilters = search.trim() !== '' || selectedStatus !== 'all' || selectedClient !== 'all';

  // Filter & sort projects
  const filteredProjects = useMemo(() => {
    const term = search.toLowerCase().trim();

    const filtered = archivedProjects.filter((p) => {
      const log = getArchiveLog(p.id);

      // Search match
      if (term) {
        const matchesName = (p.project_name || '').toLowerCase().includes(term);
        const matchesNameEn = (p.project_name_en || '').toLowerCase().includes(term);
        const matchesCode = (p.project_code || '').toLowerCase().includes(term);
        const matchesClient = (p.client_name_raw || p.client?.name_ar || p.client?.name_en || '')
          .toLowerCase()
          .includes(term);
        const matchesDeletedBy = (log?.deleted_by || '').toLowerCase().includes(term);

        if (!matchesName && !matchesNameEn && !matchesCode && !matchesClient && !matchesDeletedBy) {
          return false;
        }
      }

      // Status match
      if (selectedStatus !== 'all' && p.status !== selectedStatus) {
        return false;
      }

      // Client match
      if (selectedClient !== 'all') {
        const cName = p.client_name_raw || p.client?.name_ar || p.client?.name_en;
        if (cName !== selectedClient) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'deleted_at') {
        const timeA = a.deleted_at ? new Date(a.deleted_at).getTime() : 0;
        const timeB = b.deleted_at ? new Date(b.deleted_at).getTime() : 0;
        comparison = timeA - timeB;
      } else if (sortBy === 'name') {
        const nameA = a.project_name || a.project_name_en || '';
        const nameB = b.project_name || b.project_name_en || '';
        comparison = nameA.localeCompare(nameB, isAr ? 'ar' : 'en');
      } else if (sortBy === 'code') {
        const codeA = a.project_code || '';
        const codeB = b.project_code || '';
        comparison = codeA.localeCompare(codeB);
      } else if (sortBy === 'client') {
        const clientA = a.client_name_raw || a.client?.name_ar || a.client?.name_en || '';
        const clientB = b.client_name_raw || b.client?.name_ar || b.client?.name_en || '';
        comparison = clientA.localeCompare(clientB, isAr ? 'ar' : 'en');
      } else if (sortBy === 'value') {
        const valA = a.total_contract_value || a.contract_value || 0;
        const valB = b.total_contract_value || b.contract_value || 0;
        comparison = (typeof valA === 'number' ? valA : 0) - (typeof valB === 'number' ? valB : 0);
      } else if (sortBy === 'status') {
        const statusA = a.status || '';
        const statusB = b.status || '';
        comparison = statusA.localeCompare(statusB);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [archivedProjects, search, selectedStatus, selectedClient, sortBy, sortOrder, isAr, getArchiveLog]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <BackButton href="/projects" label={isAr ? 'العودة لقائمة المشاريع' : 'Back to Projects'} />
      </div>

      {/* Feedback Alert Banner */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="text-xs font-bold leading-relaxed">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label={isAr ? 'إغلاق الإشعار' : 'Dismiss notice'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Container */}
      <header className="rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shadow-inner">
              <Archive className="w-7 h-7" aria-hidden="true" />
            </div>
            <div>
              <h1 className={`text-xl font-black text-slate-900 dark:text-white ${isAr ? 'tracking-normal' : 'tracking-tight'}`}>

                {isAr ? 'بنك الأرشيف — المشاريع المؤرشفة' : 'Archive Bank — Archived Projects'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'جميع المشاريع المؤرشفة محفوظة بكافة بياناتها وسجلاتها مع إمكانية استعادتها بضغطة زر'
                  : 'All archived projects are securely preserved with full snapshots and 1-click restoration'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 shadow-sm">
              <span className="text-xs font-black text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <Database className="w-4 h-4" aria-hidden="true" />
                <span>
                  {isAr
                    ? `${filteredProjects.length} من أصل ${archivedProjects.length} مشروع`
                    : `${filteredProjects.length} of ${archivedProjects.length} projects`}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-5">
          <ScrySearch
            value={search}
            onChange={setSearch}
            placeholder={isAr ? 'بحث سريع بالاسم، الكود، العميل، أو المستخدم...' : 'Quick search by name, code, client...'}
            width="100%"
            defaultOpen={true}
            hotkey="⌘K"
            isRtl={isAr}
            ariaLabel={isAr ? 'بحث في بنك الأرشيف' : 'Search archive bank'}
          />
        </div>
      </header>

      {/* Responsive Filter and Controls Bar */}
      <section
        aria-label={isAr ? 'خيارات التصفية والفرز والعرض' : 'Filter, sort, and display controls'}
        className="rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
      >
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 min-h-[38px] bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <label htmlFor="status-filter" className="font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {isAr ? 'الحالة السابقة:' : 'Status:'}
              </label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="min-h-[36px] bg-transparent border-none text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
                {statusOptions.map((st) => (
                  <option key={st} value={st} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {getStatusLabel(st)}
                  </option>
                ))}
              </select>
            </div>

            {/* Client Filter */}
            {clientOptions.length > 0 && (
              <div className="flex items-center gap-1.5 min-h-[38px] bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                <label htmlFor="client-filter" className="font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {isAr ? 'العميل:' : 'Client:'}
                </label>
                <select
                  id="client-filter"
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="min-h-[36px] bg-transparent border-none text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1 max-w-[160px] truncate"
                >
                  <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'جميع العملاء' : 'All Clients'}</option>
                  {clientOptions.map((c) => (
                    <option key={c} value={c} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 min-h-[38px] bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
              <label htmlFor="sort-select" className="font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {isAr ? 'الترتيب:' : 'Sort:'}
              </label>
              <select
                id="sort-select"
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split(':') as [SortField, SortOrder];
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="min-h-[36px] bg-transparent border-none text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="deleted_at:desc" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'الأحدث أرشفة أولاً' : 'Newest archived'}</option>
                <option value="deleted_at:asc" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'الأقدم أرشفة أولاً' : 'Oldest archived'}</option>
                <option value="name:asc" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'اسم المشروع (أ - ي)' : 'Name (A to Z)'}</option>
                <option value="name:desc" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'اسم المشروع (ي - أ)' : 'Name (Z to A)'}</option>
                <option value="value:desc" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'قيمة العقد (الأعلى)' : 'Value (High to Low)'}</option>
                <option value="value:asc" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'قيمة العقد (الأقل)' : 'Value (Low to High)'}</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                title={isAr ? 'إعادة ضبط كل الفلاتر' : 'Reset all filters'}
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 self-end lg:self-center border border-slate-200 dark:border-slate-700 p-1 rounded-xl bg-slate-50 dark:bg-slate-800/70">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-pressed={viewMode === 'table'}
              className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={isAr ? 'عرض جدولي' : 'Table view'}
            >
              <List className="w-4 h-4" aria-hidden="true" />
              <span>{isAr ? 'جدول' : 'Table'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={isAr ? 'عرض بطاقات' : 'Grid view'}
            >
              <LayoutGrid className="w-4 h-4" aria-hidden="true" />
              <span>{isAr ? 'بطاقات' : 'Grid'}</span>
            </button>
          </div>
        </div>

        {/* Active Filters Pill Summary */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-400 dark:text-slate-400 text-[11px] font-semibold">{isAr ? 'الفلاتر النشطة:' : 'Active filters:'}</span>
            {search && (
              <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                <span>{isAr ? `البحث: "${search}"` : `Search: "${search}"`}</span>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-rose-600 dark:hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-full cursor-pointer"
                  aria-label={isAr ? 'إلغاء البحث' : 'Clear search'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {selectedStatus !== 'all' && (
              <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                <span>{isAr ? `الحالة: ${getStatusLabel(selectedStatus)}` : `Status: ${getStatusLabel(selectedStatus)}`}</span>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('all')}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-rose-600 dark:hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-full cursor-pointer"
                  aria-label={isAr ? 'إلغاء فلتر الحالة' : 'Clear status filter'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {selectedClient !== 'all' && (
              <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                <span>{isAr ? `العميل: ${selectedClient}` : `Client: ${selectedClient}`}</span>
                <button
                  type="button"
                  onClick={() => setSelectedClient('all')}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-rose-600 dark:hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-full cursor-pointer"
                  aria-label={isAr ? 'إلغاء فلتر العميل' : 'Clear client filter'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>
        )}
      </section>

      {/* Main Content Area */}
      {loading ? (
        <div className="rounded-3xl p-16 text-center border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
          <Loader2 className="w-9 h-9 animate-spin mx-auto text-rose-500 mb-3" aria-hidden="true" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {isAr ? 'جاري تحميل بنك الأرشيف وسجلات المشاريع...' : 'Loading archive bank and project snapshots...'}
          </p>
          <p className="text-xs text-slate-400 mt-1">{isAr ? 'يرجى الانتظار لحظات' : 'Please wait a moment'}</p>
        </div>
      ) : error ? (
        <div className="my-6">
          <ErrorState
            error={error}
            onRetry={() => loadData()}
            title={isAr ? 'تعذر تحميل بنك الأرشيف' : 'Failed to load Archive Bank'}
          />
        </div>
      ) : archivedProjects.length === 0 ? (
        /* Empty Archive State (Zero Archived Projects Overall) */
        <div className="relative overflow-hidden rounded-3xl p-14 text-center border border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-white via-rose-50/20 to-white dark:from-slate-900 dark:via-rose-950/10 dark:to-slate-900 shadow-xl">
          <div className="w-20 h-20 rounded-3xl bg-rose-100/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-400 shadow-inner">
            <Archive className="w-10 h-10" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {isAr ? 'بنك الأرشيف فارغ تماماً' : 'Archive Bank is Empty'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
            {isAr
              ? 'لا توجد أي مشاريع مؤرشفة في الوقت الحالي. عند نقل أي مشروع للأرشيف من قائمة المشاريع النشطة، سيتم حفظ لقطة متكاملة لكافة بياناته وسجلاته هنا لضمان إمكانية استعادتها بضغطة زر.'
              : 'There are currently no archived projects. Whenever a project is archived from active projects, a complete snapshot is securely preserved here with instant restoration.'}
          </p>
          <div className="mt-6">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all"
            >
              <FolderOpen className="w-4 h-4" aria-hidden="true" />
              <span>{isAr ? 'الانتقال إلى قائمة المشاريع النشطة' : 'Browse Active Projects'}</span>
            </Link>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        /* Empty Filter Results State (Archived Projects exist, but none match filters) */
        <div className="rounded-3xl p-14 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center mx-auto mb-3 text-amber-600 dark:text-amber-400">
            <Search className="w-8 h-8" aria-hidden="true" />
          </div>
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            {isAr ? 'لم يتم العثور على أي مشاريع مطابقة' : 'No Matching Projects Found'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1.5 leading-relaxed">
            {isAr
              ? 'لا توجد مشاريع مؤرشفة تطابق معايير البحث والتصفية المحددة حالياً. جرّب تعديل الكلمات الدلالية أو إعادة تعيين الفلاتر.'
              : 'No archived projects matched your search keywords or active filter criteria. Try adjusting or resetting filters.'}
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
              <span>{isAr ? 'إعادة ضبط معايير البحث والتصفية' : 'Reset Search & Filters'}</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* Table Layout View */
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden transition-all">
          {/* Mobile horizontal scroll hint */}
          <div className="md:hidden px-4 py-2.5 bg-gradient-to-r from-rose-50 via-orange-50 to-rose-50 dark:from-rose-950/40 dark:via-orange-950/20 dark:to-rose-950/40 text-rose-900 dark:text-rose-200 text-[11px] font-extrabold flex items-center justify-between border-b border-rose-100 dark:border-rose-900/40">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              {isAr ? 'جدول بنك الأرشيف' : 'Archive Bank Table'}
            </span>
            <span className="text-rose-700 dark:text-rose-300">
              {isAr ? '👈 اسحب أفقياً لرؤية كافة الأعمدة' : 'Swipe horizontally to view all columns 👉'}
            </span>
          </div>

          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-rose-200 dark:scrollbar-thumb-slate-700">
            <table
              role="table"
              aria-label={isAr ? 'جدول بنك المشاريع المؤرشفة' : 'Archive Bank Projects Table'}
              className="w-full min-w-[920px] text-end text-sm"
            >
              <caption className="sr-only">
                {isAr ? 'قائمة تفصيلية بالمشاريع المؤرشفة في بنك الأرشيف' : 'Detailed table of archived projects'}
              </caption>
              <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-xs font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 select-none">
                <tr>
                  {/* Code & Name */}
                  <th
                    scope="col"
                    aria-sort={sortBy === 'name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="py-3.5 px-4"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1.5 min-h-[36px] font-bold hover:text-rose-600 dark:hover:text-rose-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded px-1 -mx-1"
                      aria-label={isAr ? 'ترتيب حسب اسم ورمز المشروع' : 'Sort by project name and code'}
                    >
                      <span>{isAr ? 'المشروع والرمز' : 'Project & Code'}</span>
                      <span className="inline-flex items-center" aria-hidden="true">
                        {sortBy === 'name' ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-400 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    </button>
                  </th>

                  {/* Client */}
                  <th
                    scope="col"
                    aria-sort={sortBy === 'client' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="py-3.5 px-4"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('client')}
                      className="flex items-center gap-1.5 min-h-[36px] font-bold hover:text-rose-600 dark:hover:text-rose-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded px-1 -mx-1"
                      aria-label={isAr ? 'ترتيب حسب العميل' : 'Sort by client'}
                    >
                      <span>{isAr ? 'العميل' : 'Client'}</span>
                      <span className="inline-flex items-center" aria-hidden="true">
                        {sortBy === 'client' ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-400 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    </button>
                  </th>

                  {/* Status */}
                  <th
                    scope="col"
                    aria-sort={sortBy === 'status' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="py-3.5 px-4"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('status')}
                      className="flex items-center gap-1.5 min-h-[36px] font-bold hover:text-rose-600 dark:hover:text-rose-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded px-1 -mx-1"
                      aria-label={isAr ? 'ترتيب حسب الحالة السابقة' : 'Sort by previous status'}
                    >
                      <span>{isAr ? 'الحالة السابقة' : 'Previous Status'}</span>
                      <span className="inline-flex items-center" aria-hidden="true">
                        {sortBy === 'status' ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-400 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    </button>
                  </th>

                  {/* Value */}
                  <th
                    scope="col"
                    aria-sort={sortBy === 'value' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="py-3.5 px-4"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('value')}
                      className="flex items-center gap-1.5 min-h-[36px] font-bold hover:text-rose-600 dark:hover:text-rose-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded px-1 -mx-1"
                      aria-label={isAr ? 'ترتيب حسب قيمة العقد' : 'Sort by contract value'}
                    >
                      <span>{isAr ? 'قيمة العقد' : 'Contract Value'}</span>
                      <span className="inline-flex items-center" aria-hidden="true">
                        {sortBy === 'value' ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-400 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    </button>
                  </th>

                  {/* Archive Date */}
                  <th
                    scope="col"
                    aria-sort={sortBy === 'deleted_at' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="py-3.5 px-4"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('deleted_at')}
                      className="flex items-center gap-1.5 min-h-[36px] font-bold hover:text-rose-600 dark:hover:text-rose-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded px-1 -mx-1"
                      aria-label={isAr ? 'ترتيب حسب تاريخ الأرشفة' : 'Sort by archive date'}
                    >
                      <span>{isAr ? 'تاريخ الأرشفة' : 'Archived Date'}</span>
                      <span className="inline-flex items-center" aria-hidden="true">
                        {sortBy === 'deleted_at' ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-400 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    </button>
                  </th>

                  {/* Archived By */}
                  <th scope="col" className="py-3.5 px-4 font-bold text-slate-600 dark:text-slate-300">
                    {isAr ? 'أرشفة بواسطة' : 'Archived By'}
                  </th>

                  {/* Actions */}
                  <th scope="col" className="py-3.5 px-4 text-center font-bold text-slate-600 dark:text-slate-300">
                    {isAr ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredProjects.map((project) => {
                  const log = getArchiveLog(project.id);
                  const isRestoringThis = restoringId === project.id;
                  const clientDisplay = project.client_name_raw || project.client?.name_ar || project.client?.name_en;

                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-rose-50/30 dark:hover:bg-rose-950/20 transition-colors group"
                    >
                      {/* Name & Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 dark:text-white leading-snug">
                            {project.project_name || project.project_name_en || (isAr ? 'مشروع بدون اسم' : 'Unnamed Project')}
                          </span>
                          <span className="font-mono text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {project.project_code || '---'}
                          </span>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {clientDisplay ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                            <span className="truncate max-w-[180px]">{clientDisplay}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">---</span>
                        )}
                      </td>

                      {/* Previous Status */}
                      <td className="py-3.5 px-4">
                        {project.status ? (
                          <StatusBadge status={project.status as ProjectStatus} size="sm" />
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-xs">---</span>
                        )}
                      </td>

                      {/* Contract Value */}
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(project.total_contract_value || project.contract_value || 0)}
                      </td>

                      {/* Archive Date */}
                      <td className="py-3.5 px-4 text-xs text-rose-600 dark:text-rose-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>{formatDate(project.deleted_at || log?.archived_at)}</span>
                        </div>
                      </td>

                      {/* Archived By */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                        {log?.deleted_by ? (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                            <span className="truncate max-w-[140px]">{log.deleted_by}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px]">{isAr ? 'النظام' : 'System'}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Restore Button */}
                          {canEditProject && (
                            <button
                              type="button"
                              onClick={() => setProjectToRestore(project)}
                              disabled={isRestoringThis}
                              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-sm hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                              aria-label={`${isAr ? 'استعادة مشروع' : 'Restore project'} ${project.project_name || project.project_code}`}
                              title={isAr ? 'استعادة المشروع إلى المشاريع النشطة' : 'Restore project to active'}
                            >
                              {isRestoringThis ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                              ) : (
                                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                              )}
                              <span>{isAr ? 'استعادة' : 'Restore'}</span>
                            </button>
                          )}

                          {/* View Payload Snapshot Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedPayload(log?.archived_data || (project as unknown as Record<string, unknown>))}
                            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
                            aria-label={`${isAr ? 'عرض بيانات' : 'View payload'} ${project.project_name || project.project_code}`}
                            title={isAr ? 'عرض لقطة البيانات المحفوظة' : 'View snapshot payload'}
                          >
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{isAr ? 'عرض' : 'View'}</span>
                          </button>
                          {canEditProject && (
                            <button
                              type="button"
                              onClick={() => { setProjectToDelete(project); setDeleteCode(''); }}
                              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                              aria-label={`${isAr ? 'حذف نهائي' : 'Delete permanently'} ${project.project_name || project.project_code}`}
                              title={isAr ? 'حذف نهائي (يحرر كود المشروع)' : 'Delete permanently (frees the code)'}
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>{isAr ? 'حذف' : 'Delete'}</span>
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
      ) : (
        /* Grid Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const log = getArchiveLog(project.id);
            const isRestoringThis = restoringId === project.id;
            const clientDisplay = project.client_name_raw || project.client?.name_ar || project.client?.name_en;

            return (
              <div
                key={project.id}
                className="rounded-3xl p-5 border border-rose-200/60 dark:border-rose-900/40 bg-white dark:bg-slate-900 shadow-lg hover:shadow-xl transition-all relative overflow-hidden flex flex-col justify-between"
              >
                {/* Archived accent top stripe */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-orange-400 to-rose-600" />

                <div className="space-y-3.5">
                  {/* Name and code */}
                  <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white leading-relaxed">
                      {project.project_name || project.project_name_en || (isAr ? 'مشروع بدون اسم' : 'Unnamed Project')}
                    </h2>
                    <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                      {project.project_code}
                    </p>
                  </div>

                  {/* Client */}
                  {clientDisplay && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      <span className="font-bold truncate">{clientDisplay}</span>
                    </div>
                  )}

                  {/* Status + Contract Value */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {project.status ? (
                      <StatusBadge status={project.status as ProjectStatus} size="sm" />
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 text-xs">---</span>
                    )}
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(project.total_contract_value || project.contract_value || 0)}
                    </span>
                  </div>

                  {/* Archive info */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    {(project.deleted_at || log?.archived_at) && (
                      <div className="flex items-center gap-1.5 text-[11px] text-rose-500 dark:text-rose-400">
                        <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />
                        <span>
                          {isAr ? 'تم الأرشفة: ' : 'Archived: '}
                          {formatDate(project.deleted_at || log?.archived_at)}
                        </span>
                      </div>
                    )}
                    {log?.deleted_by && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <User className="w-3 h-3 shrink-0" aria-hidden="true" />
                        <span>
                          {isAr ? 'بواسطة: ' : 'By: '}
                          {log.deleted_by}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
                  {canEditProject && (
                    <button
                      type="button"
                      onClick={() => setProjectToRestore(project)}
                      disabled={isRestoringThis}
                      className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md hover:shadow-lg disabled:opacity-50 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 cursor-pointer disabled:cursor-not-allowed"
                      aria-label={`${isAr ? 'استعادة مشروع' : 'Restore project'} ${project.project_name || project.project_code}`}
                    >
                      {isRestoringThis ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>{isAr ? 'استعادة' : 'Restore'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedPayload(log?.archived_data || (project as unknown as Record<string, unknown>))}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
                    aria-label={`${isAr ? 'عرض بيانات' : 'View payload'} ${project.project_name || project.project_code}`}
                  >
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{isAr ? 'عرض' : 'View'}</span>
                  </button>
                  {canEditProject && (
                    <button
                      type="button"
                      onClick={() => { setProjectToDelete(project); setDeleteCode(''); }}
                      className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                      aria-label={`${isAr ? 'حذف نهائي' : 'Delete permanently'} ${project.project_name || project.project_code}`}
                      title={isAr ? 'حذف نهائي (يحرر كود المشروع)' : 'Delete permanently (frees the code)'}
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{isAr ? 'حذف' : 'Delete'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Permanent Delete Confirmation */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900 p-6 space-y-4">
            <h3 className="text-base font-black text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              {isAr ? 'حذف نهائي للمشروع' : 'Permanently delete project'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {isAr
                ? 'سيتم حذف المشروع وكل بياناته (BOQ، التقارير، الجدول الزمني، المستخلصات…) نهائياً ولا يمكن التراجع. سجل الأرشفة (لقطة JSON) يبقى للمرجعية.'
                : 'The project and ALL its data (BOQ, reports, schedule, invoices…) will be deleted forever. The archive JSON snapshot is kept for reference.'}
            </p>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              {isAr ? 'اكتب كود المشروع للتأكيد:' : 'Type the project code to confirm:'}{' '}
              <span className="font-mono text-rose-600 dark:text-rose-400">{projectToDelete.project_code}</span>
              <input
                value={deleteCode}
                onChange={(e) => setDeleteCode(e.target.value)}
                className="mt-2 w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                dir="ltr"
                autoFocus
              />
            </label>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting || deleteCode.trim() !== (projectToDelete.project_code || '').trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />}
                {isAr ? 'حذف نهائي' : 'Delete forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Alert Dialog Modal with Focus Trap */}
      {projectToRestore && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !restoringId) {
              setProjectToRestore(null);
            }
          }}
        >
          <div
            ref={restoreModalRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="restore-modal-title"
            aria-describedby="restore-modal-desc"
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-5 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                <RotateCcw className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h2 id="restore-modal-title" className="text-base font-black text-slate-900 dark:text-white">
                  {isAr ? 'تأكيد استعادة المشروع إلى المشاريع النشطة' : 'Confirm Project Restoration'}
                </h2>
                <p id="restore-modal-desc" className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isAr
                    ? 'هل أنت متأكد من رغبتك في استعادة هذا المشروع؟ سيتم إلغاء حالة الأرشفة وإعادته فوراً إلى قائمة المشاريع النشطة مع الحفاظ الكامل على كافة البيانات وسجلات التغيير.'
                    : 'Are you sure you want to restore this project? It will be unarchived and immediately returned to active projects with all documents, data, and changelogs intact.'}
                </p>
              </div>
            </div>

            {/* Project Snapshot Card inside Modal */}
            <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {projectToRestore.project_name || projectToRestore.project_name_en || (isAr ? 'مشروع بدون اسم' : 'Unnamed Project')}
                </span>
                <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                  {projectToRestore.project_code}
                </span>
              </div>

              {(projectToRestore.client_name_raw || projectToRestore.client?.name_ar || projectToRestore.client?.name_en) && (
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  <span>
                    {projectToRestore.client_name_raw || projectToRestore.client?.name_ar || projectToRestore.client?.name_en}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">
                  {isAr ? 'قيمة العقد المحفوظة:' : 'Archived Contract Value:'}
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(projectToRestore.total_contract_value || projectToRestore.contract_value || 0)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProjectToRestore(null)}
                disabled={!!restoringId}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmRestore(projectToRestore.id)}
                disabled={!!restoringId}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer"
              >
                {restoringId === projectToRestore.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>{isAr ? 'جاري الاستعادة...' : 'Restoring...'}</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    <span>{isAr ? 'تأكيد واستعادة' : 'Confirm & Restore'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Snapshot Detail Modal with Focus Trap */}
      {selectedPayload && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedPayload(null);
            }
          }}
        >
          <div
            ref={jsonModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="json-modal-title"
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                  <Database className="w-4 h-4" aria-hidden="true" />
                </div>
                <h2 id="json-modal-title" className="text-sm font-black text-slate-900 dark:text-white">
                  {isAr ? 'لقطة بيانات المشروع المؤرشف (JSON Snapshot)' : 'Archived Project Snapshot (JSON)'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                  title={isAr ? 'نسخ البيانات إلى الحافظة' : 'Copy JSON'}
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ' : 'Copy')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPayload(null)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-950/50">
              <pre className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-mono text-xs overflow-x-auto dir-ltr whitespace-pre-wrap leading-relaxed select-all">
                {JSON.stringify(selectedPayload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
