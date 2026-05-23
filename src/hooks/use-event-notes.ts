"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildStorageKey,
  parseNotesFromStorage,
  serializeNotesToStorage,
  validateEventNote,
} from "@/lib/event-notes";

export function useEventNotes(festEventId: string) {
  const key = buildStorageKey(festEventId);
  const [notes, setNotesState] = useState<Record<string, string>>({});

  useEffect(() => {
    setNotesState(parseNotesFromStorage(localStorage.getItem(key)));
  }, [key]);

  const setNote = useCallback(
    (eventId: string, text: string) => {
      if (!validateEventNote(text).valid) return;
      setNotesState((prev) => {
        const next = { ...prev, [eventId]: text };
        if (!text.trim()) delete next[eventId];
        try {
          localStorage.setItem(key, serializeNotesToStorage(next));
        } catch {
          // localStorage quota exceeded — silent fail
        }
        return next;
      });
    },
    [key],
  );

  return { notes, setNote };
}
