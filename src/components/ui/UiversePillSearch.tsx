'use client';

/**
 * UiversePillSearch — حقل بحث كبسولي فخم مع شارة اختصار لوحة المفاتيح
 * ──────────────────────────────────────────────────────────────────────────
 * Adapted from Uiverse.io by uiverse-astronaut.
 * Features:
 *  - 999px full pill capsule border radius
 *  - Subtle cubic-bezier focus elevation glow
 *  - Integrated keyboard shortcut badge (e.g. ⌘K or Ctrl+K)
 *  - Clear button with auto-reset
 *  - Global hotkey listener (presses hotkey to auto-focus)
 *  - Variants: default, blue, emerald
 *  - Sizes: sm (36px), md (44px), lg (48px)
 *  - Full RTL/LTR and Dark/Light theme support
 */

import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import styles from './UiversePillSearch.module.css';

export interface UiversePillSearchProps {
  value?: string;
  onChange?: (val: string) => void;
  onSubmit?: (val: string) => void;
  placeholder?: string;
  shortcut?: string;
  variant?: 'default' | 'blue' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  dir?: 'rtl' | 'ltr';
  autoFocus?: boolean;
  id?: string;
  ariaLabel?: string;
}

export const UiversePillSearch: React.FC<UiversePillSearchProps> = ({
  value = '',
  onChange,
  onSubmit,
  placeholder = 'بحث...',
  shortcut = '⌘K',
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className = '',
  dir,
  autoFocus = false,
  id,
  ariaLabel,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey listener for shortcut
  useEffect(() => {
    if (!shortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcut]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit(value);
    }
  };

  const handleClear = () => {
    if (onChange) onChange('');
    inputRef.current?.focus();
  };

  const sizeClass = styles[size] || styles.md;
  const variantClass = variant !== 'default' ? styles[variant] || '' : '';
  const fullWidthClass = fullWidth ? styles.fullWidth : '';

  return (
    <div
      dir={dir}
      className={`${styles.cirSearch} ${sizeClass} ${variantClass} ${fullWidthClass} ${className} cir-search`}
    >
      <span className={`${styles.cirSearchIcon} cir-search__icon`}>
        <Search className="w-4 h-4" />
      </span>

      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange && onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        className={`${styles.cirSearchField} cir-search__field`}
      />

      {value ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="مسح البحث"
          className={`${styles.clearBtn}`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : (
        shortcut && (
          <span className={`${styles.cirSearchKbd} cir-search__kbd`}>
            {shortcut}
          </span>
        )
      )}
    </div>
  );
};

export const PillSearch = UiversePillSearch;
export default UiversePillSearch;
