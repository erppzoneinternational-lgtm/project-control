'use client';

/**
 * UiverseActionInput — ترقية حقل البحث التفاعلي باستخدام أنيميشن Scry 3D Flip
 * ────────────────────────────────────────────────────────────────────────────
 * Upgraded with 3D horizontal axis flip physics (perspective: 800px, rotateX 0deg)
 * and 3-job action button (Open -> Clear -> Close) as referenced by Eng. Hassan Soliman.
 */

import React from 'react';
import { ScrySearch } from './ScrySearch';

export interface UiverseActionInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  buttonText?: string;
  icon?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  name?: string;
  type?: string;
  maxWidth?: string | number;
  inputMaxWidth?: string | number;
  dir?: 'rtl' | 'ltr';
  ariaLabel?: string;
}

export function UiverseActionInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'بحث...',
  buttonText = 'بحث',
  className = '',
  style,
  id = 'uiverse-action-input',
  name,
  maxWidth,
  dir,
  ariaLabel = 'حقل البحث السريع',
}: UiverseActionInputProps) {
  const isRtl = dir === 'rtl' || (typeof document !== 'undefined' && document.documentElement.dir === 'rtl');

  return (
    <ScrySearch
      value={value}
      onChange={onChange}
      onSubmit={onSubmit}
      placeholder={placeholder}
      width={maxWidth || 360}
      defaultOpen={true}
      autoCloseOnBlur={false}
      isRtl={isRtl}
      className={className}
      style={style}
      id={id}
      name={name}
      ariaLabel={ariaLabel}
    />
  );
}
