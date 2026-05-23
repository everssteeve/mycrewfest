"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import type { UrgentNewsItem } from "@/lib/news-urgency";
import { getUrgentCategoryLabel, getUrgentBannerLabel } from "@/lib/news-urgency";

interface UrgentNewsBannerProps {
  urgentNews: UrgentNewsItem[];
  newsPageHref: string;
}

export function UrgentNewsBanner({ urgentNews, newsPageHref }: UrgentNewsBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || urgentNews.length === 0) return null;

  const first = urgentNews[0]!;
  const label = getUrgentBannerLabel(urgentNews.length);
  const categoryLabel = getUrgentCategoryLabel(first.category);

  return (
    <div
      data-testid="urgent-news-banner"
      role="alert"
      aria-live="assertive"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "var(--danger-red, #FF3355)",
        color: "#fff",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "0.85rem",
        fontFamily: "var(--font-body, sans-serif)",
        boxShadow: "0 2px 8px rgba(255,51,85,0.35)",
      }}
    >
      <AlertTriangle size={16} aria-hidden="true" />
      <span style={{ fontWeight: 600, flexShrink: 0 }}>{label}</span>
      <span style={{ opacity: 0.85, flexShrink: 0 }}>·</span>
      <span style={{ flexShrink: 0, opacity: 0.9 }}>{categoryLabel}</span>
      <span style={{ opacity: 0.7, flexShrink: 0 }}>·</span>
      <span
        style={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {first.summary}
      </span>
      <a
        href={newsPageHref}
        data-testid="urgent-news-banner-link"
        style={{
          color: "#fff",
          textDecoration: "underline",
          flexShrink: 0,
          fontWeight: 600,
          fontSize: "0.8rem",
        }}
      >
        Voir
      </a>
      <button
        onClick={() => setDismissed(true)}
        data-testid="urgent-news-banner-dismiss"
        aria-label="Fermer l'alerte"
        style={{
          background: "transparent",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          padding: 4,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
