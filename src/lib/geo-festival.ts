import { haversineDistanceKm } from "@/lib/travel-time";

export interface GeoFestival {
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Computes the distance in km between user coords and a festival.
 * Returns null if the festival has no coordinates.
 */
export function distanceToFestivalKm(
  userLat: number,
  userLng: number,
  festival: GeoFestival,
): number | null {
  if (festival.latitude == null || festival.longitude == null) return null;
  return haversineDistanceKm(userLat, userLng, festival.latitude, festival.longitude);
}

/**
 * Formats a distance in km for display.
 */
export function formatDistanceKm(km: number): string {
  if (km < 1) return "< 1 km";
  if (km < 10) return `${km.toFixed(1).replace(/\.0$/, "")} km`;
  return `${Math.round(km)} km`;
}

/**
 * Sorts festivals by distance to user. Festivals without coordinates are placed last.
 */
export function sortByDistance<T extends GeoFestival>(
  festivals: T[],
  userLat: number,
  userLng: number,
): Array<T & { distanceKm: number | null }> {
  return festivals
    .map((f) => ({
      ...f,
      distanceKm: distanceToFestivalKm(userLat, userLng, f),
    }))
    .sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
}

/**
 * Returns only festivals within `radiusKm` of the user (null-coord festivals excluded).
 */
export function filterWithinRadius<T extends GeoFestival>(
  festivals: T[],
  userLat: number,
  userLng: number,
  radiusKm: number,
): Array<T & { distanceKm: number }> {
  return festivals.flatMap((f) => {
    const d = distanceToFestivalKm(userLat, userLng, f);
    if (d == null || d > radiusKm) return [];
    return [{ ...f, distanceKm: d }];
  });
}
