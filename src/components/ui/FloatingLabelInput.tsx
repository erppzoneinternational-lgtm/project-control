'use client';

/**
 * FloatingLabelInput — حقل إدخال بتسمية عائمة أنيقة
 * ───────────────────────────────────────────────────
 * Adapted from Uiverse.io by Maximinodotpy.
 * Features:
 *  - Floating label animation on focus, valid, or filled state
 *  - Full RTL/LTR logical styling
 *  - Dark / light mode support with background masking badge
 *  - Error validation badge and alert message
 *  - Full controlled & uncontrolled input support with React.forwardRef
 */

import React, { forwardRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import styles from './FloatingLabelInput.module.css';

export interface FloatingLabelInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  fullWidth?: boolean;
  maxWidth?: string | number;
  containerClassName?: string;
  badgeBgLight?: string;
  badgeBgDark?: string;
}

export const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  (
    {
      label,
      error,
      fullWidth = false,
      maxWidth,
      containerClassName = '',
      className = '',
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      id,
      dir,
      badgeBgLight,
      badgeBgDark,
      style,
      ...rest
    },
    ref
  ) => {
    const reactGeneratedId = React.useId();
    const inputId = id || reactGeneratedId;
    const [isFocused, setIsFocused] = useState(false);
    const [internalVal, setInternalVal] = useState(defaultValue ?? '');

    const val = value !== undefined ? value : internalVal;
    const hasValue = String(val ?? '').length > 0;
    const isFloated = isFocused || hasValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) {
        setInternalVal(e.target.value);
      }
      onChange?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const containerStyle: React.CSSProperties = {
      ...(maxWidth !== undefined
        ? { ['--input-max-width' as any]: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth }
        : {}),
      ...(badgeBgLight ? { ['--label-bg-light' as any]: badgeBgLight } : {}),
      ...(badgeBgDark ? { ['--label-bg-dark' as any]: badgeBgDark } : {}),
      ...style,
    };

    return (
      <div
        className={`${styles.inputGroup} ${fullWidth ? styles.inputGroupFullWidth : ''} ${
          isFloated ? styles.floated : ''
        } ${error ? styles.hasError : ''} ${containerClassName}`}
        style={containerStyle}
        dir={dir}
      >
        <input
          ref={ref}
          id={inputId}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          data-has-value={hasValue ? 'true' : 'false'}
          className={className}
          dir={dir}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
        />
        <label htmlFor={inputId}>{label}</label>

        {error && (
          <div id={`${inputId}-error`} className={styles.errorText} role="alert">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

FloatingLabelInput.displayName = 'FloatingLabelInput';
export default FloatingLabelInput;
