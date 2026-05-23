"use client";

import { useState } from "react";
import type { QuickStatus } from "@/types";

interface QuickStatusBarProps {
  crewId: string;
  currentStatus: QuickStatus | null;
  onStatusChange?: (status: QuickStatus | null) => void;
}

const QUICK_STATUSES: Array<{
  value: QuickStatus;
  label: string;
  icon: string;
}> = [
  { value: "fosse", label: "Je suis en fosse", icon: "🎶" },
  { value: "nourriture", label: "Je cherche à manger", icon: "🍔" },
  { value: "ralliement", label: "RDV au point de ralliement", icon: "📍" },
  { value: "rentre", label: "Je rentre dormir", icon: "🏕️" },
];

export function QuickStatusBar({ crewId, currentStatus, onStatusChange }: QuickStatusBarProps) {
  const [posting, setPosting] = useState(false);

  async function handleSelect(value: QuickStatus) {
    const next = currentStatus === value ? null : value;
    setPosting(true);

    try {
      if (next !== null) {
        await fetch(`/api/crews/${crewId}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
      }
      onStatusChange?.(next);
    } catch {
      // Silent fail — status is optimistic in store
    } finally {
      setPosting(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-sm)",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-xs)",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "var(--tracking-wider)",
        }}
      >
        Mon statut
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--space-sm)",
        }}
      >
        {QUICK_STATUSES.map(({ value, label, icon }) => {
          const isActive = currentStatus === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleSelect(value)}
              disabled={posting}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                padding: "var(--space-sm) var(--space-md)",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${isActive ? "var(--primary-neon)" : "var(--border-color)"}`,
                backgroundColor: isActive ? "var(--neon-soft)" : "var(--bg-surface)",
                color: isActive ? "var(--primary-neon)" : "var(--text-main)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                fontWeight: isActive ? "var(--fw-bold)" : "var(--fw-regular)",
                cursor: "pointer",
                transition: "var(--transition-fast)",
                boxShadow: isActive ? "var(--glow-neon)" : "var(--shadow-sm)",
                textAlign: "left",
                lineHeight: "var(--lh-snug)",
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }} aria-hidden="true">
                {icon}
              </span>
              <span style={{ flex: 1 }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
