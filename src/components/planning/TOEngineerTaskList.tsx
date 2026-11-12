'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Send,
  RotateCw,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  LayoutGrid,
  Table as TableIcon,
  FolderKanban,
  Compass,
  Zap,
  Building2,
  Copy,
  Check,
  X,
  ArrowUpDown,
  Filter,
  Eye,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import {
  DeliverableItem,
  ConsultantApprovalCode,
} from '@/types/planning';
import { TOProgressService } from '@/lib/services/toProgress.service';
import { ProjectService } from '@/lib/services/project.service';
import { Project } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/lib/stores/useAuthStore';
import { TOProgressModal } from './TOProgressModal';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export type TODiscipline = 'all' | 'architectural' | 'structural' | 'mep' | 'other';
export type TOViewMode = 'table' | 'kanban' | 'cards';
export type TOSortField = 'sheet_number' | 'progress_pct' | 'due_date' | 'status';

export interface TOEngineerTaskListProps {
  stakeholderId?: string;
  projectId?: string;
  onSelectDeliverable?: (item: DeliverableItem) => void;
}

/**
 * Intelligent discipline detector for Technical Office deliverable items.
 * Categorizes tasks into Architectural, Structural, MEP, or Other based on
 * explicit discipline attributes, sheet number prefixes (A-, S-, M-, E-), or keywords.
 */
interface DisciplineCarrier { discipline?: string; linked_activity?: { discipline?: string } }

export function getDeliverableDiscipline(item: DeliverableItem): 'architectural' | 'structural' | 'mep' | 'other' {
  // 1. Explicit discipline in item or parent deliverable
  const explicit = (item as DisciplineCarrier).discipline || (item.deliverable as DisciplineCarrier | undefined)?.discipline;
  if (explicit) {
    const d = String(explicit).toLowerCase();
    if (d.includes('arch') || d.includes('معمار') || d.includes('finish') || d.includes('تشطيب')) return 'architectural';
    if (d.includes('struct') || d.includes('إنشائ') || d.includes('انشائ') || d.includes('civil') || d.includes('مدن')) return 'structural';
    if (d.includes('mep') || d.includes('mech') || d.includes('ميكانيك') || d.includes('elec') || d.includes('كهرب') || d.includes('plumb') || d.includes('صح')) return 'mep';
  }

  // 2. Linked activity discipline if available
  const actDisc = (item as DisciplineCarrier).linked_activity?.discipline;
  if (actDisc) {
    const d = String(actDisc).toLowerCase();
    if (d === 'finishing') return 'architectural';
    if (d === 'civil') return 'structural';
    if (d === 'mep' || d === 'mech' || d === 'elec' || d === 'water') return 'mep';
  }

  // 3. Sheet Number prefixes
  const sheet = (item.sheet_number || '').trim().toUpperCase();
  if (sheet) {
    if (/^(A|AR|ARC|ARCH|ID)[-_0-9]/i.test(sheet) || /[-_](A|AR|ARC|ARCH|ID)[-_0-9]/i.test(sheet)) {
      return 'architectural';
    }
    if (/^(S|ST|STR|CIV|C)[-_0-9]/i.test(sheet) || /[-_](S|ST|STR|CIV|C)[-_0-9]/i.test(sheet)) {
      return 'structural';
    }
    if (/^(M|MECH|MEC|E|EL|ELE|ELEC|P|PL|PLU|HVAC|MEP|FP|FA)[-_0-9]/i.test(sheet) || /[-_](M|MECH|E|ELEC|P|PL|HVAC|MEP)[-_0-9]/i.test(sheet)) {
      return 'mep';
    }
  }

  // 4. Description & Deliverable Title semantic keywords
  const text = `${item.description || ''} ${item.deliverable?.title_ar || ''} ${item.deliverable?.title_en || ''} ${item.deliverable?.ref_code || ''}`.toLowerCase();
  if (/معمار|تشطيب|واجهات|أرضيات|حوائط|أسقف معلقة|رخام|دهانات|أبواب|نوافذ|architecture|architectural|finishing|cladding/i.test(text)) {
    return 'architectural';
  }
  if (/إنشائ|انشائ|مدني|خرسان|تسليح|قواعد|أعمدة|كمرات|أسقف|لبشة|شير وول|structural|structure|rebar|concrete|foundation|slab/i.test(text)) {
    return 'structural';
  }
  if (/كهروميكانيك|ميكانيك|كهربا|صحي|سباك|مضخ|تكييف|تهوية|إنارة|لوحات توزيع|مكافحة حريق|mep|mechanical|electrical|plumbing|hvac|drainage|pump/i.test(text)) {
    return 'mep';
  }

  return 'other';
}

export const TOEngineerTaskList: React.FC<TOEngineerTaskListProps> = ({
  stakeholderId: propStakeholderId,
  projectId: propProjectId,
  onSelectDeliverable,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { user } = useAuth();

  const activeStakeholderId = propStakeholderId || user?.id || '';

  const [items, setItems] = useState<DeliverableItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(propProjectId || 'all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [disciplineFilter, setDisciplineFilter] = useState<TODiscipline>('all');
  const [codeFilter, setCodeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<TOViewMode>('table');
  const [sortField, setSortField] = useState<TOSortField>('sheet_number');
  const [sortAscending, setSortAscending] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State for Progress Logging & Obstruction reporting
  const [selectedItemForModal, setSelectedItemForModal] = useState<DeliverableItem | null>(null);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState<boolean>(false);
  const [initialObstructionMode, setInitialObstructionMode] = useState<boolean>(false);

  // Load Projects for dropdown
  useEffect(() => {
    async function loadProjects() {
      try {
        const prjs = await ProjectService.getProjects({});
        setProjects(prjs || []);
      } catch (err) {
        logger.warn('Error loading projects list', { detail: err });
      }
    }
    loadProjects();
  }, []);

  // Fetch Assigned Items
  const loadTasks = useCallback(async () => {
    if (!activeStakeholderId) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const pid = selectedProjectId === 'all' ? undefined : selectedProjectId;
      const data = await TOProgressService.getAssignedTasks(activeStakeholderId, pid);
      setItems(data || []);
    } catch (err) {
      logger.error('Error fetching assigned tasks', { detail: err });
    } finally {
      setIsLoading(false);
    }
  }, [activeStakeholderId, selectedProjectId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Discipline helper with styling and localized labels
  const getDisciplineConfig = useCallback((discipline: 'architectural' | 'structural' | 'mep' | 'other') => {
    switch (discipline) {
      case 'architectural':
        return {
          key: 'architectural',
          labelAr: 'معماري',
          labelEn: 'Architectural',
          badgeCls: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
          dotCls: 'bg-teal-500',
          Icon: Compass,
        };
      case 'structural':
        return {
          key: 'structural',
          labelAr: 'إنشائي',
          labelEn: 'Structural',
          badgeCls: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          dotCls: 'bg-blue-500',
          Icon: Layers,
        };
      case 'mep':
        return {
          key: 'mep',
          labelAr: 'كهروميكانيك',
          labelEn: 'MEP',
          badgeCls: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          dotCls: 'bg-amber-500',
          Icon: Zap,
        };
      default:
        return {
          key: 'other',
          labelAr: 'عام',
          labelEn: 'General',
          badgeCls: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          dotCls: 'bg-slate-400 dark:bg-slate-500',
          Icon: Building2,
        };
    }
  }, []);

  // Copy Sheet # to clipboard with visual feedback
  const handleCopySheetNumber = async (sheetNumber: string, itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(sheetNumber);
      setCopiedId(itemId);
      toast.success(isAr ? `تم نسخ رقم اللوحة: ${sheetNumber}` : `Copied sheet #${sheetNumber}`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error(isAr ? 'فشل نسخ رقم اللوحة' : 'Failed to copy sheet number');
    }
  };

  // KPI Metrics Calculation
  const kpis = useMemo(() => {
    const total = items.length;
    const inProgress = items.filter(
      (it) => it.status === 'in_progress' || it.status === 'received'
    ).length;
    const blocked = items.filter(
      (it) => it.status === 'blocked' || Boolean(it.blocked_reason)
    ).length;
    const readyForReview = items.filter(
      (it) => it.status === 'ready_to_return' && !it.to_manager_approved
    ).length;
    const completed = items.filter(
      (it) => it.consultant_status === 'A' || it.consultant_status === 'B' || it.progress_pct === 100 || it.status === 'returned'
    ).length;

    // Discipline counts
    const archCount = items.filter((it) => getDeliverableDiscipline(it) === 'architectural').length;
    const structCount = items.filter((it) => getDeliverableDiscipline(it) === 'structural').length;
    const mepCount = items.filter((it) => getDeliverableDiscipline(it) === 'mep').length;

    return { total, inProgress, blocked, readyForReview, completed, archCount, structCount, mepCount };
  }, [items]);

  // Filtered & Sorted Deliverable Items
  const filteredItems = useMemo(() => {
    const res = items.filter((item) => {
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'blocked' && item.status !== 'blocked' && !item.blocked_reason) return false;
        if (statusFilter === 'in_progress' && item.status !== 'in_progress' && item.status !== 'received') return false;
        if (statusFilter === 'ready_to_return' && item.status !== 'ready_to_return') return false;
        if (statusFilter === 'returned' && item.status !== 'returned' && item.progress_pct !== 100 && item.consultant_status !== 'A') return false;
      }

      // Discipline filter
      if (disciplineFilter !== 'all') {
        const itemDisc = getDeliverableDiscipline(item);
        if (itemDisc !== disciplineFilter) return false;
      }

      // Consultant Code filter
      if (codeFilter !== 'all') {
        if (item.consultant_status !== codeFilter) return false;
      }

      // Search Query (sheet_number, description, deliverable ref code or title)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const sheet = (item.sheet_number || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const ref = (item.deliverable?.ref_code || '').toLowerCase();
        const title = (item.deliverable?.title_ar || '').toLowerCase();
        const titleEn = (item.deliverable?.title_en || '').toLowerCase();

        if (
          !sheet.includes(q) &&
          !desc.includes(q) &&
          !ref.includes(q) &&
          !title.includes(q) &&
          !titleEn.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    return res.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'sheet_number') {
        comparison = (a.sheet_number || '').localeCompare(b.sheet_number || '');
      } else if (sortField === 'progress_pct') {
        comparison = (a.progress_pct || 0) - (b.progress_pct || 0);
      } else if (sortField === 'due_date') {
        comparison = (a.due_date || '').localeCompare(b.due_date || '');
      } else if (sortField === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      }
      return sortAscending ? comparison : -comparison;
    });
  }, [items, statusFilter, disciplineFilter, codeFilter, searchQuery, sortField, sortAscending]);

  const handleSort = (field: TOSortField) => {
    if (sortField === field) {
      setSortAscending(!sortAscending);
    } else {
      setSortField(field);
      setSortAscending(true);
    }
  };

  const handleOpenProgressModal = (item: DeliverableItem, obstructionMode = false) => {
    setSelectedItemForModal(item);
    setInitialObstructionMode(obstructionMode);
    setIsProgressModalOpen(true);
  };

  const getConsultantStatusBadge = (code: ConsultantApprovalCode) => {
    switch (code) {
      case 'A':
        return {
          label: 'Code A (Approved)',
          labelAr: 'كود أ (معتمد)',
          cls: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
      case 'B':
        return {
          label: 'Code B (Approved w/ comments)',
          labelAr: 'كود ب (معتمد بملاحظات)',
          cls: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        };
      case 'C':
        return {
          label: 'Code C (Revise & Resubmit)',
          labelAr: 'كود ج (إعادة تقديم)',
          cls: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        };
      case 'D':
        return {
          label: 'Code D (Rejected)',
          labelAr: 'كود د (مرفوض)',
          cls: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        };
      default:
        return {
          label: 'Pending Review',
          labelAr: 'قيد المراجعة والتدقيق',
          cls: 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        };
    }
  };

  // Group items for Kanban Columns
  const kanbanColumns = useMemo(() => {
    const inProgressList: DeliverableItem[] = [];
    const blockedList: DeliverableItem[] = [];
    const readyForSignOffList: DeliverableItem[] = [];
    const approvedList: DeliverableItem[] = [];

    filteredItems.forEach((it) => {
      const isBlocked = it.status === 'blocked' || Boolean(it.blocked_reason);
      const isReady = it.status === 'ready_to_return' && !it.to_manager_approved;
      const isApproved =
        it.consultant_status === 'A' ||
        it.consultant_status === 'B' ||
        it.progress_pct === 100 ||
        it.status === 'returned';

      if (isBlocked) {
        blockedList.push(it);
      } else if (isReady) {
        readyForSignOffList.push(it);
      } else if (isApproved) {
        approvedList.push(it);
      } else {
        inProgressList.push(it);
      }
    });

    return [
      {
        id: 'in_progress',
        titleAr: 'قيد العمل والإعداد',
        titleEn: 'In Progress',
        items: inProgressList,
        headerColor: 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50',
        badgeColor: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
        Icon: TrendingUp,
      },
      {
        id: 'blocked',
        titleAr: 'معطل بعائق فني',
        titleEn: 'Blocked / Obstruction',
        items: blockedList,
        headerColor: 'text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50',
        badgeColor: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
        Icon: AlertTriangle,
      },
      {
        id: 'ready_to_return',
        titleAr: 'بانتظار اعتماد مدير المكتب',
        titleEn: 'Ready for TO Sign-off',
        items: readyForSignOffList,
        headerColor: 'text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50',
        badgeColor: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
        Icon: Clock,
      },
      {
        id: 'approved',
        titleAr: 'معتمد ومكتمل',
        titleEn: 'Approved Deliverables',
        items: approvedList,
        headerColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50',
        badgeColor: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
        Icon: CheckCircle2,
      },
    ];
  }, [filteredItems]);

  return (
    <section className="space-y-6" aria-label={isAr ? 'قائمة مهام المكتب الفني' : 'Technical office task list'}>
      {/* Top KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>{isAr ? 'إجمالي المخططات' : 'Total Assigned'}</span>
            <Layers className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-xl font-mono font-black text-slate-900 dark:text-slate-100">
            {isLoading ? <span className="inline-block w-8 h-6 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" /> : kpis.total}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 transition-all">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 text-xs font-bold">
            <span>{isAr ? 'قيد العمل' : 'In Progress'}</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-xl font-mono font-black text-blue-600 dark:text-blue-400">
            {isLoading ? <span className="inline-block w-8 h-6 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" /> : kpis.inProgress}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 transition-all">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-bold">
            <span>{isAr ? 'معطل بعائق' : 'Blocked'}</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-xl font-mono font-black text-amber-600 dark:text-amber-400">
            {isLoading ? <span className="inline-block w-8 h-6 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" /> : kpis.blocked}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 transition-all">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 text-xs font-bold">
            <span>{isAr ? 'بانتظار الاعتماد' : 'Ready for Sign-off'}</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-xl font-mono font-black text-purple-600 dark:text-purple-400">
            {isLoading ? <span className="inline-block w-8 h-6 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" /> : kpis.readyForReview}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 col-span-2 sm:col-span-1 transition-all">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <span>{isAr ? 'معتمد ومكتمل' : 'Approved'}</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">
            {isLoading ? <span className="inline-block w-8 h-6 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" /> : kpis.completed}
          </p>
        </div>
      </div>

      {/* Control Bar: Search in RTL, View Switcher & Status/Discipline Chips */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Row 1: Search & View Switcher */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input with RTL Support & Clear Button */}
          <div className="relative flex-1 max-w-lg">
            <label htmlFor="to-task-search-input" className="sr-only">
              {isAr ? 'بحث برقم اللوحة أو اسم البند' : 'Search deliverable items'}
            </label>
            <div className="relative">
              <Search
                className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="to-task-search-input"
                type="text"
                dir="auto"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearchQuery('');
                }}
                placeholder={
                  isAr
                    ? 'بحث برقم اللوحة، الكود المرجعي، أو اسم البند...'
                    : 'Search by sheet #, ref code, or description...'
                }
                className="w-full ps-9 pe-9 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* View Mode Switcher & Reload */}
          <div className="flex items-center gap-2 self-end md:self-center">
            {/* View Mode Tabs */}
            <div
              className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700"
              role="group"
              aria-label={isAr ? 'طريقة العرض' : 'View Mode'}
            >
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                aria-pressed={viewMode === 'table'}
                title={isAr ? 'عرض جدول تفصيلي' : 'Table View'}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>{isAr ? 'جدول' : 'Table'}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                aria-pressed={viewMode === 'kanban'}
                title={isAr ? 'عرض لوحة كانبان' : 'Kanban Board'}
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>{isAr ? 'كانبان' : 'Kanban'}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                aria-pressed={viewMode === 'cards'}
                title={isAr ? 'عرض بطاقات' : 'Cards View'}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{isAr ? 'بطاقات' : 'Cards'}</span>
              </button>
            </div>

            {/* Reload button */}
            <button
              type="button"
              onClick={loadTasks}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              title={isAr ? 'تحديث المهام' : 'Refresh tasks'}
              aria-label={isAr ? 'تحديث المهام' : 'Refresh tasks'}
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Row 2: Status Filter Chips */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              {isAr ? 'فلترة حسب حالة اللوحة:' : 'Filter by Status:'}
            </span>
            <span className="text-[11px] font-mono">
              {isAr
                ? `عرض ${filteredItems.length} من أصل ${items.length} لوحة`
                : `Showing ${filteredItems.length} of ${items.length} items`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={isAr ? 'فلاتر الحالة' : 'Status filters'}>
            {[
              { id: 'all', labelAr: 'الكل', labelEn: 'All', count: kpis.total, dot: 'bg-slate-400' },
              { id: 'in_progress', labelAr: 'قيد العمل', labelEn: 'In Progress', count: kpis.inProgress, dot: 'bg-blue-500' },
              { id: 'blocked', labelAr: 'معطل بعائق', labelEn: 'Blocked', count: kpis.blocked, dot: 'bg-amber-500' },
              { id: 'ready_to_return', labelAr: 'جاهز للاعتماد', labelEn: 'Ready for Sign-off', count: kpis.readyForReview, dot: 'bg-purple-500' },
              { id: 'returned', labelAr: 'معتمد ومكتمل', labelEn: 'Approved', count: kpis.completed, dot: 'bg-emerald-500' },
            ].map((chip) => {
              const isActive = statusFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setStatusFilter(chip.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    isActive
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-600/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  role="radio"
                  aria-checked={isActive}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : chip.dot}`} />
                  <span>{isAr ? chip.labelAr : chip.labelEn}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black ${
                      isActive
                        ? 'bg-white/20 dark:bg-slate-950/30 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {chip.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Discipline Tags / Filter Chips & Consultant Code Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Discipline Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 me-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-teal-600 dark:text-teal-400" />
              {isAr ? 'التخصص الهندسي:' : 'Discipline:'}
            </span>

            {[
              { id: 'all' as TODiscipline, labelAr: 'جميع التخصصات', labelEn: 'All Disciplines', count: kpis.total, Icon: Layers },
              { id: 'architectural' as TODiscipline, labelAr: 'معماري', labelEn: 'Architectural', count: kpis.archCount, Icon: Compass },
              { id: 'structural' as TODiscipline, labelAr: 'إنشائي', labelEn: 'Structural', count: kpis.structCount, Icon: Building2 },
              { id: 'mep' as TODiscipline, labelAr: 'كهروميكانيك', labelEn: 'MEP', count: kpis.mepCount, Icon: Zap },
            ].map((disc) => {
              const isActive = disciplineFilter === disc.id;
              const DiscIcon = disc.Icon;
              return (
                <button
                  key={disc.id}
                  type="button"
                  onClick={() => setDisciplineFilter(disc.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 ${
                    isActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <DiscIcon className="w-3 h-3" />
                  <span>{isAr ? disc.labelAr : disc.labelEn}</span>
                  <span className="text-[10px] font-mono opacity-80">({disc.count})</span>
                </button>
              );
            })}
          </div>

          {/* Secondary Selectors: Consultant Code & Project */}
          <div className="flex items-center gap-2">
            {/* Consultant Code Filter */}
            <select
              value={codeFilter}
              onChange={(e) => setCodeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 cursor-pointer"
              aria-label={isAr ? 'فلترة حسب كود الاستشاري' : 'Filter by consultant approval code'}
            >
              <option value="all">{isAr ? 'كافة أكواد الاستشاري' : 'All Consultant Codes'}</option>
              <option value="A">{isAr ? 'كود أ (معتمد)' : 'Code A (Approved)'}</option>
              <option value="B">{isAr ? 'كود ب (معتمد بملاحظات)' : 'Code B (Approved w/ comments)'}</option>
              <option value="C">{isAr ? 'كود ج (إعادة تقديم)' : 'Code C (Revise & Resubmit)'}</option>
              <option value="D">{isAr ? 'كود د (مرفوض)' : 'Code D (Rejected)'}</option>
            </select>

            {/* Clear All Filters button if filtered */}
            {(statusFilter !== 'all' || disciplineFilter !== 'all' || codeFilter !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setDisciplineFilter('all');
                  setCodeFilter('all');
                  setSearchQuery('');
                }}
                className="px-2.5 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                {isAr ? 'إعادة ضبط' : 'Reset'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area: Loading Skeleton OR Empty State OR View Mode Component */}
      {isLoading ? (
        <LoadingSkeleton viewMode={viewMode} isAr={isAr} />
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto border border-teal-200/50 dark:border-teal-800/40">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
            {isAr ? 'لا توجد مخططات مسندة مطابقة لمعايير البحث' : 'No matching deliverables found'}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
            {isAr
              ? 'تأكد من تعيين المخططات لك من قبل مدير المكتب الفني أو قم بتغيير الفلاتر المختارة.'
              : 'Items assigned to you will appear here. Adjust filters or contact your TO Manager.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* Accessible Table View */
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table
              role="table"
              aria-label={isAr ? 'جدول مهام ومخططات المكتب الفني' : 'Technical office deliverables table'}
              className="w-full text-start text-xs border-collapse"
            >
              <caption className="sr-only">
                {isAr
                  ? 'قائمة مفصلة بمخططات ولوحات الرسومات التنفيذية المسندة لمهندس المكتب الفني مع نسب الإنجاز وحالة الاعتمادات'
                  : 'Detailed technical office deliverables table with progress and consultant codes'}
              </caption>
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 font-black">
                  <th
                    scope="col"
                    className="py-3 px-3.5 text-start cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                    onClick={() => handleSort('sheet_number')}
                    aria-sort={sortField === 'sheet_number' ? (sortAscending ? 'ascending' : 'descending') : 'none'}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{isAr ? 'رقم اللوحة' : 'Sheet #'}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    </div>
                  </th>
                  <th scope="col" className="py-3 px-3 text-start">
                    {isAr ? 'التخصص' : 'Discipline'}
                  </th>
                  <th scope="col" className="py-3 px-3.5 text-start">
                    {isAr ? 'الحزمة والبيان الهندسي' : 'Package & Description'}
                  </th>
                  <th
                    scope="col"
                    className="py-3 px-3 text-start cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                    onClick={() => handleSort('progress_pct')}
                    aria-sort={sortField === 'progress_pct' ? (sortAscending ? 'ascending' : 'descending') : 'none'}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{isAr ? 'نسبة الإنجاز' : 'Progress'}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    </div>
                  </th>
                  <th scope="col" className="py-3 px-3 text-start">
                    {isAr ? 'كود الاستشاري' : 'Consultant Code'}
                  </th>
                  <th scope="col" className="py-3 px-3 text-start">
                    {isAr ? 'اعتماد المكتب الفني' : 'TO Sign-off'}
                  </th>
                  <th
                    scope="col"
                    className="py-3 px-3 text-start cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                    onClick={() => handleSort('due_date')}
                    aria-sort={sortField === 'due_date' ? (sortAscending ? 'ascending' : 'descending') : 'none'}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{isAr ? 'الاستحقاق' : 'Due Date'}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    </div>
                  </th>
                  <th scope="col" className="py-3 px-3.5 text-end">
                    <span className="sr-only">{isAr ? 'إجراءات سريعة' : 'Quick Actions'}</span>
                    <span>{isAr ? 'الإجراءات' : 'Actions'}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredItems.map((item) => {
                  const progress = item.progress_pct ?? 0;
                  const codeBadge = getConsultantStatusBadge(item.consultant_status);
                  const isBlocked = item.status === 'blocked' || Boolean(item.blocked_reason);
                  const disc = getDeliverableDiscipline(item);
                  const discCfg = getDisciplineConfig(disc);
                  const DiscIcon = discCfg.Icon;
                  const sheetNum = item.sheet_number || 'DWG-000';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectDeliverable && onSelectDeliverable(item)}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && onSelectDeliverable) {
                          e.preventDefault();
                          onSelectDeliverable(item);
                        }
                      }}
                      tabIndex={0}
                      className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                        isBlocked ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Sheet # & Copy */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900 dark:text-slate-100 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {sheetNum}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopySheetNumber(sheetNum, item.id, e)}
                            className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                            title={isAr ? 'نسخ رقم اللوحة' : 'Copy sheet #'}
                            aria-label={isAr ? `نسخ رقم اللوحة ${sheetNum}` : `Copy sheet ${sheetNum}`}
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                            {isAr ? `م.${item.current_rev ?? 0}` : `R${item.current_rev ?? 0}`}
                          </span>
                        </div>
                      </td>

                      {/* Discipline Tag */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${discCfg.badgeCls}`}
                        >
                          <DiscIcon className="w-3 h-3" />
                          <span>{isAr ? discCfg.labelAr : discCfg.labelEn}</span>
                        </span>
                      </td>

                      {/* Package & Description */}
                      <td className="py-3 px-3.5 max-w-xs sm:max-w-md">
                        <div className="space-y-0.5">
                          {item.deliverable?.ref_code && (
                            <span className="inline-block text-[10px] font-mono text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-200/40 dark:border-teal-800/40">
                              {item.deliverable.ref_code}
                            </span>
                          )}
                          <p className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                            {item.description || (isAr ? item.deliverable?.title_ar || item.deliverable?.title_en || 'مخطط تنفيذي' : item.deliverable?.title_en || item.deliverable?.title_ar || 'Deliverable Item')}
                          </p>
                          {isBlocked && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span className="line-clamp-1">{item.blocked_reason || (isAr ? 'عائق فني يوقف العمل' : 'Work blocked')}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Progress Bar & Pct */}
                      <td className="py-3 px-3 whitespace-nowrap min-w-[120px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono font-black text-slate-900 dark:text-slate-100">
                              {progress}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                progress === 100
                                  ? 'bg-emerald-500'
                                  : progress >= 50
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Consultant Code */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${codeBadge.cls}`}
                        >
                          {isAr ? codeBadge.labelAr : codeBadge.label}
                        </span>
                      </td>

                      {/* TO Sign-off */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                            item.to_manager_approved
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {item.to_manager_approved ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{isAr ? 'معتمد' : 'Approved'}</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              <span>{isAr ? 'بانتظار الاعتماد' : 'Pending'}</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          {item.due_date ? item.due_date : isAr ? '—' : '—'}
                        </span>
                      </td>

                      {/* Quick Action Buttons */}
                      <td className="py-3 px-3.5 text-end whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenProgressModal(item, true)}
                            className="p-1.5 sm:px-2.5 sm:py-1 text-[11px] font-bold rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-900/40 transition-all cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 active:scale-95 shadow-sm"
                            title={isAr ? 'إبلاغ عن عائق فني' : 'Report technical blocker'}
                            aria-label={isAr ? `إبلاغ عن عائق للوحة ${sheetNum}` : `Report blocker for sheet ${sheetNum}`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span className="hidden sm:inline">{isAr ? 'عائق فني' : 'Blocker'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenProgressModal(item, false)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-teal-600 text-white hover:bg-teal-500 shadow-sm transition-all cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-95"
                            title={isAr ? 'تسجيل إنجاز اليوم' : 'Log daily progress'}
                            aria-label={isAr ? `تسجيل إنجاز اليوم للوحة ${sheetNum}` : `Log progress for sheet ${sheetNum}`}
                          >
                            <Send className="w-3 h-3" />
                            <span className="hidden sm:inline">{isAr ? 'تسجيل إنجاز' : 'Log'}</span>
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
      ) : viewMode === 'kanban' ? (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {kanbanColumns.map((col) => {
            const ColIcon = col.Icon;
            return (
              <div
                key={col.id}
                className="flex flex-col rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 space-y-3"
              >
                {/* Column Header */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${col.headerColor}`}>
                  <div className="flex items-center gap-2">
                    <ColIcon className="w-4 h-4 shrink-0" />
                    <h4 className="text-xs font-black">
                      {isAr ? col.titleAr : col.titleEn}
                    </h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${col.badgeColor}`}>
                    {col.items.length}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[750px] pe-1">
                  {col.items.length === 0 ? (
                    <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 text-xs">
                      {isAr ? 'لا توجد لوحات هنا' : 'No items here'}
                    </div>
                  ) : (
                    col.items.map((item) => {
                      const progress = item.progress_pct ?? 0;
                      const codeBadge = getConsultantStatusBadge(item.consultant_status);
                      const isBlocked = item.status === 'blocked' || Boolean(item.blocked_reason);
                      const disc = getDeliverableDiscipline(item);
                      const discCfg = getDisciplineConfig(disc);
                      const DiscIcon = discCfg.Icon;
                      const sheetNum = item.sheet_number || 'DWG-000';

                      return (
                        <div
                          key={item.id}
                          onClick={() => onSelectDeliverable && onSelectDeliverable(item)}
                          onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ' ') && onSelectDeliverable) {
                              e.preventDefault();
                              onSelectDeliverable(item);
                            }
                          }}
                          tabIndex={0}
                          className={`p-3.5 rounded-xl bg-white dark:bg-slate-900 border transition-all space-y-2.5 relative group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                            isBlocked
                              ? 'border-amber-300 dark:border-amber-900/60 shadow-sm shadow-amber-500/5'
                              : 'border-slate-200 dark:border-slate-800 hover:border-teal-500/60 dark:hover:border-teal-500/50 hover:shadow-sm'
                          }`}
                        >
                          {/* Card Header: Sheet # & Discipline */}
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-black font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                                {sheetNum}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleCopySheetNumber(sheetNum, item.id, e)}
                                className="p-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 transition-colors"
                                title={isAr ? 'نسخ رقم اللوحة' : 'Copy'}
                                aria-label={isAr ? `نسخ رقم اللوحة ${sheetNum}` : `Copy ${sheetNum}`}
                              >
                                {copiedId === item.id ? (
                                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                                {isAr ? `م.${item.current_rev ?? 0}` : `R${item.current_rev ?? 0}`}
                              </span>
                            </div>

                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${codeBadge.cls}`}
                            >
                              {isAr ? codeBadge.labelAr : codeBadge.label}
                            </span>
                          </div>

                          {/* Discipline Tag */}
                          <div>
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${discCfg.badgeCls}`}
                            >
                              <DiscIcon className="w-2.5 h-2.5" />
                              <span>{isAr ? discCfg.labelAr : discCfg.labelEn}</span>
                            </span>
                          </div>

                          {/* Title / Description */}
                          <h5 className="text-xs font-black text-slate-900 dark:text-slate-100 line-clamp-2">
                            {item.description || (isAr ? item.deliverable?.title_ar || item.deliverable?.title_en || 'مخطط تنفيذي' : item.deliverable?.title_en || item.deliverable?.title_ar || 'Deliverable Item')}
                          </h5>

                          {/* Blocked message if any */}
                          {isBlocked && (
                            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-[10px] flex items-center gap-1.5">
                              <AlertTriangle className="w-3 h-3 shrink-0 text-amber-600 dark:text-amber-400" />
                              <span className="line-clamp-1">{item.blocked_reason || (isAr ? 'عائق فني يوقف العمل' : 'Work blocked')}</span>
                            </div>
                          )}

                          {/* Progress bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-500 dark:text-slate-400 font-bold">{isAr ? 'الإنجاز' : 'Progress'}</span>
                              <span className="font-mono font-black text-teal-600 dark:text-teal-400">{progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  progress === 100
                                    ? 'bg-emerald-500'
                                    : progress >= 50
                                    ? 'bg-blue-500'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                              />
                            </div>
                          </div>

                          {/* Quick Actions Footer */}
                          <div
                            className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                              <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                              {item.due_date || '—'}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenProgressModal(item, true)}
                                className="p-1 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 active:scale-95"
                                title={isAr ? 'إبلاغ عن عائق فني' : 'Report blocker'}
                                aria-label={isAr ? `إبلاغ عن عائق للوحة ${sheetNum}` : `Report blocker for ${sheetNum}`}
                              >
                                <AlertTriangle className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenProgressModal(item, false)}
                                className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-teal-600 text-white hover:bg-teal-500 transition-all cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-95 shadow-sm"
                                title={isAr ? 'تسجيل إنجاز اليوم' : 'Log progress'}
                                aria-label={isAr ? `تسجيل إنجاز للوحة ${sheetNum}` : `Log progress for ${sheetNum}`}
                              >
                                <Send className="w-2.5 h-2.5" />
                                <span>{isAr ? 'تسجيل إنجاز' : 'Log'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Cards View (Grid) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const progress = item.progress_pct ?? 0;
            const codeBadge = getConsultantStatusBadge(item.consultant_status);
            const isBlocked = item.status === 'blocked' || Boolean(item.blocked_reason);
            const disc = getDeliverableDiscipline(item);
            const discCfg = getDisciplineConfig(disc);
            const DiscIcon = discCfg.Icon;
            const sheetNum = item.sheet_number || 'DWG-000';

            return (
              <div
                key={item.id}
                onClick={() => onSelectDeliverable && onSelectDeliverable(item)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && onSelectDeliverable) {
                    e.preventDefault();
                    onSelectDeliverable(item);
                  }
                }}
                tabIndex={0}
                className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all space-y-3 relative group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  isBlocked
                    ? 'border-amber-300 dark:border-amber-900/60 shadow-amber-500/5'
                    : 'border-slate-200 dark:border-slate-800 hover:border-teal-500/50 dark:hover:border-teal-500/40 hover:shadow-md'
                }`}
              >
                {/* Header: Sheet No, Discipline Tag, Package, Status Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        {sheetNum}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopySheetNumber(sheetNum, item.id, e)}
                        className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                        title={isAr ? 'نسخ رقم اللوحة' : 'Copy sheet #'}
                        aria-label={isAr ? `نسخ رقم اللوحة ${sheetNum}` : `Copy ${sheetNum}`}
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                        {isAr ? `المراجعة ${item.current_rev ?? 0}` : `Rev ${item.current_rev ?? 0}`}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${discCfg.badgeCls}`}
                      >
                        <DiscIcon className="w-2.5 h-2.5" />
                        {isAr ? discCfg.labelAr : discCfg.labelEn}
                      </span>
                      {item.deliverable?.ref_code && (
                        <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-200/40 dark:border-teal-800/40">
                          {item.deliverable.ref_code}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 line-clamp-1">
                      {item.description || (isAr ? item.deliverable?.title_ar || item.deliverable?.title_en || 'مخطط تنفيذي' : item.deliverable?.title_en || item.deliverable?.title_ar || 'Deliverable Item')}
                    </h4>
                  </div>

                  {/* Consultant Status Badge */}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${codeBadge.cls}`}
                  >
                    {isAr ? codeBadge.labelAr : codeBadge.label}
                  </span>
                </div>

                {/* Progress Bar & Indicators */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
                      {isAr ? 'الإنجاز الفعلي' : 'Progress'}
                    </span>
                    <span className="font-mono font-black text-teal-600 dark:text-teal-400">
                      {progress}%
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        progress === 100
                          ? 'bg-emerald-500'
                          : progress >= 50
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                  </div>
                </div>

                {/* Blocked Alert Banner if applicable */}
                {isBlocked && (
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="line-clamp-1">
                      {item.blocked_reason || (isAr ? 'عائق فني يوقف العمل' : 'Work blocked')}
                    </span>
                  </div>
                )}

                {/* Due Date & Approval Status */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    {item.due_date ? item.due_date : isAr ? 'بدون تاريخ استحقاق' : 'No due date'}
                  </span>

                  <span
                    className={`font-bold flex items-center gap-1 ${
                      item.to_manager_approved
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {item.to_manager_approved ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        {isAr ? 'معتمد من مدير المكتب' : 'TO Approved'}
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        {isAr ? 'بانتظار الاعتماد' : 'Pending Sign-off'}
                      </>
                    )}
                  </span>
                </div>

                {/* Quick Action Buttons */}
                <div
                  className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => handleOpenProgressModal(item, true)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-900/40 transition-all cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 active:scale-95 shadow-sm"
                    title={isAr ? 'إبلاغ عن عائق فني' : 'Report blocker'}
                    aria-label={isAr ? `إبلاغ عن عائق للوحة ${sheetNum}` : `Report blocker for ${sheetNum}`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>{isAr ? 'إبلاغ عن عائق' : 'Report Blocker'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenProgressModal(item, false)}
                    className="px-3 py-1 text-[11px] font-bold rounded-lg bg-teal-600 text-white hover:bg-teal-500 shadow-sm transition-all cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-95"
                    title={isAr ? 'تسجيل إنجاز اليوم' : 'Log daily progress'}
                    aria-label={isAr ? `تسجيل إنجاز اليوم للوحة ${sheetNum}` : `Log progress for ${sheetNum}`}
                  >
                    <Send className="w-3 h-3" />
                    <span>{isAr ? 'تسجيل إنجاز اليوم' : 'Log Daily Progress'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress & Obstruction Modal */}
      <TOProgressModal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        deliverableItem={selectedItemForModal}
        deliverable={selectedItemForModal?.deliverable}
        initialObstructionMode={initialObstructionMode}
        onSuccess={() => {
          loadTasks();
        }}
      />
    </section>
  );
};

/**
 * Dedicated Loading Skeleton Component
 * Displays realistic shimmering placeholders for table, kanban, or cards mode.
 */
function LoadingSkeleton({ viewMode, isAr }: { viewMode: TOViewMode; isAr: boolean }) {
  if (viewMode === 'table') {
    return (
      <div
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-4 animate-pulse"
        role="status"
        aria-label={isAr ? 'جاري تحميل جدول المهام' : 'Loading task table'}
      >
        <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-full" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 dark:border-slate-800/80">
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-24" />
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-20" />
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded flex-1 max-w-sm" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24" />
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-20" />
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-28" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (viewMode === 'kanban') {
    return (
      <div
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 animate-pulse"
        role="status"
        aria-label={isAr ? 'جاري تحميل لوحة كانبان' : 'Loading kanban board'}
      >
        {[1, 2, 3, 4].map((col) => (
          <div key={col} className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 space-y-3">
            <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
            <div className="space-y-3">
              {[1, 2].map((card) => (
                <div key={card} className="h-36 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2">
                  <div className="flex justify-between">
                    <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-16" />
                    <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-14" />
                  </div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-full mt-4" />
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mt-3" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse"
      role="status"
      aria-label={isAr ? 'جاري تحميل البطاقات' : 'Loading task cards'}
    >
      {[1, 2, 3, 4].map((card) => (
        <div key={card} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex justify-between">
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-32" />
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-20" />
          </div>
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
          <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-full" />
          <div className="flex justify-between items-center pt-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" />
            <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-36" />
          </div>
        </div>
      ))}
    </div>
  );
}
