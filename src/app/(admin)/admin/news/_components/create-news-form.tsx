"use client";

import { useState, useRef } from "react";
import { createNewsItem } from "../_actions/create-news";
import { VALID_SOURCES, VALID_CATEGORIES, VALID_URGENCY, SOURCE_LABELS, CATEGORY_LABELS } from "@/lib/news-admin";

interface FestivalOption {
  id: string;
  name: string;
}

interface Props {
  festivals: FestivalOption[];
}

const inputStyle = {
  width: "100%",
  background: "var(--bg-darker)",
  border: "1px solid var(--border-color)",
  borderRadius: "var(--radius-sm)",
  padding: "8px var(--space-sm)",
  fontFamily: "var(--font-body)",
  fontSize: "var(--fs-sm)",
  color: "var(--text-main)",
  boxSizing: "border-box" as const,
};

const labelStyle = {
  display: "block",
  fontFamily: "var(--font-body)",
  fontSize: "var(--fs-xs)",
  color: "var(--text-muted)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  marginBottom: 4,
};

export function CreateNewsForm({ festivals }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(false);

    const data = new FormData(e.currentTarget);
    const result = await createNewsItem(data);

    setPending(false);
    if (result.success) {
      setSuccess(true);
      setOpen(false);
      formRef.current?.reset();
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error ?? "Erreur inconnue");
    }
  }

  return (
    <div style={{ marginBottom: "var(--space-xl)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", marginBottom: open ? "var(--space-md)" : 0 }}>
        <button
          data-testid="admin-news-create-toggle"
          type="button"
          onClick={() => { setOpen((v) => !v); setError(null); }}
          style={{
            padding: "8px 18px",
            background: open ? "transparent" : "var(--primary-neon)",
            border: `1px solid var(--primary-neon)`,
            borderRadius: "var(--radius-md)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            fontWeight: "var(--fw-bold)",
            color: open ? "var(--primary-neon)" : "#000",
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            transition: "var(--transition-fast)",
          }}
        >
          {open ? "Annuler" : "+ Nouvelle news"}
        </button>
        {success && (
          <span
            data-testid="admin-news-create-success"
            style={{ color: "var(--primary-neon)", fontSize: "var(--fs-sm)", fontFamily: "var(--font-body)" }}
          >
            ✓ News créée
          </span>
        )}
      </div>

      {open && (
        <form
          ref={formRef}
          data-testid="admin-news-create-form"
          onSubmit={handleSubmit}
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-lg)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-md)",
          }}
        >
          {/* Festival */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="news-festival" style={labelStyle}>Festival *</label>
            <select id="news-festival" name="festivalId" required style={inputStyle}>
              <option value="">— Choisir un festival —</option>
              {festivals.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Source */}
          <div>
            <label htmlFor="news-source" style={labelStyle}>Source *</label>
            <select id="news-source" name="source" required style={inputStyle}>
              <option value="">— Choisir —</option>
              {VALID_SOURCES.map((s) => (
                <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="news-category" style={labelStyle}>Catégorie *</label>
            <select id="news-category" name="category" required style={inputStyle}>
              <option value="">— Choisir —</option>
              {VALID_CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>

          {/* Urgency */}
          <div>
            <label htmlFor="news-urgency" style={labelStyle}>Urgence *</label>
            <select id="news-urgency" name="urgencyLevel" defaultValue="normal" required style={inputStyle}>
              {VALID_URGENCY.map((u) => (
                <option key={u} value={u}>{u === "critique" ? "Critique" : "Normal"}</option>
              ))}
            </select>
          </div>

          {/* Published at */}
          <div>
            <label htmlFor="news-published" style={labelStyle}>Date de publication *</label>
            <input
              id="news-published"
              type="datetime-local"
              name="publishedAt"
              defaultValue={nowLocal}
              required
              style={inputStyle}
            />
          </div>

          {/* Source URL */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="news-source-url" style={labelStyle}>Lien source (optionnel)</label>
            <input
              id="news-source-url"
              type="url"
              name="sourceUrl"
              placeholder="https://..."
              style={inputStyle}
            />
          </div>

          {/* Summary */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="news-summary" style={labelStyle}>Résumé * (10–500 caractères)</label>
            <textarea
              id="news-summary"
              name="summary"
              rows={3}
              required
              minLength={10}
              maxLength={500}
              placeholder="Contenu de la news..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* isPinned */}
          <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 8 }}>
            <input
              id="news-pinned"
              type="checkbox"
              name="isPinned"
              style={{ width: 16, height: 16, accentColor: "var(--warning-orange)" }}
            />
            <label htmlFor="news-pinned" style={{ ...labelStyle, margin: 0 }}>
              Épingler cette news
            </label>
          </div>

          {/* Error */}
          {error && (
            <p
              data-testid="admin-news-create-error"
              style={{
                gridColumn: "1 / -1",
                color: "var(--danger-red)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-sm)",
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <div style={{ gridColumn: "1 / -1" }}>
            <button
              data-testid="admin-news-create-submit"
              type="submit"
              disabled={pending}
              style={{
                padding: "10px 24px",
                background: pending ? "var(--bg-darker)" : "var(--primary-neon)",
                border: "1px solid var(--primary-neon)",
                borderRadius: "var(--radius-md)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-sm)",
                fontWeight: "var(--fw-bold)",
                color: pending ? "var(--primary-neon)" : "#000",
                cursor: pending ? "not-allowed" : "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {pending ? "Création…" : "Créer la news"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
