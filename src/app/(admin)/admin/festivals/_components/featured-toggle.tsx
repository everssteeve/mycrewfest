"use client";
import { useState } from "react";
import { toggleFestivalFeatured } from "../_actions/toggle-featured";

interface FeaturedToggleProps {
  festivalId: string;
  isFeatured: boolean;
}

export function FeaturedToggle({ festivalId, isFeatured: initialValue }: FeaturedToggleProps) {
  const [featured, setFeatured] = useState(initialValue);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    setFeatured((v) => !v);
    try {
      await toggleFestivalFeatured(festivalId, featured);
    } catch {
      setFeatured((v) => !v);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      data-testid={`festival-featured-toggle-${festivalId}`}
      aria-label={featured ? "Retirer du spotlight" : "Mettre en spotlight"}
      aria-pressed={featured}
      title={featured ? "Retirer du spotlight" : "Mettre en spotlight"}
      style={{
        padding: "4px 8px",
        border: featured ? "1px solid var(--primary-neon)" : "1px solid var(--border-color)",
        borderRadius: "var(--radius-sm)",
        background: featured ? "rgba(0,255,102,0.08)" : "transparent",
        color: featured ? "var(--primary-neon)" : "var(--text-dim)",
        cursor: pending ? "wait" : "pointer",
        fontSize: 16,
        lineHeight: 1,
        opacity: pending ? 0.6 : 1,
        transition: "color 0.15s, border-color 0.15s, background 0.15s",
      }}
    >
      {featured ? "★" : "☆"}
    </button>
  );
}
