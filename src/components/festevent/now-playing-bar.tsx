"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatMinsUntil } from "@/lib/now-playing";
import type { EventSummary } from "@/types";

interface NowPlayingData {
  current: EventSummary | null;
  next: EventSummary | null;
  minsUntilNext: number | null;
}

interface NowPlayingBarProps {
  festEventId: string;
  onScrollToEvent?: (eventId: string) => void;
}

function formatTime(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}h${m}`;
}

export function NowPlayingBar({ festEventId, onScrollToEvent }: NowPlayingBarProps) {
  const [data, setData] = useState<NowPlayingData | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/festevents/${festEventId}/now-playing`);
      if (res.ok) {
        const json: NowPlayingData = await res.json();
        setData(json);
      }
    } catch {
      // silently ignore network errors
    }
  }, [festEventId]);

  useEffect(() => {
    void fetchData();
    intervalRef.current = setInterval(() => void fetchData(), 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  // Nothing to show
  if (!data || (!data.current && !data.next)) {
    return null;
  }

  const hasCurrent = Boolean(data.current);
  const hasNext = Boolean(data.next);

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: "var(--nav-height)",
        zIndex: 30,
        padding: "0 var(--space-md)",
        paddingBottom: "var(--space-xs)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-xs)",
        pointerEvents: "none",
      }}
    >
      {/* EN COURS */}
      {hasCurrent && data.current && (
        <button
          type="button"
          onClick={() => data.current?.id && onScrollToEvent?.(data.current.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
            backgroundColor: "var(--bg-surface-elevated)",
            border: "1.5px solid var(--primary-neon)",
            borderRadius: "var(--radius-md)",
            padding: "10px var(--space-md)",
            cursor: onScrollToEvent ? "pointer" : "default",
            pointerEvents: "auto",
            animation: "nowPlaying-pulse 1.5s ease-in-out infinite",
            boxShadow: "var(--glow-neon)",
            width: "100%",
            textAlign: "left",
          }}
          aria-label={`En cours : ${data.current.title}`}
        >
          {/* Ring indicator */}
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "var(--primary-neon)",
              flexShrink: 0,
              boxShadow: "0 0 8px var(--primary-neon)",
            }}
            aria-hidden="true"
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--primary-neon)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: "var(--fw-bold)",
              }}
            >
              ▶ EN COURS
              {data.current.venue && ` · ${data.current.venue.name}`}
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-sm)",
                color: "var(--text-main)",
                fontWeight: "var(--fw-medium)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {data.current.title}
            </div>
          </div>
        </button>
      )}

      {/* PROCHAIN — always shown when available (even alongside EN COURS) */}
      {hasNext && data.next && (
        <button
          type="button"
          onClick={() => data.next?.id && onScrollToEvent?.(data.next.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
            backgroundColor: "var(--bg-surface-elevated)",
            border: "1.5px solid var(--secondary-cyan)",
            borderRadius: "var(--radius-md)",
            padding: hasCurrent ? "6px var(--space-md)" : "10px var(--space-md)",
            cursor: onScrollToEvent ? "pointer" : "default",
            pointerEvents: "auto",
            width: "100%",
            textAlign: "left",
          }}
          aria-label={`Prochain : ${data.next.title}`}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "transparent",
              border: "2px solid var(--secondary-cyan)",
              flexShrink: 0,
            }}
            aria-hidden="true"
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            {hasCurrent ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-xs)",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--fs-xs)",
                    color: "var(--secondary-cyan)",
                    fontWeight: "var(--fw-bold)",
                    flexShrink: 0,
                  }}
                >
                  ▷{data.minsUntilNext != null && ` ${formatMinsUntil(data.minsUntilNext)}`}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--fs-xs)",
                    color: "var(--text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {data.next.title}
                </span>
              </div>
            ) : (
              <>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--fs-xs)",
                    color: "var(--secondary-cyan)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: "var(--fw-bold)",
                  }}
                >
                  ● PROCHAIN
                  {data.next.startTime && ` · ${formatTime(data.next.startTime)}`}
                  {data.minsUntilNext != null && ` · dans ${formatMinsUntil(data.minsUntilNext)}`}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--fs-sm)",
                    color: "var(--text-main)",
                    fontWeight: "var(--fw-medium)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {data.next.title}
                </div>
              </>
            )}
          </div>
        </button>
      )}

      <style>{`
        @keyframes nowPlaying-pulse {
          0%, 100% { box-shadow: var(--glow-neon); }
          50% { box-shadow: 0 0 28px rgba(0,255,102,0.7); }
        }
      `}</style>
    </div>
  );
}
