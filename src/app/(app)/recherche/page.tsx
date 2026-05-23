"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Search, X, Music2, CalendarDays, Clock } from "lucide-react";
import type { GlobalSearchResponse } from "@/lib/global-search";
import {
  loadSearchHistory,
  addToSearchHistory,
  removeFromSearchHistory,
  saveSearchHistory,
  clearSearchHistory,
} from "@/lib/search-history";
import {
  loadRecentlyViewed,
  type RecentlyViewedEntry,
} from "@/lib/recently-viewed";
import {
  applySearchTypeFilter,
  countSearchResults,
  buildTabLabel,
  isTabDisabled,
  type SearchTypeFilter,
} from "@/lib/search-filter";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const FESTIVAL_TYPE_LABELS: Record<string, string> = {
  musique: "Musique",
  théâtre_rue: "Théâtre de rue",
  cirque: "Cirque",
  world: "World",
  multidisciplinaire: "Multi",
};

export default function RecherchePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedEntry[]>([]);
  const [typeFilter, setTypeFilter] = useState<SearchTypeFilter>("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    inputRef.current?.focus();
    setHistory(loadSearchHistory());
    setRecentlyViewed(loadRecentlyViewed());
  }, []);

  const commitSearch = useCallback((q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    setHistory((prev) => {
      const next = addToSearchHistory(trimmed, prev);
      saveSearchHistory(next);
      return next;
    });
  }, []);

  const handleRemoveHistory = useCallback((q: string) => {
    setHistory((prev) => {
      const next = removeFromSearchHistory(q, prev);
      saveSearchHistory(next);
      return next;
    });
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory(clearSearchHistory());
  }, []);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults(null);
      setLoading(false);
      setTypeFilter("all");
      return;
    }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data: GlobalSearchResponse) => {
        setResults(data);
        setLoading(false);
        if (data.total > 0) commitSearch(debouncedQuery);
      })
      .catch(() => setLoading(false));
  }, [debouncedQuery, commitSearch]);

  const isEmpty =
    results && results.total === 0 && debouncedQuery.length >= 2 && !loading;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
        paddingTop: "var(--space-sm)",
      }}
    >
      {/* Search input */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-md)",
          padding: "10px 14px",
        }}
      >
        <Search size={18} color="var(--text-dim)" aria-hidden="true" />
        <input
          ref={inputRef}
          data-testid="search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un festival, un artiste…"
          aria-label="Recherche globale"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text-main)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-base)",
          }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Effacer la recherche"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-dim)",
              display: "flex",
              padding: 2,
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <p
          className="t-caption"
          style={{ color: "var(--text-dim)", textAlign: "center" }}
          aria-live="polite"
        >
          Recherche…
        </p>
      )}

      {/* Empty state */}
      {isEmpty && (
        <p
          data-testid="search-empty"
          className="t-caption"
          style={{ color: "var(--text-dim)", textAlign: "center", marginTop: "var(--space-lg)" }}
        >
          Aucun résultat pour «&nbsp;{debouncedQuery}&nbsp;»
        </p>
      )}

      {/* Type filter tabs */}
      {results && results.total > 0 && (() => {
        const counts = countSearchResults(results);
        const tabs: SearchTypeFilter[] = ["all", "festivals", "artists"];
        return (
          <div
            data-testid="search-type-filter"
            style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}
            role="tablist"
            aria-label="Filtrer les résultats"
          >
            {tabs.map((tab) => {
              const active = typeFilter === tab;
              const disabled = isTabDisabled(tab, counts);
              return (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={active}
                  data-testid={`search-type-tab-${tab}`}
                  onClick={() => !disabled && setTypeFilter(tab)}
                  disabled={disabled}
                  style={{
                    flexShrink: 0,
                    padding: "5px 12px",
                    borderRadius: 20,
                    border: active
                      ? "1px solid var(--primary-neon)"
                      : "1px solid var(--border-strong)",
                    background: active ? "rgba(0,255,102,0.1)" : "transparent",
                    color: active
                      ? "var(--primary-neon)"
                      : disabled
                      ? "var(--text-dim)"
                      : "var(--text-muted)",
                    fontSize: "var(--fs-xs, 11px)",
                    fontWeight: active ? 700 : 500,
                    fontFamily: "var(--font-body)",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.5 : 1,
                    transition: "var(--transition-fast)",
                  }}
                >
                  {buildTabLabel(tab, counts)}
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* Results */}
      {results && results.total > 0 && (() => {
        const filtered = applySearchTypeFilter(results, typeFilter);
        return (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>

          {/* Festivals section */}
          {filtered.festivals.length > 0 && (
            <section data-testid="search-festivals-section">
              <h2
                className="t-caption"
                style={{
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "var(--fs-xs, 11px)",
                  fontWeight: 700,
                  marginBottom: "var(--space-xs)",
                }}
              >
                Festivals
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {filtered.festivals.map((f) => (
                  <Link
                    key={f.id}
                    href={`/festival/${f.slug}`}
                    data-testid={`search-result-festival-${f.slug}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                      padding: "10px 14px",
                      textDecoration: "none",
                      transition: "var(--transition-fast)",
                    }}
                  >
                    <CalendarDays size={16} color="var(--accent-pink)" aria-hidden="true" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        className="t-body"
                        style={{
                          color: "var(--text-main)",
                          fontWeight: 600,
                          fontSize: "var(--fs-sm)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {f.name}
                      </p>
                      <p
                        className="t-caption"
                        style={{ color: "var(--text-dim)", fontSize: "var(--fs-xs, 11px)" }}
                      >
                        {f.city} · {format(new Date(f.startDate), "d MMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    {FESTIVAL_TYPE_LABELS[f.festivalType] && (
                      <span
                        className="t-meta"
                        style={{
                          color: "var(--secondary-cyan)",
                          fontSize: "var(--fs-xs, 10px)",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          flexShrink: 0,
                        }}
                      >
                        {FESTIVAL_TYPE_LABELS[f.festivalType]}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Artists section */}
          {filtered.artists.length > 0 && (
            <section data-testid="search-artists-section">
              <h2
                className="t-caption"
                style={{
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "var(--fs-xs, 11px)",
                  fontWeight: 700,
                  marginBottom: "var(--space-xs)",
                }}
              >
                Artistes
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {filtered.artists.map((a) => (
                  <Link
                    key={a.id}
                    href={`/artiste/${a.id}`}
                    data-testid={`search-result-artist-${a.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                      padding: "10px 14px",
                      textDecoration: "none",
                      transition: "var(--transition-fast)",
                    }}
                  >
                    <Music2 size={16} color="var(--secondary-cyan)" aria-hidden="true" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        className="t-body"
                        style={{
                          color: "var(--text-main)",
                          fontWeight: 600,
                          fontSize: "var(--fs-sm)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {a.name}
                      </p>
                      {a.disciplines.length > 0 && (
                        <p
                          className="t-caption"
                          style={{ color: "var(--text-dim)", fontSize: "var(--fs-xs, 11px)" }}
                        >
                          {a.disciplines.slice(0, 2).join(", ")}
                          {a.festivalCount > 0 && ` · ${a.festivalCount} fest.`}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
        );
      })()}

      {/* Search history */}
      {!results && !loading && history.length > 0 && (
        <section data-testid="search-history-section">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "var(--space-xs)",
            }}
          >
            <h2
              className="t-caption"
              style={{
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "var(--fs-xs, 11px)",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Clock size={11} aria-hidden="true" />
              Récentes
            </h2>
            <button
              onClick={handleClearHistory}
              data-testid="search-history-clear"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-dim)",
                fontSize: "var(--fs-xs, 10px)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontFamily: "var(--font-body)",
              }}
            >
              Effacer
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {history.map((q) => (
              <div
                key={q}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "8px 12px",
                }}
              >
                <button
                  data-testid={`search-history-item`}
                  onClick={() => setQuery(q)}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--fs-sm)",
                    padding: 0,
                  }}
                >
                  {q}
                </button>
                <button
                  onClick={() => handleRemoveHistory(q)}
                  aria-label={`Supprimer "${q}" de l'historique`}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-dim)",
                    display: "flex",
                    padding: 2,
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recently viewed festivals */}
      {!results && !loading && recentlyViewed.length > 0 && (
        <section data-testid="recently-viewed-section">
          <h2
            className="t-caption"
            style={{
              color: "var(--text-dim)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontSize: "var(--fs-xs, 11px)",
              fontWeight: 700,
              marginBottom: "var(--space-xs)",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <CalendarDays size={11} aria-hidden="true" />
            Consultés récemment
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {recentlyViewed.map((entry) => (
              <Link
                key={entry.slug}
                href={`/festival/${entry.slug}`}
                data-testid={`recently-viewed-item-${entry.slug}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px 14px",
                  textDecoration: "none",
                  transition: "var(--transition-fast)",
                }}
              >
                <CalendarDays size={16} color="var(--accent-pink)" aria-hidden="true" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    className="t-body"
                    style={{
                      color: "var(--text-main)",
                      fontWeight: 600,
                      fontSize: "var(--fs-sm)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entry.name}
                  </p>
                  <p
                    className="t-caption"
                    style={{ color: "var(--text-dim)", fontSize: "var(--fs-xs, 11px)" }}
                  >
                    {entry.city}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Hint when idle and no history */}
      {!results && !loading && history.length === 0 && (
        <p
          className="t-caption"
          style={{
            color: "var(--text-dim)",
            textAlign: "center",
            marginTop: "var(--space-xl)",
          }}
        >
          Commence à taper pour chercher…
        </p>
      )}
    </div>
  );
}
