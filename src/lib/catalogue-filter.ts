export interface FollowFilterable {
  isFollowed?: boolean;
}

/** Returns false only when `followedOnly` is true AND the event is not followed. */
export function matchesFollowFilter<T extends FollowFilterable>(
  festival: T,
  followedOnly: boolean,
): boolean {
  if (!followedOnly) return true;
  return festival.isFollowed === true;
}
