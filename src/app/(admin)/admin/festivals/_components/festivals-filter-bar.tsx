"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  type AdminFestivalFilterable,
  FESTIVAL_STATUS_OPTIONS,
  type FestivalIngestionStatus,
  filterAdminFestivals,
} from "@/lib/admin-festival-filter";

interface FestivalsFilterBarProps<T extends AdminFestivalFilterable & { id: string }> {
  festivals: T[];
  children: (filtered: T[]) => React.ReactNode;
}

export function FestivalsFilterBar<T extends AdminFestivalFilterable & { id: string }>({
  festivals,
  children,
}: FestivalsFilterBarProps<T>) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<FestivalIngestionStatus>("tous");

  const filtered = useMemo(
    () => filterAdminFestivals(festivals, query, status),
    [festivals, query, status],
  );

  return (
    <div>
      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-lg)",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Search input */}
        <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 360 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-dim)",
              pointerEvents: "none",
            }}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un festival…"
            data-testid="admin-festival-search"
            style={{
              width: "100%",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-main)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
              padding: "8px 12px 8px 32px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Status filter chips */}
        <div style={{ display: "flex", gap: "var(--space-xs)" }}>
          {FESTIVAL_STATUS_OPTIONS.map((opt) => {
            const isActive = status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                data-testid={`admin-festival-filter-${opt.value}`}
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
        </div>

        {/* Result count */}
        <span
          data-testid="admin-festival-filter-count"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-xs)",
            color: "var(--text-dim)",
            marginLeft: "auto",
          }}
        >
          {filtered.length} / {festivals.length} festival{festivals.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Render filtered list */}
      {children(filtered)}
    </div>
  );
}
