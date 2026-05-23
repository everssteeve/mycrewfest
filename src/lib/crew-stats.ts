export interface CrewRoleable {
  role: string;
}

export interface CrewGeolocable {
  geolocStatus: string;
}

/**
 * Returns the number of crew members with role === "admin".
 */
export function countCrewAdmins<T extends CrewRoleable>(members: T[]): number {
  return members.filter((m) => m.role === "admin").length;
}

/**
 * Returns the number of crew members whose geolocStatus is "active" or "background"
 * (i.e. they are sharing their location in some form).
 */
export function countCrewMembersWithGeoloc<T extends CrewGeolocable>(members: T[]): number {
  return members.filter((m) => m.geolocStatus === "active" || m.geolocStatus === "background")
    .length;
}

/**
 * Returns the number of crew members whose geolocStatus is "active"
 * (real-time foreground sharing).
 */
export function countCrewMembersActiveGeoloc<T extends CrewGeolocable>(members: T[]): number {
  return members.filter((m) => m.geolocStatus === "active").length;
}
