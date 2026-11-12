import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { useNavPreferencesStore, STORAGE_KEY } from '@/lib/stores/useNavPreferencesStore';
import { NavCustomizerModal } from '../NavCustomizerModal';
import { EnterpriseSidebar } from '../EnterpriseSidebar';

// Mock contexts and stores for rendering tests
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: vi.fn(() => ({
    locale: 'ar',
    dir: 'rtl',
    toggleLocale: vi.fn(),
  })),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
  usePathname: vi.fn(() => '/projects'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/lib/stores/useAuthStore', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'usr-1', email: 'test@pzone.com' },
    loading: false,
    signOut: vi.fn(),
  })),
}));

vi.mock('@/lib/hooks/useUserRoles', () => ({
  useUserRoles: vi.fn(() => ({
    roles: ['admin'],
    isAdmin: true,
    isLoading: false,
  })),
}));

describe('Navigation Customizer & Preferences System', () => {
  beforeEach(() => {
    // Reset store before each test
    useNavPreferencesStore.getState().resetToDefaults();
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('1. Store State & Preferences Persistence', () => {
    it('initializes with standard topbar defaults', () => {
      const state = useNavPreferencesStore.getState();
      expect(state.layoutMode).toBe('topbar');
      expect(state.densityMode).toBe('standard');
      expect(state.sidebarCollapsed).toBe(false);
      expect(state.isCustomizerOpen).toBe(false);
      expect(state.widgets.showSearch).toBe(true);
      expect(state.widgets.showProjectSelector).toBe(true);
      expect(state.widgets.showNotifications).toBe(true);
      expect(state.widgets.showThemeToggle).toBe(true);
      expect(state.widgets.showLanguageToggle).toBe(true);
    });

    it('applies Minimalist Clean preset correctly', () => {
      useNavPreferencesStore.getState().applyMinimalistCleanPreset();
      const state = useNavPreferencesStore.getState();

      expect(state.layoutMode).toBe('topbar');
      expect(state.densityMode).toBe('compact');
      expect(state.widgets.showFontCustomizer).toBe(false);
      expect(state.widgets.showGuidedTour).toBe(false);
      expect(state.widgets.showChangelog).toBe(false);
      expect(state.widgets.showProjectStructure).toBe(false);
      expect(state.widgets.showAdminShortcut).toBe(false);
      // Essential tools stay visible
      expect(state.widgets.showSearch).toBe(true);
      expect(state.widgets.showProjectSelector).toBe(true);
      expect(state.widgets.showNotifications).toBe(true);
    });

    it('applies Sidebar Mode preset correctly', () => {
      useNavPreferencesStore.getState().applySidebarPreset();
      const state = useNavPreferencesStore.getState();

      expect(state.layoutMode).toBe('sidebar');
      expect(state.densityMode).toBe('compact');
      expect(state.sidebarCollapsed).toBe(false);
    });

    it('applies Compact Single-Row preset correctly', () => {
      useNavPreferencesStore.getState().applyCompactSingleRowPreset();
      const state = useNavPreferencesStore.getState();

      expect(state.densityMode).toBe('compact');
      expect(state.layoutMode).toBe('topbar');
    });

    it('toggles individual widgets and sidebar collapse state', () => {
      const store = useNavPreferencesStore.getState();
      expect(store.widgets.showFontCustomizer).toBe(true);

      store.toggleWidget('showFontCustomizer');
      expect(useNavPreferencesStore.getState().widgets.showFontCustomizer).toBe(false);

      store.toggleSidebarCollapsed();
      expect(useNavPreferencesStore.getState().sidebarCollapsed).toBe(true);
      store.toggleSidebarCollapsed();
      expect(useNavPreferencesStore.getState().sidebarCollapsed).toBe(false);
    });

    it('opens and closes customizer modal', () => {
      const store = useNavPreferencesStore.getState();
      expect(store.isCustomizerOpen).toBe(false);

      store.openCustomizer();
      expect(useNavPreferencesStore.getState().isCustomizerOpen).toBe(true);

      store.closeCustomizer();
      expect(useNavPreferencesStore.getState().isCustomizerOpen).toBe(false);
    });
    it('manages sidebar density and group accordion collapse state', () => {
      const store = useNavPreferencesStore.getState();
      expect(store.sidebarDensity).toBe('compact'); // Default is compact for space efficiency

      store.toggleSidebarDensity();
      expect(useNavPreferencesStore.getState().sidebarDensity).toBe('standard');

      store.setSidebarDensity('compact');
      expect(useNavPreferencesStore.getState().sidebarDensity).toBe('compact');

      // Test accordion toggles
      store.toggleSidebarGroup('dashboards');
      expect(useNavPreferencesStore.getState().collapsedSidebarGroups['dashboards']).toBe(true);

      store.collapseAllSidebarGroups(['dashboards', 'projects', 'reports']);
      const collapsed = useNavPreferencesStore.getState().collapsedSidebarGroups;
      expect(collapsed['dashboards']).toBe(true);
      expect(collapsed['projects']).toBe(true);
      expect(collapsed['reports']).toBe(true);

      store.expandAllSidebarGroups();
      expect(Object.keys(useNavPreferencesStore.getState().collapsedSidebarGroups).length).toBe(0);
    });
  });

  describe('2. NavCustomizerModal Rendering & Accessibility', () => {
    it('returns null when customizer is closed', () => {
      useNavPreferencesStore.getState().closeCustomizer();
      const html = renderToString(<NavCustomizerModal />);
      expect(html).toBe('');
    });

    it('renders dialog with ARIA attributes and preset options when open', () => {
      useNavPreferencesStore.getState().openCustomizer();
      const html = renderToString(<NavCustomizerModal forceOpen={true} />);

      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="nav-customizer-title"');
      expect(html).toContain('تخصيص واجهة التنقل وشريط الأدوات');
      expect(html).toContain('الوضع النقي البسيط');
      expect(html).toContain('شريط جانبي عمودي');
      expect(html).toContain('شريط علوي مدمج');
      expect(html).toContain('الوضع الافتراضي الموسع');
    });
  });

  describe('3. EnterpriseSidebar Component Rendering', () => {
    it('renders navigation landmark and groups for desktop', () => {
      const html = renderToString(
        <EnterpriseSidebar isDark={true} onThemeToggle={vi.fn()} />
      );

      expect(html).toContain('role="navigation"');
      expect(html).toContain('aria-label="شريط التنقل الجانبي"');
      expect(html).toContain('لوحات القيادة');
      expect(html).toContain('إعداد المشاريع');
      expect(html).toContain('التقارير الشاملة');
      expect(html).toContain('تخصيص الشريط');
    });

    it('renders quick compact density switch and accordion controls', () => {
      const html = renderToString(
        <EnterpriseSidebar isDark={true} onThemeToggle={vi.fn()} isCollapsed={false} />
      );

      expect(html).toContain('مدمج (Compact)');
      expect(html).toContain('طي الكل');
    });

    it('adapts width class based on sidebarCollapsed state', () => {
      const htmlExpanded = renderToString(
        <EnterpriseSidebar isDark={true} onThemeToggle={vi.fn()} isCollapsed={false} />
      );
      expect(htmlExpanded).toContain('w-64');

      const htmlCollapsed = renderToString(
        <EnterpriseSidebar isDark={true} onThemeToggle={vi.fn()} isCollapsed={true} />
      );
      expect(htmlCollapsed).toContain('w-[68px]');
    });

    it('applies compact density styling when density is compact', () => {
      const htmlCompact = renderToString(
        <EnterpriseSidebar isDark={true} onThemeToggle={vi.fn()} isCollapsed={false} density="compact" />
      );
      expect(htmlCompact).toContain('min-h-[32px]');
      expect(htmlCompact).toContain('text-xs');
      expect(htmlCompact).toContain('space-y-1.5');

      const htmlStandard = renderToString(
        <EnterpriseSidebar isDark={true} onThemeToggle={vi.fn()} isCollapsed={false} density="standard" />
      );
      expect(htmlStandard).toContain('min-h-[40px]');
      expect(htmlStandard).toContain('text-[13.5px]');
      expect(htmlStandard).toContain('space-y-3');
    });

    it('renders large comfortable font (text-sm font-bold) for collapsed groups', () => {
      const html = renderToString(
        <EnterpriseSidebar isDark={true} onThemeToggle={vi.fn()} isCollapsed={false} collapsedGroups={{ dashboards: true }} />
      );

      // Collapsed group has text-sm font-bold, min-h-[42px], and item counter badge
      expect(html).toContain('text-sm font-bold');
      expect(html).toContain('min-h-[42px]');
    });
  });
});
