'use client';

import React from 'react';
import Link from 'next/link';
import { LanguageProvider, useLanguage } from '@/components/providers/LanguageProvider';
import { CheckCircle2, FileSearch, Calculator, Rocket, Phone, Mail, MapPin, Home, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

function ThankYouContent() {
  const { t, dir, toggleLocale, locale } = useLanguage();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans" dir={dir}>
      {/* Background aquatic glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#0e7490_1px,transparent_1px)] [background-size:32px_32px] opacity-15 pointer-events-none" />

      {/* Language Toggle Header */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleLocale}
          className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
        >
          {locale === 'ar' ? 'English' : 'عربي'}
        </button>
      </div>

      <div className="relative z-10 max-w-3xl w-full my-8">
        <div className="backdrop-blur-xl bg-slate-900/75 border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-cyan-950/20">
          
          {/* Header Success Badge */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Pzone ERP Water Scope Protocol</span>
            </div>

            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/40 flex items-center justify-center shadow-xl shadow-emerald-900/20">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-slate-100 via-cyan-100 to-emerald-200 bg-clip-text text-transparent mb-3">
              {t('r1.thankYou.title')}
            </h1>
            <p className="text-base sm:text-lg font-medium text-cyan-300/90 mb-2">
              {t('r1.thankYou.subtitle')}
            </p>
            <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              {t('r1.thankYou.description')}
            </p>
          </div>

          {/* Next Steps Roadmap */}
          <div className="mb-10">
            <h2 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-4 text-center">
              — Roadmap & Next Steps —
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1 */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 relative group hover:border-cyan-500/50 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <FileSearch className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                    Step 01
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-1.5">
                  {t('r1.thankYou.step1Title')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('r1.thankYou.step1Desc')}
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 relative group hover:border-emerald-500/50 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Calculator className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    Step 02
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-1.5">
                  {t('r1.thankYou.step2Title')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('r1.thankYou.step2Desc')}
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 relative group hover:border-emerald-500/50 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Rocket className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    Step 03
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-1.5">
                  {t('r1.thankYou.step3Title')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('r1.thankYou.step3Desc')}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Details Bar */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-5 mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Pzone Direct Support & Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="block text-slate-400 text-[10px]">{t('r1.thankYou.phoneLabel')}</span>
                  <span className="font-semibold text-slate-200">+20 (100) 123-4567</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="block text-slate-400 text-[10px]">{t('r1.thankYou.emailLabel')}</span>
                  <span className="font-semibold text-slate-200">projects@pzone.eg</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="block text-slate-400 text-[10px]">{t('r1.thankYou.addressLabel')}</span>
                  <span className="font-semibold text-slate-200">New Cairo, Egypt</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/projects"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-700 via-cyan-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-cyan-900/30 border border-cyan-400/30"
            >
              <span>{t('r1.thankYou.returnProjectsCTA')}</span>
              <ArrowIcon className="w-4 h-4" />
            </Link>

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-sm border border-slate-700/80 transition-all duration-200"
            >
              <Home className="w-4 h-4 text-slate-400" />
              <span>{t('r1.thankYou.homeCTA')}</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <LanguageProvider>
      <ThankYouContent />
    </LanguageProvider>
  );
}
