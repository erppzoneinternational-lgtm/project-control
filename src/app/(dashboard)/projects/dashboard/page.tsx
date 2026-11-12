'use client';

import React, { useState, useEffect } from 'react';
import { ProjectsAnalyticsDashboard } from '@/components/dashboard/ProjectsAnalyticsDashboard';
import { ProjectsAnalyticsDashboardSkeleton } from '@/components/dashboard/DashboardSkeletons';
import { ProjectService } from '@/lib/services/project.service';
import { Project, Client } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { BarChart2, List, Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ErrorState } from '@/components/ui/ErrorState';

import { useAuth } from '@/lib/stores/useAuthStore';
import { useUserRoles } from '@/lib/hooks/useUserRoles';

export default function ProjectsDashboardPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { user } = useAuth();
  const { roles } = useUserRoles();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const allowedIds = await ProjectService.getUserAssignedProjectIds(user?.email || undefined, roles);
      const [projData, cliData] = await Promise.all([
        ProjectService.getProjects({}),
        ProjectService.getClients(),
      ]);
      const scopedProjects = allowedIds ? projData.filter((p) => allowedIds.includes(p.id)) : projData;
      setProjects(scopedProjects);
      setClients(cliData);
    } catch (rawErr: unknown) {
      const err = rawErr as { message?: string };
      console.error('Failed to load data for dashboard:', err);
      setError(err?.message || (isAr ? 'تعذر تحميل بيانات المشاريع والمحفظة' : 'Failed to load projects portfolio data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.email, roles]);

  return (
    <main 
      id="main-content"
      role="main"
      aria-label={isAr ? 'لوحة تحليلات ومحفظة المشاريع' : 'Projects Portfolio and Analytics Dashboard'}
      className="w-full space-y-6 text-start"
    >
      {/* Accessible Breadcrumbs with Landmark Support */}
      <Breadcrumbs
        items={[
          { label: isAr ? 'المشاريع' : 'Projects', href: '/projects' },
          { label: isAr ? 'لوحة تحليلات المحفظة' : 'Portfolio Analytics' },
        ]}
      />

      {/* Sub Navigation Bar: Executive Header & View Navigation */}
      <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 contrast-more:border-slate-500 shadow-xl backdrop-blur-xl transition-all">
        {/* Title & Dynamic Project Scope Readout */}
        <div className="space-y-1.5">
          <h1 className={`text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 ${isAr ? 'tracking-normal' : 'tracking-tight'}`}>
            <BarChart2 className="w-6 h-6 text-cyan-600 dark:text-cyan-400 shrink-0" aria-hidden="true" />
            <span>{isAr ? 'لوحة تحليلات ومحفظة المشاريع' : 'Projects Portfolio & Analytics Dashboard'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 contrast-more:text-slate-900 dark:contrast-more:text-white font-medium">
            {loading ? (
              <span>{isAr ? 'جاري استخراج مؤشرات المحفظة والبيانات التشغيلية...' : 'Loading portfolio metrics and operational KPIs...'}</span>
            ) : (
              <span>
                {isAr
                  ? `عرض تنفيذي شامل لعدد ${projects.length} من مشاريع المحفظة، والميزانيات، والمعالم المائية، ومؤشرات الأداء الرئيسية`
                  : `Comprehensive executive overview of ${projects.length} portfolio projects, budgets, aquatic assets, and KPIs`}
              </span>
            )}
          </p>
          {!loading && (
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" aria-hidden="true" />
                {isAr ? `إجمالي المشاريع: ${projects.length}` : `Total Projects: ${projects.length}`}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                {isAr ? `العملاء: ${clients.length}` : `Clients: ${clients.length}`}
              </span>
            </div>
          )}
        </div>

        {/* View Switcher Tabs & Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
          {/* Navigation Tabs between List & Dashboard */}
          <nav 
            role="navigation" 
            aria-label={isAr ? 'شريط التنقل بين قائمة المشاريع ولوحة التحليلات' : 'Project Views Navigation'}
            className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800"
          >
            <div role="tablist" aria-label={isAr ? 'طرق عرض المشاريع' : 'Project view options'} className="flex items-center gap-1">
              <Link
                href="/projects"
                role="tab"
                aria-selected="false"
                tabIndex={0}
                className="px-3 sm:px-4 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60 flex items-center gap-1.5 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none min-h-[44px] min-w-[44px]"
              >
                <List className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'قائمة المشاريع' : 'Project List'}</span>
              </Link>
              <div 
                role="tab"
                aria-selected="true"
                aria-current="page"
                tabIndex={0}
                className="px-3 sm:px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-md shadow-emerald-500/20 flex items-center gap-1.5 min-h-[44px] min-w-[44px] cursor-default focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none"
              >
                <BarChart2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'لوحة التحليلات' : 'Dashboard'}</span>
              </div>
            </div>
          </nav>

          {/* Quick Refresh Button */}
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            aria-label={isAr ? 'تحديث بيانات المحفظة' : 'Refresh portfolio data'}
            title={isAr ? 'تحديث البيانات' : 'Refresh Data'}
            className="inline-flex items-center justify-center p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed shrink-0 min-h-[44px] min-w-[44px]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>

          {/* New Project Primary CTA */}
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none shrink-0 min-h-[44px]"
            aria-label={isAr ? 'إنشاء مشروع إنشائي جديد' : 'Create new project'}
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{isAr ? 'مشروع جديد' : 'New Project'}</span>
          </Link>
        </div>
      </header>

      {/* Error Retry Alert if Data Fetch Fails */}
      {error && !loading && (
        <ErrorState compact error={error} onRetry={fetchData} />
      )}

      {/* Main Dashboard Body & High-Fidelity Zero-CLS Loading Skeleton */}
      {loading ? (
        <ProjectsAnalyticsDashboardSkeleton />
      ) : (
        <ProjectsAnalyticsDashboard 
          projects={projects} 
          clientsList={clients} 
          lang={locale} 
        />
      )}
    </main>
  );
}
