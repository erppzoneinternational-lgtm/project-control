'use client';

import React from 'react';
import { Type } from 'lucide-react';
import { useFont } from '@/contexts/FontContext';
import { useLanguage } from '@/contexts/LanguageContext';

export interface FontCustomizerButtonProps {
  className?: string;
  variant?: 'icon' | 'compact' | 'pill';
}

export const FontCustomizerButton: React.FC<FontCustomizerButtonProps> = ({
  className = '',
  variant = 'icon',
}) => {
  const { openFontCustomizer, currentFontId, currentFont } = useFont();
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const isCustom = currentFontId !== 'default';

  const title = isAr
    ? `تخصيص خط المنظومة (الحالي: ${currentFont.name})`
    : `Customize Typography (Current: ${currentFont.nameEn})`;

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={openFontCustomizer}
        className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
          isCustom
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-500/40'
            : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700'
        } ${className}`}
        title={title}
        aria-label={title}
      >
        <Type className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>{isAr ? currentFont.name : currentFont.nameEn}</span>
        {isCustom && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openFontCustomizer}
      title={title}
      aria-label={title}
      className={`relative min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${className}`}
    >
      <Type className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      {isCustom && (
        <span
          className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center"
          title={isAr ? 'خط مخصص نشط' : 'Custom font active'}
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
        </span>
      )}
    </button>
  );
};

export default FontCustomizerButton;
