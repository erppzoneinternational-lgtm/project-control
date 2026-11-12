'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Project } from '@/types';
import {
  X,
  Phone,
  Mail,
  Building2,
  Briefcase,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  FolderKanban,
  MessageCircle,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '../ui/StatusBadge';

export interface ManagerProfile {
  name: string;
  type: 'pzone' | 'client';
  company?: string;
  role?: string;
  phone?: string;
  email?: string;
  clientId?: string;
}

export interface ProjectManagerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: ManagerProfile | null;
  projects: Project[];
  lang?: 'ar' | 'en';
}

export const ProjectManagerDetailModal: React.FC<ProjectManagerDetailModalProps> = ({
  isOpen,
  onClose,
  manager,
  projects,
  lang = 'ar',
}) => {
  const isAr = lang === 'ar';
  const [copiedField, setCopiedField] = useState<'phone' | 'email' | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleCopy = (text: string, field: 'phone' | 'email') => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  // Filter projects associated with this manager
  const associatedProjects = useMemo(() => {
    if (!manager || !manager.name) return [];
    const targetName = manager.name.trim().toLowerCase();

    return projects.filter((p) => {
      if (manager.type === 'pzone') {
        const pmFull = (p.pm_full_name || '').trim().toLowerCase();
        const pmRaw = (p.project_manager_name_raw || '').trim().toLowerCase();
        const pm = (p.project_manager || '').trim().toLowerCase();
        return pmFull === targetName || pmRaw === targetName || pm === targetName;
      } else {
        // Client / Owner PM: match client representative or client contact person or client id/company
        const clientRep = (p.client_representative || '').trim().toLowerCase();
        const clientContact = (p.client?.contact_person || '').trim().toLowerCase();
        if (clientRep === targetName || clientContact === targetName) {
          return true;
        }

        // Also if matching client id or client name
        if (manager.clientId && p.client_id === manager.clientId) {
          return true;
        }
        if (
          manager.company &&
          p.client?.name_ar &&
          p.client.name_ar.trim().toLowerCase() === manager.company.trim().toLowerCase()
        ) {
          return true;
        }

        return false;
      }
    });
  }, [manager, projects]);

  // Project KPIs
  const activeProjectsCount = useMemo(() => {
    return associatedProjects.filter((p) => {
      const s = (p.status || '').toLowerCase();
      return s === 'in_progress' || s === 'active' || s === 'under_construction' || s === 'ongoing';
    }).length;
  }, [associatedProjects]);

  const completedProjectsCount = useMemo(() => {
    return associatedProjects.filter((p) => {
      const s = (p.status || '').toLowerCase();
      return s === 'completed' || s === 'delivered' || s === 'closed' || s === 'handed_over';
    }).length;
  }, [associatedProjects]);

  if (!isOpen || !manager) return null;

  const isPZone = manager.type === 'pzone';
  const companyName =
    manager.company ||
    (isPZone
      ? isAr
        ? 'شركة بي زون للحلول الإنشائية المتكاملة'
        : 'P.ZONE Integrated Construction Solutions'
      : isAr
      ? 'جهة المالك أو العميل'
      : 'Client / Owner Entity');

  const roleTitle =
    manager.role ||
    (isPZone
      ? isAr
        ? 'مدير مشروع داخلي - شركة بي زون'
        : 'P.ZONE Project Manager'
      : isAr
      ? 'مدير مشروع المالك أو العميل'
      : 'Client / Owner Project Manager');

  // Format clean whatsapp link if Egyptian phone number available
  const cleanPhone = (manager.phone || '').replace(/[^0-9+]/g, '');
  const whatsappNumber = cleanPhone.startsWith('01')
    ? `2${cleanPhone}`
    : cleanPhone.startsWith('+2')
    ? cleanPhone.replace('+', '')
    : cleanPhone;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manager-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[min(90vh,820px)] animate-in zoom-in-95 duration-200"
      >
        {/* Header Ribbon / Banner */}
        <div
          className={`relative px-5 py-5 sm:px-6 sm:py-6 border-b shrink-0 ${
            isPZone
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white border-emerald-500/40'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-700 text-white border-blue-500/40'
          }`}
        >
          {/* Close button with >= 44px touch target */}
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق تفاصيل مدير المشروع' : 'Close manager profile'}
            className="absolute top-4 end-4 min-w-[44px] min-h-[44px] rounded-2xl bg-black/20 hover:bg-black/35 text-white flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-3.5 sm:gap-4.5 pe-12">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-lg shrink-0 border border-white/20 ${
                isPZone ? 'bg-emerald-900/40 text-emerald-100' : 'bg-blue-900/40 text-blue-100'
              }`}
            >
              {isPZone ? (
                <ShieldCheck className="w-8 h-8 text-emerald-200" />
              ) : (
                <Building2 className="w-8 h-8 text-blue-200" />
              )}
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-xs shadow-xs">
                {isPZone ? (
                  <>
                    <Briefcase className="w-3 h-3" />
                    <span>{isAr ? 'فريق بي زون الداخلي' : 'P.ZONE Internal Team'}</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-3 h-3" />
                    <span>{isAr ? 'فريق المالك أو العميل' : 'Client / Owner Team'}</span>
                  </>
                )}
              </div>

              <h2
                id="manager-modal-title"
                className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug truncate"
              >
                {manager.name}
              </h2>

              <p className="text-xs sm:text-sm font-semibold text-white/90 flex items-center gap-1.5">
                <span>{roleTitle}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Company / Affiliation Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {isAr ? 'الجهة أو الشركة التابع لها' : 'Affiliated Organization'}
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate block">
                {companyName}
              </span>
            </div>
          </div>

          {/* KPI Summary Tiles */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-bold">
                  {isAr ? 'إجمالي المشاريع' : 'Total Projects'}
                </span>
                <FolderKanban className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                  {associatedProjects.length}
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                  {isAr ? 'مشروع' : 'proj'}
                </span>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between gap-1 text-emerald-700 dark:text-emerald-400">
                <span className="text-[11px] font-bold">
                  {isAr ? 'قيد التنفيذ' : 'In Progress'}
                </span>
                <Activity className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-xl sm:text-2xl font-black text-emerald-800 dark:text-emerald-300 font-mono">
                  {activeProjectsCount}
                </span>
                <span className="text-[10px] font-bold text-emerald-600/80 dark:text-emerald-400/80">
                  {isAr ? 'نشط' : 'active'}
                </span>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between gap-1 text-blue-700 dark:text-blue-400">
                <span className="text-[11px] font-bold">
                  {isAr ? 'مكتملة ومسلمة' : 'Completed'}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-xl sm:text-2xl font-black text-blue-800 dark:text-blue-300 font-mono">
                  {completedProjectsCount}
                </span>
                <span className="text-[10px] font-bold text-blue-600/80 dark:text-blue-400/80">
                  {isAr ? 'منجز' : 'done'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isAr ? 'بيانات التواصل المباشر' : 'Direct Contact Info'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Phone Card */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex flex-col justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold block">
                      {isAr ? 'رقم الهاتف' : 'Phone Number'}
                    </span>
                    <span
                      dir="ltr"
                      className="text-xs sm:text-sm font-mono font-black text-slate-800 dark:text-slate-200 block truncate"
                    >
                      {manager.phone || (isAr ? 'غير مسجل' : 'Not recorded')}
                    </span>
                  </div>
                </div>

                {manager.phone && (
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <a
                      href={`tel:${manager.phone}`}
                      className="min-h-[40px] flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-98"
                      title={isAr ? 'اتصال هاتفي مباشر' : 'Direct Phone Call'}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{isAr ? 'اتصال' : 'Call'}</span>
                    </a>

                    {whatsappNumber && (
                      <a
                        href={`https://wa.me/${whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[40px] flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 dark:bg-green-950/80 hover:bg-green-100 dark:hover:bg-green-900 text-green-700 dark:text-green-300 text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 active:scale-98"
                        title={isAr ? 'محادثة عبر تطبيق واتساب' : 'WhatsApp Chat'}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopy(manager.phone!, 'phone')}
                      className="min-h-[40px] min-w-[40px] p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95"
                      title={isAr ? 'نسخ رقم الهاتف' : 'Copy Number'}
                      aria-label={isAr ? 'نسخ رقم الهاتف' : 'Copy phone number'}
                    >
                      {copiedField === 'phone' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Email Card */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex flex-col justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold block">
                      {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                    </span>
                    <span
                      dir="ltr"
                      className="text-xs sm:text-sm font-mono font-bold text-slate-800 dark:text-slate-200 block truncate"
                    >
                      {manager.email || (isAr ? 'غير مسجل' : 'Not recorded')}
                    </span>
                  </div>
                </div>

                {manager.email && (
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <a
                      href={`mailto:${manager.email}`}
                      className="min-h-[40px] flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-98"
                      title={isAr ? 'إرسال بريد إلكتروني' : 'Send Email'}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{isAr ? 'مراسلة' : 'Email'}</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopy(manager.email!, 'email')}
                      className="min-h-[40px] min-w-[40px] p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95"
                      title={isAr ? 'نسخ البريد الإلكتروني' : 'Copy Email'}
                      aria-label={isAr ? 'نسخ البريد الإلكتروني' : 'Copy email address'}
                    >
                      {copiedField === 'email' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Associated Projects Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                  {isAr ? 'المشاريع المرتبطة مع شركة بي زون' : 'Associated Projects'}
                </h3>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {isAr
                  ? `مشترك في ${associatedProjects.length} مشاريع`
                  : `${associatedProjects.length} Projects`}
              </span>
            </div>

            {associatedProjects.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center space-y-1">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {isAr
                    ? 'لم يتم العثور على مشاريع أخرى مرتبطة بهذا الاسم في العرض الحالي.'
                    : 'No other projects found for this manager in current view.'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {isAr
                    ? 'قد تكون المشاريع الأخرى تحت فلتر آخر أو غير مسندة رسمياً.'
                    : 'Other projects might be under another filter or unassigned.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pe-1 scrollbar-thin">
                {associatedProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs group"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-xs border border-emerald-200/80 dark:border-emerald-900">
                          #{proj.project_code}
                        </span>
                        <StatusBadge status={proj.status} lang={lang} size="sm" />
                        {proj.pzone_role && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            {proj.pzone_role}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                        {isAr ? proj.project_name : proj.project_name_en || proj.project_name}
                      </h4>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                        <span>
                          {isAr ? 'العميل: ' : 'Client: '}
                          <strong className="text-slate-700 dark:text-slate-300">
                            {proj.client?.name_ar || proj.client_name_raw || '—'}
                          </strong>
                        </span>

                        {Number(proj.vos_value || 0) > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">
                            {isAr ? 'أوامر تغييرية: +' : 'VO: +'}
                            {new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', {
                              style: 'currency',
                              currency: 'EGP',
                              maximumFractionDigits: 0,
                            }).format(proj.vos_value)}
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/projects/${proj.id}`}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-700 hover:text-white dark:text-slate-200 dark:hover:text-white text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-98"
                      title={isAr ? 'عرض تفاصيل المشروع' : 'View project details'}
                    >
                      <span>{isAr ? 'عرض المشروع' : 'View'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {isAr
              ? 'دليل بي زون لإدارة المشاريع والشركاء'
              : 'P.ZONE Project & Stakeholder Directory'}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 dark:active:bg-slate-800 text-white dark:text-slate-100 text-xs sm:text-sm font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 shadow-xs"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
