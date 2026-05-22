"use client";

import { useMemo } from "react";
import { useSelections } from "@/hooks/use-selections";
import { computeSelectionProgress } from "@/lib/selection-progress";
import type { SelectionStatus } from "@/types";

interface SelectionProgressBarProps {
  festEventId: string;
}

export function SelectionProgressBar({ festEventId }: SelectionProgressBarProps) {
  const { selections } = useSelections(festEventId);

  const counts = useMemo(
    () => computeSelectionProgress(selections as Record<string, SelectionStatus>),
    [selections],
  );

  if (counts.total === 0) return null;

  return (
    <div
      aria-label="Progression du festival"
      data-testid="selection-progress-bar"
      style={{
        padding: "6px var(--space-md)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        borderTop: "1px solid var(--border-color)",
      }}
    >
      {/* Progress track */}
      <div
        role="progressbar"
        aria-valuenow={counts.progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${counts.vu} événement${counts.vu !== 1 ? "s" : ""} vu${counts.vu !== 1 ? "s" : ""} sur ${counts.total}`}
        style={{
          height: 3,
          borderRadius: 2,
          backgroundColor: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${counts.progressPct}%`,
            backgroundColor: "var(--primary-neon)",
            boxShadow: counts.progressPct > 0 ? "0 0 6px var(--primary-neon)" : "none",
            borderRadius: 2,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      {/* Counts row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-sm)",
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "var(--text-dim)",
        }}
      >
        <span style={{ color: "var(--primary-neon)" }}>
          {counts.vu} vu{counts.vu !== 1 ? "s" : ""}
        </span>
        <span style={{ color: "var(--border-strong)" }}>·</span>
        {counts.mustSeePending > 0 && (
          <>
            <span style={{ color: "var(--accent-pink)" }}>
              {counts.mustSeePending} must-see
            </span>
            <span style={{ color: "var(--border-strong)" }}>·</span>
          </>
        )}
        <span>
          {counts.total} séléctionné{counts.total !== 1 ? "s" : ""}
        </span>
        <span style={{ marginLeft: "auto", color: "var(--text-dim)" }}>
          {counts.progressPct}%
        </span>
      </div>
    </div>
  );
}
