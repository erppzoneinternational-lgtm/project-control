'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DailyProgress, DailyProgressLine } from '@/types/planning';

export interface DailyDraftStore {
  header: Partial<DailyProgress>;
  lines: Partial<DailyProgressLine>[];
  idempotencyKey: string;
  setDraft: (header: Partial<DailyProgress>, lines?: Partial<DailyProgressLine>[]) => void;
  updateHeader: (patch: Partial<DailyProgress>) => void;
  addLine: (line: Partial<DailyProgressLine>) => void;
  updateLine: (indexOrId: number | string, patch: Partial<DailyProgressLine>) => void;
  removeLine: (indexOrId: number | string) => void;
  clearDraft: () => void;
  generateIdempotencyKey: () => string;
}

const generateKey = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const useDailyDraftStore = create<DailyDraftStore>()(
  persist(
    (set, get) => ({
      header: {},
      lines: [],
      idempotencyKey: generateKey(),

      setDraft: (header, lines = []) => {
        set({
          header,
          lines,
          idempotencyKey: header.idempotency_key || get().idempotencyKey || generateKey(),
        });
      },

      updateHeader: (patch) => {
        set((state) => ({
          header: { ...state.header, ...patch },
        }));
      },

      addLine: (line) => {
        set((state) => ({
          lines: [...state.lines, line],
        }));
      },

      updateLine: (indexOrId, patch) => {
        set((state) => {
          const newLines = [...state.lines];
          if (typeof indexOrId === 'number') {
            if (indexOrId >= 0 && indexOrId < newLines.length) {
              newLines[indexOrId] = { ...newLines[indexOrId], ...patch };
            }
          } else {
            const idx = newLines.findIndex((l) => l.id === indexOrId);
            if (idx !== -1) {
              newLines[idx] = { ...newLines[idx], ...patch };
            }
          }
          return { lines: newLines };
        });
      },

      removeLine: (indexOrId) => {
        set((state) => {
          if (typeof indexOrId === 'number') {
            return {
              lines: state.lines.filter((_, idx) => idx !== indexOrId),
            };
          }
          return {
            lines: state.lines.filter((l) => l.id !== indexOrId),
          };
        });
      },

      clearDraft: () => {
        set({
          header: {},
          lines: [],
          idempotencyKey: generateKey(),
        });
      },

      generateIdempotencyKey: () => {
        const newKey = generateKey();
        set({ idempotencyKey: newKey });
        return newKey;
      },
    }),
    {
      name: 'pzone_daily_draft_storage',
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
