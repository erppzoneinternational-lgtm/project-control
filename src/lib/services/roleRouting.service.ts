import {
  CanonicalRole,
  RoleRouteConfig,
  ROLE_ROUTE_REGISTRY,
} from '@/types/planning';

export { ROLE_ROUTE_REGISTRY };
export type { CanonicalRole, RoleRouteConfig };

export type EnterpriseUserRole =
  | 'admin'
  | 'ceo'
  | 'coo'
  | 'coo_assistant'
  | 'chairman'
  | 'board_member'
  | 'commercial_manager'
  | 'project_manager'
  | 'planning_manager'
  | 'planning_engineer'
  | 'site_engineer'
  | 'cost_control'
  | 'estimator'
  | 'contract_admin'
  | 'technical_office'
  | 'finance'
  | 'ipc_clerk'
  | 'procurement'
  | 'inventory'
  | 'to_manager'
  | 'qc_inspector'
  | 'to_engineer';

export interface ExtendedRoleRouteConfig {
  role: EnterpriseUserRole;
  homePath: string;
  secondaryPaths?: string[];
  labelAr: string;
  labelEn: string;
  priority: number;
}

export const EXTENDED_ROLE_ROUTE_REGISTRY: Record<EnterpriseUserRole, ExtendedRoleRouteConfig> = {
  admin: {
    role: 'admin',
    homePath: '/system-admin',
    secondaryPaths: ['/user-management', '/projects'],
    labelAr: 'مدير النظام',
    labelEn: 'System Administrator',
    priority: 1,
  },
  chairman: {
    role: 'chairman',
    homePath: '/coo',
    secondaryPaths: ['/board', '/dashboard'],
    labelAr: 'رئيس مجلس الإدارة',
    labelEn: 'Chairman',
    priority: 2,
  },
  ceo: {
    role: 'ceo',
    homePath: '/coo',
    secondaryPaths: ['/board', '/dashboard'],
    labelAr: 'الرئيس التنفيذي',
    labelEn: 'CEO',
    priority: 2,
  },
  coo: {
    role: 'coo',
    homePath: '/coo',
    secondaryPaths: ['/coo/deliverables', '/projects'],
    labelAr: 'مدير العمليات',
    labelEn: 'COO',
    priority: 3,
  },
  coo_assistant: {
    role: 'coo_assistant',
    homePath: '/projects',
    secondaryPaths: ['/stakeholders', '/project-setup', '/board'],
    labelAr: 'مساعد مدير العمليات',
    labelEn: 'COO Assistant',
    priority: 3.5,
  },
  board_member: {
    role: 'board_member',
    homePath: '/board',
    secondaryPaths: ['/dashboard'],
    labelAr: 'عضو مجلس الإدارة',
    labelEn: 'Board Member',
    priority: 3.6,
  },
  commercial_manager: {
    role: 'commercial_manager',
    homePath: '/contracts',
    secondaryPaths: ['/cost-control', '/tender', '/boq'],
    labelAr: 'المدير التجاري',
    labelEn: 'Commercial Manager',
    priority: 3.8,
  },
  planning_manager: {
    role: 'planning_manager',
    homePath: '/planning/dashboard',
    secondaryPaths: ['/planning', '/planning/site-tasks'],
    labelAr: 'مدير التخطيط',
    labelEn: 'Planning Manager',
    priority: 4,
  },
  project_manager: {
    role: 'project_manager',
    homePath: '/pm-dashboard',
    secondaryPaths: ['/projects', '/site-workspace'],
    labelAr: 'مدير المشروع',
    labelEn: 'Project Manager',
    priority: 5,
  },
  to_manager: {
    role: 'to_manager',
    homePath: '/to-dashboard',
    secondaryPaths: ['/technical-office', '/deliverables', '/document-control'],
    labelAr: 'مدير المكتب الفني',
    labelEn: 'TO Manager',
    priority: 6,
  },
  technical_office: {
    role: 'technical_office',
    homePath: '/to-dashboard',
    secondaryPaths: ['/technical-office', '/deliverables', '/document-control'],
    labelAr: 'المكتب الفني',
    labelEn: 'Technical Office',
    priority: 6,
  },
  to_engineer: {
    role: 'to_engineer',
    homePath: '/to-dashboard',
    secondaryPaths: ['/to-tasks', '/technical-office', '/deliverables'],
    labelAr: 'مهندس المكتب الفني',
    labelEn: 'TO Engineer',
    priority: 6.1,
  },
  planning_engineer: {
    role: 'planning_engineer',
    homePath: '/planning',
    secondaryPaths: ['/planning/activities', '/planning/site-tasks'],
    labelAr: 'مهندس التخطيط والجدولة',
    labelEn: 'Planning Engineer',
    priority: 7,
  },
  cost_control: {
    role: 'cost_control',
    homePath: '/cost-control',
    secondaryPaths: ['/boq', '/contracts'],
    labelAr: 'التحكم بالتكاليف',
    labelEn: 'Cost Control',
    priority: 7.2,
  },
  finance: {
    role: 'finance',
    homePath: '/cost-control',
    secondaryPaths: ['/dashboard'],
    labelAr: 'الإدارة المالية',
    labelEn: 'Finance',
    priority: 7.3,
  },
  contract_admin: {
    role: 'contract_admin',
    homePath: '/contracts',
    secondaryPaths: ['/contracts/claims', '/subcontractors'],
    labelAr: 'إدارة العقود',
    labelEn: 'Contract Admin',
    priority: 7.4,
  },
  ipc_clerk: {
    role: 'ipc_clerk',
    homePath: '/contracts',
    secondaryPaths: ['/contracts/claims'],
    labelAr: 'مسؤول المستخلصات',
    labelEn: 'IPC Clerk',
    priority: 7.5,
  },
  estimator: {
    role: 'estimator',
    homePath: '/boq',
    secondaryPaths: ['/tender'],
    labelAr: 'مهندس التقدير والدراسات',
    labelEn: 'Estimator',
    priority: 7.6,
  },
  site_engineer: {
    role: 'site_engineer',
    homePath: '/site-workspace',
    secondaryPaths: ['/planning/daily-progress', '/my-tasks', '/hse'],
    labelAr: 'مهندس الموقع',
    labelEn: 'Site Engineer',
    priority: 8,
  },
  qc_inspector: {
    role: 'qc_inspector',
    homePath: '/qc-dashboard',
    secondaryPaths: ['/planning/site-tasks', '/site-workspace', '/my-tasks'],
    labelAr: 'مهندس مراقبة الجودة',
    labelEn: 'QC Inspector',
    priority: 9,
  },
  procurement: {
    role: 'procurement',
    homePath: '/dashboard',
    secondaryPaths: ['/boq'],
    labelAr: 'إدارة المشتريات',
    labelEn: 'Procurement',
    priority: 10,
  },
  inventory: {
    role: 'inventory',
    homePath: '/dashboard',
    secondaryPaths: ['/boq'],
    labelAr: 'المستودعات والمخازن',
    labelEn: 'Inventory',
    priority: 10.1,
  },
};

function toRoleArray(roles: string[] | string | null | undefined): string[] {
  if (Array.isArray(roles)) return roles;
  if (typeof roles === 'string') return [roles];
  return [];
}

export class RoleRoutingService {
  /**
   * Normalize arbitrary string or legacy role name into the 9-role CanonicalRole union.
   */
  static normalizeRole(roleStr: string | null | undefined): CanonicalRole | null {
    if (!roleStr) return null;
    const clean = roleStr.toLowerCase().trim().replace(/[\s-]+/g, '_');

    switch (clean) {
      case 'admin':
      case 'system_admin':
      case 'super_admin':
        return 'admin';

      case 'ceo':
      case 'chairman':
      case 'president':
        return 'ceo';

      case 'coo':
      case 'operations_director':
      case 'general_manager':
      case 'operations_manager':
        return 'coo';

      case 'planning_manager':
      case 'head_of_planning':
      case 'lead_planning':
        return 'planning_manager';

      case 'project_manager':
      case 'pm':
      case 'lead_pm':
        return 'project_manager';

      case 'technical_office':
      case 'to':
      case 'to_engineer':
      case 'to_manager':
      case 'technical_office_engineer':
      case 'technical_office_manager':
        return 'technical_office';

      case 'planning_engineer':
      case 'planner':
      case 'planning':
        return 'planning_engineer';

      case 'site_engineer':
      case 'site':
      case 'construction_engineer':
        return 'site_engineer';

      case 'qc_inspector':
      case 'qc_engineer':
      case 'qc':
      case 'qa_qc':
      case 'quality_control':
      case 'quality_engineer':
        return 'qc_inspector';

      default:
        return null;
    }
  }

  /**
   * Normalize arbitrary string or alias into one of the 22 DB `public.user_role` values.
   */
  static normalizeEnterpriseRole(roleStr: string | null | undefined): EnterpriseUserRole | null {
    if (!roleStr) return null;
    const clean = roleStr.toLowerCase().trim().replace(/[\s-]+/g, '_');

    switch (clean) {
      case 'admin':
      case 'system_admin':
      case 'super_admin':
        return 'admin';

      case 'chairman':
        return 'chairman';

      case 'ceo':
      case 'president':
        return 'ceo';

      case 'coo':
      case 'operations_director':
      case 'general_manager':
      case 'operations_manager':
        return 'coo';

      case 'coo_assistant':
      case 'assistant':
      case 'coo_sec':
        return 'coo_assistant';

      case 'board_member':
        return 'board_member';

      case 'commercial_manager':
        return 'commercial_manager';

      case 'planning_manager':
      case 'head_of_planning':
      case 'lead_planning':
        return 'planning_manager';

      case 'project_manager':
      case 'pm':
      case 'lead_pm':
        return 'project_manager';

      case 'to_manager':
      case 'technical_office_manager':
        return 'to_manager';

      case 'to_engineer':
      case 'technical_office_engineer':
        return 'to_engineer';

      case 'technical_office':
      case 'to':
        return 'technical_office';

      case 'planning_engineer':
      case 'planner':
      case 'planning':
        return 'planning_engineer';

      case 'cost_control':
        return 'cost_control';

      case 'finance':
        return 'finance';

      case 'contract_admin':
        return 'contract_admin';

      case 'ipc_clerk':
        return 'ipc_clerk';

      case 'estimator':
        return 'estimator';

      case 'site_engineer':
      case 'site':
      case 'construction_engineer':
        return 'site_engineer';

      case 'qc_inspector':
      case 'qc_engineer':
      case 'qc':
      case 'qa_qc':
      case 'quality_control':
      case 'quality_engineer':
        return 'qc_inspector';

      case 'procurement':
        return 'procurement';

      case 'inventory':
        return 'inventory';

      default:
        return null;
    }
  }

  /**
   * Determine primary home route for a given user across all 22 enterprise roles
   * based on highest priority role without hitting restricted fallbacks.
   */
  static getHomePath(
    roles: string[] | string | null | undefined,
    isAdmin = false
  ): string {
    if (isAdmin) {
      return ROLE_ROUTE_REGISTRY.admin.homePath;
    }

    const roleArray = toRoleArray(roles);
    const resolvedRoles: EnterpriseUserRole[] = [];

    for (const r of roleArray) {
      const normalized = this.normalizeEnterpriseRole(r);
      if (normalized && !resolvedRoles.includes(normalized)) {
        resolvedRoles.push(normalized);
      }
    }

    if (resolvedRoles.length === 0) {
      return '/projects';
    }

    resolvedRoles.sort((a, b) => {
      const pA = EXTENDED_ROLE_ROUTE_REGISTRY[a]?.priority ?? 99;
      const pB = EXTENDED_ROLE_ROUTE_REGISTRY[b]?.priority ?? 99;
      return pA - pB;
    });

    const topRole = resolvedRoles[0];
    return EXTENDED_ROLE_ROUTE_REGISTRY[topRole]?.homePath || '/projects';
  }

  /**
   * Determine whether a user can access a specific route path.
   */
  static canAccess(
    pathname: string,
    roles: string[] | string | null | undefined,
    isAdmin = false
  ): boolean {
    if (isAdmin) return true;

    const normalizedPath = pathname.toLowerCase().trim();
    const roleArray = toRoleArray(roles);

    const enterpriseRoles = roleArray
      .map((r) => this.normalizeEnterpriseRole(r))
      .filter((r): r is EnterpriseUserRole => r !== null);

    const hasAnyEnterprise = (allowed: EnterpriseUserRole[]) =>
      enterpriseRoles.some((r) => allowed.includes(r));

    // System admin path is strictly for admins
    if (normalizedPath.startsWith('/system-admin')) {
      return hasAnyEnterprise(['admin']);
    }

    // Universal authenticated project & dashboard entry points
    if (
      normalizedPath === '/projects' ||
      normalizedPath.startsWith('/projects/') ||
      normalizedPath === '/dashboard' ||
      normalizedPath === '/'
    ) {
      return true;
    }

    if (normalizedPath.startsWith('/coo/deliverables')) {
      return hasAnyEnterprise(['admin', 'ceo', 'chairman', 'coo', 'commercial_manager', 'to_manager']);
    }

    // Executive COO Command Center (excludes coo_assistant per domain governance)
    if (normalizedPath.startsWith('/coo')) {
      return hasAnyEnterprise(['admin', 'ceo', 'chairman', 'coo']);
    }

    if (normalizedPath.startsWith('/board')) {
      return hasAnyEnterprise(['admin', 'ceo', 'chairman', 'coo', 'coo_assistant', 'board_member']);
    }

    if (normalizedPath.startsWith('/pm-dashboard')) {
      return hasAnyEnterprise(['admin', 'ceo', 'chairman', 'coo', 'project_manager', 'planning_manager']);
    }

    if (normalizedPath.startsWith('/to-dashboard') || normalizedPath.startsWith('/to-tasks')) {
      return hasAnyEnterprise([
        'admin',
        'ceo',
        'chairman',
        'coo',
        'technical_office',
        'to_manager',
        'to_engineer',
        'project_manager',
      ]);
    }

    if (
      normalizedPath.startsWith('/technical-office') ||
      normalizedPath.startsWith('/deliverables') ||
      normalizedPath.startsWith('/document-control') ||
      normalizedPath.startsWith('/documents')
    ) {
      return hasAnyEnterprise([
        'admin',
        'ceo',
        'chairman',
        'coo',
        'technical_office',
        'to_manager',
        'to_engineer',
        'project_manager',
        'planning_manager',
        'planning_engineer',
        'commercial_manager',
      ]);
    }

    if (normalizedPath.startsWith('/qc-dashboard')) {
      return hasAnyEnterprise([
        'admin',
        'ceo',
        'chairman',
        'coo',
        'qc_inspector',
        'project_manager',
        'planning_manager',
        'planning_engineer',
      ]);
    }

    if (normalizedPath.startsWith('/site-workspace') || normalizedPath.startsWith('/hse')) {
      return hasAnyEnterprise([
        'admin',
        'ceo',
        'chairman',
        'coo',
        'site_engineer',
        'qc_inspector',
        'project_manager',
        'planning_manager',
        'planning_engineer',
      ]);
    }

    if (
      normalizedPath.startsWith('/planning/site-tasks') ||
      normalizedPath.startsWith('/planning/daily-progress')
    ) {
      return hasAnyEnterprise([
        'admin',
        'ceo',
        'chairman',
        'coo',
        'planning_manager',
        'planning_engineer',
        'project_manager',
        'site_engineer',
        'qc_inspector',
        'commercial_manager',
        'cost_control',
      ]);
    }

    if (normalizedPath.startsWith('/planning')) {
      return hasAnyEnterprise([
        'admin',
        'ceo',
        'chairman',
        'coo',
        'planning_manager',
        'planning_engineer',
        'project_manager',
        'commercial_manager',
        'cost_control',
      ]);
    }

    return true;
  }
}
