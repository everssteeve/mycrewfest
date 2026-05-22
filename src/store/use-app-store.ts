"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SyncOperation } from "@/types";

interface AppState {
  // Network connectivity
  isOffline: boolean;
  setOffline: (val: boolean) => void;

  // Queue of operations that failed while offline and need to be replayed
  offlineSyncQueue: SyncOperation[];
  addToSyncQueue: (op: SyncOperation) => void;
  clearSyncQueue: () => void;

  // Festival mode: groups / batches notifications to avoid interrupting the
  // live experience
  festivalMode: boolean;
  setFestivalMode: (val: boolean) => void;

  // ID of the FestEvent currently being browsed (used for routing context)
  currentFestEventId: string | null;
  setCurrentFestEventId: (id: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isOffline: false,
      setOffline: (val) => set({ isOffline: val }),

      offlineSyncQueue: [],
      addToSyncQueue: (op) =>
        set((state) => ({
          offlineSyncQueue: [...state.offlineSyncQueue, op],
        })),
      clearSyncQueue: () => set({ offlineSyncQueue: [] }),

      festivalMode: false,
      setFestivalMode: (val) => set({ festivalMode: val }),

      currentFestEventId: null,
      setCurrentFestEventId: (id) => set({ currentFestEventId: id }),
    }),
    {
      name: "mcf-app",
      storage: createJSONStorage(() => localStorage),
      // isOffline is runtime state — derive it from navigator.onLine on mount
      partialize: (state) => {
        const { isOffline: _io, ...rest } = state;
        return rest;
      },
    },
  ),
);
