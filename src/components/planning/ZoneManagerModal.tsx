'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ZoneService } from '@/lib/services/zone.service';
import { Zone, ZoneUpdate } from '@/types/zone';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layers, Plus, Edit2, Trash2, X, ChevronRight, CornerDownLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ZoneManagerModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ZoneManagerModal: React.FC<ZoneManagerModalProps> = ({ projectId, isOpen, onClose }) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const queryClient = useQueryClient();

  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [parentZoneId, setParentZoneId] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<number>(0);

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ['zones', projectId],
    queryFn: () => ZoneService.getProjectZones(projectId),
    enabled: isOpen && Boolean(projectId),
  });

  const createMutation = useMutation({
    mutationFn: ZoneService.createZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones', projectId] });
      toast.success(isAr ? 'تم إضافة المنطقة بنجاح' : 'Zone added successfully');
      resetForm();
    },
    onError: () => toast.error(isAr ? 'فشل إضافة المنطقة' : 'Failed to add zone'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ZoneUpdate }) =>
      ZoneService.updateZone(id, projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones', projectId] });
      toast.success(isAr ? 'تم تحديث المنطقة بنجاح' : 'Zone updated successfully');
      resetForm();
    },
    onError: () => toast.error(isAr ? 'فشل تحديث المنطقة' : 'Failed to update zone'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ZoneService.deleteZone(id, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones', projectId] });
      toast.success(isAr ? 'تم حذف المنطقة' : 'Zone deleted');
    },
    onError: () => toast.error(isAr ? 'فشل حذف المنطقة' : 'Failed to delete zone'),
  });

  const resetForm = () => {
    setEditingZone(null);
    setNameAr('');
    setNameEn('');
    setParentZoneId('');
    setSortOrder(0);
  };

  const handleEdit = (zone: Zone) => {
    setEditingZone(zone);
    setNameAr(zone.name_ar);
    setNameEn(zone.name_en || '');
    setParentZoneId(zone.parent_zone_id || '');
    setSortOrder(zone.sort_order || 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) {
      toast.error(isAr ? 'يرجى إدخال اسم المنطقة بالعربية' : 'Please enter Arabic name');
      return;
    }

    if (editingZone) {
      updateMutation.mutate({
        id: editingZone.id,
        payload: {
          name_ar: nameAr,
          name_en: nameEn || null,
          parent_zone_id: parentZoneId || null,
          sort_order: sortOrder,
        },
      });
    } else {
      createMutation.mutate({
        project_id: projectId,
        name_ar: nameAr,
        name_en: nameEn || null,
        parent_zone_id: parentZoneId || null,
        sort_order: sortOrder,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? 'إدارة مناطق المشروع (Zones & Sub-zones)' : 'Project Zones Management'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'التقسيم المكاني للمشروع (Lagoons, Pump Rooms, Tanks)' : 'Spatial breakdown of project zones'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-4">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {editingZone 
                ? (isAr ? `تعديل المنطقة: ${editingZone.name_ar}` : `Edit Zone: ${editingZone.name_ar}`)
                : (isAr ? 'إضافة منطقة جديدة' : 'Add New Zone')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {isAr ? 'اسم المنطقة (بالعربية) *' : 'Zone Name (Arabic) *'}
                </label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: Lagoon 1 أو غرفة طلمبات 01"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {isAr ? 'الاسم بالإنجليزية (اختياري)' : 'Zone Name (English)'}
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Lagoon 1 / Pump Room 01"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {isAr ? 'المنطقة الرئيسية (للتقسيم الفرعي)' : 'Parent Zone (Optional)'}
                </label>
                <select
                  value={parentZoneId}
                  onChange={(e) => setParentZoneId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">{isAr ? '-- منطقة رئيسية مستقلة --' : '-- Root Zone --'}</option>
                  {zones.filter((z) => !editingZone || z.id !== editingZone.id).map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name_ar} {z.name_en ? `(${z.name_en})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {isAr ? 'ترتيب الظهور' : 'Sort Order'}
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {editingZone && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              )}
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                {editingZone ? (isAr ? 'حفظ التعديل' : 'Save Changes') : (isAr ? 'إضافة المنطقة' : 'Add Zone')}
              </button>
            </div>
          </form>

          {/* Zones List */}
          <div className="space-y-3">
            <h4 className={`text-xs font-bold text-slate-500 ${isAr ? 'tracking-normal' : 'uppercase tracking-wider'}`}>
              {isAr ? 'المناطق المسجلة بالمشروع' : 'Registered Zones'} ({zones.length})
            </h4>

            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
                {isAr ? 'جاري التحميل...' : 'Loading zones...'}
              </div>
            ) : zones.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                {isAr ? 'لا توجد مناطق مسجلة بعد لهذا المشروع' : 'No zones registered for this project yet'}
              </div>
            ) : (
              <div className="space-y-2">
                {zones.map((zone) => (
                  <div key={zone.id} className="space-y-1.5">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
                      <div className="flex items-center gap-2.5">
                        <Layers className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {zone.name_ar}
                        </span>
                        {zone.name_en && (
                          <span className="text-[11px] text-slate-400">({zone.name_en})</span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold">
                          #{zone.sort_order}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(zone)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title={isAr ? 'تعديل' : 'Edit'}
                          aria-label={isAr ? 'تعديل' : 'Edit'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(isAr ? 'هل أنت متأكد من حذف هذه المنطقة؟' : 'Are you sure you want to delete this zone?')) {
                              deleteMutation.mutate(zone.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          title={isAr ? 'حذف' : 'Delete'}
                          aria-label={isAr ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Sub-zones */}
                    {zone.sub_zones && zone.sub_zones.length > 0 && (
                      <div className="pe-6 ps-2 space-y-1">
                        {zone.sub_zones.map((sub) => (
                          <div key={sub.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/30 text-xs">
                            <div className="flex items-center gap-2">
                              <CornerDownLeft className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {sub.name_ar}
                              </span>
                              {sub.name_en && (
                                <span className="text-[10px] text-slate-400">({sub.name_en})</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEdit(sub)}
                                className="p-1 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                title={isAr ? 'تعديل' : 'Edit'}
                                aria-label={isAr ? 'تعديل' : 'Edit'}
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(isAr ? 'حذف المنطقة الفرعية؟' : 'Delete sub-zone?')) {
                                    deleteMutation.mutate(sub.id);
                                  }
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                title={isAr ? 'حذف' : 'Delete'}
                                aria-label={isAr ? 'حذف' : 'Delete'}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
