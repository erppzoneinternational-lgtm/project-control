import React, { useState, useCallback } from 'react';
import { Project, ArchiveLog } from '@/types';
import { ProjectTabsService } from '@/lib/services/projectTabs.service';
import {
  Archive,
  Clock,
  User,
  Eye,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  X,
  Copy,
  Check
} from 'lucide-react';
import { useCleanupEffect } from '@/lib/utils/useCleanupEffect';

interface ArchiveTabProps {
  project: Project;
  isAr?: boolean;
}

export const ArchiveTab: React.FC<ArchiveTabProps> = React.memo(({ project, isAr = true }) => {
  const [logs, setLogs] = useState<ArchiveLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayload, setSelectedPayload] = useState<Record<string, any> | null>(null);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async (isCancelled?: () => boolean) => {
    setLoading(true);
    try {
      const data = await ProjectTabsService.getArchiveLogs(project.id);
      if (!isCancelled || !isCancelled()) {
        setLogs(data);
      }
    } finally {
      if (!isCancelled || !isCancelled()) {
        setLoading(false);
      }
    }
  }, [project.id]);

  useCleanupEffect(async (isCancelled) => {
    await loadData(isCancelled);
  }, [loadData]);

  const handleCopy = useCallback(() => {
    if (!selectedPayload) return;
    navigator.clipboard.writeText(JSON.stringify(selectedPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [selectedPayload]);

  const formatEntityType = (type: string) => {
    if (!isAr) return type.replace(/_/g, ' ');
    const map: Record<string, string> = {
      project: 'مشروع',
      team_member: 'عضو فريق',
      member: 'عضو',
      payment: 'دفعة مالية',
      document: 'وثيقة',
      milestone: 'مرحلة رئيسية',
      task: 'مهمة',
      contract: 'عقد',
      risk: 'مخاطرة',
      change_order: 'أمر تغيير'
    };
    return map[type.toLowerCase()] || type;
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" />
        <p className="text-xs font-bold">
          {isAr
            ? 'جاري تحميل سجل الأرشيف والعناصر المستبعدة...'
            : 'Loading archive records and deleted items...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Archive className="w-4 h-4 text-rose-500" />
            <span>{isAr ? 'سجل الأرشيف والمحذوفات' : 'Archive & Deletion Records'}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr
              ? 'أرشفة آلية شاملة لكافة العناصر المستبعدة من المشروع أو فريق العمل أو الدفعات والوثائق'
              : 'Automated archive of all items deleted from the project, team members, payments, and documents'}
          </p>
        </div>
      </div>

      {/* Archive Readiness & Audit Checklist Card */}
      <div className="glass-card p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-950/40 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {isAr ? 'قائمة التحقق من متطلبات الأرشيف' : 'Archive Readiness Checklist'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'معايير التحقق القياسية قبل نقل المشروع أو عناصره إلى الأرشيف الدائم'
                  : 'Standard verification criteria before moving project or components to permanent archive'}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            {isAr ? 'محمي بنظام التدقيق' : 'Audit Protected'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'حفظ السجلات والبيانات' : 'Data & Record Preservation'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {isAr
                  ? 'حفظ لقطة غير قابلة للتعديل لكافة العناصر المستبعدة والمعدلة'
                  : 'Immutable snapshot preserved for all deleted and modified items'}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'سلسلة عهدة التدقيق' : 'Audit Chain of Custody'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {isAr
                  ? 'توثيق هوية المستخدم والطابع الزمني وتفاصيل الحذف بدقة'
                  : 'User identity, timestamp, and deletion details accurately logged'}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'إمكانية الاسترجاع والتتبع' : 'Recoverability & Traceability'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {isAr
                  ? 'الاحتفاظ بكامل بنية البيانات بصيغتها الأصلية القابلة للفحص'
                  : 'Complete data structures preserved in inspected native payload format'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Logs List or Empty State */}
      {logs.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 dark:text-slate-400 text-xs border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
          {isAr
            ? 'لا توجد عناصر مؤرشفة لهذا المشروع حالياً. عند استبعاد أي عنصر يتم حفظه تلقائياً في الأرشيف لضمان عدم ضياع البيانات.'
            : 'No archived items found for this project. When any item is deleted, it is automatically archived here to prevent data loss.'}
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <div
              key={log.id}
              className="glass-card p-4 flex items-center justify-between gap-4 border border-rose-500/20 bg-rose-500/5 hover:border-rose-500/35 transition-all duration-200 rounded-xl"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-600 dark:text-rose-300">
                    {formatEntityType(log.entity_type)}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {log.entity_name}
                  </h4>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(log.archived_at).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    {isAr ? 'بواسطة:' : 'By:'} {log.deleted_by}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPayload(log.archived_data)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isAr ? 'عرض تفاصيل البيانات' : 'View Payload Details'}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Payload Modal */}
      {selectedPayload && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-xl p-6 space-y-4 max-h-[80vh] overflow-y-auto rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'تفاصيل بيانات السجل المؤرشف' : 'Archived Record Data Payload'}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isAr ? 'تم النسخ' : 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isAr ? 'نسخ البيانات' : 'Copy'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPayload(null)}
                  className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  aria-label={isAr ? 'إغلاق' : 'Close'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto dir-ltr">
              {JSON.stringify(selectedPayload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
});

ArchiveTab.displayName = 'ArchiveTab';

