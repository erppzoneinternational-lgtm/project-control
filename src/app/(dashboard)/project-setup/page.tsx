'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  FolderKanban, 
  PlusCircle, 
  UserCheck, 
  ShieldAlert, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Activity, 
  Building2, 
  Phone, 
  TrendingUp, 
  Clock, 
  ExternalLink,
  MapPin,
  Pin,
  FileSpreadsheet
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { ProjectService } from '@/lib/services/project.service';
import { Project } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ErrorState } from '@/components/ui/ErrorState';
import { getProjectValue } from '@/lib/utils/projectValue';
import { ProjectBilingualNameCell } from '@/components/projects/ProjectBilingualNameCell';
import { UniversalReportModal } from '@/components/reports/UniversalReportModal';
import {
  ReportColumn,
  ReportKpiCard,
  formatCurrency,
} from '@/lib/reports/reportEngine';

export default function ProjectSetupPortalPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const router = useRouter();
  const { hasRole, isAdmin, roles } = useUserRoles();
  const canEditMasterData = hasRole('commercial_manager') || isAdmin;

  const canCreateProject = useMemo(() => {
    if (isAdmin) return true;
    return (roles || []).some((r) =>
      ['admin', 'ceo', 'coo', 'commercial_manager', 'planning_manager'].includes(String(r).toLowerCase())
    );
  }, [roles, isAdmin]);

  // Governance Auto-Redirect: Technical Office engineers must work in /to-tasks, not the portfolio setup portal
  useEffect(() => {
    if (!roles || roles.length === 0) return;
    const hasElevated = isAdmin || (roles || []).some((r) =>
      ['admin', 'ceo', 'coo', 'commercial_manager', 'planning_manager', 'project_manager'].includes(String(r).toLowerCase())
    );
    if (!hasElevated && (roles || []).some((r) => String(r).toLowerCase().includes('technical_office'))) {
      router.replace('/to-tasks');
    }
  }, [roles, isAdmin, router]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Freeze project name column state
  const [freezeProjectName, setFreezeProjectName] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pzone_project_setup_freeze_name');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const toggleFreezeProjectName = useCallback(() => {
    setFreezeProjectName((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pzone_project_setup_freeze_name', String(next));
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    ProjectService.getProjects({})
      .then((data) => {
        if (!cancelled) {
          setProjects(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load projects for project-setup:', err);
        if (!cancelled) {
          setError(err?.message || (isAr ? 'تعذر استرجاع مشاريع التهيئة' : 'Failed to load projects'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadTrigger, isAr]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    let list = [...projects];

    if (statusFilter === 'unassigned_pm') {
      list = list.filter((p) => !(p.pm_full_name || p.project_manager_name_raw || p.project_manager));
    } else if (statusFilter !== 'all') {
      list = list.filter((p) => p.status === statusFilter);
    }

    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((p) => {
        const code = String(p.project_code || p.code || '').toLowerCase();
        const nameAr = String(p.project_name || p.name_ar || p.project_name_ar || '').toLowerCase();
        const nameEn = String(p.project_name_en || p.name_en || '').toLowerCase();
        const pubName = String(p.public_name || '').toLowerCase();
        const client = String(p.client?.name_ar || p.client_name_raw || '').toLowerCase();
        const pm = String(p.pm_full_name || p.project_manager_name_raw || p.project_manager || '').toLowerCase();
        return code.includes(q) || nameAr.includes(q) || nameEn.includes(q) || pubName.includes(q) || client.includes(q) || pm.includes(q);
      });
    }

    return list;
  }, [projects, statusFilter, searchTerm]);

  const [isCustomReportModalOpen, setIsCustomReportModalOpen] = useState(false);

  // Derived KPIs
  const kpis = useMemo(() => {
    const total = projects.length;
    const working = projects.filter((p) => p.status === 'working').length;
    const handingOver = projects.filter((p) => p.status === 'handing_over').length;
    const unassignedPm = projects.filter((p) => !(p.pm_full_name || p.project_manager_name_raw || p.project_manager)).length;
    const totalContractVal = projects.reduce((acc, p) => acc + Number(p.contract_value ?? p.contract_value_egp ?? 0), 0);
    const totalVosVal = projects.reduce((acc, p) => acc + Number((p as any).vos_value ?? (p as any).approved_vos_total ?? 0), 0);
    const totalVal = totalContractVal + totalVosVal;

    return { total, working, handingOver, unassignedPm, totalContractVal, totalVosVal, totalVal };
  }, [projects]);

  // Quick Filter Pills with Counts & Status mapping
  const filterPills = useMemo(() => [
    { id: 'all', label: isAr ? 'جميع المشاريع' : 'All Projects', count: projects.length },
    { id: 'working', label: isAr ? 'جاري التنفيذ' : 'Working', count: kpis.working },
    { id: 'handing_over', label: isAr ? 'قيد التسليم' : 'Handing Over', count: kpis.handingOver },
    { id: 'unassigned_pm', label: isAr ? 'بدون مدير معتمد' : 'Unassigned PM', count: kpis.unassignedPm, isAlert: true },
    { id: 'not_started', label: isAr ? 'لم يبدأ بعد' : 'Not Started', count: projects.filter((p) => p.status === 'not_started').length },
    { id: 'finished', label: isAr ? 'منتهي ومسلم' : 'Finished', count: projects.filter((p) => p.status === 'finished').length },
    { id: 'on_hold', label: isAr ? 'معلق مؤقتاً' : 'On Hold', count: projects.filter((p) => p.status === 'on_hold').length },
  ], [projects, kpis, isAr]);

  const setupReportColumns: ReportColumn<Project>[] = useMemo(() => [
    {
      id: 'sn',
      labelAr: 'م',
      labelEn: 'SN',
      categoryAr: 'بيانات المشروع الأساسية',
      getValue: (_p, idx) => idx + 1,
      defaultVisible: true,
      widthMm: 12,
      align: 'center',
    },
    {
      id: 'code',
      labelAr: 'كود المشروع',
      labelEn: 'Project Code',
      categoryAr: 'بيانات المشروع الأساسية',
      getValue: (p) => p.project_code || '—',
      defaultVisible: true,
      widthMm: 28,
      align: 'center',
    },
    {
      id: 'name_ar',
      labelAr: 'اسم المشروع بالعربية',
      labelEn: 'Project Name (AR)',
      categoryAr: 'بيانات المشروع الأساسية',
      getValue: (p) => p.project_name || '—',
      defaultVisible: true,
      widthMm: 45,
    },
    {
      id: 'name_en',
      labelAr: 'اسم المشروع بالإنجليزية',
      labelEn: 'Project Name (EN)',
      categoryAr: 'بيانات المشروع الأساسية',
      getValue: (p) => p.project_name_en || '—',
      defaultVisible: true,
      widthMm: 40,
    },
    {
      id: 'public_name',
      labelAr: 'الاسم العام المدمج',
      labelEn: 'Public Project Name',
      categoryAr: 'بيانات المشروع الأساسية',
      getValue: (p) => (p as any).public_name || `${p.project_name || ''}${p.project_name_en ? ' - ' + p.project_name_en : ''}`,
      defaultVisible: false,
      widthMm: 50,
    },
    {
      id: 'client',
      labelAr: 'العميل / المطور',
      labelEn: 'Client / Developer',
      categoryAr: 'بيانات المشروع الأساسية',
      getValue: (p) => p.client?.name_ar || p.client_name_raw || '—',
      defaultVisible: true,
      widthMm: 40,
    },
    {
      id: 'pm',
      labelAr: 'مدير مشروع بي زون',
      labelEn: 'P.ZONE PM',
      categoryAr: 'فريق العمل والمسؤوليات',
      getValue: (p) => p.pm_full_name || p.project_manager_name_raw || p.project_manager || '—',
      defaultVisible: true,
      widthMm: 38,
    },
    {
      id: 'pm_assigned',
      labelAr: 'حالة تعيين المدير',
      labelEn: 'PM Assignment',
      categoryAr: 'فريق العمل والمسؤوليات',
      getValue: (p) => {
        const hasPm = Boolean(p.pm_full_name || p.project_manager_name_raw || p.project_manager);
        return hasPm ? 'معتمد' : 'غير معين ⚠️';
      },
      defaultVisible: true,
      widthMm: 25,
      align: 'center',
    },
    {
      id: 'status',
      labelAr: 'حالة المشروع',
      labelEn: 'Status',
      categoryAr: 'بيانات المشروع الأساسية',
      getValue: (p) => p.status,
      defaultVisible: true,
      widthMm: 25,
      align: 'center',
    },
    {
      id: 'contract_value',
      labelAr: 'قيمة العقد الأصلية',
      labelEn: 'Original Contract Value',
      categoryAr: 'البيانات المالية',
      getValue: (p) => Number(p.contract_value ?? p.contract_value_egp ?? 0),
      formatPrint: (p) => formatCurrency(Number(p.contract_value ?? p.contract_value_egp ?? 0)),
      formatExcel: (p) => Number(p.contract_value ?? p.contract_value_egp ?? 0),
      defaultVisible: true,
      widthMm: 32,
      align: 'end',
    },
    {
      id: 'vos_value',
      labelAr: 'أوامر التغيير المعتمدة',
      labelEn: 'VOs Value',
      categoryAr: 'البيانات المالية',
      getValue: (p) => Number((p as any).vos_value ?? (p as any).approved_vos_total ?? 0),
      formatPrint: (p) => formatCurrency(Number((p as any).vos_value ?? (p as any).approved_vos_total ?? 0)),
      formatExcel: (p) => Number((p as any).vos_value ?? (p as any).approved_vos_total ?? 0),
      defaultVisible: true,
      widthMm: 30,
      align: 'end',
    },
    {
      id: 'total_value',
      labelAr: 'إجمالي القيمة المعدلة',
      labelEn: 'Total Adjusted Value',
      categoryAr: 'البيانات المالية',
      getValue: (p) => Number(p.contract_value ?? p.contract_value_egp ?? 0) + Number((p as any).vos_value ?? (p as any).approved_vos_total ?? 0),
      formatPrint: (p) => formatCurrency(Number(p.contract_value ?? p.contract_value_egp ?? 0) + Number((p as any).vos_value ?? (p as any).approved_vos_total ?? 0)),
      formatExcel: (p) => Number(p.contract_value ?? p.contract_value_egp ?? 0) + Number((p as any).vos_value ?? (p as any).approved_vos_total ?? 0),
      defaultVisible: true,
      widthMm: 35,
      align: 'end',
    },
    {
      id: 'location',
      labelAr: 'الموقع / المحافظة',
      labelEn: 'Location',
      categoryAr: 'بيانات المشروع الأساسية',
      getValue: (p) => p.location || p.governorate?.name_ar || '—',
      defaultVisible: false,
      widthMm: 30,
    },
    {
      id: 'role',
      labelAr: 'الدور التعاقدي',
      labelEn: 'Contractual Role',
      categoryAr: 'البيانات المالية',
      getValue: (p) => (p.pzone_role === 'main_contractor' ? 'مقاول رئيسي' : p.pzone_role === 'sub_contractor' ? 'مقاول باطن' : p.pzone_role || '—'),
      defaultVisible: false,
      widthMm: 28,
      align: 'center',
    },
    {
      id: 'water_area',
      labelAr: 'مسطح المياه (م²)',
      labelEn: 'Water Area (m²)',
      categoryAr: 'المواصفات الفنية',
      getValue: (p) => p.water_area_m2 || 0,
      formatPrint: (p) => (p.water_area_m2 ? `${Number(p.water_area_m2).toLocaleString()} م²` : '—'),
      defaultVisible: false,
      widthMm: 25,
      align: 'center',
    },
    {
      id: 'water_vol',
      labelAr: 'حجم المياه (م³)',
      labelEn: 'Water Volume (m³)',
      categoryAr: 'المواصفات الفنية',
      getValue: (p) => p.water_vol_m3 || 0,
      formatPrint: (p) => (p.water_vol_m3 ? `${Number(p.water_vol_m3).toLocaleString()} م³` : '—'),
      defaultVisible: false,
      widthMm: 25,
      align: 'center',
    },
  ], []);

  const setupReportKpis: ReportKpiCard[] = useMemo(() => [
    { id: 'k1', label: isAr ? 'إجمالي المشاريع المسجلة' : 'Total Registered Projects', value: kpis.total, tone: 'default' },
    { id: 'k2', label: isAr ? 'مشاريع جارية قيد التنفيذ' : 'Working Projects', value: kpis.working, tone: 'emerald' },
    { id: 'k3', label: isAr ? 'مشاريع قيد التسليم' : 'Handing Over', value: kpis.handingOver, tone: 'amber' },
    { id: 'k4', label: isAr ? 'مشروعات بدون مدير معتمد' : 'Unassigned PM', value: kpis.unassignedPm, tone: 'rose' },
    { id: 'k5', label: isAr ? 'قيم العقود الأصلية' : 'Original Contract Value', value: formatCurrency(kpis.totalContractVal), tone: 'blue' },
    { id: 'k6', label: isAr ? 'أوامر التغيير المعتمدة' : 'VOs Total', value: formatCurrency(kpis.totalVosVal), tone: 'amber' },
    { id: 'k7', label: isAr ? 'إجمالي القيمة المعدلة' : 'Total Adjusted Value', value: formatCurrency(kpis.totalVal), tone: 'purple' },
  ], [kpis, isAr]);

  return (
    <div className="w-full space-y-6" dir="rtl">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: isAr ? 'المشاريع' : 'Projects', href: '/projects' },
          { label: isAr ? 'بوابة إعداد المشاريع' : 'Project Setup' },
        ]}
      />

      {/* ── 1. Command Center Header Banner (Light & Dark Adaptive) ── */}
      <div id="tour-setup-header" className="relative overflow-hidden rounded-3xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950 p-5 sm:p-7 text-slate-900 dark:text-white shadow-xs dark:shadow-xl border border-slate-200 dark:border-emerald-500/20 transition-colors">
        {/* Ambient Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(16, 185, 129, 0.4) 1px, transparent 0)', 
            backgroundSize: '24px 24px' 
          }} 
        />
        
        {/* Glow Spheres */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            {/* Telemetry Status Strip */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-mono font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>SYS.SETUP // POST-CONTRACT GOVERNANCE</span>
              <span className="text-slate-400 dark:text-slate-500">•</span>
              <span className="text-slate-600 dark:text-slate-300">{kpis.total} SITES SYNCED</span>
            </div>

            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3 ${isAr ? 'tracking-normal' : 'tracking-tight'}`}>
              <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shadow-inner">
                <FolderKanban className="w-7 h-7" />
              </div>
              <span>{isAr ? 'بوابة إعداد ومطابقة المشاريع' : 'Project Setup Portal'}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed font-sans">
              {isAr 
                ? 'السجل المركزي لتهيئة المشاريع، وتعيين مديري المشاريع المعتمدين، وحوكمة الشركاء والعملاء وفق ضوابط بي زون الهندسية.' 
                : 'Centralized registry for project onboarding, verified PM assignments, and governance across Egypt sites.'}
            </p>
          </div>

          {/* Action HUD Buttons */}
          <div id="tour-setup-hud" className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/projects/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-900/20 hover:-translate-y-0.5 transition-all font-mono cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              <MapPin className="w-4 h-4" />
              <span>{isAr ? 'الخريطة والتحليلات' : 'Map & Analytics'}</span>
            </Link>

            {canCreateProject && (
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-900/20 hover:-translate-y-0.5 transition-all font-mono cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isAr ? 'مشروع جديد' : 'New Project'}</span>
              </Link>
            )}

            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all border border-slate-300 dark:border-slate-700 font-mono cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{isAr ? 'سجل المشاريع' : 'Projects Dir'}</span>
            </Link>
          </div>
        </div>
      </div>

      {!canEditMasterData && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>
            {isAr 
              ? 'تنويه: تعديل وتحديث البيانات الأساسية مقصور على مدير القطاع التجاري والمسؤول العام للنظام.' 
              : 'Notice: Modifying Master Data is restricted to Commercial Manager & Admin.'}
          </span>
        </div>
      )}

      {/* ── 2. Quick Navigation Consoles ── */}
      <div id="tour-setup-quick-nav" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Module 1: GIS Map */}
        <Link
          href="/projects/dashboard"
          className="relative p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 hover:border-cyan-500/60 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/0 group-hover:via-cyan-500/80 to-transparent transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
              #MOD.01 // GIS
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-3 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
            {isAr ? 'الخريطة التفاعلية' : 'GIS Map'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {isAr ? 'مواقع المشاريع الـ 49 وإحداثياتها الجغرافية' : '49 GPS Project Locations across Egypt'}
          </p>
        </Link>

        {/* Module 2: Projects List */}
        <Link
          href="/projects"
          className="relative p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 hover:border-emerald-500/60 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/0 group-hover:via-emerald-500/80 to-transparent transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
              #MOD.02 // PRJ
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {isAr ? 'قائمة ومؤشرات المشاريع' : 'Projects List'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {isAr ? 'استعراض الـ 77 مشروعاً والفرز المالي والمساحات' : 'View all 77 projects with financial sorting'}
          </p>
        </Link>

        {/* Module 3: Stakeholders */}
        <Link
          href="/stakeholders"
          className="relative p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 hover:border-purple-500/60 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500/0 group-hover:via-purple-500/80 to-transparent transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
              #MOD.03 // STK
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {isAr ? 'دليل الشركاء وأصحاب المصلحة' : 'Stakeholders Directory'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {isAr ? 'مديرو المشاريع، والجهات المالكة، والمكاتب الاستشارية' : 'PMs, consultants and key contacts'}
          </p>
        </Link>

        {/* Module 4: Clients */}
        <Link
          href="/clients"
          className="relative p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 hover:border-blue-500/60 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/0 group-hover:via-blue-500/80 to-transparent transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
              #MOD.04 // CLI
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {isAr ? 'سجل العملاء والمطورين' : 'Clients & Developers'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {isAr ? '40 عميلاً ومطوراً معتمداً (حسن علام، أوراسكوم، مراكز...)' : '40 verified clients & developers'}
          </p>
        </Link>
      </div>

      {/* ── 3. Executive Telemetry Counters (Full Widescreen Responsive) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 w-full">
        {/* KPI 1: Total */}
        <div
          onClick={() => router.push('/projects')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/projects'); } }}
          role="button"
          tabIndex={0}
          className="relative p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 shadow-xs hover:border-emerald-500/60 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 cursor-pointer overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/0 group-hover:via-emerald-500/80 to-transparent transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
              TOTAL
            </span>
            <FolderKanban className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1.5">
            {isAr ? 'إجمالي المشاريع' : 'Total Projects'}
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
            {kpis.total}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
            <Activity className="w-2.5 h-2.5 animate-pulse" />
            <span className="truncate">{isAr ? 'مسجلة بالنظام' : 'In DB'}</span>
          </div>
        </div>

        {/* KPI 2: Active */}
        <div
          onClick={() => router.push('/projects?status=working')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/projects?status=working'); } }}
          role="button"
          tabIndex={0}
          className="relative p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 shadow-xs hover:border-cyan-500/60 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 cursor-pointer overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/0 group-hover:via-cyan-500/80 to-transparent transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
              WORKING
            </span>
            <Activity className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1.5">
            {isAr ? 'مشاريع جارية' : 'Active Projects'}
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
            {kpis.working}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
            <Clock className="w-2.5 h-2.5" />
            <span className="truncate">{isAr ? 'قيد التنفيذ' : 'On site'}</span>
          </div>
        </div>

        {/* KPI 3: Handing Over */}
        <div
          onClick={() => router.push('/projects?status=handing_over')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/projects?status=handing_over'); } }}
          role="button"
          tabIndex={0}
          className="relative p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 shadow-xs hover:border-amber-500/60 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 cursor-pointer overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/0 group-hover:via-amber-500/80 to-transparent transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
              HANDOVER
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1.5">
            {isAr ? 'قيد التسليم' : 'Handing Over'}
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
            {kpis.handingOver}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-2.5 h-2.5" />
            <span className="truncate">{isAr ? 'تسليم ابتدائي' : 'Handover'}</span>
          </div>
        </div>

        {/* KPI 4: Original Contract Value */}
        <div
          onClick={() => router.push('/projects')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/projects'); } }}
          role="button"
          tabIndex={0}
          className="relative p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 shadow-xs hover:border-blue-500/60 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 cursor-pointer overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/0 group-hover:via-blue-500/80 to-transparent transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
              CONTRACT
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1.5">
            {isAr ? 'قيم العقود الأصلية' : 'Contract Value'}
          </div>
          <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5 font-mono truncate" title={formatCurrency(kpis.totalContractVal)}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(kpis.totalContractVal)}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-blue-600 dark:text-blue-400">
            <ExternalLink className="w-2.5 h-2.5" />
            <span className="truncate">{isAr ? 'العقود الأساسية' : 'Base Scope'}</span>
          </div>
        </div>

        {/* KPI 5: VOs Value */}
        <div
          onClick={() => router.push('/reports?category=portfolio')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/reports?category=portfolio'); } }}
          role="button"
          tabIndex={0}
          className="relative p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 shadow-xs hover:border-amber-500/60 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 cursor-pointer overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/0 group-hover:via-amber-500/80 to-transparent transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
              VOS
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1.5">
            {isAr ? 'أوامر التغيير المعتمدة' : 'VOs Total'}
          </div>
          <div className="text-sm sm:text-base font-black text-amber-700 dark:text-amber-300 mt-0.5 font-mono truncate" title={formatCurrency(kpis.totalVosVal)}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(kpis.totalVosVal)}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-amber-600 dark:text-amber-400">
            <span>+{((kpis.totalVosVal / (kpis.totalContractVal || 1)) * 100).toFixed(1)}%</span>
            <span className="truncate">{isAr ? 'زيادة تعاقدية' : 'Variation'}</span>
          </div>
        </div>

        {/* KPI 6: Total Adjusted Value */}
        <div
          onClick={() => router.push('/projects')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/projects'); } }}
          role="button"
          tabIndex={0}
          className="relative p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 shadow-xs hover:border-emerald-500/60 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 cursor-pointer overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/0 group-hover:via-emerald-500/80 to-transparent transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
              TOTAL VALUE
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1.5">
            {isAr ? 'إجمالي القيمة المعدلة' : 'Total Adjusted Value'}
          </div>
          <div className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-300 mt-0.5 font-mono truncate" title={formatCurrency(kpis.totalVal)}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(kpis.totalVal)}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
            <ExternalLink className="w-2.5 h-2.5" />
            <span className="truncate">{isAr ? 'حجم المحفظة الكلي' : 'Total Portfolio'}</span>
          </div>
        </div>
      </div>

      {/* ── 4. Main Section: Master Projects Registry Table ── */}
      <div className="relative bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-emerald-500/80 via-cyan-500/80 to-purple-500/80" />

        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {isAr ? 'جدول المشاريع ومديري المشاريع المعتمدين' : 'Projects & Verified PM Registry'}
                </h2>
                <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                  LIVE_GRID
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                {isAr 
                  ? `عرض ${filteredProjects.length} من أصل ${projects.length} مشروع مسجل` 
                  : `Showing ${filteredProjects.length} of ${projects.length} recorded projects`}
              </p>
            </div>
          </div>

          <div id="tour-setup-filter" className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isAr ? 'بحث بالكود أو الاسم أو المدير...' : 'Search code, name, PM...'}
                className="w-full h-9 ps-9 pe-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors font-sans"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
              >
                <option value="all">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
                <option value="working">{isAr ? 'جاري التنفيذ' : 'Working'}</option>
                <option value="handing_over">{isAr ? 'قيد التسليم والإنهاء' : 'Handing Over'}</option>
                <option value="not_started">{isAr ? 'لم يبدأ بعد' : 'Not Started'}</option>
                <option value="finished">{isAr ? 'منتهي ومسلم' : 'Finished'}</option>
                <option value="on_hold">{isAr ? 'معلق مؤقتاً' : 'On Hold'}</option>
                <option value="cancelled">{isAr ? 'ملغي' : 'Cancelled'}</option>
                <option value="unassigned_pm">{isAr ? '⚠️ بدون مدير مشروع معتمد' : '⚠️ Unassigned PM'}</option>
              </select>
            </div>

            {/* Freeze Project Name Column Toggle */}
            <button
              type="button"
              onClick={toggleFreezeProjectName}
              aria-pressed={freezeProjectName}
              title={
                isAr
                  ? freezeProjectName
                    ? 'إلغاء تجميد عمود اسم المشروع'
                    : 'تجميد وتثبيت عمود اسم المشروع أثناء التمرير الأفقي'
                  : freezeProjectName
                  ? 'Unfreeze project name column'
                  : 'Freeze project name column while scrolling'
              }
              className={`h-9 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                freezeProjectName
                  ? 'bg-amber-100/90 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 transition-transform ${freezeProjectName ? 'text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400 rotate-45' : 'text-slate-400'}`} />
              <span>
                {freezeProjectName
                  ? (isAr ? 'إلغاء تجميد الاسم' : 'Unfreeze Name')
                  : (isAr ? 'تجميد اسم المشروع' : 'Freeze Project Name')}
              </span>
            </button>

            {/* Custom Report Studio Button */}
            <button
              type="button"
              onClick={() => setIsCustomReportModalOpen(true)}
              data-testid="open-setup-report-modal"
              title={isAr ? 'استوديو تخصيص وإصدار تقرير تهيئة المشروعات (ملفات إكسل وبي دي إف)' : 'Custom Project Setup Report Studio'}
              className="h-9 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-500/30 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xs shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>{isAr ? 'تقرير التهيئة المخصص' : 'Custom Report'}</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Pills Bar */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0 flex items-center gap-1 ps-0.5">
            <Filter className="w-3.5 h-3.5" />
            <span>{isAr ? 'تصفية سريعة:' : 'Quick Filters:'}</span>
          </span>
          {filterPills.map((pill) => {
            const isActive = statusFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStatusFilter(pill.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs font-black scale-[1.02]'
                    : 'bg-white dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{pill.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none ${
                    isActive
                      ? 'bg-white/20 dark:bg-white/10 text-white'
                      : pill.isAlert
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
          {(statusFilter !== 'all' || searchTerm.trim() !== '') && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setSearchTerm('');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ms-auto"
            >
              <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
            </button>
          )}
        </div>

        {/* Projects Table */}
        <div id="tour-setup-table" className="overflow-x-auto max-h-[650px] relative scrollbar-thin">
          <table className="w-full text-start text-xs border-separate border-spacing-0">
            <thead className="sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold shadow-xs">
              <tr>
                <th
                  className={`py-3 px-3 text-center w-12 min-w-[48px] max-w-[48px] ${
                    freezeProjectName
                      ? 'sticky start-0 z-20 bg-slate-100/95 dark:bg-slate-900/95'
                      : ''
                  }`}
                >
                  #
                </th>
                <th
                  className={`py-3 px-3 text-center w-24 min-w-[96px] max-w-[96px] ${
                    freezeProjectName
                      ? 'sticky start-12 z-20 bg-slate-100/95 dark:bg-slate-900/95'
                      : ''
                  }`}
                >
                  {isAr ? 'الكود' : 'Code'}
                </th>
                <th
                  className={`py-3 px-4 text-start transition-all ${
                    freezeProjectName
                      ? 'sticky start-[144px] z-20 bg-slate-100/95 dark:bg-slate-900/95 min-w-[280px] lg:min-w-[340px] border-e border-slate-200 dark:border-slate-800 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.12)]'
                      : 'min-w-[260px]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span>{isAr ? 'اسم المشروع' : 'Project Name'}</span>
                    <button
                      type="button"
                      onClick={toggleFreezeProjectName}
                      title={
                        isAr
                          ? (freezeProjectName ? 'إلغاء تجميد العمود' : 'تجميد العمود')
                          : (freezeProjectName ? 'Unfreeze' : 'Freeze')
                      }
                      className={`p-1 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                        freezeProjectName
                          ? 'text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-900/40 hover:bg-amber-100'
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Pin className={`w-3.5 h-3.5 ${freezeProjectName ? 'fill-current rotate-45' : ''}`} />
                    </button>
                  </div>
                </th>
                <th className="py-3 px-4 text-start min-w-[180px]">{isAr ? 'العميل / المطور' : 'Client / Developer'}</th>
                <th className="py-3 px-4 text-start min-w-[170px]">{isAr ? 'مدير المشروع الحالي' : 'Active PM'}</th>
                <th className="py-3 px-3 text-center min-w-[120px]">{isAr ? 'الدور التعاقدي' : 'Role'}</th>
                <th className="py-3 px-3 text-center min-w-[110px]">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="py-3 px-4 text-center min-w-[140px]">{isAr ? 'قيمة العقد الأصلية' : 'Contract Value'}</th>
                <th className="py-3 px-4 text-center min-w-[140px]">{isAr ? 'أوامر التغيير' : 'VOs Value'}</th>
                <th className="py-3 px-4 text-center min-w-[150px]">{isAr ? 'إجمالي القيمة المعدلة' : 'Total Value'}</th>
                <th className="py-3 px-3 text-center min-w-[110px]">{isAr ? 'الإنجاز' : 'Progress'}</th>
                <th className="py-3 px-4 text-center min-w-[130px]">{isAr ? 'إجراءات ومطابقة' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-slate-700 dark:text-stone-200">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2 font-bold animate-pulse">
                      <FolderKanban className="w-5 h-5 text-emerald-500 animate-spin" />
                      <span>{isAr ? 'جاري تحميل المشاريع من قاعدة البيانات...' : 'Loading projects from database...'}</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={12} className="p-6">
                    <ErrorState
                      error={error}
                      onRetry={() => setReloadTrigger((prev) => prev + 1)}
                    />
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <FolderKanban className="w-10 h-10 mx-auto text-slate-300 dark:text-stone-700 mb-2" />
                    <p className="font-bold text-slate-600 dark:text-stone-300">
                      {isAr ? 'لا توجد مشاريع مطابقة للبحث' : 'No projects match your search'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isAr ? 'يرجى مراجعة كلمات البحث أو اختيار حالة أخرى' : 'Check search term or select another status'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p, idx) => {
                  const pmName = p.pm_full_name || p.project_manager_name_raw || p.project_manager;
                  const pmPhone = p.pm_phone;
                  const contractVal = Number(p.contract_value ?? p.contract_value_egp ?? (p as any).total_contract_value ?? 0);
                  const vosVal = Number((p as any).vos_value ?? (p as any).approved_vos_total ?? 0);
                  const totalVal = contractVal + vosVal;
                  const progressPct = Math.round(Number(p.completion_pct ?? (p as any).completion_percentage ?? 0));
                  const roleLabel = p.pzone_role === 'main_contractor' 
                    ? (isAr ? 'مقاول رئيسي' : 'Main Contractor') 
                    : p.pzone_role === 'sub_contractor' 
                      ? (isAr ? 'مقاول باطن' : 'Subcontractor') 
                      : (p.pzone_role || '—');

                  return (
                    <tr 
                      key={p.id}
                      tabIndex={0}
                      className="group/row hover:bg-emerald-50/40 dark:hover:bg-slate-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 transition-colors cursor-pointer"
                    >
                      <td
                        className={`py-3.5 px-3 text-center text-slate-400 font-mono w-12 min-w-[48px] max-w-[48px] ${
                          freezeProjectName
                            ? 'sticky start-0 z-10 bg-white/95 dark:bg-slate-900/95 group-hover/row:bg-emerald-50/50 dark:group-hover/row:bg-slate-800/70 group-focus-within/row:bg-emerald-50/50 dark:group-focus-within/row:bg-slate-800/70'
                            : ''
                        }`}
                      >
                        {idx + 1}
                      </td>
                      <td
                        className={`py-3.5 px-3 text-center w-24 min-w-[96px] max-w-[96px] ${
                          freezeProjectName
                            ? 'sticky start-12 z-10 bg-white/95 dark:bg-slate-900/95 group-hover/row:bg-emerald-50/50 dark:group-hover/row:bg-slate-800/70 group-focus-within/row:bg-emerald-50/50 dark:group-focus-within/row:bg-slate-800/70'
                            : ''
                        }`}
                      >
                        <Link
                          href={`/projects/${p.id}`}
                          className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono font-black hover:scale-105 transition-transform border border-emerald-200 dark:border-emerald-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                          #{p.project_code || p.code}
                        </Link>
                      </td>
                      <td
                        className={`py-3.5 px-4 text-start font-bold text-slate-900 dark:text-white text-sm ${
                          freezeProjectName
                            ? 'sticky start-[144px] z-10 bg-white/95 dark:bg-slate-900/95 group-hover/row:bg-emerald-50/50 dark:group-hover/row:bg-slate-800/70 group-focus-within/row:bg-emerald-50/50 dark:group-focus-within/row:bg-slate-800/70 min-w-[280px] lg:min-w-[340px] border-e border-slate-200 dark:border-slate-800 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.08)]'
                            : 'min-w-[260px]'
                        }`}
                      >
                        <ProjectBilingualNameCell
                          project={p}
                          href={`/projects/${p.id}`}
                        />
                        {p.location && (
                          <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                            📍 {p.location}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-start text-xs font-semibold text-slate-600 dark:text-stone-300">
                        {p.client?.name_ar || p.client_name_raw || (isAr ? 'عميل مباشر' : 'Direct Client')}
                      </td>
                      <td className="py-3.5 px-4 text-start">
                        {pmName ? (
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-800 dark:text-stone-200 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span>{pmName}</span>
                            </div>
                            {pmPhone && (
                              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                                <Phone className="w-3 h-3 text-emerald-500" />
                                <span>{pmPhone}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md font-bold">
                            {isAr ? '⚠️ غير مسند' : 'Unassigned'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                          {roleLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <StatusBadge status={p.status} lang={locale} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 dark:text-stone-200" suppressHydrationWarning>
                        <span dir="ltr">{formatCurrency(contractVal)}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-amber-700 dark:text-amber-400" suppressHydrationWarning>
                        <span dir="ltr">{vosVal > 0 ? `+${formatCurrency(vosVal)}` : '0'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-black text-emerald-700 dark:text-emerald-400" suppressHydrationWarning>
                        <span dir="ltr">{formatCurrency(totalVal)}</span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                            {progressPct}%
                          </span>
                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/projects/${p.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            title={isAr ? 'فتح لوحة المشروع وتأكيد تعيين المدير' : 'Open project dashboard & verify PM'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isAr ? 'فتح ومطابقة' : 'Open & Verify'}</span>
                          </Link>
                          <Link
                            href={`/projects/${p.id}/edit`}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-slate-600 dark:text-stone-300 hover:text-amber-600 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                            title={isAr ? 'تعديل بيانات المشروع' : 'Edit project'}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Universal Project Setup Custom Report Studio */}
      <UniversalReportModal
        isOpen={isCustomReportModalOpen}
        onClose={() => setIsCustomReportModalOpen(false)}
        data={filteredProjects}
        columns={setupReportColumns}
        kpis={setupReportKpis}
        defaultTitle={isAr ? 'تقرير سجل إعداد ومطابقة المشاريع' : 'Project Setup & PM Verification Report'}
        defaultSubtitle={isAr ? 'شركة بي زون لحمامات السباحة والمسطحات المائية — حصر جاهزية الإدارة وتعيين مديري المشاريع' : 'P-ZONE FOR SWIMMING POOLS & WATER FEATURES — PM Assignment & Setup Governance'}
        defaultDocCode="PZ-STP-REP-01"
        defaultClassification="internal"
        lang={isAr ? 'ar' : 'en'}
      />
    </div>
  );
}
