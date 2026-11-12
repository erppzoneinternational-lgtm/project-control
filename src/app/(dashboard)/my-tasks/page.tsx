'use client';

import React, { Suspense, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { MyTasksView } from '@/components/planning/MyTasksView';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { ProjectService } from '@/lib/services/project.service';
import {
  Loader2,
  CheckSquare,
  Building2,
  RefreshCw,
  Globe,
  X,
  Filter,
  Layers,
  Sparkles,
} from 'lucide-react';

const TaskViewComponent = MyTasksView as React.ComponentType<{
  stakeholderId?: string;
  projectId?: string;
  selectedProjectId?: string;
}>;

function MyTasksContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [isAr, setIsAr] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchedProjects, setFetchedProjects] = useState<any[]>([]);

  // Read URL parameters
  const stakeholderId = searchParams.get('stakeholderId') || undefined;
  const urlProjectId = searchParams.get('selectedProjectId') || searchParams.get('projectId') || null;

  // useProjectStore access
  const projectStore = useProjectStore();
  const activeProjectId = projectStore.activeProjectId;
  const setActiveProjectId = projectStore.setActiveProjectId;
  const rawProjects = (projectStore as any).projects || (projectStore as any).projectList || [];

  useEffect(() => {
    if (Array.isArray(rawProjects) && rawProjects.length > 0) return;
    let active = true;
    ProjectService.getProjects()
      .then((res) => {
        if (active && Array.isArray(res)) {
          setFetchedProjects(res);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [rawProjects]);

  const projectsList = useMemo(() => {
    const source = Array.isArray(rawProjects) && rawProjects.length > 0 ? rawProjects : fetchedProjects;
    if (!Array.isArray(source)) return [];
    return source
      .map((p: any) => ({
        id: String(p.id || p.projectId || ''),
        name: String(
          (isAr
            ? p.project_name_ar || p.project_name || p.public_name || p.name_ar || p.name
            : p.project_name_en || p.project_name || p.public_name || p.name_en || p.name) ||
            p.projectName ||
            p.title ||
            p.project_code ||
            p.code ||
            p.id ||
            ''
        ),
        code: p.project_code || p.code || p.projectCode || undefined,
      }))
      .filter((p) => p.id);
  }, [rawProjects, fetchedProjects, isAr]);

  // Two-way synchronization between URL and useProjectStore
  const lastSyncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (urlProjectId && urlProjectId !== activeProjectId) {
      lastSyncedRef.current = urlProjectId;
      setActiveProjectId(urlProjectId);
    } else if (!urlProjectId && activeProjectId && lastSyncedRef.current !== activeProjectId) {
      lastSyncedRef.current = activeProjectId;
      const params = new URLSearchParams(searchParams.toString());
      params.set('selectedProjectId', activeProjectId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [urlProjectId, activeProjectId, pathname, router, searchParams, setActiveProjectId]);

  const effectiveProjectId = activeProjectId || urlProjectId || undefined;

  // Handle project selector change
  const handleProjectChange = useCallback(
    (newVal: string) => {
      const nextId = newVal === 'ALL_PROJECTS' ? null : newVal;
      lastSyncedRef.current = nextId;
      setActiveProjectId(nextId || '');

      const params = new URLSearchParams(searchParams.toString());
      if (nextId) {
        params.set('selectedProjectId', nextId);
        params.set('projectId', nextId);
      } else {
        params.delete('selectedProjectId');
        params.delete('projectId');
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, setActiveProjectId]
  );

  // Clear stakeholder filter
  const handleClearStakeholder = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('stakeholderId');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  // Manual refresh / re-sync animation
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  }, []);

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Title & Description */}
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-md shadow-emerald-500/20 shrink-0 mt-0.5">
              <CheckSquare className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {isAr
                    ? 'بوابة المتابعة الفنية • التكليفات الهندسية والتعاقدية'
                    : 'Technical Controls Portal • Engineering & Contractual Assignments'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {isAr ? 'مساحة العمل ومتابعة المهام الشخصية' : 'Personal Engineering Tasks & Workspace'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
                {isAr
                  ? 'متابعة وإنجاز كافة التكاليف الفنية، المراجعات الهندسية، والاعتمادات التعاقدية الموكلة إليك عبر كافة المشاريع النشطة.'
                  : 'Track and complete all technical assignments, engineering reviews, and contractual approvals assigned to you across active projects.'}
              </p>
            </div>
          </div>

          {/* Quick Actions (Language & Refresh) */}
          <div className="flex items-center gap-2.5 self-start lg:self-center shrink-0">
            <button
              onClick={() => setIsAr((prev) => !prev)}
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
              title={isAr ? 'التحويل إلى الإنجليزية' : 'Switch to Arabic'}
            >
              <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isAr ? 'English' : 'العربية'}</span>
            </button>

            <button
              onClick={handleRefresh}
              type="button"
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-70"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isAr ? 'تحديث ومزامنة' : 'Sync & Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Controls Bar: Project Selector & Filters */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Project Selector Control */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isAr ? 'المشروع الهندسي المحدد:' : 'Engineering Project:'}</span>
            </label>
            <div className="relative min-w-[240px] max-w-md">
              <select
                value={effectiveProjectId || 'ALL_PROJECTS'}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 pr-8 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer shadow-2xs"
              >
                <option value="ALL_PROJECTS">
                  {isAr ? '🌐 كافة المشاريع النشطة' : '🌐 All Active Projects'}
                </option>
                {projectsList.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code ? `[${project.code}] ` : ''}
                    {project.name}
                  </option>
                ))}
                {/* Fallback option if effectiveProjectId is set but not in list */}
                {effectiveProjectId &&
                  !projectsList.some((p) => p.id === effectiveProjectId) && (
                    <option value={effectiveProjectId}>
                      {isAr ? `مشروع حالي: ${effectiveProjectId}` : `Current Project: ${effectiveProjectId}`}
                    </option>
                  )}
              </select>
            </div>
          </div>

          {/* Active Filters & Stakeholder Indicator */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {stakeholderId && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-300">
                <Filter className="w-3.5 h-3.5" />
                <span>
                  {isAr ? 'المسؤول المعني المعتمد:' : 'Assigned Stakeholder:'}{' '}
                  <strong className="font-semibold">{stakeholderId}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleClearStakeholder}
                  className="hover:bg-amber-200/60 dark:hover:bg-amber-900/60 rounded-full p-0.5 transition-colors"
                  title={isAr ? 'إلغاء التصفية' : 'Clear Filter'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
              <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                {effectiveProjectId
                  ? isAr
                    ? 'نطاق العرض: مشروع مخصص'
                    : 'Scope: Filtered Project'
                  : isAr
                  ? 'نطاق العرض: شامل لكافة المشاريع'
                  : 'Scope: Enterprise Wide'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tasks View Component */}
      <TaskViewComponent
        stakeholderId={stakeholderId}
        projectId={effectiveProjectId}
        selectedProjectId={effectiveProjectId}
      />
    </div>
  );
}

export default function MyTasksPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <Suspense
        fallback={
          <div className="min-h-[400px] flex items-center justify-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <span className="text-xs font-semibold">جاري تحميل مساحة مهامي الهندسية...</span>
            </div>
          </div>
        }
      >
        <MyTasksContent />
      </Suspense>
    </div>
  );
}
