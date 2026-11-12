'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ConsultantApprovalCode } from '@/types/planning';

export interface TOConsultantStatusBadgeProps {
  code?: ConsultantApprovalCode | string | null;
  status?: string | null;
  isReadyForManager?: boolean;
  isManagerApproved?: boolean;
  isBlocked?: boolean;
  className?: string;
}

export const TOConsultantStatusBadge: React.FC<TOConsultantStatusBadgeProps> = ({
  code,
  status,
  isReadyForManager,
  isManagerApproved,
  isBlocked,
  className = '',
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  // 1. Blocked has top priority for visual alert
  if (isBlocked || status === 'blocked') {
    return (
      <span
        role="status"
        title={isAr ? 'معطل بعائق فني - يتطلب تدخلاً هندسياً وحلاً فورياً' : 'Blocked: Technical issue requires resolution'}
        aria-label={isAr ? 'معطل بعائق فني' : 'Blocked with technical issue'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-tight bg-amber-50 dark:bg-amber-950/70 text-amber-950 dark:text-amber-100 ring-1 ring-inset ring-amber-600/30 dark:ring-amber-400/30 border border-amber-300/80 dark:border-amber-800/80 ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" aria-hidden="true" />
        <span>{isAr ? 'معطل بعائق فني' : 'Blocked'}</span>
      </span>
    );
  }

  // 2. Consultant Approval Codes (A / B / C / D)
  if (code === 'A') {
    return (
      <span
        role="status"
        title={isAr ? 'كود أ: معتمد نهائياً بدون أي ملاحظات من الاستشاري' : 'Code A: Approved without comments'}
        aria-label={isAr ? 'كود أ: معتمد بدون ملاحظات' : 'Code A: Approved'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-tight bg-emerald-50 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-100 ring-1 ring-inset ring-emerald-600/30 dark:ring-emerald-400/30 border border-emerald-300/80 dark:border-emerald-800/80 ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" aria-hidden="true" />
        <span dir="ltr" className="font-mono font-bold">Code A</span>
        <span className="hidden sm:inline">({isAr ? 'معتمد' : 'Approved'})</span>
      </span>
    );
  }

  if (code === 'B') {
    return (
      <span
        role="status"
        title={isAr ? 'كود ب: معتمد مع الالتزام بملاحظات الاستشاري المدونة' : 'Code B: Approved as Noted'}
        aria-label={isAr ? 'كود ب: معتمد بملاحظات' : 'Code B: Approved as Noted'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-tight bg-sky-50 dark:bg-sky-950/70 text-sky-950 dark:text-sky-100 ring-1 ring-inset ring-sky-600/30 dark:ring-sky-400/30 border border-sky-300/80 dark:border-sky-800/80 ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400 shrink-0" aria-hidden="true" />
        <span dir="ltr" className="font-mono font-bold">Code B</span>
        <span className="hidden sm:inline">({isAr ? 'معتمد بملاحظات' : 'As Noted'})</span>
      </span>
    );
  }

  if (code === 'C') {
    return (
      <span
        role="status"
        title={isAr ? 'كود ج: تعديل الملاحظات وإعادة التقديم للاستشاري' : 'Code C: Revise and Resubmit'}
        aria-label={isAr ? 'كود ج: إعادة تقديم وتعديل' : 'Code C: Revise & Resubmit'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-tight bg-amber-50 dark:bg-amber-950/70 text-amber-950 dark:text-amber-100 ring-1 ring-inset ring-amber-600/30 dark:ring-amber-400/30 border border-amber-300/80 dark:border-amber-800/80 ${className}`}
      >
        <RotateCcw className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" aria-hidden="true" />
        <span dir="ltr" className="font-mono font-bold">Code C</span>
        <span className="hidden sm:inline">({isAr ? 'إعادة تقديم' : 'Revise'})</span>
      </span>
    );
  }

  if (code === 'D') {
    return (
      <span
        role="status"
        title={isAr ? 'كود د: مرفوض كلياً من الاستشاري ويتطلب إعادة دراسة شاملة' : 'Code D: Rejected by Consultant'}
        aria-label={isAr ? 'كود د: مرفوض' : 'Code D: Rejected'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-tight bg-rose-50 dark:bg-rose-950/70 text-rose-950 dark:text-rose-100 ring-1 ring-inset ring-rose-600/30 dark:ring-rose-400/30 border border-rose-300/80 dark:border-rose-800/80 ${className}`}
      >
        <XCircle className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400 shrink-0" aria-hidden="true" />
        <span dir="ltr" className="font-mono font-bold">Code D</span>
        <span className="hidden sm:inline">({isAr ? 'مرفوض' : 'Rejected'})</span>
      </span>
    );
  }

  // 3. Ready for TO Manager internal review
  if (isReadyForManager || status === 'ready_to_return') {
    return (
      <span
        role="status"
        title={isAr ? 'جاهز للمراجعة وتوقيع مدير المكتب الفني قبل الإرسال' : 'Ready for TO Manager Sign-off'}
        aria-label={isAr ? 'بانتظار اعتماد مدير المكتب الفني' : 'Ready for TO Manager Sign-off'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-tight bg-purple-50 dark:bg-purple-950/70 text-purple-950 dark:text-purple-100 ring-1 ring-inset ring-purple-600/30 dark:ring-purple-400/30 border border-purple-300/80 dark:border-purple-800/80 ${className}`}
      >
        <FileCheck className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400 shrink-0" aria-hidden="true" />
        <span>{isAr ? 'بانتظار اعتماد المدير' : 'TO Sign-off'}</span>
      </span>
    );
  }

  // 4. Manager approved internally, pending consultant submission
  if (isManagerApproved) {
    return (
      <span
        role="status"
        title={isAr ? 'معتمد داخلياً من مدير المكتب الفني - مرسل للاستشاري للمراجعة' : 'Manager approved - Under consultant review'}
        aria-label={isAr ? 'معتمد داخلياً - مرسل للاستشاري' : 'Manager approved - At Consultant'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-tight bg-teal-50 dark:bg-teal-950/70 text-teal-950 dark:text-teal-100 ring-1 ring-inset ring-teal-600/30 dark:ring-teal-400/30 border border-teal-300/80 dark:border-teal-800/80 ${className}`}
      >
        <Clock className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" aria-hidden="true" />
        <span>{isAr ? 'مرسل للاستشاري' : 'At Consultant'}</span>
      </span>
    );
  }

  // 5. Default in-progress
  return (
    <span
      role="status"
      title={isAr ? 'قيد الإعداد والدراسة الهندسية داخل المكتب الفني' : 'In preparation by Technical Office'}
      aria-label={isAr ? 'قيد العمل والإعداد' : 'In Progress'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-tight bg-slate-100 dark:bg-slate-800/90 text-slate-950 dark:text-slate-100 ring-1 ring-inset ring-slate-400/30 dark:ring-slate-600/40 border border-slate-300 dark:border-slate-700 ${className}`}
    >
      <Clock className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" aria-hidden="true" />
      <span>{isAr ? 'قيد العمل' : 'In Progress'}</span>
    </span>
  );
};
