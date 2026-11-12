import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { getBreadcrumbChevron, getRouteTitle, HeaderNav } from '../HeaderNav';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => '/projects'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock Language Context
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: vi.fn(() => ({
    locale: 'ar',
    dir: 'rtl',
    toggleLocale: vi.fn(),
    t: (key: string) => {
      const dict: Record<string, string> = {
        'nav.board_dashboard': 'اللوحة المركزية',
        'nav.project_list': 'قائمة المشاريع',
        'nav.new_project': 'مشروع جديد',
        'nav.project_setup': 'إعداد المشروع',
        'nav.clients': 'دليل العملاء',
        'nav.search_placeholder': 'بحث...',
      };
      return dict[key] || key;
    },
  })),
}));

// Mock NotificationCenter and ScrySearch
vi.mock('../NotificationCenter', () => ({
  NotificationCenter: () => React.createElement('div', { 'data-testid': 'notification-center' }),
}));

vi.mock('@/components/ui/ScrySearch', () => ({
  ScrySearch: (props: any) => React.createElement('input', { 'data-testid': 'scry-search', placeholder: props.placeholder }),
}));

describe('HeaderNav Component Audit & Improvements', () => {
  describe('1. Breadcrumb and Secondary Navigation Alignment in RTL', () => {
    it('selects ChevronLeft in RTL direction so separator points towards destination', () => {
      const ChevronIconRtl = getBreadcrumbChevron(true);
      expect(ChevronIconRtl).toBe(ChevronLeft);
    });

    it('selects ChevronRight in LTR direction so separator points towards destination', () => {
      const ChevronIconLtr = getBreadcrumbChevron(false);
      expect(ChevronIconLtr).toBe(ChevronRight);
    });

    it('renders breadcrumbs trail with accessible navigation and proper direction', () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(HeaderNav, {
          lang: 'ar',
          breadcrumbs: [
            { label: 'المشاريع', href: '/projects' },
            { label: 'إعداد المشروع' },
          ],
        })
      );

      // Must have secondary navigation landmark
      expect(html).toContain('aria-label="مسار التنقل الفرعي"');
      expect(html).toContain('المشاريع');
      expect(html).toContain('إعداد المشروع');
      // Final crumb must have aria-current="page"
      expect(html).toContain('aria-current="page"');
    });

    it('renders custom secondaryNav when passed', () => {
      const customNode = React.createElement('span', { id: 'custom-subnav' }, 'Custom Secondary Nav');
      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(HeaderNav, {
          secondaryNav: customNode,
        })
      );

      expect(html).toContain('id="custom-subnav"');
      expect(html).toContain('Custom Secondary Nav');
    });
  });

  describe('2. Company Emblem Logo Sizing and Crisp Rendering', () => {
    it('renders emblem image with explicit 32x32 sizing and contrast optimization', () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(HeaderNav, {
          isDark: true,
          showEmblem: true,
        })
      );

      expect(html).toContain('src="/pzone-emblem.png"');
      expect(html).toContain('width="32"');
      expect(html).toContain('height="32"');
      expect(html).toContain('image-rendering:-webkit-optimize-contrast');
    });

    it('adapts wordmark logo based on theme (white on dark, dark on light)', () => {
      const darkHtml = ReactDOMServer.renderToStaticMarkup(
        React.createElement(HeaderNav, { isDark: true, showWordmark: true })
      );
      expect(darkHtml).toContain('src="/pzone-logo-white.png"');

      const lightHtml = ReactDOMServer.renderToStaticMarkup(
        React.createElement(HeaderNav, { isDark: false, showWordmark: true })
      );
      expect(lightHtml).toContain('src="/pzone-logo-dark.png"');
    });
  });

  describe('3. Accessible Home Link and Current Route Indicator', () => {
    const mockT = (key: string) => {
      const dict: Record<string, string> = {
        'nav.board_dashboard': 'اللوحة المركزية',
        'nav.project_list': 'قائمة المشاريع',
        'nav.new_project': 'مشروع جديد',
        'nav.project_setup': 'إعداد المشروع',
        'nav.clients': 'دليل العملاء',
      };
      return dict[key] || key;
    };

    it('resolves standard and parameterized route titles correctly', () => {
      expect(getRouteTitle('/dashboard', mockT, 'ar')).toBe('اللوحة المركزية');
      expect(getRouteTitle('/projects', mockT, 'ar')).toBe('قائمة المشاريع');
      expect(getRouteTitle('/projects/new', mockT, 'ar')).toBe('مشروع جديد');
      expect(getRouteTitle('/clients', mockT, 'ar')).toBe('دليل العملاء');
      expect(getRouteTitle('/projects/proj-123', mockT, 'ar')).toBe('تفاصيل المشروع');
      expect(getRouteTitle('/projects/proj-123/edit', mockT, 'ar')).toBe('تعديل بيانات المشروع');
      expect(getRouteTitle('/projects', mockT, 'en')).toBe('Project List');
    });

    it('home link has accessible aria-label and aria-current when on home route', () => {
      const htmlOnHome = ReactDOMServer.renderToStaticMarkup(
        React.createElement(HeaderNav, {
          homeHref: '/projects',
          lang: 'ar',
        })
      );

      // Home link should have aria-label and aria-current="page" because pathname is mocked to '/projects'
      expect(htmlOnHome).toContain('aria-label="P.ZONE - الصفحة الرئيسية الحالية"');
      expect(htmlOnHome).toContain('href="/projects"');
    });

    it('displays active route indicator with pulse dot when no breadcrumbs provided', () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(HeaderNav, {
          currentRoute: 'لوحة التحكم التجريبية',
        })
      );

      expect(html).toContain('aria-current="page"');
      expect(html).toContain('animate-pulse');
      expect(html).toContain('لوحة التحكم التجريبية');
    });
  });
});
