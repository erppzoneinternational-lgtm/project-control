'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { PlusCircle, MinusCircle, RotateCcw, Undo2 } from 'lucide-react';
import type { BoqItem, BoqSection, BoqInclusionStatus } from '@/types/boq';
import { BoqService } from '@/lib/services/boq.service';
import { INCLUSION_META, inclusionOf } from '@/lib/boq/inclusion';

/**
 * Inline Add / Omit / Restore — directly on each BOQ row (no separate panel, no filtering needed).
 * Omit never deletes: item stays visible as "محذوف", excluded from totals, audited, restorable.
 */
export function useBoqInclusion(opts: {
  projectId: string;
  sections: BoqSection[];
  canEdit: boolean;
  canOmitBase: boolean;
  onChanged: () => void;
}) {
  const { projectId, sections, canEdit, canOmitBase, onChanged } = opts;
  const [target, setTarget] = useState<BoqItem | null>(null);
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const change = async (item: BoqItem, to: BoqInclusionStatus, why?: string) => {
    setBusyId(item.id);
    const r = await BoqService.setInclusion(projectId, [item.id], to, { reason: why });
    setBusyId(null);
    if (!r.success) return toast.error(r.error || 'فشل التحديث');
    toast.success(`${item.item_code}: ${INCLUSION_META[to].ar}`);
    onChanged();
  };

  const restoreTo = (item: BoqItem): BoqInclusionStatus =>
    sections.find((s) => s.id === item.section_id)?.is_optional ? 'optional_pending' : 'base';

  const btn = 'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer disabled:opacity-40';

  /** Badge + actions for one row. */
  const render = (item: BoqItem) => {
    const s = inclusionOf(item);
    const busy = busyId === item.id;
    return (
      <div className="flex items-center gap-1 justify-center">
        {s !== 'base' && (
          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${INCLUSION_META[s].badge}`} title={item.inclusion_reason || ''}>
            {INCLUSION_META[s].ar}
          </span>
        )}
        {canEdit && s === 'optional_pending' && (
          <button type="button" disabled={busy} onClick={() => change(item, 'optional_added')} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`} title="إضافة للإجمالي">
            <PlusCircle className="w-3 h-3" />إضافة
          </button>
        )}
        {canEdit && s === 'optional_added' && (
          <button type="button" disabled={busy} onClick={() => change(item, 'optional_pending')} className={`${btn} text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800`} title="إلغاء الإضافة">
            <Undo2 className="w-3 h-3" />
          </button>
        )}
        {canEdit && s !== 'omitted' && (s !== 'base' || canOmitBase) && (
          <button type="button" disabled={busy} onClick={() => { setTarget(item); setReason(''); }}
            className={`${btn} text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 ${s === 'base' ? 'opacity-0 group-hover:opacity-100' : ''}`} title="Omit — استبعاد من الإجمالي بدون حذف">
            <MinusCircle className="w-3 h-3" />Omit
          </button>
        )}
        {canEdit && s === 'omitted' && (
          <button type="button" disabled={busy} onClick={() => change(item, restoreTo(item))} className={`${btn} bg-slate-200 dark:bg-slate-700 hover:bg-slate-300`} title="استعادة">
            <RotateCcw className="w-3 h-3" />استعادة
          </button>
        )}
      </div>
    );
  };

  const modal = target ? (
    <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4" onClick={() => setTarget(null)}>
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-5 space-y-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold">Omit البند {target.item_code}</h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{target.description_ar}</p>
        <p className="text-[11px] text-slate-500">لن يُحذف البند. سيظهر كـ «محذوف» ويُستبعد من الإجمالي، ويمكن استعادته في أي وقت. يُسجَّل في سجل المراجعات.</p>
        <textarea autoFocus value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="سبب الحذف (إلزامي)…"
          className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2" />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setTarget(null)} className="px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800">إلغاء</button>
          <button type="button" disabled={!reason.trim() || !!busyId}
            onClick={async () => { const t = target; setTarget(null); await change(t, 'omitted', reason); }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white disabled:opacity-40">تأكيد Omit</button>
        </div>
      </div>
    </div>
  ) : null;

  return { render, modal };
}
