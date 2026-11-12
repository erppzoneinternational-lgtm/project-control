'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  Printer,
  FileDown,
  SlidersHorizontal,
  Search,
  FolderKanban,
  DollarSign,
  TrendingUp,
  GanttChartSquare,
  BarChart3,
  Receipt,
  FileCheck2,
  HardHat,
  Users,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
  Filter,
  Layers,
  PieChart as PieIcon,
  BarChart2,
  CircleDot,
  CheckCircle2,
  Calendar,
  X,
} from 'lucide-react';
import { ProjectService } from '@/lib/services/project.service';
import { Project } from '@/types';
import {
  MASTER_REPORT_CATALOG,
  REPORT_CATEGORIES,
  ReportDefinition,
  ChartType,
} from '@/lib/reports/reportCatalog';
import { ReportChartsHub } from '@/components/reports/ReportChartsHub';
import { UniversalReportModal } from '@/components/reports/UniversalReportModal';
import {
  generatePrintHtml,
  openPrintWindow,
  exportReportToExcel,
  exportReportToCsv,
  formatCurrency,
} from '@/lib/reports/reportEngine';
import { toast } from 'sonner';

const CHART_TYPE_OPTIONS = [
  { id: 'all', labelAr: 'كافة الرسوم', labelEn: 'All Charts' },
  { id: 'donut', labelAr: 'حلقي مجوف', labelEn: 'Donut' },
  { id: 'pie', labelAr: 'قطاعات دائرية', labelEn: 'Pie' },
  { id: 'bar', labelAr: 'أعمدة بيانية', labelEn: 'Bar' },
  { id: 'horizontal_bar', labelAr: 'أشرطة أفقية', labelEn: 'Horizontal Bar' },
  { id: 'line', labelAr: 'خطي تفاعلي', labelEn: 'Line' },
  { id: 'area', labelAr: 'مساحي متراكم', labelEn: 'Area' },
  { id: 'composed', labelAr: 'مخطط هجين', labelEn: 'Combo' },
  { id: 'radar', labelAr: 'مخطط راداري', labelEn: 'Radar' },
  { id: 'radial', labelAr: 'مخطط شعاعي', labelEn: 'Radial' },
  { id: 'funnel', labelAr: 'مسار قمعي', labelEn: 'Funnel' },
  { id: 'treemap', labelAr: 'خريطة شجرية', labelEn: 'Treemap' },
  { id: 'scatter', labelAr: 'تشتت نقطي', labelEn: 'Scatter' },
];

export default function ReportsMasterHubPage() {
  // 1. Fetch live projects from database
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['portal-master-reports-projects'],
    queryFn: () => ProjectService.getProjects(),
  });

  // 2. Filter & Navigation States
  const [isAr, setIsAr] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedChartTypeFilter, setSelectedChartTypeFilter] = useState<string>('all');
  const [activeReportId, setActiveReportId] = useState<string>('rep-port-01');
  const [activeChartType, setActiveChartType] = useState<ChartType>('all');

  // 3. Studio Modal States
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [studioTargetReport, setStudioTargetReport] = useState<ReportDefinition | null>(null);

  // Active Report Definition
  const activeReport = useMemo(() => {
    return MASTER_REPORT_CATALOG.find((r) => r.id === activeReportId) || MASTER_REPORT_CATALOG[0];
  }, [activeReportId]);

  // Sync active chart type when switching active report (default to all for simultaneous display)
  React.useEffect(() => {
    if (activeReport) {
      setActiveChartType('all');
    }
  }, [activeReport]);

  // 4. Filtered Catalog
  const filteredCatalog = useMemo(() => {
    return MASTER_REPORT_CATALOG.filter((rep) => {
      const matchCat = selectedCategory === 'all' || rep.categoryKey === selectedCategory;
      const matchChart = selectedChartTypeFilter === 'all' || rep.defaultChartType === selectedChartTypeFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        rep.titleAr.toLowerCase().includes(q) ||
        rep.titleEn.toLowerCase().includes(q) ||
        rep.code.toLowerCase().includes(q) ||
        rep.descriptionAr.toLowerCase().includes(q) ||
        rep.categoryAr.toLowerCase().includes(q);
      return matchCat && matchChart && matchSearch;
    });
  }, [selectedCategory, selectedChartTypeFilter, searchQuery]);

  // Filtered dataset for active report
  const activeReportDataset = useMemo(() => {
    if (!activeReport) return projects;
    return activeReport.filterProjects ? activeReport.filterProjects(projects) : projects;
  }, [activeReport, projects]);

  // Dynamic Chart Data for active report
  const activeChartData = useMemo(() => {
    if (!activeReport) return [];
    return activeReport.computeChartData(projects);
  }, [activeReport, projects]);

  // Dynamic KPIs for active report
  const activeKpis = useMemo(() => {
    if (!activeReport) return [];
    return activeReport.computeKpis(projects);
  }, [activeReport, projects]);

  // Quick Export Handlers
  const handleQuickPrint = (report: ReportDefinition) => {
    const data = report.filterProjects ? report.filterProjects(projects) : projects;
    const kpis = report.computeKpis(projects);
    const config = {
      title: isAr ? report.titleAr : report.titleEn,
      subtitle: isAr
        ? `${report.titleAr} — شركة بي زون العالمية للمقاولات`
        : `${report.titleEn} — P.Zone International`,
      reportCode: report.code,
      companyNameAr: 'شركة بي زون التجارية',
      companyNameEn: 'P.Zone International',
      orientation: 'landscape' as const,
      paperSize: 'a4' as const,
      fontSize: 'md' as const,
      includeKpis: true,
      includeSignatures: true,
      includeTimestamp: true,
      includePageNumbers: true,
      selectedColumnIds: report.columns.map((c) => c.id),
      signatures: [
        { id: 'prep', role: isAr ? 'إعداد التقرير' : 'Prepared By', name: '', title: isAr ? 'مهندس التخطيط وضبط المشروعات' : 'Planning Engineer' },
        { id: 'rev', role: isAr ? 'مراجعة وتدقيق' : 'Reviewed By', name: '', title: isAr ? 'مدير المكتب الفني والعقود' : 'Technical Office Manager' },
        { id: 'appr1', role: isAr ? 'اعتماد المشروعات' : 'Approved By', name: '', title: isAr ? 'مدير عام المشروعات' : 'PMO Director' },
        { id: 'appr2', role: isAr ? 'اعتماد الإدارة العليا' : 'Authorized By', name: '', title: isAr ? 'استشاري المالك / الإدارة التنفيذية' : 'Executive Management' },
      ],
    };
    const html = generatePrintHtml(config, report.columns, data, kpis);
    openPrintWindow(html);
    toast.success(
      isAr
        ? `تم إرسال تقرير ${report.code} إلى نافذة الطباعة والمستندات`
        : `Report ${report.code} opened in print preview`
    );
  };

  const handleQuickExcel = (report: ReportDefinition) => {
    const data = report.filterProjects ? report.filterProjects(projects) : projects;
    const kpis = report.computeKpis(projects);
    const config = {
      title: isAr ? report.titleAr : report.titleEn,
      subtitle: isAr ? report.titleAr : report.titleEn,
      reportCode: report.code,
      companyNameAr: 'شركة بي زون التجارية',
      companyNameEn: 'P.Zone International',
      orientation: 'landscape' as const,
      paperSize: 'a4' as const,
      fontSize: 'md' as const,
      includeKpis: true,
      includeSignatures: true,
      includeTimestamp: true,
      includePageNumbers: true,
      selectedColumnIds: report.columns.map((c) => c.id),
      signatures: [],
    };
    exportReportToExcel(config, report.columns, data, kpis);
    toast.success(
      isAr
        ? `تم تصدير ملف إكسل لتقرير ${report.code} بنجاح`
        : `Excel sheet exported for report ${report.code}`
    );
  };

  const handleOpenStudio = (report: ReportDefinition) => {
    setStudioTargetReport(report);
    setIsStudioOpen(true);
  };

  // Helper icons for categories
  const getCategoryIcon = (key: string) => {
    switch (key) {
      case 'portfolio': return FolderKanban;
      case 'financial': return DollarSign;
      case 'vos': return TrendingUp;
      case 'schedule': return GanttChartSquare;
      case 'cost_control': return BarChart3;
      case 'cash_flow': return Receipt;
      case 'technical_office': return FileCheck2;
      case 'site_operations': return HardHat;
      case 'stakeholders': return Users;
      case 'retention_bonds': return ShieldAlert;
      default: return Layers;
    }
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-slate-50/70 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 ${
        isAr ? 'dir-rtl text-right font-sans' : 'dir-ltr text-left font-sans'
      }`}
    >
      {/* ── Executive Header Banner (Light mode aligned & Dark mode enabled) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-teal-950 dark:to-slate-900 text-slate-900 dark:text-white p-6 sm:p-8 border border-slate-200 dark:border-teal-500/20 shadow-sm dark:shadow-xl transition-colors">
        <div className={`absolute top-0 ${isAr ? 'right-0' : 'left-0'} w-96 h-96 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none`} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-0.5 rounded-full bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-xs font-semibold border border-teal-200 dark:border-teal-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                {isAr ? 'منظومة التقارير المؤسسية • الإصدار الثالث' : 'Enterprise Reports Engine • v3.0'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'حوكمة تقارير المقاولات وإدارة محفظة المشروعات' : 'Contract governance and project portfolio intelligence'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isAr
                ? `مركز التقارير ولوحات التحكم الذكية (${MASTER_REPORT_CATALOG.length} تقريراً)`
                : `Reports & Analytics Master Hub (${MASTER_REPORT_CATALOG.length} Reports)`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl mt-1.5 leading-relaxed">
              {isAr
                ? 'منظومة متكاملة وشاملة تضم أكثر من 110 تقرير ولوحة تحكم تفاعلية تغطي كافة الأبعاد التعاقدية، حصر وتسعير جداول الكميات، الجداول الزمنية المعتمدة، أوامر التغيير، ضبط وتأكيد الجودة، ومحجوزات الضمان مع إمكانية التصدير والطباعة الفورية.'
                : 'Integrated enterprise system featuring over 110 dynamic reports and dashboards covering contract terms, BOQ pricing, Primavera P6 schedules, variation orders, QA/QC, and retention guarantees with instant PDF/Excel/CSV exports.'}
            </p>
          </div>

          {/* Quick HUD Metrics & Language Switcher */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsAr((prev) => !prev)}
              className="px-3.5 py-2 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 shadow-xs"
              title={isAr ? 'التبديل إلى اللغة الإنجليزية' : 'Switch to Arabic'}
            >
              {isAr ? 'English' : 'عربي'}
            </button>
            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl px-4 py-2.5 text-center min-w-[110px]">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                {isAr ? 'إجمالي التقارير' : 'Total Reports'}
              </div>
              <div className="text-xl font-mono font-extrabold text-teal-600 dark:text-teal-400 mt-0.5">
                {MASTER_REPORT_CATALOG.length}
              </div>
              <div className="text-[9px] text-slate-400 dark:text-slate-500">
                {isAr ? `${REPORT_CATEGORIES.length} مجالات تشغيلية` : `${REPORT_CATEGORIES.length} Operational Fields`}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl px-4 py-2.5 text-center min-w-[110px]">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                {isAr ? 'المشروعات في قاعدة البيانات' : 'Database Projects'}
              </div>
              <div className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {projects.length}
              </div>
              <div className="text-[9px] text-slate-400 dark:text-slate-500">
                {isAr ? 'بيانات حية مباشرة' : 'Live Data Stream'}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl px-4 py-2.5 text-center min-w-[130px]">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                {isAr ? 'إجمالي قيمة المحفظة' : 'Portfolio Value'}
              </div>
              <div className="text-sm font-mono font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {formatCurrency(projects.reduce((s, p) => s + (Number(p.total_contract_value || (Number(p.contract_value || 0) + Number(p.vos_value || 0))) || 0), 0))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Active Interactive Workspace (Dashboard & Live Charts) ── */}
      {activeReport && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-md p-5 sm:p-6 space-y-6">
          {/* Active Report Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                {React.createElement(getCategoryIcon(activeReport.categoryKey), { className: 'w-6 h-6' })}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-slate-900 text-teal-300 dark:bg-slate-800">
                    {activeReport.code}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    {isAr ? activeReport.categoryAr : activeReport.categoryKey}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {isAr ? activeReport.titleAr : activeReport.titleEn}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr ? activeReport.descriptionAr : activeReport.titleEn}
                </p>
              </div>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickPrint(activeReport)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border dark:border-slate-700 text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-95"
                title={isAr ? 'طباعة مستند رسمي مكرر الترويسة' : 'Print official document'}
              >
                <Printer className="w-4 h-4 text-teal-400" />
                <span>{isAr ? 'معاينة وطباعة المستند' : 'Print / Preview PDF'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickExcel(activeReport)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95"
                title={isAr ? 'تصدير جدول البيانات' : 'Export Excel workbook'}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>{isAr ? 'تصدير جدول البيانات' : 'Export Excel (.xlsx)'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenStudio(activeReport)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-teal-500/40 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 flex items-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-95"
                title={isAr ? 'تخصيص الأعمدة والترويسة والتوقيعات' : 'Customize columns, header, and signatures'}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>{isAr ? 'استوديو التخصيص' : 'Customization Studio'}</span>
              </button>
            </div>
          </div>

          {/* KPI HUD Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {activeKpis.map((kpi) => (
              <div
                key={kpi.id}
                className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50"
              >
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                  {kpi.label}
                </div>
                <div className="text-base sm:text-lg font-mono font-extrabold text-slate-900 dark:text-white mt-1">
                  {kpi.value}
                </div>
                {kpi.subtext && (
                  <div className="text-[10px] text-teal-600 dark:text-teal-400 font-medium mt-0.5 truncate">
                    {kpi.subtext}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Interactive Chart Visualizer */}
          <ReportChartsHub
            data={activeChartData}
            chartType={activeChartType}
            onChartTypeChange={setActiveChartType}
            title={isAr ? activeReport.chartTitleAr : activeReport.chartTitleEn}
            subtitle={isAr ? activeReport.descriptionAr : activeReport.chartTitleEn}
          />

          {/* Active Report Data Table Preview */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isAr ? 'بيانات التقرير المباشرة' : 'Live Report Records'}</span>
                <span className="text-xs font-mono font-normal text-slate-500 dark:text-slate-400">
                  ({activeReportDataset.length} {isAr ? 'سجل مطابق' : 'matching records'})
                </span>
              </h3>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
              <div className="max-h-72 overflow-y-auto overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900 dark:bg-slate-950 text-white sticky top-0 z-10 font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 text-center">{isAr ? 'م' : '#'}</th>
                      <th className="py-2.5 px-3 text-center">{isAr ? 'كود المشروع' : 'Project Code'}</th>
                      <th className="py-2.5 px-3">{isAr ? 'اسم المشروع' : 'Project Name'}</th>
                      <th className="py-2.5 px-3">{isAr ? 'العميل' : 'Client'}</th>
                      <th className="py-2.5 px-3">{isAr ? 'مدير المشروع' : 'Project Manager'}</th>
                      <th className="py-2.5 px-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="py-2.5 px-3 text-end font-mono">{isAr ? 'قيمة العقد' : 'Contract Value'}</th>
                      <th className="py-2.5 px-3 text-end font-mono">{isAr ? 'أوامر التغيير' : 'VO Value'}</th>
                      <th className="py-2.5 px-3 text-end font-mono text-emerald-400">{isAr ? 'إجمالي القيمة' : 'Total Value'}</th>
                      <th className="py-2.5 px-3 text-center font-mono">{isAr ? 'نسبة الإنجاز' : 'Progress'}</th>
                      <th className="py-2.5 px-3 text-center">{isAr ? 'الوثيقة الأصلية' : 'Hardcopy'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {activeReportDataset.slice(0, 10).map((p, idx) => (
                      <tr key={p.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2 px-3 text-center font-mono text-slate-400 dark:text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-teal-600 dark:text-teal-400">
                          #{p.project_code || '—'}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">
                          {p.project_name}
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400 max-w-[140px] truncate">
                          {p.client_name_raw || '—'}
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400 max-w-[130px] truncate">
                          {p.pm_full_name || p.project_manager_name_raw || '—'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {p.status || '—'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-end font-mono text-slate-700 dark:text-slate-300">
                          {formatCurrency(p.contract_value)}
                        </td>
                        <td className="py-2 px-3 text-end font-mono text-amber-600 dark:text-amber-400 font-semibold">
                          {formatCurrency(p.vos_value)}
                        </td>
                        <td className="py-2 px-3 text-end font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {formatCurrency(p.total_contract_value || (Number(p.contract_value || 0) + Number(p.vos_value || 0)))}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                          {p.completion_pct || (p as any).actual_completion_pct || 0}%
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                            {(p as any).hardcopy_status || (isAr ? 'أصل بالشركة' : 'On File')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
                {isAr
                  ? `عرض أول 10 سجلات من أصل ${activeReportDataset.length} سجلاً في هذا التقرير • استخدم "معاينة وطباعة المستند" أو "تصدير جدول البيانات" للحصول على السجل الكامل`
                  : `Showing 10 of ${activeReportDataset.length} records in this report • Use "Print / Preview PDF" or "Export Excel" for full dataset`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Search, Filters & Catalog Explorer (100+ Reports) ── */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className={`w-4 h-4 absolute ${isAr ? 'right-3.5' : 'left-3.5'} top-3 text-slate-400 dark:text-slate-500 pointer-events-none`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث في أكثر من 100 تقرير ولوحة تحكم بالكود، الاسم أو الوصف...' : 'Search 100+ reports and dashboards by code, title, or description...'}
              className={`w-full ${isAr ? 'pr-10 pl-9' : 'pl-10 pr-9'} py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 cursor-text focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-teal-500 transition-all`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`absolute ${isAr ? 'left-2.5' : 'right-2.5'} top-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 transition-all`}
                title={isAr ? 'مسح البحث' : 'Clear search'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Chart Type Filter */}
          <div className="flex flex-wrap items-center gap-1.5 self-stretch md:self-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap ml-1">
              {isAr ? 'نوع الرسم:' : 'Chart Type:'}
            </span>
            {CHART_TYPE_OPTIONS.map((ct) => (
              <button
                key={ct.id}
                type="button"
                onClick={() => setSelectedChartTypeFilter(ct.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-95 ${
                  selectedChartTypeFilter === ct.id
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {isAr ? ct.labelAr : ct.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Tab Bar */}
        <div className="flex flex-wrap items-center gap-2 pb-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-95 select-none ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white dark:bg-teal-600 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isAr ? `كافة المجالات (${MASTER_REPORT_CATALOG.length})` : `All Categories (${MASTER_REPORT_CATALOG.length})`}</span>
          </button>

          {REPORT_CATEGORIES.map((cat) => {
            const Icon = getCategoryIcon(cat.key);
            const isSel = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-95 select-none ${
                  isSel
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{isAr ? cat.labelAr : (cat.labelEn || cat.key)}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${isSel ? 'bg-teal-800 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                  {cat.reportCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Catalog Cards Grid (106 Reports) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCatalog.map((report) => {
            const isActive = report.id === activeReportId;
            const Icon = getCategoryIcon(report.categoryKey);

            return (
              <div
                key={report.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveReportId(report.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveReportId(report.id);
                  }
                }}
                className={`group p-4 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                  isActive
                    ? 'bg-teal-50/50 dark:bg-teal-950/20 border-teal-500/80 shadow-md ring-1 ring-teal-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-md bg-slate-900 text-teal-400 dark:bg-slate-800">
                      {report.code}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Icon className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                      {isAr ? report.categoryAr : report.categoryKey}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {isAr ? report.titleAr : report.titleEn}
                  </h3>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 font-sans mt-0.5">
                    {isAr ? report.titleEn : report.titleAr}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {isAr ? report.descriptionAr : report.titleEn}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveReportId(report.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-95 ${
                      isActive
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 hover:text-teal-700 dark:hover:text-teal-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>
                      {isActive
                        ? (isAr ? 'التقرير التفاعلي النشط' : 'Active Dashboard')
                        : (isAr ? 'عرض التقرير التفاعلي' : 'View Dashboard')}
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickPrint(report);
                      }}
                      title={isAr ? 'طباعة ومعاينة التقرير' : 'Print / Preview PDF'}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-95"
                    >
                      <Printer className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickExcel(report);
                      }}
                      title={isAr ? 'تصدير جدول البيانات' : 'Export Excel (.xlsx)'}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenStudio(report);
                      }}
                      title={isAr ? 'تخصيص التقرير في الاستوديو' : 'Customize in Studio'}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-95"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Universal Customization Studio Modal ── */}
      {studioTargetReport && (
        <UniversalReportModal<Project>
          isOpen={isStudioOpen}
          onClose={() => setIsStudioOpen(false)}
          defaultTitle={isAr ? studioTargetReport.titleAr : studioTargetReport.titleEn}
          defaultSubtitle={isAr ? studioTargetReport.titleAr : studioTargetReport.titleEn}
          defaultDocCode={studioTargetReport.code}
          columns={studioTargetReport.columns}
          data={studioTargetReport.filterProjects ? studioTargetReport.filterProjects(projects) : projects}
          kpis={studioTargetReport.computeKpis(projects)}
        />
      )}
    </div>
  );
}
