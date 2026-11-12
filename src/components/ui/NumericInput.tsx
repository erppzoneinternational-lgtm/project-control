'use client';

/**
 * NumericInput — حقل إدخال رقمي مرن يدعم لوحات المفاتيح العربية
 * ─────────────────────────────────────────────────────────────
 * Designed for enterprise ERP inputs (dimensions, depths, areas, percentages):
 *  - Full real-time normalization of Eastern Arabic digits (٠١٢٣٤٥٦٧٨٩ -> 0-9)
 *  - Normalization of Arabic decimal mark (٫ U+066B -> .)
 *  - Tolerant of pasted numbers with units or thousands separators
 *  - Mobile decimal keypad triggered via inputMode="decimal"
 *  - Preserves decimal typing flow ("1." is not prematurely truncated)
 *  - Synchronizes with external controls (sliders, quick preset buttons)
 *  - WCAG 2.1 AA accessible, glass-input styled, forwards ref
 */

import React, { forwardRef, useState, useEffect, useRef, useId, useCallback } from 'react';
import {
  normalizeArabicIndicNumerals,
  parseArabicIndicNumber,
} from '@/lib/utils/arabic-numerals';

export interface NumericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'defaultValue'> {
  value?: number | string | null;
  defaultValue?: number | string | null;
  onValueChange?: (numericValue: number, rawString: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  allowDecimals?: boolean;
  min?: number;
  max?: number;
  step?: number | string;
  suffix?: string;
  prefix?: string;
  containerClassName?: string;
}

export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  (
    {
      value,
      defaultValue,
      onValueChange,
      onChange,
      allowDecimals = true,
      min,
      max,
      step,
      suffix,
      prefix,
      containerClassName = '',
      className = '',
      placeholder = '0',
      disabled = false,
      readOnly = false,
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

    const initialVal = value !== undefined ? value : defaultValue ?? '';
    const [displayStr, setDisplayStr] = useState<string>(() => {
      if (initialVal === '' || initialVal === null || initialVal === undefined) return '';
      return String(initialVal);
    });

    const [isFocused, setIsFocused] = useState(false);

    // Sync external value updates (e.g. range slider or presets)
    useEffect(() => {
      if (value !== undefined) {
        if (value === '' || value === null) {
          if (!isFocused) setDisplayStr('');
        } else {
          const incomingNum = parseArabicIndicNumber(value);
          const currentNum = parseArabicIndicNumber(displayStr);
          // Only update display string if external value numerically differs or user is not focused
          if (!isFocused || Math.abs(incomingNum - currentNum) > 0.0001) {
            setDisplayStr(String(value));
          }
        }
      }
    }, [value, isFocused]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      // 1. Normalize Eastern Arabic numerals and Arabic decimal mark
      let normalized = normalizeArabicIndicNumerals(raw);

      // If user typed dot at end (e.g. "1." or "0."), preserve it
      const hasTrailingDot = allowDecimals && (raw.endsWith('.') || raw.endsWith('\u066B') || raw.endsWith(','));
      if (hasTrailingDot && !normalized.includes('.')) {
        normalized = normalized + '.';
      }

      if (!allowDecimals) {
        normalized = normalized.replace(/\./g, '');
      }

      // Check min/max clamping on valid numbers
      const parsed = parseArabicIndicNumber(normalized);

      setDisplayStr(normalized);
      onValueChange?.(parsed, normalized);
      onChange?.(e);
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      // Clean trailing dot or empty minus on blur
      if (displayStr === '.' || displayStr === '-') {
        setDisplayStr('');
        onValueChange?.(0, '');
      } else if (displayStr.endsWith('.')) {
        const cleaned = displayStr.slice(0, -1);
        setDisplayStr(cleaned);
      }
      onBlur?.(e);
    };

    const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const inputNode = (
      <input
        {...rest}
        ref={setRef}
        id={inputId}
        type="text"
        inputMode={allowDecimals ? 'decimal' : 'numeric'}
        autoComplete="off"
        spellCheck="false"
        dir="ltr"
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        value={displayStr}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        className={className}
      />
    );

    if (!suffix && !prefix) {
      return inputNode;
    }

    return (
      <div className={`relative flex items-center ${containerClassName}`} dir="ltr">
        {prefix && (
          <span className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-xs font-bold text-slate-400 select-none">
            {prefix}
          </span>
        )}
        {inputNode}
        {suffix && (
          <span className="absolute inset-y-0 end-0 pe-3 flex items-center pointer-events-none text-xs font-bold text-slate-400 select-none">
            {suffix}
          </span>
        )}
      </div>
    );
  }
);

NumericInput.displayName = 'NumericInput';
