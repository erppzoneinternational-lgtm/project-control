'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ href, label, className = '' }) => {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const isRtl = locale === 'ar';

  const defaultLabel = isRtl ? 'الرجوع' : 'Back';
  const displayLabel = label || defaultLabel;

  const buttonClasses = `inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 group ${className}`;

  const icon = isRtl ? (
    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 text-emerald-500 shrink-0" />
  ) : (
    <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5 text-emerald-500 shrink-0" />
  );

  if (href) {
    return (
      <Link href={href} className={buttonClasses}>
        {icon}
        <span>{displayLabel}</span>
      </Link>
    );
  }

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/project-setup');
    }
  };

  return (
    <button type="button" onClick={handleBack} className={buttonClasses}>
      {icon}
      <span>{displayLabel}</span>
    </button>
  );
};

export default BackButton;
