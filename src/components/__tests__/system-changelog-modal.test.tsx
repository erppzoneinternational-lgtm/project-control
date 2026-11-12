import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { SystemChangelogModal } from '../ui/SystemChangelogModal';
import { useSystemChangelogStore, CHANGELOG_STORAGE_KEY } from '@/lib/stores/useSystemChangelogStore';
import { LATEST_PORTAL_VERSION } from '@/lib/changelog/systemUpdates';

// Mock language context
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    locale: 'ar',
    t: (key: string) => key,
  }),
}));

describe('System Updates & Change Log Modal (ما الجديد في التحديث)', () => {
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};
    const storageMock: Storage = {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
      key: vi.fn(),
      length: 0,
    };

    if (typeof window === 'undefined') {
      (global as any).window = {
        localStorage: storageMock,
      };
    } else {
      Object.defineProperty(window, 'localStorage', {
        value: storageMock,
        writable: true,
      });
    }
    (global as any).localStorage = storageMock;

    useSystemChangelogStore.setState({
      isOpen: false,
      hasUnreadUpdate: false,
      selectedVersion: LATEST_PORTAL_VERSION,
      dontShowAgain: true,
    });
  });

  it('detects unseen version on checkAutoPrompt and opens modal automatically', () => {
    // 1. Initial state: user has never seen changelog (localStorage is empty)
    expect(localStorage.getItem(CHANGELOG_STORAGE_KEY)).toBeNull();

    const prompted = useSystemChangelogStore.getState().checkAutoPrompt();
    expect(prompted).toBe(true);

    const state = useSystemChangelogStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.hasUnreadUpdate).toBe(true);
    expect(state.selectedVersion).toBe(LATEST_PORTAL_VERSION);
  });

  it('saves seen version to localStorage upon close and does not re-prompt', () => {
    useSystemChangelogStore.getState().checkAutoPrompt();
    expect(useSystemChangelogStore.getState().isOpen).toBe(true);

    // User closes the modal
    useSystemChangelogStore.getState().closeChangelog(true);

    // Verify state updated
    expect(useSystemChangelogStore.getState().isOpen).toBe(false);
    expect(useSystemChangelogStore.getState().hasUnreadUpdate).toBe(false);
    expect(localStorage.getItem(CHANGELOG_STORAGE_KEY)).toBe(LATEST_PORTAL_VERSION);

    // Next time checkAutoPrompt runs, it should NOT prompt
    const secondPrompt = useSystemChangelogStore.getState().checkAutoPrompt();
    expect(secondPrompt).toBe(false);
    expect(useSystemChangelogStore.getState().isOpen).toBe(false);
  });

  it('allows manual open via openChangelog regardless of localStorage state', () => {
    localStorage.setItem(CHANGELOG_STORAGE_KEY, LATEST_PORTAL_VERSION);

    useSystemChangelogStore.getState().openChangelog();
    expect(useSystemChangelogStore.getState().isOpen).toBe(true);
    expect(useSystemChangelogStore.getState().selectedVersion).toBe(LATEST_PORTAL_VERSION);
  });

  it('renders changelog modal with key feature highlights when open', () => {
    useSystemChangelogStore.setState({
      isOpen: true,
      selectedVersion: LATEST_PORTAL_VERSION,
    });

    const html = ReactDOMServer.renderToString(<SystemChangelogModal forceOpen={true} />);

    // Check version and title
    expect(html).toContain(`v${LATEST_PORTAL_VERSION}`);
    expect(html).toContain('الكبسولة الفلكية الطائرة وتجديد الوضع الداكن الشامل');

    // Check key operational highlights of latest release
    expect(html).toContain('الكبسولة الفلكية الطائرة الموحدة (Celestial Corner Hub)');
    expect(html).toContain('تحديث شامل للوضع الداكن عبر أكثر من 175 شاشة ومكوناً');

    // Check action buttons and footer
    expect(html).toContain('فهمت، حسناً');
    expect(html).toContain('عدم إظهار هذه الرسالة تلقائياً لهذا الإصدار');
  });

  it('renders all releases in consolidated mode when selectedVersion is all', () => {
    useSystemChangelogStore.setState({
      isOpen: true,
      selectedVersion: 'all',
    });

    const html = ReactDOMServer.renderToString(<SystemChangelogModal forceOpen={true} initialVersion="all" />);

    expect(html).toContain('سجل كافة التحديثات');
    expect(html).toContain('v3.0.0');
    expect(html).toContain('v2.9.5');
    expect(html).toContain('v2.9.2');
    expect(html).toContain('v2.9.0');
    expect(html).toContain('v2.8.0');
  });
});
