"use client";

import { useState } from "react";
import { Bell, BellOff } from "lucide-react";

interface FollowButtonProps {
  festivalId: string;
  initialFollowed?: boolean;
}

export function FollowButton({
  festivalId: _festivalId,
  initialFollowed = false,
}: FollowButtonProps) {
  const [followed, setFollowed] = useState(initialFollowed);

  return (
    <button
      type="button"
      onClick={() => setFollowed((f) => !f)}
      aria-label={followed ? "Ne plus suivre ce festival" : "Suivre ce festival"}
      aria-pressed={followed}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        paddingLeft: 14,
        paddingRight: 14,
        paddingTop: 8,
        paddingBottom: 8,
        borderRadius: "var(--radius-md)",
        border: followed
          ? "1.5px solid var(--primary-neon)"
          : "1.5px solid var(--border-strong)",
        backgroundColor: followed ? "var(--neon-soft)" : "transparent",
        color: followed ? "var(--primary-neon)" : "var(--text-muted)",
        fontFamily: "var(--font-body)",
        fontSize: "var(--fs-sm)",
        fontWeight: "var(--fw-bold)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        cursor: "pointer",
        transition: "var(--transition-fast)",
        boxShadow: followed ? "var(--glow-neon)" : "none",
      }}
    >
      {followed ? (
        <Bell size={16} aria-hidden="true" />
      ) : (
        <BellOff size={16} aria-hidden="true" />
      )}
      {followed ? "Suivi" : "Suivre"}
    </button>
  );
}
