"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { ArtistSummary } from "@/types/index";
import { filterLineup } from "@/lib/festival-lineup-search";

interface FestivalLineupProps {
  artists: ArtistSummary[];
  isDeambulatoire?: boolean;
}

export function FestivalLineup({ artists, isDeambulatoire }: FestivalLineupProps) {
  const [query, setQuery] = useState("");
  const filtered = filterLineup(artists, query);

  return (
    <div>
      {artists.length >= 6 && (
        <div style={{ position: "relative", marginBottom: "var(--space-sm)" }}>
          <Search
            size={14}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-dim, #666)",
              pointerEvents: "none",
            }}
          />
          <input
            data-testid="festival-lineup-search"
            type="search"
            placeholder={isDeambulatoire ? "Rechercher une compagnie…" : "Rechercher un artiste…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              paddingLeft: 32,
              paddingRight: 12,
              paddingTop: 8,
              paddingBottom: 8,
              background: "var(--bg-surface, #141519)",
              border: "1px solid var(--border-color, #1E1F26)",
              borderRadius: "var(--radius-md, 12px)",
              color: "var(--text-primary, #F0F0F0)",
              fontSize: "0.85rem",
              outline: "none",
            }}
          />
        </div>
      )}

      <p
        data-testid="festival-lineup-count"
        style={{ fontSize: "0.72rem", color: "var(--text-dim, #666)", margin: "0 0 8px", fontFamily: "var(--font-mono, monospace)" }}
      >
        {filtered.length} / {artists.length} {isDeambulatoire ? "compagnie" : "artiste"}{artists.length > 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <p
          data-testid="festival-lineup-empty"
          style={{ color: "var(--text-dim, #666)", fontSize: "0.85rem", padding: "16px 0" }}
        >
          Aucun {isDeambulatoire ? "compagnie" : "artiste"} trouvé pour «&nbsp;{query}&nbsp;».
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((artist) => (
            <Link
              key={artist.id}
              href={`/artiste/${artist.id}`}
              data-testid={`festival-artist-${artist.id}`}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  padding: "12px var(--space-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div className="flex flex-col gap-0.5">
                  <span
                    className="t-body"
                    style={{
                      color: "var(--text-main)",
                      fontWeight: "var(--fw-medium)",
                      fontSize: "var(--fs-sm)",
                    }}
                  >
                    {artist.name}
                  </span>
                  {artist.disciplines && artist.disciplines.length > 0 && (
                    <span className="t-caption" style={{ color: "var(--text-muted)" }}>
                      {artist.disciplines.join(", ")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {artist.countryCode && (
                    <span
                      className="t-meta"
                      style={{ color: "var(--text-dim)", flexShrink: 0 }}
                    >
                      {artist.countryCode}
                    </span>
                  )}
                  <span style={{ color: "var(--accent-pink)", fontSize: "0.75rem" }}>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
