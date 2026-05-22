"use client";

import { useEffect, useState } from "react";
import { syncPendingSelections, syncPendingSouvenirs } from "@/lib/offline";
import { useAppStore } from "@/store/use-app-store";

/**
 * Listens to `navigator.onLine` events and keeps `useAppStore.isOffline` in
 * sync. When the browser comes back online it triggers a best-effort flush of
 * all pending offline operations.
 *
 * @returns `{ isOffline, syncPending }` — syncPending is true while a sync
 * flush is in progress.
 */
export function useOffline(): { isOffline: boolean; syncPending: boolean } {
  const setOffline = useAppStore((s) => s.setOffline);
  const isOffline = useAppStore((s) => s.isOffline);
  const [syncPending, setSyncPending] = useState(false);

  useEffect(() => {
    // Initialise from the current browser state on mount
    const currentlyOffline = typeof navigator !== "undefined" && !navigator.onLine;
    setOffline(currentlyOffline);

    function handleOnline() {
      setOffline(false);
      setSyncPending(true);

      Promise.allSettled([syncPendingSelections(), syncPendingSouvenirs()])
        .catch(() => {
          // Errors are swallowed inside the sync helpers — nothing to do here
        })
        .finally(() => {
          setSyncPending(false);
        });
    }

    function handleOffline() {
      setOffline(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOffline]);

  return { isOffline, syncPending };
}
