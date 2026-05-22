"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EventSummary } from "@/types";

// ---------------------------------------------------------------------------
// Image compression helper
// ---------------------------------------------------------------------------

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context unavailable"));
        URL.revokeObjectURL(url);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      URL.revokeObjectURL(url);
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };

    img.src = url;
  });
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function Toast({ visible, message }: { visible: boolean; message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: "calc(var(--nav-height) + 80px)",
        left: "50%",
        transform: visible
          ? "translateX(-50%) translateY(0)"
          : "translateX(-50%) translateY(20px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s ease, transform 0.2s ease",
        backgroundColor: "var(--bg-surface-elevated)",
        border: "1.5px solid var(--primary-neon)",
        borderRadius: "var(--radius-full)",
        padding: "8px 20px",
        fontFamily: "var(--font-body)",
        fontSize: "var(--fs-sm)",
        color: "var(--primary-neon)",
        fontWeight: "var(--fw-bold)",
        whiteSpace: "nowrap",
        zIndex: 60,
        pointerEvents: "none",
        boxShadow: "var(--glow-neon)",
      }}
    >
      {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bottom sheet
// ---------------------------------------------------------------------------

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  festEventId: string;
}

function BottomSheet({ open, onClose, festEventId }: BottomSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EventSummary[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventSummary | null>(null);
  const [freeTextMode, setFreeTextMode] = useState(false);
  const [freeText, setFreeText] = useState("");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [timestamp, setTimestamp] = useState(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset when opened
  useEffect(() => {
    if (open) {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      setTimestamp(
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`,
      );
      setSearchQuery("");
      setSearchResults([]);
      setSelectedEvent(null);
      setFreeTextMode(false);
      setFreeText("");
      setNote("");
      setPhotos([]);
    }
  }, [open]);

  // Debounced event search
  useEffect(() => {
    if (!searchQuery.trim() || freeTextMode) {
      setSearchResults([]);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/festevents/${festEventId}/programme?q=${encodeURIComponent(searchQuery.trim())}&pageSize=6`,
        );
        if (res.ok) {
          const data: EventSummary[] = await res.json();
          setSearchResults(data.slice(0, 6));
        }
      } catch {
        // ignore
      }
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, festEventId, freeTextMode]);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    try {
      const compressed = await Promise.all(files.map(compressImage));
      setPhotos((prev) => [...prev, ...compressed]);
    } catch {
      // ignore compression errors silently
    }
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!selectedEvent && !freeText.trim()) return;
    setSaving(true);
    try {
      const body = {
        eventId: selectedEvent?.id,
        freeText: freeTextMode ? freeText.trim() || undefined : undefined,
        note: note.trim() || undefined,
        photos: photos.length > 0 ? photos : undefined,
        timestamp: new Date(timestamp).toISOString(),
      };
      const res = await fetch(`/api/festevents/${festEventId}/souvenirs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const canSave =
    (freeTextMode ? freeText.trim().length > 0 : selectedEvent !== null) && !saving;

  if (!open) return null;

  return (
    <>
      {/* Scrim */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "var(--bg-overlay)",
          zIndex: 49,
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Enregistrer un souvenir"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          backgroundColor: "var(--bg-surface-elevated)",
          borderTopLeftRadius: "var(--radius-xl)",
          borderTopRightRadius: "var(--radius-xl)",
          borderTop: "1px solid var(--border-strong)",
          boxShadow: "var(--shadow-lg)",
          padding: "var(--space-md)",
          paddingBottom: "calc(var(--space-lg) + env(safe-area-inset-bottom, 0px))",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-md)",
          maxHeight: "85dvh",
          overflowY: "auto",
        }}
      >
        {/* Handle */}
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: "var(--border-strong)",
            margin: "0 auto var(--space-xs)",
          }}
          aria-hidden="true"
        />

        {/* Title */}
        <h2
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-base)",
            fontWeight: "var(--fw-bold)",
            color: "var(--text-main)",
            margin: 0,
          }}
        >
          Enregistrer un souvenir
        </h2>

        {/* Event search OR free text toggle */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
          {!freeTextMode ? (
            <>
              {selectedEvent ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "var(--neon-soft)",
                    border: "1.5px solid var(--primary-neon)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px var(--space-md)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-sm)",
                      color: "var(--primary-neon)",
                      fontWeight: "var(--fw-medium)",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {selectedEvent.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "0 0 0 var(--space-sm)",
                      fontSize: "var(--fs-sm)",
                    }}
                    aria-label="Désélectionner l'événement"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un événement du programme…"
                  style={{
                    width: "100%",
                    backgroundColor: "var(--bg-surface)",
                    border: "1.5px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px var(--space-md)",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--fs-sm)",
                    color: "var(--text-main)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              )}

              {/* Search results */}
              {searchResults.length > 0 && !selectedEvent && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                  }}
                >
                  {searchResults.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => {
                        setSelectedEvent(e);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        padding: "10px var(--space-md)",
                        background: "none",
                        border: "none",
                        borderBottom: "1px solid var(--border-color)",
                        cursor: "pointer",
                        textAlign: "left",
                        color: "var(--text-main)",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--fs-sm)",
                          fontWeight: "var(--fw-medium)",
                        }}
                      >
                        {e.title}
                      </span>
                      {e.venue && (
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "var(--fs-xs)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {e.venue.name}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Toggle to free text */}
              <button
                type="button"
                onClick={() => setFreeTextMode(true)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-muted)",
                  textDecoration: "underline",
                  textAlign: "left",
                }}
              >
                Moment hors-programme
              </button>
            </>
          ) : (
            <>
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="Décris ce moment…"
                rows={2}
                maxLength={160}
                style={{
                  width: "100%",
                  backgroundColor: "var(--bg-surface)",
                  border: "1.5px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px var(--space-md)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-sm)",
                  color: "var(--text-main)",
                  resize: "none",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setFreeTextMode(false);
                  setFreeText("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-muted)",
                  textDecoration: "underline",
                  textAlign: "left",
                }}
              >
                ← Chercher dans le programme
              </button>
            </>
          )}
        </div>

        {/* Note */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optionnelle)…"
          rows={2}
          style={{
            width: "100%",
            backgroundColor: "var(--bg-surface)",
            border: "1.5px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "10px var(--space-md)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            color: "var(--text-main)",
            resize: "none",
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        {/* Timestamp */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label
            htmlFor="ql-timestamp"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              color: "var(--text-muted)",
              fontWeight: "var(--fw-bold)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Heure
          </label>
          <input
            id="ql-timestamp"
            type="datetime-local"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1.5px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "10px var(--space-md)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-sm)",
              color: "var(--text-main)",
              outline: "none",
              colorScheme: "dark",
            }}
          />
        </div>

        {/* Photos */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
          {photos.length > 0 && (
            <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
              {photos.map((src, i) => (
                <div key={src.slice(0, 20)} style={{ position: "relative" }}>
                  {/* biome-ignore lint/performance/noImgElement: base64 thumbnail */}
                  <img
                    src={src}
                    alt={`Photo ${i + 1}`}
                    style={{
                      width: 64,
                      height: 64,
                      objectFit: "cover",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-color)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      backgroundColor: "var(--danger-red)",
                      border: "none",
                      color: "white",
                      fontSize: 10,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-label={`Supprimer photo ${i + 1}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-xs)",
              padding: "8px var(--space-md)",
              borderRadius: "var(--radius-md)",
              border: "1.5px solid var(--border-color)",
              backgroundColor: "transparent",
              color: "var(--text-muted)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
              cursor: "pointer",
              alignSelf: "flex-start",
            }}
          >
            📷 Ajouter une photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhoto}
            style={{ display: "none" }}
            aria-label="Sélectionner des photos"
          />
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          style={{
            width: "100%",
            padding: "14px var(--space-md)",
            borderRadius: "var(--radius-md)",
            border: "none",
            backgroundColor: canSave ? "var(--primary-neon)" : "var(--border-color)",
            color: canSave ? "var(--text-on-neon)" : "var(--text-dim)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-base)",
            fontWeight: "var(--fw-bold)",
            cursor: canSave ? "pointer" : "not-allowed",
            transition: "var(--transition-fast)",
            boxShadow: canSave ? "var(--glow-neon)" : "none",
          }}
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// QuickLogFab
// ---------------------------------------------------------------------------

interface QuickLogFabProps {
  festEventId: string;
}

export function QuickLogFab({ festEventId }: QuickLogFabProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const handleClose = useCallback(() => {
    setSheetOpen(false);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }, []);

  return (
    <>
      {/* FAB */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-label="Enregistrer un souvenir rapide"
        style={{
          position: "fixed",
          bottom: "calc(var(--nav-height) + var(--space-md))",
          right: "var(--space-md)",
          zIndex: 40,
          width: 52,
          height: 52,
          borderRadius: "50%",
          backgroundColor: "var(--primary-neon)",
          border: "none",
          color: "var(--text-on-neon)",
          fontSize: 22,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "var(--glow-neon), var(--shadow-md)",
          transition: "var(--transition-fast)",
        }}
      >
        👁
      </button>

      <BottomSheet
        open={sheetOpen}
        onClose={handleClose}
        festEventId={festEventId}
      />

      <Toast visible={toastVisible} message="Souvenir enregistré ✓" />
    </>
  );
}
