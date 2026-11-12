'use client';

import { create } from 'zustand';
import { LATEST_PORTAL_VERSION, SYSTEM_RELEASES, SystemReleaseEntry } from '@/lib/changelog/systemUpdates';

export const CHANGELOG_STORAGE_KEY = 'pzone_portal_last_seen_changelog';

export interface SystemChangelogState {
  isOpen: boolean;
  hasUnreadUpdate: boolean;
  selectedVersion: string;
  dontShowAgain: boolean;

  // Actions
  openChangelog: (version?: string) => void;
  closeChangelog: (markAsRead?: boolean) => void;
  checkAutoPrompt: () => boolean;
  toggleDontShowAgain: () => void;
  setSelectedVersion: (version: string) => void;
}

const getStoredVersion = (): string | null => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem(CHANGELOG_STORAGE_KEY);
    } catch {
      return null;
    }
  }
  return null;
};

export const useSystemChangelogStore = create<SystemChangelogState>((set, get) => ({
  isOpen: false,
  hasUnreadUpdate: false,
  selectedVersion: LATEST_PORTAL_VERSION,
  dontShowAgain: true,

  openChangelog: (version?: string) => {
    set({
      isOpen: true,
      selectedVersion: version || LATEST_PORTAL_VERSION,
    });
  },

  closeChangelog: (markAsRead = true) => {
    const { dontShowAgain } = get();
    if (markAsRead && dontShowAgain && typeof window !== 'undefined') {
      try {
        localStorage.setItem(CHANGELOG_STORAGE_KEY, LATEST_PORTAL_VERSION);
      } catch (err) {
        console.error('Failed to save seen changelog version:', err);
      }
    }
    set({
      isOpen: false,
      hasUnreadUpdate: false,
    });
  },

  checkAutoPrompt: () => {
    if (typeof window === 'undefined') return false;

    const stored = getStoredVersion();
    const isNew = stored !== LATEST_PORTAL_VERSION;

    if (isNew) {
      set({
        isOpen: true,
        hasUnreadUpdate: true,
        selectedVersion: LATEST_PORTAL_VERSION,
      });
      return true;
    }

    set({ hasUnreadUpdate: false });
    return false;
  },

  toggleDontShowAgain: () => {
    set((state) => ({ dontShowAgain: !state.dontShowAgain }));
  },

  setSelectedVersion: (version: string) => {
    set({ selectedVersion: version });
  },
}));
