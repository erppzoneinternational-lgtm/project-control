import { describe, it, expect, vi } from 'vitest';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock Language Context, Auth Store & RBAC hooks
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: vi.fn(() => ({ locale: 'ar', toggleLocale: vi.fn() })),
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

vi.mock('@/lib/hooks/useModuleAccess', () => ({
  useModuleAccess: vi.fn(() => ({
    data: null,
    isLoading: false,
  })),
}));

vi.mock('../NotificationCenter', () => ({
  NotificationCenter: () => null,
}));

vi.mock('@/components/ui/ThemeToggleSwitch', () => ({
  ThemeToggleSwitch: () => null,
}));

vi.mock('@/components/ui/ProjectStructureDropdown', () => ({
  ProjectStructureDropdown: () => null,
}));

vi.mock('@/components/ui/ScrySearch', () => ({
  ScrySearch: () => null,
}));

vi.mock('@/components/auth/ChangePasswordModal', () => ({
  ChangePasswordModal: () => null,
}));

vi.mock('@/lib/services/project.service', () => ({
  ProjectService: {
    getUserAssignedProjectIds: vi.fn().mockResolvedValue([]),
    getProjects: vi.fn().mockResolvedValue([]),
  },
}));

import React from 'react';
import { renderToString } from 'react-dom/server';
import { TopNav, isItemActive } from '../TopNav';

describe('TopNav isItemActive Route Highlighting Logic', () => {
  const projectsGroupItems = [
    { href: '/project-setup' },
    { href: '/projects' },
    { href: '/projects/dashboard' },
    { href: '/projects/new' },
    { href: '/stakeholders' },
    { href: '/clients' },
  ];

  const planningGroupItems = [
    { href: '/planning' },
    { href: '/boq' },
    { href: '/planning/activities' },
    { href: '/planning/site-tasks' },
    { href: '/planning/baseline' },
    { href: '/planning/daily-progress' },
    { href: '/site-workspace' },
    { href: '/workflow' },
    { href: '/planning/allocation' },
    { href: '/planning/dashboard' },
  ];

  describe('1. Task Specification Requirements', () => {
    it('/projects/dashboard activates /projects/dashboard and NOT /projects', () => {
      const currentPath = '/projects/dashboard';

      // /projects/dashboard must be active
      const isDashboardActive = isItemActive('/projects/dashboard', currentPath, projectsGroupItems);
      expect(isDashboardActive).toBe(true);

      // /projects must NOT be active (no dual active highlights)
      const isProjectsListActive = isItemActive('/projects', currentPath, projectsGroupItems);
      expect(isProjectsListActive).toBe(false);
    });

    it('/projects activates /projects', () => {
      const currentPath = '/projects';

      // /projects must be active
      const isProjectsListActive = isItemActive('/projects', currentPath, projectsGroupItems);
      expect(isProjectsListActive).toBe(true);

      // Other items must NOT be active
      const isDashboardActive = isItemActive('/projects/dashboard', currentPath, projectsGroupItems);
      expect(isDashboardActive).toBe(false);
      const isNewActive = isItemActive('/projects/new', currentPath, projectsGroupItems);
      expect(isNewActive).toBe(false);
    });

    it('/planning/activities activates /planning/activities and NOT /planning', () => {
      const currentPath = '/planning/activities';

      // /planning/activities must be active
      const isActivitiesActive = isItemActive('/planning/activities', currentPath, planningGroupItems);
      expect(isActivitiesActive).toBe(true);

      // /planning (hub) must NOT be active (no dual active highlights)
      const isPlanningHubActive = isItemActive('/planning', currentPath, planningGroupItems);
      expect(isPlanningHubActive).toBe(false);
    });
  });

  describe('2. Specific Match Priority & Sub-route Behavior', () => {
    it('/planning/dashboard activates /planning/dashboard and NOT /planning', () => {
      const currentPath = '/planning/dashboard';

      expect(isItemActive('/planning/dashboard', currentPath, planningGroupItems)).toBe(true);
      expect(isItemActive('/planning', currentPath, planningGroupItems)).toBe(false);
    });

    it('/planning activates /planning and NOT any sub-routes', () => {
      const currentPath = '/planning';

      expect(isItemActive('/planning', currentPath, planningGroupItems)).toBe(true);
      expect(isItemActive('/planning/activities', currentPath, planningGroupItems)).toBe(false);
      expect(isItemActive('/planning/dashboard', currentPath, planningGroupItems)).toBe(false);
    });

    it('sub-pages under /projects/123 activate /projects because no more specific nav item exists', () => {
      const currentPath = '/projects/00000000-0000-0000-0000-000000000001';

      expect(isItemActive('/projects', currentPath, projectsGroupItems)).toBe(true);
      expect(isItemActive('/projects/dashboard', currentPath, projectsGroupItems)).toBe(false);
      expect(isItemActive('/projects/new', currentPath, projectsGroupItems)).toBe(false);
    });

    it('deep sub-pages under /planning/activities/new activate /planning/activities and NOT /planning', () => {
      const currentPath = '/planning/activities/new';

      expect(isItemActive('/planning/activities', currentPath, planningGroupItems)).toBe(true);
      expect(isItemActive('/planning', currentPath, planningGroupItems)).toBe(false);
    });

    it('handles root href / gracefully without claiming all routes', () => {
      expect(isItemActive('/', '/dashboard', [{ href: '/' }, { href: '/dashboard' }])).toBe(false);
      expect(isItemActive('/', '/', [{ href: '/' }, { href: '/dashboard' }])).toBe(true);
    });

    it('works as expected when allGroupItems is empty or omitted', () => {
      // Exact match
      expect(isItemActive('/projects', '/projects')).toBe(true);
      // Prefix match without sibling comparison fallback
      expect(isItemActive('/projects', '/projects/dashboard')).toBe(true);
      // Non-matching
      expect(isItemActive('/projects', '/planning')).toBe(false);
    });
  });

  describe('3. TopNav Component Accessibility, Responsiveness & Contrast', () => {
    it('renders accessible navigation landmarks with role="navigation" and aria-label', () => {
      const html = renderToString(<TopNav isDark={false} onThemeToggle={() => {}} />);
      
      // Main navigation landmark
      expect(html).toContain('role="navigation"');
      expect(html).toContain('aria-label="التنقل الرئيسي"');

      // Sub-navigation landmark for active group
      expect(html).toContain('aria-label="التنقل الفرعي"');
    });

    it('renders user avatar menu trigger button with complete ARIA keyboard attributes', () => {
      const html = renderToString(<TopNav isDark={false} onThemeToggle={() => {}} />);

      // Avatar button attributes
      expect(html).toContain('id="user-menu-button"');
      expect(html).toContain('aria-haspopup="menu"');
      expect(html).toContain('aria-expanded="false"');
      expect(html).toContain('aria-controls="user-menu"');
      expect(html).toContain('focus-visible:ring-2');
    });

    it('renders mobile navigation trigger with aria-controls and focus-visible styling', () => {
      const html = renderToString(<TopNav isDark={false} onThemeToggle={() => {}} />);

      expect(html).toContain('aria-controls="mobile-nav-menu"');
      expect(html).toContain('focus-visible:ring-2');
      expect(html).toContain('focus-visible:ring-emerald-500');
    });

    it('applies high-contrast accessible active pill styles to active sub-nav item', async () => {
      const { usePathname } = await import('next/navigation');
      vi.mocked(usePathname).mockReturnValue('/dashboard');

      const html = renderToString(<TopNav isDark={false} onThemeToggle={() => {}} />);

      // AAA compliant contrast pill styling
      expect(html).toContain('bg-emerald-100');
      expect(html).toContain('text-emerald-900');
      expect(html).toContain('dark:text-emerald-200');
      expect(html).toContain('dark:bg-emerald-950/90');
      expect(html).toContain('aria-current="page"');
    });

    it('includes RTL-aware scroll affordance gradients in sub-navigation', () => {
      const html = renderToString(<TopNav isDark={false} onThemeToggle={() => {}} />);

      // RTL gradient fades for scroll start and end edges
      expect(html).toContain('rtl:bg-gradient-to-l');
      expect(html).toContain('rtl:bg-gradient-to-r');
    });
  });
});
