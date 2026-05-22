"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { getEventsOffline } from "@/lib/offline";
import type { OfflineEvent } from "@/types";
import { useParams } from "next/navigation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}h${m}`;
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OfflineProgrammePage() {
  const params = useParams<{ id: string }>();
  const festEventId = params.id;
  const [events, setEvents] = useState<OfflineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const cached = await getEventsOffline(festEventId);
        // Sort by startTime ascending
        const sorted = [...cached].sort((a, b) => {
          if (!a.startTime) return 1;
          if (!b.startTime) return -1;
          return a.startTime.localeCompare(b.startTime);
        });
        setEvents(sorted);
      } catch {
        // IndexedDB unavailable — show empty state
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [festEventId]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
        paddingTop: "var(--space-md)",
        paddingBottom: "var(--space-2xl)",
      }}
    >
      {/* Offline notice */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-sm)",
          padding: "var(--space-sm) var(--space-md)",
          borderRadius: "var(--radius-md)",
          background: "rgba(255,153,0,0.1)",
          border: "1px solid rgba(255,153,0,0.3)",
        }}
      >
        <WifiOff size={16} style={{ color: "var(--warning-orange)", flexShrink: 0 }} />
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            color: "var(--warning-orange)",
            lineHeight: "var(--lh-base)",
          }}
        >
          Tu es hors-ligne — voici ton programme en cache
        </span>
      </div>

      {loading && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            color: "var(--text-muted)",
            textAlign: "center",
            paddingTop: "var(--space-xl)",
          }}
        >
          Chargement du cache...
        </p>
      )}

      {!loading && events.length === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--space-md)",
            paddingTop: "var(--space-2xl)",
            textAlign: "center",
          }}
        >
          <WifiOff size={40} style={{ color: "var(--text-dim)" }} strokeWidth={1.2} />
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
              color: "var(--text-muted)",
              maxWidth: 260,
              lineHeight: "var(--lh-base)",
            }}
          >
            Aucun programme en cache. Connecte-toi au moins une fois avec du réseau pour
            accéder au programme hors-ligne.
          </p>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
          {events.map((ev) => (
            <article
              key={ev.id}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-md)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {ev.startTime && (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--fs-xs)",
                    color: "var(--accent-pink)",
                    fontWeight: "var(--fw-bold)",
                  }}
                >
                  {formatTime(ev.startTime)}
                  {ev.endTime && ` → ${formatTime(ev.endTime)}`}
                </span>
              )}
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--fs-sm)",
                  color: "var(--text-main)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  margin: 0,
                }}
              >
                {ev.title}
              </p>
              {ev.artist && (
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--fs-xs)",
                    color: "var(--text-muted)",
                    margin: 0,
                  }}
                >
                  {ev.artist.name}
                  {ev.venue && ` · ${ev.venue.name}`}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
