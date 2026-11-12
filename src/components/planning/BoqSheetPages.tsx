'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Layers, Sparkles, Pencil, Check, X, Loader2 } from 'lucide-react';
import type { BoqItem, BoqSection } from '@/types/boq';
import { BoqService } from '@/lib/services/boq.service';
import {
  buildSheetPages, computeBoqTotals, UNASSIGNED_PAGE_ID,
} from '@/lib/boq/inclusion';

const ALL = '__all__';
const fmt = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);

interface Props {
  projectId: string;
  items: BoqItem[];
  sections: BoqSection[];
  activePage: string;
  onChangePage: (id: string) => void;
  canEdit: boolean;
  inclusionFilter: 'all' | 'optional' | 'omitted';
  onInclusionFilter: (f: 'all' | 'optional' | 'omitted') => void;
  onChanged: () => void;
}

/** Excel-style sheet tabs + per-page totals + Add/Omit manager + AI page classification. */
export function BoqSheetPages({ projectId, items, sections, activePage, onChangePage, canEdit, inclusionFilter, onInclusionFilter, onChanged }: Props) {
  const pages = useMemo(() => buildSheetPages(sections, items), [sections, items]);
  const allTotals = useMemo(() => computeBoqTotals(items), [items]);
  const current = pages.find((p) => p.id === activePage);
  const totals = current ? current.totals : allTotals;
  const pageItems = current ? current.items : items;

  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [aiOpen, setAiOpen] = useState(false);

  const saveRename = async (sec: BoqSection) => {
    const name = renameVal.trim();
    setRenaming(null);
    if (!name || name === sec.name_ar) return;
    const ok = await BoqService.saveSection({ ...sec, name_ar: name, name_en: name });
    if (ok) { toast.success('تم تعديل اسم الصفحة'); onChanged(); } else toast.error('فشل تعديل الاسم');
  };

  const toggleOptional = async (sec: BoqSection) => {
    await BoqService.saveSection({ ...sec, is_optional: !sec.is_optional });
    onChanged();
  };

  const tabCls = (on: boolean) =>
    `shrink-0 flex flex-col items-start gap-0.5 px-3 py-2 rounded-t-xl border-b-2 text-xs font-bold transition cursor-pointer ${
      on ? 'bg-white dark:bg-slate-900 border-emerald-600 text-emerald-800 dark:text-emerald-300 shadow-sm'
         : 'bg-slate-100/70 dark:bg-slate-800/50 border-transparent text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>صفحات المقايسة (Sheets)</span>
          <span className="text-[11px] font-medium text-slate-400">كل شيت مستورد = صفحة مستقلة</span>
        </div>
        {canEdit && (
          <button type="button" onClick={() => setAiOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold cursor-pointer">
            <Sparkles className="w-3.5 h-3.5" /> تصنيف ذكي للبنود
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto px-3 pt-3 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800" role="tablist">
        <button type="button" role="tab" aria-selected={activePage === ALL} onClick={() => onChangePage(ALL)} className={tabCls(activePage === ALL)}>
          <span>الكل</span>
          <span className="text-[10px] font-mono text-slate-400">{items.length} · {fmt(allTotals.contract)}</span>
        </button>
        {pages.map((p) => (
          <div key={p.id} className="relative group">
            {renaming === p.id && p.section ? (
              <div className="flex items-center gap-1 px-2 py-2">
                <input autoFocus value={renameVal} onChange={(e) => setRenameVal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveRename(p.section!); if (e.key === 'Escape') setRenaming(null); }}
                  className="w-44 px-2 py-1 text-xs rounded-lg border border-emerald-300 bg-white dark:bg-slate-800" />
                <button type="button" aria-label="حفظ" onClick={() => saveRename(p.section!)}><Check className="w-4 h-4 text-emerald-600" /></button>
                <button type="button" aria-label="إلغاء" onClick={() => setRenaming(null)}><X className="w-4 h-4 text-slate-400" /></button>
              </div>
            ) : (
              <button type="button" role="tab" aria-selected={activePage === p.id} onClick={() => onChangePage(p.id)}
                onDoubleClick={() => { if (canEdit && p.section) { setRenaming(p.id); setRenameVal(p.name); } }}
                className={tabCls(activePage === p.id)} title={p.section?.source_sheet_name || p.name}>
                <span className="flex items-center gap-1">
                  {p.id === UNASSIGNED_PAGE_ID && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                  {p.name}
                  {p.section?.is_optional && <span className="px-1 rounded bg-amber-100 text-amber-700 dark:text-amber-300 text-[9px]">اختياري</span>}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{p.items.length} · {fmt(p.totals.contract)}</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Compact KPI strip + quick filters (actions live on each table row) */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 text-xs">
        <span className="font-bold text-emerald-800 dark:text-emerald-300">صافي: <span className="font-mono font-black text-sm">{fmt(totals.contract)}</span></span>
        <span className="text-slate-500">أساسي <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{fmt(totals.base)}</span></span>
        {totals.optionalAdded > 0 && <span className="text-emerald-700 dark:text-emerald-300">+ مُضاف <span className="font-mono font-bold">{fmt(totals.optionalAdded)}</span></span>}
        {totals.optionalPending > 0 && <span className="text-amber-600">اختياري غير محسوب <span className="font-mono font-bold">{fmt(totals.optionalPending)}</span></span>}
        {totals.omitted > 0 && <span className="text-rose-600">Omit <span className="font-mono font-bold line-through">{fmt(totals.omitted)}</span></span>}
        <div className="ms-auto flex items-center gap-1" role="group" aria-label="فلتر الإدراج">
          {([
            ['all', `كل البنود (${pageItems.length})`],
            ['optional', `اختياري (${totals.counts.optional_pending + totals.counts.optional_added})`],
            ['omitted', `محذوف Omit (${totals.counts.omitted})`],
          ] as const).map(([k, l]) => (
            <button key={k} type="button" onClick={() => onInclusionFilter(k)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${inclusionFilter === k ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      {canEdit && (
        <p className="px-4 pb-2 text-[10px] text-slate-400">💡 الإضافة / Omit / الاستعادة من عمود الإجراءات في الجدول مباشرة. Omit للبند الأساسي يظهر عند المرور على الصف.</p>
      )}

      {/* Page tools */}
      {current?.section && canEdit && (
        <div className="flex flex-wrap items-center gap-2 px-4 pb-3 text-[11px]">
          <button type="button" onClick={() => { setRenaming(current.id); setRenameVal(current.name); }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 cursor-pointer"><Pencil className="w-3 h-3" /> إعادة تسمية</button>
          <label className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 cursor-pointer">
            <input type="checkbox" checked={!!current.section.is_optional} onChange={() => toggleOptional(current.section!)} />
            صفحة اختيارية
          </label>
          {current.section.source_sheet_name && <span className="text-slate-400">الشيت الأصلي: {current.section.source_sheet_name}</span>}
        </div>
      )}

      {aiOpen && (
        <AiClassifyModal projectId={projectId} items={items} sections={sections}
          onClose={() => setAiOpen(false)} onApplied={() => { setAiOpen(false); onChanged(); }} />
      )}
    </div>
  );
}

interface Suggestion { itemId: string; pageId: string | null; newPageName?: string; confidence?: number; reason?: string }

/** AI proposes a page for each item; user edits; nothing saved until confirm. */
function AiClassifyModal({ projectId, items, sections, onClose, onApplied }: {
  projectId: string; items: BoqItem[]; sections: BoqSection[]; onClose: () => void; onApplied: () => void;
}) {
  const [scope, setScope] = useState<'unassigned' | 'all'>('unassigned');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<Suggestion[] | null>(null);
  const [source, setSource] = useState('');
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const heuristic = (it: BoqItem): Suggestion => {
    const hay = `${it.item_code} ${it.notes ?? ''}`.toLowerCase();
    const hit = sections.find((s) => {
      const n = (s.source_sheet_name || s.name_ar).toLowerCase();
      return n && hay.includes(n);
    });
    return { itemId: it.id, pageId: hit?.id ?? null, confidence: hit ? 0.5 : 0, reason: hit ? 'مطابقة نص الملاحظات/الكود' : 'لا توجد مطابقة' };
  };

  const run = async () => {
    const target = scope === 'all' ? items : items.filter((i) => !i.section_id);
    if (!target.length) return toast.info('لا توجد بنود لتصنيفها');
    setLoading(true);
    try {
      const res = await fetch('/api/boq/ai-assist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'classify_items',
          pages: sections.map((s) => ({ id: s.id, name: s.name_ar })),
          items: target.slice(0, 300).map((i) => ({ id: i.id, code: i.item_code, description: i.description_en || i.description_ar, notes: i.notes })),
        }),
      });
      const json = await res.json();
      if (json.error === 'no_ai_key' || !Array.isArray(json.assignments)) {
        toast.warning('الذكاء الاصطناعي غير متاح — تم استخدام مطابقة تلقائية بسيطة');
        setRows(target.map(heuristic)); setSource('heuristic');
      } else {
        const valid = new Set(sections.map((s) => s.id));
        setRows(json.assignments.filter((a: Suggestion) => byId.has(a.itemId))
          .map((a: Suggestion) => ({ ...a, pageId: a.pageId && valid.has(a.pageId) ? a.pageId : null })));
        setSource(`${json.meta?.provider ?? 'AI'} · ${json.meta?.model ?? ''}`);
      }
    } catch {
      setRows(target.map(heuristic)); setSource('heuristic');
    } finally { setLoading(false); }
  };

  const apply = async () => {
    if (!rows) return;
    setSaving(true);
    try {
      const created = new Map<string, string>();
      const map: Record<string, string> = {};
      let order = sections.length;
      for (const r of rows) {
        let sid = r.pageId;
        if (!sid && r.newPageName?.trim()) {
          const key = r.newPageName.trim();
          if (!created.has(key)) {
            const sec = await BoqService.ensureSheetSection(projectId, key, { sortOrder: ++order });
            if (sec) created.set(key, sec.id);
          }
          sid = created.get(key) ?? null;
        }
        if (sid) map[r.itemId] = sid;
      }
      const n = await BoqService.applyAssignments(projectId, map);
      toast.success(`تم نقل ${n} بند إلى صفحاتها`);
      onApplied();
    } finally { setSaving(false); }
  };

  const setRow = (i: number, patch: Partial<Suggestion>) => setRows((rs) => rs!.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[88vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-600" />تصنيف ذكي للبنود إلى الصفحات</h3>
            <p className="text-[11px] text-slate-500">١) اختر النطاق ← ٢) اقتراح الذكاء الاصطناعي ← ٣) عدّل ما تريد ← ٤) تأكيد. لا يتم حفظ أي شيء قبل التأكيد.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <select value={scope} onChange={(e) => setScope(e.target.value as 'unassigned' | 'all')}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <option value="unassigned">البنود غير المصنفة فقط ({items.filter((i) => !i.section_id).length})</option>
            <option value="all">كل البنود ({items.length})</option>
          </select>
          <button type="button" onClick={run} disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} اقترح
          </button>
          {source && <span className="text-[11px] text-slate-400">المصدر: {source}</span>}
        </div>
        <div className="flex-1 overflow-y-auto px-4">
          {rows && (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white dark:bg-slate-900 text-slate-500">
                <tr><th className="text-start py-2">البند</th><th className="text-start">الصفحة المقترحة</th><th>الثقة</th><th className="text-start">السبب</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((r, i) => {
                  const it = byId.get(r.itemId);
                  const isNew = !r.pageId && r.newPageName !== undefined;
                  return (
                    <tr key={r.itemId}>
                      <td className="py-1.5 max-w-xs"><span className="font-mono text-slate-500">{it?.item_code}</span> <span className="truncate">{it?.description_ar || it?.description_en}</span></td>
                      <td className="py-1.5">
                        <select value={r.pageId ?? (isNew ? '__new__' : '')}
                          onChange={(e) => setRow(i, e.target.value === '__new__' ? { pageId: null, newPageName: r.newPageName ?? '' } : { pageId: e.target.value || null, newPageName: undefined })}
                          className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 max-w-[220px]">
                          <option value="">— بدون —</option>
                          {sections.map((s) => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
                          <option value="__new__">+ صفحة جديدة…</option>
                        </select>
                        {isNew && (
                          <input value={r.newPageName ?? ''} onChange={(e) => setRow(i, { newPageName: e.target.value })} placeholder="اسم الصفحة"
                            className="mt-1 block text-xs px-2 py-1 rounded-lg border border-violet-300 bg-white dark:bg-slate-800" />
                        )}
                      </td>
                      <td className="text-center font-mono">{r.confidence != null ? `${Math.round(r.confidence * 100)}%` : '—'}</td>
                      <td className="text-slate-500">{r.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800">إلغاء</button>
          <button type="button" onClick={apply} disabled={!rows || saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white disabled:opacity-40">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} تأكيد وتطبيق
          </button>
        </div>
      </div>
    </div>
  );
}
