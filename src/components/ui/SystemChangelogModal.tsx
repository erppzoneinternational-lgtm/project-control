'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  X, 
  ArrowUpRight, 
  CheckCircle2, 
  Calendar,
  Layers,
  ListFilter
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSystemChangelogStore } from '@/lib/stores/useSystemChangelogStore';
import { SYSTEM_RELEASES, SystemReleaseEntry, LATEST_PORTAL_VERSION } from '@/lib/changelog/systemUpdates';

export function SystemChangelogModal({
  forceOpen,
  initialVersion,
}: {
  forceOpen?: boolean;
  initialVersion?: string;
} = {}) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const storeIsOpen = useSystemChangelogStore((s) => s.isOpen);
  const isOpen = forceOpen !== undefined ? forceOpen : storeIsOpen;
  const storeVersion = useSystemChangelogStore((s) => s.selectedVersion);
  const selectedVersion = initialVersion || storeVersion;
  const dontShowAgain = useSystemChangelogStore((s) => s.dontShowAgain);
  const closeChangelog = useSystemChangelogStore((s) => s.closeChangelog);
  const toggleDontShowAgain = useSystemChangelogStore((s) => s.toggleDontShowAgain);
  const setSelectedVersion = useSystemChangelogStore((s) => s.setSelectedVersion);
  const checkAutoPrompt = useSystemChangelogStore((s) => s.checkAutoPrompt);

  const modalRef = useRef<HTMLDivElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  // Check on mount with a smooth 600ms delay so page hydration settles first
  useEffect(() => {
    const timer = setTimeout(() => {
      checkAutoPrompt();
    }, 600);
    return () => clearTimeout(timer);
  }, [checkAutoPrompt]);

  // Handle ESC key and focus trapping
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeChangelog(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    setTimeout(() => {
      primaryButtonRef.current?.focus();
    }, 50);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeChangelog]);

  if (!isOpen) return null;

  const isAllReleases = selectedVersion === 'all';
  const currentRelease: SystemReleaseEntry =
    SYSTEM_RELEASES.find((r) => r.version === selectedVersion) || SYSTEM_RELEASES[0];

  const handleLinkClick = () => {
    closeChangelog(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="changelog-modal-title"
      aria-describedby="changelog-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-stone-900 dark:text-stone-100"
      >
        {/* Decorative Top Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-stone-800/80">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    {isAllReleases ? (isAr ? 'سجل كافة التحديثات' : 'All Releases') : `v${currentRelease.version}`}
                  </span>
                  {!isAllReleases && (
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{isAr ? currentRelease.releaseDateFormattedAr : currentRelease.releaseDateFormattedEn}</span>
                    </span>
                  )}
                  {!isAllReleases && currentRelease.badgeAr && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      {isAr ? currentRelease.badgeAr : currentRelease.badgeEn}
                    </span>
                  )}
                  {isAllReleases && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                      {isAr ? `${SYSTEM_RELEASES.length} إصدارات معتمدة` : `${SYSTEM_RELEASES.length} Releases`}
                    </span>
                  )}
                </div>
                <h3 id="changelog-modal-title" className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                  {isAllReleases
                    ? (isAr ? 'سجل التحديثات الشامل لمنظومة بي زون (P.Zone Portal)' : 'P.Zone Portal Comprehensive Updates Log')
                    : (isAr ? currentRelease.titleAr : currentRelease.titleEn)}
                </h3>
                <p id="changelog-modal-desc" className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isAllReleases
                    ? (isAr ? 'استعراض كافة التحديثات والميزات التشغيلية والتعاقدية المعتمدة عبر إصدارات المنظومة.' : 'Browse all operational and contractual features across all system releases.')
                    : (isAr ? currentRelease.summaryAr : currentRelease.summaryEn)}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => closeChangelog(true)}
              className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label={isAr ? 'إغلاق نافذة التحديثات' : 'Close updates dialog'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Version Switcher Tabs */}
          {SYSTEM_RELEASES.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-4" role="tablist" aria-label={isAr ? 'إصدارات النظام' : 'Release versions'}>
              {/* All Releases Tab */}
              <button
                type="button"
                role="tab"
                aria-selected={isAllReleases}
                onClick={() => setSelectedVersion('all')}
                className={`min-h-[32px] px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isAllReleases
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isAr ? 'كل التحديثات' : 'All Updates'}</span>
              </button>

              {/* Version Specific Tabs */}
              {SYSTEM_RELEASES.map((rel) => {
                const isActive = !isAllReleases && rel.version === currentRelease.version;
                const isLatest = rel.version === SYSTEM_RELEASES[0].version;
                return (
                  <button
                    key={rel.version}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedVersion(rel.version)}
                    className={`min-h-[32px] px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      isActive
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-stone-900 shadow-sm'
                        : 'bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    <span>{`v${rel.version}`}</span>
                    {isLatest && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 dark:bg-emerald-600' : 'bg-emerald-500'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Scrollable Body: Updates Highlights List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {(isAllReleases ? SYSTEM_RELEASES : [currentRelease]).map((release) => (
            <div key={release.version} className="space-y-3.5">
              {isAllReleases && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-stone-800 sticky top-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xs z-10 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-slate-900 text-white dark:bg-stone-100 dark:text-stone-900">
                      {`v${release.version}`}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-stone-200">
                      {isAr ? release.titleAr : release.titleEn}
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{isAr ? release.releaseDateFormattedAr : release.releaseDateFormattedEn}</span>
                  </span>
                </div>
              )}

              <div className="space-y-3.5 divide-y divide-slate-100 dark:divide-stone-800/80">
                {release.highlights.map((item, idx) => (
                  <div key={item.id} className={`flex items-start gap-3.5 ${idx > 0 ? 'pt-3.5' : ''}`}>
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-stone-800 border border-slate-200/80 dark:border-stone-700/80 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                      {item.icon}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            {isAr ? item.categoryAr : item.categoryEn}
                          </span>
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {isAr ? item.titleAr : item.titleEn}
                          </h5>
                        </div>

                        {item.href && (
                          <Link
                            href={item.href}
                            onClick={handleLinkClick}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline shrink-0"
                          >
                            <span>{isAr ? item.hrefLabelAr || 'معاينة' : item.hrefLabelEn || 'View'}</span>
                            <ArrowUpRight className="w-3 h-3 rtl:rotate-[-90deg]" />
                          </Link>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {isAr ? item.descriptionAr : item.descriptionEn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-stone-900/90 border-t border-slate-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Don't show again checkbox */}
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={toggleDontShowAgain}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-stone-700 dark:bg-stone-800 cursor-pointer"
            />
            <span>{isAr ? 'عدم إظهار هذه الرسالة تلقائياً لهذا الإصدار' : 'Do not show automatically for this version'}</span>
          </label>

          {/* Primary Action Button */}
          <button
            ref={primaryButtonRef}
            type="button"
            onClick={() => closeChangelog(true)}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isAr ? 'فهمت، حسناً' : 'Got it, thanks!'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
