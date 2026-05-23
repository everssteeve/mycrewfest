"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { BookOpen, Share2, Download, Trash2, Clock, Search, X, Copy, Check } from "lucide-react";
import { filterAndGroupByDay, countCrewSharedEntries, countEventLinkedEntries, type JournalEntryTypeFilter } from "@/lib/journal-filter";
import { Users } from "lucide-react";
import { formatJournalEntryText } from "@/lib/journal-entry-text";
import { isEscapeKey } from "@/lib/keyboard-search";
import { computeJournalStats, getMostActiveJournalDay, countDaysWithPhotos, countTotalJournalPhotos } from "@/lib/journal-stats";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SouvenirEvent {
  id: string;
  title: string;
  eventType: string;
  startTime: string | null;
  venue: { id: string; name: string; type: string } | null;
  artist: { id: string; name: string } | null;
}

export interface SouvenirEntry {
  id: string;
  festEventId: string;
  eventId: string | null;
  freeText: string | null;
  note: string | null;
  photos: string[];
  timestamp: string;
  shareWithCrew: boolean;
  createdAt: string;
  updatedAt: string;
  event: SouvenirEvent | null;
}

interface JournalViewProps {
  festEventId: string;
  festivalName: string;
  userName: string;
  initialSouvenirs: SouvenirEntry[];
  shareToken: string | null;
  readOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}h${m}`;
  } catch {
    return "";
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return "";
  }
}

function groupByDay(
  souvenirs: SouvenirEntry[],
): Map<string, SouvenirEntry[]> {
  const map = new Map<string, SouvenirEntry[]>();
  for (const s of souvenirs) {
    try {
      const key = new Date(s.timestamp).toLocaleDateString("sv-SE"); // YYYY-MM-DD
      const existing = map.get(key) ?? [];
      existing.push(s);
      map.set(key, existing);
    } catch {
      // Skip malformed timestamps
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// InlineNoteEditor
// ---------------------------------------------------------------------------

interface InlineNoteEditorProps {
  souvenirId: string;
  festEventId: string;
  initialNote: string | null;
}

function InlineNoteEditor({
  souvenirId,
  festEventId,
  initialNote,
}: InlineNoteEditorProps) {
  const [note, setNote] = useState(initialNote ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleBlur = useCallback(async () => {
    if (note === (initialNote ?? "")) return;
    setSaving(true);
    try {
      await fetch(
        `/api/festevents/${festEventId}/souvenirs/${souvenirId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note }),
        },
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Silently fail — will retry later
    } finally {
      setSaving(false);
    }
  }, [note, initialNote, festEventId, souvenirId]);

  return (
    <div style={{ position: "relative" }}>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={handleBlur}
        placeholder="Ajoute une note..."
        rows={2}
        style={{
          width: "100%",
          background: "var(--bg-surface-elevated)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-sm)",
          color: "var(--text-main)",
          fontFamily: "var(--font-body)",
          fontSize: "var(--fs-sm)",
          lineHeight: "var(--lh-base)",
          padding: "8px 12px",
          resize: "vertical",
          outline: "none",
          boxSizing: "border-box",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--accent-pink)";
        }}
        onBlurCapture={(e) => {
          e.currentTarget.style.borderColor = "var(--border-color)";
        }}
      />
      {saving && (
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 8,
            fontSize: "var(--fs-xs)",
            color: "var(--text-dim)",
            fontFamily: "var(--font-mono)",
          }}
        >
          ...
        </span>
      )}
      {saved && !saving && (
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 8,
            fontSize: "var(--fs-xs)",
            color: "var(--primary-neon)",
            fontFamily: "var(--font-mono)",
          }}
        >
          ✓
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TimestampEditor
// ---------------------------------------------------------------------------

interface TimestampEditorProps {
  souvenirId: string;
  festEventId: string;
  timestamp: string;
  onUpdate: (newTs: string) => void;
}

function TimestampEditor({
  souvenirId,
  festEventId,
  timestamp,
  onUpdate,
}: TimestampEditorProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(
    () => new Date(timestamp).toISOString().slice(0, 16),
  );

  const handleSave = useCallback(async () => {
    setEditing(false);
    try {
      const iso = new Date(value).toISOString();
      await fetch(
        `/api/festevents/${festEventId}/souvenirs/${souvenirId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timestamp: iso }),
        },
      );
      onUpdate(iso);
    } catch {
      // Silently fail
    }
  }, [value, festEventId, souvenirId, onUpdate]);

  if (editing) {
    return (
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{
            background: "var(--bg-surface-elevated)",
            border: "1px solid var(--accent-pink)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-main)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-xs)",
            padding: "2px 6px",
          }}
        />
        <button
          type="button"
          onClick={handleSave}
          style={{
            background: "var(--primary-neon)",
            color: "var(--text-on-neon)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            padding: "2px 8px",
            cursor: "pointer",
            fontSize: "var(--fs-xs)",
            fontFamily: "var(--font-body)",
            fontWeight: "var(--fw-bold)",
          }}
        >
          OK
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "var(--accent-pink)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--fs-sm)",
        fontWeight: "var(--fw-bold)",
        padding: 0,
      }}
      title="Modifier l'heure"
    >
      <Clock size={12} />
      {formatTimestamp(timestamp)}
    </button>
  );
}

// ---------------------------------------------------------------------------
// SouvenirCard
// ---------------------------------------------------------------------------

interface SouvenirCardProps {
  souvenir: SouvenirEntry;
  festEventId: string;
  festivalName: string;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

function SouvenirCard({
  souvenir,
  festEventId,
  festivalName,
  onDelete,
  readOnly = false,
}: SouvenirCardProps) {
  const [ts, setTs] = useState(souvenir.timestamp);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const copyEntry = useCallback(async () => {
    const text = formatJournalEntryText({ ...souvenir, timestamp: ts }, festivalName);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently fail
    }
  }, [souvenir, ts, festivalName]);

  const handleDelete = useCallback(() => {
    if (!confirm("Supprimer ce souvenir ?")) return;
    startTransition(async () => {
      try {
        await fetch(
          `/api/festevents/${festEventId}/souvenirs/${souvenir.id}`,
          { method: "DELETE" },
        );
        onDelete(souvenir.id);
      } catch {
        // Silently fail
      }
    });
  }, [festEventId, souvenir.id, onDelete]);

  return (
    <article
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-md)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-sm)",
        opacity: isPending ? 0.5 : 1,
        transition: "var(--transition-fast)",
      }}
    >
      {/* Header row: time + delete */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {readOnly ? (
          <span
            style={{
              color: "var(--accent-pink)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-sm)",
              fontWeight: "var(--fw-bold)",
            }}
          >
            {formatTimestamp(ts)}
          </span>
        ) : (
          <TimestampEditor
            souvenirId={souvenir.id}
            festEventId={festEventId}
            timestamp={ts}
            onUpdate={setTs}
          />
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <button
            type="button"
            onClick={copyEntry}
            aria-label={copied ? "Souvenir copié" : "Copier ce souvenir"}
            data-testid={`copy-entry-btn-${souvenir.id}`}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: copied ? "var(--primary-neon)" : "var(--text-dim)",
              padding: 4,
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              transition: "var(--transition-fast)",
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>

          {!readOnly && (
            <button
              type="button"
              onClick={handleDelete}
              aria-label="Supprimer ce souvenir"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-dim)",
                padding: 4,
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Crew badge */}
      {souvenir.shareWithCrew && (
        <div
          data-testid={`journal-crew-badge-${souvenir.id}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-xs)",
            color: "var(--secondary-cyan)",
            background: "var(--cyan-soft)",
            border: "1px solid var(--secondary-cyan)",
            borderRadius: "var(--radius-sm)",
            padding: "2px 8px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            alignSelf: "flex-start",
          }}
        >
          <Users size={10} aria-hidden="true" />
          Crew
        </div>
      )}

      {/* Linked event */}
      {souvenir.event && (
        <div
          style={{
            background: "var(--pink-soft)",
            border: "1px solid rgba(255,0,122,0.2)",
            borderRadius: "var(--radius-sm)",
            padding: "6px 10px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-xs)",
              color: "var(--accent-pink)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: 0,
            }}
          >
            {souvenir.event.title}
          </p>
          {(souvenir.event.artist || souvenir.event.venue) && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
                margin: "2px 0 0",
              }}
            >
              {[souvenir.event.artist?.name, souvenir.event.venue?.name]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      )}

      {/* Free text */}
      {souvenir.freeText && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-base)",
            color: "var(--text-main)",
            lineHeight: "var(--lh-base)",
            margin: 0,
          }}
        >
          {souvenir.freeText}
        </p>
      )}

      {/* Inline note editor */}
      {!readOnly && (
        <InlineNoteEditor
          souvenirId={souvenir.id}
          festEventId={festEventId}
          initialNote={souvenir.note}
        />
      )}

      {readOnly && souvenir.note && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            color: "var(--text-muted)",
            fontStyle: "italic",
            margin: 0,
          }}
        >
          {souvenir.note}
        </p>
      )}

      {/* Photos grid */}
      {souvenir.photos.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "var(--space-xs)",
          }}
        >
          {souvenir.photos.slice(0, 9).map((url, idx) => (
            <a
              key={`${url}-${idx}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                aspectRatio: "1",
                overflow: "hidden",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {/* biome-ignore lint/performance/noImgElement: thumbnails don't need next/image */}
              <img
                src={url}
                alt={`Photo ${idx + 1}`}
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// JournalView
// ---------------------------------------------------------------------------

export function JournalView({
  festEventId,
  festivalName,
  userName,
  initialSouvenirs,
  shareToken,
  readOnly = false,
}: JournalViewProps) {
  const [souvenirs, setSouvenirs] = useState(initialSouvenirs);
  const [generatingShare, setGeneratingShare] = useState(false);
  const [currentToken, setCurrentToken] = useState(shareToken);
  const [searchQuery, setSearchQuery] = useState("");
  const [crewOnly, setCrewOnly] = useState(false);
  const [entryTypeFilter, setEntryTypeFilter] = useState<JournalEntryTypeFilter>("tous");

  const handleDelete = useCallback((id: string) => {
    setSouvenirs((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleShare = useCallback(async () => {
    if (currentToken) {
      const url = `${window.location.origin}/p/${currentToken}`;
      try {
        await navigator.clipboard.writeText(url);
        alert(`Lien copié : ${url}`);
      } catch {
        alert(`Lien public : ${url}`);
      }
      return;
    }

    setGeneratingShare(true);
    try {
      const res = await fetch(`/api/festevents/${festEventId}/share`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Erreur serveur");
      const data = (await res.json()) as { shareToken: string };
      setCurrentToken(data.shareToken);
      const url = `${window.location.origin}/p/${data.shareToken}`;
      try {
        await navigator.clipboard.writeText(url);
        alert(`Lien copié : ${url}`);
      } catch {
        alert(`Lien public : ${url}`);
      }
    } catch {
      alert("Impossible de générer le lien de partage.");
    } finally {
      setGeneratingShare(false);
    }
  }, [festEventId, currentToken]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const stats = useMemo(() => computeJournalStats(souvenirs), [souvenirs]);

  const crewSharedCount = useMemo(() => countCrewSharedEntries(souvenirs), [souvenirs]);

  const mostActiveDay = useMemo(() => getMostActiveJournalDay(souvenirs), [souvenirs]);

  const daysWithPhotos = useMemo(() => countDaysWithPhotos(souvenirs), [souvenirs]);
  const totalPhotos = useMemo(() => countTotalJournalPhotos(souvenirs), [souvenirs]);

  const eventLinkedCount = useMemo(() => countEventLinkedEntries(souvenirs), [souvenirs]);

  const hasCrewEntries = useMemo(() => souvenirs.some((s) => s.shareWithCrew), [souvenirs]);
  const hasEventEntries = useMemo(() => souvenirs.some((s) => s.eventId !== null), [souvenirs]);

  const grouped = useMemo(
    () => filterAndGroupByDay(souvenirs, searchQuery, crewOnly, entryTypeFilter),
    [souvenirs, searchQuery, crewOnly, entryTypeFilter],
  );
  const days = Array.from(grouped.keys()).sort();

  if (souvenirs.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-md)",
          paddingTop: "var(--space-3xl)",
          paddingBottom: "var(--space-3xl)",
          textAlign: "center",
        }}
      >
        <BookOpen
          size={48}
          style={{ color: "var(--text-dim)" }}
          strokeWidth={1.2}
        />
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-base)",
            color: "var(--text-muted)",
            maxWidth: 260,
            lineHeight: "var(--lh-base)",
          }}
        >
          Ton festival commence ici. Commence à logger tes moments.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
        paddingTop: "var(--space-md)",
        paddingBottom: "var(--space-2xl)",
      }}
    >
      {/* Stats strip */}
      <div
        data-testid="journal-stats"
        style={{
          display: "flex",
          gap: "var(--space-sm)",
          flexWrap: "wrap",
        }}
      >
        <span
          data-testid="journal-stats-entries"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-xs)",
            color: "var(--accent-pink)",
            background: "var(--pink-soft)",
            border: "1px solid var(--accent-pink)",
            borderRadius: "var(--radius-sm)",
            padding: "2px 8px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {stats.totalEntries} souvenir{stats.totalEntries !== 1 ? "s" : ""}
        </span>
        <span
          data-testid="journal-stats-days"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-xs)",
            color: "var(--secondary-cyan)",
            background: "var(--cyan-soft)",
            border: "1px solid var(--secondary-cyan)",
            borderRadius: "var(--radius-sm)",
            padding: "2px 8px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {stats.totalDays} jour{stats.totalDays !== 1 ? "s" : ""}
        </span>
        {stats.entriesWithPhotos > 0 && (
          <span
            data-testid="journal-stats-photos"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-xs)",
              color: "var(--primary-neon)",
              background: "var(--neon-soft)",
              border: "1px solid var(--primary-neon)",
              borderRadius: "var(--radius-sm)",
              padding: "2px 8px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {stats.entriesWithPhotos} photo{stats.entriesWithPhotos !== 1 ? "s" : ""}
          </span>
        )}
        {totalPhotos > stats.entriesWithPhotos && (
          <span
            data-testid="journal-stats-total-photos"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-xs)",
              color: "var(--text-muted)",
            }}
            title={`${totalPhotos} photos au total`}
          >
            {totalPhotos} imgs
          </span>
        )}
        {daysWithPhotos > 0 && daysWithPhotos < stats.totalDays && (
          <span
            data-testid="journal-stats-photo-days"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              color: "var(--text-muted)",
            }}
            title="Nombre de jours avec au moins une photo"
          >
            📷 {daysWithPhotos}j
          </span>
        )}
        {stats.totalWords > 0 && (
          <span
            data-testid="journal-stats-words"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-xs)",
              color: "var(--warning-orange)",
              background: "rgba(255,153,0,0.1)",
              border: "1px solid rgba(255,153,0,0.4)",
              borderRadius: "var(--radius-sm)",
              padding: "2px 8px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {stats.totalWords} mot{stats.totalWords !== 1 ? "s" : ""}
          </span>
        )}
        {stats.maxStreakDays >= 2 && (
          <span
            data-testid="journal-stats-streak"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-xs)",
              color: "var(--primary-neon)",
              background: "var(--neon-soft)",
              border: "1px solid var(--primary-neon)",
              borderRadius: "var(--radius-sm)",
              padding: "2px 8px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {stats.maxStreakDays} j d&apos;affilée
          </span>
        )}
        {stats.avgWordsPerEntry >= 10 && (
          <span
            data-testid="journal-stats-avg-words"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-xs)",
              color: "var(--secondary-cyan)",
            }}
            title="Moyenne de mots par entrée"
          >
            ~{stats.avgWordsPerEntry} mots/entrée
          </span>
        )}
        {crewSharedCount > 0 && crewSharedCount < souvenirs.length && (
          <span
            data-testid="journal-stats-crew-shared"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              color: "var(--secondary-cyan)",
              background: "var(--cyan-soft)",
              border: "1px solid rgba(0,229,255,0.3)",
              borderRadius: "var(--radius-full)",
              padding: "1px 8px",
            }}
            title="Entrées partagées avec la crew"
          >
            {crewSharedCount} crew
          </span>
        )}
        {mostActiveDay !== null && stats.totalDays > 1 && (
          <span
            data-testid="journal-stats-best-day"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              color: "var(--primary-neon)",
            }}
            title={`Jour le plus actif : ${mostActiveDay.date}`}
          >
            ★ {new Date(mostActiveDay.date).toLocaleDateString("fr-FR", { weekday: "short" })} ({mostActiveDay.count})
          </span>
        )}
        {eventLinkedCount > 0 && eventLinkedCount < souvenirs.length && (
          <span
            data-testid="journal-stats-event-linked"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-xs)",
              color: "var(--accent-pink)",
            }}
            title="Entrées liées à un événement du programme"
          >
            {eventLinkedCount} liés
          </span>
        )}
      </div>

      {/* Search bar */}
      {souvenirs.length > 1 && (
        <div className="journal-no-print" style={{ position: "relative" }}>
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
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Chercher dans le journal…"
            aria-label="Rechercher dans le journal"
            data-testid="journal-search-input"
            onKeyDown={(e) => {
              if (isEscapeKey(e)) setSearchQuery("");
            }}
            style={{
              width: "100%",
              paddingLeft: 32,
              paddingRight: searchQuery ? 32 : 12,
              paddingTop: 8,
              paddingBottom: 8,
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-main)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Effacer la recherche"
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--text-dim)",
                cursor: "pointer",
                padding: 2,
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {/* Crew filter chip */}
      {hasCrewEntries && (
        <div className="journal-no-print" style={{ display: "flex", gap: "var(--space-sm)" }}>
          <button
            type="button"
            onClick={() => setCrewOnly((v) => !v)}
            data-testid="journal-crew-filter"
            aria-pressed={crewOnly}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-xs)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              padding: "4px 12px",
              borderRadius: "var(--radius-md)",
              border: `1.5px solid ${crewOnly ? "var(--secondary-cyan)" : "var(--border-color)"}`,
              background: crewOnly ? "var(--cyan-soft)" : "transparent",
              color: crewOnly ? "var(--secondary-cyan)" : "var(--text-muted)",
              cursor: "pointer",
              transition: "var(--transition-fast)",
            }}
          >
            <Users size={11} aria-hidden="true" />
            Crew seulement
          </button>
        </div>
      )}

      {/* Entry type filter chips */}
      {hasEventEntries && (
        <div
          className="journal-no-print"
          data-testid="journal-type-filter"
          style={{ display: "flex", gap: "var(--space-xs)", flexWrap: "wrap" }}
        >
          {(["tous", "event", "libre"] as JournalEntryTypeFilter[]).map((t) => {
            const label = t === "tous" ? "Tous" : t === "event" ? "Events" : "Mémos";
            const isActive = entryTypeFilter === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setEntryTypeFilter(t)}
                aria-pressed={isActive}
                data-testid={`journal-type-filter-${t}`}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  padding: "3px 10px",
                  borderRadius: "var(--radius-full)",
                  border: isActive ? "1.5px solid var(--accent-pink)" : "1.5px solid var(--border-color)",
                  background: isActive ? "var(--pink-soft)" : "transparent",
                  color: isActive ? "var(--accent-pink)" : "var(--text-muted)",
                  cursor: "pointer",
                  transition: "var(--transition-fast)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontWeight: "var(--fw-bold)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Action bar */}
      <div
        className="journal-no-print"
        style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}
      >
        <button
          type="button"
          onClick={handleShare}
          disabled={generatingShare}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            border: "1.5px solid var(--secondary-cyan)",
            background: "transparent",
            color: "var(--secondary-cyan)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            fontWeight: "var(--fw-bold)",
            cursor: generatingShare ? "wait" : "pointer",
            transition: "var(--transition-fast)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          <Share2 size={14} />
          {currentToken ? "Copier le lien" : "Partager"}
        </button>

        <button
          type="button"
          onClick={handlePrint}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            border: "1.5px solid var(--border-color)",
            background: "transparent",
            color: "var(--text-muted)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            fontWeight: "var(--fw-bold)",
            cursor: "pointer",
            transition: "var(--transition-fast)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          <Download size={14} />
          Exporter PDF
        </button>
      </div>

      {/* Print header */}
      <div
        className="journal-print-only"
        style={{ display: "none" }}
        aria-hidden="true"
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-xl)",
            color: "var(--text-main)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {userName} @ {festivalName}
        </h1>
      </div>

      {/* Timeline grouped by day */}
      {days.map((day) => {
        const entries = grouped.get(day) ?? [];
        return (
          <section key={day}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-sm)",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                margin: "0 0 var(--space-sm)",
              }}
            >
              {formatDate(entries[0]?.timestamp ?? day)}
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-sm)",
              }}
            >
              {entries.map((souvenir) => (
                <SouvenirCard
                  key={souvenir.id}
                  souvenir={souvenir}
                  festEventId={festEventId}
                  festivalName={festivalName}
                  onDelete={handleDelete}
                  readOnly={readOnly}
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* Empty search state */}
      {days.length === 0 && searchQuery.trim() && (
        <div
          className="journal-no-print"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--space-sm)",
            paddingTop: "var(--space-xl)",
            textAlign: "center",
          }}
        >
          <Search size={32} style={{ color: "var(--text-dim)", opacity: 0.4 }} aria-hidden="true" />
          <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
            Aucune entrée ne correspond à "{searchQuery}".
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              backgroundColor: "transparent",
              color: "var(--text-muted)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              cursor: "pointer",
            }}
          >
            Effacer la recherche
          </button>
        </div>
      )}

      {/* Print CSS */}
      <style
        // biome-ignore lint/security/noDangerouslySetInnerHtml: required for @media print CSS
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .journal-no-print { display: none !important; }
              .journal-print-only { display: block !important; }
              body { background: white !important; color: black !important; }
              article { border: 1px solid #ccc !important; break-inside: avoid; }
            }
          `,
        }}
      />
    </div>
  );
}
