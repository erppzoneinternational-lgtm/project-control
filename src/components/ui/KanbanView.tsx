import React from 'react';
import { Project } from '@/types';
import { StatusBadge } from './StatusBadge';
import { Clock, CheckCircle2, XCircle, Eye, Edit, User, AlertTriangle, FileText, FileSpreadsheet, RotateCcw, Plus, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRoles } from '@/lib/hooks/useUserRoles';

interface KanbanViewProps {
  projects: Project[];
  onClientClick?: (clientName: string) => void;
  onPmClick?: (pmName: string) => void;
  onResetFilters?: () => void;
}

interface ColumnConfig {
  id: string;
  title: string;
  icon: React.ElementType;
  bgGradient: string;
  borderColor: string;
  headerBg: string;
  badgeBg: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'tender',
    title: 'مرحلة العطاء (Tender)',
    icon: FileSpreadsheet,
    bgGradient: 'from-indigo-50/40 to-slate-50/60 dark:from-indigo-950/20 dark:to-slate-900/40',
    borderColor: 'border-indigo-500/30 dark:border-indigo-500/20',
    headerBg: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
    badgeBg: 'bg-indigo-600 text-white',
  },
  {
    id: 'working',
    title: 'قيد التنفيذ (Working)',
    icon: Clock,
    bgGradient: 'from-sky-50/40 to-slate-50/60 dark:from-sky-950/20 dark:to-slate-900/40',
    borderColor: 'border-sky-500/30 dark:border-sky-500/20',
    headerBg: 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300',
    badgeBg: 'bg-sky-600 text-white',
  },
  {
    id: 'handing_over',
    title: 'قيد التسليم (Handing Over)',
    icon: Clock,
    bgGradient: 'from-purple-50/40 to-slate-50/60 dark:from-purple-950/20 dark:to-slate-900/40',
    borderColor: 'border-purple-500/30 dark:border-purple-500/20',
    headerBg: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300',
    badgeBg: 'bg-purple-600 text-white',
  },
  {
    id: 'finished',
    title: 'منتهي (Finished)',
    icon: CheckCircle2,
    bgGradient: 'from-emerald-50/40 to-slate-50/60 dark:from-emerald-950/20 dark:to-slate-900/40',
    borderColor: 'border-emerald-500/30 dark:border-emerald-500/20',
    headerBg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    badgeBg: 'bg-emerald-600 text-white',
  },
  {
    id: 'on_hold',
    title: 'موقوف مؤقتاً (On Hold)',
    icon: AlertTriangle,
    bgGradient: 'from-amber-50/40 to-slate-50/60 dark:from-amber-950/20 dark:to-slate-900/40',
    borderColor: 'border-amber-500/30 dark:border-amber-500/20',
    headerBg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
    badgeBg: 'bg-amber-600 text-white',
  },
  {
    id: 'not_started',
    title: 'لم يبدأ (Not Started)',
    icon: FileText,
    bgGradient: 'from-slate-50 to-slate-100/60 dark:from-slate-900/40 dark:to-slate-900/80',
    borderColor: 'border-slate-300 dark:border-slate-700',
    headerBg: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    badgeBg: 'bg-slate-600 text-white',
  },
  {
    id: 'cancelled',
    title: 'ملغي (Cancelled)',
    icon: XCircle,
    bgGradient: 'from-rose-50/40 to-slate-50/60 dark:from-rose-950/20 dark:to-slate-900/40',
    borderColor: 'border-rose-500/30 dark:border-rose-500/20',
    headerBg: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300',
    badgeBg: 'bg-rose-600 text-white',
  },
];

export const KanbanView: React.FC<KanbanViewProps> = ({ projects, onClientClick, onPmClick, onResetFilters }) => {
  const { locale } = useLanguage();
  const { roles, isAdmin } = useUserRoles();
  const canEditProject =
    isAdmin ||
    (roles || []).some((r) =>
      ['admin', 'ceo', 'coo', 'commercial_manager', 'planning_manager', 'project_manager'].includes(
        String(r).toLowerCase()
      )
    );
  const canCreateProject =
    isAdmin ||
    (roles || []).some((r) =>
      ['admin', 'ceo', 'coo', 'commercial_manager', 'planning_manager'].includes(
        String(r).toLowerCase()
      )
    );
  const isAr = locale === 'ar';

  // Overall empty state if projects array is empty
  if (projects.length === 0) {
    return (
      <div
        role="status"
        aria-label={isAr ? 'لوحة كانبان فارغة' : 'Kanban board empty state'}
        className="glass-card p-12 text-center text-slate-400 space-y-4 max-w-lg mx-auto my-8 rounded-2xl border border-slate-200/80 dark:border-slate-800"
      >
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner border border-emerald-200/80 dark:border-emerald-800/80" aria-hidden="true">
          <FolderKanban className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            {isAr ? 'لا توجد مشاريع في لوحة كانبان' : 'No projects on Kanban board'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            {isAr
              ? 'لم يتم العثور على مشاريع مطابقة للفلاتر الحالية. يمكنك إعادة ضبط الفلاتر أو إضافة مشروع جديد للمنظومة.'
              : 'No projects match the current filter criteria. You can reset filters or add a new project to the system.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          {onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none border border-emerald-200 dark:border-emerald-800 cursor-pointer"
              aria-label={isAr ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>{isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}</span>
            </button>
          )}
          {canCreateProject && (
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-purple-600 hover:from-emerald-700 hover:to-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none cursor-pointer"
              aria-label={isAr ? 'إضافة مشروع جديد' : 'Add new project'}
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>{isAr ? 'إضافة مشروع جديد' : 'Add New Project'}</span>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Group projects by exact database status
  const groupedProjects = React.useMemo(() => {
    const map: Record<string, Project[]> = {
      working: [],
      handing_over: [],
      finished: [],
      on_hold: [],
      not_started: [],
      tender: [],
      cancelled: [],
    };

    projects.forEach((p) => {
      const st = p.status || 'working';
      if (map[st]) {
        map[st].push(p);
      } else {
        if (!map[st]) map[st] = [];
        map[st].push(p);
      }
    });

    return map;
  }, [projects]);

  // Core lifecycle stages must always be visible on the board so users have a dedicated lane
  // for every stage in the project pipeline (specifically 'tender' for pre-contract projects),
  // even when a stage currently has 0 projects.
  const CORE_STAGES = React.useMemo(() => new Set(['tender', 'working', 'handing_over', 'finished', 'on_hold']), []);

  const visibleColumns = React.useMemo(() => {
    return COLUMNS.filter((col) => CORE_STAGES.has(col.id) || (groupedProjects[col.id] || []).length > 0);
  }, [groupedProjects, CORE_STAGES]);

  const calcColumnValue = (colProjects: Project[]) => {
    return colProjects.reduce((sum, p) => {
      const val = p.total_contract_value || p.contract_value_egp || p.contract_value || 0;
      const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  };

  const fmtCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const fmtNum = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const activeCols = visibleColumns.length > 0 ? visibleColumns : COLUMNS.slice(0, 3);

  return (
    <div className="w-full overflow-x-auto pb-6 scrollbar-thin">
      <div className="flex gap-5 items-start min-w-max">
        {activeCols.map((col) => {
          const colProjects = groupedProjects[col.id] || [];
          const colTotalVal = calcColumnValue(colProjects);
          const Icon = col.icon;

          return (
            <div
              key={col.id}
              className={`w-[320px] shrink-0 rounded-2xl border ${col.borderColor} bg-gradient-to-b ${col.bgGradient} p-4 shadow-sm space-y-4 min-h-[500px] flex flex-col`}
            >
              {/* Column Header */}
              <div className={`p-3.5 rounded-xl ${col.headerBg} border ${col.borderColor} flex items-center justify-between shadow-xs`}>
                <div className="flex items-center gap-2.5">
                  <Icon className="w-5 h-5" />
                  <h3 className="font-black text-sm">{col.title}</h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black shadow-xs ${col.badgeBg}`}>
                  {colProjects.length}
                </span>
              </div>

            {/* Column Total Subtitle */}
            <div className="px-1 text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/80 pb-2">
              <span>إجمالي قيمة القناة:</span>
              <span className="font-mono font-black text-slate-900 dark:text-white dir-ltr">
                {fmtCurrency(colTotalVal)}
              </span>
            </div>

            {/* Project Cards List inside Column */}
            <div className="space-y-3.5 flex-1 overflow-y-auto pe-0.5">
              {colProjects.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-400 space-y-2.5">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {isAr ? 'لا توجد مشاريع بهذه الحالة' : 'No projects in this stage'}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {isAr ? 'يمكنك تسجيل مشروع جديد بهذه المرحلة' : 'You can register a new project in this stage'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    {canCreateProject && (
                      <Link
                        href={`/projects/new?status=${col.id}`}
                        className="inline-flex items-center gap-1 min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer shadow-xs"
                        aria-label={isAr ? `إضافة مشروع جديد بحالة ${col.title}` : `Add new project in ${col.title}`}
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{isAr ? 'إضافة مشروع جديد' : 'Add Project'}</span>
                      </Link>
                    )}
                    {onResetFilters && (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                        aria-label={isAr ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
                      >
                        <RotateCcw className="w-3 h-3" aria-hidden="true" />
                        <span>{isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                colProjects.map((project) => {
                  const val = project.total_contract_value || project.contract_value_egp || project.contract_value || 0;
                  const numVal = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, '')) || 0;

                  const area = project.water_area_m2 || project.total_water_area_m2 || 0;
                  const numArea = typeof area === 'number' ? area : parseFloat(String(area).replace(/,/g, '')) || 0;

                  const clientName = project.client?.name_ar || project.client_name_raw || '';
                  const pmName = project.pm_full_name || project.project_manager_name_raw || project.project_manager || '';

                  return (
                    <div
                      key={project.id}
                      className="glass-card p-4 rounded-xl space-y-3 hover:shadow-md transition-all duration-200 border border-slate-200/70 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 group"
                    >
                      {/* Top Header: Code & Role */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60">
                          #{project.project_code || project.id}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                          {project.pzone_role === 'main_contractor' || project.pzone_role === 'Main Contractor'
                            ? 'مقاول عام'
                            : 'مقاول باطن'}
                        </span>
                      </div>

                      {/* Title */}
                      <Link
                        href={`/projects/${project.id}`}
                        className="block font-bold text-sm text-slate-900 dark:text-white hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors line-clamp-2 leading-snug"
                      >
                        {project.project_name_ar || project.project_name}
                      </Link>

                      {/* Client Name (Clickable Filter) */}
                      {clientName && (
                        <button
                          type="button"
                          onClick={() => onClientClick && onClientClick(clientName)}
                          className="text-xs text-slate-600 dark:text-slate-300 font-semibold hover:text-emerald-700 dark:hover:text-emerald-400 text-end flex items-center gap-1.5 transition-colors group/client truncate w-full min-h-[44px] py-1 px-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                          title="اضغط للتصفية حسب العميل"
                          aria-label={`تصفية المشاريع بحسب العميل: ${clientName}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                          <span className="truncate group-hover/client:underline">{clientName}</span>
                        </button>
                      )}

                      {/* Project Manager */}
                      {pmName && (
                        <button
                          type="button"
                          onClick={() => onPmClick && onPmClick(pmName)}
                          className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 text-end truncate w-full min-h-[44px] py-1 px-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                          title="اضغط للتصفية حسب مدير المشروع"
                          aria-label={`تصفية المشاريع بحسب مدير المشروع: ${pmName}`}
                        >
                          <User className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{pmName}</span>
                        </button>
                      )}

                      {/* Metrics: Value & Area */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-center">
                        <div className="p-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/40">
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block mb-0.5">
                            قيمة العقد
                          </span>
                          <span className="font-mono text-[11px] font-black text-emerald-700 dark:text-emerald-300 dir-ltr block truncate">
                            {fmtCurrency(numVal)}
                          </span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200/50 dark:border-cyan-900/40">
                          <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-bold block mb-0.5">
                            المسطح المائي
                          </span>
                          <span className="font-mono text-[11px] font-black text-cyan-700 dark:text-cyan-300 block truncate">
                            {fmtNum(numArea)} م²
                          </span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <StatusBadge status={project.status} size="sm" />
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/projects/${project.id}`}
                            className="min-w-[44px] min-h-[44px] rounded-lg text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/50 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            title="عرض التفاصيل"
                            aria-label={`عرض تفاصيل مشروع ${project.project_name_ar || project.project_name}`}
                          >
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          </Link>
                          {canEditProject && (
                            <Link
                              href={`/projects/${project.id}/edit`}
                              className="min-w-[44px] min-h-[44px] rounded-lg text-amber-600 hover:bg-amber-50 dark:bg-amber-950/40 dark:hover:bg-amber-950/50 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                              title={isAr ? 'تعديل' : 'Edit'}
                              aria-label={isAr ? `تعديل مشروع ${project.project_name_ar || project.project_name}` : `Edit project ${project.project_name_ar || project.project_name}`}
                            >
                              <Edit className="w-4 h-4" aria-hidden="true" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
};
