'use client';

import React, { useRef, useEffect } from 'react';
import { Project } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/lib/format';
import { escapeHtml } from '@/lib/utils/security';
import { 
  Printer, 
  X, 
  ShieldCheck, 
  FileCheck2, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  BadgeCheck,
  Award
} from 'lucide-react';

export interface HandoverCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const HandoverCertificateModal: React.FC<HandoverCertificateModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const modalRef = useRef<HTMLDivElement>(null);

  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Isolate certificate on body during modal display for print protection
    document.body.classList.add('handover-cert-modal-open');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('handover-cert-modal-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const checklist = project.metadata?.handover_checklist;
  const certificateDate = checklist?.handover_at 
    ? new Date(checklist.handover_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  const dlpStartDateStr = checklist?.dlp_start_date || new Date().toISOString().split('T')[0];
  const dlpEndDate = new Date(dlpStartDateStr);
  dlpEndDate.setFullYear(dlpEndDate.getFullYear() + 1);

  const formattedDlpEnd = dlpEndDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const formattedDlpStart = new Date(dlpStartDateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  const totalContract = Number(project.total_contract_value) || (Number(project.contract_value) + (Number(project.vos_value) || 0));

  const openPrintPopup = (htmlContent: string) => {
    const printWin = window.open('', '_blank', 'width=950,height=950');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
        printWin.close();
      }, 400);
    } else {
      window.print();
    }
  };

  const handlePrint = () => {
    const certElem = certificateRef.current;
    if (!certElem) {
      window.print();
      return;
    }

    // Collect parent stylesheets and Tailwind classes
    const styleTags = typeof document !== 'undefined'
      ? Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
          .map(el => el.outerHTML)
          .join('\n')
      : '';

    const safeProjectName = escapeHtml(project.project_name || project.name_ar || '');
    const safeCertHtml = certElem.innerHTML.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ''
    );

    const printDocumentHtml = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>محضر الاستلام الابتدائي (TOC) - ${safeProjectName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  ${styleTags}
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #ffffff !important;
      color: #0f172a !important;
      font-family: 'Cairo', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      direction: rtl !important;
      text-align: right !important;
      font-size: 11px !important;
      line-height: 1.4 !important;
    }
    .print-certificate-container {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      padding: 0 !important;
      background: #ffffff !important;
    }
    .print-certificate-container .p-8,
    .print-certificate-container .sm\\:p-12 {
      padding: 0 !important;
    }
    .print-certificate-container .space-y-8 > :not([hidden]) ~ :not([hidden]) {
      margin-top: 1rem !important;
    }
    .print-certificate-container .grid-cols-2,
    .print-certificate-container .sm\\:grid-cols-4 {
      display: grid !important;
      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
      gap: 0.5rem !important;
    }
    .print-certificate-container .sm\\:grid-cols-3 {
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      gap: 0.75rem !important;
    }
    .print-certificate-container svg {
      display: inline-block !important;
      vertical-align: middle !important;
      flex-shrink: 0 !important;
    }
    .avoid-break {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
  </style>
</head>
<body>
  <div class="print-certificate-container">
    ${safeCertHtml}
  </div>
</body>
</html>`;

    try {
      let iframe = document.getElementById('handover-cert-print-frame') as HTMLIFrameElement | null;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'handover-cert-print-frame';
        iframe.style.position = 'fixed';
        iframe.style.top = '-9999px';
        iframe.style.left = '-9999px';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
      }

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(printDocumentHtml);
        doc.close();

        setTimeout(() => {
          try {
            iframe?.contentWindow?.focus();
            iframe?.contentWindow?.print();
          } catch {
            openPrintPopup(printDocumentHtml);
          }
        }, 350);
        return;
      }
    } catch {
      // Fallback if iframe fails
    }

    openPrintPopup(printDocumentHtml);
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static print:z-auto print:block"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="handover-cert-title"
      data-testid="handover-certificate-modal"
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-4 overflow-hidden print:border-none print:shadow-none print:rounded-none print:my-0 print:max-w-none print:bg-white print:text-black"
      >
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-black text-slate-900 dark:text-white">
              {isAr ? 'معاينة وثيقة الاستلام الابتدائي الرسمية (PMI TOC)' : 'Taking-Over Certificate Preview'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer min-h-[40px]"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة / تصدير PDF' : 'Print / Export PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              aria-label={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Body */}
        <div 
          ref={certificateRef}
          id="handover-certificate-printable"
          className="p-8 sm:p-12 space-y-6 sm:space-y-8 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 print:p-2 print:space-y-4"
        >
          {/* Header & Logo */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 dark:border-slate-700 pb-6 print:pb-3 avoid-break">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-emerald-700 dark:text-emerald-500">P.ZONE</span>
                <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">
                  Engineering & Construction
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                شركة بي زون للمنشآت المائية وحمامات السباحة واللاندسكيب
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                P.ZONE FOR AQUATIC FACILITIES & SWIMMING POOLS S.A.E
              </p>
            </div>

            <div className="text-left space-y-1">
              <span className="inline-block px-3 py-1 rounded-md text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700">
                TOC-{project.project_code || project.id.slice(0, 8).toUpperCase()}
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">تاريخ التحرير: {certificateDate}</p>
              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">معتمد طبقاً لمعايير FIDIC / PMI</p>
            </div>
          </div>

          {/* Certificate Title Banner */}
          <div className="text-center py-4 print:py-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-800 avoid-break">
            <h1 id="handover-cert-title" className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              محضر الاستلام الابتدائي للأعمال
            </h1>
            <h2 className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
              Official Taking-Over Certificate (TOC)
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-1 font-serif">
              طبقاً لأحكام عقد المقاولة المبرم وأحكام الفيديك (FIDIC Red Book Sub-Clause 10.1)
            </p>
          </div>

          {/* Project Details Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-3 print:gap-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl p-4 print:p-2.5 bg-slate-50/50 dark:bg-slate-800/50 print:bg-slate-50 avoid-break">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">اسم المشروع:</span>
              <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">{project.project_name || project.name_ar}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 block">كود المشروع:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{project.project_code || '---'}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 block">مالك المشروع (الطرف الأول):</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{project.client?.name_ar || project.client?.name_en || 'العميل المعتمد'}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 block">المقاول العام (الطرف الثاني):</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">شركة بي زون (P.ZONE)</span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 block">الموقع الجغرافي:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{project.site_location_address || 'جمهورية مصر العربية'}</span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 block">قيمة العقد الإجمالية:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatCurrency(totalContract)} EGP</span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 block">مرجع خطاب التسليم TOC:</span>
              <span className="font-mono font-bold text-purple-700 dark:text-purple-400">{project.toc_letter || checklist?.toc_reference || 'TOC-SUBMITTED'}</span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 block">فترة ضمان العيوب (DLP):</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">365 يوماً (سنة ميلادية)</span>
            </div>
          </div>

          {/* Legal Handover Recital & Clauses */}
          <div className="space-y-4 print:space-y-2 text-xs print:text-[11px] leading-relaxed text-slate-800 dark:text-slate-200">
            <p className="font-bold">
              إنه في يوم <span className="underline decoration-slate-400 dark:decoration-slate-600 underline-offset-4">{certificateDate}</span>، 
              اجتمعت لجنة الاستلام المشتركة المكونة من ممثلي الطرفين (المالك والمقاول العام)، وبحضور الاستشاري المشرف، 
              لمعاينة الأعمال المنفذة بالمشروع المذكور أعلاه، وقد أسفرت المعاينة والتدقيق الفني عما يلي:
            </p>

            <div className="space-y-2.5 print:space-y-1.5 pr-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong>1. اكتمال الأعمال الجوهرية (Substantial Completion):</strong> أتم المقاول العام (شركة بي زون) 
                  تنفيذ كافة الأعمال التعاقدية والتوريدات المشمولة بالعقد وأوامر التغيير المعتمدة، وأصبحت المنشأة صالحة للاستخدام والغرض المخصص لها.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong>2. اختبارات التشغيل والفحص الفني (Testing & Commissioning):</strong> تم إجراء واجتياز كافة اختبارات 
                  ضغط الشبكات، أنظمة الفلترة، التعقيم، والمضخات ومطابقتها للمواصفات القياسية بنجاح.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong>3. المخططات التنفيذية وكتيبات التشغيل (As-Built & O&M Manuals):</strong> قام المقاول بتسليم كامل 
                  حزمة الرسومات المطابقة للواقع (As-Built Drawings) وكتيبات التشغيل والصيانة وضمانات المعدات الموردة.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong>4. قائمة الملاحظات والنواقص غير الجوهرية (Snag List):</strong>{' '}
                  {checklist?.snag_list_type === 'no_snags' ? (
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">تم الاستلام بدون أية ملاحظات معلقة.</span>
                  ) : (
                    <span>
                      تم حصر قائمة الملاحظات الطفيفة الملحقة بهذا المحضر، ويتعهد المقاول باستيفائها وتلافيها بالكامل 
                      خلال مهلة أقصاها <strong>({checklist?.snag_clearance_days || 14}) يوماً</strong> من تاريخ هذا المحضر دون تعطيل استغلال المشروع.
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <BadgeCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p>
                  <strong>5. سريان فترة ضمان العيوب والصيانة (DLP Warranty):</strong> تبدأ فترة ضمان العيوب المحددة بسنة كاملة 
                  من تاريخ <strong>{formattedDlpStart}</strong> وتنتهي في <strong>{formattedDlpEnd}</strong>، 
                  ويفرج بموجب هذا المحضر عن <strong>الدفعة الأولى (50%)</strong> من محجوز ضمان حسن التنفيذ طبقاً للبند 14.9 من شروط عقد الفيديك.
                </p>
              </div>
            </div>

            {checklist?.handover_notes && (
              <div className="p-3 print:p-2 bg-slate-100 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs avoid-break">
                <span className="font-bold text-slate-700 dark:text-slate-200 block mb-1">ملاحظات وشروط خاصة:</span>
                <p className="text-slate-600 dark:text-slate-300 italic">{checklist.handover_notes}</p>
              </div>
            )}
          </div>

          {/* Tri-Party Signatures Block */}
          <div className="pt-6 print:pt-4 border-t-2 border-slate-200 dark:border-slate-700 avoid-break">
            <h4 className="text-xs font-black text-slate-900 dark:text-white text-center mb-6 print:mb-3">
              اعتماد وتوقيع أعضاء لجنة الاستلام المشتركة
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-6 print:gap-3 text-center text-xs avoid-break">
              {/* Party 1: Contractor P.ZONE */}
              <div className="p-4 print:p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 print:bg-slate-50 space-y-4 print:space-y-2 avoid-break">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">عن المقاول العام (شركة بي زون)</span>
                <div className="h-16 print:h-12 flex flex-col justify-end items-center">
                  <span className="font-serif italic font-bold text-emerald-800 dark:text-emerald-400 text-sm">P.ZONE Management</span>
                  <div className="w-32 border-b border-dashed border-slate-400 dark:border-slate-600 mt-1" />
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                  <p>الاسم: م. المشرف العام على المشروعات</p>
                  <p>التاريخ: {certificateDate}</p>
                </div>
              </div>

              {/* Party 2: Supervising Consultant */}
              <div className="p-4 print:p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 print:bg-slate-50 space-y-4 print:space-y-2 avoid-break">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">عن الاستشاري المشرف على التنفيذ</span>
                <div className="h-16 print:h-12 flex flex-col justify-end items-center">
                  <div className="w-32 border-b border-dashed border-slate-400 dark:border-slate-600 mt-1" />
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                  <p>الاسم: .......................................</p>
                  <p>التاريخ: ..... / ..... / 202...</p>
                </div>
              </div>

              {/* Party 3: Client / Employer */}
              <div className="p-4 print:p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 print:bg-slate-50 space-y-4 print:space-y-2 avoid-break">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">عن المالك / صاحب العمل</span>
                <div className="h-16 print:h-12 flex flex-col justify-end items-center">
                  <div className="w-32 border-b border-dashed border-slate-400 dark:border-slate-600 mt-1" />
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                  <p>الاسم: .......................................</p>
                  <p>التاريخ: ..... / ..... / 202...</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Official Seal Note */}
          <div className="text-center pt-4 print:pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] print:text-[9px] text-slate-400 dark:text-slate-500 font-mono avoid-break">
            P.ZONE ERP POST-CONTRACT CONTROLS · OFFICIAL FIDIC/PMI CLOSEOUT DOCUMENT · GENERATED SYSTEM DOCUMENT
          </div>
        </div>
      </div>
    </div>
  );
};
