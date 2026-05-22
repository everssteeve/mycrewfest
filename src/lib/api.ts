/**
 * Shared API types, helpers, and constants for MyCrewFest.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const EVENT_TYPES = [
  "concert",
  "spectacle",
  "atelier",
  "défilé",
  "cypher",
  "conférence",
  "installation",
  "autre",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const FESTIVAL_TYPES = [
  "musique",
  "théâtre_rue",
  "cirque",
  "world",
  "multidisciplinaire",
  "autre",
] as const;
export type FestivalType = (typeof FESTIVAL_TYPES)[number];

export const PROGRAM_TYPES = ["structuré", "déambulatoire", "hybride"] as const;
export type ProgramType = (typeof PROGRAM_TYPES)[number];

export const SELECTION_STATUSES = ["intéressé", "must-see", "vu"] as const;
export type SelectionStatus = (typeof SELECTION_STATUSES)[number];

export const NEWS_CATEGORIES = [
  "line-up",
  "logistique",
  "programme-change",
  "annulation",
  "urgence",
  "autre",
] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

// ---------------------------------------------------------------------------
// API Response types
// ---------------------------------------------------------------------------

export interface ApiError {
  error: string;
  details?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ---------------------------------------------------------------------------
// Festival
// ---------------------------------------------------------------------------

export interface FestivalSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  startDate: string; // ISO
  endDate: string; // ISO
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  festivalType: FestivalType;
  programType: ProgramType;
  capacity: number | null;
  siteUrl: string | null;
  instagramHandle: string | null;
  ingestionStatus: string;
  programStatus: string;
  _count?: {
    events: number;
    followers: number;
  };
  isFollowed?: boolean;
}

export interface VenueSummary {
  id: string;
  name: string;
  type: string;
  capacity: number | null;
  latitude: number | null;
  longitude: number | null;
}

export interface ArtistSummary {
  id: string;
  name: string;
  description: string | null;
  disciplines: string[];
  countryCode: string | null;
  siteUrl: string | null;
  instagram: string | null;
}

export interface EventSummary {
  id: string;
  title: string;
  eventType: EventType;
  startTime: string | null; // ISO
  endTime: string | null; // ISO
  durationMins: number | null;
  access: string;
  status: string;
  tags: string[];
  venue: VenueSummary | null;
  artist: ArtistSummary | null;
}

export interface NewsItem {
  id: string;
  source: string;
  sourceUrl: string | null;
  publishedAt: string; // ISO
  category: NewsCategory;
  summary: string;
  urgencyLevel: string;
  isPinned: boolean;
}

export interface FestivalDetail extends FestivalSummary {
  address: string | null;
  facebookPage: string | null;
  xHandle: string | null;
  mapImageUrl: string | null;
  venues: VenueSummary[];
  events: EventSummary[];
  newsItems: NewsItem[];
}

// ---------------------------------------------------------------------------
// FestEvent
// ---------------------------------------------------------------------------

export interface FestEventSummary {
  id: string;
  mode: string;
  programTypeOverride: ProgramType | null;
  presenceDates: string[];
  arrivalConstraint: string | null;
  departureConstraint: string | null;
  comfortMarginMins: number;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
  festival: FestivalSummary;
  _count?: {
    selections: number;
  };
}

export interface FestEventDetail extends FestEventSummary {
  selections: SelectionWithEvent[];
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

export interface SelectionWithEvent {
  id: string;
  status: SelectionStatus;
  createdAt: string;
  event: EventSummary;
}

export interface EventWithSelection extends EventSummary {
  selection: {
    id: string;
    status: SelectionStatus;
  } | null;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/**
 * Format a date as a localised French day + time string.
 * e.g. "sam. 30 mai, 22h00"
 */
export function formatEventTime(
  isoDate: string | null | undefined,
  opts?: { short?: boolean },
): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "";

  const weekday = d.toLocaleDateString("fr-FR", { weekday: "short" });
  const day = d.getDate();
  const month = d.toLocaleDateString("fr-FR", { month: "short" });
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");

  if (opts?.short) {
    return `${weekday} ${hours}h${mins}`;
  }
  return `${weekday} ${day} ${month}, ${hours}h${mins}`;
}

/**
 * Format a festival date range.
 * e.g. "30 mai – 1er juin 2025"
 */
export function formatFestivalDateRange(
  startIso: string,
  endIso: string,
): string {
  const start = new Date(startIso);
  const end = new Date(endIso);

  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();

  const startDay = start.getDate();
  const endDay = end.getDate();

  const startMonth = start.toLocaleDateString("fr-FR", { month: "long" });
  const endMonth = end.toLocaleDateString("fr-FR", { month: "long" });

  const year = end.getFullYear();

  if (sameMonth && sameYear) {
    return `${startDay} – ${endDay} ${startMonth} ${year}`;
  }

  if (sameYear) {
    return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`;
  }

  return `${startDay} ${startMonth} ${start.getFullYear()} – ${endDay} ${endMonth} ${year}`;
}

/**
 * Parse a JSON string stored in Prisma into a typed array.
 * Returns an empty array on failure.
 */
export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed as string[];
    return [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// SWR fetcher
// ---------------------------------------------------------------------------

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({
      error: `HTTP ${res.status}`,
    }));
    throw new Error(error.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// API client helpers (used by hooks / stores)
// ---------------------------------------------------------------------------

/**
 * POST or DELETE a selection for a given FestEvent + event.
 * Pass `status: null` to remove the selection.
 */
export async function apiUpdateSelection(
  festEventId: string,
  eventId: string,
  status: SelectionStatus | null,
): Promise<void> {
  if (status === null) {
    const res = await fetch(
      `/api/festevents/${festEventId}/selections/${eventId}`,
      { method: "DELETE" },
    );
    if (!res.ok) throw new Error(`DELETE selection failed: ${res.status}`);
    return;
  }

  const res = await fetch(`/api/festevents/${festEventId}/selections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId, status }),
  });
  if (!res.ok) throw new Error(`POST selection failed: ${res.status}`);
}

// ---------------------------------------------------------------------------
// Helpers for building API query strings
// ---------------------------------------------------------------------------

export function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      parts.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
      );
    }
  }
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}
