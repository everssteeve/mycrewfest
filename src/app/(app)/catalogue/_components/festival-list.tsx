"use client";

import { useState, useMemo } from "react";
import { Search, Heart } from "lucide-react";
import type { FestivalSummary, FestivalType } from "@/lib/types";
import { FestivalCard } from "@/components/festival/festival-card";
import { compareByTemporalRelevance } from "@/lib/festival-temporal";
import { matchesFollowFilter, matchesMonthFilter, matchesTemporalFilter, getAvailableMonths, countFollowedFestivals, countActiveFestivals, countUpcomingFestivals, countFestivalsWithCompleteProgram, MONTH_NAMES_FR } from "@/lib/catalogue-filter";
import { isEscapeKey } from "@/lib/keyboard-search";

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
  const [hidePast, setHidePast] = useState(true);
  const [activeMonth, setActiveMonth] = useState<number | null>(null);

  const hasFollowed = useMemo(
    () => initialFestivals.some((f) => f.isFollowed),
    [initialFestivals],
  );

  const followedCount = useMemo(
    () => countFollowedFestivals(initialFestivals),
    [initialFestivals],
  );

  const activeCount = useMemo(
    () => countActiveFestivals(initialFestivals),
    [initialFestivals],
  );

  const upcomingCount = useMemo(
    () => countUpcomingFestivals(initialFestivals),
    [initialFestivals],
  );

  const completeProgramCount = useMemo(
    () => countFestivalsWithCompleteProgram(initialFestivals),
    [initialFestivals],
  );

  const availableMonths = useMemo(
    () => getAvailableMonths(initialFestivals),
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
        return matchesQuery && matchesType && matchesFollowFilter(f, followedOnly) && matchesMonthFilter(f, activeMonth) && matchesTemporalFilter(f, hidePast);
      })
      .sort(compareByTemporalRelevance);
  }, [initialFestivals, query, activeFilter, followedOnly, activeMonth, hidePast]);

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
          onKeyDown={(e) => {
            if (isEscapeKey(e)) setQuery("");
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
        <button
          type="button"
          onClick={() => setHidePast((v) => !v)}
          aria-pressed={hidePast}
          data-testid="catalogue-hide-past"
          style={{
            flexShrink: 0,
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: 6,
            paddingBottom: 6,
            borderRadius: "var(--radius-full)",
            border: hidePast
              ? "1px solid var(--secondary-cyan)"
              : "1px solid var(--border-color)",
            backgroundColor: hidePast ? "rgba(0,229,255,0.1)" : "transparent",
            color: hidePast ? "var(--secondary-cyan)" : "var(--text-muted)",
            fontFamily: "var(--font-body)",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            cursor: "pointer",
            transition: "var(--transition-fast)",
          }}
        >
          {hidePast ? "Actifs seulement" : "Tous (passés inclus)"}
        </button>
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
            <span
              data-testid="catalogue-followed-count"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0,
                background: followedOnly ? "rgba(255,0,122,0.25)" : "var(--bg-card)",
                borderRadius: "var(--radius-full)",
                padding: "1px 5px",
                minWidth: 16,
                textAlign: "center",
              }}
            >
              {followedCount}
            </span>
          </button>
        )}
      </div>

      {/* Month filter chips — shown only when multiple months available */}
      {availableMonths.length > 1 && (
        <div
          data-testid="catalogue-month-filter"
          style={{
            display: "flex",
            gap: "var(--space-xs)",
            overflowX: "auto",
            paddingBottom: 8,
            marginBottom: "var(--space-md)",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          className="hide-scrollbar"
          role="group"
          aria-label="Filtrer par mois"
        >
          <button
            type="button"
            onClick={() => setActiveMonth(null)}
            aria-pressed={activeMonth === null}
            data-testid="catalogue-month-filter-all"
            style={{
              flexShrink: 0,
              padding: "4px 12px",
              borderRadius: "var(--radius-full)",
              border: activeMonth === null
                ? "1px solid var(--warning-orange)"
                : "1px solid var(--border-color)",
              backgroundColor: activeMonth === null ? "rgba(255,153,0,0.12)" : "transparent",
              color: activeMonth === null ? "var(--warning-orange)" : "var(--text-dim)",
              fontFamily: "var(--font-body)",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              transition: "var(--transition-fast)",
            }}
          >
            Tous mois
          </button>
          {availableMonths.map((month) => {
            const isActive = activeMonth === month;
            return (
              <button
                key={month}
                type="button"
                onClick={() => setActiveMonth(isActive ? null : month)}
                aria-pressed={isActive}
                data-testid={`catalogue-month-filter-${month}`}
                style={{
                  flexShrink: 0,
                  padding: "4px 12px",
                  borderRadius: "var(--radius-full)",
                  border: isActive
                    ? "1px solid var(--warning-orange)"
                    : "1px solid var(--border-color)",
                  backgroundColor: isActive ? "rgba(255,153,0,0.12)" : "transparent",
                  color: isActive ? "var(--warning-orange)" : "var(--text-dim)",
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "var(--transition-fast)",
                }}
              >
                {MONTH_NAMES_FR[month] ?? month}
              </button>
            );
          })}
        </div>
      )}

      {/* Stats strip */}
      <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap", marginBottom: "var(--space-md)", alignItems: "center" }}>
        <p
          className="t-meta"
          style={{ color: "var(--text-dim)", margin: 0 }}
        >
          {filtered.length} festival{filtered.length !== 1 ? "s" : ""}
          {(query || activeFilter !== "tous" || followedOnly || activeMonth !== null) ? " trouvé" + (filtered.length !== 1 ? "s" : "") : ""}
        </p>
        {activeCount > 0 && (
          <span
            data-testid="catalogue-active-count"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--primary-neon)",
              background: "rgba(0,255,102,0.08)",
              border: "1px solid rgba(0,255,102,0.25)",
              borderRadius: "var(--radius-full)",
              padding: "2px 8px",
            }}
          >
            ◉ {activeCount} en cours
          </span>
        )}
        {upcomingCount > 0 && (
          <span
            data-testid="catalogue-upcoming-count"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--warning-orange)",
              background: "rgba(255,153,0,0.08)",
              border: "1px solid rgba(255,153,0,0.25)",
              borderRadius: "var(--radius-full)",
              padding: "2px 8px",
            }}
          >
            ▷ {upcomingCount} dans 30j
          </span>
        )}
        {completeProgramCount > 0 && (
          <span
            data-testid="catalogue-complete-programme-count"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--secondary-cyan)",
              background: "rgba(0,229,255,0.08)",
              border: "1px solid rgba(0,229,255,0.25)",
              borderRadius: "var(--radius-full)",
              padding: "2px 8px",
            }}
            title={`${completeProgramCount} festival${completeProgramCount !== 1 ? "s" : ""} avec programme complet`}
          >
            ✓ {completeProgramCount} complet{completeProgramCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

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
