import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
import { StakeholdersUnifiedNavTabs } from '../StakeholdersUnifiedNavTabs';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    locale: 'ar',
    t: (k: string) => k,
    toggleLocale: vi.fn(),
  }),
}));

describe('StakeholdersUnifiedNavTabs', () => {
  it('renders both Entities and People switcher tabs with count badges in navigation mode', () => {
    const html = renderToStaticMarkup(
      <StakeholdersUnifiedNavTabs
        activeTab="entities"
        entitiesCount={56}
        peopleCount={356}
      />
    );

    expect(html).toContain('الشركات والملاك والمطورون');
    expect(html).toContain('الأفراد وممثلو الجهات');
    expect(html).toContain('56');
    expect(html).toContain('356');
    expect(html).toContain('href="/clients"');
    expect(html).toContain('href="/stakeholders"');
  });

  it('renders ARIA tablist mode when inline onTabChange callback is supplied', () => {
    const html = renderToStaticMarkup(
      <StakeholdersUnifiedNavTabs
        activeTab="people"
        entitiesCount={56}
        peopleCount={356}
        onTabChange={() => {}}
      />
    );

    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tab"');
  });
});
