// Re-export canonical types from src/types/index.ts
// This file exists for backward compatibility with imports using "@/lib/types"

export type {
  FestivalType,
  ProgramType,
  FestivalSummary,
  FestivalDetail,
  ArtistSummary,
  VenueSummary,
  NewsItemSummary,
  EventSummary,
  EventType,
  SelectionStatus,
  ConflictLevel,
  ConflictInfo,
  FestEventSummary,
  FestEventWithDetails,
  CrewData,
  CrewMemberData,
  SignalData,
  GeoPosition,
  SyncOperation,
} from "@/types/index";

// Aliases kept for backward compatibility
export type {
  NewsItemSummary as NewsItem,
} from "@/types/index";

// Types unique to this file (not yet in src/types/index.ts)
export type ProgramStatus = "complet" | "partiel" | "bientôt_disponible";
export type ConfidenceLevel = "auto" | "vérifié_humain";
