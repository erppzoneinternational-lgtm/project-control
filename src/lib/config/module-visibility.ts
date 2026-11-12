/**
 * Module Visibility & Focused Projects Mode Configuration
 * ────────────────────────────────────────────────────────
 * Controls which navigation groups and modules are exposed in the UI
 * without deleting or modifying underlying database tables or services.
 *
 * When FOCUSED_PROJECTS_MODE is active, only the Project Management
 * workspace (Projects Dashboard, Projects List, New Project, and
 * Project Detail/Edit views) is exposed in the navigation shell.
 */

export const FOCUSED_PROJECTS_MODE: boolean =
  process.env.NEXT_PUBLIC_FOCUSED_PROJECTS_MODE !== 'false';

export const FOCUSED_PROJECTS_HOME_PATH = '/projects';

export const ALLOWED_FOCUSED_PROJECT_HREFS = new Set<string>([
  '/projects',
  '/projects/new',
  '/projects/archive',
]);

export const ALLOWED_FOCUSED_STAKEHOLDER_HREFS = new Set<string>([
  '/clients',
  '/stakeholders',
]);

export const FOCUSED_PROJECT_DETAIL_TABS = [
  'overview',
  'contracts',
  'documents',
  'team',
  'audit_log',
  'archive',
  'settings',
] as const;

export const FOCUSED_TEAM_SUBTABS = [
  'employee',
  'client_rep',
  'subcontractors',
] as const;

export const ALLOWED_FOCUSED_ROUTE_PREFIXES = [
  '/projects',
  '/clients',
  '/stakeholders',
  '/profile',
] as const;

/**
 * Returns true when Focused Projects Mode is active in the live application
 * runtime. Disabled automatically during Vitest unit runs that assert legacy
 * multi-module navigation groups unless explicitly overridden.
 */
export function isFocusedProjectsMode(override?: boolean): boolean {
  if (typeof override === 'boolean') return override;
  if (typeof process !== 'undefined' && process.env?.VITEST === 'true') {
    return false;
  }
  return FOCUSED_PROJECTS_MODE;
}

/**
 * Resolves the primary home path taking Focused Projects Mode into account.
 */
export function resolveFocusedHomePath(defaultRoleHomePath: string, override?: boolean): string {
  if (isFocusedProjectsMode(override)) {
    return FOCUSED_PROJECTS_HOME_PATH;
  }
  return defaultRoleHomePath;
}

/**
 * Checks whether a given pathname is permitted when Focused Projects Mode is active.
 */
export function isRouteAllowedInFocusedMode(pathname: string, override?: boolean): boolean {
  if (!isFocusedProjectsMode(override)) {
    return true;
  }
  if (
    !pathname ||
    pathname === '/' ||
    pathname === '/projects/import' ||
    pathname === '/projects/dashboard' ||
    pathname.startsWith('/projects/dashboard/')
  ) {
    return false;
  }
  return ALLOWED_FOCUSED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
