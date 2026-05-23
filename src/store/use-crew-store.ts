"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CrewData, GeoPosition, QuickStatus, Signal } from "@/types";

interface CrewState {
  // Current crew the user belongs to for the active FestEvent
  crew: CrewData | null;
  setCrew: (crew: CrewData | null) => void;

  // Last known positions of crew members (live-updated via WebSocket/SSE)
  memberPositions: Record<string, GeoPosition>; // { [userId]: GeoPosition }
  updateMemberPosition: (userId: string, pos: GeoPosition) => void;

  // Whether the current user has geoloc sharing enabled
  myGeolocEnabled: boolean;
  setMyGeolocEnabled: (enabled: boolean) => void;

  // Active crowd / discovery signals
  activeSignals: Signal[];
  addSignal: (signal: Signal) => void;
  removeSignal: (signalId: string) => void;

  // Shared rally point set by the crew admin
  rallyPoint: { lat: number; lng: number; description?: string } | null;
  setRallyPoint: (point: { lat: number; lng: number; description?: string } | null) => void;

  // User's current quick status visible to the crew
  quickStatus: QuickStatus | null;
  setQuickStatus: (status: QuickStatus | null) => void;
}

export const useCrewStore = create<CrewState>()(
  persist(
    (set) => ({
      crew: null,
      setCrew: (crew) => set({ crew }),

      memberPositions: {},
      updateMemberPosition: (userId, pos) =>
        set((state) => ({
          memberPositions: { ...state.memberPositions, [userId]: pos },
        })),

      myGeolocEnabled: false,
      setMyGeolocEnabled: (enabled) => set({ myGeolocEnabled: enabled }),

      activeSignals: [],
      addSignal: (signal) =>
        set((state) => ({
          activeSignals: [...state.activeSignals.filter((s) => s.id !== signal.id), signal],
        })),
      removeSignal: (signalId) =>
        set((state) => ({
          activeSignals: state.activeSignals.filter((s) => s.id !== signalId),
        })),

      rallyPoint: null,
      setRallyPoint: (point) => set({ rallyPoint: point }),

      quickStatus: null,
      setQuickStatus: (status) => set({ quickStatus: status }),
    }),
    {
      name: "mcf-crew",
      storage: createJSONStorage(() => localStorage),
      // Member positions are ephemeral — don't persist to avoid stale geo data
      partialize: (state) => {
        // biome-ignore lint/performance/noDelete: intentional exclusion of live state
        const { memberPositions: _mp, activeSignals: _as, ...rest } = state;
        return rest;
      },
    },
  ),
);
