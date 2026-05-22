"use client";

import { useState, useMemo } from "react";
import { Search, Heart } from "lucide-react";
import type { FestivalSummary, FestivalType } from "@/lib/types";
import { FestivalCard } from "@/components/festival/festival-card";
import { compareByTemporalRelevance } from "@/lib/festival-temporal";
import { matchesFollowFilter } from "@/lib/catalogue-filter";

type FilterType = "tous" | FestivalType;

const FILTER_CHIPS: { key: FilterType; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "musique", label: "Musique" },
  { key: "théâtre_rue", label: "Théâtre de rue" },
  { key: "cirque", label: "Cirque" },
  { key: "world", label: "World" },
  { key: "multidisciplinaire", label: "Multidisciplinaire" },
];

interface FestivalListProps {
  initialFestivals: FestivalSummary[];
}

export function FestivalList({ initialFestivals }: FestivalListProps) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("tous");
  const [followedOnly, setFollowedOnly] = useState(false);

  const hasFollowed = useMemo(
    () => initialFestivals.some((f) => f.isFollowed),
    [initialFestivals],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialFestivals
      .filter((f) => {
        const matchesQuery =
          !q ||
          f.name.toLowerCase().includes(q) ||
          f.city.toLowerCase().includes(q) ||
          f.country.toLowerCase().includes(q);
        const matchesType =
          activeFilter === "tous" || f.festivalType === activeFilter;
        return matchesQuery && matchesType && matchesFollowFilter(f, followedOnly);
      })
      .sort(compareByTemporalRelevance);
  }, [initialFestivals, query, activeFilter, followedOnly]);

  return (
    <div className="flex flex-col gap-0 py-4">
      {/* Search bar */}
      <div
        style={{
          position: "relative",
          marginBottom: "var(--space-md)",
        }}
      >
        <Search
          size={16}
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 12,
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
          placeholder="Chercher un festival..."
          aria-label="Rechercher un festival"
          style={{
            width: "100%",
            paddingLeft: 36,
            paddingRight: 12,
            paddingTop: 10,
            paddingBottom: 10,
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-main)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            outline: "none",
            transition: "var(--transition-fast)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--primary-neon)";
            e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,255,102,0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border-color)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Filter chips — horizontal scroll */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-sm)",
          overflowX: "auto",
          paddingBottom: 8,
          marginBottom: "var(--space-md)",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        className="hide-scrollbar"
      >
        {FILTER_CHIPS.map((chip) => {
          const isActive = chip.key === activeFilter;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => setActiveFilter(chip.key)}
              style={{
                flexShrink: 0,
                paddingLeft: 14,
                paddingRight: 14,
                paddingTop: 6,
                paddingBottom: 6,
                borderRadius: "var(--radius-full)",
                border: isActive
                  ? "1px solid var(--primary-neon)"
                  : "1px solid var(--border-color)",
                backgroundColor: isActive
                  ? "var(--primary-neon)"
                  : "transparent",
                color: isActive ? "var(--text-on-neon)" : "var(--text-muted)",
                fontFamily: "var(--font-body)",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                cursor: "pointer",
                transition: "var(--transition-fast)",
              }}
            >
              {chip.label}
            </button>
          );
        })}
        {hasFollowed && (
          <button
            type="button"
            onClick={() => setFollowedOnly((v) => !v)}
            aria-pressed={followedOnly}
            style={{
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              paddingLeft: 12,
              paddingRight: 12,
              paddingTop: 6,
              paddingBottom: 6,
              borderRadius: "var(--radius-full)",
              border: followedOnly
                ? "1px solid var(--accent-pink)"
                : "1px solid var(--border-color)",
              backgroundColor: followedOnly ? "rgba(255,0,122,0.1)" : "transparent",
              color: followedOnly ? "var(--accent-pink)" : "var(--text-muted)",
              fontFamily: "var(--font-body)",
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              cursor: "pointer",
              transition: "var(--transition-fast)",
            }}
          >
            <Heart size={11} aria-hidden="true" fill={followedOnly ? "currentColor" : "none"} />
            Suivis
          </button>
        )}
      </div>

      {/* Results count */}
      <p
        className="t-meta mb-3"
        style={{ color: "var(--text-dim)" }}
      >
        {filtered.length} festival{filtered.length !== 1 ? "s" : ""}
        {(query || activeFilter !== "tous" || followedOnly) ? " trouvé" + (filtered.length !== 1 ? "s" : "") : ""}
      </p>

      {/* Festival list */}
      {filtered.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filtered.map((festival) => (
            <FestivalCard key={festival.id} festival={festival} />
          ))}
        </div>
      ) : (
        <EmptyState hasFilters={!!(query || activeFilter !== "tous" || followedOnly)} />
      )}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center"
      role="status"
    >
      <span
        aria-hidden="true"
        style={{ fontSize: 48, lineHeight: 1, marginBottom: 16 }}
      >
        🎪
      </span>
      <p
        className="t-h3"
        style={{
          color: "var(--text-main)",
          marginBottom: 8,
          fontSize: "var(--fs-base)",
        }}
      >
        Aucun festival trouvé
      </p>
      <p
        className="t-caption"
        style={{ color: "var(--text-muted)", maxWidth: 240 }}
      >
        {hasFilters
          ? "Essaie de modifier ta recherche ou les filtres."
          : "Le catalogue est vide pour l'instant. Sois le premier à soumettre un festival !"}
      </p>
    </div>
  );
}
