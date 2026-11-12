'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProjectService } from '@/lib/services/project.service';
import { ActivityLibraryTable } from '@/components/planning/ActivityLibraryTable';
import { LibraryTaskGenerator } from '@/components/planning/LibraryTaskGenerator';
import ProjectActivitiesTable from '@/components/planning/ProjectActivitiesTable';
import { ZoneManagerModal } from '@/components/planning/ZoneManagerModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { canEditPath } from '@/lib/rbac/access-control';
import {
  ListTodo,
  BookOpen,
  Layers,
  FolderKanban,
  Wand2,
  Loader2,
  ChevronDown,
} from 'lucide-react';

export default function ActivitiesPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { roles: userRoles, isAdmin } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();
  const isViewerOnly = (userRoles || []).length > 0 && (userRoles || []).every((r) => r === 'viewer');
  const canEdit =
    !isViewerOnly &&
    (canEditPath('/planning/activities', userRoles || [], isAdmin, dbAccessRules) ||
      canEditPath('/planning', userRoles || [], isAdmin, dbAccessRules));

  const [activeTab, setActiveTab] = useState<'project' | 'library' | 'generate'>('project');
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const effectiveTab = activeTab === 'generate' && !canEdit ? 'project' : activeTab;

  // Global project store synchronization (two-way)
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveProjectId = useProjectStore((s) => s.setActiveProjectId);

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => ProjectService.getProjects({}),
  });

  // Resolve selected project: prefer active store project, fallback to first project
  const selectedProjectId = useMemo(() => {
    if (activeProjectId && projects.some((p) => p.id === activeProjectId)) {
      return activeProjectId;
    }
    if (projects.length > 0) {
      return projects[0].id;
    }
    return activeProjectId || '';
  }, [activeProjectId, projects]);

  // Two-way sync: reflect selected project back into store
  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== activeProjectId) {
      setActiveProjectId(selectedProjectId);
    }
  }, [selectedProjectId, activeProjectId, setActiveProjectId]);

  const handleProjectChange = (id: string) => {
    setActiveProjectId(id);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-500/20 shrink-0 ring-1 ring-emerald-500/30">
            <ListTodo className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {isAr ? 'أنشطة المشروع ومكتبة الأنشطة القياسية' : 'Project Activities & Activity Library'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              {isAr
                ? 'مكتبة الأنشطة المؤسسية الموحدة، إدارة مناطق العمل المكانية، وهيكل تجزئة الأعمال'
                : 'Standard enterprise activity library, project spatial zones, and WBS mapping'}
            </p>
          </div>
        </div>

        {/* ── Project Selector & Zone Modal Action ── */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex items-center bg-white dark:bg-slate-900 ps-3.5 pe-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all text-xs">
            <label htmlFor="activities-project-select" className="sr-only">
              {isAr ? 'اختر المشروع النشط' : 'Select active project'}
            </label>
            <FolderKanban className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 me-2" />
            {isLoadingProjects ? (
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium py-0.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                <span>{isAr ? 'جارٍ تحميل المشاريع…' : 'Loading projects…'}</span>
              </div>
            ) : (
              <select
                id="activities-project-select"
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="bg-transparent border-none focus:outline-none font-semibold text-slate-700 dark:text-slate-200 cursor-pointer appearance-none pe-2 text-xs"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {isAr ? '-- اختر المشروع لعرض الأنشطة والمناطق --' : '-- Select Project --'}
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {p.project_code ? `#${p.project_code} — ` : ''}{p.project_name}
                  </option>
                ))}
              </select>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {canEdit && selectedProjectId && (
            <button
              type="button"
              onClick={() => setIsZoneModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-sm hover:shadow-md hover:shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Layers className="w-4 h-4" />
              <span>{isAr ? 'إدارة مناطق المشروع' : 'Project Zones'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Accessible Tabs Navigation ── */}
      <div
        role="tablist"
        aria-label={isAr ? 'أقسام أنشطة التخطيط' : 'Planning activities tabs'}
        className="bg-slate-100/90 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center gap-1.5"
      >
        <button
          id="tab-project"
          role="tab"
          type="button"
          aria-selected={effectiveTab === 'project'}
          aria-controls={effectiveTab === 'project' ? 'panel-project' : undefined}
          onClick={() => setActiveTab('project')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            effectiveTab === 'project'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-800/60'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>{isAr ? 'أنشطة المشروع' : 'Project Activities'}</span>
        </button>

        <button
          id="tab-library"
          role="tab"
          type="button"
          aria-selected={effectiveTab === 'library'}
          aria-controls={effectiveTab === 'library' ? 'panel-library' : undefined}
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            effectiveTab === 'library'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-800/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{isAr ? 'مكتبة الأنشطة القياسية' : 'Activity Library'}</span>
        </button>

        {canEdit && (
          <button
            id="tab-generate"
            role="tab"
            type="button"
            aria-selected={effectiveTab === 'generate'}
            aria-controls={effectiveTab === 'generate' ? 'panel-generate' : undefined}
            onClick={() => setActiveTab('generate')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              effectiveTab === 'generate'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>{isAr ? 'توليد المهام الميدانية' : 'Generate Site Tasks'}</span>
          </button>
        )}
      </div>

      {/* ── Tab Panels ── */}
      <div className="pt-1">
        {effectiveTab === 'project' && (
          <div
            id="panel-project"
            role="tabpanel"
            aria-labelledby="tab-project"
            tabIndex={0}
            className="focus-visible:outline-none"
          >
            <ProjectActivitiesTable projectId={selectedProjectId} />
          </div>
        )}

        {effectiveTab === 'library' && (
          <div
            id="panel-library"
            role="tabpanel"
            aria-labelledby="tab-library"
            tabIndex={0}
            className="focus-visible:outline-none"
          >
            <ActivityLibraryTable />
          </div>
        )}

        {canEdit && effectiveTab === 'generate' && (
          <div
            id="panel-generate"
            role="tabpanel"
            aria-labelledby="tab-generate"
            tabIndex={0}
            className="focus-visible:outline-none"
          >
            <LibraryTaskGenerator />
          </div>
        )}
      </div>

      {/* ── Zone Manager Modal ── */}
      {canEdit && selectedProjectId && (
        <ZoneManagerModal
          projectId={selectedProjectId}
          isOpen={isZoneModalOpen}
          onClose={() => setIsZoneModalOpen(false)}
        />
      )}
    </div>
  );
}
