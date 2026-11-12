'use client';

import React from 'react';
import Link from 'next/link';
import { LanguageProvider, useLanguage } from '@/components/providers/LanguageProvider';
import { Shield, Lock, FileText, Scale, UserCheck, Database, Calendar, ArrowLeft, ArrowRight, Home, Droplets } from 'lucide-react';

function PrivacyPolicyContent() {
  const { t, dir, toggleLocale, locale } = useLanguage();
  const ArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const sections = [
    {
      id: 'overview',
      icon: Shield,
      title: t('r1.privacyPolicy.sec1Title'),
      content: t('r1.privacyPolicy.sec1Content'),
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20'
    },
    {
      id: 'information-collected',
      icon: Database,
      title: t('r1.privacyPolicy.sec2Title'),
      content: t('r1.privacyPolicy.sec2Content'),
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      id: 'data-security',
      icon: Lock,
      title: t('r1.privacyPolicy.sec3Title'),
      content: t('r1.privacyPolicy.sec3Content'),
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      id: 'confidentiality-ndas',
      icon: FileText,
      title: t('r1.privacyPolicy.sec4Title'),
      content: t('r1.privacyPolicy.sec4Content'),
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      id: 'egyptian-compliance',
      icon: Scale,
      title: t('r1.privacyPolicy.sec5Title'),
      content: t('r1.privacyPolicy.sec5Content'),
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20'
    },
    {
      id: 'user-rights',
      icon: UserCheck,
      title: t('r1.privacyPolicy.sec6Title'),
      content: t('r1.privacyPolicy.sec6Content'),
      color: 'text-teal-400',
      bg: 'bg-teal-500/10 border-teal-500/20'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 relative overflow-hidden font-sans" dir={dir}>
      {/* Background aquatic ambient glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-emerald-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#0e7490_1px,transparent_1px)] [background-size:32px_32px] opacity-15 pointer-events-none" />

      {/* Top Navbar */}
      <div className="max-w-5xl mx-auto flex items-center justify-between mb-8 z-20 relative">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
        >
          <ArrowIcon className="w-4 h-4" />
          <span>{t('r1.privacyPolicy.navBack')}</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLocale}
            className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
          >
            {locale === 'ar' ? 'English' : 'عربي'}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-5xl mx-auto mb-12">
        <div className="backdrop-blur-xl bg-slate-900/75 border border-slate-800/80 rounded-3xl p-6 sm:p-12 shadow-2xl shadow-cyan-950/20">
          
          {/* Hero Header */}
          <div className="border-b border-slate-800/80 pb-8 mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-4">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span>Pzone International Legal Framework</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-slate-100 via-cyan-100 to-emerald-200 bg-clip-text text-transparent mb-3">
              {t('r1.privacyPolicy.title')}
            </h1>
            <p className="text-base sm:text-lg text-slate-300 mb-4 max-w-3xl">
              {t('r1.privacyPolicy.subtitle')}
            </p>

            <div className="inline-flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('r1.privacyPolicy.lastUpdated')}</span>
            </div>
          </div>

          {/* Structured Policy Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {sections.map((sec) => {
              const IconComp = sec.icon;
              return (
                <div
                  key={sec.id}
                  className="bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${sec.bg}`}>
                        <IconComp className={`w-5 h-5 ${sec.color}`} />
                      </div>
                      <h2 className="text-base font-bold text-slate-100">
                        {sec.title}
                      </h2>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      {sec.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Compliance & Return CTAs */}
          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Compliant with Egyptian Law No. 151/2020 & Supabase Enterprise RLS</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href="/projects"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-cyan-600 hover:from-emerald-500 hover:to-teal-600 text-white font-medium text-xs transition-all shadow-md shadow-emerald-700/20 border border-cyan-400/30"
              >
                <span>{t('r1.privacyPolicy.navBack')}</span>
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs border border-slate-700/80 transition-all"
              >
                <Home className="w-3.5 h-3.5 text-slate-400" />
                <span>Home</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <LanguageProvider>
      <PrivacyPolicyContent />
    </LanguageProvider>
  );
}
