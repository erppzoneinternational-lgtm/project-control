import React, { useMemo, useState } from 'react';
import { StakeholderFull, StakeholderKind } from '@/types';
import { 
  BarChart3, 
  PieChart, 
  Users, 
  Building2, 
  HardHat, 
  Briefcase, 
  Download, 
  Printer, 
  CheckCircle2, 
  Sparkles, 
  FileSpreadsheet, 
  ShieldCheck, 
  Phone, 
  Mail, 
  ArrowRight,
  Filter,
  Check,
  Search,
  X,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { 
  exportStakeholdersToExcel, 
  exportStakeholdersToCsv 
} from '@/lib/utils/stakeholderReportUtils';
import { UniversalReportModal } from '@/components/reports/UniversalReportModal';
import {
  ReportColumn,
  ReportKpiCard,
} from '@/lib/reports/reportEngine';
import { 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

interface StakeholderDataReportProps {
  stakeholders: StakeholderFull[];
  onClose?: () => void;
  lang?: 'ar' | 'en';
  isAr?: boolean;
}

const KIND_COLORS: Record<StakeholderKind, string> = {
  employee: '#10b981',       // Emerald
  client_rep: '#f59e0b',     // Amber
  vendor_rep: '#0284c7',     // Sky
  external_expert: '#8b5cf6', // Violet
};

const getKindLabels = (isAr: boolean): Record<StakeholderKind, string> => ({
  employee: isAr ? 'فريق العمل الداخلي' : 'Internal Team',
  client_rep: isAr ? 'العملاء والملاك' : 'Clients & Owners',
  vendor_rep: isAr ? 'المقاولون والموردون' : 'Contractors & Vendors',
  external_expert: isAr ? 'الاستشاريون والخبراء' : 'Consultants & Experts',
});

// Backward-compatible constant fallback
const KIND_LABELS: Record<StakeholderKind, string> = {
  employee: 'فريق العمل الداخلي',
  client_rep: 'العملاء والملاك',
  vendor_rep: 'المقاولون والموردون',
  external_expert: 'الاستشاريون والخبراء',
};

export const StakeholderDataReport: React.FC<StakeholderDataReportProps> = ({
  stakeholders,
  onClose,
  lang = 'ar',
  isAr,
}) => {
  const isArMode = isAr !== undefined ? isAr : lang !== 'en';
  const kindLabels = useMemo(() => getKindLabels(isArMode), [isArMode]);
  const [selectedKindFilter, setSelectedKindFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 1. KPI Calculations
  const metrics = useMemo(() => {
    const total = stakeholders.length;
    const employees = stakeholders.filter((s) => s.stakeholder_kind === 'employee').length;
    const clients = stakeholders.filter((s) => s.stakeholder_kind === 'client_rep').length;
    const vendors = stakeholders.filter((s) => s.stakeholder_kind === 'vendor_rep').length;
    const consultants = stakeholders.filter((s) => s.stakeholder_kind === 'external_expert').length;

    const assignedCount = stakeholders.filter((s) => (s.assigned_projects_count ?? 0) > 0).length;
    const systemUsersCount = stakeholders.filter((s) => s.is_system_user).length;
    const withPhoneCount = stakeholders.filter((s) => Boolean(s.phone && s.phone.trim())).length;
    const withEmailCount = stakeholders.filter((s) => Boolean(s.email && s.email.trim())).length;

    return {
      total,
      employees,
      clients,
      vendors,
      consultants,
      assignedCount,
      systemUsersCount,
      phoneCoveragePct: total > 0 ? Math.round((withPhoneCount / total) * 100) : 0,
      emailCoveragePct: total > 0 ? Math.round((withEmailCount / total) * 100) : 0,
      assignedCoveragePct: total > 0 ? Math.round((assignedCount / total) * 100) : 0,
    };
  }, [stakeholders]);

  // 2. Chart 1 Data: Breakdown by Stakeholder Kind
  const pieData = useMemo(() => {
    return [
      { name: kindLabels.employee, kind: 'employee' as StakeholderKind, value: metrics.employees, color: KIND_COLORS.employee },
      { name: kindLabels.client_rep, kind: 'client_rep' as StakeholderKind, value: metrics.clients, color: KIND_COLORS.client_rep },
      { name: kindLabels.vendor_rep, kind: 'vendor_rep' as StakeholderKind, value: metrics.vendors, color: KIND_COLORS.vendor_rep },
      { name: kindLabels.external_expert, kind: 'external_expert' as StakeholderKind, value: metrics.consultants, color: KIND_COLORS.external_expert },
    ].filter((d) => d.value > 0);
  }, [kindLabels, metrics]);

  // 3. Chart 2 Data: Top Organizations
  const barData = useMemo(() => {
    const orgMap: Record<string, { count: number; kind: StakeholderKind }> = {};
    stakeholders.forEach((s) => {
      const org = s.organization_name || (s.stakeholder_kind === 'employee' ? (isArMode ? 'شركة بي زون' : 'Pzone International') : (isArMode ? 'جهات خارجية' : 'External Entities'));
      if (!orgMap[org]) {
        orgMap[org] = { count: 0, kind: s.stakeholder_kind };
      }
      orgMap[org].count += 1;
    });

    return Object.entries(orgMap)
      .map(([name, info]) => ({
        name: name.length > 20 ? name.slice(0, 18) + '...' : name,
        fullName: name,
        count: info.count,
        kind: info.kind,
        color: KIND_COLORS[info.kind] || '#0284c7',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [stakeholders, isArMode]);

  // 4. Filtered Table Rows
  const tableRows = useMemo(() => {
    return stakeholders.filter((s) => {
      const matchesKind = selectedKindFilter === 'all' || s.stakeholder_kind === selectedKindFilter;
      const sTerm = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !sTerm ||
        (s.name_ar || '').toLowerCase().includes(sTerm) ||
        (s.name_en || '').toLowerCase().includes(sTerm) ||
        (s.role || '').toLowerCase().includes(sTerm) ||
        (s.organization_name || '').toLowerCase().includes(sTerm) ||
        (s.phone || '').includes(sTerm) ||
        (s.email || '').toLowerCase().includes(sTerm);
      return matchesKind && matchesSearch;
    });
  }, [stakeholders, selectedKindFilter, searchTerm]);

  const [isCustomReportModalOpen, setIsCustomReportModalOpen] = useState(false);

  const stakeholderReportColumns: ReportColumn<StakeholderFull>[] = useMemo(() => [
    {
      id: 'sn',
      labelAr: 'م',
      labelEn: 'SN',
      categoryAr: 'البيانات الشخصية',
      getValue: (_s, idx) => idx + 1,
      defaultVisible: true,
      widthMm: 12,
      align: 'center',
    },
    {
      id: 'name',
      labelAr: 'اسم الشريك / الموظف',
      labelEn: 'Partner / Employee Name',
      categoryAr: 'البيانات الشخصية',
      getValue: (s) => s.name_ar || s.name_en || '—',
      defaultVisible: true,
      widthMm: 45,
    },
    {
      id: 'kind',
      labelAr: 'التصنيف المؤسسي',
      labelEn: 'Classification',
      categoryAr: 'البيانات الشخصية',
      getValue: (s) => kindLabels[s.stakeholder_kind] || s.stakeholder_kind,
      defaultVisible: true,
      widthMm: 35,
      align: 'center',
    },
    {
      id: 'role',
      labelAr: 'المسمى الوظيفي والدور',
      labelEn: 'Role / Job Title',
      categoryAr: 'التوصيف الوظيفي والجهة',
      getValue: (s) => s.role || '—',
      defaultVisible: true,
      widthMm: 40,
    },
    {
      id: 'org',
      labelAr: 'الجهة أو الشركة',
      labelEn: 'Organization / Company',
      categoryAr: 'التوصيف الوظيفي والجهة',
      getValue: (s) => s.organization_name || (s.stakeholder_kind === 'employee' ? (isArMode ? 'بي زون التجارية' : 'P.Zone International') : '—'),
      defaultVisible: true,
      widthMm: 40,
    },
    {
      id: 'phone',
      labelAr: 'رقم الهاتف للتواصل',
      labelEn: 'Phone Number',
      categoryAr: 'بيانات الاتصال',
      getValue: (s) => s.phone || '—',
      defaultVisible: true,
      widthMm: 30,
      align: 'center',
    },
    {
      id: 'email',
      labelAr: 'البريد الإلكتروني',
      labelEn: 'Email',
      categoryAr: 'بيانات الاتصال',
      getValue: (s) => s.email || '—',
      defaultVisible: true,
      widthMm: 45,
    },
    {
      id: 'code',
      labelAr: 'كود التعريف أو الموظف',
      labelEn: 'Code / ID',
      categoryAr: 'البيانات الشخصية',
      getValue: (s) => s.employee_code || s.code || '—',
      defaultVisible: false,
      widthMm: 25,
      align: 'center',
    },
    {
      id: 'projects_count',
      labelAr: 'عدد المشاريع المسكن بها',
      labelEn: 'Assigned Projects',
      categoryAr: 'المشاريع والعمليات',
      getValue: (s) => s.assigned_projects_count ?? 0,
      defaultVisible: true,
      widthMm: 25,
      align: 'center',
    },
    {
      id: 'is_user',
      labelAr: 'مستخدم بالبوابة الإلكترونية',
      labelEn: 'Portal User',
      categoryAr: 'الصلاحيات والنظام',
      getValue: (s) => (s.is_system_user ? (isArMode ? 'نعم (حساب نشط)' : 'Yes (Active)') : (isArMode ? 'لا' : 'No')),
      defaultVisible: false,
      widthMm: 25,
      align: 'center',
    },
    {
      id: 'system_role',
      labelAr: 'دور الصلاحيات الإدارية',
      labelEn: 'System Role',
      categoryAr: 'الصلاحيات والنظام',
      getValue: (s) => s.system_role || '—',
      defaultVisible: false,
      widthMm: 30,
      align: 'center',
    },
    {
      id: 'status',
      labelAr: 'حالة القيد بالدليل',
      labelEn: 'Status',
      categoryAr: 'الصلاحيات والنظام',
      getValue: (s) => (s.is_active !== false ? (isArMode ? 'نشط' : 'Active') : (isArMode ? 'معطل' : 'Inactive')),
      defaultVisible: true,
      widthMm: 20,
      align: 'center',
    },
  ], [kindLabels, isArMode]);

  const stakeholderReportKpis: ReportKpiCard[] = useMemo(() => [
    { id: 'k1', label: isArMode ? 'إجمالي الشركاء' : 'Total Stakeholders', value: metrics.total, tone: 'default' },
    { id: 'k2', label: isArMode ? 'فريق العمل الداخلي' : 'Internal Team', value: metrics.employees, tone: 'emerald' },
    { id: 'k3', label: isArMode ? 'العملاء والملاك' : 'Clients & Owners', value: metrics.clients, tone: 'amber' },
    { id: 'k4', label: isArMode ? 'المقاولون والموردون' : 'Contractors & Vendors', value: metrics.vendors, tone: 'blue' },
    { id: 'k5', label: isArMode ? 'الاستشاريون والخبراء' : 'Consultants & Experts', value: metrics.consultants, tone: 'purple' },
    { id: 'k6', label: isArMode ? 'تغطية الهواتف والاتصال' : 'Phone Coverage', value: `${metrics.phoneCoveragePct}%`, tone: 'emerald' },
  ], [metrics, isArMode]);

  const handlePrint = () => {
    window.print();
  };

  const handleResetFilters = () => {
    setSelectedKindFilter('all');
    setSearchTerm('');
  };

  const isFiltered = selectedKindFilter !== 'all' || searchTerm.trim().length > 0;

  return (
    <div 
      dir={isArMode ? "rtl" : "ltr"} 
      className={`space-y-6 ${isArMode ? 'text-right' : 'text-left'} print:p-0 print:m-0 w-full`} 
      id="stakeholder-data-report-root"
    >
      {/* ── Header: Title + Controls + Source ── */}
      <header className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-all">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-normal bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-700/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              {isArMode ? 'تقرير إداري تحليلي معتمد' : 'Executive Telemetry Report'}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              {isArMode ? 'تاريخ الاستخراج: ' : 'Extracted on: '}
              {new Date().toLocaleDateString(isArMode ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <BarChart3 className="w-5 h-5" aria-hidden="true" />
            </div>
            <span>{isArMode ? 'تحليلات وحصر منظومة الشركاء وأصحاب المصلحة' : 'Stakeholders & Partners Analytics'}</span>
          </h2>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            {isArMode 
              ? 'مصدر البيانات: قاعدة البيانات الموحدة لمنظومة بي زون لحصر الشركات والعملاء والمقاولين والاستشاريين وفرق العمليات.'
              : 'Data Source: Unified database for clients, contractors, consultants, and operations team.'}
          </p>
        </div>

        {/* Export, Print & Navigation Toolbar */}
        <div className="flex items-center gap-2 flex-wrap shrink-0 print:hidden">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-95"
              aria-label={isArMode ? 'العودة لعرض كروت الشركاء' : 'Back to cards'}
              title={isArMode ? 'العودة للدليل' : 'Back to Directory'}
            >
              <ArrowRight className={`w-4 h-4 ${isArMode ? 'rtl:rotate-0' : 'rotate-180'}`} aria-hidden="true" />
              <span>{isArMode ? 'العودة للدليل' : 'Back to Directory'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCustomReportModalOpen(true)}
            data-testid="open-stakeholder-custom-report-modal"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/25 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            title={isArMode ? 'استوديو تخصيص وإصدار تقرير الشركاء المعتمد بمختلف الصيغ' : 'Custom Report Studio (PDF / Excel / CSV)'}
            aria-label={isArMode ? 'استوديو تخصيص التقرير' : 'Custom Report Studio'}
          >
            <Sparkles className="w-4 h-4 text-emerald-200" aria-hidden="true" />
            <span>{isArMode ? 'استوديو تخصيص التقرير' : 'Report Studio'}</span>
          </button>

          <button
            type="button"
            onClick={() => exportStakeholdersToExcel(tableRows, isArMode ? 'تقرير_الشركاء_المعتمد' : 'Stakeholders_Report')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-95"
            title={isArMode ? 'تصدير السجلات الحالية إلى ملف إكسيل' : 'Export current records to Excel (.xlsx)'}
            aria-label={isArMode ? 'تصدير جدول الشركاء كملف إكسيل' : 'Export to Excel'}
          >
            <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
            <span>{isArMode ? 'تصدير إكسيل' : 'Export Excel'}</span>
          </button>

          <button
            type="button"
            onClick={() => exportStakeholdersToCsv(tableRows, isArMode ? 'تقرير_الشركاء_المعتمد' : 'Stakeholders_Report')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-sky-200 dark:border-sky-800/80 bg-sky-50/80 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-sky-800 dark:text-sky-300 font-bold text-xs transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-95"
            title={isArMode ? 'تصدير السجلات الحالية كملف نصي مجدول يدعم اللغة العربية' : 'Export current records as CSV'}
            aria-label={isArMode ? 'تصدير جدول الشركاء كملف نصي' : 'Export to CSV'}
          >
            <Download className="w-4 h-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
            <span>{isArMode ? 'تصدير نصي (CSV)' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 font-bold text-xs transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-95"
            title={isArMode ? 'طباعة التقرير أو حفظه كملف رقمي' : 'Print report or save as PDF'}
            aria-label={isArMode ? 'طباعة التقرير' : 'Print report'}
          >
            <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
            <span>{isArMode ? 'طباعة' : 'Print'}</span>
          </button>
        </div>
      </header>

      {/* ── KPI Cards Grid (Per /data-report specification) ── */}
      <section 
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5"
        aria-label={isArMode ? 'مؤشرات أداء وإحصائيات الشركاء' : 'Stakeholders KPIs'}
      >
        {/* Total */}
        <button
          type="button"
          onClick={() => setSelectedKindFilter('all')}
          className={`rounded-2xl p-4 bg-white dark:bg-slate-900 border text-start shadow-xs relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            selectedKindFilter === 'all' 
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 dark:ring-emerald-500/30' 
              : 'border-slate-200/90 dark:border-slate-800'
          }`}
          title={isArMode ? 'عرض كافة الشركاء' : 'Show all stakeholders'}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {isArMode ? 'إجمالي الشركاء' : 'Total Stakeholders'}
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1.5">
            {metrics.total}
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-emerald-500 rounded-full w-full" />
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{isArMode ? 'سجل موثق بالدليل' : 'Verified records'}</span>
          </div>
        </button>

        {/* Pzone Team */}
        <button
          type="button"
          onClick={() => setSelectedKindFilter(prev => prev === 'employee' ? 'all' : 'employee')}
          className={`rounded-2xl p-4 bg-white dark:bg-slate-900 border text-start shadow-xs relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            selectedKindFilter === 'employee' 
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 dark:ring-emerald-500/30' 
              : 'border-emerald-500/20 dark:border-emerald-500/30'
          }`}
          title={isArMode ? 'تصفية حسب فريق العمل الداخلي' : 'Filter by Internal Team'}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              {isArMode ? 'فريق العمل الداخلي' : 'Internal Team'}
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1.5">
            {metrics.employees}
          </div>
          {/* Distribution bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
              style={{ width: `${metrics.total > 0 ? (metrics.employees / metrics.total) * 100 : 0}%` }} 
            />
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1.5 flex items-center justify-between">
            <span>{metrics.total > 0 ? Math.round((metrics.employees / metrics.total) * 100) : 0}% {isArMode ? 'من الإجمالي' : 'of total'}</span>
          </div>
        </button>

        {/* Clients & Owners */}
        <button
          type="button"
          onClick={() => setSelectedKindFilter(prev => prev === 'client_rep' ? 'all' : 'client_rep')}
          className={`rounded-2xl p-4 bg-white dark:bg-slate-900 border text-start shadow-xs relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
            selectedKindFilter === 'client_rep' 
              ? 'border-amber-500 ring-2 ring-amber-500/20 dark:ring-amber-500/30' 
              : 'border-amber-500/20 dark:border-amber-500/30'
          }`}
          title={isArMode ? 'تصفية حسب العملاء والملاك' : 'Filter by Clients & Owners'}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
              {isArMode ? 'العملاء والملاك' : 'Clients & Owners'}
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1.5">
            {metrics.clients}
          </div>
          {/* Distribution bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all duration-500" 
              style={{ width: `${metrics.total > 0 ? (metrics.clients / metrics.total) * 100 : 0}%` }} 
            />
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1.5 flex items-center justify-between">
            <span>{metrics.total > 0 ? Math.round((metrics.clients / metrics.total) * 100) : 0}% {isArMode ? 'من الإجمالي' : 'of total'}</span>
          </div>
        </button>

        {/* Vendors */}
        <button
          type="button"
          onClick={() => setSelectedKindFilter(prev => prev === 'vendor_rep' ? 'all' : 'vendor_rep')}
          className={`rounded-2xl p-4 bg-white dark:bg-slate-900 border text-start shadow-xs relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
            selectedKindFilter === 'vendor_rep' 
              ? 'border-sky-500 ring-2 ring-sky-500/20 dark:ring-sky-500/30' 
              : 'border-sky-500/20 dark:border-sky-500/30'
          }`}
          title={isArMode ? 'تصفية حسب المقاولين والموردين' : 'Filter by Contractors & Vendors'}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-700 dark:text-sky-400">
              {isArMode ? 'المقاولون والموردون' : 'Contractors & Vendors'}
            </span>
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
              <HardHat className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
          </div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono mt-1.5">
            {metrics.vendors}
          </div>
          {/* Distribution bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-sky-500 rounded-full transition-all duration-500" 
              style={{ width: `${metrics.total > 0 ? (metrics.vendors / metrics.total) * 100 : 0}%` }} 
            />
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1.5 flex items-center justify-between">
            <span>{metrics.total > 0 ? Math.round((metrics.vendors / metrics.total) * 100) : 0}% {isArMode ? 'من الإجمالي' : 'of total'}</span>
          </div>
        </button>

        {/* Consultants */}
        <button
          type="button"
          onClick={() => setSelectedKindFilter(prev => prev === 'external_expert' ? 'all' : 'external_expert')}
          className={`rounded-2xl p-4 bg-white dark:bg-slate-900 border text-start shadow-xs relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
            selectedKindFilter === 'external_expert' 
              ? 'border-violet-500 ring-2 ring-violet-500/20 dark:ring-violet-500/30' 
              : 'border-violet-500/20 dark:border-violet-500/30'
          }`}
          title={isArMode ? 'تصفية حسب الاستشاريين والخبراء' : 'Filter by Consultants & Experts'}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-violet-700 dark:text-violet-400">
              {isArMode ? 'الاستشاريون والخبراء' : 'Consultants & Experts'}
            </span>
            <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
          </div>
          <div className="text-2xl font-black text-violet-600 dark:text-violet-400 font-mono mt-1.5">
            {metrics.consultants}
          </div>
          {/* Distribution bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-violet-500 rounded-full transition-all duration-500" 
              style={{ width: `${metrics.total > 0 ? (metrics.consultants / metrics.total) * 100 : 0}%` }} 
            />
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1.5 flex items-center justify-between">
            <span>{metrics.total > 0 ? Math.round((metrics.consultants / metrics.total) * 100) : 0}% {isArMode ? 'من الإجمالي' : 'of total'}</span>
          </div>
        </button>

        {/* Active Portal Users */}
        <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-teal-500/20 dark:border-teal-500/30 shadow-xs relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400">
              {isArMode ? 'مستخدمو المنظومة' : 'Portal Users'}
            </span>
            <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono mt-1.5">
            {metrics.systemUsersCount}
          </div>
          {/* Distribution bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-teal-500 rounded-full transition-all duration-500" 
              style={{ width: `${metrics.total > 0 ? (metrics.systemUsersCount / metrics.total) * 100 : 0}%` }} 
            />
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1.5 flex items-center justify-between">
            <span>{isArMode ? 'حسابات نظام نشطة' : 'Active system accounts'}</span>
          </div>
        </div>
      </section>

      {/* ── Main Charts Section (Explicit container height per skill) ── */}
      <section 
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        aria-label="الرسوم البيانية التحليلية"
      >
        {/* Chart 1: Breakdown by Stakeholder Kind (5 Cols) */}
        <div className="lg:col-span-5 rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span>{isArMode ? 'توزيع الشركاء حسب التصنيف' : 'Stakeholders by Classification'}</span>
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                {isArMode ? 'تمثيل شامل' : '100% Representation'}
              </span>
            </div>

            {/* Overall Segmented Distribution Bar */}
            <div className="space-y-1.5 pt-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span>{isArMode ? 'شريط التوزيع النسبي' : 'Relative Distribution'}</span>
                <span className="font-mono">100%</span>
              </div>
              <div 
                className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 p-0.5 gap-0.5 shadow-inner"
                role="progressbar" 
                aria-label={isArMode ? 'شريط التوزيع النسبي للشركاء' : 'Stakeholders distribution bar'}
              >
                {pieData.map((d) => {
                  const pct = metrics.total > 0 ? (d.value / metrics.total) * 100 : 0;
                  return (
                    <div 
                      key={`dist-bar-${d.kind}`} 
                      style={{ width: `${pct}%`, backgroundColor: d.color }} 
                      className="h-full rounded-xs transition-all duration-300 hover:opacity-85 cursor-pointer"
                      title={`${d.name}: ${d.value} (${Math.round(pct)}%)`}
                      onClick={() => setSelectedKindFilter(prev => prev === d.kind ? 'all' : d.kind)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Chart container with strict fixed height */}
            <div className="w-full min-w-0 overflow-hidden relative h-[230px] mt-2" aria-label={isArMode ? 'رسم بياني دائري لتوزيع الشركاء' : 'Pie chart of stakeholders'}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    isAnimationActive={true}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`pie-cell-${entry.kind || index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [isArMode ? `${value} شريك` : `${value} Partners`, name]}
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#334155', 
                      borderRadius: '12px', 
                      color: '#fff', 
                      fontSize: '11px', 
                      textAlign: isArMode ? 'right' : 'left',
                      direction: isArMode ? 'rtl' : 'ltr'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Custom Interactive Legend with Filter Toggle and Mini Bars */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            {pieData.map((item) => {
              const pct = metrics.total > 0 ? Math.round((item.value / metrics.total) * 100) : 0;
              const isSelected = selectedKindFilter === item.kind;
              return (
                <button 
                  type="button"
                  key={item.name} 
                  onClick={() => setSelectedKindFilter(prev => prev === item.kind ? 'all' : item.kind)}
                  className={`flex flex-col gap-1 text-xs p-2 rounded-xl transition-all text-start cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isSelected 
                      ? 'bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-300 dark:ring-slate-700' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                  title={isArMode ? `تصفية حسب ${item.name}` : `Filter by ${item.name}`}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: item.color }} aria-hidden="true" />
                    <span className="text-slate-700 dark:text-slate-300 truncate font-semibold text-[11px]">{item.name}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white ms-auto text-[11px]">
                      {item.value} <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-1 rounded-full overflow-hidden mt-0.5">
                    <div 
                      className="h-full rounded-full transition-all duration-300" 
                      style={{ width: `${pct}%`, backgroundColor: item.color }} 
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Top Organizations by Representatives (7 Cols) */}
        <div className="lg:col-span-7 rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                <span>{isArMode ? 'أكبر الجهات والشركات تمثيلاً بالدليل' : 'Top Organizations by Representation'}</span>
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                {isArMode ? `أعلى ${barData.length} جهات` : `Top ${barData.length} entities`}
              </span>
            </div>

            {/* Chart container with strict fixed height */}
            <div className="w-full min-w-0 overflow-hidden relative h-[270px] mt-2" aria-label={isArMode ? 'رسم بياني شريطي لأكبر الجهات تمثيلا' : 'Bar chart for top organizations'}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
                <BarChart 
                  data={barData} 
                  layout="vertical" 
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 11, fill: '#94a3b8' }} 
                    axisLine={{ stroke: '#64748b', opacity: 0.3 }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={115} 
                    tick={{ fontSize: 11, fill: '#94a3b8', textAnchor: isArMode ? 'end' : 'start' }} 
                    axisLine={{ stroke: '#64748b', opacity: 0.3 }}
                  />
                  <Tooltip
                    formatter={(value: any) => [isArMode ? `${value} ممثل` : `${value} Representatives`, isArMode ? 'عدد جهات الاتصال' : 'Contacts Count']}
                    labelFormatter={(name: any) => {
                      const found = barData.find((b) => b.name === name);
                      return found?.fullName || name;
                    }}
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#334155', 
                      borderRadius: '12px', 
                      color: '#fff', 
                      fontSize: '11px', 
                      textAlign: isArMode ? 'right' : 'left',
                      direction: isArMode ? 'rtl' : 'ltr'
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`bar-cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center pt-2 border-t border-slate-100 dark:border-slate-800">
            {isArMode 
              ? 'يعكس الرسم البياني عدد جهات الاتصال وممثلي المالك أو المقاولين المسجلين لكل شركة.'
              : 'Chart reflects the count of registered contacts and representatives per organization.'}
          </div>
        </div>
      </section>

      {/* ── Executive Insights Box (Per /data-report specification) ── */}
      <section 
        className="rounded-3xl p-6 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/25 shadow-md space-y-3"
        aria-label={isArMode ? 'الرؤى والتحليلات الإدارية' : 'Executive Insights'}
      >
        <div className="flex items-center gap-2 text-sm font-black text-emerald-800 dark:text-emerald-300">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span>{isArMode ? 'الرؤى والتحليلات الإدارية والتنفيذية' : 'Executive Insights & Analytics'}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-xs">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span className="p-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" aria-hidden="true">🏢</span>
              <span>{isArMode ? 'توازن التمثيل المؤسسي' : 'Institutional Balance'}</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {isArMode ? (
                <>
                  يمثل فريق العمل الداخلي نسبة <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{Math.round((metrics.employees / (metrics.total || 1)) * 100)}%</strong>، بينما تشكل الجهات الخارجية من عملاء واستشاريين ومقاولين النسبة المتبقية بما يحقق شمولية الحوكمة والرقابة المستقلة.
                </>
              ) : (
                <>
                  The internal team represents <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{Math.round((metrics.employees / (metrics.total || 1)) * 100)}%</strong>, while external partners comprise the remainder for comprehensive governance.
                </>
              )}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-xs">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span className="p-1 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300" aria-hidden="true">📱</span>
              <span>{isArMode ? 'اكتمال بيانات الاتصال والتواصل' : 'Contact Data Completeness'}</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {isArMode ? (
                <>
                  نسبة توفر أرقام الهواتف تبلغ <strong className="text-sky-600 dark:text-sky-400 font-mono font-bold">{metrics.phoneCoveragePct}%</strong> والبريد الإلكتروني <strong className="text-sky-600 dark:text-sky-400 font-mono font-bold">{metrics.emailCoveragePct}%</strong> مما يتيح تفعيل الإشعارات والمخاطبات الفورية عبر الرسائل النصية والبريد الإلكتروني.
                </>
              ) : (
                <>
                  Phone coverage reaches <strong className="text-sky-600 dark:text-sky-400 font-mono font-bold">{metrics.phoneCoveragePct}%</strong> and email coverage <strong className="text-sky-600 dark:text-sky-400 font-mono font-bold">{metrics.emailCoveragePct}%</strong> enabling automated communications.
                </>
              )}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-xs">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span className="p-1 rounded bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300" aria-hidden="true">🎯</span>
              <span>{isArMode ? 'فاعلية التسكين بالمشاريع التنفيذية' : 'Project Assignment'}</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {isArMode ? (
                <>
                  تم تسكين <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{metrics.assignedCount}</strong> شريك في مشاريع قائمة بالفعل، ما يضمن ربط المسؤوليات بمصفوفة توزيع المهام والصلاحيات في كل موقع تنفيذي.
                </>
              ) : (
                <>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{metrics.assignedCount}</strong> partners are assigned to active projects, aligning responsibility matrices across sites.
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ── Data Table with Zebra Stripes & Sticky Header (Accessible Summary Table) ── */}
      <section 
        className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden space-y-4 p-6"
        aria-label={isArMode ? 'جدول بيانات الشركاء المفصل' : 'Detailed Stakeholders Data Table'}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{isArMode ? 'جدول بيانات الشركاء المفصل' : 'Detailed Stakeholders Data Table'}</span>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {tableRows.length} {isArMode ? 'سجل' : 'records'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isArMode 
                ? 'بيانات حية مباشرة قابلة للفلترة والتصدير السريع تدعم قارئات الشاشة وسهولة الاستخدام'
                : 'Live filterable data ready for instant export with full accessibility and keyboard support'}
            </p>
          </div>

          {/* Filter Bar with Search, Dropdown & Reset */}
          <div className="flex items-center gap-2.5 flex-wrap print:hidden">
            <div className="relative">
              <input
                type="text"
                placeholder={isArMode ? 'بحث بالاسم، الجهة، الهاتف...' : 'Search by name, organization, phone...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pe-3.5 ps-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 w-56 transition-all shadow-xs"
                aria-label={isArMode ? 'البحث في جدول الشركاء' : 'Search in stakeholders table'}
              />
              <Search className={`w-4 h-4 text-slate-400 absolute ${isArMode ? 'start-3' : 'left-3'} top-1/2 -translate-y-1/2 pointer-events-none`} aria-hidden="true" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className={`absolute ${isArMode ? 'end-2.5' : 'right-2.5'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-sm`}
                  aria-label={isArMode ? 'مسح نص البحث' : 'Clear search'}
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={selectedKindFilter}
                onChange={(e) => setSelectedKindFilter(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 cursor-pointer transition-all shadow-xs"
                aria-label={isArMode ? 'تصفية جدول الشركاء حسب التصنيف' : 'Filter stakeholders by category'}
              >
                <option value="all">{isArMode ? 'كل التصنيفات' : 'All Categories'} ({stakeholders.length})</option>
                <option value="employee">{isArMode ? 'فريق العمل الداخلي' : 'Internal Team'} ({metrics.employees})</option>
                <option value="client_rep">{isArMode ? 'العملاء والملاك' : 'Clients & Owners'} ({metrics.clients})</option>
                <option value="vendor_rep">{isArMode ? 'المقاولون والموردون' : 'Contractors & Vendors'} ({metrics.vendors})</option>
                <option value="external_expert">{isArMode ? 'الاستشاريون والخبراء' : 'Consultants & Experts'} ({metrics.consultants})</option>
              </select>
            </div>

            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95"
                title={isArMode ? 'إعادة ضبط البحث والتصنيف' : 'Reset search and filters'}
                aria-label={isArMode ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isArMode ? 'إلغاء الفلترة' : 'Reset Filters'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Accessible Table View */}
        <div 
          className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[440px] overflow-y-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
          role="region" 
          aria-label={isArMode ? 'منطقة جدول بيانات الشركاء القابلة للتمرير' : 'Scrollable stakeholders table'}
          tabIndex={0}
        >
          <table className={`w-full ${isArMode ? 'text-right' : 'text-left'} text-xs`} role="table">
            <caption className="sr-only">
              {isArMode 
                ? 'جدول بيانات تفصيلي بالشركاء وأصحاب المصلحة في المنظومة' 
                : 'Detailed table of stakeholders and partners'}
            </caption>
            <thead className="bg-slate-100/90 dark:bg-slate-800/95 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 shadow-2xs backdrop-blur-xs">
              <tr>
                <th scope="col" className="p-3 w-12 text-center">#</th>
                <th scope="col" className="p-3">{isArMode ? 'اسم الشريك' : 'Partner Name'}</th>
                <th scope="col" className="p-3">{isArMode ? 'التصنيف' : 'Classification'}</th>
                <th scope="col" className="p-3">{isArMode ? 'المسمى الوظيفي والدور' : 'Role / Title'}</th>
                <th scope="col" className="p-3">{isArMode ? 'الجهة أو الشركة' : 'Organization'}</th>
                <th scope="col" className="p-3">{isArMode ? 'الهاتف' : 'Phone'}</th>
                <th scope="col" className="p-3">{isArMode ? 'البريد الإلكتروني' : 'Email'}</th>
                <th scope="col" className="p-3 text-center">{isArMode ? 'المشاريع' : 'Projects'}</th>
                <th scope="col" className="p-3 text-center">{isArMode ? 'حساب بالبوابة' : 'Portal Account'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-400 dark:text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
                        {isArMode ? 'لا توجد بيانات مطابقة لمعايير البحث الحالية' : 'No records match the current criteria'}
                      </p>
                      <p className="text-xs">
                        {isArMode 
                          ? 'جرّب تعديل نص البحث أو تصفير فلتر التصنيفات لعرض كافة الشركاء.' 
                          : 'Try modifying search keywords or resetting filters to display all partners.'}
                      </p>
                      {isFiltered && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95"
                        >
                          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{isArMode ? 'عرض كل الشركاء' : 'Show All Stakeholders'}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                tableRows.map((stk, idx) => (
                  <tr
                    key={stk.id || `stk-${idx}`}
                    className={`transition-colors hover:bg-emerald-50/50 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/25 ${
                      idx % 2 === 1 ? 'bg-slate-50/60 dark:bg-slate-800/40' : 'bg-white dark:bg-slate-900'
                    }`}
                  >
                    <td className="p-3 text-center font-mono text-[11px] text-slate-400">
                      {idx + 1}
                    </td>

                    <th scope="row" className={`p-3 font-black text-slate-900 dark:text-white ${isArMode ? 'text-right' : 'text-left'} font-normal`}>
                      {stk.name_ar || stk.name_en || (isArMode ? 'بدون اسم' : 'Unnamed')}
                    </th>

                    <td className="p-3">
                      <span 
                        className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold border"
                        style={{
                          backgroundColor: `${KIND_COLORS[stk.stakeholder_kind] || '#64748b'}15`,
                          borderColor: `${KIND_COLORS[stk.stakeholder_kind] || '#64748b'}30`,
                          color: KIND_COLORS[stk.stakeholder_kind] || '#64748b',
                        }}
                      >
                        {kindLabels[stk.stakeholder_kind] || stk.stakeholder_kind}
                      </span>
                    </td>

                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {stk.role || '—'}
                    </td>

                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                      {stk.organization_name || (stk.stakeholder_kind === 'employee' ? (isArMode ? 'بي زون التجارية' : 'P.Zone International') : (isArMode ? 'جهات خارجية' : 'External Entities'))}
                    </td>

                    <td className="p-3">
                      {stk.phone ? (
                        <a
                          href={`tel:${stk.phone}`}
                          dir="ltr"
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-sm"
                          title={`${isArMode ? 'اتصال بـ' : 'Call'} ${stk.phone}`}
                          aria-label={`${isArMode ? 'رقم هاتف:' : 'Phone:'} ${stk.phone}`}
                        >
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
                          <span>{stk.phone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">—</span>
                      )}
                    </td>

                    <td className="p-3">
                      {stk.email ? (
                        <a
                          href={`mailto:${stk.email}`}
                          dir="ltr"
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-sm"
                          title={`${isArMode ? 'إرسال بريد إلكتروني إلى' : 'Send email to'} ${stk.email}`}
                          aria-label={`${isArMode ? 'بريد إلكتروني:' : 'Email:'} ${stk.email}`}
                        >
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
                          <span className="truncate max-w-[160px] inline-block">{stk.email}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">—</span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      {(stk.assigned_projects_count ?? 0) > 0 ? (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full font-mono font-bold text-[11px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          {stk.assigned_projects_count}
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-slate-400" title={isArMode ? 'غير مسكن في مشاريع' : 'No assigned projects'}>0</span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      {stk.is_system_user ? (
                        <span 
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-500/30"
                          title={isArMode ? 'حساب مستخدم نشط بالمنظومة' : 'Active system user'}
                        >
                          <Check className="w-3 h-3 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                          <span>{isArMode ? 'نشط' : 'Active'}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
          <div>
            {isArMode ? (
              <>
                عرض <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{tableRows.length}</strong> من إجمالي <strong className="font-mono font-bold">{stakeholders.length}</strong> شريك
              </>
            ) : (
              <>
                Showing <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{tableRows.length}</strong> of <strong className="font-mono font-bold">{stakeholders.length}</strong> partners
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
              <span>{isArMode ? 'فريق عمل داخلي' : 'Internal'} ({metrics.employees})</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
              <span>{isArMode ? 'عملاء وملاك' : 'Clients'} ({metrics.clients})</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-500" aria-hidden="true" />
              <span>{isArMode ? 'مقاولون وموردون' : 'Vendors'} ({metrics.vendors})</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-violet-500" aria-hidden="true" />
              <span>{isArMode ? 'استشاريون وخبراء' : 'Consultants'} ({metrics.consultants})</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── Methodology Note (Per /data-report specification) ── */}
      <footer className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p className="font-bold text-slate-700 dark:text-slate-300">
          {isArMode ? 'منهجية البيانات وقواعد الحوكمة:' : 'Data Methodology & Governance:'}
        </p>
        <p className="leading-relaxed">
          {isArMode 
            ? 'يتم استخراج هذا التقرير مباشرة من قاعدة بيانات سجلات الشركاء والربط بالمشاريع التنفيذية. يُحدث التقرير دورياً وتنعكس التعديلات أو عمليات الاستيراد على كافة مؤشرات المشاريع فورياً مع الحفاظ الكامل على صلاحيات الوصول وسياسات حماية البيانات المشددة.'
            : 'This report is dynamically extracted from stakeholder and project assignment registries, reflecting real-time updates while enforcing strict access control and data protection policies.'}
        </p>
      </footer>

      {/* Universal Stakeholders Custom Report Studio */}
      <UniversalReportModal
        isOpen={isCustomReportModalOpen}
        onClose={() => setIsCustomReportModalOpen(false)}
        data={tableRows}
        columns={stakeholderReportColumns}
        kpis={stakeholderReportKpis}
        defaultTitle={isArMode ? "سجل الشركاء وأصحاب المصلحة المعتمد" : "Approved Stakeholders & Partners Registry"}
        defaultSubtitle={isArMode ? "بي زون التجارية (P.Zone International) — الدليل الإداري الموحد للعملاء والمقاولين والاستشاريين" : "P.Zone International (بي زون التجارية) — Unified Directory for Clients, Contractors & Consultants"}
        defaultDocCode="PZ-STK-REP-01"
        defaultClassification="confidential"
        lang={isArMode ? "ar" : "en"}
      />
    </div>
  );
};

