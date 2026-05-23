"use client";

import { useState } from "react";
import Link from "next/link";
import {
  sortFeedItems,
  groupFeedByDay,
  getFeedCategoryLabel,
  filterFeedByFestival,
  filterFeedByCategory,
  getFollowedFestivalsFromFeed,
  getAvailableCategoriesFromFeed,
  type FeedItem,
} from "@/lib/news-feed";

interface FeedViewProps {
  items: FeedItem[];
}

export function FeedView({ items }: FeedViewProps) {
  const [activeFestival, setActiveFestival] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const festivals = getFollowedFestivalsFromFeed(items);
  const byFestival = filterFeedByFestival(items, activeFestival);
  const categories = getAvailableCategoriesFromFeed(byFestival);
  const filtered = filterFeedByCategory(byFestival, activeCategory);
  const days = groupFeedByDay(sortFeedItems(filtered));

  return (
    <div>
      {/* Festival filter chips */}
      {festivals.length > 1 && (
        <div
          data-testid="feed-festival-filter"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 20,
          }}
        >
          <button
            type="button"
            data-testid="feed-filter-all"
            onClick={() => setActiveFestival(null)}
            aria-pressed={activeFestival === null}
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              border: activeFestival === null
                ? "1px solid var(--accent-pink, #FF007A)"
                : "1px solid var(--border-subtle, #1E1F26)",
              background: activeFestival === null ? "rgba(255,0,122,0.1)" : "transparent",
              color: activeFestival === null ? "var(--accent-pink, #FF007A)" : "var(--text-dim, #666)",
              fontSize: "0.72rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              cursor: "pointer",
            }}
          >
            Tous
          </button>
          {festivals.map((f) => (
            <button
              key={f.id}
              type="button"
              data-testid={`feed-filter-${f.id}`}
              onClick={() => setActiveFestival(activeFestival === f.id ? null : f.id)}
              aria-pressed={activeFestival === f.id}
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                border: activeFestival === f.id
                  ? "1px solid var(--accent-pink, #FF007A)"
                  : "1px solid var(--border-subtle, #1E1F26)",
                background: activeFestival === f.id ? "rgba(255,0,122,0.1)" : "transparent",
                color: activeFestival === f.id ? "var(--accent-pink, #FF007A)" : "var(--text-dim, #666)",
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                cursor: "pointer",
              }}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      {/* Category filter chips */}
      {categories.length > 1 && (
        <div
          data-testid="feed-category-filter"
          style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}
        >
          <button
            type="button"
            data-testid="feed-category-all"
            onClick={() => setActiveCategory(null)}
            aria-pressed={activeCategory === null}
            style={{
              padding: "3px 10px",
              borderRadius: 20,
              border: activeCategory === null
                ? "1px solid var(--secondary-cyan, #00E5FF)"
                : "1px solid var(--border-subtle, #1E1F26)",
              background: activeCategory === null ? "rgba(0,229,255,0.08)" : "transparent",
              color: activeCategory === null ? "var(--secondary-cyan, #00E5FF)" : "var(--text-dim, #666)",
              fontSize: "0.68rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              cursor: "pointer",
            }}
          >
            Tout
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              data-testid={`feed-category-${cat}`}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              aria-pressed={activeCategory === cat}
              style={{
                padding: "3px 10px",
                borderRadius: 20,
                border: activeCategory === cat
                  ? "1px solid var(--secondary-cyan, #00E5FF)"
                  : "1px solid var(--border-subtle, #1E1F26)",
                background: activeCategory === cat ? "rgba(0,229,255,0.08)" : "transparent",
                color: activeCategory === cat ? "var(--secondary-cyan, #00E5FF)" : "var(--text-dim, #666)",
                fontSize: "0.68rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                cursor: "pointer",
              }}
            >
              {getFeedCategoryLabel(cat)}
            </button>
          ))}
        </div>
      )}

      {/* Item count */}
      {filtered.length > 0 && (
        <p
          data-testid="feed-filtered-count"
          style={{ fontSize: "0.72rem", color: "var(--text-dim, #666)", margin: "0 0 16px", fontFamily: "var(--font-mono, monospace)" }}
        >
          {filtered.length} actualité{filtered.length > 1 ? "s" : ""}
          {activeFestival ? ` · ${festivals.find((f) => f.id === activeFestival)?.name}` : ""}
          {activeCategory ? ` · ${getFeedCategoryLabel(activeCategory)}` : ""}
        </p>
      )}

      {/* Empty filtered state */}
      {filtered.length === 0 && items.length > 0 && (
        <p
          data-testid="feed-filter-empty"
          style={{ color: "var(--text-dim, #666)", fontSize: "0.85rem" }}
        >
          Aucune actualité pour ce festival.
        </p>
      )}

      {/* Feed grouped by day */}
      <div data-testid="feed-list" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {days.map((day) => (
          <section key={day.dateKey} data-testid={`feed-day-${day.dateKey}`}>
            <p
              style={{
                fontSize: "0.7rem",
                fontFamily: "var(--font-mono, monospace)",
                color: "var(--secondary-cyan, #00E5FF)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                margin: "0 0 8px",
              }}
            >
              {day.label}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {day.items.map((item) => (
                <div
                  key={item.id}
                  data-testid={`feed-item-${item.id}`}
                  style={{
                    background: "var(--bg-card, #141519)",
                    border: item.urgencyLevel === "critique"
                      ? "1px solid rgba(255,51,85,0.4)"
                      : "1px solid var(--border-subtle, #1E1F26)",
                    borderLeft: item.urgencyLevel === "critique"
                      ? "3px solid var(--danger-red, #FF3355)"
                      : item.isPinned
                        ? "3px solid var(--warning-orange, #FF9900)"
                        : "3px solid transparent",
                    borderRadius: 10,
                    padding: "10px 14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                    <Link
                      href={`/festival/${item.festivalSlug}`}
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--accent-pink, #FF007A)",
                        textDecoration: "none",
                      }}
                    >
                      {item.festivalName}
                    </Link>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        color: item.urgencyLevel === "critique"
                          ? "var(--danger-red, #FF3355)"
                          : "var(--text-dim, #666)",
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {getFeedCategoryLabel(item.category)}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.85rem",
                      lineHeight: 1.4,
                      color: "var(--text-primary, #F0F0F0)",
                    }}
                  >
                    {item.sourceUrl ? (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "inherit", textDecoration: "underline", textDecorationColor: "var(--text-dim)" }}
                      >
                        {item.summary}
                      </a>
                    ) : (
                      item.summary
                    )}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
