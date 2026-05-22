"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EventSummary } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SouvenirItem {
  id: string;
  festEventId: string;
  eventId: string | null;
  freeText: string | null;
  note: string | null;
  photos: string[];
  timestamp: string;
  shareWithCrew: boolean;
  event: {
    id: string;
    title: string;
    eventType: string;
    startTime: string | null;
    venue: { id: string; name: string; type: string } | null;
    artist: { id: string; name: string } | null;
  } | null;
}

interface DeambEvents {
  artists: EventSummary[];
}

interface DeambuloireViewProps {
  festEventId: string;
  festivalId: string;
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}h${d.getMinutes().toString().padStart(2, "0")}`;
}

function todayISO(): string {
  const n = new Date();
  return `${n.getFullYear()}-${(n.getMonth() + 1).toString().padStart(2, "0")}-${n.getDate().toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Signal modal
// ---------------------------------------------------------------------------

interface SignalModalProps {
  festivalId: string;
  onClose: () => void;
}

function SignalModal({ festivalId, onClose }: SignalModalProps) {
  const [description, setDescription] = useState("");
  const [shareLocation, setShareLocation] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      let lat = 0;
      let lng = 0;

      if (shareLocation && navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
            { timeout: 5000 },
          );
        });
      }

      await fetch("/api/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "crew",
          festivalId,
          latitude: lat,
          longitude: lng,
          description: description.trim() || undefined,
          discoveryType: "happening",
        }),
      });

      setSent(true);
      setTimeout(onClose, 1200);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "var(--bg-overlay)",
          zIndex: 59,
        }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Signaler au crew"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 60,
          backgroundColor: "var(--bg-surface-elevated)",
          borderTopLeftRadius: "var(--radius-xl)",
          borderTopRightRadius: "var(--radius-xl)",
          borderTop: "1px solid var(--border-strong)",
          padding: "var(--space-md)",
          paddingBottom: "calc(var(--space-lg) + env(safe-area-inset-bottom, 0px))",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-md)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div
          style={{
            width: 40, height: 4, borderRadius: 2,
            backgroundColor: "var(--border-strong)", margin: "0 auto var(--space-xs)",
          }}
          aria-hidden="true"
        />

        <h2 style={{
          fontFamily: "var(--font-body)", fontSize: "var(--fs-base)",
          fontWeight: "var(--fw-bold)", color: "var(--secondary-cyan)", margin: 0,
        }}>
          📡 Signaler au crew
        </h2>

        {sent ? (
          <p style={{ color: "var(--primary-neon)", fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)" }}>
            Signal envoyé !
          </p>
        ) : (
          <>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décris ce que tu vois…"
              rows={3}
              maxLength={200}
              style={{
                width: "100%", backgroundColor: "var(--bg-surface)",
                border: "1.5px solid var(--border-color)", borderRadius: "var(--radius-md)",
                padding: "10px var(--space-md)", fontFamily: "var(--font-body)",
                fontSize: "var(--fs-sm)", color: "var(--text-main)", resize: "none",
                outline: "none", boxSizing: "border-box",
              }}
            />

            <label style={{
              display: "flex", alignItems: "center", gap: "var(--space-sm)",
              cursor: "pointer", fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)", color: "var(--text-muted)",
            }}>
              <input
                type="checkbox"
                checked={shareLocation}
                onChange={(e) => setShareLocation(e.target.checked)}
                style={{ accentColor: "var(--secondary-cyan)" }}
              />
              Partager ma position
            </label>

            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              style={{
                width: "100%", padding: "14px var(--space-md)", borderRadius: "var(--radius-md)",
                border: "none", backgroundColor: "var(--secondary-cyan)", color: "var(--text-on-neon)",
                fontFamily: "var(--font-body)", fontSize: "var(--fs-base)", fontWeight: "var(--fw-bold)",
                cursor: sending ? "not-allowed" : "pointer", transition: "var(--transition-fast)",
                boxShadow: "var(--glow-cyan)",
              }}
            >
              {sending ? "Envoi…" : "Envoyer le signal"}
            </button>
          </>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Logger form (inline)
// ---------------------------------------------------------------------------

interface LogFormProps {
  festEventId: string;
  artists: EventSummary[];
  onLogged: () => void;
}

function LogForm({ festEventId, artists, onLogged }: LogFormProps) {
  const [freeTextMode, setFreeTextMode] = useState(false);
  const [selectedArtistId, setSelectedArtistId] = useState("");
  const [freeText, setFreeText] = useState("");
  const [note, setNote] = useState("");
  const [geo, setGeo] = useState(false);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const defaultTs = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const [timestamp, setTimestamp] = useState(defaultTs);

  const canSave = freeTextMode
    ? freeText.trim().length > 0
    : selectedArtistId.length > 0;

  const handleLog = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        eventId: freeTextMode ? undefined : selectedArtistId || undefined,
        freeText: freeTextMode ? freeText.trim() : undefined,
        note: note.trim() || undefined,
        timestamp: new Date(timestamp).toISOString(),
      };

      if (geo && navigator.geolocation) {
        // fire and forget — we just note intent, position appended in signal
      }

      await fetch(`/api/festevents/${festEventId}/souvenirs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      onLogged();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1.5px solid var(--border-color)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-md)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-sm)",
      }}
    >
      {!freeTextMode ? (
        <>
          <select
            value={selectedArtistId}
            onChange={(e) => setSelectedArtistId(e.target.value)}
            style={{
              width: "100%", backgroundColor: "var(--bg-surface-elevated)",
              border: "1.5px solid var(--border-color)", borderRadius: "var(--radius-md)",
              padding: "10px var(--space-md)", fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)", color: selectedArtistId ? "var(--text-main)" : "var(--text-dim)",
              outline: "none", boxSizing: "border-box", colorScheme: "dark",
            }}
          >
            <option value="">Sélectionner une compagnie…</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.artist?.name ?? a.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setFreeTextMode(true)}
            style={{
              background: "none", border: "none", padding: 0, cursor: "pointer",
              fontFamily: "var(--font-body)", fontSize: "var(--fs-xs)",
              color: "var(--text-muted)", textDecoration: "underline", textAlign: "left",
            }}
          >
            Compagnie inconnue → texte libre
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Nom de la compagnie ou description…"
            maxLength={160}
            style={{
              width: "100%", backgroundColor: "var(--bg-surface-elevated)",
              border: "1.5px solid var(--border-color)", borderRadius: "var(--radius-md)",
              padding: "10px var(--space-md)", fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)", color: "var(--text-main)", outline: "none", boxSizing: "border-box",
            }}
          />
          <button
            type="button"
            onClick={() => { setFreeTextMode(false); setFreeText(""); }}
            style={{
              background: "none", border: "none", padding: 0, cursor: "pointer",
              fontFamily: "var(--font-body)", fontSize: "var(--fs-xs)",
              color: "var(--text-muted)", textDecoration: "underline", textAlign: "left",
            }}
          >
            ← Choisir dans la liste
          </button>
        </>
      )}

      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note courte (optionnelle, 160 max)"
        maxLength={160}
        style={{
          width: "100%", backgroundColor: "var(--bg-surface-elevated)",
          border: "1.5px solid var(--border-color)", borderRadius: "var(--radius-md)",
          padding: "10px var(--space-md)", fontFamily: "var(--font-body)",
          fontSize: "var(--fs-sm)", color: "var(--text-main)", outline: "none", boxSizing: "border-box",
        }}
      />

      <input
        type="datetime-local"
        value={timestamp}
        onChange={(e) => setTimestamp(e.target.value)}
        style={{
          backgroundColor: "var(--bg-surface-elevated)", border: "1.5px solid var(--border-color)",
          borderRadius: "var(--radius-md)", padding: "10px var(--space-md)",
          fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)",
          color: "var(--text-muted)", outline: "none", colorScheme: "dark",
        }}
      />

      <label style={{
        display: "flex", alignItems: "center", gap: "var(--space-sm)",
        cursor: "pointer", fontFamily: "var(--font-body)",
        fontSize: "var(--fs-xs)", color: "var(--text-muted)",
      }}>
        <input
          type="checkbox"
          checked={geo}
          onChange={(e) => setGeo(e.target.checked)}
          style={{ accentColor: "var(--primary-neon)" }}
        />
        Ajouter ma position
      </label>

      <button
        type="button"
        onClick={handleLog}
        disabled={!canSave || saving}
        style={{
          width: "100%", padding: "12px var(--space-md)", borderRadius: "var(--radius-md)",
          border: "none",
          backgroundColor: canSave && !saving ? "var(--primary-neon)" : "var(--border-color)",
          color: canSave && !saving ? "var(--text-on-neon)" : "var(--text-dim)",
          fontFamily: "var(--font-body)", fontSize: "var(--fs-base)", fontWeight: "var(--fw-bold)",
          cursor: canSave && !saving ? "pointer" : "not-allowed", transition: "var(--transition-fast)",
          boxShadow: canSave && !saving ? "var(--glow-neon)" : "none",
        }}
      >
        {saving ? "Logging…" : "Logger"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DeambuloireView — main component
// ---------------------------------------------------------------------------

export function DeambuloireView({ festEventId, festivalId }: DeambuloireViewProps) {
  const [souvenirs, setSouvenirs] = useState<SouvenirItem[]>([]);
  const [artists, setArtists] = useState<EventSummary[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [signalOpen, setSignalOpen] = useState(false);
  const [loadingLog, setLoadingLog] = useState(false);
  const today = todayISO();
  const hasFetched = useRef(false);

  const fetchSouvenirs = useCallback(async () => {
    try {
      const res = await fetch(`/api/festevents/${festEventId}/souvenirs`);
      if (res.ok) {
        const data: SouvenirItem[] = await res.json();
        setSouvenirs(data);
      }
    } catch {
      // ignore
    }
  }, [festEventId]);

  const fetchArtists = useCallback(async () => {
    try {
      const res = await fetch(`/api/festevents/${festEventId}/programme`);
      if (res.ok) {
        const data: EventSummary[] = await res.json();
        setArtists(data);
      }
    } catch {
      // ignore
    }
  }, [festEventId]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setLoadingLog(true);
    Promise.all([fetchSouvenirs(), fetchArtists()]).finally(() => setLoadingLog(false));
  }, [fetchSouvenirs, fetchArtists]);

  const todaySouvenirs = souvenirs.filter((s) => {
    const d = new Date(s.timestamp).toLocaleDateString("sv-SE");
    return d === today;
  });

  const handleLogged = () => {
    setLogOpen(false);
    void fetchSouvenirs();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-lg)",
        paddingTop: "var(--space-md)",
        paddingBottom: "calc(var(--space-2xl) + var(--space-xl))",
      }}
    >
      {/* Header */}
      <div>
        <h1
          className="t-h2"
          style={{ color: "var(--text-main)", margin: 0, marginBottom: "var(--space-xs)" }}
        >
          Déambulation
        </h1>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)",
          color: "var(--text-muted)", margin: 0,
        }}>
          Parcours libre — enregistre ce que tu découvres.
        </p>
      </div>

      {/* Logger section */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: "var(--space-sm)" }}>
          <h2 style={{
            fontFamily: "var(--font-body)", fontSize: "var(--fs-base)",
            fontWeight: "var(--fw-bold)", color: "var(--text-main)", margin: 0, flex: 1,
          }}>
            Logger ce que je vois
          </h2>
          <button
            type="button"
            onClick={() => setSignalOpen(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "var(--space-xs)",
              padding: "6px 12px", borderRadius: "var(--radius-full)",
              border: "1.5px solid var(--secondary-cyan)", backgroundColor: "var(--cyan-soft)",
              color: "var(--secondary-cyan)", fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)", fontWeight: "var(--fw-bold)",
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            📡 Signaler au crew
          </button>
        </div>

        {/* FAB-style button to toggle inline form */}
        {!logOpen ? (
          <button
            type="button"
            onClick={() => setLogOpen(true)}
            style={{
              width: "100%", padding: "14px var(--space-md)", borderRadius: "var(--radius-md)",
              border: "none", backgroundColor: "var(--primary-neon)", color: "var(--text-on-neon)",
              fontFamily: "var(--font-body)", fontSize: "var(--fs-base)", fontWeight: "var(--fw-bold)",
              cursor: "pointer", transition: "var(--transition-fast)",
              boxShadow: "var(--glow-neon)", display: "flex", alignItems: "center",
              justifyContent: "center", gap: "var(--space-sm)",
            }}
          >
            👁 J&apos;ai vu ça
          </button>
        ) : (
          <div>
            <LogForm
              festEventId={festEventId}
              artists={artists}
              onLogged={handleLogged}
            />
            <button
              type="button"
              onClick={() => setLogOpen(false)}
              style={{
                marginTop: "var(--space-xs)", background: "none", border: "none",
                cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "var(--fs-xs)",
                color: "var(--text-muted)", padding: 0,
              }}
            >
              Annuler
            </button>
          </div>
        )}
      </section>

      {/* Journal du jour */}
      <section>
        <h2 style={{
          fontFamily: "var(--font-body)", fontSize: "var(--fs-base)",
          fontWeight: "var(--fw-bold)", color: "var(--text-main)",
          marginBottom: "var(--space-sm)",
        }}>
          Journal du jour
        </h2>

        {loadingLog ? (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)", color: "var(--text-dim)" }}>
            Chargement…
          </p>
        ) : todaySouvenirs.length === 0 ? (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)", color: "var(--text-dim)" }}>
            Rien encore aujourd&apos;hui. Commence à logger !
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
            {todaySouvenirs.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  gap: "var(--space-sm)",
                  backgroundColor: "var(--bg-surface)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  padding: "var(--space-sm) var(--space-md)",
                  alignItems: "flex-start",
                }}
              >
                {/* Time */}
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)",
                  color: "var(--accent-pink)", flexShrink: 0, paddingTop: 2,
                }}>
                  {formatTime(s.timestamp)}
                </span>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)",
                    fontWeight: "var(--fw-medium)", color: "var(--text-main)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {s.event?.artist?.name ?? s.event?.title ?? s.freeText ?? "Souvenir"}
                  </div>
                  {s.note && (
                    <div style={{
                      fontFamily: "var(--font-body)", fontSize: "var(--fs-xs)",
                      color: "var(--text-muted)", marginTop: 2,
                    }}>
                      {s.note}
                    </div>
                  )}
                </div>

                {/* Photo thumbnail */}
                {s.photos.length > 0 && (
                  // biome-ignore lint/performance/noImgElement: thumbnail
                  <img
                    src={s.photos[0]}
                    alt="Photo souvenir"
                    style={{
                      width: 48, height: 48, objectFit: "cover",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-color)", flexShrink: 0,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Signal modal */}
      {signalOpen && (
        <SignalModal
          festivalId={festivalId}
          onClose={() => setSignalOpen(false)}
        />
      )}
    </div>
  );
}
