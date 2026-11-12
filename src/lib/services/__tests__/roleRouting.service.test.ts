import { describe, it, expect } from 'vitest';
import { RoleRoutingService, ROLE_ROUTE_REGISTRY } from '../roleRouting.service';

describe('RoleRoutingService Unit Test Suite (WS-7)', () => {
  // 1. getHomePath: routes admin to /system-admin
  it('getHomePath: routes admin to /system-admin', () => {
    expect(RoleRoutingService.getHomePath(['admin'])).toBe('/system-admin');
    expect(RoleRoutingService.getHomePath([], true)).toBe('/system-admin');
    expect(RoleRoutingService.getHomePath(['system_admin'])).toBe('/system-admin');
  });

  // 2. getHomePath: routes ceo and coo to /coo
  it('getHomePath: routes ceo and coo to /coo', () => {
    expect(RoleRoutingService.getHomePath(['ceo'])).toBe('/coo');
    expect(RoleRoutingService.getHomePath(['chairman'])).toBe('/coo');
    expect(RoleRoutingService.getHomePath(['coo'])).toBe('/coo');
    expect(RoleRoutingService.getHomePath(['operations_director'])).toBe('/coo');
  });

  // 3. getHomePath: routes project_manager to /pm-dashboard
  it('getHomePath: routes project_manager to /pm-dashboard', () => {
    expect(RoleRoutingService.getHomePath(['project_manager'])).toBe('/pm-dashboard');
    expect(RoleRoutingService.getHomePath(['pm'])).toBe('/pm-dashboard');
    expect(RoleRoutingService.getHomePath('lead_pm')).toBe('/pm-dashboard');
  });

  // 4. getHomePath: routes planning_manager to /planning/dashboard
  it('getHomePath: routes planning_manager to /planning/dashboard', () => {
    expect(RoleRoutingService.getHomePath(['planning_manager'])).toBe('/planning/dashboard');
    expect(RoleRoutingService.getHomePath(['head_of_planning'])).toBe('/planning/dashboard');
  });

  // 5. getHomePath: routes planning_engineer to /planning
  it('getHomePath: routes planning_engineer to /planning', () => {
    expect(RoleRoutingService.getHomePath(['planning_engineer'])).toBe('/planning');
    expect(RoleRoutingService.getHomePath(['planner'])).toBe('/planning');
  });

  // 6. getHomePath: routes technical_office to /to-dashboard
  it('getHomePath: routes technical_office to /to-dashboard', () => {
    expect(RoleRoutingService.getHomePath(['technical_office'])).toBe('/to-dashboard');
    expect(RoleRoutingService.getHomePath(['to_engineer'])).toBe('/to-dashboard');
    expect(RoleRoutingService.getHomePath(['to_manager'])).toBe('/to-dashboard');
  });

  // 7. getHomePath: routes site_engineer to /site-workspace
  it('getHomePath: routes site_engineer to /site-workspace', () => {
    expect(RoleRoutingService.getHomePath(['site_engineer'])).toBe('/site-workspace');
    expect(RoleRoutingService.getHomePath(['site'])).toBe('/site-workspace');
  });

  // 8. getHomePath: routes qc_inspector to /qc-dashboard
  it('getHomePath: routes qc_inspector to /qc-dashboard', () => {
    expect(RoleRoutingService.getHomePath(['qc_inspector'])).toBe('/qc-dashboard');
    expect(RoleRoutingService.getHomePath(['qc_engineer'])).toBe('/qc-dashboard');
    expect(RoleRoutingService.getHomePath(['quality_control'])).toBe('/qc-dashboard');
  });

  // 9. getHomePath: resolves multi-role users by strict priority order
  it('getHomePath: resolves multi-role users by strict priority order', () => {
    // Admin (1) > CEO (2) > COO (3) > Planning Manager (4) > PM (5) > TO (6) > Planning Eng (7) > Site Eng (8) > QC (9)
    expect(RoleRoutingService.getHomePath(['site_engineer', 'project_manager'])).toBe('/pm-dashboard');
    expect(RoleRoutingService.getHomePath(['technical_office', 'coo'])).toBe('/coo');
    expect(RoleRoutingService.getHomePath(['qc_inspector', 'planning_manager', 'site_engineer'])).toBe(
      '/planning/dashboard'
    );
    expect(RoleRoutingService.getHomePath(['qc_inspector', 'technical_office'])).toBe('/to-dashboard');
  });

  // 10. getHomePath: defaults unknown roles to /projects and checks canAccess
  it('getHomePath: defaults unknown roles to /projects and checks canAccess', () => {
    expect(RoleRoutingService.getHomePath(['guest'])).toBe('/projects');
    expect(RoleRoutingService.getHomePath([])).toBe('/projects');
    expect(RoleRoutingService.getHomePath(null)).toBe('/projects');

    // canAccess checks
    expect(RoleRoutingService.canAccess('/system-admin', ['project_manager'])).toBe(false);
    expect(RoleRoutingService.canAccess('/system-admin', ['admin'])).toBe(true);
    expect(RoleRoutingService.canAccess('/projects', ['guest'])).toBe(true);
    expect(RoleRoutingService.canAccess('/coo', ['coo'])).toBe(true);
    expect(RoleRoutingService.canAccess('/coo', ['site_engineer'])).toBe(false);
  });
});
