/**
 * Offline layer — Dexie-based IndexedDB cache for MyCrewFest.
 *
 * Tables:
 *  - festivals   : basic festival data for offline search
 *  - festevents  : user's FestEvent metadata
 *  - events      : programme attached to a FestEvent
 *  - selections  : pending selection changes (to sync)
 *  - souvenirs   : pending souvenir entries (to sync)
 *  - newsItems   : news feed cache (read-only)
 */

import Dexie, { type Table } from "dexie";
import type { OfflineEvent, OfflineFestival } from "@/types";

// ---------------------------------------------------------------------------
// Pending row types (rows waiting to be synced)
// ---------------------------------------------------------------------------

interface PendingSelection {
  id?: number; // auto-increment primary key
  eventId: string;
  festEventId: string;
  status: string | null; // null = remove selection
  updatedAt: string;
}

interface PendingSouvenir {
  id?: number;
  festEventId: string;
  payload: unknown;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// DB class
// ---------------------------------------------------------------------------

class MyCrewFestDB extends Dexie {
  festivals!: Table<OfflineFestival, string>;
  events!: Table<OfflineEvent, string>;
  festevents!: Table<{ id: string; data: unknown }, string>;
  selections!: Table<PendingSelection, number>;
  souvenirs!: Table<PendingSouvenir, number>;
  newsItems!: Table<{ id: string; festivalId: string; data: unknown }, string>;

  constructor() {
    super("MyCrewFestDB");

    this.version(1).stores({
      // Primary key first, then indexed fields
      festivals: "id, name, slug, city, startDate, endDate, festivalType",
      events: "id, festEventId, startTime, eventType, status",
      festevents: "id",
      selections: "++id, festEventId, eventId, updatedAt",
      souvenirs: "++id, festEventId, createdAt",
      newsItems: "id, festivalId",
    });
  }
}

export const db = new MyCrewFestDB();

// ---------------------------------------------------------------------------
// Festivals
// ---------------------------------------------------------------------------

/**
 * Upsert an array of festivals into the local cache.
 */
export async function cacheFestivals(festivals: OfflineFestival[]): Promise<void> {
  await db.festivals.bulkPut(festivals);
}

/**
 * Full-text search over locally cached festivals.
 * Searches across name, city, and country (case-insensitive).
 */
export async function searchFestivalsOffline(query: string): Promise<OfflineFestival[]> {
  if (!query.trim()) {
    return db.festivals.toArray();
  }

  const lower = query.toLowerCase();
  return db.festivals
    .filter((f) => {
      return (
        f.name.toLowerCase().includes(lower) ||
        f.city.toLowerCase().includes(lower) ||
        f.country.toLowerCase().includes(lower)
      );
    })
    .toArray();
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/**
 * Cache the programme for a given FestEvent.
 * Existing events for this FestEvent are replaced entirely.
 */
export async function cacheEvents(festEventId: string, events: OfflineEvent[]): Promise<void> {
  // Ensure each event carries the festEventId so we can filter later
  const enriched = events.map((e) => ({ ...e, festEventId }));

  await db.transaction("rw", db.events, async () => {
    await db.events.where("festEventId").equals(festEventId).delete();
    await db.events.bulkPut(enriched);
  });
}

/**
 * Retrieve the cached programme for a given FestEvent.
 */
export async function getEventsOffline(festEventId: string): Promise<OfflineEvent[]> {
  return db.events.where("festEventId").equals(festEventId).toArray();
}

// ---------------------------------------------------------------------------
// Sync — Selections
// ---------------------------------------------------------------------------

/**
 * Flush all pending selections to the API.
 * Rows are processed in insertion order. Successfully synced rows are deleted.
 */
export async function syncPendingSelections(): Promise<void> {
  const pending = await db.selections.orderBy("updatedAt").toArray();

  for (const row of pending) {
    try {
      const url = `/api/festevents/${row.festEventId}/selections`;

      if (row.status === null) {
        await fetch(`${url}/${row.eventId}`, { method: "DELETE" });
      } else {
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: row.eventId, status: row.status }),
        });
      }

      if (row.id !== undefined) {
        await db.selections.delete(row.id);
      }
    } catch {
      // Leave the row in the queue — will retry on next sync attempt
    }
  }
}

// ---------------------------------------------------------------------------
// Queue — Souvenirs (offline write path)
// ---------------------------------------------------------------------------

/**
 * Store a souvenir locally in Dexie to be synced when back online.
 *
 * @param festEventId - The FestEvent this souvenir belongs to.
 * @param payload     - The souvenir body (same shape as POST /api/festevents/[id]/souvenirs).
 */
export async function queueSouvenirOffline(
  festEventId: string,
  payload: {
    eventId?: string;
    freeText?: string;
    note?: string;
    photos?: string[];
    timestamp?: string;
  },
): Promise<void> {
  try {
    await db.souvenirs.add({
      festEventId,
      payload,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // Silently ignore — worst case the souvenir is lost offline
  }
}

// ---------------------------------------------------------------------------
// Sync — Souvenirs
// ---------------------------------------------------------------------------

/**
 * Flush all pending souvenirs to the API.
 */
export async function syncPendingSouvenirs(): Promise<void> {
  const pending = await db.souvenirs.orderBy("createdAt").toArray();

  for (const row of pending) {
    try {
      await fetch(`/api/festevents/${row.festEventId}/souvenirs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row.payload),
      });

      if (row.id !== undefined) {
        await db.souvenirs.delete(row.id);
      }
    } catch {
      // Leave the row in the queue
    }
  }
}
