'use client';

import React from 'react';
import { Compass, Layers, Zap, Building2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DeliverableItem } from '@/types/planning';

export type TODisciplineType = 'architectural' | 'structural' | 'civil' | 'mechanical' | 'electrical' | 'mep' | 'other';

interface DisciplineCarrier {
  discipline?: string;
  linked_activity?: { discipline?: string };
}

/**
 * Robust discipline detector for deliverable items based on explicit metadata,
 * sheet number prefixes, or semantic aquatic keywords.
 */
export function detectDeliverableDiscipline(item: DeliverableItem): TODisciplineType {
  const explicit = (item as DisciplineCarrier).discipline || (item.deliverable as DisciplineCarrier | undefined)?.discipline;
  if (explicit) {
    const d = String(explicit).toLowerCase();
    if (d.includes('elec') || d.includes('كهرب')) return 'electrical';
    if (d.includes('mech') || d.includes('ميكانيك') || d.includes('plumb') || d.includes('صح')) return 'mechanical';
    if (d.includes('civil') || d.includes('مدن') || d.includes('struct') || d.includes('إنشائ') || d.includes('انشائ')) return 'civil';
    if (d.includes('arch') || d.includes('معمار') || d.includes('finish') || d.includes('تشطيب')) return 'architectural';
    if (d.includes('mep')) return 'mep';
  }

  const actDisc = (item as DisciplineCarrier).linked_activity?.discipline;
  if (actDisc) {
    const d = String(actDisc).toLowerCase();
    if (d === 'elec' || d === 'electrical') return 'electrical';
    if (d === 'mech' || d === 'mechanical' || d === 'water') return 'mechanical';
    if (d === 'civil' || d === 'structural') return 'civil';
    if (d === 'finishing' || d === 'architectural') return 'architectural';
    if (d === 'mep') return 'mep';
  }

  const sheet = (item.sheet_number || '').trim().toUpperCase();
  if (sheet) {
    if (/^(E|EL|ELE|ELEC|LGT|PWR)[-_0-9]/i.test(sheet) || /[-_](E|EL|ELE|ELEC)[-_0-9]/i.test(sheet)) {
      return 'electrical';
    }
    if (/^(M|MECH|MEC|P|PL|PLU|PMP|HYD|FIL|HVAC|MEP)[-_0-9]/i.test(sheet) || /[-_](M|MECH|P|PL|HVAC|MEP)[-_0-9]/i.test(sheet)) {
      return 'mep';
    }
    if (/^(S|ST|STR|CIV|C)[-_0-9]/i.test(sheet) || /[-_](S|ST|STR|CIV|C)[-_0-9]/i.test(sheet)) {
      return 'structural';
    }
    if (/^(A|AR|ARC|ARCH|ID)[-_0-9]/i.test(sheet) || /[-_](A|AR|ARC|ARCH|ID)[-_0-9]/i.test(sheet)) {
      return 'architectural';
    }
  }

  const text = `${item.description || ''} ${item.deliverable?.title_ar || ''} ${item.deliverable?.title_en || ''} ${item.deliverable?.ref_code || ''}`.toLowerCase();
  
  if (/كهرب|تأريض|انارة|إنارة|كشاف|محول|لوحة توزيع|dmx|ip68|bonding|ebp|voltage|lighting|electrical|panel/i.test(text)) {
    return 'electrical';
  }
  if (/ميكانيك|طلمب|مضخ|فلتر|فلترة|تدوير|turnover|سكيمر|مواسير|محبس|فوه|نوزل|جلب|سليف|puddle|flange|skimmer|drain|hydraulic|pump|filter|manifold|صحي|سباك|صرف|تغذية|mep|plumbing/i.test(text)) {
    return 'mep';
  }
  if (/مدني|خرسان|تسليح|انشائ|إنشائ|لبشة|جدران|قواعد|أعمدة|كمرات|أسقف|ووتر ستوب|عزل|غمر|aci 350|flood test|waterstop|rebar|concrete|foundation|structural/i.test(text)) {
    return 'structural';
  }
  if (/معمار|تشطيب|سيراميك|موزاييك|حواف|deck|coping|tiles|finishing|architectural/i.test(text)) {
    return 'architectural';
  }

  return 'other';
}

export interface TODisciplineBadgeProps {
  discipline: TODisciplineType;
  showIcon?: boolean;
  className?: string;
}

export const TODisciplineBadge: React.FC<TODisciplineBadgeProps> = ({
  discipline,
  showIcon = true,
  className = '',
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  switch (discipline) {
    case 'electrical':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 ring-1 ring-inset ring-amber-600/20 dark:ring-amber-400/30 ${className}`}
        >
          {showIcon && <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 stroke-[2.25]" aria-hidden="true" />}
          <span>{isAr ? 'كهرباء' : 'Electrical'}</span>
        </span>
      );
    case 'mechanical':
    case 'mep':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/50 text-cyan-800 dark:text-cyan-200 ring-1 ring-inset ring-cyan-600/20 dark:ring-cyan-400/30 ${className}`}
        >
          {showIcon && <Compass className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0 stroke-[2.25]" aria-hidden="true" />}
          <span>{isAr ? 'ميكانيكا وهيدروليكا' : 'Mechanical'}</span>
        </span>
      );
    case 'civil':
    case 'structural':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 ring-1 ring-inset ring-blue-600/20 dark:ring-blue-400/30 ${className}`}
        >
          {showIcon && <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 stroke-[2.25]" aria-hidden="true" />}
          <span>{isAr ? 'مدني وإنشائي' : 'Civil / Structural'}</span>
        </span>
      );
    case 'architectural':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 ring-1 ring-inset ring-teal-600/20 dark:ring-teal-400/30 ${className}`}
        >
          {showIcon && <Building2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 stroke-[2.25]" aria-hidden="true" />}
          <span>{isAr ? 'معماري وتشطيبات' : 'Architectural'}</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 dark:bg-stone-800/80 text-stone-800 dark:text-stone-200 ring-1 ring-inset ring-stone-500/20 dark:ring-stone-400/20 ${className}`}
        >
          {showIcon && <Building2 className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400 shrink-0 stroke-[2.25]" aria-hidden="true" />}
          <span>{isAr ? 'عام' : 'General'}</span>
        </span>
      );
  }
};

export function isCivilOrStructuralDiscipline(disc: TODisciplineType): boolean {
  return disc === 'civil' || disc === 'structural';
}

export function isMepOrAquaticsDiscipline(disc: TODisciplineType): boolean {
  return disc === 'mechanical' || disc === 'electrical' || disc === 'mep';
}

export function isArchitecturalDiscipline(disc: TODisciplineType): boolean {
  return disc === 'architectural';
}
