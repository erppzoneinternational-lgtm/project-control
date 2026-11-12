import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ScrySearch, ScrySearchModal } from '../ui/ScrySearch';

describe('ScrySearch & ScrySearchModal Component Audit & Improvements', () => {
  describe('1. Inline 3D Flip Search Pill (Backward Compatibility)', () => {
    it('renders inline search container with default 3D flip attributes', () => {
      const html = renderToString(
        React.createElement(ScrySearch, {
          value: '',
          placeholder: 'بحث سريع...',
          hotkey: '⌘K',
          isRtl: true,
          width: 320,
        })
      );

      expect(html).toContain('role="search"');
      expect(html).toContain('data-state="closed"');
      expect(html).toContain('data-rtl="true"');
      expect(html).toContain('role="combobox"');
      expect(html).toContain('بحث سريع...');
      expect(html).toContain('⌘K');
      expect(html).toContain('title="فتح البحث"');
    });

    it('renders in open state when defaultOpen is true', () => {
      const html = renderToString(
        React.createElement(ScrySearch, {
          value: 'العلمين',
          defaultOpen: true,
          isRtl: true,
        })
      );

      expect(html).toContain('data-state="open"');
      expect(html).toContain('value="العلمين"');
      expect(html).toContain('title="مسح نص البحث"');
      expect(html).toContain('aria-expanded="true"');
    });

    it('supports compact mode and custom style dimensions', () => {
      const html = renderToString(
        React.createElement(ScrySearch, {
          compact: true,
          width: 240,
        })
      );

      expect(html).toContain('--w:240px');
    });
  });

  describe('2. Global Search Modal (Cmd+K / Ctrl+K) & Backdrop Blur', () => {
    it('renders null when modal isOpen is false', () => {
      const html = renderToString(
        React.createElement(ScrySearchModal, {
          isOpen: false,
          onClose: () => {},
          forceMounted: true,
        })
      );

      expect(html).toBe('');
    });

    it('renders modal dialog with backdrop blur container when isOpen is true', () => {
      const html = renderToString(
        React.createElement(ScrySearchModal, {
          isOpen: true,
          onClose: () => {},
          forceMounted: true,
          isRtl: true,
        })
      );

      // Dialog container & accessibility
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-label="البحث العام الموحد"');
      expect(html).toContain('dir="rtl"');
      expect(html).toContain('data-rtl="true"');

      // Esc badge and close button
      expect(html).toContain('Esc');
      expect(html).toContain('aria-label="إغلاق نافذة البحث"');
    });

    it('renders LTR correctly when isRtl is false', () => {
      const html = renderToString(
        React.createElement(ScrySearchModal, {
          isOpen: true,
          onClose: () => {},
          forceMounted: true,
          isRtl: false,
        })
      );

      expect(html).toContain('dir="ltr"');
      expect(html).toContain('data-rtl="false"');
      expect(html).toContain('aria-label="Global Unified Search"');
      expect(html).toContain('aria-label="Close search modal"');
    });
  });

  describe('3. Accessible Combobox ARIA Roles (WAI-ARIA 1.2)', () => {
    it('implements combobox, listbox, group, and option roles with active descendant tracking', () => {
      const html = renderToString(
        React.createElement(ScrySearchModal, {
          isOpen: true,
          onClose: () => {},
          forceMounted: true,
          isRtl: true,
        })
      );

      // 1. Combobox input attributes
      expect(html).toContain('role="combobox"');
      expect(html).toContain('aria-autocomplete="list"');
      expect(html).toContain('aria-expanded="true"');
      expect(html).toContain('aria-haspopup="listbox"');
      expect(html).toContain('aria-controls="scry-search-modal-listbox"');
      expect(html).toContain('aria-activedescendant="prj-alm-01"');

      // 2. Listbox container attributes
      expect(html).toContain('id="scry-search-modal-listbox"');
      expect(html).toContain('role="listbox"');
      expect(html).toContain('aria-label="نتائج البحث المجمعة"');

      // 3. Group roles with labelledby headers
      expect(html).toContain('role="group"');
      expect(html).toContain('aria-labelledby="scry-group-heading-projects"');
      expect(html).toContain('aria-labelledby="scry-group-heading-stakeholders"');
      expect(html).toContain('aria-labelledby="scry-group-heading-pages"');

      // 4. Option roles with aria-selected
      expect(html).toContain('role="option"');
      expect(html).toContain('id="prj-alm-01"');
      expect(html).toContain('aria-selected="true"');
    });
  });

  describe('4. Search Result Item Grouping (Projects, Stakeholders, Pages) in RTL', () => {
    it('renders all three required categories in RTL with correct Arabic headings and counts', () => {
      const html = renderToString(
        React.createElement(ScrySearchModal, {
          isOpen: true,
          onClose: () => {},
          forceMounted: true,
          isRtl: true,
        })
      );

      // Projects group
      expect(html).toContain('المشاريع الإنشائية');
      expect(html).toContain('مشروع إنشاء مجمع بحيرات العلمين (SLX)');
      expect(html).toContain('مشروع أبراج الداون تاون — المرحلة الثانية');
      expect(html).toContain('نشط ومطابق');

      // Stakeholders group
      expect(html).toContain('أصحاب المصلحة والشركاء');
      expect(html).toContain('م. حسن علي سليمان (Hassan Soliman)');
      expect(html).toContain('شركة حسن علام للمقاولات والإنشاءات (HAP)');
      expect(html).toContain('دار الهندسة للتصميم والاستشارات الفنية');
      expect(html).toContain('مدير المكتب الفني');

      // Pages & Services group
      expect(html).toContain('الصفحات والأقسام');
      expect(html).toContain('اللوحة المركزية (Central Dashboard)');
      expect(html).toContain('نبض البرنامج الزمني (Schedule Pulse - P6)');
      expect(html).toContain('دليل أصحاب المصلحة (Stakeholders Directory)');
      expect(html).toContain('أرشيف المشاريع (Projects Archive)');
    });

    it('filters results dynamically based on search query', () => {
      const html = renderToString(
        React.createElement(ScrySearchModal, {
          isOpen: true,
          onClose: () => {},
          forceMounted: true,
          initialQuery: 'سليمان',
          isRtl: true,
        })
      );

      // Should contain Hassan Soliman
      expect(html).toContain('م. حسن علي سليمان (Hassan Soliman)');
      // Should NOT contain unrelated projects when filtering
      expect(html).not.toContain('مشروع أبراج الداون تاون');
    });

    it('displays empty state when query has no matching results', () => {
      const html = renderToString(
        React.createElement(ScrySearchModal, {
          isOpen: true,
          onClose: () => {},
          forceMounted: true,
          initialQuery: 'استعلام_غير_موجود_نهائيا_12345',
          isRtl: true,
        })
      );

      expect(html).toContain('لم يتم العثور على نتائج لـ');
      expect(html).toContain('استعلام_غير_موجود_نهائيا_12345');
    });

    it('renders keyboard navigation footer hints in RTL', () => {
      const html = renderToString(
        React.createElement(ScrySearchModal, {
          isOpen: true,
          onClose: () => {},
          forceMounted: true,
          isRtl: true,
        })
      );

      expect(html).toContain('للاختيار');
      expect(html).toContain('للتنقل');
      expect(html).toContain('للإغلاق');
      expect(html).toContain('PZone ScrySearch');
    });
  });
});
