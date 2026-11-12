'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ListOrdered,
  FolderKanban,
  Building2,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';
import TaskControlBoard from '@/components/planning/TaskControlBoard';
import { usePagePermission } from '@/lib/hooks/usePagePermission';
import { BackButton } from '@/components/ui/BackButton';
import { useProjectStore } from '@/lib/stores/useProjectStore';

export default function SiteTasksPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [projects, setProjects] = useState<{ id: string; label: string }[]>([]);
  const { activeProjectId, setActiveProjectId } = useProjectStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId || '');
  const [loading, setLoading] = useState(true);
  const { canView, isLoading: permLoading } = usePagePermission('/planning/site-tasks');

  // Keep local selectedProjectId in sync when activeProjectId changes from store
  useEffect(() => {
    if (activeProjectId && activeProjectId !== selectedProjectId) {
      setSelectedProjectId(activeProjectId);
    }
  }, [activeProjectId, selectedProjectId]);

  const handleProjectChange = (id: string) => {
    setSelectedProjectId(id);
    setActiveProjectId(id);
  };

  if (!permLoading && !canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {isAr ? 'غير مصرح بالدخول' : 'Access Denied'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          {isAr
            ? 'هذه الصفحة مخصصة لمهندسي التخطيط ومدير المشروع والإدارة فقط.'
            : 'This page is restricted to Planning Engineers, Project Managers, and Management.'}
        </p>
        <BackButton label={isAr ? 'الرجوع' : 'Back'} />
      </div>
    );
  }

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('pm_projects_with_manager')
        .select('id, project_code, project_name')
        .is('deleted_at', null)
        .order('project_code');

      if (!isMounted) return;

      const list = (data || []).map((p) => ({
        id: p.id,
        label: `#${p.project_code} — ${p.project_name}`,
      }));
      setProjects(list);

      if (list.length > 0) {
        if (!activeProjectId) {
          const firstId = list[0].id;
          setSelectedProjectId(firstId);
          setActiveProjectId(firstId);
        } else {
          const exists = list.some((p) => p.id === activeProjectId);
          if (!exists) {
            const firstId = list[0].id;
            setSelectedProjectId(firstId);
            setActiveProjectId(firstId);
          } else if (selectedProjectId !== activeProjectId) {
            setSelectedProjectId(activeProjectId);
          }
        }
      }
      setLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [activeProjectId, setActiveProjectId, selectedProjectId]);

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-5 w-full">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 shadow-2xs shrink-0">
            <ListOrdered className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={`text-base sm:text-lg font-black text-slate-900 dark:text-white ${isAr ? 'tracking-normal' : 'tracking-tight'}`}>
                {isAr ? 'لوحة تحكم مهام الموقع وهندسة التنفيذ' : 'Site Tasks & Execution Control'}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isAr ? 'مباشر من الموقع' : 'Site Active'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {isAr
                ? 'إدارة المهام الميدانية وحزم العمل ومراجعات مدير المشروع وفحوصات الجودة الميدانية وسجل التدقيق'
                : 'Accountable task instances, project manager reviews, quality inspections, and immutable audit logs'}
            </p>
          </div>
        </div>

        {/* Project Selector */}
        <div className="w-full md:w-80 shrink-0">
          <label htmlFor="site-task-project-select" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            {isAr ? 'المشروع النشط' : 'Active Project'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-slate-400">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <select
              id="site-task-project-select"
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              aria-label={isAr ? 'اختيار المشروع للتحكم بالمهام' : 'Select project for task control'}
              className="w-full py-2 ps-9 pe-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer shadow-2xs appearance-none"
            >
              {projects.length === 0 && (
                <option value="">{isAr ? 'لا توجد مشاريع متاحة' : 'No projects available'}</option>
              )}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none text-slate-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      {loading ? (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="space-y-4 animate-pulse"
        >
          <div className="sr-only">{isAr ? 'جاري تحميل لوحة المهام...' : 'Loading task board...'}</div>
          {/* Skeleton tabs bar */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            ))}
          </div>
          {/* Skeleton filter bar */}
          <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          {/* Skeleton cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((col) => (
              <div
                key={col}
                className="bg-slate-100/50 dark:bg-slate-900/40 rounded-2xl p-3 border border-slate-200/60 dark:border-slate-800 space-y-3 min-h-[300px]"
              >
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-2/3" />
                <div className="h-28 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-full mt-4" />
                </div>
                <div className="h-24 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !selectedProjectId ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 py-16 px-6 text-center space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <FolderKanban className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {isAr ? 'الرجاء اختيار مشروع لعرض مهام الموقع' : 'Please select a project to display site tasks'}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
            {isAr
              ? 'اختر أحد المشاريع من القائمة المنسدلة بالأعلى لمتابعة خطة العمل التنفيذية وإجراءات الفحص والاعتماد'
              : 'Select a project from the top dropdown to monitor execution plans, inspections, and approvals'}
          </p>
        </div>
      ) : (
        <TaskControlBoard projectId={selectedProjectId} />
      )}
    </div>
  );
}
