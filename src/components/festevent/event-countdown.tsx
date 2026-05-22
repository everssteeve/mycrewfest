"use client";

import { useEffect, useState } from "react";
import {
  differenceInDays,
  isWithinInterval,
  parseISO,
} from "date-fns";
import type { EventSummary } from "@/types";

interface EventCountdownProps {
  startDate: string;
  endDate: string;
  /** Array of must-see events (startTime ISO strings) */
  mustSeeEvents?: EventSummary[];
}

type FestivalPhase =
  | { kind: "before"; daysUntil: number }
  | { kind: "tomorrow" }
  | { kind: "during"; dayN: number; totalDays: number }
  | { kind: "after" };

function getPhase(startDate: string, endDate: string): FestivalPhase {
  const now = new Date();
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const totalDays = differenceInDays(end, start) + 1;

  if (isWithinInterval(now, { start, end })) {
    const dayN = differenceInDays(now, start) + 1;
    return { kind: "during", dayN, totalDays };
  }

  const daysUntil = differenceInDays(start, now);
  if (daysUntil <= 0) return { kind: "after" };
  if (daysUntil === 1) return { kind: "tomorrow" };
  return { kind: "before", daysUntil };
}

function phaseBadge(phase: FestivalPhase): {
  label: string;
  color: string;
  bg: string;
  border: string;
} {
  switch (phase.kind) {
    case "before":
      return {
        label: `J-${phase.daysUntil}`,
        color: "var(--secondary-cyan)",
        bg: "var(--cyan-soft)",
        border: "var(--secondary-cyan)",
      };
    case "tomorrow":
      return {
        label: "DEMAIN !",
        color: "var(--warning-orange)",
        bg: "var(--orange-soft)",
        border: "var(--warning-orange)",
      };
    case "during":
      return {
        label: `JOUR ${phase.dayN}/${phase.totalDays}`,
        color: "var(--primary-neon)",
        bg: "var(--neon-soft)",
        border: "var(--primary-neon)",
      };
    case "after":
      return {
        label: "FESTIVAL TERMINÉ",
        color: "var(--text-dim)",
        bg: "rgba(255,255,255,0.04)",
        border: "var(--border-color)",
      };
  }
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0s";
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function nextMustSeeTime(mustSeeEvents: EventSummary[]): Date | null {
  const now = new Date();
  for (const e of mustSeeEvents) {
    if (!e.startTime) continue;
    const t = new Date(e.startTime);
    if (t > now) return t;
  }
  return null;
}

export function EventCountdown({
  startDate,
  endDate,
  mustSeeEvents = [],
}: EventCountdownProps) {
  const [phase, setPhase] = useState<FestivalPhase>(() =>
    getPhase(startDate, endDate),
  );
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const p = getPhase(startDate, endDate);
      setPhase(p);

      if (p.kind === "during" || p.kind === "tomorrow" || p.kind === "before") {
        const sorted = [...mustSeeEvents].sort((a, b) => {
          if (!a.startTime) return 1;
          if (!b.startTime) return -1;
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        });
        const nextTime = nextMustSeeTime(sorted);
        if (nextTime) {
          const ms = nextTime.getTime() - Date.now();
          setCountdown(formatCountdown(ms));
        } else {
          setCountdown(null);
        }
      } else {
        setCountdown(null);
      }
    };

    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [startDate, endDate, mustSeeEvents]);

  const badge = phaseBadge(phase);

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", flexWrap: "wrap" }}
    >
      {/* Phase badge */}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--fs-xs)",
          fontWeight: "var(--fw-bold)",
          color: badge.color,
          backgroundColor: badge.bg,
          border: `1px solid ${badge.border}`,
          borderRadius: "var(--radius-full)",
          padding: "2px 10px",
          whiteSpace: "nowrap",
          flexShrink: 0,
          ...(phase.kind === "during"
            ? { boxShadow: "var(--glow-neon)" }
            : {}),
        }}
      >
        {badge.label}
      </span>

      {/* Must-see countdown */}
      {countdown && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-xs)",
            color: "var(--accent-pink)",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          ★ Must-see dans {countdown}
        </span>
      )}
    </div>
  );
}
