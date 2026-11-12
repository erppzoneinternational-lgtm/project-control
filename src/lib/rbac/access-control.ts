export interface ModuleAccessRule {
  module_path: string;
  allowed_roles: string[];
  edit_roles?: string[];
}

// Active routes currently built in the application according to SoT v2.0 §2.1
export const ACTIVE_MODULE_ACCESS: Record<string, string[]> = {
  "/": ["all"],
  "/dashboard": ["all"],
  "/profile": ["all"],
  "/schedule-pulse": ["all"],
  "/project-setup": ["project_manager", "ceo", "coo", "coo_assistant", "chairman", "board_member", "viewer", "contract_admin", "commercial_manager", "admin", "planning_manager", "planning_engineer"],
  "/projects": ["project_manager", "ceo", "coo", "coo_assistant", "chairman", "board_member", "viewer", "contract_admin", "commercial_manager", "admin", "planning_manager", "planning_engineer"],
  "/projects/new": ["admin", "ceo", "coo", "commercial_manager", "planning_manager"],
  "/clients": ["project_manager", "contract_admin", "ceo", "coo", "coo_assistant", "chairman", "board_member", "viewer", "commercial_manager", "planning_manager", "planning_engineer", "admin"],
  "/stakeholders": ["project_manager", "contract_admin", "ceo", "coo", "coo_assistant", "chairman", "board_member", "viewer", "commercial_manager", "planning_manager", "planning_engineer", "admin"],
  "/technical-office": ["technical_office", "to_manager", "to_engineer", "planning_engineer", "planning_manager", "project_manager", "commercial_manager", "ceo", "coo", "chairman", "admin"],
  "/system-admin": ["admin", "ceo", "chairman", "coo", "coo_assistant"],
  "/user-management": ["admin", "ceo", "chairman", "coo", "coo_assistant"],
  "/contracts": ["contract_admin", "ipc_clerk", "planning_engineer", "project_manager", "ceo", "coo", "chairman", "cost_control", "commercial_manager", "admin"],
  "/subcontractors": ["commercial_manager", "contract_admin", "project_manager", "cost_control", "ipc_clerk", "ceo", "coo", "chairman", "admin"],
  "/privacy-policy": ["all"],
  "/thank-you": ["all"],
  "/boq": ["estimator", "commercial_manager", "cost_control", "contract_admin", "project_manager", "ceo", "coo", "chairman", "admin", "site_engineer", "technical_office", "to_manager", "to_engineer", "planning_engineer", "planning_manager"],
  "/planning": ["planning_engineer", "planning_manager", "project_manager", "commercial_manager", "cost_control", "ceo", "coo", "chairman", "admin"],
  "/planning/activities": ["planning_engineer", "planning_manager", "project_manager", "commercial_manager", "cost_control", "ceo", "coo", "chairman", "admin"],
  "/planning/site-tasks": ["planning_engineer", "planning_manager", "project_manager", "qc_inspector", "commercial_manager", "cost_control", "ceo", "coo", "chairman", "admin"],
  "/planning/baseline": ["planning_engineer", "planning_manager", "project_manager", "commercial_manager", "ceo", "coo", "chairman", "admin"],
  "/planning/daily-progress": ["site_engineer", "qc_inspector", "planning_engineer", "planning_manager", "project_manager", "commercial_manager", "cost_control", "ceo", "coo", "chairman", "admin"],
  "/planning/allocation": ["planning_engineer", "planning_manager", "project_manager", "commercial_manager", "cost_control", "ceo", "coo", "chairman", "admin"],
  "/planning/dashboard": ["planning_engineer", "planning_manager", "project_manager", "commercial_manager", "cost_control", "finance", "ceo", "coo", "chairman", "admin"],
  "/planning/reports": ["planning_manager", "planning_engineer", "project_manager", "commercial_manager", "cost_control", "ceo", "coo", "chairman", "admin"],
  "/deliverables": ["technical_office", "to_manager", "to_engineer", "planning_engineer", "planning_manager", "project_manager", "commercial_manager", "ceo", "coo", "chairman", "admin"],
  "/coo/deliverables": ["coo", "ceo", "admin", "chairman", "commercial_manager"],
  "/coo": ["coo", "ceo", "chairman", "admin"],
  "/pm-dashboard": ["project_manager", "planning_manager", "ceo", "coo", "chairman", "admin"],
  "/to-dashboard": ["technical_office", "to_manager", "to_engineer", "project_manager", "ceo", "coo", "chairman", "admin"],
  "/to-tasks": ["technical_office", "to_manager", "to_engineer", "project_manager", "ceo", "coo", "chairman", "admin"],
  "/qc-dashboard": ["qc_inspector", "qc_engineer", "project_manager", "planning_manager", "planning_engineer", "ceo", "coo", "chairman", "admin"],
  "/my-tasks": ["technical_office", "to_manager", "to_engineer", "qc_inspector", "planning_engineer", "planning_manager", "site_engineer", "project_manager", "estimator", "cost_control", "admin", "ceo", "coo", "chairman"],
  "/site-workspace": ["site_engineer", "qc_inspector", "project_manager", "planning_engineer", "planning_manager", "admin"],
  "/workflow": [
    "admin",
    "ceo",
    "coo",
    "coo_assistant",
    "project_manager",
    "planning_manager",
    "planning_engineer",
    "site_engineer",
    "to_manager",
    "to_engineer",
    "technical_office",
    "qc_inspector",
  ],
  "/board": ["chairman", "ceo", "coo", "coo_assistant", "board_member", "admin"],
  "/contracts/claims": ["contract_admin", "ipc_clerk", "commercial_manager", "project_manager", "cost_control", "ceo", "coo", "chairman", "admin"],
  "/cost-control": ["cost_control", "finance", "commercial_manager", "project_manager", "estimator", "ceo", "coo", "chairman", "admin"],
  "/tender": ["commercial_manager", "estimator", "project_manager", "contract_admin", "cost_control", "ceo", "coo", "chairman", "admin"],
  "/document-control": ["technical_office", "to_manager", "to_engineer", "doc_controller", "project_manager", "planning_engineer", "planning_manager", "ceo", "coo", "chairman", "admin"],
  "/hse": ["hse_officer", "hse_manager", "site_engineer", "qc_inspector", "project_manager", "planning_manager", "ceo", "coo", "chairman", "admin"],
  "/reports": ["all"],
};

export const ACTIVE_EDIT_ROLES: Record<string, string[]> = {
  "/profile": ["all"],
  "/project-setup": ["commercial_manager", "admin"],
  "/projects": ["project_manager", "commercial_manager", "planning_manager", "ceo", "coo", "coo_assistant", "admin"],
  "/projects/new": ["admin", "ceo", "coo", "commercial_manager", "planning_manager"],
  "/clients": ["project_manager", "contract_admin", "commercial_manager", "coo", "coo_assistant", "admin"],
  "/stakeholders": ["project_manager", "contract_admin", "commercial_manager", "coo", "coo_assistant", "admin"],
  "/technical-office": ["technical_office", "coo", "admin"],
  "/system-admin": ["admin", "coo_assistant"],
  "/user-management": ["admin", "coo_assistant"],
  "/contracts": ["contract_admin", "commercial_manager", "admin"],
  "/subcontractors": ["commercial_manager", "contract_admin", "admin"],
  "/boq": ["estimator", "commercial_manager", "project_manager", "admin"],
  "/planning": ["planning_engineer", "planning_manager", "project_manager", "admin"],
  "/planning/activities": ["planning_engineer", "planning_manager", "project_manager", "admin"],
  "/planning/baseline": ["planning_engineer", "planning_manager", "admin"],
  "/planning/daily-progress": ["site_engineer", "planning_engineer", "planning_manager", "project_manager", "admin"],
  "/planning/allocation": ["planning_engineer", "planning_manager", "project_manager", "admin"],
  "/planning/reports": ["planning_manager", "admin"],
  "/deliverables": ["technical_office", "planning_engineer", "planning_manager", "project_manager", "admin"],
  "/coo/deliverables": ["coo", "ceo", "admin", "commercial_manager"],
  "/coo": ["coo", "ceo", "admin"],
  "/pm-dashboard": ["project_manager", "admin"],
  "/to-dashboard": ["technical_office", "admin"],
  "/to-tasks": ["technical_office", "admin"],
  "/qc-dashboard": ["qc_inspector", "qc_engineer", "admin"],
  "/my-tasks": ["technical_office", "planning_engineer", "planning_manager", "site_engineer", "project_manager", "admin"],
  "/workflow": [
    "admin",
    "ceo",
    "coo",
    "coo_assistant",
    "project_manager",
    "planning_manager",
    "planning_engineer",
    "site_engineer",
    "to_manager",
    "technical_office",
    "qc_inspector",
  ],
  "/board": ["chairman", "ceo", "coo", "admin"],
  "/contracts/claims": ["contract_admin", "commercial_manager", "admin"],
  "/cost-control": ["cost_control", "finance", "admin"],
  "/tender": ["commercial_manager", "estimator", "admin"],
  "/document-control": ["technical_office", "doc_controller", "admin"],
  "/hse": ["hse_officer", "hse_manager", "admin"],
};

export const FUTURE_MODULE_ACCESS: Record<string, string[]> = {
  "/settings": ["all"],
  "/tenders": ["all"],
  "/tenders/new": ["estimator", "ceo", "coo", "coo_assistant", "commercial_manager", "admin"],
  "/budget": ["cost_control", "estimator", "finance", "ceo", "coo", "coo_assistant", "chairman", "commercial_manager", "admin"],
  "/collections": ["finance", "ceo", "coo", "chairman", "cost_control", "commercial_manager", "admin"],
  "/payments": ["finance", "ceo", "coo", "chairman", "cost_control", "commercial_manager", "admin"],
  "/cash-flow": ["finance", "cost_control", "ceo", "coo", "chairman", "commercial_manager", "admin"],
  "/executive": ["ceo", "coo", "coo_assistant", "chairman", "finance", "board_member", "cost_control", "commercial_manager", "admin"],
  "/master-data": ["admin", "commercial_manager"],
  "/ipc-management": ["finance", "cost_control", "contract_admin", "ipc_clerk", "ceo", "coo", "chairman", "project_manager", "commercial_manager", "admin"],
  "/invoices": ["finance", "cost_control", "contract_admin", "ipc_clerk", "ceo", "coo", "chairman", "project_manager", "commercial_manager", "admin"],
  "/ongoing-projects": ["all"],
  "/board-dashboard": ["ceo", "coo", "coo_assistant", "chairman", "board_member", "commercial_manager", "admin"],
  "/analytics": ["finance", "ceo", "coo", "chairman", "cost_control", "commercial_manager", "admin"],
  "/transformation-dashboard": ["finance", "cost_control", "contract_admin", "ceo", "coo", "chairman", "commercial_manager", "admin"],
  "/chairman-briefing": ["ceo", "coo", "chairman", "commercial_manager", "admin"],
  "/site-progress": ["planning_engineer", "site_engineer", "project_manager", "ceo", "coo", "commercial_manager", "admin"],
  "/cost-control": ["cost_control", "finance", "ceo", "coo", "chairman", "commercial_manager", "admin"],
  "/procurement": ["procurement", "project_manager", "ceo", "coo", "commercial_manager", "admin"],
  "/inventory": ["inventory", "procurement", "project_manager", "commercial_manager", "admin"],
};

export const FALLBACK_MODULE_ACCESS: Record<string, string[]> = {
  ...FUTURE_MODULE_ACCESS,
  ...ACTIVE_MODULE_ACCESS,
};

export const COMMERCIAL_EXECUTION_ROUTES: Record<string, string[]> = {
  "/ipc-management": ["ipc_clerk", "contract_admin", "project_manager", "commercial_manager"],
  "/invoices": ["ipc_clerk", "contract_admin", "project_manager", "commercial_manager"],
  "/collections": ["finance"],
  "/budget": ["cost_control", "estimator", "commercial_manager"],
  "/contracts": ["contract_admin", "ipc_clerk", "commercial_manager"],
  "/site-progress": ["planning_engineer", "site_engineer", "project_manager"],
  "/cost-control": ["cost_control"],
  "/procurement": ["procurement", "project_manager"],
  "/inventory": ["inventory", "procurement", "project_manager"],
  "/master-data": ["admin"],
  "/tenders": ["estimator"],
  "/tenders/new": ["estimator", "ceo", "coo"],
};

export const FALLBACK_EDIT_ROLES: Record<string, string[]> = {
  ...COMMERCIAL_EXECUTION_ROUTES,
  ...ACTIVE_EDIT_ROLES,
};

export function routeKeyForPath(path: string) {
  const cleanPath = path.split(/[?#]/)[0];
  const normalizedPath = cleanPath === "/" ? "/" : cleanPath.replace(/\/$/, "");
  const isSubRoute = (parent: string) =>
    normalizedPath === parent || normalizedPath.startsWith(parent + "/");

  if (isSubRoute("/tenders/new")) return "/tenders/new";
  if (isSubRoute("/budget")) return "/budget";
  if (isSubRoute("/project-setup")) return "/project-setup";

  // Planning sub-routes (preserve dedicated module keys before generic /planning)
  if (isSubRoute("/planning/site-tasks")) return "/planning/site-tasks";
  if (isSubRoute("/planning/activities")) return "/planning/activities";
  if (isSubRoute("/planning/baseline")) return "/planning/baseline";
  if (isSubRoute("/planning/daily-progress")) return "/planning/daily-progress";
  if (isSubRoute("/planning/allocation")) return "/planning/allocation";
  if (isSubRoute("/planning/dashboard")) return "/planning/dashboard";
  if (isSubRoute("/planning/reports")) return "/planning/reports";
  if (isSubRoute("/planning")) return "/planning";

  // Projects sub-routes (preserve dedicated /projects/new before /projects)
  if (isSubRoute("/projects/new")) return "/projects/new";
  if (isSubRoute("/projects")) return "/projects";

  if (isSubRoute("/boq")) return "/boq";
  if (isSubRoute("/pm-dashboard")) return "/pm-dashboard";
  if (isSubRoute("/to-dashboard")) return "/to-dashboard";
  if (isSubRoute("/to-tasks")) return "/to-tasks";
  if (isSubRoute("/qc-dashboard")) return "/qc-dashboard";
  if (isSubRoute("/coo/deliverables")) return "/coo/deliverables";
  if (isSubRoute("/coo")) return "/coo";
  if (isSubRoute("/deliverables")) return "/deliverables";
  if (isSubRoute("/technical-office")) return "/technical-office";
  if (isSubRoute("/system-admin")) return "/system-admin";
  if (isSubRoute("/user-management")) return "/user-management";
  if (isSubRoute("/my-tasks")) return "/my-tasks";
  if (isSubRoute("/workflow")) return "/workflow";
  if (isSubRoute("/board")) return "/board";

  // Contracts sub-routes (preserve dedicated /contracts/claims before /contracts)
  if (isSubRoute("/contracts/claims")) return "/contracts/claims";
  if (isSubRoute("/contracts")) return "/contracts";

  if (isSubRoute("/subcontractors")) return "/subcontractors";
  if (isSubRoute("/clients")) return "/clients";
  if (isSubRoute("/stakeholders")) return "/stakeholders";
  if (isSubRoute("/cost-control")) return "/cost-control";
  if (isSubRoute("/tender") || isSubRoute("/tenders")) return "/tender";
  if (isSubRoute("/document-control")) return "/document-control";
  if (isSubRoute("/hse")) return "/hse";
  if (isSubRoute("/reports")) return "/reports";
  if (isSubRoute("/schedule-pulse")) return "/schedule-pulse";
  if (isSubRoute("/ipc-board")) return "/ipc-board";
  if (isSubRoute("/invoices") || isSubRoute("/ipc-management")) return "/ipc-management";

  return normalizedPath;
}

export function allowedRolesForPath(path: string, dbAccessRules?: ModuleAccessRule[] | null) {
  const routeKey = routeKeyForPath(path);
  if (routeKey === "/ipc-board") return ["all"];

  const dbMatch = dbAccessRules?.find((rule) => rule.module_path === routeKey);
  if (dbMatch?.allowed_roles?.length) return dbMatch.allowed_roles;

  return FALLBACK_MODULE_ACCESS[routeKey] ?? null;
}

export function editRolesForPath(path: string, dbAccessRules?: ModuleAccessRule[] | null) {
  const routeKey = routeKeyForPath(path);

  const dbMatch = dbAccessRules?.find((rule) => rule.module_path === routeKey);
  if (dbMatch?.edit_roles?.length) return dbMatch.edit_roles;

  return FALLBACK_EDIT_ROLES[routeKey] ?? [];
}

export function canAccessPath(
  path: string,
  roles: string[] | null | undefined,
  isAdmin: boolean,
  dbAccessRules?: ModuleAccessRule[] | null,
) {
  if (isAdmin || roles?.includes("admin")) return true;

  const cleanPath = path.split(/[?#]/)[0];
  if (/^\/projects\/[^/]+\/edit(\/|$)/i.test(cleanPath)) {
    return canEditPath("/projects", roles, isAdmin, dbAccessRules);
  }

  const allowedRoles = allowedRolesForPath(path, dbAccessRules);
  if (!allowedRoles) return false;
  if (allowedRoles.includes("all")) return true;

  const userRoles = roles || [];
  return allowedRoles.some((role) => userRoles.includes(role));
}

export function canEditPath(
  path: string,
  roles: string[] | null | undefined,
  isAdmin: boolean,
  dbAccessRules?: ModuleAccessRule[] | null,
) {
  if (isAdmin || roles?.includes("admin")) return true;

  const userRoles = (roles || []).filter((r) => r && r !== "viewer");
  if (!userRoles.length) return false;

  const editRoles = editRolesForPath(path, dbAccessRules);
  if (!editRoles.length) return false;
  if (editRoles.includes("all")) return true;

  return editRoles.some((role) => userRoles.includes(role));
}
