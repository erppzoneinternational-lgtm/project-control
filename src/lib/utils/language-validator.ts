/**
 * Utility functions for Arabic and English text detection & validation
 */

// Arabic regex checks for Arabic unicode range (\u0600-\u06FF)
export const hasArabic = (text: string): boolean => /[\u0600-\u06FF]/.test(text);

// English regex checks for Latin alphabet (a-zA-Z)
export const hasEnglish = (text: string): boolean => /[a-zA-Z]/.test(text);

/**
 * Validates if an Arabic field contains English letters.
 * Returns error string if invalid, or null if valid.
 */
export const validateArabicField = (text: string, fieldNameAr = 'اسم المشروع بالعربي'): string | null => {
  if (!text || text.trim() === '') return null;
  if (hasEnglish(text)) {
    return `⚠️ ${fieldNameAr} يجب كتابته بالحروف العربية فقط (يوجد حروف إنجليزية)`;
  }
  return null;
};

/**
 * Validates if an English field contains Arabic letters.
 * Returns error string if invalid, or null if valid.
 */
export const validateEnglishField = (text: string, fieldNameEn = 'English Name'): string | null => {
  if (!text || text.trim() === '') return null;
  if (hasArabic(text)) {
    return `⚠️ ${fieldNameEn} must be written in English characters (يوجد حروف عربية في حقل الإنجليزي)`;
  }
  return null;
};
