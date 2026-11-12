'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, Check, Search, X, Plus, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
  searchTerms?: string;
  badge?: React.ReactNode;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  disabled?: boolean;
  clearable?: boolean;
  allowCustomInput?: boolean;
  error?: boolean | string;
  id?: string;
  isLoading?: boolean;
  loadingMessage?: string;
  footerAction?: React.ReactNode;
}

interface DropdownPos { top?: number; bottom?: number; left: number; width: number; }

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  label,
  disabled = false,
  clearable = false,
  allowCustomInput = false,
  error,
  id,
  isLoading = false,
  loadingMessage,
  footerAction,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const selectId = React.useId();
  const listboxId = `${selectId}-listbox`;

  const [isOpen, setIsOpen]         = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [pos, setPos]               = useState<DropdownPos>({ top: 0, left: 0, width: 0 });
  const triggerRef  = useRef<HTMLButtonElement>(null);
  const searchRef   = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionsListRef = useRef<HTMLDivElement>(null);

  const normalizeText = (str: string) =>
    (str || '').toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').trim();

  const selectedOption = options.find(o => o.value === value) || (value ? { value, label: value } : undefined);
  const normSearch      = normalizeText(searchTerm);
  const filteredOptions = options.filter(o =>
    normalizeText(o.label).includes(normSearch) ||
    normalizeText(o.value).includes(normSearch) ||
    (o.subLabel ? normalizeText(o.subLabel).includes(normSearch) : false) ||
    (o.searchTerms ? normalizeText(o.searchTerms).includes(normSearch) : false)
  );

  const calcPos = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const viewportH = typeof window !== 'undefined' ? window.innerHeight : 900;
    const spaceBelow = viewportH - r.bottom;
    const shouldFlipUp = spaceBelow < 250 && r.top > 260;
    if (shouldFlipUp) {
      setPos({ top: undefined, bottom: viewportH - r.top + 4, left: r.left, width: r.width });
    } else {
      setPos({ top: r.bottom + 4, bottom: undefined, left: r.left, width: r.width });
    }
  }, []);

  const open = () => {
    calcPos();
    setIsOpen(true);
    const currIdx = filteredOptions.findIndex(o => o.value === value);
    setActiveIndex(currIdx >= 0 ? currIdx : 0);
  };

  const close = () => {
    setIsOpen(false);
    setSearchTerm('');
    setActiveIndex(-1);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onOutside = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (dropdownRef.current?.contains(e.target as Node)) return;
      close();
    };
    const onScroll = (e: Event) => {
      if (dropdownRef.current?.contains(e.target as Node)) return;
      calcPos();
    };
    document.addEventListener('mousedown', onOutside);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', calcPos);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', calcPos);
    };
  }, [isOpen, calcPos]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && optionsListRef.current) {
      const activeEl = optionsListRef.current.children[activeIndex] as HTMLElement;
      activeEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, activeIndex]);

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isOpen) {
        open();
      } else {
        close();
      }
    }
  };

  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        setActiveIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        setActiveIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
        onChange(filteredOptions[activeIndex].value);
        close();
      } else if (allowCustomInput && searchTerm) {
        onChange(searchTerm);
        close();
      }
    }
  };

  const dropdown = isOpen ? (
    <div
      ref={dropdownRef}
      id={listboxId}
      role="listbox"
      aria-label={label || placeholder || 'خيارات القائمة'}
      onKeyDown={handleDropdownKeyDown}
      style={{
        position: 'fixed',
        top: pos.top,
        bottom: pos.bottom,
        left: pos.left,
        width: pos.width,
        zIndex: 100050,
      }}
      className="bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 rounded-xl py-1 max-h-64 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="p-2 border-b border-slate-200 dark:border-slate-800">
        <div className="relative flex items-center">
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin absolute right-2.5" aria-hidden="true" />
          ) : (
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5" aria-hidden="true" />
          )}
          <input
            ref={searchRef}
            type="text"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setActiveIndex(0);
            }}
            placeholder={searchPlaceholder || (isAr ? 'ابحث هنا...' : 'Search here...')}
            aria-label={isAr ? 'بحث في خيارات القائمة' : 'Search options in dropdown'}
            className="w-full bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-xs rounded-lg pe-8 ps-7 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500 border border-slate-200 dark:border-slate-700 font-medium"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute left-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
              aria-label={isAr ? 'مسح البحث' : 'Clear search'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      <div ref={optionsListRef} className="overflow-y-auto max-h-48 py-1">
        {/* Subtle background revalidation indicator if list is already populated */}
        {isLoading && filteredOptions.length > 0 && (
          <div className="px-3 py-1 bg-emerald-50/60 dark:bg-emerald-950/20 text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 font-medium">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
              <span>{isAr ? 'جاري تحديث الخيارات في الخلفية...' : 'Refreshing options...'}</span>
            </span>
          </div>
        )}
        {allowCustomInput && searchTerm && !options.some(o => normalizeText(o.label) === normSearch) && (
          <button
            type="button"
            role="option"
            aria-selected={false}
            onClick={() => { onChange(searchTerm); close(); }}
            className="w-full min-h-[44px] text-end px-3 py-2 text-xs flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors border-b border-slate-200 dark:border-slate-800"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? `استخدام "${searchTerm}" كـ مسمى جديد` : `Use "${searchTerm}" as a new name`}</span>
          </button>
        )}
        {isLoading && filteredOptions.length === 0 ? (
          <div className="p-4 flex flex-col items-center justify-center gap-2 text-center" role="status" aria-live="polite">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              <span>{loadingMessage || (isAr ? 'جاري تحميل الخيارات...' : 'Loading options...')}</span>
            </div>
            {/* Shimmer skeleton rows for perceived readiness */}
            <div className="w-full space-y-2 mt-1 px-2">
              <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
            </div>
          </div>
        ) : filteredOptions.length === 0 && (!allowCustomInput || !searchTerm) ? (
          <div className="px-3 py-3 text-xs text-slate-400 text-center" role="status">
            {isAr ? 'لا توجد نتائج' : 'No results'}
          </div>
        ) : (
          filteredOptions.map((option, idx) => {
            const sel = option.value === value;
            const isHighlighted = idx === activeIndex;
            return (
              <button
                key={`${option.value}_${idx}`}
                id={`${listboxId}-opt-${idx}`}
                type="button"
                role="option"
                aria-selected={sel}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => { onChange(option.value); close(); }}
                className={`w-full min-h-[44px] text-end px-3 py-2 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  sel
                    ? 'bg-emerald-500/10 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold'
                    : isHighlighted
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="flex flex-col items-start min-w-0 flex-1 text-start">
                  <span className="flex items-center gap-2 truncate w-full">
                    {option.badge}
                    <span className="truncate">{option.label}</span>
                  </span>
                  {option.subLabel && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal truncate w-full mt-0.5">
                      {option.subLabel}
                    </span>
                  )}
                </span>
                {sel && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />}
              </button>
            );
          })
        )}
      </div>
      {footerAction && (
        <div
          onClick={() => close()}
          className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 p-1.5"
        >
          {footerAction}
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className="relative w-full" id={id}>
      {label && (
        <label id={`${selectId}-label`} className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-labelledby={label ? `${selectId}-label` : undefined}
        aria-label={!label ? (placeholder ?? (isAr ? 'قائمة خيارات' : 'Select')) : undefined}
        aria-invalid={!!error}
        aria-busy={isLoading}
        disabled={disabled}
        onClick={isOpen ? close : open}
        onKeyDown={handleTriggerKeyDown}
        className={`w-full min-h-[44px] flex items-center justify-between gap-2 text-end text-xs px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border text-slate-900 dark:text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs font-semibold focus-visible:outline-none ${
          error
            ? 'border-rose-500 ring-2 ring-rose-500/20 text-rose-950 dark:text-rose-100'
            : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
        }`}
      >
        <span className="truncate">
          {selectedOption ? (
            <span className="flex items-center gap-2 font-medium">{selectedOption.badge}{selectedOption.label}</span>
          ) : isLoading ? (
            <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5 font-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{placeholder ?? (isAr ? 'اختر...' : 'Select...')}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                ({isAr ? 'جاري التحميل...' : 'loading...'})
              </span>
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">{placeholder ?? (isAr ? 'اختر...' : 'Select...')}</span>
          )}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {clearable && value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              aria-label={isAr ? 'مسح الاختيار' : 'Clear selection'}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange('');
                }
              }}
              className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
          )}
          {isLoading && (
            <Loader2
              className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-spin"
              aria-label={isAr ? 'جاري التحميل...' : 'Loading...'}
            />
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </div>
      </button>
      {typeof error === 'string' && error.trim().length > 0 && (
        <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1" role="alert">
          {error}
        </p>
      )}
      {typeof document !== 'undefined' && ReactDOM.createPortal(dropdown, document.body)}
    </div>
  );
};