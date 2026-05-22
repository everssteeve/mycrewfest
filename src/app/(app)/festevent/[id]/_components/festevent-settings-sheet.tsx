"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { X, Trash2 } from "lucide-react";
import { getDatesInRange, toYMD } from "@/lib/date-range";

interface FestEventSettingsSheetProps {
  festEventId: string;
  festivalName: string;
  startDate: string;
  endDate: string;
  currentPresenceDates: string[];
  onClose: () => void;
}

export function FestEventSettingsSheet({
  festEventId,
  festivalName,
  startDate,
  endDate,
  currentPresenceDates,
  onClose,
}: FestEventSettingsSheetProps) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const allDates = getDatesInRange(startDate, endDate);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(
    new Set(currentPresenceDates),
  );
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

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

  const handleSaveDates = useCallback(async () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/festevents/${festEventId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            presenceDates: Array.from(selectedDates).sort(),
          }),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          setError(data.error ?? "Erreur lors de la sauvegarde.");
          return;
        }
        router.refresh();
        onClose();
      } catch {
        setError("Erreur réseau. Réessaie.");
      }
    });
  }, [festEventId, selectedDates, router, onClose]);

  const handleDelete = useCallback(async () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/festevents/${festEventId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          setError(data.error ?? "Erreur lors de la suppression.");
          return;
        }
        router.push("/catalogue");
      } catch {
        setError("Erreur réseau. Réessaie.");
      }
    });
  }, [festEventId, router]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
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
      aria-label={`Paramètres — ${festivalName}`}
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 className="t-h3" style={{ color: "var(--text-main)", fontSize: "var(--fs-md)" }}>
            Paramètres
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Presence dates */}
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
                  aria-pressed={selected}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "var(--space-sm)",
                    borderRadius: "var(--radius-md)",
                    border: selected ? "2px solid var(--primary-neon)" : "2px solid var(--border-color)",
                    backgroundColor: selected ? "var(--neon-soft)" : "transparent",
                    color: selected ? "var(--primary-neon)" : "var(--text-muted)",
                    cursor: "pointer",
                    transition: "var(--transition-fast)",
                    boxShadow: selected ? "var(--glow-neon)" : "none",
                    gap: 2,
                  }}
                >
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", fontWeight: "var(--fw-bold)", textTransform: "uppercase" }}>
                    {format(d, "EEE", { locale: fr })}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-lg)", fontWeight: "var(--fw-bold)" }}>
                    {format(d, "d")}
                  </span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-xs)", textTransform: "uppercase" }}>
                    {format(d, "MMM", { locale: fr })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p style={{ color: "var(--danger-red)", fontSize: "var(--fs-sm)", fontFamily: "var(--font-body)" }}>
            {error}
          </p>
        )}

        {/* Save dates CTA */}
        <button
          type="button"
          onClick={handleSaveDates}
          disabled={isPending || selectedDates.size === 0}
          className="btn btn-primary"
          style={{ width: "100%" }}
        >
          {isPending ? "Sauvegarde..." : "Sauvegarder mes jours"}
        </button>

        {/* Danger zone */}
        <div
          style={{
            borderTop: "1px solid var(--border-color)",
            paddingTop: "var(--space-md)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-sm)",
          }}
        >
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--space-sm)",
                padding: "10px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--danger-red)",
                backgroundColor: "transparent",
                color: "var(--danger-red)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-sm)",
                fontWeight: "var(--fw-bold)",
                cursor: "pointer",
                transition: "var(--transition-fast)",
              }}
            >
              <Trash2 size={16} aria-hidden="true" />
              Quitter ce festival
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)", color: "var(--danger-red)", textAlign: "center" }}>
                Supprimer ce FestEvent ? Toutes tes données (planning, journal, checklist) seront perdues.
              </p>
              <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isPending}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "transparent",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--fs-sm)",
                    fontWeight: "var(--fw-bold)",
                    cursor: "pointer",
                  }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "var(--radius-md)",
                    border: "none",
                    backgroundColor: "var(--danger-red)",
                    color: "white",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--fs-sm)",
                    fontWeight: "var(--fw-bold)",
                    cursor: "pointer",
                  }}
                >
                  {isPending ? "Suppression..." : "Confirmer"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
