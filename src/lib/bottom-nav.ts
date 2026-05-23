/**
 * Pure helpers for bottom navigation contextual routing.
 * No React dependency — fully unit-testable.
 */

/**
 * Extracts the fest event ID from a Next.js pathname.
 * Returns null when the current path is not inside a fest event.
 *
 * Examples:
 *   /festevent/abc123/programme → "abc123"
 *   /festevent/abc123           → "abc123"
 *   /catalogue                  → null
 *   /profil                     → null
 */
export function extractFestEventId(pathname: string): string | null {
  const match = pathname.match(/^\/festevent\/([^/]+)/);
  return match?.[1] ?? null;
}

/**
 * Builds a contextual href for a bottom-nav tab.
 *
 * When the user is inside a fest event, links directly to that fest event's
 * section. Otherwise falls back to the provided global route.
 *
 * @param section     - fest event sub-route, e.g. "programme", "carte", "crew"
 * @param festEventId - current fest event ID (null when outside a fest event)
 * @param fallback    - global route to use when outside a fest event
 */
export function buildContextualHref(
  section: string,
  festEventId: string | null,
  fallback: string,
): string {
  if (festEventId) return `/festevent/${festEventId}/${section}`;
  return fallback;
}

/**
 * Returns true when the given pathname should be considered "active" for a tab
 * whose href is `tabHref`.
 *
 * For contextual tabs (those whose href depends on a fest event ID), we also
 * match when the current pathname ends with `/${section}` inside any fest event.
 *
 * @param pathname - current Next.js pathname
 * @param tabHref  - the href built by buildContextualHref (or a static href)
 * @param section  - optional fest event sub-route for contextual matching
 */
export function isTabActive(pathname: string, tabHref: string, section?: string): boolean {
  if (pathname.startsWith(tabHref)) return true;
  if (section) {
    return pathname.startsWith(`/festevent/`) && pathname.includes(`/${section}`);
  }
  return false;
}
