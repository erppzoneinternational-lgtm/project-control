'use client';

/**
 * Multi-Sheet BOQ Importer — reads contractor invoice/BOQ workbooks like
 * "Invoice No.01.xlsx": one BOQ table per sheet (Civil Lagoon 01, Civil Pump room, ...),
 * auto-detects the header row (SN / Item / Unit / Quantity / Unit Price / Total),
 * lets the user pick which sheets to import, rename each sheet to a building/zone,
 * edit any cell inline before import, then imports everything grouped.
 */

import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet, Loader2, X, Check, Table2,
  Building2, Pencil, ChevronDown, ChevronUp, Search, Sparkles,
} from 'lucide-react';
import { looksOptional, prettySheetName } from '@/lib/boq/inclusion';
import { parseWorkbookMatrices, sheetToMatrix } from '@/lib/boq/smartParse';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { BoqService } from '@/lib/services/boq.service';
import { useAuth } from '@/lib/stores/useAuthStore';
import { logger } from '@/lib/logger';

export interface BoqImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  existingItems: unknown[];
  onImportComplete: () => void;
}

interface ParsedRow {
  sn: string;
  description: string;
  unit: string;
  qty: number;
  rate: number;
  total: number;
  include: boolean;
  spec?: string;
  group?: string;
}

interface ParsedSheet {
  sheetName: string;
  buildingName: string; // editable — defaults to sheet name
  rows: ParsedRow[];
  include: boolean;
  expanded: boolean;
  isOptional: boolean;
  aiNote?: string;
  sampleRows: string[][];
  sourceSheet: string;
  heading: string | null;
  kind: string;
}

const num = (v: unknown): number => {
  if (v == null || v === '') return 0;
  const n = Number(String(v).replace(/[,%\s]/g, ''));
  return isNaN(n) ? 0 : n;
};

/** Find the header row containing SN/Item + Unit + Quantity patterns */
function detectHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const joined = rows[i].map((c) => String(c ?? '').trim().toUpperCase()).join('|');
    const hasSN = /(^|\|)SN(\||$)|S\.N|#|م/.test(joined);
    const hasItem = /ITEM|DESCRIPTION|البند|الوصف/.test(joined);
    const hasUnit = /UNIT|الوحدة/.test(joined);
    const hasQty = /QTY|QUANTITY|الكمية/.test(joined);
    if (hasSN && hasItem && hasUnit && hasQty) return i;
  }
  return -1;
}

/** Parse one worksheet into BOQ rows */
function parseSheet(ws: XLSX.WorkSheet): ParsedRow[] {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '', blankrows: false });
  if (!matrix.length) return [];
  const hdrIdx = detectHeaderRow(matrix);
  if (hdrIdx < 0) return [];

  // locate columns from header row
  const hdr = matrix[hdrIdx].map((c: unknown) => String(c ?? '').trim().toUpperCase());
  const colOf = (...patterns: string[]) => {
    for (const p of patterns) {
      const idx = hdr.findIndex((h) => h.includes(p));
      if (idx >= 0) return idx;
    }
    return -1;
  };
  const cSN = colOf('SN', 'S.N', '#', 'م');
  const cItem = colOf('ITEM', 'DESCRIPTION', 'البند', 'الوصف');
  const cUnit = colOf('UNIT', 'الوحدة');
  const cQty = colOf('QUANTITY', 'QTY', 'الكمية');
  const cRate = colOf('UNIT PRICE', 'RATE', 'PRICE', 'الفئة', 'السعر');
  const cTotal = colOf('TOTAL', 'الإجمالي');

  const out: ParsedRow[] = [];
  for (let i = hdrIdx + 1; i < matrix.length; i++) {
    const r = matrix[i];
    if (!r || !r.length) continue;
    const snVal = cSN >= 0 ? String(r[cSN] ?? '').trim() : '';
    const desc = cItem >= 0 ? String(r[cItem] ?? '').trim() : '';
    // data row = numeric SN or has description + any number
    const isData = /^\d+$/.test(snVal) || (desc && (cQty >= 0 ? num(r[cQty]) > 0 || num(r[cRate]) > 0 : true));
    if (!isData) continue;
    if (!desc && !snVal) continue;

    const qty = cQty >= 0 ? num(r[cQty]) : 0;
    const rate = cRate >= 0 ? num(r[cRate]) : 0;
    const total = cTotal >= 0 ? num(r[cTotal]) : qty * rate;

    out.push({
      sn: snVal || String(out.length + 1),
      description: desc || '(بدون وصف)',
      unit: cUnit >= 0 ? String(r[cUnit] ?? '').trim() : '',
      qty,
      rate,
      total,
      include: true,
    });
  }
  return out;
}

export const BoqMultiSheetImporter: React.FC<BoqImportWizardProps> = ({
  isOpen, onClose, projectId, onImportComplete,
}) => {
  const { user } = useAuth();
  const [parsing, setParsing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [sheets, setSheets] = useState<ParsedSheet[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [editingBuilding, setEditingBuilding] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    setParsing(true);
    setSheets([]);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'array' });
        const matrices = wb.SheetNames.map((name) => ({
          name,
          ...sheetToMatrix(XLSX as never, wb.Sheets[name] as never),
        }));
        const { pages } = parseWorkbookMatrices(matrices);
        const parsed: ParsedSheet[] = pages.map((p) => {
          const mx = matrices.find((x) => x.name === p.sheetName)?.matrix ?? [];
          return {
            sheetName: p.key,
            sourceSheet: p.sheetName,
            heading: p.heading,
            kind: p.kind,
            buildingName: p.heading ? p.pageName : prettySheetName(p.sheetName),
            rows: p.rows.map((r) => ({ sn: r.sn, description: r.description, unit: r.unit, qty: r.qty, rate: r.rate, total: r.total, include: true, spec: r.spec, group: r.group })),
            include: p.include,
            expanded: false,
            isOptional: p.isOptional || looksOptional(p.pageName),
            aiNote: p.note,
            sampleRows: mx.slice(0, 14).map((r) => (r || []).slice(0, 10).map((c) => String(c ?? ''))),
          };
        });
        if (!parsed.length) {
          toast.error('لم يتم العثور على جداول BOQ في أي شيت — تأكد من وجود صف رأس (SN / Item / Unit / Quantity)');
        } else {
          toast.success(`تم اكتشاف ${parsed.filter((p) => p.include).length} صفحة BOQ من ${wb.SheetNames.length} شيت`);
        }
        setSheets(parsed);
        if (parsed.length) void runAiAnalyze(parsed.filter((p) => !p.heading));
      } catch (err: unknown) {
        const errInfo = err as { message?: string; code?: string; details?: string } | null | undefined;
        logger.error('Failed to parse file', { detail: err });
        toast.error('فشل قراءة الملف: ' + (errInfo?.message || ''));
      } finally {
        setParsing(false);
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const [aiState, setAiState] = useState<'idle' | 'running' | 'done' | 'off'>('idle');
  /** AI suggests page names / optional flags / warnings. User can still edit everything. */
  const runAiAnalyze = async (parsed: ParsedSheet[]) => {
    setAiState('running');
    try {
      const res = await fetch('/api/boq/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze_sheets', sheets: parsed.map((p) => ({ sheetName: p.sourceSheet, sampleRows: p.sampleRows })) }),
      });
      const json = await res.json();
      if (!Array.isArray(json.sheets)) { setAiState('off'); return; }
      const byName = new Map<string, { pageName?: string; isOptional?: boolean; notes?: string }>(
        json.sheets.map((s: { sheetName: string }) => [s.sheetName, s])
      );
      setSheets((prev) => prev.map((sh) => {
        const s = sh.heading ? undefined : byName.get(sh.sourceSheet);
        if (!s) return sh;
        return {
          ...sh,
          buildingName: s.pageName?.trim() || sh.buildingName,
          isOptional: typeof s.isOptional === 'boolean' ? s.isOptional : sh.isOptional,
          aiNote: s.notes || undefined,
        };
      }));
      setAiState('done');
    } catch {
      setAiState('off');
    }
  };

  const filteredSheets = useMemo(() => {
    if (!search.trim()) return sheets;
    const s = search.trim().toLowerCase();
    return sheets
      .map((sh) => ({
        ...sh,
        rows: sh.rows.filter(
          (r) => r.description.toLowerCase().includes(s) || r.sn.includes(s)
        ),
      }))
      .filter((sh) => sh.rows.length > 0);
  }, [sheets, search]);

  const totals = useMemo(() => {
    const included = sheets.filter((s) => s.include);
    return {
      sheets: included.length,
      rows: included.reduce((s, sh) => s + sh.rows.filter((r) => r.include).length, 0),
      value: included.reduce((s, sh) => s + sh.rows.filter((r) => r.include).reduce((x, r) => x + r.total, 0), 0),
    };
  }, [sheets]);

  const updateSheet = (idx: number, patch: Partial<ParsedSheet>) => {
    setSheets((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const updateRow = (sheetIdx: number, rowIdx: number, patch: Partial<ParsedRow>) => {
    setSheets((prev) =>
      prev.map((s, i) => {
        if (i !== sheetIdx) return s;
        const rows = s.rows.map((r, j) => {
          if (j !== rowIdx) return r;
          const next = { ...r, ...patch };
          next.total = next.qty * next.rate || next.total;
          return next;
        });
        return { ...s, rows };
      })
    );
  };

  const executeImport = async () => {
    const included = sheets.filter((s) => s.include);
    if (!included.length) {
      toast.error('اختر جدولاً واحداً على الأقل');
      return;
    }
    setSubmitting(true);
    try {
      let totalImported = 0;
      const errors: string[] = [];
      // Each imported sheet = one BOQ page (pm_boq_sections). No discipline regrouping.
      let order = 0;
      for (const sh of included) {
        const rows = sh.rows.filter((r) => r.include);
        if (!rows.length) continue;
        const building = sh.buildingName.trim() || sh.sheetName.trim();
        const section = await BoqService.ensureSheetSection(projectId, building, {
          sourceSheetName: sh.heading ? `${sh.sourceSheet.trim()} › ${sh.heading}` : sh.sourceSheet.trim(),
          isOptional: sh.isOptional,
          sortOrder: ++order,
        });
        if (!section) logger.warn('sheet section create failed', { detail: sh.sheetName });
        const used = new Set<string>();
        const slug = building.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toUpperCase().slice(0, 40);
        const payload = rows.map((r, i) => {
          let code = `${slug}-${r.sn || i + 1}`;
          let k = 2;
          while (used.has(code)) code = `${slug}-${r.sn || i + 1}-${k++}`;
          used.add(code);
          return {
          item_code: code,
          description_ar: r.description,
          description_en: r.spec ? `${r.description} — ${r.spec}` : r.description,
          unit: r.unit || 'LS',
          contract_qty: r.qty,
          rate_egp: r.rate,
          section_id: section?.id ?? null,
          inclusion_status: sh.isOptional ? 'optional_pending' : 'base',
          pricing_status: 'contract_original' as const,
          notes: `Imported from ${fileName} → ${sh.sourceSheet}${r.group ? ` › ${r.group}` : ''}`,
          };
        });
        const res = await BoqService.importBoqItems(projectId, payload, user?.email || 'Importer');
        if (res.success || res.insertedCount > 0) {
          totalImported += res.insertedCount || payload.length;
        } else {
          errors.push(`${sh.buildingName}: ${res.errors?.[0]?.reason || 'فشل'}`);
        }
      }
      if (totalImported > 0) {
        toast.success(`تم استيراد ${totalImported} بنداً في ${included.length} مجموعة مبنى`);
        onImportComplete();
        onClose();
      } else {
        toast.error(errors[0] || 'فشل الاستيراد بالكامل');
      }
    } catch (err: unknown) {
      const errInfo = err as { message?: string; code?: string; details?: string } | null | undefined;
      logger.error('Import failed', { detail: err });
      toast.error('فشل الاستيراد: ' + (errInfo?.message || ''));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
              <Table2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">استيراد BOQ متعدد الشيتات</h3>
              <p className="text-[11px] text-slate-400">يقرأ كل جداول الفاتورة/المقايسة ويوزعها على مباني/مناطق</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!sheets.length ? (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); /* handled via input for simplicity */ }}
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all"
            >
              {parsing ? (
                <Loader2 className="w-9 h-9 text-emerald-500 animate-spin mx-auto mb-3" />
              ) : (
                <FileSpreadsheet className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              )}
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {parsing ? 'جاري التحليل...' : 'اسحب ملف الإكسيل هنا أو اضغط للاختيار'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                يقرأ كل الشيتات تلقائياً ويكتشف جدول البنود في كل شيت (مثل: Invoice No.01.xlsx)
              </p>
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 px-4 py-2.5">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  {fileName}
                </span>
                <span className="text-[11px] font-bold flex items-center gap-1 text-violet-600">
                  {aiState === 'running' && <><Loader2 className="w-3 h-3 animate-spin" /> الذكاء الاصطناعي يحلل الشيتات…</>}
                  {aiState === 'done' && <><Sparkles className="w-3 h-3" /> اقتراحات AI مطبقة — عدّل الأسماء بحرية</>}
                  {aiState === 'off' && <span className="text-slate-400">AI غير متاح — أسماء تلقائية</span>}
                </span>
                <span className="text-[11px] text-slate-400">
                  {totals.sheets} جدول · {totals.rows} بند · إجمالي {totals.value.toLocaleString('eg-EG', { maximumFractionDigits: 0 })} ج.م
                </span>
                <div className="relative me-auto w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="بحث في البنود..."
                    className="w-full pe-8 ps-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-[11px] font-bold text-emerald-500 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200 cursor-pointer"
                >
                  تغيير الملف
                </button>
              </div>

              {/* Sheets */}
              <div className="space-y-3">
                {filteredSheets.map((sh) => {
                  const realIdx = sheets.indexOf(sheets.find((s) => s.sheetName === sh.sheetName)!);
                  const shTotal = sh.rows.filter((r) => r.include).reduce((s, r) => s + r.total, 0);
                  return (
                    <div key={sh.sheetName} className={`rounded-xl border transition-colors ${sh.include ? 'border-emerald-200 dark:border-emerald-950' : 'border-slate-200 dark:border-slate-800 opacity-60'}`}>
                      {/* Sheet header */}
                      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50/60 dark:bg-slate-950/40 rounded-t-xl">
                        <input
                          type="checkbox"
                          checked={sh.include}
                          onChange={(e) => updateSheet(realIdx, { include: e.target.checked })}
                          className="rounded border-slate-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-300 cursor-pointer"
                        />
                        <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        {editingBuilding === realIdx ? (
                          <input
                            autoFocus
                            value={sh.buildingName}
                            onChange={(e) => updateSheet(realIdx, { buildingName: e.target.value })}
                            onBlur={() => setEditingBuilding(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingBuilding(null)}
                            className="flex-1 px-2 py-1 rounded-lg border border-emerald-400 text-xs font-bold outline-none bg-white dark:bg-slate-800"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingBuilding(realIdx)}
                            className="flex items-center gap-1.5 flex-1 text-end cursor-pointer group"
                            title="اضغط لتعديل اسم المبنى/المنطقة"
                          >
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                              {sh.buildingName}
                            </span>
                            <Pencil className="w-3 h-3 text-slate-300 group-hover:text-emerald-500 dark:text-slate-600 dark:group-hover:text-emerald-400" />
                          </button>
                        )}
                        <label className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${sh.isOptional ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`} title="البنود الاختيارية لا تُحسب في الإجمالي إلا بعد الضغط على إضافة">
                          <input type="checkbox" checked={sh.isOptional} onChange={(e) => updateSheet(realIdx, { isOptional: e.target.checked })} />
                          اختياري
                        </label>
                        {sh.aiNote && <span className="text-[10px] text-violet-600 max-w-[200px] truncate" title={sh.aiNote}><Sparkles className="w-3 h-3 inline" /> {sh.aiNote}</span>}
                        <span className="text-[10px] text-slate-400 truncate max-w-[140px]" title={sh.sourceSheet}>📄 {sh.sourceSheet}</span>
                        <span className="text-[10px] text-slate-400 tabular-nums">{sh.rows.length} بند</span>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                          {shTotal.toLocaleString('eg-EG', { maximumFractionDigits: 0 })} ج.م
                        </span>
                        <button
                          type="button"
                          onClick={() => updateSheet(realIdx, { expanded: !sh.expanded })}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {sh.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Rows preview (editable) */}
                      {sh.expanded && (
                        <div className="overflow-x-auto border-t border-slate-100 dark:border-slate-800">
                          <table className="w-full text-[11px] text-end min-w-[640px]">
                            <thead>
                              <tr className="text-slate-400 text-[9px] bg-slate-50/40 dark:bg-slate-950/20">
                                <th className="px-2 py-1.5 font-bold w-8">✓</th>
                                <th className="px-2 py-1.5 font-bold">SN</th>
                                <th className="px-2 py-1.5 font-bold">الوصف</th>
                                <th className="px-2 py-1.5 font-bold w-16">الوحدة</th>
                                <th className="px-2 py-1.5 font-bold w-20">الكمية</th>
                                <th className="px-2 py-1.5 font-bold w-24">السعر</th>
                                <th className="px-2 py-1.5 font-bold w-24">الإجمالي</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                              {sh.rows.map((r, ri) => (
                                <tr key={ri} className={r.include ? '' : 'opacity-40'}>
                                  <td className="px-2 py-1">
                                    <input
                                      type="checkbox"
                                      checked={r.include}
                                      onChange={(e) => updateRow(realIdx, ri, { include: e.target.checked })}
                                      className="rounded border-slate-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-300 cursor-pointer"
                                    />
                                  </td>
                                  <td className="px-2 py-1 text-slate-400 font-mono text-[10px]">{r.sn}</td>
                                  <td className="px-2 py-1">
                                    <input
                                      value={r.description}
                                      onChange={(e) => updateRow(realIdx, ri, { description: e.target.value })}
                                      className="w-full bg-transparent text-slate-700 dark:text-slate-200 font-bold outline-none focus:bg-emerald-50 dark:focus:bg-emerald-950/30 rounded px-1"
                                    />
                                  </td>
                                  <td className="px-2 py-1">
                                    <input
                                      value={r.unit}
                                      onChange={(e) => updateRow(realIdx, ri, { unit: e.target.value })}
                                      className="w-14 bg-transparent text-slate-500 dark:text-slate-400 outline-none focus:bg-emerald-50 dark:focus:bg-emerald-950/30 rounded px-1"
                                    />
                                  </td>
                                  <td className="px-2 py-1">
                                    <input
                                      type="number"
                                      value={r.qty}
                                      onChange={(e) => updateRow(realIdx, ri, { qty: Number(e.target.value) })}
                                      className="w-16 bg-transparent tabular-nums text-slate-600 dark:text-slate-300 outline-none focus:bg-emerald-50 dark:focus:bg-emerald-950/30 rounded px-1"
                                      dir="ltr"
                                    />
                                  </td>
                                  <td className="px-2 py-1">
                                    <input
                                      type="number"
                                      value={r.rate}
                                      onChange={(e) => updateRow(realIdx, ri, { rate: Number(e.target.value) })}
                                      className="w-20 bg-transparent tabular-nums text-slate-600 dark:text-slate-300 outline-none focus:bg-emerald-50 dark:focus:bg-emerald-950/30 rounded px-1"
                                      dir="ltr"
                                    />
                                  </td>
                                  <td className="px-2 py-1 tabular-nums font-bold text-slate-700 dark:text-slate-200" dir="ltr">
                                    {(r.qty * r.rate).toLocaleString('eg-EG', { maximumFractionDigits: 0 })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {sheets.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => { setSheets([]); setFileName(''); }}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              مسح وبدء من جديد
            </button>
            <button
              type="button"
              disabled={submitting || totals.rows === 0}
              onClick={executeImport}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              استيراد {totals.rows} بنداً في {totals.sheets} مبنى
            </button>
          </div>
        )}

        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
};
