export function buildFollowApiUrl(slug: string): string {
  return `/api/festivals/${slug}/follow`;
}

export function getFollowToggleAriaLabel(followed: boolean, festivalName: string): string {
  return followed ? `Ne plus suivre ${festivalName}` : `Suivre ${festivalName}`;
}

export function getFollowButtonLabel(followed: boolean): string {
  return followed ? "Suivi" : "Suivre";
}

export function getFollowToggleMethod(currentlyFollowed: boolean): "POST" | "DELETE" {
  return currentlyFollowed ? "DELETE" : "POST";
}

export function deriveOptimisticFollowState(
  current: boolean,
  serverSuccess: boolean,
  toggleWasFollow: boolean,
): boolean {
  if (!serverSuccess) return current;
  return toggleWasFollow;
}
