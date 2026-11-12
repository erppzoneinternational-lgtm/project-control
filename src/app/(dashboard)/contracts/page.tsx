'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  FileText,
  TrendingUp,
  ChevronLeft,
  Layers,
  Receipt,
  Search,
  X,
  List,
  LayoutGrid,
  ShieldCheck,
  CreditCard,
  ExternalLink,
  Eye,
  RotateCcw,
  ArrowUpDown,
  Building2,
  Calendar,
  Sparkles,
  AlertTriangle,
  Filter,
  Calculator,
} from 'lucide-react';
import { ProjectService } from '@/lib/services/project.service';
import { supabase } from '@/lib/supabase';
import { Project, ProjectStatus } from '@/types';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import * as accessControl from '@/lib/rbac/access-control';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  ContractDetailDrawer,
  ContractDetailData,
} from '@/components/contracts/ContractDetailDrawer';
import { RetentionAndBondsReportModal } from '@/components/contracts/RetentionAndBondsReportModal';
import {
  QuickContractTermsModal,
  QuickContractProject,
} from '@/components/contracts/QuickContractTermsModal';
import { aggregateRetentionBondPortfolio } from '@/lib/utils/retention-bond-tracking.utils';

const fmtEGP = (v: number) =>
  new Intl.NumberFormat('eg-EG', {
    notation: v >= 10_000_000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(v || 0);

const fmtFullEGP = (v: number) =>
  new Intl.NumberFormat('eg-EG', {
    maximumFractionDigits: 0,
  }).format(v || 0);

type ProjectExt = Project & {
  retention_pct?: number;
  advance_payment_pct?: number;
  performance_bond_pct?: number;
  metadata?: Record<string, any>;
  project_code?: string;
  project_name?: string;
  client_name_raw?: string;
  contract_date?: string;
  finish_date?: string;
  actual_finish_date?: string;
};

interface DbContractRow {
  id?: string;
  project_id?: string;
  contract_number?: string;
  currency?: string;
  fidic_type?: string;
  retention_pct?: number;
  advance_payment_pct?: number;
  performance_bond_pct?: number;
}

type SortOption = 'value_desc' | 'value_asc' | 'name_asc' | 'retention_desc';

export default function ContractsPortalPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { activeProjectId, setActiveProjectId } = useProjectStore();
  const { roles, isAdmin } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();
  const isViewerOnly =
    roles.length > 0 && roles.every((r) => r.toLowerCase() === 'viewer') && !isAdmin;
  const canEditContracts =
    !isViewerOnly &&
    (isAdmin ||
      (typeof accessControl.canEditPath === 'function' &&
        accessControl.canEditPath('/contracts', roles, isAdmin, dbAccessRules)));

  const [projects, setProjects] = useState<Project[]>([]);
  const [dbContracts, setDbContracts] = useState<DbContractRow[]>([]);
  const [commercialSettings, setCommercialSettings] = useState<Record<string, any>[]>([]);
  const [scheduleAdvanceMap, setScheduleAdvanceMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Filters & Search — Default to 'all' on the Contracts Register so all projects are shown initially
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [onlyMissingHardcopy, setOnlyMissingHardcopy] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortBy, setSortBy] = useState<SortOption>('value_desc');

  // Track if activeProjectId was explicitly changed in TopNav while on this page
  const initialActiveProjectRef = useRef<string | null>(activeProjectId);
  useEffect(() => {
    if (activeProjectId === initialActiveProjectRef.current) return;
    initialActiveProjectRef.current = activeProjectId;
    if (activeProjectId && activeProjectId !== 'all') {
      setSelectedProjectId(activeProjectId);
    } else {
      setSelectedProjectId('all');
    }
  }, [activeProjectId]);

  // Handle local project selection change and sync back to useProjectStore
  const handleProjectChange = useCallback(
    (projectId: string) => {
      setSelectedProjectId(projectId);
      initialActiveProjectRef.current = projectId === 'all' ? 'all' : projectId;
      if (setActiveProjectId) {
        setActiveProjectId(projectId === 'all' ? 'all' : projectId);
      }
    },
    [setActiveProjectId]
  );

  // Detail Drawer state
  const [drawerContract, setDrawerContract] = useState<ContractDetailData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Quick Contract Terms Modal state
  const [quickEditProject, setQuickEditProject] = useState<QuickContractProject | null>(null);

  // Retention & Bonds Report Modal state
  const [isRetentionReportOpen, setIsRetentionReportOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [projectsData, commRes, advActsRes] = await Promise.all([
        ProjectService.getProjects(),
        Promise.resolve(supabase.from('pm_commercial_settings').select('*'))
          .then((r) => r.data || [])
          .catch(() => []),
        Promise.resolve(
          supabase
            .from('pm_project_activities')
            .select('project_id, name_ar, name_en')
            .or('name_ar.ilike.%advance%,name_en.ilike.%advance%,name_ar.ilike.%دفعة%')
        )
          .then((r) => r.data || [])
          .catch(() => []),
      ]);

      // Build schedule-derived advance payment map (e.g. "Receipt Advance Payment 20%" + "Receipt Advance Payment 5%")
      const advByProj: Record<string, Set<number>> = {};
      (advActsRes || []).forEach((act: any) => {
        if (!act.project_id) return;
        const label = `${act.name_ar || ''} ${act.name_en || ''}`;
        const match = label.match(/(\d+(?:\.\d+)?)\s*%/);
        if (match) {
          const pct = parseFloat(match[1]);
          if (pct > 0 && pct <= 100) {
            if (!advByProj[act.project_id]) advByProj[act.project_id] = new Set();
            advByProj[act.project_id].add(pct);
          }
        }
      });
      const derivedScheduleAdvMap: Record<string, number> = {};
      Object.entries(advByProj).forEach(([pid, pctSet]) => {
        const sum = Array.from(pctSet).reduce((a, b) => a + b, 0);
        if (sum > 0 && sum <= 100) {
          derivedScheduleAdvMap[pid] = sum;
        }
      });

      const derivedDbContracts: DbContractRow[] = (projectsData || []).map((p: any) => {
        const meta = p.metadata || {};
        const metaContract = Array.isArray(meta.contracts) && meta.contracts[0] ? meta.contracts[0] : null;
        const explicitRetention =
          metaContract?.retention_pct ??
          p.retention_pct ??
          meta.retention_terms?.rate_pct ??
          meta.retention_pct ??
          meta.retention_rate_pct;
        const explicitAdvance =
          metaContract?.advance_payment_pct ??
          p.advance_payment_pct ??
          meta.advance_payment?.percentage ??
          meta.advance_payment_pct ??
          meta.down_payment_pct ??
          derivedScheduleAdvMap[p.id];
        const explicitBond =
          metaContract?.performance_bond_pct ??
          p.performance_bond_pct ??
          meta.performance_bond?.percentage ??
          meta.performance_bond_pct;

        return {
          id: metaContract?.id || `cnt_${p.id}`,
          project_id: p.id,
          contract_number: metaContract?.contract_number || meta.contract_number || `CNT-${p.project_code || p.code || 'PRJ'}`,
          currency: metaContract?.currency || p.currency || 'EGP',
          fidic_type: metaContract?.fidic_type || meta.fidic_type || 'FIDIC Red Book',
          retention_pct:
            meta.retention_terms?.type === 'none'
              ? 0
              : Number(explicitRetention !== undefined && explicitRetention !== null ? explicitRetention : 10),
          advance_payment_pct:
            meta.advance_payment?.has_advance === false
              ? 0
              : Number(explicitAdvance !== undefined && explicitAdvance !== null ? explicitAdvance : 15),
          performance_bond_pct:
            meta.has_performance_bond === false || meta.performance_bond?.has_bond === false
              ? 0
              : Number(explicitBond !== undefined && explicitBond !== null ? explicitBond : 5),
        };
      });

      setProjects(projectsData || []);
      setDbContracts(derivedDbContracts);
      setCommercialSettings(commRes || []);
      setScheduleAdvanceMap(derivedScheduleAdvMap);
    } catch (err) {
      toast.error(isAr ? 'فشل تحميل بيانات العقود' : 'Failed to load contracts data');
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Map and enrich contracted projects
  const allContractItems = useMemo<ContractDetailData[]>(() => {
    // Contract register contains projects with a signed contract value
    const contractedProjects = projects.filter((p) => Number(p.contract_value || p.contract_value_egp || 0) > 0);

    return contractedProjects.map((p) => {
      const dbContract = dbContracts.find((c) => c.project_id === p.id);
      const commSetting = commercialSettings.find((s) => s.project_id === p.id);
      const meta = ((p as ProjectExt)?.metadata || {}) as Record<string, any>;

      const originalVal = Number(p.contract_value_egp || p.contract_value || 0);
      const vosVal = Number(p.vos_value || 0);
      const totalVal = Number(p.total_contract_value || originalVal + vosVal);

      // Contractual percentages: resolve from project metadata, schedule milestones, commercial settings, or standard contractual defaults (matching Projects ContractTab)
      const rawRetention =
        (p as ProjectExt)?.retention_pct ??
        meta.retention_terms?.rate_pct ??
        meta.retention_pct ??
        meta.retention_rate_pct ??
        commSetting?.retention_pct ??
        dbContract?.retention_pct;
      const retentionPct =
        meta.retention_terms?.type === 'none'
          ? 0
          : Number(rawRetention !== undefined && rawRetention !== null ? rawRetention : 10);

      const rawAdvance =
        (p as ProjectExt)?.advance_payment_pct ??
        meta.advance_payment?.percentage ??
        meta.advance_payment_pct ??
        meta.down_payment_pct ??
        commSetting?.advance_payment_pct ??
        commSetting?.advance_amortization_pct ??
        scheduleAdvanceMap[p.id] ??
        dbContract?.advance_payment_pct;
      const advancePaymentPct =
        meta.advance_payment?.has_advance === false
          ? 0
          : Number(rawAdvance !== undefined && rawAdvance !== null ? rawAdvance : 15);

      const rawBond =
        (p as ProjectExt)?.performance_bond_pct ??
        meta.performance_bond?.percentage ??
        meta.performance_bond_pct ??
        dbContract?.performance_bond_pct;
      const performanceBondPct =
        meta.has_performance_bond === false || meta.performance_bond?.has_bond === false
          ? 0
          : Number(rawBond !== undefined && rawBond !== null ? rawBond : 5);

      const retentionBase = meta.retention_terms?.calc_base === 'base' ? originalVal : totalVal;
      const retentionValue =
        meta.retention_terms?.manual_amount && Number(meta.retention_terms.manual_amount) > 0
          ? Number(meta.retention_terms.manual_amount)
          : (retentionBase * retentionPct) / 100;
      const advancePaymentValue =
        meta.advance_payment_value && Number(meta.advance_payment_value) > 0
          ? Number(meta.advance_payment_value)
          : (originalVal * advancePaymentPct) / 100;
      const performanceBondValue =
        meta.performance_bond?.calc_type === 'manual' && Number(meta.performance_bond?.manual_value) > 0
          ? Number(meta.performance_bond.manual_value)
          : (originalVal * performanceBondPct) / 100;

      const projectCode = (p as ProjectExt).project_code || p.code || 'PRJ';
      const projectName = (p as ProjectExt).project_name || p.name_ar || p.name_en || 'مشروع بدون اسم';
      const clientName = (p as ProjectExt).client_name_raw || p.client?.name_ar || '—';
      const contractNumber = dbContract?.contract_number || `CNT-${projectCode}`;

      return {
        id: dbContract?.id || p.id,
        projectId: p.id,
        projectCode,
        projectName,
        clientName,
        status: (p.status as ProjectStatus) || 'working',
        contractNumber,
        originalValue: originalVal,
        vosValue: vosVal,
        totalValue: totalVal,
        retentionPct,
        retentionValue,
        advancePaymentPct,
        advancePaymentValue,
        performanceBondPct,
        performanceBondValue,
        startDate: p.start_date || (p as ProjectExt).contract_date,
        endDate: (p as ProjectExt).finish_date || (p as ProjectExt).actual_finish_date,
        currency: dbContract?.currency || 'EGP',
        fidicType: dbContract?.fidic_type || 'FIDIC Red Book',
        hardcopyStatus: (p as any).hardcopy_status,
      };
    });
  }, [projects, dbContracts, commercialSettings, scheduleAdvanceMap]);

  // Scoped contracts if a specific project is selected
  const scopedContracts = useMemo(() => {
    if (selectedProjectId && selectedProjectId !== 'all') {
      return allContractItems.filter((c) => c.projectId === selectedProjectId);
    }
    return allContractItems;
  }, [allContractItems, selectedProjectId]);

  // Aggregate KPIs
  const totals = useMemo(() => {
    const total = scopedContracts.reduce((s, p) => s + p.totalValue, 0);
    const working = scopedContracts.filter(
      (p) => p.status === 'working' || p.status === 'handing_over'
    );
    const workingValue = working.reduce((s, p) => s + p.totalValue, 0);
    const totalRetention = scopedContracts.reduce((s, p) => s + p.retentionValue, 0);
    const totalAdvance = scopedContracts.reduce((s, p) => s + p.advancePaymentValue, 0);

    const missingHardcopy = scopedContracts.filter(
      (p) =>
        !p.hardcopyStatus ||
        p.hardcopyStatus === 'غير موجود hard copy معتمد' ||
        p.hardcopyStatus === 'غير مكتمل' ||
        p.hardcopyStatus === 'None'
    );
    const missingHardcopyCount = missingHardcopy.length;
    const missingHardcopyValue = missingHardcopy.reduce((s, p) => s + p.totalValue, 0);

    return {
      total,
      workingCount: working.length,
      workingValue,
      totalRetention,
      totalAdvance,
      missingHardcopyCount,
      missingHardcopyValue,
    };
  }, [scopedContracts]);

  const portfolioRetentionMetrics = useMemo(() => {
    const targetProjects =
      selectedProjectId && selectedProjectId !== 'all'
        ? projects.filter((p) => p.id === selectedProjectId)
        : projects;
    return aggregateRetentionBondPortfolio(targetProjects);
  }, [projects, selectedProjectId]);

  // Status Filter counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: scopedContracts.length,
      working: 0,
      handing_over: 0,
      finished: 0,
      on_hold: 0,
      tender: 0,
    };

    scopedContracts.forEach((c) => {
      if (counts[c.status] !== undefined) {
        counts[c.status]++;
      }
    });

    return counts;
  }, [scopedContracts]);

  // Search & Filtered & Sorted items
  const filteredContracts = useMemo(() => {
    let list = [...scopedContracts];

    // Status filter
    if (selectedStatus !== 'all') {
      list = list.filter((c) => c.status === selectedStatus);
    }

    // Missing hardcopy filter
    if (onlyMissingHardcopy) {
      list = list.filter(
        (c) =>
          !c.hardcopyStatus ||
          c.hardcopyStatus === 'غير موجود hard copy معتمد' ||
          c.hardcopyStatus === 'غير مكتمل' ||
          c.hardcopyStatus === 'None'
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.projectName.toLowerCase().includes(q) ||
          c.projectCode.toLowerCase().includes(q) ||
          c.contractNumber.toLowerCase().includes(q) ||
          c.clientName.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      switch (sortBy) {
        case 'value_desc':
          return b.totalValue - a.totalValue;
        case 'value_asc':
          return a.totalValue - b.totalValue;
        case 'name_asc':
          return a.projectName.localeCompare(b.projectName, 'ar');
        case 'retention_desc':
          return b.retentionValue - a.retentionValue;
        default:
          return 0;
      }
    });

    return list;
  }, [scopedContracts, selectedStatus, onlyMissingHardcopy, searchQuery, sortBy]);

  const handleOpenDrawer = (item: ContractDetailData) => {
    setDrawerContract(item);
    setIsDrawerOpen(true);
  };

  const handleOpenQuickTerms = (item: ContractDetailData) => {
    if (!canEditContracts) return;
    const proj = projects.find((p) => p.id === item.projectId);
    setQuickEditProject({
      id: item.projectId,
      projectCode: item.projectCode,
      projectName: item.projectName,
      originalValue: item.originalValue,
      totalValue: item.totalValue,
      advancePaymentPct: item.advancePaymentPct,
      retentionPct: item.retentionPct,
      performanceBondPct: item.performanceBondPct,
      metadata: (proj?.metadata as Record<string, any>) || {},
    });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setOnlyMissingHardcopy(false);
    handleProjectChange('all');
  };

  if (!mounted) return null;

  return (
    <div
      className="space-y-5 w-full max-w-none text-end"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAr ? 'سجل العقود والمستحقات التعاقدية' : 'Contracts & Commitments Register'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'متابعة القيم التعاقدية المعتمدة، الدفعات المقدمة، استقطاعات ضمان الأعمال، وأوامر التغيير'
                : 'Signed contract values, advance payments, and retention deductions'}
            </p>
          </div>
        </div>

        {/* View Switcher & Action Hub */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setIsRetentionReportOpen(true)}
            className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all focus:outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>{isAr ? 'تقرير محجوز الضمان والخطابات البنكية' : 'Retention & Bonds Report'}</span>
            {portfolioRetentionMetrics.missedAnyCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white animate-pulse">
                {portfolioRetentionMetrics.missedAnyCount}
              </span>
            )}
          </button>

          <Link
            href="/contracts/claims"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{isAr ? 'بوابة المطالبات وأوامر التغيير' : 'Claims & Variation Orders'}</span>
          </Link>

          <div
            className="inline-flex items-center rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            role="group"
            aria-label={isAr ? 'طريقة العرض' : 'View mode'}
          >
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title={isAr ? 'عرض كجدول' : 'Table view'}
              aria-label={isAr ? 'عرض كجدول' : 'Table view'}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title={isAr ? 'عرض كبطاقات' : 'Cards view'}
              aria-label={isAr ? 'عرض كبطاقات' : 'Cards view'}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {loading ? (
          // Loading Skeleton for KPIs
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="w-4 h-4 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                </div>
                <div className="h-6 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
              </div>
            ))}
          </>
        ) : (
          [
            {
              label: isAr ? 'عقود مسجلة' : 'Registered Contracts',
              value: String(scopedContracts.length),
              sub: isAr ? 'عقود معتمدة وموثقة' : 'Signed contracts',
              icon: FileText,
              tone: 'text-amber-500',
              bg: 'bg-amber-500/10',
            },
            {
              label: isAr ? 'إجمالي القيم التعاقدية' : 'Total Contract Value',
              value: `${fmtEGP(totals.total)} ${isAr ? 'ج.م' : 'EGP'}`,
              sub: isAr ? 'شامل أوامر التغيير المعتمدة' : 'Including approved variation orders',
              icon: TrendingUp,
              tone: 'text-emerald-500',
              bg: 'bg-emerald-500/10',
            },
            {
              label: isAr ? 'عقود بحاجة لتوثيق ورقي' : 'Missing Hardcopy',
              value: String(totals.missingHardcopyCount),
              sub: isAr
                ? `${fmtEGP(totals.missingHardcopyValue)} ج.م تتطلب استيفاء الأصول`
                : `${fmtEGP(totals.missingHardcopyValue)} EGP at risk`,
              icon: AlertTriangle,
              tone: 'text-rose-500',
              bg: 'bg-rose-500/10',
              onClick: () => setOnlyMissingHardcopy((prev) => !prev),
              isActive: onlyMissingHardcopy,
            },
            {
              label: isAr ? 'إجمالي الدفعات المقدمة' : 'Advance Payments',
              value: `${fmtEGP(totals.totalAdvance)} ${isAr ? 'ج.م' : 'EGP'}`,
              sub: isAr ? 'وفق الشروط التعاقدية المعتمدة' : 'From logged contract terms',
              icon: CreditCard,
              tone: 'text-sky-500',
              bg: 'bg-sky-500/10',
            },
            {
              label: isAr ? 'استقطاع ضمان الأعمال' : 'Retention Guarantees',
              value: `${fmtEGP(totals.totalRetention)} ${isAr ? 'ج.م' : 'EGP'}`,
              sub: isAr
                ? portfolioRetentionMetrics.missedAnyCount > 0
                  ? `🚨 ${portfolioRetentionMetrics.missedAnyCount} متأخرات استرداد وخطابات`
                  : 'انقر لعرض تقرير المحجوز والاستلام المؤقت'
                : portfolioRetentionMetrics.missedAnyCount > 0
                  ? `🚨 ${portfolioRetentionMetrics.missedAnyCount} missed bonds/retentions`
                  : 'Click for retention & TOC report',
              icon: ShieldCheck,
              tone: 'text-purple-500',
              bg: 'bg-purple-500/10',
              onClick: () => setIsRetentionReportOpen(true),
            },
          ].map((k) => (
            <div
              key={k.label}
              onClick={k.onClick}
              role={k.onClick ? 'button' : undefined}
              tabIndex={k.onClick ? 0 : undefined}
              className={`bg-white dark:bg-slate-900 rounded-xl border p-4 transition-all ${
                k.onClick ? 'cursor-pointer hover:scale-[1.02]' : ''
              } ${
                k.isActive
                  ? 'border-rose-500 ring-2 ring-rose-500/30 dark:ring-rose-500/40 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {k.label}
                </span>
                <div className={`p-1.5 rounded-lg ${k.bg} ${k.tone}`}>
                  <k.icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                {k.value}
              </div>
              <div className="mt-1 text-[10px] text-slate-400 truncate">
                {k.sub}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Search, Filter Chips, and Sorting Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* RTL Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 start-0 pe-3 flex items-center pointer-events-none text-slate-400 ps-3">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'بحث برقم العقد، اسم المشروع، أو العميل...'
                  : 'Search by contract #, project, or client...'
              }
              className="w-full ps-9 pe-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-all text-start"
              aria-label={isAr ? 'بحث في العقود' : 'Search contracts'}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 end-0 pe-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label={isAr ? 'مسح البحث' : 'Clear search'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Project Selector & Sort Selector */}
          <div className="flex flex-wrap items-center gap-2 self-end md:self-auto shrink-0">
            {/* Quick Toggle Button: Show All Projects */}
            <button
              type="button"
              onClick={() => handleProjectChange('all')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer border ${
                selectedProjectId === 'all'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs shadow-emerald-600/20'
                  : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70 hover:-translate-y-0.5'
              }`}
              title={isAr ? 'عرض عقود كافة المشاريع بدون تصفية' : 'Show contracts for all projects'}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>
                {isAr
                  ? `إظهار كل المشاريع (${allContractItems.length})`
                  : `All Projects (${allContractItems.length})`}
              </span>
            </button>

            {/* Project Filter */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-medium hidden sm:inline">
                  {isAr ? 'المشروع:' : 'Project:'}
                </span>
              </div>
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 max-w-[210px] truncate cursor-pointer"
                aria-label={isAr ? 'تصفية حسب المشروع' : 'Filter by project'}
              >
                <option value="all">
                  {isAr ? `🌐 كافة المشاريع (${allContractItems.length} عقد)` : `🌐 All Projects (${allContractItems.length})`}
                </option>
                {projects.map((p) => {
                  const code = (p as ProjectExt).project_code || p.code || 'PRJ';
                  const name =
                    (p as ProjectExt).project_name || p.name_ar || p.name_en || 'مشروع';
                  return (
                    <option key={p.id} value={p.id}>
                      {code} - {name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium hidden sm:inline">
                {isAr ? 'ترتيب:' : 'Sort:'}
              </span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              aria-label={isAr ? 'ترتيب العقود' : 'Sort contracts'}
            >
              <option value="value_desc">{isAr ? 'القيمة (الأعلى أولاً)' : 'Value (High to Low)'}</option>
              <option value="value_asc">{isAr ? 'القيمة (الأقل أولاً)' : 'Value (Low to High)'}</option>
              <option value="retention_desc">{isAr ? 'محتجز الضمان (الأعلى)' : 'Retention (High to Low)'}</option>
              <option value="name_asc">{isAr ? 'اسم المشروع (أ - ي)' : 'Project Name (A-Z)'}</option>
            </select>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400 ms-1">
            {isAr ? 'الحالة:' : 'Status:'}
          </span>

          {[
            { key: 'all', label: isAr ? 'الكل' : 'All', count: statusCounts.all },
            { key: 'working', label: isAr ? 'قيد التنفيذ' : 'Working', count: statusCounts.working },
            { key: 'handing_over', label: isAr ? 'قيد التسليم' : 'Handing Over', count: statusCounts.handing_over },
            { key: 'finished', label: isAr ? 'منتهي' : 'Finished', count: statusCounts.finished },
            { key: 'on_hold', label: isAr ? 'موقوف' : 'On Hold', count: statusCounts.on_hold },
            { key: 'tender', label: isAr ? 'عطاءات' : 'Tender', count: statusCounts.tender },
          ].map((chip) => {
            const isActive = selectedStatus === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setSelectedStatus(chip.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/30'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                aria-pressed={isActive}
              >
                <span>{chip.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums font-mono ${
                    isActive
                      ? 'bg-white/20 dark:bg-slate-900/30 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}

          {/* Quick Filter: Missing Hardcopy Contracts */}
          <button
            type="button"
            onClick={() => setOnlyMissingHardcopy((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer ${
              onlyMissingHardcopy
                ? 'bg-rose-600 text-white shadow-xs shadow-rose-500/30'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/60'
            }`}
            aria-pressed={onlyMissingHardcopy}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isAr ? 'عقود بحاجة لتوثيق ورقي' : 'Missing Hardcopy'}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums font-mono ${
                onlyMissingHardcopy
                  ? 'bg-white/20 dark:bg-slate-900/30 text-white'
                  : 'bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200'
              }`}
            >
              {totals.missingHardcopyCount}
            </span>
          </button>

          {/* Quick Trigger: Retention & Bonds Governance */}
          <button
            type="button"
            onClick={() => setIsRetentionReportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all focus:outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-900/60 shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isAr ? 'تقرير محجوز الضمان والاستلام الابتدائي' : 'Retention & TOC Report'}</span>
            {portfolioRetentionMetrics.missedAnyCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full tabular-nums font-mono bg-rose-500 text-white animate-pulse">
                {portfolioRetentionMetrics.missedAnyCount} {isAr ? 'متأخر' : 'overdue'}
              </span>
            )}
          </button>

          {/* Active Project Filter Chip */}
          {selectedProjectId !== 'all' && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30">
              <Building2 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span className="truncate max-w-[170px]">
                {projects.find((p) => p.id === selectedProjectId)?.name_ar ||
                  projects.find((p) => p.id === selectedProjectId)?.name_en ||
                  (isAr ? 'مشروع محدد' : 'Selected Project')}
              </span>
              <button
                type="button"
                onClick={() => handleProjectChange('all')}
                className="hover:text-rose-500 transition-colors cursor-pointer"
                aria-label={isAr ? 'إلغاء تصفية المشروع' : 'Clear project filter'}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {(selectedStatus !== 'all' || searchQuery || onlyMissingHardcopy || selectedProjectId !== 'all') && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors mr-auto me-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isAr ? 'إعادة ضبط الفلاتر' : 'Reset filters'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Table or Cards with Loading Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {isAr ? 'قائمة العقود والبنود المالية' : 'Contracts & Commercial Terms'}
            </h2>
            <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-mono">
              {filteredContracts.length} {isAr ? 'عقد' : 'contracts'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            {isAr
              ? 'انقر على أي عقد لعرض تفاصيل الضمانات والدفعات'
              : 'Click any contract to open full terms'}
          </span>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="p-4 space-y-3" role="status" aria-label={isAr ? 'جاري التحميل' : 'Loading'}>
            <span className="sr-only">{isAr ? 'جاري تحميل سجل العقود...' : 'Loading contracts register...'}</span>
            {[1, 2, 3, 4, 5].map((row) => (
              <div
                key={row}
                className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse flex items-center justify-between px-4"
              >
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="h-2.5 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
                <div className="hidden sm:block h-3.5 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-7 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : filteredContracts.length === 0 ? (
          // Empty State
          <div className="py-16 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {searchQuery || selectedStatus !== 'all'
                ? isAr
                  ? 'لا توجد نتائج مطابقة لبحثك'
                  : 'No contracts match your search'
                : isAr
                ? 'لا توجد عقود مسجلة بعد'
                : 'No contracts registered yet'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || selectedStatus !== 'all'
                ? isAr
                  ? 'جرّب تعديل كلمات البحث أو مسح فلاتر الحالة لإظهار بقية العقود.'
                  : 'Try adjusting your search terms or clearing status filters.'
                : isAr
                ? 'سجّل قيمة العقد والبيانات التعاقدية من صفحة إدارة كل مشروع.'
                : 'Set contract values and commercial terms in project settings.'}
            </p>
            {(searchQuery || selectedStatus !== 'all') && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isAr ? 'عرض كافة العقود' : 'Show all contracts'}</span>
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          // Table View
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-end min-w-[850px]">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-950/40 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-100 dark:border-slate-800">
                  <th className="px-3 py-3 w-10 text-center">#</th>
                  <th className="px-3 py-3">{isAr ? 'المشروع والكود' : 'Project & Code'}</th>
                  <th className="px-3 py-3">{isAr ? 'العميل' : 'Client'}</th>
                  <th className="px-3 py-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="px-3 py-3">{isAr ? 'القيمة الأصلية' : 'Original Value'}</th>
                  <th className="px-3 py-3">{isAr ? 'الدفعة المقدمة' : 'Advance Payment'}</th>
                  <th className="px-3 py-3">{isAr ? 'استقطاع الضمان' : 'Retention'}</th>
                  <th className="px-3 py-3">{isAr ? 'الإجمالي الصافي التعاقدي' : 'Net Total'}</th>
                  <th className="px-3 py-3 text-start w-32">{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredContracts.map((c, i) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="px-3 py-3 text-center text-slate-300 dark:text-slate-600 font-mono tabular-nums">
                      {i + 1}
                    </td>

                    {/* Project & Code */}
                    <td className="px-3 py-3">
                      <div className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[220px]">
                        {c.projectName}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono font-semibold">
                          {c.projectCode}
                        </span>
                        <span className="text-[9px] text-slate-300 dark:text-slate-600 font-mono">
                          • {c.contractNumber}
                        </span>
                        {c.hardcopyStatus === 'موجود hard copy معتمد' ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            📄 {isAr ? 'أصل بالشركة' : 'HQ Hardcopy'}
                          </span>
                        ) : c.hardcopyStatus === 'موجود hard copy معتمد فى التأمينات' ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            🏛️ {isAr ? 'مودع بالتأمينات' : 'Insurance Org'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            ⚠️ {isAr ? 'بدون أصل ورقي' : 'No Hardcopy'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Client */}
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300 max-w-[140px] truncate">
                      {c.clientName}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3 text-center">
                      <StatusBadge status={c.status} lang={isAr ? 'ar' : 'en'} size="sm" />
                    </td>

                    {/* Original Value */}
                    <td className="px-3 py-3 font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                      {fmtFullEGP(c.originalValue)}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">{isAr ? 'ج.م' : 'EGP'}</span>
                    </td>

                    {/* Advance Payment Indicator */}
                    <td className="px-3 py-3">
                      {canEditContracts ? (
                        <button
                          type="button"
                          onClick={() => handleOpenQuickTerms(c)}
                          title={isAr ? 'انقر لضبط نسبة الدفعة المقدمة والاستقطاعات' : 'Click to edit advance payment & retention rates'}
                          className="cursor-pointer text-start focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg"
                        >
                          {c.advancePaymentPct > 0 ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 font-mono text-[11px] tabular-nums font-semibold transition-colors">
                              <CreditCard className="w-3 h-3 text-sky-500 shrink-0" />
                              <span>{fmtFullEGP(c.advancePaymentValue)}</span>
                              <span className="text-[9px] text-sky-500 font-bold">({c.advancePaymentPct}%)</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/30 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 text-[10px] font-bold transition-colors">
                              <Calculator className="w-3 h-3" />
                              <span>{isAr ? 'تحديد النسبة' : 'Set %'}</span>
                            </span>
                          )}
                        </button>
                      ) : c.advancePaymentPct > 0 ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 font-mono text-[11px] tabular-nums font-semibold">
                          <CreditCard className="w-3 h-3 text-sky-500 shrink-0" />
                          <span>{fmtFullEGP(c.advancePaymentValue)}</span>
                          <span className="text-[9px] text-sky-500 font-bold">({c.advancePaymentPct}%)</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* Retention Guarantee Indicator */}
                    <td className="px-3 py-3">
                      {canEditContracts ? (
                        <button
                          type="button"
                          onClick={() => handleOpenQuickTerms(c)}
                          title={isAr ? 'انقر لضبط نسبة استقطاع الضمان والدفعة المقدمة' : 'Click to edit retention & advance rates'}
                          className="cursor-pointer text-start focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg"
                        >
                          {c.retentionPct > 0 ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-mono text-[11px] tabular-nums font-semibold transition-colors">
                              <ShieldCheck className="w-3 h-3 text-purple-500 shrink-0" />
                              <span>{fmtFullEGP(c.retentionValue)}</span>
                              <span className="text-[9px] text-purple-500 font-bold">({c.retentionPct}%)</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 text-[10px] font-bold transition-colors">
                              <Calculator className="w-3 h-3" />
                              <span>{isAr ? 'تحديد النسبة' : 'Set %'}</span>
                            </span>
                          )}
                        </button>
                      ) : c.retentionPct > 0 ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-mono text-[11px] tabular-nums font-semibold">
                          <ShieldCheck className="w-3 h-3 text-purple-500 shrink-0" />
                          <span>{fmtFullEGP(c.retentionValue)}</span>
                          <span className="text-[9px] text-purple-500 font-bold">({c.retentionPct}%)</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* Net Total Value with VOs */}
                    <td className="px-3 py-3">
                      <div className="font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {fmtFullEGP(c.totalValue)}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">{isAr ? 'ج.م' : 'EGP'}</span>
                      </div>
                      {c.vosValue > 0 && (
                        <div className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 font-mono">
                          {isAr ? `+${fmtFullEGP(c.vosValue)} أوامر تغيير` : `+${fmtFullEGP(c.vosValue)} VOs`}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3 text-start">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenDrawer(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
                          aria-label={`${isAr ? 'عرض تفاصيل العقد لمشروع' : 'View contract details for'} ${c.projectName}`}
                        >
                          <Eye className="w-3 h-3" />
                          <span>{isAr ? 'تفاصيل' : 'Details'}</span>
                        </button>

                        {canEditContracts && (
                          <button
                            type="button"
                            onClick={() => handleOpenQuickTerms(c)}
                            title={isAr ? 'ضبط نسب الدفعة المقدمة واستقطاع الضمان' : 'Configure advance & retention rates'}
                            aria-label={`${isAr ? 'ضبط النسب التعاقدية لمشروع' : 'Configure terms for'} ${c.projectName}`}
                            className="p-1.5 rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-500/15 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-500"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <Link
                          href={`/projects/${c.projectId}`}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title={isAr ? 'فتح صفحة المشروع' : 'Open project'}
                          aria-label={`${isAr ? 'فتح صفحة المشروع' : 'Open project'} ${c.projectName}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Cards View
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredContracts.map((c) => (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3.5 hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {c.projectCode}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {c.contractNumber}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {c.projectName}
                      </h3>
                      <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{c.clientName}</span>
                      </p>
                    </div>
                    <StatusBadge status={c.status} lang={isAr ? 'ar' : 'en'} size="sm" />
                  </div>

                  {/* Financial Values */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        {isAr ? 'القيمة التعاقدية الإجمالية:' : 'Total Contract Value:'}
                      </span>
                      <span className="font-black font-mono text-slate-900 dark:text-white tabular-nums text-sm">
                        {fmtFullEGP(c.totalValue)}{' '}
                        <span className="text-[10px] font-normal text-slate-400">{isAr ? 'ج.م' : 'EGP'}</span>
                      </span>
                    </div>

                    {c.vosValue > 0 && (
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/40 dark:border-slate-800/40">
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          {isAr ? 'أوامر التغيير المعتمدة:' : 'Variation Orders:'}
                        </span>
                        <span className="font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                          +{fmtFullEGP(c.vosValue)} {isAr ? 'ج.م' : 'EGP'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Advance & Retention Pills */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    {/* Advance Payment */}
                    <button
                      type="button"
                      disabled={!canEditContracts}
                      onClick={() => handleOpenQuickTerms(c)}
                      className={`p-2.5 rounded-lg bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/15 space-y-1 text-start transition-colors ${canEditContracts ? 'hover:bg-sky-500/10 dark:hover:bg-sky-500/20 cursor-pointer' : 'cursor-default'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300">
                          {isAr ? 'الدفعة المقدمة' : 'Advance Payment'}
                        </span>
                        <span className="text-[9px] font-bold font-mono bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 px-1 rounded">
                          {c.advancePaymentPct > 0 ? `${c.advancePaymentPct}%` : '—'}
                        </span>
                      </div>
                      <div className="font-bold font-mono text-slate-800 dark:text-slate-200 text-[11px] tabular-nums">
                        {c.advancePaymentPct > 0 ? `${fmtFullEGP(c.advancePaymentValue)} ${isAr ? 'ج.م' : 'EGP'}` : isAr ? 'لا توجد' : 'None'}
                      </div>
                    </button>

                    {/* Retention Money */}
                    <button
                      type="button"
                      disabled={!canEditContracts}
                      onClick={() => handleOpenQuickTerms(c)}
                      className={`p-2.5 rounded-lg bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/15 space-y-1 text-start transition-colors ${canEditContracts ? 'hover:bg-purple-500/10 dark:hover:bg-purple-500/20 cursor-pointer' : 'cursor-default'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">
                          {isAr ? 'استقطاع الضمان' : 'Retention Guarantee'}
                        </span>
                        <span className="text-[9px] font-bold font-mono bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1 rounded">
                          {c.retentionPct > 0 ? `${c.retentionPct}%` : '—'}
                        </span>
                      </div>
                      <div className="font-bold font-mono text-slate-800 dark:text-slate-200 text-[11px] tabular-nums">
                        {c.retentionPct > 0 ? `${fmtFullEGP(c.retentionValue)} ${isAr ? 'ج.م' : 'EGP'}` : isAr ? 'لا يوجد' : 'None'}
                      </div>
                    </button>
                  </div>

                  {/* Hardcopy Status Badge in Card */}
                  <div className="mt-2.5 flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400">
                      {isAr ? 'توثيق أصل العقد:' : 'Hardcopy Status:'}
                    </span>
                    {c.hardcopyStatus === 'موجود hard copy معتمد' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        📄 {isAr ? 'أصل بالشركة' : 'HQ Hardcopy'}
                      </span>
                    ) : c.hardcopyStatus === 'موجود hard copy معتمد فى التأمينات' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        🏛️ {isAr ? 'مودع بالتأمينات' : 'Insurance Org'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                        ⚠️ {isAr ? 'بدون أصل ورقي' : 'No Hardcopy'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenDrawer(c)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
                      aria-label={`${isAr ? 'عرض تفاصيل العقد' : 'View details'} ${c.projectName}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تفاصيل العقد' : 'Contract Terms'}</span>
                    </button>

                    {canEditContracts && (
                      <button
                        type="button"
                        onClick={() => handleOpenQuickTerms(c)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 transition-all cursor-pointer"
                        title={isAr ? 'ضبط النسب التعاقدية' : 'Configure Terms'}
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>{isAr ? 'النسب' : 'Rates'}</span>
                      </button>
                    )}
                  </div>

                  <Link
                    href={`/projects/${c.projectId}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <span>{isAr ? 'ملف المشروع' : 'Project'}</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contract Detail Drawer */}
      <ContractDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        contract={drawerContract}
        project={projects.find((p) => p.id === drawerContract?.projectId) || null}
        onProjectUpdated={canEditContracts ? loadData : undefined}
        onEditTerms={canEditContracts ? (c) => handleOpenQuickTerms(c) : undefined}
        canEdit={canEditContracts}
        isAr={isAr}
        onHardcopyStatusChange={
          canEditContracts
            ? (projectId, newStatus) => {
                setProjects((prev) =>
                  prev.map((p) => (p.id === projectId ? { ...p, hardcopy_status: newStatus } : p))
                );
                if (drawerContract && drawerContract.projectId === projectId) {
                  setDrawerContract({ ...drawerContract, hardcopyStatus: newStatus });
                }
              }
            : undefined
        }
      />

      {/* Quick Contract Terms Configuration Modal */}
      <QuickContractTermsModal
        isOpen={Boolean(quickEditProject) && canEditContracts}
        onClose={() => setQuickEditProject(null)}
        project={quickEditProject}
        isAr={isAr}
        onSuccess={({ advancePaymentPct, retentionPct, performanceBondPct }) => {
          if (quickEditProject) {
            const pid = quickEditProject.id;
            setProjects((prev) =>
              prev.map((p) =>
                p.id === pid
                  ? {
                      ...p,
                      metadata: {
                        ...(p.metadata || {}),
                        advance_payment_pct: advancePaymentPct,
                        retention_pct: retentionPct,
                        performance_bond_pct: performanceBondPct,
                      },
                    }
                  : p
              )
            );
            setDbContracts((prev) =>
              prev.map((dc) =>
                dc.project_id === pid
                  ? {
                      ...dc,
                      advance_payment_pct: advancePaymentPct,
                      retention_pct: retentionPct,
                      performance_bond_pct: performanceBondPct,
                    }
                  : dc
              )
            );
            if (drawerContract && drawerContract.projectId === pid) {
              setDrawerContract({
                ...drawerContract,
                advancePaymentPct,
                advancePaymentValue: (drawerContract.originalValue * advancePaymentPct) / 100,
                retentionPct,
                retentionValue: (drawerContract.totalValue * retentionPct) / 100,
                performanceBondPct,
                performanceBondValue: (drawerContract.originalValue * performanceBondPct) / 100,
              });
            }
          }
        }}
      />

      {/* Retention & Bonds Report Modal */}
      <RetentionAndBondsReportModal
        isOpen={isRetentionReportOpen}
        onClose={() => setIsRetentionReportOpen(false)}
        projects={projects}
        onProjectUpdated={async () => {
          const updated = await ProjectService.getProjects();
          setProjects(updated || []);
        }}
      />

      {/* Coming-next Governance banner */}
      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4 text-center bg-slate-50/50 dark:bg-slate-900/40">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          {isAr
            ? 'سجل العقود والمستحقات مرتبط رقمياً بسجلات أوامر التغيير المعتمدة، خطابات الضمان البنكية، والمطالبات التعاقدية — وفقاً لمعايير عقود فيديك الهندسية ودورة اعتماد مستخلصات التنفيذ الدورية.'
            : 'Contracts portal integrated with variation orders, bank guarantees, and contractual claims following FIDIC engineering governance.'}
        </p>
      </div>
    </div>
  );
}
