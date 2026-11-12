import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: vi.fn(() => ({ locale: 'ar', toggleLocale: vi.fn() })),
}));

import { FloatingCornerHub } from '../FloatingCornerHub';

describe('FloatingCornerHub Celestial Orbital Reactor & Satellites', () => {
  it('renders the Celestial Eclipse Core Orb and all 3 orbital satellites in Lunar Dark mode', () => {
    const html = renderToString(
      <FloatingCornerHub isDark={true} onThemeToggle={vi.fn()} />
    );

    expect(html).toContain('id="tour-global-theme-toggle"');
    expect(html).toContain('id="tour-global-role-guide"');
    expect(html).toContain('id="tour-global-help-tour"');
    expect(html).toContain('id="tour-global-more-tools"');
    expect(html).toContain('ليلي');
  });

  it('renders Solar Daylight Core Orb in Light mode', () => {
    const html = renderToString(
      <FloatingCornerHub isDark={false} onThemeToggle={vi.fn()} />
    );

    expect(html).toContain('id="tour-global-theme-toggle"');
    expect(html).toContain('صباحي');
  });
});
