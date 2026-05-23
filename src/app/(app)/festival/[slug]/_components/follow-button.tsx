"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

interface FollowButtonProps {
  festivalId: string;
  festivalSlug: string;
  initialFollowed?: boolean;
}

export function FollowButton({
  festivalId: _festivalId,
  festivalSlug,
  initialFollowed = false,
}: FollowButtonProps) {
  const [followed, setFollowed] = useState(initialFollowed);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(async () => {
      const method = followed ? "DELETE" : "POST";
      try {
        const res = await fetch(`/api/festivals/${festivalSlug}/follow`, {
          method,
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          setFollowed((f) => !f);
        }
      } catch {
        // Silent failure — UI stays consistent with server state on next load
      }
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
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
        border: followed ? "1.5px solid var(--primary-neon)" : "1.5px solid var(--border-strong)",
        backgroundColor: followed ? "var(--neon-soft)" : "transparent",
        color: followed ? "var(--primary-neon)" : "var(--text-muted)",
        fontFamily: "var(--font-body)",
        fontSize: "var(--fs-sm)",
        fontWeight: "var(--fw-bold)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        cursor: isPending ? "wait" : "pointer",
        transition: "var(--transition-fast)",
        boxShadow: followed ? "var(--glow-neon)" : "none",
        opacity: isPending ? 0.7 : 1,
      }}
    >
      {isPending ? (
        <Loader2 size={16} aria-hidden="true" className="animate-spin" />
      ) : followed ? (
        <Bell size={16} aria-hidden="true" />
      ) : (
        <BellOff size={16} aria-hidden="true" />
      )}
      {followed ? "Suivi" : "Suivre"}
    </button>
  );
}
