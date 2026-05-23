"use client";

import { useState, useMemo, useTransition } from "react";
import { Search } from "lucide-react";
import { filterAdminArtists, filterOrphanArtists, sortAdminArtistsByEventCount, type AdminArtistRow } from "@/lib/admin-artists";

interface Props {
  artists: AdminArtistRow[];
  updateArtistCountry: (artistId: string, countryCode: string) => Promise<void>;
}

export function ArtistSearchTable({ artists, updateArtistCountry }: Props) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [sortMode, setSortMode] = useState<"name" | "events">("name");
  const [orphanOnly, setOrphanOnly] = useState(false);
  const [isPending, startTransition] = useTransition();

  const sorted = useMemo(
    () => (sortMode === "events" ? sortAdminArtistsByEventCount(artists) : artists),
    [artists, sortMode],
  );

  const filtered = useMemo(() => {
    const base = orphanOnly ? filterOrphanArtists(sorted) : sorted;
    return filterAdminArtists(base, query);
  }, [sorted, query, orphanOnly]);

  function startEdit(artist: AdminArtistRow) {
    setEditingId(artist.id);
    setEditValue(artist.countryCode ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue("");
  }

  function saveEdit(artistId: string) {
    startTransition(async () => {
      await updateArtistCountry(artistId, editValue);
      setEditingId(null);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      {/* Search + sort bar */}
      <div style={{ display: "flex", gap: "var(--space-md)", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
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
            data-testid="admin-artists-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom, discipline, pays…"
            aria-label="Rechercher un artiste"
            style={{
              width: "100%",
              paddingLeft: 30,
              paddingRight: 10,
              paddingTop: 8,
              paddingBottom: 8,
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
        <div data-testid="admin-artists-sort" style={{ display: "flex", gap: 4 }}>
          {(["name", "events"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              data-testid={`admin-artists-sort-${mode}`}
              onClick={() => setSortMode(mode)}
              aria-pressed={sortMode === mode}
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                border: sortMode === mode ? "1px solid var(--secondary-cyan)" : "1px solid var(--border-color)",
                background: sortMode === mode ? "rgba(0,229,255,0.1)" : "transparent",
                color: sortMode === mode ? "var(--secondary-cyan)" : "var(--text-dim)",
                fontSize: "0.68rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                cursor: "pointer",
              }}
            >
              {mode === "name" ? "A–Z" : "Événements"}
            </button>
          ))}
        </div>
        <button
          type="button"
          data-testid="admin-artists-orphan-filter"
          onClick={() => setOrphanOnly((v) => !v)}
          aria-pressed={orphanOnly}
          style={{
            padding: "4px 12px",
            borderRadius: 20,
            border: orphanOnly ? "1px solid var(--danger-red)" : "1px solid var(--border-color)",
            background: orphanOnly ? "rgba(255,51,85,0.1)" : "transparent",
            color: orphanOnly ? "var(--danger-red)" : "var(--text-dim)",
            fontSize: "0.68rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Sans événement
        </button>
        <span
          data-testid="admin-artists-filtered-count"
          style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--text-dim)", whiteSpace: "nowrap" }}
        >
          {filtered.length} / {artists.length}
        </span>
      </div>

      {/* Table */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        <table
          data-testid="admin-artists-table"
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
              {["Artiste", "Disciplines", "Pays", "Événements", "Actions"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "var(--space-sm) var(--space-md)",
                    textAlign: "left",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--fs-xs)",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontWeight: "var(--fw-bold)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((artist, i) => (
              <tr
                key={artist.id}
                data-testid={`admin-artist-row-${artist.id}`}
                style={{
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--border-color)" : "none",
                  opacity: isPending && editingId === artist.id ? 0.6 : 1,
                }}
              >
                {/* Name */}
                <td style={{ padding: "var(--space-sm) var(--space-md)", minWidth: 160 }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)", color: "var(--text-main)", margin: 0, fontWeight: "var(--fw-bold)" }}>
                    {artist.name}
                  </p>
                  {artist.instagram && (
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--text-dim)", margin: "2px 0 0" }}>
                      @{artist.instagram}
                    </p>
                  )}
                </td>

                {/* Disciplines */}
                <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                  {artist.disciplines.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {artist.disciplines.map((d) => (
                        <span
                          key={d}
                          style={{
                            padding: "2px 6px",
                            border: "1px solid var(--border-color)",
                            borderRadius: 20,
                            fontFamily: "var(--font-body)",
                            fontSize: "0.65rem",
                            color: "var(--secondary-cyan)",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-xs)", color: "var(--danger-red)" }}>
                      —
                    </span>
                  )}
                </td>

                {/* Country — inline edit */}
                <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                  {editingId === artist.id ? (
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <input
                        data-testid={`admin-artist-country-input-${artist.id}`}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value.toUpperCase().slice(0, 2))}
                        placeholder="FR"
                        maxLength={2}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(artist.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        style={{
                          width: 44,
                          padding: "3px 6px",
                          background: "var(--bg-darker)",
                          border: "1px solid var(--secondary-cyan)",
                          borderRadius: "var(--radius-sm)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "var(--fs-xs)",
                          color: "var(--text-main)",
                          outline: "none",
                          textAlign: "center",
                          textTransform: "uppercase",
                        }}
                      />
                      <button
                        type="button"
                        data-testid={`admin-artist-country-save-${artist.id}`}
                        onClick={() => saveEdit(artist.id)}
                        disabled={isPending}
                        style={{ padding: "2px 6px", background: "var(--primary-neon)", border: "none", borderRadius: "var(--radius-sm)", color: "#000", fontSize: "0.65rem", fontWeight: 700, cursor: "pointer" }}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        style={{ padding: "2px 6px", background: "transparent", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", color: "var(--text-dim)", fontSize: "0.65rem", cursor: "pointer" }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      data-testid={`admin-artist-country-${artist.id}`}
                      onClick={() => startEdit(artist)}
                      title="Cliquer pour modifier le pays"
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px 6px",
                        borderRadius: "var(--radius-sm)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--fs-xs)",
                        color: artist.countryCode ? "var(--text-main)" : "var(--danger-red)",
                        textDecoration: "underline dotted",
                      }}
                    >
                      {artist.countryCode ?? "—"}
                    </button>
                  )}
                </td>

                {/* Event count */}
                <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-sm)", color: "var(--accent-pink)" }}>
                    {artist.eventCount}
                  </span>
                </td>

                {/* Actions */}
                <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                  <a
                    href={`/artiste/${artist.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`admin-artist-view-${artist.id}`}
                    style={{
                      padding: "3px 10px",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-sm)",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-xs)",
                      color: "var(--text-muted)",
                      textDecoration: "none",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Voir ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div
            data-testid="admin-artists-empty"
            style={{ padding: "var(--space-2xl)", textAlign: "center", color: "var(--text-dim)", fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)" }}
          >
            Aucun artiste ne correspond à cette recherche.
          </div>
        )}
      </div>
    </div>
  );
}
