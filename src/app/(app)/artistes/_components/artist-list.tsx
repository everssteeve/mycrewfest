"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  filterArtists,
  getAvailableDisciplines,
  sortArtists,
  type ArtistListItem,
  type ArtistSortMode,
} from "@/lib/artist-filter";

interface Props {
  initialArtists: ArtistListItem[];
}

export function ArtistList({ initialArtists }: Props) {
  const [query, setQuery] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [sortMode, setSortMode] = useState<ArtistSortMode>("name");

  const sorted = useMemo(() => sortArtists(initialArtists, sortMode), [initialArtists, sortMode]);
  const disciplines = useMemo(() => getAvailableDisciplines(initialArtists), [initialArtists]);

  const filtered = useMemo(
    () => filterArtists(sorted, query, discipline),
    [sorted, query, discipline],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      {/* Search bar */}
      <div style={{ position: "relative" }}>
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
          data-testid="artistes-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Chercher un artiste, une discipline…"
          aria-label="Rechercher un artiste"
          style={{
            width: "100%",
            paddingLeft: 36,
            paddingRight: 12,
            paddingTop: 10,
            paddingBottom: 10,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            color: "var(--text-main)",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Discipline filter chips */}
      {disciplines.length > 0 && (
        <div
          data-testid="artistes-discipline-filters"
          style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
        >
          <button
            onClick={() => setDiscipline("")}
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              border: `1px solid ${discipline === "" ? "var(--secondary-cyan)" : "var(--border-color)"}`,
              background: discipline === "" ? "rgba(0,229,255,0.1)" : "transparent",
              color: discipline === "" ? "var(--secondary-cyan)" : "var(--text-muted)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              fontWeight: "var(--fw-bold)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              cursor: "pointer",
            }}
          >
            Tous
          </button>
          {disciplines.map((d) => (
            <button
              key={d}
              onClick={() => setDiscipline(d === discipline ? "" : d)}
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                border: `1px solid ${discipline === d ? "var(--secondary-cyan)" : "var(--border-color)"}`,
                background: discipline === d ? "rgba(0,229,255,0.1)" : "transparent",
                color: discipline === d ? "var(--secondary-cyan)" : "var(--text-muted)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                fontWeight: "var(--fw-bold)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                cursor: "pointer",
              }}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {/* Sort toggle + count */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <p
          data-testid="artistes-count"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-xs)",
            color: "var(--text-dim)",
            margin: 0,
          }}
        >
          {filtered.length} artiste{filtered.length !== 1 ? "s" : ""}
        </p>
        <div
          data-testid="artistes-sort"
          style={{ display: "flex", gap: 4 }}
        >
          {(["name", "festivals"] as ArtistSortMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              data-testid={`artistes-sort-${mode}`}
              onClick={() => setSortMode(mode)}
              aria-pressed={sortMode === mode}
              style={{
                padding: "3px 10px",
                borderRadius: 20,
                border: sortMode === mode
                  ? "1px solid var(--secondary-cyan, #00E5FF)"
                  : "1px solid var(--border-color)",
                background: sortMode === mode ? "rgba(0,229,255,0.1)" : "transparent",
                color: sortMode === mode ? "var(--secondary-cyan, #00E5FF)" : "var(--text-dim)",
                fontSize: "0.68rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                cursor: "pointer",
              }}
            >
              {mode === "name" ? "A–Z" : "Festivals"}
            </button>
          ))}
        </div>
      </div>

      {/* Artist cards */}
      {filtered.length > 0 ? (
        <div
          data-testid="artistes-list"
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
          {filtered.map((artist) => (
            <Link
              key={artist.id}
              href={`/artiste/${artist.id}`}
              data-testid={`artiste-card-${artist.id}`}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px var(--space-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--fs-sm)",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      color: "var(--text-main)",
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {artist.name}
                  </p>
                  {artist.disciplines.length > 0 && (
                    <p
                      style={{
                        margin: "3px 0 0",
                        fontSize: "var(--fs-xs)",
                        color: "var(--secondary-cyan)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {artist.disciplines.join(", ")}
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {artist.countryCode && (
                    <span
                      style={{
                        fontSize: "var(--fs-xs)",
                        color: "var(--text-dim)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {artist.countryCode}
                    </span>
                  )}
                  {artist.festivalCount > 0 && (
                    <span
                      style={{
                        fontSize: "var(--fs-xs)",
                        color: "var(--accent-pink)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {artist.festivalCount}×
                    </span>
                  )}
                  <span style={{ color: "var(--accent-pink)", fontSize: "0.75rem" }}>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p
          data-testid="artistes-empty"
          style={{
            color: "var(--text-dim)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            textAlign: "center",
            padding: "var(--space-xl) 0",
          }}
        >
          Aucun artiste ne correspond à votre recherche.
        </p>
      )}
    </div>
  );
}
