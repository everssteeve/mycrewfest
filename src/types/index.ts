// Serialised API types — not Prisma types
// These are the shapes flowing between client, stores, and API routes.

// ---------------------------------------------------------------------------
// Enums / union types
// ---------------------------------------------------------------------------

export type SelectionStatus = "intéressé" | "must-see" | "vu";
export type QuickStatus = "fosse" | "nourriture" | "ralliement" | "rentre";
export type ProgramType = "structuré" | "déambulatoire" | "hybride";
export type FestivalType =
  | "musique"
  | "théâtre_rue"
  | "cirque"
  | "world"
  | "multidisciplinaire"
  | "autre";
export type EventType =
  | "concert"
  | "spectacle"
  | "atelier"
  | "défilé"
  | "cypher"
  | "conférence"
  | "installation"
  | "autre";
export type ConflictLevel = "overlap" | "tight" | "borderline";

// ---------------------------------------------------------------------------
// Geo / sync primitives
// ---------------------------------------------------------------------------

export interface GeoPosition {
  lat: number;
  lng: number;
  updatedAt: string; // ISO string
}

export interface SyncOperation {
  id: string;
  type: "selection" | "souvenir" | "signal";
  endpoint: string;
  method: "POST" | "PUT" | "DELETE";
  body: unknown;
  createdAt: string; // ISO string
}

// ---------------------------------------------------------------------------
// Festival
// ---------------------------------------------------------------------------

export interface FestivalSummary {
  id: string;
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  city: string;
  country: string;
  festivalType: FestivalType;
  programType: ProgramType;
  programStatus: "complet" | "partiel" | "bientôt_disponible";
  confidenceLevel: "auto" | "vérifié_humain";
  isFollowed?: boolean;
  _count?: { events: number; followers: number };
}

export interface FestivalDetail extends FestivalSummary {
  description?: string;
  address?: string;
  siteUrl?: string;
  instagramHandle?: string;
  facebookPage?: string;
  xHandle?: string;
  mapImageUrl?: string;
  capacity?: number;
  ingestionStatus?: string;
  venues: VenueSummary[];
  artists?: ArtistSummary[];
  venueCount?: number;
  recentNews: NewsItemSummary[];
  isFollowed: boolean;
  _count?: { events: number; followers: number };
}

// ---------------------------------------------------------------------------
// Venue
// ---------------------------------------------------------------------------

export interface VenueSummary {
  id: string;
  name: string;
  type: string;
  latitude?: number;
  longitude?: number;
}

// ---------------------------------------------------------------------------
// Artist
// ---------------------------------------------------------------------------

export interface ArtistSummary {
  id: string;
  name: string;
  disciplines?: string[];
  countryCode?: string;
}

// ---------------------------------------------------------------------------
// Event
// ---------------------------------------------------------------------------

export interface EventSummary {
  id: string;
  title: string;
  eventType: EventType;
  startTime?: string; // ISO string
  endTime?: string; // ISO string
  durationMins?: number;
  ageMin?: number;
  ageMax?: number;
  access: "inclus" | "réservation_séparée";
  status: "confirmé" | "annulé" | "modifié";
  confidence: "auto" | "vérifié_humain";
  venue?: VenueSummary;
  artist?: ArtistSummary;
  tags?: string[];
  selectionStatus?: SelectionStatus;
}

// ---------------------------------------------------------------------------
// News
// ---------------------------------------------------------------------------

export interface NewsItemSummary {
  id: string;
  source: string;
  sourceUrl?: string;
  publishedAt: string;
  category: string;
  summary: string;
  urgencyLevel: "normal" | "critique";
  isPinned?: boolean;
}

// ---------------------------------------------------------------------------
// FestEvent (a user's participation in a festival edition)
// ---------------------------------------------------------------------------

export interface FestEventSummary {
  id: string;
  festivalId: string;
  festival: FestivalSummary;
  mode: "solo" | "crew";
  programTypeOverride?: ProgramType;
  presenceDates: string[]; // ISO date strings yyyy-MM-dd
  comfortMarginMins: number;
  crewId?: string;
  createdAt: string;
}

// FestEventWithDetails is consumed by the store; extend as the API route grows.
export interface FestEventWithDetails extends FestEventSummary {
  events: EventSummary[];
  selections: Record<string, SelectionStatus>;
}

// ---------------------------------------------------------------------------
// Offline cache shapes (mirror of the above, stored in Dexie)
// ---------------------------------------------------------------------------

export type OfflineFestival = FestivalSummary;

export interface OfflineEvent extends EventSummary {
  festEventId: string;
}

// ---------------------------------------------------------------------------
// Planning / conflicts
// ---------------------------------------------------------------------------

export interface ConflictInfo {
  level: ConflictLevel;
  eventA: EventSummary;
  eventB: EventSummary;
  overlapMins?: number;
  travelTimeMins?: number;
}

// ---------------------------------------------------------------------------
// Crew
// ---------------------------------------------------------------------------

export interface CrewMemberData {
  id: string;
  userId: string;
  userName?: string;
  userImage?: string;
  role: "admin" | "membre";
  geolocStatus: "off" | "active" | "background";
  isPrivate: boolean;
}

export interface CrewData {
  id: string;
  name?: string;
  inviteCode: string;
  members: CrewMemberData[];
  rallyLatitude?: number;
  rallyLongitude?: number;
  rallyDescription?: string;
}

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export interface SignalData {
  id: string;
  authorId: string;
  scope: "crew" | "communauté";
  latitude: number;
  longitude: number;
  description?: string;
  discoveryType?: string;
  predefinedPhrase?: string;
  confirmations: number;
  infirmations: number;
  createdAt: string;
  expiresAt: string;
}

// Alias used in stores — SignalData is the canonical shape
export type Signal = SignalData;
