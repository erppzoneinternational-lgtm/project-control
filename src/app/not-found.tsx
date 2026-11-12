'use client';

import React from 'react';
import Link from 'next/link';
import { LanguageProvider, useLanguage } from '@/components/providers/LanguageProvider';
import { FileQuestion, Home, ArrowLeft, ArrowRight, LifeBuoy, Droplet, MessageCircle } from 'lucide-react';

function NotFoundContent() {
  const { t, dir } = useLanguage();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans" dir={dir}>
      {/* Aquatic Accent Water Glow Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-700/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Subtle aquatic ripples */}
      <div className="absolute inset-0 bg-[radial-gradient(#0e7490_1px,transparent_1px)] [background-size:32px_32px] opacity-15 pointer-events-none" />

      <div className="relative z-10 max-w-xl w-full text-center">
        <div className="backdrop-blur-xl bg-slate-900/70 border border-slate-800/80 rounded-2xl p-8 sm:p-12 shadow-2xl shadow-cyan-950/20">
          
          {/* Badge & Icon */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-6">
            <Droplet className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>{t('r1.notFound.badge')}</span>
          </div>

          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-950/50 to-cyan-900/50 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <FileQuestion className="w-10 h-10 text-cyan-400" />
            </div>
          </div>

          {/* Title & Subtitle */}
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 via-cyan-200 to-emerald-300 bg-clip-text text-transparent mb-2">
            404 — {t('r1.notFound.title')}
          </h1>
          <p className="text-lg font-semibold text-cyan-400/90 mb-4">
            {t('r1.notFound.subtitle')}
          </p>
          <p className="text-sm text-slate-400 leading-relaxed mb-8">
            {t('r1.notFound.description')}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/projects"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-700 to-cyan-600 hover:from-emerald-500 hover:to-teal-600 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-emerald-700/25 border border-cyan-400/30"
            >
              <span>{t('r1.notFound.mainProjectsCTA')}</span>
              <ArrowIcon className="w-4 h-4" />
            </Link>

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-sm border border-slate-700/80 transition-all duration-200"
            >
              <Home className="w-4 h-4 text-slate-400" />
              <span>{t('r1.notFound.homeCTA')}</span>
            </Link>
          </div>

          {/* Footer Contact Support Link */}
          <div className="mt-8 pt-6 border-t border-slate-800/60 flex items-center justify-center gap-2 text-xs text-slate-400 flex-wrap">
            <LifeBuoy className="w-4 h-4 text-cyan-500" />
            <span>{t('r1.notFound.contactSupport')}:</span>
            <a
              href="https://wa.me/201229994728"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-mono font-bold hover:underline inline-flex items-center gap-1.5 transition-colors bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
              dir="ltr"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>+201229994728</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <LanguageProvider>
      <NotFoundContent />
    </LanguageProvider>
  );
}
