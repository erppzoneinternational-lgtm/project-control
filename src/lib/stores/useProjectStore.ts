'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ProjectState {
  /** Currently selected project ID (persisted across pages). */
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      activeProjectId: '',
      setActiveProjectId: (id) => set({ activeProjectId: id }),
    }),
    {
      name: 'pzone_active_project',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
    }
  )
);
