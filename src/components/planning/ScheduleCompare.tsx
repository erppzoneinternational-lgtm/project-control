'use client';

/**
 * ScheduleCompareTools — نسخ الجدول: مقارنة نسختين + حفظ كنسخة.
 *
 * Self-contained pair of controls mounted once from the baseline page:
 *  • "مقارنة نسختين" opens a modal that diffs two schedule versions
 *    (ADDED / REMOVED / DATE-SHIFTED / UNCHANGED) keyed by activity code.
 *  • "حفظ كنسخة" snapshots the current activity set into a new version row.
 *
 * All logic lives in ScheduleCompareService / ScheduleVersionService.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GitCompare, Save, X, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  ScheduleCompareService,
  type CompareResult,
  type DiffKind,
} from '@/lib/services/schedule-compare.service';
import { ScheduleVersionService, type ScheduleVersion } from '@/lib/services/schedule-version.service';
import { useLanguage } from '@/contexts/LanguageContext';
import { logger } from '@/lib/logger';

const KIND_LABEL: Record<DiffKind, string> = {
  added: 'مضاف',
  removed: 'محذوف',
  shifted: 'منزاح',
  unchanged: 'دون تغيير',
};
const KIND_STYLE: Record<DiffKind, string> = {
  added: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
  removed: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-900',
  shifted: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900',
  unchanged: 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
};
const STATUS_LABEL: Record<string, string> = { draft: 'مسودة', submitted: 'مُرسلة', approved: 'معتمدة', rejected: 'مرفوضة' };
const TYPE_LABEL: Record<string, string> = { baseline: 'أساس', update: 'تحديث', weekly_report: 'تقرير أسبوعي', daily_report: 'تقرير يومي' };

const fmtD = (d: string | null) => {
  if (!d) return '—';
  const dt = new Date(`${d.slice(0, 10)}T00:00:00`);
  return Number.isNaN(dt.getTime()) ? '—' : new Intl.DateTimeFormat('eg-EG', { day: '2-digit', month: 'short', year: '2-digit' }).format(dt);
};
const fmtShift = (n: number | null) => (n == null ? '—' : n > 0 ? `+${n}` : `${n}`);
/** finish moved later = rose (slip), earlier = emerald (gained), ~0 = slate */
const shiftStyle = (n: number | null) =>
  n == null || n === 0
    ? 'text-slate-400 dark:text-slate-500'
    : n > 0
      ? 'text-rose-600 dark:text-rose-400 font-bold'
      : 'text-emerald-600 dark:text-emerald-400 font-bold';

interface Props {
  projectId: string;
  /** Called after a new version is saved so the page can refresh its ribbon. */
  onVersionsChanged?: () => void;
}

export default function ScheduleCompareTools({ projectId, onVersionsChanged }: Props) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  /* opener state */
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<ScheduleVersion[]>([]);
  const [baseId, setBaseId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [result, setResult] = useState<CompareResult | null>(null);
  const [comparing, setComparing] = useState(false);
  const [saving, setSaving] = useState(false);

  /* table filters */
  const [filter, setFilter] = useState<'all' | DiffKind>('all');
  const [search, setSearch] = useState('');

  const loadVersions = useCallback(async () => {
    if (!projectId) return;
    setVersions(await ScheduleVersionService.list(projectId));
  }, [projectId]);

  /* preselect oldest→newest each time the modal opens */
  useEffect(() => {
    if (!open || versions.length < 2) return;
    const newest = versions[0]; // list() is ordered version_no desc
    const oldest = versions[versions.length - 1];
    setBaseId((cur) => cur || oldest.id);
    setTargetId((cur) => cur || newest.id);
  }, [open, versions]);

  useEffect(() => {
    if (!open) return;
    loadVersions();
  }, [open, loadVersions]);

  /* run comparison whenever both sides are picked */
  useEffect(() => {
    if (!open || !projectId || !baseId || !targetId || baseId === targetId) {
      setResult(null);
      return;
    }
    let alive = true;
    setComparing(true);
    ScheduleCompareService.compareVersions(projectId, baseId, targetId)
      .then((r) => alive && setResult(r))
      .catch((e) => {
        logger.error('compare failed', { detail: e });
        toast.error('فشل المقارنة: ' + (e.message || 'خطأ غير معروف'));
      })
      .finally(() => alive && setComparing(false));
    return () => { alive = false; };
  }, [open, projectId, baseId, targetId]);

  /* escape closes */
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open]);

  const counts = useMemo(() => {
    const c = { all: 0, added: 0, removed: 0, shifted: 0, unchanged: 0 };
    (result?.rows || []).forEach((r) => { c[r.kind] += 1; c.all += 1; });
    return c;
  }, [result]);

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (result?.rows || [])
      .filter((r) => filter === 'all' || r.kind === filter)
      .filter((r) => !q || r.code.toLowerCase().includes(q) || (r.name || '').toLowerCase().includes(q))
      .slice(0, 500);
  }, [result, filter, search]);

  const saveAsVersion = async () => {
    if (!projectId || saving) return;
    setSaving(true);
    try {
      const ver = await ScheduleVersionService.createVersionFromCurrent(
        projectId,
        `تحديث يدوي — ${new Date().toISOString().slice(0, 10)}`
      );
      if (ver) {
        toast.success(`تم الحفظ كنسخة تحديث رقم ${ver.version_no} (${ver.activities_count ?? 0} نشطاً)`);
        await loadVersions();
        onVersionsChanged?.();
      }
    } catch (e) {
      logger.error('Failed to save schedule version', { detail: e });
      toast.error('فشل حفظ النسخة: ' + ((e as Error).message || 'خطأ غير معروف'));
    } finally {
      setSaving(false);
    }
  };

  const vLabel = (v?: ScheduleVersion | null) =>
    v ? `v${v.version_no} — ${v.title || TYPE_LABEL[v.version_type] || v.version_type}` : '—';

  const renderVersionSelect = (
    id: string,
    setId: (v: string) => void,
    label: string,
    accent: string,
    selectId: string
  ) => (
    <label htmlFor={selectId} className="flex-1 min-w-[180px]">
      <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{label}</span>
      <select
        id={selectId}
        aria-label={label}
        value={id}
        onChange={(e) => setId(e.target.value)}
        className={`w-full px-2.5 py-2 rounded-lg border bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors ${accent}`}
      >
        <option value="">— اختر النسخة —</option>
        {versions.map((v) => (
          <option key={v.id} value={v.id}>
            v{v.version_no} · {TYPE_LABEL[v.version_type] || v.version_type} · {v.title || ''} ({STATUS_LABEL[v.status] || v.status})
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <>
      {/* ── opener controls ── */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={!projectId}
          aria-label={isAr ? "مقارنة نسختين من جدول المشروع" : "Compare two schedule versions"}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer hover:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="مقارنة نسختين من جدول المشروع"
        >
          <GitCompare className="w-4 h-4 text-emerald-500" aria-hidden="true" />
          <span>مقارنة نسختين</span>
        </button>
        <button
          type="button"
          onClick={saveAsVersion}
          disabled={!projectId || saving}
          aria-label={isAr ? "حفظ الأنشطة الحالية كنسخة تحديث جديدة" : "Save current activities as new update version"}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer hover:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="حفظ الأنشطة الحالية كنسخة تحديث جديدة"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> : <Save className="w-4 h-4 text-emerald-500" aria-hidden="true" />}
          <span>{saving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : (isAr ? 'حفظ كنسخة' : 'Save Version')}</span>
        </button>
      </div>

      {/* ── compare modal ── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-8 bg-slate-950/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="compare-modal-title"
          onClick={() => setOpen(false)}
        >
          <div
            dir="rtl"
            className="w-full max-w-5xl max-h-full overflow-hidden flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <GitCompare className="w-4.5 h-4.5 text-emerald-500" aria-hidden="true" />
                <h2 id="compare-modal-title" className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  مقارنة نسخ الجدول الزمني
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={isAr ? "إغلاق نافذة المقارنة" : "Close compare dialog"}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* selectors */}
            <div className="flex flex-wrap items-end gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              {renderVersionSelect(baseId, setBaseId, 'النسخة الأساس (Base Version)', 'border-slate-300 dark:border-slate-700 focus:border-emerald-500', 'compare-base-select')}
              {renderVersionSelect(targetId, setTargetId, 'النسخة المقارَنة بها (Target Version)', 'border-slate-300 dark:border-slate-700 focus:border-emerald-500', 'compare-target-select')}
              {versions.length > 0 && versions.length < 2 && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500">تحتاج نسختين على الأقل للمقارنة.</p>
              )}
            </div>

            {/* loading state skeleton */}
            {comparing && (
              <div className="p-6 space-y-4 animate-pulse" aria-busy="true" aria-label={isAr ? "جارٍ مقارنة النسختين…" : "Comparing versions…"}>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>{isAr ? 'جارٍ مقارنة بيانات النسختين وتحليل الانزلاقات الزمنية…' : 'Comparing versions and calculating schedule variance…'}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800" />
                  ))}
                </div>
                <div className="h-56 rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
            )}

            {!comparing && result && (
              <>
                <div className="px-4 py-3 space-y-3 overflow-y-auto">
                  {/* version meta line */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300">
                      الأساس: {vLabel(result.base)}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500" aria-hidden="true">←</span>
                    <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 text-teal-800 dark:text-teal-300">
                      الهدف: {vLabel(result.target)}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 font-normal">
                      {result.base?.status && `(${STATUS_LABEL[result.base.status] || result.base.status} · Data Date: ${fmtD(result.base.data_date)})`}
                      {' ← '}
                      {result.target?.status && `(${STATUS_LABEL[result.target.status] || result.target.status} · Data Date: ${fmtD(result.target.data_date)})`}
                    </span>
                  </div>

                  {/* count cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {([
                      ['added', counts.added, 'أنشطة مضافة'],
                      ['removed', counts.removed, 'أنشطة محذوفة'],
                      ['shifted', counts.shifted, 'أنشطة منزاحة التواريخ'],
                      ['unchanged', counts.unchanged, 'أنشطة دون تغيير'],
                    ] as [DiffKind, number, string][]).map(([k, n, lbl]) => (
                      <div key={k} className={`rounded-xl border px-3 py-2 transition-all ${KIND_STYLE[k]}`}>
                        <div className="text-xl font-black leading-none tabular-nums">{n}</div>
                        <div className="text-[10px] mt-1 opacity-80">{lbl}</div>
                      </div>
                    ))}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-200">
                      <div className="text-xl font-black leading-none tabular-nums">{counts.all}</div>
                      <div className="text-[10px] mt-1 text-slate-400 dark:text-slate-500 truncate">
                        إجمالي الأنشطة
                      </div>
                    </div>
                  </div>

                  {/* variance legend bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-900/60 rounded-lg p-2 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                        <span className="font-bold text-rose-600 dark:text-rose-400">(+ أيام) تأخر في موعد النهاية</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">(- أيام) إنجاز مبكر وتوفير</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 inline-block" />
                        <span>(0 يوم) مطابقة تامة</span>
                      </span>
                    </div>
                    {result.summary.maxFinishSlipDays != null && (
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        أقصى انزلاق في موعد النهاية: +{result.summary.maxFinishSlipDays} يوم
                      </span>
                    )}
                  </div>

                  {/* filter bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    {(['all', 'added', 'removed', 'shifted', 'unchanged'] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setFilter(k)}
                        aria-pressed={filter === k}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                          filter === k
                            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500'
                        }`}
                      >
                        {k === 'all' ? `الكل (${counts.all})` : `${KIND_LABEL[k]} (${counts[k]})`}
                      </button>
                    ))}
                    <div className="flex items-center gap-1.5 me-auto px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="بحث بالكود أو الاسم…"
                        aria-label="بحث بالكود أو اسم النشاط"
                        className="bg-transparent text-[11px] w-40 outline-none text-slate-600 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  {/* diff table */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-auto max-h-[46vh] bg-white dark:bg-slate-900">
                    <table className="w-full text-start text-[11px]" dir="rtl">
                      <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <tr>
                          <th className="px-2.5 py-2 font-bold text-start">الكود</th>
                          <th className="px-2.5 py-2 font-bold text-start">الحالة</th>
                          <th className="px-2.5 py-2 font-bold text-start">النشط</th>
                          <th className="px-2.5 py-2 font-bold text-start">بداية (أساس)</th>
                          <th className="px-2.5 py-2 font-bold text-start">نهاية (أساس)</th>
                          <th className="px-2.5 py-2 font-bold text-start">بداية (هدف)</th>
                          <th className="px-2.5 py-2 font-bold text-start">نهاية (هدف)</th>
                          <th className="px-2.5 py-2 font-bold text-center">Δ بداية</th>
                          <th className="px-2.5 py-2 font-bold text-center">Δ نهاية</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleRows.map((r) => (
                          <tr key={`${r.kind}-${r.code}`} className="border-t border-slate-100 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="px-2.5 py-1.5 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.code}</td>
                            <td className="px-2.5 py-1.5">
                              <span className={`inline-block px-1.5 py-0.5 rounded-md border text-[10px] font-bold whitespace-nowrap ${KIND_STYLE[r.kind]}`}>
                                {KIND_LABEL[r.kind]}
                              </span>
                            </td>
                            <td className="px-2.5 py-1.5 text-slate-700 dark:text-slate-200 max-w-[220px] truncate" title={r.name}>{r.name}</td>
                            <td className="px-2.5 py-1.5 text-slate-500 dark:text-slate-400 tabular-nums">
                              <span dir="ltr">{fmtD(r.baseStart)}</span>
                            </td>
                            <td className="px-2.5 py-1.5 text-slate-500 dark:text-slate-400 tabular-nums">
                              <span dir="ltr">{fmtD(r.baseFinish)}</span>
                            </td>
                            <td className="px-2.5 py-1.5 text-slate-500 dark:text-slate-400 tabular-nums">
                              <span dir="ltr">{fmtD(r.targetStart)}</span>
                            </td>
                            <td className="px-2.5 py-1.5 text-slate-500 dark:text-slate-400 tabular-nums">
                              <span dir="ltr">{fmtD(r.targetFinish)}</span>
                            </td>
                            <td className="px-2.5 py-1.5 text-center">
                              <span dir="ltr" className={`inline-block px-1.5 py-0.5 rounded text-[10px] tabular-nums font-mono ${shiftStyle(r.startShiftDays)}`}>
                                {fmtShift(r.startShiftDays)}
                              </span>
                            </td>
                            <td className="px-2.5 py-1.5 text-center">
                              <span dir="ltr" className={`inline-block px-1.5 py-0.5 rounded text-[10px] tabular-nums font-mono ${shiftStyle(r.finishShiftDays)}`}>
                                {fmtShift(r.finishShiftDays)}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {!visibleRows.length && (
                          <tr>
                            <td colSpan={9} className="px-3 py-8 text-center text-slate-400 dark:text-slate-500">
                              {result.rows.length ? 'لا نتائج مطابقة للفلتر.' : 'لا توجد أنشطة مسجلة في إحدى النسختين.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {(result.rows.length > 500) && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">تُعرض أول 500 صف — استخدم الفلاتر أو البحث للتضييق.</p>
                  )}
                </div>
              </>
            )}
            {!comparing && !result && versions.length >= 2 && (
              <div className="px-4 py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                اختر نسختين مختلفتين من القائمة أعلاه لبدء المقارنة الفورية.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
