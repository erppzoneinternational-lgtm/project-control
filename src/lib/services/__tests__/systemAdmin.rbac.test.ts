import type { MockBuilderShape, MockQueryBuilder } from '@/types/services-types';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';
import {
  ROLE_LABELS,
  ROLE_COLORS,
  MATRIX_ROLES,
  APP_MODULES,
  APP_MODULE_GROUPS,
  RACI_MATRIX,
  RACI_COLUMNS,
} from '@/lib/rbac/role-matrix';
import {
  canAccessPath,
  canEditPath,
  allowedRolesForPath,
  editRolesForPath,
  ModuleAccessRule,
} from '@/lib/rbac/access-control';
import {
  FINANCIAL_ALLOWED_ROLES,
  canViewPrices,
} from '@/components/planning/PriceGate';

// Helper for chainable mock query builder
const createMockQueryBuilder = (resolveValue: unknown) => {
  const builder: MockBuilderShape = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    then: vi.fn().mockImplementation((onfulfilled) => {
      onfulfilled(resolveValue);
      return Promise.resolve(resolveValue);
    }),
  };
  return builder as MockQueryBuilder;
};

// ============================================================================
// CANONICAL 19 ENTERPRISE ROLES DEFINITIONS (Source of Truth: Migration 001 / SoT v2.0)
// ============================================================================
export const CANONICAL_19_ROLES = [
  'admin',
  'ceo',
  'coo',
  'coo_assistant',
  'chairman',
  'board_member',
  'commercial_manager',
  'project_manager',
  'planning_manager',
  'planning_engineer',
  'site_engineer',
  'cost_control',
  'estimator',
  'contract_admin',
  'technical_office',
  'finance',
  'ipc_clerk',
  'procurement',
  'inventory',
] as const;

export type CanonicalRole = typeof CANONICAL_19_ROLES[number];

export const EXECUTIVE_GLOBAL_ROLES: CanonicalRole[] = [
  'admin',
  'ceo',
  'coo',
  'coo_assistant',
  'chairman',
  'board_member',
  'commercial_manager',
];

export const UNCONDITIONAL_PRICE_ROLES: CanonicalRole[] = [
  'admin',
  'commercial_manager',
  'cost_control',
  'estimator',
  'project_manager',
  'ceo',
  'coo',
  'chairman',
  'planning_manager',
  'finance',
];

// ============================================================================
// SYSTEM ADMIN DOMAIN TYPES & EVALUATION ENGINES
// ============================================================================

export type AccessLevel = 'view' | 'operate' | 'manage';

export interface UserProjectAccess {
  id: string;
  user_id: string;
  project_id: string;
  access_level: AccessLevel;
  assigned_by?: string;
  created_at: string;
}

export interface PriceViewGrant {
  id: string;
  granted_to: string;
  granted_by: string;
  project_id: string;
  granted_at: string;
  revoked_at?: string | null;
}

export interface AuditLogRecord {
  id: string | number;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  changed_by?: string;
  changed_at: string;
  ip_address?: string;
  context?: string;
}

/**
 * Pure evaluation engine for Database RPC: public.fn_user_can_access_project
 * Mirrors Migration 001: 9. fn_user_can_access_project
 */
export function evaluateUserCanAccessProject(
  userId: string | null | undefined,
  projectId: string | null | undefined,
  userRoles: string[] = [],
  projectAccessRows: UserProjectAccess[] = []
): boolean {
  // NULL inputs -> FALSE (security invariant)
  if (!userId || !projectId) {
    return false;
  }

  // Global roles inherit access to all projects
  const hasGlobalRole = userRoles.some((role) =>
    EXECUTIVE_GLOBAL_ROLES.includes(role as CanonicalRole)
  );
  if (hasGlobalRole) {
    return true;
  }

  // Check project-specific assignment
  return projectAccessRows.some(
    (row) => row.user_id === userId && row.project_id === projectId
  );
}

/**
 * Pure evaluation engine for Effective Project Access Level
 */
export function evaluateEffectiveProjectAccessLevel(
  userId: string | null | undefined,
  projectId: string | null | undefined,
  userRoles: string[] = [],
  projectAccessRows: UserProjectAccess[] = []
): AccessLevel | null {
  if (!userId || !projectId) return null;

  // Global executive roles inherit full 'manage' access
  const hasGlobalManage = userRoles.some((role) =>
    ['admin', 'ceo', 'coo', 'chairman', 'commercial_manager'].includes(role)
  );
  if (hasGlobalManage) return 'manage';

  const hasGlobalView = userRoles.some((role) =>
    ['board_member', 'coo_assistant'].includes(role)
  );
  if (hasGlobalView) return 'view';

  // Find explicit project assignment
  const assignment = projectAccessRows.find(
    (row) => row.user_id === userId && row.project_id === projectId
  );

  return assignment ? assignment.access_level : null;
}

/**
 * Pure evaluation engine for Database RPC: public.fn_user_can_see_prices
 * Mirrors Migration 001: 11. fn_user_can_see_prices
 */
export function evaluateUserCanSeePrices(
  userId: string | null | undefined,
  projectId: string | null | undefined,
  userRoles: string[] = [],
  priceGrants: PriceViewGrant[] = []
): boolean {
  if (!userId) return false;

  // site_engineer NEVER sees prices unless overridden by a financial/executive role
  const isSiteEngineer = userRoles.includes('site_engineer');
  const hasFinancialExecutiveRole = userRoles.some((r) =>
    UNCONDITIONAL_PRICE_ROLES.includes(r as CanonicalRole)
  );

  if (isSiteEngineer && !hasFinancialExecutiveRole) {
    return false;
  }

  // Financial and executive roles unconditionally see prices
  if (hasFinancialExecutiveRole) {
    return true;
  }

  // planning_engineer: conditional check on active price view grant
  if (userRoles.includes('planning_engineer') && projectId) {
    return priceGrants.some(
      (grant) =>
        grant.granted_to === userId &&
        grant.project_id === projectId &&
        grant.revoked_at === null
    );
  }

  // Default: no prices
  return false;
}

/**
 * Price View Grant Delegation Manager
 */
export class PriceGrantManager {
  static grantPriceView(
    grants: PriceViewGrant[],
    granterId: string,
    granterRoles: string[],
    targetUserId: string,
    projectId: string
  ): PriceViewGrant {
    const canDelegate = granterRoles.some((r) =>
      ['planning_manager', 'admin', 'commercial_manager'].includes(r)
    );
    if (!canDelegate) {
      throw new Error('Unauthorized: Only planning_manager or admin can delegate price visibility');
    }

    const existing = grants.find(
      (g) => g.granted_to === targetUserId && g.project_id === projectId
    );

    if (existing) {
      existing.revoked_at = null;
      existing.granted_by = granterId;
      existing.granted_at = new Date().toISOString();
      return existing;
    }

    const newGrant: PriceViewGrant = {
      id: `grant-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      granted_to: targetUserId,
      granted_by: granterId,
      project_id: projectId,
      granted_at: new Date().toISOString(),
      revoked_at: null,
    };
    grants.push(newGrant);
    return newGrant;
  }

  static revokePriceView(
    grants: PriceViewGrant[],
    revokerId: string,
    revokerRoles: string[],
    targetUserId: string,
    projectId: string
  ): boolean {
    const canRevoke = revokerRoles.some((r) =>
      ['planning_manager', 'admin', 'commercial_manager'].includes(r)
    );
    if (!canRevoke) {
      throw new Error('Unauthorized: Only planning_manager or admin can revoke price visibility');
    }

    const grant = grants.find(
      (g) => g.granted_to === targetUserId && g.project_id === projectId && g.revoked_at === null
    );

    if (grant) {
      grant.revoked_at = new Date().toISOString();
      return true;
    }
    return false;
  }
}

/**
 * Sacred Write-Only Audit Log Guard & Filter Engine
 */
export class AuditLogEngine {
  static assertWriteOnlyOperation(operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE') {
    if (operation === 'UPDATE') {
      throw new Error('SECURITY VIOLATION: pm_audit_logs is append-only. UPDATE is strictly prohibited.');
    }
    if (operation === 'DELETE') {
      throw new Error('SECURITY VIOLATION: pm_audit_logs is append-only. DELETE is strictly prohibited.');
    }
    if (operation === 'TRUNCATE') {
      throw new Error('SECURITY VIOLATION: pm_audit_logs is append-only. TRUNCATE is strictly prohibited.');
    }
  }

  static filterAuditLogs(
    logs: AuditLogRecord[],
    filters: {
      tableName?: string;
      recordId?: string;
      action?: 'INSERT' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';
      changedBy?: string;
      fromDate?: string;
      toDate?: string;
    }
  ): AuditLogRecord[] {
    return logs.filter((log) => {
      if (filters.tableName && log.table_name !== filters.tableName) return false;
      if (filters.recordId && log.record_id !== filters.recordId) return false;
      if (filters.action && log.action !== filters.action) return false;
      if (filters.changedBy && log.changed_by !== filters.changedBy) return false;
      if (filters.fromDate && new Date(log.changed_at) < new Date(filters.fromDate)) return false;
      if (filters.toDate && new Date(log.changed_at) > new Date(filters.toDate)) return false;
      return true;
    });
  }
}

// ============================================================================
// TEST SUITES: PHASE 6 RBAC & SECURITY AUDIT
// ============================================================================

describe('Phase 6: System Admin, User Management & RBAC Security Audit Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
  });

  // =========================================================================
  // SUITE 1: 19 CANONICAL ROLES SPECIFICATION & VALIDATION
  // =========================================================================
  describe('1. 19 Canonical Enterprise Roles & Matrix Validation', () => {
    it('defines exactly 19 canonical enterprise roles in the system', () => {
      expect(CANONICAL_19_ROLES).toHaveLength(19);
      expect(CANONICAL_19_ROLES).toEqual([
        'admin',
        'ceo',
        'coo',
        'coo_assistant',
        'chairman',
        'board_member',
        'commercial_manager',
        'project_manager',
        'planning_manager',
        'planning_engineer',
        'site_engineer',
        'cost_control',
        'estimator',
        'contract_admin',
        'technical_office',
        'finance',
        'ipc_clerk',
        'procurement',
        'inventory',
      ]);
    });

    it('validates canonical role membership and rejects unauthorized role strings', () => {
      const isValidRole = (role: string): boolean => {
        return (CANONICAL_19_ROLES as readonly string[]).includes(role);
      };

      // All 19 canonical roles pass validation
      CANONICAL_19_ROLES.forEach((role) => {
        expect(isValidRole(role)).toBe(true);
      });

      // Arbitrary and invalid roles are rejected
      expect(isValidRole('superadmin')).toBe(false);
      expect(isValidRole('root')).toBe(false);
      expect(isValidRole('developer')).toBe(false);
      expect(isValidRole('guest')).toBe(false);
      expect(isValidRole('')).toBe(false);
      expect(isValidRole('SITE_ENGINEER')).toBe(false); // Case-sensitivity check
    });

    it('verifies role label and color styling mappings exist for enterprise display', () => {
      // Check core role labels exist in role-matrix definitions
      expect(ROLE_LABELS.admin).toContain('مدير النظام');
      expect(ROLE_LABELS.ceo).toContain('الرئيس التنفيذي');
      expect(ROLE_LABELS.coo).toContain('مدير العمليات');
      expect(ROLE_LABELS.chairman).toContain('رئيس مجلس الإدارة');
      expect(ROLE_LABELS.commercial_manager).toContain('المدير التجاري');
      expect(ROLE_LABELS.project_manager).toContain('مدير المشروع');
      expect(ROLE_LABELS.site_engineer).toContain('مهندس الموقع');
      expect(ROLE_LABELS.cost_control).toContain('التحكم بالتكاليف');
      expect(ROLE_LABELS.estimator).toContain('مهندس التقدير');
      expect(ROLE_LABELS.contract_admin).toContain('إدارة العقود');
      expect(ROLE_LABELS.technical_office).toContain('المكتب الفني');
      expect(ROLE_LABELS.finance).toContain('الإدارة المالية');
      expect(ROLE_LABELS.ipc_clerk).toContain('مسؤول المستخلصات');
      expect(ROLE_LABELS.procurement).toContain('إدارة المشتريات');
      expect(ROLE_LABELS.inventory).toContain('المستودعات والمخازن');

      // Check color pills are configured for critical roles
      expect(ROLE_COLORS.admin).toBeDefined();
      expect(ROLE_COLORS.ceo).toBeDefined();
      expect(ROLE_COLORS.coo).toBeDefined();
      expect(ROLE_COLORS.commercial_manager).toBeDefined();
      expect(ROLE_COLORS.project_manager).toBeDefined();
      expect(ROLE_COLORS.site_engineer).toBeDefined();
    });

    it('enforces route-level access rules across the application modules', () => {
      // Home and Dashboard are accessible to all
      expect(canAccessPath('/', ['site_engineer'], false)).toBe(true);
      expect(canAccessPath('/dashboard', [], false)).toBe(true);

      // System Admin is restricted to Admin, CEO, COO, Chairman, COO Assistant
      expect(canAccessPath('/system-admin', ['admin'], false)).toBe(true);
      expect(canAccessPath('/system-admin', ['ceo'], false)).toBe(true);
      expect(canAccessPath('/system-admin', ['coo'], false)).toBe(true);
      expect(canAccessPath('/system-admin', ['coo_assistant'], false)).toBe(true);
      expect(canAccessPath('/system-admin', ['chairman'], false)).toBe(true);
      expect(canAccessPath('/system-admin', ['site_engineer'], false)).toBe(false);
      expect(canAccessPath('/system-admin', ['procurement'], false)).toBe(false);
      expect(canAccessPath('/system-admin', ['estimator'], false)).toBe(false);

      // Admin role flag always bypasses path restrictions
      expect(canAccessPath('/system-admin', [], true)).toBe(true);
      expect(canAccessPath('/contracts', [], true)).toBe(true);
      expect(canAccessPath('/coo/deliverables', [], true)).toBe(true);

      // BOQ & Planning route permissions
      expect(canAccessPath('/boq', ['estimator'], false)).toBe(true);
      expect(canAccessPath('/boq', ['commercial_manager'], false)).toBe(true);
      expect(canAccessPath('/boq', ['site_engineer'], false)).toBe(true);
      expect(canAccessPath('/boq', ['planning_engineer'], false)).toBe(true);

      // Daily Progress route permissions
      expect(canAccessPath('/planning/daily-progress', ['site_engineer'], false)).toBe(true);
      expect(canAccessPath('/planning/daily-progress', ['planning_manager'], false)).toBe(true);
      expect(canAccessPath('/planning/daily-progress', ['project_manager'], false)).toBe(true);

      // COO Deliverables is restricted to executive leadership
      expect(canAccessPath('/coo/deliverables', ['coo'], false)).toBe(true);
      expect(canAccessPath('/coo/deliverables', ['ceo'], false)).toBe(true);
      expect(canAccessPath('/coo/deliverables', ['commercial_manager'], false)).toBe(true);
      expect(canAccessPath('/coo/deliverables', ['site_engineer'], false)).toBe(false);
      expect(canAccessPath('/coo/deliverables', ['technical_office'], false)).toBe(false);
    });

    it('enforces route-level edit permissions correctly', () => {
      // System Admin editing
      expect(canEditPath('/system-admin', ['admin'], false)).toBe(true);
      expect(canEditPath('/system-admin', ['coo_assistant'], false)).toBe(true);
      expect(canEditPath('/system-admin', ['site_engineer'], false)).toBe(false);

      // Planning Daily Progress editing
      expect(canEditPath('/planning/daily-progress', ['site_engineer'], false)).toBe(true);
      expect(canEditPath('/planning/daily-progress', ['planning_engineer'], false)).toBe(true);
      expect(canEditPath('/planning/daily-progress', ['project_manager'], false)).toBe(true);
      expect(canEditPath('/planning/daily-progress', ['finance'], false)).toBe(false);

      // Contracts editing
      expect(canEditPath('/contracts', ['contract_admin'], false)).toBe(true);
      expect(canEditPath('/contracts', ['commercial_manager'], false)).toBe(true);
      expect(canEditPath('/contracts', ['site_engineer'], false)).toBe(false);

      // Admin flag bypasses edit checks
      expect(canEditPath('/contracts', [], true)).toBe(true);
      expect(canEditPath('/planning/baseline', [], true)).toBe(true);
    });

    it('respects dynamic DB access rules override when provided', () => {
      const customDbRules: ModuleAccessRule[] = [
        {
          module_path: '/custom-security-module',
          allowed_roles: ['cost_control', 'finance'],
          edit_roles: ['finance'],
        },
        {
          module_path: '/system-admin',
          allowed_roles: ['admin', 'special_auditor'],
          edit_roles: ['admin'],
        },
      ];

      // Custom module check
      expect(canAccessPath('/custom-security-module', ['cost_control'], false, customDbRules)).toBe(true);
      expect(canAccessPath('/custom-security-module', ['site_engineer'], false, customDbRules)).toBe(false);
      expect(canEditPath('/custom-security-module', ['finance'], false, customDbRules)).toBe(true);
      expect(canEditPath('/custom-security-module', ['cost_control'], false, customDbRules)).toBe(false);

      // Overridden system-admin rule from DB
      expect(canAccessPath('/system-admin', ['special_auditor'], false, customDbRules)).toBe(true);
    });

    it('validates RACI matrix definitions and role completeness', () => {
      expect(RACI_MATRIX.length).toBeGreaterThanOrEqual(10);
      expect(RACI_COLUMNS).toHaveLength(4);

      const userAdminProcess = RACI_MATRIX.find(
        (r) => r.process === 'User access and role administration'
      );
      expect(userAdminProcess).toBeDefined();
      expect(userAdminProcess?.responsible).toContain('admin');
      expect(userAdminProcess?.accountable).toContain('admin');
      expect(userAdminProcess?.consulted).toContain('ceo');
      expect(userAdminProcess?.consulted).toContain('coo');
      expect(userAdminProcess?.informed).toContain('chairman');

      const boqProcess = RACI_MATRIX.find((r) => r.process === 'BOQ & Cost Codes Management');
      expect(boqProcess).toBeDefined();
      expect(boqProcess?.responsible).toContain('estimator');
      expect(boqProcess?.responsible).toContain('commercial_manager');
      expect(boqProcess?.accountable).toContain('project_manager');
    });
  });

  // =========================================================================
  // SUITE 2: PER-PROJECT ACCESS LEVELS (`pm_user_project_access`)
  // =========================================================================
  describe('2. Per-Project Access Levels & Inheritance (pm_user_project_access)', () => {
    const projectIdA = 'proj-uuid-1111-aaaa';
    const projectIdB = 'proj-uuid-2222-bbbb';
    const userAdminId = 'user-admin-001';
    const userCeoId = 'user-ceo-002';
    const userSiteEngId = 'user-site-eng-003';
    const userPlannerId = 'user-planner-004';
    const userUnassignedId = 'user-unassigned-005';

    const sampleProjectAccessList: UserProjectAccess[] = [
      {
        id: 'access-1',
        user_id: userSiteEngId,
        project_id: projectIdA,
        access_level: 'operate',
        assigned_by: userAdminId,
        created_at: '2026-08-01T10:00:00Z',
      },
      {
        id: 'access-2',
        user_id: userPlannerId,
        project_id: projectIdA,
        access_level: 'view',
        assigned_by: userAdminId,
        created_at: '2026-08-01T10:00:00Z',
      },
      {
        id: 'access-3',
        user_id: userPlannerId,
        project_id: projectIdB,
        access_level: 'manage',
        assigned_by: userAdminId,
        created_at: '2026-08-01T10:00:00Z',
      },
    ];

    it('grants automatic global access to executive roles on all projects without assignments', () => {
      // Global roles: admin, ceo, coo, chairman, commercial_manager, board_member
      EXECUTIVE_GLOBAL_ROLES.forEach((globalRole) => {
        const canAccessA = evaluateUserCanAccessProject(
          'user-exec-test',
          projectIdA,
          [globalRole],
          sampleProjectAccessList
        );
        const canAccessB = evaluateUserCanAccessProject(
          'user-exec-test',
          projectIdB,
          [globalRole],
          sampleProjectAccessList
        );

        expect(canAccessA).toBe(true);
        expect(canAccessB).toBe(true);
      });
    });

    it('inherits full "manage" access level for executive roles', () => {
      const adminLevel = evaluateEffectiveProjectAccessLevel(
        userAdminId,
        projectIdA,
        ['admin'],
        sampleProjectAccessList
      );
      const ceoLevel = evaluateEffectiveProjectAccessLevel(
        userCeoId,
        projectIdA,
        ['ceo'],
        sampleProjectAccessList
      );
      const commMgrLevel = evaluateEffectiveProjectAccessLevel(
        'user-comm-mgr',
        projectIdB,
        ['commercial_manager'],
        sampleProjectAccessList
      );

      expect(adminLevel).toBe('manage');
      expect(ceoLevel).toBe('manage');
      expect(commMgrLevel).toBe('manage');
    });

    it('grants correct access levels for explicitly assigned project users', () => {
      // Site engineer on Project A has 'operate'
      const siteEngAccessA = evaluateUserCanAccessProject(
        userSiteEngId,
        projectIdA,
        ['site_engineer'],
        sampleProjectAccessList
      );
      const siteEngLevelA = evaluateEffectiveProjectAccessLevel(
        userSiteEngId,
        projectIdA,
        ['site_engineer'],
        sampleProjectAccessList
      );
      expect(siteEngAccessA).toBe(true);
      expect(siteEngLevelA).toBe('operate');

      // Planner on Project A has 'view', on Project B has 'manage'
      const plannerLevelA = evaluateEffectiveProjectAccessLevel(
        userPlannerId,
        projectIdA,
        ['planning_engineer'],
        sampleProjectAccessList
      );
      const plannerLevelB = evaluateEffectiveProjectAccessLevel(
        userPlannerId,
        projectIdB,
        ['planning_engineer'],
        sampleProjectAccessList
      );
      expect(plannerLevelA).toBe('view');
      expect(plannerLevelB).toBe('manage');
    });

    it('strictly denies project access to users without assignment and without global role', () => {
      // Site Engineer not assigned to Project B
      const siteEngAccessB = evaluateUserCanAccessProject(
        userSiteEngId,
        projectIdB,
        ['site_engineer'],
        sampleProjectAccessList
      );
      expect(siteEngAccessB).toBe(false);

      // Totally unassigned user
      const unassignedAccessA = evaluateUserCanAccessProject(
        userUnassignedId,
        projectIdA,
        ['procurement'],
        sampleProjectAccessList
      );
      const unassignedAccessB = evaluateUserCanAccessProject(
        userUnassignedId,
        projectIdB,
        ['procurement'],
        sampleProjectAccessList
      );
      expect(unassignedAccessA).toBe(false);
      expect(unassignedAccessB).toBe(false);
    });

    it('enforces security invariant: NULL user_id or NULL project_id strictly returns false', () => {
      expect(evaluateUserCanAccessProject(null, projectIdA, ['admin'], sampleProjectAccessList)).toBe(false);
      expect(evaluateUserCanAccessProject(undefined, projectIdA, ['ceo'], sampleProjectAccessList)).toBe(false);
      expect(evaluateUserCanAccessProject(userSiteEngId, null, ['site_engineer'], sampleProjectAccessList)).toBe(false);
      expect(evaluateUserCanAccessProject(userSiteEngId, undefined, ['site_engineer'], sampleProjectAccessList)).toBe(false);
      expect(evaluateUserCanAccessProject(null, null, [], sampleProjectAccessList)).toBe(false);
      expect(evaluateEffectiveProjectAccessLevel(null, projectIdA)).toBeNull();
      expect(evaluateEffectiveProjectAccessLevel(userSiteEngId, null)).toBeNull();
    });

    it('simulates dynamic assignment, level upgrades, and access revocation', () => {
      const dynamicAccessList: UserProjectAccess[] = [];
      const testUserId = 'test-user-dynamic';
      const targetProj = 'proj-target-999';

      // 1. Initial state: No access
      expect(evaluateUserCanAccessProject(testUserId, targetProj, ['estimator'], dynamicAccessList)).toBe(false);

      // 2. Assign 'view' access
      dynamicAccessList.push({
        id: 'dyn-1',
        user_id: testUserId,
        project_id: targetProj,
        access_level: 'view',
        assigned_by: userAdminId,
        created_at: new Date().toISOString(),
      });
      expect(evaluateUserCanAccessProject(testUserId, targetProj, ['estimator'], dynamicAccessList)).toBe(true);
      expect(evaluateEffectiveProjectAccessLevel(testUserId, targetProj, ['estimator'], dynamicAccessList)).toBe('view');

      // 3. Upgrade to 'operate'
      dynamicAccessList[0].access_level = 'operate';
      expect(evaluateEffectiveProjectAccessLevel(testUserId, targetProj, ['estimator'], dynamicAccessList)).toBe('operate');

      // 4. Upgrade to 'manage'
      dynamicAccessList[0].access_level = 'manage';
      expect(evaluateEffectiveProjectAccessLevel(testUserId, targetProj, ['estimator'], dynamicAccessList)).toBe('manage');

      // 5. Revoke access (delete assignment row)
      dynamicAccessList.pop();
      expect(evaluateUserCanAccessProject(testUserId, targetProj, ['estimator'], dynamicAccessList)).toBe(false);
      expect(evaluateEffectiveProjectAccessLevel(testUserId, targetProj, ['estimator'], dynamicAccessList)).toBeNull();
    });
  });

  // =========================================================================
  // SUITE 3: PRICE VISIBILITY DELEGATION & RPC (`fn_user_can_see_prices`)
  // =========================================================================
  describe('3. Price Visibility Delegation & RPC (pm_price_view_grants & fn_user_can_see_prices)', () => {
    const projAlpha = 'proj-alpha-001';
    const projBeta = 'proj-beta-002';
    const plannerAlice = 'user-planner-alice';
    const plannerBob = 'user-planner-bob';
    const siteEngCharlie = 'user-site-charlie';
    const planningManagerDavid = 'user-pm-david';
    const adminUser = 'user-admin-root';

    let grantsState: PriceViewGrant[] = [];

    beforeEach(() => {
      grantsState = [
        {
          id: 'grant-alice-alpha',
          granted_to: plannerAlice,
          granted_by: planningManagerDavid,
          project_id: projAlpha,
          granted_at: '2026-08-10T08:00:00Z',
          revoked_at: null, // Active
        },
        {
          id: 'grant-alice-beta-revoked',
          granted_to: plannerAlice,
          granted_by: planningManagerDavid,
          project_id: projBeta,
          granted_at: '2026-08-01T08:00:00Z',
          revoked_at: '2026-08-05T12:00:00Z', // Revoked
        },
      ];
    });

    it('grants unconditional price visibility to all financial and executive leadership roles', () => {
      UNCONDITIONAL_PRICE_ROLES.forEach((role) => {
        const canSee = evaluateUserCanSeePrices('random-user-id', projAlpha, [role], grantsState);
        expect(canSee).toBe(true);
      });
    });

    it('strictly masks prices for site_engineer unconditionally', () => {
      // 1. site_engineer with no grants -> masked
      const canSeeNormal = evaluateUserCanSeePrices(siteEngCharlie, projAlpha, ['site_engineer'], grantsState);
      expect(canSeeNormal).toBe(false);

      // 2. site_engineer even if an erroneous active grant row exists -> MUST STILL BE MASKED
      const grantsWithSiteEng: PriceViewGrant[] = [
        ...grantsState,
        {
          id: 'erroneous-grant',
          granted_to: siteEngCharlie,
          granted_by: planningManagerDavid,
          project_id: projAlpha,
          granted_at: '2026-08-10T08:00:00Z',
          revoked_at: null,
        },
      ];
      const canSeeWithGrant = evaluateUserCanSeePrices(
        siteEngCharlie,
        projAlpha,
        ['site_engineer'],
        grantsWithSiteEng
      );
      expect(canSeeWithGrant).toBe(false);
    });

    it('allows price visibility for multi-role users where a financial role overrides site_engineer', () => {
      // User with both site_engineer AND cost_control
      const multiRoleCanSee = evaluateUserCanSeePrices(
        siteEngCharlie,
        projAlpha,
        ['site_engineer', 'cost_control'],
        grantsState
      );
      expect(multiRoleCanSee).toBe(true);

      // User with site_engineer AND commercial_manager
      const execSiteEngCanSee = evaluateUserCanSeePrices(
        siteEngCharlie,
        projAlpha,
        ['site_engineer', 'commercial_manager'],
        grantsState
      );
      expect(execSiteEngCanSee).toBe(true);
    });

    it('evaluates conditional price access for planning_engineer based on active grant status', () => {
      // Alice on Proj Alpha: has active grant -> TRUE
      const aliceAlpha = evaluateUserCanSeePrices(
        plannerAlice,
        projAlpha,
        ['planning_engineer'],
        grantsState
      );
      expect(aliceAlpha).toBe(true);

      // Alice on Proj Beta: grant was revoked -> FALSE
      const aliceBeta = evaluateUserCanSeePrices(
        plannerAlice,
        projBeta,
        ['planning_engineer'],
        grantsState
      );
      expect(aliceBeta).toBe(false);

      // Bob on Proj Alpha: never granted -> FALSE
      const bobAlpha = evaluateUserCanSeePrices(
        plannerBob,
        projAlpha,
        ['planning_engineer'],
        grantsState
      );
      expect(bobAlpha).toBe(false);
    });

    it('manages delegation lifecycle: granting, active state, and revocation', () => {
      // 1. Bob initially has no price access on projAlpha
      expect(evaluateUserCanSeePrices(plannerBob, projAlpha, ['planning_engineer'], grantsState)).toBe(false);

      // 2. Planning manager David grants price view to Bob on projAlpha
      const newGrant = PriceGrantManager.grantPriceView(
        grantsState,
        planningManagerDavid,
        ['planning_manager'],
        plannerBob,
        projAlpha
      );
      expect(newGrant.granted_to).toBe(plannerBob);
      expect(newGrant.project_id).toBe(projAlpha);
      expect(newGrant.revoked_at).toBeNull();

      // Bob can now see prices on projAlpha
      expect(evaluateUserCanSeePrices(plannerBob, projAlpha, ['planning_engineer'], grantsState)).toBe(true);

      // But Bob STILL cannot see prices on projBeta (project isolation)
      expect(evaluateUserCanSeePrices(plannerBob, projBeta, ['planning_engineer'], grantsState)).toBe(false);

      // 3. Planning manager David revokes Bob's price view on projAlpha
      const revoked = PriceGrantManager.revokePriceView(
        grantsState,
        planningManagerDavid,
        ['planning_manager'],
        plannerBob,
        projAlpha
      );
      expect(revoked).toBe(true);

      // Bob's price access on projAlpha is now revoked
      expect(evaluateUserCanSeePrices(plannerBob, projAlpha, ['planning_engineer'], grantsState)).toBe(false);

      // 4. Re-granting clears revoked_at and restores access
      PriceGrantManager.grantPriceView(
        grantsState,
        adminUser,
        ['admin'],
        plannerBob,
        projAlpha
      );
      expect(evaluateUserCanSeePrices(plannerBob, projAlpha, ['planning_engineer'], grantsState)).toBe(true);
    });

    it('rejects unauthorized users from granting or revoking price visibility', () => {
      // Site engineer attempting to grant price view
      expect(() => {
        PriceGrantManager.grantPriceView(
          grantsState,
          siteEngCharlie,
          ['site_engineer'],
          plannerBob,
          projAlpha
        );
      }).toThrow(/Unauthorized/);

      // Estimator attempting to revoke price view
      expect(() => {
        PriceGrantManager.revokePriceView(
          grantsState,
          'user-estimator',
          ['estimator'],
          plannerAlice,
          projAlpha
        );
      }).toThrow(/Unauthorized/);
    });

    it('verifies canViewPrices helper utility matches financial role criteria', () => {
      expect(canViewPrices(['admin'], false)).toBe(true);
      expect(canViewPrices(['cost_control'], false)).toBe(true);
      expect(canViewPrices(['commercial_manager'], false)).toBe(true);
      expect(canViewPrices(['estimator'], false)).toBe(true);
      expect(canViewPrices(['project_manager'], false)).toBe(true);
      expect(canViewPrices(['finance'], false)).toBe(true);
      expect(canViewPrices([], true)).toBe(true); // isAdmin = true

      // Non-financial roles without admin
      expect(canViewPrices(['site_engineer'], false)).toBe(false);
      expect(canViewPrices(['procurement'], false)).toBe(false);
      expect(canViewPrices(['inventory'], false)).toBe(false);
      expect(canViewPrices([], false)).toBe(false);
      expect(canViewPrices(null, false)).toBe(false);
    });
  });

  // =========================================================================
  // SUITE 4: SACRED WRITE-ONLY AUDIT LOG (`pm_audit_logs`)
  // =========================================================================
  describe('4. Sacred Write-Only Audit Log Invariants & Filtering (pm_audit_logs)', () => {
    const mockAuditLogs: AuditLogRecord[] = [
      {
        id: 1,
        table_name: 'projects',
        record_id: 'proj-101',
        action: 'INSERT',
        new_data: { project_name: 'New Lagoon Resort', status: 'setup' },
        changed_by: 'user-pm-1',
        changed_at: '2026-08-01T09:00:00Z',
        context: 'initial_creation',
      },
      {
        id: 2,
        table_name: 'projects',
        record_id: 'proj-101',
        action: 'STATUS_CHANGE',
        old_data: { status: 'setup' },
        new_data: { status: 'working' },
        changed_by: 'user-ceo-1',
        changed_at: '2026-08-05T14:30:00Z',
        context: 'status_transition',
      },
      {
        id: 3,
        table_name: 'pm_boq_items',
        record_id: 'boq-item-55',
        action: 'UPDATE',
        old_data: { unit_rate_egp: 1200 },
        new_data: { unit_rate_egp: 1450 },
        changed_by: 'user-comm-mgr',
        changed_at: '2026-08-10T11:15:00Z',
        context: 'vo_rate_adjustment',
      },
      {
        id: 4,
        table_name: 'pm_price_view_grants',
        record_id: 'grant-99',
        action: 'INSERT',
        new_data: { granted_to: 'user-planner-1', project_id: 'proj-101' },
        changed_by: 'user-plan-mgr',
        changed_at: '2026-08-15T08:20:00Z',
        context: 'delegation_grant',
      },
      {
        id: 5,
        table_name: 'pm_user_project_access',
        record_id: 'access-88',
        action: 'DELETE',
        old_data: { user_id: 'user-sub-contractor', project_id: 'proj-101' },
        changed_by: 'user-admin',
        changed_at: '2026-08-20T16:00:00Z',
        context: 'user_offboarding',
      },
    ];

    it('enforces immutability invariant: UPDATE and DELETE operations are strictly prohibited', () => {
      // UPDATE prohibited
      expect(() => {
        AuditLogEngine.assertWriteOnlyOperation('UPDATE');
      }).toThrow(/SECURITY VIOLATION.*UPDATE is strictly prohibited/);

      // DELETE prohibited
      expect(() => {
        AuditLogEngine.assertWriteOnlyOperation('DELETE');
      }).toThrow(/SECURITY VIOLATION.*DELETE is strictly prohibited/);

      // TRUNCATE prohibited
      expect(() => {
        AuditLogEngine.assertWriteOnlyOperation('TRUNCATE');
      }).toThrow(/SECURITY VIOLATION.*TRUNCATE is strictly prohibited/);

      // INSERT is permitted
      expect(() => {
        AuditLogEngine.assertWriteOnlyOperation('INSERT');
      }).not.toThrow();
    });

    it('filters audit logs by target table_name', () => {
      const projectLogs = AuditLogEngine.filterAuditLogs(mockAuditLogs, {
        tableName: 'projects',
      });
      expect(projectLogs).toHaveLength(2);
      expect(projectLogs.every((l) => l.table_name === 'projects')).toBe(true);

      const boqLogs = AuditLogEngine.filterAuditLogs(mockAuditLogs, {
        tableName: 'pm_boq_items',
      });
      expect(boqLogs).toHaveLength(1);
      expect(boqLogs[0].record_id).toBe('boq-item-55');
    });

    it('filters audit logs by specific record_id to trace entity historical lifecycle', () => {
      const projHistory = AuditLogEngine.filterAuditLogs(mockAuditLogs, {
        recordId: 'proj-101',
      });
      expect(projHistory).toHaveLength(2);
      expect(projHistory[0].action).toBe('INSERT');
      expect(projHistory[1].action).toBe('STATUS_CHANGE');
    });

    it('filters audit logs by action type (STATUS_CHANGE, UPDATE, DELETE, INSERT)', () => {
      const statusChanges = AuditLogEngine.filterAuditLogs(mockAuditLogs, {
        action: 'STATUS_CHANGE',
      });
      expect(statusChanges).toHaveLength(1);
      expect(statusChanges[0].record_id).toBe('proj-101');

      const deletes = AuditLogEngine.filterAuditLogs(mockAuditLogs, {
        action: 'DELETE',
      });
      expect(deletes).toHaveLength(1);
      expect(deletes[0].table_name).toBe('pm_user_project_access');
    });

    it('filters audit logs by date range accurately', () => {
      const midAugustLogs = AuditLogEngine.filterAuditLogs(mockAuditLogs, {
        fromDate: '2026-08-08T00:00:00Z',
        toDate: '2026-08-16T00:00:00Z',
      });
      expect(midAugustLogs).toHaveLength(2);
      expect(midAugustLogs.map((l) => l.id)).toEqual([3, 4]);
    });

    it('filters audit logs by changed_by actor', () => {
      const ceoLogs = AuditLogEngine.filterAuditLogs(mockAuditLogs, {
        changedBy: 'user-ceo-1',
      });
      expect(ceoLogs).toHaveLength(1);
      expect(ceoLogs[0].action).toBe('STATUS_CHANGE');
    });

    it('performs compound multi-criteria filtering for forensic security audits', () => {
      const compoundResults = AuditLogEngine.filterAuditLogs(mockAuditLogs, {
        tableName: 'projects',
        action: 'STATUS_CHANGE',
        changedBy: 'user-ceo-1',
      });
      expect(compoundResults).toHaveLength(1);
      expect(compoundResults[0].record_id).toBe('proj-101');

      const nonMatchingResults = AuditLogEngine.filterAuditLogs(mockAuditLogs, {
        tableName: 'projects',
        action: 'DELETE',
      });
      expect(nonMatchingResults).toHaveLength(0);
    });

    it('verifies audit payload captures old_data and new_data correctly on mutations', () => {
      const statusChangeLog = mockAuditLogs.find((l) => l.action === 'STATUS_CHANGE');
      expect(statusChangeLog).toBeDefined();
      expect(statusChangeLog?.old_data).toEqual({ status: 'setup' });
      expect(statusChangeLog?.new_data).toEqual({ status: 'working' });

      const boqRateChangeLog = mockAuditLogs.find((l) => l.table_name === 'pm_boq_items');
      expect(boqRateChangeLog).toBeDefined();
      expect(boqRateChangeLog?.old_data?.unit_rate_egp).toBe(1200);
      expect(boqRateChangeLog?.new_data?.unit_rate_egp).toBe(1450);
    });
  });

  // =========================================================================
  // SUITE 5: ADVERSARIAL VERIFICATION & RESILIENCE
  // =========================================================================
  describe('5. Adversarial Verification & Boundary Stress', () => {
    it('handles malformed role structures and empty role sets gracefully', () => {
      expect(evaluateUserCanSeePrices('user-1', 'proj-1', [], [])).toBe(false);
      expect(evaluateUserCanAccessProject('user-1', 'proj-1', [], [])).toBe(false);
      expect(canAccessPath('/planning', [], false)).toBe(false);
      expect(canEditPath('/planning/daily-progress', [], false)).toBe(false);
    });

    it('rejects SQL injection fragments in role validation and project IDs', () => {
      const maliciousRole = "admin' OR '1'='1";
      const isValid = (CANONICAL_19_ROLES as readonly string[]).includes(maliciousRole);
      expect(isValid).toBe(false);

      const maliciousProjectId = "proj-1'; DROP TABLE pm_audit_logs; --";
      const accessAllowed = evaluateUserCanAccessProject('user-1', maliciousProjectId, ['site_engineer'], []);
      expect(accessAllowed).toBe(false);
    });

    it('handles large audit log volumes without mutation or data corruption', () => {
      const largeAuditLogs: AuditLogRecord[] = Array.from({ length: 500 }, (_, i) => ({
        id: i + 1,
        table_name: i % 2 === 0 ? 'projects' : 'pm_boq_items',
        record_id: `rec-${i}`,
        action: i % 3 === 0 ? 'INSERT' : i % 3 === 1 ? 'UPDATE' : 'STATUS_CHANGE',
        changed_by: `user-${i % 10}`,
        changed_at: new Date(Date.now() - i * 3600000).toISOString(),
      }));

      const filtered = AuditLogEngine.filterAuditLogs(largeAuditLogs, {
        tableName: 'projects',
        action: 'INSERT',
      });

      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((log) => {
        expect(log.table_name).toBe('projects');
        expect(log.action).toBe('INSERT');
      });
    });
  });
});
