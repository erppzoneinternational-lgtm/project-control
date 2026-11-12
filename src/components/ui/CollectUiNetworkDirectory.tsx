'use client';

import React from 'react';
import styles from './CollectUiNetworkDirectory.module.css';

export interface CollectUiDirectoryItem {
  id: string;
  name: string;
  iconFallback?: string;
  domain?: string;
  url?: string;
  isHot?: boolean;
}

export interface CollectUiDirectoryGroup {
  id: string;
  title: string;
  items: CollectUiDirectoryItem[];
}

export interface CollectUiNetworkDirectoryProps {
  title?: string;
  subtitle?: string;
  sponsorTitle?: string;
  groups?: CollectUiDirectoryGroup[];
  addCardTitle?: string;
  addCardSubtitle?: string;
  onAddCardClick?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  locale?: 'ar' | 'en';
  dir?: 'rtl' | 'ltr';
  className?: string;
}

export const CollectUiNetworkDirectory: React.FC<CollectUiNetworkDirectoryProps> = ({
  title,
  subtitle,
  sponsorTitle,
  groups,
  addCardTitle,
  addCardSubtitle,
  onAddCardClick,
  theme = 'dark',
  locale,
  dir,
  className,
}) => {
  const isAr = locale ? locale === 'ar' : dir !== 'ltr';
  const resolvedDir = dir || (isAr ? 'rtl' : 'ltr');

  const defaultTitle = isAr
    ? 'دليل الشركاء والمنظومة الهندسية'
    : 'Network Directory & Ecosystem';

  const defaultSubtitle = isAr
    ? 'شبكة المكاتب الاستشارية والمقاولين المعتمدين والموردين الاستراتيجيين في قطاع التشييد'
    : 'Verified network of engineering consultancies, general contractors, and strategic suppliers';

  const defaultSponsorTitle = isAr ? 'الشركاء الاستراتيجيون' : 'Top Partners & Sponsors';
  const defaultAddTitle = isAr ? 'إضافة شريك أو جهة جديدة 🙌' : 'Add your organization here 🙌';
  const defaultAddSubtitle = isAr ? 'الاعتماد الفوري خلال 48 ساعة' : 'Get approved in 48h';

  const defaultGroups: CollectUiDirectoryGroup[] = isAr
    ? [
        {
          id: 'g1',
          title: 'المكاتب الاستشارية وجهات الإشراف',
          items: [
            { id: '1', name: 'دار الهندسة', domain: 'dargroup.com', isHot: true, iconFallback: 'DH' },
            { id: '2', name: 'خطيب وعلمي', domain: 'khatibalami.com', isHot: false, iconFallback: 'KA' },
            { id: '3', name: 'شاكر للاستشارات', domain: 'shaker.com.eg', isHot: false, iconFallback: 'SK' },
          ],
        },
        {
          id: 'g2',
          title: 'المقاولون العموميون والمتخصصون',
          items: [
            { id: '4', name: 'المقاولون العرب', domain: 'arabcont.com', isHot: true, iconFallback: 'AC' },
            { id: '5', name: 'أوراسكوم للإنشاءات', domain: 'orascom.com', isHot: true, iconFallback: 'OC' },
            { id: '6', name: 'حسن علام للإنشاءات', domain: 'hassanallam.com', isHot: false, iconFallback: 'HA' },
          ],
        },
      ]
    : [
        {
          id: 'g1',
          title: 'Consultants & Supervisory Bodies',
          items: [
            { id: '1', name: 'Dar Al-Handasah', domain: 'dargroup.com', isHot: true, iconFallback: 'DH' },
            { id: '2', name: 'Khatib & Alami', domain: 'khatibalami.com', isHot: false, iconFallback: 'KA' },
            { id: '3', name: 'Shaker Consultancy', domain: 'shaker.com.eg', isHot: false, iconFallback: 'SK' },
          ],
        },
        {
          id: 'g2',
          title: 'General Contractors',
          items: [
            { id: '4', name: 'Arab Contractors', domain: 'arabcont.com', isHot: true, iconFallback: 'AC' },
            { id: '5', name: 'Orascom Construction', domain: 'orascom.com', isHot: true, iconFallback: 'OC' },
            { id: '6', name: 'Hassan Allam Construction', domain: 'hassanallam.com', isHot: false, iconFallback: 'HA' },
          ],
        },
      ];

  const activeGroups = groups || defaultGroups;

  const containerClasses = [
    styles.directoryWrapper,
    theme === 'light' ? styles.themeLight : styles.themeDark,
    resolvedDir === 'rtl' ? styles.rtl : styles.ltr,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={containerClasses} dir={resolvedDir} aria-label="CollectUI Network Directory">
      {/* Header Block */}
      <div className={styles.headerBlock}>
        <h2 className={styles.title}>{title || defaultTitle}</h2>
        <p className={styles.subtitle}>{subtitle || defaultSubtitle}</p>
      </div>

      {/* Main Content Layout */}
      <div className={styles.directoryContent}>
        {/* Sponsor / Add Column */}
        <div className={styles.sponsorSection}>
          <h3 className={styles.sectionTitle}>{sponsorTitle || defaultSponsorTitle}</h3>

          <div
            className={styles.addSiteCard}
            onClick={onAddCardClick}
            role="button"
            tabIndex={0}
            aria-label={addCardTitle || defaultAddTitle}
          >
            <div className={styles.addSiteIcon} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="currentColor" fillOpacity="0.1" />
                <line x1="16" y1="8" x2="16" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="8" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className={styles.addSiteInfo}>
              <div className={styles.addSiteTitle}>{addCardTitle || defaultAddTitle}</div>
              <div className={styles.addSiteSubtitle}>{addCardSubtitle || defaultAddSubtitle}</div>
            </div>
          </div>
        </div>

        {/* Groups Grid */}
        <div className={styles.groupsWrapper}>
          {activeGroups.map((group) => (
            <div key={group.id} className={styles.groupBlock}>
              <h4 className={styles.groupTitle}>{group.title}</h4>
              <div className={styles.itemsGrid}>
                {group.items.map((item) => (
                  <a
                    key={item.id}
                    href={item.url || '#'}
                    className={styles.networkItem}
                    title={item.name}
                  >
                    <div className={styles.networkIcon} aria-hidden="true">
                      {item.iconFallback || item.name.charAt(0)}
                    </div>
                    <div className={styles.networkInfo}>
                      <span className={styles.networkName}>{item.name}</span>
                      {item.domain && (
                        <>
                          <span className={styles.separator}>·</span>
                          <span className={styles.networkDomain}>{item.domain}</span>
                        </>
                      )}
                      {item.isHot && <span className={styles.fireBadge} aria-label="Hot">🔥</span>}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CollectUiNetworkDirectory;
