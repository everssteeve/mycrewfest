// Re-export canonical types from src/types/index.ts
// This file exists for backward compatibility with imports using "@/lib/types"

// Aliases kept for backward compatibility
export type {
  ArtistSummary,
  ConflictInfo,
  ConflictLevel,
  CrewData,
  CrewMemberData,
  EventSummary,
  EventType,
  FestEventSummary,
  FestEventWithDetails,
  FestivalDetail,
  FestivalSummary,
  FestivalType,
  GeoPosition,
  NewsItemSummary,
  NewsItemSummary as NewsItem,
  ProgramType,
  SelectionStatus,
  SignalData,
  SyncOperation,
  VenueSummary,
} from "@/types/index";

// Types unique to this file (not yet in src/types/index.ts)
export type ProgramStatus = "complet" | "partiel" | "bientôt_disponible";
export type ConfidenceLevel = "auto" | "vérifié_humain";
