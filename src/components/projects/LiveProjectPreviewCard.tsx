'use client';

import React from 'react';
import {
  Building2,
  Calendar,
  DollarSign,
  Droplets,
  Layers,
  MapPin,
  TrendingUp,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  PZONE_WATER_SCOPES,
  doesScopeRequireSurfaceArea,
  ProjectSectionStatus,
} from '@/lib/utils/project-creation.utils';

interface LiveProjectPreviewCardProps {
  formData: {
    project_code: string;
    project_name: string;
    project_name_en: string;
    public_name?: string;
    client_id: string;
    pzone_role: string;
    governorate_id: string;
    city_id: string;
    site_location_address: string;
    water_area_m2: number;
    water_vol_m3: number;
    planned_start_date: string;
    planned_finish_date: string;
    contract_date: string;
    contract_value: number;
    vos_value: number;
    estimated_budget: number;
    estimated_cost: number;
    project_manager_name_raw: string;
    project_manager_code?: string;
    status: string;
    metadata: Record<string, any>;
  };
  clientName?: string;
  ownerName?: string;
  governorateName?: string;
  cityName?: string;
  currentStep: number;
  onJumpToStep?: (step: number) => void;
  sectionStatuses?: Record<number, ProjectSectionStatus>;
  grossMargin: {
    marginEgp: number;
    marginPct: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  vatBreakdown: {
    netValue: number;
    vatAmount: number;
    totalWithVat: number;
  };
  durationDays: number;
  durationMonths: number;
  isAr?: boolean;
}

export const LiveProjectPreviewCard: React.FC<LiveProjectPreviewCardProps> = ({
  formData,
  clientName,
  ownerName,
  governorateName,
  cityName,
  currentStep,
  onJumpToStep,
  sectionStatuses,
  grossMargin,
  vatBreakdown,
  durationDays,
  durationMonths,
  isAr = true,
}) => {
  const selectedScopes = (formData.metadata?.water_features || []) as string[];
  const activeScopeItems = PZONE_WATER_SCOPES.filter((s) => selectedScopes.includes(s.id));
  const needsSurfaceArea = doesScopeRequireSurfaceArea(selectedScopes);

  // Compute completion percentage accurately across all 6 sections
  let completedFields = 0;
  if (formData.project_name.trim() && formData.project_code.trim()) completedFields++;
  if (formData.client_id) completedFields++;
  if (formData.governorate_id) completedFields++;
  if (selectedScopes.length > 0 && (!needsSurfaceArea || formData.water_area_m2 > 0)) completedFields++;
  if (formData.planned_start_date && formData.planned_finish_date) completedFields++;
  if (formData.status === 'tender' || formData.contract_value > 0) completedFields++;
  const completionPct = Math.round((completedFields / 6) * 100);

  const formatCurrency = (val: number) => {
    const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val || 0);
    return isAr ? `${formatted} ج.م` : `${formatted} EGP`;
  };

  const roleLabel = () => {
    if (formData.pzone_role === 'Main Contractor') {
      return isAr ? 'مقاول رئيسي' : 'Main Contractor';
    }
    if (formData.pzone_role === 'Sub Contractor' || formData.pzone_role === 'Subcontractor' || formData.pzone_role === 'sub_contractor') {
      return isAr ? 'مقاول باطن' : 'Sub Contractor';
    }
    return formData.pzone_role || (isAr ? 'مقاول' : 'Contractor');
  };

  const durationText = () => {
    if (durationDays <= 0) {
      return isAr ? 'لم تُحدد بعد' : 'Not specified yet';
    }
    if (isAr) {
      return `${durationDays} يوم (حوالي ${durationMonths} شهر)`;
    }
    return `${durationDays} days (~${durationMonths} months)`;
  };

  const sectionShortcuts = [
    { num: 1, label: isAr ? 'تعريف المشروع' : 'Identity' },
    { num: 2, label: isAr ? 'أطراف التعاقد' : 'Parties' },
    { num: 3, label: isAr ? 'الموقع الجغرافي' : 'Location' },
    { num: 4, label: isAr ? 'نطاق الأعمال' : 'Scope' },
    { num: 5, label: isAr ? 'البرنامج الزمني' : 'Schedule' },
    { num: 6, label: isAr ? 'الماليات والمرفقات' : 'Financials' },
  ];

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="sticky top-[224px] rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 p-5 text-slate-900 dark:text-white space-y-4 transition-all duration-300"
    >
      {/* Top Badge & Progress Meter */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
              {isAr ? 'ملخص بطاقة المشروع' : 'Project Summary Card'}
            </div>
            <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-wider" dir="ltr">
              #{formData.project_code || '26XX'}
            </div>
          </div>
        </div>

        {/* Readiness Meter */}
        <div className="text-end">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-1">
            {isAr ? 'نسبة اكتمال البيانات' : 'Completion'}
          </div>
          <div className="flex items-center gap-2 justify-end">
            <div className="w-20 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-500 rounded-full"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
              {completionPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Quick Jump Section Pills */}
      {onJumpToStep && (
        <div className="grid grid-cols-3 gap-1.5">
          {sectionShortcuts.map((sec) => {
            const isActive = currentStep === sec.num;
            const isComplete = sectionStatuses?.[sec.num]?.isRequiredReady;
            return (
              <button
                key={sec.num}
                type="button"
                onClick={() => onJumpToStep(sec.num)}
                className={`flex items-center justify-between gap-1 px-2 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : isComplete
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70 hover:bg-emerald-100/80'
                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/60 hover:border-emerald-400'
                }`}
              >
                <span className="truncate">{sec.label}</span>
                {isComplete && (
                  <CheckCircle2
                    className={`w-3 h-3 shrink-0 ${
                      isActive ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Project Identity Section */}
      <div className="space-y-2">
        <div className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
          {formData.project_name.trim() || (isAr ? 'اسم المشروع يظهر هنا فور كتابته...' : 'Project name will appear here...')}
        </div>
        {formData.project_name_en && (
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium font-sans truncate" dir="ltr">
            {formData.project_name_en}
          </div>
        )}

        <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
          {/* Client Pill */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate max-w-[150px]">{clientName || (isAr ? 'جهة التعاقد لم تُحدد' : 'Client not selected')}</span>
          </span>

          {/* Owner Pill when Subcontractor */}
          {ownerName && ownerName !== clientName && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[140px]">{ownerName}</span>
            </span>
          )}

          {/* Role Pill */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>{roleLabel()}</span>
          </span>

          {/* Location Pill */}
          {(governorateName || cityName) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-[11px] font-bold">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{[governorateName, cityName].filter(Boolean).join(' - ')}</span>
            </span>
          )}
        </div>
      </div>

      {/* Selected Scopes Badges */}
      {activeScopeItems.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
            {isAr ? 'التخصصات المختارة:' : 'Selected Scopes:'}
          </div>
          <div className="flex items-center flex-wrap gap-1.5">
            {activeScopeItems.map((s) => (
              <span
                key={s.id}
                className="px-2.5 py-1 rounded-lg bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/25 text-teal-800 dark:text-teal-300 text-[11px] font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <span>{s.icon}</span>
                <span>{isAr ? s.nameAr : s.nameEn}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        {/* Contract Value */}
        <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5 transition-colors hover:border-emerald-500/30">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{isAr ? 'قيمة التعاقد' : 'Contract Value'}</span>
            </span>
            {formData.metadata?.vat_included && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                {isAr ? '+14% ض.ق.م' : '+14% VAT'}
              </span>
            )}
          </div>
          <div className="text-xs font-black font-mono text-slate-900 dark:text-slate-100 truncate" suppressHydrationWarning>
            {formatCurrency(formData.contract_value + (formData.vos_value || 0))}
          </div>
          {formData.metadata?.vat_included && vatBreakdown.totalWithVat > 0 && (
            <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 truncate" suppressHydrationWarning>
              {isAr ? `شامل الضريبة: ${formatCurrency(vatBreakdown.totalWithVat)}` : `Incl. VAT: ${formatCurrency(vatBreakdown.totalWithVat)}`}
            </div>
          )}
        </div>

        {/* Profit Margin */}
        <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5 transition-colors hover:border-cyan-500/30">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span>{isAr ? 'هامش الربح' : 'Profit Margin'}</span>
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono ${
                grossMargin.status === 'healthy'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                  : grossMargin.status === 'warning'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20'
              }`}
            >
              {grossMargin.marginPct}%
            </span>
          </div>
          <div className="text-xs font-black font-mono text-slate-900 dark:text-slate-100 truncate" suppressHydrationWarning>
            {formatCurrency(grossMargin.marginEgp)}
          </div>
        </div>

        {/* Water Area or Stations Count */}
        {needsSurfaceArea || formData.water_area_m2 > 0 ? (
          <>
            <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5 transition-colors hover:border-cyan-500/30">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span>{isAr ? 'المسطح المائي' : 'Water Surface Area'}</span>
              </div>
              <div className="text-xs font-black font-mono text-slate-900 dark:text-slate-100" suppressHydrationWarning>
                {Number(formData.water_area_m2 || 0).toLocaleString('en-US')} {isAr ? 'م²' : 'm²'}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5 transition-colors hover:border-teal-500/30">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>{isAr ? 'حجم المياه' : 'Water Volume'}</span>
              </div>
              <div className="text-xs font-black font-mono text-teal-700 dark:text-teal-300" suppressHydrationWarning>
                {Number(formData.water_vol_m3 || 0).toLocaleString('en-US')} {isAr ? 'م³' : 'm³'}
              </div>
            </div>
          </>
        ) : (
          <div className="col-span-2 p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
            <div className="text-[11px] text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>{isAr ? 'نطاق محطات وشبكات فنية' : 'Stations & MEP Networks Scope'}</span>
            </div>
            {Number(formData.metadata?.stations_count || 0) > 0 && (
              <span className="text-[11px] font-mono font-bold text-teal-700 dark:text-teal-300">
                {formData.metadata.stations_count} {isAr ? 'وحدة / غرفة' : 'Units'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Schedule & Duration Card */}
      <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
              {isAr ? 'المدة التعاقدية' : 'Contract Duration'}
            </div>
            <div className="text-xs font-black text-purple-700 dark:text-purple-300 font-mono">
              {durationText()}
            </div>
          </div>
        </div>
        {formData.planned_start_date && (
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700/80 flex items-center gap-1" dir="ltr">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{formData.planned_start_date}</span>
          </div>
        )}
      </div>

      {/* Assigned Manager */}
      {formData.project_manager_name_raw && (
        <div className="flex items-center justify-between text-xs px-3.5 py-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-200/80 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
              {formData.project_manager_name_raw}
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            {formData.project_manager_code || (isAr ? 'مدير المشروع' : 'Project Manager')}
          </span>
        </div>
      )}
    </div>
  );
};
