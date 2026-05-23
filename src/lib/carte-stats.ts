export interface VenueCoordinatable {
  latitude: number | null;
  longitude: number | null;
}

export interface VenueEventCountable extends VenueCoordinatable {
  events: Array<unknown>;
}

export interface CrewPositionable {
  userId: string;
}

/**
 * Returns the number of venues that have non-null latitude and longitude.
 */
export function countMappedVenues<T extends VenueCoordinatable>(venues: T[]): number {
  return venues.filter((v) => v.latitude != null && v.longitude != null).length;
}

/**
 * Returns the total number of events across venues that have coordinates.
 * Venues without coordinates are excluded.
 */
export function countEventsOnMap<T extends VenueEventCountable>(venues: T[]): number {
  return venues
    .filter((v) => v.latitude != null && v.longitude != null)
    .reduce((sum, v) => sum + v.events.length, 0);
}

/**
 * Returns the number of distinct crew members sharing their position.
 */
export function countVisibleCrewMembers<T extends CrewPositionable>(
  positions: T[],
): number {
  return positions.length;
}
