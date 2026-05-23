"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Newspaper, Pin, RefreshCw, Filter, Search, X } from "lucide-react";
import { matchesNewsQuery } from "@/lib/news-search";
import { computeNewsStats, getTopNewsSource, countPinnedNewsItems, countUniqueNewsCategories, countRecentNewsItems } from "@/lib/news-stats";
import { isEscapeKey } from "@/lib/keyboard-search";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NewsItemData {
  id: string;
  source: string;
  sourceUrl: string | null;
  publishedAt: string;
  category: string;
  summary: string;
  urgencyLevel: "normal" | "critique";
  isPinned: boolean;
}

interface NewsViewProps {
  festEventId: string;
  initialNews: NewsItemData[];
  initialUrgentCount: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  "line-up": "Line-up",
  "logistique": "Logistique",
  "programme-change": "Programme",
  "annulation": "Annulation",
  "urgence": "Urgence",
  "autre": "Autre",
};

const ALL_CATEGORIES = ["line-up", "logistique", "programme-change", "annulation", "urgence", "autre"];
const LOCAL_STORAGE_KEY_PREFIX = "mycrewfest-news-lastread-";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCategoryColor(category: string, urgencyLevel: string): string {
  if (urgencyLevel === "critique") return "var(--accent-red)";
  switch (category) {
    case "urgence": return "var(--accent-red)";
    case "annulation": return "var(--accent-red)";
    case "logistique": return "var(--accent-orange)";
    case "programme-change": return "var(--accent-pink)";
    case "line-up": return "var(--accent-pink)";
    default: return "var(--text-dim)";
  }
}

function getCategoryBg(category: string, urgencyLevel: string): string {
  if (urgencyLevel === "critique") return "rgba(255,51,85,0.10)";
  switch (category) {
    case "urgence":
    case "annulation": return "rgba(255,51,85,0.08)";
    case "logistique": return "rgba(255,153,0,0.08)";
    case "programme-change":
    case "line-up": return "rgba(255,0,122,0.08)";
    default: return "rgba(255,255,255,0.04)";
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("sv-SE"); // YYYY-MM-DD
}

function groupByDate(items: NewsItemData[]): Map<string, NewsItemData[]> {
  const map = new Map<string, NewsItemData[]>();
  for (const item of items) {
    const key = formatDateShort(item.publishedAt);
    const existing = map.get(key) ?? [];
    existing.push(item);
    map.set(key, existing);
  }
  return map;
}

function formatTimeShort(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

const SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X / Twitter",
  site_officiel: "Site officiel",
};

// ---------------------------------------------------------------------------
// News card
// ---------------------------------------------------------------------------

function NewsCard({ item }: { item: NewsItemData }) {
  const color = getCategoryColor(item.category, item.urgencyLevel);
  const bg = getCategoryBg(item.category, item.urgencyLevel);
  const label = CATEGORY_LABELS[item.category] ?? item.category;
  const isUrgent = item.urgencyLevel === "critique";

  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${isUrgent ? "var(--accent-red)" : "var(--border-color)"}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: "var(--radius-md)",
        padding: "var(--space-md)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-sm)",
        boxShadow: isUrgent ? "0 0 12px rgba(255,51,85,0.15)" : "none",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-sm)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)", flexWrap: "wrap" }}>
          {item.isPinned && (
            <Pin
              size={12}
              style={{ color: "var(--primary-neon)", transform: "rotate(45deg)", flexShrink: 0 }}
            />
          )}
          <span
            style={{
              background: `${color}20`,
              border: `1px solid ${color}60`,
              borderRadius: "var(--radius-full)",
              padding: "1px 8px",
              fontSize: "var(--fs-xs)",
              color,
              fontWeight: "var(--fw-bold)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
          {isUrgent && (
            <span
              style={{
                background: "rgba(255,51,85,0.15)",
                border: "1px solid var(--accent-red)",
                borderRadius: "var(--radius-full)",
                padding: "1px 8px",
                fontSize: "var(--fs-xs)",
                color: "var(--accent-red)",
                fontWeight: "var(--fw-bold)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              URGENT
            </span>
          )}
        </div>
        <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", whiteSpace: "nowrap", flexShrink: 0 }}>
          {formatTimeShort(item.publishedAt)}
        </span>
      </div>

      {/* Summary */}
      <p
        style={{
          color: "var(--text-main)",
          fontSize: "var(--fs-sm)",
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        {item.summary}
      </p>

      {/* Source */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>
          via {SOURCE_LABELS[item.source] ?? item.source}
        </span>
        {item.sourceUrl && (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "var(--fs-xs)",
              color: "var(--secondary-cyan)",
              textDecoration: "none",
            }}
          >
            Voir la source →
          </a>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function NewsView({ festEventId, initialNews, initialUrgentCount }: NewsViewProps) {
  const [news, setNews] = useState<NewsItemData[]>(initialNews);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [newUrgentCount, setNewUrgentCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const lastReadAtRef = useRef<Date | null>(null);

  const storageKey = `${LOCAL_STORAGE_KEY_PREFIX}${festEventId}`;

  // Track last read from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        lastReadAtRef.current = new Date(stored);
      }
      // Mark as read now
      localStorage.setItem(storageKey, new Date().toISOString());
    }
  }, [storageKey]);

  // Polling every 5 min
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const params = new URLSearchParams({ limit: "50" });
        if (selectedCategory) params.set("category", selectedCategory);
        const res = await fetch(`/api/festevents/${festEventId}/news?${params}`);
        if (res.ok) {
          const fresh = await res.json() as NewsItemData[];
          setNews(fresh);
          setLastRefreshed(new Date());

          // Count new urgent items since last read
          const lastReadAt = lastReadAtRef.current;
          if (lastReadAt) {
            const urgentNew = fresh.filter(
              (item) =>
                item.urgencyLevel === "critique" &&
                new Date(item.publishedAt) > lastReadAt,
            ).length;
            setNewUrgentCount(urgentNew);
          }
        }
      } catch {
        // silently ignore
      }
    }, 5 * 60_000); // 5 minutes

    return () => clearInterval(interval);
  }, [festEventId, selectedCategory]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (selectedCategory) params.set("category", selectedCategory);
      const res = await fetch(`/api/festevents/${festEventId}/news?${params}`);
      if (res.ok) {
        const fresh = await res.json() as NewsItemData[];
        setNews(fresh);
        setLastRefreshed(new Date());
        setNewUrgentCount(0);
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, new Date().toISOString());
        }
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [festEventId, selectedCategory, storageKey]);

  const handleFilterChange = useCallback(
    async (category: string | null) => {
      setSelectedCategory(category);
      setShowFilterMenu(false);
      setIsRefreshing(true);
      try {
        const params = new URLSearchParams({ limit: "50" });
        if (category) params.set("category", category);
        const res = await fetch(`/api/festevents/${festEventId}/news?${params}`);
        if (res.ok) {
          const fresh = await res.json() as NewsItemData[];
          setNews(fresh);
          setLastRefreshed(new Date());
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    [festEventId],
  );

  const filteredNews = useMemo(
    () => news.filter((item) => matchesNewsQuery(item, searchQuery)),
    [news, searchQuery],
  );

  const newsStats = useMemo(() => computeNewsStats(filteredNews), [filteredNews]);
  const topSource = useMemo(() => getTopNewsSource(filteredNews), [filteredNews]);
  const pinnedCount = useMemo(() => countPinnedNewsItems(filteredNews), [filteredNews]);
  const categoryCount = useMemo(() => countUniqueNewsCategories(filteredNews), [filteredNews]);
  const recentCount = useMemo(() => countRecentNewsItems(filteredNews, 24), [filteredNews]);

  // Separate pinned from the rest
  const pinnedItems = filteredNews.filter((item) => item.isPinned);
  const nonPinnedItems = filteredNews.filter((item) => !item.isPinned);
  const grouped = groupByDate(nonPinnedItems);
  const sortedDates = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a)); // most recent first

  return (
    <div style={{ paddingTop: "var(--space-lg)", display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      {/* Search bar */}
      {news.length > 3 && (
        <div style={{ position: "relative" }}>
          <Search
            size={14}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-dim)",
              pointerEvents: "none",
            }}
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans les actualités…"
            aria-label="Rechercher dans les actualités"
            data-testid="news-search-input"
            onKeyDown={(e) => {
              if (isEscapeKey(e)) setSearchQuery("");
            }}
            style={{
              width: "100%",
              paddingLeft: 32,
              paddingRight: searchQuery ? 32 : 12,
              paddingTop: 8,
              paddingBottom: 8,
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-main)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Effacer la recherche"
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--text-dim)",
                cursor: "pointer",
                padding: 2,
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {/* Urgent banner */}
      {newUrgentCount > 0 && (
        <div
          style={{
            background: "rgba(255,51,85,0.12)",
            border: "1px solid var(--accent-red)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-sm) var(--space-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ color: "var(--accent-red)", fontWeight: "var(--fw-bold)", fontSize: "var(--fs-sm)" }}>
            {newUrgentCount} nouvelle{newUrgentCount !== 1 ? "s" : ""} urgence{newUrgentCount !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={() => void handleRefresh()}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent-red)",
              fontSize: "var(--fs-xs)",
              cursor: "pointer",
              fontWeight: "var(--fw-bold)",
            }}
          >
            Voir
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-sm)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
          <Newspaper size={16} style={{ color: "var(--accent-pink)" }} />
          <span style={{ color: "var(--text-main)", fontWeight: "var(--fw-bold)", fontSize: "var(--fs-sm)" }}>
            Actualités
          </span>
          {newsStats.total > 0 && (
            <span
              data-testid="news-stats-total"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
              }}
            >
              {newsStats.total}
            </span>
          )}
          {newsStats.critiques > 0 && (
            <span
              data-testid="news-stats-critiques"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--accent-red)",
                fontWeight: "var(--fw-bold)",
              }}
            >
              · {newsStats.critiques} critique{newsStats.critiques > 1 ? "s" : ""}
            </span>
          )}
          {topSource && newsStats.total > 1 && (
            <span
              data-testid="news-stats-top-source"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--secondary-cyan)",
              }}
            >
              · {topSource}
            </span>
          )}
          {pinnedCount > 0 && pinnedCount < newsStats.total && (
            <span
              data-testid="news-stats-pinned"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--warning-orange)",
              }}
              title="Actualités épinglées par l'organisateur"
            >
              · 📌 {pinnedCount}
            </span>
          )}
          {categoryCount > 1 && !selectedCategory && (
            <span
              data-testid="news-stats-categories"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
              }}
              title="Nombre de catégories d'actualités"
            >
              · {categoryCount} catégories
            </span>
          )}
          {recentCount > 0 && recentCount < newsStats.total && (
            <span
              data-testid="news-stats-recent"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--primary-neon)",
                fontWeight: "var(--fw-bold)",
              }}
              title="Actualités publiées dans les dernières 24h"
            >
              · {recentCount} récent{recentCount > 1 ? "s" : ""}
            </span>
          )}
          {selectedCategory && (
            <span
              style={{
                fontSize: "var(--fs-xs)",
                color: "var(--secondary-cyan)",
                background: "rgba(0,229,255,0.08)",
                border: "1px solid rgba(0,229,255,0.3)",
                borderRadius: "var(--radius-full)",
                padding: "1px 8px",
              }}
            >
              {CATEGORY_LABELS[selectedCategory]}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "var(--space-xs)" }}>
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-full)",
              padding: "3px 8px",
              color: "var(--text-dim)",
              fontSize: "var(--fs-xs)",
              cursor: "pointer",
            }}
          >
            <RefreshCw
              size={12}
              style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }}
            />
            Actualiser
          </button>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setShowFilterMenu((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: selectedCategory ? "rgba(255,0,122,0.08)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${selectedCategory ? "var(--accent-pink)" : "var(--border-color)"}`,
                borderRadius: "var(--radius-full)",
                padding: "3px 8px",
                color: selectedCategory ? "var(--accent-pink)" : "var(--text-dim)",
                fontSize: "var(--fs-xs)",
                cursor: "pointer",
              }}
            >
              <Filter size={12} />
              Filtrer
            </button>

            {showFilterMenu && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 4px)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-xs)",
                  zIndex: 50,
                  minWidth: 150,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                }}
              >
                <button
                  type="button"
                  onClick={() => void handleFilterChange(null)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "var(--space-xs) var(--space-sm)",
                    background: selectedCategory === null ? "rgba(0,255,102,0.08)" : "none",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    color: selectedCategory === null ? "var(--primary-neon)" : "var(--text-main)",
                    fontSize: "var(--fs-xs)",
                    textAlign: "left",
                    cursor: "pointer",
                    fontWeight: selectedCategory === null ? "var(--fw-bold)" : "normal",
                  }}
                >
                  Toutes les catégories
                </button>
                {ALL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => void handleFilterChange(cat)}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "var(--space-xs) var(--space-sm)",
                      background: selectedCategory === cat ? "rgba(0,255,102,0.08)" : "none",
                      border: "none",
                      borderRadius: "var(--radius-sm)",
                      color: selectedCategory === cat ? "var(--primary-neon)" : "var(--text-main)",
                      fontSize: "var(--fs-xs)",
                      textAlign: "left",
                      cursor: "pointer",
                      fontWeight: selectedCategory === cat ? "var(--fw-bold)" : "normal",
                    }}
                  >
                    {CATEGORY_LABELS[cat] ?? cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pinned items */}
      {pinnedItems.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
          <p style={{ fontSize: "var(--fs-xs)", color: "var(--primary-neon)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: "var(--fw-bold)", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
            <Pin size={11} style={{ transform: "rotate(45deg)" }} />
            Épinglé
          </p>
          {pinnedItems.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* News grouped by date */}
      {sortedDates.length === 0 && pinnedItems.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "var(--space-xl) var(--space-md)",
            color: "var(--text-dim)",
            fontSize: "var(--fs-sm)",
          }}
        >
          <Newspaper size={40} style={{ opacity: 0.3, margin: "0 auto var(--space-sm)" }} />
          <p>Aucune actualité{selectedCategory ? " pour cette catégorie" : ""} pour le moment.</p>
        </div>
      ) : (
        sortedDates.map((dateKey) => {
          const items = grouped.get(dateKey) ?? [];
          return (
            <div key={dateKey} style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
              <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", textTransform: "capitalize", fontWeight: "var(--fw-bold)", margin: 0 }}>
                {formatDate(items[0].publishedAt)}
              </p>
              {items.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          );
        })
      )}

      {/* Last refresh time */}
      <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)", textAlign: "center", margin: "var(--space-xs) 0 0" }}>
        Mise à jour à {lastRefreshed.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · Auto-actualisation toutes les 5 min
      </p>
    </div>
  );
}
