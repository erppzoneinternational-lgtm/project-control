'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Users,
  ShieldCheck,
  FolderLock,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Project } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

export interface MyAssignedProjectsGridProps {
  projects: Project[];
  isLoading: boolean;
  onSelectProject: (projectId: string) => void;
  userFullName?: string | null;
  userEmail?: string | null;
  isUnrestricted?: boolean;
}

export const MyAssignedProjectsGrid: React.FC<MyAssignedProjectsGridProps> = ({
  projects,
  isLoading,
  onSelectProject,
  userFullName,
  userEmail,
  isUnrestricted = false,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
  const ChevronIcon = isAr ? ChevronLeft : ChevronRight;

  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase().trim();
    return projects.filter((p) => {
      const nameAr = (p.project_name_ar || p.project_name || p.name_ar || '').toLowerCase();
      const nameEn = (p.project_name_en || p.name_en || '').toLowerCase();
      const code = (p.project_code || p.code || '').toLowerCase();
      const client = (p.client_name || '').toLowerCase();
      return nameAr.includes(q) || nameEn.includes(q) || code.includes(q) || client.includes(q);
    });
  }, [projects, searchQuery]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label={isAr ? 'جارٍ تحميل المشاريع...' : 'Loading projects...'}>
        <div className="h-10 w-72 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 animate-pulse"
            >
              <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800/60 rounded" />
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state: engineer has no assigned projects
  if (projects.length === 0) {
    return (
      <div
        role="region"
        aria-label={isAr ? 'حالة عدم وجود مشاريع مسندة' : 'No assigned projects state'}
        className="p-10 sm:p-14 text-center rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl mx-auto space-y-5 my-8"
      >
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800/60 shadow-sm">
          <FolderLock className="w-8 h-8" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {isAr ? 'لم يتم تعيينك على أي مشروع حالياً' : 'No Assigned Projects Found'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
            {isAr
              ? 'طبقاً لقواعد حوكمة المشروعات، تظهر لك فقط المشاريع التي أُدرجت رسمياً في فريق عملها. يرجى التواصل مع مدير المشروع أو مدير المكتب الفني لربط حسابك بالمشروع.'
              : 'Per project governance rules, you can only view projects you are officially staffed on. Please contact your Project Manager or Technical Office Manager to assign you to a project team.'}
          </p>
        </div>
        {(userFullName || userEmail) && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono">
            <span>{userFullName || userEmail}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="space-y-6" aria-label={isAr ? 'قائمة المشاريع المسندة' : 'Assigned projects list'}>
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'مشاريعي المسندة' : 'My Assigned Projects'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              {projects.length} {isAr ? 'مشروع' : 'Projects'}
            </span>
            {isUnrestricted && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {isAr ? 'صلاحية إشراف عام' : 'All Projects Access'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isAr
              ? 'اختر المشروع لفتح مساحة عمل المكتب الفني ومتابعة المخططات التنفيذية والاعتمادات الفنية.'
              : 'Select a project to access its Technical Office workspace and track deliverables (E1 & E2).'}
          </p>
        </div>

        {/* Search Input */}
        {projects.length > 2 && (
          <div className="relative w-full sm:w-72">
            <label htmlFor="search-assigned-projects" className="sr-only">
              {isAr ? 'البحث في المشاريع المسندة' : 'Search my projects'}
            </label>
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="search-assigned-projects"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'البحث باسم المشروع أو الرمز...' : 'Search by name or code...'}
              className="w-full ps-9 pe-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus-visible:ring-2 focus-visible:ring-teal-500 transition-all"
            />
          </div>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((project) => {
          const nameAr = project.project_name_ar || project.project_name || project.name_ar || (isAr ? 'مشروع غير مسمى' : 'Unnamed Project');
          const nameEn = project.project_name_en || project.name_en;
          const code = project.project_code || project.code || 'PRJ';
          const client = project.client_name;

          return (
            <div
              key={project.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectProject(project.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectProject(project.id);
                }
              }}
              className="group relative p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-teal-500/80 dark:hover:border-teal-400/80 shadow-sm hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              {/* Top Row: Code Pill & Icon */}
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  #{code}
                </span>

                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200/50 dark:border-teal-800/50 group-hover:scale-105 group-hover:bg-teal-600 group-hover:text-white transition-all">
                  <Building2 className="w-4 h-4" aria-hidden="true" />
                </div>
              </div>

              {/* Middle: Stacked Bilingual Project Name */}
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1" dir="rtl">
                  {nameAr}
                </h3>
                {nameEn && (
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-1" dir="ltr">
                    {nameEn}
                  </p>
                )}
              </div>

              {/* Client / Location Info */}
              {client && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 pt-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  <span className="line-clamp-1">{client}</span>
                </div>
              )}

              {/* Bottom Action Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1 group-hover:underline">
                  <span>{isAr ? 'فتح مساحة العمل الهندسية' : 'Open Workspace'}</span>
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectProject(project.id);
                  }}
                  className="cursor-pointer min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs shadow-sm hover:shadow-md shadow-teal-600/20 flex items-center justify-center gap-1.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                  aria-label={isAr ? `دخول مساحة عمل مشروع ${nameAr}` : `Open workspace for project ${nameAr}`}
                >
                  <span>{isAr ? 'دخول' : 'Enter'}</span>
                  <ArrowIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
