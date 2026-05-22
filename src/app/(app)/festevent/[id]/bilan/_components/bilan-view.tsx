"use client";

import { useMemo } from "react";
import { MapPin, Eye, Clock, Star } from "lucide-react";
import type { EventWithSelectionAndConfidence } from "@/components/festevent/event-card";
import { useSelections } from "@/hooks/use-selections";
import type { SelectionStatus } from "@/types";
import { computeBilan, formatBilanDuration } from "@/lib/bilan";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}h${d.getMinutes().toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

interface StatCardProps {
  value: string | number;
  label: string;
  color?: string;
  icon?: React.ReactNode;
}

function StatCard({ value, label, color = "var(--primary-neon)", icon }: StatCardProps) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-md)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        alignItems: "center",
        textAlign: "center",
      }}
    >
      {icon && (
        <span style={{ color, opacity: 0.7 }} aria-hidden="true">
          {icon}
        </span>
      )}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--fs-2xl)",
          fontWeight: "var(--fw-bold)",
          color,
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--fs-xs)",
          color: "var(--text-dim)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontWeight: "var(--fw-bold)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SeenEventRow
// ---------------------------------------------------------------------------

interface SeenEventRowProps {
  event: EventWithSelectionAndConfidence;
}

function SeenEventRow({ event }: SeenEventRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--space-sm)",
        padding: "var(--space-sm) 0",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--fs-xs)",
          color: "var(--accent-pink)",
          flexShrink: 0,
          width: 44,
          paddingTop: 2,
        }}
      >
        {event.startTime ? formatTime(event.startTime) : "—"}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            color: "var(--text-main)",
            margin: 0,
          }}
        >
          {event.title}
        </p>
        {event.venue && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              color: "var(--text-dim)",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <MapPin size={10} aria-hidden="true" />
            {event.venue.name}
          </p>
        )}
      </div>
      {event.durationMins && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-xs)",
            color: "var(--text-dim)",
            flexShrink: 0,
          }}
        >
          {formatBilanDuration(event.durationMins)}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BilanView
// ---------------------------------------------------------------------------

interface BilanViewProps {
  festEventId: string;
  festivalName: string;
  initialEvents: EventWithSelectionAndConfidence[];
}

export function BilanView({ festEventId, festivalName, initialEvents }: BilanViewProps) {
  const { selections } = useSelections(festEventId);

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

  const stats = useMemo(() => computeBilan(events), [events]);

  const seenEvents = useMemo(
    () => events.filter((e) => e.selection?.status === "vu"),
    [events],
  );

  const missedMustSees = useMemo(
    () => events.filter((e) => e.selection?.status === "must-see"),
    [events],
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-lg)",
        paddingTop: "var(--space-md)",
        paddingBottom: "var(--space-2xl)",
      }}
    >
      {/* Header */}
      <div>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-xs)",
            color: "var(--text-dim)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            margin: 0,
          }}
        >
          {festivalName}
        </p>
        <h1
          className="t-h2"
          style={{
            margin: "4px 0 0",
            color: "var(--text-main)",
            fontSize: "var(--fs-xl)",
          }}
        >
          Ton bilan
        </h1>
      </div>

      {/* Stats grid */}
      <div style={{ display: "flex", gap: "var(--space-sm)" }}>
        <StatCard
          value={stats.totalSeen}
          label="événements vus"
          color="var(--primary-neon)"
          icon={<Eye size={16} />}
        />
        <StatCard
          value={formatBilanDuration(stats.totalDurationMins)}
          label="de festival"
          color="var(--secondary-cyan)"
          icon={<Clock size={16} />}
        />
        {stats.mustSeePending > 0 && (
          <StatCard
            value={stats.mustSeePending}
            label="must-see ratés"
            color="var(--warning-orange)"
            icon={<Star size={16} />}
          />
        )}
      </div>

      {/* Top venue */}
      {stats.topVenue && (
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-md)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
          }}
        >
          <MapPin size={16} style={{ color: "var(--accent-pink)", flexShrink: 0 }} aria-hidden="true" />
          <div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                margin: 0,
              }}
            >
              Scène préférée
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-base)",
                fontWeight: "var(--fw-medium)",
                color: "var(--text-main)",
                margin: 0,
              }}
            >
              {stats.topVenue}
            </p>
          </div>
          {stats.uniqueVenues > 1 && (
            <span
              style={{
                marginLeft: "auto",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-dim)",
              }}
            >
              +{stats.uniqueVenues - 1} autre{stats.uniqueVenues > 2 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Seen events list */}
      {seenEvents.length > 0 && (
        <section aria-label="Événements vus">
          <h2
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
              fontWeight: "var(--fw-bold)",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 var(--space-sm)",
            }}
          >
            Vus ({seenEvents.length})
          </h2>
          <div>
            {seenEvents.map((e) => (
              <SeenEventRow key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      {/* Missed must-sees */}
      {missedMustSees.length > 0 && (
        <section aria-label="Must-sees non vus">
          <h2
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
              fontWeight: "var(--fw-bold)",
              color: "var(--warning-orange)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 var(--space-sm)",
            }}
          >
            Must-see ratés ({missedMustSees.length})
          </h2>
          <div>
            {missedMustSees.map((e) => (
              <SeenEventRow key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {stats.totalSeen === 0 && stats.mustSeePending === 0 && stats.intéresséPending === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--space-md)",
            paddingTop: "var(--space-2xl)",
            textAlign: "center",
          }}
          role="status"
        >
          <span style={{ fontSize: 40 }} aria-hidden="true">🎪</span>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
            Aucun événement marqué pour ce festival.
          </p>
        </div>
      )}
    </div>
  );
}
