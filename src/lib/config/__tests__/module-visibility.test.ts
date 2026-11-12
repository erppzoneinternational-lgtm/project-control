import { describe, it, expect } from 'vitest';
import {
  FOCUSED_PROJECTS_HOME_PATH,
  ALLOWED_FOCUSED_PROJECT_HREFS,
  isFocusedProjectsMode,
  resolveFocusedHomePath,
  isRouteAllowedInFocusedMode,
} from '../module-visibility';

describe('module-visibility (Focused Projects Mode)', () => {
  it('defaults to false inside Vitest environment unless explicitly overridden', () => {
    expect(isFocusedProjectsMode()).toBe(false);
    expect(isFocusedProjectsMode(true)).toBe(true);
    expect(isFocusedProjectsMode(false)).toBe(false);
  });

  it('resolves home path to /projects when focused mode is enabled', () => {
    expect(resolveFocusedHomePath('/coo', true)).toBe('/projects');
    expect(resolveFocusedHomePath('/dashboard', true)).toBe(FOCUSED_PROJECTS_HOME_PATH);
    expect(resolveFocusedHomePath('/coo', false)).toBe('/coo');
  });

  it('exposes the three core project navigation hrefs in ALLOWED_FOCUSED_PROJECT_HREFS', () => {
    expect(ALLOWED_FOCUSED_PROJECT_HREFS.has('/projects')).toBe(true);
    expect(ALLOWED_FOCUSED_PROJECT_HREFS.has('/projects/new')).toBe(true);
    expect(ALLOWED_FOCUSED_PROJECT_HREFS.has('/projects/archive')).toBe(true);
    expect(ALLOWED_FOCUSED_PROJECT_HREFS.has('/projects/dashboard')).toBe(false);
    expect(ALLOWED_FOCUSED_PROJECT_HREFS.has('/boq')).toBe(false);
  });

  it('allows project, stakeholder/client directory, and profile routes in focused mode and blocks non-project modules and /projects/dashboard', () => {
    expect(isRouteAllowedInFocusedMode('/projects', true)).toBe(true);
    expect(isRouteAllowedInFocusedMode('/projects/new', true)).toBe(true);
    expect(isRouteAllowedInFocusedMode('/projects/archive', true)).toBe(true);
    expect(isRouteAllowedInFocusedMode('/projects/046013f3-8545-4316-9fed-9974b4bebb58', true)).toBe(true);
    expect(isRouteAllowedInFocusedMode('/projects/046013f3-8545-4316-9fed-9974b4bebb58/edit', true)).toBe(true);
    expect(isRouteAllowedInFocusedMode('/clients', true)).toBe(true);
    expect(isRouteAllowedInFocusedMode('/stakeholders', true)).toBe(true);
    expect(isRouteAllowedInFocusedMode('/profile', true)).toBe(true);

    // Blocked in Focused Mode
    expect(isRouteAllowedInFocusedMode('/', true)).toBe(false);
    expect(isRouteAllowedInFocusedMode('/projects/dashboard', true)).toBe(false);
    expect(isRouteAllowedInFocusedMode('/dashboard', true)).toBe(false);
    expect(isRouteAllowedInFocusedMode('/project-setup', true)).toBe(false);
    expect(isRouteAllowedInFocusedMode('/boq', true)).toBe(false);
    expect(isRouteAllowedInFocusedMode('/planning', true)).toBe(false);
    expect(isRouteAllowedInFocusedMode('/cost-control', true)).toBe(false);
    expect(isRouteAllowedInFocusedMode('/system-admin', true)).toBe(false);
    expect(isRouteAllowedInFocusedMode('/projects/import', true)).toBe(false);

    // Allowed when Focused Mode is disabled
    expect(isRouteAllowedInFocusedMode('/boq', false)).toBe(true);
    expect(isRouteAllowedInFocusedMode('/projects/dashboard', false)).toBe(true);
    expect(isRouteAllowedInFocusedMode('/system-admin', false)).toBe(true);
  });
});
