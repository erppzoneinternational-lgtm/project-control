'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Boxes, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Calculator,
  Truck,
  Layers,
  Info
} from 'lucide-react';
import { BoqItem, BoqSubMaterial, ProcurementStage } from '@/types/boq';
import { BoqService } from '@/lib/services/boq.service';
import { calculateProcurementQty } from '@/lib/planning/calculations';
import { PriceGate } from './PriceGate';
import { logger } from '@/lib/logger';

interface BoqSubMaterialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  boqItem: BoqItem | null;
  onUpdated?: () => void;
}

const PROCUREMENT_STAGES: { key: ProcurementStage; labelAr: string; color: string }[] = [
  { key: 'material_submittal', labelAr: 'اعتماد العينة (Submittal)', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300' },
  { key: 'material_approval', labelAr: 'معتمد استشارياً (Approved)', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' },
  { key: 'purchasing', labelAr: 'جاري التوريد (Purchasing)', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' },
  { key: 'delivered_site', labelAr: 'تم التوريد للموقع (Delivered)', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300' },
];

export const BoqSubMaterialsModal: React.FC<BoqSubMaterialsModalProps> = ({
  isOpen,
  onClose,
  boqItem,
  onUpdated,
}) => {
  const [subMaterials, setSubMaterials] = useState<BoqSubMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<BoqSubMaterial> | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchMaterials = async () => {
    if (!boqItem?.id) return;
    setLoading(true);
    try {
      const data = await BoqService.getSubMaterials(boqItem.id);
      setSubMaterials(data);
    } catch (err) {
      logger.error('Failed to load sub materials', { detail: err });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && boqItem?.id) {
      fetchMaterials();
      setIsEditing(false);
      setEditingItem(null);
    }
  }, [isOpen, boqItem?.id]);

  const handleStartCreate = () => {
    setEditingItem({
      boq_item_id: boqItem?.id,
      material_name_ar: '',
      unit: boqItem?.unit || 'm2',
      consumption_rate: 1.0,
      standard_wastage_pct: 5.0,
      ordered_qty: 0,
      delivered_to_site_qty: 0,
      procurement_stage: 'material_submittal',
    });
    setFormError(null);
    setIsEditing(true);
  };

  const handleStartEdit = (mat: BoqSubMaterial) => {
    setEditingItem({ ...mat });
    setFormError(null);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!boqItem?.id) return;
    if (!confirm('هل أنت متأكد من حذف هذه المادة الخام من جدول المواد (BOM)؟')) return;

    try {
      const ok = await BoqService.deleteSubMaterial(id, boqItem.id);
      if (ok) {
        await fetchMaterials();
        onUpdated?.();
      }
    } catch (err) {
      logger.error('Failed to delete sub material', { detail: err });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.material_name_ar?.trim()) {
      setFormError('اسم المادة الخام بالعربية مطلوب');
      return;
    }
    if (!editingItem?.unit?.trim()) {
      setFormError('الوحدة مطلوبة');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const result = await BoqService.saveSubMaterial({
        ...editingItem,
        boq_item_id: boqItem?.id,
      });

      if (!result) {
        setFormError('حدث خطأ أثناء حفظ المادة الخام');
        return;
      }

      setIsEditing(false);
      setEditingItem(null);
      await fetchMaterials();
      onUpdated?.();
    } catch (err: unknown) {
      const errInfo = err as { message?: string; code?: string; details?: string } | null | undefined;
      setFormError(errInfo?.message || 'Failed to save sub material');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !boqItem) return null;

  // Live calculation preview
  const previewConsumption = Number(editingItem?.consumption_rate ?? 1.0);
  const previewWastage = Number(editingItem?.standard_wastage_pct ?? 0);
  const previewProcurementQty = calculateProcurementQty(
    boqItem.contract_qty,
    previewConsumption,
    previewWastage
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>شجرة تفكيك المواد الخام والـ BOM</span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                  {boqItem.item_code}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                {boqItem.description_ar}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Parent BOQ Info Banner */}
        <div className="px-6 py-3 bg-emerald-50/40 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-950/40 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <PriceGate fallback={null}>
              <div>
                <span className="text-slate-500 dark:text-slate-400">الكمية التعاقدية: </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {(Number(boqItem.contract_qty) || 0).toLocaleString()} {boqItem.unit || ''}
                </span>
              </div>
            </PriceGate>
            {boqItem.shop_drawing_qty != null && (
              <PriceGate fallback={null}>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">كمية الشوب دروينج: </span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {(Number(boqItem.shop_drawing_qty) || 0).toLocaleString()} {boqItem.unit || ''}
                  </span>
                </div>
              </PriceGate>
            )}
          </div>

          <button
            onClick={handleStartCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة مادة خام للـ BOM</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add / Edit Form */}
          {isEditing && editingItem && (
            <div className="p-5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-4 animate-in slide-in-from-top duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  {editingItem.id ? 'تعديل بيانات المادة الخام' : 'إضافة مادة خام جديدة مع حساب كمية الشراء التلقائية'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  إلغاء
                </button>
              </div>

              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم المادة الخام بالعربية *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: لفائف ممبرين HDPE 1.5mm أو حديد تسليح مشرشر"
                    value={editingItem.material_name_ar || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, material_name_ar: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الوحدة (Unit) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="m2, ton, kg, ml..."
                    value={editingItem.unit || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    معدل الاستهلاك (Consumption Rate) *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    required
                    value={editingItem.consumption_rate ?? 1.0}
                    onChange={(e) => setEditingItem({ ...editingItem, consumption_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">لكل 1 {boqItem.unit} من البند</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الهالك المعياري % (Standard Wastage)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editingItem.standard_wastage_pct ?? 0}
                    onChange={(e) => setEditingItem({ ...editingItem, standard_wastage_pct: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">مثال: 8% لحامات وتراكب</span>
                </div>

                {/* Auto Calculated Preview Card */}
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center">
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                    كمية الشراء المطلوبة أوتوماتيكياً
                  </div>
                  <div className="text-base font-mono font-bold text-emerald-800 dark:text-emerald-300">
                    {(Number(previewProcurementQty) || 0).toLocaleString()} {editingItem.unit || boqItem.unit || ''}
                  </div>
                  <div className="text-[9px] text-emerald-500">
                    ({Number(boqItem.contract_qty) || 0} × {previewConsumption} × {(1 + previewWastage / 100).toFixed(2)})
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    مرحلة التوريد والاعتماد
                  </label>
                  <select
                    value={editingItem.procurement_stage || 'material_submittal'}
                    onChange={(e) => setEditingItem({ ...editingItem, procurement_stage: e.target.value as ProcurementStage })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {PROCUREMENT_STAGES.map((stg) => (
                      <option key={stg.key} value={stg.key}>
                        {stg.labelAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الكمية المطلوبة بأمر التوريد (Ordered)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={editingItem.ordered_qty ?? 0}
                    onChange={(e) => setEditingItem({ ...editingItem, ordered_qty: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الكمية المستلمة بالموقع (Delivered)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={editingItem.delivered_to_site_qty ?? 0}
                    onChange={(e) => setEditingItem({ ...editingItem, delivered_to_site_qty: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-500/20"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>{editingItem.id ? 'حفظ التعديلات' : 'إضافة المادة للـ BOM'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sub-materials List */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-start font-bold">المادة الخام</th>
                  <th className="px-4 py-3 text-center font-bold">الوحدة</th>
                  <th className="px-4 py-3 text-center font-bold">معدل الاستهلاك</th>
                  <th className="px-4 py-3 text-center font-bold">الهالك %</th>
                  <th className="px-4 py-3 text-center font-bold">الكمية المطلوبة للشراء</th>
                  <th className="px-4 py-3 text-center font-bold">المورد للموقع</th>
                  <th className="px-4 py-3 text-center font-bold">المرحلة</th>
                  <th className="px-4 py-3 text-center font-bold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                      {loading ? (
                        'جاري تحميل مكونات الـ BOM...'
                      ) : (
                        <div className="space-y-2">
                          <Boxes className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                          <div className="font-semibold text-slate-700 dark:text-slate-300">لا توجد مواد خام مسجلة في شجرة هذا البند</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            اضغط على &quot;إضافة مادة خام للـ BOM&quot; لإدخال مكونات البند وحساب كميات التوريد
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  subMaterials.map((mat) => {
                    const stageInfo = PROCUREMENT_STAGES.find((s) => s.key === mat.procurement_stage);
                    return (
                      <tr
                        key={mat.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group"
                      >
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          {mat.material_name_ar}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-slate-500 dark:text-slate-400">
                          {mat.unit}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {mat.consumption_rate}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-amber-600 dark:text-amber-400 font-bold">
                          {mat.standard_wastage_pct}%
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                          {(Number(mat.required_procurement_qty) || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-emerald-600 dark:text-emerald-400">
                          {(Number(mat.delivered_to_site_qty) || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              stageInfo?.color || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {stageInfo?.labelAr || mat.procurement_stage}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleStartEdit(mat)}
                              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                              title="تعديل المادة"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(mat.id)}
                              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                              title="حذف من الـ BOM"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-500" />
            <span>
              يتم احتساب كميات التوريد تلقائياً مع الهالك لتفادي أي عجز في أوامر الشراء
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
