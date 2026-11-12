'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  PackageCheck,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCw,
  Send,
  Check,
  Box,
  Building2,
  Calendar,
  Layers,
  Zap,
  FolderKanban,
  UserCheck,
  User,
  History,
} from 'lucide-react';
import { Deliverable, DeliverableItem } from '@/types/planning';
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
} from './TODisciplineBadge';
import { TOConsultantStatusBadge } from './TOConsultantStatusBadge';
import { TOProgressUpdateModal } from './TOProgressUpdateModal';
import { TOObstructionModal } from './TOObstructionModal';
import { toast } from 'sonner';

export type TOMaterialSpecialty = 'all' | 'civil_materials' | 'mep_aquatics_equipment';
export type TOMaterialActionBucket = 'all' | 'sample_prep' | 'consultant_revisions' | 'ready_for_manager' | 'approved' | 'blocked';
export type TOMaterialAssignmentScope = 'my_tasks' | 'all_project';

export interface E2MaterialSubmittalsTrackerProps {
  projectId: string;
  selectedProjectId?: string;
  deliverables: Deliverable[];
  isLoading: boolean;
  onRefresh: () => void;
  engineerStakeholderId?: string | null;
  isManager?: boolean;
}

function getSubcontractorName(sub: any): string {
  if (!sub) return '';
  return (
    sub.company_name ||
    sub.subcontractor_name ||
    sub.vendor_name ||
    sub.name ||
    sub.full_name ||
    ''
  ).trim();
}

function getSubcontractorSpecialty(sub: any): string {
  if (!sub) return '';
  return (
    sub.specialty ||
    sub.trade ||
    sub.scope_of_work ||
    sub.discipline ||
    sub.work_type ||
    'توريد مواد ومعدات'
  ).trim();
}

function getSubcontractorClassification(sub: any): string {
  if (!sub) return '';
  return (
    sub.classification ||
    sub.grade ||
    sub.category ||
    sub.tier ||
    sub.party_type ||
    'معتمد'
  ).trim();
}

export const E2MaterialSubmittalsTracker: React.FC<E2MaterialSubmittalsTrackerProps> = ({
  projectId,
  selectedProjectId: selectedProjectIdProp,
  deliverables,
  isLoading,
  onRefresh,
  engineerStakeholderId,
  isManager = false,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const selectedProjectId = selectedProjectIdProp || projectId;

  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyGroup, setSpecialtyGroup] = useState<TOMaterialSpecialty>('all');
  const [actionBucket, setActionBucket] = useState<TOMaterialActionBucket>('all');
  const [assignmentScope, setAssignmentScope] = useState<TOMaterialAssignmentScope>('all_project');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [codeFilter, setCodeFilter] = useState<string>('all');

  const [selectedItemForProgress, setSelectedItemForProgress] = useState<DeliverableItem | null>(null);
  const [selectedItemForObstruction, setSelectedItemForObstruction] = useState<DeliverableItem | null>(null);
  const [isProcessingClaim, setIsProcessingClaim] = useState<string | null>(null);
  const [historyItemId, setHistoryItemId] = useState<string | null>(null);
  const [historyItemTitle, setHistoryItemTitle] = useState<string>('');

  const [projectSubcontractors, setProjectSubcontractors] = useState<any[]>([]);
  const [isLoadingSubcontractors, setIsLoadingSubcontractors] = useState(false);
  const [linkedVendorByItemId, setLinkedVendorByItemId] = useState<Record<string, string>>({});
  const [quickLinkItemId, setQuickLinkItemId] = useState<string>('');
  const [quickLinkVendorName, setQuickLinkVendorName] = useState<string>('');
  const [stakeholderNameById, setStakeholderNameById] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!selectedProjectId || selectedProjectId === 'all') {
      setProjectSubcontractors([]);
      setStakeholderNameById({});
      return;
    }

    let cancelled = false;
    setIsLoadingSubcontractors(true);

    ProjectService.getProjectStakeholders(selectedProjectId)
      .then((rows) => {
        if (!cancelled && Array.isArray(rows)) {
          const map: Record<string, string> = {};
          rows.forEach((ps: any) => {
            const stk = ps.stakeholder || ps;
            const id = stk?.id || ps.stakeholder_id;
            if (id) {
              map[id] = stk?.name_ar || stk?.name_en || '';
            }
          });
          setStakeholderNameById(map);
        }
      })
      .catch(() => {
        if (!cancelled) setStakeholderNameById({});
      });

    ProjectService.getProjectSubcontractors(selectedProjectId)
      .then((subs) => {
        if (!cancelled && Array.isArray(subs)) {
          setProjectSubcontractors(subs);
          if (subs.length > 0) {
            const firstVendor = getSubcontractorName(subs[0]);
            if (firstVendor) setQuickLinkVendorName(firstVendor);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProjectSubcontractors([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingSubcontractors(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedProjectId]);

  const getAssignedEngineerName = (item: DeliverableItem): string => {
    if (item.assigned_stakeholder?.name_ar) return item.assigned_stakeholder.name_ar;
    if (item.assigned_stakeholder?.name_en) return item.assigned_stakeholder.name_en;
    if (item.assigned_stakeholder_id && stakeholderNameById[item.assigned_stakeholder_id]) {
      return stakeholderNameById[item.assigned_stakeholder_id];
    }
    return '';
  };

  // Extract all material items from E2 deliverables across project
  const allProjectE2Items = useMemo(() => {
    const list: (DeliverableItem & { parentPackage?: Deliverable })[] = [];
    deliverables
      .filter((d) => d.kind === 'E2' || d.kind === 'material_list')
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
    return allProjectE2Items.filter((i) => i.assigned_stakeholder_id === engineerStakeholderId).length;
  }, [allProjectE2Items, engineerStakeholderId]);

  // Auto-switch scope default
  useEffect(() => {
    if (!isManager && engineerStakeholderId && myAssignedCount > 0) {
      setAssignmentScope('my_tasks');
    } else {
      setAssignmentScope('all_project');
    }
  }, [engineerStakeholderId, myAssignedCount, isManager]);

  // Scoped items
  const scopedItems = useMemo(() => {
    if (assignmentScope === 'my_tasks' && engineerStakeholderId) {
      return allProjectE2Items.filter((i) => i.assigned_stakeholder_id === engineerStakeholderId);
    }
    return allProjectE2Items;
  }, [allProjectE2Items, assignmentScope, engineerStakeholderId]);

  // Compute material counts by specialty
  const specialtyCounts = useMemo(() => {
    let civil = 0;
    let mep = 0;
    scopedItems.forEach((item) => {
      const disc = detectDeliverableDiscipline(item);
      if (isCivilOrStructuralDiscipline(disc) || disc === 'architectural') civil++;
      else if (isMepOrAquaticsDiscipline(disc)) mep++;
    });
    return {
      all: scopedItems.length,
      civil,
      mep,
    };
  }, [scopedItems]);

  // Compute KPIs
  const kpis = useMemo(() => {
    const total = scopedItems.length;
    const inProgress = scopedItems.filter((i) => i.status === 'in_progress' || i.status === 'received').length;
    const blocked = scopedItems.filter((i) => i.status === 'blocked' || Boolean(i.blocked_reason)).length;
    const readyForManager = scopedItems.filter((i) => i.status === 'ready_to_return' && !i.to_manager_approved).length;
    const consultantRevisions = scopedItems.filter((i) => ['C', 'B'].includes(i.consultant_status) && i.status !== 'ready_to_return').length;
    const approved = scopedItems.filter((i) => ['A', 'B'].includes(i.consultant_status) || i.progress_pct === 100).length;
    return { total, inProgress, blocked, readyForManager, consultantRevisions, approved };
  }, [scopedItems]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return scopedItems.filter((item) => {
      const disc = detectDeliverableDiscipline(item);

      // Specialty Group Filter
      if (specialtyGroup === 'civil_materials') {
        if (!isCivilOrStructuralDiscipline(disc) && disc !== 'architectural') return false;
      } else if (specialtyGroup === 'mep_aquatics_equipment') {
        if (!isMepOrAquaticsDiscipline(disc)) return false;
      }

      // Action Bucket Filter
      if (actionBucket === 'sample_prep') {
        const isPrep = (item.status === 'in_progress' || item.status === 'received') &&
          !['C', 'B'].includes(item.consultant_status);
        if (!isPrep) return false;
      } else if (actionBucket === 'consultant_revisions') {
        if (!['C', 'B'].includes(item.consultant_status) || item.status === 'ready_to_return') return false;
      } else if (actionBucket === 'ready_for_manager') {
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

      // Code filter
      if (codeFilter !== 'all') {
        if (item.consultant_status !== codeFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const desc = (item.description || '').toLowerCase();
        const ref = (item.parentPackage?.ref_code || '').toLowerCase();
        const sheet = (item.sheet_number || '').toLowerCase();
        return desc.includes(q) || ref.includes(q) || sheet.includes(q);
      }

      return true;
    });
  }, [scopedItems, specialtyGroup, actionBucket, statusFilter, codeFilter, searchQuery]);

  const getLinkedVendorForItem = (item: DeliverableItem): string => {
    if (linkedVendorByItemId[item.id] !== undefined) {
      return linkedVendorByItemId[item.id];
    }
    if ((item as any).preferred_vendor) {
      return String((item as any).preferred_vendor);
    }
    const vendorEntry = item.rev_history
      ?.slice()
      .reverse()
      .find(
        (r: any) =>
          typeof r?.notes === 'string' &&
          (r.notes.startsWith('المورد المعتمد:') || r.notes.startsWith('Preferred Vendor:'))
      );
    if (vendorEntry?.notes) {
      return vendorEntry.notes
        .replace(/^المورد المعتمد:\s*/, '')
        .replace(/^Preferred Vendor:\s*/, '')
        .trim();
    }
    return '';
  };

  const handleLinkVendorToMaterial = async (item: DeliverableItem, vendorName: string) => {
    const cleanVendor = vendorName.trim();
    setLinkedVendorByItemId((prev) => ({
      ...prev,
      [item.id]: cleanVendor,
    }));

    if (!cleanVendor) return;

    try {
      const archivedRev = {
        rev: item.current_rev ?? 0,
        date: new Date().toISOString(),
        by: 'TO Material Engineer',
        notes: `المورد المعتمد: ${cleanVendor}`,
      };
      const updatedHistory = [...(item.rev_history || []), archivedRev];
      await DeliverablesService.saveDeliverableItem({
        id: item.id,
        deliverable_id: item.deliverable_id,
        rev_history: updatedHistory,
      });
      toast.success(
        isAr
          ? `تم ربط اعتماد المادة بالمورد المعتمد (${cleanVendor})`
          : `Linked material submittal with vendor (${cleanVendor})`
      );
      onRefresh();
    } catch {
      toast.success(
        isAr
          ? `تم حفظ ربط المورد المعتمد (${cleanVendor}) محلياً`
          : `Saved preferred vendor (${cleanVendor}) locally`
      );
    }
  };

  const handleDirectSubmitForManager = async (item: DeliverableItem) => {
    try {
      await DeliverablesService.completeWorkOnItem(item.id);
      toast.success(isAr ? 'تم إرسال اعتماد المادة للاعتماد الداخلي لمدير المكتب الفني' : 'Submitted for Manager Sign-off');
      onRefresh();
    } catch {
      toast.error(isAr ? 'فشل إرسال اعتماد المادة' : 'Submission failed');
    }
  };

  const handleManagerApprove = async (item: DeliverableItem) => {
    try {
      await DeliverablesService.managerApproveItem(item.id);
      toast.success(isAr ? 'تم اعتماد المادة داخلياً وتجهيزها للإرسال للاستشاري' : 'Approved internally');
      onRefresh();
    } catch {
      toast.error(isAr ? 'فشل الاعتماد' : 'Approval failed');
    }
  };

  const handleClaimMaterial = async (item: DeliverableItem) => {
    if (!engineerStakeholderId) {
      toast.error(isAr ? 'لم يتم ربط حساب المهندس الخاص بك في النظام' : 'Engineer identity not linked');
      return;
    }
    setIsProcessingClaim(item.id);
    try {
      await DeliverablesService.startWorkOnItem(item.id, engineerStakeholderId);
      toast.success(isAr ? 'تم استلام اعتماد المادة بنجاح' : 'Material submittal claimed');
      onRefresh();
    } catch {
      toast.error(isAr ? 'فشل استلام المادة' : 'Failed to claim material submittal');
    } finally {
      setIsProcessingClaim(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Top Specialty & Scope Navigation ────────────────────────── */}
      <div className="p-3 sm:p-4 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 ms-1">
            {isAr ? 'تصنيف التخصص:' : 'Material Discipline:'}
          </span>

          <button
            type="button"
            onClick={() => setSpecialtyGroup('all')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 flex items-center gap-1.5 active:scale-[0.98] ${
              specialtyGroup === 'all'
                ? 'bg-teal-500 text-slate-950 font-black shadow-md shadow-teal-500/20'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>{isAr ? 'كافة المواد والمعدات' : 'All Materials'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-950/40 text-current">
              {specialtyCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSpecialtyGroup('civil_materials')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 flex items-center gap-1.5 active:scale-[0.98] ${
              specialtyGroup === 'civil_materials'
                ? 'bg-blue-500 text-white font-black shadow-md shadow-blue-500/20 ring-2 ring-blue-400'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>{isAr ? 'الأعمال المدنية والمعمارية والتشطيبات' : 'Civil & Architectural'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-900/60 text-white">
              {specialtyCounts.civil}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSpecialtyGroup('mep_aquatics_equipment')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 flex items-center gap-1.5 active:scale-[0.98] ${
              specialtyGroup === 'mep_aquatics_equipment'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 ring-2 ring-amber-400'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? 'الأعمال الكهروميكانيكية والأنظمة المائية' : 'MEP & Aquatics'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-950/60 text-current">
              {specialtyCounts.mep}
            </span>
          </button>
        </div>

        {/* Scope Switcher: My Assigned Tasks vs All Project Materials */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-2xl border border-slate-700 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setAssignmentScope('my_tasks')}
            className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 flex items-center gap-1.5 active:scale-[0.98] ${
              assignmentScope === 'my_tasks'
                ? 'bg-teal-600 text-white shadow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-teal-300" />
            <span>{isAr ? 'اعتماداتي المكلف بها' : 'My Materials'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-teal-900/80 text-teal-200">
              {myAssignedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAssignmentScope('all_project')}
            className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 flex items-center gap-1.5 active:scale-[0.98] ${
              assignmentScope === 'all_project'
                ? 'bg-teal-600 text-white shadow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5 text-teal-300" />
            <span>{isAr ? 'كافة اعتمادات المشروع' : 'All Project'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-700 text-slate-300">
              {allProjectE2Items.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── 1B. Project Subcontractors & Vendors Bar ── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                {isAr ? 'الموردون ومقاولو الباطن المعتمدون بالمشروع' : 'Approved Vendors & Subcontractors'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'ربط طلبات اعتماد المواد بالموردين ومقاولي الباطن المعتمدين والمدرجين في بيانات المشروع'
                  : 'Link Material Approval Requests with registered project vendors and subcontractors'}
              </p>
            </div>
          </div>

          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 self-start sm:self-auto">
            {projectSubcontractors.length} {isAr ? 'جهة معتمدة' : 'Vendors'}
          </span>
        </div>

        {isLoadingSubcontractors ? (
          <div className="text-xs text-slate-400 py-1">
            {isAr ? 'جاري تحميل قائمة الموردين ومقاولي الباطن المعتمدين...' : 'Loading project subcontractors...'}
          </div>
        ) : projectSubcontractors.length === 0 ? (
          <div className="text-xs text-slate-400 py-1">
            {isAr
              ? 'لا يوجد موردون أو مقاولو باطن مسجلون لهذا المشروع حالياً.'
              : 'No registered subcontractors or vendors for this project.'}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {projectSubcontractors.map((sub, idx) => {
                const name = getSubcontractorName(sub) || `مورد #${idx + 1}`;
                const specialty = getSubcontractorSpecialty(sub);
                const classification = getSubcontractorClassification(sub);
                return (
                  <div
                    key={sub.id || idx}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-teal-500/40 transition-colors flex items-center gap-2 text-xs"
                  >
                    <Building2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="font-bold text-slate-900 dark:text-white">{name}</span>
                    {specialty && (
                      <span className="px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                        {specialty}
                      </span>
                    )}
                    {classification && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold">
                        {classification}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {allProjectE2Items.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  {isAr ? 'ربط سريع لاعتماد مادة بمورد معتمد:' : 'Quick link to vendor:'}
                </span>
                <select
                  value={quickLinkItemId}
                  onChange={(e) => setQuickLinkItemId(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  <option value="">{isAr ? '-- اختر طلب اعتماد المادة --' : '-- Select Submittal --'}</option>
                  {allProjectE2Items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.sheet_number || it.parentPackage?.ref_code || ''} {it.sheet_number || it.parentPackage?.ref_code ? '-' : ''} {it.description}
                    </option>
                  ))}
                </select>
                <select
                  value={quickLinkVendorName}
                  onChange={(e) => setQuickLinkVendorName(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  {projectSubcontractors.map((sub, idx) => {
                    const name = getSubcontractorName(sub) || `مورد #${idx + 1}`;
                    return (
                      <option key={sub.id || idx} value={name}>
                        {name} ({getSubcontractorSpecialty(sub)})
                      </option>
                    );
                  })}
                </select>
                <button
                  type="button"
                  disabled={!quickLinkItemId || !quickLinkVendorName}
                  onClick={() => {
                    const targetItem = allProjectE2Items.find((i) => i.id === quickLinkItemId);
                    if (targetItem && quickLinkVendorName) {
                      handleLinkVendorToMaterial(targetItem, quickLinkVendorName);
                    }
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-[0.98]"
                >
                  {isAr ? 'ربط المورد بالاعتماد' : 'Link Vendor'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 2. Metric Strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>{isAr ? 'إجمالي اعتمادات المواد' : 'Total Submittals'}</span>
            <Box className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-mono font-black text-slate-900 dark:text-white">{kpis.total}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
            <span>{isAr ? 'تجهيز العينات والمواصفات' : 'Sample Preparation'}</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-mono font-black text-blue-600 dark:text-blue-400">{kpis.inProgress}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
            <span>{isAr ? 'ملاحظات ومراجعات الاستشاري' : 'Consultant Revisions'}</span>
            <RotateCw className="w-4 h-4" />
          </div>
          <p className="text-2xl font-mono font-black text-amber-600 dark:text-amber-400">{kpis.consultantRevisions}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
            <span>{isAr ? 'بانتظار الاعتماد الداخلي' : 'Ready for Sign-off'}</span>
            <PackageCheck className="w-4 h-4" />
          </div>
          <p className="text-2xl font-mono font-black text-purple-600 dark:text-purple-400">{kpis.readyForManager}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400">
            <span>{isAr ? 'مرفوض أو متعثر (نقص عينات)' : 'Blocked / Sample Issue'}</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-mono font-black text-rose-600 dark:text-rose-400">{kpis.blocked}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span>{isAr ? 'معتمد من الاستشاري' : 'Consultant Approved'}</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400">{kpis.approved}</p>
        </div>
      </div>

      {/* ── 3. Operational Action Buckets & Filters ─────────────────────── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث برمز اعتماد المادة أو الوصف الفني أو المورد...' : 'Search material, ref code or supplier...'}
              className="w-full ps-9 pe-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-95"
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
              {isAr ? 'الإجراء المطلوب إنجازه:' : 'Action Required:'}
            </span>

            {[
              { id: 'all', labelAr: 'الكل', labelEn: 'All' },
              { id: 'sample_prep', labelAr: 'تجهيز العينات والمواصفات', labelEn: 'Sample Prep' },
              { id: 'consultant_revisions', labelAr: 'استيفاء ملاحظات الاستشاري', labelEn: 'Revisions' },
              { id: 'ready_for_manager', labelAr: 'بانتظار الاعتماد الداخلي', labelEn: 'Pending Review' },
              { id: 'blocked', labelAr: 'معطل أو نقص عينات', labelEn: 'Blocked' },
              { id: 'approved', labelAr: 'معتمد نهائياً أو بملاحظات', labelEn: 'Approved' },
            ].map((bucket) => (
              <button
                key={bucket.id}
                type="button"
                onClick={() => setActionBucket(bucket.id as TOMaterialActionBucket)}
                className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-[0.98] ${
                  actionBucket === bucket.id
                    ? 'bg-teal-700 text-white border-teal-700 shadow-sm font-black'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                {isAr ? bucket.labelAr : bucket.labelEn}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={codeFilter}
              onChange={(e) => setCodeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium font-mono cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <option value="all">{isAr ? 'كافة قرارات الاستشاري' : 'All Consultant Decisions'}</option>
              <option value="A">{isAr ? 'الفئة (أ) - معتمد كلياً' : 'Code A (Approved)'}</option>
              <option value="B">{isAr ? 'الفئة (ب) - معتمد مع أخذ الملاحظات' : 'Code B (Approved as Noted)'}</option>
              <option value="C">{isAr ? 'الفئة (ج) - استيفاء ملاحظات وإعادة تقديم' : 'Code C (Revise & Resubmit)'}</option>
              <option value="D">{isAr ? 'الفئة (د) - مرفوض تماماً' : 'Code D (Rejected)'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 4. Material Submittals Table ────────────────────────────────── */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <Box className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {isAr ? 'لا توجد اعتمادات مواد مطابقة لمعايير البحث المحددة' : 'No material submittals found'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {assignmentScope === 'my_tasks' && myAssignedCount === 0
              ? (isAr
                  ? 'لم يتم تكليفك بأي اعتماد مواد مباشرة حتى الآن. اضغط على زر "كافة اعتمادات المشروع" لاستعراض المواد واستلامها.'
                  : 'No materials currently assigned to you in this project. Switch to "All Project" above to claim items.')
              : (isAr ? 'يمكنك تعديل معايير البحث أو اختيار تخصص وفلاتر أخرى.' : 'Adjust search terms or active filters.')}
          </p>

          {assignmentScope === 'my_tasks' && (
            <button
              type="button"
              onClick={() => setAssignmentScope('all_project')}
              className="mt-2 px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition shadow-sm inline-flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-[0.98]"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>{isAr ? 'عرض كافة اعتمادات المشروع' : 'View All Project Materials'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                  <th className="py-3 px-3.5 text-start">{isAr ? 'رمز الاعتماد' : 'Submittal Ref'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'التخصص الهندسي' : 'Discipline'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'المادة والمواصفة الفنية' : 'Material Description'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'رقم الإصدار' : 'Rev'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'نسبة الإنجاز' : 'Progress'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'حالة الاعتماد' : 'Approval Status'}</th>
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
                  const linkedVendor = getLinkedVendorForItem(item);
                  const assignedName = getAssignedEngineerName(item);

                  return (
                    <tr key={item.id} className="hover:bg-teal-50/40 dark:bg-teal-950/40 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900 dark:text-white" dir="ltr">
                        {item.sheet_number || item.parentPackage?.ref_code || (isAr ? 'غير محدد' : 'N/A')}
                      </td>
                      <td className="py-3 px-3">
                        <TODisciplineBadge discipline={disc} />
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{item.description}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {assignedName && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/70 inline-flex items-center gap-1">
                              <User className="w-2.5 h-2.5" />
                              <span>{assignedName}</span>
                            </span>
                          )}
                          {isAssignedToMe && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                              {isAr ? 'مكلف لي' : 'My Task'}
                            </span>
                          )}
                          {isUnassigned && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                              {isAr ? 'غير مسند' : 'Unassigned'}
                            </span>
                          )}
                          {linkedVendor && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 inline-flex items-center gap-1">
                              <Building2 className="w-2.5 h-2.5" />
                              <span>{linkedVendor}</span>
                            </span>
                          )}
                          {projectSubcontractors.length > 0 && (
                            <select
                              value={linkedVendor}
                              onChange={(e) => handleLinkVendorToMaterial(item, e.target.value)}
                              className="text-[10px] px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                            >
                              <option value="">{isAr ? '+ ربط مورد معتمد' : '+ Link Vendor'}</option>
                              {projectSubcontractors.map((sub, idx) => {
                                const vName = getSubcontractorName(sub) || `مورد #${idx + 1}`;
                                return (
                                  <option key={sub.id || idx} value={vName}>
                                    {vName}
                                  </option>
                                );
                              })}
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-600 dark:text-slate-300">
                        {isAr ? `إصدار ${item.current_rev ?? 0}` : `Rev.${item.current_rev ?? 0}`}
                      </td>
                      <td className="py-3 px-3 w-36">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono font-bold">
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
                          {isUnassigned && engineerStakeholderId && (
                            <button
                              type="button"
                              onClick={() => handleClaimMaterial(item)}
                              disabled={isProcessingClaim === item.id}
                              title={isAr ? 'استلام وتكليف نفسي بالاعتماد' : 'Claim material submittal'}
                              className="min-h-[34px] px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 transition-colors flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-[0.98]"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>{isAr ? 'استلام' : 'Claim'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedItemForProgress(item)}
                            title={isAr ? 'تحديث نسبة إنجاز اعتماد المادة' : 'Update progress percentage'}
                            className="min-h-[34px] px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-[0.98]"
                          >
                            {isAr ? 'تحديث الإنجاز' : 'Update %'}
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedItemForObstruction(item)}
                            title={isAr ? 'تسجيل عائق فني أو نقص عينات' : 'Report obstruction'}
                            className="min-h-[34px] px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-[0.98]"
                          >
                            {isAr ? 'تسجيل عائق' : 'Obstruction'}
                          </button>

                          {/* History / Audit Log */}
                          <button
                            type="button"
                            onClick={() => {
                              setHistoryItemId(item.id);
                              setHistoryItemTitle(`${item.sheet_number || item.parentPackage?.ref_code || ''} - ${item.description || ''}`);
                            }}
                            title={isAr ? 'سجل الإجراءات والمراجعات' : 'Event History & Timeline'}
                            className="min-h-[34px] px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-[0.98]"
                          >
                            <History className="w-3.5 h-3.5 text-slate-500" />
                            <span className="hidden xl:inline">{isAr ? 'السجل' : 'Log'}</span>
                          </button>

                          {!isReady && !item.to_manager_approved && (
                            <button
                              type="button"
                              onClick={() => handleDirectSubmitForManager(item)}
                              title={isAr ? 'إرسال للاعتماد الداخلي لمدير المكتب الفني' : 'Submit for manager sign-off'}
                              className="min-h-[34px] px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 active:scale-[0.98]"
                            >
                              <Send className="w-3 h-3" />
                              <span>{isAr ? 'إرسال للاعتماد' : 'Submit'}</span>
                            </button>
                          )}

                          {isManager && isReady && (
                            <button
                              type="button"
                              onClick={() => handleManagerApprove(item)}
                              title={isAr ? 'اعتماد المادة داخلياً' : 'Approve internally'}
                              className="min-h-[34px] px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-[0.98]"
                            >
                              <Check className="w-3 h-3" />
                              <span>{isAr ? 'اعتماد داخلي' : 'Approve'}</span>
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
