'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export const FONT_STORAGE_KEY = 'pzone_font';

export interface FontOption {
  id: string;
  name: string;
  nameEn: string;
  family: string;
  category: 'system' | 'editorial' | 'modern' | 'artistic';
  categoryLabelAr: string;
  categoryLabelEn: string;
  descriptionAr: string;
  descriptionEn: string;
  badgeAr?: string;
  badgeEn?: string;
  weights: string[];
  className: string;
}

export const AVAILABLE_FONTS: FontOption[] = [
  {
    id: 'default',
    name: 'خط المنظومة المعتمد (كايرو / تجوال)',
    nameEn: 'Default System Stack (Cairo / Tajawal)',
    family: "var(--font-arabic, 'Cairo'), 'Tajawal', sans-serif",
    category: 'system',
    categoryLabelAr: 'الأساسي',
    categoryLabelEn: 'Core',
    descriptionAr: 'الخط القياسي الرسمي المعتمد لكافة شاشات ومؤشرات المنظومة',
    descriptionEn: 'Standard approved typography for all portal dashboards & metrics',
    badgeAr: 'افتراضي',
    badgeEn: 'Default',
    weights: ['300', '400', '500', '600', '700', '900'],
    className: '',
  },
  {
    id: 'hayyakum-allah',
    name: 'خط الغريب - حيّاكم الله طويل',
    nameEn: 'Elgharib Hayyakum Allah Taweel',
    family: "'Hayyakum Allah', 'Cairo', sans-serif",
    category: 'editorial',
    categoryLabelAr: 'رسمي وفخم',
    categoryLabelEn: 'Editorial & Luxury',
    descriptionAr: 'خط عربي أصيل ذو امتدادات رأسية فخمة ومقروئية استثنائية',
    descriptionEn: 'Authentic Arabic calligraphy with luxury ascenders & outstanding clarity',
    badgeAr: 'فخم',
    badgeEn: 'Luxury',
    weights: ['Light (300)', 'Regular (400)', 'Medium (500)', 'Bold (700)'],
    className: 'font-hayyakum',
  },
  {
    id: 'tajarib-taweel',
    name: 'خط الغريب - تجاريب طويل',
    nameEn: 'Elgharib Tajarib Taweel',
    family: "'Tajarib Taweel', 'Cairo', sans-serif",
    category: 'editorial',
    categoryLabelAr: 'رسمي وفخم',
    categoryLabelEn: 'Editorial & Luxury',
    descriptionAr: 'خط عربي هادئ ومتزن بـ 5 أوزان كاملة حتى البلاك 900',
    descriptionEn: 'Serene balanced Arabic typeface with 5 weights up to Black 900',
    badgeAr: '5 أوزان',
    badgeEn: '5 Weights',
    weights: ['Light', 'Regular', 'Medium', 'Bold', 'Black (900)'],
    className: 'font-tajarib',
  },
  {
    id: 'grtsk',
    name: 'خط جرتسك الحديث (TRY Grtsk)',
    nameEn: 'TRY Grtsk Modern Variable',
    family: "'Grtsk', 'Cairo', sans-serif",
    category: 'modern',
    categoryLabelAr: 'حديث وهندسي',
    categoryLabelEn: 'Modern Geometric',
    descriptionAr: 'خط هندسي عصري فائق الحدة والوضوح لواجهات البيانات المتقدمة',
    descriptionEn: 'Ultra-sharp geometric typography optimized for rich data interfaces',
    badgeAr: 'عصري',
    badgeEn: 'Modern',
    weights: ['Light', 'Regular', 'Medium', 'SemiBold', 'Bold'],
    className: 'font-grtsk',
  },
  {
    id: 'cordale',
    name: 'خط كورديل المعاصر (Cordale)',
    nameEn: 'Cordale Contemporary',
    family: "'Cordale', 'Cairo', sans-serif",
    category: 'modern',
    categoryLabelAr: 'حديث وهندسي',
    categoryLabelEn: 'Modern Geometric',
    descriptionAr: 'خط أنيق متوازن للتقارير الهندسية وجداول المشاريع التنفيذية',
    descriptionEn: 'Elegant balanced typeface for engineering reports & project tables',
    badgeAr: 'هندسي',
    badgeEn: 'Technical',
    weights: ['Regular', 'Bold', 'Italic', 'Bold Italic'],
    className: 'font-cordale',
  },
  {
    id: 'as-wc26',
    name: 'خط إيه إس وورلد كاب (AS-WC26 Bold)',
    nameEn: 'AS-WC26 World Cup Heavy Bold',
    family: "'AS-WC26', 'Cairo', sans-serif",
    category: 'modern',
    categoryLabelAr: 'عريض وبارز',
    categoryLabelEn: 'Heavy Display',
    descriptionAr: 'خط عريض رياضي قوي للعناوين الرئيسية والمؤشرات الرقمية الكبرى',
    descriptionEn: 'High-impact heavy display typeface for headlines & major KPIs',
    badgeAr: 'عريض',
    badgeEn: 'Heavy Display',
    weights: ['Bold (700)'],
    className: 'font-aswc26',
  },
  {
    id: 'zyaea-abyss',
    name: 'ضياء - أبيس (ZYAEA Abyss)',
    nameEn: 'ZYAEA Abyss',
    family: "'ZYAEA Abyss', 'Cairo', sans-serif",
    category: 'artistic',
    categoryLabelAr: 'مجموعة ضياء الفنية',
    categoryLabelEn: 'ZYAEA Art Collection',
    descriptionAr: 'انحناءات معمارية عميقة وفاخرة للمشاريع المميزة',
    descriptionEn: 'Deep architectural curves for standout project titles',
    badgeAr: 'مجموعة ضياء',
    badgeEn: 'ZYAEA Series',
    weights: ['Display (400)'],
    className: 'font-zyaea-abyss',
  },
  {
    id: 'zyaea-celestial',
    name: 'ضياء - سيليستيال (ZYAEA Celestial)',
    nameEn: 'ZYAEA Celestial',
    family: "'ZYAEA Celestial', 'Cairo', sans-serif",
    category: 'artistic',
    categoryLabelAr: 'مجموعة ضياء الفنية',
    categoryLabelEn: 'ZYAEA Art Collection',
    descriptionAr: 'حروف سماوية انسيابية مريحة للعين',
    descriptionEn: 'Celestial graceful letterforms with smooth flow',
    badgeAr: 'مجموعة ضياء',
    badgeEn: 'ZYAEA Series',
    weights: ['Display (400)'],
    className: 'font-zyaea-celestial',
  },
  {
    id: 'zyaea-ethereal',
    name: 'ضياء - إيثيريال (ZYAEA Ethereal)',
    nameEn: 'ZYAEA Ethereal',
    family: "'ZYAEA Ethereal', 'Cairo', sans-serif",
    category: 'artistic',
    categoryLabelAr: 'مجموعة ضياء الفنية',
    categoryLabelEn: 'ZYAEA Art Collection',
    descriptionAr: 'حروف أثيرية ناعمة بتوازن بصري راقٍ',
    descriptionEn: 'Soft ethereal letterforms with refined optical balance',
    badgeAr: 'مجموعة ضياء',
    badgeEn: 'ZYAEA Series',
    weights: ['Display (400)'],
    className: 'font-zyaea-ethereal',
  },
  {
    id: 'zyaea-meteor',
    name: 'ضياء - ميتيور (ZYAEA Meteor)',
    nameEn: 'ZYAEA Meteor',
    family: "'ZYAEA Meteor', 'Cairo', sans-serif",
    category: 'artistic',
    categoryLabelAr: 'مجموعة ضياء الفنية',
    categoryLabelEn: 'ZYAEA Art Collection',
    descriptionAr: 'زوايا ديناميكية مستوحاة من حركة الشهب',
    descriptionEn: 'Dynamic sharp aesthetic inspired by celestial meteors',
    badgeAr: 'مجموعة ضياء',
    badgeEn: 'ZYAEA Series',
    weights: ['Display (400)'],
    className: 'font-zyaea-meteor',
  },
  {
    id: 'zyaea-petrichor',
    name: 'ضياء - بيتريكور (ZYAEA Petrichor)',
    nameEn: 'ZYAEA Petrichor',
    family: "'ZYAEA Petrichor', 'Cairo', sans-serif",
    category: 'artistic',
    categoryLabelAr: 'مجموعة ضياء الفنية',
    categoryLabelEn: 'ZYAEA Art Collection',
    descriptionAr: 'طابع عضوي هادئ وأصيل مستوحى من الطبيعة والماء',
    descriptionEn: 'Organic calm nature-inspired typography',
    badgeAr: 'مجموعة ضياء',
    badgeEn: 'ZYAEA Series',
    weights: ['Display (400)'],
    className: 'font-zyaea-petrichor',
  },
  {
    id: 'zyaea-sage',
    name: 'ضياء - سيج (ZYAEA Sage)',
    nameEn: 'ZYAEA Sage',
    family: "'ZYAEA Sage', 'Cairo', sans-serif",
    category: 'artistic',
    categoryLabelAr: 'مجموعة ضياء الفنية',
    categoryLabelEn: 'ZYAEA Art Collection',
    descriptionAr: 'تصميم ناضج وحكيم يمنح الواجهة هدوءاً وثقة',
    descriptionEn: 'Mature measured aesthetic conveying stability & poise',
    badgeAr: 'مجموعة ضياء',
    badgeEn: 'ZYAEA Series',
    weights: ['Display (400)'],
    className: 'font-zyaea-sage',
  },
  {
    id: 'zyaea-xanadu',
    name: 'ضياء - زانادو (ZYAEA Xanadu)',
    nameEn: 'ZYAEA Xanadu',
    family: "'ZYAEA Xanadu', 'Cairo', sans-serif",
    category: 'artistic',
    categoryLabelAr: 'مجموعة ضياء الفنية',
    categoryLabelEn: 'ZYAEA Art Collection',
    descriptionAr: 'طابع معماري استثنائي للمشاريع الكبرى والتصميمات الإبداعية',
    descriptionEn: 'Exquisite architectural display typography for marquee projects',
    badgeAr: 'مجموعة ضياء',
    badgeEn: 'ZYAEA Series',
    weights: ['Display (400)'],
    className: 'font-zyaea-xanadu',
  },
  {
    id: 'zyaea-ambidextrous',
    name: 'ضياء - أمبيديكستروس (ZYAEA Ambidextrous)',
    nameEn: 'ZYAEA Ambidextrous',
    family: "'ZYAEA Ambidextrous', 'Cairo', sans-serif",
    category: 'artistic',
    categoryLabelAr: 'مجموعة ضياء الفنية',
    categoryLabelEn: 'ZYAEA Art Collection',
    descriptionAr: 'تناظر بصري متقن ودقيق يعبر عن الحرفية والمهارة',
    descriptionEn: 'Optical dual-symmetry letterforms expressing craft mastery',
    badgeAr: 'مجموعة ضياء',
    badgeEn: 'ZYAEA Series',
    weights: ['Display (400)'],
    className: 'font-zyaea-ambidextrous',
  },
  {
    id: 'zyaea-habseligkeit',
    name: 'ضياء - هابسيليجكايت (ZYAEA Habseligkeit)',
    nameEn: 'ZYAEA Habseligkeit',
    family: "'ZYAEA Habseligkeit', 'Cairo', sans-serif",
    category: 'artistic',
    categoryLabelAr: 'مجموعة ضياء الفنية',
    categoryLabelEn: 'ZYAEA Art Collection',
    descriptionAr: 'تفاصيل خاصة تعبر عن قيمة العمل الهندسي المنجز',
    descriptionEn: 'Cherished detailed character forms celebrating engineering milestones',
    badgeAr: 'مجموعة ضياء',
    badgeEn: 'ZYAEA Series',
    weights: ['Display (400)'],
    className: 'font-zyaea-habseligkeit',
  },
  {
    id: 'zyaea-nooneandyou',
    name: 'ضياء - نون أند يو (ZYAEA Nooneandyou)',
    nameEn: 'ZYAEA Nooneandyou',
    family: "'ZYAEA Nooneandyou', 'Cairo', sans-serif",
    category: 'artistic',
    categoryLabelAr: 'مجموعة ضياء الفنية',
    categoryLabelEn: 'ZYAEA Art Collection',
    descriptionAr: 'بصمة خطية متميزة وعصرية للمستخدمين المبدعين',
    descriptionEn: 'Signature contemporary typographic expression',
    badgeAr: 'مجموعة ضياء',
    badgeEn: 'ZYAEA Series',
    weights: ['Display (400)'],
    className: 'font-zyaea-nooneandyou',
  },
];

export interface FontContextValue {
  currentFontId: string;
  currentFont: FontOption;
  availableFonts: FontOption[];
  setFont: (fontId: string) => void;
  resetFont: () => void;
  isCustomModalOpen: boolean;
  openFontCustomizer: () => void;
  closeFontCustomizer: () => void;
}

export type FontContextType = FontContextValue;

const FontContext = createContext<FontContextValue | undefined>(undefined);

export function applyFontToDocument(fontId: string) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (!fontId || fontId === 'default') {
    root.removeAttribute('data-font');
  } else {
    root.setAttribute('data-font', fontId);
  }
}

export const FontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentFontId, setCurrentFontId] = useState<string>('default');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(FONT_STORAGE_KEY);
      if (stored && AVAILABLE_FONTS.some((f) => f.id === stored)) {
        setCurrentFontId(stored);
        applyFontToDocument(stored);
      } else {
        applyFontToDocument('default');
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, []);

  const setFont = useCallback((fontId: string) => {
    const valid = AVAILABLE_FONTS.some((f) => f.id === fontId);
    const targetId = valid ? fontId : 'default';

    setCurrentFontId(targetId);
    applyFontToDocument(targetId);

    try {
      if (targetId === 'default') {
        localStorage.removeItem(FONT_STORAGE_KEY);
      } else {
        localStorage.setItem(FONT_STORAGE_KEY, targetId);
      }
    } catch {
      // Ignore
    }

    // Dispatch custom event for cross-component sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('pzone:font-change', { detail: { fontId: targetId } })
      );
    }
  }, []);

  const resetFont = useCallback(() => {
    setFont('default');
  }, [setFont]);

  const currentFont = useMemo(() => {
    return AVAILABLE_FONTS.find((f) => f.id === currentFontId) || AVAILABLE_FONTS[0];
  }, [currentFontId]);

  const openFontCustomizer = useCallback(() => setIsCustomModalOpen(true), []);
  const closeFontCustomizer = useCallback(() => setIsCustomModalOpen(false), []);

  const value = useMemo(
    () => ({
      currentFontId,
      currentFont,
      availableFonts: AVAILABLE_FONTS,
      setFont,
      resetFont,
      isCustomModalOpen,
      openFontCustomizer,
      closeFontCustomizer,
    }),
    [
      currentFontId,
      currentFont,
      setFont,
      resetFont,
      isCustomModalOpen,
      openFontCustomizer,
      closeFontCustomizer,
    ]
  );

  return <FontContext.Provider value={value}>{children}</FontContext.Provider>;
};

const DEFAULT_FONT_CONTEXT: FontContextType = {
  currentFontId: 'default',
  currentFont: AVAILABLE_FONTS[0],
  availableFonts: AVAILABLE_FONTS,
  setFont: () => {},
  resetFont: () => {},
  isCustomModalOpen: false,
  openFontCustomizer: () => {},
  closeFontCustomizer: () => {},
};

export function useFont(): FontContextType {
  const ctx = useContext(FontContext);
  return ctx || DEFAULT_FONT_CONTEXT;
}

