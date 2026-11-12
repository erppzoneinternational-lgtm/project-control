'use client';

/**
 * WeeklyReportsPanel — توليد التقرير الأسبوعي + قايمة التقارير المولدة.
 *
 * Mounted below the versions ribbon on the Baseline page:
 *  • Week picker (defaulting to the service's canonical week window — most
 *    recent Saturday, matching runWeeklyReportGeneration's idempotency keys) +
 *    "توليد التقرير" wired through runWeeklyReportGeneration() which binds the
 *    report to the APPROVED schedule version (fallback flagged by the service).
 *  • Recent reports from pm_weekly_reports with week range / status /
 *    generated_at / bound version, plus an "إنهاء" action for drafts gated to
 *    approver-level roles (mirrors BaselineVersionActions constants).
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FileBarChart2, Loader2, CalendarRange, BadgeCheck, CheckCircle2, RefreshCw, Printer } from 'lucide-react';
import { toast } from 'sonner';
import {
  runWeeklyReportGeneration,
  computeWeekEnd,
  mostRecentWeekStart,
  type WeeklyGenerationResult,
} from '@/lib/services/weeklyReportGeneration';
import {
  WeeklyReportService,
  type WeeklyReportAggregatesWithVersion,
} from '@/lib/services/weeklyReport.service';
import type { WeeklyReport } from '@/types/planning';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useLanguage } from '@/contexts/LanguageContext';
import { escapeHtml } from '@/lib/utils/security';

export const WEEKLY_GENERATE_ROLES = ['planning_engineer', 'planning_manager', 'technical_office', 'admin'];
export const WEEKLY_FINALIZE_ROLES = ['planning_manager', 'technical_office', 'admin'];

export const GENERATE_BUTTON_LABEL = 'توليد التقرير';
export const FINALIZE_BUTTON_LABEL = 'إنهاء';
/** friendly copy required for WeeklyReportEmptyError */
export const EMPTY_WEEK_MESSAGE_AR = 'مفيش بيانات كافية للأسبوع ده';
const GENERIC_ERROR_AR = 'تعذر توليد التقرير الأسبوعي — حاول مرة أخرى';
const FALLBACK_VERSION_NOTICE_AR = 'تم التوليد من آخر نسخة متاحة — لا توجد نسخة معتمدة بعد';

/* ════ pure logic (unit-tested) ════ */

/** Exact params handed to runWeeklyReportGeneration. */
export function buildWeeklyParams(
  projectId: string,
  weekStart: string,
  generatedBy?: string | null
) {
  return { projectId, weekStart, weekEnd: computeWeekEnd(weekStart), generatedBy: generatedBy ?? null };
}

const hasAnyRole = (roles?: string[] | null, allowed?: string[]): boolean =>
  !!roles?.some((r) => allowed?.includes(r));

export const canGenerateWeeklyReport = (roles?: string[] | null) => hasAnyRole(roles, WEEKLY_GENERATE_ROLES);
export const canFinalizeWeeklyReport = (roles?: string[] | null) => hasAnyRole(roles, WEEKLY_FINALIZE_ROLES);

export interface GenerationUiOutcome {
  tone: 'success' | 'warning' | 'info' | 'error';
  messageAr: string;
  /** created while no approved schedule version exists yet */
  usedFallbackVersion: boolean;
  report?: WeeklyReport;
}

/** Map the orchestrator's typed result union onto toast tone + Arabic message. */
export function outcomeFor(result: WeeklyGenerationResult): GenerationUiOutcome {
  switch (result.status) {
    case 'created':
      return result.usedFallbackVersion
        ? { tone: 'warning', messageAr: FALLBACK_VERSION_NOTICE_AR, usedFallbackVersion: true, report: result.report }
        : { tone: 'success', messageAr: 'تم توليد التقرير الأسبوعي بنجاح', usedFallbackVersion: false, report: result.report };
    case 'duplicate':
      return { tone: 'info', messageAr: 'يوجد بالفعل تقرير أسبوعي لهذا الأسبوع', usedFallbackVersion: false };
    case 'empty':
      return { tone: 'warning', messageAr: EMPTY_WEEK_MESSAGE_AR, usedFallbackVersion: false };
    case 'error':
      return { tone: 'error', messageAr: result.messageAr || GENERIC_ERROR_AR, usedFallbackVersion: false };
  }
}

/* ════ component ════ */

interface WeeklyReportsPanelProps {
  projectId: string;
  className?: string;
}

const STATUS_CHIP: Record<WeeklyReport['status'], { label: string; cls: string }> = {
  draft: {
    label: 'مسودة',
    cls: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300',
  },
  finalized: {
    label: 'معتمد',
    cls: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300',
  },
};

const fmtDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  const dt = new Date(iso);
  return Number.isNaN(dt.getTime())
    ? '—'
    : new Intl.DateTimeFormat('eg-EG', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }).format(dt);
};

const fmtDay = (d?: string | null) => {
  if (!d) return '—';
  const dt = new Date(`${String(d).slice(0, 10)}T00:00:00`);
  return Number.isNaN(dt.getTime()) ? '—' : new Intl.DateTimeFormat('eg-EG', { day: '2-digit', month: 'short' }).format(dt);
};

export default function WeeklyReportsPanel({ projectId, className }: WeeklyReportsPanelProps) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { roles, isLoading: rolesLoading, user } = useUserRoles();
  const effectiveRoles = rolesLoading ? [] : roles;

  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [finalizingId, setFinalizingId] = useState<string | null>(null);
  const [confirmFinalizeId, setConfirmFinalizeId] = useState<string | null>(null);

  const [weekStart, setWeekStart] = useState<string>(() => mostRecentWeekStart());
  const weekEnd = useMemo(() => computeWeekEnd(weekStart), [weekStart]);

  const loadReports = useCallback(async () => {
    if (!projectId) {
      setReports([]);
      return;
    }
    setLoading(true);
    try {
      setReports(await WeeklyReportService.getWeeklyReports(projectId));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  if (!projectId) return null;

  const canGenerate = canGenerateWeeklyReport(effectiveRoles);
  const canFinalize = canFinalizeWeeklyReport(effectiveRoles);

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const params = buildWeeklyParams(projectId, weekStart, user?.id || null);
      const outcome = outcomeFor(await runWeeklyReportGeneration(params));
      if (outcome.tone === 'success') toast.success(outcome.messageAr);
      else if (outcome.tone === 'info') toast.info(outcome.messageAr);
      else if (outcome.tone === 'warning') toast.warning(outcome.messageAr);
      else toast.error(outcome.messageAr);
      if (outcome.tone === 'success' || outcome.tone === 'info' || outcome.tone === 'warning') await loadReports();
    } catch (e) {
      console.error('weekly report generation failed:', e);
      toast.error(GENERIC_ERROR_AR);
    } finally {
      setGenerating(false);
    }
  };

  const printWeeklyReport = (r: WeeklyReport) => {
    const agg = (r.aggregates || {}) as any;
    const scurve = agg.scurve_point;
    const boq = (agg.weekly_boq_progress || []) as any[];
    const lookahead = (agg.lookahead_activities || []) as any[];
    const obstructions = (agg.obstructions_summary || []) as any[];
    const bound = agg.schedule_version;

    const boqRows = boq.map((b) => `
      <tr>
        <td>${escapeHtml(b.item_code || '—')}</td>
        <td>${escapeHtml(b.description_ar || '—')}</td>
        <td class="num">${escapeHtml(b.unit || '—')}</td>
        <td class="num">${escapeHtml(b.contract_qty ?? '—')}</td>
        <td class="num">${escapeHtml(b.week_qty ?? '—')}</td>
        <td class="num">${escapeHtml(b.cumulative_qty ?? '—')}</td>
        <td class="num">${escapeHtml(b.earned_egp ? Math.round(b.earned_egp).toLocaleString('eg-EG') + ' ج.م' : '—')}</td>
      </tr>
    `).join('');

    const lookRows = lookahead.map((l) => `
      <tr>
        <td>${escapeHtml(l.activity_code || '—')}</td>
        <td>${escapeHtml(l.name_ar || '—')}</td>
        <td>${escapeHtml(l.planned_start || '—')}</td>
        <td>${escapeHtml(l.planned_finish || '—')}</td>
      </tr>
    `).join('');

    const obsRows = obstructions.map((o) => `
      <tr>
        <td>${escapeHtml(o.type || '—')}</td>
        <td>${escapeHtml(o.responsible_party || '—')}</td>
        <td>${escapeHtml((o.description_list || []).join('، ') || o.description || '—')}</td>
        <td class="num">${escapeHtml(o.total_idle_manpower || o.idle_manpower || 0)}</td>
      </tr>
    `).join('');

    const safeWeekStart = escapeHtml(fmtDay(r.week_start));
    const safeWeekEnd = escapeHtml(fmtDay(r.week_end));
    const safeVersionLabel = bound ? `v${escapeHtml(bound.version_no)}` : '—';
    const safeGeneratedAt = escapeHtml(fmtDateTime(r.generated_at));

    const htmlContent = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8">
      <title>التقرير الأسبوعي — ${safeWeekStart} إلى ${safeWeekEnd}</title>
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 24px; color: #1e293b; background: #fff; }
        h1 { font-size: 18px; color: #0284c7; margin: 0 0 4px; }
        .sub { font-size: 11px; color: #64748b; margin-bottom: 14px; }
        .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; }
        .card b { display: block; font-size: 15px; color: #0284c7; }
        .card span { font-size: 9px; color: #64748b; }
        h2 { font-size: 13px; color: #334155; border-bottom: 2px solid #0284c7; padding-bottom: 4px; margin: 16px 0 8px; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 12px; }
        th { background: #0284c7; color: #fff; padding: 6px 8px; text-align: right; }
        td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
        td.num { text-align: left; direction: ltr; }
        tr:nth-child(even) td { background: #f8fafc; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <h1>التقرير الأسبوعي لسير الأعمال</h1>
      <div class="sub">الفترة: ${safeWeekStart} ← ${safeWeekEnd} · الحالة: ${r.status === 'finalized' ? 'معتمد' : 'مسودة'} · النسخة المرتبطة: ${safeVersionLabel}</div>
      
      <div class="meta-grid">
        <div class="card"><b>${scurve?.planned_pct != null ? escapeHtml(Number(scurve.planned_pct).toFixed(1) + '%') : '—'}</b><span>نسبة الإنجاز المخطط</span></div>
        <div class="card"><b>${scurve?.actual_pct != null ? escapeHtml(Number(scurve.actual_pct).toFixed(1) + '%') : '—'}</b><span>نسبة الإنجاز الفعلي</span></div>
        <div class="card"><b>${scurve?.planned_egp ? escapeHtml(Math.round(Number(scurve.planned_egp)).toLocaleString('eg-EG')) : '—'}</b><span>المخطط (ج.م)</span></div>
        <div class="card"><b>${scurve?.earned_egp ? escapeHtml(Math.round(Number(scurve.earned_egp)).toLocaleString('eg-EG')) : '—'}</b><span>المكتسب (ج.م)</span></div>
      </div>

      ${boqRows ? `<h2>إنجاز بنود المقايسة (BOQ) خلال الأسبوع</h2>
      <table><thead><tr><th>الكود</th><th>الوصف</th><th>الوحدة</th><th>كمية العقد</th><th>كمية الأسبوع</th><th>الكمية الإجمالية</th><th>القيمة المكتسبة</th></tr></thead>
      <tbody>${boqRows}</tbody></table>` : ''}

      ${lookRows ? `<h2>أنشطة الـ Look-Ahead للأسبوع القادم</h2>
      <table><thead><tr><th>الكود</th><th>النشاط</th><th>البداية المخططة</th><th>النهاية المخططة</th></tr></thead>
      <tbody>${lookRows}</tbody></table>` : ''}

      ${obsRows ? `<h2>معوقات الموقع المسجلة</h2>
      <table><thead><tr><th>النوع</th><th>الجهة المسؤولة</th><th>الوصف</th><th>العمالة المعطلة</th></tr></thead>
      <tbody>${obsRows}</tbody></table>` : ''}

      <div style="margin-top:24px;border-top:1px solid #cbd5e1;padding-top:10px;display:flex;justify-content:space-between;font-size:10px;color:#64748b">
        <span>إعداد: إدارة التخطيط والمتابعة الفنية</span>
        <span>تاريخ التوليد: ${safeGeneratedAt}</span>
      </div>
      </body></html>`;

    // Hidden iframe printing
    try {
      let printFrame = document.getElementById('weekly-report-print-iframe') as HTMLIFrameElement;
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'weekly-report-print-iframe';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = 'none';
        printFrame.style.visibility = 'hidden';
        document.body.appendChild(printFrame);
      }
      const frameDoc = printFrame.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(htmlContent);
        frameDoc.close();
        setTimeout(() => {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        }, 300);
        toast.success('جاري فتح أمر الطباعة / حفظ PDF للتقرير الأسبوعي');
        return;
      }
    } catch {}

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-report-${r.week_start}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.info('تم تنزيل ملف التقرير الأسبوعي');
  };

  const handleFinalize = async (r: WeeklyReport) => {
    if (finalizingId) return;
    setFinalizingId(r.id);
    try {
      const ok = await WeeklyReportService.finalizeWeeklyReport(r.id, projectId, user?.id || undefined);
      if (ok) {
        toast.success(`اعتُمد التقرير الأسبوعي (${fmtDay(r.week_start)} — ${fmtDay(r.week_end)})`);
        setConfirmFinalizeId(null);
        await loadReports();
      } else {
        toast.error('فشل اعتماد التقرير الأسبوعي');
      }
    } finally {
      setFinalizingId(null);
    }
  };

  return (
    <div className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${className || ''}`} dir="rtl">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <FileBarChart2 className="w-4 h-4 text-sky-500" />
          التقارير الأسبوعية
          <span className="text-[9px] font-normal text-slate-400">تُبنى على النسخة المعتمدة من الجدول الزمني</span>
        </h2>

        {/* generate controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <CalendarRange className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              disabled={generating}
              title="بداية الأسبوع (سبت)"
              aria-label="بداية الأسبوع"
              className="bg-transparent text-[11px] font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer disabled:opacity-50"
            />
            <span className="text-[10px] text-slate-400 tabular-nums" dir="ltr">
              → {fmtDay(weekEnd)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => loadReports()}
            disabled={loading}
            title="تحديث القائمة"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-500 hover:border-emerald-400 cursor-pointer disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
            title={
              !canGenerate
                ? 'التوليد متاح لأدوار التخطيط فقط'
                : `توليد تقرير الأسبوع ${fmtDay(weekStart)} — ${fmtDay(weekEnd)}`
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileBarChart2 className="w-4 h-4" />}
            {GENERATE_BUTTON_LABEL}
          </button>
        </div>
      </div>

      {/* list */}
      {loading && reports.length === 0 ? (
        <div className="py-8 text-center"><Loader2 className="w-5 h-5 text-sky-500 animate-spin mx-auto" /></div>
      ) : reports.length === 0 ? (
        <div className="px-4 py-8 text-center text-xs text-slate-400">
          لا توجد تقارير أسبوعية مولّدة لهذا المشروع بعد — اختر الأسبوع واضغط «{GENERATE_BUTTON_LABEL}»
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-end text-xs min-w-[560px]">
            <thead>
              <tr className="bg-slate-50/60 dark:bg-slate-950/40 text-slate-400 text-[10px]">
                <th className="px-4 py-2 font-bold">الأسبوع</th>
                <th className="px-3 py-2 font-bold">الحالة</th>
                <th className="px-3 py-2 font-bold">النسخة المرتبطة</th>
                <th className="px-3 py-2 font-bold">وُلِّد في</th>
                <th className="px-3 py-2 font-bold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {reports.map((r) => {
                const chip = STATUS_CHIP[r.status] || STATUS_CHIP.draft;
                const bound = (r.aggregates as WeeklyReportAggregatesWithVersion | undefined)?.schedule_version;
                const busy = finalizingId === r.id;
                return (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-200 tabular-nums whitespace-nowrap" dir="ltr">
                      {fmtDay(r.week_start)} ← {fmtDay(r.week_end)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold ${chip.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'finalized' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {chip.label}
                      </span>
                      {r.status === 'draft' && !canFinalize && (
                        <span className="block text-[9px] text-slate-400 mt-0.5">بانتظار اعتماد مدير التخطيط</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 tabular-nums whitespace-nowrap">
                      {bound ? `v${bound.version_no}${bound.status !== 'approved' ? ' (غير معتمدة)' : ''}` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 text-[10px] tabular-nums whitespace-nowrap" dir="ltr">
                      {fmtDateTime(r.generated_at)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => printWeeklyReport(r)}
                          title="طباعة / تصدير التقرير الأسبوعي بصيغة PDF"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-[10px] font-bold cursor-pointer transition-colors shadow-xs"
                        >
                          <Printer className="w-3 h-3 text-sky-500" />
                          طباعة PDF
                        </button>
                        {r.status === 'draft' && canFinalize && (
                          confirmFinalizeId === r.id ? (
                            <span className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleFinalize(r)}
                                title="اعتماد التقرير النهائي — لا يمكن التراجع"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer disabled:opacity-40"
                              >
                                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <BadgeCheck className="w-3 h-3" />}
                                تأكيد الاعتماد
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmFinalizeId(null)}
                                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              >
                                إلغاء
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmFinalizeId(r.id)}
                              title="إنهاء التقرير واعتماده كنسخة نهائية"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-[10px] font-bold cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              {FINALIZE_BUTTON_LABEL}
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
