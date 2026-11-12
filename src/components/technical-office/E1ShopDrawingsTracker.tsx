'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Layers,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCw,
  Plus,
  Send,
  Eye,
  SlidersHorizontal,
  FileCheck,
  Check,
  Copy,
  Calendar,
  X,
  ArrowUpDown,
  LayoutGrid,
  Table as TableIcon,
  Building2,
  Zap,
  Compass,
  UserCheck,
  User,
  FolderKanban,
  Sparkles,
  History,
} from 'lucide-react';
import { Deliverable, DeliverableItem, ConsultantApprovalCode } from '@/types/planning';
import { DeliverablesService } from '@/lib/services/deliverables.service';
import { ProjectService } from '@/lib/services/project.service';
import { useLanguage } from '@/contexts/LanguageContext';
import { HistoryDrawer } from '@/components/planning/HistoryDrawer';
import {
  TODisciplineBadge,
  detectDeliverableDiscipline,
  TODisciplineType,
  isCivilOrStructuralDiscipline,
  isMepOrAquaticsDiscipline,
  isArchitecturalDiscipline,
} from './TODisciplineBadge';
import { TOConsultantStatusBadge } from './TOConsultantStatusBadge';
import { TOProgressUpdateModal } from './TOProgressUpdateModal';
import { TOObstructionModal } from './TOObstructionModal';
import { toast } from 'sonner';

export type TOEngineeringSpecialty = 'all' | 'civil_struct' | 'mep_aquatics' | 'architectural';
export type TOActionBucket = 'all' | 'needs_drafting' | 'consultant_revisions' | 'pending_manager' | 'approved' | 'blocked';
export type TOAssignmentScope = 'my_tasks' | 'all_project';

export interface E1ShopDrawingsTrackerProps {
  projectId: string;
  deliverables: Deliverable[];
  isLoading: boolean;
  onRefresh: () => void;
  engineerStakeholderId?: string | null;
  isManager?: boolean;
}

export const E1ShopDrawingsTracker: React.FC<E1ShopDrawingsTrackerProps> = ({
  projectId,
  deliverables,
  isLoading,
  onRefresh,
  engineerStakeholderId,
  isManager = false,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  // Filters & View State
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyGroup, setSpecialtyGroup] = useState<TOEngineeringSpecialty>('all');
  const [actionBucket, setActionBucket] = useState<TOActionBucket>('all');
  const [assignmentScope, setAssignmentScope] = useState<TOAssignmentScope>('all_project');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [codeFilter, setCodeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals state
  const [selectedItemForProgress, setSelectedItemForProgress] = useState<DeliverableItem | null>(null);
  const [selectedItemForObstruction, setSelectedItemForObstruction] = useState<DeliverableItem | null>(null);
  const [isProcessingClaim, setIsProcessingClaim] = useState<string | null>(null);
  const [historyItemId, setHistoryItemId] = useState<string | null>(null);
  const [historyItemTitle, setHistoryItemTitle] = useState<string>('');
  const [stakeholderNameById, setStakeholderNameById] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!projectId || projectId === 'all') return;
    let cancelled = false;
    ProjectService.getProjectStakeholders(projectId)
      .then((rows) => {
        if (cancelled || !Array.isArray(rows)) return;
        const map: Record<string, string> = {};
        rows.forEach((ps: any) => {
          const stk = ps.stakeholder || ps;
          const id = stk?.id || ps.stakeholder_id;
          if (id) {
            map[id] = stk?.name_ar || stk?.name_en || '';
          }
        });
        setStakeholderNameById(map);
      })
      .catch(() => {
        if (!cancelled) setStakeholderNameById({});
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const getAssignedEngineerName = (item: DeliverableItem): string => {
    if (item.assigned_stakeholder?.name_ar) return item.assigned_stakeholder.name_ar;
    if (item.assigned_stakeholder?.name_en) return item.assigned_stakeholder.name_en;
    if (item.assigned_stakeholder_id && stakeholderNameById[item.assigned_stakeholder_id]) {
      return stakeholderNameById[item.assigned_stakeholder_id];
    }
    return '';
  };

  // Extract all drawing items from E1 deliverables across project
  const allProjectE1Items = useMemo(() => {
    const list: (DeliverableItem & { parentPackage?: Deliverable })[] = [];
    deliverables
      .filter((d) => d.kind === 'E1' || d.kind === 'drawing_list')
      .forEach((d) => {
        (d.items || []).forEach((item) => {
          list.push({
            ...item,
            parentPackage: d,
          });
        });
      });
    return list;
  }, [deliverables]);

  // Count items assigned to current user
  const myAssignedCount = useMemo(() => {
    if (!engineerStakeholderId) return 0;
    return allProjectE1Items.filter((i) => i.assigned_stakeholder_id === engineerStakeholderId).length;
  }, [allProjectE1Items, engineerStakeholderId]);

  // Set default scope on load: if user has assigned items, default to 'my_tasks', otherwise 'all_project'
  useEffect(() => {
    if (!isManager && engineerStakeholderId && myAssignedCount > 0) {
      setAssignmentScope('my_tasks');
    } else {
      setAssignmentScope('all_project');
    }
  }, [engineerStakeholderId, myAssignedCount, isManager]);

  // Items scoped by assignment toggle
  const scopedItems = useMemo(() => {
    if (assignmentScope === 'my_tasks' && engineerStakeholderId) {
      return allProjectE1Items.filter((i) => i.assigned_stakeholder_id === engineerStakeholderId);
    }
    return allProjectE1Items;
  }, [allProjectE1Items, assignmentScope, engineerStakeholderId]);

  // Compute item counts by engineering discipline
  const specialtyCounts = useMemo(() => {
    let civil = 0;
    let mep = 0;
    let arch = 0;
    scopedItems.forEach((item) => {
      const disc = detectDeliverableDiscipline(item);
      if (isCivilOrStructuralDiscipline(disc)) civil++;
      else if (isMepOrAquaticsDiscipline(disc)) mep++;
      else if (isArchitecturalDiscipline(disc)) arch++;
    });
    return {
      all: scopedItems.length,
      civil,
      mep,
      arch,
    };
  }, [scopedItems]);

  // Compute KPIs based on scoped items
  const kpis = useMemo(() => {
    const total = scopedItems.length;
    const inProgress = scopedItems.filter((i) => i.status === 'in_progress' || i.status === 'received').length;
    const blocked = scopedItems.filter((i) => i.status === 'blocked' || Boolean(i.blocked_reason)).length;
    const readyForManager = scopedItems.filter((i) => i.status === 'ready_to_return' && !i.to_manager_approved).length;
    const consultantRevisions = scopedItems.filter((i) => ['C', 'B'].includes(i.consultant_status) && i.status !== 'ready_to_return').length;
    const approved = scopedItems.filter((i) => ['A', 'B'].includes(i.consultant_status) || i.progress_pct === 100).length;
    return { total, inProgress, blocked, readyForManager, consultantRevisions, approved };
  }, [scopedItems]);

  // Filtered items based on specialty, action bucket, search, status, and code
  const filteredItems = useMemo(() => {
    return scopedItems.filter((item) => {
      const disc = detectDeliverableDiscipline(item);

      // Specialty Group Filter
      if (specialtyGroup === 'civil_struct') {
        if (!isCivilOrStructuralDiscipline(disc)) return false;
      } else if (specialtyGroup === 'mep_aquatics') {
        if (!isMepOrAquaticsDiscipline(disc)) return false;
      } else if (specialtyGroup === 'architectural') {
        if (!isArchitecturalDiscipline(disc)) return false;
      }

      // Action Bucket Filter
      if (actionBucket === 'needs_drafting') {
        const isDrafting = (item.status === 'in_progress' || item.status === 'received') &&
          !['C', 'B'].includes(item.consultant_status);
        if (!isDrafting) return false;
      } else if (actionBucket === 'consultant_revisions') {
        if (!['C', 'B'].includes(item.consultant_status) || item.status === 'ready_to_return') return false;
      } else if (actionBucket === 'pending_manager') {
        if (item.status !== 'ready_to_return' || item.to_manager_approved) return false;
      } else if (actionBucket === 'approved') {
        if (!['A', 'B'].includes(item.consultant_status) && item.progress_pct !== 100) return false;
      } else if (actionBucket === 'blocked') {
        if (item.status !== 'blocked' && !item.blocked_reason) return false;
      }

      // Secondary Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'in_progress' && item.status !== 'in_progress' && item.status !== 'received') return false;
        if (statusFilter === 'blocked' && item.status !== 'blocked' && !item.blocked_reason) return false;
        if (statusFilter === 'ready_to_return' && item.status !== 'ready_to_return') return false;
        if (statusFilter === 'approved' && !['A', 'B'].includes(item.consultant_status) && item.progress_pct !== 100) return false;
      }

      // Consultant Code filter
      if (codeFilter !== 'all') {
        if (item.consultant_status !== codeFilter) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const sheet = (item.sheet_number || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const pkgRef = (item.parentPackage?.ref_code || '').toLowerCase();
        return sheet.includes(q) || desc.includes(q) || pkgRef.includes(q);
      }

      return true;
    });
  }, [scopedItems, specialtyGroup, actionBucket, statusFilter, codeFilter, searchQuery]);

  // Quick Action Handlers
  const handleDirectSubmitForManager = async (item: DeliverableItem) => {
    try {
      await DeliverablesService.completeWorkOnItem(item.id);
      toast.success(isAr ? 'تم إرسال المخطط التنفيذي للاعتماد الداخلي لمدير المكتب الفني' : 'Submitted for TO Manager review');
      onRefresh();
    } catch {
      toast.error(isAr ? 'فشل إرسال المخطط التنفيذي' : 'Failed to submit item');
    }
  };

  const handleManagerApprove = async (item: DeliverableItem) => {
    try {
      await DeliverablesService.managerApproveItem(item.id);
      toast.success(isAr ? 'تم الاعتماد الداخلي للمخطط التنفيذي وتجهيزه للإرسال للاستشاري' : 'Approved internally');
      onRefresh();
    } catch {
      toast.error(isAr ? 'فشل الاعتماد الداخلي' : 'Approval failed');
    }
  };

  const handleClaimDrawing = async (item: DeliverableItem) => {
    if (!engineerStakeholderId) {
      toast.error(isAr ? 'لم يتم ربط حساب المهندس الخاص بك في النظام' : 'Engineer identity not linked');
      return;
    }
    setIsProcessingClaim(item.id);
    try {
      await DeliverablesService.startWorkOnItem(item.id, engineerStakeholderId);
      toast.success(isAr ? 'تم استلام المخطط التنفيذي وإضافته إلى مهامك المباشرة' : 'Drawing claimed successfully');
      onRefresh();
    } catch {
      toast.error(isAr ? 'فشل استلام المخطط التنفيذي' : 'Failed to claim drawing');
    } finally {
      setIsProcessingClaim(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Top Discipline Specialty Bar (Civil / Struct vs MEP / Aquatics) ── */}
      <div className="p-3 sm:p-4 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 ms-1">
            {isAr ? 'التخصص الهندسي:' : 'Engineering Discipline:'}
          </span>

          <button
            type="button"
            onClick={() => setSpecialtyGroup('all')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
              specialtyGroup === 'all'
                ? 'bg-teal-500 text-slate-950 font-black shadow-md shadow-teal-500/20'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>{isAr ? 'كافة التخصصات' : 'All Disciplines'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-950/40 text-current">
              {specialtyCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSpecialtyGroup('civil_struct')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
              specialtyGroup === 'civil_struct'
                ? 'bg-blue-500 text-white font-black shadow-md shadow-blue-500/20 ring-2 ring-blue-400'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>{isAr ? 'الأعمال المدنية والإنشائية' : 'Civil & Structural'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-900/60 text-white">
              {specialtyCounts.civil}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSpecialtyGroup('mep_aquatics')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
              specialtyGroup === 'mep_aquatics'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 ring-2 ring-amber-400'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? 'الكهروميكانيك والأنظمة المائية' : 'MEP & Aquatics'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-950/60 text-current">
              {specialtyCounts.mep}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSpecialtyGroup('architectural')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              specialtyGroup === 'architectural'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? 'الأعمال المعمارية وتنسيق الموقع' : 'Architectural'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 text-current">
              {specialtyCounts.arch}
            </span>
          </button>
        </div>

        {/* Scope Switcher: My Assigned Tasks vs All Project Deliverables */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-2xl border border-slate-700 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setAssignmentScope('my_tasks')}
            className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
              assignmentScope === 'my_tasks'
                ? 'bg-teal-600 text-white shadow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-teal-300" />
            <span>{isAr ? 'مهامي المكلف بها' : 'My Tasks'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-teal-900/80 text-teal-200">
              {myAssignedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAssignmentScope('all_project')}
            className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
              assignmentScope === 'all_project'
                ? 'bg-teal-600 text-white shadow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5 text-teal-300" />
            <span>{isAr ? 'كافة مخططات المشروع' : 'All Project'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-700 text-slate-300">
              {allProjectE1Items.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── 2. Top Metric Strip ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>{isAr ? 'إجمالي المخططات' : 'Total Drawings'}</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-mono font-black text-slate-900 dark:text-white">{kpis.total}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
            <span>{isAr ? 'قيد الإعداد الأولي' : 'In Drafting'}</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-mono font-black text-blue-600 dark:text-blue-400">{kpis.inProgress}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 hover:border-amber-300 dark:hover:border-amber-800 hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
            <span>{isAr ? 'ملاحظات الاستشاري' : 'Revisions (C/B)'}</span>
            <RotateCw className="w-4 h-4" />
          </div>
          <p className="text-2xl font-mono font-black text-amber-600 dark:text-amber-400">{kpis.consultantRevisions}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 hover:border-purple-300 dark:hover:border-purple-800 hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
            <span>{isAr ? 'بانتظار الاعتماد الداخلي' : 'Ready for TO Sign-off'}</span>
            <FileCheck className="w-4 h-4" />
          </div>
          <p className="text-2xl font-mono font-black text-purple-600 dark:text-purple-400">{kpis.readyForManager}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 hover:border-rose-300 dark:hover:border-rose-800 hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400">
            <span>{isAr ? 'معطل بعائق فني' : 'Blocked'}</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-mono font-black text-rose-600 dark:text-rose-400">{kpis.blocked}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span>{isAr ? 'معتمد من الاستشاري' : 'Approved (A/B)'}</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400">{kpis.approved}</p>
        </div>
      </div>

      {/* ── 3. Operational Action Buckets & Quick Filter Bar ─────────────── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'البحث برقم المخطط، كود الحزمة أو التوصيف...' : 'Search by sheet #, ref code or description...'}
              className="w-full ps-9 pe-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            />
          </div>

          {/* View switcher & reload */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`min-h-[36px] px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                aria-label={isAr ? 'عرض جدول' : 'Table view'}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>{isAr ? 'جدول' : 'Table'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`min-h-[36px] px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                aria-label={isAr ? 'عرض بطاقات' : 'Cards view'}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{isAr ? 'بطاقات' : 'Cards'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              aria-label={isAr ? 'تحديث البيانات' : 'Refresh'}
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Buckets Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 me-1">
              {isAr ? 'المطلوب تنفيذه الآن:' : 'Action Required:'}
            </span>

            {[
              { id: 'all', labelAr: 'الكل', labelEn: 'All' },
              { id: 'needs_drafting', labelAr: 'قيد الإعداد الأولي', labelEn: 'Drafting' },
              { id: 'consultant_revisions', labelAr: 'معالجة ملاحظات الاستشاري', labelEn: 'Revisions (C/B)' },
              { id: 'pending_manager', labelAr: 'بانتظار الاعتماد الداخلي', labelEn: 'Pending Review' },
              { id: 'blocked', labelAr: 'معطل بعائق فني', labelEn: 'Blocked' },
              { id: 'approved', labelAr: 'معتمد من الاستشاري', labelEn: 'Approved' },
            ].map((bucket) => (
              <button
                key={bucket.id}
                type="button"
                onClick={() => setActionBucket(bucket.id as TOActionBucket)}
                className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  actionBucket === bucket.id
                    ? 'bg-teal-700 text-white border-teal-700 shadow-sm font-black'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {isAr ? bucket.labelAr : bucket.labelEn}
              </button>
            ))}
          </div>

          {/* Consultant Code Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={codeFilter}
              onChange={(e) => setCodeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium font-mono cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <option value="all">{isAr ? 'كافة أكواد الاستشاري' : 'All Consultant Codes'}</option>
              <option value="A">{isAr ? 'كود أ (معتمد)' : 'Code A (Approved)'}</option>
              <option value="B">{isAr ? 'كود ب (معتمد بملاحظات)' : 'Code B (Approved as Noted)'}</option>
              <option value="C">{isAr ? 'كود ج (مراجعة وإعادة تقديم)' : 'Code C (Revise & Resubmit)'}</option>
              <option value="D">{isAr ? 'كود د (مرفوض)' : 'Code D (Rejected)'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 4. Main Table / Cards View ──────────────────────────────────── */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <Layers className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {isAr ? 'لا توجد مخططات تنفيذية مطابقة لخيارات التصفية المحددة' : 'No shop drawings matching filters'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {assignmentScope === 'my_tasks' && myAssignedCount === 0
              ? (isAr
                  ? 'لم يتم تكليفك بأي مخطط تنفيذي بشكل مباشر حتى الآن في هذا المشروع. يمكنك الضغط على زر "كافة مخططات المشروع" في الأعلى لاستعراض المخططات واستلام مهامك.'
                  : 'No tasks currently assigned to you in this project. Switch to "All Project" above to claim drawings.')
              : (isAr ? 'يرجى تجربة تعديل محددات التخصص الهندسي أو حالة الإجراء المطلوب.' : 'Adjust active filters or specialty selection.')}
          </p>

          {assignmentScope === 'my_tasks' && (
            <button
              type="button"
              onClick={() => setAssignmentScope('all_project')}
              className="mt-2 px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition shadow-sm inline-flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>{isAr ? 'عرض كافة مخططات المشروع' : 'View All Project Drawings'}</span>
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                  <th className="py-3 px-3.5 text-start">{isAr ? 'رقم المخطط التنفيذي' : 'Sheet #'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'التخصص الهندسي' : 'Discipline'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'التوصيف ومسؤول الإعداد' : 'Description & Drafter'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'المراجعة' : 'Rev'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'نسبة الإنجاز' : 'Progress'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'حالة الاعتماد' : 'Status & Approval'}</th>
                  <th className="py-3 px-3.5 text-end">{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.map((item) => {
                  const disc = detectDeliverableDiscipline(item);
                  const progress = item.progress_pct ?? 0;
                  const isBlocked = item.status === 'blocked' || Boolean(item.blocked_reason);
                  const isReady = item.status === 'ready_to_return' && !item.to_manager_approved;
                  const isAssignedToMe = Boolean(engineerStakeholderId && item.assigned_stakeholder_id === engineerStakeholderId);
                  const isUnassigned = !item.assigned_stakeholder_id;
                  const assignedName = getAssignedEngineerName(item);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150"
                    >
                      <td className="py-3 px-3.5">
                        <span
                          className="inline-block font-mono font-bold text-xs px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
                          dir="ltr"
                        >
                          {item.sheet_number || (isAr ? 'غير محدد' : 'N/A')}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <TODisciplineBadge discipline={disc} />
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{item.description}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {item.parentPackage?.ref_code && (
                            <span className="text-[10px] text-slate-400 font-mono font-medium">
                              {item.parentPackage.ref_code}
                            </span>
                          )}
                          {assignedName && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/70 inline-flex items-center gap-1">
                              <User className="w-2.5 h-2.5" />
                              <span>{assignedName}</span>
                            </span>
                          )}
                          {isAssignedToMe && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                              {isAr ? 'مكلف بها' : 'My Task'}
                            </span>
                          )}
                          {isUnassigned && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                              {isAr ? 'غير مسند' : 'Unassigned'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block font-mono font-bold text-xs px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                          Rev.{item.current_rev ?? 0}
                        </span>
                      </td>
                      <td className="py-3 px-3 w-36">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isBlocked
                                  ? 'bg-rose-500'
                                  : progress >= 100
                                  ? 'bg-emerald-500'
                                  : 'bg-teal-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <TOConsultantStatusBadge
                          code={item.consultant_status}
                          status={item.status}
                          isReadyForManager={isReady}
                          isManagerApproved={item.to_manager_approved}
                          isBlocked={isBlocked}
                        />
                      </td>
                      <td className="py-3 px-3.5 text-end">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Claim task button if unassigned */}
                          {isUnassigned && engineerStakeholderId && (
                            <button
                              type="button"
                              onClick={() => handleClaimDrawing(item)}
                              disabled={isProcessingClaim === item.id}
                              title={isAr ? 'استلام وتكليف نفسي بالمخطط التنفيذي' : 'Claim drawing task'}
                              className="min-h-[34px] px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 transition-colors flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>{isAr ? 'استلام المهمة' : 'Claim'}</span>
                            </button>
                          )}

                          {/* Progress Update button */}
                          <button
                            type="button"
                            onClick={() => setSelectedItemForProgress(item)}
                            className="min-h-[34px] px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                          >
                            {isAr ? 'تحديث الإنجاز' : 'Update %'}
                          </button>

                          {/* Blocker button */}
                          <button
                            type="button"
                            onClick={() => setSelectedItemForObstruction(item)}
                            className="min-h-[34px] px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                          >
                            {isAr ? 'تسجيل عائق' : 'Obstruction'}
                          </button>

                          {/* History / Audit Log */}
                          <button
                            type="button"
                            onClick={() => {
                              setHistoryItemId(item.id);
                              setHistoryItemTitle(`${item.sheet_number || ''} - ${item.description || ''}`);
                            }}
                            title={isAr ? 'سجل الحركات والمراجعات الفنية' : 'Event History & Timeline'}
                            className="min-h-[34px] px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                          >
                            <History className="w-3.5 h-3.5 text-slate-500" />
                            <span className="hidden xl:inline">{isAr ? 'السجل' : 'Log'}</span>
                          </button>

                          {/* Submit for TO Manager */}
                          {!isReady && !item.to_manager_approved && (
                            <button
                              type="button"
                              onClick={() => handleDirectSubmitForManager(item)}
                              title={isAr ? 'إرسال للاعتماد الداخلي لمدير المكتب الفني' : 'Submit for Manager Sign-off'}
                              className="min-h-[34px] px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                            >
                              <Send className="w-3 h-3" />
                              <span>{isAr ? 'تسليم داخلي' : 'Submit'}</span>
                            </button>
                          )}

                          {/* Manager Quick Approve */}
                          {isManager && isReady && (
                            <button
                              type="button"
                              onClick={() => handleManagerApprove(item)}
                              className="min-h-[34px] px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            >
                              <Check className="w-3 h-3" />
                              <span>{isAr ? 'اعتماد' : 'Approve'}</span>
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
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const disc = detectDeliverableDiscipline(item);
            const progress = item.progress_pct ?? 0;
            const isBlocked = item.status === 'blocked' || Boolean(item.blocked_reason);
            const isReady = item.status === 'ready_to_return' && !item.to_manager_approved;
            const isAssignedToMe = Boolean(engineerStakeholderId && item.assigned_stakeholder_id === engineerStakeholderId);
            const isUnassigned = !item.assigned_stakeholder_id;

            return (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="inline-block font-mono font-bold text-xs px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
                      dir="ltr"
                    >
                      {item.sheet_number || (isAr ? 'غير محدد' : 'N/A')}
                    </span>
                    <TODisciplineBadge discipline={disc} />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                      {item.description}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-slate-400 font-mono font-medium">
                        Rev.{item.current_rev ?? 0} • {item.parentPackage?.ref_code}
                      </span>
                      {isAssignedToMe && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                          {isAr ? 'مكلف بها' : 'My Task'}
                        </span>
                      )}
                      {isUnassigned && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                          {isAr ? 'غير مسند' : 'Unassigned'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
                      <span>{isAr ? 'نسبة الإنجاز' : 'Progress'}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isBlocked ? 'bg-rose-500' : progress >= 100 ? 'bg-emerald-500' : 'bg-teal-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <TOConsultantStatusBadge
                      code={item.consultant_status}
                      status={item.status}
                      isReadyForManager={isReady}
                      isManagerApproved={item.to_manager_approved}
                      isBlocked={isBlocked}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  {isUnassigned && engineerStakeholderId && (
                    <button
                      type="button"
                      onClick={() => handleClaimDrawing(item)}
                      disabled={isProcessingClaim === item.id}
                      className="min-h-[38px] px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{isAr ? 'استلام المهمة' : 'Claim'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedItemForProgress(item)}
                    className="min-h-[38px] px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    {isAr ? 'تحديث الإنجاز' : 'Update %'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedItemForObstruction(item)}
                    className="min-h-[38px] px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  >
                    {isAr ? 'تسجيل عائق' : 'Obstruction'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setHistoryItemId(item.id);
                      setHistoryItemTitle(`${item.sheet_number || ''} - ${item.description || ''}`);
                    }}
                    title={isAr ? 'سجل الحركات والمراجعات الفنية' : 'Event History & Timeline'}
                    className="min-h-[38px] px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isAr ? 'السجل' : 'Log'}</span>
                  </button>

                  {!isReady && !item.to_manager_approved && (
                    <button
                      type="button"
                      onClick={() => handleDirectSubmitForManager(item)}
                      className="min-h-[38px] px-3 py-1.5 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تسليم داخلي' : 'Submit'}</span>
                    </button>
                  )}

                  {isManager && isReady && (
                    <button
                      type="button"
                      onClick={() => handleManagerApprove(item)}
                      className="min-h-[38px] px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isAr ? 'اعتماد' : 'Approve'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <TOProgressUpdateModal
        isOpen={Boolean(selectedItemForProgress)}
        item={selectedItemForProgress}
        onClose={() => setSelectedItemForProgress(null)}
        onSuccess={onRefresh}
      />

      <TOObstructionModal
        isOpen={Boolean(selectedItemForObstruction)}
        item={selectedItemForObstruction}
        onClose={() => setSelectedItemForObstruction(null)}
        onSuccess={onRefresh}
      />

      {/* Sequential Event History & Audit Log Drawer */}
      <HistoryDrawer
        isOpen={Boolean(historyItemId)}
        onClose={() => setHistoryItemId(null)}
        entityId={historyItemId}
        entityTitle={historyItemTitle}
        mode="deliverable"
      />
    </div>
  );
};
