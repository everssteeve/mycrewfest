"use client";

import { MapPin, Clock, Ticket, ChevronDown, ChevronUp, Globe, ExternalLink } from "lucide-react";
import { useState } from "react";
import type { EventWithSelection } from "@/lib/api";
import type { SelectionStatus } from "@/types";
import { formatEventDuration, getAccessLabel } from "@/lib/event-format";
import { nextSelectionStatus } from "@/lib/selection";

// Extended type that includes confidence field returned by the programme API
export interface EventWithSelectionAndConfidence extends EventWithSelection {
  confidence?: "auto" | "vérifié_humain";
}
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Event type colour mapping
// ---------------------------------------------------------------------------

const EVENT_TYPE_COLORS: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  concert:      { label: "Concert",      color: "var(--accent-pink)",    bg: "var(--pink-soft)" },
  spectacle:    { label: "Spectacle",    color: "var(--secondary-cyan)", bg: "var(--cyan-soft)" },
  atelier:      { label: "Atelier",      color: "var(--primary-neon)",   bg: "var(--neon-soft)" },
  défilé:       { label: "Défilé",       color: "var(--warning-orange)", bg: "var(--orange-soft)" },
  cypher:       { label: "Cypher",       color: "var(--accent-pink)",    bg: "var(--pink-soft)" },
  conférence:   { label: "Conférence",   color: "var(--secondary-cyan)", bg: "var(--cyan-soft)" },
  installation: { label: "Installation", color: "var(--primary-neon)",   bg: "var(--neon-soft)" },
  autre:        { label: "Autre",        color: "var(--text-muted)",     bg: "rgba(255,255,255,0.06)" },
};

// ---------------------------------------------------------------------------
// Selection button
// ---------------------------------------------------------------------------


interface SelectionButtonProps {
  status: SelectionStatus | null;
  onCycle: () => void;
}

function SelectionButton({ status, onCycle }: SelectionButtonProps) {
  let label: string;
  let style: React.CSSProperties;

  if (status === "must-see") {
    label = "★ Must-see";
    style = {
      backgroundColor: "var(--accent-pink)",
      color: "white",
      border: "1.5px solid var(--accent-pink)",
      boxShadow: "var(--glow-pink)",
    };
  } else if (status === "intéressé") {
    label = "♥ Intéressé";
    style = {
      backgroundColor: "var(--orange-soft)",
      color: "var(--warning-orange)",
      border: "1.5px solid var(--warning-orange)",
    };
  } else if (status === "vu") {
    label = "✓ Vu";
    style = {
      backgroundColor: "var(--neon-soft)",
      color: "var(--primary-neon)",
      border: "1.5px solid var(--primary-neon)",
    };
  } else {
    label = "+ Ajouter";
    style = {
      backgroundColor: "transparent",
      color: "var(--text-dim)",
      border: "1.5px solid var(--border-color)",
    };
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onCycle();
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 10px",
        borderRadius: "var(--radius-full)",
        fontSize: "var(--fs-xs)",
        fontFamily: "var(--font-body)",
        fontWeight: "var(--fw-bold)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        cursor: "pointer",
        transition: "var(--transition-fast)",
        whiteSpace: "nowrap",
        flexShrink: 0,
        ...style,
      }}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}h${m}`;
}

// ---------------------------------------------------------------------------
// EventCard
// ---------------------------------------------------------------------------

interface EventCardProps {
  event: EventWithSelectionAndConfidence;
  onSelectionCycle: (eventId: string, next: SelectionStatus | null) => void;
  hasConflict?: boolean;
}

export function EventCard({ event, onSelectionCycle, hasConflict = false }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const selectionStatus = event.selection?.status ?? null;
  const typeConfig = EVENT_TYPE_COLORS[event.eventType] ?? EVENT_TYPE_COLORS.autre;
  const hasArtistDetails = Boolean(
    event.artist?.description ||
    (event.artist?.disciplines && event.artist.disciplines.length > 0) ||
    event.artist?.siteUrl ||
    event.artist?.instagram,
  );

  const hasTime = Boolean(event.startTime);
  const timeLabel =
    hasTime && event.startTime
      ? event.endTime
        ? `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`
        : formatTime(event.startTime)
      : "Itinérant";

  const isCancelled = event.status === "annulé";
  const isModified = event.status === "modifié";

  const durationLabel =
    !event.endTime && event.durationMins
      ? formatEventDuration(event.durationMins)
      : null;
  const accessLabel = getAccessLabel(event.access as "inclus" | "réservation_séparée");

  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        borderRadius: "var(--radius-md)",
        border: hasConflict
          ? "1.5px solid var(--warning-orange)"
          : "1px solid var(--border-color)",
        boxShadow: hasConflict ? "0 0 0 1px rgba(255,153,0,0.15)" : "none",
        padding: "var(--space-md)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-sm)",
        opacity: isCancelled ? 0.5 : 1,
        transition: "transform 0.12s ease-in-out",
        cursor: "default",
      }}
      // biome-ignore lint/a11y/useSemanticElements: card is not interactive
      role="article"
      aria-label={event.title}
    >
      {/* Row 1: time + type chip + badges */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-sm)",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-sm)",
            color: hasTime ? "var(--accent-pink)" : "var(--text-dim)",
            flexShrink: 0,
          }}
        >
          {timeLabel}
        </span>

        {/* Type chip */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "2px 8px",
            borderRadius: "var(--radius-full)",
            fontSize: "var(--fs-xs)",
            fontFamily: "var(--font-body)",
            fontWeight: "var(--fw-bold)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            backgroundColor: typeConfig.bg,
            color: typeConfig.color,
            border: `1px solid ${typeConfig.color}`,
            flexShrink: 0,
          }}
        >
          {typeConfig.label}
        </span>

        {/* IA badge */}
        {event.confidence === "auto" && (
          <Badge variant="ai">IA</Badge>
        )}

        {/* Conflict badge */}
        {hasConflict && (
          <Badge variant="urgent" aria-label="Conflit avec un autre événement sélectionné">
            ⚠ Conflit
          </Badge>
        )}

        {/* Status badges */}
        {isCancelled && <Badge variant="critical">Annulé</Badge>}
        {isModified && <Badge variant="urgent">Modifié</Badge>}

        {/* Duration when endTime is not set */}
        {durationLabel && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              fontSize: "var(--fs-xs)",
              fontFamily: "var(--font-mono)",
              color: "var(--text-dim)",
              flexShrink: 0,
            }}
          >
            <Clock size={10} aria-hidden="true" />
            {durationLabel}
          </span>
        )}

        {/* Access type badge */}
        {accessLabel && (
          <span
            aria-label="Réservation séparée requise"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              padding: "2px 7px",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--fs-xs)",
              fontFamily: "var(--font-body)",
              fontWeight: "var(--fw-bold)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              backgroundColor: "var(--orange-soft)",
              color: "var(--warning-orange)",
              border: "1px solid rgba(255,153,0,0.35)",
              flexShrink: 0,
            }}
          >
            <Ticket size={9} aria-hidden="true" />
            {accessLabel}
          </span>
        )}

      </div>

      {/* Row 2: title */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-sm)" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-base)",
              fontWeight: "var(--fw-medium)",
              color: "var(--text-main)",
              lineHeight: "var(--lh-snug)",
            }}
          >
            {event.title}
          </span>
          {event.artist && (
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-sm)",
                color: "var(--text-muted)",
              }}
            >
              {event.artist.name}
            </span>
          )}
        </div>

        {/* Selection button */}
        <SelectionButton
          status={selectionStatus}
          onCycle={() =>
            onSelectionCycle(event.id, nextSelectionStatus(selectionStatus))
          }
        />
      </div>

      {/* Row 3: venue */}
      {event.venue && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            color: "var(--text-dim)",
            fontSize: "var(--fs-xs)",
            fontFamily: "var(--font-body)",
          }}
        >
          <MapPin size={12} aria-hidden="true" />
          <span>{event.venue.name}</span>
        </div>
      )}

      {/* Row 4: tags */}
      {event.tags && event.tags.length > 0 && (
        <EventTagChips tags={event.tags} />
      )}

      {/* Row 5: expand toggle */}
      {hasArtistDetails && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          aria-expanded={expanded}
          aria-label={expanded ? "Réduire les détails" : "Voir les détails de l'artiste"}
          style={{
            alignSelf: "flex-start",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-xs)",
            fontWeight: "var(--fw-bold)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--text-dim)",
            transition: "var(--transition-fast)",
          }}
        >
          {expanded ? (
            <ChevronUp size={12} aria-hidden="true" />
          ) : (
            <ChevronDown size={12} aria-hidden="true" />
          )}
          {expanded ? "Réduire" : "Voir plus"}
        </button>
      )}

      {/* Row 6: artist details panel */}
      {expanded && event.artist && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-xs)",
            paddingTop: "var(--space-xs)",
            borderTop: "1px solid var(--border-color)",
          }}
        >
          {/* Disciplines + country */}
          {(event.artist.disciplines.length > 0 || event.artist.countryCode) && (
            <div
              style={{
                display: "flex",
                gap: "var(--space-sm)",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {event.artist.disciplines.map((d) => (
                <span
                  key={d}
                  style={{
                    padding: "1px 7px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "var(--fs-xs)",
                    fontFamily: "var(--font-body)",
                    backgroundColor: "var(--cyan-soft)",
                    color: "var(--secondary-cyan)",
                    border: "1px solid rgba(0,229,255,0.25)",
                  }}
                >
                  {d}
                </span>
              ))}
              {event.artist.countryCode && (
                <span
                  style={{
                    fontSize: "var(--fs-xs)",
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-dim)",
                  }}
                >
                  {event.artist.countryCode.toUpperCase()}
                </span>
              )}
            </div>
          )}

          {/* Description */}
          {event.artist.description && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
                lineHeight: "var(--lh-base)",
                margin: 0,
              }}
            >
              {event.artist.description}
            </p>
          )}

          {/* Social links */}
          {(event.artist.siteUrl || event.artist.instagram) && (
            <div style={{ display: "flex", gap: "var(--space-sm)" }}>
              {event.artist.siteUrl && (
                <a
                  href={event.artist.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Site web de ${event.artist.name}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: "var(--fs-xs)",
                    fontFamily: "var(--font-body)",
                    color: "var(--secondary-cyan)",
                    textDecoration: "none",
                  }}
                >
                  <Globe size={11} aria-hidden="true" />
                  Site
                </a>
              )}
              {event.artist.instagram && (
                <a
                  href={`https://instagram.com/${event.artist.instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Instagram de ${event.artist.name}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: "var(--fs-xs)",
                    fontFamily: "var(--font-body)",
                    color: "var(--accent-pink)",
                    textDecoration: "none",
                  }}
                >
                  <ExternalLink size={11} aria-hidden="true" />
                  @{event.artist.instagram.replace(/^@/, "")}
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EventTagChips
// ---------------------------------------------------------------------------

const MAX_VISIBLE_TAGS = 3;

interface EventTagChipsProps {
  tags: string[];
}

export function EventTagChips({ tags }: EventTagChipsProps) {
  const visible = tags.slice(0, MAX_VISIBLE_TAGS);
  const overflow = tags.length - MAX_VISIBLE_TAGS;
  return (
    <div
      role="group"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 4,
      }}
      aria-label="Tags"
    >
      {visible.map((tag) => (
        <span
          key={tag}
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "1px 7px",
            borderRadius: "var(--radius-full)",
            fontSize: "var(--fs-xs)",
            fontFamily: "var(--font-body)",
            fontWeight: "var(--fw-medium)",
            textTransform: "lowercase",
            letterSpacing: "0.02em",
            backgroundColor: "rgba(255,255,255,0.05)",
            color: "var(--text-dim)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          #{tag}
        </span>
      ))}
      {overflow > 0 && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "1px 7px",
            borderRadius: "var(--radius-full)",
            fontSize: "var(--fs-xs)",
            fontFamily: "var(--font-mono)",
            color: "var(--text-dim)",
            opacity: 0.6,
          }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
