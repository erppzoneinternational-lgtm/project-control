'use client';

import React, { useState, useMemo } from 'react';
import { Project, Client, Governorate } from '@/types';
import { ExecutiveFilterBar, DashboardFilterState } from './sections/ExecutiveFilterBar';
import { ExecutiveKPICards } from './sections/ExecutiveKPICards';
import { ExecutiveInsightsSection } from './sections/ExecutiveInsightsSection';
import { ClientAnalyticsSection } from './sections/ClientAnalyticsSection';
import { AquaticEngineeringSection } from './sections/AquaticEngineeringSection';
import { SuggestedActionsAndRisks } from './sections/SuggestedActionsAndRisks';
import { PortfolioProgressWidget } from './sections/PortfolioProgressWidget';
import { StatusDistributionChart } from './sections/StatusDistributionChart';
import { ProjectCompletionEditor } from './sections/ProjectCompletionEditor';
import { getProjectValueWithVat } from '@/lib/utils/projectValue';
import { matchesRegionFilter } from '@/lib/geo/regionMatcher';
import dynamic from 'next/dynamic';
import { LocationAnalyticsMapSkeleton } from './DashboardSkeletons';

// Dynamic import for Map (Leaflet requires browser window)
const LocationAnalyticsMap = dynamic(
  () => import('./sections/LocationAnalyticsMap').then((mod) => mod.LocationAnalyticsMap),
  { 
    ssr: false,
    loading: () => <LocationAnalyticsMapSkeleton />
  }
);
import { 
  BarChart3, 
  Award,
  MapPin,
  Printer,
  Plus,
  FileSpreadsheet,
  LayoutGrid,
  Table as TableIcon,
  Shield,
  RotateCcw,
  FilterX
} from 'lucide-react';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { isFocusedProjectsMode } from '@/lib/config/module-visibility';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import Link from 'next/link';

interface ProjectsAnalyticsDashboardProps {
  projects: Project[];
  clientsList?: Client[];
  governoratesList?: Governorate[];
  lang?: 'ar' | 'en';
  initialViewTab?: 'executive' | 'operational';
}

const STATUS_COLORS: Record<string, { bg: string; fill: string; border: string; label: string }> = {
  finished: { bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', fill: '#10B981', border: 'border-emerald-500/20', label: 'منتهي (Finished)' },
  working: { bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', fill: '#3B82F6', border: 'border-blue-500/20', label: 'قيد التنفيذ (Working)' },
  handing_over: { bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', fill: '#6366F1', border: 'border-emerald-500/20', label: 'تسليم ابتدائي (Handing)' },
  on_hold: { bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', fill: '#F59E0B', border: 'border-amber-500/20', label: 'متوقف (On Hold)' },
  cancelled: { bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', fill: '#F43F5E', border: 'border-rose-500/20', label: 'ملغي (Cancelled)' },
};

export const ProjectsAnalyticsDashboard: React.FC<ProjectsAnalyticsDashboardProps> = ({
  projects: projectsProp,
  clientsList = [],
  governoratesList = [],
  lang = 'ar',
  initialViewTab = 'executive',
}) => {
  const isAr = lang === 'ar';
  // Manual completion% edits applied locally so KPIs refresh instantly
  const [pctOverrides, setPctOverrides] = useState<Record<string, number>>({});
  const { roles, isAdmin } = useUserRoles();
  const isSystemAdmin = isAdmin || (roles && roles.some((r) => ['admin', 'ceo', 'coo', 'chairman', 'coo_assistant'].includes(r)));

  const projects = useMemo(
    () =>
      projectsProp.map((p) =>
        pctOverrides[p.id] !== undefined ? { ...p, completion_pct: pctOverrides[p.id] } : p,
      ),
    [projectsProp, pctOverrides],
  );

  // Dashboard Tab Mode: 'executive' (Compact Executive view) vs 'operational' (Detailed Charts & Hydro Analytics)
  const [viewTab, setViewTab] = useState<'executive' | 'operational'>(initialViewTab);

  // Accessible Data Table view toggles for charts
  const [showAreaTable, setShowAreaTable] = useState(false);
  const [showPmTable, setShowPmTable] = useState(false);

  // Master Filter State
  const [filters, setFilters] = useState<DashboardFilterState>({
    selectedStatus: 'all',
    selectedRegion: 'all',
    selectedClientId: 'all',
    selectedPzoneRole: 'all',
    selectedPmId: 'all',
    selectedWaterScope: 'all',
    searchQuery: '',
    minContractValue: undefined,
    maxContractValue: undefined,
  });

  const handleFilterChange = (newFilters: Partial<DashboardFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      selectedStatus: 'all',
      selectedRegion: 'all',
      selectedClientId: 'all',
      selectedPzoneRole: 'all',
      selectedPmId: 'all',
      selectedWaterScope: 'all',
      searchQuery: '',
      minContractValue: undefined,
      maxContractValue: undefined,
    });
  };

  // Projects filtered by all dimensions EXCEPT region
  // (Prevents circular 0-count collapse on map badges and region switches)
  const projectsExceptRegion = useMemo(() => {
    return projects.filter((p) => {
      // 1. Status Filter
      if (filters.selectedStatus !== 'all' && p.status !== filters.selectedStatus) return false;

      // 2. Client Filter
      if (filters.selectedClientId !== 'all') {
        if (p.client_id !== filters.selectedClientId) return false;
      }

      // 3. Role Filter
      if (filters.selectedPzoneRole !== 'all') {
        if (p.pzone_role !== filters.selectedPzoneRole) return false;
      }

      // 4. PM Filter
      if (filters.selectedPmId && filters.selectedPmId !== 'all') {
        const pmName = p.pm_full_name || p.project_manager_name_raw || p.project_manager || '';
        if (!pmName.includes(filters.selectedPmId)) return false;
      }

      // 5. Search Query
      if (filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase();
        const code = (p.project_code || '').toLowerCase();
        const name = (p.project_name || '').toLowerCase();
        const client = (p.client_name_raw || p.client?.name_ar || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !client.includes(q)) return false;
      }

      // 6. Value Range
      const val = getProjectValueWithVat(p);
      if (filters.minContractValue !== undefined && val < filters.minContractValue) return false;
      if (filters.maxContractValue !== undefined && val > filters.maxContractValue) return false;

      return true;
    });
  }, [
    projects,
    filters.selectedStatus,
    filters.selectedClientId,
    filters.selectedPzoneRole,
    filters.selectedPmId,
    filters.searchQuery,
    filters.minContractValue,
    filters.maxContractValue,
  ]);

  // Master Filtered Projects Dataset (applies robust region matching)
  const filteredProjects = useMemo(() => {
    if (filters.selectedRegion === 'all') return projectsExceptRegion;
    return projectsExceptRegion.filter((p) => matchesRegionFilter(p, filters.selectedRegion));
  }, [projectsExceptRegion, filters.selectedRegion]);

  // Format large numbers for Y-axis labels
  const formatAxisValue = (val: number) => {
    if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(0)}M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(0)}K`;
    return `${val}`;
  };

  // Format full currency string in EGP
  const formatCurrency = (val: number) => {
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)} مليار ج.م`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)} مليون ج.م`;
    return `${new Intl.NumberFormat('en-US').format(val)} ج.م`;
  };

  // Aggregate Data for Regional Distribution
  const areaData = useMemo(() => {
    const counts: Record<string, { count: number; totalValue: number }> = {};
    filteredProjects.forEach((p) => {
      // Use Arabic name only — never fall back to UUID
      const govName = p.governorate?.name_ar || 'غير محدد';
      if (!counts[govName]) counts[govName] = { count: 0, totalValue: 0 };
      counts[govName].count += 1;
      counts[govName].totalValue += Number(p.total_value_with_vat_egp || p.contract_value_egp || p.contract_value || 0);
    });

    return Object.entries(counts)
      .map(([name, data]) => ({ 
        name: name.length > 14 ? name.slice(0, 12) + '…' : name, 
        fullName: name,
        count: data.count, 
        totalValue: data.totalValue 
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10); // Top 10 regions max
  }, [filteredProjects]);

  // Aggregate Data for PM Distribution
  const pmData = useMemo(() => {
    const counts: Record<string, { count: number; totalValue: number }> = {};
    filteredProjects.forEach((p) => {
      const pmName = p.pm_full_name || p.project_manager_name_raw || p.project_manager || 'غير محدد';
      if (!counts[pmName]) counts[pmName] = { count: 0, totalValue: 0 };
      counts[pmName].count += 1;
      counts[pmName].totalValue += Number(p.total_value_with_vat_egp || p.contract_value_egp || p.contract_value || 0);
    });

    return Object.entries(counts)
      .map(([name, data]) => ({ 
        name: name.length > 14 ? name.slice(0, 12) + '…' : name, 
        fullName: name,
        count: data.count, 
        totalValue: data.totalValue 
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10); // Top 10 PMs max
  }, [filteredProjects]);

  // Dynamic list of available governorates / regions
  const availableRegions = useMemo(() => {
    const regionSet = new Set<string>();
    governoratesList.forEach((g) => {
      if (g.name_ar) regionSet.add(g.name_ar);
    });
    projects.forEach((p) => {
      const govName = p.governorate?.name_ar;
      if (govName) regionSet.add(govName);

      const addr = p.site_location_address || '';
      if (addr.includes('الساحل')) regionSet.add('الساحل الشمالي');
      if (addr.includes('الجونة') || addr.includes('الغردقة') || addr.includes('البحر الأحمر')) regionSet.add('البحر الأحمر');
      if (addr.includes('السخنة')) regionSet.add('العين السخنة');
      if (addr.includes('شرم') || addr.includes('سيناء')) regionSet.add('جنوب سيناء');
      if (addr.includes('الأقصر')) regionSet.add('الأقصر');
      if (addr.includes('أسوان')) regionSet.add('أسوان');
      if (addr.includes('القاهرة') || addr.includes('التجمع') || addr.includes('العاصمة')) regionSet.add('القاهرة الكبرى');
      if (addr.includes('أكتوبر') || addr.includes('زايد') || addr.includes('الجيزة')) regionSet.add('الجيزة و 6 أكتوبر');
      if (addr.includes('الإسكندرية')) regionSet.add('الإسكندرية');
    });

    return Array.from(regionSet).sort();
  }, [projects, governoratesList]);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-start font-sans" dir="rtl">
      {/* ═══ Official Executive Print Report Header (Visible only on print/PDF) ═══ */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-stone-800 pb-4 mb-4" dir="rtl">
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
              لوحة المؤشرات والتحليلات التنفيذية لمحفظة المشاريع (Portfolio Executive Analytics)
            </p>
          </div>
        </div>
        <div className="text-left text-[10px] text-stone-700 space-y-0.5" dir="ltr">
          <p><strong>Total Projects:</strong> {projects.length}</p>
          <p><strong>Active Filtered:</strong> {filteredProjects.length}</p>
          <p><strong>Printed Date:</strong> <bdi>{new Date().toLocaleDateString('en-GB')}</bdi></p>
          <p className="font-mono text-[9px] text-stone-500">P.ZONE ERP • CONFIDENTIAL</p>
        </div>
      </div>

      {/* Top Bar Controls & Executive View Switcher Tabs */}
      <nav
        aria-label="أدوات ولوحة تحكم اللوحة التنفيذية"
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-slate-950/40 backdrop-blur-xl transition-colors print:hidden"
      >
        {/* Tab Switcher */}
        <div
          role="tablist"
          aria-label="خيارات عرض لوحة المعلومات"
          className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-950/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80"
        >
          <button
            type="button"
            role="tab"
            id="tab-executive"
            aria-selected={viewTab === 'executive'}
            aria-controls="panel-executive"
            tabIndex={viewTab === 'executive' ? 0 : -1}
            onClick={() => setViewTab('executive')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
              viewTab === 'executive'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <LayoutGrid className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>النظرة التنفيذية الإدارية (Executive View)</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-operational"
            aria-selected={viewTab === 'operational'}
            aria-controls="panel-operational"
            tabIndex={viewTab === 'operational' ? 0 : -1}
            onClick={() => setViewTab('operational')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
              viewTab === 'operational'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>التحليلات الهندسية والتشغيل (Operational Analytics)</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap" role="toolbar" aria-label="إجراءات لوحة المشاريع">
          <button
            type="button"
            onClick={handlePrintReport}
            className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-2 text-xs font-bold border border-slate-200/80 dark:border-slate-700/80 shadow-xs cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            aria-label="طباعة التقرير التنفيذي للوحة المشاريع"
            title="طباعة التقرير التنفيذي"
          >
            <Printer className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">طباعة</span>
          </button>

          {!isFocusedProjectsMode() && (
            <Link
              href="/projects/import"
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-2 text-xs font-bold border border-slate-200/80 dark:border-slate-700/80 shadow-xs active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
              aria-label="استيراد وتحديث المشاريع من ملف Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">استيراد Excel</span>
            </Link>
          )}

          <Link
            href="/projects/new"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs shadow-sm shadow-emerald-500/20 transition-all flex items-center gap-2 active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            aria-label="إضافة مشروع إنشائي جديد"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>مشروع جديد</span>
          </Link>

          {isSystemAdmin && !isFocusedProjectsMode() && (
            <Link
              href="/system-admin"
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 transition-all flex items-center gap-2 text-xs font-bold border border-amber-300/80 dark:border-amber-700/80 shadow-xs active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
              aria-label="الانتقال إلى لوحة تحكم إدارة النظام"
              title="لوحة تحكم إدارة النظام (System Admin)"
            >
              <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">إدارة النظام</span>
            </Link>
          )}
        </div>
      </nav>

      {/* ===== GLOBAL DYNAMIC EXECUTIVE FILTER BAR ===== */}
      <div className="print:hidden">
        <ExecutiveFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={resetFilters}
          totalFilteredCount={filteredProjects.length}
          totalProjectsCount={projects.length}
          availableRegions={availableRegions}
          clientsList={clientsList}
          governoratesList={governoratesList}
        />
      </div>

      {/* ===== ZERO RESULTS ALERT BANNER ===== */}
      {filteredProjects.length === 0 && (
        <div
          role="alert"
          aria-live="polite"
          className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
              <FilterX className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base">لا توجد مشاريع مطابقة لمعايير التصفية الحالية</h4>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                لم يتم العثور على أية نتائج تطابق معايير البحث والتصفية المختارة. يمكنك إعادة ضبط الفلاتر أو إنشاء مشروع جديد.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={resetFilters}
              aria-label="إعادة ضبط الفلاتر لعرض كافة المشاريع"
              className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>إعادة ضبط الفلاتر</span>
            </button>
            <Link
              href="/projects/new"
              aria-label="إضافة مشروع جديد"
              className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>مشروع جديد</span>
            </Link>
          </div>
        </div>
      )}

      {/* ===== EXECUTIVE TOP KPI CARDS ===== */}
      <ExecutiveKPICards
        filteredProjects={filteredProjects}
        totalProjectsCount={projects.length}
        activeStatus={filters.selectedStatus}
        onStatusCardClick={(status) => handleFilterChange({ selectedStatus: status })}
      />

      {/* ===== PORTFOLIO PROGRESS & STATUS DISTRIBUTION WIDGET ===== */}
      <PortfolioProgressWidget
        projects={filteredProjects}
        totalProjectsCount={projects.length}
        activeStatus={filters.selectedStatus}
        onStatusSelect={(status) => handleFilterChange({ selectedStatus: status })}
        onResetFilters={resetFilters}
        lang={lang}
      />

      <div className="print:hidden">
        <ProjectCompletionEditor
          projects={filteredProjects}
          onUpdated={(id, pct) => setPctOverrides((o) => ({ ...o, [id]: pct }))}
        />
      </div>

      {/* ===== TAB 1: EXECUTIVE VIEW (COMPACT FOR CEOS) ===== */}
      {viewTab === 'executive' ? (
        <div
          role="tabpanel"
          id="panel-executive"
          aria-labelledby="tab-executive"
          tabIndex={0}
          className="space-y-6 focus-visible:outline-none"
        >
          {/* AI Decision Support Engine & Top Operational Risks Matrix */}
          <SuggestedActionsAndRisks
            projects={filteredProjects}
            onProjectSelect={(id) => (window.location.href = `/projects/${id}`)}
            lang={lang}
          />

          {/* AI Executive Insights & Regional Risk Ticker */}
          <ExecutiveInsightsSection 
            projects={filteredProjects} 
            lang={lang} 
          />

          {/* GIS Location Analytics Map & Project Quick Inspector Panel */}
          <LocationAnalyticsMap 
            projects={filteredProjects} 
            allProjects={projectsExceptRegion}
            selectedRegion={filters.selectedRegion}
            selectedStatus={filters.selectedStatus}
            onRegionClick={(reg) => handleFilterChange({ selectedRegion: reg })} 
            onStatusClick={(st) => handleFilterChange({ selectedStatus: st })}
            lang={lang} 
          />

          {/* Top 10 Clients Portfolio Concentration Section */}
          <ClientAnalyticsSection
            projects={filteredProjects}
            clientsList={clientsList}
            onClientSelect={(clientId) => handleFilterChange({ selectedClientId: clientId })}
            onResetFilters={resetFilters}
            lang={lang}
          />
        </div>
      ) : (
        /* ===== TAB 2: DETAILED OPERATIONAL ANALYTICS ===== */
        <div
          role="tabpanel"
          id="panel-operational"
          aria-labelledby="tab-operational"
          tabIndex={0}
          className="space-y-6 focus-visible:outline-none"
        >
          {/* Aquatic Engineering Hydro-Metrics ($m² / $m³ breakdown) */}
          <AquaticEngineeringSection
            projects={filteredProjects}
            onResetFilters={resetFilters}
            lang={lang}
          />

          {/* Operational Status Distribution & Financial Allocation */}
          <div className="w-full">
            <StatusDistributionChart
              projects={filteredProjects}
              activeStatus={filters.selectedStatus}
              onStatusSelect={(status) => handleFilterChange({ selectedStatus: status })}
              onResetFilters={resetFilters}
              lang={lang}
            />
          </div>

          {/* Row 2: Regional Distribution & PM Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Regional Area Breakdown */}
            <section
              aria-labelledby="area-chart-title"
              className="lg:col-span-6 min-w-0 rounded-2xl bg-white/95 dark:bg-slate-900/90 p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-slate-950/40 backdrop-blur-xl space-y-4 hover:border-slate-300 dark:hover:border-slate-700/80 transition-colors flex flex-col justify-between"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 id="area-chart-title" className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                      <span>{isAr ? 'توزيع عقود المشاريع حسب المنطقة' : 'Project Contracts by Region'}</span>
                      <bdi className="text-xs font-mono font-medium text-slate-400 dark:text-slate-500">
                        (Per Area)
                      </bdi>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      قيم العقود الإجمالية بالجنيه المصري لكل منطقة مفلترة
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {/* Legend indicator in RTL */}
                  <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60" aria-hidden="true">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>قيمة العقود (مليون ج.م)</span>
                  </div>

                  {/* Accessible Data Table Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowAreaTable(!showAreaTable)}
                    aria-expanded={showAreaTable}
                    aria-controls="area-data-view"
                    aria-label={showAreaTable ? "العودة للرسم البياني للمناطق" : "عرض بيانات المناطق كجدول نصي ميسّر"}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                    title={showAreaTable ? "عرض الرسم البياني" : "عرض جدول البيانات"}
                  >
                    {showAreaTable ? (
                      <>
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                        <span>رسم بياني</span>
                      </>
                    ) : (
                      <>
                        <TableIcon className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                        <span>جدول البيانات</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Chart or Accessible Data Table View */}
              <div id="area-data-view" className="w-full min-w-0 flex-1">
                {showAreaTable ? (
                  <div className="h-80 overflow-y-auto rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-2">
                    <table className="w-full text-xs text-start" aria-label="بيانات توزيع عقود المشاريع حسب المنطقة">
                      <caption className="sr-only">جدول قيم وعدد مشاريع كل منطقة مفلترة</caption>
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                          <th scope="col" className="p-2 text-start">المنطقة</th>
                          <th scope="col" className="p-2 text-center">عدد المشاريع</th>
                          <th scope="col" className="p-2 text-end">إجمالي القيمة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                        {areaData.map((row) => (
                          <tr key={row.fullName} className="hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                            <td className="p-2 text-slate-900 dark:text-slate-100 font-bold">{row.fullName}</td>
                            <td className="p-2 text-center font-mono text-slate-600 dark:text-slate-400">{row.count}</td>
                            <td className="p-2 text-end font-mono font-bold text-emerald-600 dark:text-emerald-400"><bdi>{formatCurrency(row.totalValue)}</bdi></td>
                          </tr>
                        ))}
                        {areaData.length === 0 && (
                          <tr>
                            <td colSpan={3} className="p-6 text-center text-slate-500 dark:text-slate-400">
                              <div className="flex flex-col items-center justify-center gap-3">
                                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">لا توجد بيانات متاحة للمناطق</p>
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none cursor-pointer"
                                    aria-label="إعادة ضبط الفلاتر لعرض بيانات المناطق"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>إعادة ضبط الفلاتر</span>
                                  </button>
                                  <Link
                                    href="/projects/new"
                                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
                                    aria-label="إضافة مشروع جديد"
                                  >
                                    <Plus className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                                    <span>مشروع جديد</span>
                                  </Link>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <>
                    {/* Screen-reader accessible alternative table */}
                    <div className="sr-only">
                      <table aria-label="بيانات توزيع عقود المشاريع حسب المنطقة للمساعدات الصوتية">
                        <caption>جدول بيانات المناطق وقيم العقود</caption>
                        <thead>
                          <tr>
                            <th scope="col">المنطقة</th>
                            <th scope="col">عدد المشاريع</th>
                            <th scope="col">إجمالي القيمة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {areaData.map((row) => (
                            <tr key={row.fullName}>
                              <td>{row.fullName}</td>
                              <td>{row.count}</td>
                              <td><bdi>{formatCurrency(row.totalValue)}</bdi></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {areaData.length === 0 ? (
                      <div
                        className="h-72 sm:h-80 w-full flex flex-col items-center justify-center p-6 text-center rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800"
                        role="region"
                        aria-label="حالة عدم وجود بيانات لمناطق المشاريع"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                          <MapPin className="w-6 h-6" aria-hidden="true" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                          لا توجد بيانات متاحة للمناطق
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                          لم يتم تسجيل أية مشاريع للمنطقة المختارة أو لم تطابق المشاريع معايير التصفية الحالية.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={resetFilters}
                            className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none cursor-pointer"
                            aria-label="إعادة ضبط الفلاتر لعرض توزيع المناطق"
                          >
                            <RotateCcw className="w-4 h-4" aria-hidden="true" />
                            <span>إعادة ضبط الفلاتر</span>
                          </button>
                          <Link
                            href="/projects/new"
                            className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
                            aria-label="إضافة مشروع جديد"
                          >
                            <Plus className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                            <span>مشروع جديد</span>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="h-72 sm:h-80 w-full min-w-0 overflow-hidden" role="img" aria-label="رسم بياني شريطي لتوزيع عقود المشاريع حسب المنطقة" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260} debounce={50}>
                          <BarChart data={areaData} margin={{ top: 15, right: 15, left: 10, bottom: 45 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                            <XAxis
                              dataKey="name"
                              stroke="#64748B"
                              fontSize={11}
                              tick={{ fill: '#94A3B8' }}
                              interval={0}
                              angle={-25}
                              textAnchor="end"
                              dy={8}
                            />
                            <YAxis
                              stroke="#64748B"
                              fontSize={11}
                              tick={{ fill: '#94A3B8' }}
                              width={50}
                              tickFormatter={formatAxisValue}
                            />
                            <Tooltip
                              allowEscapeViewBox={{ x: false, y: false }}
                              wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }}
                              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                              contentStyle={{
                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                borderColor: 'rgba(51, 65, 85, 0.6)',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '12px',
                                direction: 'rtl',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
                                backdropFilter: 'blur(8px)',
                                padding: '8px 12px',
                                maxWidth: '280px',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                              }}
                              itemStyle={{
                                color: '#E2E8F0',
                                fontSize: '11px',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                padding: '2px 0',
                              }}
                              labelStyle={{
                                color: '#F8FAFC',
                                fontWeight: 'bold',
                                marginBottom: '4px',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                              }}
                              formatter={(val: any, _: any, item: any) => [
                                `${formatCurrency(Number(val))} (${item.payload.count} مشاريع)`,
                                'إجمالي قيمة العقود'
                              ]}
                              labelFormatter={(label: any, items: any) => items?.[0]?.payload?.fullName || label}
                            />
                            <Legend
                              align="right"
                              verticalAlign="top"
                              wrapperStyle={{ direction: 'rtl', paddingBottom: '12px', fontSize: '11px' }}
                              formatter={() => <span className="text-slate-700 dark:text-slate-300 font-bold me-1">قيمة العقود (مليون ج.م)</span>}
                            />
                            <Bar
                              name="قيمة العقود"
                              dataKey="totalValue"
                              fill="#10B981"
                              radius={[6, 6, 0, 0]}
                              maxBarSize={55}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* PM Performance Breakdown */}
            <section
              aria-labelledby="pm-chart-title"
              className="lg:col-span-6 min-w-0 rounded-2xl bg-white/95 dark:bg-slate-900/90 p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-slate-950/40 backdrop-blur-xl space-y-4 hover:border-slate-300 dark:hover:border-slate-700/80 transition-colors flex flex-col justify-between"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 id="pm-chart-title" className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                      <span>{isAr ? 'أداء مديري المشاريع' : 'Project Managers Performance'}</span>
                      <bdi className="text-xs font-mono font-medium text-slate-400 dark:text-slate-500">
                        (PM Portfolio)
                      </bdi>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      عدد المشاريع وإجمالي المحفظة لكل مدير مشروع
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {/* Legend indicator in RTL */}
                  <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60" aria-hidden="true">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                    <span>المحفظة (مليون ج.م)</span>
                  </div>

                  {/* Accessible Data Table Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPmTable(!showPmTable)}
                    aria-expanded={showPmTable}
                    aria-controls="pm-data-view"
                    aria-label={showPmTable ? "العودة للرسم البياني لمديري المشاريع" : "عرض بيانات مديري المشاريع كجدول نصي ميسّر"}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
                    title={showPmTable ? "عرض الرسم البياني" : "عرض جدول البيانات"}
                  >
                    {showPmTable ? (
                      <>
                        <BarChart3 className="w-3.5 h-3.5 text-purple-500" aria-hidden="true" />
                        <span>رسم بياني</span>
                      </>
                    ) : (
                      <>
                        <TableIcon className="w-3.5 h-3.5 text-purple-500" aria-hidden="true" />
                        <span>جدول البيانات</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Chart or Accessible Data Table View */}
              <div id="pm-data-view" className="w-full min-w-0 flex-1">
                {showPmTable ? (
                  <div className="h-80 overflow-y-auto rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-2">
                    <table className="w-full text-xs text-start" aria-label="بيانات أداء مديري المشاريع والمحافظ">
                      <caption className="sr-only">جدول عدد المشاريع وقيمة المحفظة لكل مدير مشروع</caption>
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                          <th scope="col" className="p-2 text-start">مدير المشروع</th>
                          <th scope="col" className="p-2 text-center">عدد المشاريع</th>
                          <th scope="col" className="p-2 text-end">إجمالي المحفظة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                        {pmData.map((row) => (
                          <tr key={row.fullName} className="hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                            <td className="p-2 text-slate-900 dark:text-slate-100 font-bold">{row.fullName}</td>
                            <td className="p-2 text-center font-mono text-slate-600 dark:text-slate-400">{row.count}</td>
                            <td className="p-2 text-end font-mono font-bold text-purple-600 dark:text-purple-400"><bdi>{formatCurrency(row.totalValue)}</bdi></td>
                          </tr>
                        ))}
                        {pmData.length === 0 && (
                          <tr>
                            <td colSpan={3} className="p-6 text-center text-slate-500 dark:text-slate-400">
                              <div className="flex flex-col items-center justify-center gap-3">
                                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">لا توجد بيانات متاحة لمديري المشاريع</p>
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none cursor-pointer"
                                    aria-label="إعادة ضبط الفلاتر لعرض بيانات مديري المشاريع"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>إعادة ضبط الفلاتر</span>
                                  </button>
                                  <Link
                                    href="/projects/new"
                                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
                                    aria-label="إضافة مشروع جديد"
                                  >
                                    <Plus className="w-3.5 h-3.5 text-purple-500" aria-hidden="true" />
                                    <span>مشروع جديد</span>
                                  </Link>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <>
                    {/* Screen-reader accessible alternative table */}
                    <div className="sr-only">
                      <table aria-label="بيانات أداء مديري المشاريع للمساعدات الصوتية">
                        <caption>جدول بيانات مديري المشاريع وقيم المحافظ</caption>
                        <thead>
                          <tr>
                            <th scope="col">مدير المشروع</th>
                            <th scope="col">عدد المشاريع</th>
                            <th scope="col">إجمالي المحفظة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pmData.map((row) => (
                            <tr key={row.fullName}>
                              <td>{row.fullName}</td>
                              <td>{row.count}</td>
                              <td><bdi>{formatCurrency(row.totalValue)}</bdi></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {pmData.length === 0 ? (
                      <div
                        className="h-72 sm:h-80 w-full flex flex-col items-center justify-center p-6 text-center rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800"
                        role="region"
                        aria-label="حالة عدم وجود بيانات لأداء مديري المشاريع"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                          <Award className="w-6 h-6" aria-hidden="true" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                          لا توجد بيانات متاحة لمديري المشاريع
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                          لم يتم العثور على أية مشاريع مسندة لمديري المشاريع وفق معايير التصفية الحالية.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={resetFilters}
                            className="min-h-[44px] px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none cursor-pointer"
                            aria-label="إعادة ضبط الفلاتر لعرض أداء مديري المشاريع"
                          >
                            <RotateCcw className="w-4 h-4" aria-hidden="true" />
                            <span>إعادة ضبط الفلاتر</span>
                          </button>
                          <Link
                            href="/projects/new"
                            className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
                            aria-label="إضافة مشروع جديد"
                          >
                            <Plus className="w-4 h-4 text-purple-500" aria-hidden="true" />
                            <span>مشروع جديد</span>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="h-72 sm:h-80 w-full min-w-0" role="img" aria-label="رسم بياني شريطي لأداء مديري المشاريع وقيمة المحفظة" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
                          <BarChart data={pmData} margin={{ top: 15, right: 15, left: 10, bottom: 45 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                            <XAxis
                              dataKey="name"
                              stroke="#64748B"
                              fontSize={11}
                              tick={{ fill: '#94A3B8' }}
                              interval={0}
                              angle={-25}
                              textAnchor="end"
                              dy={8}
                            />
                            <YAxis
                              stroke="#64748B"
                              fontSize={11}
                              tick={{ fill: '#94A3B8' }}
                              width={50}
                              tickFormatter={formatAxisValue}
                            />
                            <Tooltip
                              allowEscapeViewBox={{ x: false, y: false }}
                              wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }}
                              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                              contentStyle={{
                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                borderColor: 'rgba(51, 65, 85, 0.6)',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '12px',
                                direction: 'rtl',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
                                backdropFilter: 'blur(8px)',
                                padding: '8px 12px',
                                maxWidth: '280px',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                              }}
                              itemStyle={{
                                color: '#E2E8F0',
                                fontSize: '11px',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                padding: '2px 0',
                              }}
                              labelStyle={{
                                color: '#F8FAFC',
                                fontWeight: 'bold',
                                marginBottom: '4px',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                              }}
                              formatter={(val: any, _: any, item: any) => [
                                `${formatCurrency(Number(val))} (${item.payload.count} مشاريع)`,
                                'إجمالي المحفظة'
                              ]}
                              labelFormatter={(label: any, items: any) => items?.[0]?.payload?.fullName || label}
                            />
                            <Legend
                              align="right"
                              verticalAlign="top"
                              wrapperStyle={{ direction: 'rtl', paddingBottom: '12px', fontSize: '11px' }}
                              formatter={() => <span className="text-slate-700 dark:text-slate-300 font-bold me-1">إجمالي المحفظة (مليون ج.م)</span>}
                            />
                            <Bar
                              name="إجمالي المحفظة"
                              dataKey="totalValue"
                              fill="#8B5CF6"
                              radius={[6, 6, 0, 0]}
                              maxBarSize={55}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ═══ Official Executive Print Report Footer ═══ */}
      <div className="hidden print:flex items-center justify-between border-t border-stone-300 pt-3 mt-6 text-[10px] text-stone-500" dir="rtl">
        <span>شركة بي زون للمنشآت المائية وحمامات السباحة — تقرير المحفظة والمؤشرات التنفيذية</span>
        <span className="font-mono text-[9px]">P.ZONE ERP SYSTEM · PORTFOLIO EXECUTIVE REPORT</span>
      </div>
    </div>
  );
};

export { ProjectsAnalyticsDashboardSkeleton } from './DashboardSkeletons';
