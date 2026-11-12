'use client';

import React, { useState } from 'react';
import { X, Send, AlertCircle, Loader2, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { documentControlService } from '@/lib/services/documentControl.service';
import { documentTransmittalSchema } from '@/lib/validation/schemas/document-control.schema';
import type { DocumentTransmittal } from '@/types/document-control';
import { toast } from 'sonner';

interface NewTransmittalModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: (transmittal: DocumentTransmittal) => void;
}

const PURPOSES = [
  { value: 'for_approval', labelAr: 'للاعتماد', labelEn: 'For Approval' },
  { value: 'for_review', labelAr: 'للمراجعة وإبداء الملاحظات', labelEn: 'For Review & Comments' },
  { value: 'for_information', labelAr: 'للعلم والإحاطة', labelEn: 'For Information' },
  { value: 'for_construction', labelAr: 'للتنفيذ في الموقع', labelEn: 'For Construction (IFC)' },
  { value: 'as_built', labelAr: 'مخططات منفذة حسب الواقع', labelEn: 'As-Built' },
];

const TRANSMITTAL_STATUSES = [
  { value: 'SENT', labelAr: 'تم الإرسال', labelEn: 'Sent' },
  { value: 'RECEIVED', labelAr: 'تم الاستلام', labelEn: 'Received' },
  { value: 'ACKNOWLEDGED', labelAr: 'تم تأكيد الاستلام', labelEn: 'Acknowledged' },
  { value: 'CLOSED', labelAr: 'مغلق', labelEn: 'Closed' },
];

export const NewTransmittalModal: React.FC<NewTransmittalModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}) => {
  const { locale } = useLanguage();
  const isRtl = locale === 'ar';

  const [transmittalNumber, setTransmittalNumber] = useState(`TRN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`);
  const [sender, setSender] = useState(isRtl ? 'المقاول العام - شركة بي زون' : 'Main Contractor - Pzone');
  const [recipient, setRecipient] = useState(isRtl ? 'استشاري المشروع' : 'Project Consultant');
  const [purpose, setPurpose] = useState('for_approval');
  const [transmissionDate, setTransmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [documentsCount, setDocumentsCount] = useState(1);
  const [status, setStatus] = useState('SENT');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const payload = {
      project_id: projectId,
      transmittal_number: transmittalNumber.trim(),
      sender: sender.trim(),
      recipient: recipient.trim(),
      purpose: purpose.trim(),
      transmission_date: transmissionDate ? new Date(transmissionDate).toISOString() : new Date().toISOString(),
      documents_count: Number(documentsCount) || 1,
      status: status.trim(),
    };

    const parsed = documentTransmittalSchema.safeParse(payload);
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
      const savedTrn = await documentControlService.saveTransmittal(payload);
      toast.success(isRtl ? 'تم إصدار خطاب الإرسال بنجاح' : 'Transmittal created successfully');
      onSuccess(savedTrn);
      handleResetAndClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(isRtl ? `فشل إصدار خطاب الإرسال: ${msg}` : `Failed to create transmittal: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setTransmittalNumber(`TRN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`);
    setSender(isRtl ? 'المقاول العام - شركة بي زون' : 'Main Contractor - Pzone');
    setRecipient(isRtl ? 'استشاري المشروع' : 'Project Consultant');
    setPurpose('for_approval');
    setTransmissionDate(new Date().toISOString().split('T')[0]);
    setDocumentsCount(1);
    setStatus('SENT');
    setValidationErrors({});
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-trn-modal-title"
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 id="new-trn-modal-title" className="text-lg font-bold text-gray-900 dark:text-white">
                {isRtl ? 'إصدار خطاب إرسال جديد' : 'Create Document Transmittal'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isRtl ? 'تسجيل إرسال رسمي للمخططات والوثائق للاستشاري أو المالك' : 'Formal transmittal of submittals and engineering drawings'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label={isRtl ? 'إغلاق' : 'Close'}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
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
                <span>{isRtl ? 'يرجى مراجعة الحقول المطلوبة' : 'Please check required fields'}</span>
              </div>
            )}

            {/* Row 1: Transmittal Number & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {isRtl ? 'رقم خطاب الإرسال *' : 'Transmittal Number *'}
                </label>
                <input
                  type="text"
                  placeholder={isRtl ? 'مثال: TRN-2026-042' : 'e.g. TRN-2026-042'}
                  value={transmittalNumber}
                  onChange={(e) => setTransmittalNumber(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500 transition-all shadow-sm"
                  required
                />
                {validationErrors.transmittal_number && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.transmittal_number}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {isRtl ? 'تاريخ الإرسال *' : 'Transmission Date *'}
                </label>
                <input
                  type="date"
                  value={transmissionDate}
                  onChange={(e) => setTransmissionDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500 cursor-pointer transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Row 2: Sender & Recipient */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {isRtl ? 'الجهة المرسلة *' : 'Sender *'}
                </label>
                <input
                  type="text"
                  placeholder={isRtl ? 'المقاول العام' : 'Sender organization'}
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500 transition-all shadow-sm"
                  required
                />
                {validationErrors.sender && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.sender}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {isRtl ? 'الجهة المستلمة *' : 'Recipient *'}
                </label>
                <input
                  type="text"
                  placeholder={isRtl ? 'استشاري المشروع' : 'Recipient organization'}
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500 transition-all shadow-sm"
                  required
                />
                {validationErrors.recipient && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.recipient}</p>
                )}
              </div>
            </div>

            {/* Row 3: Purpose & Documents Count */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {isRtl ? 'الغرض من الإرسال *' : 'Purpose *'}
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500 cursor-pointer transition-all shadow-sm"
                >
                  {PURPOSES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {isRtl ? p.labelAr : p.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {isRtl ? 'عدد الوثائق *' : 'Docs Count *'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={documentsCount}
                  onChange={(e) => setDocumentsCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500 transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Row 4: Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {isRtl ? 'حالة الخطاب *' : 'Transmittal Status *'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500 cursor-pointer transition-all shadow-sm"
              >
                {TRANSMITTAL_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {isRtl ? s.labelAr : s.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-gray-50/80 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleResetAndClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-medium text-sm rounded-lg transition-all shadow-sm hover:shadow cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isRtl ? 'جاري الإصدار...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isRtl ? 'إصدار الخطاب' : 'Issue Transmittal'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
