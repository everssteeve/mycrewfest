"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { FestEventWithDetails, SelectionStatus } from "@/types";

interface FestEventState {
  // Active FestEvent loaded in the app
  activeFestEvent: FestEventWithDetails | null;
  setActiveFestEvent: (fe: FestEventWithDetails | null) => void;

  // Per-event selection status for the active FestEvent
  selections: Record<string, SelectionStatus>;
  updateSelection: (eventId: string, status: SelectionStatus | null) => void;

  // Comfort margin used for conflict detection
  comfortMarginMins: number;
  setComfortMargin: (mins: number) => void;

  // Days the user plans to attend
  presenceDates: string[]; // yyyy-MM-dd
  setPresenceDates: (dates: string[]) => void;

  // Optional travel constraints
  arrivalConstraint: string | null; // ISO datetime
  setArrivalConstraint: (dt: string | null) => void;
  departureConstraint: string | null; // ISO datetime
  setDepartureConstraint: (dt: string | null) => void;
}

export const useFestEventStore = create<FestEventState>()(
  persist(
    (set) => ({
      activeFestEvent: null,
      setActiveFestEvent: (fe) => set({ activeFestEvent: fe }),

      selections: {},
      updateSelection: (eventId, status) =>
        set((state) => {
          const next = { ...state.selections };
          if (status === null) {
            delete next[eventId];
          } else {
            next[eventId] = status;
          }
          return { selections: next };
        }),

      comfortMarginMins: 15,
      setComfortMargin: (mins) => set({ comfortMarginMins: mins }),

      presenceDates: [],
      setPresenceDates: (dates) => set({ presenceDates: dates }),

      arrivalConstraint: null,
      setArrivalConstraint: (dt) => set({ arrivalConstraint: dt }),

      departureConstraint: null,
      setDepartureConstraint: (dt) => set({ departureConstraint: dt }),
    }),
    {
      name: "mcf-fest-event",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
