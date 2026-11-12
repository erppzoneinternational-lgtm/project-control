'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  FolderKanban, 
  Upload, 
  Download, 
  Plus, 
  FolderTree, 
  RefreshCw, 
  DollarSign, 
  Layers, 
  Boxes, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  SlidersHorizontal,
  X,
  Check,
  Table2,
  Scale,
  PanelRightClose,
  PanelRightOpen,
  Eye
} from 'lucide-react';
import { Project } from '@/types';
import { BoqItem, BoqPricingStatus, CostCode } from '@/types/boq';
import { ProjectService } from '@/lib/services/project.service';
import { BoqService } from '@/lib/services/boq.service';
import { BoqTable } from '@/components/planning/BoqTable';
import { BoqSheetPages } from '@/components/planning/BoqSheetPages';
import { useBoqInclusion } from '@/components/planning/useBoqInclusion';
import type { BoqSection } from '@/types/boq';
import { BoqDivisionTree } from '@/components/planning/BoqDivisionTree';
import { BoqRateAnalysisCards } from '@/components/planning/BoqRateAnalysisCards';
import { BoqLoadingSkeleton } from '@/components/planning/BoqLoadingSkeleton';
import { BoqImportWizard } from '@/components/planning/BoqImportWizard';
import { BoqMultiSheetImporter } from '@/components/planning/BoqMultiSheetImporter';
import { BoqContractReconciliationBanner } from '@/components/planning/BoqContractReconciliationBanner';
import { reconcileProjectBoqWithContract } from '@/lib/utils/boq-cost-control.utils';
import { CostCodeManager } from '@/components/planning/CostCodeManager';
import { CostCodeSelector } from '@/components/planning/CostCodeSelector';
import { HistoryDrawer } from '@/components/planning/HistoryDrawer';
import { BoqSubMaterialsModal } from '@/components/planning/BoqSubMaterialsModal';
import { PriceGate, canViewPrices } from '@/components/planning/PriceGate';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { canEditPath } from '@/lib/rbac/access-control';
import { invalidateBoqItemCaches } from '@/lib/cache';
import { toast } from 'sonner';
import { useProjectStore } from '@/lib/stores/useProjectStore';

export default function BoqPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { roles, isAdmin } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();
  const isSiteEngineer = !isAdmin && roles.some((r) => r.includes('site'));
  const canEditBoq = !isSiteEngineer && canEditPath('/boq', roles, isAdmin, dbAccessRules);

  // Global Project State & Language
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveProjectId = useProjectStore((s) => s.setActiveProjectId);
  const storeLanguage = useProjectStore((s: any) => s.language);
  const isAr = storeLanguage ? storeLanguage === 'ar' : true;
  const selectedProjectId = activeProjectId;
  const setSelectedProjectId = setActiveProjectId;



  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [items, setItems] = useState<BoqItem[]>([]);
  const [sections, setSections] = useState<BoqSection[]>([]);
  const activePage = searchParams.get('sheet') || '__all__';
  const canOmitBase = isAdmin || roles.some((r) => /admin|pm|project_manager|manager/i.test(r));
  const [inclusionFilter, setInclusionFilter] = useState<'all' | 'optional' | 'omitted'>('all');
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);

  // Master BOQ Explorer state
  const [showDivisionTree, setShowDivisionTree] = useState(true);
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<BoqPricingStatus | 'all'>('all');
  const [inspectedRateItem, setInspectedRateItem] = useState<BoqItem | null>(null);

  // Modals state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isMultiImportOpen, setIsMultiImportOpen] = useState(false);
  const [isCostCodesOpen, setIsCostCodesOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<BoqItem | null>(null);
  const [bomItem, setBomItem] = useState<BoqItem | null>(null);

  // Manual Add Item Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState<Partial<BoqItem>>({
    item_code: '',
    cost_code_id: null,
    description_ar: '',
    description_en: '',
    unit: 'm3',
    contract_qty: 0,
    rate_egp: 0,
    pricing_status: 'contract_original',
  });
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Status label translation helper (No mixed English words in Arabic mode)
  const getPricingStatusLabel = (status: string, arabic = isAr) => {
    switch (status) {
      case 'contract_original':
        return arabic ? 'عقد أصلي' : 'Contract Original';
      case 'vo_approved':
        return arabic ? 'أمر تغيير معتمد' : 'Approved Variation Order';
      case 'star_rate_provisional':
        return arabic ? 'فئة سعرية مؤقتة' : 'Provisional Rate';
      case 'disputed':
        return arabic ? 'متنازع عليه' : 'Disputed';
      case 'internal_budget_only':
        return arabic ? 'موازنة تقديرية' : 'Internal Budget Only';
      default:
        return status;
    }
  };

  // 1. Fetch Projects List
  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const data = await ProjectService.getProjects();
      setProjects(data);

      const queryPid = searchParams.get('projectId');
      if (queryPid && data.some((p) => p.id === queryPid)) {
        setActiveProjectId(queryPid);
      } else if (activeProjectId && data.some((p) => p.id === activeProjectId)) {
        const currentUrlPid = searchParams.get('projectId');
        if (currentUrlPid !== activeProjectId) {
          const qs = new URLSearchParams(searchParams.toString());
          qs.set('projectId', activeProjectId);
          router.replace(`/boq?${qs.toString()}`, { scroll: false });
        }
      } else if (data.length > 0) {
        setActiveProjectId(data[0].id);
        const qs = new URLSearchParams(searchParams.toString());
        qs.set('projectId', data[0].id);
        router.replace(`/boq?${qs.toString()}`, { scroll: false });
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Two-way sync: URL query param -> useProjectStore
  const queryParamProjectId = searchParams.get('projectId');
  useEffect(() => {
    if (queryParamProjectId && queryParamProjectId !== activeProjectId) {
      if (projects.length === 0 || projects.some((p) => p.id === queryParamProjectId)) {
        setActiveProjectId(queryParamProjectId);
      }
    }
  }, [queryParamProjectId, activeProjectId, projects, setActiveProjectId]);

  // Two-way sync: useProjectStore -> URL query param
  useEffect(() => {
    if (activeProjectId) {
      const currentUrlPid = searchParams.get('projectId');
      if (currentUrlPid !== activeProjectId) {
        const qs = new URLSearchParams(searchParams.toString());
        qs.set('projectId', activeProjectId);
        router.replace(`/boq?${qs.toString()}`, { scroll: false });
      }
    }
  }, [activeProjectId, searchParams, router]);

  // 2. Fetch BOQ Items when selectedProjectId changes
  const fetchBoqItems = async (projectId: string) => {
    if (!projectId) return;
    setLoadingItems(true);
    try {
      const [data, secs] = await Promise.all([
        BoqService.getBoqItems(projectId, true, { userRoles: roles, isAdmin }),
        BoqService.getSections(projectId),
      ]);
      setItems(data);
      setSections(secs);
    } catch (err) {
      console.error('Failed to load BOQ items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchBoqItems(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Items of the active sheet page (tab)
  const pageItems = useMemo(() => {
    let list = items;
    if (activePage === '__unassigned__') list = items.filter((i) => !i.section_id);
    else if (activePage !== '__all__') list = items.filter((i) => i.section_id === activePage);
    if (statusFilter !== 'all') list = list.filter((i) => i.pricing_status === statusFilter);
    if (inclusionFilter === 'optional') list = list.filter((i) => i.inclusion_status === 'optional_pending' || i.inclusion_status === 'optional_added');
    if (inclusionFilter === 'omitted') list = list.filter((i) => i.inclusion_status === 'omitted');
    return list;
  }, [items, activePage, statusFilter, inclusionFilter]);

  const inclusion = useBoqInclusion({
    projectId: selectedProjectId || '',
    sections,
    canEdit: canEditBoq,
    canOmitBase,
    onChanged: () => selectedProjectId && fetchBoqItems(selectedProjectId),
  });

  const changePage = (id: string) => {
    const qs = new URLSearchParams(searchParams.toString());
    if (activeProjectId) qs.set('projectId', activeProjectId);
    if (id === '__all__') qs.delete('sheet'); else qs.set('sheet', id);
    router.replace(`/boq?${qs.toString()}`);
  };

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const [isCostControlView, setIsCostControlView] = useState(false);

  const reconciliation = useMemo(() => {
    return reconcileProjectBoqWithContract(selectedProject, items);
  }, [selectedProject, items]);

  const handleFilterVoItems = () => {
    setStatusFilter('vo_approved');
    setIsCostControlView(true);
  };


  // Export to Excel
  const handleExportExcel = () => {
    if (items.length === 0) {
      toast.error(isAr ? 'لا توجد بنود لتصديرها' : 'No items to export');
      return;
    }

    const allowPrice = canViewPrices(roles, isAdmin);

    const exportRows = items.map((item) => ({
      [isAr ? 'كود البند' : 'Item Code']: item.item_code,
      [isAr ? 'كود التكلفة' : 'Cost Code']: item.cost_code?.code || '',
      [isAr ? 'الوصف بالعربية' : 'Description (AR)']: item.description_ar,
      [isAr ? 'الوصف بالإنجليزية' : 'Description (EN)']: item.description_en || '',
      [isAr ? 'وحدة القياس' : 'Unit']: item.unit,
      [isAr ? 'الكمية التعاقدية' : 'Contract Quantity']: allowPrice ? item.contract_qty : '***',
      [isAr ? 'كمية المخططات التنفيذية' : 'Shop Drawing Quantity']: allowPrice ? (item.shop_drawing_qty || '') : '***',
      [isAr ? 'حالة التسعير' : 'Pricing Status']: getPricingStatusLabel(item.pricing_status, isAr),
      [isAr ? 'الفئة بالجنيه' : 'Rate (EGP)']: allowPrice ? item.rate_egp : '***',
      [isAr ? 'إجمالي القيمة بالجنيه' : 'Total Amount (EGP)']: allowPrice ? item.amount_egp : '***',
      [isAr ? 'رقم الإصدار' : 'Revision']: `v${item.revision}`,
      [isAr ? 'ملاحظات' : 'Notes']: item.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    const safeProjectName = selectedProject?.project_name || selectedProject?.project_name_ar || 'Project';
    XLSX.utils.book_append_sheet(wb, ws, 'BOQ_Items');
    XLSX.writeFile(wb, `BOQ_${safeProjectName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(isAr ? 'تم تصدير بنود جدول الكميات بنجاح' : 'BOQ items exported successfully');
  };

  // Handle Add Item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    if (!addForm.item_code?.trim()) {
      setAddError(isAr ? 'كود البند مطلوب' : 'Item code is required');
      return;
    }
    if (!addForm.description_ar?.trim()) {
      setAddError(isAr ? 'الوصف الفني مطلوب' : 'Description is required');
      return;
    }

    setIsAdding(true);
    setAddError(null);

    try {
      const newItem = await BoqService.saveBoqItem({
        ...addForm,
        project_id: selectedProjectId,
        contract_qty: Number(addForm.contract_qty ?? 0),
        rate_egp: Number(addForm.rate_egp ?? 0),
      });

      if (!newItem) {
        setAddError(isAr ? 'تعذر إضافة البند. تأكد من عدم تكرار كود البند في هذا المشروع.' : 'Failed to add item. Ensure item code is unique in this project.');
        return;
      }

      setIsAddModalOpen(false);
      setAddForm({
        item_code: '',
        description_ar: '',
        description_en: '',
        unit: 'm3',
        contract_qty: 0,
        rate_egp: 0,
        pricing_status: 'contract_original',
      });
      invalidateBoqItemCaches(selectedProjectId, newItem.id);
      await fetchBoqItems(selectedProjectId);
    } catch (err: unknown) {
      setAddError((err as { message?: string } | null)?.message || (isAr ? 'خطأ في إضافة البند' : 'Error adding item'));
    } finally {
      setIsAdding(false);
    }
  };

  // Loading Skeleton on initial load
  if (loadingProjects || (loadingItems && items.length === 0)) {
    return (
      <div className="p-3 sm:p-5 lg:p-6 space-y-6 max-w-[1750px] w-full mx-auto">
        <BoqLoadingSkeleton showSidebar={showDivisionTree} />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-6 max-w-[1750px] w-full mx-auto">
      {/* Top Header & Project Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {isAr ? 'جدول الكميات والمقايسة التعاقدية' : 'Bill of Quantities & Contract Pricing'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'إدارة ومراجعة بنود المقايسة، شجرة بنود التكلفة، تحليل الفئات السعرية، ومطابقة العقود' : 'Master BOQ explorer, cost breakdown structure, rate analysis, and contract reconciliation'}
              </p>
            </div>
          </div>
        </div>

        {/* Project Selector Dropdown */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          <div className="relative min-w-[280px]">
            <FolderKanban className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={activeProjectId || ''}
              onChange={(e) => {
                const pid = e.target.value;
                if (pid) {
                  setActiveProjectId(pid);
                  const qs = new URLSearchParams(searchParams.toString());
                  qs.set('projectId', pid);
                  router.replace(`/boq?${qs.toString()}`);
                }

              }}
              disabled={loadingProjects}
              className="w-full ps-9 pe-4 py-2.5 rounded-2xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              {projects.length === 0 ? (
                <option value="">{isAr ? 'لا توجد مشاريع متاحة' : 'No projects available'}</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_name || p.project_name_ar} {p.project_code ? `(${p.project_code})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            onClick={() => activeProjectId && fetchBoqItems(activeProjectId)}
            disabled={loadingItems}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm transition cursor-pointer"
            title={isAr ? 'تحديث البيانات' : 'Refresh data'}
            aria-label={isAr ? 'تحديث البيانات' : 'Refresh data'}
          >
            <RefreshCw className={`w-4 h-4 ${loadingItems ? 'animate-spin text-emerald-700 dark:text-emerald-300' : ''}`} />
          </button>
        </div>
      </div>

      {/* Contract vs BOQ Reconciliation Alert & Status Banner */}
      {selectedProject && (
        <BoqContractReconciliationBanner
          reconciliation={reconciliation}
          project={selectedProject}
          isCostControlView={isCostControlView}
          onToggleCostControlView={() => setIsCostControlView((prev) => !prev)}
          onFilterVoItems={handleFilterVoItems}
        />
      )}

      {/* Rate Analysis & Financial KPI Cards Section */}
      <BoqRateAnalysisCards
        items={items}
        filteredItems={items.filter((it) => {
          if (selectedDivision === 'all') return true;
          const p = it.cost_code?.prefix?.toUpperCase() || it.cost_code?.code?.[0]?.toUpperCase();
          const cat = it.cost_code?.category;
          if (selectedDivision === 'UNASSIGNED') return !it.cost_code;
          if (selectedDivision === 'OTHER') return it.cost_code && !['M', 'E', 'L', 'R', 'A', 'S'].includes(p || '');
          return p === selectedDivision || cat === selectedDivision;
        })}
        selectedDivision={selectedDivision}
        onClearDivisionFilter={() => setSelectedDivision('all')}
        statusFilter={statusFilter}
        onSelectStatusFilter={(st) => setStatusFilter(st)}
      />

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Division Tree Explorer Panel */}
          <button
            type="button"
            onClick={() => setShowDivisionTree(!showDivisionTree)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
              showDivisionTree
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title={showDivisionTree ? (isAr ? 'إخفاء شجرة الأقسام' : 'Hide division tree') : (isAr ? 'إظهار شجرة الأقسام' : 'Show division tree')}
          >
            {showDivisionTree ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            <span>{showDivisionTree ? (isAr ? 'إخفاء شجرة الأقسام' : 'Hide Tree') : (isAr ? 'مستكشف الأقسام' : 'Division Explorer')}</span>
          </button>

          {/* Toggle Cost Control View */}
          <button
            type="button"
            onClick={() => setIsCostControlView(!isCostControlView)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
              isCostControlView
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title={isCostControlView ? (isAr ? 'إلغاء وضع مراقبة التكاليف' : 'Disable cost control mode') : (isAr ? 'عرض أعمدة مراقبة التكاليف التعاقدية' : 'Show cost control columns')}
          >
            <Scale className="w-4 h-4 text-purple-500" />
            <span>{isCostControlView ? (isAr ? 'مراقبة التكاليف (مفعلة)' : 'Cost Control (Active)') : (isAr ? 'مراقبة التكاليف' : 'Cost Control')}</span>
          </button>

          {canEditBoq && (
            <>
              <button
                onClick={() => setIsMultiImportOpen(true)}
                disabled={!selectedProjectId}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
                title={isAr ? 'قراءة جميع أوراق عمل الفاتورة وتوزيعها تلقائياً على المباني والمناطق' : 'Read all invoice sheets and import as buildings/zones'}
              >
                <Table2 className="w-4 h-4" />
                <span>{isAr ? 'استيراد فاتورة متعددة الجداول' : 'Multi-Sheet Importer'}</span>
              </button>

              <button
                onClick={() => setIsImportOpen(true)}
                disabled={!selectedProjectId}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{isAr ? 'معالج استيراد المقايسة' : 'Import Wizard'}</span>
              </button>

              <button
                onClick={() => setIsCostCodesOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                <FolderTree className="w-4 h-4 text-emerald-500" />
                <span>{isAr ? 'دليل أكواد التكلفة المعتمدة' : 'Master Cost Codes'}</span>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                disabled={!selectedProjectId}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>{isAr ? 'إضافة بند جديد' : 'Add Item'}</span>
              </button>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={items.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition disabled:opacity-40 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>{isAr ? 'تصدير جدول البيانات' : 'Export to Excel'}</span>
          </button>
        </div>
      </div>

      {selectedProjectId && (
        <BoqSheetPages
          projectId={selectedProjectId}
          items={items}
          sections={sections}
          activePage={activePage}
          onChangePage={changePage}
          canEdit={canEditBoq}
          inclusionFilter={inclusionFilter}
          onInclusionFilter={setInclusionFilter}
          onChanged={() => fetchBoqItems(selectedProjectId)}
        />
      )}

      {/* Quick Status Filter Tabs Bar */}
      {selectedProjectId && (
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          {[
            { id: 'all', label: isAr ? 'كافة البنود' : 'All Items', count: items.length },
            { id: 'contract_original', label: isAr ? 'العقد الأصلي' : 'Contract Original', count: items.filter((i) => i.pricing_status === 'contract_original').length },
            { id: 'vo_approved', label: isAr ? 'أوامر التغيير المعتمدة' : 'Approved Variation Orders', count: items.filter((i) => i.pricing_status === 'vo_approved').length },
            { id: 'star_rate_provisional', label: isAr ? 'فئات سعرية مؤقتة' : 'Provisional Rates', count: items.filter((i) => i.pricing_status === 'star_rate_provisional').length },
            { id: 'disputed', label: isAr ? 'بنود متنازع عليها' : 'Disputed Items', count: items.filter((i) => i.pricing_status === 'disputed').length },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(isActive && tab.id !== 'all' ? 'all' : (tab.id as any))}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                  isActive
                    ? 'bg-emerald-800/80 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Master BOQ Explorer: Division Tree + Table Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Division Tree Explorer Panel (Right in RTL) */}
        {showDivisionTree && (
          <div className="lg:col-span-3 transition-all duration-300">
            <BoqDivisionTree
              items={pageItems}
              selectedDivision={selectedDivision}
              onSelectDivision={(div) => setSelectedDivision(div)}
            />
          </div>
        )}

        {/* Main BOQ Table Container */}
        <div className={`${showDivisionTree ? 'lg:col-span-9' : 'lg:col-span-12'} transition-all duration-300`}>
          {selectedProjectId ? (
            <BoqTable
              projectId={selectedProjectId}
              items={pageItems}
              loading={loadingItems}
              canEdit={canEditBoq}
              isSiteEngineer={isSiteEngineer}
              onRefresh={() => fetchBoqItems(selectedProjectId)}
              onOpenBOM={(item) => setBomItem(item)}
              onOpenHistory={(item) => setHistoryItem(item)}
              selectedDivision={selectedDivision}
              onSelectDivision={(div: string) => setSelectedDivision(div)}
              onInspectRate={(item: BoqItem) => setInspectedRateItem(item)}
              renderInclusion={inclusion.render}
              groupLabelOf={(it) => sections.find((s) => s.id === it.section_id)?.name_ar || ''}
              isCostControlView={isCostControlView}
              onToggleCostControlView={() => setIsCostControlView((prev) => !prev)}
            />
          ) : (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400">
              {isAr ? 'يرجى اختيار مشروع لعرض جدول الكميات والمقايسة التعاقدية' : 'Please select a project to view the bill of quantities'}
            </div>
          )}
        </div>
      </div>

      {inclusion.modal}

      {/* Rate Analysis Inspector Modal */}
      {inspectedRateItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rate_analysis_title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="rate_analysis_title" className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAr ? 'تحليل الفئة السعرية للبند' : 'Item Rate Analysis'}
                  </h3>
                  <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                    {inspectedRateItem.item_code}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedRateItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Item Description */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 font-medium">الوصف التعاقدي والمواصفات الفنية</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {inspectedRateItem.description_ar}
                </div>
                {inspectedRateItem.description_en && (
                  <div className="text-xs text-slate-400 font-sans mt-0.5">
                    {inspectedRateItem.description_en}
                  </div>
                )}
              </div>

              {/* Rate & Amount Highlights */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{isAr ? 'الفئة التعاقدية المعتمدة' : 'Approved Unit Rate'}</div>
                  <div className="text-lg font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                    <PriceGate>
                      <span dir="ltr">{Number(inspectedRateItem.rate_egp).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span className="text-[11px] font-normal ms-1 text-slate-500">ج.م / {inspectedRateItem.unit}</span>
                    </PriceGate>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{isAr ? 'إجمالي القيمة التعاقدية للبند' : 'Total Contract Amount'}</div>
                  <div className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-1">
                    <PriceGate>
                      <span dir="ltr">{Number(inspectedRateItem.amount_egp).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span className="text-[11px] font-normal ms-1 text-slate-500">ج.م</span>
                    </PriceGate>
                  </div>
                </div>
              </div>

              {/* Quantities & Comparison */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
                <div>
                  <div className="text-[10px] text-slate-400">الكمية التعاقدية</div>
                  <div className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {inspectedRateItem.contract_qty !== undefined ? (
                      <PriceGate fallback={<span>***</span>}>
                        <span dir="ltr">{Number(inspectedRateItem.contract_qty).toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 ms-1">{inspectedRateItem.unit}</span>
                      </PriceGate>
                    ) : '—'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400">{isAr ? 'كمية المخططات التنفيذية' : 'Shop Drawing Quantity'}</div>
                  <div className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {inspectedRateItem.shop_drawing_qty !== null && inspectedRateItem.shop_drawing_qty !== undefined ? (
                      <PriceGate fallback={<span>***</span>}>
                        <span dir="ltr">{Number(inspectedRateItem.shop_drawing_qty).toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 ms-1">{inspectedRateItem.unit}</span>
                      </PriceGate>
                    ) : '—'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400">حالة التسعير</div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                      {getPricingStatusLabel(inspectedRateItem.pricing_status, isAr)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cost Code & Division Linkage */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">كود التكلفة المعتمد</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                      {inspectedRateItem.cost_code?.code || 'غير محدد'}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {inspectedRateItem.cost_code?.name_ar || ''}
                    </span>
                  </div>
                </div>

                <div className="text-end">
                  <div className="text-[10px] text-slate-400">الإصدار</div>
                  <div className="font-mono font-bold text-slate-700 dark:text-slate-300 mt-1">
                    v{inspectedRateItem.revision}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const it = inspectedRateItem;
                    setInspectedRateItem(null);
                    setBomItem(it);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition cursor-pointer"
                >
                  <Boxes className="w-4 h-4 text-emerald-500" />
                  <span>{isAr ? 'شجرة تفكيك المواد والموارد' : 'Sub-Materials Tree (BOM)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const it = inspectedRateItem;
                    setInspectedRateItem(null);
                    setHistoryItem(it);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-teal-500" />
                  <span>{isAr ? 'سجل التعديلات' : 'Audit History'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectedRateItem(null)}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Sheet Invoice/BOQ Importer */}
      {isMultiImportOpen && selectedProjectId && (
        <BoqMultiSheetImporter
          isOpen={isMultiImportOpen}
          onClose={() => setIsMultiImportOpen(false)}
          projectId={selectedProjectId}
          existingItems={items}
          onImportComplete={() => {
            fetchBoqItems(selectedProjectId);
          }}
        />
      )}

      {/* 4-Step Excel Import Wizard Modal */}
      {isImportOpen && selectedProjectId && (
        <BoqImportWizard
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          projectId={selectedProjectId}
          projectName={selectedProject?.project_name || selectedProject?.project_name_ar}
          projectContractValue={selectedProject?.total_contract_value || selectedProject?.contract_value_egp || 0}
          existingItems={items}
          onImportComplete={() => {
            fetchBoqItems(selectedProjectId);
          }}
        />
      )}

      {/* Cost Codes Directory Modal */}
      {isCostCodesOpen && (
        <CostCodeManager
          isOpen={isCostCodesOpen}
          onClose={() => setIsCostCodesOpen(false)}
        />
      )}

      {/* Audit History Drawer */}
      {historyItem && (
        <HistoryDrawer
          isOpen={!!historyItem}
          onClose={() => setHistoryItem(null)}
          entityId={historyItem.id}
          entityTitle={`بند ${historyItem.item_code}: ${historyItem.description_ar}`}
        />
      )}

      {/* BOM Sub-Materials Modal */}
      {bomItem && (
        <BoqSubMaterialsModal
          isOpen={!!bomItem}
          onClose={() => setBomItem(null)}
          boqItem={bomItem}
          onUpdated={() => {
            if (selectedProjectId) fetchBoqItems(selectedProjectId);
          }}
        />
      )}

      {/* Manual Add Item Modal */}
      {isAddModalOpen && canEditBoq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'إضافة بند جديد إلى المقايسة التعاقدية' : 'Add New Item to BOQ'}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addError && (
              <div className="p-3 m-4 mb-0 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddItem} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'كود البند التعاقدي *' : 'Item Code *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: B-001"
                    value={addForm.item_code || ''}
                    onChange={(e) => setAddForm({ ...addForm, item_code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'وحدة القياس *' : 'Unit *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="m3, m2, ml, ton, no..."
                    value={addForm.unit || ''}
                    onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'الوصف الفني التفصيلي *' : 'Description (Arabic) *'}
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="وصف البند والمواصفات الفنية..."
                  value={addForm.description_ar || ''}
                  onChange={(e) => setAddForm({ ...addForm, description_ar: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'الوصف باللغة الإنجليزية (اختياري)' : 'Description (English, Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="English technical description"
                  value={addForm.description_en || ''}
                  onChange={(e) => setAddForm({ ...addForm, description_en: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'كود التكلفة المعتمد' : 'Master Cost Code'}
                </label>
                <CostCodeSelector
                  value={addForm.cost_code_id}
                  onChange={(selected) => {
                    setAddForm({
                      ...addForm,
                      cost_code_id: selected?.id || null,
                    });
                  }}
                  onOpenManager={() => setIsCostCodesOpen(true)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الكمية التعاقدية *' : 'Contract Quantity *'}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    required
                    value={addForm.contract_qty ?? 0}
                    onChange={(e) => setAddForm({ ...addForm, contract_qty: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الفئة السعرية بالجنيه التعاقدي *' : 'Unit Rate (EGP) *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={addForm.rate_egp ?? 0}
                    onChange={(e) => setAddForm({ ...addForm, rate_egp: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'حالة التسعير التعاقدي' : 'Contract Pricing Status'}
                </label>
                <select
                  value={addForm.pricing_status || 'contract_original'}
                  onChange={(e) => setAddForm({ ...addForm, pricing_status: e.target.value as BoqPricingStatus })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="contract_original">{isAr ? 'عقد أصلي' : 'Contract Original'}</option>
                  <option value="vo_approved">{isAr ? 'أمر تغيير معتمد' : 'Approved Variation Order'}</option>
                  <option value="star_rate_provisional">{isAr ? 'فئة سعرية مؤقتة' : 'Provisional Star Rate'}</option>
                  <option value="disputed">{isAr ? 'متنازع عليه' : 'Disputed'}</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  {isAdding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isAr ? 'حفظ وإضافة البند' : 'Save & Add Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
