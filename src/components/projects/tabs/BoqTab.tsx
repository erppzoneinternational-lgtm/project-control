'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Plus,
  FolderTree,
  RefreshCw,
  Table2,
  Scale,
  PanelRightClose,
  PanelRightOpen,
  ExternalLink,
  X,
  AlertCircle,
} from 'lucide-react';
import { Project } from '@/types';
import { isFocusedProjectsMode } from '@/lib/config/module-visibility';
import { BoqItem, BoqPricingStatus, BoqSection } from '@/types/boq';
import { BoqService } from '@/lib/services/boq.service';
import { BoqTable } from '@/components/planning/BoqTable';
import { BoqSheetPages } from '@/components/planning/BoqSheetPages';
import { useBoqInclusion } from '@/components/planning/useBoqInclusion';
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

interface BoqTabProps {
  project: Project;
  onProjectUpdate?: (updated: Project) => void;
  isAr?: boolean;
}

export function BoqTab({ project, onProjectUpdate, isAr = true }: BoqTabProps) {
  const { roles, isAdmin } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();
  const isSiteEngineer = !isAdmin && roles.some((r) => r.includes('site'));
  const canEditBoq = !isSiteEngineer && canEditPath('/boq', roles, isAdmin, dbAccessRules);
  const canOmitBase = isAdmin || roles.some((r) => /admin|pm|project_manager|manager/i.test(r));

  // Items and sections state
  const [items, setItems] = useState<BoqItem[]>([]);
  const [sections, setSections] = useState<BoqSection[]>([]);
  const [activePage, setActivePage] = useState<string>('__all__');
  const [inclusionFilter, setInclusionFilter] = useState<'all' | 'optional' | 'omitted'>('all');
  const [loadingItems, setLoadingItems] = useState(true);

  // Explorer & View states
  const [showDivisionTree, setShowDivisionTree] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<BoqPricingStatus | 'all'>('all');
  const [inspectedRateItem, setInspectedRateItem] = useState<BoqItem | null>(null);
  const [isCostControlView, setIsCostControlView] = useState(false);

  // Modals state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isMultiImportOpen, setIsMultiImportOpen] = useState(false);
  const [isCostCodesOpen, setIsCostCodesOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<BoqItem | null>(null);
  const [bomItem, setBomItem] = useState<BoqItem | null>(null);

  // Add Item Modal state
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

  // Fetch BOQ Items & Sections
  const fetchBoqData = useCallback(async () => {
    if (!project?.id) return;
    setLoadingItems(true);
    try {
      const [boqData, secData] = await Promise.all([
        BoqService.getBoqItems(project.id, true, { userRoles: roles, isAdmin }),
        BoqService.getSections(project.id),
      ]);
      setItems(boqData || []);
      setSections(secData || []);
    } catch (err) {
      console.error('Failed to load project BOQ items:', err);
      toast.error(isAr ? 'تعذر تحميل بنود المقايسة التعاقدية' : 'Failed to load BOQ items');
    } finally {
      setLoadingItems(false);
    }
  }, [project?.id, roles, isAdmin, isAr]);

  useEffect(() => {
    fetchBoqData();
  }, [fetchBoqData]);

  // Active sheet page items
  const pageItems = useMemo(() => {
    let list = items;
    if (activePage === '__unassigned__') list = items.filter((i) => !i.section_id);
    else if (activePage !== '__all__') list = items.filter((i) => i.section_id === activePage);
    if (inclusionFilter === 'optional') {
      list = list.filter((i) => i.inclusion_status === 'optional_pending' || i.inclusion_status === 'optional_added');
    }
    if (inclusionFilter === 'omitted') {
      list = list.filter((i) => i.inclusion_status === 'omitted');
    }
    return list;
  }, [items, activePage, inclusionFilter]);

  const inclusion = useBoqInclusion({
    projectId: project.id,
    sections,
    canEdit: canEditBoq,
    canOmitBase,
    onChanged: fetchBoqData,
  });

  const reconciliation = useMemo(() => {
    return reconcileProjectBoqWithContract(project, items);
  }, [project, items]);

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
      [isAr ? 'كود التكلفة المعتمد' : 'Cost Code']: item.cost_code?.code || '',
      [isAr ? 'الوصف بالعربية' : 'Arabic Description']: item.description_ar,
      [isAr ? 'الوصف بالإنجليزية' : 'English Description']: item.description_en || '',
      [isAr ? 'الوحدة' : 'Unit']: item.unit,
      [isAr ? 'الكمية التعاقدية' : 'Contract Qty']: allowPrice ? item.contract_qty : '***',
      [isAr ? 'كمية المخططات التنفيذية' : 'Shop Drawing Qty']: allowPrice ? (item.shop_drawing_qty || '') : '***',
      [isAr ? 'حالة التسعير' : 'Pricing Status']: item.pricing_status,
      [isAr ? 'الفئة بالجنيه' : 'Rate (EGP)']: allowPrice ? item.rate_egp : '***',
      [isAr ? 'الإجمالي بالجنيه' : 'Total Amount (EGP)']: allowPrice ? item.amount_egp : '***',
      [isAr ? 'رقم الإصدار' : 'Revision']: `v${item.revision}`,
      [isAr ? 'ملاحظات' : 'Notes']: item.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    const safeProjectName = project.project_name || project.project_name_ar || 'Project';
    XLSX.utils.book_append_sheet(wb, ws, 'BOQ_Items');
    XLSX.writeFile(wb, `BOQ_${safeProjectName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(isAr ? 'تم تصدير بنود جدول الكميات بنجاح' : 'BOQ items exported successfully');
  };

  // Manual Add Item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project?.id) return;
    if (!addForm.item_code?.trim()) {
      setAddError(isAr ? 'كود البند مطلوب' : 'Item code is required');
      return;
    }
    if (!addForm.description_ar?.trim()) {
      setAddError(isAr ? 'الوصف بالعربية مطلوب' : 'Arabic description is required');
      return;
    }

    setIsAdding(true);
    setAddError(null);

    try {
      const newItem = await BoqService.saveBoqItem({
        ...addForm,
        project_id: project.id,
        contract_qty: Number(addForm.contract_qty ?? 0),
        rate_egp: Number(addForm.rate_egp ?? 0),
      });

      if (!newItem) {
        setAddError(
          isAr
            ? 'تعذر إضافة البند. تأكد من عدم تكرار كود البند في هذا المشروع.'
            : 'Could not add item. Ensure item code is unique in this project.'
        );
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
      invalidateBoqItemCaches(project.id, newItem.id);
      await fetchBoqData();
      toast.success(isAr ? 'تمت إضافة البند بنجاح' : 'Item added successfully');
    } catch (err: unknown) {
      setAddError((err as { message?: string } | null)?.message || (isAr ? 'خطأ في إضافة البند' : 'Error adding item'));
    } finally {
      setIsAdding(false);
    }
  };

  if (loadingItems && items.length === 0) {
    return <BoqLoadingSkeleton showSidebar={showDivisionTree} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-700/20">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? 'جدول الكميات والتسعير' : 'Bill of Quantities (BOQ)'}
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {items.length} {isAr ? 'بند' : 'items'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'المقايسة التعاقدية المعتمدة، بنود أوامر التغيير، ومطابقة التكاليف'
                : 'Approved contract items, variation orders, and cost control reconciliation'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchBoqData}
            disabled={loadingItems}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            title={isAr ? 'تحديث البيانات' : 'Refresh Data'}
            aria-label={isAr ? 'تحديث البيانات' : 'Refresh Data'}
          >
            <RefreshCw className={`w-4 h-4 ${loadingItems ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {!isFocusedProjectsMode() && (
            <Link
              href={`/boq?projectId=${project.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-200 hover:text-emerald-600 transition shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              title={isAr ? 'فتح المقايسة في شاشة كاملة مستقلة' : 'Open Full BOQ Screen'}
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAr ? 'فتح الشاشة الموسعة للمقايسة' : 'Open Full BOQ Screen'}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Contract vs BOQ Reconciliation Alert & Status Banner */}
      <BoqContractReconciliationBanner
        reconciliation={reconciliation}
        project={project}
        isCostControlView={isCostControlView}
        onToggleCostControlView={() => setIsCostControlView((prev) => !prev)}
        onFilterVoItems={handleFilterVoItems}
      />

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
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Division Tree Explorer Panel */}
          <button
            type="button"
            onClick={() => setShowDivisionTree(!showDivisionTree)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              showDivisionTree
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 shadow-sm'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title={showDivisionTree ? (isAr ? 'إخفاء شجرة الأقسام' : 'Hide Divisions') : (isAr ? 'إظهار شجرة الأقسام' : 'Show Divisions')}
          >
            {showDivisionTree ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            <span>{showDivisionTree ? (isAr ? 'إخفاء الأقسام' : 'Hide Divisions') : (isAr ? 'شجرة الأقسام' : 'Divisions Tree')}</span>
          </button>

          {/* Toggle Cost Control View */}
          <button
            type="button"
            onClick={() => setIsCostControlView(!isCostControlView)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
              isCostControlView
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-300 shadow-sm'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title={
              isCostControlView
                ? (isAr ? 'إلغاء وضع مراقبة التكاليف' : 'Disable Cost Control View')
                : (isAr ? 'عرض أعمدة مراقبة التكاليف' : 'Show Cost Control Columns')
            }
          >
            <Scale className="w-4 h-4 text-purple-500" />
            <span>
              {isCostControlView
                ? (isAr ? 'أعمدة التكاليف (مفعلة)' : 'Cost Control (Active)')
                : (isAr ? 'أعمدة مراقبة التكاليف' : 'Cost Control')}
            </span>
          </button>

          {canEditBoq && (
            <>
              <button
                type="button"
                onClick={() => setIsMultiImportOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm hover:shadow transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                title={isAr ? 'استيراد كافة أوراق المقايسة وتوزيعها كمبانٍ ومناطق' : 'Import multi-sheet BOQ as buildings/zones'}
              >
                <Table2 className="w-4 h-4" />
                <span>{isAr ? 'استيراد متعدد الأوراق' : 'Multi-Sheet Import'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm hover:shadow transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                title={isAr ? 'استيراد ملف إكسيل' : 'Import Excel File'}
              >
                <Upload className="w-4 h-4" />
                <span>{isAr ? 'استيراد إكسيل' : 'Import Excel'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCostCodesOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                title={isAr ? 'دليل أكواد التكلفة المعتمدة' : 'Cost Codes Directory'}
              >
                <FolderTree className="w-4 h-4 text-emerald-500" />
                <span>{isAr ? 'أكواد التكلفة' : 'Cost Codes'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                title={isAr ? 'إضافة بند جديد يدوياً' : 'Add New Item Manually'}
              >
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>{isAr ? 'إضافة بند' : 'Add Item'}</span>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={items.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition disabled:opacity-40 cursor-pointer shadow-sm hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            title={isAr ? 'تصدير بنود المقايسة إلى ملف إكسيل' : 'Export BOQ items to Excel'}
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>{isAr ? 'تصدير إكسيل' : 'Export Excel'}</span>
          </button>
        </div>
      </div>

      {/* Sheet pages / sections tab bar */}
      <BoqSheetPages
        projectId={project.id}
        items={items}
        sections={sections}
        activePage={activePage}
        onChangePage={(id) => setActivePage(id)}
        canEdit={canEditBoq}
        inclusionFilter={inclusionFilter}
        onInclusionFilter={setInclusionFilter}
        onChanged={fetchBoqData}
      />

      {/* Division Tree + Table Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {showDivisionTree && (
          <div className="lg:col-span-3 transition-all duration-300">
            <BoqDivisionTree
              items={pageItems}
              selectedDivision={selectedDivision}
              onSelectDivision={(div) => setSelectedDivision(div)}
            />
          </div>
        )}

        <div className={`${showDivisionTree ? 'lg:col-span-9' : 'lg:col-span-12'} transition-all duration-300`}>
          <BoqTable
            projectId={project.id}
            items={pageItems}
            loading={loadingItems}
            canEdit={canEditBoq}
            isSiteEngineer={isSiteEngineer}
            onRefresh={fetchBoqData}
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
                    {isAr ? 'تحليل فئة البند والأسعار' : 'Rate Analysis & Pricing'}
                  </h3>
                  <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                    {inspectedRateItem.item_code}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedRateItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                title={isAr ? 'إغلاق' : 'Close'}
                aria-label={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {isAr ? 'الوصف التعاقدي والمواصفات الفنية' : 'Contract Description & Specifications'}
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {inspectedRateItem.description_ar}
                </div>
                {inspectedRateItem.description_en && (
                  <div className="text-xs text-slate-400 font-sans mt-0.5">
                    {inspectedRateItem.description_en}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
                  <div className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold">
                    {isAr ? 'فئة البند التعاقدية' : 'Contract Unit Rate'}
                  </div>
                  <div className="text-lg font-mono font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                    <PriceGate>
                      <span dir="ltr">{Number(inspectedRateItem.rate_egp).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span className="text-[11px] font-normal ms-1 text-slate-500 dark:text-slate-400">
                        {isAr ? `ج.م / ${inspectedRateItem.unit}` : `EGP / ${inspectedRateItem.unit}`}
                      </span>
                    </PriceGate>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                    {isAr ? 'إجمالي قيمة البند' : 'Total Item Amount'}
                  </div>
                  <div className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-1">
                    <PriceGate>
                      <span dir="ltr">{Number(inspectedRateItem.amount_egp).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span className="text-[11px] font-normal ms-1 text-slate-500 dark:text-slate-400">
                        {isAr ? 'ج.م' : 'EGP'}
                      </span>
                    </PriceGate>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
                <div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {isAr ? 'الكمية التعاقدية' : 'Contract Quantity'}
                  </div>
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
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {isAr ? 'كمية المخططات التنفيذية' : 'Shop Drawing Qty'}
                  </div>
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
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {isAr ? 'حالة التسعير' : 'Pricing Status'}
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                      {isAr ? (
                        inspectedRateItem.pricing_status === 'contract_original'
                          ? 'عقد أصلي'
                          : inspectedRateItem.pricing_status === 'vo_approved'
                          ? 'أمر تغيير معتمد'
                          : inspectedRateItem.pricing_status === 'star_rate_provisional'
                          ? 'سعر مؤقت مستحدث'
                          : inspectedRateItem.pricing_status
                      ) : inspectedRateItem.pricing_status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {isAr ? 'كود التكلفة المعتمد' : 'Master Cost Code'}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                      {inspectedRateItem.cost_code?.code || (isAr ? 'غير محدد' : 'Unassigned')}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {isAr
                        ? (inspectedRateItem.cost_code?.name_ar || '')
                        : (inspectedRateItem.cost_code?.name_en || inspectedRateItem.cost_code?.name_ar || '')}
                    </span>
                  </div>
                </div>

                <div className="text-end">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {isAr ? 'رقم الإصدار' : 'Revision'}
                  </div>
                  <div className="font-mono font-bold text-slate-700 dark:text-slate-300 mt-1">
                    v{inspectedRateItem.revision}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const it = inspectedRateItem;
                    setInspectedRateItem(null);
                    setBomItem(it);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <span>{isAr ? 'مكونات البند التفصيلية' : 'Bill of Materials (BOM)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const it = inspectedRateItem;
                    setInspectedRateItem(null);
                    setHistoryItem(it);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <RefreshCw className="w-4 h-4 text-teal-500" />
                  <span>{isAr ? 'سجل التعديلات' : 'Audit History'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectedRateItem(null)}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition cursor-pointer shadow-md shadow-emerald-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Sheet Invoice/BOQ Importer */}
      {isMultiImportOpen && (
        <BoqMultiSheetImporter
          isOpen={isMultiImportOpen}
          onClose={() => setIsMultiImportOpen(false)}
          projectId={project.id}
          existingItems={items}
          onImportComplete={fetchBoqData}
        />
      )}

      {/* 4-Step Excel Import Wizard Modal */}
      {isImportOpen && (
        <BoqImportWizard
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          projectId={project.id}
          projectName={project.project_name || project.project_name_ar}
          projectContractValue={project.total_contract_value || project.contract_value_egp || 0}
          existingItems={items}
          onImportComplete={fetchBoqData}
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
          onUpdated={fetchBoqData}
        />
      )}

      {/* Manual Add Item Modal */}
      {isAddModalOpen && canEditBoq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'إضافة بند جديد إلى جدول الكميات' : 'Add New BOQ Item'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                title={isAr ? 'إغلاق' : 'Close'}
                aria-label={isAr ? 'إغلاق' : 'Close'}
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
                    {isAr ? 'كود البند *' : 'Item Code *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'مثال: B-001' : 'e.g. B-001'}
                    value={addForm.item_code || ''}
                    onChange={(e) => setAddForm({ ...addForm, item_code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الوحدة *' : 'Unit *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="m3, m2, ml, ton, no..."
                    value={addForm.unit || ''}
                    onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'الوصف بالعربية *' : 'Arabic Description *'}
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder={isAr ? 'وصف البند والمواصفات الفنية...' : 'Technical description in Arabic...'}
                  value={addForm.description_ar || ''}
                  onChange={(e) => setAddForm({ ...addForm, description_ar: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'الوصف بالإنجليزية (اختياري)' : 'English Description (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="English technical description"
                  value={addForm.description_en || ''}
                  onChange={(e) => setAddForm({ ...addForm, description_en: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الفئة بالجنيه المصري *' : 'Rate (EGP) *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={addForm.rate_egp ?? 0}
                    onChange={(e) => setAddForm({ ...addForm, rate_egp: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'حالة التسعير' : 'Pricing Status'}
                </label>
                <select
                  value={addForm.pricing_status || 'contract_original'}
                  onChange={(e) => setAddForm({ ...addForm, pricing_status: e.target.value as BoqPricingStatus })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <option value="contract_original">{isAr ? 'عقد أصلي' : 'Original Contract'}</option>
                  <option value="vo_approved">{isAr ? 'أمر تغيير معتمد' : 'Approved Variation Order'}</option>
                  <option value="star_rate_provisional">{isAr ? 'سعر مؤقت مستحدث' : 'Provisional Star Rate'}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md shadow-emerald-700/20 disabled:opacity-50 cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  {isAdding ? (isAr ? 'جاري الإضافة...' : 'Adding...') : (isAr ? 'حفظ البند' : 'Save Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
