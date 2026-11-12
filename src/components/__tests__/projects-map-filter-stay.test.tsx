import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ProjectsPageClient } from '../projects/ProjectsPageClient';
import { resolveBasemap } from '@/lib/map/basemaps';

let mockSearchParamsString = 'tab=map&status=ALL&region=coast';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    locale: 'ar',
    t: (key: string) => key,
    toggleLocale: vi.fn(),
  }),
}));

vi.mock('@/components/layout/EnterpriseAppShell', () => ({
  useEnterpriseShell: () => ({
    isDark: true,
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(mockSearchParamsString),
  usePathname: () => '/projects',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock('@/lib/stores/useAuthStore', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'admin@pzone.com' },
  }),
}));

vi.mock('@/lib/hooks/useUserRoles', () => ({
  useUserRoles: () => ({
    roles: ['admin'],
    isAdmin: true,
  }),
}));

vi.mock('@/lib/hooks/useModuleAccess', () => ({
  useModuleAccess: () => ({
    data: [],
  }),
}));

vi.mock('@/lib/rbac/access-control', () => ({
  canAccessPath: () => true,
  canEditPath: () => true,
}));

vi.mock('@/lib/services/project.service', () => ({
  ProjectService: {
    getUserAssignedProjectIds: vi.fn().mockResolvedValue(null),
    getProjects: vi.fn().mockResolvedValue([]),
    getClients: vi.fn().mockResolvedValue([]),
    getGovernorates: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('next/dynamic', () => ({
  default: () => (props: any) => (
    <div
      data-testid="mock-gis-map"
      data-selected-region={props.selectedRegion || ''}
      data-selected-status={props.selectedStatus || ''}
    >
      GIS Map Active
    </div>
  ),
}));

describe('Map Rendering & Map Filter Stay Regression Suite', () => {
  it('renders map skeleton / map tab active when opened with ?tab=map&status=ALL and normalizes ALL to all', () => {
    mockSearchParamsString = 'tab=map&status=ALL&region=coast';
    const html = ReactDOMServer.renderToStaticMarkup(<ProjectsPageClient />);

    // Map tab must remain selected (aria-selected="true" on #view-tab-map)
    expect(html).toContain('id="view-tab-map" aria-selected="true"');
    expect(html).toContain('id="view-tab-table" aria-selected="false"');
    // Normalized status=ALL -> 'all' must NOT render a broken "تصفية الحالة: ALL" pill
    expect(html).not.toContain('تصفية الحالة: ALL');
  });

  it('bundles leaflet CSS locally in layout.tsx and protects cross-origin tiles in sw.js & next.config.ts', () => {
    const repoRoot = join(__dirname, '..', '..', '..');
    const layoutSrc = readFileSync(join(repoRoot, 'src', 'app', 'layout.tsx'), 'utf8');
    const swSrc = readFileSync(join(repoRoot, 'public', 'sw.js'), 'utf8');
    const nextCfgSrc = readFileSync(join(repoRoot, 'next.config.ts'), 'utf8');

    expect(layoutSrc).toContain("import 'leaflet/dist/leaflet.css'");
    expect(layoutSrc).not.toContain('https://unpkg.com/leaflet');

    expect(swSrc).toContain('url.origin !== self.location.origin');

    const connectSrcLine = nextCfgSrc.split('\n').find((l) => l.includes('connect-src')) ?? '';
    expect(connectSrcLine).toContain('https://server.arcgisonline.com');
  });

  it('attaches reference place-name label overlays to dark and satellite basemaps', () => {
    const darkMap = resolveBasemap('dark', true, undefined);
    expect(darkMap.labelOverlayUrl).toContain('World_Dark_Gray_Reference');

    const satMap = resolveBasemap('satellite', true, undefined);
    expect(satMap.labelOverlayUrl).toContain('World_Boundaries_and_Places');
  });
});
