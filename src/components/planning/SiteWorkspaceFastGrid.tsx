'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, Save, RotateCcw, Sparkles, AlertCircle, CheckCircle2,
  Filter, FileSpreadsheet, Loader2, ExternalLink
} from 'lucide-react';
import { SiteTask } from '@/lib/services/siteTask.service';
import { DailyProgressService } from '@/lib/services/dailyProgress.service';
import { useAuth } from '@/lib/stores/useAuthStore';
import { toast } from 'sonner';
import { DailyDiscipline } from '@/types/planning';
import { classifyActivity } from '@/lib/planning/activityClassifier';
import { DISCIPLINE_LABELS } from '@/components/planning/DailyProgressForm';

function mapToDailyDiscipline(disc: string): DailyDiscipline {
  const d = disc.toLowerCase();
  if (d === 'civil' || d === 'مدني' || d.includes('مدن') || d.includes('خرسان') || d.includes('حفر')) return 'civil';
  if (d === 'finishing' || d.includes('تشطيب') || d.includes('معمار')) return 'finishing';
  if (d === 'mep' || d === 'ميكانيكا' || d === 'كهرباء' || d.includes('كهروميكانيك')) return 'mep';
  if (d === 'landscape' || d.includes('لاندسكيب') || d.includes('زراعة') || d.includes('تشجير')) return 'landscape';
  if (d === 'water_features' || d.includes('بحيرات') || d.includes('شلال') || d.includes('سباح')) return 'water_features';
  if (d === 'other' || d === 'عامة' || d === 'أعمال تعاقدية') return 'other';
  return 'other';
}

function formatDisciplineLabel(d: string): string {
  if (d in DISCIPLINE_LABELS) {
    return DISCIPLINE_LABELS[d as DailyDiscipline].labelAr;
  }
  return d;
}

export interface FastGridRow {
  taskId: string;
  taskCode: string;
  taskTitle: string;
  discipline: string;
  disciplineCode?: DailyDiscipline;
  boqItemId: string;
  boqCode: string;
  zoneLabel: string;
  unit: string;
  contractQty: number;
  rateEgp: number;
  previousQty: number;
  previousPct: number;
  todayQty: number;
  todayPct: number;
  newCumulativeQty: number;
  newTotalPct: number;
  notes: string;
  isModified: boolean;
  voRequested?: boolean;
}

interface SiteWorkspaceFastGridProps {
  tasks: SiteTask[];
  projectId: string;
  zoneMap?: Record<string, string>;
  onOpenWizard: (task: SiteTask) => void;
  onRefresh: () => void;
}

export function SiteWorkspaceFastGrid({
  tasks,
  projectId,
  zoneMap = {},
  onOpenWizard,
  onRefresh,
}: SiteWorkspaceFastGridProps) {
  const { user } = useAuth();
  const [rows, setRows] = useState<FastGridRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');

  // Initialize rows from tasks and fetch cumulative quantities
  useEffect(() => {
    if (!tasks || !projectId) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch cumulative history for all tasks in parallel
    Promise.all(tasks.map((t) => DailyProgressService.getCumulativeQtyByTask(t.id)))
      .then((cumMaps) => {
        const initialRows: FastGridRow[] = tasks.map((t, idx) => {
          const cumMap = cumMaps[idx] || {};
          const boqId = t.boq_item_id || '';
          const prevQty = boqId ? Number(cumMap[boqId]) || 0 : 0;
          const contractQty = Number(t.planned_qty) || 1;
          const prevPct = contractQty > 0 ? Math.round((prevQty / contractQty) * 10000) / 100 : Number(t.progress_pct) || 0;
          const zoneName = (t.zone && typeof t.zone === 'object' && 'name_ar' in t.zone ? t.zone.name_ar : null) || (t.zone_id ? zoneMap[t.zone_id] : null) || '—';

          const rawDiscipline =
            (t as unknown as { discipline?: string }).discipline ||
            (t as unknown as { activity?: { discipline?: string } }).activity?.discipline ||
            classifyActivity(t.title_ar).discipline ||
            'عامة';
          const disciplineCode: DailyDiscipline = mapToDailyDiscipline(rawDiscipline);

          return {
            taskId: t.id,
            taskCode: t.task_code || `#${t.id.slice(0, 6)}`,
            taskTitle: t.title_ar,
            discipline: rawDiscipline,
            disciplineCode,
            boqItemId: boqId,
            boqCode: boqId ? `#${boqId.slice(0, 5)}` : '—',
            zoneLabel: zoneName,
            unit: t.unit || 'م3',
            contractQty,
            rateEgp: 0,
            previousQty: prevQty,
            previousPct: prevPct,
            todayQty: 0,
            todayPct: 0,
            newCumulativeQty: prevQty,
            newTotalPct: prevPct,
            notes: '',
            isModified: false,
            voRequested: false,
          };
        });

        setRows(initialRows);
      })
      .catch((err) => {
        console.warn('FastGrid cumulative load error:', err);
      })
      .finally(() => setLoading(false));
  }, [tasks, projectId, zoneMap]);

  // Update today's quantity for a row (RULE-002: auto-syncs todayPct)
  const handleQtyChange = useCallback((taskId: string, newQtyVal: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.taskId !== taskId) return r;
        const cleanQty = Math.max(0, newQtyVal);
        const newCum = r.previousQty + cleanQty;
        const newTotalPct = r.contractQty > 0 
          ? Math.min(100, Math.round((newCum / r.contractQty) * 100)) 
          : (cleanQty > 0 ? 100 : r.previousPct);
        const todayPct = r.contractQty > 0 
          ? Math.round((cleanQty / r.contractQty) * 10000) / 100 
          : (cleanQty > 0 ? 100 : 0);

        return {
          ...r,
          todayQty: cleanQty,
          todayPct,
          newCumulativeQty: newCum,
          newTotalPct,
          isModified: cleanQty > 0 || r.notes.length > 0,
        };
      })
    );
  }, []);

  // Update today's percentage for a row (RULE-002: auto-syncs todayQty)
  const handlePctChange = useCallback((taskId: string, newPctVal: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.taskId !== taskId) return r;
        const cleanPct = Math.max(0, Math.min(100, newPctVal));
        const computedQty = r.contractQty > 0 
          ? Math.round(((cleanPct / 100) * r.contractQty) * 1000) / 1000 
          : cleanPct;
        const newCum = r.previousQty + computedQty;
        const newTotalPct = r.contractQty > 0 
          ? Math.min(100, Math.round((newCum / r.contractQty) * 100)) 
          : Math.min(100, Math.round(r.previousPct + cleanPct));

        return {
          ...r,
          todayQty: computedQty,
          todayPct: cleanPct,
          newCumulativeQty: newCum,
          newTotalPct,
          isModified: cleanPct > 0 || computedQty > 0 || r.notes.length > 0,
        };
      })
    );
  }, []);

  const handleNotesChange = useCallback((taskId: string, notes: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.taskId !== taskId) return r;
        return {
          ...r,
          notes,
          isModified: r.todayQty > 0 || r.todayPct > 0 || notes.trim().length > 0,
        };
      })
    );
  }, []);

  const handleVORequestToggle = useCallback((taskId: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.taskId !== taskId) return r;
        return {
          ...r,
          voRequested: !r.voRequested,
          isModified: true, // Flag as modified to re-save and trigger validation bypass
        };
      })
    );
  }, []);

  // Memoize available disciplines from rows
  const availableDisciplines = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.discipline && r.discipline !== '—') {
        set.add(r.discipline);
      }
    });
    return Array.from(set).sort();
  }, [rows]);

  // Memoize available zones from rows
  const availableZones = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.zoneLabel && r.zoneLabel !== '—') {
        set.add(r.zoneLabel);
      }
    });
    return Array.from(set).sort();
  }, [rows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSearch =
          r.taskTitle.toLowerCase().includes(q) ||
          r.taskCode.toLowerCase().includes(q) ||
          r.zoneLabel.toLowerCase().includes(q) ||
          r.discipline.toLowerCase().includes(q) ||
          formatDisciplineLabel(r.discipline).toLowerCase().includes(q);
        if (!matchSearch) return false;
      }
      if (selectedDiscipline !== 'all') {
        const matchesDiscipline =
          r.discipline === selectedDiscipline ||
          r.disciplineCode === selectedDiscipline;
        if (!matchesDiscipline) return false;
      }
      if (selectedZone !== 'all' && r.zoneLabel !== selectedZone) {
        return false;
      }
      return true;
    });
  }, [rows, searchQuery, selectedDiscipline, selectedZone]);

  const modifiedRows = useMemo(
    () => rows.filter((r) => r.isModified && (r.todayQty > 0 || r.todayPct > 0 || r.notes.trim().length > 0)),
    [rows]
  );

  // Reset filter state
  const hasActiveFilters = searchQuery.trim().length > 0 || selectedDiscipline !== 'all' || selectedZone !== 'all';

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedDiscipline('all');
    setSelectedZone('all');
  }, []);

  // Single Row Save Handler (Enter key or row button)
  const handleSaveRow = async (taskId: string) => {
    const row = rows.find((r) => r.taskId === taskId);
    if (!row || (!row.todayQty && !row.todayPct && !row.notes)) {
      toast.info('أدخل كمية أو نسبة لحفظ البند');
      return;
    }

    setSaving(true);
    try {
      const res = await DailyProgressService.batchSaveDailyProgressLines(
        projectId,
        user?.id || 'site_engineer',
        user?.user_metadata?.full_name || 'مهندس الموقع',
        [{
          taskId: row.taskId,
          boqItemId: row.boqItemId,
          qtyToday: row.todayQty,
          todayPct: row.todayPct,
          cumulativePct: row.newTotalPct,
          discipline: row.disciplineCode || mapToDailyDiscipline(row.discipline),
          zone: row.zoneLabel !== '—' ? row.zoneLabel : undefined,
          notes: row.notes.trim() || undefined,
          isClaimableVo: row.voRequested,
        }]
      );

      if (res.success) {
        toast.success(`تم حفظ واعتماد ${row.taskCode} بنجاح!`);
        onRefresh();
      } else {
        toast.error(res.error || 'فشل حفظ البند');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Bulk Save Handler
  const handleBulkSave = async () => {
    if (!modifiedRows.length) {
      toast.info('لم يتم تعديل أي كميات للحفظ');
      return;
    }

    setSaving(true);
    try {
      const itemsToSave = modifiedRows.map((r) => ({
        taskId: r.taskId,
        boqItemId: r.boqItemId,
        qtyToday: r.todayQty,
        todayPct: r.todayPct,
        cumulativePct: r.newTotalPct,
        discipline: r.disciplineCode || mapToDailyDiscipline(r.discipline),
        zone: r.zoneLabel !== '—' ? r.zoneLabel : undefined,
        notes: r.notes.trim() || undefined,
        isClaimableVo: r.voRequested,
      }));

      const res = await DailyProgressService.batchSaveDailyProgressLines(
        projectId,
        user?.id || 'site_engineer',
        user?.user_metadata?.full_name || 'مهندس الموقع',
        itemsToSave
      );

      if (res.success) {
        toast.success(`تم حفظ واعتماد ${res.updatedCount} بند بنجاح وتحديث نسب الإنجاز!`);
        onRefresh();
      } else {
        toast.error(res.error || 'فشل الحفظ المجمع للبنود');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ المجمع';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        todayQty: 0,
        todayPct: 0,
        newCumulativeQty: r.previousQty,
        newTotalPct: r.previousPct,
        notes: '',
        isModified: false,
      }))
    );
    toast.info('تم إلغاء جميع التعديلات المؤقتة');
  };

  return (
    <div className="space-y-4 fast-grid-container relative z-0">
      {/* Search & Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في مهام اليوم بالاسم أو الكود..."
              className="w-full pr-8 pl-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="relative">
            <select
              data-testid="grid-filter-discipline"
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs focus:ring-2 focus:ring-emerald-500/20 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">كل التخصصات</option>
              {availableDisciplines.map((d) => (
                <option key={d} value={d}>
                  {formatDisciplineLabel(d)}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              data-testid="grid-filter-zone"
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs focus:ring-2 focus:ring-emerald-500/20 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">كل المناطق (الزون)</option>
              {availableZones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              data-testid="grid-reset-filters"
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-xs font-medium"
              title="إعادة ضبط الفلاتر"
            >
              <RotateCcw className="w-3 h-3" />
              <span>إلغاء الفلاتر</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <span>المعروض: <strong className="text-slate-800 dark:text-slate-100 font-mono">{filteredRows.length}</strong> من <strong className="text-slate-800 dark:text-slate-100 font-mono">{rows.length}</strong></span>
          <span>•</span>
          <span>المهام المعدلة: <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{modifiedRows.length}</strong></span>
          {modifiedRows.length > 0 && (
            <button
              type="button"
              onClick={handleBulkSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>حفظ الكل ({modifiedRows.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Excel Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
            <p className="text-xs">جاري تحميل شيت مهام الموقع والكميات...</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-xs">
            لا توجد مهام مطابقة لخيارات البحث
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-[11px]">
                <tr>
                  <th className="p-3 w-20">الكود</th>
                  <th className="p-3">المهمة الميدانية</th>
                  <th className="p-3 w-28">المنطقة</th>
                  <th className="p-3 w-28 text-center">التخصص</th>
                  <th className="p-3 w-16 text-center">الوحدة</th>
                  <th className="p-3 w-24 text-center">كمية العقد</th>
                  <th className="p-3 w-24 text-center">المنفذ سابقاً</th>
                  <th className="p-3 w-32 text-center bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 border-x border-emerald-200 dark:border-emerald-800">
                    منفذ اليوم (كمية)
                  </th>
                  <th className="p-3 w-24 text-center bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 border-l border-amber-200 dark:border-amber-800">
                    نسبة اليوم %
                  </th>
                  <th className="p-3 w-28 text-center">التراكمي الجديد</th>
                  <th className="p-3 w-24 text-center">النسبة الكلية</th>
                  <th className="p-3">ملاحظات</th>
                  <th className="p-3 w-16 text-center">تفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-700 dark:text-slate-200">
                {filteredRows.map((r) => {
                  const originalTask = tasks.find((t) => t.id === r.taskId);
                  return (
                    <tr
                      key={r.taskId}
                      className={`group relative focus-within:z-10 focus-within:scale-[1.01] focus-within:shadow-xl transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        r.isModified ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : ''
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-slate-400 dark:text-slate-500">{r.taskCode}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                        <div className="truncate max-w-xs">{r.taskTitle}</div>
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{r.zoneLabel}</td>
                      <td className="p-3 text-center">
                        <span
                          data-testid={`badge-discipline-${r.taskId}`}
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            r.disciplineCode && DISCIPLINE_LABELS[r.disciplineCode]
                              ? DISCIPLINE_LABELS[r.disciplineCode].color
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {formatDisciplineLabel(r.discipline)}
                        </span>
                      </td>
                      <td className="p-3 text-center text-slate-400 dark:text-slate-500">{r.unit}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                        {r.contractQty.toLocaleString()}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400">
                        {r.previousQty.toLocaleString()}
                      </td>

                      {/* Editable Today Qty (Option 2 core) */}
                      <td className="p-2 bg-emerald-50/30 dark:bg-emerald-950/10 border-x border-emerald-100 dark:border-emerald-900/40 text-center">
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          title="أدخل الكمية المنفذة اليوم (اضغط Enter للحفظ)"
                          value={r.todayQty || ''}
                          onChange={(e) => handleQtyChange(r.taskId, parseFloat(e.target.value) || 0)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRow(r.taskId);
                          }}
                          placeholder="0.00"
                          className="w-24 qty-input text-center font-mono font-black py-1.5 px-2 border border-emerald-300 dark:border-emerald-700 rounded-lg bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500/20 focus:scale-110 focus:z-20 relative transition-transform"
                        />
                      </td>

                      {/* Editable Today % (Synchronized) */}
                      <td className="p-2 bg-amber-50/30 dark:bg-amber-950/10 border-l border-amber-100 dark:border-amber-900/40 text-center">
                        <div className="relative w-20 mx-auto">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            title="أدخل النسبة المنفذة اليوم (اضغط Enter للحفظ)"
                            value={r.todayPct || ''}
                            onChange={(e) => handlePctChange(r.taskId, parseFloat(e.target.value) || 0)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRow(r.taskId);
                            }}
                            placeholder="0%"
                            className="w-full text-center font-mono font-black py-1.5 px-2 border border-amber-300 dark:border-amber-700 rounded-lg bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 focus:ring-2 focus:ring-amber-500/20 focus:scale-110 focus:z-20 relative transition-transform"
                          />
                        </div>
                      </td>

                      {/* Calculated New Cumulative */}
                      <td className="p-3 text-center font-mono font-black text-slate-900 dark:text-slate-100 relative">
                        {r.newCumulativeQty.toLocaleString()} {r.unit}
                        {r.newCumulativeQty > r.contractQty && (
                          <div className="absolute top-0 right-0 -mt-2 -mr-2">
                            <button
                              type="button"
                              onClick={() => handleVORequestToggle(r.taskId)}
                              className={`text-[9px] px-1.5 py-0.5 rounded shadow whitespace-nowrap transition-colors ${r.voRequested ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600 animate-pulse'} text-white z-20`}
                            >
                              {r.voRequested ? 'طلب V.O. (نشط)' : 'تجاوز! طلب أمر تغييري'}
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Calculated New Total % */}
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-black font-mono text-[11px] ${
                            r.newTotalPct >= 100
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : r.isModified
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {r.newTotalPct}%
                        </span>
                      </td>

                      {/* Notes Input */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={r.notes}
                          onChange={(e) => handleNotesChange(r.taskId, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRow(r.taskId);
                          }}
                          placeholder="ملاحظات سريعة (Enter للحفظ)..."
                          className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:scale-[1.02] focus:z-20 relative transition-transform"
                        />
                      </td>

                      {/* Row Actions: Save + Wizard */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {r.isModified && (
                            <button
                              type="button"
                              onClick={() => handleSaveRow(r.taskId)}
                              disabled={saving}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-50"
                              title="حفظ هذا البند الآن (Enter)"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => originalTask && onOpenWizard(originalTask)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                            title="فتح المعالج المركز للتفاصيل والصور"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
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

      {/* Floating Bottom Action Bar for Bulk Save */}
      {modifiedRows.length > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-800 dark:border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>تم تعديل <strong className="font-mono text-emerald-400 font-black">{modifiedRows.length}</strong> مهام</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={saving}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white dark:hover:text-slate-200 transition"
            >
              إلغاء
            </button>
            <button
              onClick={handleBulkSave}
              disabled={saving}
              className="px-5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري الحفظ المجمع...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ واعتماد الكل دفعة واحدة</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
