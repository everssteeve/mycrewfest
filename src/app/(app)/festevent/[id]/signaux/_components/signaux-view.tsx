"use client";

import { AlertTriangle, Clock, MapPin, Plus, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  computeAvgSignalAgeHours,
  computeSignalCredibility,
  computeSignalCredibilityRate,
  countContestedSignals,
  countExpiredSignals,
  countForteSignals,
  countRecentSignals,
  countUniqueSignalAuthors,
  getMostRecentSignalAgoMins,
  getTopSignalType,
} from "@/lib/signal-credibility";
import {
  countCommunautéSignals,
  countCrewSignals,
  filterSignalsByScope,
  type SignalScope,
} from "@/lib/signal-filter";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SignalData {
  id: string;
  authorId: string;
  authorName: string;
  scope: "crew" | "communauté";
  latitude: number;
  longitude: number;
  predefinedPhrase: string | null;
  description: string | null;
  discoveryType: string | null;
  confirmations: number;
  infirmations: number;
  createdAt: string;
  expiresAt: string;
}

interface SignauxViewProps {
  festEventId: string;
  festivalId: string;
  initialSignals: SignalData[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PREDEFINED_PHRASES = [
  "File d'attente longue",
  "Foule dense",
  "Animation spontanée",
  "Fermeture de zone",
  "Problème technique",
  "Super ambiance ici !",
  "Eau gratuite disponible",
  "Ombre et repos par ici",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expiré";
  const totalMins = Math.floor(diff / 60_000);
  if (totalMins < 60) return `${totalMins} min`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`;
}

function formatTimeAgo(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const totalMins = Math.floor(diff / 60_000);
  if (totalMins < 1) return "À l'instant";
  if (totalMins < 60) return `il y a ${totalMins} min`;
  const h = Math.floor(totalMins / 60);
  return `il y a ${h}h`;
}

function getPhraseColor(phrase: string): string {
  if (phrase.includes("File") || phrase.includes("Foule")) return "var(--accent-orange)";
  if (phrase.includes("Fermeture") || phrase.includes("Problème")) return "var(--accent-red)";
  if (phrase.includes("Super") || phrase.includes("Eau") || phrase.includes("Ombre"))
    return "var(--primary-neon)";
  return "var(--secondary-cyan)";
}

// ---------------------------------------------------------------------------
// Signal Card
// ---------------------------------------------------------------------------

function SignalCard({
  signal,
  onConfirm,
  onInfirm,
}: {
  signal: SignalData;
  onConfirm: (id: string) => void;
  onInfirm: (id: string) => void;
}) {
  const phrase = signal.predefinedPhrase ?? signal.description ?? "Signal";
  const accentColor = getPhraseColor(phrase);

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: `1px solid var(--border-color)`,
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: "var(--radius-md)",
        padding: "var(--space-md)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-sm)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--space-sm)",
        }}
      >
        <span
          style={{
            color: accentColor,
            fontWeight: "var(--fw-bold)",
            fontSize: "var(--fs-sm)",
            flex: 1,
          }}
        >
          {phrase}
        </span>
      </div>

      {/* Meta */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-xs)",
          fontSize: "var(--fs-xs)",
          color: "var(--text-dim)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <Clock size={11} />
          {formatTimeAgo(signal.createdAt)}
        </span>
        <span>·</span>
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <Clock size={11} style={{ opacity: 0.6 }} />
          Expire dans {formatTimeLeft(signal.expiresAt)}
        </span>
        <span>·</span>
        <span>{signal.authorName}</span>
      </div>

      {/* Confirm/infirm */}
      <div style={{ display: "flex", gap: "var(--space-sm)" }}>
        <button
          type="button"
          onClick={() => onConfirm(signal.id)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            background: "rgba(0,255,102,0.08)",
            border: "1px solid rgba(0,255,102,0.3)",
            borderRadius: "var(--radius-sm)",
            padding: "6px",
            color: "var(--primary-neon)",
            fontSize: "var(--fs-xs)",
            fontWeight: "var(--fw-bold)",
            cursor: "pointer",
          }}
        >
          <ThumbsUp size={13} />
          {signal.confirmations}
        </button>
        <button
          type="button"
          onClick={() => onInfirm(signal.id)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            background: "rgba(255,51,85,0.08)",
            border: "1px solid rgba(255,51,85,0.3)",
            borderRadius: "var(--radius-sm)",
            padding: "6px",
            color: "var(--accent-red)",
            fontSize: "var(--fs-xs)",
            fontWeight: "var(--fw-bold)",
            cursor: "pointer",
          }}
        >
          <ThumbsDown size={13} />
          {signal.infirmations}
        </button>
      </div>

      {/* Credibility bar */}
      {(() => {
        const cred = computeSignalCredibility({
          confirmations: signal.confirmations,
          infirmations: signal.infirmations,
        });
        if (cred.total === 0) return null;
        const barColor =
          cred.label === "forte"
            ? "var(--primary-neon)"
            : cred.label === "faible"
              ? "var(--accent-red)"
              : "var(--warning-orange)";
        return (
          <div
            data-testid={`signal-credibility-${signal.id}`}
            style={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <div
              role="meter"
              aria-valuenow={Math.round(cred.score * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Fiabilité : ${cred.label}`}
              style={{
                height: 3,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.round(cred.score * 100)}%`,
                  backgroundColor: barColor,
                  borderRadius: 2,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: barColor,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                opacity: 0.8,
              }}
            >
              Fiabilité {cred.label}
            </span>
          </div>
        );
      })()}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Signal Form (bottom sheet)
// ---------------------------------------------------------------------------

function CreateSignalSheet({
  festivalId,
  onClose,
  onCreated,
}: {
  festivalId: string;
  onClose: () => void;
  onCreated: (signal: SignalData) => void;
}) {
  const [selectedPhrase, setSelectedPhrase] = useState<string | null>(null);
  const [_useGeoloc, setUseGeoloc] = useState(false);
  const [geoloc, setGeoloc] = useState<{ lat: number; lng: number } | null>(null);
  const [geolocError, setGeolocError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeoloc = useCallback(() => {
    if (!navigator.geolocation) {
      setGeolocError("Géolocalisation non disponible.");
      return;
    }
    setUseGeoloc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoloc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeolocError(null);
      },
      () => {
        setGeolocError("Impossible d'obtenir la position.");
        setUseGeoloc(false);
      },
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedPhrase) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "communauté",
          festivalId,
          latitude: geoloc?.lat ?? 0,
          longitude: geoloc?.lng ?? 0,
          predefinedPhrase: selectedPhrase,
          expiresInMins: 60,
        }),
      });

      if (!res.ok) {
        const errData = (await res.json()) as { error: string };
        setError(errData.error ?? "Erreur lors de la création.");
        return;
      }

      const rawSignal = (await res.json()) as {
        id: string;
        authorId: string;
        scope: "crew" | "communauté";
        latitude: number;
        longitude: number;
        predefinedPhrase?: string | null;
        description?: string | null;
        discoveryType?: string | null;
        confirmations: number;
        infirmations: number;
        createdAt: string;
        expiresAt: string;
      };

      const newSignal: SignalData = {
        id: rawSignal.id,
        authorId: rawSignal.authorId,
        authorName: "Moi",
        scope: rawSignal.scope,
        latitude: rawSignal.latitude,
        longitude: rawSignal.longitude,
        predefinedPhrase: rawSignal.predefinedPhrase ?? null,
        description: rawSignal.description ?? null,
        discoveryType: rawSignal.discoveryType ?? null,
        confirmations: rawSignal.confirmations,
        infirmations: rawSignal.infirmations,
        createdAt: rawSignal.createdAt,
        expiresAt: rawSignal.expiresAt,
      };

      onCreated(newSignal);
      onClose();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  }, [festivalId, selectedPhrase, geoloc, onCreated, onClose]);

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        role="presentation"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
          width: "100%",
          maxWidth: "var(--max-content)",
          maxHeight: "80dvh",
          display: "flex",
          flexDirection: "column",
          padding: "var(--space-lg)",
          gap: "var(--space-md)",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2
            className="t-h3"
            style={{
              color: "var(--accent-orange)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Nouveau signal
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              color: "var(--text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Phrase selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
          <p
            style={{
              fontSize: "var(--fs-xs)",
              color: "var(--text-dim)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: "var(--fw-bold)",
            }}
          >
            Que se passe-t-il ?
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-xs)" }}>
            {PREDEFINED_PHRASES.map((phrase) => {
              const isSelected = selectedPhrase === phrase;
              const color = getPhraseColor(phrase);
              return (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => setSelectedPhrase(isSelected ? null : phrase)}
                  style={{
                    background: isSelected ? `${color}18` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isSelected ? color : "var(--border-color)"}`,
                    borderRadius: "var(--radius-sm)",
                    padding: "var(--space-sm)",
                    color: isSelected ? color : "var(--text-main)",
                    fontSize: "var(--fs-xs)",
                    fontWeight: isSelected ? "var(--fw-bold)" : "var(--fw-normal)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "var(--transition-fast)",
                  }}
                >
                  {phrase}
                </button>
              );
            })}
          </div>
        </div>

        {/* Geoloc toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
            <MapPin size={14} style={{ color: "var(--text-dim)" }} />
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>
              {geoloc
                ? `Position : ${geoloc.lat.toFixed(4)}, ${geoloc.lng.toFixed(4)}`
                : "Ajouter ma position"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleGeoloc}
            style={{
              background: geoloc ? "rgba(0,255,102,0.08)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${geoloc ? "var(--primary-neon)" : "var(--border-color)"}`,
              borderRadius: "var(--radius-full)",
              padding: "3px 10px",
              fontSize: "var(--fs-xs)",
              color: geoloc ? "var(--primary-neon)" : "var(--text-dim)",
              cursor: "pointer",
            }}
          >
            {geoloc ? "OK" : "Activer"}
          </button>
        </div>
        {geolocError && (
          <p style={{ fontSize: "var(--fs-xs)", color: "var(--accent-red)" }}>{geolocError}</p>
        )}

        {error && <p style={{ fontSize: "var(--fs-xs)", color: "var(--accent-red)" }}>{error}</p>}

        <button
          type="button"
          disabled={!selectedPhrase || submitting}
          onClick={() => void handleSubmit()}
          style={{
            background:
              selectedPhrase && !submitting ? "var(--accent-orange)" : "rgba(255,255,255,0.08)",
            color: selectedPhrase && !submitting ? "#000" : "var(--text-dim)",
            border: "none",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-md)",
            fontWeight: "var(--fw-bold)",
            fontSize: "var(--fs-sm)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            cursor: selectedPhrase && !submitting ? "pointer" : "not-allowed",
            transition: "var(--transition-fast)",
          }}
        >
          {submitting ? "Envoi…" : "Signaler"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SignauxView({ festEventId, festivalId, initialSignals }: SignauxViewProps) {
  const [signals, setSignals] = useState<SignalData[]>(initialSignals);
  const [showCreate, setShowCreate] = useState(false);
  const [_isPending, startTransition] = useTransition();
  const [scopeFilter, setScopeFilter] = useState<SignalScope | null>(null);

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/signals?festivalId=${festivalId}`);
        if (res.ok) {
          const data = await res.json();
          setSignals(data as SignalData[]);
        }
      } catch {
        // silently ignore
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [festivalId]);

  const handleConfirm = useCallback((signalId: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/signals/${signalId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "confirm" }),
        });
        if (res.ok) {
          const updated = (await res.json()) as {
            id: string;
            confirmations: number;
            infirmations: number;
          };
          setSignals((prev) =>
            prev.map((s) =>
              s.id === updated.id
                ? { ...s, confirmations: updated.confirmations, infirmations: updated.infirmations }
                : s,
            ),
          );
        }
      } catch {
        // silently ignore
      }
    });
  }, []);

  const handleInfirm = useCallback((signalId: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/signals/${signalId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "infirm" }),
        });
        if (res.ok) {
          const updated = (await res.json()) as {
            id: string;
            confirmations: number;
            infirmations: number;
          };
          setSignals((prev) =>
            prev.map((s) =>
              s.id === updated.id
                ? { ...s, confirmations: updated.confirmations, infirmations: updated.infirmations }
                : s,
            ),
          );
        }
      } catch {
        // silently ignore
      }
    });
  }, []);

  const handleCreated = useCallback((signal: SignalData) => {
    setSignals((prev) => [signal, ...prev]);
  }, []);

  // Filter out expired signals from the display
  const activeSignals = useMemo(
    () => signals.filter((s) => new Date(s.expiresAt) > new Date()),
    [signals],
  );

  const hasBothScopes = useMemo(
    () =>
      activeSignals.some((s) => s.scope === "crew") &&
      activeSignals.some((s) => s.scope === "communauté"),
    [activeSignals],
  );

  const displayedSignals = useMemo(
    () => filterSignalsByScope(activeSignals, scopeFilter),
    [activeSignals, scopeFilter],
  );

  const forteCount = useMemo(
    () =>
      countForteSignals(
        displayedSignals.map((s) => ({
          confirmations: s.confirmations,
          infirmations: s.infirmations,
        })),
      ),
    [displayedSignals],
  );

  const recentCount = useMemo(() => countRecentSignals(displayedSignals, 7), [displayedSignals]);

  const contestedCount = useMemo(
    () =>
      countContestedSignals(
        displayedSignals.map((s) => ({
          confirmations: s.confirmations,
          infirmations: s.infirmations,
        })),
      ),
    [displayedSignals],
  );

  const topSignalType = useMemo(() => getTopSignalType(displayedSignals), [displayedSignals]);

  const credibilityRate = useMemo(
    () =>
      computeSignalCredibilityRate(
        displayedSignals.map((s) => ({
          confirmations: s.confirmations,
          infirmations: s.infirmations,
        })),
      ),
    [displayedSignals],
  );

  const uniqueAuthors = useMemo(
    () => countUniqueSignalAuthors(displayedSignals),
    [displayedSignals],
  );

  const expiredCount = useMemo(() => countExpiredSignals(displayedSignals), [displayedSignals]);

  const crewSignalCount = useMemo(() => countCrewSignals(displayedSignals), [displayedSignals]);

  const communautéSignalCount = useMemo(
    () => countCommunautéSignals(displayedSignals),
    [displayedSignals],
  );

  const avgAgeHours = useMemo(() => computeAvgSignalAgeHours(displayedSignals), [displayedSignals]);

  const freshestAgoMins = useMemo(
    () => getMostRecentSignalAgoMins(displayedSignals),
    [displayedSignals],
  );

  return (
    <div
      style={{
        paddingTop: "var(--space-lg)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
          <AlertTriangle size={20} style={{ color: "var(--accent-orange)" }} />
          <span
            style={{
              color: "var(--text-main)",
              fontWeight: "var(--fw-bold)",
              fontSize: "var(--fs-sm)",
            }}
          >
            {displayedSignals.length}
            {scopeFilter && activeSignals.length !== displayedSignals.length
              ? ` / ${activeSignals.length}`
              : ""}{" "}
            signal{displayedSignals.length !== 1 ? "s" : ""} actif
            {displayedSignals.length !== 1 ? "s" : ""}
          </span>
          {forteCount > 0 && (
            <span
              data-testid="signal-forte-count"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--primary-neon)",
                fontWeight: "var(--fw-bold)",
              }}
            >
              · {forteCount} fiable{forteCount > 1 ? "s" : ""}
            </span>
          )}
          {recentCount > 0 && recentCount < displayedSignals.length && (
            <span
              data-testid="signal-recent-count"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--secondary-cyan)",
              }}
            >
              · {recentCount} récent{recentCount > 1 ? "s" : ""}
            </span>
          )}
          {contestedCount > 0 && (
            <span
              data-testid="signal-contested-count"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--warning-orange)",
              }}
              title="Signaux contestés (au moins 1 infirmation)"
            >
              · {contestedCount} contesté{contestedCount > 1 ? "s" : ""}
            </span>
          )}
          {topSignalType !== null && displayedSignals.length > 1 && (
            <span
              data-testid="signal-top-type"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
              }}
              title={`Type de signal le plus signalé (${topSignalType.count}×)`}
            >
              · {topSignalType.phrase}
            </span>
          )}
          {displayedSignals.length > 1 && credibilityRate > 0 && (
            <span
              data-testid="signal-credibility-rate"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: credibilityRate >= 50 ? "var(--secondary-cyan)" : "var(--text-muted)",
              }}
              title={`${credibilityRate}% des signaux sont jugés fiables`}
            >
              · {credibilityRate}% crédibles
            </span>
          )}
          {uniqueAuthors > 1 && (
            <span
              data-testid="signal-unique-authors"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
              }}
              title={`${uniqueAuthors} contributeurs distincts`}
            >
              · {uniqueAuthors} participants
            </span>
          )}
          {expiredCount > 0 && (
            <span
              data-testid="signal-expired-count"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-dim)",
              }}
              title={`${expiredCount} signal${expiredCount > 1 ? "s" : ""} expiré${expiredCount > 1 ? "s" : ""}`}
            >
              · {expiredCount} expiré{expiredCount > 1 ? "s" : ""}
            </span>
          )}
          {crewSignalCount > 0 && communautéSignalCount > 0 && !scopeFilter && (
            <span
              data-testid="signal-crew-count"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--secondary-cyan)",
              }}
              title={`${crewSignalCount} crew · ${communautéSignalCount} communauté`}
            >
              · {crewSignalCount} crew
            </span>
          )}
          {avgAgeHours !== null && displayedSignals.length > 1 && (
            <span
              data-testid="signal-avg-age"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color:
                  avgAgeHours < 6
                    ? "var(--primary-neon)"
                    : avgAgeHours >= 24
                      ? "var(--text-dim)"
                      : "var(--text-muted)",
              }}
              title={`Âge moyen des signaux : ${avgAgeHours}h`}
            >
              · moy. {avgAgeHours}h
            </span>
          )}
          {freshestAgoMins !== null && displayedSignals.length > 0 && (
            <span
              data-testid="signal-freshest-ago"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color:
                  freshestAgoMins < 30
                    ? "var(--primary-neon)"
                    : freshestAgoMins < 180
                      ? "var(--text-muted)"
                      : "var(--text-dim)",
              }}
              title={`Signal le plus récent : il y a ${freshestAgoMins < 60 ? `${freshestAgoMins}min` : `${Math.floor(freshestAgoMins / 60)}h`}`}
            >
              ·{" "}
              {freshestAgoMins < 60
                ? `${freshestAgoMins}min`
                : `${Math.floor(freshestAgoMins / 60)}h`}{" "}
              ago
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "var(--accent-orange)",
            color: "#000",
            border: "none",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-sm) var(--space-md)",
            fontWeight: "var(--fw-bold)",
            fontSize: "var(--fs-xs)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            cursor: "pointer",
          }}
        >
          <Plus size={15} />
          Signaler
        </button>
      </div>

      {/* Scope filter chips */}
      {hasBothScopes && (
        <div
          role="group"
          style={{ display: "flex", gap: "var(--space-xs)" }}
          data-testid="signal-scope-filter"
          aria-label="Filtrer par portée"
        >
          {([null, "crew", "communauté"] as (SignalScope | null)[]).map((s) => {
            const label = s === null ? "Tous" : s === "crew" ? "Crew" : "Communauté";
            const isActive = scopeFilter === s;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setScopeFilter(s)}
                aria-pressed={isActive}
                style={{
                  padding: "3px 12px",
                  borderRadius: "var(--radius-full)",
                  border: isActive
                    ? "1px solid var(--warning-orange)"
                    : "1px solid var(--border-color)",
                  backgroundColor: isActive ? "rgba(255,153,0,0.1)" : "transparent",
                  color: isActive ? "var(--warning-orange)" : "var(--text-dim)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  cursor: "pointer",
                  transition: "var(--transition-fast)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Signals list */}
      {activeSignals.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "var(--space-xl) var(--space-md)",
            color: "var(--text-dim)",
            fontSize: "var(--fs-sm)",
          }}
        >
          <AlertTriangle size={40} style={{ opacity: 0.3, margin: "0 auto var(--space-sm)" }} />
          <p>Aucun signal actif pour ce festival.</p>
          <p style={{ fontSize: "var(--fs-xs)", marginTop: 4 }}>
            Sois le premier à signaler une situation.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
          {displayedSignals.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              onConfirm={handleConfirm}
              onInfirm={handleInfirm}
            />
          ))}
        </div>
      )}

      {/* Create sheet */}
      {showCreate && (
        <CreateSignalSheet
          festivalId={festivalId}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
