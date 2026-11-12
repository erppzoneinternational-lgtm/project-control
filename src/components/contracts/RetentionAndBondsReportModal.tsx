'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Project } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/lib/format';
import {
  computeProjectRetentionBondMetrics,
  aggregateRetentionBondPortfolio,
  ProjectRetentionBondMetrics,
} from '@/lib/utils/retention-bond-tracking.utils';
import { ProjectGuaranteesSection, ProjectGuaranteesData } from './ProjectGuaranteesSection';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  X,
  Printer,
  Download,
  Search,
  ShieldAlert,
  ShieldCheck,
  Banknote,
  Clock,
  AlertTriangle,
  Award,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  SlidersHorizontal,
  ExternalLink,
  Edit3,
  Save,
  Loader2,
  FileSpreadsheet,
  RotateCcw,
  Pin,
} from 'lucide-react';
import { UniversalReportModal } from '@/components/reports/UniversalReportModal';
import {
  ReportColumn,
  ReportKpiCard,
  openPrintWindow,
  generatePrintHtml,
  exportReportToExcel as runExportReportToExcel,
  generateReportCode,
} from '@/lib/reports/reportEngine';

export interface RetentionAndBondsReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onProjectUpdated?: () => void;
}

type ReportFilterTab = 'all' | 'missed_overdue' | 'missing_toc' | 'with_toc' | 'pending' | 'released';

export const RetentionAndBondsReportModal: React.FC<RetentionAndBondsReportModalProps> = ({
  isOpen,
  onClose,
  projects,
  onProjectUpdated,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ReportFilterTab>('all');
  const [editingDaysProjectId, setEditingDaysProjectId] = useState<string | null>(null);
  const [tempRetentionDays, setTempRetentionDays] = useState<number>(30);
  const [tempBondDays, setTempBondDays] = useState<number>(30);
  const [editingGuaranteesProject, setEditingGuaranteesProject] = useState<Project | null>(null);
  const [guaranteesTempMetadata, setGuaranteesTempMetadata] = useState<ProjectGuaranteesData>({});
  const [isSaving, setIsSaving] = useState(false);

  // Freeze project column state (persisted in localStorage, default true)
  const [freezeProjectName, setFreezeProjectName] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pzone_retention_report_freeze_name');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const toggleFreezeProjectName = useCallback(() => {
    setFreezeProjectName((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pzone_retention_report_freeze_name', String(next));
      } catch {}
      return next;
    });
  }, []);

  const modalRef = useRef<HTMLDivElement>(null);

  // Compute metrics for all finished or handing-over projects
  const portfolioStats = useMemo(() => {
    return aggregateRetentionBondPortfolio(projects);
  }, [projects]);

  // Filtered list based on search and selected tab
  const filteredMetrics = useMemo(() => {
    let list = portfolioStats.metricsList;

    // Search query filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((m) => {
        const name = (m.project.project_name || '').toLowerCase();
        const code = (m.project.project_code || '').toLowerCase();
        const client = (m.project.client?.name_ar || m.project.client_name_raw || '').toLowerCase();
        const pm = (m.project.pm_full_name || m.project.project_manager_name_raw || '').toLowerCase();
        return name.includes(q) || code.includes(q) || client.includes(q) || pm.includes(q);
      });
    }

    // Tab filter
    if (activeTab === 'missed_overdue') {
      list = list.filter((m) => m.isMissedBondOrRetention);
    } else if (activeTab === 'missing_toc') {
      list = list.filter((m) => !m.hasToc);
    } else if (activeTab === 'with_toc') {
      list = list.filter((m) => m.hasToc);
    } else if (activeTab === 'pending') {
      list = list.filter((m) => !m.tranche1Released || !m.tranche2Released);
    } else if (activeTab === 'released') {
      list = list.filter((m) => m.tranche1Released && m.tranche2Released);
    }

    // Default sort: Missed/Overdue first, then by contract value desc
    return list.sort((a, b) => {
      if (a.isMissedBondOrRetention && !b.isMissedBondOrRetention) return -1;
      if (!a.isMissedBondOrRetention && b.isMissedBondOrRetention) return 1;
      return b.totalContractValue - a.totalContractValue;
    });
  }, [portfolioStats.metricsList, search, activeTab]);



  // Toggle tranche release status directly from report
  const handleToggleRelease = async (project: Project, tranche: 1 | 2, currentVal: boolean) => {
    const nextVal = !currentVal;
    const currentMeta = project.metadata || {};
    const fieldKey = tranche === 1 ? 'retention_tranche_1_released' : 'retention_tranche_2_released';

    try {
      const updatedMeta = {
        ...currentMeta,
        [fieldKey]: nextVal,
      };

      const { error } = await supabase
        .from('pm_projects')
        .update({
          metadata: updatedMeta,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);

      if (error) throw error;

      toast.success(
        isAr
          ? `تم تحديث حالة صرف الدفعة ${tranche} بنجاح`
          : `Tranche ${tranche} release status updated`
      );
      onProjectUpdated?.();
    } catch (err: any) {
      toast.error(isAr ? 'فشل حفظ حالة الصرف' : 'Failed to update release status');
    }
  };

  // Toggle Performance Bond release
  const handleToggleBondRelease = async (project: Project, currentVal: boolean) => {
    const nextVal = !currentVal;
    const currentMeta = project.metadata || {};

    try {
      const updatedMeta = {
        ...currentMeta,
        performance_bond_released: nextVal,
      };

      const { error } = await supabase
        .from('pm_projects')
        .update({
          metadata: updatedMeta,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);

      if (error) throw error;

      toast.success(
        isAr
          ? `تم تحديث حالة خطاب ضمان حسن التنفيذ: ${nextVal ? 'تم الاسترداد' : 'ساري/معلق'}`
          : `Performance bond status updated`
      );
      onProjectUpdated?.();
    } catch (err: any) {
      toast.error(isAr ? 'فشل تحديث حالة خطاب الضمان' : 'Failed to update bond status');
    }
  };

  // Save customized contractual days for project
  const handleSaveContractualDays = async (project: Project) => {
    setIsSaving(true);
    try {
      const currentMeta = project.metadata || {};
      const updatedMeta = {
        ...currentMeta,
        retention_release_days: tempRetentionDays,
        performance_bond_release_days: tempBondDays,
      };

      const { error } = await supabase
        .from('pm_projects')
        .update({
          metadata: updatedMeta,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);

      if (error) throw error;

      toast.success(
        isAr
          ? 'تم حفظ المدد التعاقدية لاسترداد المبالغ والخطابات طبقاً للعقد'
          : 'Contractual days for retention & bond release saved'
      );
      setEditingDaysProjectId(null);
      onProjectUpdated?.();
    } catch (err: any) {
      toast.error(isAr ? 'فشل حفظ البيانات التعاقدية' : 'Failed to save contractual terms');
    } finally {
      setIsSaving(false);
    }
  };

  // Open full guarantees editor modal
  const handleOpenGuaranteesEditor = (project: Project) => {
    setEditingGuaranteesProject(project);
    setGuaranteesTempMetadata((project.metadata as ProjectGuaranteesData) || {});
  };

  // Save full guarantees editor changes
  const handleSaveGuaranteesModal = async () => {
    if (!editingGuaranteesProject) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('pm_projects')
        .update({
          metadata: guaranteesTempMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingGuaranteesProject.id);

      if (error) throw error;

      toast.success(
        isAr
          ? 'تم حفظ وتحديث بنود خطابات الضمان ومحجوز الضمان بنجاح'
          : 'Project guarantees and retention terms updated successfully'
      );
      setEditingGuaranteesProject(null);
      onProjectUpdated?.();
    } catch (err: any) {
      toast.error(isAr ? 'فشل حفظ بيانات الضمان' : 'Failed to save guarantee terms');
    } finally {
      setIsSaving(false);
    }
  };

  // Custom Report Studio state
  const [isCustomReportModalOpen, setIsCustomReportModalOpen] = useState(false);

  // Universal Report Columns
  const reportColumns = useMemo<ReportColumn<ProjectRetentionBondMetrics>[]>(() => [
    {
      id: 'project_code',
      labelAr: 'كود المشروع',
      labelEn: 'Project Code',
      categoryAr: 'بيانات المشروع الأساسية',
      getValue: (m) => m.project.project_code || '—',
      defaultVisible: true,
    },
    {
      id: 'project_name',
      labelAr: 'اسم المشروع',
      labelEn: 'Project Name',
      categoryAr: 'بيانات المشروع الأساسية',
      getValue: (m) => m.project.project_name || '—',
      defaultVisible: true,
    },
    {
      id: 'client_name',
      labelAr: 'العميل / المالك',
      labelEn: 'Client / Owner',
      categoryAr: 'بيانات المشروع الأساسية',
      getValue: (m) => m.project.client?.name_ar || m.project.client_name_raw || '—',
      defaultVisible: true,
    },
    {
      id: 'pm_name',
      labelAr: 'مدير المشروع',
      labelEn: 'Project Manager',
      categoryAr: 'بيانات المشروع الأساسية',
      getValue: (m) => m.project.pm_full_name || m.project.project_manager_name_raw || '—',
      defaultVisible: true,
    },
    {
      id: 'status',
      labelAr: 'حالة المشروع',
      labelEn: 'Status',
      categoryAr: 'بيانات المشروع الأساسية',
      getValue: (m) => m.project.status,
      defaultVisible: true,
    },
    {
      id: 'has_toc',
      labelAr: 'شهادة الاستلام الابتدائي (TOC)',
      labelEn: 'TOC Certificate',
      categoryAr: 'بيانات المشروع الأساسية',
      getValue: (m) => (m.hasToc ? (m.tocReference || 'معتمد') : 'غير متوفر'),
      defaultVisible: true,
    },
    {
      id: 'handover_date',
      labelAr: 'تاريخ التسليم الفعلي',
      labelEn: 'Handover Date',
      categoryAr: 'بيانات المشروع الأساسية',
      getValue: (m) => m.handoverDateStr || '—',
      defaultVisible: true,
    },
    {
      id: 'contract_base_val',
      labelAr: 'أصل قيمة العقد',
      labelEn: 'Base Contract Value',
      categoryAr: 'القيم والالتزامات التعاقدية',
      getValue: (m) => m.contractBaseValue,
      formatPrint: (m) => formatCurrency(m.contractBaseValue),
      formatExcel: (m) => m.contractBaseValue,
      isCurrency: true,
      defaultVisible: false,
    },
    {
      id: 'vos_val',
      labelAr: 'أوامر التغيير (VOs)',
      labelEn: 'Variation Orders',
      categoryAr: 'القيم والالتزامات التعاقدية',
      getValue: (m) => m.vosValue,
      formatPrint: (m) => formatCurrency(m.vosValue),
      formatExcel: (m) => m.vosValue,
      isCurrency: true,
      defaultVisible: false,
    },
    {
      id: 'total_contract_val',
      labelAr: 'إجمالي قيمة العقد المعدلة',
      labelEn: 'Total Contract Value',
      categoryAr: 'القيم والالتزامات التعاقدية',
      getValue: (m) => m.totalContractValue,
      formatPrint: (m) => formatCurrency(m.totalContractValue),
      formatExcel: (m) => m.totalContractValue,
      isCurrency: true,
      defaultVisible: true,
    },
    {
      id: 'retention_type',
      labelAr: 'نوع محجوز الضمان',
      labelEn: 'Retention Type',
      categoryAr: 'محجوز الضمان (Retention)',
      getValue: (m) => (m.retentionType === 'retention_bond' ? 'خطاب ضمان صيانة' : m.retentionType === 'none' ? 'بدون حجز' : 'استقطاع نقدي'),
      defaultVisible: false,
    },
    {
      id: 'retention_calc_base',
      labelAr: 'أساس احتساب الاستقطاع',
      labelEn: 'Calc Base',
      categoryAr: 'محجوز الضمان (Retention)',
      getValue: (m) => (m.retentionCalcBase === 'total' ? 'إجمالي العقد شامل VOs' : 'أصل العقد بدون VOs'),
      defaultVisible: false,
    },
    {
      id: 'retention_rate',
      labelAr: 'نسبة الاستقطاع (%)',
      labelEn: 'Retention Rate %',
      categoryAr: 'محجوز الضمان (Retention)',
      getValue: (m) => `${m.retentionRatePct}%`,
      formatExcel: (m) => m.retentionRatePct,
      defaultVisible: true,
    },
    {
      id: 'total_retention',
      labelAr: 'إجمالي محجوز الضمان (ج.م)',
      labelEn: 'Total Retention Amount',
      categoryAr: 'محجوز الضمان (Retention)',
      getValue: (m) => m.totalRetentionAmount,
      formatPrint: (m) => formatCurrency(m.totalRetentionAmount),
      formatExcel: (m) => m.totalRetentionAmount,
      isCurrency: true,
      defaultVisible: true,
    },
    {
      id: 'tranche1_amount',
      labelAr: 'دفعة الاستلام الابتدائي (TOC)',
      labelEn: 'TOC Tranche 1 Due',
      categoryAr: 'محجوز الضمان (Retention)',
      getValue: (m) => m.tranche1Amount,
      formatPrint: (m) => formatCurrency(m.tranche1Amount),
      formatExcel: (m) => m.tranche1Amount,
      isCurrency: true,
      defaultVisible: true,
    },
    {
      id: 'retention_days',
      labelAr: 'المدة التعاقدية للصرف (يوم)',
      labelEn: 'Contractual Days',
      categoryAr: 'محجوز الضمان (Retention)',
      getValue: (m) => m.retentionContractualDays,
      defaultVisible: true,
    },
    {
      id: 'retention_due_date',
      labelAr: 'تاريخ استحقاق محجوز الضمان',
      labelEn: 'Retention Due Date',
      categoryAr: 'محجوز الضمان (Retention)',
      getValue: (m) => m.retentionDueDateStr || '—',
      defaultVisible: true,
    },
    {
      id: 'retention_status',
      labelAr: 'حالة صرف محجوز الضمان',
      labelEn: 'Retention Status',
      categoryAr: 'محجوز الضمان (Retention)',
      getValue: (m) => (m.tranche1Released ? 'تم الصرف بالكامل' : m.isRetentionOverdue ? `متأخر (${m.retentionOverdueDays} يوم)` : 'مستحق/ساري'),
      defaultVisible: true,
    },
    {
      id: 'retention_overdue_days',
      labelAr: 'أيام التأخير عن الصرف',
      labelEn: 'Overdue Days',
      categoryAr: 'محجوز الضمان (Retention)',
      getValue: (m) => (m.isRetentionOverdue ? m.retentionOverdueDays : 0),
      defaultVisible: false,
    },
    {
      id: 'has_bond',
      labelAr: 'هل يوجد خطاب حسن تنفيذ؟',
      labelEn: 'Has Performance Bond',
      categoryAr: 'خطابات ضمان حسن التنفيذ',
      getValue: (m) => (m.hasPerformanceBond ? 'نعم' : 'لا'),
      defaultVisible: true,
    },
    {
      id: 'bond_number',
      labelAr: 'رقم خطاب الضمان',
      labelEn: 'Bond Ref Number',
      categoryAr: 'خطابات ضمان حسن التنفيذ',
      getValue: (m) => m.performanceBondNumber || '—',
      defaultVisible: false,
    },
    {
      id: 'bond_bank',
      labelAr: 'البنك المصدر للخطاب',
      labelEn: 'Issuing Bank',
      categoryAr: 'خطابات ضمان حسن التنفيذ',
      getValue: (m) => m.performanceBondBank || '—',
      defaultVisible: false,
    },
    {
      id: 'bond_amount',
      labelAr: 'قيمة خطاب حسن التنفيذ (ج.م)',
      labelEn: 'Performance Bond Amount',
      categoryAr: 'خطابات ضمان حسن التنفيذ',
      getValue: (m) => m.performanceBondAmount,
      formatPrint: (m) => formatCurrency(m.performanceBondAmount),
      formatExcel: (m) => m.performanceBondAmount,
      isCurrency: true,
      defaultVisible: true,
    },
    {
      id: 'bond_status',
      labelAr: 'حالة خطاب الضمان',
      labelEn: 'Bond Status',
      categoryAr: 'خطابات ضمان حسن التنفيذ',
      getValue: (m) => (m.performanceBondReleased ? 'تم الاسترداد' : m.isBondOverdue ? `متأخر (${m.bondOverdueDays} يوم)` : 'ساري'),
      defaultVisible: true,
    },
    {
      id: 'bond_overdue_days',
      labelAr: 'أيام تأخير استرداد الخطاب',
      labelEn: 'Bond Overdue Days',
      categoryAr: 'خطابات ضمان حسن التنفيذ',
      getValue: (m) => (m.isBondOverdue ? m.bondOverdueDays : 0),
      defaultVisible: false,
    },
  ], []);

  // Universal Report KPIs
  const reportKpis = useMemo<ReportKpiCard[]>(() => [
    {
      id: 'kpi-1',
      label: isAr ? 'المشاريع المنتهية والتسليم' : 'Tracked Projects',
      value: portfolioStats.totalTrackedProjects,
      tone: 'default',
    },
    {
      id: 'kpi-2',
      label: isAr ? 'منتهية بدون TOC' : 'Missing TOC',
      value: portfolioStats.finishedWithoutTocCount,
      tone: 'rose',
    },
    {
      id: 'kpi-3',
      label: isAr ? 'إجمالي محجوز الضمان' : 'Total Retention',
      value: formatCurrency(portfolioStats.totalWithheldRetention),
      tone: 'amber',
    },
    {
      id: 'kpi-4',
      label: isAr ? 'المفرج عنه فعلياً' : 'Released Retention',
      value: formatCurrency(portfolioStats.totalReleasedRetention),
      tone: 'emerald',
    },
    {
      id: 'kpi-5',
      label: isAr ? 'محجوز معلق ومستحق' : 'Pending Retention',
      value: formatCurrency(portfolioStats.totalPendingRetention),
      tone: 'blue',
    },
    {
      id: 'kpi-6',
      label: isAr ? 'خطابات ضمان متأخرة' : 'Overdue Bonds',
      value: portfolioStats.missedBondCount,
      tone: 'rose',
    },
  ], [portfolioStats, isAr]);

  // Clean Print Action with Official Letterhead
  const handleDirectPrint = useCallback(() => {
    const config = {
      title: isAr ? 'تقرير حوكمة محجوز الضمان وخطابات حسن التنفيذ بعد التسليم' : 'Post-Handover Retention & Performance Bonds Report',
      subtitle: isAr ? 'متابعة استرداد المبالغ المستقطعة (5-10%) والخطابات البنكية طبقاً للمدد التعاقدية وشهادات الاستلام الابتدائي (FIDIC 14.9)' : 'Tracking contractual retention and performance bonds under FIDIC 14.9',
      companyNameAr: isAr ? 'شركة بي زون التجارية' : 'P.Zone International',
      companyNameEn: 'P.Zone International',
      reportCode: generateReportCode('PZ-RET'),
      classification: 'وثيقة رسمية معتمدة • FIDIC 14.9 & PMI CONTROLS',
      orientation: 'landscape' as const,
      paperSize: 'a4' as const,
      fontSize: 'md' as const,
      includeKpis: true,
      includeSignatures: true,
      includeTimestamp: true,
      includePageNumbers: true,
      selectedColumnIds: reportColumns.filter((c) => c.defaultVisible !== false).map((c) => c.id),
      signatures: [
        { id: 'prep', role: 'إعداد التقرير', name: '', title: 'مهندس العقود وضبط المشروعات' },
        { id: 'rev', role: 'مراجعة وتدقيق', name: '', title: 'مدير إدارة التكاليف والعقود' },
        { id: 'appr1', role: 'اعتماد المشروعات', name: '', title: 'مدير عام المشروعات (PMO)' },
        { id: 'appr2', role: 'الاعتماد المالي', name: '', title: 'المدير المالي والتجاري (CFO)' },
      ],
    };
    const html = generatePrintHtml(config, reportColumns, filteredMetrics, reportKpis);
    openPrintWindow(html);
  }, [isAr, reportColumns, filteredMetrics, reportKpis]);

  // Intercept Ctrl+P / Cmd+P while modal is active to trigger official letterhead print
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleDirectPrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDirectPrint]);

  // Formatted Excel Export
  const handleExportExcelFormatted = () => {
    const config = {
      title: isAr ? 'تقرير محجوز الضمان وخطابات حسن التنفيذ' : 'Retention and Bonds Report',
      subtitle: isAr ? 'حوكمة المبالغ والخطابات طبقاً للمدد التعاقدية وشهادات الاستلام الابتدائي' : 'Contractual Retention and Bonds Governance',
      companyNameAr: isAr ? 'شركة بي زون التجارية' : 'P.Zone International',
      companyNameEn: 'P.Zone International',
      reportCode: generateReportCode('PZ-RET'),
      orientation: 'landscape' as const,
      paperSize: 'a4' as const,
      fontSize: 'md' as const,
      includeKpis: true,
      includeSignatures: true,
      includeTimestamp: true,
      includePageNumbers: true,
      selectedColumnIds: reportColumns.map((c) => c.id),
      signatures: [],
    };
    runExportReportToExcel(config, reportColumns, filteredMetrics, reportKpis);
    toast.success(isAr ? 'تم تصدير تقرير Excel منسق بنجاح' : 'Exported Excel report');
  };

  // Compute Total Values for Table Footer
  const reportTotals = useMemo(() => {
    let totalContractValue = 0;
    let totalRetentionValue = 0;
    let totalTranche1Value = 0;
    let totalBondValue = 0;
    let releasedRetentionValue = 0;
    let pendingRetentionValue = 0;

    for (const m of filteredMetrics) {
      totalContractValue += Number(m.totalContractValue || 0);
      totalRetentionValue += Number(m.totalRetentionAmount || 0);
      totalTranche1Value += Number(m.tranche1Amount || 0);
      totalBondValue += Number(m.performanceBondAmount || 0);
      if (m.tranche1Released) {
        releasedRetentionValue += Number(m.tranche1Amount || 0);
      } else {
        pendingRetentionValue += Number(m.tranche1Amount || 0);
      }
    }

    return {
      totalContractValue,
      totalRetentionValue,
      totalTranche1Value,
      totalBondValue,
      releasedRetentionValue,
      pendingRetentionValue,
    };
  }, [filteredMetrics]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static print:z-auto print:block"
      dir={isAr ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="retention-report-title"
      data-testid="retention-bonds-report-modal"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-7xl max-h-[95vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden print:border-none print:shadow-none print:rounded-none print:max-h-none print:h-auto print:bg-white print:text-black"
      >
        {/* Print-Only Corporate Letterhead for Direct Browser Print (Ctrl+P) */}
        <div className="hidden print:block p-6 border-b-2 border-slate-900 bg-white text-black mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-lg font-black text-slate-950">
                {isAr ? 'شركة بي زون التجارية' : 'P.Zone International'}
              </div>
              <div className="border-r border-slate-300 dark:border-slate-700 pr-3 text-xs text-slate-600 font-bold">
                منظومة إدارة وضبط المشروعات وحوكمة التعاقدات (FIDIC & PMI Controls)
              </div>
            </div>
            <div className="text-center">
              <div className="text-base font-black text-slate-950">
                {isAr ? 'تقرير محجوز الضمان وخطابات الضمان بعد التسليم' : 'Post-Handover Retention & Performance Bonds Report'}
              </div>
              <div className="text-[11px] text-amber-700 dark:text-amber-300 font-bold mt-0.5">
                FIDIC 14.9 & PMI CONTROLS
              </div>
            </div>
            <div className="text-left text-xs text-slate-600 font-mono">
              <div><strong>تاريخ الإصدار:</strong> {new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</div>
              <div><strong>إجمالي السجلات:</strong> {filteredMetrics.length} مشروع</div>
            </div>
          </div>
        </div>

        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="retention-report-title" className="text-base sm:text-lg font-black tracking-tight">
                  {isAr ? 'تقرير محجوز الضمان وخطابات الضمان بعد التسليم' : 'Post-Handover Retention & Bonds Governance Report'}
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  FIDIC 14.9 & PMI
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? 'متابعة استرداد المبالغ المستقطعة (5-10%) وخطابات ضمان حسن التنفيذ طبقاً للمدد التعاقدية وشهادات الاستلام الابتدائي (TOC)'
                  : 'Track retention money recovery (5-10%) and performance bonds based on contractual days and TOC issuance'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCustomReportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all cursor-pointer shadow-sm ring-1 ring-emerald-400/40"
              title={isAr ? 'استوديو تخصيص كامل للتقرير الرسمي (أعمدة، ترويسة، توقيعات)' : 'Customize & Export Report Studio'}
            >
              <SlidersHorizontal className="w-4 h-4 text-emerald-200" />
              <span>{isAr ? 'تخصيص التقرير' : 'Custom Report'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcelFormatted}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title={isAr ? 'تصدير كملف إكسل منسق (.xlsx)' : 'Export to Excel (.xlsx)'}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'تصدير Excel' : 'Export Excel'}</span>
            </button>

            <button
              type="button"
              onClick={handleDirectPrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title={isAr ? 'طباعة التقرير الرسمي / تصدير PDF' : 'Print Official Report / PDF'}
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>{isAr ? 'طباعة' : 'Print'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Executive KPI Header (5 Key Performance Cards) */}
        <div className="p-4 sm:p-6 bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 space-y-4 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Card 1: Tracked Projects */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                {isAr ? 'المشاريع المنتهية والتسليم' : 'Finished & Handing Over'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  {portfolioStats.totalTrackedProjects}
                </span>
                <span className="text-[10px] text-slate-400">
                  ({portfolioStats.totalFinishedProjects} {isAr ? 'منتهي' : 'fin'} / {portfolioStats.totalHandingOverProjects} {isAr ? 'تسليم' : 'ho'})
                </span>
              </div>
            </div>

            {/* Card 2: Finished without TOC (Warning) */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              portfolioStats.finishedWithoutTocCount > 0
                ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
            }`}>
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 block mb-1">
                {isAr ? 'منتهية بدون TOC ⚠️' : 'Finished Missing TOC'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
                  {portfolioStats.finishedWithoutTocCount}
                </span>
                <span className="text-[10px] text-rose-600/80">
                  {isAr ? 'تحتاج محضر استلام' : 'Needs TOC letter'}
                </span>
              </div>
            </div>

            {/* Card 3: Total Withheld Retention */}
            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-300/80 dark:border-amber-900/60">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 block mb-1">
                {isAr ? 'إجمالي محجوز الضمان' : 'Total Retention Withheld'}
              </span>
              <div className="text-base sm:text-lg font-black text-amber-700 dark:text-amber-300 font-mono truncate">
                {formatCurrency(portfolioStats.totalWithheldRetention)}
              </div>
              <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 block mt-0.5">
                EGP (5% - 10%)
              </span>
            </div>

            {/* Card 4: Total Released Retention */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-300/80 dark:border-emerald-900/60">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 block mb-1">
                {isAr ? 'المفرج عنه فعلياً' : 'Released Retention'}
              </span>
              <div className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300 font-mono truncate">
                {formatCurrency(portfolioStats.totalReleasedRetention)}
              </div>
              <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 block mt-0.5">
                EGP ({portfolioStats.totalWithheldRetention > 0 ? Math.round((portfolioStats.totalReleasedRetention / portfolioStats.totalWithheldRetention) * 100) : 0}%)
              </span>
            </div>

            {/* Card 5: Pending Retention */}
            <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-300/80 dark:border-blue-900/60">
              <span className="text-[11px] font-bold text-blue-800 dark:text-blue-400 block mb-1">
                {isAr ? 'محجوز معلق ومستحق' : 'Pending Retention'}
              </span>
              <div className="text-base sm:text-lg font-black text-blue-700 dark:text-blue-300 font-mono truncate">
                {formatCurrency(portfolioStats.totalPendingRetention)}
              </div>
              <span className="text-[10px] text-blue-700/80 dark:text-blue-400/80 block mt-0.5">
                EGP
              </span>
            </div>

            {/* Card 6: Overdue Missed Bonds & Retention */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              portfolioStats.missedAnyCount > 0
                ? 'bg-red-500/10 dark:bg-red-950/30 border-red-500/40 dark:border-red-900/60 text-red-700 dark:text-red-400'
                : 'bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
            }`}>
              <span className="text-[11px] font-bold block mb-1">
                {isAr ? 'متأخرات ومفقودات 🚨' : 'Missed / Overdue Bonds'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black font-mono">
                  {portfolioStats.missedAnyCount}
                </span>
                <span className="text-[10px]">
                  {isAr ? 'مشروع متأخر' : 'Overdue'}
                </span>
              </div>
              <span className="text-[10px] opacity-80 block mt-0.5 truncate">
                {formatCurrency(portfolioStats.missedRetentionValue + portfolioStats.missedBondValue)} EGP
              </span>
            </div>
          </div>

          {/* Filter Pills and Instant Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 print:hidden">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {isAr ? `الكل (${portfolioStats.totalTrackedProjects})` : `All (${portfolioStats.totalTrackedProjects})`}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('missed_overdue')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'missed_overdue'
                    ? 'bg-red-600 text-white shadow-xs ring-2 ring-red-500/30'
                    : 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/40'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{isAr ? `متأخرات تعاقدية (${portfolioStats.missedAnyCount})` : `Missed/Overdue (${portfolioStats.missedAnyCount})`}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('missing_toc')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'missing_toc'
                    ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-500/30'
                    : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                }`}
              >
                <span>{isAr ? `بدون شهادة TOC (${portfolioStats.finishedWithoutTocCount + portfolioStats.handingOverWithoutTocCount})` : `Missing TOC (${portfolioStats.finishedWithoutTocCount + portfolioStats.handingOverWithoutTocCount})`}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('with_toc')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'with_toc'
                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/30'
                    : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>{isAr ? `بـ TOC معتمد (${portfolioStats.finishedWithTocCount})` : `With TOC (${portfolioStats.finishedWithTocCount})`}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'pending'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                }`}
              >
                {isAr ? 'معلق الصرف' : 'Pending'}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('released')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'released'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                }`}
              >
                {isAr ? 'مصروف بالكامل' : 'Fully Released'}
              </button>
            </div>

            {/* Freeze Project Name Column Toggle */}
            <button
              type="button"
              onClick={toggleFreezeProjectName}
              aria-pressed={freezeProjectName}
              title={
                isAr
                  ? freezeProjectName
                    ? 'إلغاء تجميد عمود كود واسم المشروع'
                    : 'تجميد وتثبيت عمود كود واسم المشروع أثناء التمرير الأفقي'
                  : freezeProjectName
                  ? 'Unfreeze project column'
                  : 'Freeze project column while scrolling'
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                freezeProjectName
                  ? 'bg-amber-100/90 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 transition-transform ${freezeProjectName ? 'text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400 rotate-45' : 'text-slate-400'}`} />
              <span>
                {freezeProjectName
                  ? (isAr ? 'إلغاء تجميد اسم المشروع' : 'Unfreeze Project')
                  : (isAr ? 'تجميد اسم المشروع (Freeze)' : 'Freeze Project')}
              </span>
            </button>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-3 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? 'بحث بالكود أو الاسم أو العميل...' : 'Search by code, name, client...'}
                className="w-full ps-9 pe-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Main Detailed Table */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 scrollbar-thin print:overflow-visible print:p-0 print:m-0">
          {filteredMetrics.length === 0 ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400 space-y-2">
              <Banknote className="w-12 h-12 mx-auto text-slate-400 stroke-1" />
              <p className="font-bold text-sm">
                {isAr ? 'لا توجد مشاريع تطابق محددات التصفية الحالية' : 'No projects match current filters'}
              </p>
            </div>
          ) : (
            <table className="w-full text-xs text-start border-separate border-spacing-y-2 print:border-collapse print:border-spacing-0">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th
                    className={`px-3 py-2 text-start transition-all ${
                      freezeProjectName
                        ? 'sticky start-0 z-20 bg-slate-100 dark:bg-slate-900 border-e border-slate-200 dark:border-slate-700 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.12)] min-w-[240px] max-w-[280px]'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span>{isAr ? 'كود واسم المشروع' : 'Project'}</span>
                      <button
                        type="button"
                        onClick={toggleFreezeProjectName}
                        title={
                          isAr
                            ? (freezeProjectName ? 'إلغاء تجميد العمود' : 'تجميد العمود')
                            : (freezeProjectName ? 'Unfreeze column' : 'Freeze column')
                        }
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          freezeProjectName
                            ? 'text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-900/60'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Pin className={`w-3 h-3 ${freezeProjectName ? 'fill-current rotate-45' : ''}`} />
                      </button>
                    </div>
                  </th>
                  <th className="px-3 py-2 text-start">{isAr ? 'العميل ومدير المشروع' : 'Client & PM'}</th>
                  <th className="px-3 py-2 text-center">{isAr ? 'شهادة الاستلام TOC' : 'TOC Status'}</th>
                  <th className="px-3 py-2 text-end">{isAr ? 'قيمة العقد' : 'Contract Value'}</th>
                  <th className="px-3 py-2 text-end">{isAr ? 'محجوز الضمان (مستحق عند TOC)' : 'Retention (Due on TOC)'}</th>
                  <th className="px-3 py-2 text-center">{isAr ? 'أيام الاسترداد طبقاً للعقد' : 'Contract Days'}</th>
                  <th className="px-3 py-2 text-center">{isAr ? 'استحقاق الاسترداد' : 'Due Date'}</th>
                  <th className="px-3 py-2 text-center">{isAr ? 'حالة محجوز الضمان' : 'Retention Status'}</th>
                  <th className="px-3 py-2 text-center">{isAr ? 'خطاب حسن التنفيذ' : 'Performance Bond'}</th>
                  <th className="px-3 py-2 text-center">{isAr ? 'إجراءات سريعة' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredMetrics.map((m) => {
                  const p = m.project;
                  const isEditingThis = editingDaysProjectId === p.id;

                  return (
                    <tr
                      key={p.id}
                      className={`group/row bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-xl shadow-2xs transition-colors border ${
                        m.isMissedBondOrRetention
                          ? 'border-red-300 dark:border-red-900/60 ring-1 ring-red-500/20'
                          : !m.hasToc
                          ? 'border-rose-200 dark:border-rose-900/40'
                          : 'border-slate-200/80 dark:border-slate-700/80'
                      }`}
                    >
                      {/* 1. Code & Name */}
                      <td
                        className={`px-3 py-3 rounded-s-xl transition-all ${
                          freezeProjectName
                            ? 'sticky start-0 z-10 bg-white dark:bg-slate-800/95 group-hover/row:bg-slate-50 dark:group-hover/row:bg-slate-700 border-e border-slate-200 dark:border-slate-700 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.08)] min-w-[240px] max-w-[280px]'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800/60 shrink-0">
                            #{p.project_code}
                          </span>
                          <div className="min-w-0">
                            <Link
                              href={`/projects/${p.id}`}
                              target="_blank"
                              className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 truncate block group"
                              title={p.project_name}
                            >
                              <span className="truncate">{p.project_name}</span>
                              <ExternalLink className="inline-block w-3 h-3 ms-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                            <span className="text-[10px] text-slate-400 block">
                              {p.status === 'finished' ? (isAr ? 'مكتمل / منتهي' : 'Finished') : (isAr ? 'قيد التسليم' : 'Handing Over')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Client & PM */}
                      <td className="px-3 py-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200 font-bold truncate max-w-[180px]">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{p.client?.name_ar || p.client_name_raw || '—'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{p.pm_full_name || p.project_manager_name_raw || '—'}</span>
                          </div>
                        </div>
                      </td>

                      {/* 3. TOC Certificate Status */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        {m.hasToc ? (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                            title={m.tocReference || (isAr ? 'شهادة استلام ابتدائي معتمدة' : 'Approved TOC')}
                          >
                            <Award className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{isAr ? 'TOC معتمد' : 'TOC Issued'}</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-900 animate-pulse"
                            title={isAr ? 'المشروع منتهي بدون شهادة استلام ابتدائي (TOC)' : 'Project finished without Taking-Over Certificate'}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>{isAr ? 'بدون TOC ⚠️' : 'Missing TOC'}</span>
                          </span>
                        )}
                      </td>

                      {/* 4. Total Contract Value */}
                      <td className="px-3 py-3 text-end font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatCurrency(m.totalContractValue)}
                        <span className="text-[10px] text-slate-400 block font-normal">EGP</span>
                      </td>

                      {/* 5. Retention Amount (Tranche 1 TOC) */}
                      <td className="px-3 py-3 text-end whitespace-nowrap">
                        {m.retentionType === 'none' ? (
                          <span className="text-[11px] font-bold text-slate-400">
                            {isAr ? 'لا يوجد حجز' : 'No retention'}
                          </span>
                        ) : m.retentionType === 'retention_bond' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {isAr ? 'خطاب ضمان صيانة' : 'Retention Bond'}
                            </span>
                            <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5">
                              {formatCurrency(m.totalRetentionAmount)} EGP
                            </div>
                            <span className="text-[10px] text-slate-400 block">
                              {m.retentionRatePct}% {m.retentionCalcBase === 'total' ? (isAr ? 'شامل VOs' : 'incl. VOs') : (isAr ? 'أصل العقد' : 'base')}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <div className="font-mono font-black text-amber-700 dark:text-amber-400">
                              {formatCurrency(m.tranche1Amount)} EGP
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                              {isAr ? `إفراج ${m.tocReleasePct}% عند التسليم` : `${m.tocReleasePct}% on TOC`}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {isAr
                                ? `إجمالي: ${formatCurrency(m.totalRetentionAmount)} (${m.retentionRatePct}%)`
                                : `Total: ${formatCurrency(m.totalRetentionAmount)} (${m.retentionRatePct}%)`}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 6. Contractual Days to Return (عدد الأيام لاسترداد المبالغ المستقطعة طبقا للعقد) */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        {isEditingThis ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              value={tempRetentionDays}
                              onChange={(e) => setTempRetentionDays(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-16 px-1.5 py-1 text-center font-mono font-bold bg-white dark:bg-slate-900 border border-amber-400 rounded-md text-xs"
                              title={isAr ? 'عدد الأيام لاسترداد المبالغ المستقطعة' : 'Retention release days'}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveContractualDays(p)}
                              disabled={isSaving}
                              className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                              title={isAr ? 'حفظ' : 'Save'}
                            >
                              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingDaysProjectId(null)}
                              className="p-1 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
                              title={isAr ? 'إلغاء' : 'Cancel'}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 group/days">
                            <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200">
                              {m.retentionContractualDays} {isAr ? 'يوم' : 'd'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDaysProjectId(p.id);
                                setTempRetentionDays(m.retentionContractualDays);
                                setTempBondDays(m.bondContractualDays);
                              }}
                              className="p-1 opacity-40 group-hover/days:opacity-100 hover:text-amber-500 transition-opacity"
                              title={isAr ? 'تعديل الأيام التعاقدية للاسترداد' : 'Edit contractual days'}
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {isAr ? 'بعد التسليم الابتدائي' : 'after TOC'}
                        </span>
                      </td>

                      {/* 7. Due Date */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300 block">
                          {m.retentionDueDateStr || '—'}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {m.handoverDateStr ? (isAr ? `سلم: ${m.handoverDateStr}` : `HO: ${m.handoverDateStr}`) : (isAr ? 'تاريخ غير محدد' : 'No date')}
                        </span>
                      </td>

                      {/* 8. Retention Release Status & Overdue Warning */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        {m.tranche1Released ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{isAr ? 'تم الصرف ✓' : 'Released'}</span>
                          </span>
                        ) : m.isRetentionOverdue ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{isAr ? `متأخر (${m.retentionOverdueDays} يوم)` : `${m.retentionOverdueDays}d Overdue`}</span>
                            </span>
                            <span className="text-[10px] text-red-600 dark:text-red-400 font-bold block">
                              {isAr ? 'تجاوز المدة التعاقدية' : 'Missed contractual term'}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              <Clock className="w-3 h-3" />
                              <span>{isAr ? 'مستحق الصرف' : 'Due for Release'}</span>
                            </span>
                            {m.retentionRemainingDays > 0 && (
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {isAr ? `متبقي ${m.retentionRemainingDays} يوم` : `${m.retentionRemainingDays}d left`}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 9. Performance Bond Status */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        {!m.hasPerformanceBond ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {isAr ? 'لا يوجد خطاب ضمان' : 'No Bond'}
                          </span>
                        ) : (
                          <div className="space-y-1">
                            <div className="font-mono font-bold text-slate-900 dark:text-white">
                              {formatCurrency(m.performanceBondAmount)} EGP
                            </div>

                            <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              {m.performanceBondCalcType === 'manual'
                                ? (isAr ? 'مبلغ يدوي' : 'Manual')
                                : m.performanceBondCalcType === 'percentage_total'
                                ? (isAr ? `${m.performanceBondPct}% شامل VOs` : `${m.performanceBondPct}% incl. VOs`)
                                : (isAr ? `${m.performanceBondPct}% من أصل العقد` : `${m.performanceBondPct}% base`)}
                            </span>

                            {(m.performanceBondNumber || m.performanceBondBank) && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                                {m.performanceBondNumber && (
                                  <div className="font-mono">
                                    {isAr ? 'رقم:' : 'No:'} {m.performanceBondNumber}
                                  </div>
                                )}
                                {m.performanceBondBank && (
                                  <div className="truncate max-w-[140px] mx-auto text-slate-400" title={m.performanceBondBank}>
                                    {m.performanceBondBank}
                                  </div>
                                )}
                              </div>
                            )}

                            <div>
                              {m.performanceBondReleased ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                  <span>{isAr ? 'تم استرداد الخطاب ✓' : 'Bond Returned'}</span>
                                </span>
                              ) : m.isBondOverdue ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 animate-pulse">
                                  <ShieldAlert className="w-3 h-3" />
                                  <span>{isAr ? `متأخر (${m.bondOverdueDays} يوم)` : `Missed (${m.bondOverdueDays}d)`}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">
                                  {isAr ? 'ساري تعاقدياً' : 'Active Bond'}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 10. Quick Actions */}
                      <td className="px-3 py-3 rounded-e-xl text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Tranche 1 TOC Release Button */}
                          {m.retentionType !== 'none' && (
                            <button
                              type="button"
                              onClick={() => handleToggleRelease(p, 1, m.tranche1Released)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                m.tranche1Released
                                  ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                              }`}
                              title={
                                m.tranche1Released
                                  ? (isAr ? 'إلغاء اعتماد الصرف' : 'Revert')
                                  : (isAr ? `اعتماد وصرف ${m.tocReleasePct}%` : `Release ${m.tocReleasePct}%`)
                              }
                            >
                              {m.tranche1Released
                                ? (isAr ? 'إلغاء الصرف' : 'Revert')
                                : (isAr ? `صرف ${m.tocReleasePct}%` : `Release ${m.tocReleasePct}%`)}
                            </button>
                          )}

                          {/* Bond Release Toggle */}
                          {m.hasPerformanceBond && (
                            <button
                              type="button"
                              onClick={() => handleToggleBondRelease(p, m.performanceBondReleased)}
                              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                m.performanceBondReleased
                                  ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300'
                                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                              }`}
                              title={m.performanceBondReleased ? (isAr ? 'إعادة فتح الخطاب' : 'Reopen Bond') : (isAr ? 'تسجيل استرداد خطاب الضمان' : 'Mark Bond Returned')}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick Guarantees Editor Trigger */}
                          <button
                            type="button"
                            onClick={() => handleOpenGuaranteesEditor(p)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 cursor-pointer"
                            title={isAr ? 'تخصيص وتعديل بنود خطابات ومحجوز الضمان' : 'Customize guarantees & retention terms'}
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/95 border-t-2 border-slate-300 dark:border-slate-700">
                <tr className="border-t-2 border-slate-300 dark:border-slate-700 text-xs">
                  <td
                    colSpan={3}
                    className={`px-3 py-3 font-black text-slate-900 dark:text-white ${
                      freezeProjectName
                        ? 'sticky start-0 z-20 bg-slate-100 dark:bg-slate-800 border-e border-slate-300 dark:border-slate-700'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                        TOTAL
                      </span>
                      <span>
                        {isAr
                          ? `الإجمالي العام (Total value) — ${filteredMetrics.length} مشروع`
                          : `Total value — ${filteredMetrics.length} projects`}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-end font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                    {formatCurrency(reportTotals.totalContractValue)}
                  </td>
                  <td className="px-3 py-3 text-end font-mono font-black text-amber-700 dark:text-amber-400 whitespace-nowrap">
                    <div>{formatCurrency(reportTotals.totalRetentionValue)}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                      {isAr ? 'دفعة 1: ' : 'T1: '}{formatCurrency(reportTotals.totalTranche1Value)}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-slate-400 font-normal">
                    —
                  </td>
                  <td className="px-3 py-3 text-center text-slate-400 font-normal">
                    —
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      {isAr ? 'مفرج عنه: ' : 'Rel: '}{formatCurrency(reportTotals.releasedRetentionValue)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center font-mono font-black text-blue-700 dark:text-blue-400 whitespace-nowrap">
                    {formatCurrency(reportTotals.totalBondValue)}
                  </td>
                  <td className="px-3 py-3 text-center text-slate-400 font-normal print:hidden">
                    —
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Footer Summary & Information */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {isAr
                ? `عرض ${filteredMetrics.length} من أصل ${portfolioStats.totalTrackedProjects} مشروع تسليم ومنتهي`
                : `Showing ${filteredMetrics.length} of ${portfolioStats.totalTrackedProjects} handover/finished projects`}
            </span>
            <span>•</span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
              {isAr ? 'المعيار: فيديك 14.9 وقواعد إدارة المشروعات PMI' : 'Standard: FIDIC 14.9 & PMI'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
          >
            {isAr ? 'إغلاق التقرير' : 'Close Report'}
          </button>
        </div>
      </div>

      {/* Inline Modal: Edit Project Guarantees & Retention Terms */}
      {editingGuaranteesProject && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isAr ? 'تخصيص بنود خطابات ومحجوز الضمان للمشروع' : 'Customize Guarantees & Retention Terms'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                  #{editingGuaranteesProject.project_code} - {editingGuaranteesProject.project_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingGuaranteesProject(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
              <ProjectGuaranteesSection
                metadata={guaranteesTempMetadata}
                onChange={(updatedMeta) => {
                  setGuaranteesTempMetadata((prev) => ({
                    ...prev,
                    ...updatedMeta,
                  }));
                }}
                contractBaseValue={Number(editingGuaranteesProject.contract_value || 0)}
                vosValue={Number(editingGuaranteesProject.vos_value || 0)}
                isAr={isAr}
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingGuaranteesProject(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveGuaranteesModal}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Customizable Report Studio Modal */}
      {isCustomReportModalOpen && (
        <UniversalReportModal
          isOpen={isCustomReportModalOpen}
          onClose={() => setIsCustomReportModalOpen(false)}
          title={isAr ? 'تقرير حوكمة محجوز الضمان وخطابات حسن التنفيذ بعد التسليم' : 'Post-Handover Retention & Performance Bonds Report'}
          defaultSubtitle={isAr ? 'متابعة المبالغ المستقطعة (5-10%) والخطابات البنكية طبقاً للمدد التعاقدية وشهادات الاستلام الابتدائي (FIDIC 14.9)' : 'Tracking contractual retention and performance bonds under FIDIC 14.9'}
          classification="وثيقة رسمية معتمدة • FIDIC 14.9 & PMI CONTROLS"
          columns={reportColumns}
          data={filteredMetrics}
          kpis={reportKpis}
          defaultOrientation="landscape"
          initialNotes={isAr ? 'يوصى بالمتابعة الدورية مع قطاع الحسابات والمكتب الفني لسرعة استرداد المبالغ المستحقة فور اعتماد شهادات الاستلام الابتدائي (TOC).' : 'Routine follow-up recommended with Accounts and Technical Office for timely recovery.'}
          defaultSignatures={[
            { id: 'prep', role: 'إعداد التقرير', name: '', title: 'مهندس العقود وضبط المشروعات' },
            { id: 'rev', role: 'مراجعة وتدقيق', name: '', title: 'مدير إدارة التكاليف والعقود' },
            { id: 'appr1', role: 'اعتماد المشروعات', name: '', title: 'مدير عام المشروعات (PMO)' },
            { id: 'appr2', role: 'الاعتماد المالي', name: '', title: 'المدير المالي والتجاري (CFO)' },
          ]}
        />
      )}
    </div>
  );
};
