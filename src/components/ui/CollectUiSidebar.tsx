'use client';

import React, { useState } from 'react';
import styles from './CollectUiSidebar.module.css';

export interface CollectUiSidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number | string;
  href?: string;
  badge?: string;
}

export interface CollectUiSidebarSection {
  id?: string;
  title?: string;
  items: CollectUiSidebarItem[];
}

export interface CollectUiSidebarProps {
  sections?: CollectUiSidebarSection[];
  activeItemId?: string;
  onSelectItem?: (item: CollectUiSidebarItem) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  showSearch?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  locale?: 'ar' | 'en';
  dir?: 'rtl' | 'ltr';
  className?: string;
}

export const CollectUiSidebar: React.FC<CollectUiSidebarProps> = ({
  sections,
  activeItemId = 'dashboard',
  onSelectItem,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  showSearch = true,
  theme = 'dark',
  locale,
  dir,
  className,
}) => {
  const [internalSearch, setInternalSearch] = useState('');
  const currentSearch = searchValue !== undefined ? searchValue : internalSearch;

  const isAr = locale ? locale === 'ar' : dir !== 'ltr';
  const resolvedDir = dir || (isAr ? 'rtl' : 'ltr');

  const defaultSearchPlaceholder = isAr
    ? 'بحث في الأقسام والمشاريع...'
    : 'Search categories & projects...';

  const defaultSections: CollectUiSidebarSection[] = isAr
    ? [
        {
          id: 's1',
          title: 'الرئيسية والمشاريع',
          items: [
            { id: 'dashboard', label: 'لوحة المؤشرات العامة', icon: '📊', count: 14 },
            { id: 'projects', label: 'سجل المشروعات الإنشائية', icon: '🏢', count: 8 },
            { id: 'boq', label: 'جداول الكميات والتسعير', icon: '📑', count: 240 },
          ],
        },
        {
          id: 's2',
          title: 'التحكم والميدان',
          items: [
            { id: 'site-workspace', label: 'منصة مهندس الموقع', icon: '👷', count: 12 },
            { id: 'daily-progress', label: 'يوميات التنفيذ والاعتماد', icon: '📝', count: 5 },
            { id: 'qc-inspections', label: 'فحوصات الجودة ITP/IR', icon: '🛡️', count: 3 },
          ],
        },
      ]
    : [
        {
          id: 's1',
          title: 'Main & Projects',
          items: [
            { id: 'dashboard', label: 'Executive Dashboard', icon: '📊', count: 14 },
            { id: 'projects', label: 'Construction Projects', icon: '🏢', count: 8 },
            { id: 'boq', label: 'BOQ & Cost Engineering', icon: '📑', count: 240 },
          ],
        },
        {
          id: 's2',
          title: 'Site Controls',
          items: [
            { id: 'site-workspace', label: 'Site Workspace', icon: '👷', count: 12 },
            { id: 'daily-progress', label: 'Daily Progress Approvals', icon: '📝', count: 5 },
            { id: 'qc-inspections', label: 'QC Inspections (ITP/IR)', icon: '🛡️', count: 3 },
          ],
        },
      ];

  const activeSections = sections || defaultSections;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalSearch(val);
    }
  };

  const containerClasses = [
    styles.sidebarContainer,
    theme === 'light' ? styles.themeLight : styles.themeDark,
    resolvedDir === 'rtl' ? styles.rtl : styles.ltr,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <aside className={containerClasses} dir={resolvedDir} aria-label="CollectUI Sidebar Navigation">
      {/* Pill Search */}
      {showSearch && (
        <div className={styles.searchForm}>
          <div className={styles.searchIcon} aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor">
              <path
                d="M14 14L10 10M2 6.66667C2 9.244 4.08934 11.3333 6.66667 11.3333C9.244 11.3333 11.3333 9.244 11.3333 6.66667C11.3333 4.08934 9.244 2 6.66667 2C4.08934 2 2 4.08934 2 6.66667Z"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={searchPlaceholder || defaultSearchPlaceholder}
            value={currentSearch}
            onChange={handleSearchChange}
            aria-label="Search navigation items"
          />
        </div>
      )}

      {/* Navigation Sections */}
      {activeSections.map((sec, secIdx) => {
        // Filter items if search query exists
        const filteredItems = sec.items.filter((item) =>
          !currentSearch
            ? true
            : item.label.toLowerCase().includes(currentSearch.toLowerCase())
        );

        if (filteredItems.length === 0) return null;

        return (
          <div key={sec.id || secIdx} className={styles.sectionBlock}>
            {sec.title && <h3 className={styles.sectionTitle}>{sec.title}</h3>}
            <ul className={styles.itemList}>
              {filteredItems.map((item) => {
                const isActive = item.id === activeItemId;
                const itemClasses = [
                  styles.itemButton,
                  isActive ? styles.itemActive : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <li key={item.id}>
                    {item.href ? (
                      <a href={item.href} className={itemClasses}>
                        <div className={styles.itemLeft}>
                          {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
                          <span className={styles.itemLabel}>{item.label}</span>
                        </div>
                        {item.count !== undefined && (
                          <div className={styles.itemRight}>
                            <span className={styles.countBadge}>{item.count}</span>
                          </div>
                        )}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectItem && onSelectItem(item)}
                        className={itemClasses}
                      >
                        <div className={styles.itemLeft}>
                          {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
                          <span className={styles.itemLabel}>{item.label}</span>
                        </div>
                        {item.count !== undefined && (
                          <div className={styles.itemRight}>
                            <span className={styles.countBadge}>{item.count}</span>
                          </div>
                        )}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </aside>
  );
};

export default CollectUiSidebar;
