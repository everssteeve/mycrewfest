"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronDown, CalendarArrowDown, Copy, Check, Sparkles, X } from "lucide-react";
import { detectConflicts, filterEventsByDay, sortEventsByTime, computeDayFreeTime, computeDayCoverage, optimizePlanning, countMustSeeEvents, type OptimizeResult } from "@/lib/planning";
import { useSelections } from "@/hooks/use-selections";
import { useFestEventStore } from "@/store/use-fest-event-store";
import { toggleVuStatus } from "@/lib/selection";
import { generatePlanningText } from "@/lib/planning-text";
import { formatBilanDuration } from "@/lib/bilan";
import { applyPlanningMustSeeFilter } from "@/lib/planning-filter";
import { computeTravelTimeMins } from "@/lib/travel-time";
import { getEventTimeStatus } from "@/lib/event-status";
import { formatMinsUntil } from "@/lib/now-playing";
import type { EventSummary, ConflictInfo, ConflictLevel } from "@/types";
import type { EventWithSelectionAndConfidence } from "@/components/festevent/event-card";
import type { SelectionStatus } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const COMFORT_MARGINS = [5, 15, 30, 45, 60] as const;
type ComfortMargin = (typeof COMFORT_MARGINS)[number];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}h${d.getMinutes().toString().padStart(2, "0")}`;
}

function toEventSummary(e: EventWithSelectionAndConfidence): EventSummary {
  return {
    id: e.id,
    title: e.title,
    eventType: e.eventType,
    startTime: e.startTime ?? undefined,
    endTime: e.endTime ?? undefined,
    durationMins: e.durationMins ?? undefined,
    ageMin: undefined,
    ageMax: undefined,
    access: e.access as "inclus" | "réservation_séparée",
    status: e.status as "confirmé" | "annulé" | "modifié",
    confidence: ((e as EventWithSelectionAndConfidence & { confidence?: "auto" | "vérifié_humain" }).confidence ?? "auto"),
    venue: e.venue
      ? {
          id: e.venue.id,
          name: e.venue.name,
          type: e.venue.type,
        }
      : undefined,
    artist: e.artist
      ? {
          id: e.artist.id,
          name: e.artist.name,
        }
      : undefined,
    tags: e.tags,
    selectionStatus: e.selection?.status,
  };
}

function getConflictStyle(level: ConflictLevel): React.CSSProperties {
  if (level === "overlap") {
    return { borderColor: "var(--danger-red)", borderWidth: 2 };
  }
  if (level === "tight") {
    return { borderColor: "var(--warning-orange)", borderWidth: 2 };
  }
  // borderline
  return {
    borderColor: "var(--warning-orange)",
    borderWidth: 2,
    borderStyle: "dashed",
  };
}

function getConflictBadge(level: ConflictLevel): string {
  if (level === "overlap") return "⚠ CLASH";
  if (level === "tight") return "~ Serré";
  return "◌ Limite";
}

function getConflictBadgeColor(level: ConflictLevel): string {
  if (level === "overlap") return "var(--danger-red)";
  return "var(--warning-orange)";
}

// ---------------------------------------------------------------------------
// TimelineEventCard
// ---------------------------------------------------------------------------

interface TimelineEventCardProps {
  event: EventWithSelectionAndConfidence;
  conflict: ConflictInfo | undefined;
  now: Date;
  arrivalConstraint: string | null;
  departureConstraint: string | null;
  onMarkVu: () => void;
}

function TimelineEventCard({
  event,
  conflict,
  now,
  arrivalConstraint,
  departureConstraint,
  onMarkVu,
}: TimelineEventCardProps) {
  const selectionStatus = event.selection?.status ?? null;
  const isSeen = selectionStatus === "vu";

  const timeStatus = getEventTimeStatus(event, now);

  // Check if outside arrival/departure constraints
  let outOfRange = false;
  if (event.startTime) {
    const start = new Date(event.startTime);
    if (arrivalConstraint && start < new Date(arrivalConstraint)) {
      outOfRange = true;
    }
    if (departureConstraint && start > new Date(departureConstraint)) {
      outOfRange = true;
    }
  }

  const isMustSee = selectionStatus === "must-see";

  const baseStyle: React.CSSProperties = {
    backgroundColor: "var(--bg-surface)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-color)",
    padding: "var(--space-md)",
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-xs)",
    opacity: isSeen || outOfRange || timeStatus === "past" ? 0.4 : 1,
    transition: "var(--transition-fast)",
    position: "relative",
    ...(isMustSee && !conflict
      ? {
          borderColor: "var(--accent-pink)",
          boxShadow: "var(--glow-pink)",
        }
      : {}),
    ...(conflict ? getConflictStyle(conflict.level) : {}),
  };

  return (
    <div
      style={baseStyle}
      role="article"
      aria-label={event.title}
      data-testid={timeStatus === "past" ? "past-event-card" : timeStatus === "ongoing" ? "ongoing-event-card" : undefined}
    >
      {/* Conflict badge */}
      {conflict && (
        <span
          style={{
            position: "absolute",
            top: -10,
            right: 8,
            backgroundColor: "var(--bg-surface-elevated)",
            color: getConflictBadgeColor(conflict.level),
            border: `1px solid ${getConflictBadgeColor(conflict.level)}`,
            borderRadius: "var(--radius-full)",
            fontSize: "var(--fs-xs)",
            fontFamily: "var(--font-body)",
            fontWeight: "var(--fw-bold)",
            padding: "2px 8px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {getConflictBadge(conflict.level)}
        </span>
      )}

      {/* Relative status badge */}
      {timeStatus === "ongoing" && (
        <span
          data-testid="planning-ongoing-badge"
          style={{
            alignSelf: "flex-start",
            backgroundColor: "var(--neon-soft)",
            color: "var(--primary-neon)",
            border: "1px solid var(--primary-neon)",
            borderRadius: "var(--radius-full)",
            fontSize: "var(--fs-xs)",
            fontFamily: "var(--font-body)",
            fontWeight: "var(--fw-bold)",
            padding: "2px 8px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          En cours
        </span>
      )}

      {/* Time + title + mark-vu button */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-sm)",
            color: "var(--accent-pink)",
            flexShrink: 0,
          }}
        >
          {event.startTime ? formatTime(event.startTime) : "—"}
          {event.endTime ? ` – ${formatTime(event.endTime)}` : ""}
        </span>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            fontWeight: "var(--fw-medium)",
            color: isSeen ? "var(--text-dim)" : "var(--text-main)",
            flex: 1,
            minWidth: 0,
          }}
        >
          {event.title}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMarkVu();
          }}
          aria-label={isSeen ? "Retirer la mention vu" : "Marquer comme vu"}
          aria-pressed={isSeen}
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: "var(--radius-full)",
            border: isSeen
              ? "1.5px solid var(--primary-neon)"
              : "1.5px solid var(--border-color)",
            backgroundColor: isSeen ? "var(--neon-soft)" : "transparent",
            color: isSeen ? "var(--primary-neon)" : "var(--text-dim)",
            fontSize: 14,
            cursor: "pointer",
            transition: "var(--transition-fast)",
          }}
        >
          ✓
        </button>
      </div>

      {/* Venue */}
      {event.venue && (
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-xs)",
            color: "var(--text-dim)",
          }}
        >
          {event.venue.name}
        </span>
      )}

      {/* Out of range note */}
      {outOfRange && (
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-xs)",
            color: "var(--text-dim)",
            fontStyle: "italic",
          }}
        >
          Hors de ta plage horaire
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PlanningView
// ---------------------------------------------------------------------------

interface PlanningViewProps {
  festEventId: string;
  presenceDates: string[];
  initialEvents: EventWithSelectionAndConfidence[];
  festivalName: string;
}

export function PlanningView({
  festEventId,
  presenceDates,
  initialEvents,
  festivalName,
}: PlanningViewProps) {
  const { selections, updateSelection } = useSelections(festEventId);
  const comfortMarginMins = useFestEventStore((s) => s.comfortMarginMins);
  const setComfortMargin = useFestEventStore((s) => s.setComfortMargin);
  const arrivalConstraint = useFestEventStore((s) => s.arrivalConstraint);
  const setArrivalConstraint = useFestEventStore((s) => s.setArrivalConstraint);
  const departureConstraint = useFestEventStore((s) => s.departureConstraint);
  const setDepartureConstraint = useFestEventStore(
    (s) => s.setDepartureConstraint,
  );

  const [activeDay, setActiveDay] = useState<string>(presenceDates[0] ?? "");
  const [mustSeeOnly, setMustSeeOnly] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const timelineRef = useRef<HTMLDivElement>(null);
  const [showFab, setShowFab] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResult | null>(null);

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

  // Selected events only (must-see + intéressé) for a given day
  const dayEvents = useMemo(() => {
    const selected = events.filter(
      (e) =>
        e.selection?.status === "must-see" ||
        e.selection?.status === "intéressé" ||
        e.selection?.status === "vu",
    );
    if (!activeDay) return sortEventsByTime(selected.map(toEventSummary));
    return sortEventsByTime(filterEventsByDay(selected.map(toEventSummary), activeDay));
  }, [events, activeDay]);

  // Detect conflicts
  const conflicts = useMemo(
    () => detectConflicts(dayEvents, comfortMarginMins),
    [dayEvents, comfortMarginMins],
  );

  // Build conflict map: eventId → ConflictInfo (highest severity)
  const conflictMap = useMemo(() => {
    const map = new Map<string, ConflictInfo>();
    const priority: Record<ConflictLevel, number> = {
      overlap: 3,
      tight: 2,
      borderline: 1,
    };
    for (const c of conflicts) {
      for (const id of [c.eventA.id, c.eventB.id]) {
        const existing = map.get(id);
        if (
          !existing ||
          priority[c.level] > priority[existing.level]
        ) {
          map.set(id, c);
        }
      }
    }
    return map;
  }, [conflicts]);

  // Find the "next" event
  const nextEvent = useMemo(() => {
    return dayEvents.find((e) => {
      if (!e.startTime) return false;
      return new Date(e.startTime) > now;
    });
  }, [dayEvents, now]);

  // Minutes until next event starts
  const minsUntilNext = useMemo(() => {
    if (!nextEvent?.startTime) return null;
    const diff = new Date(nextEvent.startTime).getTime() - now.getTime();
    if (diff <= 0) return null;
    return Math.round(diff / 60_000);
  }, [nextEvent, now]);

  // Summary counts
  const totalMins = useMemo(() => {
    let mins = 0;
    for (const e of dayEvents) {
      if (e.durationMins) {
        mins += e.durationMins;
      } else if (e.startTime && e.endTime) {
        mins += (new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60_000;
      }
    }
    return Math.round(mins);
  }, [dayEvents]);

  const freeTimeMins = useMemo(() => computeDayFreeTime(dayEvents), [dayEvents]);

  const dayCoverage = useMemo(() => computeDayCoverage(dayEvents), [dayEvents]);

  const mustSeeCount = useMemo(() => countMustSeeEvents(dayEvents), [dayEvents]);

  // Apply must-see-only filter for display (conflicts/totalMins use full dayEvents)
  const displayedEvents = useMemo(
    () => applyPlanningMustSeeFilter(dayEvents, mustSeeOnly),
    [dayEvents, mustSeeOnly],
  );

  // Travel time (minutes) between each consecutive pair of displayed events (null = same venue or no coords)
  const travelTimes = useMemo(() => {
    return displayedEvents.map((e, idx) => {
      if (idx === 0) return null;
      const prev = events.find((ev) => ev.id === displayedEvents[idx - 1].id);
      const curr = events.find((ev) => ev.id === e.id);
      const pv = prev?.venue;
      const cv = curr?.venue;
      if (!pv || !cv || pv.id === cv.id) return null;
      if (pv.latitude == null || pv.longitude == null || cv.latitude == null || cv.longitude == null) return null;
      const mins = computeTravelTimeMins(pv.latitude, pv.longitude, cv.latitude, cv.longitude);
      return mins > 0 ? mins : null;
    });
  }, [displayedEvents, events]);

  // Copy planning as text to clipboard
  const runOptimization = useCallback(() => {
    const mustSeeIds = dayEvents
      .filter((e) => e.selectionStatus === "must-see")
      .map((e) => e.id);
    const result = optimizePlanning(dayEvents, mustSeeIds, {
      comfortMarginMins,
      startHour: 0,
      endHour: 24,
      preferEvenings: false,
    });
    setOptimizeResult(result);
  }, [dayEvents, comfortMarginMins]);

  const copyPlanning = useCallback(async () => {
    const planningEvents = events
      .filter(
        (e) =>
          e.selection?.status === "must-see" ||
          e.selection?.status === "intéressé" ||
          e.selection?.status === "vu",
      )
      .map((e) => ({
        title: e.title,
        startTime: e.startTime ?? null,
        endTime: e.endTime ?? null,
        venue: e.venue ? { name: e.venue.name } : null,
      }));
    const text = generatePlanningText(planningEvents, festivalName);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [events, festivalName]);

  // Find next event card element and scroll to it
  const scrollToNext = useCallback(() => {
    const el = document.getElementById(`event-${nextEvent?.id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [nextEvent]);

  // Show FAB when user scrolls past "next event"
  const handleScroll = useCallback(() => {
    if (!nextEvent?.startTime || !timelineRef.current) return;
    const nextEl = document.getElementById(`event-${nextEvent.id}`);
    if (!nextEl) {
      setShowFab(false);
      return;
    }
    const rect = nextEl.getBoundingClientRect();
    setShowFab(rect.top > window.innerHeight);
  }, [nextEvent]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
        paddingTop: "var(--space-md)",
        paddingBottom: "calc(var(--space-md) + 80px)",
      }}
      onScroll={handleScroll}
    >
      {/* Summary bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-md)",
          padding: "var(--space-sm) var(--space-md)",
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-color)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            color: "var(--text-muted)",
          }}
        >
          {mustSeeOnly && displayedEvents.length !== dayEvents.length
            ? `${displayedEvents.length} / ${dayEvents.length}`
            : dayEvents.length}{" "}
          event{dayEvents.length !== 1 ? "s" : ""}
        </span>
        {mustSeeCount > 0 && (
          <>
            <span style={{ color: "var(--border-strong)" }}>·</span>
            <span
              data-testid="planning-must-see-count"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-sm)",
                color: "var(--accent-pink)",
              }}
            >
              ★ {mustSeeCount}
            </span>
          </>
        )}
        <span style={{ color: "var(--border-strong)" }}>·</span>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            color:
              conflicts.length > 0
                ? "var(--warning-orange)"
                : "var(--text-muted)",
          }}
        >
          {conflicts.length} conflit{conflicts.length !== 1 ? "s" : ""}
        </span>
        <span style={{ color: "var(--border-strong)" }}>·</span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-sm)",
            color: "var(--text-muted)",
          }}
        >
          {formatBilanDuration(totalMins)}
        </span>
        {freeTimeMins > 0 && (
          <>
            <span style={{ color: "var(--border-strong)" }}>·</span>
            <span
              data-testid="planning-free-time"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-sm)",
                color: "var(--primary-neon)",
              }}
              title="Temps libre entre tes concerts"
            >
              {formatBilanDuration(freeTimeMins)} libre{freeTimeMins > 60 ? "s" : ""}
            </span>
          </>
        )}
        {dayCoverage.percent > 0 && dayCoverage.spanMins > 0 && (
          <>
            <span style={{ color: "var(--border-strong)" }}>·</span>
            <span
              data-testid="planning-day-coverage"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-sm)",
                color: "var(--secondary-cyan)",
              }}
              title="Part de ta journée couverte par les événements"
            >
              {dayCoverage.percent}% couvert
            </span>
          </>
        )}
        <button
          type="button"
          onClick={() => setMustSeeOnly((v) => !v)}
          aria-pressed={mustSeeOnly}
          data-testid="planning-must-see-filter"
          style={{
            padding: "2px 9px",
            borderRadius: "var(--radius-full)",
            border: mustSeeOnly
              ? "1.5px solid var(--accent-pink)"
              : "1.5px solid rgba(255,255,255,0.12)",
            backgroundColor: mustSeeOnly ? "var(--pink-soft)" : "transparent",
            color: mustSeeOnly ? "var(--accent-pink)" : "var(--text-dim)",
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
          ★ Must-see
        </button>
        <div style={{ flex: 1 }} />
        {conflicts.length > 0 && (
          <button
            type="button"
            onClick={runOptimization}
            data-testid="planning-optimize-btn"
            aria-label="Suggérer des événements à arbitrer pour résoudre les conflits"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--primary-neon)",
              backgroundColor: "var(--neon-soft)",
              color: "var(--primary-neon)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              cursor: "pointer",
            }}
          >
            <Sparkles size={12} aria-hidden="true" />
            Optimiser
          </button>
        )}
        <a
          href={`/api/festevents/${festEventId}/planning/export`}
          download="mycrewfest-planning.ics"
          aria-label="Exporter le planning au format iCalendar"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 10px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-color)",
            backgroundColor: "transparent",
            color: "var(--text-muted)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-xs, 11px)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            textDecoration: "none",
            cursor: "pointer",
            transition: "var(--transition-fast)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--secondary-cyan)";
            (e.currentTarget as HTMLElement).style.color = "var(--secondary-cyan)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
          }}
        >
          <CalendarArrowDown size={12} aria-hidden="true" />
          .ics
        </a>
        <button
          type="button"
          onClick={copyPlanning}
          aria-label="Copier mon planning"
          data-testid="copy-planning-btn"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 10px",
            borderRadius: "var(--radius-md)",
            border: copied
              ? "1px solid var(--primary-neon)"
              : "1px solid var(--border-color)",
            backgroundColor: copied ? "var(--neon-soft)" : "transparent",
            color: copied ? "var(--primary-neon)" : "var(--text-muted)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-xs, 11px)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            cursor: "pointer",
            transition: "var(--transition-fast)",
          }}
        >
          {copied ? (
            <Check size={12} aria-hidden="true" />
          ) : (
            <Copy size={12} aria-hidden="true" />
          )}
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>

      {/* Comfort margin selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-sm)",
          flexWrap: "wrap",
        }}
      >
        <span
          className="t-meta"
          style={{ color: "var(--text-dim)", flexShrink: 0 }}
        >
          Marge
        </span>
        {COMFORT_MARGINS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setComfortMargin(m)}
            style={{
              padding: "3px 10px",
              borderRadius: "var(--radius-full)",
              border:
                comfortMarginMins === m
                  ? "1.5px solid var(--warning-orange)"
                  : "1.5px solid var(--border-color)",
              backgroundColor:
                comfortMarginMins === m ? "var(--orange-soft)" : "transparent",
              color:
                comfortMarginMins === m
                  ? "var(--warning-orange)"
                  : "var(--text-dim)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-xs)",
              fontWeight: "var(--fw-bold)",
              cursor: "pointer",
              transition: "var(--transition-fast)",
            }}
          >
            {m}mn
          </button>
        ))}
      </div>

      {/* Arrival / Departure constraints */}
      <div style={{ display: "flex", gap: "var(--space-sm)" }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <label
            className="t-meta"
            style={{ color: "var(--text-dim)", fontSize: "var(--fs-xs)" }}
            htmlFor="arrival-input"
          >
            Arrivée
          </label>
          <input
            id="arrival-input"
            type="datetime-local"
            value={arrivalConstraint ? arrivalConstraint.slice(0, 16) : ""}
            onChange={(e) =>
              setArrivalConstraint(
                e.target.value ? `${e.target.value}:00Z` : null,
              )
            }
            style={{
              background: "var(--bg-surface)",
              border: arrivalConstraint
                ? "1.5px solid var(--secondary-cyan)"
                : "1.5px solid var(--border-color)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-main)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-xs)",
              padding: "6px 8px",
              colorScheme: "dark",
            }}
          />
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <label
            className="t-meta"
            style={{ color: "var(--text-dim)", fontSize: "var(--fs-xs)" }}
            htmlFor="departure-input"
          >
            Départ
          </label>
          <input
            id="departure-input"
            type="datetime-local"
            value={departureConstraint ? departureConstraint.slice(0, 16) : ""}
            onChange={(e) =>
              setDepartureConstraint(
                e.target.value ? `${e.target.value}:00Z` : null,
              )
            }
            style={{
              background: "var(--bg-surface)",
              border: departureConstraint
                ? "1.5px solid var(--secondary-cyan)"
                : "1.5px solid var(--border-color)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-main)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-xs)",
              padding: "6px 8px",
              colorScheme: "dark",
            }}
          />
        </div>
      </div>

      {/* Day tabs */}
      {presenceDates.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: "var(--space-sm)",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {presenceDates.map((d) => {
            const isActive = d === activeDay;
            let label = d;
            try {
              label = format(parseISO(d), "EEE d", { locale: fr });
            } catch {
              label = d;
            }
            return (
              <button
                key={d}
                type="button"
                onClick={() => setActiveDay(d)}
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
              </button>
            );
          })}
        </div>
      )}

      {/* Optimization result */}
      {optimizeResult !== null && (
        <div
          data-testid="planning-optimize-result"
          style={{
            background: "var(--neon-soft)",
            border: "1px solid rgba(0,255,102,0.3)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-sm) var(--space-md)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-xs)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-xs)", fontWeight: "var(--fw-bold)", color: "var(--primary-neon)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Suggestions d'optimisation
            </span>
            <button
              type="button"
              onClick={() => setOptimizeResult(null)}
              aria-label="Fermer les suggestions"
              style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", padding: 2 }}
            >
              <X size={14} />
            </button>
          </div>
          {optimizeResult.toArbitrate.length === 0 ? (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-xs)", color: "var(--text-muted)", margin: 0 }}>
              ✓ Pas de conflit — ton planning est déjà optimisé.
            </p>
          ) : (
            <>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-xs)", color: "var(--text-muted)", margin: 0 }}>
                Ces événements créent des conflits et pourraient être retirés :
              </p>
              {optimizeResult.toArbitrate.map((e: EventSummary) => (
                <div
                  key={e.id}
                  data-testid={`planning-arbitrate-${e.id}`}
                  style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-xs)", color: "var(--text-dim)", paddingLeft: 8, borderLeft: "2px solid rgba(0,255,102,0.3)" }}
                >
                  {e.title}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Timeline */}
      <div
        ref={timelineRef}
        style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}
      >
        {displayedEvents.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--space-md)",
              paddingTop: "var(--space-2xl)",
              paddingBottom: "var(--space-2xl)",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: 36 }} aria-hidden="true">
              🗓
            </span>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-sm)",
                color: "var(--text-muted)",
              }}
            >
              Sélectionne des événements dans le Programme pour les voir ici.
            </p>
          </div>
        ) : (
          displayedEvents.map((e, idx) => {
            // Find the full enriched event
            const enriched = events.find((ev) => ev.id === e.id);
            if (!enriched) return null;

            const conflict = conflictMap.get(e.id);
            const isNext = e.id === nextEvent?.id;
            const travelMins = travelTimes[idx];

            return (
              <div key={e.id} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {travelMins != null && (
                <div
                  data-testid={`travel-time-${e.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-xs)",
                    paddingLeft: 52,
                    paddingBottom: "var(--space-xs)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      color: "var(--warning-orange)",
                      background: "rgba(255,153,0,0.08)",
                      border: "1px solid rgba(255,153,0,0.3)",
                      borderRadius: "var(--radius-full)",
                      padding: "1px 8px",
                    }}
                  >
                    → ~{travelMins} min à pied
                  </span>
                </div>
              )}
              {isNext && minsUntilNext !== null && (
                <div
                  data-testid={`next-event-countdown-${e.id}`}
                  style={{
                    paddingLeft: 52,
                    paddingBottom: "var(--space-xs)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      color: "var(--primary-neon)",
                      background: "var(--neon-soft)",
                      border: "1px solid var(--primary-neon)",
                      borderRadius: "var(--radius-full)",
                      padding: "1px 8px",
                    }}
                  >
                    Dans {formatMinsUntil(minsUntilNext)}
                  </span>
                </div>
              )}
              <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                {/* Time column */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    flexShrink: 0,
                    width: 44,
                    paddingTop: 14,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--fs-xs)",
                      color: isNext ? "var(--primary-neon)" : "var(--text-dim)",
                    }}
                  >
                    {e.startTime ? formatTime(e.startTime) : ""}
                  </span>
                  {idx < displayedEvents.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        width: 1,
                        backgroundColor: "var(--border-color)",
                        marginTop: 4,
                        marginRight: 1,
                        minHeight: 24,
                      }}
                    />
                  )}
                </div>

                {/* Event card */}
                <div
                  id={`event-${e.id}`}
                  style={{ flex: 1 }}
                >
                  <TimelineEventCard
                    event={enriched}
                    conflict={conflict}
                    now={now}
                    arrivalConstraint={arrivalConstraint}
                    departureConstraint={departureConstraint}
                    onMarkVu={() =>
                      updateSelection(
                        enriched.id,
                        toggleVuStatus(enriched.selection?.status ?? null),
                      )
                    }
                  />
                </div>
              </div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB — scroll to next */}
      {showFab && nextEvent && (
        <button
          type="button"
          onClick={scrollToNext}
          aria-label="Aller au prochain événement"
          style={{
            position: "fixed",
            bottom: "calc(var(--nav-height) + var(--space-md) + env(safe-area-inset-bottom, 0px))",
            right: "var(--space-md)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-xs)",
            backgroundColor: "var(--bg-surface-elevated)",
            border: "1.5px solid var(--primary-neon)",
            borderRadius: "var(--radius-full)",
            color: "var(--primary-neon)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-xs)",
            fontWeight: "var(--fw-bold)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            padding: "8px 16px",
            cursor: "pointer",
            boxShadow: "var(--glow-neon)",
            zIndex: 30,
            transition: "var(--transition-fast)",
          }}
        >
          <ChevronDown size={14} aria-hidden="true" />
          Prochain
          {minsUntilNext !== null && (
            <span
              data-testid="fab-next-countdown"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--primary-neon)",
                opacity: 0.8,
              }}
            >
              · {formatMinsUntil(minsUntilNext)}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
