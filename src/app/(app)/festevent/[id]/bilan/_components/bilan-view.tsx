"use client";

import { useCallback, useMemo, useState } from "react";
import { MapPin, Eye, Clock, Star, Copy, Check } from "lucide-react";
import type { EventWithSelectionAndConfidence } from "@/components/festevent/event-card";
import { useSelections } from "@/hooks/use-selections";
import type { SelectionStatus } from "@/types";
import { computeBilan, formatBilanDuration } from "@/lib/bilan";
import { generateBilanText } from "@/lib/bilan-text";
import { computeSelectionCompletionPercent, computeTotalSelected } from "@/lib/bilan-progress";

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
// MissedMustSeeRow
// ---------------------------------------------------------------------------

interface MissedMustSeeRowProps {
  event: EventWithSelectionAndConfidence;
  onMarkVu: () => void;
}

function MissedMustSeeRow({ event, onMarkVu }: MissedMustSeeRowProps) {
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
          color: "var(--warning-orange)",
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
      <button
        type="button"
        onClick={onMarkVu}
        aria-label={`Marquer ${event.title} comme vu`}
        data-testid={`mark-vu-${event.id}`}
        style={{
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 10px",
          borderRadius: "var(--radius-full)",
          border: "1px solid var(--border-color)",
          backgroundColor: "transparent",
          color: "var(--text-dim)",
          fontFamily: "var(--font-body)",
          fontSize: "var(--fs-xs)",
          cursor: "pointer",
          transition: "border-color 0.2s, color 0.2s, background-color 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--primary-neon)";
          (e.currentTarget as HTMLElement).style.color = "var(--primary-neon)";
          (e.currentTarget as HTMLElement).style.backgroundColor = "var(--neon-soft)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)";
          (e.currentTarget as HTMLElement).style.color = "var(--text-dim)";
          (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
        }}
      >
        <Check size={11} aria-hidden="true" />
        Vu
      </button>
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
  const { selections, updateSelection } = useSelections(festEventId);

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
  const [copied, setCopied] = useState(false);

  const copyBilan = useCallback(async () => {
    const text = generateBilanText(
      events.map((e) => ({
        title: e.title,
        durationMins: e.durationMins ?? null,
        selection: e.selection,
        venue: e.venue ? { name: e.venue.name } : null,
      })),
      festivalName,
    );
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [events, festivalName]);

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
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--space-sm)" }}>
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
        <button
          type="button"
          onClick={copyBilan}
          data-testid="copy-bilan-btn"
          aria-label={copied ? "Bilan copié" : "Copier le bilan"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: "var(--radius-md)",
            border: `1px solid ${copied ? "var(--primary-neon)" : "var(--border-color)"}`,
            backgroundColor: copied ? "var(--neon-soft)" : "var(--bg-surface)",
            color: copied ? "var(--primary-neon)" : "var(--text-dim)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-xs)",
            fontWeight: "var(--fw-medium)",
            cursor: "pointer",
            transition: "border-color 0.2s, color 0.2s, background-color 0.2s",
            flexShrink: 0,
          }}
        >
          {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>

      {/* Selection completion progress bar */}
      {computeTotalSelected(stats.totalSeen, stats.mustSeePending, stats.intéresséPending) > 0 && (() => {
        const total = computeTotalSelected(stats.totalSeen, stats.mustSeePending, stats.intéresséPending);
        const percent = computeSelectionCompletionPercent(stats.totalSeen, stats.mustSeePending, stats.intéresséPending);
        return (
          <div
            data-testid="bilan-progress"
            style={{ display: "flex", flexDirection: "column", gap: 6 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {stats.totalSeen} / {total} sélections vues
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--fs-sm)",
                  color: percent === 100 ? "var(--primary-neon)" : "var(--text-dim)",
                  fontWeight: "var(--fw-bold)",
                }}
              >
                {percent}%
              </span>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--bg-surface)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${percent}%`,
                  borderRadius: "var(--radius-full)",
                  backgroundColor: percent === 100 ? "var(--primary-neon)" : "var(--secondary-cyan)",
                  transition: "width 0.4s ease",
                  boxShadow: percent === 100 ? "0 0 8px var(--primary-neon)" : "none",
                }}
              />
            </div>
          </div>
        );
      })()}

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
              <MissedMustSeeRow
                key={e.id}
                event={e}
                onMarkVu={() => updateSelection(e.id, "vu")}
              />
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
