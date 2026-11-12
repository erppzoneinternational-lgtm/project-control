'use client';

/**
 * CurrencyInput — حقل إدخال العملة المتقدم للجنيه المصري (EGP / ج.م)
 * ──────────────────────────────────────────────────────────────────
 * Designed for enterprise construction ERP financials:
 *  - Real-time live mask with thousand separators (e.g. 1,500,000.00)
 *  - Full normalization of Eastern Arabic digits (٠١٢٣٤٥٦٧٨٩ -> 0-9)
 *  - Normalization of Arabic decimal (٫ U+066B) and thousands (٬ U+066C, ، U+060C)
 *  - Resilient copy-paste parsing with currency noise removal ("ج.م", "EGP", "LE")
 *  - Strict Egyptian Piastre precision (2 decimal places) with IEEE-754 safety
 *  - Cursor preservation across separator insertions/deletions
 *  - Optional Egyptian VAT 14% live breakdown preview (Law 67/2016)
 *  - WCAG 2.1 AA compliant, RTL-first layout, brutalist design token alignment
 */

import React, { forwardRef, useState, useEffect, useRef, useId, useCallback } from 'react';
import { AlertCircle, Calculator } from 'lucide-react';

/**
 * Normalizes Eastern Arabic (٠-٩) and Persian (۰-۹) digits to standard ASCII (0-9).
 */
export function normalizeEasternArabicNumerals(str: string): string {
  if (!str) return '';
  return str
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9');
}

/**
 * Strips all currency symbols, labels, and formatting characters,
 * returning a clean string representing the decimal number.
 */
export function sanitizeCurrencyString(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  let str = String(input);

  // Normalize Arabic numerals
  str = normalizeEasternArabicNumerals(str);

  // Normalize Arabic decimal mark (٫ U+066B) to standard dot (.)
  str = str.replace(/\u066B/g, '.');

  // Strip Arabic thousands separator (٬ U+066C), Arabic comma (، U+060C), and standard comma (,)
  str = str.replace(/[\u066C\u060C,]/g, '');

  // Strip non-numeric tokens except digits, minus sign, and decimal point
  str = str.replace(/[^0-9.-]/g, '');

  // Handle multiple decimal points (keep only first)
  const parts = str.split('.');
  if (parts.length > 2) {
    str = parts[0] + '.' + parts.slice(1).join('');
  }

  // Handle minus sign (only allow at beginning)
  if (str.includes('-')) {
    const isNegative = str.startsWith('-');
    str = (isNegative ? '-' : '') + str.replace(/-/g, '');
  }

  return str;
}

/**
 * Parses any currency string or number input into an exact JavaScript float.
 * Returns 0 if input is empty, invalid, or NaN.
 */
export function parseEgpNumericValue(input: string | number | null | undefined): number {
  if (input === null || input === undefined || input === '') return 0;
  if (typeof input === 'number') {
    return isNaN(input) || !isFinite(input) ? 0 : input;
  }

  const sanitized = sanitizeCurrencyString(input);
  if (!sanitized || sanitized === '-' || sanitized === '.') return 0;

  const parsed = parseFloat(sanitized);
  return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
}

/**
 * Formats a raw numeric or string value with Egyptian thousand separators.
 * Preserves partial trailing decimal input during active typing (e.g. "1500." or "1500.0").
 */
export function formatEgpMask(
  val: string | number | null | undefined,
  options: { preserveTrailingDot?: boolean; maxDecimals?: number } = {}
): string {
  if (val === null || val === undefined || val === '') return '';

  const { preserveTrailingDot = false, maxDecimals = 2 } = options;
  const rawStr = typeof val === 'number' ? val.toString() : String(val);
  const sanitized = sanitizeCurrencyString(rawStr);

  if (!sanitized) return '';
  if (sanitized === '-') return '-';

  const isNegative = sanitized.startsWith('-');
  const unsigned = isNegative ? sanitized.slice(1) : sanitized;

  const hasDot = unsigned.includes('.');
  const [integerPart, rawDecimalPart] = unsigned.split('.');

  // Add thousand commas to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = isNegative ? '-' : '';

  if (hasDot) {
    const limitedDecimal = (rawDecimalPart || '').slice(0, maxDecimals);
    if (limitedDecimal.length > 0) {
      return `${sign}${formattedInteger || '0'}.${limitedDecimal}`;
    }
    // Trailing dot entered (e.g. "5000.")
    if (preserveTrailingDot) {
      return `${sign}${formattedInteger || '0'}.`;
    }
  }

  return `${sign}${formattedInteger}`;
}

/**
 * Formats numeric amount to standard Egyptian Pound display format (e.g., "1,500,000.00 ج.م").
 */
export function formatEgpWithSymbol(
  val: number,
  locale: 'ar' | 'en' = 'ar',
  currencySymbol?: string
): string {
  const safeVal = isNaN(val) ? 0 : val;
  const symbol = currencySymbol || (locale === 'ar' ? 'ج.م' : 'EGP');

  const formattedNum = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeVal);

  return locale === 'ar' ? `${formattedNum} ${symbol}` : `${symbol} ${formattedNum}`;
}

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'defaultValue'> {
  value?: number | string;
  defaultValue?: number | string;
  onChange?: (numericValue: number, formattedString: string) => void;
  currencySymbol?: string;
  locale?: 'ar' | 'en';
  allowNegative?: boolean;
  maxDecimals?: number;
  label?: string;
  helperText?: string;
  error?: string;
  showVatPreview?: boolean;
  vatRate?: number; // Default 0.14 (14% Egyptian VAT)
  containerClassName?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      currencySymbol,
      locale = 'ar',
      allowNegative = false,
      maxDecimals = 2,
      label,
      helperText,
      error,
      showVatPreview = false,
      vatRate = 0.14,
      containerClassName = '',
      className = '',
      disabled = false,
      readOnly = false,
      placeholder = '0.00',
      id,
      dir,
      onFocus,
      onBlur,
      ...rest
    },
    forwardedRef
  ) => {
    const autoId = useId();
    const inputId = id || autoId;
    const internalInputRef = useRef<HTMLInputElement>(null);

    // Merge forwarded ref with internal ref
    const setRef = useCallback(
      (node: HTMLInputElement | null) => {
        internalInputRef.current = node;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      },
      [forwardedRef]
    );

    // Initial value formatting
    const initialVal = value !== undefined ? value : defaultValue ?? '';
    const [displayValue, setDisplayValue] = useState<string>(() => {
      if (initialVal === '' || initialVal === null || initialVal === undefined) return '';
      const num = parseEgpNumericValue(initialVal);
      return num === 0 && initialVal === '' ? '' : formatEgpMask(initialVal, { maxDecimals });
    });

    const [numericValue, setNumericValue] = useState<number>(() => parseEgpNumericValue(initialVal));
    const [isFocused, setIsFocused] = useState(false);

    // Synchronize controlled value changes from parent
    useEffect(() => {
      if (value !== undefined) {
        const parsed = parseEgpNumericValue(value);
        setNumericValue(parsed);

        // When not focused, reformat cleanly with full thousands separators
        if (!isFocused) {
          if (value === '' || value === null) {
            setDisplayValue('');
          } else {
            setDisplayValue(formatEgpMask(value, { maxDecimals }));
          }
        }
      }
    }, [value, isFocused, maxDecimals]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawInput = e.target.value;
      const cursorStart = e.target.selectionStart || 0;

      // Normalize digits and sanitize
      let normalized = normalizeEasternArabicNumerals(rawInput);
      if (!allowNegative) {
        normalized = normalized.replace(/-/g, '');
      }

      // Check if user just typed a trailing decimal point
      const hasTrailingDot = normalized.endsWith('.') || normalized.endsWith('\u066B');

      // Format with thousand grouping while preserving partial trailing decimal
      const formatted = formatEgpMask(normalized, {
        preserveTrailingDot: hasTrailingDot,
        maxDecimals,
      });

      const parsedNum = parseEgpNumericValue(formatted);

      setDisplayValue(formatted);
      setNumericValue(parsedNum);
      onChange?.(parsedNum, formatted);

      // Compute cursor drift caused by inserted/removed thousand commas
      requestAnimationFrame(() => {
        if (!internalInputRef.current) return;
        const diff = formatted.length - rawInput.length;
        const targetPos = Math.max(0, Math.min(cursorStart + diff, formatted.length));
        try {
          internalInputRef.current.setSelectionRange(targetPos, targetPos);
        } catch {
          // Ignore for non-text supported selection engines
        }
      });
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      // Clean up any trailing dots or incomplete formats on blur
      if (displayValue && displayValue !== '-') {
        const clean = formatEgpMask(numericValue, { maxDecimals });
        setDisplayValue(clean);
      }
      onBlur?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    // Calculate 14% Egyptian VAT preview
    const vatAmount = Math.round(numericValue * vatRate * 100) / 100;
    const totalWithVat = Math.round((numericValue + vatAmount) * 100) / 100;

    const symbolText = currencySymbol || (locale === 'ar' ? 'ج.م' : 'EGP');

    return (
      <div className={`w-full space-y-1.5 ${containerClassName}`} dir={dir || (locale === 'ar' ? 'rtl' : 'ltr')}>
        {label && (
          <div className="flex items-center justify-between">
            <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              {label}
            </label>
            {rest.required && (
              <span className="text-[11px] font-bold text-rose-500" aria-hidden="true">
                *
              </span>
            )}
          </div>
        )}

        <div className="relative flex items-center">
          <input
            {...rest}
            ref={setRef}
            id={inputId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck="false"
            dir="ltr"
            disabled={disabled}
            readOnly={readOnly}
            placeholder={placeholder}
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-hint` : undefined}
            className={`w-full ps-3 pe-14 py-2.5 rounded-xl font-mono text-sm font-bold text-start tracking-wide transition-all ${
              error
                ? 'border-2 border-rose-500 bg-rose-50/20 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100 focus:ring-rose-500'
                : readOnly || disabled
                ? 'bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-80 text-slate-500'
                : 'bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20'
            } text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none ${className}`}
          />

          {/* Currency Suffix Badge */}
          <span
            className="absolute inset-y-0 end-0 pe-3.5 flex items-center pointer-events-none text-xs font-black text-slate-400 dark:text-slate-500 select-none uppercase"
            aria-hidden="true"
          >
            {symbolText}
          </span>
        </div>

        {/* Live VAT 14% Helper Badge (Law 67/2016) */}
        {showVatPreview && numericValue > 0 && !error && (
          <div
            className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-1.5 font-medium">
              <Calculator className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
              <span>
                {locale === 'ar' ? 'ضريبة القيمة المضافة (14%):' : 'VAT (14%):'}
              </span>
              <strong className="font-mono text-emerald-700 dark:text-emerald-300">
                {formatEgpWithSymbol(vatAmount, locale, symbolText)}
              </strong>
            </div>
            <div className="font-medium text-slate-600 dark:text-slate-400">
              <span>{locale === 'ar' ? 'الإجمالي:' : 'Total:'} </span>
              <strong className="font-mono text-slate-900 dark:text-slate-100">
                {formatEgpWithSymbol(totalWithVat, locale, symbolText)}
              </strong>
            </div>
          </div>
        )}

        {/* Error / Helper Messages */}
        {error ? (
          <p id={`${inputId}-error`} className="text-xs text-rose-500 font-semibold flex items-center gap-1 mt-1" role="alert">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p id={`${inputId}-hint`} className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
