"use client";

import { useCallback, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Search } from "lucide-react";
import { EventCard, type EventWithSelectionAndConfidence } from "@/components/festevent/event-card";
import { useSelections } from "@/hooks/use-selections";
import { useFestEventStore } from "@/store/use-fest-event-store";
import type { SelectionStatus } from "@/types";
import type { EventType } from "@/lib/api";
import { matchesProgrammeQuery, matchesSelectionFilter, matchesTagFilter, type SelectionFilter } from "@/lib/programme-search";

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
}

export function ProgrammeView({
  festEventId,
  presenceDates,
  initialEvents,
}: ProgrammeViewProps) {
  const { selections, updateSelection } = useSelections(festEventId);

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

  // Filters
  const [activeDay, setActiveDay] = useState<string>(presenceDates[0] ?? "");
  const [activeTypes, setActiveTypes] = useState<Set<EventType>>(new Set());
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("tous");
  const [selectionFilter, setSelectionFilter] = useState<SelectionFilter>("tous");
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const e of initialEvents) {
      for (const t of e.tags ?? []) set.add(t);
    }
    return Array.from(set).sort();
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

  // Load more presenceDates from store (in case dates are set after initial fetch)
  const storeDates = useFestEventStore((s) => s.presenceDates);
  const effectiveDates =
    presenceDates.length > 0 ? presenceDates : storeDates;

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

      // Text search
      if (!matchesProgrammeQuery(e, searchQuery)) return false;

      return true;
    });
  }, [events, activeDay, activeTypes, accessFilter, selectionFilter, activeTags, searchQuery]);

  const selectedCount = useMemo(
    () => filteredEvents.filter((e) => e.selection?.status != null).length,
    [filteredEvents],
  );

  const hasActiveFilter =
    activeTypes.size > 0 ||
    accessFilter !== "tous" ||
    selectionFilter !== "tous" ||
    activeTags.size > 0 ||
    searchQuery.trim().length > 0;

  const handleSelectionCycle = useCallback(
    (eventId: string, next: SelectionStatus | null) => {
      updateSelection(eventId, next);
    },
    [updateSelection],
  );

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

      {/* Day tabs */}
      {effectiveDates.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: "var(--space-sm)",
            overflowX: "auto",
            scrollbarWidth: "none",
            paddingBottom: 2,
          }}
        >
          {effectiveDates.map((d) => {
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

      {/* Stats strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-sm)",
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
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}
        >
          {filteredEvents.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              onSelectionCycle={handleSelectionCycle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
