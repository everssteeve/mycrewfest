export function buildFollowedSet(followed: { festivalId: string }[]): Set<string> {
  const set = new Set<string>();
  for (const f of followed) {
    set.add(f.festivalId);
  }
  return set;
}

export function isFollowedFestival(followedIds: Set<string>, festivalId: string): boolean {
  return followedIds.has(festivalId);
}
