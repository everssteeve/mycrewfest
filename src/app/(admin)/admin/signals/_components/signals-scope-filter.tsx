"use client";

import { useMemo, useState } from "react";
import {
  type AdminSignalRow,
  filterSignalsByScope,
  getSignalScopeColor,
  SIGNAL_SCOPE_OPTIONS,
  type SignalScopeFilter,
} from "@/lib/admin-signals";
import { SignalsTable } from "./signals-table";

interface Props {
  signals: AdminSignalRow[];
}

export function SignalsScopeFilter({ signals }: Props) {
  const [scope, setScope] = useState<SignalScopeFilter>("tous");

  const filtered = useMemo(() => filterSignalsByScope(signals, scope), [signals, scope]);

  return (
    <div>
      {/* Scope filter chips */}
      <div
        data-testid="admin-signals-scope-filter"
        style={{
          display: "flex",
          gap: "var(--space-xs)",
          marginBottom: "var(--space-md)",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {SIGNAL_SCOPE_OPTIONS.map((opt) => {
          const isActive = scope === opt.value;
          const color = opt.value === "tous" ? "var(--text-dim)" : getSignalScopeColor(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              data-testid={`admin-signals-filter-${opt.value}`}
              aria-pressed={isActive}
              onClick={() => setScope(opt.value)}
              style={{
                padding: "6px 14px",
                border: isActive ? `1.5px solid ${color}` : "1px solid var(--border-color)",
                borderRadius: "var(--radius-full)",
                background: isActive
                  ? `color-mix(in srgb, ${color} 10%, transparent)`
                  : "transparent",
                color: isActive ? color : "var(--text-dim)",
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
          data-testid="admin-signals-filter-count"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-xs)",
            color: "var(--text-dim)",
            marginLeft: "auto",
          }}
        >
          {filtered.length} / {signals.length}
        </span>
      </div>

      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        <SignalsTable signals={filtered} />
      </div>
    </div>
  );
}
