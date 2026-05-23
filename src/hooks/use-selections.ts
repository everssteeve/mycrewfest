"use client";

import { useCallback, useState } from "react";
import { apiUpdateSelection } from "@/lib/api";
import { useAppStore } from "@/store/use-app-store";
import { useFestEventStore } from "@/store/use-fest-event-store";
import type { SelectionStatus, SyncOperation } from "@/types";

interface UseSelectionsReturn {
  /** Map of eventId → SelectionStatus for this FestEvent */
  selections: Record<string, SelectionStatus>;
  /** Update (or clear) a selection. Optimistic — syncs in background. */
  updateSelection: (eventId: string, status: SelectionStatus | null) => void;
  /** True while a network call for the last update is in-flight */
  isLoading: boolean;
}

/**
 * Manages selections for a given FestEvent.
 *
 * - Reads from and writes to `useFestEventStore` immediately (optimistic).
 * - When online: sends a POST / DELETE to the API in the background.
 * - When offline: adds a `SyncOperation` to `useAppStore.offlineSyncQueue`.
 */
export function useSelections(festEventId: string): UseSelectionsReturn {
  const storeSelections = useFestEventStore((s) => s.selections);
  const storeUpdateSelection = useFestEventStore((s) => s.updateSelection);
  const isOffline = useAppStore((s) => s.isOffline);
  const addToSyncQueue = useAppStore((s) => s.addToSyncQueue);

  const [isLoading, setIsLoading] = useState(false);

  const updateSelection = useCallback(
    (eventId: string, status: SelectionStatus | null) => {
      // 1. Optimistic update in the store
      storeUpdateSelection(eventId, status);

      if (isOffline) {
        // 2a. Offline → queue the operation for later
        const op: SyncOperation = {
          id: `sel-${festEventId}-${eventId}-${Date.now()}`,
          type: "selection",
          endpoint:
            status === null
              ? `/api/festevents/${festEventId}/selections/${eventId}`
              : `/api/festevents/${festEventId}/selections`,
          method: status === null ? "DELETE" : "POST",
          body: status === null ? null : { eventId, status },
          createdAt: new Date().toISOString(),
        };
        addToSyncQueue(op);
        return;
      }

      // 2b. Online → fire-and-forget network call
      setIsLoading(true);
      apiUpdateSelection(festEventId, eventId, status)
        .catch(() => {
          // Network failure: queue for retry without rolling back the UI
          const op: SyncOperation = {
            id: `sel-${festEventId}-${eventId}-${Date.now()}`,
            type: "selection",
            endpoint:
              status === null
                ? `/api/festevents/${festEventId}/selections/${eventId}`
                : `/api/festevents/${festEventId}/selections`,
            method: status === null ? "DELETE" : "POST",
            body: status === null ? null : { eventId, status },
            createdAt: new Date().toISOString(),
          };
          addToSyncQueue(op);
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
    [festEventId, storeUpdateSelection, isOffline, addToSyncQueue],
  );

  return {
    selections: storeSelections,
    updateSelection,
    isLoading,
  };
}
