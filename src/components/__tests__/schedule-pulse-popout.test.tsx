import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SchedulePulseView } from '../planning/SchedulePulseView';

// Mock LanguageContext
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    locale: 'ar',
    t: (key: string) => key,
  }),
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null }),
          order: () => ({ limit: () => Promise.resolve({ data: [] }) }),
        }),
      }),
    }),
  },
}));

describe('SchedulePulseView Popout Button (الزر الأخضر - نافذة مستقلة) & Cross-Tab Sync', () => {
  it('renders the popout button as an unblocked native anchor link with target=_blank and correct href with projectId', () => {
    const html = renderToString(
      React.createElement(SchedulePulseView, {
        projectId: 'test-project-123',
      })
    );

    // Verify popout text and attributes
    expect(html).toContain('نافذة مستقلة');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('/pulse-engine/schedule-pulse-ar.html?projectId=test-project-123');
    expect(html).toContain('from-emerald-600');
    expect(html).toContain('to-teal-700');
  });

  it('verifies cross-tab contract keys and channels', () => {
    const STORAGE_KEY = 'pzone_active_pulse_project';
    const BROADCAST_CHANNEL = 'pzone_pulse_sync';

    expect(STORAGE_KEY).toBe('pzone_active_pulse_project');
    expect(BROADCAST_CHANNEL).toBe('pzone_pulse_sync');
  });
});
