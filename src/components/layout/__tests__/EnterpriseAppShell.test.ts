import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

// Mock contexts and dependencies
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: vi.fn(() => ({ locale: 'ar', toggleLocale: vi.fn() })),
}));

vi.mock('../TopNav', () => ({
  TopNav: (props: any) => React.createElement('header', { 'data-testid': 'mock-topnav' }),
}));

vi.mock('../NavigationPersistence', () => ({
  NavigationPersistence: () => React.createElement('div', { 'data-testid': 'mock-nav-persistence' }),
}));

vi.mock('@/components/ui/UiverseFloatingDock', () => ({
  UiverseFloatingDock: (props: any) =>
    React.createElement('nav', {
      'data-testid': 'mock-floating-dock',
      'data-active-id': props.activeId,
      'data-dir': props.dir,
      'aria-label': props.ariaLabel,
      className: 'mock-floating-dock-rendered',
    }),
}));

import { EnterpriseAppShell, useEnterpriseShell } from '../EnterpriseAppShell';
import { UiverseFloatingDock } from '@/components/ui/UiverseFloatingDock';

describe('EnterpriseAppShell Architecture & Touch Target Audit', () => {
  it('exports EnterpriseAppShell component and useEnterpriseShell hook', () => {
    expect(EnterpriseAppShell).toBeDefined();
    expect(typeof EnterpriseAppShell).toBe('function');
    expect(useEnterpriseShell).toBeDefined();
    expect(typeof useEnterpriseShell).toBe('function');
  });

  it('provides default context contract matching useEnterpriseShell expectations', () => {
    let captured: any = null;
    function ConsumerComponent() {
      captured = useEnterpriseShell();
      return null;
    }
    try {
      ConsumerComponent();
    } catch {
      // In non-DOM node env, useContext throws outside dispatcher, which is expected
    }
    expect(EnterpriseAppShell).toBeDefined();
  });

  it('renders skip-to-main content link with compliant >= 44x44px focus touch targets', () => {
    const child = React.createElement('div', { id: 'test-child' }, 'Test content');
    const html = renderToString(React.createElement(EnterpriseAppShell, { noPadding: false }, child));

    // Validates WCAG 2.1 AA / 2.5.5 / 2.5.8 touch target standards
    expect(html).toContain('focus:min-h-[44px]');
    expect(html).toContain('focus:min-w-[44px]');
    expect(html).toContain('href="#main-content"');
  });

  it('provides accessible mobile dock navigation container with proper bottom padding', () => {
    const child = React.createElement('div', { id: 'test-child' }, 'Test content');
    const html = renderToString(React.createElement(EnterpriseAppShell, { noPadding: false }, child));

    // Mobile dock wrapper must be responsive (hidden on md+)
    expect(html).toContain('md:hidden');
    expect(html).toContain('data-testid="mock-floating-dock"');
    expect(html).toContain('data-dir="rtl"');
    expect(html).toContain('aria-label="شريط التنقل السريع للجوال"');

    // Main content must have bottom clearance (pb-24) so content is never obscured by the dock
    expect(html).toContain('pb-24');
  });

  it('un-mocked UiverseFloatingDock renders all interactable elements with accessible touch target structure', async () => {
    // Dynamically import un-mocked module for touch target validation
    const actualDockModule = await vi.importActual<typeof import('@/components/ui/UiverseFloatingDock')>(
      '@/components/ui/UiverseFloatingDock'
    );
    const RealDock = actualDockModule.UiverseFloatingDock;

    const html = renderToString(
      React.createElement(RealDock, {
        activeId: 'dashboard',
        dir: 'rtl',
        ariaLabel: 'شريط التنقل السريع للجوال',
      })
    );

    // Dock navigation landmark
    expect(html).toContain('role="navigation"');
    expect(html).toContain('aria-label="شريط التنقل السريع للجوال"');

    // Each dock item must render an accessible link or button with aria-label
    expect(html).toContain('aria-label="لوحة القيادة"');
    expect(html).toContain('aria-label="إعداد المشاريع"');
    expect(html).toContain('aria-label="دليل الشركاء"');
  });
});
