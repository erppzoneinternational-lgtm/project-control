'use client';

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ProjectService } from '@/lib/services/project.service';
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput';
import { InlineWaveLoader } from '@/components/ui/InlineWaveLoader';
import { Client } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { validateArabicField, validateEnglishField } from '@/lib/utils/language-validator';
import { X, Plus, UserCheck, AlertCircle, Building2, Briefcase, HardHat } from 'lucide-react';
import { logger } from '@/lib/logger';

export type QuickEntityType = 'client' | 'owner' | 'consultant' | 'subcontractor';

interface QuickAddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: (newClient: Client) => void;
  entityType?: QuickEntityType;
  initialName?: string;
}

export const QuickAddClientModal: React.FC<QuickAddClientModalProps> = ({
  isOpen,
  onClose,
  onClientAdded,
  entityType = 'client',
  initialName = '',
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeEntityType, setActiveEntityType] = useState<QuickEntityType>(entityType);

  const [newClientData, setNewClientData] = useState({
    name_ar: '',
    name_en: '',
    code: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    if (isOpen) {
      setActiveEntityType(entityType);
      setErrorMsg('');
      if (initialName) {
        setNewClientData((prev) => ({ ...prev, name_ar: initialName }));
      }
    }
  }, [isOpen, entityType, initialName]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        if (document.body.querySelector(':scope > [role="listbox"]')) return;
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, saving, onClose]);

  const isOwner = activeEntityType === 'owner';
  const isConsultant = activeEntityType === 'consultant';
  const isSubcontractor = activeEntityType === 'subcontractor';

  const entityLabel = isAr
    ? isOwner
      ? 'المالك والمطور'
      : isConsultant
      ? 'الاستشاري'
      : isSubcontractor
      ? 'مقاول الباطن / المورد'
      : 'العميل التعاقدي'
    : isOwner
    ? 'Owner / Developer'
    : isConsultant
    ? 'Consultant'
    : isSubcontractor
    ? 'Subcontractor / Vendor'
    : 'Contract Client';

  const entityTitle = isAr
    ? isOwner
      ? 'إضافة مالك جديد أو مطور عقاري للدليل'
      : isConsultant
      ? 'إضافة مكتب استشاري جديد للدليل'
      : isSubcontractor
      ? 'إضافة مقاول باطن أو مورد جديد للدليل'
      : 'إضافة عميل تعاقدي أو مقاول رئيسي للدليل'
    : isOwner
    ? 'Add New Project Owner / Developer'
    : isConsultant
    ? 'Add New Engineering Consultant'
    : isSubcontractor
    ? 'Add New Subcontractor / Vendor'
    : 'Add New Client / Main Contractor';

  const entitySubtitle = isAr
    ? 'يُحفظ في الدليل الموحد لأصحاب المصلحة ويُتاح في كافة المشاريع والتقارير فوراً'
    : 'Saved to the central Stakeholders & Entities directory for immediate selection and reporting';

  const placeholderAr = isOwner
    ? 'مثال: شركة إعمار مصر / ماونتن فيو / مراكز'
    : isConsultant
    ? 'مثال: دار الهندسة / صبور للاستشارات الهندسية'
    : isSubcontractor
    ? 'مثال: شركة النور للأعمال الكهروميكانيكية'
    : 'مثال: شركة حسن علام للإنشاءات / أوراسكوم للإنشاءات';

  const placeholderEn = isOwner
    ? 'e.g. Emaar Misr / Mountain View'
    : isConsultant
    ? 'e.g. Dar Al-Handasah / ECG'
    : isSubcontractor
    ? 'e.g. Al-Noor MEP Contracting'
    : 'e.g. Hassan Allam Construction';

  const codePrefix = isOwner
    ? 'DEV-'
    : isConsultant
    ? 'CON-'
    : isSubcontractor
    ? 'SUB-'
    : 'CLI-';

  const clientNameArError = validateArabicField(
    newClientData.name_ar,
    isAr ? `اسم ${entityLabel} (بالعربية)` : `${entityLabel} Name (Arabic)`
  );
  const clientNameEnError = validateEnglishField(
    newClientData.name_en,
    isAr ? `اسم ${entityLabel} (بالإنجليزية)` : `${entityLabel} Name (English)`
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientData.name_ar.trim()) {
      setErrorMsg(
        isAr ? `اسم ${entityLabel} بالعربية حقل إجباري` : `${entityLabel} Arabic name is required`
      );
      return;
    }

    if (clientNameArError) {
      setErrorMsg(clientNameArError);
      return;
    }

    if (clientNameEnError) {
      setErrorMsg(clientNameEnError);
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const created = await ProjectService.createClient({
        name_ar: newClientData.name_ar.trim(),
        name_en: newClientData.name_en.trim() || undefined,
        code: newClientData.code.trim() || `${codePrefix}${Date.now().toString().slice(-4)}`,
        contact_person: newClientData.contact_person.trim() || undefined,
        phone: newClientData.phone.trim() || undefined,
        email: newClientData.email.trim() || undefined,
        address: newClientData.address.trim() || undefined,
      });

      onClientAdded(created);
      onClose();
      setNewClientData({
        name_ar: '',
        name_en: '',
        code: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
      });
    } catch (err: unknown) {
      logger.error('Failed to add client/owner', { detail: err });
      setErrorMsg(
        (err as { message?: string } | null)?.message ||
          (isAr ? `حدث خطأ أثناء إضافة ${entityLabel}` : `An error occurred while adding ${entityLabel}`)
      );
    } finally {
      setSaving(false);
    }
  };

  const modalId = isOwner
    ? 'add-owner-modal'
    : isConsultant
    ? 'add-consultant-modal'
    : isSubcontractor
    ? 'add-subcontractor-modal'
    : 'add-client-modal';

  const modalNode = (
    <div
      id={modalId}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-add-client-title"
      dir={isAr ? 'rtl' : 'ltr'}
      onClick={() => !saving && onClose()}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-card w-full max-w-lg p-6 bg-white/95 dark:bg-slate-900/95 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl relative space-y-4 max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                isOwner
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                  : isConsultant
                  ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400'
                  : isSubcontractor
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {isOwner ? (
                <Building2 className="w-5 h-5" />
              ) : isConsultant ? (
                <Briefcase className="w-5 h-5" />
              ) : isSubcontractor ? (
                <HardHat className="w-5 h-5" />
              ) : (
                <UserCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 id="quick-add-client-title" className="text-base font-bold text-slate-900 dark:text-white">
                {entityTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{entitySubtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notice */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Party Type Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
            {isAr ? 'تصنيف الجهة في الدليل الموحد' : 'Directory Entity Classification'}
          </label>
          <div
            role="radiogroup"
            aria-label={isAr ? 'تصنيف الجهة' : 'Party type selector'}
            className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80"
          >
            {[
              { id: 'client', labelAr: 'مقاول عام / عميل', labelEn: 'Client' },
              { id: 'owner', labelAr: 'مالك / مطور', labelEn: 'Owner' },
              { id: 'consultant', labelAr: 'استشاري', labelEn: 'Consultant' },
              { id: 'subcontractor', labelAr: 'مقاول باطن', labelEn: 'Subcontractor' },
            ].map((party) => {
              const isSelected = activeEntityType === party.id;
              return (
                <button
                  key={party.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setActiveEntityType(party.id as QuickEntityType)}
                  className={`py-2 px-2 rounded-lg text-[11px] font-bold transition-all duration-150 cursor-pointer text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm border border-slate-200 dark:border-slate-700 font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {isAr ? party.labelAr : party.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <FloatingLabelInput
                label={isAr ? `اسم ${entityLabel} (بالعربية) *` : `${entityLabel} Name (Arabic) *`}
                dir="rtl"
                value={newClientData.name_ar}
                onChange={(e) => setNewClientData((p) => ({ ...p, name_ar: e.target.value }))}
                placeholder={placeholderAr}
                error={clientNameArError || undefined}
                fullWidth
                badgeBgLight="#ffffff"
                badgeBgDark="#0f172a"
                required
                autoFocus
              />
            </div>

            <div className="sm:col-span-2">
              <FloatingLabelInput
                label={isAr ? `اسم ${entityLabel} (بالإنجليزية)` : `${entityLabel} Name (English)`}
                dir="ltr"
                value={newClientData.name_en}
                onChange={(e) => setNewClientData((p) => ({ ...p, name_en: e.target.value }))}
                placeholder={placeholderEn}
                error={clientNameEnError || undefined}
                fullWidth
                badgeBgLight="#ffffff"
                badgeBgDark="#0f172a"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                {isAr ? 'شخص الاتصال المسؤول' : 'Primary Contact Person'}
              </label>
              <input
                type="text"
                value={newClientData.contact_person}
                onChange={(e) => setNewClientData((p) => ({ ...p, contact_person: e.target.value }))}
                placeholder={isAr ? 'مثال: م. أحمد منصور' : 'e.g. Eng. Ahmed Mansour'}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all cursor-text min-h-[42px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                {isAr ? 'رقم الهاتف' : 'Phone Number'}
              </label>
              <input
                type="text"
                value={newClientData.phone}
                onChange={(e) => setNewClientData((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+20 100 000 0000"
                dir="ltr"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all cursor-text text-left min-h-[42px]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                {isAr ? 'العنوان والمقر الرئيسي' : 'Headquarters / Address'}
              </label>
              <input
                type="text"
                value={newClientData.address}
                onChange={(e) => setNewClientData((p) => ({ ...p, address: e.target.value }))}
                placeholder={isAr ? 'مثال: القرية الذكية، الشيخ زايد، الجيزة' : 'e.g. Smart Village, Sheikh Zayed, Giza'}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all cursor-text min-h-[42px]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/25 disabled:opacity-50 transition-all min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              {saving ? (
                <InlineWaveLoader text={isAr ? 'جاري الحفظ...' : 'Saving...'} size="sm" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? `حفظ ${entityLabel} وتحديده` : `Save & Select ${entityLabel}`}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? ReactDOM.createPortal(modalNode, document.body) : modalNode;
};
