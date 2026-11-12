'use client';

import { create } from 'zustand';

export type NavLayoutMode = 'topbar' | 'sidebar';
export type NavDensityMode = 'standard' | 'compact';
export type SidebarDensity = 'standard' | 'compact';

export interface NavWidgetsVisibility {
  showSearch: boolean;
  showProjectSelector: boolean;
  showProjectStructure: boolean;
  showNotifications: boolean;
  showThemeToggle: boolean;
  showFontCustomizer: boolean;
  showLanguageToggle: boolean;
  showGuidedTour: boolean;
  showChangelog: boolean;
  showAdminShortcut: boolean;
}

export interface NavPreferencesState {
  layoutMode: NavLayoutMode;
  densityMode: NavDensityMode;
  sidebarCollapsed: boolean;
  sidebarDensity: SidebarDensity;
  collapsedSidebarGroups: Record<string, boolean>;
  isCustomizerOpen: boolean;
  widgets: NavWidgetsVisibility;

  // Actions
  setLayoutMode: (mode: NavLayoutMode) => void;
  setDensityMode: (mode: NavDensityMode) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarDensity: (density: SidebarDensity) => void;
  toggleSidebarDensity: () => void;
  toggleSidebarGroup: (groupKey: string) => void;
  collapseAllSidebarGroups: (groupKeys: string[]) => void;
  expandAllSidebarGroups: () => void;
  setIsCustomizerOpen: (open: boolean) => void;
  openCustomizer: () => void;
  closeCustomizer: () => void;
  toggleWidget: (widget: keyof NavWidgetsVisibility) => void;
  setWidgetVisibility: (widget: keyof NavWidgetsVisibility, visible: boolean) => void;

  // Presets
  applyMinimalistCleanPreset: () => void;
  applyCompactSingleRowPreset: () => void;
  applySidebarPreset: () => void;
  applyDefaultFullPreset: () => void;
  resetToDefaults: () => void;
}

export const STORAGE_KEY = 'pzone_nav_preferences';

const DEFAULT_WIDGETS: NavWidgetsVisibility = {
  showSearch: true,
  showProjectSelector: true,
  showProjectStructure: true,
  showNotifications: true,
  showThemeToggle: true,
  showFontCustomizer: true,
  showLanguageToggle: true,
  showGuidedTour: true,
  showChangelog: true,
  showAdminShortcut: true,
};

const CLEAN_MINIMALIST_WIDGETS: NavWidgetsVisibility = {
  showSearch: true,
  showProjectSelector: true,
  showProjectStructure: false,
  showNotifications: true,
  showThemeToggle: true,
  showFontCustomizer: false,
  showLanguageToggle: true,
  showGuidedTour: false,
  showChangelog: false,
  showAdminShortcut: false,
};

interface StoredPreferences {
  layoutMode?: NavLayoutMode;
  densityMode?: NavDensityMode;
  sidebarCollapsed?: boolean;
  sidebarDensity?: SidebarDensity;
  collapsedSidebarGroups?: Record<string, boolean>;
  widgets?: Partial<NavWidgetsVisibility>;
}

const loadStoredPreferences = (): {
  layoutMode: NavLayoutMode;
  densityMode: NavDensityMode;
  sidebarCollapsed: boolean;
  sidebarDensity: SidebarDensity;
  collapsedSidebarGroups: Record<string, boolean>;
  widgets: NavWidgetsVisibility;
} => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: StoredPreferences = JSON.parse(raw);
        return {
          layoutMode: parsed.layoutMode === 'sidebar' ? 'sidebar' : 'topbar',
          densityMode: parsed.densityMode === 'compact' ? 'compact' : 'standard',
          sidebarCollapsed: Boolean(parsed.sidebarCollapsed),
          sidebarDensity: parsed.sidebarDensity === 'compact' ? 'compact' : 'standard',
          collapsedSidebarGroups: parsed.collapsedSidebarGroups || {},
          widgets: {
            ...DEFAULT_WIDGETS,
            ...(parsed.widgets || {}),
          },
        };
      }
    } catch {
      // Fallback on corrupt json
    }
  }

  return {
    layoutMode: 'topbar',
    densityMode: 'standard',
    sidebarCollapsed: false,
    sidebarDensity: 'compact', // Default sidebar density to compact for high screen efficiency
    collapsedSidebarGroups: {},
    widgets: { ...DEFAULT_WIDGETS },
  };
};

const savePreferences = (state: {
  layoutMode: NavLayoutMode;
  densityMode: NavDensityMode;
  sidebarCollapsed: boolean;
  sidebarDensity: SidebarDensity;
  collapsedSidebarGroups: Record<string, boolean>;
  widgets: NavWidgetsVisibility;
}) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          layoutMode: state.layoutMode,
          densityMode: state.densityMode,
          sidebarCollapsed: state.sidebarCollapsed,
          sidebarDensity: state.sidebarDensity,
          collapsedSidebarGroups: state.collapsedSidebarGroups,
          widgets: state.widgets,
        })
      );
    } catch {
      // Ignore quota errors
    }
  }
};

const initial = loadStoredPreferences();

export const useNavPreferencesStore = create<NavPreferencesState>((set, get) => ({
  layoutMode: initial.layoutMode,
  densityMode: initial.densityMode,
  sidebarCollapsed: initial.sidebarCollapsed,
  sidebarDensity: initial.sidebarDensity,
  collapsedSidebarGroups: initial.collapsedSidebarGroups,
  isCustomizerOpen: false,
  widgets: initial.widgets,

  setLayoutMode: (mode: NavLayoutMode) => {
    set((state) => {
      const next = { ...state, layoutMode: mode };
      savePreferences(next);
      return { layoutMode: mode };
    });
  },

  setDensityMode: (mode: NavDensityMode) => {
    set((state) => {
      const next = { ...state, densityMode: mode };
      savePreferences(next);
      return { densityMode: mode };
    });
  },

  setSidebarCollapsed: (collapsed: boolean) => {
    set((state) => {
      const next = { ...state, sidebarCollapsed: collapsed };
      savePreferences(next);
      return { sidebarCollapsed: collapsed };
    });
  },

  toggleSidebarCollapsed: () => {
    set((state) => {
      const nextCollapsed = !state.sidebarCollapsed;
      const next = { ...state, sidebarCollapsed: nextCollapsed };
      savePreferences(next);
      return { sidebarCollapsed: nextCollapsed };
    });
  },

  setSidebarDensity: (density: SidebarDensity) => {
    set((state) => {
      const next = { ...state, sidebarDensity: density };
      savePreferences(next);
      return { sidebarDensity: density };
    });
  },

  toggleSidebarDensity: () => {
    set((state) => {
      const nextDensity: SidebarDensity = state.sidebarDensity === 'compact' ? 'standard' : 'compact';
      const next = { ...state, sidebarDensity: nextDensity };
      savePreferences(next);
      return { sidebarDensity: nextDensity };
    });
  },

  toggleSidebarGroup: (groupKey: string) => {
    set((state) => {
      const nextGroups = {
        ...state.collapsedSidebarGroups,
        [groupKey]: !state.collapsedSidebarGroups[groupKey],
      };
      const next = { ...state, collapsedSidebarGroups: nextGroups };
      savePreferences(next);
      return { collapsedSidebarGroups: nextGroups };
    });
  },

  collapseAllSidebarGroups: (groupKeys: string[]) => {
    set((state) => {
      const nextGroups: Record<string, boolean> = {};
      groupKeys.forEach((k) => {
        nextGroups[k] = true;
      });
      const next = { ...state, collapsedSidebarGroups: nextGroups };
      savePreferences(next);
      return { collapsedSidebarGroups: nextGroups };
    });
  },

  expandAllSidebarGroups: () => {
    set((state) => {
      const next = { ...state, collapsedSidebarGroups: {} };
      savePreferences(next);
      return { collapsedSidebarGroups: {} };
    });
  },

  setIsCustomizerOpen: (open: boolean) => set({ isCustomizerOpen: open }),
  openCustomizer: () => set({ isCustomizerOpen: true }),
  closeCustomizer: () => set({ isCustomizerOpen: false }),

  toggleWidget: (widgetKey: keyof NavWidgetsVisibility) => {
    set((state) => {
      const nextWidgets = {
        ...state.widgets,
        [widgetKey]: !state.widgets[widgetKey],
      };
      const next = { ...state, widgets: nextWidgets };
      savePreferences(next);
      return { widgets: nextWidgets };
    });
  },

  setWidgetVisibility: (widgetKey: keyof NavWidgetsVisibility, visible: boolean) => {
    set((state) => {
      const nextWidgets = {
        ...state.widgets,
        [widgetKey]: visible,
      };
      const next = { ...state, widgets: nextWidgets };
      savePreferences(next);
      return { widgets: nextWidgets };
    });
  },

  // Presets
  applyMinimalistCleanPreset: () => {
    set((state) => {
      const next = {
        ...state,
        layoutMode: 'topbar' as NavLayoutMode,
        densityMode: 'compact' as NavDensityMode,
        widgets: { ...CLEAN_MINIMALIST_WIDGETS },
      };
      savePreferences(next);
      return {
        layoutMode: 'topbar',
        densityMode: 'compact',
        widgets: { ...CLEAN_MINIMALIST_WIDGETS },
      };
    });
  },

  applyCompactSingleRowPreset: () => {
    set((state) => {
      const next = {
        ...state,
        layoutMode: 'topbar' as NavLayoutMode,
        densityMode: 'compact' as NavDensityMode,
      };
      savePreferences(next);
      return {
        layoutMode: 'topbar',
        densityMode: 'compact',
      };
    });
  },

  applySidebarPreset: () => {
    set((state) => {
      const next = {
        ...state,
        layoutMode: 'sidebar' as NavLayoutMode,
        densityMode: 'compact' as NavDensityMode,
        sidebarDensity: 'compact' as SidebarDensity,
        sidebarCollapsed: false,
      };
      savePreferences(next);
      return {
        layoutMode: 'sidebar',
        densityMode: 'compact',
        sidebarDensity: 'compact',
        sidebarCollapsed: false,
      };
    });
  },

  applyDefaultFullPreset: () => {
    set((state) => {
      const next = {
        ...state,
        layoutMode: 'topbar' as NavLayoutMode,
        densityMode: 'standard' as NavDensityMode,
        sidebarDensity: 'standard' as SidebarDensity,
        collapsedSidebarGroups: {},
        widgets: { ...DEFAULT_WIDGETS },
      };
      savePreferences(next);
      return {
        layoutMode: 'topbar',
        densityMode: 'standard',
        sidebarDensity: 'standard',
        collapsedSidebarGroups: {},
        widgets: { ...DEFAULT_WIDGETS },
      };
    });
  },

  resetToDefaults: () => {
    set((state) => {
      const next = {
        ...state,
        layoutMode: 'topbar' as NavLayoutMode,
        densityMode: 'standard' as NavDensityMode,
        sidebarCollapsed: false,
        sidebarDensity: 'compact' as SidebarDensity,
        collapsedSidebarGroups: {},
        widgets: { ...DEFAULT_WIDGETS },
      };
      savePreferences(next);
      return {
        layoutMode: 'topbar',
        densityMode: 'standard',
        sidebarCollapsed: false,
        sidebarDensity: 'compact',
        collapsedSidebarGroups: {},
        widgets: { ...DEFAULT_WIDGETS },
      };
    });
  },
}));
