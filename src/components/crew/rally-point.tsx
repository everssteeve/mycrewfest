"use client";

import { useState } from "react";

interface RallyPointProps {
  crewId: string;
  lat?: number | null;
  lng?: number | null;
  description?: string | null;
  isAdmin?: boolean;
  onUpdated?: (point: { lat: number; lng: number; description?: string }) => void;
}

export function RallyPoint({
  crewId,
  lat,
  lng,
  description,
  isAdmin = false,
  onUpdated,
}: RallyPointProps) {
  const [editing, setEditing] = useState(false);
  const [editLat, setEditLat] = useState(String(lat ?? ""));
  const [editLng, setEditLng] = useState(String(lng ?? ""));
  const [editDesc, setEditDesc] = useState(description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasRally = lat != null && lng != null;

  async function handleSave() {
    const parsedLat = Number.parseFloat(editLat);
    const parsedLng = Number.parseFloat(editLng);

    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
      setError("Coordonnées invalides.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/crews/${crewId}/rally`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: parsedLat,
          lng: parsedLng,
          description: editDesc || undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Erreur serveur");
      }

      const data = (await res.json()) as {
        lat: number;
        lng: number;
        description?: string;
      };

      onUpdated?.({ lat: data.lat, lng: data.lng, description: data.description });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  if (editing && isAdmin) {
    return (
      <div
        style={{
          backgroundColor: "var(--bg-surface-elevated)",
          border: "1px solid var(--primary-neon)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-md)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-sm)",
          boxShadow: "var(--glow-neon)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-xs)",
            color: "var(--primary-neon)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-wider)",
          }}
        >
          Point de ralliement
        </span>

        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            value={editLat}
            onChange={(e) => setEditLat(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-main)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-xs)",
              padding: "var(--space-sm)",
            }}
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            value={editLng}
            onChange={(e) => setEditLng(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-main)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-xs)",
              padding: "var(--space-sm)",
            }}
          />
        </div>

        <input
          type="text"
          placeholder="Description (ex: Entrée principale, côté bar)"
          value={editDesc}
          onChange={(e) => setEditDesc(e.target.value)}
          maxLength={120}
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-main)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            padding: "var(--space-sm)",
          }}
        />

        {error && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              color: "var(--danger-red)",
            }}
          >
            {error}
          </p>
        )}

        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="btn btn-ghost btn-sm"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        border: `1px solid ${hasRally ? "var(--primary-neon)" : "var(--border-color)"}`,
        borderRadius: "var(--radius-md)",
        padding: "var(--space-md)",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-md)",
        boxShadow: hasRally ? "var(--glow-neon)" : "var(--shadow-sm)",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "var(--radius-full)",
          backgroundColor: hasRally ? "var(--neon-soft)" : "var(--bg-surface-elevated)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: 20,
        }}
        aria-hidden="true"
      >
        {hasRally ? "📍" : "🗺️"}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-xs)",
            color: hasRally ? "var(--primary-neon)" : "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-wider)",
            marginBottom: "var(--space-xs)",
          }}
        >
          Point de ralliement
        </p>
        {hasRally ? (
          <>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-sm)",
                color: "var(--text-main)",
                marginBottom: description ? "var(--space-xs)" : 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {description || "Aucune description"}
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-dim)",
              }}
            >
              {lat?.toFixed(5)}, {lng?.toFixed(5)}
            </p>
          </>
        ) : (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
              color: "var(--text-muted)",
            }}
          >
            Aucun point défini
          </p>
        )}
      </div>

      {/* Admin edit button */}
      {isAdmin && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="btn btn-ghost btn-sm"
          aria-label="Modifier le point de ralliement"
          style={{ flexShrink: 0 }}
        >
          Modifier
        </button>
      )}
    </div>
  );
}
