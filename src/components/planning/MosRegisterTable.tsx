'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  Boxes, 
  RefreshCw, 
  X, 
  AlertCircle,
  FileCheck,
  AlertTriangle,
  XCircle,
  Calendar,
  FileSpreadsheet,
  FileDown,
  ShieldCheck
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';

import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { MosEntry, MosStatus, MosConsultantApprovalCode } from '@/types/planning';
import { BoqItem, ProjectSubcontractor } from '@/types';
import { SiteOperationsService } from '@/lib/services/siteOperations.service';
import { BoqService } from '@/lib/services/boq.service';
import { ProjectTabsService } from '@/lib/services/projectTabs.service';
import { toSafeHttpUrl } from '@/lib/utils/security';
import { useLanguage } from '@/contexts/LanguageContext';
import { logger } from '@/lib/logger';
import { ResizableTable } from '@/components/ui/ResizableTable';

// ── Physical Site Installation Status Configuration ──────────────────────────
export const MOS_STATUS_CONFIG: Record<
  MosStatus,
  { 
    labelAr: string; 
    labelEn: string; 
    color: string; 
    nextStatus?: MosStatus; 
    nextLabelAr?: string; 
    nextLabelEn?: string;
    icon: React.ElementType;
    ariaLabelAr: string;
    ariaLabelEn: string;
  }
> = {
  on_site: {
    labelAr: 'مشون بالموقع',
    labelEn: 'On Site',
    color: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    nextStatus: 'partially_installed',
    nextLabelAr: 'تحويل إلى تركيب جزئي',
    nextLabelEn: 'Move to Partially Installed',
    icon: Boxes,
    ariaLabelAr: 'حالة المادة بالموقع: مشون بالموقع',
    ariaLabelEn: 'Material status: On site',
  },
  partially_installed: {
    labelAr: 'تركيب جزئي',
    labelEn: 'Partially Installed',
    color: 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    nextStatus: 'installed',
    nextLabelAr: 'تحويل إلى تم التركيب بالكامل',
    nextLabelEn: 'Move to Fully Installed',
    icon: Clock,
    ariaLabelAr: 'حالة المادة بالموقع: تركيب جزئي',
    ariaLabelEn: 'Material status: Partially installed',
  },
  installed: {
    labelAr: 'تم التركيب بالكامل',
    labelEn: 'Fully Installed',
    color: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    nextStatus: 'on_site',
    nextLabelAr: 'إعادة إلى التشوين',
    nextLabelEn: 'Revert to On Site',
    icon: CheckCircle2,
    ariaLabelAr: 'حالة المادة بالموقع: تم التركيب بالكامل',
    ariaLabelEn: 'Material status: Fully installed',
  },
};

// ── Consultant Approval / Method Statement Review Configuration (FIDIC Codes) ──
export const MOS_CONSULTANT_STATUS_CONFIG: Record<
  MosConsultantApprovalCode,
  {
    code: string;
    labelAr: string;
    labelEn: string;
    shortLabelAr: string;
    shortLabelEn: string;
    descriptionAr: string;
    color: string;
    icon: React.ElementType;
    ariaLabelAr: string;
    ariaLabelEn: string;
  }
> = {
  code_a: {
    code: 'A',
    labelAr: 'معتمد (فئة أ)',
    labelEn: 'Approved (Code A)',
    shortLabelAr: 'معتمد (أ)',
    shortLabelEn: 'Code A',
    descriptionAr: 'معتمد بدون ملاحظات',
    color: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    icon: CheckCircle2,
    ariaLabelAr: 'اعتماد الاستشاري: معتمد فئة أ بدون ملاحظات',
    ariaLabelEn: 'Consultant approval: Code A Approved without notes',
  },
  code_b: {
    code: 'B',
    labelAr: 'معتمد بملاحظات (فئة ب)',
    labelEn: 'Approved w/ Notes (Code B)',
    shortLabelAr: 'معتمد بملاحظات (ب)',
    shortLabelEn: 'Code B',
    descriptionAr: 'معتمد مع مراعاة الملاحظات المدونة',
    color: 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    icon: FileCheck,
    ariaLabelAr: 'اعتماد الاستشاري: معتمد فئة ب بملاحظات',
    ariaLabelEn: 'Consultant approval: Code B Approved with comments',
  },
  code_c: {
    code: 'C',
    labelAr: 'تعديل وإعادة تقديم (فئة ج)',
    labelEn: 'Revise & Resubmit (Code C)',
    shortLabelAr: 'تعديل وإعادة تقديم (ج)',
    shortLabelEn: 'Code C',
    descriptionAr: 'مرفوض جزئياً - يتطلب مراجعة وإعادة تقديم',
    color: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    icon: AlertTriangle,
    ariaLabelAr: 'اعتماد الاستشاري: مطلوب تعديل وإعادة تقديم فئة ج',
    ariaLabelEn: 'Consultant approval: Code C Revise and resubmit',
  },
  code_d: {
    code: 'D',
    labelAr: 'مرفوض (فئة د)',
    labelEn: 'Rejected (Code D)',
    shortLabelAr: 'مرفوض (د)',
    shortLabelEn: 'Code D',
    descriptionAr: 'مرفوض نهائياً من الاستشاري',
    color: 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    icon: XCircle,
    ariaLabelAr: 'اعتماد الاستشاري: مرفوض فئة د',
    ariaLabelEn: 'Consultant approval: Code D Rejected',
  },
  pending: {
    code: 'P',
    labelAr: 'قيد مراجعة الاستشاري',
    labelEn: 'Consultant Review Pending',
    shortLabelAr: 'قيد المراجعة',
    shortLabelEn: 'Pending',
    descriptionAr: 'تم التقديم وبانتظار اعتماد الاستشاري',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    icon: Clock,
    ariaLabelAr: 'اعتماد الاستشاري: قيد المراجعة',
    ariaLabelEn: 'Consultant approval: Pending review',
  },
};

// ── Metadata Parser & Fallback Extraction ────────────────────────────────────
export function extractConsultantMetadata(entry: MosEntry): {
  status: MosConsultantApprovalCode;
  reviewDate: string | null;
  cleanSourceRef: string;
} {
  const directStatus = entry.consultant_status;
  const directDate = entry.consultant_review_date;
  const rawSource = entry.source_ref || '';
  const match = rawSource.match(/\[CR:\s*([^|\]]+)(?:\s*\|\s*([^\]]+))?\]/);

  let parsedStatus: MosConsultantApprovalCode = 'pending';
  let parsedDate: string | null = directDate || null;
  let cleanSource = rawSource;

  if (match) {
    cleanSource = rawSource.replace(match[0], '').trim();
    const statusPart = match[1]?.trim().toLowerCase();
    if (statusPart.includes('a')) parsedStatus = 'code_a';
    else if (statusPart.includes('b')) parsedStatus = 'code_b';
    else if (statusPart.includes('c')) parsedStatus = 'code_c';
    else if (statusPart.includes('d')) parsedStatus = 'code_d';
    else if (statusPart.includes('pending')) parsedStatus = 'pending';

    if (match[2]?.trim()) {
      parsedDate = match[2].trim();
    }
  }

  if (directStatus) {
    const s = String(directStatus).toLowerCase();
    if (s === 'a' || s === 'code_a' || s === 'approved') parsedStatus = 'code_a';
    else if (s === 'b' || s === 'code_b' || s === 'approved_with_comments') parsedStatus = 'code_b';
    else if (s === 'c' || s === 'code_c' || s === 'revise_and_resubmit') parsedStatus = 'code_c';
    else if (s === 'd' || s === 'code_d' || s === 'rejected') parsedStatus = 'code_d';
    else if (s === 'pending') parsedStatus = 'pending';
  } else if (!match) {
    if (entry.status === 'installed') parsedStatus = 'code_a';
    else if (entry.status === 'partially_installed') parsedStatus = 'code_b';
    else parsedStatus = 'pending';
  }

  return {
    status: parsedStatus,
    reviewDate: parsedDate,
    cleanSourceRef: cleanSource,
  };
}

interface MosRegisterTableProps {
  projectId: string;
}

export const MosRegisterTable: React.FC<MosRegisterTableProps> = ({ projectId }) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { roles, isAdmin } = useUserRoles();
  const [entries, setEntries] = useState<MosEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MosStatus | 'all'>('all');
  const [consultantFilter, setConsultantFilter] = useState<MosConsultantApprovalCode | 'all'>('all');

  // Reference Data
  const [boqItems, setBoqItems] = useState<BoqItem[]>([]);
  const [subcontractors, setSubcontractors] = useState<ProjectSubcontractor[]>([]);

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEntryDate, setNewEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [newBoqItemId, setNewBoqItemId] = useState('');
  const [newDescriptionAr, setNewDescriptionAr] = useState('');
  const [newUnit, setNewUnit] = useState('m2');
  const [newQtySupplied, setNewQtySupplied] = useState<number>(0);
  const [newSourceRef, setNewSourceRef] = useState('');
  const [newSubcontractorId, setNewSubcontractorId] = useState('');
  const [newConsultantStatus, setNewConsultantStatus] = useState<MosConsultantApprovalCode>('pending');
  const [newConsultantReviewDate, setNewConsultantReviewDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load Data
  const loadMosData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [mosList, boqList, subsList] = await Promise.all([
        SiteOperationsService.getMosEntries(projectId),
        BoqService.getBoqItems(projectId, true, { userRoles: roles, isAdmin }),
        ProjectTabsService.getSubcontractors(projectId),
      ]);
      setEntries(mosList);
      setBoqItems(boqList);
      setSubcontractors(subsList);
    } catch (err) {
      logger.error('Error loading MOS data', { detail: err });
      toast.error(isAr ? 'فشل تحميل سجل التشوينات وطرق التنفيذ' : 'Failed to load MOS register');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMosData();
  }, [projectId]);

  // Handle BOQ item selection in Add Modal to auto-fill description & unit
  const handleSelectBoqItem = (boqId: string) => {
    setNewBoqItemId(boqId);
    const item = boqItems.find((b) => b.id === boqId);
    if (item) {
      setNewDescriptionAr(item.description_ar);
      setNewUnit(item.unit);
    }
  };

  // Save new MOS entry
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescriptionAr.trim() || newQtySupplied <= 0) {
      setSaveError(
        isAr 
          ? 'يرجى إدخال بيان المادة/طريقة التنفيذ وكمية توريد أكبر من الصفر' 
          : 'Please enter description and a supplied quantity greater than zero'
      );
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    // Non-destructive preservation of consultant review metadata in source_ref
    const consultantTag = newConsultantStatus !== 'pending' || newConsultantReviewDate
      ? `[CR: ${newConsultantStatus.toUpperCase()} | ${newConsultantReviewDate || newEntryDate}]`
      : '';

    const combinedSourceRef = newSourceRef.trim()
      ? `${newSourceRef.trim()} ${consultantTag}`.trim()
      : consultantTag || undefined;

    try {
      const saved = await SiteOperationsService.saveMosEntry({
        project_id: projectId,
        entry_date: newEntryDate,
        boq_item_id: newBoqItemId || undefined,
        description_ar: newDescriptionAr.trim(),
        unit: newUnit.trim() || 'item',
        qty_supplied: Number(newQtySupplied),
        source_ref: combinedSourceRef,
        status: 'on_site',
        subcontractor_id: newSubcontractorId || undefined,
        consultant_status: newConsultantStatus,
        consultant_review_date: newConsultantReviewDate || undefined,
      });

      if (!saved) {
        throw new Error(isAr ? 'فشل حفظ تشوين المادة وطريقة التنفيذ' : 'Failed to save the MOS entry');
      }

      toast.success(isAr ? 'تم تسجيل وتوثيق التشوين بنجاح' : 'MOS entry recorded successfully');
      setIsAddModalOpen(false);

      // Reset form
      setNewBoqItemId('');
      setNewDescriptionAr('');
      setNewQtySupplied(0);
      setNewSourceRef('');
      setNewSubcontractorId('');
      setNewConsultantStatus('pending');
      setNewConsultantReviewDate('');
      loadMosData();
    } catch (err) {
      setSaveError((err as Error).message || (isAr ? 'حدث خطأ أثناء حفظ التشوين' : 'An error occurred while saving the entry'));
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle status transition
  const handleToggleStatus = async (entry: MosEntry) => {
    const nextStatus = MOS_STATUS_CONFIG[entry.status]?.nextStatus;
    if (!nextStatus) return;

    try {
      const updated = await SiteOperationsService.updateMosStatus(entry.id, nextStatus);
      if (updated) {
        setEntries((prev) =>
          prev.map((e) => (e.id === entry.id ? { ...e, status: nextStatus } : e))
        );
        toast.success(
          isAr 
            ? `تم تحديث حالة التشوين إلى "${MOS_STATUS_CONFIG[nextStatus].labelAr}"` 
            : `Status updated to "${MOS_STATUS_CONFIG[nextStatus].labelEn}"`
        );
      }
    } catch (err) {
      logger.error('Error toggling MOS status', { detail: err });
      toast.error(isAr ? 'فشل تحديث حالة التشوين' : 'Failed to update MOS status');
    }
  };

  // Export full MOS register as CSV
  const handleExportRegister = () => {
    if (entries.length === 0) {
      toast.error(isAr ? 'لا توجد بيانات متاحة للتصدير' : 'No data available to export');
      return;
    }

    const headers = [
      isAr ? 'تاريخ التشوين' : 'Entry Date',
      isAr ? 'بيان المادة وطريقة التنفيذ' : 'Description & Specs',
      isAr ? 'كود بند المقايسة' : 'BOQ Item Code',
      isAr ? 'الوحدة' : 'Unit',
      isAr ? 'الكمية المشونة' : 'Supplied Qty',
      isAr ? 'إذن التوريد / الفاتورة' : 'Delivery Note / Invoice',
      isAr ? 'المقاول المسند' : 'Assigned Subcontractor',
      isAr ? 'اعتماد الاستشاري' : 'Consultant Status',
      isAr ? 'تاريخ مراجعة الاستشاري' : 'Consultant Review Date',
      isAr ? 'حالة التشوين بالموقع' : 'Site Status',
    ];

    const rows = filteredEntries.map((e) => {
      const linkedBoq = boqItems.find((b) => b.id === e.boq_item_id);
      const linkedSub = subcontractors.find((s) => s.id === e.subcontractor_id);
      const { status: cStatus, reviewDate, cleanSourceRef } = extractConsultantMetadata(e);
      const consultantConfig = MOS_CONSULTANT_STATUS_CONFIG[cStatus];
      const siteStatus = MOS_STATUS_CONFIG[e.status];

      return [
        `"${e.entry_date}"`,
        `"${e.description_ar.replace(/"/g, '""')}"`,
        `"${linkedBoq?.item_code || '-'}"`,
        `"${e.unit}"`,
        `"${e.qty_supplied}"`,
        `"${(cleanSourceRef || '-').replace(/"/g, '""')}"`,
        `"${(linkedSub?.company_name || '-').replace(/"/g, '""')}"`,
        `"${isAr ? consultantConfig.labelAr : consultantConfig.labelEn}"`,
        `"${reviewDate || (isAr ? 'قيد المراجعة' : 'Pending')}"`,
        `"${isAr ? siteStatus.labelAr : siteStatus.labelEn}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MOS_Register_${projectId || 'project'}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(isAr ? 'تم تصدير سجل المواد وطرق التنفيذ بنجاح' : 'MOS Register exported successfully');
  };

  // Download individual MOS Submittal Sheet / Inspection Voucher
  const handleDownloadEntryVoucher = (entry: MosEntry) => {
    if (entry.document_url) {
      const safeUrl = toSafeHttpUrl(entry.document_url);
      if (!safeUrl) {
        toast.error(
          isAr
            ? 'رابط المستند غير صالح أو غير آمن (يُسمح فقط بروابط http/https)'
            : 'Invalid or unsafe document URL (only http/https allowed)'
        );
        return;
      }
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const linkedBoq = boqItems.find((b) => b.id === entry.boq_item_id);
    const linkedSub = subcontractors.find((s) => s.id === entry.subcontractor_id);
    const { status: cStatus, reviewDate, cleanSourceRef } = extractConsultantMetadata(entry);
    const consultantConfig = MOS_CONSULTANT_STATUS_CONFIG[cStatus];
    const siteStatus = MOS_STATUS_CONFIG[entry.status];

    const voucherText = `
================================================================================
           MATERIAL ON-SITE (MOS) & METHOD STATEMENT SUBMITTAL SHEET
           بطاقة تشوين المواد وطرق التنفيذ الفنية المعتمدة
================================================================================

كود المشروع: ${projectId}
تاريخ التوريد والتقديم: ${entry.entry_date}
رقم إذن التوريد / الفاتورة: ${cleanSourceRef || (isAr ? 'غير محدد' : 'N/A')}
بند جدول الكميات: ${linkedBoq ? `${linkedBoq.item_code} - ${linkedBoq.description_ar}` : (isAr ? 'غير مرتبط ببند محدد' : 'Not linked to a BOQ item')}
المقاول المسند: ${linkedSub ? linkedSub.company_name : (isAr ? 'عهدة الشركة المباشرة' : 'Direct Company Responsibility')}

--------------------------------------------------------------------------------
بيان ووصف المادة والمواصفات وطريقة التنفيذ:
${entry.description_ar}

الكمية المشونة: ${Number(entry.qty_supplied).toLocaleString()} ${entry.unit}
حالة التشوين بالموقع: ${isAr ? siteStatus.labelAr : siteStatus.labelEn}

--------------------------------------------------------------------------------
بيانات اعتماد استشاري المشروع:
كود الاعتماد: ${isAr ? consultantConfig.labelAr : consultantConfig.labelEn}
وصف الاعتماد: ${consultantConfig.descriptionAr}
تاريخ مراجعة واعتماد الاستشاري: ${reviewDate || (isAr ? 'قيد المراجعة الفنية' : 'Pending Technical Review')}
--------------------------------------------------------------------------------

تم استخراج هذه الوثيقة آلياً من نظام إدارة وضبط المشروعات P-Zone Project Controls
تاريخ الطباعة والتصدير: ${new Date().toLocaleString(isAr ? 'ar-EG' : 'en-US')}
================================================================================
`.trim();

    const blob = new Blob(['\uFEFF' + voucherText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileSlug = cleanSourceRef ? cleanSourceRef.replace(/[^a-zA-Z0-9_-]/g, '_') : entry.id.slice(0, 8);
    a.download = `MOS_Voucher_${fileSlug}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(isAr ? 'تم تحميل بطاقة وإذن اعتماد التشوين' : 'MOS inspection voucher downloaded');
  };

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const q = searchQuery.toLowerCase().trim();
      const { status: cStatus, reviewDate, cleanSourceRef } = extractConsultantMetadata(e);

      const matchSearch =
        !q ||
        e.description_ar.toLowerCase().includes(q) ||
        (cleanSourceRef && cleanSourceRef.toLowerCase().includes(q)) ||
        e.entry_date.includes(q) ||
        (reviewDate && reviewDate.includes(q));

      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      const matchConsultant = consultantFilter === 'all' || cStatus === consultantFilter;

      return matchSearch && matchStatus && matchConsultant;
    });
  }, [entries, searchQuery, statusFilter, consultantFilter]);

  // Aggregate Totals
  const totalOnSiteCount = entries.filter((e) => e.status === 'on_site').length;
  const totalPartiallyInstalled = entries.filter((e) => e.status === 'partially_installed').length;
  const totalInstalled = entries.filter((e) => e.status === 'installed').length;
  const totalConsultantApproved = entries.filter((e) => {
    const { status } = extractConsultantMetadata(e);
    return status === 'code_a' || status === 'code_b';
  }).length;

  return (
    <div className="space-y-6">
      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* On Site */}
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20 shrink-0">
            <Boxes className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-amber-800 dark:text-amber-300 font-medium truncate">
              {isAr ? 'مشون بالموقع' : 'On-Site Materials'}
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              {isAr ? `${totalOnSiteCount} مادة` : `${totalOnSiteCount} items`}
            </div>
          </div>
        </div>

        {/* Partially Installed */}
        <div className="p-4 sm:p-5 rounded-3xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-500 text-white shadow-md shadow-blue-500/20 shrink-0">
            <Clock className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-blue-800 dark:text-blue-300 font-medium truncate">
              {isAr ? 'تركيب جزئي' : 'Partially Installed'}
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              {isAr ? `${totalPartiallyInstalled} مادة` : `${totalPartiallyInstalled} items`}
            </div>
          </div>
        </div>

        {/* Fully Installed */}
        <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20 shrink-0">
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium truncate">
              {isAr ? 'تم التركيب والخصم' : 'Fully Installed'}
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              {isAr ? `${totalInstalled} مادة` : `${totalInstalled} items`}
            </div>
          </div>
        </div>

        {/* Consultant Approved (Code A/B) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/60 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/20 shrink-0">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-purple-800 dark:text-purple-300 font-medium truncate">
              {isAr ? 'معتمد من الاستشاري' : 'Consultant Approved'}
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              {isAr ? `${totalConsultantApproved} مادة` : `${totalConsultantApproved} approved`}
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="flex flex-wrap flex-1 items-center gap-2.5 sm:gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" aria-hidden="true" />
              <input
                type="text"
                aria-label={isAr ? 'البحث في سجل التشوينات' : 'Search MOS register'}
                placeholder={isAr ? 'البحث بالمادة، كود الفاتورة، أو التاريخ...' : 'Search by material, invoice, or date...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ps-9 pe-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>

            {/* Site Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MosStatus | 'all')}
              aria-label={isAr ? 'تصفية حسب حالة التشوين بالموقع' : 'Filter by site status'}
              className="cursor-pointer px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'كافة حالات التشوين' : 'All site statuses'}</option>
              <option value="on_site" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? '📦 مشون بالموقع' : '📦 On Site'}</option>
              <option value="partially_installed" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? '⏳ تركيب جزئي' : '⏳ Partially Installed'}</option>
              <option value="installed" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? '✅ تم التركيب بالكامل' : '✅ Fully Installed'}</option>
            </select>

            {/* Consultant Approval Filter */}
            <select
              value={consultantFilter}
              onChange={(e) => setConsultantFilter(e.target.value as MosConsultantApprovalCode | 'all')}
              aria-label={isAr ? 'تصفية حسب اعتماد الاستشاري' : 'Filter by consultant status'}
              className="cursor-pointer px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'كافة اعتمادات الاستشاري' : 'All consultant statuses'}</option>
              <option value="code_a" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? '🟢 معتمد (فئة أ)' : '🟢 Code A (Approved)'}</option>
              <option value="code_b" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? '🔵 معتمد بملاحظات (فئة ب)' : '🔵 Code B (Approved w/ Notes)'}</option>
              <option value="code_c" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? '🟠 تعديل وإعادة تقديم (فئة ج)' : '🟠 Code C (Revise & Resubmit)'}</option>
              <option value="code_d" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? '🔴 مرفوض (فئة د)' : '🔴 Code D (Rejected)'}</option>
              <option value="pending" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? '⚪ قيد مراجعة الاستشاري' : '⚪ Pending Review'}</option>
            </select>

            {/* Refresh Action */}
            <button
              type="button"
              onClick={loadMosData}
              aria-label={isAr ? 'تحديث البيانات' : 'Refresh data'}
              title={isAr ? 'تحديث البيانات' : 'Refresh'}
              className="cursor-pointer p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} aria-hidden="true" />
            </button>

            {/* Header Download / Export Button */}
            <button
              type="button"
              onClick={handleExportRegister}
              aria-label={isAr ? 'تصدير سجل التشوينات وطرق التنفيذ' : 'Export MOS Register (Excel/CSV)'}
              title={isAr ? 'تصدير كامل السجل إلى ملف بيانات' : 'Export register to CSV'}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition font-bold text-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span className="hidden sm:inline">{isAr ? 'تصدير السجل' : 'Export Register'}</span>
            </button>
          </div>

          {/* Add New Entry Button */}
          <button
            type="button"
            onClick={() => {
              setSaveError(null);
              setIsAddModalOpen(true);
            }}
            aria-label={isAr ? 'تسجيل تشوين جديد وطريقة تنفيذ' : 'Add New MOS Entry'}
            className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>{isAr ? 'تسجيل تشوين / طريقة تنفيذ جديدة' : 'Add New MOS Entry'}</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <ResizableTable tableId="mos_register_table">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50/90 dark:bg-slate-800/60 backdrop-blur-xs text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-bold text-xs select-none">
                <tr>
                  {/* 1. Date: Always visible */}
                  <th scope="col" className="px-3.5 py-3.5 text-start whitespace-nowrap font-bold text-slate-700 dark:text-slate-200">
                    {isAr ? 'تاريخ التشوين' : 'Entry Date'}
                  </th>

                  {/* 2. Description: Always visible */}
                  <th scope="col" className="px-3.5 py-3.5 text-start min-w-[180px] sm:min-w-[220px] font-bold text-slate-700 dark:text-slate-200">
                    {isAr ? 'بيان المادة وطريقة التنفيذ' : 'Description & Specs'}
                  </th>

                  {/* 3. Unit: Hidden on mobile (<640px) */}
                  <th scope="col" className="px-2.5 py-3.5 text-center hidden sm:table-cell font-bold text-slate-700 dark:text-slate-200">
                    {isAr ? 'الوحدة' : 'Unit'}
                  </th>

                  {/* 4. Supplied Qty: Hidden on mobile (<640px) */}
                  <th scope="col" className="px-3 py-3.5 text-center hidden sm:table-cell whitespace-nowrap font-bold text-slate-700 dark:text-slate-200">
                    {isAr ? 'الكمية المشونة' : 'Supplied Qty'}
                  </th>

                  {/* 5. Delivery Note / Invoice: Hidden on tablet/mobile (<768px) */}
                  <th scope="col" className="px-3 py-3.5 text-center hidden md:table-cell font-bold text-slate-700 dark:text-slate-200">
                    {isAr ? 'إذن التوريد / الفاتورة' : 'Invoice / Ref'}
                  </th>

                  {/* 6. Subcontractor: Hidden on tablet/mobile (<1024px) */}
                  <th scope="col" className="px-3 py-3.5 text-center hidden lg:table-cell font-bold text-slate-700 dark:text-slate-200">
                    {isAr ? 'المقاول المسند' : 'Assigned Sub'}
                  </th>

                  {/* 7. Consultant Approval Status Pill: Hidden on mobile (<640px) */}
                  <th scope="col" className="px-3 py-3.5 text-center hidden sm:table-cell whitespace-nowrap font-bold text-slate-700 dark:text-slate-200">
                    {isAr ? 'اعتماد الاستشاري' : 'Consultant Status'}
                  </th>

                  {/* 8. Consultant Review Date: Hidden on mobile & tablet (<768px) */}
                  <th scope="col" className="px-3 py-3.5 text-center hidden md:table-cell whitespace-nowrap font-bold text-slate-700 dark:text-slate-200">
                    {isAr ? 'تاريخ مراجعة الاستشاري' : 'Consultant Date'}
                  </th>

                  {/* 9. Site Lifecycle Status: Always visible */}
                  <th scope="col" className="px-3 py-3.5 text-center whitespace-nowrap font-bold text-slate-700 dark:text-slate-200">
                    {isAr ? 'حالة التشوين' : 'Site Status'}
                  </th>

                  {/* 10. Actions: Always visible */}
                  <th scope="col" className="px-3 py-3.5 text-center whitespace-nowrap font-bold text-slate-700 dark:text-slate-200">
                    {isAr ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-16 text-center text-slate-400 dark:text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" aria-hidden="true" />
                      <span>{isAr ? 'جاري تحميل سجل التشوينات وطرق التنفيذ...' : 'Loading MOS register...'}</span>
                    </td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-16 text-center text-slate-400 dark:text-slate-500">
                      <Boxes className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" aria-hidden="true" />
                      <div className="font-bold text-slate-700 dark:text-slate-300">
                        {isAr ? 'لا توجد تشوينات أو طرق تنفيذ مسجلة' : 'No MOS entries recorded'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {isAr 
                          ? 'انقر على "تسجيل تشوين جديد" لتوثيق المواد وطرق التنفيذ واعتماد الاستشاري' 
                          : 'Click "Add New MOS Entry" to document materials, specs, and consultant reviews'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => {
                    const statusInfo = MOS_STATUS_CONFIG[entry.status] || MOS_STATUS_CONFIG.on_site;
                    const SiteStatusIcon = statusInfo.icon;

                    const linkedSub = subcontractors.find((s) => s.id === entry.subcontractor_id);
                    const linkedBoq = boqItems.find((b) => b.id === entry.boq_item_id);

                    const { status: cStatus, reviewDate, cleanSourceRef } = extractConsultantMetadata(entry);
                    const consultantMeta = MOS_CONSULTANT_STATUS_CONFIG[cStatus];
                    const ConsultantIcon = consultantMeta.icon;

                    return (
                      <tr 
                        key={entry.id} 
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group"
                      >
                        {/* 1. Date */}
                        <td className="px-3.5 py-3.5 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap text-xs">
                          {entry.entry_date}
                        </td>

                        {/* 2. Description & Mobile Context */}
                        <td className="px-3.5 py-3.5 max-w-xs sm:max-w-sm">
                          <div className="font-bold text-slate-900 dark:text-white leading-snug">
                            {entry.description_ar}
                          </div>

                          {linkedBoq && (
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                              {isAr ? `مرتبط ببند المقايسة: ${linkedBoq.item_code}` : `BOQ: ${linkedBoq.item_code}`}
                            </div>
                          )}

                          {/* Responsive Micro-Badges for Screen-Widths where Columns are Hidden */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {/* Mobile Qty & Unit Chip */}
                            <span className="sm:hidden inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                              {Number(entry.qty_supplied).toLocaleString()} {entry.unit}
                            </span>

                            {/* Mobile Subcontractor Chip */}
                            {linkedSub && (
                              <span className="lg:hidden inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                                {linkedSub.company_name}
                              </span>
                            )}

                            {/* Mobile Invoice / Delivery Note Chip */}
                            {cleanSourceRef && (
                              <span className="md:hidden inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                                {cleanSourceRef}
                              </span>
                            )}

                            {/* Mobile Consultant Status Chip */}
                            <span 
                              role="status"
                              aria-label={isAr ? consultantMeta.ariaLabelAr : consultantMeta.ariaLabelEn}
                              className={clsx(
                                'sm:hidden inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border shadow-2xs',
                                consultantMeta.color
                              )}
                            >
                              <ConsultantIcon className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                              <span>{isAr ? consultantMeta.shortLabelAr : consultantMeta.shortLabelEn}</span>
                            </span>
                          </div>
                        </td>

                        {/* 3. Unit (Hidden on Mobile) */}
                        <td className="px-2.5 py-3.5 text-center font-mono text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                          {entry.unit}
                        </td>

                        {/* 4. Supplied Quantity (Hidden on Mobile) */}
                        <td className="px-3 py-3.5 text-center font-mono font-bold text-slate-900 dark:text-white hidden sm:table-cell whitespace-nowrap">
                          {Number(entry.qty_supplied).toLocaleString()}
                        </td>

                        {/* 5. Delivery Note / Invoice Ref (Hidden on Mobile/Tablet) */}
                        <td className="px-3 py-3.5 text-center font-mono text-slate-600 dark:text-slate-400 hidden md:table-cell">
                          {cleanSourceRef || '-'}
                        </td>

                        {/* 6. Subcontractor (Hidden on Mobile/Tablet) */}
                        <td className="px-3 py-3.5 text-center text-slate-600 dark:text-slate-400 hidden lg:table-cell">
                          {linkedSub ? linkedSub.company_name : '-'}
                        </td>

                        {/* 7. Consultant Approval Status Pill (Hidden on Mobile) */}
                        <td className="px-3 py-3.5 text-center whitespace-nowrap hidden sm:table-cell">
                          <span
                            role="status"
                            aria-label={isAr ? consultantMeta.ariaLabelAr : consultantMeta.ariaLabelEn}
                            title={consultantMeta.descriptionAr}
                            className={clsx(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors shadow-2xs',
                              consultantMeta.color
                            )}
                          >
                            <ConsultantIcon className="w-3 h-3 shrink-0" aria-hidden="true" />
                            <span>{isAr ? consultantMeta.labelAr : consultantMeta.labelEn}</span>
                          </span>
                        </td>

                        {/* 8. Consultant Review Date (Hidden on Mobile/Tablet) */}
                        <td className="px-3 py-3.5 text-center font-mono whitespace-nowrap hidden md:table-cell">
                          {reviewDate ? (
                            <span 
                              aria-label={isAr ? `تاريخ مراجعة الاستشاري: ${reviewDate}` : `Consultant review date: ${reviewDate}`}
                              className="inline-flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-300"
                            >
                              <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" aria-hidden="true" />
                              <span>{reviewDate}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                              {isAr ? 'قيد المراجعة' : 'Pending'}
                            </span>
                          )}
                        </td>

                        {/* 9. Site Lifecycle Status (Always Visible) */}
                        <td className="px-3 py-3.5 text-center whitespace-nowrap">
                          <span
                            role="status"
                            aria-label={isAr ? statusInfo.ariaLabelAr : statusInfo.ariaLabelEn}
                            className={clsx(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors shadow-2xs',
                              statusInfo.color
                            )}
                          >
                            <SiteStatusIcon className="w-3 h-3 shrink-0" aria-hidden="true" />
                            <span>{isAr ? statusInfo.labelAr : statusInfo.labelEn}</span>
                          </span>
                        </td>

                        {/* 10. Actions (Download & Change Status) */}
                        <td className="px-3 py-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Download Action Button */}
                            <button
                              type="button"
                              onClick={() => handleDownloadEntryVoucher(entry)}
                              aria-label={
                                isAr 
                                  ? `تحميل بطاقة اعتماد وإذن توريد ${entry.description_ar}` 
                                  : `Download submittal sheet for ${entry.description_ar}`
                              }
                              title={isAr ? 'تحميل بطاقة التشوين والاعتماد' : 'Download MOS Submittal Sheet'}
                              className="cursor-pointer p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-800 transition shadow-2xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                            >
                              <FileDown className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>

                            {/* Status Transition Action Button */}
                            {statusInfo.nextStatus && (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(entry)}
                                aria-label={isAr ? statusInfo.nextLabelAr : statusInfo.nextLabelEn}
                                title={isAr ? statusInfo.nextLabelAr : statusInfo.nextLabelEn}
                                className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-800 transition shadow-2xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                              >
                                <RefreshCw className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" aria-hidden="true" />
                                <span className="hidden xl:inline">{isAr ? statusInfo.nextLabelAr : statusInfo.nextLabelEn}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </ResizableTable>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            {isAr ? 'إجمالي عناصر التشوين وطرق التنفيذ المعروضة:' : 'Total displayed MOS entries:'}{' '}
            <strong className="text-slate-900 dark:text-white font-mono">{filteredEntries.length}</strong>{' '}
            {isAr ? 'عنصر' : 'items'}
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500">
            <span>
              {isAr ? 'معتمد من الاستشاري:' : 'Approved (A/B):'}{' '}
              <strong className="text-emerald-700 dark:text-emerald-400 font-mono">{totalConsultantApproved}</strong>
            </span>
            <span>•</span>
            <span>
              {isAr ? 'مشون بالموقع:' : 'On-Site:'}{' '}
              <strong className="text-amber-700 dark:text-amber-400 font-mono">{totalOnSiteCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Add New MOS Entry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                <span>{isAr ? 'تسجيل تشوين مواد وطريقة تنفيذ جديدة' : 'New On-Site & MOS Entry'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
                className="cursor-pointer p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {saveError && (
              <div 
                role="alert"
                className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveEntry} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'تاريخ التشوين والتقديم *' : 'Entry Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={newEntryDate}
                    onChange={(e) => setNewEntryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white dark:[color-scheme:dark] transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'ربط ببند جدول الكميات' : 'BOQ Item Link'}
                  </label>
                  <select
                    value={newBoqItemId}
                    onChange={(e) => handleSelectBoqItem(e.target.value)}
                    className="cursor-pointer w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{isAr ? '-- اختياري (تحديد بند) --' : '-- Optional (Select BOQ) --'}</option>
                    {boqItems.map((b) => (
                      <option key={b.id} value={b.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                        {b.item_code} - {b.description_ar.slice(0, 35)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'بيان ووصف المادة وطريقة التنفيذ *' : 'Material & Method Statement Description *'}
                </label>
                <input
                  type="text"
                  required
                  value={newDescriptionAr}
                  onChange={(e) => setNewDescriptionAr(e.target.value)}
                  placeholder={isAr ? 'مثال: رولات عزل HDPE 1.5mm، حديد تسليح قطر 16 مم...' : 'e.g. HDPE 1.5mm membrane, 16mm rebar...'}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الكمية المشونة *' : 'Supplied Quantity *'}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    required
                    value={newQtySupplied || ''}
                    onChange={(e) => setNewQtySupplied(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الوحدة *' : 'Unit *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="m2, m3, ton, kg..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'رقم إذن التوريد / الفاتورة' : 'Delivery Note / Invoice Ref'}
                  </label>
                  <input
                    type="text"
                    value={newSourceRef}
                    onChange={(e) => setNewSourceRef(e.target.value)}
                    placeholder="INV-2026-88"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'المقاول المسند' : 'Assigned Subcontractor'}
                  </label>
                  <select
                    value={newSubcontractorId}
                    onChange={(e) => setNewSubcontractorId(e.target.value)}
                    className="cursor-pointer w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{isAr ? '-- عهدة الشركة / بدون --' : '-- Direct / Company --'}</option>
                    {subcontractors.map((s) => (
                      <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                        {s.company_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Consultant Review & Approval Fields */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'اعتماد الاستشاري (الفئات أ - د)' : 'Consultant Approval (Code A-D)'}
                  </label>
                  <select
                    value={newConsultantStatus}
                    onChange={(e) => setNewConsultantStatus(e.target.value as MosConsultantApprovalCode)}
                    className="cursor-pointer w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <option value="pending" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{isAr ? 'قيد مراجعة الاستشاري' : 'Under Review (Pending)'}</option>
                    <option value="code_a" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{isAr ? '🟢 معتمد (فئة أ)' : '🟢 Code A (Approved)'}</option>
                    <option value="code_b" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{isAr ? '🔵 معتمد بملاحظات (فئة ب)' : '🔵 Code B (Approved w/ Notes)'}</option>
                    <option value="code_c" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{isAr ? '🟠 تعديل وإعادة تقديم (فئة ج)' : '🟠 Code C (Revise)'}</option>
                    <option value="code_d" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{isAr ? '🔴 مرفوض (فئة د)' : '🔴 Code D (Rejected)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'تاريخ مراجعة الاستشاري' : 'Consultant Review Date'}
                  </label>
                  <input
                    type="date"
                    value={newConsultantReviewDate}
                    onChange={(e) => setNewConsultantReviewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white dark:[color-scheme:dark] transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="cursor-pointer px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="cursor-pointer px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md shadow-emerald-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                >
                  {isSaving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ التشوين' : 'Save Entry')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
