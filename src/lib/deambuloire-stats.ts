export interface SouvenirPhotoable {
  photos: string[];
}

export interface SouvenirEventLinkable {
  eventId: string | null;
}

export interface SouvenirCrewShareable {
  shareWithCrew: boolean;
}

export interface SouvenirTimestamped {
  timestamp: string;
}

/**
 * Returns the number of souvenirs that have at least one photo attached.
 */
export function countSouvenirPhotos<T extends SouvenirPhotoable>(souvenirs: T[]): number {
  return souvenirs.filter((s) => s.photos.length > 0).length;
}

/**
 * Returns the number of souvenirs linked to a specific event (eventId non-null).
 */
export function countLinkedEventSouvenirs<T extends SouvenirEventLinkable>(souvenirs: T[]): number {
  return souvenirs.filter((s) => s.eventId !== null).length;
}

/**
 * Returns the number of souvenirs shared with the crew.
 */
export function countCrewSharedSouvenirs<T extends SouvenirCrewShareable>(souvenirs: T[]): number {
  return souvenirs.filter((s) => s.shareWithCrew).length;
}

/**
 * Returns the souvenirs whose timestamp falls on the same YYYY-MM-DD as `now`
 * (local time).
 */
export function filterTodaySouvenirs<T extends SouvenirTimestamped>(
  souvenirs: T[],
  now = new Date(),
): T[] {
  const today = now.toLocaleDateString("sv-SE");
  return souvenirs.filter((s) => {
    const d = new Date(s.timestamp).toLocaleDateString("sv-SE");
    return d === today;
  });
}
