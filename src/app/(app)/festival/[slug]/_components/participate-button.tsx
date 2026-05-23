"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Ticket, User, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface ParticipateButtonProps {
  festivalId: string;
  festivalSlug: string;
  festivalName: string;
  startDate: string;
  endDate: string;
}

type Mode = "solo" | "crew";

/** Generate all dates between startDate and endDate inclusive */
function getDatesInRange(startIso: string, endIso: string): Date[] {
  const dates: Date[] = [];
  const current = new Date(startIso);
  const end = new Date(endIso);
  // Normalize to midnight
  current.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function toYMD(d: Date): string {
  return d.toLocaleDateString("sv-SE"); // yyyy-MM-dd
}

export function ParticipateButton({
  festivalId: _festivalId,
  festivalSlug,
  festivalName,
  startDate,
  endDate,
}: ParticipateButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);

  const allDates = getDatesInRange(startDate, endDate);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<Mode>("solo");

  const overlayRef = useRef<HTMLDivElement>(null);

  // Check if a FestEvent already exists for this festival
  useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const res = await fetch("/api/festevents");
        if (!res.ok) return;
        const list = (await res.json()) as Array<{
          id: string;
          festival: { slug: string };
        }>;
        const match = list.find((fe) => fe.festival.slug === festivalSlug);
        if (match) setExistingId(match.id);
      } catch {
        // ignore
      }
    })();
  }, [open, festivalSlug]);

  const toggleDate = useCallback((ymd: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(ymd)) {
        next.delete(ymd);
      } else {
        next.add(ymd);
      }
      return next;
    });
  }, []);

  const handleCreate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/festevents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          festivalSlug,
          mode,
          presenceDates: Array.from(selectedDates).sort(),
        }),
      });

      if (res.status === 409) {
        const data = (await res.json()) as { id?: string };
        if (data.id) {
          router.push(`/festevent/${data.id}`);
          return;
        }
      }

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Erreur lors de la création.");
        return;
      }

      const data = (await res.json()) as { id: string };
      router.push(`/festevent/${data.id}`);
    } catch {
      setError("Erreur réseau. Réessaie.");
    } finally {
      setLoading(false);
    }
  }, [festivalSlug, mode, selectedDates, router]);

  // Close sheet when clicking overlay
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      setOpen(false);
    }
  };

  if (existingId && !open) {
    return (
      <a
        href={`/festevent/${existingId}`}
        className="btn btn-primary btn-lg"
        style={{ maxWidth: 260, textDecoration: "none" }}
      >
        <Ticket size={18} aria-hidden="true" />
        Voir mon FestEvent
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-primary btn-lg flex-1"
        aria-label="Je participe à ce festival"
        style={{ maxWidth: 260 }}
      >
        <Ticket size={18} aria-hidden="true" />
        Je participe
      </button>

      {open && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            backgroundColor: "var(--bg-overlay)",
            display: "flex",
            alignItems: "flex-end",
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`Je participe à ${festivalName}`}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "var(--max-content)",
              margin: "0 auto",
              backgroundColor: "var(--bg-surface-elevated)",
              borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
              padding: "var(--space-lg)",
              paddingBottom: "calc(var(--space-lg) + env(safe-area-inset-bottom, 0px))",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-lg)",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h2 className="t-h3" style={{ color: "var(--text-main)", fontSize: "var(--fs-md)" }}>
                Je participe à {festivalName}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Days selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
              <p className="t-meta" style={{ color: "var(--text-muted)", marginBottom: 4 }}>
                Mes jours de présence
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                  gap: "var(--space-sm)",
                }}
              >
                {allDates.map((d) => {
                  const ymd = toYMD(d);
                  const selected = selectedDates.has(ymd);
                  return (
                    <button
                      key={ymd}
                      type="button"
                      onClick={() => toggleDate(ymd)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: "var(--space-sm)",
                        borderRadius: "var(--radius-md)",
                        border: selected
                          ? "2px solid var(--primary-neon)"
                          : "2px solid var(--border-color)",
                        backgroundColor: selected ? "var(--neon-soft)" : "transparent",
                        color: selected ? "var(--primary-neon)" : "var(--text-muted)",
                        cursor: "pointer",
                        transition: "var(--transition-fast)",
                        boxShadow: selected ? "var(--glow-neon)" : "none",
                        gap: 2,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "var(--fs-xs)",
                          fontWeight: "var(--fw-bold)",
                          textTransform: "uppercase",
                        }}
                      >
                        {format(d, "EEE", { locale: fr })}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "var(--fs-lg)",
                          fontWeight: "var(--fw-bold)",
                        }}
                      >
                        {format(d, "d")}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--fs-xs)",
                          textTransform: "uppercase",
                        }}
                      >
                        {format(d, "MMM", { locale: fr })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mode selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
              <p className="t-meta" style={{ color: "var(--text-muted)", marginBottom: 4 }}>
                Mode
              </p>
              <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                {(["solo", "crew"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "var(--space-sm)",
                      padding: "var(--space-md)",
                      borderRadius: "var(--radius-md)",
                      border:
                        mode === m
                          ? "2px solid var(--primary-neon)"
                          : "2px solid var(--border-color)",
                      backgroundColor: mode === m ? "var(--neon-soft)" : "transparent",
                      color: mode === m ? "var(--primary-neon)" : "var(--text-muted)",
                      cursor: "pointer",
                      transition: "var(--transition-fast)",
                      boxShadow: mode === m ? "var(--glow-neon)" : "none",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-sm)",
                      fontWeight: "var(--fw-bold)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {m === "solo" ? (
                      <User size={16} aria-hidden="true" />
                    ) : (
                      <Users size={16} aria-hidden="true" />
                    )}
                    {m === "solo" ? "Solo" : "Avec un crew"}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <p
                style={{
                  color: "var(--danger-red)",
                  fontSize: "var(--fs-sm)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {error}
              </p>
            )}

            {/* CTA */}
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading || selectedDates.size === 0}
              className="btn btn-primary btn-lg"
              style={{ width: "100%" }}
            >
              {loading ? "Création..." : "Créer mon FestEvent"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
