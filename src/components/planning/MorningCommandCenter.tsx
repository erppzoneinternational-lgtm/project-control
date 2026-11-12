'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sun, 
  Radio, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  TrendingDown, 
  FileQuestion, 
  CheckCircle2, 
  ArrowLeft, 
  RefreshCw, 
  BellRing
} from 'lucide-react';
import { MorningCommandCenterSummary } from '@/types/planning';
import { CommandCenterService } from '@/lib/services/commandCenter.service';
import { logger } from '@/lib/logger';

interface MorningCommandCenterProps {
  projectId?: string;
  projectName?: string;
  onNavigateTab?: (tab: string, meta?: unknown) => void;
}

export const MorningCommandCenter: React.FC<MorningCommandCenterProps> = ({
  projectId,
  projectName,
  onNavigateTab,
}) => {
  const [summary, setSummary] = useState<MorningCommandCenterSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      if (projectId) {
        const data = await CommandCenterService.getMorningCommandCenterSummary(projectId);
        setSummary(data);
      } else {
        const data = await CommandCenterService.getPortfolioCommandCenterSummary();
        setSummary(data);
      }
    } catch (err) {
      logger.error('Failed to load morning command center summary', { detail: err });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [projectId]);

  const totalAlertsCount = 
    (summary?.silent_sites_count || 0) +
    (summary?.active_critical_holds_count || 0) +
    (summary?.blocked_deliverables_count || 0) +
    (summary?.overdue_rfis_count || 0) +
    (summary?.underperforming_subcontractors_count || 0);

  const oldestBlocked = summary?.blocked_deliverables?.[0];

  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white p-6 shadow-xl border border-slate-800 space-y-6">
      {/* Header with 60-Second Briefing Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/10">
            <Sun className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>مركز القيادة الصباحي</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  موجز 60 ثانية
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {projectName ? `متابعة استثناءات وتنبيهات مشروع: ${projectName}` : 'لوحة متابعة الاستثناءات الحرجة على مستوى المحفظة بالكامل'}
            </p>
          </div>
        </div>

        {/* Total Alerts Count Pill & Refresh */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-bold border transition-colors ${
            totalAlertsCount > 0 
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}>
            <BellRing className="w-4 h-4" />
            <span>{totalAlertsCount} تنبيهات حرجة اليوم</span>
          </div>

          <button
            onClick={fetchSummary}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            title="تحديث البيانات"
            aria-label="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 space-y-2">
          <Clock className="w-8 h-8 animate-spin mx-auto text-amber-400" />
          <span className="text-xs">جاري تجميع المؤشرات الصباحية...</span>
        </div>
      ) : totalAlertsCount === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-emerald-950/20 border border-emerald-800/40 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <div className="text-sm font-bold text-emerald-200">
            جميع المواقع والعمليات تسير بدون معوقات حرجة اليوم
          </div>
          <p className="text-xs text-emerald-400/80">
            تم استلام اليوميات، ولا توجد موانع صب أو تسليمات معطلة أو استفسارات متأخرة.
          </p>
        </div>
      ) : (
        /* 5 Alert Categories Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Silent Sites */}
          <div className="p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition-all duration-200 flex flex-col justify-between space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400">
                <Radio className="w-4 h-4 animate-ping" />
                <span className="text-xs font-bold">المواقع الصامتة</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {summary?.silent_sites_count || 0}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {(summary?.silent_sites_count || 0) > 0
                ? `${summary?.silent_sites_count} مشروع لم يُرسل التقرير اليومي أمس.`
                : 'تم استلام تقارير جميع المواقع في موعدها.'}
            </p>

            {(summary?.silent_sites || []).length > 0 && (
              <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-[11px]">
                {summary?.silent_sites.slice(0, 2).map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-400">
                    <span className="truncate max-w-[150px]">{s.project_name}</span>
                    <span className="font-mono text-[10px]">آخر تقرير: {s.last_report_date || 'لا يوجد'}</span>
                  </div>
                ))}
              </div>
            )}

            <Link
              href="/planning/daily-progress"
              className="group flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition cursor-pointer rounded-lg px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <span>الانتقال لليوميات وسجل المتابعة</span>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* 2. Active Critical Holds */}
          <div className="p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition-all duration-200 flex flex-col justify-between space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <ShieldAlert className="w-4 h-4" />
                <span className="text-xs font-bold">موانع الصرف والجودة النشطة</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {summary?.active_critical_holds_count || 0}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {(summary?.active_critical_holds_count || 0) > 0
                ? `${summary?.active_critical_holds_count} إيقاف نشط (سلامة / عدم مطابقة / تجاري).`
                : 'لا توجد موانع عمل أو قرارات إيقاف نشطة.'}
            </p>

            {(summary?.active_critical_holds || []).length > 0 && (
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-[11px] text-amber-300 truncate">
                السبب: {summary?.active_critical_holds[0]?.reason}
              </div>
            )}

            <Link
              href="/boq"
              className="group flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer rounded-lg px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <span>مراجعة بنود الإيقاف بجدول الكميات</span>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* 3. Blocked Deliverables */}
          <div className="p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition-all duration-200 flex flex-col justify-between space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-bold">التسليمات المعطلة</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {summary?.blocked_deliverables_count || 0}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {(summary?.blocked_deliverables_count || 0) > 0
                ? `${summary?.blocked_deliverables_count} حزمة مخططات تنفيذية معطلة بمانع صريح.`
                : 'جميع حزم التسليمات تسير بصورة طبيعية.'}
            </p>

            {oldestBlocked && (
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-0.5">
                <div className="font-bold text-rose-300 font-mono">{oldestBlocked.ref_code}</div>
                <div className="text-slate-400 truncate">{oldestBlocked.title_ar}</div>
              </div>
            )}

            <button
              onClick={() => onNavigateTab ? onNavigateTab('kanban') : null}
              className="group flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs font-bold text-rose-400 hover:text-rose-300 transition text-start cursor-pointer rounded-lg px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 w-full"
            >
              <span>الانتقال لكانبان التسليمات</span>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>

          {/* 4. Overdue RFIs */}
          <div className="p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition-all duration-200 flex flex-col justify-between space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400">
                <FileQuestion className="w-4 h-4" />
                <span className="text-xs font-bold">الاستفسارات الهندسية المتأخرة</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {summary?.overdue_rfis_count || 0}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {(summary?.overdue_rfis_count || 0) > 0
                ? `${summary?.overdue_rfis_count} استفسار تجاوز مهلة الرد التعاقدية (فيديك 7 أيام).`
                : 'لا توجد استفسارات متأخرة.'}
            </p>

            {(summary?.overdue_rfis || []).length > 0 && (
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-0.5">
                <div className="font-bold text-cyan-300 font-mono">{summary?.overdue_rfis[0]?.rfi_no}</div>
                <div className="text-slate-400 truncate">{summary?.overdue_rfis[0]?.subject}</div>
              </div>
            )}

            <button
              onClick={() => onNavigateTab ? onNavigateTab('rfis') : null}
              className="group flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition text-start cursor-pointer rounded-lg px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 w-full"
            >
              <span>فتح سجل الاستفسارات الهندسية</span>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>

          {/* 5. Underperforming Subcontractors */}
          <div className="p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition-all duration-200 flex flex-col justify-between space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-400">
                <TrendingDown className="w-4 h-4" />
                <span className="text-xs font-bold">إنذارات مقاولي الباطن (دون 70% من المستهدف)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                {summary?.underperforming_subcontractors_count || 0}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {(summary?.underperforming_subcontractors_count || 0) > 0
                ? `${summary?.underperforming_subcontractors_count} مقاول باطن دون معدل الإنتاج المطلوب.`
                : 'جميع مقاولي الباطن يحققون المستهدفات المقررة.'}
            </p>

            {(summary?.underperforming_subcontractors || []).length > 0 && (
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-[11px] flex items-center justify-between">
                <span className="text-orange-300">
                  إنجاز: {summary?.underperforming_subcontractors[0]?.achievement_pct}%
                </span>
                <span className="text-[10px] text-slate-400">
                  {summary?.underperforming_subcontractors[0]?.actual_qty} / {summary?.underperforming_subcontractors[0]?.target_qty}
                </span>
              </div>
            )}

            <button
              onClick={() => onNavigateTab ? onNavigateTab('subs') : null}
              className="group flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs font-bold text-orange-400 hover:text-orange-300 transition text-start cursor-pointer rounded-lg px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 w-full"
            >
              <span>مراجعة جدول إنتاجية المقاولين</span>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
