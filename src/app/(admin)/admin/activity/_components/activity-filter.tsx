"use client";

import { useState, useMemo } from "react";
import {
  filterActivityEntries,
  sortActivityEntriesDesc,
  formatActivityTimestamp,
  ACTIVITY_TYPE_OPTIONS,
  ACTIVITY_TYPE_COLORS,
  ACTIVITY_TYPE_ICONS,
  type ActivityEntry,
  type ActivityType,
} from "@/lib/admin-activity";

type SerializableEntry = Omit<ActivityEntry, "occurredAt"> & { occurredAt: Date | string };

interface ActivityFilterProps {
  entries: SerializableEntry[];
}

export function ActivityFilter({ entries }: ActivityFilterProps) {
  const [activeType, setActiveType] = useState<ActivityType | "all">("all");

  const normalized: ActivityEntry[] = useMemo(
    () => entries.map((e) => ({ ...e, occurredAt: new Date(e.occurredAt) })),
    [entries],
  );

  const filtered = useMemo(
    () => sortActivityEntriesDesc(filterActivityEntries(normalized, activeType)),
    [normalized, activeType],
  );

  return (
    <div>
      {/* Filter chips */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-xs)",
          flexWrap: "wrap",
          marginBottom: "var(--space-lg)",
          alignItems: "center",
        }}
      >
        {ACTIVITY_TYPE_OPTIONS.map((opt) => {
          const isActive = activeType === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setActiveType(opt.value)}
              data-testid={`admin-activity-filter-${opt.value}`}
              aria-pressed={isActive}
              style={{
                padding: "6px 14px",
                border: isActive
                  ? "1.5px solid var(--primary-neon)"
                  : "1px solid var(--border-color)",
                borderRadius: "var(--radius-full)",
                background: isActive ? "rgba(0,255,102,0.08)" : "transparent",
                color: isActive ? "var(--primary-neon)" : "var(--text-dim)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                fontWeight: isActive ? "var(--fw-bold)" : "normal",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                cursor: "pointer",
              }}
            >
              {opt.label}
            </button>
          );
        })}
        <span
          data-testid="admin-activity-count"
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-xs)",
            color: "var(--text-dim)",
          }}
        >
          {filtered.length} événement{filtered.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Timeline */}
      <div
        data-testid="admin-activity-timeline"
        style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}
      >
        {filtered.length === 0 && (
          <p
            style={{
              color: "var(--text-dim)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
              textAlign: "center",
              padding: "var(--space-2xl) 0",
            }}
          >
            Aucune activité pour ce filtre.
          </p>
        )}
        {filtered.map((entry) => (
          <div
            key={entry.id}
            data-testid={`admin-activity-entry-${entry.id}`}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "var(--space-md)",
              padding: "var(--space-sm) var(--space-md)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              borderLeft: `3px solid ${ACTIVITY_TYPE_COLORS[entry.type]}`,
            }}
          >
            <span style={{ fontSize: "1rem", flexShrink: 0 }}>
              {ACTIVITY_TYPE_ICONS[entry.type]}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-sm)",
                  color: "var(--text-main)",
                  fontWeight: "var(--fw-bold)",
                }}
              >
                {entry.label}
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-dim)",
                }}
              >
                {entry.detail}
              </p>
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              {formatActivityTimestamp(entry.occurredAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
