'use client';

import React, { useEffect, useId } from 'react';
import { HseIncident } from '@/types/hse';
import {
  X,
  Calendar,
  MapPin,
  Users,
  FileText,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import HseSeverityBadge from './HseSeverityBadge';

interface IncidentDetailsModalProps {
  incident: HseIncident | null;
  onClose: () => void;
  locale?: string;
}

export const IncidentDetailsModal: React.FC<IncidentDetailsModalProps> = ({
  incident,
  onClose,
  locale = 'ar',
}) => {
  const isAr = locale === 'ar';
  const titleId = useId();

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && incident) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [incident, onClose]);

  if (!incident) return null;

  const statusConfig = {
    reported: {
      ar: 'تم الإبلاغ',
      en: 'Reported',
      bg: 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-800',
    },
    investigating: {
      ar: 'قيد التحقيق الفني',
      en: 'Investigating',
      bg: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800',
    },
    closed: {
      ar: 'مغلق ومكتمل الإجراءات',
      en: 'Closed',
      bg: 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800',
    },
  }[incident.status] || {
    ar: incident.status,
    en: incident.status,
    bg: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      dir="rtl"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 my-8 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center font-black text-sm shrink-0">
              <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                  {incident.incident_number}
                </span>
                <HseSeverityBadge severity={incident.severity} locale={locale} size="sm" />
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusConfig.bg}`}
                >
                  {isAr ? statusConfig.ar : statusConfig.en}
                </span>
              </div>
              <h2 id={titleId} className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {isAr ? incident.title_ar : incident.title_en || incident.title_ar}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Details */}
        <div className="space-y-4 mt-5">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{isAr ? 'تاريخ الحادث' : 'Date'}</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {new Date(incident.incident_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{isAr ? 'موقع الواقعة' : 'Location'}</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {incident.location_description || (isAr ? 'الموقع العام للمشروع' : 'General Site')}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <Users className="w-3.5 h-3.5" />
                <span>{isAr ? 'عدد الإصابات' : 'Injuries'}</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {incident.injury_count > 0 ? (
                  <span className="text-rose-600 dark:text-rose-400">
                    {incident.injury_count} {isAr ? 'إصابة مسجلة' : 'Injuries'}
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {isAr ? 'صفر إصابات (خالي)' : 'Zero injuries'}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Root Cause Analysis */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>{isAr ? 'تحليل السبب الجذري (Root Cause Analysis)' : 'Root Cause Analysis'}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {incident.root_cause || (isAr ? 'لم يتم تدوين أسباب جذرية بعد' : 'No root cause documented yet')}
            </p>
          </div>

          {/* Corrective & Preventive Actions (CAPA) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{isAr ? 'الإجراءات التصحيحية والوقائية (CAPA)' : 'Corrective Actions (CAPA)'}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {incident.corrective_actions ||
                (isAr ? 'لم تسجل إجراءات تصحيحية بعد' : 'No corrective actions logged yet')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetailsModal;
