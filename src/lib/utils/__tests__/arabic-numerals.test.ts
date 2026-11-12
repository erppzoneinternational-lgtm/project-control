import { describe, it, expect } from 'vitest';
import {
  normalizeArabicIndicDigits,
  normalizeArabicIndicNumerals,
  parseArabicIndicNumber,
  hasArabicIndicNumerals,
  preprocessArabicIndicNumber,
} from '../arabic-numerals';

describe('Arabic-Indic Numeral Parsing & Normalization', () => {
  describe('1. Eastern Arabic & Persian Digit Normalization', () => {
    it('accurately normalizes Eastern Arabic digits (٠١٢٣٤٥٦٧٨٩) to ASCII digits (0-9)', () => {
      expect(normalizeArabicIndicDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
      expect(normalizeArabicIndicDigits('١٢٣')).toBe('123');
    });

    it('accurately normalizes Persian / Extended Arabic-Indic digits (۰۱۲۳۴۵۶۷۸۹)', () => {
      expect(normalizeArabicIndicDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
      expect(normalizeArabicIndicDigits('۱۲۳')).toBe('123');
    });

    it('handles mixed ASCII and Arabic-Indic numerals', () => {
      expect(normalizeArabicIndicDigits('100٠٥٠٠')).toBe('1000500');
    });

    it('detects presence of Arabic-Indic numerals via hasArabicIndicNumerals', () => {
      expect(hasArabicIndicNumerals('١٢٣')).toBe(true);
      expect(hasArabicIndicNumerals('123')).toBe(false);
      expect(hasArabicIndicNumerals('1.4م')).toBe(false);
      expect(hasArabicIndicNumerals('١.٤ م')).toBe(true);
      expect(hasArabicIndicNumerals('1500٫50')).toBe(true);
    });
  });

  describe('2. Decimal & Thousands Separators Normalization', () => {
    it('normalizes Arabic decimal comma (٫ U+066B) to standard dot (.)', () => {
      expect(normalizeArabicIndicNumerals('١٫٤')).toBe('1.4');
      expect(normalizeArabicIndicNumerals('٠٫٦')).toBe('0.6');
      expect(normalizeArabicIndicNumerals('١٥٠٠٫٧٥')).toBe('1500.75');
    });

    it('strips Arabic thousands separator (٬ U+066C) and grouping commas', () => {
      expect(normalizeArabicIndicNumerals('١٬٥٠٠٬٠٠٠')).toBe('1500000');
      expect(normalizeArabicIndicNumerals('١٬٥٠٠٬٠٠٠٫٥٠')).toBe('1500000.50');
      expect(normalizeArabicIndicNumerals('١,٥٠٠,٠٠٠')).toBe('1500000');
    });

    it('handles keyboard comma as decimal separator in depth inputs (e.g. 1,4 -> 1.4)', () => {
      expect(normalizeArabicIndicNumerals('1,4')).toBe('1.4');
      expect(normalizeArabicIndicNumerals('١,٤')).toBe('1.4');
      expect(normalizeArabicIndicNumerals('0,6')).toBe('0.6');
      expect(normalizeArabicIndicNumerals('2,5')).toBe('2.5');
    });

    it('handles standard thousand grouping commas (e.g. 1,500,000)', () => {
      expect(normalizeArabicIndicNumerals('1,500,000')).toBe('1500000');
      expect(normalizeArabicIndicNumerals('25,450,000.75')).toBe('25450000.75');
    });
  });

  describe('3. Currency & Unit Label Noise Removal', () => {
    it('strips Egyptian currency labels "ج.م", "جنيه", "EGP", "LE"', () => {
      expect(normalizeArabicIndicNumerals('١٥٠٠٠٠٠ ج.م')).toBe('1500000');
      expect(normalizeArabicIndicNumerals('2,500,000.00 EGP')).toBe('2500000.00');
      expect(normalizeArabicIndicNumerals('LE 45,000')).toBe('45000');
      expect(normalizeArabicIndicNumerals('١٬٢٠٠ جنيه')).toBe('1200');
    });

    it('strips measurement units "متر", "م", "م²", "م³"', () => {
      expect(normalizeArabicIndicNumerals('١٫٤ م')).toBe('1.4');
      expect(normalizeArabicIndicNumerals('٥٠٠ م²')).toBe('500');
      expect(normalizeArabicIndicNumerals('٧٠٠ م³')).toBe('700');
    });
  });

  describe('4. parseArabicIndicNumber - Float & Integer Conversion', () => {
    it('parses contract values pasted with Arabic-Indic numerals', () => {
      expect(parseArabicIndicNumber('١٥٠٠٠٠٠')).toBe(1500000);
      expect(parseArabicIndicNumber('١٬٥٠٠٬٠٠٠')).toBe(1500000);
      expect(parseArabicIndicNumber('١٥٠٠٠٠٠٫٥٠')).toBe(1500000.5);
    });

    it('parses depth values (0.6, 1.4, 2.0, 2.5) from Arabic keyboards', () => {
      expect(parseArabicIndicNumber('٠٫٦')).toBe(0.6);
      expect(parseArabicIndicNumber('١٫٤')).toBe(1.4);
      expect(parseArabicIndicNumber('١.٤')).toBe(1.4);
      expect(parseArabicIndicNumber('٢٫٠')).toBe(2.0);
      expect(parseArabicIndicNumber('٢٫٥')).toBe(2.5);
    });

    it('parses budget values', () => {
      expect(parseArabicIndicNumber('٢٠٠٠٠٠٠')).toBe(2000000);
      expect(parseArabicIndicNumber('٢٬٠٠٠٬٠٠٠ ج.م')).toBe(2000000);
    });

    it('safely handles empty, null, undefined, and non-numeric strings', () => {
      expect(parseArabicIndicNumber('')).toBe(0);
      expect(parseArabicIndicNumber(null)).toBe(0);
      expect(parseArabicIndicNumber(undefined)).toBe(0);
      expect(parseArabicIndicNumber('نص غير رقمي')).toBe(0);
      expect(parseArabicIndicNumber('-', 10)).toBe(10);
    });

    it('passes through valid numbers directly', () => {
      expect(parseArabicIndicNumber(1500000)).toBe(1500000);
      expect(parseArabicIndicNumber(1.4)).toBe(1.4);
    });
  });

  describe('5. Zod Preprocessor Integration', () => {
    it('transforms Arabic-Indic string to number for schema validation', () => {
      expect(preprocessArabicIndicNumber('١٥٠٠٠٠٠')).toBe(1500000);
      expect(preprocessArabicIndicNumber('١٫٤')).toBe(1.4);
      expect(preprocessArabicIndicNumber(500)).toBe(500);
      expect(preprocessArabicIndicNumber('')).toBeUndefined();
      expect(preprocessArabicIndicNumber(null)).toBeUndefined();
    });
  });
});
