import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  CurrencyInput,
  normalizeEasternArabicNumerals,
  sanitizeCurrencyString,
  parseEgpNumericValue,
  formatEgpMask,
  formatEgpWithSymbol,
} from '../CurrencyInput';

describe('CurrencyInput Component & Numeric Parsing Audit — Egyptian Pound (EGP)', () => {
  describe('1. Eastern Arabic & Persian Numeral Normalization', () => {
    it('accurately normalizes Eastern Arabic digits (٠١٢٣٤٥٦٧٨٩) to ASCII digits', () => {
      const input = '٠١٢٣٤٥٦٧٨٩';
      const result = normalizeEasternArabicNumerals(input);
      expect(result).toBe('0123456789');
    });

    it('accurately normalizes Persian digits (۰۱۲۳۴۵۶۷۸۹) to ASCII digits', () => {
      const input = '۰۱۲۳۴۵۶۷۸۹';
      const result = normalizeEasternArabicNumerals(input);
      expect(result).toBe('0123456789');
    });

    it('handles mixed ASCII and Eastern Arabic digits cleanly', () => {
      const input = '100٠٥٠٠';
      const result = normalizeEasternArabicNumerals(input);
      expect(result).toBe('1000500');
    });
  });

  describe('2. Sanitization & Currency Noise Removal', () => {
    it('normalizes Arabic decimal comma (٫ U+066B) to standard dot (.)', () => {
      const input = '١٥٠٠٫٧٥';
      const result = sanitizeCurrencyString(input);
      expect(result).toBe('1500.75');
    });

    it('strips Arabic thousands separator (٬ U+066C) and Arabic comma (، U+060C)', () => {
      const input = '١٬٥٠٠٬٠٠٠٫٥٠';
      const result = sanitizeCurrencyString(input);
      expect(result).toBe('1500000.50');
    });

    it('strips Egyptian currency labels like "ج.م", "EGP", "LE" and surrounding spaces', () => {
      const input = ' 2,500,000.50 ج.م ';
      const result = sanitizeCurrencyString(input);
      expect(result).toBe('2500000.50');

      const inputEgp = 'EGP 1,200.00';
      const resultEgp = sanitizeCurrencyString(inputEgp);
      expect(resultEgp).toBe('1200.00');
    });

    it('safely handles multiple decimal dots by preserving the first occurrence', () => {
      const input = '123.45.67';
      const result = sanitizeCurrencyString(input);
      expect(result).toBe('123.4567');
    });
  });

  describe('3. Numeric Parsing (parseEgpNumericValue)', () => {
    it('parses large Egyptian contract values without rounding drift', () => {
      const contractStr = '25,450,000.75';
      const value = parseEgpNumericValue(contractStr);
      expect(value).toBe(25450000.75);
    });

    it('parses formatted Arabic currency string directly into float', () => {
      const input = '١٬٢٥٠٬٠٠٠٫٥٠ ج.م';
      const value = parseEgpNumericValue(input);
      expect(value).toBe(1250000.5);
    });

    it('returns 0 for empty, null, undefined or non-numeric tokens', () => {
      expect(parseEgpNumericValue('')).toBe(0);
      expect(parseEgpNumericValue(null)).toBe(0);
      expect(parseEgpNumericValue(undefined)).toBe(0);
      expect(parseEgpNumericValue('invalid text')).toBe(0);
      expect(parseEgpNumericValue('-')).toBe(0);
      expect(parseEgpNumericValue('.')).toBe(0);
    });

    it('preserves negative values when allowed', () => {
      const input = '-50,000.00';
      const value = parseEgpNumericValue(input);
      expect(value).toBe(-50000);
    });
  });

  describe('4. Real-time Thousand Separator Masking (formatEgpMask)', () => {
    it('applies thousand commas to integers', () => {
      expect(formatEgpMask('1000000')).toBe('1,000,000');
      expect(formatEgpMask('500')).toBe('500');
      expect(formatEgpMask('123456789')).toBe('123,456,789');
    });

    it('preserves partial trailing dot while user is typing', () => {
      const masked = formatEgpMask('5000.', { preserveTrailingDot: true });
      expect(masked).toBe('5,000.');
    });

    it('limits fractional decimal places to 2 (piastres)', () => {
      const masked = formatEgpMask('1250.78912', { maxDecimals: 2 });
      expect(masked).toBe('1,250.78');
    });

    it('formats numbers with Eastern Arabic digits into standard formatted mask', () => {
      const masked = formatEgpMask('١٥٠٠٠٠٠');
      expect(masked).toBe('1,500,000');
    });
  });

  describe('5. Egyptian Currency Formatting with Symbol', () => {
    it('formats EGP with Arabic symbol (ج.م) suffix', () => {
      const formatted = formatEgpWithSymbol(1500000, 'ar');
      expect(formatted).toBe('1,500,000.00 ج.م');
    });

    it('formats EGP with English symbol prefix', () => {
      const formatted = formatEgpWithSymbol(1500000, 'en');
      expect(formatted).toBe('EGP 1,500,000.00');
    });
  });

  describe('6. Component Rendering & Accessibility', () => {
    it('renders input with currency suffix and mono font in SSR', () => {
      const html = renderToString(
        <CurrencyInput
          id="contract-test-input"
          label="قيمة العقد"
          value={1500000}
          locale="ar"
        />
      );

      expect(html).toContain('قيمة العقد');
      expect(html).toContain('1,500,000');
      expect(html).toContain('ج.م');
      expect(html).toContain('inputMode="decimal"');
      expect(html).toContain('dir="ltr"');
    });

    it('renders live VAT 14% preview when enabled', () => {
      const html = renderToString(
        <CurrencyInput
          label="قيمة العقد الإجمالية"
          value={100000}
          showVatPreview={true}
          locale="ar"
        />
      );

      // 100,000 * 14% = 14,000.00
      expect(html).toContain('14,000.00 ج.م');
      expect(html).toContain('114,000.00 ج.م');
      expect(html).toContain('ضريبة القيمة المضافة');
    });

    it('renders error message and aria-invalid attribute when error prop is passed', () => {
      const html = renderToString(
        <CurrencyInput
          label="الميزانية"
          value={0}
          error="المبلغ مطلوب ويجب أن يكون أكبر من الصفر"
        />
      );

      expect(html).toContain('aria-invalid="true"');
      expect(html).toContain('المبلغ مطلوب ويجب أن يكون أكبر من الصفر');
      expect(html).toContain('role="alert"');
    });
  });
});
