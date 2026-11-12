import React from 'react';
import Link from 'next/link';

export interface ProjectNameInput {
  id?: string;
  code?: string | null;
  project_code?: string | null;
  name?: string | null;
  project_name?: string | null;
  project_name_ar?: string | null;
  name_ar?: string | null;
  project_name_en?: string | null;
  name_en?: string | null;
  public_name?: string | null;
}

const HAS_ARABIC_REGEX = /[\u0600-\u06FF]/;

function cleanDelimiters(str?: string | null): string {
  if (!str) return '';
  return str.replace(/^[\s\-–—/|]+|[\s\-–—/|]+$/g, '').trim();
}

/**
 * Dynamically resolves canonical Arabic and English project names.
 * Handles:
 * 1. Explicit public_name with delimiter (" - ", " / ", " | ")
 * 2. Explicit public_name without delimiter
 * 3. Delimiter-only public_name (falls back to project_name / project_code)
 * 4. Bilingual public_name where both sides are Arabic (keeps full nameAr and avoids placing Arabic in nameEn)
 * 5. Legacy projects with separate project_name / project_name_en
 * 6. Legacy projects with Arabic only (returns nameEn: null cleanly without trailing hyphens or empty tags)
 */
export function resolveProjectBilingualNames(p: ProjectNameInput): {
  nameAr: string;
  nameEn: string | null;
} {
  const rawPublic = p.public_name?.trim();
  const cleanedPublic = rawPublic ? cleanDelimiters(rawPublic) : '';

  if (cleanedPublic) {
    // Delimiter detection
    const delimiter = [' - ', ' / ', ' | '].find((d) => cleanedPublic.includes(d));

    if (delimiter) {
      const parts = cleanedPublic.split(delimiter);
      let partA = parts[0]?.trim() || '';
      let partB = parts.slice(1).join(delimiter).trim();

      // If both partA and partB contain Arabic (e.g. "مشروع مارينا - المرحلة الأولى"),
      // do NOT assign partB to nameEn. Keep nameAr = rawPublic and resolve nameEn from project_name_en (or null)
      if (HAS_ARABIC_REGEX.test(partA) && HAS_ARABIC_REGEX.test(partB)) {
        const nameEn = (p.project_name_en || p.name_en || '').trim() || null;
        return {
          nameAr: cleanDelimiters(rawPublic),
          nameEn: nameEn ? cleanDelimiters(nameEn) : null,
        };
      }

      // If partA is English and partB has Arabic, swap so Arabic is top
      if (HAS_ARABIC_REGEX.test(partB) && !HAS_ARABIC_REGEX.test(partA)) {
        const temp = partA;
        partA = partB;
        partB = temp;
      }

      const nameAr = partA || (p.project_name || p.project_name_ar || p.name_ar || cleanedPublic).trim();
      const nameEn = (partB || p.project_name_en || p.name_en || '').trim() || null;

      return {
        nameAr: cleanDelimiters(nameAr),
        nameEn: nameEn ? cleanDelimiters(nameEn) : null,
      };
    }

    // Public name without delimiter
    if (HAS_ARABIC_REGEX.test(cleanedPublic)) {
      const nameEn = (p.project_name_en || p.name_en || '').trim() || null;
      return {
        nameAr: cleanDelimiters(cleanedPublic),
        nameEn: nameEn ? cleanDelimiters(nameEn) : null,
      };
    } else {
      // Public name is in English/Latin
      const fallbackAr = (p.project_name || p.project_name_ar || p.name_ar || '').trim();
      return {
        nameAr: fallbackAr ? cleanDelimiters(fallbackAr) : cleanDelimiters(cleanedPublic),
        nameEn: cleanDelimiters(cleanedPublic),
      };
    }
  }

  // Dynamic fallback for existing projects without public_name (or punctuation-only public_name)
  const code = (p.project_code || p.code || '').trim();
  const rawAr = (p.project_name || p.project_name_ar || p.name_ar || p.name || '').trim();
  const nameAr = rawAr || (code ? `مشروع ${code}` : 'مشروع');

  const rawEn = (p.project_name_en || p.name_en || '').trim();
  const nameEn = rawEn ? cleanDelimiters(rawEn) : null;

  return {
    nameAr: cleanDelimiters(nameAr) || (code ? `مشروع ${code}` : 'مشروع'),
    nameEn: nameEn,
  };
}

export interface ProjectBilingualNameCellProps {
  project: ProjectNameInput;
  href?: string;
  className?: string;
  linkClassName?: string;
  title?: string;
}

/**
 * Global Stacked Bilingual Cell for Project Tables and Views.
 * Renders:
 * - Top row: Primary Arabic name in bold typography (dir="rtl").
 * - Bottom row: English name in muted secondary typography (dir="ltr") ONLY if present.
 */
export function ProjectBilingualNameCell({
  project,
  href,
  className = '',
  linkClassName = '',
  title,
}: ProjectBilingualNameCellProps) {
  const { nameAr, nameEn } = resolveProjectBilingualNames(project);

  const content = (
    <div className={`flex flex-col gap-0.5 min-w-0 text-start ${className}`}>
      <span
        dir="rtl"
        className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug truncate"
      >
        {nameAr}
      </span>
      {nameEn && (
        <span
          dir="ltr"
          className="text-xs font-mono text-slate-400 dark:text-slate-500 font-medium leading-tight truncate tracking-tight"
        >
          {nameEn}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-400 hover:underline transition-colors block text-start group/projname ${linkClassName}`}
        title={title || nameAr}
      >
        {content}
      </Link>
    );
  }

  return content;
}
