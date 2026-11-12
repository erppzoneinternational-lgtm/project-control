'use client';
import { useUserRoles } from '@/lib/hooks/useUserRoles';


import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  RefreshCw, 
  HardHat,
  X
} from 'lucide-react';
import { SubcontractorTarget, SubcontractorProductivityMetric } from '@/types/planning';
import { BoqItem } from '@/types/boq';
import { StakeholderFull } from '@/types';
import { SubcontractorService } from '@/lib/services/subcontractor.service';
import { BoqService } from '@/lib/services/boq.service';
import { ProjectService } from '@/lib/services/project.service';
import { logger } from '@/lib/logger';

interface SubcontractorProductivityTableProps {
  projectId: string;
  projectName?: string;
  isAr?: boolean;
}

export const SubcontractorProductivityTable: React.FC<SubcontractorProductivityTableProps> = ({
  projectId,
  projectName: _projectName,
  isAr = true,
}) => {
  const t = useMemo(() => ({
    totalTracked: isAr ? 'إجمالي مقاولي الباطن المتابعين' : 'Total Tracked Subcontractors',
    avgAchievement: isAr ? 'متوسط نسبة تحقيق المستهدفات' : 'Average Target Achievement',
    underperformingAlerts: isAr ? 'إنذارات تراجع الإنجاز (أقل من 70%)' : 'Underperformance Alerts (< 70%)',
    allSubs: isAr ? 'جميع مقاولي الباطن' : 'All Subcontractors',
    fromDate: isAr ? 'من تاريخ' : 'From Date',
    toDate: isAr ? 'إلى تاريخ' : 'To Date',
    to: isAr ? 'إلى' : 'to',
    alertsOnly: isAr ? 'تنبيهات انخفاض الإنجاز فقط (< 70%)' : 'Alerts Only (< 70%)',
    newTargetBtn: isAr ? 'تحديد مستهدف إنتاجي جديد' : 'New Productivity Target',
    refreshData: isAr ? 'تحديث البيانات' : 'Refresh Data',
    loading: isAr ? 'جاري حساب إنتاجية المقاولين ومطابقة اليوميات...' : 'Calculating subcontractor productivity & reconciling logs...',
    emptyTitle: isAr ? 'لا توجد مستهدفات إنتاجية مسجلة في هذا النطاق' : 'No productivity targets recorded in this range',
    emptyDesc: isAr ? 'اضغط على «تحديد مستهدف إنتاجي جديد» لتعيين خطة عمل مقاولي الباطن' : 'Click "New Productivity Target" to set plans for subcontractors',
    thSubcontractor: isAr ? 'المقاول / الجهة المنفذة' : 'Subcontractor / Executing Party',
    thBoq: isAr ? 'بند جدول الكميات المرتبط' : 'Related BOQ Item',
    thTargetQty: isAr ? 'الكمية المستهدفة' : 'Target Quantity',
    thActualQty: isAr ? 'الكمية المنفذة فعلياً' : 'Actual Executed Quantity',
    thAchievement: isAr ? 'نسبة الإنجاز' : 'Achievement Rate',
    thStatus: isAr ? 'حالة الأداء والتنبيه' : 'Performance Status',
    thManpower: isAr ? 'حجم العمالة الميدانية' : 'Workforce (Manpower)',
    generalProjectTarget: isAr ? 'مستهدف عام للمشروع' : 'General Project Target',
    alertBelowTarget: isAr ? 'إنذار: أداء متراجع دون المستهدف' : 'Alert: Below Target',
    targetMet: isAr ? 'أداء منتظم ومتوافق مع الخطة' : 'Target Met / Compliant',
    workerUnit: isAr ? 'عامل' : 'workers',
    modalTitle: isAr ? 'تحديد مستهدف إنتاجي لمقاول باطن' : 'Set Subcontractor Productivity Target',
    modalSubtitle: isAr ? 'ربط مقاول الباطن بالكمية المستهدفة والجدول الزمني' : 'Link subcontractor with target quantity and schedule',
    selectSubPlaceholder: isAr ? '-- اختر مقاول الباطن --' : '-- Select Subcontractor --',
    subcontractorLabel: isAr ? 'المقاول المسؤول' : 'Responsible Subcontractor',
    boqLabel: isAr ? 'بند جدول الكميات المرتبط' : 'Related BOQ Item',
    boqOptionalPlaceholder: isAr ? '-- اختياري: مستهدف عام للمشروع ككل --' : '-- Optional: General Project Target --',
    targetQtyLabel: isAr ? 'الكمية المستهدفة' : 'Target Quantity',
    unitLabel: isAr ? 'الوحدة' : 'Unit',
    targetDateLabel: isAr ? 'تاريخ استحقاق المستهدف' : 'Target Due Date',
    cancel: isAr ? 'إلغاء' : 'Cancel',
    saveTarget: isAr ? 'تثبيت المستهدف' : 'Save Target',
    saving: isAr ? 'جاري الحفظ...' : 'Saving...',
    validationError: isAr ? 'يرجى تحديد المقاول والكمية المستهدفة.' : 'Please specify subcontractor and target quantity.',
    saveError: isAr ? 'فشل حفظ المستهدف.' : 'Failed to save target.',
    defaultUnit: isAr ? 'م³' : 'm³',
    closeModal: isAr ? 'إغلاق' : 'Close',
  }), [isAr]);
  const { roles, isAdmin } = useUserRoles();
  const [metrics, setMetrics] = useState<SubcontractorProductivityMetric[]>([]);
  const [, setTargets] = useState<SubcontractorTarget[]>([]);
  const [boqItems, setBoqItems] = useState<BoqItem[]>([]);
  const [subcontractors, setSubcontractors] = useState<StakeholderFull[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedSub, setSelectedSub] = useState<string>('all');
  const [periodStart, setPeriodStart] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');
  const [onlyUnderperforming, setOnlyUnderperforming] = useState(false);

  // Add Target Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [targetForm, setTargetForm] = useState<Partial<SubcontractorTarget>>({
    subcontractor_id: '',
    boq_item_id: '',
    target_qty: 0,
    target_date: new Date().toISOString().slice(0, 10),
    unit: isAr ? 'م³' : 'm³',
    notes: '',
  });
  const [savingTarget, setSavingTarget] = useState(false);
  const [targetError, setTargetError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [prodMetrics, rawTargets, boq, stks] = await Promise.all([
        SubcontractorService.getSubcontractorProductivity(projectId, periodStart, periodEnd),
        SubcontractorService.getSubcontractorTargets(projectId),
        BoqService.getBoqItems(projectId, true, { userRoles: roles, isAdmin }),
        ProjectService.getStakeholdersDirectory({ kind: 'vendor_rep' }),
      ]);
      setMetrics(prodMetrics);
      setTargets(rawTargets);
      setBoqItems(boq);
      setSubcontractors(stks);
    } catch (err) {
      logger.error('Failed to load subcontractor productivity', { detail: err });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId, periodStart, periodEnd]);

  // Filtered metrics
  const filteredMetrics = useMemo(() => {
    return metrics.filter((m) => {
      if (selectedSub !== 'all' && m.subcontractor_id !== selectedSub) return false;
      if (onlyUnderperforming && !m.is_underperforming) return false;
      return true;
    });
  }, [metrics, selectedSub, onlyUnderperforming]);

  // Aggregate stats
  const totalUnderperforming = useMemo(() => {
    return metrics.filter((m) => m.is_underperforming).length;
  }, [metrics]);

  const avgAchievement = useMemo(() => {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + (m.achievement_pct || 0), 0);
    return Number((sum / metrics.length).toFixed(1));
  }, [metrics]);

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetForm.subcontractor_id || !targetForm.target_qty) {
      setTargetError(t.validationError);
      return;
    }

    setSavingTarget(true);
    setTargetError(null);
    try {
      const payload: Partial<SubcontractorTarget> = {
        ...targetForm,
        project_id: projectId,
        target_qty: Number(targetForm.target_qty),
      };
      const result = await SubcontractorService.saveSubcontractorTarget(payload);
      if (result) {
        setIsAddOpen(false);
        setTargetForm({
          subcontractor_id: '',
          boq_item_id: '',
          target_qty: 0,
          target_date: new Date().toISOString().slice(0, 10),
          unit: t.defaultUnit,
          notes: '',
        });
        fetchData();
      }
    } catch (err) {
      logger.error('Failed to save subcontractor target', { detail: err });
      setTargetError((err as Error).message || t.saveError);
    } finally {
      setSavingTarget(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t.totalTracked}
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {metrics.length}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t.avgAchievement}
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <span>{avgAchievement}%</span>
              {avgAchievement >= 70 ? (
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-rose-500" />
              )}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
            <HardHat className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t.underperformingAlerts}
            </div>
            <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
              {totalUnderperforming}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Subcontractor filter */}
          <select
            value={selectedSub}
            onChange={(e) => setSelectedSub(e.target.value)}
            className="px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent transition-all shadow-xs"
          >
            <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{t.allSubs}</option>
            {subcontractors.map((s) => (
              <option key={s.id} value={s.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                {isAr ? (s.name_ar || s.name_en) : (s.name_en || s.name_ar)} {s.organization_name ? `(${s.organization_name})` : ''}
              </option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent transition-all shadow-xs"
              title={t.fromDate}
            />
            <span className="text-xs text-slate-400 dark:text-slate-500">{t.to}</span>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent transition-all shadow-xs"
              title={t.toDate}
            />
          </div>

          {/* Underperforming Toggle */}
          <label className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 hover:bg-rose-100/70 dark:hover:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800/80 text-xs font-bold text-rose-700 dark:text-rose-300 cursor-pointer transition-all focus-within:ring-2 focus-within:ring-rose-500 shadow-xs">
            <input
              type="checkbox"
              checked={onlyUnderperforming}
              onChange={(e) => setOnlyUnderperforming(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500"
            />
            <span>{t.alertsOnly}</span>
          </label>

          <button
            onClick={fetchData}
            disabled={loading}
            title={t.refreshData}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95 transition-all shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-emerald-700/20 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <Plus className="w-4 h-4" />
          <span>{t.newTargetBtn}</span>
        </button>
      </div>

      {/* Productivity Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-slate-400 dark:text-slate-500 space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
            <span className="text-xs">{t.loading}</span>
          </div>
        ) : filteredMetrics.length === 0 ? (
          <div className="py-20 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 m-6 rounded-3xl space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.emptyTitle}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {t.emptyDesc}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                <tr>
                  <th className="p-3.5 text-start">{t.thSubcontractor}</th>
                  <th className="p-3.5 text-start">{t.thBoq}</th>
                  <th className="p-3.5 text-center">{t.thTargetQty}</th>
                  <th className="p-3.5 text-center">{t.thActualQty}</th>
                  <th className="p-3.5 text-center">{t.thAchievement}</th>
                  <th className="p-3.5 text-center">{t.thStatus}</th>
                  <th className="p-3.5 text-center">{t.thManpower}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredMetrics.map((m, idx) => {
                  const subStk = subcontractors.find((s) => s.id === m.subcontractor_id);
                  const boq = boqItems.find((b) => b.id === m.boq_item_id);
                  return (
                    <tr 
                      key={idx} 
                      className={`transition-colors duration-150 ${
                        m.is_underperforming 
                          ? 'bg-rose-50/25 dark:bg-rose-950/15 hover:bg-rose-50/50 dark:hover:bg-rose-950/30' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <HardHat className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>{isAr ? (subStk?.name_ar || m.subcontractor_name || m.subcontractor_id) : (subStk?.name_en || m.subcontractor_name || m.subcontractor_id)}</span>
                        </div>
                        {subStk?.organization_name && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal ps-6">
                            {subStk.organization_name}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 max-w-xs truncate">
                        {boq ? (
                          <div>
                            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 pe-1.5">
                              {boq.item_code}
                            </span>
                            <span className="text-slate-600 dark:text-slate-300 truncate">
                              {isAr ? boq.description_ar : (boq.description_en || boq.description_ar)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 font-medium">{t.generalProjectTarget}</span>
                        )}
                      </td>

                      <td className="p-3.5 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {m.target_qty.toLocaleString()} {m.unit || t.defaultUnit}
                      </td>

                      <td className="p-3.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {m.actual_qty.toLocaleString()} {m.unit || t.defaultUnit}
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-2.5 min-w-[130px]">
                          <div className="w-24 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ease-out ${
                                m.achievement_pct >= 100
                                  ? 'bg-gradient-to-r from-emerald-600 to-teal-400'
                                  : m.achievement_pct >= 70
                                  ? 'bg-gradient-to-r from-blue-600 to-cyan-400'
                                  : 'bg-gradient-to-r from-rose-600 to-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, m.achievement_pct))}%` }}
                            />
                          </div>
                          <span className={`font-mono font-bold text-xs tabular-nums ${
                            m.achievement_pct >= 70 ? 'text-slate-800 dark:text-slate-200' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {m.achievement_pct}%
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 text-center whitespace-nowrap">
                        {m.is_underperforming ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-xs">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>{t.alertBelowTarget}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{t.targetMet}</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center font-mono text-slate-500 dark:text-slate-400">
                        {m.manpower ? `${m.manpower} ${t.workerUnit}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Target Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-500/20">
                  <HardHat className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t.modalTitle}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.modalSubtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                title={t.closeModal}
                className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTarget} className="p-6 space-y-4">
              {targetError && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{targetError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.subcontractorLabel} <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={targetForm.subcontractor_id}
                  onChange={(e) => setTargetForm({ ...targetForm, subcontractor_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all shadow-xs"
                >
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{t.selectSubPlaceholder}</option>
                  {subcontractors.map((s) => (
                    <option key={s.id} value={s.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      {isAr ? (s.name_ar || s.name_en) : (s.name_en || s.name_ar)} {s.organization_name ? `(${s.organization_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.boqLabel}
                </label>
                <select
                  value={targetForm.boq_item_id || ''}
                  onChange={(e) => {
                    const item = boqItems.find((b) => b.id === e.target.value);
                    setTargetForm({
                      ...targetForm,
                      boq_item_id: e.target.value,
                      unit: item?.unit || targetForm.unit,
                    });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all shadow-xs"
                >
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{t.boqOptionalPlaceholder}</option>
                  {boqItems.map((b) => (
                    <option key={b.id} value={b.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      {b.item_code} - {isAr ? b.description_ar : (b.description_en || b.description_ar)} ({b.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.targetQtyLabel} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={targetForm.target_qty || ''}
                    onChange={(e) => setTargetForm({ ...targetForm, target_qty: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.unitLabel}
                  </label>
                  <input
                    type="text"
                    value={targetForm.unit || ''}
                    onChange={(e) => setTargetForm({ ...targetForm, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.targetDateLabel}
                </label>
                <input
                  type="date"
                  value={targetForm.target_date || ''}
                  onChange={(e) => setTargetForm({ ...targetForm, target_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition-all"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={savingTarget}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md shadow-emerald-700/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{savingTarget ? t.saving : t.saveTarget}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
