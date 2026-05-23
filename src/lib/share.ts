export type ShareResult = "shared" | "copied" | "unavailable" | "cancelled";

export interface SharePayload {
  title: string;
  text?: string;
  url: string;
}

export async function shareOrCopy(payload: SharePayload): Promise<ShareResult> {
  // Try native Web Share API first (mobile / supported browsers)
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(payload);
      return "shared";
    } catch (err) {
      // User cancelled the share sheet (DOMException or Error with AbortError name)
      if (
        (err instanceof DOMException || err instanceof Error) &&
        (err as { name?: string }).name === "AbortError"
      ) {
        return "cancelled";
      }
      // Fall through to clipboard
    }
  }

  // Clipboard fallback
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(payload.url);
      return "copied";
    } catch {
      return "unavailable";
    }
  }

  return "unavailable";
}

export function buildFestivalSharePayload(
  festivalName: string,
  slug: string,
  baseUrl = ""
): SharePayload {
  const url = `${baseUrl}/festival/${slug}`;
  return {
    title: festivalName,
    text: `Découvre ${festivalName} sur MyCrewFest`,
    url,
  };
}

export function buildArtistSharePayload(
  artistName: string,
  artistId: string,
  baseUrl = ""
): SharePayload {
  const url = `${baseUrl}/artiste/${artistId}`;
  return {
    title: artistName,
    text: `Découvre ${artistName} sur MyCrewFest`,
    url,
  };
}
