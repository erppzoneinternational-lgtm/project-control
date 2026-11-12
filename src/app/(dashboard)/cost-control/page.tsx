'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { canAccessPath, canEditPath } from '@/lib/rbac/access-control';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { CostControlService } from '@/lib/services/costControl.service';
import { CostSnapshot, BudgetLine, CostControlSummary } from '@/types/cost-control';
import { supabase } from '@/lib/supabase';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  Activity,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  Search,
  CheckCircle2,
  ShieldAlert,
  FolderKanban,
  Clock,
  Target,
  Scale,
} from 'lucide-react';
import { toast } from 'sonner';

const ALLOWED_ROLES = ['admin', 'project_manager', 'commercial_manager', 'cost_control', 'coo', 'ceo'];

/**
 * Reusable Currency Display Component
 * Formats numbers in strictly LTR direction to prevent Arabic RTL sign/punctuation swapping.
 * Uses font-mono and tabular-nums for aligned financial scanning.
 */
function CurrencyDisplay({
  value,
  showSign = false,
  className = '',
  symbolClassName = 'text-xs text-gray-500 dark:text-slate-400 font-sans',
}: {
  value: number | undefined | null;
  showSign?: boolean;
  className?: string;
  symbolClassName?: string;
}) {
  const num = Number(value || 0);
  const isNegative = num < 0;
  const absFormatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Math.abs(Math.round(num)));
  const sign = isNegative ? '-' : showSign && num > 0 ? '+' : '';

  return (
    <span
      dir="ltr"
      className={`font-mono tabular-nums inline-flex items-baseline gap-1 ${className}`}
    >
      <span>
        {sign}
        {absFormatted}
      </span>
      <span className={symbolClassName}>ج.م</span>
    </span>
  );
}

/**
 * Formats a plain number for chart axes and tooltips
 */
const formatNumber = (val: number | undefined | null) => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Math.round(val || 0));
};

/**
 * Custom Recharts Tooltip for S-Curve with high-contrast Arabic formatting
 */
interface ChartTooltipEntry {
  dataKey?: string;
  color?: string;
  value?: number;
}

const CustomChartTooltip = ({
  active,
  payload,
  label,
  isAr = true,
}: {
  active?: boolean;
  payload?: ChartTooltipEntry[];
  label?: string | number;
  isAr?: boolean;
}) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-xl shadow-xl border border-gray-200 dark:border-slate-800 text-xs space-y-2 min-w-[220px]"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="font-bold text-gray-900 dark:text-slate-100 border-b border-gray-100 dark:border-slate-800 pb-1.5 flex items-center justify-between">
        <span className="text-gray-500 dark:text-slate-400">{isAr ? 'تاريخ اللقطة:' : 'Snapshot Date:'}</span>
        <span className="font-mono text-gray-800 dark:text-slate-200" dir="ltr">
          {label}
        </span>
      </div>
      {payload.map((entry, index: number) => {
        let labelText = isAr ? 'القيمة' : 'Value';
        let codeTag = '';
        if (entry.dataKey === 'PV') {
          labelText = isAr ? 'القيمة المخططة' : 'Planned Value';
          codeTag = 'PV';
        }
        if (entry.dataKey === 'EV') {
          labelText = isAr ? 'القيمة المكتسبة' : 'Earned Value';
          codeTag = 'EV';
        }
        if (entry.dataKey === 'AC') {
          labelText = isAr ? 'التكلفة الفعلية' : 'Actual Cost';
          codeTag = 'AC';
        }
        return (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700 dark:text-slate-300 font-medium">{labelText}</span>
              {codeTag && (
                <span className="font-mono text-[10px] text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded font-semibold">
                  {codeTag}
                </span>
              )}
            </div>
            <span dir="ltr" className="font-mono tabular-nums font-semibold text-gray-900 dark:text-slate-100">
              {formatNumber(entry.value)} ج.م
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default function CostControlPage() {
  const { user } = useAuthStore();
  const { roles: userRoles, isAdmin, hasRole, isLoading: rolesLoading } = useUserRoles();
  const { data: dbAccessRules, isLoading: accessLoading } = useModuleAccess();
  const isViewerOnly = (userRoles || []).length > 0 && (userRoles || []).every((r) => r === 'viewer');
  const canEdit =
    !rolesLoading &&
    !accessLoading &&
    !isViewerOnly &&
    canEditPath('/cost-control', userRoles || [], isAdmin, dbAccessRules);
  const { activeProjectId, setActiveProjectId } = useProjectStore();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId || '');
  const [availableProjects, setAvailableProjects] = useState<{
    id: string;
    project_name: string;
    project_name_ar?: string | null;
    project_code?: string | null;
  }[]>([]);
  const [isAr, setIsAr] = useState(true);

  const [snapshots, setSnapshots] = useState<CostSnapshot[]>([]);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [summary, setSummary] = useState<CostControlSummary | null>(null);
  const [projectInfo, setProjectInfo] = useState<{ name: string; code: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Synchronize language state with document element
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const htmlLang = document.documentElement.lang;
      const htmlDir = document.documentElement.dir;
      if (htmlLang === 'en' || htmlDir === 'ltr') {
        setIsAr(false);
      }
    }
  }, []);

  // Sync selectedProjectId two-way with useProjectStore
  useEffect(() => {
    if (activeProjectId && activeProjectId !== selectedProjectId) {
      setSelectedProjectId(activeProjectId);
    } else if (!activeProjectId && selectedProjectId) {
      setSelectedProjectId('');
    }
  }, [activeProjectId]);

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    if (setActiveProjectId) {
      setActiveProjectId(projectId);
    }
  };

  // Fetch projects list for dropdown project switcher
  useEffect(() => {
    let isMounted = true;
    async function fetchProjectsList() {
      try {
        const { data, error } = await supabase
          .from('pm_projects')
          .select('id, project_name, project_name_ar, project_code')
          .order('project_name', { ascending: true });
        if (!error && data && isMounted) {
          setAvailableProjects(data);
        }
      } catch (err) {
        console.error('Failed to load projects list:', err);
      }
    }
    fetchProjectsList();
    return () => {
      isMounted = false;
    };
  }, []);

  const currentProjectId = selectedProjectId || activeProjectId;

  const loadData = useCallback(async () => {
    if (!currentProjectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchError(null);
    try {
      const [snaps, lines, sum, projRes] = await Promise.all([
        CostControlService.getCostSnapshots(currentProjectId).catch(() => []),
        CostControlService.getBudgetLines(currentProjectId).catch(() => []),
        CostControlService.getCostControlSummary(currentProjectId).catch(() => null),
        Promise.resolve(
          supabase
            .from('pm_projects_with_manager')
            .select('id, project_name, project_name_ar, project_code')
            .eq('id', currentProjectId)
            .maybeSingle()
        ).catch(() => ({ data: null })),
      ]);

      setSnapshots(snaps || []);
      setBudgetLines(lines || []);
      setSummary(sum);

      let pInfo = projRes?.data;
      if (!pInfo) {
        const { data: directProj } = await supabase
          .from('pm_projects')
          .select('id, project_name, project_name_ar, project_code')
          .eq('id', currentProjectId)
          .maybeSingle();
        pInfo = directProj;
      }

      if (pInfo) {
        setProjectInfo({
          name: isAr
            ? pInfo.project_name_ar || pInfo.project_name || 'مشروع غير مسمى'
            : pInfo.project_name || pInfo.project_name_ar || 'Unnamed Project',
          code: pInfo.project_code || '',
        });
      }
    } catch (error: unknown) {
      console.error('Failed to load cost control data:', error);
      setFetchError(
        (error as { message?: string } | null)?.message ||
          (isAr
            ? 'تعذر تحميل بيانات التكاليف ومؤشرات إدارة القيمة المكتسبة للمشروع.'
            : 'Failed to load project cost control and EVM metrics.')
      );
    } finally {
      setLoading(false);
    }
  }, [currentProjectId, isAr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // EVM Advanced Forecast & Variance Calculations
  const calculatedVAC = useMemo(() => {
    if (!summary) return 0;
    const eacVal =
      summary.eac > 0
        ? summary.eac
        : summary.overallCPI > 0
        ? summary.totalBudget / summary.overallCPI
        : summary.totalBudget;
    return summary.totalBudget - eacVal;
  }, [summary]);

  const calculatedTCPI = useMemo(() => {
    if (!summary) return 1;
    const remBudget = summary.totalBudget - summary.totalActualCost;
    const remWork = summary.totalBudget - summary.totalEarnedValue;
    if (remBudget <= 0) return remWork > 0 ? 2.0 : 1.0;
    return Number((remWork / remBudget).toFixed(2));
  }, [summary]);

  // Status helper for SPI
  const getSpiStatus = (spi: number) => {
    if (spi >= 1.05) {
      return {
        label: isAr ? 'متقدم عن الجدول الزمني' : 'Ahead of Schedule',
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/50',
        icon: TrendingUp,
      };
    }
    if (spi >= 0.95) {
      return {
        label: isAr ? 'مطابق للجدول الزمني' : 'On Schedule',
        badgeClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/50',
        icon: CheckCircle2,
      };
    }
    return {
      label: isAr ? 'متأخر عن الجدول الزمني' : 'Behind Schedule',
      badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/50',
      icon: AlertTriangle,
    };
  };

  // Status helper for CPI
  const getCpiStatus = (cpi: number) => {
    if (cpi >= 1.05) {
      return {
        label: isAr ? 'وفر في التكلفة' : 'Cost Underrun',
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/50',
        icon: TrendingUp,
      };
    }
    if (cpi >= 0.95) {
      return {
        label: isAr ? 'ضمن الميزانية' : 'On Budget',
        badgeClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/50',
        icon: CheckCircle2,
      };
    }
    return {
      label: isAr ? 'تجاوز للميزانية' : 'Cost Overrun',
      badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/50',
      icon: AlertTriangle,
    };
  };

  // Filter budget lines by search query
  const filteredBudgetLines = useMemo(() => {
    if (!searchQuery.trim()) return budgetLines;
    const q = searchQuery.toLowerCase().trim();
    return budgetLines.filter(
      (line) =>
        (line.cost_code_id || '').toLowerCase().includes(q) ||
        (line.description_ar || '').toLowerCase().includes(q) ||
        (line.description_en || '').toLowerCase().includes(q)
    );
  }, [budgetLines, searchQuery]);

  // Aggregate totals for the budget table footer
  const tableTotals = useMemo(() => {
    const sumBudget = filteredBudgetLines.reduce((s, l) => s + (l.current_budget || 0), 0);
    const sumActual = filteredBudgetLines.reduce((s, l) => s + (l.actual_cost || 0), 0);
    const sumVariance = filteredBudgetLines.reduce((s, l) => s + (l.variance || 0), 0);
    const spentPct = sumBudget > 0 ? ((sumActual / sumBudget) * 100).toFixed(1) : '0';
    return { sumBudget, sumActual, sumVariance, spentPct };
  }, [filteredBudgetLines]);

  // Latest snapshot date formatted for display
  const latestSnapshotDate = useMemo(() => {
    if (snapshots.length === 0) return null;
    const last = snapshots[snapshots.length - 1];
    try {
      return new Date(last.snapshot_date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return last.snapshot_date;
    }
  }, [snapshots, isAr]);

  // Chart data formatting
  const chartData = useMemo(() => {
    return snapshots.map((s) => ({
      name: new Date(s.snapshot_date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
      }),
      fullDate: s.snapshot_date,
      PV: Math.round(s.planned_value || 0),
      EV: Math.round(s.earned_value || 0),
      AC: Math.round(s.actual_cost || 0),
    }));
  }, [snapshots, isAr]);

  // Recalculate EVM handler
  const handleRecalculate = async () => {
    if (!canEdit || !currentProjectId) return;
    setRecalculating(true);
    try {
      const snap = await CostControlService.recalculateAndSaveSnapshot(currentProjectId);
      if (snap) {
        toast.success(
          isAr
            ? 'تمت إعادة احتساب وحفظ لقطة القيمة المكتسبة بنجاح'
            : 'Earned value snapshot recalculated and saved successfully'
        );
        await loadData();
      } else {
        toast.error(
          isAr ? 'لم تتم إعادة احتساب المؤشرات' : 'Failed to recalculate metrics'
        );
      }
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string } | null)?.message ||
          (isAr ? 'فشل إعادة احتساب مؤشرات القيمة المكتسبة' : 'Failed to recalculate EVM metrics')
      );
    } finally {
      setRecalculating(false);
    }
  };

  // Export to Excel handler
  const handleExportExcel = () => {
    if (!summary && budgetLines.length === 0) {
      toast.error(isAr ? 'لا توجد بيانات متاحة للتصدير' : 'No data available to export');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: EVM Summary
      const evmRows = [
        {
          'المؤشر': isAr ? 'الميزانية المعتمدة عند الاكتمال' : 'Budget at Completion (BAC)',
          'الرمز القياسي': 'BAC',
          'القيمة (جنيه مصري)': summary?.totalBudget ?? 0,
          'التفسير': isAr ? 'إجمالي الميزانية المعتمدة للمشروع' : 'Total approved project budget',
        },
        {
          'المؤشر': isAr ? 'القيمة المخططة للأعمال' : 'Planned Value (PV)',
          'الرمز القياسي': 'PV',
          'القيمة (جنيه مصري)': summary?.totalPlannedValue ?? 0,
          'التفسير': isAr ? 'قيمة الأعمال المخطط إنجازها حتى تاريخ اللقطة' : 'Work planned to be done to date',
        },
        {
          'المؤشر': isAr ? 'القيمة المكتسبة للأعمال المنجزة' : 'Earned Value (EV)',
          'الرمز القياسي': 'EV',
          'القيمة (جنيه مصري)': summary?.totalEarnedValue ?? 0,
          'التفسير': isAr ? 'قيمة الأعمال المنجزة فعلياً طبقاً لنسب التقدم' : 'Work actually completed to date',
        },
        {
          'المؤشر': isAr ? 'التكلفة الفعلية المنفذة' : 'Actual Cost (AC)',
          'الرمز القياسي': 'AC',
          'القيمة (جنيه مصري)': summary?.totalActualCost ?? 0,
          'التفسير': isAr ? 'إجمالي التكاليف والمصروفات الفعلية المنفذة' : 'Total actual expenditures',
        },
        {
          'المؤشر': isAr ? 'تباين التكلفة' : 'Cost Variance (CV)',
          'الرمز القياسي': 'CV = EV - AC',
          'القيمة (جنيه مصري)': summary?.overallCV ?? 0,
          'التفسير':
            (summary?.overallCV ?? 0) >= 0
              ? (isAr ? 'وفر في الميزانية (إيجابي)' : 'Budget Underrun (Favorable)')
              : (isAr ? 'تجاوز في الميزانية (سلبي)' : 'Budget Overrun (Unfavorable)'),
        },
        {
          'المؤشر': isAr ? 'تباين الجدول الزمني' : 'Schedule Variance (SV)',
          'الرمز القياسي': 'SV = EV - PV',
          'القيمة (جنيه مصري)': summary?.overallSV ?? 0,
          'التفسير':
            (summary?.overallSV ?? 0) >= 0
              ? (isAr ? 'متقدم عن الجدول الزمني (إيجابي)' : 'Ahead of Schedule (Favorable)')
              : (isAr ? 'تأخير عن الجدول الزمني (سلبي)' : 'Behind Schedule (Unfavorable)'),
        },
        {
          'المؤشر': isAr ? 'مؤشر أداء التكلفة' : 'Cost Performance Index (CPI)',
          'الرمز القياسي': 'CPI = EV / AC',
          'القيمة': Number((summary?.overallCPI ?? 1).toFixed(3)),
          'التفسير':
            (summary?.overallCPI ?? 1) >= 1
              ? (isAr ? 'أداء تكلفة منضبط ووفر مالي' : 'On Budget or Favorable')
              : (isAr ? 'تجاوز في التكلفة' : 'Cost Overrun'),
        },
        {
          'المؤشر': isAr ? 'مؤشر أداء الجدول الزمني' : 'Schedule Performance Index (SPI)',
          'الرمز القياسي': 'SPI = EV / PV',
          'القيمة': Number((summary?.overallSPI ?? 1).toFixed(3)),
          'التفسير':
            (summary?.overallSPI ?? 1) >= 1
              ? (isAr ? 'متقدم أو مطابق للجدول الزمني' : 'On Schedule or Ahead')
              : (isAr ? 'متأخر عن الجدول الزمني' : 'Behind Schedule'),
        },
        {
          'المؤشر': isAr ? 'التقدير الإجمالي عند الاكتمال' : 'Estimate at Completion (EAC)',
          'الرمز القياسي': 'EAC',
          'القيمة (جنيه مصري)': summary?.eac ?? 0,
          'التفسير': isAr ? 'التكلفة الإجمالية المتوقعة لإتمام المشروع' : 'Expected total cost to complete project',
        },
        {
          'المؤشر': isAr ? 'التقدير المتبقي للاكتمال' : 'Estimate to Complete (ETC)',
          'الرمز القياسي': 'ETC',
          'القيمة (جنيه مصري)': summary?.etc ?? 0,
          'التفسير': isAr ? 'السيولة المتبقية المطلوب إنفاقها لإغلاق المشروع' : 'Remaining expected expenditure',
        },
        {
          'المؤشر': isAr ? 'التباين المالي عند الاكتمال' : 'Variance at Completion (VAC)',
          'الرمز القياسي': 'VAC = BAC - EAC',
          'القيمة (جنيه مصري)': calculatedVAC,
          'التفسير': calculatedVAC >= 0
            ? (isAr ? 'وفر متوقع عند الإغلاق' : 'Expected surplus at completion')
            : (isAr ? 'عجز متوقع عند الإغلاق' : 'Expected deficit at completion'),
        },
        {
          'المؤشر': isAr ? 'مؤشر كفاءة إكمال الأعمال المتبقية' : 'To-Complete Performance Index (TCPI)',
          'الرمز القياسي': 'TCPI',
          'القيمة': Number(calculatedTCPI.toFixed(3)),
          'التفسير':
            calculatedTCPI <= 1
              ? (isAr ? 'كفاءة اعتيادية مطلوبة' : 'Standard efficiency needed')
              : (isAr ? 'يتطلب ترشيد التكاليف لتحقيق الميزانية' : 'Cost compression required'),
        },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(evmRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, isAr ? 'ملخص مؤشرات القيمة المكتسبة' : 'EVM Summary');

      // Sheet 2: Budget Breakdown
      if (budgetLines.length > 0) {
        const budgetRows = budgetLines.map((line) => {
          const spentPct =
            line.current_budget > 0
              ? ((line.actual_cost / line.current_budget) * 100).toFixed(1)
              : '0';
          return {
            'كود التكلفة': line.cost_code_id,
            'الوصف بالعربية': line.description_ar,
            'الوصف بالإنجليزية': line.description_en || '',
            'الميزانية المعتمدة (جنيه مصري)': line.current_budget,
            'التكلفة الفعلية (جنيه مصري)': line.actual_cost,
            'التباين المالي (جنيه مصري)': line.variance,
            'نسبة المنفق (%)': Number(spentPct),
            'حالة البند':
              line.variance < 0
                ? (isAr ? 'تجاوز ميزانية' : 'Over Budget')
                : Number(spentPct) >= 85
                ? (isAr ? 'يقترب من السقف' : 'Near Limit')
                : (isAr ? 'منضبط' : 'On Track'),
          };
        });
        const wsBudget = XLSX.utils.json_to_sheet(budgetRows);
        XLSX.utils.book_append_sheet(wb, wsBudget, isAr ? 'تفصيل الميزانية' : 'Budget Breakdown');
      }

      const safeProjCode = projectInfo?.code ? `_${projectInfo.code}` : '';
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `CostControl${safeProjCode}_${dateStr}.xlsx`);
      toast.success(
        isAr ? 'تم تصدير تقرير التحكم بالتكاليف بنجاح' : 'Cost control report exported successfully'
      );
    } catch (err: unknown) {
      console.error('Export error:', err);
      toast.error(isAr ? 'حدث خطأ أثناء تصدير الملف' : 'An error occurred during file export');
    }
  };

  // 1. Loading State with Layout-Stable Skeletons
  if (rolesLoading || accessLoading || loading) {
    return (
      <div
        className="p-6 space-y-6 animate-pulse"
        dir={isAr ? 'rtl' : 'ltr'}
        role="status"
        aria-label="جاري تحميل بيانات التحكم بالتكاليف"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="h-7 w-72 bg-gray-200 dark:bg-slate-700 rounded-lg" />
            <div className="h-4 w-96 bg-gray-100 dark:bg-slate-800 rounded-md" />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="h-10 w-28 bg-gray-200 dark:bg-slate-700 rounded-xl" />
            <div className="h-10 w-48 bg-gray-200 dark:bg-slate-700 rounded-xl" />
          </div>
        </div>

        {/* 6 KPI Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 space-y-3 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded" />
                <div className="h-9 w-9 bg-gray-100 dark:bg-slate-800 rounded-lg" />
              </div>
              <div className="h-6 w-28 bg-gray-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-16 bg-gray-100 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="h-5 w-48 bg-gray-200 dark:bg-slate-700 rounded" />
          <div className="h-72 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-dashed border-gray-200 dark:border-slate-800" />
        </div>

        {/* Forecast Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 space-y-2 shadow-sm">
              <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded" />
              <div className="h-6 w-32 bg-gray-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-40 bg-gray-100 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-4 space-y-3 shadow-sm">
          <div className="h-5 w-32 bg-gray-200 dark:bg-slate-700 rounded" />
          <div className="h-10 bg-gray-100 dark:bg-slate-800 rounded-lg" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-50 dark:bg-slate-800/60 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // 2. Permission Gate
  const hasAccess =
    canAccessPath('/cost-control', userRoles || [], isAdmin, dbAccessRules) ||
    ALLOWED_ROLES.some((r) => hasRole(r));
  if (!hasAccess) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-16" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-2xl flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-800/50">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              {isAr ? 'غير مصرح بالوصول' : 'Access Restricted'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
              {isAr
                ? 'صفحة الرقابة على التكاليف ومؤشرات القيمة المكتسبة مخصصة لمدراء المشاريع ومهندسي ضبط التكاليف والإدارة التنفيذية. يرجى مراجعة مسؤول النظام لمنح الصلاحيات اللازمة.'
                : 'The Cost Control and Earned Value Management page is restricted to Project Managers, Cost Engineers, and Executive Management. Please contact your system administrator.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. No Project Selected State with Direct Project Selector
  if (!currentProjectId) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-16" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 rounded-2xl flex items-center justify-center mx-auto border border-sky-100 dark:border-sky-800/50">
            <FolderKanban className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              {isAr ? 'الرجاء تحديد مشروع للمتابعة' : 'Please Select a Project to Proceed'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
              {isAr
                ? 'لمتابعة مؤشرات القيمة المكتسبة وتفصيل الميزانيات، يرجى اختيار أحد المشاريع المسجلة من القائمة أدناه أو من شريط المشاريع بالأعلى.'
                : 'To track Earned Value Management (EVM) metrics and budget breakdowns, please select a project below or from the top navigation bar.'}
            </p>
          </div>

          {availableProjects.length > 0 && (
            <div className="pt-2 text-right">
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'اختر المشروع:' : 'Select Project:'}
              </label>
              <select
                value=""
                onChange={(e) => handleSelectProject(e.target.value)}
                className="w-full text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-gray-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-sm"
              >
                <option value="" disabled>
                  {isAr ? '— اختر المشروع للمتابعة الآن —' : '— Select a project to view —'}
                </option>
                {availableProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_name_ar || p.project_name} {p.project_code ? `(${p.project_code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <span>{isAr ? 'الانتقال إلى دليل المشاريع' : 'Go to Projects Directory'}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. API Error State with Retry Trigger
  if (fetchError) {
    return (
      <div className="p-6 max-w-2xl mx-auto mt-12" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-rose-900 dark:text-rose-300">
              {isAr ? 'تعذر تحميل بيانات التحكم بالتكاليف' : 'Failed to Load Cost Control Data'}
            </h2>
            <p className="text-xs text-rose-700 dark:text-rose-300">{fetchError}</p>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isAr ? 'إعادة المحاولة الآن' : 'Retry Now'}</span>
          </button>
        </div>
      </div>
    );
  }

  const spiStatus = getSpiStatus(summary?.overallSPI ?? 1);
  const cpiStatus = getCpiStatus(summary?.overallCPI ?? 1);
  const SpiIcon = spiStatus.icon;
  const CpiIcon = cpiStatus.icon;

  return (
    <div className="p-6 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ═══ Official Executive Print Report Header (Visible only on print/PDF) ═══ */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-stone-800 pb-4 mb-4" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3">
          <img
            src="/pzone-logo-dark.png"
            alt="P.ZONE"
            className="h-10 w-auto object-contain"
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
          <div>
            <h2 className="text-base font-black text-black">P.ZONE FOR POOLS & WATER FEATURES</h2>
            <p className="text-[11px] text-stone-600 font-bold">
              تقرير الرقابة على التكاليف وإدارة القيمة المكتسبة
            </p>
            <p className="text-[9px] text-stone-400 font-mono" dir="ltr">
              EVM & COST CONTROL REPORT
            </p>
          </div>
        </div>
        <div className="text-left text-[10px] text-stone-700 space-y-0.5" dir="ltr">
          <p><strong>Project:</strong> {projectInfo?.name || 'All Projects'}</p>
          <p><strong>Code:</strong> {projectInfo?.code || '—'}</p>
          <p><strong>Printed Date:</strong> {new Date().toLocaleDateString('en-GB')}</p>
          <p className="font-mono text-[9px] text-stone-500">P.ZONE PMO CONTROLS • CONFIDENTIAL</p>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-blue-600 mb-1">
            <span className="flex items-center gap-1">
              <span>{isAr ? 'مكتب إدارة المشروعات' : 'Project Management Office'}</span>
              <span className="font-mono text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold">PMO</span>
            </span>
            <span>/</span>
            <span>{isAr ? 'الرقابة والتحكم المالي' : 'Financial Controls'}</span>
            {projectInfo && (
              <>
                <span>/</span>
                <span className="text-gray-800 dark:text-slate-200 font-semibold">{projectInfo.name}</span>
                {projectInfo.code && (
                  <span className="font-mono text-gray-500 dark:text-slate-400">({projectInfo.code})</span>
                )}
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-normal flex flex-wrap items-center gap-2">
            <span>{isAr ? 'الرقابة على التكاليف وإدارة القيمة المكتسبة' : 'Cost Control & Earned Value Management'}</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50">
              EVM
            </span>
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-slate-400 mt-1">
            <p>
              {isAr
                ? 'تحديث لحظي لمؤشرات الأداء المالي والجدول الزمني وفقاً للمعايير الدولية المعتمدة'
                : 'Real-time financial and schedule performance tracking aligned with international PMO standards'}
            </p>
            {latestSnapshotDate && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                <Clock className="w-3 h-3" />
                <span>{isAr ? `آخر لقطة: ${latestSnapshotDate}` : `Latest Snapshot: ${latestSnapshotDate}`}</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Triggers & Project Selector */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto print:hidden">
          {/* Project Switcher Dropdown */}
          {availableProjects.length > 0 && (
            <div className="relative min-w-[210px]">
              <select
                value={selectedProjectId || ''}
                onChange={(e) => handleSelectProject(e.target.value)}
                aria-label={isAr ? 'تغيير المشروع الحالي' : 'Change current project'}
                className="w-full text-xs font-medium bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                {availableProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_name_ar || p.project_name} {p.project_code ? `(${p.project_code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            aria-label={isAr ? 'طباعة تقرير التحكم بالتكاليف' : 'Print cost control report'}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800/60 active:bg-gray-100 dark:active:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 print:hidden"
            data-testid="print-report-btn"
          >
            <Printer className="w-3.5 h-3.5 text-gray-600 dark:text-slate-400" aria-hidden="true" />
            <span>{isAr ? 'طباعة' : 'Print'}</span>
          </button>

          {/* Export to Excel Button */}
          <button
            onClick={handleExportExcel}
            disabled={budgetLines.length === 0 && !summary}
            aria-label={isAr ? 'تصدير تقرير التحكم بالتكاليف إلى ملف إكسيل' : 'Export cost control report to Excel'}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800/60 active:bg-gray-100 dark:active:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 print:hidden"
            data-testid="export-excel-btn"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>{isAr ? 'تصدير إكسيل' : 'Export Excel'}</span>
          </button>

          {/* Recalculate Trigger */}
          {canEdit && (
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              aria-label={isAr ? 'إعادة احتساب وتحديث مؤشرات القيمة المكتسبة' : 'Recalculate and update EVM metrics'}
              aria-busy={recalculating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              data-testid="recalculate-evm-btn"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>
                {recalculating
                  ? (isAr ? 'جاري إعادة الاحتساب...' : 'Recalculating...')
                  : (isAr ? 'إعادة احتساب مؤشرات القيمة المكتسبة' : 'Recalculate EVM')}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Cards (6 Core Metrics) */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* 1. BAC */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-gray-600 dark:text-slate-400">
                {isAr ? 'الميزانية المعتمدة عند الاكتمال' : 'Budget at Completion'}
              </span>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-[11px] font-mono text-blue-600 font-bold block">BAC</span>
              <p className="text-lg font-bold text-gray-900 dark:text-slate-100 mt-0.5">
                <CurrencyDisplay value={summary.totalBudget} />
              </p>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {isAr ? 'إجمالي الميزانية المعتمدة للمشروع' : 'Total approved project budget'}
            </p>
          </div>

          {/* 2. PV */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-gray-600 dark:text-slate-400">
                {isAr ? 'القيمة المخططة للأعمال' : 'Planned Value'}
              </span>
              <div className="p-2 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 rounded-lg shrink-0">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-[11px] font-mono text-sky-600 font-bold block">PV</span>
              <p className="text-lg font-bold text-gray-900 dark:text-slate-100 mt-0.5">
                <CurrencyDisplay value={summary.totalPlannedValue} />
              </p>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {isAr ? 'المخطط إنجازه حتى تاريخ اللقطة' : 'Work planned to date'}
            </p>
          </div>

          {/* 3. EV */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-gray-600 dark:text-slate-400">
                {isAr ? 'القيمة المكتسبة للأعمال' : 'Earned Value'}
              </span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-[11px] font-mono text-emerald-600 font-bold block">EV</span>
              <p className="text-lg font-bold text-gray-900 dark:text-slate-100 mt-0.5">
                <CurrencyDisplay value={summary.totalEarnedValue} />
              </p>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {isAr ? 'المنجز فعلياً بنسب التقدم' : 'Work accomplished by progress'}
            </p>
          </div>

          {/* 4. AC */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-gray-600 dark:text-slate-400">
                {isAr ? 'التكلفة الفعلية المنفذة' : 'Actual Cost'}
              </span>
              <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-lg shrink-0">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-[11px] font-mono text-amber-600 font-bold block">AC</span>
              <p className="text-lg font-bold text-gray-900 dark:text-slate-100 mt-0.5">
                <CurrencyDisplay value={summary.totalActualCost} />
              </p>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {isAr ? 'إجمالي المنصرف الفعلي المنفذ' : 'Total actual expenditures'}
            </p>
          </div>

          {/* 5. SPI with Schedule Variance */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-gray-600 dark:text-slate-400">
                {isAr ? 'مؤشر أداء الجدول الزمني' : 'Schedule Performance'}
              </span>
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  summary.overallSPI >= 1
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                }`}
              >
                <SpiIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-gray-500 dark:text-slate-400 font-bold">SPI</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${spiStatus.badgeClass}`}
                >
                  {spiStatus.label}
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-slate-100 font-mono tabular-nums mt-0.5" dir="ltr">
                {summary.overallSPI.toFixed(2)}
              </p>
            </div>
            <div className="text-[11px] mt-1 pt-1.5 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400">
                <span>{isAr ? 'تباين الجدول الزمني' : 'Schedule Variance'}</span>
                <span className="font-mono text-[10px] text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded">SV</span>
              </div>
              <CurrencyDisplay
                value={summary.overallSV}
                showSign={true}
                className={
                  summary.overallSV >= 0 ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-rose-700 dark:text-rose-300 font-bold'
                }
                symbolClassName="text-[10px] text-gray-400 font-sans"
              />
            </div>
          </div>

          {/* 6. CPI with Cost Variance */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-gray-600 dark:text-slate-400">
                {isAr ? 'مؤشر أداء التكلفة' : 'Cost Performance'}
              </span>
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  summary.overallCPI >= 1
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                }`}
              >
                <CpiIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-gray-500 dark:text-slate-400 font-bold">CPI</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${cpiStatus.badgeClass}`}
                >
                  {cpiStatus.label}
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-slate-100 font-mono tabular-nums mt-0.5" dir="ltr">
                {summary.overallCPI.toFixed(2)}
              </p>
            </div>
            <div className="text-[11px] mt-1 pt-1.5 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400">
                <span>{isAr ? 'تباين التكلفة' : 'Cost Variance'}</span>
                <span className="font-mono text-[10px] text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded">CV</span>
              </div>
              <CurrencyDisplay
                value={summary.overallCV}
                showSign={true}
                className={
                  summary.overallCV >= 0 ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-rose-700 dark:text-rose-300 font-bold'
                }
                symbolClassName="text-[10px] text-gray-400 font-sans"
              />
            </div>
          </div>
        </div>
      )}

      {/* S-Curve Chart Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                {isAr ? 'منحنى القيمة المكتسبة التراكمي' : 'Earned Value S-Curve'}
              </h2>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50">
                S-Curve
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'مقارنة المسار التراكمي بين القيمة المخططة والقيمة المكتسبة والتكلفة الفعلية عبر فترات المشروع'
                : 'Cumulative comparison of Planned Value, Earned Value, and Actual Cost over time'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
              <span className="text-gray-700 dark:text-slate-300 font-medium">{isAr ? 'القيمة المخططة' : 'Planned Value'}</span>
              <span className="font-mono text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded font-semibold border border-blue-100 dark:border-blue-800/50">
                PV
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-gray-700 dark:text-slate-300 font-medium">{isAr ? 'القيمة المكتسبة' : 'Earned Value'}</span>
              <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded font-semibold border border-emerald-100 dark:border-emerald-800/50">
                EV
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
              <span className="text-gray-700 dark:text-slate-300 font-medium">{isAr ? 'التكلفة الفعلية' : 'Actual Cost'}</span>
              <span className="font-mono text-[10px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded font-semibold border border-rose-100 dark:border-rose-800/50">
                AC
              </span>
            </span>
          </div>
        </div>

        {snapshots.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-800">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-full flex items-center justify-center mb-3">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">
              {isAr ? 'لا توجد لقطات أداء تاريخية مسجلة' : 'No historical performance snapshots recorded'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mt-1 mb-4 leading-relaxed">
              {isAr
                ? 'يتم تسجيل لقطات دورية لحفظ وتتبع المسار المالي التراكمي ومقارنة التكاليف الفعلية بالمخططة.'
                : 'Snapshots are periodically saved to track cumulative financial progress and compare actual to planned values.'}
            </p>
            {canEdit && (
              <button
                onClick={handleRecalculate}
                disabled={recalculating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
                <span>{isAr ? 'توليد وحفظ لقطة القيمة المكتسبة الأولى' : 'Generate and save first EVM snapshot'}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="h-80 w-full" style={{ direction: 'ltr' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorEV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorAC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => {
                    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
                    if (v >= 1e3) return `${(v / 1e3).toFixed(0)}k`;
                    return String(v);
                  }}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomChartTooltip isAr={isAr} />} />
                <Area
                  type="monotone"
                  dataKey="PV"
                  name={isAr ? 'القيمة المخططة' : 'Planned Value (PV)'}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPV)"
                />
                <Area
                  type="monotone"
                  dataKey="EV"
                  name={isAr ? 'القيمة المكتسبة' : 'Earned Value (EV)'}
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorEV)"
                />
                <Area
                  type="monotone"
                  dataKey="AC"
                  name={isAr ? 'التكلفة الفعلية' : 'Actual Cost (AC)'}
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAC)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Forecast & Project Controls Analysis (4 Cards) */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* EAC */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-600 dark:text-slate-400">
                  {isAr ? 'التقدير المالي عند الاكتمال' : 'Estimate at Completion'}
                </h3>
                <span className="text-[11px] font-mono text-gray-500 dark:text-slate-400 font-bold bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  EAC
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-2">
                <CurrencyDisplay value={summary.eac} />
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-50 dark:border-slate-800 text-[11px] text-gray-400">
              {isAr ? 'التكلفة الإجمالية المتوقعة لإتمام المشروع بالكامل' : 'Expected total cost to complete project'}
            </div>
          </div>

          {/* ETC */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-600 dark:text-slate-400">
                  {isAr ? 'التقدير للاكتمال' : 'Estimate to Complete'}
                </h3>
                <span className="text-[11px] font-mono text-gray-500 dark:text-slate-400 font-bold bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  ETC
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-2">
                <CurrencyDisplay value={summary.etc} />
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-50 dark:border-slate-800 text-[11px] text-gray-400">
              {isAr ? 'السيولة المتبقية المطلوبة لإنهاء كافة بنود الأعمال' : 'Remaining cash needed to complete work'}
            </div>
          </div>

          {/* VAC */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-600 dark:text-slate-400">
                  {isAr ? 'التباين المالي عند الاكتمال' : 'Variance at Completion'}
                </h3>
                <span className="text-[11px] font-mono text-gray-500 dark:text-slate-400 font-bold bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  VAC
                </span>
              </div>
              <p
                className={`text-xl font-bold mt-2 ${
                  calculatedVAC >= 0 ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'
                }`}
              >
                <CurrencyDisplay value={calculatedVAC} showSign={true} />
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-50 dark:border-slate-800">
              <span
                className={`inline-block text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                  calculatedVAC >= 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/50'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/50'
                }`}
              >
                {calculatedVAC >= 0
                  ? (isAr ? 'وفر مالي متوقع عند إغلاق المشروع' : 'Expected surplus at completion')
                  : (isAr ? 'عجز مالي متوقع يتطلب تصحيحاً' : 'Expected deficit requiring correction')}
              </span>
            </div>
          </div>

          {/* TCPI */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-600 dark:text-slate-400">
                  {isAr ? 'مؤشر كفاءة إكمال الأعمال المتبقية' : 'To-Complete Performance Index'}
                </h3>
                <span className="text-[11px] font-mono text-gray-500 dark:text-slate-400 font-bold bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  TCPI
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-slate-100 font-mono tabular-nums mt-2" dir="ltr">
                {calculatedTCPI.toFixed(2)}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-50 dark:border-slate-800">
              <span
                className={`inline-block text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                  calculatedTCPI <= 1.0
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/50'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/50'
                }`}
              >
                {calculatedTCPI <= 1.0
                  ? (isAr ? 'كفاءة اعتيادية قابلة للتحقيق' : 'Target efficiency achievable')
                  : (isAr ? 'يتطلب ترشيد تكاليف الأعمال المتبقية' : 'Cost reduction required')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Budget Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        {/* Table Filter & Subtitle Bar */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
              {isAr ? 'تفصيل الميزانية والمنصرف الفعلي' : 'Budget Breakdown & Actual Expenditure'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'متابعة دقيقة لكل كود تكلفة، التباينات المالية، ونسب الاستهلاك الفعلية'
                : 'Detailed tracking for each cost code, financial variances, and actual consumption rates'}
            </p>
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full sm:w-72 print:hidden">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث برمز التكلفة أو البيان...' : 'Search by cost code or description...'}
              className="w-full pl-3 pr-9 py-2 text-xs bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 dark:text-slate-200 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800 text-xs font-semibold text-gray-600 dark:text-slate-400">
              <tr>
                <th className="p-4 text-right">{isAr ? 'كود التكلفة' : 'Cost Code'}</th>
                <th className="p-4 text-right">{isAr ? 'بيان البند' : 'Description'}</th>
                <th className="p-4 text-left">{isAr ? 'الميزانية المعتمدة' : 'Current Budget'}</th>
                <th className="p-4 text-left">{isAr ? 'التكلفة الفعلية' : 'Actual Cost'}</th>
                <th className="p-4 text-left">{isAr ? 'التباين المالي' : 'Variance'}</th>
                <th className="p-4 text-right">{isAr ? 'نسبة الاستهلاك والحالة' : '% Spent & Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredBudgetLines.map((line) => {
                const spentPercentage =
                  line.current_budget > 0
                    ? ((line.actual_cost / line.current_budget) * 100).toFixed(1)
                    : '0';
                const numSpent = Number(spentPercentage);
                const isFavorable = line.variance >= 0;

                let barColor = 'bg-emerald-500';
                let badgeColor = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/50';
                let badgeText = isAr ? 'منضبط' : 'On Track';

                if (numSpent > 100) {
                  barColor = 'bg-rose-500';
                  badgeColor = 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/50';
                  badgeText = isAr ? 'تجاوز الميزانية' : 'Over Budget';
                } else if (numSpent >= 85) {
                  barColor = 'bg-amber-500';
                  badgeColor = 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/50';
                  badgeText = isAr ? 'يقترب من السقف' : 'Near Limit';
                }

                return (
                  <tr key={line.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="p-4 text-right whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-md font-mono text-xs font-semibold border border-gray-200/60 dark:border-slate-800">
                        {line.cost_code_id}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-semibold text-gray-900 dark:text-slate-100">
                        {isAr ? line.description_ar || line.description_en : line.description_en || line.description_ar}
                      </div>
                      {line.description_en && isAr && (
                        <div className="text-xs text-gray-400 font-mono mt-0.5">
                          {line.description_en}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-left whitespace-nowrap">
                      <CurrencyDisplay
                        value={line.current_budget}
                        className="text-gray-900 dark:text-slate-100 font-medium"
                      />
                    </td>
                    <td className="p-4 text-left whitespace-nowrap">
                      <CurrencyDisplay
                        value={line.actual_cost}
                        className="text-gray-900 dark:text-slate-100 font-medium"
                      />
                    </td>
                    <td className="p-4 text-left whitespace-nowrap">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          isFavorable
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/50'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/50'
                        }`}
                      >
                        {isFavorable ? (
                          <CheckCircle2
                            className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300 shrink-0"
                            aria-hidden="true"
                          />
                        ) : (
                          <AlertTriangle
                            className="w-3.5 h-3.5 text-rose-700 dark:text-rose-300 shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        <CurrencyDisplay
                          value={line.variance}
                          showSign={true}
                          className={isFavorable ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}
                          symbolClassName="text-[10px] text-gray-500 dark:text-slate-400 font-sans"
                        />
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5 min-w-[130px]">
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeColor}`}
                          >
                            {badgeText}
                          </span>
                          <span
                            dir="ltr"
                            className="font-mono tabular-nums font-semibold text-gray-700 dark:text-slate-300"
                          >
                            {spentPercentage}%
                          </span>
                        </div>
                        <div
                          className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden"
                          role="progressbar"
                          aria-valuenow={Math.min(numSpent, 100)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className={`h-full transition-all duration-300 ${barColor}`}
                            style={{ width: `${Math.min(numSpent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Empty State: No Budget Lines */}
              {budgetLines.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-center space-y-2">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 text-gray-400 rounded-full flex items-center justify-center">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                        {isAr ? 'لا توجد بنود ميزانية مسجلة لهذا المشروع' : 'No budget lines recorded for this project'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {isAr
                          ? 'يمكن ربط بنود التكلفة عبر جدول الكميات والمواصفات التعاقدية أو اعتماد ميزانية تفصيلية.'
                          : 'Cost codes can be linked through the bill of quantities or approved budget lines.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty State: Search Query No Match */}
              {budgetLines.length > 0 && filteredBudgetLines.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center">
                    <div className="flex flex-col items-center justify-center text-center space-y-1">
                      <Search className="w-8 h-8 text-gray-300 mb-1" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                        {isAr ? 'لا توجد نتائج مطابقة لبحثك' : 'No matching results found'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {isAr ? 'جرب البحث بكلمات مختلفة أو كود تكلفة آخر.' : 'Try searching with different keywords or cost codes.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Authoritative Totals Row (tfoot) */}
            {filteredBudgetLines.length > 0 && (
              <tfoot className="bg-gray-50 dark:bg-slate-800/60 font-bold border-t-2 border-gray-200 dark:border-slate-800">
                <tr>
                  <td colSpan={2} className="p-4 text-right text-gray-900 dark:text-slate-100">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                      <span>{isAr ? 'الإجمالي العام للمشروع' : 'Total Project Summary'}</span>
                      {searchQuery && (
                        <span className="text-xs font-normal text-gray-500 dark:text-slate-400">
                          {isAr ? '(للبنود المفلترة)' : '(for filtered lines)'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-left whitespace-nowrap">
                    <CurrencyDisplay value={tableTotals.sumBudget} className="text-gray-900 dark:text-slate-100" />
                  </td>
                  <td className="p-4 text-left whitespace-nowrap">
                    <CurrencyDisplay value={tableTotals.sumActual} className="text-gray-900 dark:text-slate-100" />
                  </td>
                  <td className="p-4 text-left whitespace-nowrap">
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                        tableTotals.sumVariance >= 0
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/50'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/50'
                      }`}
                    >
                      <CurrencyDisplay
                        value={tableTotals.sumVariance}
                        showSign={true}
                        className={
                          tableTotals.sumVariance >= 0 ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'
                        }
                      />
                    </div>
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <span dir="ltr" className="font-mono tabular-nums font-bold text-gray-900 dark:text-slate-100">
                      {tableTotals.spentPct}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ═══ Official Executive Print Report Footer ═══ */}
      <div className="hidden print:flex items-center justify-between border-t border-stone-300 pt-3 mt-6 text-[10px] text-stone-500" dir={isAr ? 'rtl' : 'ltr'}>
        <span>شركة بي زون للمنشآت المائية وحمامات السباحة — وثيقة مراقبة التكاليف المعتمدة</span>
        <span className="font-mono text-[9px]">P.ZONE ERP SYSTEM · EVM COST CONTROL SHEET</span>
      </div>
    </div>
  );
}
