import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPush = vi.fn();
const mockReplace = vi.fn();

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  redirect: vi.fn(),
}));

// Mock Language Context & Auth Store
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
    roles: ['project_manager'],
    isAdmin: false,
    isCoo: false,
    isCooAssistant: false,
    isLoading: false,
    hasRole: vi.fn((r) => r === 'project_manager'),
  })),
}));

vi.mock('@/lib/hooks/useModuleAccess', () => ({
  useModuleAccess: vi.fn(() => ({
    data: null,
    isLoading: false,
  })),
}));

// Mock Supabase module
vi.mock('@/lib/supabase', () => {
  const createMockChain = () => {
    const chain: Record<string, any> = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn().mockImplementation((onfulfilled) =>
        Promise.resolve({ data: [], error: null }).then(onfulfilled)
      ),
    };
    return chain;
  };

  return {
    supabase: {
      from: vi.fn(() => createMockChain()),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn().mockResolvedValue({ data: { path: 'test' }, error: null }),
          getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/file' } })),
        })),
      },
    },
  };
});

import { RoleRoutingService, ROLE_ROUTE_REGISTRY, CanonicalRole } from '@/lib/services/roleRouting.service';
import { canAccessPath, canEditPath, allowedRolesForPath, ACTIVE_MODULE_ACCESS } from '@/lib/rbac/access-control';
import { useRoleRedirect } from '@/lib/hooks/useRoleRedirect';
import PMDashboardPage from '@/app/(dashboard)/pm-dashboard/page';
import TODashboardPage from '@/app/(dashboard)/to-dashboard/page';
import TOTasksPage from '@/app/(dashboard)/to-tasks/page';
import QCDashboardPage from '@/app/(dashboard)/qc-dashboard/page';
import COOExecutiveDashboardPage from '@/app/(dashboard)/coo/page';
import HomePage from '@/app/(dashboard)/page';

describe('Milestone M5: Role-Based Navigation & Dedicated Dashboards (WS-7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. Role Detection & Route Mapping (RoleRoutingService)
  // =========================================================================
  describe('1. Canonical Role Routing Registry & Mapping (WS-7)', () => {
    it('defines accurate home paths, priorities, and bilingual labels for all 9 canonical roles', () => {
      const canonicalRoles: CanonicalRole[] = [
        'admin',
        'ceo',
        'coo',
        'planning_manager',
        'project_manager',
        'technical_office',
        'planning_engineer',
        'site_engineer',
        'qc_inspector',
      ];

      canonicalRoles.forEach((role) => {
        const config = ROLE_ROUTE_REGISTRY[role];
        expect(config).toBeDefined();
        expect(config.role).toBe(role);
        expect(config.homePath).toMatch(/^\/[a-z0-9\-_/]+$/);
        expect(config.labelAr).toBeTruthy();
        expect(config.labelEn).toBeTruthy();
        expect(config.priority).toBeGreaterThan(0);
      });
    });

    it('maps every canonical role to its designated dedicated dashboard route', () => {
      expect(RoleRoutingService.getHomePath('admin')).toBe('/system-admin');
      expect(RoleRoutingService.getHomePath('ceo')).toBe('/coo');
      expect(RoleRoutingService.getHomePath('coo')).toBe('/coo');
      expect(RoleRoutingService.getHomePath('planning_manager')).toBe('/planning/dashboard');
      expect(RoleRoutingService.getHomePath('project_manager')).toBe('/pm-dashboard');
      expect(RoleRoutingService.getHomePath('technical_office')).toBe('/to-dashboard');
      expect(RoleRoutingService.getHomePath('planning_engineer')).toBe('/planning');
      expect(RoleRoutingService.getHomePath('site_engineer')).toBe('/site-workspace');
      expect(RoleRoutingService.getHomePath('qc_inspector')).toBe('/qc-dashboard');
    });

    it('resolves multi-role users by strict priority order', () => {
      // 1: admin > 2: ceo > 3: coo > 4: planning_manager > 5: pm > 6: to > 7: planning_eng > 8: site_eng > 9: qc
      expect(RoleRoutingService.getHomePath(['site_engineer', 'project_manager'])).toBe('/pm-dashboard');
      expect(RoleRoutingService.getHomePath(['technical_office', 'coo'])).toBe('/coo');
      expect(RoleRoutingService.getHomePath(['qc_inspector', 'planning_manager'])).toBe('/planning/dashboard');
      expect(RoleRoutingService.getHomePath(['qc_inspector', 'technical_office'])).toBe('/to-dashboard');
      expect(RoleRoutingService.getHomePath(['site_engineer', 'planning_engineer'])).toBe('/planning');
    });

    it('admin override flag always routes to /system-admin regardless of roles array', () => {
      expect(RoleRoutingService.getHomePath(['site_engineer'], true)).toBe('/system-admin');
      expect(RoleRoutingService.getHomePath([], true)).toBe('/system-admin');
      expect(RoleRoutingService.getHomePath(null, true)).toBe('/system-admin');
    });

    it('normalizes legacy and alias role strings robustly', () => {
      expect(RoleRoutingService.normalizeRole('  SUPER_ADMIN  ')).toBe('admin');
      expect(RoleRoutingService.normalizeRole('lead-pm')).toBe('project_manager');
      expect(RoleRoutingService.normalizeRole('to_engineer')).toBe('technical_office');
      expect(RoleRoutingService.normalizeRole('to_manager')).toBe('technical_office');
      expect(RoleRoutingService.normalizeRole('qa_qc')).toBe('qc_inspector');
      expect(RoleRoutingService.normalizeRole('quality_control')).toBe('qc_inspector');
      expect(RoleRoutingService.normalizeRole('operations_director')).toBe('coo');
      expect(RoleRoutingService.normalizeRole('chairman')).toBe('ceo');
      expect(RoleRoutingService.normalizeRole('head_of_planning')).toBe('planning_manager');
      expect(RoleRoutingService.normalizeRole('planner')).toBe('planning_engineer');
      expect(RoleRoutingService.normalizeRole('construction_engineer')).toBe('site_engineer');
      expect(RoleRoutingService.normalizeRole('unknown_role')).toBeNull();
    });

    it('defaults unknown or empty roles to /projects fallback path', () => {
      expect(RoleRoutingService.getHomePath([])).toBe('/projects');
      expect(RoleRoutingService.getHomePath(null)).toBe('/projects');
      expect(RoleRoutingService.getHomePath(['guest', 'visitor'])).toBe('/projects');
    });
  });

  // =========================================================================
  // 2. RBAC Access Control Permissions (canAccessPath)
  // =========================================================================
  describe('2. RBAC Module Access Control on Dedicated Dashboards (WS-7)', () => {
    it('verifies ACTIVE_MODULE_ACCESS contains all 5 dedicated role landing routes', () => {
      expect(ACTIVE_MODULE_ACCESS['/pm-dashboard']).toBeDefined();
      expect(ACTIVE_MODULE_ACCESS['/to-dashboard']).toBeDefined();
      expect(ACTIVE_MODULE_ACCESS['/to-tasks']).toBeDefined();
      expect(ACTIVE_MODULE_ACCESS['/qc-dashboard']).toBeDefined();
      expect(ACTIVE_MODULE_ACCESS['/coo']).toBeDefined();
    });

    it('enforces RBAC permissions for Project Manager Dashboard (/pm-dashboard)', () => {
      expect(canAccessPath('/pm-dashboard', ['project_manager'], false)).toBe(true);
      expect(canAccessPath('/pm-dashboard', ['planning_manager'], false)).toBe(true);
      expect(canAccessPath('/pm-dashboard', ['coo'], false)).toBe(true);
      expect(canAccessPath('/pm-dashboard', ['admin'], false)).toBe(true);
      expect(canAccessPath('/pm-dashboard', [], true)).toBe(true);

      // Unauthorized roles
      expect(canAccessPath('/pm-dashboard', ['site_engineer'], false)).toBe(false);
      expect(canAccessPath('/pm-dashboard', ['qc_inspector'], false)).toBe(false);
      expect(canAccessPath('/pm-dashboard', ['estimator'], false)).toBe(false);
    });

    it('enforces RBAC permissions for Technical Office Manager Hub (/to-dashboard)', () => {
      expect(canAccessPath('/to-dashboard', ['technical_office'], false)).toBe(true);
      expect(canAccessPath('/to-dashboard', ['project_manager'], false)).toBe(true);
      expect(canAccessPath('/to-dashboard', ['coo'], false)).toBe(true);
      expect(canAccessPath('/to-dashboard', [], true)).toBe(true);

      // Unauthorized roles
      expect(canAccessPath('/to-dashboard', ['site_engineer'], false)).toBe(false);
      expect(canAccessPath('/to-dashboard', ['qc_inspector'], false)).toBe(false);
    });

    it('enforces RBAC permissions for Technical Office Engineer Workspace (/to-tasks)', () => {
      expect(canAccessPath('/to-tasks', ['technical_office'], false)).toBe(true);
      expect(canAccessPath('/to-tasks', ['project_manager'], false)).toBe(true);
      expect(canAccessPath('/to-tasks', ['admin'], false)).toBe(true);

      // Unauthorized roles
      expect(canAccessPath('/to-tasks', ['site_engineer'], false)).toBe(false);
      expect(canAccessPath('/to-tasks', ['qc_inspector'], false)).toBe(false);
    });

    it('enforces RBAC permissions for QC Inspector Dashboard (/qc-dashboard)', () => {
      expect(canAccessPath('/qc-dashboard', ['qc_inspector'], false)).toBe(true);
      expect(canAccessPath('/qc-dashboard', ['qc_engineer'], false)).toBe(true);
      expect(canAccessPath('/qc-dashboard', ['project_manager'], false)).toBe(true);
      expect(canAccessPath('/qc-dashboard', ['admin'], false)).toBe(true);

      // Unauthorized roles
      expect(canAccessPath('/qc-dashboard', ['site_engineer'], false)).toBe(false);
      expect(canAccessPath('/qc-dashboard', ['commercial_manager'], false)).toBe(false);
    });

    it('enforces RBAC permissions for Planning Site Tasks Control (/planning/site-tasks)', () => {
      expect(canAccessPath('/planning/site-tasks', ['planning_engineer'], false)).toBe(true);
      expect(canAccessPath('/planning/site-tasks', ['planning_manager'], false)).toBe(true);
      expect(canAccessPath('/planning/site-tasks', ['project_manager'], false)).toBe(true);
      expect(canAccessPath('/planning/site-tasks', ['admin'], false)).toBe(true);

      // Unauthorized roles
      expect(canAccessPath('/planning/site-tasks', ['site_engineer'], false)).toBe(false);
    });

    it('enforces RBAC permissions for Executive COO Command Center (/coo)', () => {
      expect(canAccessPath('/coo', ['coo'], false)).toBe(true);
      expect(canAccessPath('/coo', ['ceo'], false)).toBe(true);
      expect(canAccessPath('/coo', ['chairman'], false)).toBe(true);
      expect(canAccessPath('/coo', [], true)).toBe(true);

      // Unauthorized roles
      expect(canAccessPath('/coo', ['project_manager'], false)).toBe(false);
      expect(canAccessPath('/coo', ['site_engineer'], false)).toBe(false);
      expect(canAccessPath('/coo', ['technical_office'], false)).toBe(false);
      expect(canAccessPath('/coo', ['qc_inspector'], false)).toBe(false);
    });

    it('enforces edit roles on role dashboard subroutes', () => {
      expect(canEditPath('/pm-dashboard', ['project_manager'], false)).toBe(true);
      expect(canEditPath('/pm-dashboard', ['site_engineer'], false)).toBe(false);
      expect(canEditPath('/to-dashboard', ['technical_office'], false)).toBe(true);
      expect(canEditPath('/to-dashboard', ['site_engineer'], false)).toBe(false);
      expect(canEditPath('/qc-dashboard', ['qc_inspector'], false)).toBe(true);
      expect(canEditPath('/coo', ['coo'], false)).toBe(true);
    });
  });

  // =========================================================================
  // 3. Page Component Structural & Export Verification
  // =========================================================================
  describe('3. Dedicated Dashboard Page Components Integrity', () => {
    it('exports valid React functional components for all 5 role landing pages and HomePage', () => {
      expect(typeof PMDashboardPage).toBe('function');
      expect(typeof TODashboardPage).toBe('function');
      expect(typeof TOTasksPage).toBe('function');
      expect(typeof QCDashboardPage).toBe('function');
      expect(typeof COOExecutiveDashboardPage).toBe('function');
      expect(typeof HomePage).toBe('function');
    });
  });

  // =========================================================================
  // 4. Role-Based Navigation Route Access Helpers
  // =========================================================================
  describe('4. RoleRoutingService Access Verification Rules', () => {
    it('verifies canAccess matches access rules for all roles', () => {
      expect(RoleRoutingService.canAccess('/pm-dashboard', ['project_manager'])).toBe(true);
      expect(RoleRoutingService.canAccess('/pm-dashboard', ['planning_manager'])).toBe(true);
      expect(RoleRoutingService.canAccess('/pm-dashboard', ['site_engineer'])).toBe(false);

      expect(RoleRoutingService.canAccess('/to-dashboard', ['technical_office'])).toBe(true);
      expect(RoleRoutingService.canAccess('/to-tasks', ['technical_office'])).toBe(true);
      expect(RoleRoutingService.canAccess('/to-dashboard', ['qc_inspector'])).toBe(false);

      expect(RoleRoutingService.canAccess('/qc-dashboard', ['qc_inspector'])).toBe(true);
      expect(RoleRoutingService.canAccess('/qc-dashboard', ['site_engineer'])).toBe(false);

      expect(RoleRoutingService.canAccess('/coo', ['coo'])).toBe(true);
      expect(RoleRoutingService.canAccess('/coo', ['ceo'])).toBe(true);
      expect(RoleRoutingService.canAccess('/coo', ['project_manager'])).toBe(false);
    });
  });
});
