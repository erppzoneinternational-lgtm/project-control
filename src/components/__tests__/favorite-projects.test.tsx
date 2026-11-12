import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { ProjectCard } from '../ui/ProjectCard';
import { UiverseRevealButton } from '../ui/UiverseRevealButton';
import {
  getFavoritesStorageKey,
  parseFavoriteIds,
  toggleFavoriteIdInSet,
} from '@/lib/hooks/useFavoriteProjects';
import { Project } from '@/types';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    locale: 'ar',
    t: (key: string) => key,
  }),
}));

vi.mock('@/lib/stores/useAuthStore', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    signOut: vi.fn(),
  }),
}));

vi.mock('@/lib/hooks/useUserRoles', () => ({
  useUserRoles: () => ({
    roles: ['admin'],
    isAdmin: true,
    loading: false,
  }),
}));

const sampleProject: Project = {
  id: 'prj-2505',
  project_code: '2505',
  project_name: 'سوان ليك ريزيدنس - 4 حمام سباحة - حسن علام - القاهرة الجديدة - 05-25',
  status: 'finished',
  pzone_role: 'Main Contractor',
  contract_value: 15000000,
  contract_value_egp: 15000000,
  estimated_budget: 13000000,
  estimated_cost: 12000000,
  vos_value: 0,
  total_contract_value: 15000000,
  water_area_m2: 1200,
  water_vol_m3: 1800,
  completion_pct: 100,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('Favorite Projects Wiring & UiverseRevealButton', () => {
  it('parses and deduplicates favorite IDs safely from arrays and JSON strings', () => {
    expect(parseFavoriteIds(['a', ' b ', 'a', '', 123 as unknown as string])).toEqual(['a', 'b']);
    expect(parseFavoriteIds('["prj-1","prj-2","prj-1"]')).toEqual(['prj-1', 'prj-2']);
    expect(parseFavoriteIds('invalid-json')).toEqual([]);
    expect(parseFavoriteIds(null)).toEqual([]);
  });

  it('toggles project IDs into and out of favorite set deterministically', () => {
    const initial = new Set<string>(['prj-1']);
    const addedRes = toggleFavoriteIdInSet(initial, 'prj-2505');
    expect(addedRes.added).toBe(true);
    expect(addedRes.nextIds).toEqual(['prj-1', 'prj-2505']);

    const removedRes = toggleFavoriteIdInSet(new Set(addedRes.nextIds), 'prj-2505');
    expect(removedRes.added).toBe(false);
    expect(removedRes.nextIds).toEqual(['prj-1']);
  });

  it('scopes storage key per user with guest fallback', () => {
    expect(getFavoritesStorageKey('user-uuid-1')).toBe('pzone:favorite-projects:user-uuid-1');
    expect(getFavoritesStorageKey(null)).toBe('pzone:favorite-projects:guest');
  });

  it('renders distinct inactive vs active states on ProjectCard favorite button', () => {
    const inactiveHtml = ReactDOMServer.renderToStaticMarkup(
      <ProjectCard project={sampleProject} lang="ar" isFavorite={false} />
    );
    expect(inactiveHtml).toContain('data-favorite="false"');
    expect(inactiveHtml).toContain('aria-pressed="false"');
    expect(inactiveHtml).toContain('تفضيل');

    const activeHtml = ReactDOMServer.renderToStaticMarkup(
      <ProjectCard project={sampleProject} lang="ar" isFavorite={true} />
    );
    expect(activeHtml).toContain('data-favorite="true"');
    expect(activeHtml).toContain('aria-pressed="true"');
    expect(activeHtml).toContain('مفضل');
    expect(activeHtml).toContain('border-amber-400/90');
    expect(activeHtml).toContain('bg-yellow-400');
  });

  it('scopes hover reveal group (group/reveal) so parent card group hover does not prematurely shrink button', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <UiverseRevealButton label="تفضيل" size="sm" color="yellow" />
    );
    expect(html).toContain('group/reveal');
    expect(html).toContain('group-hover/reveal:scale-[.60]');
  });
});
