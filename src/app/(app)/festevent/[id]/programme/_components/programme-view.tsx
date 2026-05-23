"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EventCard, type EventWithSelectionAndConfidence } from "@/components/festevent/event-card";
import { useSelections } from "@/hooks/use-selections";
import type { SelectionStatus } from "@/types";
import type { EventType } from "@/lib/api";
import { matchesProgrammeQuery, matchesSelectionFilter, matchesTagFilter, matchesVenueFilter, matchesDurationFilter, matchesAgeRestrictionFilter, type SelectionFilter, type DurationFilter, DURATION_FILTER_LABELS } from "@/lib/programme-search";
import { isEscapeKey } from "@/lib/keyboard-search";
import { sortProgrammeEvents, type SortMode, SORT_MODE_LABELS } from "@/lib/programme-sort";
import { extractEventDays, getDefaultProgrammeDay, formatDayLabel } from "@/lib/programme-days";
import { isUpcomingOrOngoing, countUpcomingEvents } from "@/lib/programme-upcoming";
import { findConflictingEventIds, countConflictPairs } from "@/lib/programme-conflicts";
import { findOngoingEventIds, countOngoingEvents } from "@/lib/event-status";
import { countEventsByDay, countVuEventsByDay, computeProgrammeDurationMins, computeAvgEventDurationMins, getMaxEventDurationMins, countItinerantEvents, countUniqueVenues, countUniqueArtists, countVerifiedEvents, getPeakEventHour, countReservationRequiredEvents, countCancelledEvents, countModifiedEvents, getTopProgrammeTag, getTopProgrammeVenue, countMustSeePendingEvents, countSelectionDays, countIntéresséEvents, countUniqueProgrammeTags, computeSelectionCoveragePercent, getPeakProgrammeDay, countAgeRestrictedEvents, countUniqueEventTypes, countNightEvents, getEarliestEventStartTime, getLatestEventEndTime, getPeakSelectionDay } from "@/lib/programme-summary";
import { shouldShowScrollTop } from "@/lib/scroll-top";
import { formatBilanDuration } from "@/lib/bilan";
import { generateProgrammeShareText } from "@/lib/programme-share";
import { buildProgrammeIcs, countExportableEvents } from "@/lib/programme-ics";
import { computeTotalProgrammeDurationMins, computeSelectedDurationMins, computeTimeCoveragePercent, getDensityLabel, getDensityColor, formatDensityBadge } from "@/lib/programme-density";
import { groupEventsByVenue, sortVenueGroups, sortEventsWithinGroup } from "@/lib/programme-group";
import { useEventNotes } from "@/hooks/use-event-notes";
import { buildTimelineSlots } from "@/lib/programme-timeline";
import { Copy, Check, CalendarArrowDown } from "lucide-react";
import { ChevronUp } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AccessFilter = "tous" | "inclus" | "réservation";

const EVENT_TYPES: EventType[] = [
  "concert",
  "spectacle",
  "atelier",
  "défilé",
  "cypher",
  "conférence",
  "installation",
  "autre",
];

const TYPE_LABELS: Record<EventType, string> = {
  concert: "Concert",
  spectacle: "Spectacle",
  atelier: "Atelier",
  défilé: "Défilé",
  cypher: "Cypher",
  conférence: "Conférence",
  installation: "Installation",
  autre: "Autre",
};

// ---------------------------------------------------------------------------
// ProgrammeView
// ---------------------------------------------------------------------------

interface ProgrammeViewProps {
  festEventId: string;
  presenceDates: string[];
  initialEvents: EventWithSelectionAndConfidence[];
  festivalName: string;
}

export function ProgrammeView({
  festEventId,
  presenceDates,
  initialEvents,
  festivalName,
}: ProgrammeViewProps) {
  const { selections, updateSelection } = useSelections(festEventId);
  const { notes, setNote } = useEventNotes(festEventId);

  // Merge store selections into events
  const events = useMemo(() => {
    return initialEvents.map((e) => {
      const storeStatus = selections[e.id] as SelectionStatus | undefined;
      return {
        ...e,
        selection: storeStatus
          ? { id: e.selection?.id ?? e.id, status: storeStatus }
          : e.selection,
      };
    });
  }, [initialEvents, selections]);

  // Days derived from events (not from presence dates)
  const eventDays = useMemo(() => extractEventDays(initialEvents), [initialEvents]);

  // Filters
  const [activeDay, setActiveDay] = useState<string>(
    () => getDefaultProgrammeDay(eventDays) ?? "",
  );
  const [activeTypes, setActiveTypes] = useState<Set<EventType>>(new Set());
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("tous");
  const [selectionFilter, setSelectionFilter] = useState<SelectionFilter>("tous");
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [activeVenueId, setActiveVenueId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("time");
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [activeDurationFilter, setActiveDurationFilter] = useState<DurationFilter>("tous");
  const [showOnlyAgeRestricted, setShowOnlyAgeRestricted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "by-venue">("list");

  // Refresh "now" every minute for live event status
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Scroll-to-top FAB
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(shouldShowScrollTop(window.scrollY));
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const e of initialEvents) {
      for (const t of e.tags ?? []) set.add(t);
    }
    return Array.from(set).sort();
  }, [initialEvents]);

  const allVenues = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const e of initialEvents) {
      if (e.venue && !map.has(e.venue.id)) {
        map.set(e.venue.id, { id: e.venue.id, name: e.venue.name });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "fr"),
    );
  }, [initialEvents]);

  const toggleTag = useCallback((tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

  const toggleType = useCallback((t: EventType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) {
        next.delete(t);
      } else {
        next.add(t);
      }
      return next;
    });
  }, []);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Day filter
      if (activeDay && e.startTime) {
        const d = new Date(e.startTime).toLocaleDateString("sv-SE");
        if (d !== activeDay) return false;
      } else if (activeDay && !e.startTime) {
        // Events without a time: show only on first day or don't filter
        // We'll show them regardless of day filter
      }

      // Type filter
      if (activeTypes.size > 0 && !activeTypes.has(e.eventType as EventType)) {
        return false;
      }

      // Access filter
      if (accessFilter === "inclus" && e.access !== "inclus") return false;
      if (
        accessFilter === "réservation" &&
        e.access !== "réservation_séparée"
      ) {
        return false;
      }

      // Selection filter
      if (!matchesSelectionFilter({ selectionStatus: e.selection?.status ?? null }, selectionFilter)) {
        return false;
      }

      // Tag filter
      if (!matchesTagFilter(e, activeTags)) return false;

      // Venue filter
      if (!matchesVenueFilter(e, activeVenueId)) return false;

      // Text search
      if (!matchesProgrammeQuery(e, searchQuery)) return false;

      // Upcoming filter — events happening now or starting within 2h
      if (upcomingOnly && !isUpcomingOrOngoing(e, new Date(), 120)) return false;

      // Duration filter
      if (!matchesDurationFilter(e, activeDurationFilter)) return false;

      // Age restriction filter
      if (!matchesAgeRestrictionFilter(e, showOnlyAgeRestricted)) return false;

      return true;
    });
  }, [events, activeDay, activeTypes, accessFilter, selectionFilter, activeTags, activeVenueId, searchQuery, upcomingOnly, activeDurationFilter, showOnlyAgeRestricted]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sortedFilteredEvents = useMemo(
    () => sortProgrammeEvents(filteredEvents, sortMode),
    [filteredEvents, sortMode, shuffleSeed],
  );

  // Conflict detection across ALL selected events (not just filtered)
  const conflictingIds = useMemo(() => findConflictingEventIds(events), [events]);
  const conflictPairCount = useMemo(() => countConflictPairs(events), [events]);

  // Live "ongoing" event detection — refreshes every minute
  const ongoingIds = useMemo(() => findOngoingEventIds(events, now), [events, now]);
  const ongoingCount = useMemo(() => countOngoingEvents(events, now), [events, now]);
  const upcomingSoonCount = useMemo(() => countUpcomingEvents(events, now, 120), [events, now]);

  // Event counts per day (across ALL events, not filtered)
  const eventDayCounts = useMemo(() => countEventsByDay(initialEvents), [initialEvents]);
  const vuDayCounts = useMemo(() => countVuEventsByDay(events), [events]);

  const selectedCount = useMemo(
    () => filteredEvents.filter((e) => e.selection?.status != null).length,
    [filteredEvents],
  );

  const totalFilteredDurationMins = useMemo(
    () => computeProgrammeDurationMins(filteredEvents),
    [filteredEvents],
  );

  const avgEventDurationMins = useMemo(
    () => computeAvgEventDurationMins(filteredEvents),
    [filteredEvents],
  );

  const maxEventDurationMins = useMemo(
    () => getMaxEventDurationMins(filteredEvents),
    [filteredEvents],
  );

  const itinerantCount = useMemo(
    () => countItinerantEvents(filteredEvents),
    [filteredEvents],
  );

  const vuCount = useMemo(
    () => filteredEvents.filter((e) => e.selection?.status === "vu").length,
    [filteredEvents],
  );

  const venueCount = useMemo(
    () => countUniqueVenues(filteredEvents),
    [filteredEvents],
  );

  const artistCount = useMemo(
    () => countUniqueArtists(filteredEvents),
    [filteredEvents],
  );

  const verifiedCount = useMemo(
    () => countVerifiedEvents(filteredEvents),
    [filteredEvents],
  );

  const peakHour = useMemo(
    () => getPeakEventHour(filteredEvents),
    [filteredEvents],
  );

  const reservationCount = useMemo(
    () => countReservationRequiredEvents(filteredEvents),
    [filteredEvents],
  );

  const cancelledCount = useMemo(
    () => countCancelledEvents(filteredEvents),
    [filteredEvents],
  );

  const modifiedCount = useMemo(
    () => countModifiedEvents(filteredEvents),
    [filteredEvents],
  );

  const topTag = useMemo(
    () => getTopProgrammeTag(filteredEvents),
    [filteredEvents],
  );

  const topVenue = useMemo(
    () => (venueCount > 1 ? getTopProgrammeVenue(filteredEvents) : null),
    [filteredEvents, venueCount],
  );

  const mustSeePendingCount = useMemo(
    () => countMustSeePendingEvents(filteredEvents),
    [filteredEvents],
  );

  const intéresséCount = useMemo(
    () => countIntéresséEvents(filteredEvents),
    [filteredEvents],
  );

  const selectionDays = useMemo(
    () => countSelectionDays(events),
    [events],
  );

  const uniqueTagCount = useMemo(
    () => countUniqueProgrammeTags(filteredEvents),
    [filteredEvents],
  );

  const coveragePct = useMemo(
    () => computeSelectionCoveragePercent(filteredEvents),
    [filteredEvents],
  );

  const peakDay = useMemo(
    () => getPeakProgrammeDay(filteredEvents),
    [filteredEvents],
  );

  const ageRestrictedCount = useMemo(
    () => countAgeRestrictedEvents(filteredEvents),
    [filteredEvents],
  );

  const eventTypeCount = useMemo(
    () => countUniqueEventTypes(filteredEvents),
    [filteredEvents],
  );

  const nightEventCount = useMemo(
    () => countNightEvents(filteredEvents),
    [filteredEvents],
  );

  const earliestStart = useMemo(
    () => getEarliestEventStartTime(filteredEvents),
    [filteredEvents],
  );

  const latestEnd = useMemo(
    () => getLatestEventEndTime(filteredEvents),
    [filteredEvents],
  );

  const peakSelectionDay = useMemo(
    () => getPeakSelectionDay(events),
    [events],
  );

  const hasActiveFilter =
    activeTypes.size > 0 ||
    accessFilter !== "tous" ||
    selectionFilter !== "tous" ||
    activeTags.size > 0 ||
    activeVenueId !== null ||
    searchQuery.trim().length > 0 ||
    upcomingOnly ||
    activeDurationFilter !== "tous";

  const handleSelectionCycle = useCallback(
    (eventId: string, next: SelectionStatus | null) => {
      updateSelection(eventId, next);
    },
    [updateSelection],
  );

  const resetFilters = useCallback(() => {
    setActiveTypes(new Set());
    setAccessFilter("tous");
    setSelectionFilter("tous");
    setActiveTags(new Set());
    setActiveVenueId(null);
    setSearchQuery("");
    setUpcomingOnly(false);
    setActiveDurationFilter("tous");
  }, []);

  const copyShortlist = useCallback(async () => {
    const text = generateProgrammeShareText(filteredEvents, festivalName);
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [filteredEvents, festivalName]);

  const downloadIcs = useCallback(() => {
    const icsContent = buildProgrammeIcs(events, festivalName, "selected");
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${festivalName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-selection.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }, [events, festivalName]);

  const icsExportCount = useMemo(
    () => countExportableEvents(events, "selected"),
    [events],
  );

  const totalDurationMins = useMemo(() => computeTotalProgrammeDurationMins(events), [events]);
  const selectedDurationMins = useMemo(() => computeSelectedDurationMins(events), [events]);
  const densityPercent = useMemo(
    () => computeTimeCoveragePercent(selectedDurationMins, totalDurationMins),
    [selectedDurationMins, totalDurationMins],
  );
  const densityColor = getDensityColor(densityPercent);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
        paddingTop: "var(--space-md)",
        paddingBottom: "var(--space-md)",
      }}
    >
      {/* Search input */}
      <div style={{ position: "relative" }}>
        <Search
          size={15}
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 11,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-dim)",
            pointerEvents: "none",
          }}
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Chercher un artiste, scène…"
          aria-label="Rechercher dans le programme"
          style={{
            width: "100%",
            paddingLeft: 34,
            paddingRight: searchQuery ? 34 : 12,
            paddingTop: 9,
            paddingBottom: 9,
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-main)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            outline: "none",
            transition: "var(--transition-fast)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-pink)";
            e.currentTarget.style.boxShadow = "0 0 0 2px rgba(255,0,122,0.12)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border-color)";
            e.currentTarget.style.boxShadow = "none";
          }}
          onKeyDown={(e) => {
            if (isEscapeKey(e)) setSearchQuery("");
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            aria-label="Effacer la recherche"
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-dim)",
              fontSize: 14,
              lineHeight: 1,
              padding: 2,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Day tabs — derived from event start times */}
      {eventDays.length > 1 && (
        <div
          role="group"
          aria-label="Filtrer par jour"
          style={{
            display: "flex",
            gap: "var(--space-sm)",
            overflowX: "auto",
            scrollbarWidth: "none",
            paddingBottom: 2,
          }}
        >
          {/* "Tous" tab */}
          <button
            type="button"
            onClick={() => setActiveDay("")}
            aria-pressed={activeDay === ""}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              border: activeDay === ""
                ? "1.5px solid var(--accent-pink)"
                : "1.5px solid var(--border-color)",
              backgroundColor: activeDay === "" ? "var(--pink-soft)" : "transparent",
              color: activeDay === "" ? "var(--accent-pink)" : "var(--text-muted)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              fontWeight: "var(--fw-bold)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "var(--transition-fast)",
            }}
          >
            Tous
          </button>

          {eventDays.map((d) => {
            const isActive = d === activeDay;
            const label = formatDayLabel(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => setActiveDay(d)}
                aria-pressed={isActive}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "6px 16px",
                  borderRadius: "var(--radius-full)",
                  border: isActive
                    ? "1.5px solid var(--accent-pink)"
                    : "1.5px solid var(--border-color)",
                  backgroundColor: isActive ? "var(--pink-soft)" : "transparent",
                  color: isActive ? "var(--accent-pink)" : "var(--text-muted)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  fontWeight: "var(--fw-bold)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "var(--transition-fast)",
                }}
              >
                {label}
                {eventDayCounts.get(d) !== undefined && (
                  <span
                    style={{
                      marginLeft: 4,
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      opacity: 0.7,
                    }}
                  >
                    · {eventDayCounts.get(d)}
                  </span>
                )}
                {(vuDayCounts.get(d) ?? 0) > 0 && (
                  <span
                    style={{
                      marginLeft: 4,
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      color: isActive ? "var(--primary-neon)" : "rgba(0,255,102,0.7)",
                    }}
                    aria-label={`${vuDayCounts.get(d)} vus`}
                  >
                    ✓{vuDayCounts.get(d)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Event type chips */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-xs)",
          overflowX: "auto",
          scrollbarWidth: "none",
          flexWrap: "nowrap",
        }}
      >
        {EVENT_TYPES.map((t) => {
          const isActive = activeTypes.has(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => toggleType(t)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 12px",
                borderRadius: "var(--radius-full)",
                border: isActive
                  ? "1.5px solid var(--accent-pink)"
                  : "1.5px solid var(--border-color)",
                backgroundColor: isActive ? "var(--pink-soft)" : "transparent",
                color: isActive ? "var(--accent-pink)" : "var(--text-dim)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                fontWeight: "var(--fw-bold)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "var(--transition-fast)",
              }}
            >
              {TYPE_LABELS[t]}
            </button>
          );
        })}
      </div>

      {/* Access filter */}
      <div style={{ display: "flex", gap: "var(--space-sm)" }}>
        {(["tous", "inclus", "réservation"] as AccessFilter[]).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAccessFilter(a)}
            style={{
              padding: "4px 12px",
              borderRadius: "var(--radius-full)",
              border:
                accessFilter === a
                  ? "1.5px solid var(--secondary-cyan)"
                  : "1.5px solid var(--border-color)",
              backgroundColor:
                accessFilter === a ? "var(--cyan-soft)" : "transparent",
              color:
                accessFilter === a ? "var(--secondary-cyan)" : "var(--text-dim)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              fontWeight: "var(--fw-bold)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              cursor: "pointer",
              transition: "var(--transition-fast)",
              whiteSpace: "nowrap",
            }}
          >
            {a === "tous" ? "Tous" : a === "inclus" ? "Inclus" : "Réservation"}
          </button>
        ))}
      </div>

      {/* Selection filter chips */}
      <div
        style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}
        role="group"
        aria-label="Filtrer par sélection"
      >
        {(
          [
            { key: "tous" as SelectionFilter, label: "Tous" },
            { key: "sélectionné" as SelectionFilter, label: "Sélectionnés" },
            { key: "must-see" as SelectionFilter, label: "★ Must-see" },
            { key: "intéressé" as SelectionFilter, label: "Intéressé" },
            { key: "vu" as SelectionFilter, label: "✓ Vus" },
          ] as const
        ).map(({ key, label }) => {
          const isActive = selectionFilter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectionFilter(key)}
              aria-pressed={isActive}
              style={{
                padding: "4px 12px",
                borderRadius: "var(--radius-full)",
                border: isActive
                  ? "1.5px solid var(--primary-neon)"
                  : "1.5px solid var(--border-color)",
                backgroundColor: isActive ? "var(--neon-soft)" : "transparent",
                color: isActive ? "var(--primary-neon)" : "var(--text-dim)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                fontWeight: "var(--fw-bold)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "var(--transition-fast)",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tag filter — only rendered when events have tags */}
      {allTags.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "var(--space-xs)",
            overflowX: "auto",
            scrollbarWidth: "none",
            flexWrap: "nowrap",
            paddingBottom: 2,
          }}
          role="group"
          aria-label="Filtrer par tag"
        >
          {allTags.map((tag) => {
            const isActive = activeTags.has(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={isActive}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "3px 10px",
                  borderRadius: "var(--radius-full)",
                  border: isActive
                    ? "1.5px solid var(--warning-orange)"
                    : "1.5px solid rgba(255,255,255,0.1)",
                  backgroundColor: isActive ? "var(--orange-soft)" : "transparent",
                  color: isActive ? "var(--warning-orange)" : "var(--text-dim)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  fontWeight: "var(--fw-medium)",
                  textTransform: "lowercase",
                  letterSpacing: "0.02em",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "var(--transition-fast)",
                }}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}

      {/* Venue filter — only when ≥2 distinct venues */}
      {allVenues.length >= 2 && (
        <div
          style={{
            display: "flex",
            gap: "var(--space-xs)",
            overflowX: "auto",
            scrollbarWidth: "none",
            flexWrap: "nowrap",
            paddingBottom: 2,
          }}
          role="group"
          aria-label="Filtrer par scène"
        >
          <button
            key="venue-tous"
            type="button"
            onClick={() => setActiveVenueId(null)}
            aria-pressed={activeVenueId === null}
            data-testid="venue-filter-tous"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "3px 10px",
              borderRadius: "var(--radius-full)",
              border:
                activeVenueId === null
                  ? "1.5px solid var(--accent-pink)"
                  : "1.5px solid rgba(255,255,255,0.1)",
              backgroundColor:
                activeVenueId === null ? "var(--pink-soft)" : "transparent",
              color:
                activeVenueId === null ? "var(--accent-pink)" : "var(--text-dim)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              fontWeight: "var(--fw-bold)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "var(--transition-fast)",
            }}
          >
            Toutes
          </button>
          {allVenues.map((v) => {
            const isActive = activeVenueId === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setActiveVenueId(isActive ? null : v.id)}
                aria-pressed={isActive}
                data-testid={`venue-filter-${v.id}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "3px 10px",
                  borderRadius: "var(--radius-full)",
                  border: isActive
                    ? "1.5px solid var(--accent-pink)"
                    : "1.5px solid rgba(255,255,255,0.1)",
                  backgroundColor: isActive ? "var(--pink-soft)" : "transparent",
                  color: isActive ? "var(--accent-pink)" : "var(--text-dim)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  fontWeight: "var(--fw-medium)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "var(--transition-fast)",
                }}
              >
                {v.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Stats strip + sort controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-sm)",
          flexWrap: "wrap",
          minHeight: 20,
        }}
        aria-live="polite"
        aria-atomic="true"
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-xs)",
            color: "var(--text-dim)",
          }}
        >
          {filteredEvents.length}
          {hasActiveFilter && events.length !== filteredEvents.length
            ? ` / ${events.length}`
            : ""}{" "}
          événement{filteredEvents.length !== 1 ? "s" : ""}
        </span>
        {totalFilteredDurationMins > 0 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-total-duration"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--secondary-cyan)",
              }}
            >
              {formatBilanDuration(totalFilteredDurationMins)}
            </span>
          </>
        )}
        {avgEventDurationMins !== null && filteredEvents.length > 1 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-avg-duration"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
              }}
              title="Durée moyenne par événement"
            >
              moy. {formatBilanDuration(avgEventDurationMins)}
            </span>
          </>
        )}
        {maxEventDurationMins !== null && avgEventDurationMins !== null && maxEventDurationMins > avgEventDurationMins && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-max-duration"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--warning-orange)",
              }}
              title="Durée du plus long événement"
            >
              max {formatBilanDuration(maxEventDurationMins)}
            </span>
          </>
        )}
        {venueCount > 1 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-venue-count"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--secondary-cyan)",
              }}
            >
              {venueCount} lieux
            </span>
          </>
        )}
        {topVenue !== null && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-top-venue"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
              }}
              title={`Scène avec le plus d'événements (${topVenue.count})`}
            >
              {topVenue.name}
            </span>
          </>
        )}
        {artistCount > 0 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-artist-count"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--secondary-cyan)",
              }}
            >
              {artistCount} artiste{artistCount !== 1 ? "s" : ""}
            </span>
          </>
        )}
        {itinerantCount > 0 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-itinerant-count"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--primary-neon)",
              }}
            >
              {itinerantCount} itinérant{itinerantCount !== 1 ? "s" : ""}
            </span>
          </>
        )}
        {verifiedCount > 0 && verifiedCount < filteredEvents.length && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-verified-count"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--primary-neon)",
              }}
            >
              ✓ {verifiedCount} vérifi{verifiedCount !== 1 ? "és" : "é"}
            </span>
          </>
        )}
        {ongoingCount > 0 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-ongoing-count"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--primary-neon)",
                fontWeight: "var(--fw-bold)",
                animation: "pulse 2s infinite",
              }}
              title="Événements en cours maintenant"
            >
              ● {ongoingCount} en cours
            </span>
          </>
        )}
        {upcomingSoonCount > 0 && ongoingCount === 0 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-upcoming-soon"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--secondary-cyan)",
              }}
              title={`${upcomingSoonCount} événement${upcomingSoonCount !== 1 ? "s" : ""} dans les 2h`}
            >
              ▷ {upcomingSoonCount} bientôt
            </span>
          </>
        )}
        {vuCount > 0 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-vu-count"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--primary-neon)",
                fontWeight: "var(--fw-bold)",
              }}
            >
              ✓ {vuCount} vu{vuCount !== 1 ? "s" : ""}
            </span>
          </>
        )}
        {selectedCount > 0 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--accent-pink)",
              }}
            >
              ♥ {selectedCount} sélectionné{selectedCount !== 1 ? "s" : ""}
            </span>
          </>
        )}
        {mustSeePendingCount > 0 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-must-see-pending"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--accent-pink)",
                fontWeight: "var(--fw-bold)",
              }}
              title="Événements must-see que tu n'as pas encore vus"
            >
              ★ {mustSeePendingCount} must-see
            </span>
          </>
        )}
        {intéresséCount > 0 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-intéressé-count"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--secondary-cyan)",
              }}
              title="Événements marqués comme intéressant"
            >
              ~ {intéresséCount} intéressé{intéresséCount !== 1 ? "s" : ""}
            </span>
          </>
        )}
        {selectionDays > 1 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-selection-days"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
              }}
              title="Nombre de jours couverts par ta sélection"
            >
              {selectionDays}j sélection
            </span>
          </>
        )}
        {peakSelectionDay && selectionDays > 1 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-peak-selection-day"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--secondary-cyan)",
              }}
              title={`Jour le plus chargé de ta sélection : ${peakSelectionDay.count} événements`}
            >
              ★ {new Date(peakSelectionDay.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short" })} +{peakSelectionDay.count}
            </span>
          </>
        )}
        {selectedDurationMins > 0 && totalDurationMins > 0 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-day-density"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: densityColor,
              }}
              title={`${getDensityLabel(densityPercent)} — ${densityPercent}% du programme sélectionné`}
            >
              {formatDensityBadge(densityPercent, selectedDurationMins)}
            </span>
          </>
        )}
        {conflictPairCount > 0 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="conflict-count-badge"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--warning-orange)",
                fontWeight: "var(--fw-bold)",
              }}
            >
              ⚡ {conflictPairCount} conflit{conflictPairCount !== 1 ? "s" : ""}
            </span>
          </>
        )}
        {cancelledCount > 0 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-cancelled-count"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--accent-red)",
                fontWeight: "var(--fw-bold)",
              }}
              title="Événements annulés"
            >
              ✕ {cancelledCount} annulé{cancelledCount > 1 ? "s" : ""}
            </span>
          </>
        )}
        {modifiedCount > 0 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-modified-count"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--warning-orange)",
              }}
              title="Événements dont les infos ont changé"
            >
              ~ {modifiedCount} modifié{modifiedCount > 1 ? "s" : ""}
            </span>
          </>
        )}
        {reservationCount > 0 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-reservation-count"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--warning-orange)",
              }}
              title="Événements nécessitant une réservation séparée"
            >
              {reservationCount} sur réserv.
            </span>
          </>
        )}
        {peakHour !== null && filteredEvents.length > 2 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-peak-hour"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
              }}
              title="Heure de pointe du programme"
            >
              Pic à {peakHour}h
            </span>
          </>
        )}
        {topTag !== null && filteredEvents.length > 1 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-top-tag"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--secondary-cyan)",
              }}
              title={`Tag dominant dans cette sélection (${topTag.count} événements)`}
            >
              #{topTag.tag}
            </span>
          </>
        )}
        {uniqueTagCount > 1 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-tag-count"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
              }}
              title={`${uniqueTagCount} catégories distinctes dans ce programme`}
            >
              {uniqueTagCount} catégories
            </span>
          </>
        )}
        {coveragePct > 0 && coveragePct < 100 && filteredEvents.length >= 5 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-coverage-pct"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: coveragePct >= 50 ? "var(--secondary-cyan)" : "var(--text-dim)",
              }}
              title={`${coveragePct}% des événements ont été évalués`}
            >
              {coveragePct}% évalués
            </span>
          </>
        )}
        {peakDay !== null && eventDayCounts.size > 1 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-peak-day"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
              }}
              title={`Jour le plus chargé : ${peakDay.date} (${peakDay.count} événements)`}
            >
              {new Date(peakDay.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short" })} +{peakDay.count}
            </span>
          </>
        )}
        {eventTypeCount > 1 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-event-type-count"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--secondary-cyan)",
              }}
              title={`${eventTypeCount} types d'événements différents`}
            >
              ◈ {eventTypeCount} types
            </span>
          </>
        )}
        {nightEventCount > 0 && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-night-count"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--accent-pink)",
              }}
              title={`${nightEventCount} événement${nightEventCount > 1 ? "s" : ""} après 22h`}
            >
              ☽ {nightEventCount} nuit
            </span>
          </>
        )}
        {earliestStart && latestEnd && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <span
              data-testid="programme-time-range"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-dim)",
              }}
              title="Plage horaire du programme"
            >
              {new Date(earliestStart).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false })}→{new Date(latestEnd).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false })}
            </span>
          </>
        )}
        {ageRestrictedCount > 0 && ageRestrictedCount < filteredEvents.length && (
          <>
            <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            <button
              type="button"
              onClick={() => setShowOnlyAgeRestricted((v) => !v)}
              aria-pressed={showOnlyAgeRestricted}
              data-testid="programme-age-restricted-filter"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: showOnlyAgeRestricted ? "var(--warning-orange)" : "var(--text-dim)",
                background: showOnlyAgeRestricted ? "rgba(255,153,0,0.12)" : "transparent",
                border: showOnlyAgeRestricted ? "1px solid rgba(255,153,0,0.4)" : "none",
                borderRadius: "var(--radius-sm)",
                padding: showOnlyAgeRestricted ? "0 4px" : 0,
                cursor: "pointer",
              }}
              title={showOnlyAgeRestricted ? "Afficher tous les événements" : "Filtrer : limites d'âge uniquement"}
            >
              <span data-testid="programme-age-restricted-count">
                {ageRestrictedCount} limite âge
              </span>
            </button>
          </>
        )}
        {/* Duration filter chips */}
        {(["court", "normal", "long"] as DurationFilter[]).map((df) => {
          const isActive = activeDurationFilter === df;
          return (
            <button
              key={df}
              type="button"
              onClick={() => setActiveDurationFilter(isActive ? "tous" : df)}
              aria-pressed={isActive}
              data-testid={`duration-filter-${df}`}
              style={{
                padding: "2px 9px",
                borderRadius: "var(--radius-full)",
                border: isActive
                  ? "1.5px solid var(--warning-orange)"
                  : "1.5px solid rgba(255,255,255,0.1)",
                backgroundColor: isActive ? "rgba(255,153,0,0.12)" : "transparent",
                color: isActive ? "var(--warning-orange)" : "var(--text-dim)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                fontWeight: "var(--fw-bold)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "var(--transition-fast)",
              }}
            >
              {DURATION_FILTER_LABELS[df]}
            </button>
          );
        })}

        {/* À venir chip */}
        <button
          type="button"
          onClick={() => setUpcomingOnly((v) => !v)}
          aria-pressed={upcomingOnly}
          data-testid="upcoming-filter-btn"
          style={{
            padding: "2px 9px",
            borderRadius: "var(--radius-full)",
            border: upcomingOnly
              ? "1.5px solid var(--primary-neon)"
              : "1.5px solid rgba(255,255,255,0.1)",
            backgroundColor: upcomingOnly ? "var(--neon-soft)" : "transparent",
            color: upcomingOnly ? "var(--primary-neon)" : "var(--text-dim)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-xs)",
            fontWeight: "var(--fw-bold)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "var(--transition-fast)",
          }}
        >
          ▶ À venir
        </button>
        {/* Reset all filters */}
        {hasActiveFilter && (
          <button
            type="button"
            onClick={resetFilters}
            aria-label="Réinitialiser tous les filtres"
            data-testid="reset-filters-btn"
            style={{
              padding: "2px 9px",
              borderRadius: "var(--radius-full)",
              border: "1.5px solid rgba(255,255,255,0.15)",
              backgroundColor: "transparent",
              color: "var(--text-dim)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              fontWeight: "var(--fw-bold)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "var(--transition-fast)",
            }}
          >
            ✕ Effacer
          </button>
        )}
        {/* Copy shortlist */}
        {selectedCount > 0 && (
          <button
            type="button"
            onClick={() => void copyShortlist()}
            aria-label={copied ? "Sélection copiée" : "Copier la sélection"}
            data-testid="copy-shortlist-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 9px",
              borderRadius: "var(--radius-full)",
              border: `1.5px solid ${copied ? "var(--primary-neon)" : "rgba(255,255,255,0.15)"}`,
              backgroundColor: copied ? "var(--neon-soft)" : "transparent",
              color: copied ? "var(--primary-neon)" : "var(--text-dim)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "var(--transition-fast)",
            }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "Copié" : "Copier"}
          </button>
        )}
        {/* Export ICS */}
        {icsExportCount > 0 && (
          <button
            type="button"
            onClick={downloadIcs}
            aria-label={`Exporter ${icsExportCount} événement${icsExportCount > 1 ? "s" : ""} dans le calendrier`}
            data-testid="programme-export-ics-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 9px",
              borderRadius: "var(--radius-full)",
              border: "1.5px solid rgba(255,255,255,0.15)",
              backgroundColor: "transparent",
              color: "var(--text-dim)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "var(--transition-fast)",
            }}
          >
            <CalendarArrowDown size={11} />
            .ics
          </button>
        )}
        <div style={{ flex: 1 }} />
        {/* View mode toggle */}
        {allVenues.length > 1 && (
          <div style={{ display: "flex", gap: 2 }}>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              data-testid="programme-view-list"
              title="Vue liste chronologique"
              style={{
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                border: viewMode === "list"
                  ? "1.5px solid var(--accent-pink)"
                  : "1.5px solid rgba(255,255,255,0.1)",
                backgroundColor: viewMode === "list" ? "rgba(255,0,122,0.1)" : "transparent",
                color: viewMode === "list" ? "var(--accent-pink)" : "var(--text-dim)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                fontWeight: "var(--fw-medium)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "var(--transition-fast)",
              }}
            >
              ≡ Liste
            </button>
            <button
              type="button"
              onClick={() => setViewMode("by-venue")}
              aria-pressed={viewMode === "by-venue"}
              data-testid="programme-view-by-venue"
              title="Vue par scène"
              style={{
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                border: viewMode === "by-venue"
                  ? "1.5px solid var(--accent-pink)"
                  : "1.5px solid rgba(255,255,255,0.1)",
                backgroundColor: viewMode === "by-venue" ? "rgba(255,0,122,0.1)" : "transparent",
                color: viewMode === "by-venue" ? "var(--accent-pink)" : "var(--text-dim)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                fontWeight: "var(--fw-medium)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "var(--transition-fast)",
              }}
            >
              ⊞ Scènes
            </button>
          </div>
        )}
        {/* Sort controls */}
        <div
          style={{ display: "flex", gap: 4 }}
          role="group"
          aria-label="Trier par"
        >
          {(["time", "alpha", "venue", "random"] as SortMode[]).map((mode) => {
            const isActive = sortMode === mode;
            return (
              <button
                key={mode}
                type="button"
                data-testid={mode === "random" ? "programme-sort-random" : undefined}
                onClick={() => {
                  if (mode === "random" && sortMode === "random") {
                    setShuffleSeed((s) => s + 1);
                  } else {
                    setSortMode(mode);
                  }
                }}
                aria-pressed={isActive}
                style={{
                  padding: "2px 8px",
                  borderRadius: "var(--radius-full)",
                  border: isActive
                    ? "1.5px solid var(--secondary-cyan)"
                    : "1.5px solid rgba(255,255,255,0.1)",
                  backgroundColor: isActive ? "var(--cyan-soft)" : "transparent",
                  color: isActive ? "var(--secondary-cyan)" : "var(--text-dim)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  fontWeight: "var(--fw-medium)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "var(--transition-fast)",
                }}
              >
                {SORT_MODE_LABELS[mode]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Events list */}
      {filteredEvents.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--space-md)",
            paddingTop: "var(--space-2xl)",
            paddingBottom: "var(--space-2xl)",
            color: "var(--text-dim)",
            textAlign: "center",
          }}
        >
          <span
            style={{ fontSize: 40, lineHeight: 1 }}
            aria-hidden="true"
          >
            🎪
          </span>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
              color: "var(--text-muted)",
            }}
          >
            Aucun événement pour ce jour ou ces filtres.
          </p>
        </div>
      ) : viewMode === "by-venue" ? (
        <div
          data-testid="programme-by-venue-view"
          style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}
        >
          {sortVenueGroups(groupEventsByVenue(filteredEvents)).map((group) => (
            <section key={group.venueId ?? "__no_venue__"}>
              <h3
                data-testid={`venue-group-header-${group.venueId ?? "unknown"}`}
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--fs-sm)",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--accent-pink)",
                  marginBottom: "var(--space-sm)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-xs)",
                }}
              >
                <span aria-hidden="true">⊞</span>
                {group.venueName}
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--fs-xs)",
                    fontWeight: 400,
                    color: "var(--text-dim)",
                  }}
                >
                  · {group.events.length}
                </span>
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
                {sortEventsWithinGroup(group.events).map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    onSelectionCycle={handleSelectionCycle}
                    hasConflict={conflictingIds.has(e.id)}
                    isOngoing={ongoingIds.has(e.id)}
                    note={notes[e.id]}
                    onNoteChange={(text) => setNote(e.id, text)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}
        >
          {sortMode === "time"
            ? buildTimelineSlots(sortedFilteredEvents).map((slot, i) =>
                slot.type === "separator" ? (
                  <div
                    key={`sep-${slot.hour}-${i}`}
                    data-testid={`timeline-hour-${slot.hour}`}
                    aria-hidden="true"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-sm)",
                      paddingTop: i === 0 ? 0 : "var(--space-xs)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--fs-xs)",
                        fontWeight: 700,
                        color: "var(--accent-pink)",
                        flexShrink: 0,
                      }}
                    >
                      {slot.label}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 1,
                        backgroundColor: "rgba(255,0,122,0.2)",
                      }}
                    />
                  </div>
                ) : (
                  <EventCard
                    key={slot.event.id}
                    event={slot.event}
                    onSelectionCycle={handleSelectionCycle}
                    hasConflict={conflictingIds.has(slot.event.id)}
                    isOngoing={ongoingIds.has(slot.event.id)}
                    note={notes[slot.event.id]}
                    onNoteChange={(text) => setNote(slot.event.id, text)}
                  />
                )
              )
            : sortedFilteredEvents.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  onSelectionCycle={handleSelectionCycle}
                  hasConflict={conflictingIds.has(e.id)}
                  isOngoing={ongoingIds.has(e.id)}
                  note={notes[e.id]}
                  onNoteChange={(text) => setNote(e.id, text)}
                />
              ))
          }
        </div>
      )}

      {/* Scroll-to-top FAB */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          data-testid="scroll-to-top-btn"
          aria-label="Retour en haut"
          style={{
            position: "fixed",
            bottom: "calc(var(--nav-height) + var(--space-md) + env(safe-area-inset-bottom, 0px))",
            right: "var(--space-md)",
            width: 40,
            height: 40,
            borderRadius: "var(--radius-full)",
            border: "1.5px solid var(--border-color)",
            backgroundColor: "var(--bg-surface-elevated)",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 25,
            transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-pink)";
            (e.currentTarget as HTMLElement).style.color = "var(--accent-pink)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
          }}
        >
          <ChevronUp size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
