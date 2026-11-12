'use client';

import React, { useMemo, useState } from 'react';
import { Search, Pencil, Check, X, Loader2, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { detectGaps } from '@/lib/scheduling/compression';
import ScheduleCompressionModal from './ScheduleCompressionModal';
import { logger } from '@/lib/logger';

export interface GanttActivity {
  id?: string;
  code: string;
  name: string;
  start: Date | null;
  finish: Date | null;
  duration: number;
  pct: number;
  critical: boolean;
  milestone: boolean;
  float: number | null;
}

const DAY = 86400000;
const ROW_H = 26;
const fmtD = (d: Date | null) =>
  d ? new Intl.DateTimeFormat('eg-EG', { day: '2-digit', month: 'short' }).format(d) : '—';

type Scale = 'day' | 'week';

interface Editing {
  idx: number;
  field: 'name' | 'duration' | 'start' | 'finish' | 'pct';
  value: string;
}

export default function GanttChart({ activities, projectId }: { activities: GanttActivity[]; projectId: string }) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const [search, setSearch] = useState('');
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [scale, setScale] = useState<Scale>('week');
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const [compressionOpen, setCompressionOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = activities;
    if (onlyCritical) list = list.filter((a) => a.critical);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(s) || a.code.toLowerCase().includes(s));
    }
    return list.slice(0, 400);
  }, [activities, search, onlyCritical]);

  const win = useMemo(() => {
    const starts = activities.map((a) => a.start).filter(Boolean) as Date[];
    const finishes = activities.map((a) => a.finish).filter(Boolean) as Date[];
    if (!starts.length || !finishes.length) return null;
    const start = new Date(Math.min(...starts.map((d) => d.getTime())));
    const finish = new Date(Math.max(...finishes.map((d) => d.getTime())));
    start.setHours(0, 0, 0, 0);
    finish.setHours(0, 0, 0, 0);
    const totalDays = Math.max(1, Math.round((finish.getTime() - start.getTime()) / DAY) + 1);
    return { start, finish, totalDays };
  }, [activities]);

  const ticks = useMemo(() => {
    if (!win) return { months: [] as { label: string; leftPct: number; spanPct: number }[], minor: [] as { label: string; leftPct: number; isWeekend: boolean }[] };
    const months: { label: string; leftPct: number; spanPct: number }[] = [];
    const minor: { label: string; leftPct: number; isWeekend: boolean }[] = [];
    const AR_MONTHS = ['ينا', 'فبر', 'مار', 'أبر', 'ماي', 'يون', 'يول', 'أغس', 'سبت', 'أكت', 'نوف', 'ديس'];
    const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const MONTHS = isAr ? AR_MONTHS : EN_MONTHS;
    const pctAt = (d: Date) => ((d.getTime() - win.start.getTime()) / (win.totalDays * DAY)) * 100;

    const cur = new Date(win.start.getFullYear(), win.start.getMonth(), 1);
    while (cur <= win.finish) {
      const mStart = new Date(Math.max(cur.getTime(), win.start.getTime()));
      const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      const mEnd = new Date(Math.min(next.getTime(), win.finish.getTime() + DAY));
      const spanDays = Math.max(1, Math.round((mEnd.getTime() - mStart.getTime()) / DAY));
      months.push({ label: `${MONTHS[cur.getMonth()]} ${String(cur.getFullYear()).slice(2)}`, leftPct: pctAt(mStart), spanPct: (spanDays / win.totalDays) * 100 });
      cur.setMonth(cur.getMonth() + 1);
    }
    if (scale === 'day') {
      for (let t = win.start.getTime(); t <= win.finish.getTime(); t += DAY) {
        const d = new Date(t);
        minor.push({ label: String(d.getDate()), leftPct: pctAt(d), isWeekend: d.getDay() === 5 });
      }
    } else {
      let w = 1;
      for (let t = win.start.getTime(); t <= win.finish.getTime(); t += 7 * DAY) {
        minor.push({ label: `${isAr ? 'أ' : 'W'}${w++}`, leftPct: pctAt(new Date(t)), isWeekend: false });
      }
    }
    return { months, minor };
  }, [win, scale, isAr]);

  const geom = (a: GanttActivity) => {
    if (!win || !a.start || !a.finish) return null;
    const leftPct = ((a.start.getTime() - win.start.getTime()) / (win.totalDays * DAY)) * 100;
    const durDays = a.milestone ? 0 : Math.max(1, a.duration || Math.max(1, Math.round((a.finish.getTime() - a.start.getTime()) / DAY)));
    const widthPct = Math.max((durDays / win.totalDays) * 100, a.milestone ? 0 : 0.6);
    return { leftPct: Math.max(0, leftPct), widthPct };
  };

  const todayPct = useMemo(() => {
    if (!win) return null;
    const now = new Date(); now.setHours(0, 0, 0, 0);
    if (now < win.start || now > win.finish) return null;
    return ((now.getTime() - win.start.getTime()) / (win.totalDays * DAY)) * 100;
  }, [win]);

  /* ── inline editing: save directly to DB ── */
  const startEdit = (idx: number, field: Editing['field'], current: string) => {
    if (!projectId) return;
    setEditing({ idx, field, value: current });
  };

  const cancelEdit = () => setEditing(null);

  const saveEdit = async () => {
    if (!editing) return;
    const row = filtered[editing.idx];
    if (!row?.id) {
      toast.error(isAr ? 'هذا النشط غير محفوظ في قاعدة البيانات' : 'This activity is not saved to the database');
      setEditing(null);
      return;
    }
    const patch: Record<string, string | number | null> = {};
    if (editing.field === 'name') {
      if (!editing.value.trim()) { toast.error(isAr ? 'الاسم مطلوب' : 'Name is required'); return; }
      patch.name_ar = editing.value.trim();
    } else if (editing.field === 'pct') {
      const v = Math.min(100, Math.max(0, Number(editing.value)));
      if (isNaN(v)) { toast.error(isAr ? 'نسبة غير صالحة' : 'Invalid percentage'); return; }
      patch.percent_complete = v;
      patch.status = v >= 100 ? 'completed' : v > 0 ? 'in_progress' : 'not_started';
    } else if (editing.field === 'duration') {
      const v = Math.max(1, Math.round(Number(editing.value)));
      if (isNaN(v)) { toast.error(isAr ? 'مدة غير صالحة' : 'Invalid duration'); return; }
      patch.duration_days = v;
      // shift finish to keep start fixed
      if (row.start) {
        const nf = new Date(row.start.getTime() + (v - 1) * DAY);
        patch.planned_finish = nf.toISOString();
      }
    } else if (editing.field === 'start') {
      const d = new Date(editing.value + 'T00:00:00');
      if (isNaN(d.getTime())) { toast.error(isAr ? 'تاريخ غير صالح' : 'Invalid date'); return; }
      patch.planned_start = d.toISOString();
      if (row.duration > 0) {
        const nf = new Date(d.getTime() + (row.duration - 1) * DAY);
        patch.planned_finish = nf.toISOString();
      }
    } else if (editing.field === 'finish') {
      const d = new Date(editing.value + 'T00:00:00');
      if (isNaN(d.getTime()) || (row.start && d < row.start)) {
        toast.error(isAr ? 'النهاية يجب أن تكون بعد البداية' : 'Finish must be after start');
        return;
      }
      patch.planned_finish = d.toISOString();
      patch.duration_days = row.start ? Math.max(1, Math.round((d.getTime() - row.start.getTime()) / DAY) + 1) : row.duration;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('pm_project_activities').update(patch).eq('id', row.id);
      if (error) throw error;
      toast.success(isAr ? 'تم الحفظ' : 'Saved');
      setEditing(null);

      // Check for gaps / overlaps after edit (FR1)
      const updatedActs = activities
        .map((a) => {
          if (a.id === row.id) {
            const newStart = patch.planned_start ? new Date(patch.planned_start) : a.start;
            const newFinish = patch.planned_finish ? new Date(patch.planned_finish) : a.finish;
            return { ...a, start: newStart, finish: newFinish };
          }
          return a;
        })
        .filter((a): a is GanttActivity & { id: string; start: Date; finish: Date } =>
          Boolean(a.id && a.start && a.finish)
        )
        .map((a) => ({
          id: a.id,
          start: a.start,
          finish: a.finish,
          is_milestone: a.milestone,
          percent_complete: a.pct,
        }));

      const detected = detectGaps(updatedActs);
      if (detected.length > 0) {
        toast.info(
          isAr
            ? 'يوجد فجوة أو تداخل في الجدول بعد التعديل — يمكنك استخدام «ضغط الجدول»'
            : 'Gap or overlap detected in schedule — consider Compress Schedule'
        );
      }

      // refresh the page data via a soft reload event
      window.dispatchEvent(new CustomEvent('schedule-activity-updated'));
    } catch (e: unknown) {
      logger.error('Failed to update activity', { detail: e });
      toast.error((isAr ? 'فشل الحفظ: ' : 'Save failed: ') + ((e as { message?: string } | null)?.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const EditCell = ({ idx, field, current, type = 'text', width = 'w-16' }: { idx: number; field: Editing['field']; current: string; type?: string; width?: string }) => {
    if (editing && editing.idx === idx && editing.field === field) {
      return (
        <span className="inline-flex items-center gap-0.5">
          <input
            autoFocus
            type={type}
            value={editing.value}
            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
            className={`${width} px-1 py-0.5 rounded border border-emerald-400 text-[10px] outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white`}
          />
          <button
            type="button"
            onClick={saveEdit}
            aria-label={isAr ? 'حفظ' : 'Save'}
            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer"
            title={isAr ? 'حفظ' : 'Save'}
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            aria-label={isAr ? 'إلغاء' : 'Cancel'}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
            title={isAr ? 'إلغاء' : 'Cancel'}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      );
    }
    return (
      <span
        onDoubleClick={() => projectId && startEdit(idx, field, current)}
        className={`cursor-text ${projectId ? 'hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded px-1 -mx-1' : ''}`}
        title={projectId ? (isAr ? 'دوس مرتين للتعديل' : 'Double-click to edit') : undefined}
      >
        {current || '—'}
      </span>
    );
  };

  if (!activities.length) {
    return (
      <div className="py-14 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        {isAr
          ? 'لا توجد أنشطة لعرضها — استورد ملف XER أو اختر مشروعاً عليه أنشطة'
          : 'No activities to display — import an XER file or pick a project that has activities'}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* toolbar */}
      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
        <div className="relative w-52">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? 'بحث بالكود أو الاسم...' : 'Search by code or name...'}
            aria-label={isAr ? 'بحث بالكود أو الاسم' : 'Search by code or name'}
            className="w-full pe-8 ps-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-[11px] outline-none focus:border-emerald-500"
          />
        </div>
        <button
          type="button"
          onClick={() => setOnlyCritical((v) => !v)}
          aria-label={isAr ? 'المسار الحرج فقط' : 'Critical path only'}
          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
            onlyCritical
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-300'
              : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60'
          }`}
        >
          {isAr ? 'المسار الحرج فقط' : 'Critical path only'}
        </button>
        {projectId && (
          <button
            type="button"
            onClick={() => setCompressionOpen(true)}
            aria-label={isAr ? 'ضغط الجدول وإغلاق الفجوات' : 'Compress schedule gaps'}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
            title={isAr ? 'ضغط الجدول وإغلاق الفجوات' : 'Compress schedule gaps'}
          >
            <Zap className="w-3.5 h-3.5" />
            {isAr ? 'ضغط الجدول' : 'Compress Schedule'}
          </button>
        )}
        {projectId && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Pencil className="w-3 h-3" /> {isAr ? 'دوس مرتين على أي خلية للتعديل' : 'Double-click any cell to edit'}
          </span>
        )}
        <div className="flex items-center gap-1 me-auto">
          <button
            type="button"
            onClick={() => setScale('week')}
            aria-label={isAr ? 'أسبوعي' : 'Weekly'}
            className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${scale === 'week' ? 'bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            {isAr ? 'أسبوعي' : 'Weekly'}
          </button>
          <button
            type="button"
            onClick={() => setScale('day')}
            aria-label={isAr ? 'يومي' : 'Daily'}
            className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${scale === 'day' ? 'bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            {isAr ? 'يومي' : 'Daily'}
          </button>
        </div>
      </div>

      {/* legend */}
      <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1"><span className="w-4 h-2.5 rounded-sm bg-[#2E86DE]" />{isAr ? 'نشط عادي' : 'Normal activity'}</span>
        <span className="flex items-center gap-1"><span className="w-4 h-2.5 rounded-sm bg-[#C0392B]" />{isAr ? 'مسار حرج' : 'Critical path'}</span>
        <span className="flex items-center gap-1"><span className="w-4 h-2.5 rounded-sm bg-[#1B4F72]" />{isAr ? 'نسبة الإنجاز' : 'Progress'}</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rotate-45 bg-purple-600 inline-block" />{isAr ? 'ميلستون' : 'Milestone'}</span>
        <span className="flex items-center gap-1"><span className="w-0.5 h-3 bg-orange-500 inline-block" />{isAr ? 'تاريخ اليوم' : 'Today'}</span>
      </div>

      {/* chart */}
      <div className="overflow-auto max-h-[640px]">
        <div className="min-w-[1200px]">
          {/* header */}
          <div className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
            <div className="flex">
              <div className="w-[520px] shrink-0 flex items-center px-3 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                <span className="w-20 shrink-0">{isAr ? 'الكود' : 'Code'}</span>
                <span className="flex-1 px-2">{isAr ? 'اسم النشاط' : 'Activity Name'}</span>
                <span className="w-12 shrink-0 text-center">{isAr ? 'مدة' : 'Dur'}</span>
                <span className="w-20 shrink-0 text-center">{isAr ? 'البداية' : 'Start'}</span>
                <span className="w-20 shrink-0 text-center">{isAr ? 'النهاية' : 'Finish'}</span>
                <span className="w-12 shrink-0 text-center">%</span>
              </div>
              <div className="flex-1 relative h-10" dir="ltr">
                {ticks.months.map((m, i) => (
                  <div
                    key={`m${i}`}
                    className="absolute top-0 h-[20px] text-[10px] font-black text-slate-700 dark:text-slate-300 border-l border-slate-300 dark:border-slate-700 px-2 overflow-hidden whitespace-nowrap bg-slate-50 dark:bg-slate-900/80"
                    style={{ left: `${m.leftPct}%`, width: `${m.spanPct}%` }}
                  >
                    {m.label}
                  </div>
                ))}
                <div className="absolute bottom-0 h-[20px] start-0 end-0 border-t border-slate-200 dark:border-slate-800">
                  {ticks.minor.map((t, i) => (
                    <div
                      key={`t${i}`}
                      className={`absolute bottom-0 h-full text-center border-s border-slate-200/50 dark:border-slate-800/50 ${t.isWeekend ? 'bg-slate-200/40 dark:bg-slate-800/40' : ''}`}
                      style={{ left: `${t.leftPct}%`, width: scale === 'day' ? `${100 / win!.totalDays}%` : 'auto', minWidth: 16 }}
                    >
                      <span className="text-slate-500 dark:text-slate-400 text-[9px] font-mono">{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* rows */}
          <div className="relative">
            {todayPct != null && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-orange-500 z-10 pointer-events-none shadow-sm"
                style={{ left: `calc(520px + ${todayPct}% * (100% - 520px) / 100)` }}
              />
            )}
            {filtered.map((a, i) => {
              const g = geom(a);
              const barColor = a.milestone ? '' : a.critical ? '#EF4444' : '#3B82F6';
              return (
                <div key={`${a.code}-${i}`} className={`flex border-b border-slate-100 dark:border-slate-800/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-colors ${i % 2 ? 'bg-slate-50/50 dark:bg-slate-950/20' : ''}`} style={{ height: ROW_H + 4 }}>
                  {/* editable columns */}
                  <div className="w-[520px] shrink-0 flex items-center px-3 border-l border-slate-200 dark:border-slate-800">
                    <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 w-20 shrink-0 truncate">{a.code || '—'}</span>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate flex-1 px-2" title={a.name}>
                      {a.milestone && <span className="text-purple-600 me-1">◆</span>}
                      <EditCell idx={i} field="name" current={a.name} width="w-full" />
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 w-12 shrink-0 text-center tabular-nums">
                      <EditCell idx={i} field="duration" current={String(a.duration)} type="number" width="w-10" />
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 w-20 shrink-0 text-center tabular-nums" dir="ltr">
                      <EditCell idx={i} field="start" current={fmtD(a.start)} type="date" width="w-20" />
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 w-20 shrink-0 text-center tabular-nums" dir="ltr">
                      <EditCell idx={i} field="finish" current={fmtD(a.finish)} type="date" width="w-20" />
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 w-12 shrink-0 text-center tabular-nums">
                      <EditCell idx={i} field="pct" current={`${Math.round(a.pct)}%`} type="number" width="w-10" />
                    </span>
                  </div>
                  {/* bar area */}
                  <div className="flex-1 relative" dir="ltr" style={{ height: ROW_H + 4 }}>
                    {scale === 'day' && ticks.minor.filter((t) => t.isWeekend).map((t, j) => (
                      <div key={j} className="absolute top-0 bottom-0 bg-slate-100/60 dark:bg-slate-800/40" style={{ left: `${t.leftPct}%`, width: `${100 / win!.totalDays}%` }} />
                    ))}
                    {g && !a.milestone && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-[16px] rounded-md shadow-sm overflow-hidden"
                        style={{ left: `${g.leftPct}%`, width: `${g.widthPct}%`, backgroundColor: barColor, minWidth: 6 }}
                        title={`${a.name} (${a.code}) — ${Math.round(a.pct)}%`}
                      >
                        {a.pct > 0 && (
                          <div className="h-full bg-slate-900/40" style={{ width: `${Math.min(100, a.pct)}%` }} />
                        )}
                      </div>
                    )}
                    {g && a.milestone && (
                      <div
                        className="absolute top-1/2 w-3 h-3 rotate-45 -translate-y-1/2 -translate-x-1/2 bg-purple-600 border border-purple-800 shadow"
                        style={{ left: `${g.leftPct}%` }}
                        title={`${a.name} (${a.code})`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500">
        {isAr ? `عرض ${filtered.length} من ${activities.length} نشط` : `${filtered.length} of ${activities.length} activities shown`}
      </div>

      <ScheduleCompressionModal
        isOpen={compressionOpen}
        onClose={() => setCompressionOpen(false)}
        activities={activities}
        projectId={projectId}
      />
    </div>
  );
}
