'use client';

import React, { useState, useEffect } from 'react';
import { X, GitBranch, AlertCircle, Loader2, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { documentControlService } from '@/lib/services/documentControl.service';
import { toSafeHttpUrl } from '@/lib/utils/security';
import type { ControlledDocument, DocStatus } from '@/types/document-control';
import { toast } from 'sonner';

interface NewRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ControlledDocument | null;
  documents: ControlledDocument[];
  projectId: string;
  onSuccess: (doc: ControlledDocument) => void;
}

export const NewRevisionModal: React.FC<NewRevisionModalProps> = ({
  isOpen,
  onClose,
  document: initialDoc,
  documents,
  projectId,
  onSuccess,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const isRtl = isAr;

  const [selectedDocId, setSelectedDocId] = useState<string>(initialDoc?.id || '');
  const [newRevision, setNewRevision] = useState('');
  const [newStatus, setNewStatus] = useState<DocStatus>('under_review');
  const [issuedDate, setIssuedDate] = useState(new Date().toISOString().split('T')[0]);
  const [fileUrl, setFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialDoc) {
      setSelectedDocId(initialDoc.id);
      // Guess next revision
      const cur = initialDoc.revision;
      if (/^\d+$/.test(cur)) {
        setNewRevision(String(parseInt(cur, 10) + 1).padStart(2, '0'));
      } else if (/^[A-Za-z]$/.test(cur)) {
        setNewRevision(String.fromCharCode(cur.charCodeAt(0) + 1));
      } else {
        setNewRevision(`${cur}_rev1`);
      }
      setFileUrl(initialDoc.file_url || '');
    } else if (documents.length > 0) {
      setSelectedDocId(documents[0].id);
      setNewRevision('01');
    }
  }, [initialDoc, documents]);

  if (!isOpen) return null;

  const currentDoc = documents.find((d) => d.id === selectedDocId) || initialDoc;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentDoc) {
      setErrorMsg(isAr ? 'يرجى اختيار الوثيقة المستهدفة' : 'Please select a document');
      return;
    }

    if (!newRevision.trim()) {
      setErrorMsg(isAr ? 'رقم المراجعة الجديد مطلوب' : 'New revision is required');
      return;
    }

    const trimmedFileUrl = fileUrl.trim();
    let safeFileUrl: string | undefined;
    if (trimmedFileUrl) {
      const validated = toSafeHttpUrl(trimmedFileUrl);
      if (!validated) {
        setErrorMsg(
          isAr
            ? 'رابط الملف غير صالح أو غير آمن (يُسمح فقط بروابط http:// أو https://)'
            : 'Invalid or unsafe file URL (only http:// or https:// URLs are allowed)'
        );
        return;
      }
      safeFileUrl = validated;
    } else if (currentDoc.file_url) {
      safeFileUrl = toSafeHttpUrl(currentDoc.file_url) ?? undefined;
    }

    try {
      setIsSubmitting(true);
      // Create new record for this revision under the same project & document_number
      const newDocPayload: Partial<ControlledDocument> = {
        project_id: projectId,
        document_number: currentDoc.document_number,
        revision: newRevision.trim(),
        title_ar: currentDoc.title_ar,
        title_en: currentDoc.title_en,
        type: currentDoc.type,
        discipline: currentDoc.discipline,
        status: newStatus,
        issued_date: issuedDate ? new Date(issuedDate).toISOString() : new Date().toISOString(),
        file_url: safeFileUrl,
      };

      const saved = await documentControlService.saveDocument(newDocPayload);
      toast.success(
        isAr
          ? `تم إصدار المراجعة الجديدة (${newRevision.trim()}) بنجاح`
          : `New revision (${newRevision.trim()}) created successfully`
      );
      onSuccess(saved);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      toast.error(isAr ? `فشل إنشاء المراجعة: ${msg}` : `Failed to create revision: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-rev-modal-title"
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 id="new-rev-modal-title" className="text-lg font-bold text-gray-900 dark:text-white">
                {isAr ? 'إصدار مراجعة جديدة للوثيقة' : 'Issue New Document Revision'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isAr ? 'إنشاء مراجعة جديدة مع الاحتفاظ بسجل التدقيق والتعديلات' : 'Create new revision preserving revision audit history'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-6 space-y-4 flex-1">
            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Select Document */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {isAr ? 'الوثيقة المستهدفة *' : 'Target Document *'}
              </label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors shadow-sm"
              >
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.document_number} - {isAr ? (doc.title_ar || doc.title_en) : (doc.title_en || doc.title_ar)} ({isAr ? 'مراجعة' : 'Rev'} {doc.revision})
                  </option>
                ))}
              </select>
            </div>

            {/* Current Revision vs New Revision */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {isAr ? 'المراجعة الحالية' : 'Current Rev'}
                </label>
                <input
                  type="text"
                  disabled
                  value={currentDoc?.revision || '-'}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed select-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {isAr ? 'المراجعة الجديدة *' : 'New Revision *'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'مثال: 01 أو B' : 'e.g. 01, B'}
                  value={newRevision}
                  onChange={(e) => setNewRevision(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Status & Issue Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {isAr ? 'حالة المراجعة *' : 'Revision Status *'}
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as DocStatus)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors shadow-sm"
                >
                  <option value="under_review">{isAr ? 'قيد المراجعة' : 'Under Review'}</option>
                  <option value="approved">{isAr ? 'معتمد' : 'Approved'}</option>
                  <option value="draft">{isAr ? 'مسودة' : 'Draft'}</option>
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
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors shadow-sm"
                />
              </div>
            </div>

            {/* Updated File URL */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {isAr ? 'رابط ملف المراجعة (اختياري)' : 'New Revision File URL (Optional)'}
              </label>
              <input
                type="url"
                dir="ltr"
                placeholder="https://example.com/drawings/dwg-001-revB.pdf"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors shadow-sm text-left"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50/80 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'إصدار المراجعة' : 'Issue Revision'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
