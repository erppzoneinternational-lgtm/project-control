/**
 * Arabic-Indic Numeral Parsing & Normalization Utilities
 * ───────────────────────────────────────────────────────
 * Supports:
 *  - Eastern Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩ -> 0-9)
 *  - Persian / Urdu digits (۰۱۲۳۴۵۶۷۸۹ -> 0-9)
 *  - Arabic decimal separator (٫ U+066B -> .)
 *  - Arabic thousands separator (٬ U+066C -> removed)
 *  - Comma / period ambiguity resolution
 *  - Noise removal (currency symbols "ج.م", "EGP", "LE", units "م", "م²", "م³", "%", whitespace)
 *  - Zod preprocessing integration
 */

/**
 * Checks if a string contains any Eastern Arabic or Persian digits or Arabic separators.
 */
export function hasArabicIndicNumerals(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return /[\u0660-\u0669\u06F0-\u06F9\u066B\u066C]/.test(value);
}

/**
 * Normalizes Eastern Arabic (٠-٩) and Persian (۰-۹) digits to standard ASCII (0-9).
 */
export function normalizeArabicIndicDigits(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\u0660\u06F0]/g, '0')
    .replace(/[\u0661\u06F1]/g, '1')
    .replace(/[\u0662\u06F2]/g, '2')
    .replace(/[\u0663\u06F3]/g, '3')
    .replace(/[\u0664\u06F4]/g, '4')
    .replace(/[\u0665\u06F5]/g, '5')
    .replace(/[\u0666\u06F6]/g, '6')
    .replace(/[\u0667\u06F7]/g, '7')
    .replace(/[\u0668\u06F8]/g, '8')
    .replace(/[\u0669\u06F9]/g, '9');
}

/**
 * Normalizes any numeric string containing Arabic-Indic numerals, Arabic separators,
 * or grouping marks into a clean ASCII decimal representation.
 */
export function normalizeArabicIndicNumerals(input: unknown): string {
  if (input === null || input === undefined) return '';
  if (typeof input === 'number') {
    return isNaN(input) || !isFinite(input) ? '' : String(input);
  }

  let str = String(input).trim();
  if (!str) return '';

  // 1. Convert Arabic-Indic and Persian digits to ASCII digits 0-9
  str = normalizeArabicIndicDigits(str);

  // 2. Convert Arabic decimal mark (٫ U+066B) to standard dot (.)
  str = str.replace(/\u066B/g, '.');

  // 3. Remove Arabic thousands separator (٬ U+066C) and Arabic comma (، U+060C)
  str = str.replace(/[\u066C\u060C]/g, '');

  // 4. Strip common Egyptian currency/unit noise and labels
  str = str.replace(/(?:ج\.م|جنيه|EGP|LE|متر|م²|م³|م\b|٪|%)/gi, '');

  // 5. Handle standard commas vs dots
  if (str.includes(',') && str.includes('.')) {
    // Both comma and dot present
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    if (lastDot > lastComma) {
      // e.g. 1,500,000.50 -> commas are thousands separators
      str = str.replace(/,/g, '');
    } else {
      // e.g. 1.500.000,50 (European/Continental style) -> dots are thousands, comma is decimal
      str = str.replace(/\./g, '').replace(/,/g, '.');
    }
  } else if (str.includes(',')) {
    // Only comma(s) present, no dot
    const commaParts = str.split(',');
    if (commaParts.length > 2) {
      // Multiple commas: e.g. 1,500,000 -> all thousands separators
      str = str.replace(/,/g, '');
    } else if (commaParts.length === 2) {
      // Single comma: e.g. "1,4" (depth 1.4m) or "1,500" (1500)
      const decimalCandidate = commaParts[1].trim();
      // If 1 or 2 digits after comma, it's typically a decimal separator in Arabic keyboard context (e.g. 1,4 or 1,25)
      // If exactly 3 digits after comma with preceding digits, it's typically thousands (e.g. 1,500 or 50,000)
      if (decimalCandidate.length === 3 && commaParts[0].length >= 1) {
        str = str.replace(/,/g, '');
      } else {
        str = str.replace(/,/g, '.');
      }
    }
  }

  // 6. Strip all remaining characters except digits, single leading minus, and decimal point
  str = str.replace(/[^0-9.-]/g, '');

  // 7. Ensure at most one decimal point
  const dotParts = str.split('.');
  if (dotParts.length > 2) {
    str = dotParts[0] + '.' + dotParts.slice(1).join('');
  }

  // 8. Ensure at most one minus sign at beginning
  if (str.includes('-')) {
    const isNeg = str.startsWith('-');
    str = (isNeg ? '-' : '') + str.replace(/-/g, '');
  }

  return str;
}

/**
 * Safely parses any number, numeric string, or Arabic-Indic numeral string into a valid JavaScript float.
 * If input is null, empty, or unparseable, returns fallback (default 0).
 */
export function parseArabicIndicNumber(input: unknown, fallback: number = 0): number {
  if (input === null || input === undefined || input === '') {
    return fallback;
  }
  if (typeof input === 'number') {
    return isNaN(input) || !isFinite(input) ? fallback : input;
  }

  const normalized = normalizeArabicIndicNumerals(input);
  if (!normalized || normalized === '-' || normalized === '.') {
    return fallback;
  }

  const parsed = parseFloat(normalized);
  return isNaN(parsed) || !isFinite(parsed) ? fallback : parsed;
}

/**
 * Zod preprocessor helper to parse Arabic-Indic numerals transparently.
 */
export function preprocessArabicIndicNumber(val: unknown): unknown {
  if (val === '' || val === null || val === undefined) return undefined;
  if (typeof val === 'number') return val;
  const parsed = parseArabicIndicNumber(val, NaN);
  return isNaN(parsed) ? val : parsed;
}
