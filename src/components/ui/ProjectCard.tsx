import React from 'react';
import { Project } from '@/types';
import { StatusBadge } from './StatusBadge';
import { UiverseRevealButton } from './UiverseRevealButton';
import { Building2, MapPin, Droplets, ArrowUpRight, Edit3, FileCheck, AlertCircle, Award, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/lib/stores/useAuthStore';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useFavoriteProjects } from '@/lib/hooks/useFavoriteProjects';
import { hasTocCertificate } from '@/lib/utils/retention-bond-tracking.utils';
import { ProjectBilingualNameCell } from '../projects/ProjectBilingualNameCell';

interface ProjectCardProps {
  project: Project;
  lang?: 'ar' | 'en';
  onClientClick?: (clientVal: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (projectId: string) => void;
}

// Detect water scope from project name
function detectScope(name: string, isAr: boolean = true): { label: string; color: string } {
  const n = name.toLowerCase();
  if (n.includes('بحيرة') || n.includes('lagoon') || n.includes('lake')) {
    return {
      label: isAr ? 'بحيرة' : 'Lagoon',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
    };
  }
  if (n.includes('نافورة') || n.includes('fountain')) {
    return {
      label: isAr ? 'نافورة' : 'Fountain',
      color: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/30'
    };
  }
  if (n.includes('سبا') || n.includes('spa')) {
    return {
      label: isAr ? 'سبا / جاكوزي' : 'Spa / Jacuzzi',
      color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30'
    };
  }
  if (n.includes('معلم مائي') || n.includes('water feature')) {
    return {
      label: isAr ? 'معلم مائي' : 'Water Feature',
      color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30'
    };
  }
  if (n.includes('استشارات') || n.includes('consulting')) {
    return {
      label: isAr ? 'استشارات' : 'Consulting',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
    };
  }
  return {
    label: isAr ? 'حمام سباحة' : 'Swimming Pool',
    color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
  };
}

function HardcopyBadge({ status, isAr = true }: { status?: string; isAr?: boolean }) {
  if (!status) return null;
  const isAvailable = status.includes('موجود') && !status.includes('غير');
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
        isAvailable
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
      }`}
    >
      {isAvailable ? <FileCheck className="w-3 h-3 shrink-0" /> : <AlertCircle className="w-3 h-3 shrink-0" />}
      {isAvailable
        ? (isAr ? 'العقد موجود' : 'Contract Available')
        : (isAr ? 'العقد غير موجود' : 'Contract Missing')}
    </span>
  );
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  lang,
  onClientClick,
  isFavorite: propIsFavorite,
  onToggleFavorite,
}) => {
  const { locale } = useLanguage();
  const { user } = useAuth();
  const { roles, isAdmin } = useUserRoles();
  const canEditProject =
    isAdmin ||
    (roles || []).some((r) =>
      ['admin', 'ceo', 'coo', 'commercial_manager', 'planning_manager', 'project_manager'].includes(
        String(r).toLowerCase()
      )
    );
  const activeLang = lang || locale || 'ar';
  const isAr = activeLang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';

  const { isFavorite: checkIsFavorite, toggleFavorite } = useFavoriteProjects(
    user?.id,
    user?.user_metadata?.favorite_project_ids
  );
  const resolvedIsFavorite =
    typeof propIsFavorite === 'boolean' ? propIsFavorite : checkIsFavorite(project.id);

  const handleFavoriteClick = () => {
    if (onToggleFavorite) {
      onToggleFavorite(project.id);
    } else {
      const label = project.project_code ? `#${project.project_code}` : project.project_name;
      toggleFavorite(project.id, label, isAr);
    }
  };
  
  // Robust contract value resolution matching DataTable and ProjectService
  const contractVal = Number(
    project.total_contract_value ||
    project.contract_value_egp ||
    project.contract_value ||
    project.total_value_with_vat_egp ||
    0
  );
  const vosVal = Number(project.vos_value || 0);

  const formattedContract = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(contractVal);

  const scope = detectScope(project.project_name || '', isAr);

  const roleLabel = (project.pzone_role || '').toLowerCase().includes('sub')
    ? (isAr ? 'مقاول باطن' : 'Sub Contractor')
    : (project.pzone_role ? (isAr ? 'مقاول عام' : 'Main Contractor') : null);

  const clientName = project.client?.name_ar || project.client_name_raw || (isAr ? 'عميل مباشر' : 'Direct Client');

  const rawPct = Number(project.completion_pct || 0);
  const pct = Math.max(0, Math.min(100, Math.round(isNaN(rawPct) ? 0 : rawPct)));

  // Progress color coding & status semantics
  const getProgressGradient = () => {
    if (project.status === 'finished') return 'from-emerald-500 to-teal-500';
    if (project.status === 'handing_over') return 'from-teal-500 to-emerald-500';
    if (project.status === 'on_hold') return 'from-amber-500 to-amber-600';
    if (project.status === 'cancelled') return 'from-rose-500 to-rose-600';
    if (project.status === 'tender') return 'from-indigo-500 to-blue-500';
    if (project.status === 'not_started' || pct === 0) return 'from-slate-400 to-slate-500 dark:from-slate-600 dark:to-slate-700';
    if (pct >= 80) return 'from-emerald-500 to-teal-500';
    if (pct >= 50) return 'from-sky-500 to-cyan-500';
    if (pct >= 20) return 'from-amber-500 to-orange-500';
    return 'from-slate-400 to-sky-500';
  };

  const getProgressTextColor = () => {
    if (project.status === 'finished') return 'text-emerald-700 dark:text-emerald-400';
    if (project.status === 'handing_over') return 'text-teal-700 dark:text-teal-400';
    if (project.status === 'on_hold') return 'text-amber-700 dark:text-amber-400';
    if (project.status === 'cancelled') return 'text-rose-700 dark:text-rose-400';
    if (project.status === 'tender') return 'text-indigo-700 dark:text-indigo-400';
    if (project.status === 'not_started' || pct === 0) return 'text-slate-500 dark:text-slate-400';
    if (pct >= 80) return 'text-emerald-700 dark:text-emerald-400';
    if (pct >= 50) return 'text-sky-700 dark:text-sky-400';
    if (pct >= 20) return 'text-amber-700 dark:text-amber-400';
    return 'text-slate-600 dark:text-slate-400';
  };

  return (
    <div
      dir={dir}
      data-favorite={resolvedIsFavorite ? 'true' : 'false'}
      className={`glass-card flex flex-col justify-between group hover:border-emerald-500/50 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/15 dark:hover:shadow-emerald-950/50 hover:-translate-y-1.5 transition-all duration-300 ease-out relative overflow-hidden bg-white/95 dark:bg-slate-900/95 border rounded-2xl ${
        resolvedIsFavorite
          ? 'border-amber-400/90 dark:border-amber-500/70 ring-1 ring-amber-400/30'
          : 'border-slate-200/90 dark:border-slate-800'
      }`}
    >
      {/* Top accent gradient bar (mirrored in RTL) */}
      <div
        className={`absolute top-0 end-0 start-0 h-1.5 bg-gradient-to-r rtl:bg-gradient-to-l ${
          resolvedIsFavorite
            ? 'from-amber-400 via-yellow-400 to-emerald-500 opacity-100'
            : 'from-emerald-500 via-teal-500 to-purple-600 opacity-70'
        } group-hover:opacity-100 group-hover:h-2 transition-all duration-300`}
      />

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Row 1: Code + Scope + Status */}
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-900/80 shadow-2xs">
                <bdi dir="ltr">#{project.project_code}</bdi>
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${scope.color}`}>
                {scope.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <UiverseRevealButton
                size="sm"
                active={resolvedIsFavorite}
                onClick={handleFavoriteClick}
                label={
                  resolvedIsFavorite
                    ? (isAr ? 'مفضل' : 'Saved')
                    : (isAr ? 'تفضيل' : 'Star')
                }
                color="yellow"
                ariaLabel={
                  resolvedIsFavorite
                    ? (isAr ? `إزالة المشروع ${project.project_code} من المفضلة` : `Remove project ${project.project_code} from favorites`)
                    : (isAr ? `إضافة المشروع ${project.project_code} للمفضلة` : `Add project ${project.project_code} to favorites`)
                }
                title={
                  resolvedIsFavorite
                    ? (isAr ? 'إزالة من المفضلة' : 'Remove from Favorites')
                    : (isAr ? 'إضافة للمفضلة' : 'Add to Favorites')
                }
              />
              <StatusBadge status={project.status} lang={activeLang} size="sm" />
              {(project.status === 'finished' || project.status === 'handing_over') && (
                hasTocCertificate(project) ? (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60"
                    title={project.toc_letter || (isAr ? 'شهادة استلام ابتدائي معتمدة (TOC)' : 'TOC Approved')}
                  >
                    <Award className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{isAr ? 'TOC معتمد' : 'TOC'}</span>
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300/60 animate-pulse"
                    title={isAr ? 'المشروع بدون محضر استلام ابتدائي (TOC)' : 'Missing Taking-Over Certificate'}
                  >
                    <AlertTriangle className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" />
                    <span>{isAr ? 'بدون TOC' : 'No TOC'}</span>
                  </span>
                )
              )}
            </div>
          </div>

          {/* Title */}
          <div className="min-h-[3rem] mb-3">
            <ProjectBilingualNameCell
              project={project}
              href={`/projects/${project.id}`}
              className="leading-snug"
              linkClassName="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg group/link"
              title={isAr ? `عرض تفاصيل المشروع: ${project.project_name}` : `View project details: ${project.project_name}`}
            />
          </div>

          {/* Client & Role row */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200/60 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                const target = project.client?.id || project.client_id || project.client?.name_ar || project.client_name_raw;
                if (target) onClientClick?.(target);
              }}
              className="flex items-center gap-1.5 truncate max-w-[65%] text-start hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-400 group/cli cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg min-h-[36px] py-1 px-1 -mx-1"
              title={isAr ? 'تصفية المفكّرة بحسب هذا العميل' : 'Filter by this client'}
              aria-label={isAr ? `تصفية المشاريع بحسب العميل: ${clientName}` : `Filter projects by client: ${clientName}`}
            >
              <Building2 className="w-3.5 h-3.5 text-slate-400 group-hover/cli:text-emerald-500 shrink-0" aria-hidden="true" />
              <span dir="auto" className="truncate text-xs font-bold text-slate-700 dark:text-slate-300 group-hover/cli:text-emerald-700 dark:group-hover/cli:text-emerald-400 group-hover/cli:underline">
                {clientName}
              </span>
            </button>
            {roleLabel && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0 border border-slate-200/70 dark:border-slate-700">
                {roleLabel}
              </span>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="my-3 grid grid-cols-2 gap-2.5">
            {/* Contract Value */}
            <div className="bg-slate-50/90 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/80 transition-colors">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                {isAr ? 'قيمة العقد' : 'Contract Value'}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-mono tabular-nums block">
                  {contractVal > 0 ? formattedContract : <span className="text-slate-400 font-normal">—</span>}
                </span>
                {contractVal > 0 && (
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {isAr ? 'ج.م' : 'EGP'}
                  </span>
                )}
              </div>
              {vosVal > 0 && (
                <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 block mt-0.5 font-mono tabular-nums" dir={isAr ? 'rtl' : 'ltr'}>
                  <bdi dir="ltr">+ VOs {vosVal.toLocaleString('en-US')}</bdi> {isAr ? 'ج.م' : 'EGP'}
                </span>
              )}
            </div>

            {/* Water Area */}
            <div className="bg-slate-50/90 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/80 transition-colors">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                {isAr ? 'مسطح المياه' : 'Water Area'}
              </span>
              <div className="flex items-center gap-1 font-black text-cyan-700 dark:text-cyan-400">
                <Droplets className="w-3.5 h-3.5 shrink-0 text-cyan-500" aria-hidden="true" />
                <span className="font-mono text-xs sm:text-sm tabular-nums">
                  {Number(project.water_area_m2 || 0) > 0
                    ? `${Number(project.water_area_m2).toLocaleString('en-US')}`
                    : <span className="text-slate-400 font-normal">—</span>}
                </span>
                {Number(project.water_area_m2 || 0) > 0 && (
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {isAr ? 'م²' : 'm²'}
                  </span>
                )}
              </div>
              {Number(project.water_vol_m3 || 0) > 0 && (
                <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5 font-mono tabular-nums">
                  {isAr ? 'حجم:' : 'Vol:'} {Number(project.water_vol_m3).toLocaleString('en-US')} {isAr ? 'م³' : 'm³'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div>
          {/* Always Visible Progress Bar — prevents ragged card height in grid */}
          <div className="mb-3 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-500 dark:text-slate-400">
                {isAr ? 'نسبة الإنجاز' : 'Progress'}
              </span>
              <span className={`font-mono font-bold tabular-nums ${getProgressTextColor()}`}>
                {pct > 0 ? `${pct}%` : (isAr ? 'لم يبدأ (0%)' : '0%')}
              </span>
            </div>
            <div
              className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden ring-1 ring-slate-200/50 dark:ring-slate-700/50"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={isAr ? `نسبة إنجاز المشروع ${pct}%` : `Project progress ${pct}%`}
            >
              <div
                className={`h-full rounded-full bg-gradient-to-r rtl:bg-gradient-to-l ${getProgressGradient()} transition-all duration-500 ease-out`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Hardcopy / Contract doc status */}
          {(project as any).hardcopy_status && (
            <div className="mb-2">
              <HardcopyBadge status={(project as any).hardcopy_status} isAr={isAr} />
            </div>
          )}
        </div>
      </div>

      {/* Footer with ergonomic touch targets & mirrored navigation arrow */}
      <div className="px-5 py-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-50/70 dark:bg-slate-900/70">
        <div className="flex items-center gap-1.5 truncate max-w-[55%]">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span dir="auto" className="truncate text-[11px] font-medium text-slate-600 dark:text-slate-300" title={project.site_location_address || project.location || (project as any).governorate_name_ar || ''}>
            {project.site_location_address || project.location || (project as any).governorate_name_ar || '—'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {canEditProject && (
            <Link
              href={`/projects/${project.id}/edit`}
              className="min-w-[44px] min-h-[44px] rounded-xl text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              title={isAr ? 'تعديل المشروع' : 'Edit Project'}
              aria-label={isAr ? `تعديل مشروع ${project.project_name}` : `Edit project ${project.project_name}`}
            >
              <Edit3 className="w-4 h-4" aria-hidden="true" />
            </Link>
          )}
          <Link
            href={`/projects/${project.id}`}
            className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs transition-colors flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-2xs border border-emerald-200/60 dark:border-emerald-800/60 group/details"
            aria-label={isAr ? `عرض تفاصيل مشروع ${project.project_name}` : `View details for project ${project.project_name}`}
          >
            <span>{isAr ? 'التفاصيل' : 'Details'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 rtl:-scale-x-100 transition-transform group-hover/details:translate-x-0.5 rtl:group-hover/details:-translate-x-0.5 group-hover/details:-translate-y-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
};
