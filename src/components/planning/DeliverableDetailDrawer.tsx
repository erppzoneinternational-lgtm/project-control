'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Package, 
  Clock, 
  User, 
  Layers, 
  FileText, 
  FileCode, 
  Paperclip, 
  Upload, 
  Plus, 
  History, 
  ShieldAlert, 
  Play, 
  Check, 
  Trash2, 
} from 'lucide-react';
import { Deliverable, DeliverableItem, DeliverableAttachment, ConsultantApprovalCode } from '@/types/planning';
import { StakeholderFull } from '@/types';
import { DeliverablesService } from '@/lib/services/deliverables.service';
import { ProjectService } from '@/lib/services/project.service';
import { ConsultantReviewModal } from './ConsultantReviewModal';
import { DeliverableBlockerModal } from './DeliverableBlockerModal';
import { HistoryDrawer } from './HistoryDrawer';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface DeliverableDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  deliverableId: string | null;
  onDeliverableUpdated?: (updated: Deliverable) => void;
}

export const DeliverableDetailDrawer: React.FC<DeliverableDetailDrawerProps> = ({
  isOpen,
  onClose,
  deliverableId,
  onDeliverableUpdated,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const [deliverable, setDeliverable] = useState<Deliverable | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'items' | 'attachments' | 'info'>('items');
  const [stakeholders, setStakeholders] = useState<StakeholderFull[]>([]);
  const [attachments, setAttachments] = useState<DeliverableAttachment[]>([]);

  // Item Modals
  const [selectedReviewItem, setSelectedReviewItem] = useState<DeliverableItem | null>(null);
  const [isBlockerOpen, setIsBlockerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Add Item Inline/Modal
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<DeliverableItem>>({
    item_type: 'drawing',
    sheet_number: '',
    description: '',
    current_rev: 0,
    submission_revision: 1,
    consultant_status: 'pending',
    assigned_stakeholder_id: '',
  });
  const [savingItem, setSavingItem] = useState(false);

  // File upload state
  const [uploadingFile, setUploadingFile] = useState(false);

  // Fetch deliverable & stakeholders
  const fetchDetails = async (id: string) => {
    setLoading(true);
    try {
      const [data, atts] = await Promise.all([
        DeliverablesService.getDeliverableById(id),
        DeliverablesService.getDeliverableAttachments(id),
      ]);
      setDeliverable(data);
      setAttachments(atts as DeliverableAttachment[]);

      if (data?.project_id) {
        const stk = await ProjectService.getStakeholdersDirectory();
        setStakeholders(stk);
      }
    } catch (err) {
      logger.error('Failed to load deliverable details', { detail: err });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && deliverableId) {
      fetchDetails(deliverableId);
    } else {
      setDeliverable(null);
    }
  }, [isOpen, deliverableId]);

  // Age in days
  const ageDays = useMemo(() => {
    if (!deliverable?.received_at) return 0;
    const received = new Date(deliverable.received_at).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - received) / (1000 * 60 * 60 * 24)));
  }, [deliverable?.received_at]);

  // Handlers
  const handleItemUpdated = (updatedItem: DeliverableItem) => {
    if (!deliverable) return;
    const currentItems = deliverable.items || [];
    const idx = currentItems.findIndex((i) => i.id === updatedItem.id);
    let newItems: DeliverableItem[];
    if (idx >= 0) {
      newItems = [...currentItems];
      newItems[idx] = updatedItem;
    } else {
      newItems = [updatedItem, ...currentItems];
    }
    const updatedDeliv = { ...deliverable, items: newItems };
    setDeliverable(updatedDeliv);
    if (onDeliverableUpdated) onDeliverableUpdated(updatedDeliv);
  };

  const handleStartWork = async (itemId: string) => {
    if (!deliverable) return;
    const holderId = deliverable.current_holder_stakeholder_id || stakeholders[0]?.id || '';
    const updated = await DeliverablesService.startWorkOnItem(itemId, holderId);
    if (updated) {
      toast.success(isAr ? 'تم بدء العمل على البند' : 'Work started on item');
      handleItemUpdated(updated);
    } else {
      toast.error(isAr ? 'فشل بدء العمل على البند' : 'Failed to start work on item');
    }
  };

  const handleCompleteWork = async (itemId: string) => {
    const updated = await DeliverablesService.completeWorkOnItem(itemId);
    if (updated) {
      toast.success(isAr ? 'تم إنهاء العمل على البند بنجاح' : 'Work completed and marked ready for return');
      handleItemUpdated(updated);
    } else {
      toast.error(isAr ? 'فشل إنهاء العمل على البند' : 'Failed to complete work on item');
    }
  };

  const handleSaveNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverable || !newItem.description?.trim()) return;

    setSavingItem(true);
    try {
      const payload: Partial<DeliverableItem> = {
        ...newItem,
        deliverable_id: deliverable.id,
        current_rev: Number(newItem.current_rev ?? 0),
        submission_revision: Number(newItem.submission_revision ?? 1),
      };
      const created = await DeliverablesService.saveDeliverableItem(payload);
      if (created) {
        toast.success(isAr ? 'تمت إضافة البند بنجاح' : 'Item added successfully');
        handleItemUpdated(created);
        setIsAddItemOpen(false);
        setNewItem({
          item_type: 'drawing',
          sheet_number: '',
          description: '',
          current_rev: 0,
          submission_revision: 1,
          consultant_status: 'pending',
          assigned_stakeholder_id: '',
        });
      } else {
        toast.error(isAr ? 'تعذر حفظ البند — يرجى مراجعة البيانات' : 'Failed to save item — please check details');
      }
    } catch (err: unknown) {
      logger.error('Failed to create deliverable item', { detail: err });
      toast.error((err as { message?: string } | null)?.message || (isAr ? 'حدث خطأ أثناء الحفظ' : 'Error saving item'));
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!deliverable) return;
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذا البند من التسليمة؟' : 'Are you sure you want to delete this item from the deliverable?')) {
      const ok = await DeliverablesService.deleteDeliverableItem(itemId, deliverable.id);
      if (ok) {
        const newItems = (deliverable.items || []).filter((i) => i.id !== itemId);
        const updatedDeliv = { ...deliverable, items: newItems };
        setDeliverable(updatedDeliv);
        if (onDeliverableUpdated) onDeliverableUpdated(updatedDeliv);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !deliverable) return;

    setUploadingFile(true);
    try {
      const uploaded = await DeliverablesService.uploadAttachment(deliverable.id, file, 'drawing');
      if (uploaded) {
        setAttachments((prev) => [uploaded as DeliverableAttachment, ...prev]);
        toast.success(isAr ? 'تم رفع الملف بنجاح' : 'File uploaded successfully');
      }
    } catch (err) {
      logger.error('Upload failed', { detail: err });
      toast.error(isAr ? 'فشل رفع الملف' : 'Upload failed');
    } finally {
      setUploadingFile(false);
    }
  };

  const getConsultantStatusBadge = (code: ConsultantApprovalCode) => {
    switch (code) {
      case 'A':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
            {isAr ? 'كود أ (معتمد)' : 'Code A'}
          </span>
        );
      case 'B':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
            {isAr ? 'كود ب (معتمد بملاحظات)' : 'Code B'}
          </span>
        );
      case 'C':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
            {isAr ? 'كود ج (مرفوض مع تعديل)' : 'Code C'}
          </span>
        );
      case 'D':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300">
            {isAr ? 'كود د (مرفوض بالكامل)' : 'Code D'}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {isAr ? 'قيد المراجعة' : 'Under Review'}
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} aria-label={isAr ? 'إغلاق النافذة' : 'Close drawer'} />

      <div className="absolute inset-y-0 end-0 max-w-full flex">
        <div className="w-screen max-w-4xl bg-white dark:bg-slate-900 border-s border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-700/20">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100">
                    {deliverable?.ref_code || '...'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300">
                    {deliverable?.kind || 'E1'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? `عمر التسليمة: ${ageDays} يوم` : `Deliverable age: ${ageDays} days`}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-1 line-clamp-1">
                  {deliverable?.title_ar || (isAr ? 'تفاصيل حزمة التسليمة' : 'Deliverable Package Details')}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isAr ? 'الخط الزمني' : 'Timeline'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Blocked Alert Banner if blocked */}
          {deliverable?.status === 'blocked' && (
            <div className="px-6 py-3 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-200 dark:border-rose-800/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 text-xs">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span className="font-bold">{isAr ? 'التسليمة معطلة:' : 'Deliverable is blocked:'}</span>
                <span>{deliverable.blocked_reason || (isAr ? 'في انتظار استيفاء الملاحظات' : 'Awaiting comments resolution')}</span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const res = await DeliverablesService.updateDeliverableStatus(
                    deliverable.id,
                    deliverable.project_id,
                    'in_progress',
                    isAr ? 'تم إلغاء التعطيل' : 'Block lifted'
                  );
                  if (res) {
                    setDeliverable(res);
                    if (onDeliverableUpdated) onDeliverableUpdated(res);
                  }
                }}
                className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-all duration-150 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                {isAr ? 'استئناف العمل' : 'Resume Work'}
              </button>
            </div>
          )}

          {/* Tabs header */}
          <div className="flex items-center gap-4 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className={`py-3 text-xs font-bold border-b-2 cursor-pointer transition-all duration-150 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-t-sm ${
                activeTab === 'items'
                  ? 'border-emerald-700 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{isAr ? `بنود ولوحات الحزمة (${deliverable?.items?.length || 0})` : `Package Items & Sheets (${deliverable?.items?.length || 0})`}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('attachments')}
              className={`py-3 text-xs font-bold border-b-2 cursor-pointer transition-all duration-150 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-t-sm ${
                activeTab === 'attachments'
                  ? 'border-emerald-700 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Paperclip className="w-4 h-4" />
              <span>{isAr ? `المرفقات والملفات (${attachments.length})` : `Attachments & Files (${attachments.length})`}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`py-3 text-xs font-bold border-b-2 cursor-pointer transition-all duration-150 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-t-sm ${
                activeTab === 'info'
                  ? 'border-emerald-700 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{isAr ? 'معلومات التسليمة والحائز' : 'Deliverable & Holder Info'}</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="py-20 text-center text-slate-400 dark:text-slate-500 space-y-2">
                <Clock className="w-8 h-8 animate-spin mx-auto text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs">{isAr ? 'جاري تحميل بيانات التسليمة...' : 'Loading deliverable data...'}</span>
              </div>
            ) : activeTab === 'items' ? (
              <div className="space-y-4">
                {/* Actions Top Bar */}
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {isAr ? 'جدول المخططات والمواد المسجلة:' : 'Registered sheets & materials:'}
                  </div>

                  <div className="flex items-center gap-2">
                    {deliverable?.status !== 'blocked' && (
                      <button
                        type="button"
                        onClick={() => setIsBlockerOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{isAr ? 'تسجيل عائق للحزمة' : 'Log Package Blocker'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsAddItemOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer transition-all duration-150 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isAr ? 'إضافة بند / لوحة جديدة' : 'Add New Item / Sheet'}</span>
                    </button>
                  </div>
                </div>

                {/* Add Item Modal / Inline Form */}
                {isAddItemOpen && (
                  <form onSubmit={handleSaveNewItem} className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      <span>{isAr ? 'إضافة بند / مخطط تنفيذي جديد' : 'Add New Item / Drawing Sheet'}</span>
                      <button
                        type="button"
                        onClick={() => setIsAddItemOpen(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-1"
                        aria-label={isAr ? 'إلغاء' : 'Cancel'}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          {isAr ? 'نوع البند' : 'Item Type'}
                        </label>
                        <select
                          value={newItem.item_type}
                          onChange={(e) => setNewItem({ ...newItem, item_type: e.target.value as DeliverableItem['item_type'] })}
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        >
                          <option value="drawing">{isAr ? 'مخطط تنفيذي' : 'Shop Drawing Sheet'}</option>
                          <option value="material">{isAr ? 'تقديم عينة ومواد' : 'Material Submittal'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          {isAr ? 'رقم اللوحة' : 'Sheet Number'}
                        </label>
                        <input
                          type="text"
                          placeholder={isAr ? 'مثال: DWG-PL-001' : 'e.g. DWG-PL-001'}
                          value={newItem.sheet_number || ''}
                          onChange={(e) => setNewItem({ ...newItem, sheet_number: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          {isAr ? 'المهندس المسؤول (المكتب الفني)' : 'Assigned Engineer (Technical Office)'}
                        </label>
                        <select
                          value={newItem.assigned_stakeholder_id || ''}
                          onChange={(e) => setNewItem({ ...newItem, assigned_stakeholder_id: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        >
                          <option value="">{isAr ? '-- اختياري: تعيين مهندس --' : '-- Optional: assign engineer --'}</option>
                          {stakeholders.map((stk) => (
                            <option key={stk.id} value={stk.id}>
                              {stk.name_ar} ({stk.role || (isAr ? 'مهندس' : 'Engineer')})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        {isAr ? 'الوصف التفصيلي للبند' : 'Detailed Item Description'} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={isAr ? 'مثال: تفاصيل تسليح بلاطة مسبح المنسوب الرئيسي والوصلات الميكانيكية...' : 'e.g. Rebar detailing for main pool deck slab and mechanical connections...'}
                        value={newItem.description || ''}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddItemOpen(false)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      >
                        {isAr ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        disabled={savingItem || !newItem.description?.trim()}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white cursor-pointer transition-all duration-150 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      >
                        {savingItem ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ البند' : 'Save Item')}
                      </button>
                    </div>
                  </form>
                )}

                {/* Items Table */}
                {(deliverable?.items || []).length === 0 ? (
                  <div className="py-16 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
                    <FileCode className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{isAr ? 'لا توجد مخططات أو بنود مسجلة في هذه الحزمة' : 'No sheets or items registered in this package'}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isAr ? 'اضغط على «إضافة بند / لوحة جديدة» لتسجيل أوراق المخططات التنفيذية' : 'Click "Add New Item / Sheet" to register shop drawing sheets'}
                    </div>
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
                    <table className="w-full text-start text-xs border-collapse">
                      <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                        <tr>
                          <th className="p-3 text-start">{isAr ? 'رقم اللوحة / البند' : 'Sheet / Item No.'}</th>
                          <th className="p-3 text-start">{isAr ? 'الوصف' : 'Description'}</th>
                          <th className="p-3 text-center">{isAr ? 'الإصدار' : 'Revision'}</th>
                          <th className="p-3 text-center">{isAr ? 'التقديم' : 'Submission'}</th>
                          <th className="p-3 text-center">{isAr ? 'حالة الاستشاري' : 'Consultant Status'}</th>
                          <th className="p-3 text-start">{isAr ? 'المهندس المسؤول' : 'Assigned Engineer'}</th>
                          <th className="p-3 text-center">{isAr ? 'الإجراءات' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {(deliverable?.items || []).map((item) => {
                          const assignedStk = stakeholders.find((s) => s.id === item.assigned_stakeholder_id);
                          return (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  {item.item_type === 'drawing' ? (
                                    <FileCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  ) : (
                                    <Layers className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                                  )}
                                  <span>{item.sheet_number || (isAr ? 'بدون كود' : 'No code')}</span>
                                </div>
                              </td>

                              <td className="p-3 max-w-xs truncate">
                                <div className="font-semibold line-clamp-1 text-slate-900 dark:text-slate-100">{item.description}</div>
                                {item.work_started_at && (
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    <span>{isAr ? `بدء العمل: ${new Date(item.work_started_at).toLocaleDateString('ar-EG')}` : `Work started: ${new Date(item.work_started_at).toLocaleDateString('en-GB')}`}</span>
                                  </div>
                                )}
                              </td>

                              <td className="p-3 text-center">
                                <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                  {isAr ? `مراجعة ${item.current_rev}` : `Rev ${item.current_rev}`}
                                </span>
                              </td>

                              <td className="p-3 text-center">
                                <span className="font-mono font-semibold text-slate-500 dark:text-slate-400">
                                  #{item.submission_revision || 1}
                                </span>
                              </td>

                              <td className="p-3 text-center">
                                {getConsultantStatusBadge(item.consultant_status)}
                              </td>

                              <td className="p-3 whitespace-nowrap text-[11px]">
                                {assignedStk ? (
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                    <span>{assignedStk.name_ar}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500">{isAr ? 'غير معين' : 'Unassigned'}</span>
                                )}
                              </td>

                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedReviewItem(item)}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 dark:text-emerald-300 cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                    title={isAr ? 'تسجيل اعتماد الاستشاري' : 'Log consultant approval'}
                                  >
                                    {isAr ? 'قرار الاستشاري' : 'Consultant Decision'}
                                  </button>

                                  {item.status !== 'in_progress' && item.status !== 'ready_to_return' && (
                                    <button
                                      type="button"
                                      onClick={() => handleStartWork(item.id)}
                                      className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                      title={isAr ? 'بدء العمل على اللوحة' : 'Start work on sheet'}
                                      aria-label={isAr ? 'بدء العمل على اللوحة' : 'Start work on sheet'}
                                    >
                                      <Play className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {item.status === 'in_progress' && (
                                    <button
                                      type="button"
                                      onClick={() => handleCompleteWork(item.id)}
                                      className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                      title={isAr ? 'إنهاء العمل والجاهزية للإعادة' : 'Complete work and mark ready'}
                                      aria-label={isAr ? 'إنهاء العمل والجاهزية للإعادة' : 'Complete work and mark ready'}
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="p-1.5 rounded-lg text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                                    title={isAr ? 'حذف البند' : 'Delete item'}
                                    aria-label={isAr ? 'حذف البند' : 'Delete item'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
            ) : activeTab === 'attachments' ? (
              <div className="space-y-4">
                {/* Upload Action */}
                <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30 text-center space-y-3">
                  <Upload className="w-8 h-8 mx-auto text-emerald-600 dark:text-emerald-400 opacity-80" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isAr ? 'رفع المخططات أو مستندات الحزمة' : 'Upload package drawings or documents'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isAr 
                        ? 'يدعم صيغ PDF والمخططات الهندسية DWG وDXF وجداول البيانات والصور حتى 50 ميجابايت'
                        : 'Supports PDF, DWG, DXF, XLSX, and images up to 50MB'}
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer transition-all duration-150 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2">
                    <span>{uploadingFile ? (isAr ? 'جاري الرفع...' : 'Uploading...') : (isAr ? 'اختيار ملف للرفع' : 'Select file to upload')}</span>
                    <input
                      type="file"
                      disabled={uploadingFile}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Attachments List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {isAr ? `الملفات المرفقة (${attachments.length}):` : `Attached Files (${attachments.length}):`}
                  </h4>

                  {attachments.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                      {isAr ? 'لا توجد مرفقات مضافة لهذه الحزمة بعد' : 'No attachments added to this package yet'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {attachments.map((att) => (
                        <div
                          key={att.id}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="truncate text-xs">
                              <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                {att.file_name || att.storage_path.split('/').pop()}
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                {att.uploaded_at ? new Date(att.uploaded_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : (isAr ? 'حديثاً' : 'Recently')}
                              </div>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {isAr ? 'مرفوع' : 'Stored'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Info Tab */
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[11px] mb-0.5">{isAr ? 'تاريخ الاستلام:' : 'Received Date:'}</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                      {deliverable?.received_at || '-'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[11px] mb-0.5">{isAr ? 'تاريخ الاستحقاق:' : 'Due Date:'}</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                      {deliverable?.due_date || (isAr ? 'غير محدد' : 'Not specified')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[11px] mb-0.5">{isAr ? 'الجهة المسلمة:' : 'Delivered By:'}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {deliverable?.received_from === 'technical_office' 
                        ? (isAr ? 'المكتب الفني' : 'Technical Office') 
                        : (deliverable?.received_from || '-')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[11px] mb-0.5">{isAr ? 'الحائز الحالي:' : 'Current Holder:'}</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {deliverable?.current_holder?.name_ar || (isAr ? 'المكتب الفني' : 'Technical Office')}
                    </span>
                  </div>
                </div>

                {deliverable?.notes && (
                  <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 dark:text-slate-500 block text-[11px] mb-1 font-bold">{isAr ? 'ملاحظات عامة:' : 'General Notes:'}</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {deliverable.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? `إجمالي بنود الحزمة: ${deliverable?.items?.length || 0}` : `Total package items: ${deliverable?.items?.length || 0}`}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <ConsultantReviewModal
        isOpen={!!selectedReviewItem}
        onClose={() => setSelectedReviewItem(null)}
        item={selectedReviewItem}
        onSuccess={(updated) => {
          handleItemUpdated(updated);
          setSelectedReviewItem(null);
        }}
      />

      {/* Blocker Modal */}
      <DeliverableBlockerModal
        isOpen={isBlockerOpen}
        onClose={() => setIsBlockerOpen(false)}
        deliverable={deliverable}
        onSuccess={(updated) => {
          setDeliverable(updated);
          if (onDeliverableUpdated) onDeliverableUpdated(updated);
        }}
      />

      {/* Timeline Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        entityId={deliverable?.id || null}
        entityTitle={deliverable ? `تسليمة ${deliverable.ref_code}: ${deliverable.title_ar}` : undefined}
        mode="deliverable"
      />
    </div>
  );
};
