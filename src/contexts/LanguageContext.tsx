'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import arJson from '../locales/ar.json';
import enJson from '../locales/en.json';

export type Locale = 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';

const LOCALE_KEY_HYPHEN = 'pzone-locale';
const LOCALE_KEY_UNDERSCORE = 'pzone_locale';

function readStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  try {
    const primary = localStorage.getItem(LOCALE_KEY_HYPHEN);
    if (primary === 'ar' || primary === 'en') return primary;
    const legacy = localStorage.getItem(LOCALE_KEY_UNDERSCORE);
    if (legacy === 'ar' || legacy === 'en') return legacy;
  } catch {
    // ignore storage errors
  }
  return null;
}

function persistStoredLocale(loc: Locale): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCALE_KEY_HYPHEN, loc);
    localStorage.setItem(LOCALE_KEY_UNDERSCORE, loc);
  } catch {
    // ignore storage errors
  }
}

function syncDocumentLocale(loc: Locale): void {
  if (typeof document === 'undefined') return;
  const contentDir: Direction = loc === 'ar' ? 'rtl' : 'ltr';
  // Document frame remains stably 'rtl' to prevent jarring left-right layout flips
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = loc;
  document.documentElement.setAttribute('data-locale', loc);
  document.documentElement.setAttribute('data-content-dir', contentDir);
}

export interface LanguageContextType {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: Direction;
  contentDir: Direction;
  layoutDir: Direction;
  isRtl: boolean;
  toggleLocale: () => void;
}

const dictionaries: Record<Locale, any> = {
  ar: arJson,
  en: enJson,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>('ar');
  const hydratedRef = useRef(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = readStoredLocale();
    const initial: Locale = saved ?? 'ar';
    setLocaleState(initial);
    syncDocumentLocale(initial);
    persistStoredLocale(initial);
    hydratedRef.current = true;
    setHydrated(true);
  }, []);

  // Content direction: 'rtl' for Arabic, 'ltr' for English
  const dir: Direction = locale === 'ar' ? 'rtl' : 'ltr';
  const contentDir: Direction = dir;
  // Stable macro layout direction: UI frame (app shell, topbar, sidebars, dock) stays stably 'rtl'
  const layoutDir: Direction = 'rtl';
  const isRtl = locale === 'ar';

  useEffect(() => {
    if (!hydrated || !hydratedRef.current) return;
    syncDocumentLocale(locale);
    persistStoredLocale(locale);
  }, [locale, hydrated]);

  const setLocale = (loc: Locale) => {
    hydratedRef.current = true;
    setLocaleState(loc);
    syncDocumentLocale(loc);
    persistStoredLocale(loc);
  };

  const toggleLocale = () => {
    const next = locale === 'ar' ? 'en' : 'ar';
    setLocale(next);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const parts = key.split('.');
    let val: any = dictionaries[locale];

    for (const part of parts) {
      if (val && typeof val === 'object' && part in val) {
        val = val[part];
      } else {
        val = undefined;
        break;
      }
    }

    if (val === undefined && locale !== 'en') {
      let fallbackVal: any = dictionaries['en'];
      for (const part of parts) {
        if (fallbackVal && typeof fallbackVal === 'object' && part in fallbackVal) {
          fallbackVal = fallbackVal[part];
        } else {
          fallbackVal = undefined;
          break;
        }
      }
      val = fallbackVal;
    }

    if (val === undefined || typeof val !== 'string') {
      return key;
    }

    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        val = (val as string).replace(new RegExp(`{${paramKey}}`, 'g'), String(paramVal));
      });
    }

    return val;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, dir, contentDir, layoutDir, isRtl, toggleLocale }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      locale: 'ar',
      setLocale: () => {},
      t: (key: string) => key,
      dir: 'rtl',
      contentDir: 'rtl',
      layoutDir: 'rtl',
      isRtl: true,
      toggleLocale: () => {},
    };
  }
  return context;
};

