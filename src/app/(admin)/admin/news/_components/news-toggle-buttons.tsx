"use client";

import { useState, useTransition } from "react";
import { toggleNewsPin, toggleNewsUrgency } from "../_actions/toggle-news";

interface Props {
  id: string;
  initialIsPinned: boolean;
  initialUrgencyLevel: string;
}

export function NewsToggleButtons({ id, initialIsPinned, initialUrgencyLevel }: Props) {
  const [isPinned, setIsPinned] = useState(initialIsPinned);
  const [urgencyLevel, setUrgencyLevel] = useState(initialUrgencyLevel);
  const [pinPending, startPinTransition] = useTransition();
  const [urgencyPending, startUrgencyTransition] = useTransition();

  function handlePin() {
    setIsPinned((v) => !v);
    startPinTransition(async () => {
      const result = await toggleNewsPin(id);
      if (!result.success) setIsPinned((v) => !v);
      else setIsPinned(result.isPinned);
    });
  }

  function handleUrgency() {
    const next = urgencyLevel === "critique" ? "normal" : "critique";
    setUrgencyLevel(next);
    startUrgencyTransition(async () => {
      const result = await toggleNewsUrgency(id);
      if (!result.success) setUrgencyLevel(urgencyLevel);
      else setUrgencyLevel(result.urgencyLevel);
    });
  }

  const isCritique = urgencyLevel === "critique";

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {/* Pin toggle */}
      <button
        data-testid={`admin-news-pin-toggle-${id}`}
        type="button"
        onClick={handlePin}
        disabled={pinPending}
        title={isPinned ? "Désépingler" : "Épingler"}
        aria-label={isPinned ? "Désépingler cette news" : "Épingler cette news"}
        style={{
          padding: "3px 8px",
          border: `1px solid ${isPinned ? "var(--warning-orange)" : "var(--border-color)"}`,
          borderRadius: "var(--radius-sm)",
          background: isPinned ? "rgba(255,153,0,0.15)" : "transparent",
          color: isPinned ? "var(--warning-orange)" : "var(--text-dim)",
          fontSize: "var(--fs-xs)",
          cursor: pinPending ? "not-allowed" : "pointer",
          fontFamily: "var(--font-body)",
          fontWeight: "var(--fw-bold)",
          opacity: pinPending ? 0.6 : 1,
          transition: "var(--transition-fast)",
        }}
      >
        {isPinned ? "★ Épinglée" : "☆ Épingler"}
      </button>

      {/* Urgency toggle */}
      <button
        data-testid={`admin-news-urgency-toggle-${id}`}
        type="button"
        onClick={handleUrgency}
        disabled={urgencyPending}
        title={isCritique ? "Passer en Normal" : "Passer en Critique"}
        aria-label={isCritique ? "Passer cette news en Normal" : "Passer cette news en Critique"}
        style={{
          padding: "3px 8px",
          border: `1px solid ${isCritique ? "var(--danger-red)" : "var(--border-color)"}`,
          borderRadius: "var(--radius-sm)",
          background: isCritique ? "rgba(255,51,85,0.15)" : "transparent",
          color: isCritique ? "var(--danger-red)" : "var(--text-dim)",
          fontSize: "var(--fs-xs)",
          cursor: urgencyPending ? "not-allowed" : "pointer",
          fontFamily: "var(--font-body)",
          fontWeight: "var(--fw-bold)",
          opacity: urgencyPending ? 0.6 : 1,
          transition: "var(--transition-fast)",
        }}
      >
        {isCritique ? "⚠ Critique" : "Normal"}
      </button>
    </div>
  );
}
