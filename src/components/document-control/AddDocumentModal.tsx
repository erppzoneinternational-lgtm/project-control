// src/components/document-control/AddDocumentModal.tsx
'use client';

import React, { useState } from 'react';
import { X, UploadCloud, AlertCircle, FileText, Loader2, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { documentControlService } from '@/lib/services/documentControl.service';
import { controlledDocumentSchema } from '@/lib/validation/schemas/document-control.schema';
import type { ControlledDocument, DocType, DocStatus } from '@/types/document-control';
import { toast } from 'sonner';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: (doc: ControlledDocument) => void;
}

const DOC_TYPES: { value: DocType; labelAr: string; labelEn: string }[] = [
  { value: 'drawing', labelAr: 'مخطط هندسي', labelEn: 'Engineering Drawing' },
  { value: 'specification', labelAr: 'مواصفات فنية', labelEn: 'Technical Specification' },
  { value: 'submittal', labelAr: 'اعتماد مواد وعينات تقديمية', labelEn: 'Material / Shop Submittal' },
  { value: 'contract', labelAr: 'عقد أو ملحق تعاقدي', labelEn: 'Contract / Addendum' },
  { value: 'correspondence', labelAr: 'مراسلات رسمية', labelEn: 'Correspondence' },
  { value: 'report', labelAr: 'تقرير فني', labelEn: 'Technical Report' },
  { value: 'certificate', labelAr: 'شهادة اعتماد أو استلام', labelEn: 'Certificate' },
  { value: 'other', labelAr: 'أخرى', labelEn: 'Other' },
];

const DISCIPLINES: { value: string; labelAr: string; labelEn: string }[] = [
  { value: 'architectural', labelAr: 'معماري', labelEn: 'Architectural' },
  { value: 'structural', labelAr: 'إنشائي', labelEn: 'Structural' },
  { value: 'mep', labelAr: 'أعمال كهروميكانيكية', labelEn: 'MEP' },
  { value: 'civil', labelAr: 'مدني', labelEn: 'Civil' },
  { value: 'infrastructure', labelAr: 'بنية تحتية', labelEn: 'Infrastructure' },
  { value: 'general', labelAr: 'عام وإداري', labelEn: 'General / Management' },
];

const DOC_STATUSES: { value: DocStatus; labelAr: string; labelEn: string }[] = [
  { value: 'draft', labelAr: 'مسودة', labelEn: 'Draft' },
  { value: 'under_review', labelAr: 'قيد المراجعة', labelEn: 'Under Review' },
  { value: 'approved', labelAr: 'معتمد', labelEn: 'Approved' },
  { value: 'superseded', labelAr: 'مستبدل', labelEn: 'Superseded' },
  { value: 'archived', labelAr: 'مؤرشف', labelEn: 'Archived' },
];

export const AddDocumentModal: React.FC<AddDocumentModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const isRtl = isAr;

  const [documentNumber, setDocumentNumber] = useState('');
  const [revision, setRevision] = useState('00');
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [docType, setDocType] = useState<DocType>('drawing');
  const [discipline, setDiscipline] = useState('architectural');
  const [status, setStatus] = useState<DocStatus>('under_review');
  const [issuedDate, setIssuedDate] = useState(new Date().toISOString().split('T')[0]);
  const [fileUrl, setFileUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const payload = {
      project_id: projectId,
      document_number: documentNumber.trim(),
      revision: revision.trim(),
      title_ar: titleAr.trim(),
      title_en: titleEn.trim() || titleAr.trim(),
      type: docType,
      discipline: discipline.trim(),
      status,
      issued_date: issuedDate ? new Date(issuedDate).toISOString() : null,
      file_url: fileUrl.trim() || null,
    };

    const parsed = controlledDocumentSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((err) => {
        const fieldName = err.path.join('.');
        fieldErrors[fieldName] = err.message;
      });
      setValidationErrors(fieldErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const savedDoc = await documentControlService.saveDocument(payload);
      toast.success(isAr ? 'تمت إضافة الوثيقة بنجاح' : 'Document added successfully');
      onSuccess(savedDoc);
      handleResetAndClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(isAr ? `فشل إضافة الوثيقة: ${msg}` : `Failed to add document: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setDocumentNumber('');
    setRevision('00');
    setTitleAr('');
    setTitleEn('');
    setDocType('drawing');
    setDiscipline('architectural');
    setStatus('under_review');
    setIssuedDate(new Date().toISOString().split('T')[0]);
    setFileUrl('');
    setValidationErrors({});
    onClose();
  };

  const inputBaseClasses =
    'w-full px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors';
  const selectBaseClasses =
    'w-full px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors cursor-pointer';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-doc-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
    >
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 id="add-doc-modal-title" className="text-lg font-bold text-gray-900 dark:text-white">
                {isAr ? 'إضافة وثيقة أو مخطط جديد' : 'Add New Document / Drawing'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isAr ? 'تسجيل وثيقة رسمية داخل سجل وثائق المشروع' : 'Register a controlled document in project records'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-6 space-y-4 flex-1">
            {Object.keys(validationErrors).length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{isAr ? 'يرجى تصحيح الأخطاء الموضحة أدناه قبل الحفظ' : 'Please resolve the highlighted errors below'}</span>
              </div>
            )}

            {/* Row 1: Document Number & Revision */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {isAr ? 'رقم الوثيقة أو الرمز الكودي *' : 'Document Number / Code *'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'مثال: DWG-ARC-001' : 'e.g. DWG-ARC-001'}
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className={inputBaseClasses}
                  required
                />
                {validationErrors.document_number && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.document_number}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {isAr ? 'رقم المراجعة أو الإصدار *' : 'Revision *'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'مثال: 00' : 'e.g. 00, A, 01'}
                  value={revision}
                  onChange={(e) => setRevision(e.target.value)}
                  className={inputBaseClasses}
                  required
                />
                {validationErrors.revision && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.revision}</p>
                )}
              </div>
            </div>

            {/* Row 2: Title Arabic & Title English */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {isAr ? 'العنوان باللغة العربية *' : 'Title (Arabic) *'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'مخططات الواجهات المعمارية الرئيسية' : 'Arabic title'}
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  dir="rtl"
                  className={inputBaseClasses}
                  required
                />
                {validationErrors.title_ar && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.title_ar}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {isAr ? 'العنوان باللغة الإنجليزية' : 'Title (English)'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'العنوان باللغة الإنجليزية (اختياري)' : 'e.g. Main Architectural Elevation Drawings'}
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  dir="ltr"
                  className={inputBaseClasses}
                />
                {validationErrors.title_en && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.title_en}</p>
                )}
              </div>
            </div>

            {/* Row 3: Type & Discipline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {isAr ? 'نوع الوثيقة *' : 'Document Type *'}
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocType)}
                  className={selectBaseClasses}
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {isAr ? t.labelAr : t.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {isAr ? 'التخصص الهندسي *' : 'Engineering Discipline *'}
                </label>
                <select
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value)}
                  className={selectBaseClasses}
                >
                  {DISCIPLINES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {isAr ? d.labelAr : d.labelEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 4: Status & Issue Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {isAr ? 'حالة الوثيقة *' : 'Status *'}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DocStatus)}
                  className={selectBaseClasses}
                >
                  {DOC_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {isAr ? s.labelAr : s.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {isAr ? 'تاريخ الإصدار' : 'Issue Date'}
                </label>
                <input
                  type="date"
                  value={issuedDate}
                  onChange={(e) => setIssuedDate(e.target.value)}
                  className={`${inputBaseClasses} cursor-pointer`}
                />
              </div>
            </div>

            {/* Row 5: File URL or attachment */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {isAr ? 'رابط المستند أو الملف المرفق' : 'File / Download URL'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/drawings/dwg-001.pdf"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className={inputBaseClasses}
                />
              </div>
              {validationErrors.file_url && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.file_url}</p>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-gray-50/80 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleResetAndClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'حفظ الوثيقة' : 'Save Document'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

